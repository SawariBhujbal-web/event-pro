-- ============================================================
--  EventPro - Event Management System | Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS eventpro;
USE eventpro;

-- ========================
--  USERS TABLE
-- ========================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(15),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================
--  ORGANIZERS TABLE
-- ========================
CREATE TABLE IF NOT EXISTS organizers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    organization VARCHAR(150),
    phone VARCHAR(15),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================
--  ADMINS TABLE
-- ========================
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================
--  EVENTS TABLE
-- ========================
CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organizer_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category ENUM('Concert', 'Comedy Show', 'Theatre', 'Sports', 'Workshop', 'Other') DEFAULT 'Other',
    venue VARCHAR(200),
    city VARCHAR(100),
    event_date DATE NOT NULL,
    event_time TIME NOT NULL,
    total_seats INT NOT NULL,
    available_seats INT NOT NULL,
    ticket_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    image_url VARCHAR(500),
    status ENUM('active', 'cancelled', 'completed') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organizer_id) REFERENCES organizers(id) ON DELETE CASCADE
);

-- ========================
--  BOOKINGS TABLE
-- ========================
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    event_id INT NOT NULL,
    tickets_booked INT NOT NULL,
    total_price DECIMAL(10,2),
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('confirmed', 'cancelled') DEFAULT 'confirmed',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- ========================
--  WAITING LIST TABLE
-- ========================
CREATE TABLE IF NOT EXISTS waiting_list (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    event_id INT NOT NULL,
    tickets_requested INT NOT NULL DEFAULT 1,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    UNIQUE KEY unique_waitlist (user_id, event_id)
);

-- ========================
--  REVIEWS TABLE
-- ========================
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    event_id INT NOT NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    UNIQUE KEY unique_review (user_id, event_id)
);

-- ============================================================
--  SEED DATA - Sample Admin
-- ============================================================
-- Password: admin123 (bcrypt hashed)
INSERT IGNORE INTO admins (name, email, password) VALUES
('Admin', 'admin@eventpro.com', '$2b$12$hL.Di2fBMKyNpceus7lOyufjW4DarKi9z8465yVWR1ZcODGXBiB56');

-- ============================================================
--  SEED DATA - Sample Organizer (password: organizer123)
-- ============================================================
INSERT IGNORE INTO organizers (name, email, password, organization, phone) VALUES
('Raj Events', 'raj@events.com', '$2b$12$vmTc7YQBXzgb9.vhsNELZ.cF3T8vJBVFPLTLeAJ8VNwPsiZpSHPoK', 'Raj Entertainment Pvt Ltd', '9876543210');

-- ============================================================
--  SEED DATA - Sample Events
-- ============================================================
INSERT IGNORE INTO events (organizer_id, title, description, category, venue, city, event_date, event_time, total_seats, available_seats, ticket_price, image_url) VALUES
(1, 'Arijit Singh Live Concert', 'Experience the magic of Arijit Singh live on stage with his soulful hits spanning two decades. An unforgettable night of music awaits!', 'Concert', 'MMRDA Grounds, BKC', 'Mumbai', DATE_ADD(CURDATE(), INTERVAL 30 DAY), '19:00:00', 5000, 5000, 1500.00, 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800'),
(1, 'Kapil Sharma Comedy Night', 'Join Kapil Sharma for a night of laughter, fun and unlimited entertainment. Bring your family for a comedy show you will never forget!', 'Comedy Show', 'Nehru Centre Auditorium', 'Mumbai', DATE_ADD(CURDATE(), INTERVAL 15 DAY), '20:00:00', 800, 800, 800.00, 'https://images.unsplash.com/photo-1527224538127-2104bb71c51b?w=800'),
(1, 'Hamlet - The Play', 'A modern reimagining of Shakespeare classic Hamlet performed by the National Theatre Group. Witness drama, emotion and powerful performances.', 'Theatre', 'Prithvi Theatre', 'Mumbai', DATE_ADD(CURDATE(), INTERVAL 7 DAY), '18:30:00', 300, 300, 500.00, 'https://images.unsplash.com/photo-1507924538820-ede94a04019d?w=800'),
(1, 'Tech Summit 2025', 'A full-day workshop on AI, Web Development and Cloud Computing. Learn from industry experts and level up your skills.', 'Workshop', 'Pune Convention Centre', 'Pune', DATE_ADD(CURDATE(), INTERVAL 45 DAY), '09:00:00', 200, 200, 1200.00, 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'),
(1, 'IPL Watch Party', 'Watch the IPL finals live on a giant screen with fellow cricket fans. Food, drinks and cricket - the perfect combo!', 'Sports', 'Sports Bar, Koregaon Park', 'Pune', DATE_ADD(CURDATE(), INTERVAL 20 DAY), '19:30:00', 150, 150, 300.00, 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800'),
(1, 'Electronic Music Festival', 'Three days of non-stop electronic music with top DJs from around the world. Camping available on site.', 'Concert', 'Vagator Beach', 'Goa', DATE_ADD(CURDATE(), INTERVAL 60 DAY), '16:00:00', 10000, 10000, 2500.00, 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800');
