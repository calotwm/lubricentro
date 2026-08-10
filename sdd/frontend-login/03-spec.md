#44 [architecture] sdd/frontend-login/spec
# frontend-auth Specification

## Purpose

Add client-side authentication: login page, token persistence, protected routing, Bearer token injection on all API calls, 401 redirect, logout, and token-aware file transfers (PDF, CSV, Excel import). This is a new capability — no pre-existing auth spec.

## Requirements

| # | Requirement | Strength | Scenarios |
|---|-------------|----------|-----------|
| 1 | Auth State | MUST | Hydration from localStorage; no-token first visit |
| 2 | Login | MUST | Success; generic error on failure |
| 3 | Route Protection | MUST | Unauthenticated redirect; authenticated access |
| 4 | API Authorization | MUST | Bearer header on all calls; login exempt |
| 5 | 401 Handling | MUST | Expired token redirect; login 401 no loop |
| 6 | Logout | MUST | Clear state + redirect; back-button blocked |
| 7 | File Transfers | MUST | PDF/CSV/import carry token; CSV via fetch+blob |
| 8 | Build | MUST | tsc + vite build pass |

### Requirement 1: Authentication State

The system MUST manage auth state via React context, exposing `login`, `logout`, `isAuthenticated`, and `token`. The token SHALL be persisted in `localStorage` and hydrated on app mount.

#### Scenario: Hydration from localStorage

- GIVEN a token exists in localStorage
- WHEN the app mounts
- THEN isAuthenticated is true and token is available to API calls

#### Scenario: First visit — no token

- GIVEN localStorage has no token
- WHEN the app mounts
- THEN isAuthenticated is false

### Requirement 2: Login

The system MUST provide a login page at `/login` with Spanish UI ("Credenciales inválidas" on error, no field-level leak). It SHALL POST credentials to `/api/auth/login`, store `access_token`, and navigate to `/dashboard`.

#### Scenario: Successful login

- GIVEN a user submits valid credentials on `/login`
- WHEN the POST returns `{ access_token }`
- THEN the token is stored, isAuthenticated becomes true, and navigation goes to `/dashboard`

#### Scenario: Failed login

- GIVEN invalid credentials are submitted
- WHEN the POST returns 401
- THEN "Credenciales inválidas" is displayed; no token is stored

### Requirement 3: Route Protection

The system MUST redirect unauthenticated users to `/login`. `/login` SHALL render outside Layout (no sidebar/header). All other routes MUST be guarded.

#### Scenario: Unauthenticated redirect

- GIVEN the user is not authenticated
- WHEN they navigate to any non-login route
- THEN they are redirected to `/login`

#### Scenario: Authenticated access

- GIVEN the user is authenticated
- WHEN they navigate to any protected route
- THEN the route renders inside Layout

### Requirement 4: API Authorization

The API client MUST attach `Authorization: Bearer <token>` to every request. The login POST SHALL be exempt.

#### Scenario: Bearer header on API calls

- GIVEN a valid token exists
- WHEN any api.* call is made (except login)
- THEN the request includes `Authorization: Bearer <token>`

#### Scenario: Login without prior token

- GIVEN no token exists
- WHEN the login POST fires
- THEN it succeeds without an Authorization header

### Requirement 5: 401 Response Handling

The API client MUST intercept 401 responses by clearing the token and navigating to `/login` via SPA `navigate()` (no full page reload). The login request SHALL NOT trigger this handler.

#### Scenario: Expired token

- GIVEN an expired token
- WHEN any authenticated call returns 401
- THEN the token is cleared and the user is SPA-navigated to `/login`

#### Scenario: Login 401 — no redirect loop

- GIVEN invalid credentials
- WHEN the login POST returns 401
- THEN the error is shown; the user stays on `/login`

### Requirement 6: Logout

The system MUST provide a logout action that clears the token and redirects to `/login`. The trigger SHALL be a button in the Header.

#### Scenario: Logout clears session

- GIVEN a user is authenticated
- WHEN the logout button is clicked
- THEN localStorage token is removed, isAuthenticated is false, and navigation goes to `/login`

#### Scenario: Back-button blocked

- GIVEN the user has logged out
- WHEN they press browser back
- THEN they are redirected to `/login`

### Requirement 7: Authenticated File Transfers

PDF downloads, CSV exports, and Excel imports MUST carry the auth token. CSV export SHALL switch from `<a href>` to `fetch` + `Blob` + `createObjectURL` so the Authorization header is attachable.

#### Scenario: PDF download

- GIVEN an authenticated user views a quote
- WHEN PDF download triggers
- THEN the fetch to `/api/quotes/{id}/pdf` includes the Bearer token

#### Scenario: CSV export

- GIVEN an authenticated user on reports
- WHEN CSV export triggers
- THEN a fetch with Bearer token returns a blob; download starts via createObjectURL

#### Scenario: Excel import

- GIVEN an authenticated user on reports
- WHEN an Excel file is imported
- THEN the fetch to `/api/prices/import-excel` includes the Bearer token

### Requirement 8: Build Verification

The project MUST build cleanly. `npm run build` (tsc -b && vite build) SHALL exit zero.

#### Scenario: TypeScript compilation

- GIVEN all source files are committed
- WHEN `tsc -b` runs
- THEN zero type errors

#### Scenario: Production bundle

- GIVEN tsc passes
- WHEN `vite build` runs
- THEN a production bundle is produced without errors
Session: manual-save-spotify2youtubemusic
Project: spotify2youtubemusic
Scope: project
Topic: sdd/frontend-login/spec
Duplicates: 1
Revisions: 1
Created: 2026-08-08 19:00:59