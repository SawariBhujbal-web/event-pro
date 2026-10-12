# EventPro - Event Management & Ticket Booking System

A full-stack mini project: React + Flask + MySQL
See setup instructions below.

## Quick Start

### 1. Database
  mysql -u root -p < database/schema.sql

### 2. Backend
  cd backend
  python -m venv venv && source venv/bin/activate
  pip install -r requirements.txt
  cp .env.example .env   # fill in your MySQL password
  python app.py

### 3. Frontend
  cd frontend
  npm install
  npm start

## Default Logins
  Admin:     admin@eventpro.com    / admin123456
  Organizer: raj@events.com        / organizer123
  User:      Register at /register

See the full README.md in the zip for complete documentation.
