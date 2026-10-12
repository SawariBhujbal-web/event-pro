#!/usr/bin/env python3
"""
Seed script to create an admin account in the EventPro database.

Usage:
    python database/seed_admin.py

Required environment variables in backend/.env:
    MYSQL_PASSWORD
    EVENTPRO_ADMIN_EMAIL
    EVENTPRO_ADMIN_PASSWORD

Optional environment variables:
    MYSQL_HOST, MYSQL_USER, MYSQL_DB, EVENTPRO_ADMIN_NAME
"""

import os
import sys

import bcrypt
import MySQLdb
from dotenv import load_dotenv


# Locate and load the backend environment file.
PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(PROJECT_DIR, "backend")
ENV_PATH = os.path.join(BACKEND_DIR, ".env")

load_dotenv(ENV_PATH)


# Database configuration.
DB_HOST = os.getenv("MYSQL_HOST", "localhost")
DB_USER = os.getenv("MYSQL_USER", "root")
DB_PASSWORD = os.getenv("MYSQL_PASSWORD")
DB_NAME = os.getenv("MYSQL_DB", "eventpro")


# Admin account configuration.
ADMIN_NAME = os.getenv("EVENTPRO_ADMIN_NAME", "Admin")
ADMIN_EMAIL = os.getenv("EVENTPRO_ADMIN_EMAIL")
ADMIN_PASSWORD = os.getenv("EVENTPRO_ADMIN_PASSWORD")


def validate_configuration():
    """Ensure required configuration is available before connecting."""
    missing = []

    if not DB_PASSWORD:
        missing.append("MYSQL_PASSWORD")

    if not ADMIN_EMAIL:
        missing.append("EVENTPRO_ADMIN_EMAIL")

    if not ADMIN_PASSWORD:
        missing.append("EVENTPRO_ADMIN_PASSWORD")

    if missing:
        print(
            "Configuration error: missing required variables in backend/.env: "
            + ", ".join(missing),
            file=sys.stderr,
        )
        return False

    return True


def hash_password(password):
    """Hash a password using bcrypt."""
    return bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt(),
    ).decode("utf-8")


def main():
    """Create the admin account if it does not already exist."""
    if not validate_configuration():
        return 1

    connection = None
    cursor = None

    try:
        connection = MySQLdb.connect(
            host=DB_HOST,
            user=DB_USER,
            passwd=DB_PASSWORD,
            db=DB_NAME,
        )

        cursor = connection.cursor()

        # Check whether an administrator with this email already exists.
        cursor.execute(
            "SELECT id FROM admins WHERE email = %s",
            (ADMIN_EMAIL,),
        )

        if cursor.fetchone():
            print("An administrator with this email already exists.")
            return 0

        # Hash the password before storing it.
        hashed_password = hash_password(ADMIN_PASSWORD)

        cursor.execute(
            """
            INSERT INTO admins (name, email, password)
            VALUES (%s, %s, %s)
            """,
            (ADMIN_NAME, ADMIN_EMAIL, hashed_password),
        )

        connection.commit()

        print("Admin account created successfully.")
        print(f"Admin email: {ADMIN_EMAIL}")
        print("The password was stored as a bcrypt hash.")

        return 0

    except MySQLdb.Error:
        if connection:
            connection.rollback()

        print(
            "Database operation failed. Check your local MySQL "
            "service, database configuration, and admins table.",
            file=sys.stderr,
        )
        return 1

    except Exception:
        if connection:
            connection.rollback()

        print(
            "An unexpected error occurred while creating the admin account.",
            file=sys.stderr,
        )
        return 1

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()


if __name__ == "__main__":
    sys.exit(main())