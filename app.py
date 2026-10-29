import os
import re
from datetime import date
from functools import wraps

import mysql.connector
from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request, session
from werkzeug.security import check_password_hash, generate_password_hash

from location_api import location_api

# ============================================================
# CONFIGURATION
# ============================================================

load_dotenv()

app = Flask(__name__)

secret_key = os.getenv("FLASK_SECRET_KEY")
if not secret_key:
    raise RuntimeError(
        "FLASK_SECRET_KEY is missing from .env. "
        "Add a long random secret key before starting LifeDrop."
    )

app.config.update(
    SECRET_KEY=secret_key,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=os.getenv("FLASK_HTTPS", "0") == "1",
    PERMANENT_SESSION_LIFETIME=60 * 60 * 8,
)

app.register_blueprint(location_api)

VALID_BLOOD_GROUPS = {
    "A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"
}


# ============================================================
# DATABASE
# ============================================================

def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME", "lifedrop"),
    )


def get_request_data():
    return request.get_json(silent=True) or request.form


def public_user(user):
    return {
        "user_id": user["user_id"],
        "full_name": user["full_name"],
        "email": user.get("email"),
        "phone": user["phone"],
        "role": user["role"],
    }


def valid_phone(phone):
    return bool(re.fullmatch(r"[0-9]{10}", phone or ""))


def login_required(view):
    @wraps(view)
    def wrapper(*args, **kwargs):
        if not session.get("user_id"):
            return jsonify({
                "success": False,
                "message": "Please log in first.",
            }), 401
        return view(*args, **kwargs)
    return wrapper


def role_required(*allowed_roles):
    @wraps(role_required)
    def decorator(view):
        @wraps(view)
        def wrapper(*args, **kwargs):
            if not session.get("user_id"):
                return jsonify({
                    "success": False,
                    "message": "Please log in first.",
                }), 401

            if session.get("role") not in allowed_roles:
                return jsonify({
                    "success": False,
                    "message": "You do not have permission to perform this action.",
                }), 403

            return view(*args, **kwargs)
        return wrapper
    return decorator


# ============================================================
# HOME
# ============================================================

@app.route("/")
def home():
    return render_template("index.html")


# ============================================================
# DATABASE TEST
# ============================================================

@app.route("/test-db")
def test_db():
    conn = cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SHOW TABLES")

        return jsonify({
            "success": True,
            "message": "Database connected successfully!",
            "tables": [row[0] for row in cursor.fetchall()],
        })

    except mysql.connector.Error:
        app.logger.exception("Database test failed")
        return jsonify({
            "success": False,
            "message": "Database connection failed.",
        }), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


# ============================================================
# REQUESTER REGISTRATION
# ============================================================

