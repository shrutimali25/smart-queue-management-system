# Smart Queue Management System (SQMS)

A full-stack queue management system where users generate digital tokens, staff manage the queue from counters, and admins oversee the entire operation with real-time analytics.

## Tech Stack

- **Frontend:** React.js + JavaScript + CSS (Vite)
- **Backend:** Python Flask
- **Database:** MySQL
- **Communication:** REST API

## Features

### User
- Register / login with role selection (user, staff, admin)
- Generate a token for any active service
- View current token with queue position, people ahead, estimated wait time, and now-serving status
- Cancel an active token
- View token history with search and status filtering
- Edit profile and change password

### Staff
- Dashboard showing assigned counter, current token, waiting queue, and KPIs
- Call Next (pulls oldest waiting token)
- Start Service, Complete Service
- Skip a token
- Recall a called token
- View all tokens for the assigned counter with search and filtering

### Admin
- Dashboard with system-wide KPIs (total users, tokens today, waiting, completed, cancelled, avg wait/service time)
- Manage users (edit role, status; delete)
- Manage staff (assign counters, toggle status)
- Manage services (create, edit, delete; set prefix and avg service time)
- Manage counters (assign service and staff)
- View all tokens across every service with search and filtering
- Analytics: daily token chart (7 days), service-wise breakdown, real DB data

## Project Structure

```
project/
├── backend/
│   ├── app.py              # Flask app factory + entry point
│   ├── config.py           # Configuration (MySQL, JWT, Flask)
│   ├── db.py               # MySQL connection helper
│   ├── jwt_utils.py        # JWT encode/decode
│   ├── auth.py             # Auth decorators (token_required, role_required)
│   └── routes/
│       ├── health.py       # GET /api/health
│       ├── auth.py         # POST /api/register, /api/login, /api/logout
│       │                   # GET /api/profile, PUT /api/profile
│       ├── users.py        # GET/PUT/DELETE /api/users
│       ├── services.py     # GET/POST/PUT/DELETE /api/services
│       ├── counters.py     # GET/POST/PUT/DELETE /api/counters
│       ├── tokens.py       # POST /api/tokens, GET /api/tokens/:id
│       │                   # GET /api/my-tokens, PUT /api/tokens/:id/cancel
│       ├── queue.py        # GET /api/queue, POST /api/queue/next
│       │                   # PUT /api/queue/:id/start|complete|skip|recall
│       └── analytics.py    # GET /api/analytics/summary|daily|services
├── database/
│   ├── schema.sql          # MySQL schema (tables, indexes, FKs)
│   └── seed.sql            # Seed data (services, admin/staff/user accounts, counters)
├── src/                    # React frontend
├── requirements.txt        # Python dependencies
├── .env.example             # Environment variable template
├── vite.config.js           # Vite config with /api proxy to Flask
└── package.json
```

## Setup

### 1. MySQL Database

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

### 2. Backend (Flask)

```bash
cd backend
python -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate
pip install -r ../requirements.txt

# Copy .env.example to .env and edit MySQL credentials
cp ../.env.example ../.env
# Edit ../.env with your MySQL password

python app.py
# Flask runs on http://127.0.0.1:5000
```

### 3. Frontend (React + Vite)

```bash
npm install
npm run dev
# Vite runs on http://localhost:5173
# /api requests are proxied to Flask at http://127.0.0.1:5000
```

## Demo Accounts

| Role  | Email             | Password   |
|-------|-------------------|------------|
| Admin | admin@sqms.local  | admin123   |
| Staff | staff@sqms.local  | staff123   |
| User  | user@sqms.local   | user123    |

> Note: Seed data password hashes are placeholders. After running `seed.sql`, update passwords via the register flow or generate proper bcrypt hashes.

## API Endpoints

| Method | Endpoint                        | Auth         | Description                    |
|--------|---------------------------------|--------------|--------------------------------|
| GET    | /api/health                     | None         | Health check                   |
| POST   | /api/register                   | None         | Register new account           |
| POST   | /api/login                      | None         | Login, returns JWT             |
| POST   | /api/logout                    | Token        | Logout                         |
| GET    | /api/profile                    | Token        | Get current user profile       |
| PUT    | /api/profile                    | Token        | Update name / change password  |
| GET    | /api/users                      | Admin        | List users (filter by role)    |
| GET    | /api/users/:id                  | Admin        | Get single user                |
| PUT    | /api/users/:id                  | Admin        | Update user (role, status)     |
| DELETE | /api/users/:id                  | Admin        | Delete user                    |
| GET    | /api/services                   | None         | List services                  |
| POST   | /api/services                   | Admin        | Create service                 |
| PUT    | /api/services/:id               | Admin        | Update service                 |
| DELETE | /api/services/:id               | Admin        | Delete service                 |
| GET    | /api/counters                   | None         | List counters                  |
| POST   | /api/counters                   | Admin        | Create counter                 |
| PUT    | /api/counters/:id               | Admin        | Update counter                 |
| DELETE | /api/counters/:id               | Admin        | Delete counter                 |
| POST   | /api/tokens                     | Token        | Generate a new token           |
| GET    | /api/tokens/:id                 | Token        | Get a token by ID              |
| GET    | /api/my-tokens                  | Token        | Get current user's tokens      |
| PUT    | /api/tokens/:id/cancel          | Token        | Cancel a token                 |
| GET    | /api/queue                      | Token        | Get queue (filterable)         |
| POST   | /api/queue/next                 | Staff/Admin  | Call next token                |
| PUT    | /api/queue/:id/start            | Staff/Admin  | Start serving a token          |
| PUT    | /api/queue/:id/complete         | Staff/Admin  | Complete a token               |
| PUT    | /api/queue/:id/skip             | Staff/Admin  | Skip a token                   |
| PUT    | /api/queue/:id/recall           | Staff/Admin  | Recall a called token          |
| GET    | /api/analytics/summary          | Admin        | Analytics summary KPIs         |
| GET    | /api/analytics/daily            | Admin        | Daily token counts             |
| GET    | /api/analytics/services         | Admin        | Service-wise token counts      |
