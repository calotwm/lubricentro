#32 [architecture] sdd/security-hardening/spec
# Delta Specs for Security Hardening

## api-authentication Specification

### Purpose
Authenticate API callers via JWT tokens, password-hashed admin user, and route protection.

### Requirements

| # | Requirement | Strength | Summary |
|---|-------------|----------|---------|
| AUTH-1 | Admin bootstrap from env | MUST | Seed ADMIN_USER/ADMIN_PASSWORD into `users` table at startup if missing. |
| AUTH-2 | Password hashing | MUST | Hash passwords with passlib (argon2 or bcrypt) before storage. Never store plaintext. |
| AUTH-3 | Login endpoint | MUST | POST /api/auth/login accepts {username, password}, returns JWT on valid credentials, 401 otherwise. |
| AUTH-4 | JWT validation | MUST | All /api routes (except /api/auth/login) require a valid Bearer token; missing/invalid/expired → 401. |
| AUTH-5 | /health public | MUST | GET /health returns 200 without authentication. |
| AUTH-6 | users migration | MUST | Alembic migration creates `users` table (id, username, hashed_password, role). SQLite+PG compatible. |
| AUTH-7 | Token expiry | MUST | JWT MUST include an `exp` claim; expired tokens MUST be rejected with 401. |

#### Scenario: Admin bootstrap on fresh DB

- GIVEN an empty database with ADMIN_USER and ADMIN_PASSWORD env vars set
- WHEN the application starts
- THEN a user row with the admin username exists in the users table
- AND the password is hashed (not plaintext)

#### Scenario: Login with valid credentials

- GIVEN a seeded admin user
- WHEN POST /api/auth/login with correct username and password
- THEN response is 200 with a JWT in the body
- AND the token contains the username and role in its payload

#### Scenario: Login with invalid credentials

- GIVEN a seeded admin user
- WHEN POST /api/auth/login with wrong password
- THEN response is 401 with an error message

#### Scenario: Protected route without token

- GIVEN no Authorization header
- WHEN GET /api/products
- THEN response is 401

#### Scenario: Protected route with expired token

- GIVEN a JWT whose `exp` claim is in the past
- WHEN GET /api/products with that token
- THEN response is 401

#### Scenario: /health always accessible

- GIVEN no Authorization header
- WHEN GET /health
- THEN response is 200

---

## api-rate-limiting Specification

### Purpose
Protect API endpoints from abuse via per-IP, per-route rate limiting with 429 responses.

### Requirements

| # | Requirement | Strength | Summary |
|---|-------------|----------|---------|
| RL-1 | Auth endpoint limit | MUST | POST /api/auth/login limited to 5 requests per minute per IP. |
| RL-2 | General API limit | MUST | All other /api routes limited to 60 requests per minute per IP. |
| RL-3 | 429 response | MUST | Exceeded limit → 429 with Retry-After header. |
| RL-4 | /health exempt | MUST | GET /health is NOT rate-limited. |
| RL-5 | Per-route config | SHOULD | Limits configurable via env vars per route group. |

#### Scenario: Burst login attempts blocked

- GIVEN a running server
- WHEN POST /api/auth/login is called 6 times within one minute from the same IP
- THEN the 6th request returns 429
- AND the Retry-After header is present

#### Scenario: Normal API usage within limits

- GIVEN a valid JWT
- WHEN 50 requests are made to /api/products within one minute
- THEN all requests return 200

#### Scenario: /health never rate-limited

- GIVEN heavy traffic
- WHEN GET /health is called rapidly
- THEN all responses return 200 (never 429)

---

## cors-policy Specification

### Purpose
Secure cross-origin requests via an env-configurable origin allowlist without unsafe fallbacks.

### Requirements

| # | Requirement | Strength | Summary |
|---|-------------|----------|---------|
| CORS-1 | Origin allowlist | MUST | ALLOWED_ORIGINS env var (comma-separated URLs) drives allow_origins. |
| CORS-2 | No wildcard+credentials | MUST | `allow_credentials=True` MUST NOT coexist with `allow_origins=["*"]`. |
| CORS-3 | Preflight rejection | MUST | Non-allowlisted origin OPTIONS request → no Access-Control-Allow-Origin header. |
| CORS-4 | Credentials honored | MUST | Allowed origin with credentials → response includes Access-Control-Allow-Credentials: true. |

#### Scenario: Allowed origin passes preflight

- GIVEN ALLOWED_ORIGINS="http://localhost:5173"
- WHEN OPTIONS /api/products with Origin: http://localhost:5173
- THEN response includes Access-Control-Allow-Origin: http://localhost:5173

#### Scenario: Disallowed origin rejected

- GIVEN ALLOWED_ORIGINS="http://localhost:5173"
- WHEN OPTIONS /api/products with Origin: https://evil.com
- THEN response lacks Access-Control-Allow-Origin header

---

## startup-integrity Specification

### Purpose
Ensure the application starts without crashing when static assets are absent (fresh clone).

### Requirements

| # | Requirement | Strength | Summary |
|---|-------------|----------|---------|
| SI-1 | Static mount guard | MUST | Mount frontend/dist/assets only when os.path.isdir(assets_path) is true. |
| SI-2 | Test suite unblocked | MUST | `py -m pytest` from backend/ passes on a fresh clone without manual directory creation. |

#### Scenario: Fresh clone with no assets directory

- GIVEN a fresh clone where frontend/dist/assets does not exist
- WHEN the application imports main.py
- THEN no RuntimeError is raised
- AND the SPA catch-all route still serves frontend/dist/index.html when it exists

#### Scenario: Full build with assets present

- GIVEN frontend/dist/assets exists (after npm run build)
- WHEN the application starts
- THEN static assets are served correctly from that directory
Session: manual-save-spotify2youtubemusic
Project: spotify2youtubemusic
Scope: project
Topic: sdd/security-hardening/spec
Duplicates: 1
Revisions: 1
Created: 2026-08-08 13:04:12