@app.route("/api/register-requester", methods=["POST"])
def register_requester():
    data = get_request_data()

    full_name = (data.get("full_name") or "").strip()
    email = (data.get("email") or "").strip().lower() or None
    phone = (data.get("phone") or "").strip()
    password = data.get("password") or ""

    if not full_name or not phone or not password:
        return jsonify({
            "success": False,
            "message": "Name, mobile number and password are required.",
        }), 400

    if not valid_phone(phone):
        return jsonify({
            "success": False,
            "message": "Enter a valid 10-digit mobile number.",
        }), 400

    if len(password) < 8:
        return jsonify({
            "success": False,
            "message": "Password must contain at least 8 characters.",
        }), 400

    if email and not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
        return jsonify({
            "success": False,
            "message": "Enter a valid email address or leave it blank.",
        }), 400

    conn = cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            INSERT INTO users
                (full_name, email, phone, password_hash, role)
            VALUES (%s, %s, %s, %s, 'requester')
            """,
            (
                full_name,
                email,
                phone,
                generate_password_hash(password),
            ),
        )

        user_id = cursor.lastrowid
        conn.commit()

        session.clear()
        session["user_id"] = user_id
        session["full_name"] = full_name
        session["role"] = "requester"
        session.permanent = True

        return jsonify({
            "success": True,
            "message": "Requester account created successfully!",
            "user": {
                "user_id": user_id,
                "full_name": full_name,
                "email": email,
                "phone": phone,
                "role": "requester",
            },
        }), 201

    except mysql.connector.Error:
        if conn:
            conn.rollback()

        app.logger.exception("Requester registration failed")

        return jsonify({
            "success": False,
            "message": "Unable to create your account.",
        }), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


# ============================================================
# LOGIN
# Login using mobile number or email.
# Shared mobile numbers are supported.
# ============================================================

@app.route("/api/login", methods=["POST"])
def login():
    data = get_request_data()

    identifier = (
        data.get("identifier")
        or data.get("phone")
        or data.get("email")
        or ""
    ).strip()

    password = data.get("password") or ""

    if not identifier or not password:
        return jsonify({
            "success": False,
            "message": "Enter your mobile number or email and password.",
        }), 400

    conn = cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        if "@" in identifier:
            cursor.execute(
                """
                SELECT user_id, full_name, email, phone,
                       password_hash, role
                FROM users
                WHERE LOWER(email) = LOWER(%s)
                ORDER BY user_id
                """,
                (identifier,),
            )
        else:
            cursor.execute(
                """
                SELECT user_id, full_name, email, phone,
                       password_hash, role
                FROM users
                WHERE phone = %s
                ORDER BY user_id
                """,
                (identifier,),
            )

        candidates = cursor.fetchall()

        matched_user = None

        for user in candidates:
            if check_password_hash(user["password_hash"], password):
                matched_user = user
                break

        if not matched_user:
            return jsonify({
                "success": False,
                "message": "Invalid login details.",
            }), 401

        session.clear()
        session["user_id"] = matched_user["user_id"]
        session["full_name"] = matched_user["full_name"]
        session["role"] = matched_user["role"]
        session.permanent = True

        return jsonify({
            "success": True,
            "message": "Login successful!",
            "user": public_user(matched_user),
        })

    except mysql.connector.Error:
        app.logger.exception("Login failed")
        return jsonify({
            "success": False,
            "message": "Unable to log in right now.",
        }), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


# ============================================================
# LOGOUT
# ============================================================

@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()

    return jsonify({
        "success": True,
        "message": "Logged out successfully!",
    })


# ============================================================
# CURRENT USER
# ============================================================

@app.route("/api/me", methods=["GET"])
def current_user():
    if not session.get("user_id"):
        return jsonify({
            "success": True,
            "authenticated": False,
            "user": None,
        })

    conn = cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT user_id, full_name, email, phone, role
            FROM users
            WHERE user_id = %s
            """,
            (session["user_id"],),
        )

        user = cursor.fetchone()

        if not user:
            session.clear()
            return jsonify({
                "success": True,
                "authenticated": False,
                "user": None,
            })

        session["role"] = user["role"]

        return jsonify({
            "success": True,
            "authenticated": True,
            "user": public_user(user),
        })

    except mysql.connector.Error:
        app.logger.exception("Current-user lookup failed")
        return jsonify({
            "success": False,
            "message": "Unable to check login status.",
        }), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


# ============================================================
# REQUESTER'S OWN BLOOD REQUESTS
# ============================================================

