<div align="center">

# 🩸 LifeDrop

### Blood Donation & Request Portal

**Connecting blood donors with people who need blood.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20LifeDrop-e63946?style=for-the-badge)](https://lifedrop-u3at.onrender.com/)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/vivekananda2007/LifeDrop)

</div>

---

## 📖 About

LifeDrop is a web-based blood donation and request portal built to make donor discovery and blood-request submission easier. Users can register as blood donors or requesters, find donors using blood-group and location filters, and manage blood-request information through the application.

The project uses a Flask backend, a MySQL database, and a browser-based frontend. It also includes an offline Indian location dataset to support state, district, subdistrict, and town selection.

> **Project note:** LifeDrop is an independently developed project. It is not an emergency-response service or a substitute for contacting a hospital or licensed blood bank. Always verify donor availability and medical eligibility directly with the relevant healthcare professionals.

## 🌐 Live Application

**Try LifeDrop:** https://lifedrop-u3at.onrender.com/

**Source code:** https://github.com/vivekananda2007/LifeDrop

## 🖼️ Application Screenshots

### Homepage
![LifeDrop homepage](screenshots/lifedrop-homepage.png)

### Find Blood
![Find Blood donor search](screenshots/find-blood.png)

### Request Blood
![Request Blood form](screenshots/request-blood.png)

### Become a Donor
![Become a Donor registration form](screenshots/become-a-donor.png)

## ✨ Features

- **Donor registration** — register donor details, blood group, and location.
- **Requester registration** — create an account to submit and manage blood requests.
- **Authentication** — log in using a registered phone number or email and password.
- **Donor discovery** — search for donors using blood group and location information.
- **Blood requests** — submit requests with patient, hospital, blood-group, quantity, date, and urgency details.
- **Request management** — view a requester's own requests and provide administrative request-management functionality.
- **Location lookup** — load Indian states, districts, subdistricts, and towns from local JSON data through Flask API routes.
- **Dashboard statistics** — retrieve donor and blood-request counts.
- **Password hashing** — passwords are stored as password hashes rather than plain text.

## 🧰 Tech Stack

| Layer | Technologies |
|---|---|
| Backend | Python, Flask |
| Database | MySQL |
| Frontend | HTML, CSS, JavaScript |
| Database connectivity | `mysql-connector-python` |
| Authentication utilities | Werkzeug password hashing, Flask sessions |
| Location data | Local JSON datasets |
| Deployment | Render |
| Version control | Git, GitHub |

## 🗂️ Repository Structure

```text
LifeDrop/
├── app.py
├── location_api.py
├── requirements.txt
├── frontend/
├── templates/
├── static/
│   └── data/
│       ├── states.json
│       ├── districts.json
│       ├── subdistricts.json
│       └── urban_local_bodies.json
├── location_data_source/
├── UML/
├── certs/
├── Blood_Donation_Portal_SRS.docx
└── README.md
```

The location JSON files shown above are expected by the location API. Refer to the repository for the complete and current file structure.

## ⚙️ Run Locally

### Prerequisites

- Python 3
- MySQL Server
- Git
- A code editor such as Visual Studio Code

### 1. Clone the repository

```bash
git clone https://github.com/vivekananda2007/LifeDrop.git
cd LifeDrop
```

### 2. Create and activate a virtual environment

**Windows PowerShell:**

```powershell
py -m venv .venv
.venv\Scripts\Activate.ps1
```

If PowerShell blocks activation for the current terminal session, run:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
.venv\Scripts\Activate.ps1
```

### 3. Install dependencies

```bash
py -m pip install -r requirements.txt
```

### 4. Create the MySQL database

Create a database named `lifedrop` in MySQL:

```sql
CREATE DATABASE lifedrop;
```

The application expects the database tables used by its registration, donor, requester, and blood-request features. Use the project's database schema/setup scripts or the accompanying project documentation to create the required tables before running the application.

### 5. Configure environment variables

Create a `.env` file in the project root. Configure the values for your own local MySQL installation:

```env
FLASK_SECRET_KEY=replace_with_a_long_random_secret
FLASK_HTTPS=0

DB_HOST=localhost
DB_PORT=3306
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=lifedrop

# Optional: path to the CA certificate when your MySQL provider requires TLS.
DB_SSL_CA=
```

The deployed application may use different database connection values. Do not copy production credentials into your local `.env` file.

**Important:** Never commit `.env`, database passwords, Flask secret keys, or private certificates to GitHub.

### 6. Start the application

```bash
py app.py
```

Open the local address printed by Flask. By default, this is commonly:

```text
http://127.0.0.1:5000/
```

## 🔌 API Overview

The Flask application exposes routes for authentication, donor discovery, blood requests, dashboard statistics, and location data.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | Serve the application homepage |
| POST | `/api/register-requester` | Register a requester |
| POST | `/api/login` | Log in |
| POST | `/api/logout` | Log out |
| GET | `/api/me` | Check the current session |
| GET | `/api/my-blood-requests` | Retrieve the signed-in requester's requests |
| POST | `/register-donor` | Register a donor |
| GET | `/search-donors` | Search donors |
| POST | `/submit-blood-request` | Submit a blood request |
| GET | `/api/dashboard-stats` | Retrieve dashboard statistics |
| GET | `/api/locations/health` | Check local location-data availability |
| GET | `/api/locations/states` | Retrieve states |
| GET | `/api/locations/districts?state_code=<code>` | Retrieve districts for a state |
| GET | `/api/locations/subdistricts?district_code=<code>` | Retrieve subdistricts for a district |
| GET | `/api/locations/towns?state_code=<code>` | Retrieve towns/local bodies for a state; district filtering is optional |

Some request-management endpoints are restricted by application role. See `app.py` for the current route definitions and authorization requirements.

## 📚 Project Documentation

The repository also contains:

- **Software Requirements Specification:** `Blood_Donation_Portal_SRS.docx`
- **UML diagrams:** `UML/`

These documents describe the system requirements and design.

## 🔐 Security & Responsible Use

- Keep all secrets and database credentials in environment variables.
- Do not upload `.env` files or private database certificates.
- Use HTTPS for deployed environments.
- Do not use this student project as the sole basis for an emergency medical decision.
- Verify donor identity, availability, compatibility, and medical eligibility through appropriate healthcare professionals.

## 👨‍💻 Developer

**Vivekananda Nallatheegala**  
B.Tech — Computer Science and Engineering

- GitHub: [@vivekananda2007](https://github.com/vivekananda2007)
- Project: [LifeDrop](https://github.com/vivekananda2007/LifeDrop)
- Live Demo: [lifedrop-u3at.onrender.com](https://lifedrop-u3at.onrender.com/)

---

<div align="center">

**Built with ❤️ to support blood donation awareness.**

</div>
