# ============================================================
#  EventPro - Flask Backend
#  Run: python app.py
# ============================================================

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_mysqldb import MySQL
import bcrypt
import jwt
import datetime
import os
from functools import wraps
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# ========================
#  DATABASE CONFIGURATION
# ========================
app.config['MYSQL_HOST']     = os.getenv('MYSQL_HOST', 'localhost')
app.config['MYSQL_USER']     = os.getenv('MYSQL_USER', 'root')
app.config['MYSQL_PASSWORD'] = os.getenv('MYSQL_PASSWORD', '')
app.config['MYSQL_DB']       = os.getenv('MYSQL_DB', 'eventpro')

JWT_SECRET = os.getenv('JWT_SECRET_KEY', 'eventpro-secret-key')

mysql = MySQL(app)


# ============================================================
#  HELPER FUNCTIONS
# ============================================================

def hash_password(password):
    """Hash a password using bcrypt."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def check_password(password, hashed):
    """Check a plain password against a bcrypt hash."""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))


def create_token(user_id, role):
    """Create a JWT token."""
    payload = {
        'user_id': user_id,
        'role': role,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')


def token_required(f):
    """Decorator to protect routes — checks JWT token in headers."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        try:
            if token.startswith('Bearer '):
                token = token[7:]
            data = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            request.user_id = data['user_id']
            request.role    = data['role']
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        return f(*args, **kwargs)
    return decorated


def get_cursor():
    """Get a MySQL cursor that returns dicts."""
    return mysql.connection.cursor()


# ============================================================
#  AUTH ROUTES
# ============================================================

# ---------- USER REGISTER ----------
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    name     = data.get('name', '').strip()
    email    = data.get('email', '').strip().lower()
    password = data.get('password', '')
    phone    = data.get('phone', '').strip()

    if not all([name, email, password]):
        return jsonify({'error': 'Name, email and password are required'}), 400

    cur = get_cursor()
    cur.execute("SELECT id FROM users WHERE email = %s", (email,))
    if cur.fetchone():
        return jsonify({'error': 'Email already registered'}), 409

    hashed = hash_password(password)
    cur.execute(
        "INSERT INTO users (name, email, password, phone) VALUES (%s, %s, %s, %s)",
        (name, email, hashed, phone)
    )
    mysql.connection.commit()
    cur.close()
    return jsonify({'message': 'User registered successfully'}), 201


# ---------- ORGANIZER REGISTER ----------
@app.route('/api/organizer/register', methods=['POST'])
def organizer_register():
    data = request.get_json()
    name         = data.get('name', '').strip()
    email        = data.get('email', '').strip().lower()
    password     = data.get('password', '')
    organization = data.get('organization', '').strip()
    phone        = data.get('phone', '').strip()

    if not all([name, email, password]):
        return jsonify({'error': 'Name, email and password are required'}), 400

    cur = get_cursor()
    cur.execute("SELECT id FROM organizers WHERE email = %s", (email,))
    if cur.fetchone():
        return jsonify({'error': 'Email already registered'}), 409

    hashed = hash_password(password)
    cur.execute(
        "INSERT INTO organizers (name, email, password, organization, phone) VALUES (%s, %s, %s, %s, %s)",
        (name, email, hashed, organization, phone)
    )
    mysql.connection.commit()
    cur.close()
    return jsonify({'message': 'Organizer registered successfully'}), 201