@app.route("/api/my-blood-requests", methods=["GET"])
@role_required("requester")
def my_blood_requests():
    conn = cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT request_id, patient_name, blood_group, city, area,
                   state_name, district_name, subdistrict_name,
                   units_required, hospital_name, required_date,
                   urgency, reason, status, created_at
            FROM blood_requests
            WHERE user_id = %s
            ORDER BY created_at DESC
            """,
            (session["user_id"],),
        )

        rows = cursor.fetchall()

        for row in rows:
            for key, value in row.items():
                if hasattr(value, "isoformat"):
                    row[key] = value.isoformat()

        return jsonify({
            "success": True,
            "count": len(rows),
            "requests": rows,
        })

    except mysql.connector.Error:
        app.logger.exception("Loading personal requests failed")
        return jsonify({
            "success": False,
            "message": "Unable to load your requests.",
        }), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


# ============================================================
# DONOR REGISTRATION
# ============================================================

@app.route("/register-donor", methods=["POST"])
def register_donor():
    data = get_request_data()

    full_name = (data.get("full_name") or "").strip()
    email = (data.get("email") or "").strip().lower() or None
    phone = (data.get("phone") or "").strip()
    password = data.get("password") or ""
    blood_group = (data.get("blood_group") or "").strip().upper()

    state_code = (data.get("state_code") or "").strip() or None
    state_name = (
        data.get("state") or data.get("state_name") or ""
    ).strip() or None

    district_code = (data.get("district_code") or "").strip() or None
    district_name = (
        data.get("district") or data.get("district_name") or ""
    ).strip() or None

    subdistrict_code = (
        data.get("subdistrict_code") or ""
    ).strip() or None

    subdistrict_name = (
        data.get("subdistrict") or data.get("subdistrict_name") or ""
    ).strip() or None

    # Legacy database fields retained for compatibility.
    town_code = (data.get("town_code") or "").strip() or None
    town_name = (
        data.get("town") or data.get("town_name") or ""
    ).strip() or None

    city = (
        data.get("city")
        or town_name
        or subdistrict_name
        or district_name
        or state_name
        or ""
    ).strip()

    area = (data.get("area") or "").strip() or None

    if not all([
        full_name, phone, password, blood_group,
        state_code, state_name, city,
    ]):
        return jsonify({
            "success": False,
            "message": "Complete all required fields. Email is optional.",
        }), 400

    if not valid_phone(phone):
        return jsonify({
            "success": False,
            "message": "Enter a valid 10-digit mobile number.",
        }), 400

    if blood_group not in VALID_BLOOD_GROUPS:
        return jsonify({
            "success": False,
            "message": "Select a valid blood group.",
        }), 400

    if len(password) < 8:
        return jsonify({
            "success": False,
            "message": "Password must contain at least 8 characters.",
        }), 400

    if email and not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
        return jsonify({
            "success": False,
            "message": "Enter a valid email address or leave it blank.",
        }), 400

    conn = cursor = None

    try:
        conn = get_db_connection()
        conn.start_transaction()
        cursor = conn.cursor()

        cursor.execute(
            """
            INSERT INTO users
                (full_name, email, phone, password_hash, role)
            VALUES (%s, %s, %s, %s, 'donor')
            """,
            (
                full_name,
                email,
                phone,
                generate_password_hash(password),
            ),
        )

        user_id = cursor.lastrowid

        cursor.execute(
            """
            INSERT INTO donors (
                user_id, blood_group, city, area, availability,
                state_code, state_name, district_code, district_name,
                subdistrict_code, subdistrict_name, town_code, town_name
            )
            VALUES (
                %s, %s, %s, %s, 1,
                %s, %s, %s, %s, %s, %s, %s, %s
            )
            """,
            (
                user_id, blood_group, city, area,
                state_code, state_name, district_code, district_name,
                subdistrict_code, subdistrict_name, town_code, town_name,
            ),
        )

        donor_id = cursor.lastrowid
        conn.commit()

        session.clear()
        session["user_id"] = user_id
        session["full_name"] = full_name
        session["role"] = "donor"
        session.permanent = True

        return jsonify({
            "success": True,
            "message": "Donor registered successfully!",
            "user_id": user_id,
            "donor_id": donor_id,
            "user": {
                "user_id": user_id,
                "full_name": full_name,
                "email": email,
                "phone": phone,
                "role": "donor",
            },
        }), 201

    except mysql.connector.Error:
        if conn:
            conn.rollback()

        app.logger.exception("Donor registration failed")

        return jsonify({
            "success": False,
            "message": "Database error during donor registration.",
        }), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


# ============================================================
# SEARCH DONORS
# ============================================================

@app.route("/search-donors", methods=["GET"])
def search_donors():
    blood_group = (
        request.args.get("blood_group") or ""
    ).strip().upper()

    state_code = (request.args.get("state_code") or "").strip()
    state_name = (
        request.args.get("state")
        or request.args.get("state_name")
        or ""
    ).strip()

    district_code = (
        request.args.get("district_code") or ""
    ).strip()
    district_name = (
        request.args.get("district")
        or request.args.get("district_name")
        or ""
    ).strip()

    subdistrict_code = (
        request.args.get("subdistrict_code") or ""
    ).strip()
    subdistrict_name = (
        request.args.get("subdistrict")
        or request.args.get("subdistrict_name")
        or ""
    ).strip()

    city = (request.args.get("city") or "").strip()

    if blood_group not in VALID_BLOOD_GROUPS:
        return jsonify({
            "success": False,
            "message": "Select a valid blood group.",
        }), 400

    if not state_code and not state_name and not city:
        return jsonify({
            "success": False,
            "message": "Please select a state.",
        }), 400

    conditions = [
        "UPPER(d.blood_group) = %s",
        "d.availability = 1",
    ]
    params = [blood_group]

    if state_code:
        conditions.append("d.state_code = %s")
        params.append(state_code)
    elif state_name:
        conditions.append("LOWER(d.state_name) = LOWER(%s)")
        params.append(state_name)

    if district_code:
        conditions.append("d.district_code = %s")
        params.append(district_code)
    elif district_name:
        conditions.append("LOWER(d.district_name) = LOWER(%s)")
        params.append(district_name)

    if subdistrict_code:
        conditions.append("d.subdistrict_code = %s")
        params.append(subdistrict_code)
    elif subdistrict_name:
        conditions.append("LOWER(d.subdistrict_name) = LOWER(%s)")
        params.append(subdistrict_name)

    if city:
        conditions.append("LOWER(d.city) = LOWER(%s)")
        params.append(city)

    conn = cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        sql = """
            SELECT
                d.donor_id,
                u.full_name,
                u.phone,
                u.email,
                d.blood_group,
                d.city,
                d.area,
                d.state_name,
                d.district_name,
                d.subdistrict_name,
                d.availability
            FROM donors d
            JOIN users u ON u.user_id = d.user_id
            WHERE
        """ + " AND ".join(conditions) + """
            ORDER BY u.full_name
        """

        cursor.execute(sql, tuple(params))
        donors = cursor.fetchall()

        return jsonify({
            "success": True,
            "count": len(donors),
            "donors": donors,
        })

    except mysql.connector.Error:
        app.logger.exception("Donor search failed")
        return jsonify({
            "success": False,
            "message": "Unable to search donors.",
        }), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


# ============================================================
# SUBMIT BLOOD REQUEST
# Guest submissions remain allowed.
# Logged-in requests are linked to the user's account.
# ============================================================

@app.route("/submit-blood-request", methods=["POST"])
def submit_blood_request():
    data = get_request_data()

    patient_name = (data.get("patient_name") or "").strip() or None
    blood_group = (data.get("blood_group") or "").strip().upper()

    state_code = (data.get("state_code") or "").strip() or None
    state_name = (
        data.get("state") or data.get("state_name") or ""
    ).strip() or None

    district_code = (data.get("district_code") or "").strip() or None
    district_name = (
        data.get("district") or data.get("district_name") or ""
    ).strip() or None

    subdistrict_code = (
        data.get("subdistrict_code") or ""
    ).strip() or None
    subdistrict_name = (
        data.get("subdistrict") or data.get("subdistrict_name") or ""
    ).strip() or None

    town_code = (data.get("town_code") or "").strip() or None
    town_name = (
        data.get("town") or data.get("town_name") or ""
    ).strip() or None

    city = (
        data.get("city")
        or town_name
        or subdistrict_name
        or district_name
        or ""
    ).strip()

    area = (data.get("area") or "").strip() or None
    hospital_name = (data.get("hospital_name") or "").strip() or None
    contact_phone = (data.get("contact_phone") or "").strip()
    required_date = (data.get("required_date") or "").strip() or None
    reason = (data.get("reason") or "").strip() or None
    urgency = (data.get("urgency") or "Normal").strip().title()

    try:
        units_required = int(data.get("units_required", 1))
        if units_required < 1:
            raise ValueError
    except (TypeError, ValueError):
        return jsonify({
            "success": False,
            "message": "Units required must be a positive whole number.",
        }), 400

    if not all([blood_group, city, contact_phone, state_code, state_name]):
        return jsonify({
            "success": False,
            "message": "Blood group, state and contact phone are required.",
        }), 400

    if blood_group not in VALID_BLOOD_GROUPS:
        return jsonify({
            "success": False,
            "message": "Select a valid blood group.",
        }), 400

    if not valid_phone(contact_phone):
        return jsonify({
            "success": False,
            "message": "Enter a valid 10-digit contact number.",
        }), 400

    if urgency not in {"Normal", "Urgent", "Emergency"}:
        return jsonify({
            "success": False,
            "message": "Select a valid urgency level.",
        }), 400

    if required_date:
        try:
            if date.fromisoformat(required_date) < date.today():
                return jsonify({
                    "success": False,
                    "message": "Required date cannot be in the past.",
                }), 400
        except ValueError:
            return jsonify({
                "success": False,
                "message": "Date must use YYYY-MM-DD format.",
            }), 400

    conn = cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            INSERT INTO blood_requests (
                patient_name, user_id, blood_group, city, area,
                state_code, state_name, district_code, district_name,
                subdistrict_code, subdistrict_name, town_code, town_name,
                units_required, hospital_name, contact_phone,
                required_date, reason, urgency, status
            )
            VALUES (
                %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s, 'Pending'
            )
            """,
            (
                patient_name,
                session.get("user_id"),
                blood_group,
                city,
                area,
                state_code,
                state_name,
                district_code,
                district_name,
                subdistrict_code,
                subdistrict_name,
                town_code,
                town_name,
                units_required,
                hospital_name,
                contact_phone,
                required_date,
                reason,
                urgency,
            ),
        )

        request_id = cursor.lastrowid
        conn.commit()

        return jsonify({
            "success": True,
            "message": "Blood request submitted successfully!",
            "request_id": request_id,
        }), 201

    except mysql.connector.Error:
        if conn:
            conn.rollback()

        app.logger.exception("Blood request submission failed")

        return jsonify({
            "success": False,
            "message": "Unable to submit blood request.",
        }), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