# ---------- UNIVERSAL LOGIN ----------
@app.route('/api/login', methods=['POST'])
def login():
    data     = request.get_json()
    email    = data.get('email', '').strip().lower()
    password = data.get('password', '')
    role     = data.get('role', 'user')  # user | organizer | admin

    if not all([email, password]):
        return jsonify({'error': 'Email and password are required'}), 400

    cur = get_cursor()

    table_map = {
        'user':      ('users',      ['id', 'name', 'email', 'password', 'phone']),
        'organizer': ('organizers', ['id', 'name', 'email', 'password', 'organization', 'phone']),
        'admin':     ('admins',     ['id', 'name', 'email', 'password']),
    }

    if role not in table_map:
        return jsonify({'error': 'Invalid role'}), 400

    table, cols = table_map[role]
    cur.execute(f"SELECT {', '.join(cols)} FROM {table} WHERE email = %s", (email,))
    row = cur.fetchone()
    cur.close()

    if not row:
        return jsonify({'error': 'Invalid email or password'}), 401

    row_dict   = dict(zip(cols, row))
    stored_pwd = row_dict.pop('password')

    if not check_password(password, stored_pwd):
        return jsonify({'error': 'Invalid email or password'}), 401

    token = create_token(row_dict['id'], role)
    return jsonify({'token': token, 'user': row_dict, 'role': role}), 200


# ============================================================
#  EVENT ROUTES
# ============================================================

# ---------- GET ALL EVENTS ----------
@app.route('/api/events', methods=['GET'])
def get_events():
    category = request.args.get('category', '')
    city     = request.args.get('city', '')
    search   = request.args.get('search', '')

    query  = """
        SELECT e.*, o.name AS organizer_name, o.organization
        FROM events e
        JOIN organizers o ON e.organizer_id = o.id
        WHERE e.status = 'active' AND e.event_date >= CURDATE()
    """
    params = []

    if category:
        query += " AND e.category = %s"
        params.append(category)
    if city:
        query += " AND e.city LIKE %s"
        params.append(f'%{city}%')
    if search:
        query += " AND (e.title LIKE %s OR e.description LIKE %s)"
        params.extend([f'%{search}%', f'%{search}%'])

    query += " ORDER BY e.event_date ASC"

    cur = get_cursor()
    cur.execute(query, params)
    rows    = cur.fetchall()
    columns = [d[0] for d in cur.description]
    cur.close()

    events = []
    for row in rows:
        e = dict(zip(columns, row))
        # Convert date/time to string for JSON serialization
        if e.get('event_date'):
            e['event_date'] = str(e['event_date'])
        if e.get('event_time'):
            e['event_time'] = str(e['event_time'])
        if e.get('created_at'):
            e['created_at'] = str(e['created_at'])
        events.append(e)

    return jsonify(events), 200


# ---------- GET SINGLE EVENT ----------
@app.route('/api/events/<int:event_id>', methods=['GET'])
def get_event(event_id):
    cur = get_cursor()
    cur.execute("""
        SELECT e.*, o.name AS organizer_name, o.organization
        FROM events e
        JOIN organizers o ON e.organizer_id = o.id
        WHERE e.id = %s
    """, (event_id,))
    row = cur.fetchone()
    if not row:
        cur.close()
        return jsonify({'error': 'Event not found'}), 404

    columns = [d[0] for d in cur.description]
    event   = dict(zip(columns, row))
    if event.get('event_date'):
        event['event_date'] = str(event['event_date'])
    if event.get('event_time'):
        event['event_time'] = str(event['event_time'])
    if event.get('created_at'):
        event['created_at'] = str(event['created_at'])
    cur.close()
    return jsonify(event), 200


# ---------- CREATE EVENT (Organizer only) ----------
@app.route('/api/create-event', methods=['POST'])
@token_required
def create_event():
    if request.role != 'organizer':
        return jsonify({'error': 'Only organizers can create events'}), 403

    data           = request.get_json()
    title          = data.get('title', '').strip()
    description    = data.get('description', '').strip()
    category       = data.get('category', 'Other')
    venue          = data.get('venue', '').strip()
    city           = data.get('city', '').strip()
    event_date     = data.get('event_date')
    event_time     = data.get('event_time')
    total_seats    = data.get('total_seats', 100)
    ticket_price   = data.get('ticket_price', 0)
    image_url      = data.get('image_url', '')

    if not all([title, event_date, event_time, total_seats]):
        return jsonify({'error': 'Title, date, time and seats are required'}), 400

    cur = get_cursor()
    cur.execute("""
        INSERT INTO events
            (organizer_id, title, description, category, venue, city, event_date, event_time, total_seats, available_seats, ticket_price, image_url)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (request.user_id, title, description, category, venue, city,
          event_date, event_time, total_seats, total_seats, ticket_price, image_url))
    mysql.connection.commit()
    event_id = cur.lastrowid
    cur.close()
    return jsonify({'message': 'Event created successfully', 'event_id': event_id}), 201


# ---------- DELETE EVENT (Admin) ----------
@app.route('/api/events/<int:event_id>', methods=['DELETE'])
@token_required
def delete_event(event_id):
    if request.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403

    cur = get_cursor()
    cur.execute("DELETE FROM events WHERE id = %s", (event_id,))
    mysql.connection.commit()
    cur.close()
    return jsonify({'message': 'Event deleted successfully'}), 200


# ============================================================
#  BOOKING ROUTES
# ============================================================

# ---------- BOOK TICKET ----------
@app.route('/api/book-ticket', methods=['POST'])
@token_required
def book_ticket():
    if request.role != 'user':
        return jsonify({'error': 'Only users can book tickets'}), 403

    data           = request.get_json()
    event_id       = data.get('event_id')
    tickets_booked = int(data.get('tickets_booked', 1))

    if not event_id or tickets_booked < 1:
        return jsonify({'error': 'Invalid event or ticket count'}), 400

    cur = get_cursor()

    # Check event availability
    cur.execute("SELECT available_seats, ticket_price, title FROM events WHERE id = %s AND status = 'active'", (event_id,))
    event = cur.fetchone()
    if not event:
        cur.close()
        return jsonify({'error': 'Event not found or inactive'}), 404

    available_seats, ticket_price, event_title = event

    if available_seats < tickets_booked:
        cur.close()
        return jsonify({'error': f'Only {available_seats} seats available'}), 400

    total_price = float(ticket_price) * tickets_booked

    # Create booking
    cur.execute("""
        INSERT INTO bookings (user_id, event_id, tickets_booked, total_price)
        VALUES (%s, %s, %s, %s)
    """, (request.user_id, event_id, tickets_booked, total_price))

    # Decrease available seats
    cur.execute("""
        UPDATE events SET available_seats = available_seats - %s WHERE id = %s
    """, (tickets_booked, event_id))

    mysql.connection.commit()
    booking_id = cur.lastrowid
    cur.close()

    return jsonify({
        'message': f'Successfully booked {tickets_booked} ticket(s) for {event_title}',
        'booking_id': booking_id,
        'total_price': total_price
    }), 201


# ---------- JOIN WAITING LIST ----------
@app.route('/api/join-waitlist', methods=['POST'])
@token_required
def join_waitlist():
    if request.role != 'user':
        return jsonify({'error': 'Only users can join waitlist'}), 403

    data              = request.get_json()
    event_id          = data.get('event_id')
    tickets_requested = int(data.get('tickets_requested', 1))

    if not event_id:
        return jsonify({'error': 'Event ID is required'}), 400

    cur = get_cursor()

    # Check if already in waitlist
    cur.execute("SELECT id FROM waiting_list WHERE user_id = %s AND event_id = %s",
                (request.user_id, event_id))
    if cur.fetchone():
        cur.close()
        return jsonify({'error': 'You are already on the waiting list'}), 409

    cur.execute("""
        INSERT INTO waiting_list (user_id, event_id, tickets_requested)
        VALUES (%s, %s, %s)
    """, (request.user_id, event_id, tickets_requested))
    mysql.connection.commit()
    cur.close()

    return jsonify({'message': 'Added to waiting list successfully'}), 201


# ---------- GET USER BOOKINGS ----------
@app.route('/api/user-bookings', methods=['GET'])
@token_required
def user_bookings():
    if request.role != 'user':
        return jsonify({'error': 'Access denied'}), 403

    cur = get_cursor()
    cur.execute("""
        SELECT b.id, b.tickets_booked, b.total_price, b.booking_date, b.status,
               e.title, e.event_date, e.event_time, e.venue, e.city, e.category, e.image_url
        FROM bookings b
        JOIN events e ON b.event_id = e.id
        WHERE b.user_id = %s
        ORDER BY b.booking_date DESC
    """, (request.user_id,))
    rows    = cur.fetchall()
    columns = [d[0] for d in cur.description]
    cur.close()

    bookings = []
    for row in rows:
        b = dict(zip(columns, row))
        for k in ['booking_date', 'event_date', 'event_time']:
            if b.get(k):
                b[k] = str(b[k])
        bookings.append(b)

    return jsonify(bookings), 200


# ============================================================
#  ORGANIZER ROUTES
# ============================================================

# ---------- GET ORGANIZER'S EVENTS ----------
@app.route('/api/organizer-events', methods=['GET'])
@token_required
def organizer_events():
    if request.role != 'organizer':
        return jsonify({'error': 'Access denied'}), 403

    cur = get_cursor()
    cur.execute("""
        SELECT e.*,
               COUNT(b.id) AS total_bookings,
               COALESCE(SUM(b.tickets_booked), 0) AS tickets_sold,
               COALESCE(SUM(b.total_price), 0) AS revenue
        FROM events e
        LEFT JOIN bookings b ON e.id = b.event_id AND b.status = 'confirmed'
        WHERE e.organizer_id = %s
        GROUP BY e.id
        ORDER BY e.event_date DESC
    """, (request.user_id,))
    rows    = cur.fetchall()
    columns = [d[0] for d in cur.description]
    cur.close()

    events = []
    for row in rows:
        e = dict(zip(columns, row))
        for k in ['event_date', 'event_time', 'created_at']:
            if e.get(k):
                e[k] = str(e[k])
        events.append(e)

    return jsonify(events), 200


# ---------- GET BOOKINGS FOR AN ORGANIZER'S EVENT ----------
@app.route('/api/organizer-bookings/<int:event_id>', methods=['GET'])
@token_required
def organizer_event_bookings(event_id):
    if request.role != 'organizer':
        return jsonify({'error': 'Access denied'}), 403

    cur = get_cursor()
    # Verify event belongs to organizer
    cur.execute("SELECT id FROM events WHERE id = %s AND organizer_id = %s",
                (event_id, request.user_id))
    if not cur.fetchone():
        cur.close()
        return jsonify({'error': 'Event not found'}), 404

    cur.execute("""
        SELECT b.id, b.tickets_booked, b.total_price, b.booking_date, b.status,
               u.name AS user_name, u.email AS user_email
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        WHERE b.event_id = %s
        ORDER BY b.booking_date DESC
    """, (event_id,))
    rows    = cur.fetchall()
    columns = [d[0] for d in cur.description]
    cur.close()

    bookings = []
    for row in rows:
        b = dict(zip(columns, row))
        if b.get('booking_date'):
            b['booking_date'] = str(b['booking_date'])
        bookings.append(b)

    return jsonify(bookings), 200


# ============================================================
#  REVIEW ROUTES
# ============================================================

# ---------- ADD REVIEW ----------
@app.route('/api/add-review', methods=['POST'])
@token_required
def add_review():
    if request.role != 'user':
        return jsonify({'error': 'Only users can add reviews'}), 403

    data     = request.get_json()
    event_id = data.get('event_id')
    rating   = data.get('rating')
    comment  = data.get('comment', '').strip()

    if not event_id or not rating:
        return jsonify({'error': 'Event ID and rating are required'}), 400

    if not (1 <= int(rating) <= 5):
        return jsonify({'error': 'Rating must be between 1 and 5'}), 400

    # Check if user has booked this event
    cur = get_cursor()
    cur.execute("SELECT id FROM bookings WHERE user_id = %s AND event_id = %s AND status = 'confirmed'",
                (request.user_id, event_id))
    if not cur.fetchone():
        cur.close()
        return jsonify({'error': 'You must have booked this event to leave a review'}), 403

    # Check duplicate review
    cur.execute("SELECT id FROM reviews WHERE user_id = %s AND event_id = %s",
                (request.user_id, event_id))
    if cur.fetchone():
        cur.close()
        return jsonify({'error': 'You have already reviewed this event'}), 409

    cur.execute("""
        INSERT INTO reviews (user_id, event_id, rating, comment)
        VALUES (%s, %s, %s, %s)
    """, (request.user_id, event_id, rating, comment))
    mysql.connection.commit()
    cur.close()

    return jsonify({'message': 'Review added successfully'}), 201


# ---------- GET REVIEWS FOR AN EVENT ----------
@app.route('/api/reviews/<int:event_id>', methods=['GET'])
def get_reviews(event_id):
    cur = get_cursor()
    cur.execute("""
        SELECT r.id, r.rating, r.comment, r.created_at,
               u.name AS user_name
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        WHERE r.event_id = %s
        ORDER BY r.created_at DESC
    """, (event_id,))
    rows    = cur.fetchall()
    columns = [d[0] for d in cur.description]
    cur.close()

    reviews = []
    for row in rows:
        r = dict(zip(columns, row))
        if r.get('created_at'):
            r['created_at'] = str(r['created_at'])
        reviews.append(r)

    return jsonify(reviews), 200


# ============================================================
#  ADMIN ROUTES
# ============================================================

# ---------- GET ALL USERS ----------
@app.route('/api/admin/users', methods=['GET'])
@token_required
def admin_get_users():
    if request.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403

    cur = get_cursor()
    cur.execute("SELECT id, name, email, phone, created_at FROM users ORDER BY created_at DESC")
    rows    = cur.fetchall()
    columns = [d[0] for d in cur.description]
    cur.close()

    users = []
    for row in rows:
        u = dict(zip(columns, row))
        if u.get('created_at'):
            u['created_at'] = str(u['created_at'])
        users.append(u)

    return jsonify(users), 200


# ---------- GET ALL ORGANIZERS ----------
@app.route('/api/admin/organizers', methods=['GET'])
@token_required
def admin_get_organizers():
    if request.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403

    cur = get_cursor()
    cur.execute("SELECT id, name, email, organization, phone, created_at FROM organizers ORDER BY created_at DESC")
    rows    = cur.fetchall()
    columns = [d[0] for d in cur.description]
    cur.close()

    organizers = []
    for row in rows:
        o = dict(zip(columns, row))
        if o.get('created_at'):
            o['created_at'] = str(o['created_at'])
        organizers.append(o)

    return jsonify(organizers), 200


# ---------- ADMIN STATS ----------
@app.route('/api/admin/stats', methods=['GET'])
@token_required
def admin_stats():
    if request.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403

    cur = get_cursor()
    cur.execute("SELECT COUNT(*) FROM users")
    total_users = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM organizers")
    total_organizers = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM events WHERE status = 'active'")
    total_events = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM bookings WHERE status = 'confirmed'")
    total_bookings = cur.fetchone()[0]

    cur.execute("SELECT COALESCE(SUM(total_price), 0) FROM bookings WHERE status = 'confirmed'")
    total_revenue = float(cur.fetchone()[0])

    cur.close()

    return jsonify({
        'total_users':      total_users,
        'total_organizers': total_organizers,
        'total_events':     total_events,
        'total_bookings':   total_bookings,
        'total_revenue':    total_revenue
    }), 200


# ---------- GET ALL EVENTS (Admin) ----------
@app.route('/api/admin/events', methods=['GET'])
@token_required
def admin_get_events():
    if request.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403

    cur = get_cursor()
    cur.execute("""
        SELECT e.id, e.title, e.category, e.city, e.event_date, e.total_seats,
               e.available_seats, e.ticket_price, e.status,
               o.name AS organizer_name
        FROM events e
        JOIN organizers o ON e.organizer_id = o.id
        ORDER BY e.created_at DESC
    """)
    rows    = cur.fetchall()
    columns = [d[0] for d in cur.description]
    cur.close()

    events = []
    for row in rows:
        e = dict(zip(columns, row))
        if e.get('event_date'):
            e['event_date'] = str(e['event_date'])
        events.append(e)

    return jsonify(events), 200


# ============================================================
#  RUN SERVER
# ============================================================
@app.route('/')
def index():
    return jsonify({'message': 'EventPro API is running on port 5000'}), 200

# ---------- CANCEL BOOKING ----------
@app.route('/api/cancel-booking/<int:booking_id>', methods=['PUT'])
@token_required
def cancel_booking(booking_id):
    if request.role != 'user':
        return jsonify({'error': 'Only users can cancel bookings'}), 403

    cur = get_cursor()

    cur.execute("SELECT event_id, status, tickets_booked FROM bookings WHERE id = %s AND user_id = %s",
                (booking_id, request.user_id))
    booking = cur.fetchone()

    if not booking:
        cur.close()
        return jsonify({'error': 'Booking not found'}), 404

    event_id, status, tickets_booked = booking

    if status == 'cancelled':
        cur.close()
        return jsonify({'error': 'Booking is already cancelled'}), 400

    data = request.get_json()
    tickets_to_cancel = int(data.get('tickets_to_cancel', tickets_booked))

    if tickets_to_cancel < 1 or tickets_to_cancel > tickets_booked:
        cur.close()
        return jsonify({'error': f'Invalid number. You have {tickets_booked} ticket(s) booked.'}), 400

    # If cancelling all tickets — mark booking as cancelled
    # If cancelling some tickets — just reduce the count
    if tickets_to_cancel == tickets_booked:
        cur.execute("UPDATE bookings SET status = 'cancelled' WHERE id = %s", (booking_id,))
    else:
        cur.execute("""
            UPDATE bookings SET tickets_booked = tickets_booked - %s,
            total_price = total_price - (total_price / tickets_booked * %s)
            WHERE id = %s
        """, (tickets_to_cancel, tickets_to_cancel, booking_id))

    # Restore the cancelled seats back to the event
    cur.execute("UPDATE events SET available_seats = available_seats + %s WHERE id = %s",
                (tickets_to_cancel, event_id))
    cur.execute("""
        SELECT id, user_id, tickets_requested
        FROM waiting_list
        WHERE event_id = %s
        ORDER BY joined_at ASC
        LIMIT 1
    """, (event_id,))
    waitlist_entry = cur.fetchone()

    waitlist_message = ""

    if waitlist_entry:
        waitlist_id, waitlist_user_id, tickets_requested = waitlist_entry

        cur.execute("SELECT available_seats, ticket_price FROM events WHERE id = %s", (event_id,))
        event = cur.fetchone()
        available_seats, ticket_price = event

        if available_seats >= tickets_requested:
            total_price = float(ticket_price) * tickets_requested

            cur.execute("""
                INSERT INTO bookings (user_id, event_id, tickets_booked, total_price, status)
                VALUES (%s, %s, %s, %s, 'confirmed')
            """, (waitlist_user_id, event_id, tickets_requested, total_price))

            cur.execute("""
                UPDATE events SET available_seats = available_seats - %s WHERE id = %s
            """, (tickets_requested, event_id))

            cur.execute("DELETE FROM waiting_list WHERE id = %s", (waitlist_id,))

            waitlist_message = " Seats automatically allocated to the next user on the waiting list."

    mysql.connection.commit()
    cur.close()

    return jsonify({'message': 'Booking cancelled successfully.' + waitlist_message}), 200


# ============================================================
#  RUN SERVER
# ============================================================
if __name__ == '__main__':
    app.run(debug=True, port=5000)