# ============================================================
# DASHBOARD STATISTICS
# ============================================================

@app.route("/api/dashboard-stats", methods=["GET"])
def dashboard_stats():
    conn = cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                (SELECT COUNT(*) FROM donors) AS total_donors,
                (SELECT COUNT(*) FROM blood_requests) AS total_requests,
                (SELECT COUNT(*) FROM blood_requests
                 WHERE status = 'Pending') AS pending_requests,
                (SELECT COUNT(*) FROM blood_requests
                 WHERE status = 'Fulfilled') AS fulfilled_requests
        """)

        return jsonify(cursor.fetchone())

    except mysql.connector.Error:
        app.logger.exception("Dashboard statistics failed")
        return jsonify({
            "success": False,
            "message": "Unable to load dashboard statistics.",
        }), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


# ============================================================
# ADMIN: VIEW ALL BLOOD REQUESTS
# ============================================================

@app.route("/api/blood-requests", methods=["GET"])
@role_required("admin")
def get_blood_requests():
    conn = cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                request_id, patient_name, blood_group, city, area,
                state_name, district_name, subdistrict_name,
                units_required, hospital_name, contact_phone,
                required_date, reason, urgency, status, created_at
            FROM blood_requests
            ORDER BY created_at DESC
        """)

        rows = cursor.fetchall()

        for row in rows:
            for key, value in row.items():
                if hasattr(value, "isoformat"):
                    row[key] = value.isoformat()

        return jsonify({
            "success": True,
            "count": len(rows),
            "requests": rows,
        })

    except mysql.connector.Error:
        app.logger.exception("Admin request list failed")
        return jsonify({
            "success": False,
            "message": "Unable to load blood requests.",
        }), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


# ============================================================
# ADMIN: UPDATE REQUEST STATUS
# ============================================================

@app.route("/api/blood-requests/update-status", methods=["POST"])
@role_required("admin")
def update_blood_request_status():
    data = get_request_data()

    request_id = data.get("request_id")
    status = (data.get("status") or "").strip().title()

    if status not in {"Pending", "Fulfilled", "Cancelled"}:
        return jsonify({
            "success": False,
            "message": "Invalid request status.",
        }), 400

    try:
        request_id = int(request_id)
        if request_id < 1:
            raise ValueError
    except (ValueError, TypeError):
        return jsonify({
            "success": False,
            "message": "Invalid request ID.",
        }), 400

    conn = cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            UPDATE blood_requests
            SET status = %s
            WHERE request_id = %s
            """,
            (status, request_id),
        )

        if cursor.rowcount == 0:
            cursor.execute(
                "SELECT request_id FROM blood_requests WHERE request_id = %s",
                (request_id,),
            )

            if cursor.fetchone() is None:
                return jsonify({
                    "success": False,
                    "message": "Blood request not found.",
                }), 404

        conn.commit()

        return jsonify({
            "success": True,
            "message": "Blood request status updated successfully!",
            "request_id": request_id,
            "status": status,
        })

    except mysql.connector.Error:
        if conn:
            conn.rollback()

        app.logger.exception("Request status update failed")

        return jsonify({
            "success": False,
            "message": "Unable to update request status.",
        }), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


# ============================================================
# START APPLICATION
# ============================================================

if __name__ == "__main__":
    app.run(debug=os.getenv("FLASK_DEBUG", "0") == "1")