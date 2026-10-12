# Satva — Hospital Appointment Booking System

---

## 1. Project Title

|                  |                                                                                        |
| ---------------- | -------------------------------------------------------------------------------------- |
| **Project Name** | Satva                                                                                  |
| **Description**  | "Satva is Hospital Appointment Booking System."                                        |
| **Repository**   | `https://gitlab.taskgrids.com/brijesh.chitroda/satva.git` (declared in `package.json`) |
| **Author**       | `team_8`                                                                               |
| **License**      | ISC                                                                                    |

### Purpose

Satva is a multi-tenant **Hospital Appointment Booking System (HABS)**. It allows multiple hospitals to be onboarded onto a single platform, each with its own doctors, staff, admins, patients, and appointment schedules. Patients can search for doctors, book appointments (in-person or telemedicine), manage family members, view medical records, and receive notifications. Doctors manage their schedules, consultations, and patient medical records. Hospital admins and front-desk staff manage day-to-day hospital operations, and a Super Admin oversees the entire platform across all hospitals.

### Problem it Solves

Traditional hospital appointment booking is fragmented — phone calls, walk-ins, and paper-based scheduling. Satva digitizes this by providing:

- A single online system for patients to discover doctors and self-book appointments.
- Digital medical record keeping tied to specific appointments.
- Role-based dashboards so hospital staff can manage patient check-ins, payments, and doctor schedules.
- A centralized Super Admin layer for onboarding new hospitals and hospital admins (SaaS-style multi-hospital architecture).

### Target Users

Based on the roles implemented in the `users.role` ENUM (`PATIENT`, `DOCTOR`, `ADMIN`, `STAFF`, `SUPER_ADMIN`), the target users are:

1. **Patients** — booking appointments, managing their profile/family, viewing records.
2. **Doctors** — managing schedules, consultations, and patient medical records.
3. **Hospital Staff** (Receptionists/Nurses) — front-desk operations: check-in, payments, appointment management.
4. **Hospital Admins** — managing a single hospital's doctors, staff, patients, and settings.
5. **Super Admin** — platform-level owner managing all hospitals and hospital admins.

---

## 2. Tech Stack

| Category                  | Technology                                                                                                                   | Version (from `package.json`)                                                                        |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **Language**              | TypeScript                                                                                                                   | `^6.0.3` (compiled with `tsc`)                                                                       |
| **Backend Framework**     | Express                                                                                                                      | `^5.2.1`                                                                                             |
| **Templating (Frontend)** | EJS                                                                                                                          | `^6.0.1`                                                                                             |
| **CSS Framework**         | Tailwind CSS (used via CDN/utility classes in views)                                                                         | N/A                                                                                                  |
| **Database**              | MySQL                                                                                                                        | Driver: `mysql2` `^3.22.4` (Promise pool, no ORM — raw parameterized SQL queries via `pool.execute`) |
| **Authentication**        | JWT (`jsonwebtoken` `^9.0.3`) + Google OAuth 2.0 (`passport`, `passport-google-oauth20`)                                     |                                                                                                      |
| **Password Hashing**      | `bcrypt` `^6.0.0`                                                                                                            |                                                                                                      |
| **Session Management**    | `express-session` `^1.19.0` (used for Passport/Google OAuth flow)                                                            |                                                                                                      |
| **Validation**            | `zod` `^4.4.3` (schema validation middleware)                                                                                |                                                                                                      |
| **File Uploads**          | `multer` `^2.1.1` (disk storage for profile images & medical record attachments)                                             |                                                                                                      |
| **Rate Limiting**         | `express-rate-limit` `^8.5.2` (applied to `/auth` routes)                                                                    |                                                                                                      |
| **Cookies**               | `cookie-parser` `^1.4.7` (used to read refresh-token cookie)                                                                 |                                                                                                      |
| **Logging**               | `winston` `^3.19.0` + `winston-daily-rotate-file` `^5.0.0` (daily rotated log files in `logs/`)                              |                                                                                                      |
| **AI / Third-party API**  | `@google/generative-ai` `^0.24.1` (Gemini — used in `src/services/gemini.service.ts`, e.g. for medical record summarization) |                                                                                                      |
| **Phone Number Handling** | `libphonenumber-js` `^1.13.5`                                                                                                |                                                                                                      |
| **Environment Config**    | `dotenv` `^17.4.2`                                                                                                           |                                                                                                      |
| **Package Manager**       | npm (evidenced by `package-lock.json`)                                                                                       |                                                                                                      |
| **Build Tool**            | TypeScript Compiler (`tsc`) for production build; `tsx` `^4.22.4` (`tsx watch`) for hot-reload development                   |                                                                                                      |

There are **no dedicated frontend framework dependencies** (no React/Vue/Angular) — the client-side UI is server-rendered EJS augmented with plain vanilla JavaScript files under `public/js/`.

---

## 3. Project Architecture

### 3.1 Overall Architecture

Satva is a **monolithic, layered, server-rendered Node.js/Express application**. It serves two kinds of routes from the same Express app:

1. **JSON REST API** — mounted under `/api/v1/*`, consumed by client-side JavaScript (`public/js/*.js`) running inside the EJS-rendered pages (an AJAX/SPA-like pattern within a multi-page server-rendered app).
2. **Page (View) Routes** — mounted at the root and role-prefixed paths (`/patient`, `/doctor`, `/admin`, `/staff`, `/super-admin`, `/hospital`) that render EJS templates.

The backend follows a classic **Controller → Service → Repository** layered architecture per feature module, with Zod-based validation middleware sitting in front of controllers.

```mermaid
flowchart TB
    Client["Browser (EJS Pages + public/js AJAX)"]
    subgraph Express["Express Application (src/app.ts)"]
        MW["Global Middleware<br/>(session, cookie-parser, express.json, static, passport)"]
        PageRoutes["Page Routes<br/>/admin /staff /super-admin /hospital /patient /doctor /(auth)"]
        ApiRouter["/api/v1 Router (main.routes.ts)"]
        subgraph Modules["Feature Modules"]
            Auth[Auth]
            Patient[Patient]
            Doctor[Doctor]
            Admin[Admin]
            Staff[Staff]
            SuperAdmin[Super Admin]
            Hospital[Hospital]
            Appointment[Appointment]
            Telemedicine[Telemedicine]
            Notification[Notification]
            ContactUs[Contact Us]
        end
        ErrorMW["errorMiddleware / notFoundMiddleware"]
    end
    DB[(MySQL: satva_db)]
    Gemini["Google Gemini API"]
    Google["Google OAuth 2.0"]

    Client -->|HTTP| MW
    MW --> PageRoutes
    MW --> ApiRouter
    ApiRouter --> Modules
    Modules -->|mysql2 pool.execute| DB
    Modules --> Gemini
    Auth --> Google
    Modules --> ErrorMW
```

### 3.2 Layered (Module) Architecture

Every feature module under `src/modules/<name>/` follows this convention (not all modules implement every layer):

```
Routes (*.routes.ts)
   ↓  registers Express endpoints, attaches middleware (auth, validation, multer)
Controller (*.controller.ts)
   ↓  parses req, calls service, formats response via generalResponse() / HttpException
Service (*.service.ts)
   ↓  business logic, orchestration, calls repository
Repository (*.repository.ts)
   ↓  raw parameterized SQL via mysql2 pool (query()/query2())
Database (MySQL)
```

Additional per-module folders observed:

- `validators/` or `validations/` — Zod schemas.
- `interfaces/` — TypeScript types/interfaces for module data shapes.
- `utils/` — module-specific helper functions (e.g. Multer config, confirmation-number generation).
- `middleware/` — module-specific middleware (e.g. `patient.validate.ts`, `appointment.validate.ts`).
- `common/index.ts` — barrel/shared exports for the module.
- `*.page.controller.ts` / `*.page.routes.ts` — a **separate, parallel set of routes/controllers** dedicated to rendering EJS pages (as opposed to the JSON API controller/routes for the same domain). This is a deliberate separation between "data API" and "page rendering" concerns.

### 3.3 Request Flow

1. Request hits Express app (`src/app.ts`).
2. Passes through global middleware: `express.json()`, two `session()` registrations (one with a hardcoded `"scret"` secret used before folder-creation logic, then a second one using `env.SESSION_SECRET` — see **Known Limitations**), `express.urlencoded()`, static file serving (`public/`, `uploads/`), `cookieParser()`, Passport initialization.
3. Routed to either a **page route** (EJS render) or the **`/api/v1` router**, which fans out to the relevant module's `*.routes.ts`.
4. Module route applies **auth middleware** (`authenticate`, `isPatient`/`isDoctor`/`isAdmin`/`isStaff`/`isSuperAdmin`, or combined arrays like `patientAuth`) and **validation middleware** (`validateRequestBody`/`validateRequestQuery` using Zod schemas), and for file-upload endpoints, **Multer** middleware.
5. Controller method executes, calling into the Service layer.
6. Service layer applies business rules and calls the Repository layer.
7. Repository executes parameterized SQL against the MySQL connection pool (`src/database/connection.ts`).
8. Controller returns a JSON response via `generalResponse()` helper (`{ statusCode, message, data }`) or renders an EJS view.
9. Errors thrown as `HttpException` subclasses (or generic `Error`) are caught and normalized by `errorMiddleware`.
10. Unmatched routes fall through to `notFoundMiddleware` (404 JSON response).

### 3.4 Authentication Flow

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant API as /api/v1/auth
    participant SVC as AuthService
    participant REPO as UserRepository
    participant DB as MySQL

    U->>API: POST /auth/login {email, password}
    API->>SVC: login(data)
    SVC->>REPO: findUserByEmail(email)
    REPO->>DB: SELECT * FROM users WHERE email=?
    DB-->>REPO: user row
    REPO-->>SVC: user
    SVC->>SVC: comparePassword(password, user.password_hash)
    SVC->>SVC: sign() access token (JWT, 1 day)
    SVC->>SVC: signRefreshToken() (JWT, 15 days)
    SVC->>REPO: store refresh token in user_sessions
    REPO->>DB: INSERT INTO user_sessions
    SVC-->>API: { accessToken, user }
    API-->>U: 200 JSON + Set-Cookie: refreshToken
```

Local login/registration uses **JWT access tokens** (1-day expiry, signed with `JWT_SECRET_KEY`) plus a **JWT refresh token** (15-day expiry, signed with `REFRESH_TOKEN_SECRET`) persisted in the `user_sessions` table and returned to the client as a cookie. Google OAuth login (`passport-google-oauth20`) is also supported and issues the same JWT access token upon successful callback, redirecting the browser to `/login?token=...`.

### 3.5 Authorization Flow

Authorization is **role-based (RBAC)**, implemented in `src/common/middlewares/auth.middleware.ts`:

- `authenticate` — verifies the JWT Bearer access token; if expired, attempts silent refresh using the refresh-token cookie and a stored session row in `user_sessions`, then issues a new access token via the `x-access-token` response header.
- Role guards: `isPatient`, `isDoctor`, `isAdmin`, `isStaff`, `isSuperAdmin` — each checks `req.user.role` against a fixed literal and returns `403` if it doesn't match.
- Composite arrays: `patientAuth = [authenticate, isPatient]` (and equivalents for other roles) are used directly as Express middleware in route definitions.
- A generic `authorizeRoles(...roles)` factory also exists for multi-role authorization.

### 3.6 File Upload Flow

File uploads use **Multer with disk storage** (`src/utils/multer.ts` for patient/doctor profile images, and `src/modules/patient/utils/patientProfileandMulterUpload.ts` for patient profile + insurance documents). Files are saved to `uploads/<category>/` with a unique filename (`fieldname-timestamp-random.ext`), filtered by extension (`imageFilter` restricts to jpeg/jpg/png/gif for images; a broader `fileFilter` allows jpeg/jpg/png/pdf/txt for documents), with a 2MB size limit on profile images. The `uploads/` directory (with `patient_profile/`, `doctor_profile/`, `medical_records/` subfolders) is auto-created at server boot if missing (see `src/app.ts`), and served statically at `/uploads`.

### 3.7 Database Flow

There is **no ORM**. All database access goes through `src/database/connection.ts`, which exposes a `mysql2` connection pool and three helper functions:

- `query(sql, params)` — uses `pool.execute` (prepared statement, parameterized).
- `query2(sql, params)` — uses `pool.query` (non-prepared, still parameterized).
- `getConnection()` — returns a raw pooled connection (used where multi-statement transactions are needed, e.g. inside repository methods that must insert into multiple related tables).

Repositories construct raw SQL strings using these helpers.

### 3.8 Error Handling Flow

Controllers/services throw either:

- Custom `HttpException` subclasses (`BadRequestException`, `UnauthorizedException`, `ForbiddenException`, `NotFoundException`, `ConflictException`, `InternalServerException` — all in `src/common/helpers/http-exception.ts`), each carrying an explicit `statusCode`.
- Or plain `Error` objects (used in several service methods, e.g. `"Email already exists"`), which fall back to a `500` in `errorMiddleware` since they are not `instanceof HttpException`.

`errorMiddleware` (registered last, after all routes) catches everything, logs the raw error to the console, and returns `{ success: false, message }` with the appropriate status code. `notFoundMiddleware` handles any unmatched route with a `404` JSON payload.

---

## 4. Folder Structure

```
satva/
├── .env                          # Environment variables (NOT checked into VCS per .gitignore)
├── .gitignore
├── package.json / package-lock.json
├── tsconfig.json
├── public/                       # Static assets served at web root
│   └── js/                       # Vanilla JS consumed by EJS views (AJAX calls to /api/v1)
├── uploads/                      # Runtime-created; stores uploaded files (git-ignored)
│   ├── patient_profile/
│   ├── doctor_profile/
│   └── medical_records/
├── logs/                         # Winston daily-rotated log files (git-ignored)
└── src/
    ├── app.ts                    # Express app factory (buildApp)
    ├── server.ts                 # Entry point — connects DB, starts HTTP server
    ├── config/
    │   └── index.ts              # Centralized environment variable loader (env object)
    ├── database/
    │   └── connection.ts         # MySQL connection pool + query helpers
    ├── common/
    │   ├── constants/http.constants.ts   # HttpStatus enum/constants
    │   ├── countryCodes.ts               # Static country-code data (for phone dropdowns)
    │   ├── helpers/
    │   │   ├── catch-async.ts            # Async error-wrapping helper for controllers
    │   │   ├── general-response.ts       # Standard JSON response shape
    │   │   └── http-exception.ts         # Custom exception classes
    │   ├── interfaces/routes.interfaces.ts  # `Routes` interface (path + router contract)
    │   ├── logger.ts                     # Winston logger configuration
    │   └── middlewares/
    │       ├── auth.middleware.ts        # JWT auth + RBAC guards
    │       ├── error.middleware.ts       # Global error handler
    │       ├── not-found.middlware.ts    # 404 handler
    │       └── validation.middleware.ts  # Zod-based body/query validators
    ├── services/
    │   ├── audit.service.ts      # Writes to audit_logs table
    │   └── gemini.service.ts     # Google Gemini AI integration (e.g. record summaries)
    ├── types/
    │   ├── express.d.ts          # Express type augmentations
    │   └── session.d.ts          # express-session type augmentations
    ├── utils/
    │   └── multer.ts             # Shared Multer configs (patient/doctor profile uploads)
    ├── routes/
    │   └── main.routes.ts        # Aggregates all module API routers under /api/v1
    ├── modules/                  # One folder per business domain (see §5 & §11)
    │   ├── auth/
    │   ├── admin/
    │   ├── appointment/
    │   ├── contactus/
    │   ├── doctor/
    │   ├── hospital/
    │   ├── notification/
    │   ├── patient/
    │   ├── staff/
    │   ├── super_admin/
    │   └── telemedicine/
    └── views/                    # EJS templates, organized by role/section
        ├── partials/, admin/, auth/, doctor/, patient/, staff/, super_admin/
        └── index.ejs, about.ejs, contact.ejs, doctors.ejs, error_flash.ejs
```

Each `modules/<domain>` folder is self-contained and follows the Route→Controller→Service→Repository pattern described in §3.2.

---

## 5. Important Files

| File                                              | Purpose                                                                                                                                                                                                      | Key Exports                                                                                                                                                                |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/server.ts`                                   | Application entry point. Connects to MySQL (`dbConnection()`), builds the Express app, starts the HTTP server on `env.PORT`.                                                                                 | `buildServer()` (self-invoked)                                                                                                                                             |
| `src/app.ts`                                      | Constructs and configures the Express `Application`: view engine, static file serving, sessions, Passport, upload-folder bootstrap, and mounts all page routers + the `/api/v1` API router + error handlers. | `buildApp()`                                                                                                                                                               |
| `src/config/index.ts`                             | Loads and defaults all environment variables into a single `env` object (PORT, DB credentials, JWT secrets, Google OAuth credentials, Gemini API key).                                                       | `env`                                                                                                                                                                      |
| `src/database/connection.ts`                      | Creates the `mysql2` promise connection pool and exposes query helpers.                                                                                                                                      | `pool`, `dbConnection()`, `query()`, `query2()`, `getConnection()`                                                                                                         |
| `src/routes/main.routes.ts`                       | Instantiates every module's route class and mounts them under `/api/v1`.                                                                                                                                     | `buildApiRouter()`                                                                                                                                                         |
| `src/common/middlewares/auth.middleware.ts`       | JWT verification, refresh-token silent renewal, and role-based access guards.                                                                                                                                | `authenticate`, `isPatient`, `isDoctor`, `isAdmin`, `isStaff`, `isSuperAdmin`, `patientAuth`, `doctorAuth`, `adminAuth`, `staffAuth`, `superAdminAuth`, `authorizeRoles()` |
| `src/common/middlewares/validation.middleware.ts` | Wraps Zod schemas as Express middleware for request body/query validation.                                                                                                                                   | `validateRequestBody()`, `validateRequestQuery()`                                                                                                                          |
| `src/common/middlewares/error.middleware.ts`      | Global error handler producing consistent JSON error responses.                                                                                                                                              | `errorMiddleware()`                                                                                                                                                        |
| `src/common/helpers/http-exception.ts`            | Typed HTTP exception hierarchy used across services/controllers.                                                                                                                                             | `HttpException` + 6 subclasses                                                                                                                                             |
| `src/common/helpers/general-response.ts`          | Standardizes all success JSON responses (`{ statusCode, message, data }`).                                                                                                                                   | `generalResponse()`                                                                                                                                                        |
| `src/modules/auth/auth.service.ts`                | Core authentication business logic: registration (patient/doctor/admin/staff), login, OTP/password reset, session/audit logging.                                                                             | `AuthService` class                                                                                                                                                        |
| `src/modules/auth/auth.repository.ts`             | Direct SQL access for `users`, per-role profile tables, and `user_sessions`.                                                                                                                                 | `UserRepository` class                                                                                                                                                     |
| `src/modules/auth/utils/jwt.ts`                   | JWT signing/verification for access & refresh tokens.                                                                                                                                                        | `sign()`, `verifyToken()`, `signRefreshToken()`, `verifyRefreshToken()`                                                                                                    |
| `src/modules/auth/utils/googleauth.ts`            | Passport Google OAuth 2.0 strategy configuration.                                                                                                                                                            | Configured `passport` instance                                                                                                                                             |
| `src/utils/multer.ts`                             | Shared file-upload configuration (patient/doctor profile images, medical record documents).                                                                                                                  | `uploadPatientProfile`, `uploadDoctorProfile`, `uploadMedicalRecords`                                                                                                      |
| `src/services/audit.service.ts`                   | Writes structured entries to the `audit_logs` table for traceability of sensitive actions.                                                                                                                   | `AuditService` class                                                                                                                                                       |
| `src/services/gemini.service.ts`                  | Wraps calls to Google's Generative AI (Gemini) SDK, used for AI-assisted features (e.g. medical record summaries).                                                                                           | Gemini service class/functions                                                                                                                                             |

---

## 6. Complete User Roles

Roles are enforced via the `users.role` ENUM column (`PATIENT`, `DOCTOR`, `ADMIN`, `STAFF`, `SUPER_ADMIN`) and the RBAC middleware in `auth.middleware.ts`. There is **no dynamic/DB-driven permission table** — RBAC is implemented as static code guards per role, i.e. authorization is **coarse-grained role checks**, not fine-grained permission flags.

### 6.1 Patient

- **Purpose:** End users who search for doctors and book appointments.
- **Permissions/Allowed Operations:** View/update own profile (`patient.routes.ts`), manage family members (CRUD), search/browse doctors, book/reschedule/cancel appointments, view payment history, view medical records and AI-generated summaries, view/manage notifications.
- **Restricted Operations:** Cannot access admin, staff, doctor, or super-admin endpoints (blocked by `isPatient`/role-specific guards).
- **Dashboard Access:** `/patient/dashboard`, `/patient/profile`, `/patient/doctors`, `/patient/book-appointment`, `/patient/my-appointments`, `/patient/records`, `/patient/notifications`, `/patient/payments`.
- **APIs Accessible:** All routes under `/api/v1/patient/*` (guarded by `authenticate + isPatient`), `/api/v1/appointments` (patient sub-routes), `/api/v1/notifications`.
- **Database Entities Managed:** `patients`, `family_members`, `patient_insurance_details`, own rows in `appointments`, `payments`, `medical_records` (read-only), `notifications`.

### 6.2 Doctor

- **Purpose:** Medical professionals who deliver consultations and manage patient records.
- **Permissions:** View/update own profile, manage weekly schedule and leaves, view today's/weekly appointments, update appointment status, create medical records + prescriptions with file attachments, view assigned patients' medical history, manage telemedicine sessions.
- **Restricted Operations:** Cannot manage other doctors, hospital settings, or staff/admin data.
- **Dashboard Access:** `/doctor/dashboard`, `/doctor/profile`, `/doctor/profile/edit`, `/doctor/create-medical-record`, `/doctor/view-medical-record/:appointment_id`, `/doctor/view-patient-medical-records`.
- **APIs Accessible:** All routes under `/api/v1/doctor/*` (guarded by `doctorAuth`), `/api/v1/appointments/doctor/*`, `/api/v1/telemedicine/*`.
- **Database Entities Managed:** `doctors`, `doctor_schedules`, `doctor_leaves`, `doctor_status`, `doctor_qualifications`, `doctor_specialties`, `medical_records`, `medical_record_attachments`, `medical_record_amendments`, `prescriptions`, `prescription_items`, `telemedicine_sessions`, `appointment_status_history`.

### 6.3 Staff (Receptionist / Nurse)

- **Purpose:** Front-desk hospital operations for a single hospital (`staff.staff_role` ENUM: `RECEPTIONIST`, `NURSE`).
- **Permissions:** View doctors/patients/appointments for their hospital, view hospital stats, check in patients, mark payments as done, mark no-shows, look up appointments by confirmation number.
- **Restricted Operations:** Cannot create/edit doctors or change hospital settings (those are Admin-only).
- **Dashboard Access:** `/staff/doctors`, `/staff/patients`, `/staff/appointments`, `/staff/appointments/:appointment_id`, `/staff/doctor/:doctorId`, `/staff/patients/:patientId`.
- **APIs Accessible:** All routes under `/api/v1/staff/*` (guarded by `staffAuth`).
- **Database Entities Managed:** Reads `doctors`, `patients`, `appointments`; updates `appointments.appointment_status`, `payments.status`, and writes `appointment_status_history`.

### 6.4 Admin (Hospital Admin)

- **Purpose:** Manages a single hospital's operations end-to-end.
- **Permissions:** Add/edit doctors, add staff, toggle doctor active/inactive status, view/manage patients and appointments for their hospital, view audit logs, view specialties list, update hospital settings, view hospital-wide statistics.
- **Restricted Operations:** Cannot create new hospitals or manage other hospitals' admins (Super Admin-only).
- **Dashboard Access:** `/admin/doctors`, `/admin/add-doctor`, `/admin/patients`, `/admin/appointments`, `/admin/staffs`, `/admin/add-staff`, `/admin/audit-logs`, `/admin/settings`.
- **APIs Accessible:** All routes under `/api/v1/admin/*` (guarded by `adminAuth`).
- **Database Entities Managed:** `doctors`, `doctor_specialties`, `staff`, `hospitals` (own hospital settings), `audit_logs` (read), `appointments` (read), `patients` (read).

### 6.5 Super Admin

- **Purpose:** Platform owner overseeing all hospitals and hospital admins across the system.
- **Permissions:** Create/edit hospitals, create/edit hospital admins, view the full list of hospitals and admins, manage Contact Us inquiries (view, reply, mark status, delete), seed the initial Super Admin account.
- **Restricted Operations:** None documented — this is the top-level role.
- **Dashboard Access:** `/super-admin/dashboard`, `/super-admin/create-admin`, `/super-admin/edit-admin/:id`, `/super-admin/view-admin/:id`, plus hospital pages under `/hospital/*`.
- **APIs Accessible:** `/api/v1/super-admin/*` and `/api/v1/hospital/*` (guarded by `superAdminAuth`), `/api/v1/contactus` (GET/PATCH/DELETE/reply, guarded by `superAdminAuth`).
- **Database Entities Managed:** `hospitals`, `admins`, `contactus_messages`, `contactus_replies`.

### RBAC Mechanism

1. On every protected request, `authenticate` decodes the JWT and attaches `req.user = { id, email, role }`.
2. A role-specific guard function (e.g. `isDoctor`) compares `req.user.role` to the required literal string and responds `403 Forbidden` on mismatch.
3. Route files compose `authenticate` + the role guard into arrays (`patientAuth`, `doctorAuth`, etc.) applied either per-route or via `router.use(...)` for an entire module (e.g. `AdminRoutes` applies `adminAuth` to all its routes with `this.router.use(adminAuth)`).
4. There is no table-driven permission matrix; all authorization decisions are hardcoded per-route in TypeScript.

---

## 7. Authentication

### Registration Flow

Four separate registration endpoints exist, each creating a `users` row plus a role-specific profile row in the same transaction pattern:

- `POST /api/v1/auth/register` — Patient self-registration (creates `users` + `patients` rows).
- `POST /api/v1/auth/register-doctor` — Doctor registration (creates `users` + `doctors` rows).
- `POST /api/v1/auth/register-admin` — Admin registration (creates `users` + `admins` rows).
- Staff registration logic exists in `AuthService.registerStaff()`, though it is not wired to a public route in `auth.routes.ts` (likely invoked internally, e.g. from the Admin "Add Staff" flow).

Each registration flow: checks for an existing user by email → hashes the password with `bcrypt` (cost factor 10) → inserts the `users` row with the correct `role` → inserts the role-specific profile row → signs a JWT access token → writes an audit log entry via `AuditService`.

### Login Flow

`POST /api/v1/auth/login` — looks up the user by email, compares the password hash with `bcrypt.compare`, issues a JWT access token (1-day expiry) and a JWT refresh token (15-day expiry) which is persisted to `user_sessions` and returned to the client (as an httpOnly-style cookie, based on how `authenticate` reads it via `req.cookies.refreshToken`).

### JWT / Session Flow

- **Access Token:** Signed with `env.JWT_SECRET_KEY`, 1-day expiry, payload `{ id, email, role }`.
- **Refresh Token:** Signed with `env.REFRESH_TOKEN_SECRET`, 15-day expiry, persisted server-side in `user_sessions.refresh_token` so it can be invalidated/looked-up.
- **express-session:** Used separately, purely to support the Passport Google OAuth handshake (`session()` middleware + `passport.session()`), not for the primary JWT-based auth.

### Password Hashing

`bcrypt` with a salt round factor of `10` (`src/modules/auth/utils/bcrypt.ts`).

### Refresh Tokens

When an access token has expired (`TokenExpiredError`), `authenticate` middleware reads the `refreshToken` cookie, verifies it against `REFRESH_TOKEN_SECRET`, confirms a matching session exists in `user_sessions` (`findSessionByRefreshToken`), and if valid, silently issues a new access token via the `x-access-token` response header and continues processing the original request using the refresh token's payload.

### Middleware

See §6 "RBAC Mechanism" and §3.5 above — `authenticate`, per-role guards, and composite auth arrays.

### Protected Routes / Role Verification

Every module's API routes (except `auth`, `contactus` POST, and the public appointment slot-lookup) require `authenticate` plus a specific role guard, enforced either per-route or module-wide via `router.use(...)`.

### Password Reset (OTP-based)

- `POST /api/v1/auth/send-otp` / `sendOtp` — generates and (presumably) emails/stores an OTP tied to `otp_verifications.purpose = 'PASSWORD_RESET'`.
- `POST /api/v1/auth/reset-password` — verifies the OTP and updates the password hash.
- The `otp_verifications` table also supports `REGISTRATION` and `LOGIN` purposes, suggesting OTP verification is a general-purpose mechanism, though only the password-reset flow is wired into visible routes.

### Google OAuth

`GET /api/v1/auth/google` initiates the OAuth handshake (scopes: `profile`, `email`); `GET /api/v1/auth/google/callback` completes it via Passport, then signs a JWT and redirects the browser to `/login?token=<jwt>` for the frontend to pick up.

---

## 8. Database Documentation

The database (`satva_db`) contains **31 tables**, all InnoDB, `utf8mb4_0900_ai_ci` collation, with all timestamps defaulting to `utc_timestamp()` — consistent with the "Store UTC → Send UTC → Display local" pattern established in this team's earlier projects. There is **no ORM**; the schema below is derived directly from `satva_db (1).sql`.

### Entity-Relationship Overview

```mermaid
erDiagram
    users ||--o| patients : "user_id"
    users ||--o| doctors : "user_id"
    users ||--o| admins : "user_id"
    users ||--o| staff : "user_id"
    users ||--o{ user_sessions : "user_id"
    users ||--o{ otp_verifications : "user_id"
    users ||--o{ notifications : "user_id"
    users ||--o{ audit_logs : "performed_by_user_id"

    hospitals ||--o{ doctors : "hospital_id"
    hospitals ||--o{ admins : "hospital_id"
    hospitals ||--o{ staff : "hospital_id"

    doctors ||--o{ doctor_schedules : "doctor_id"
    doctors ||--o{ doctor_leaves : "doctor_id"
    doctors ||--o{ doctor_status : "doctor_id"
    doctors ||--o{ doctor_qualifications : "doctor_id"
    doctors ||--o{ doctor_specialties : "doctor_id"
    specialties ||--o{ doctor_specialties : "specialty_id"

    patients ||--o{ family_members : "patient_id"
    patients ||--o{ patient_insurance_details : "patient_id"

    doctors ||--o{ appointments : "doctor_id"
    patients ||--o{ appointments : "patient_id"
    appointments ||--o{ appointment_documents : "appointment_id"
    appointments ||--o{ appointment_status_history : "appointment_id"
    appointments ||--o| payments : "appointment_id"
    appointments ||--o| telemedicine_sessions : "appointment_id"
    appointments ||--o| medical_records : "appointment_id"

    medical_records ||--o{ medical_record_access : "record_id"
    medical_records ||--o{ medical_record_amendments : "record_id"
    medical_records ||--o{ medical_record_attachments : "record_id"
    medical_records ||--o| prescriptions : "record_id"
    prescriptions ||--o{ prescription_items : "prescription_id"

    contactus_messages ||--o{ contactus_replies : "message_id"
```

### Table Reference

| Table                        | Purpose                                                                   | Key Columns                                                                                                                                                                                                                                    | Relationships / FKs                                                                                                     | Notable Constraints                                                                                                                       | Used By Modules                                                    |
| ---------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `users`                      | Master authentication table for every role.                               | `user_id` PK, `email` (unique), `password_hash`, `role` ENUM, `google_sub` (unique, nullable), `is_active`, `is_email_verified`, `last_login_at`                                                                                               | Parent of `patients`, `doctors`, `admins`, `staff`, `user_sessions`, `otp_verifications`, `notifications`, `audit_logs` | Unique on `email`, unique on `google_sub`                                                                                                 | auth                                                               |
| `user_sessions`              | Stores issued refresh tokens per device/session.                          | `session_id` PK, `user_id` FK, `refresh_token`, `device_info`, `auth_provider` ENUM(`LOCAL`,`GOOGLE`), `ip_address`, `expires_at`                                                                                                              | FK → `users.user_id`                                                                                                    | —                                                                                                                                         | auth                                                               |
| `otp_verifications`          | OTP codes for registration/login/password-reset flows.                    | `otp_id` PK, `user_id` FK, `otp_code`, `purpose` ENUM, `expires_at`, `verified_at`                                                                                                                                                             | FK → `users.user_id`                                                                                                    | —                                                                                                                                         | auth                                                               |
| `hospitals`                  | Tenant/hospital master data.                                              | `hospital_id` PK, `hospital_name`, `email`, `address_line1/2`, `contact_number` (unique)                                                                                                                                                       | Parent of `doctors`, `admins`, `staff`                                                                                  | Unique `contact_number`                                                                                                                   | hospital, super_admin                                              |
| `admins`                     | Hospital admin profile, one per admin user.                               | `admin_id` PK, `user_id` FK (unique), `hospital_id` FK, `first_name`, `last_name`                                                                                                                                                              | FK → `users`, FK → `hospitals`                                                                                          | Unique `user_id` (1:1 with users)                                                                                                         | admin, super_admin                                                 |
| `doctors`                    | Doctor profile.                                                           | `doctor_id` PK, `user_id` FK (unique), `hospital_id` FK, `experience_years`, `consultation_fee`, `rating`, `currency_code`, `bio`, `profile_path`, `is_deactivated`                                                                            | FK → `users`, FK → `hospitals`                                                                                          | Unique `user_id`                                                                                                                          | doctor, admin, staff, patient                                      |
| `doctor_leaves`              | Doctor leave/unavailability periods.                                      | `leave_id` PK, `doctor_id` FK, `from_date`, `to_date`, `reason`                                                                                                                                                                                | FK → `doctors`                                                                                                          | —                                                                                                                                         | doctor                                                             |
| `doctor_qualifications`      | Doctor education/qualifications.                                          | `qualification_id` PK, `doctor_id` FK, `degree`, `graduation_year`, `college_name`                                                                                                                                                             | FK → `doctors`                                                                                                          | —                                                                                                                                         | doctor                                                             |
| `doctor_schedules`           | Daily working-hours templates per doctor.                                 | `schedule_id` PK, `doctor_id` FK, `working_from`, `working_to`, `working_date`, `slot_duration` (default 30 min)                                                                                                                               | FK → `doctors`                                                                                                          | Unique (`doctor_id`,`working_date`) — one schedule per doctor per day                                                                     | doctor, appointment                                                |
| `doctor_specialties`         | Many-to-many doctor↔specialty mapping.                                    | `doctor_specialty_id` PK, `doctor_id` FK, `specialty_id` FK                                                                                                                                                                                    | FK → `doctors`, FK → `specialties`                                                                                      | Unique (`doctor_id`,`specialty_id`)                                                                                                       | doctor, admin, patient                                             |
| `doctor_status`              | Real-time doctor status windows (busy/available/on leave).                | `doctor_status_id` PK, `doctor_id` FK, `from_`, `to_`, `status_date`, `status` ENUM(`ON_LEAVE`,`BUSY`,`AVAILABLE`), `reason`                                                                                                                   | FK → `doctors`                                                                                                          | —                                                                                                                                         | doctor, appointment                                                |
| `specialties`                | Master list of medical specialties.                                       | `specialty_id` PK, `specialty_name` (unique)                                                                                                                                                                                                   | Referenced by `doctor_specialties`                                                                                      | Unique `specialty_name`                                                                                                                   | admin, doctor                                                      |
| `staff`                      | Hospital front-desk staff profile.                                        | `staff_id` PK, `user_id` FK (unique), `hospital_id` FK, `staff_role` ENUM(`RECEPTIONIST`,`NURSE`), `contact_number` (unique), `dob`, `gender`, `address_line1/2`                                                                               | FK → `users`, FK → `hospitals`                                                                                          | Unique `user_id`, unique `contact_number`                                                                                                 | staff, admin                                                       |
| `patients`                   | Patient profile.                                                          | `patient_id` PK, `user_id` FK (unique), `country_code`, `mobile` (unique), `blood_group`, `profile_path`, `dob`, `gender`, `is_insured`                                                                                                        | FK → `users`                                                                                                            | Unique `user_id`, unique `mobile`                                                                                                         | patient, admin, staff, doctor                                      |
| `family_members`             | Dependents linked to a patient account.                                   | `member_id` PK, `patient_id` FK, `relation`, `first_name`, `last_name`, `dob`, `mobile`, `email`                                                                                                                                               | FK → `patients`                                                                                                         | —                                                                                                                                         | patient                                                            |
| `patient_insurance_details`  | Patient insurance policy info + document.                                 | `insurance_id` PK, `patient_id` FK, `policy_number`, `policy_company`, `policy_document_path`                                                                                                                                                  | FK → `patients`                                                                                                         | Unique (`policy_number`,`policy_company`)                                                                                                 | patient                                                            |
| `appointments`               | Core booking entity.                                                      | `appointment_id` PK, `doctor_id` FK, `patient_id` FK, `slot_date`, `start_time`, `end_time`, `chief_complaint`, `appointment_type` ENUM(`IN_PERSON`,`TELEMEDICINE`), `appointment_status` ENUM(8 states — see §10), `confirmation_no` (unique) | FK → `doctors`, FK → `patients`                                                                                         | Unique `confirmation_no`; unique (`doctor_id`,`slot_date`,`start_time`,`confirmation_no`) — prevents true double-booking of the same slot | appointment, patient, doctor, staff, admin                         |
| `appointment_documents`      | Documents attached to a booking (e.g. referral letters).                  | `document_id` PK, `appointment_id` FK, `document_name`, `document_path`                                                                                                                                                                        | FK → `appointments`                                                                                                     | —                                                                                                                                         | appointment                                                        |
| `appointment_status_history` | Audit trail of status transitions on an appointment.                      | `history_id` PK, `appointment_id` FK, `old_status`, `new_status`, `changed_by_user_id` FK, `remarks`                                                                                                                                           | FK → `appointments`, FK → `users`                                                                                       | —                                                                                                                                         | appointment, doctor, staff                                         |
| `payments`                   | Payment record per appointment.                                           | `payment_id` PK, `appointment_id` FK (unique — 1:1), `amount`, `currency` (default INR), `payment_method` ENUM, `transaction_id`, `status` ENUM(`PENDING`,`SUCCESS`,`FAILED`,`REFUNDED`), `refund_status`, `transaction_at`                    | FK → `appointments`                                                                                                     | Unique `appointment_id`                                                                                                                   | patient, staff                                                     |
| `telemedicine_sessions`      | Video-consultation session per appointment.                               | `session_id` PK, `appointment_id` FK (unique), `meeting_link`, `status` ENUM(`SCHEDULED`,`STARTED`,`COMPLETED`,`CANCELLED`), `started_at`, `ended_at`                                                                                          | FK → `appointments`                                                                                                     | Unique `appointment_id`                                                                                                                   | telemedicine                                                       |
| `medical_records`            | Clinical record created after a consultation.                             | `record_id` PK, `appointment_id` FK (unique — 1:1), `doctor_id` FK, `patient_id` FK, `diagnosis`, `examination_notes`                                                                                                                          | FK → `appointments`, `doctors`, `patients`                                                                              | Unique `appointment_id`                                                                                                                   | doctor, patient                                                    |
| `medical_record_access`      | Grants of record access to a doctor by a patient.                         | `access_id` PK, `record_id` FK, `doctor_id` FK, `granted_by_patient_id` FK, `expires_at`                                                                                                                                                       | FK → `medical_records`, `doctors`, `patients`                                                                           | —                                                                                                                                         | doctor (implied access-control table; no dedicated route observed) |
| `medical_record_amendments`  | Change log for edits to a medical record.                                 | `amendment_id` PK, `record_id` FK, `amended_by_doctor_id` FK, `field_name`, `old_value`, `new_value`, `reason`                                                                                                                                 | FK → `medical_records`, `doctors`                                                                                       | —                                                                                                                                         | doctor (implied; no dedicated route observed)                      |
| `medical_record_attachments` | Files attached to a medical record (uploaded via `uploadMedicalRecords`). | `attachment_id` PK, `record_id` FK, `file_name`, `file_path`                                                                                                                                                                                   | FK → `medical_records`                                                                                                  | —                                                                                                                                         | doctor, patient                                                    |
| `prescriptions`              | Prescription tied 1:1 to a medical record.                                | `prescription_id` PK, `record_id` FK (unique), `notes`                                                                                                                                                                                         | FK → `medical_records`                                                                                                  | Unique `record_id`                                                                                                                        | doctor, patient                                                    |
| `prescription_items`         | Individual medicine lines within a prescription.                          | `item_id` PK, `prescription_id` FK, `medicine_name`, `dosage`, `frequency`, `duration`, `instructions`                                                                                                                                         | FK → `prescriptions`                                                                                                    | —                                                                                                                                         | doctor, patient                                                    |
| `notifications`              | In-app notifications per user.                                            | `notification_id` PK, `user_id` FK, `notification_type`, `title`, `notification_message`, `redirect_url`, `is_read`                                                                                                                            | FK → `users` (ON DELETE CASCADE)                                                                                        | —                                                                                                                                         | notification                                                       |
| `audit_logs`                 | System-wide audit trail of sensitive actions.                             | `audit_id` PK, `performed_by_user_id` FK, `action`, `entity_name`, `entity_id`, `ip_address`, `old_value`, `new_value`                                                                                                                         | FK → `users`                                                                                                            | —                                                                                                                                         | services/audit.service.ts (cross-cutting)                          |
| `contactus_messages`         | Public "Contact Us" form submissions.                                     | `id` PK, `first_name`, `last_name`, `email`, `message`, `status` (default `unread`), `is_deleted` (soft delete)                                                                                                                                | Parent of `contactus_replies`                                                                                           | —                                                                                                                                         | contactus                                                          |
| `contactus_replies`          | Admin replies to a contact message.                                       | `id` PK, `message_id` FK, `reply_text`                                                                                                                                                                                                         | FK → `contactus_messages` (ON DELETE CASCADE)                                                                           | —                                                                                                                                         | contactus                                                          |

> **Note:** Several tables (`medical_record_access`, `medical_record_amendments`, `appointment_documents`) exist in the schema but no corresponding controller/route was found operating on them directly in the reviewed source — they appear to be designed for future or partially-implemented features (see §16 Known Limitations).

---

## 9. API Documentation

All JSON API endpoints are mounted under the base path **`/api/v1`** (see `src/routes/main.routes.ts`). All protected endpoints expect an `Authorization: Bearer <accessToken>` header, and the auth middleware may additionally read a `refreshToken` cookie to silently renew an expired access token.

Response shape for all endpoints uses `generalResponse()`: `{ statusCode, message, data }` on success; error responses (from `errorMiddleware`) use `{ success: false, message }`.

### 9.1 Auth Module — `/api/v1/auth` (rate-limited: 15 requests / 10 minutes per IP, via `express-rate-limit`)

| Method | Route                    | Auth                  | Purpose                                                          |
| ------ | ------------------------ | --------------------- | ---------------------------------------------------------------- |
| POST   | `/register-doctor`       | None                  | Register a new doctor account                                    |
| POST   | `/register-admin`        | None                  | Register a new admin account                                     |
| POST   | `/register`              | None                  | Register a new patient account                                   |
| POST   | `/login`                 | None                  | Login with email/password; returns access + refresh tokens       |
| GET    | `/refresh`               | None (refresh cookie) | Issue a new access token from a valid refresh token              |
| POST   | `/sendOtp` / `/send-otp` | None                  | Send an OTP (registered twice under two paths in the route file) |
| POST   | `/reset-password`        | None                  | Reset password using a verified OTP                              |
| GET    | `/google`                | None                  | Initiate Google OAuth login                                      |
| GET    | `/google/callback`       | None                  | Google OAuth callback; issues JWT, redirects to `/login?token=`  |
| GET    | `/country`               | None                  | Fetch static country-code list (for phone-number dropdowns)      |
| GET    | `/check-status`          | `authenticate`        | Verify current session/token validity                            |
| POST   | `/logout`                | `authenticate`        | Log the user out (invalidate session)                            |

### 9.2 Patient Module — `/api/v1/patient` (all routes: `authenticate + isPatient`)

| Method | Route                  | Purpose                                                                                                         | Request Body / Query                 |
| ------ | ---------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| GET    | `/profile`             | Get own patient profile                                                                                         | —                                    |
| PATCH  | `/profile`             | Update profile (with optional profile photo + insurance document upload via `patientProfileAndInsuranceUpload`) | Zod: `update_patient_profile_schema` |
| GET    | `/family`              | List family members                                                                                             | —                                    |
| POST   | `/family`              | Add a family member                                                                                             | Zod: `add_family_member_schema`      |
| PATCH  | `/family/:memberId`    | Update a family member                                                                                          | Zod: `update_family_member_schema`   |
| DELETE | `/family/:memberId`    | Remove a family member                                                                                          | —                                    |
| GET    | `/doctors`             | Search/browse doctors (filterable)                                                                              | Zod query: `search_doctors_schema`   |
| GET    | `/doctors/:doctorId`   | Doctor detail (public profile view)                                                                             | —                                    |
| GET    | `/payments`            | Own payment history                                                                                             | —                                    |
| GET    | `/records`             | Own medical history list                                                                                        | —                                    |
| GET    | `/records/:recordId`   | Single medical record detail                                                                                    | —                                    |
| GET    | `/records/:id/summary` | AI-generated summary of a medical record (Gemini)                                                               | —                                    |

### 9.3 Appointment Module — `/api/v1/appointments`

| Method | Route               | Auth           | Purpose                                           |
| ------ | ------------------- | -------------- | ------------------------------------------------- |
| GET    | `/slots`            | `authenticate` | Get available appointment slots for a doctor/date |
| POST   | `/`                 | `patientAuth`  | Book a new appointment                            |
| GET    | `/patient`          | `patientAuth`  | List the logged-in patient's appointments         |
| PATCH  | `/:id/reschedule`   | `patientAuth`  | Reschedule an appointment                         |
| PATCH  | `/:id/cancel`       | `patientAuth`  | Cancel an appointment                             |
| GET    | `/doctor/today`     | `doctorAuth`   | Doctor's appointments for today                   |
| GET    | `/doctor/dashboard` | `doctorAuth`   | Doctor dashboard summary data                     |

### 9.4 Doctor Module — `/api/v1/doctor` (all routes: `doctorAuth`)

| Method | Route                                                  | Purpose                                                                                            |
| ------ | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| GET    | `/get-doctor`                                          | Get own doctor profile                                                                             |
| GET    | `/get-appointment`                                     | Appointments filtered by date                                                                      |
| GET    | `/get-dashboard-data`                                  | Doctor dashboard aggregate stats                                                                   |
| GET    | `/get-weekly-schedule`                                 | Weekly schedule view                                                                               |
| GET    | `/get-patient-list`                                    | List of patients seen by this doctor                                                               |
| GET    | `/get-patient-all-medical-records/:patient_id`         | All medical records for a given patient                                                            |
| GET    | `/get-patient-all-medical-record-data/:appointment_id` | Medical record data for a specific appointment                                                     |
| GET    | `/get-specialities`                                    | List of specialties (for profile editing)                                                          |
| POST   | `/post-weekly-schedule`                                | Create/update weekly working schedule                                                              |
| POST   | `/post-medical-records`                                | Create a medical record with file attachments (`uploadMedicalRecords.array('files')`)              |
| POST   | `/profile/update`                                      | Update doctor profile, with optional profile image (`uploadDoctorProfile.single('profile_image')`) |
| GET    | `/get-hospital-details`                                | Details of the doctor's hospital                                                                   |
| PATCH  | `/appointment-status-update`                           | Update an appointment's status                                                                     |
| POST   | `/apply-doctor-leave`                                  | Submit a leave request                                                                             |
| DELETE | `/cancel-doctor-leave`                                 | Cancel/withdraw a leave request                                                                    |

### 9.5 Admin Module — `/api/v1/admin` (all routes: `adminAuth`)

| Method | Route                           | Purpose                               | Validation                     |
| ------ | ------------------------------- | ------------------------------------- | ------------------------------ |
| GET    | `/showDoctors`                  | List doctors for the admin's hospital | —                              |
| POST   | `/addDoctor`                    | Add a new doctor                      | `addDoctorSchema`              |
| GET    | `/doctors/:doctorId`            | View doctor detail                    | —                              |
| GET    | `/fetchpatients`                | List patients                         | —                              |
| PUT    | `/doctors/:doctorId`            | Edit doctor details                   | `editDoctorSchema`             |
| GET    | `/fetchAppointments`            | List appointments                     | —                              |
| GET    | `/fetchAuditLogs`               | View audit logs                       | —                              |
| GET    | `/fetchSpecialties`             | List specialties                      | —                              |
| PUT    | `/toggleDoctorStatus/:id`       | Activate/deactivate a doctor          | `toggleDoctorStatusSchema`     |
| GET    | `/patients/:patientId`          | Patient details                       | —                              |
| GET    | `/hospital`                     | Hospital settings                     | —                              |
| PUT    | `/hospital`                     | Update hospital settings              | `updateHospitalSettingsSchema` |
| GET    | `/stats`                        | Hospital-wide statistics              | —                              |
| GET    | `/appointments/:appointment_id` | Appointment detail                    | —                              |
| POST   | `/addStaff`                     | Add hospital staff                    | `addStaffSchema`               |
| GET    | `/fetchStaff`                   | List staff                            | —                              |
| GET    | `/getStaffById/:staff_id`       | Staff detail                          | —                              |

### 9.6 Staff Module — `/api/v1/staff` (all routes: `staffAuth`)

| Method | Route                                    | Purpose                                                        |
| ------ | ---------------------------------------- | -------------------------------------------------------------- |
| GET    | `/fetchDoctors`                          | List doctors                                                   |
| GET    | `/fetchPatients`                         | List patients                                                  |
| GET    | `/stats`                                 | Hospital stats                                                 |
| GET    | `/fetchAppointments`                     | List appointments                                              |
| GET    | `/appointments/:appointment_id`          | Appointment detail                                             |
| GET    | `/doctors/:doctorId`                     | Doctor detail                                                  |
| GET    | `/patients/:patientId`                   | Patient detail                                                 |
| GET    | `/appointments/confirm/:confirmation_no` | Look up appointment by confirmation number (front-desk lookup) |
| PUT    | `/appointments/:appointment_id/checkin`  | Check in a patient                                             |
| PUT    | `/appointments/:appointment_id/payment`  | Mark payment done — `paymentStatusSchema`                      |
| PUT    | `/appointments/:appointment_id/noshow`   | Mark appointment as no-show                                    |

### 9.7 Super Admin Module — `/api/v1/super-admin`

| Method | Route               | Auth             | Purpose                                                    | Validation             |
| ------ | ------------------- | ---------------- | ---------------------------------------------------------- | ---------------------- |
| POST   | `/login`            | None             | Super Admin login                                          | `loginSchema`          |
| POST   | `/seed-super-admin` | None             | One-time bootstrap to create the first Super Admin account | `seedSuperAdminSchema` |
| GET    | `/list`             | `superAdminAuth` | List all hospital admins                                   | —                      |
| POST   | `/create-admin`     | `superAdminAuth` | Create a new hospital admin                                | `createAdminSchema`    |
| PUT    | `/edit-admin/:id`   | `superAdminAuth` | Edit a hospital admin                                      | `updateAdminSchema`    |

### 9.8 Hospital Module — `/api/v1/hospital`

| Method | Route                | Auth             | Purpose                | Validation             |
| ------ | -------------------- | ---------------- | ---------------------- | ---------------------- |
| GET    | `/list`              | `superAdminAuth` | List all hospitals     | —                      |
| POST   | `/create-hospital`   | `superAdminAuth` | Onboard a new hospital | `createHospitalSchema` |
| PUT    | `/edit-hospital/:id` | `superAdminAuth` | Edit hospital details  | `updateHospitalSchema` |

### 9.9 Telemedicine Module — `/api/v1/telemedicine` (all routes: `doctorAuth`)

| Method | Route                         | Purpose                                          |
| ------ | ----------------------------- | ------------------------------------------------ |
| POST   | `/`                           | Create a telemedicine session for an appointment |
| GET    | `/:sessionId`                 | Get session by ID                                |
| GET    | `/appointment/:appointmentId` | Get session by appointment                       |
| GET    | `/patient/:patientId`         | List sessions for a patient                      |
| GET    | `/doctor/:doctorId`           | List sessions for a doctor                       |
| PATCH  | `/:sessionId/start`           | Start the session                                |
| PATCH  | `/:sessionId/end`             | End the session                                  |
| PATCH  | `/:sessionId/status`          | Update session status                            |
| PATCH  | `/:sessionId/meeting-link`    | Update the video meeting link                    |

### 9.10 Notification Module — `/api/v1/notifications` (all routes: `authenticate`)

| Method | Route                   | Purpose                                       |
| ------ | ----------------------- | --------------------------------------------- |
| GET    | `/`                     | List all notifications for the logged-in user |
| GET    | `/unread`               | List unread notifications                     |
| GET    | `/unread/count`         | Get unread count (for a badge indicator)      |
| PATCH  | `/:notificationId/read` | Mark one notification as read                 |
| PATCH  | `/read-all`             | Mark all notifications as read                |

### 9.11 Contact Us Module — `/api/v1/contactus`

| Method | Route         | Auth             | Purpose                                        |
| ------ | ------------- | ---------------- | ---------------------------------------------- |
| POST   | `/`           | None (public)    | Submit a contact form message                  |
| GET    | `/`           | `superAdminAuth` | List contact messages                          |
| PATCH  | `/:id/status` | `superAdminAuth` | Update message status (e.g. unread → resolved) |
| DELETE | `/:id`        | `superAdminAuth` | Soft-delete a message (`is_deleted` flag)      |
| POST   | `/:id/reply`  | `superAdminAuth` | Reply to a message                             |

---

## 10. Module Documentation

| Module           | Purpose                                                                      | Key Business Logic                                                                                                                                                                                                              | Database Interaction                                                                                                                                    |
| ---------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **auth**         | Identity, registration, login, OTP, Google OAuth, session/token management.  | Role-specific registration; bcrypt hashing; JWT issuance; refresh-token session tracking; audit logging on register events.                                                                                                     | `users`, `patients`/`doctors`/`admins`/`staff` (create), `user_sessions`, `otp_verifications`                                                           |
| **patient**      | Patient self-service: profile, family, doctor search, records, payments.     | Profile completeness/insurance handling with Multer uploads; Zod-validated doctor search filters.                                                                                                                               | `patients`, `family_members`, `patient_insurance_details`, `doctors` (search), `payments`, `medical_records`                                            |
| **doctor**       | Doctor self-service: schedule, dashboard, patients, medical records, leaves. | Weekly schedule creation (respecting the unique `(doctor_id, working_date)` constraint); medical record + attachment creation; leave application/cancellation; appointment status transitions.                                  | `doctors`, `doctor_schedules`, `doctor_leaves`, `doctor_status`, `medical_records`, `medical_record_attachments`, `prescriptions`, `prescription_items` |
| **appointment**  | Core booking engine shared by patient/doctor flows.                          | Slot availability calculation from `doctor_schedules` minus existing `appointments`/`doctor_leaves`/`doctor_status`; confirmation-number generation (`utils/confirmation.ts`); reschedule/cancel logic; status-history logging. | `appointments`, `appointment_status_history`, `doctor_schedules`                                                                                        |
| **admin**        | Hospital admin operations for a single hospital.                             | Add/edit doctors and staff; toggle doctor active status; hospital settings management; statistics aggregation (`utils/stats.utils.ts`); audit log retrieval.                                                                    | `doctors`, `staff`, `hospitals`, `audit_logs`, `appointments`, `patients`                                                                               |
| **staff**        | Front-desk operations.                                                       | Check-in workflow; payment status updates; no-show marking; confirmation-number lookup.                                                                                                                                         | `appointments`, `payments`, `doctors`, `patients`                                                                                                       |
| **super_admin**  | Platform-wide hospital/admin management.                                     | Hospital admin CRUD; super-admin bootstrap seeding; login.                                                                                                                                                                      | `admins`, `hospitals`, `users`                                                                                                                          |
| **hospital**     | Hospital (tenant) CRUD, restricted to Super Admin.                           | Hospital onboarding and edits.                                                                                                                                                                                                  | `hospitals`                                                                                                                                             |
| **telemedicine** | Virtual consultation session lifecycle.                                      | Session creation tied 1:1 to an appointment; status transitions (`SCHEDULED → STARTED → COMPLETED/CANCELLED`); meeting-link management.                                                                                         | `telemedicine_sessions`, `appointments`                                                                                                                 |
| **notification** | In-app notification delivery/read-state.                                     | Unread-count aggregation; mark-as-read (single/bulk).                                                                                                                                                                           | `notifications`                                                                                                                                         |
| **contactus**    | Public contact form + Super Admin triage.                                    | Public submission; status update; reply threading; soft delete.                                                                                                                                                                 | `contactus_messages`, `contactus_replies`                                                                                                               |

Cross-cutting services (not full modules but shared across modules):

- **`services/audit.service.ts`** — called from various services (e.g. `AuthService`) to write to `audit_logs`.
- **`services/gemini.service.ts`** — called from the patient records flow to generate AI summaries of medical records via Google's Generative AI SDK.

---

## 11. Business Logic

| Rule                                     | Description                                                                                                                                                                                                                                                                                                          | Where Implemented                                                                      |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Unique email per user**                | Registration is rejected with `"Email already exists"` if the email is already present in `users`.                                                                                                                                                                                                                   | `AuthService.register*()` methods                                                      |
| **One profile row per user**             | `admins.user_id`, `doctors.user_id`, `staff.user_id`, `patients.user_id` are all UNIQUE — enforcing a strict 1:1 relationship between a `users` row and its role-specific profile.                                                                                                                                   | DB schema constraint                                                                   |
| **No double-booking a slot**             | `appointments` has a composite UNIQUE key on (`doctor_id`, `slot_date`, `start_time`, `confirmation_no`), and a globally unique `confirmation_no`.                                                                                                                                                                   | DB schema constraint + appointment service                                             |
| **One schedule per doctor per day**      | `doctor_schedules` has a UNIQUE key on (`doctor_id`, `working_date`).                                                                                                                                                                                                                                                | DB schema constraint                                                                   |
| **8-state appointment lifecycle**        | `appointment_status` ENUM: `PAYMENT_PENDING → CONFIRMED → CHECKED_IN → IN_PROGRESS → COMPLETED`, with `CANCELLED`, `RESCHEDULED`, and `NO_SHOW` as alternate terminal/branch states. Every transition is expected to be recorded in `appointment_status_history` (`old_status`, `new_status`, `changed_by_user_id`). | `appointment` module + `doctor`/`staff` status-update endpoints                        |
| **Payment status tracking**              | `payments.status` ENUM: `PENDING → SUCCESS/FAILED`, with a separate `refund_status` boolean flag for `REFUNDED` cases.                                                                                                                                                                                               | `staff.markPaymentDone`, `payments` table                                              |
| **1:1 medical record per appointment**   | `medical_records.appointment_id` is UNIQUE — only one record can be created per appointment.                                                                                                                                                                                                                         | DB schema constraint                                                                   |
| **1:1 prescription per medical record**  | `prescriptions.record_id` is UNIQUE.                                                                                                                                                                                                                                                                                 | DB schema constraint                                                                   |
| **File type/size validation on uploads** | Profile images: jpeg/jpg/png/gif only, max 2MB. Medical record/document uploads: jpeg/jpg/png/pdf/txt.                                                                                                                                                                                                               | `src/utils/multer.ts`                                                                  |
| **Role-based route protection**          | Every module (except public auth/contact routes) enforces `authenticate` + a specific role guard before any controller logic runs.                                                                                                                                                                                   | `auth.middleware.ts`                                                                   |
| **Rate limiting on auth endpoints**      | Max 15 requests per IP per 10-minute window on all `/api/v1/auth/*` routes.                                                                                                                                                                                                                                          | `express-rate-limit` in `auth.routes.ts`                                               |
| **Soft delete for contact messages**     | `contactus_messages.is_deleted` flag rather than physical row deletion.                                                                                                                                                                                                                                              | `contactus` module                                                                     |
| **Audit logging**                        | Registration and other sensitive actions are recorded to `audit_logs` via `AuditService.log()`, capturing `performed_by_user_id`, `action`, `entity_name`, `entity_id`, `ip_address`.                                                                                                                                | `services/audit.service.ts`, called from `AuthService` (and presumably other services) |
| **Request validation via Zod**           | Every mutating endpoint that has an associated `*.validators.ts`/`*.validation.ts` file validates `req.body` (or `req.query`) before the controller executes, returning `400` with field-level errors on failure.                                                                                                    | `validateRequestBody` / `validateRequestQuery` middleware                              |
| **No queue/cron jobs found**             | No background job scheduler (e.g. `node-cron`, `bull`, `bullmq`) or dedicated worker process exists in `package.json` or the source tree. Any time-based logic (e.g. appointment reminders) is not implemented as an automated background job.                                                                       | — (absence noted)                                                                      |

---

## 12. Configuration

### Environment Variables

Loaded via `dotenv` in `src/config/index.ts`. **No `.env.example` file exists in the repository**, so the table below is derived entirely from the fallback defaults and usage in `src/config/index.ts`. A `.env` file is present in the uploaded project but is excluded from version control per `.gitignore` (secrets should never be committed).

| Variable               | Purpose                                                              | Default (if unset)         | Required in Production                       |
| ---------------------- | -------------------------------------------------------------------- | -------------------------- | -------------------------------------------- |
| `PORT`                 | HTTP server port                                                     | `3333`                     | No (has default)                             |
| `NODE_ENV`             | Environment name (`DEVELOPMENT`/`PRODUCTION`, used only for logging) | `'DEVELOPMENT'`            | No                                           |
| `SECRET_SESSION`       | Secret used to sign the `express-session` cookie                     | `'SATVA'`                  | **Yes** — must be overridden in production   |
| `LOG_LEVEL`            | Winston log verbosity                                                | `'info'`                   | No                                           |
| `DB_HOST`              | MySQL host                                                           | `'localhost'`              | Yes                                          |
| `DB_PORT`              | MySQL port                                                           | `3306`                     | Yes                                          |
| `DB_NAME`              | MySQL database name                                                  | `''` (empty — must be set) | **Yes**                                      |
| `DB_USER`              | MySQL username                                                       | `''` (empty — must be set) | **Yes**                                      |
| `DB_PASSWORD`          | MySQL password                                                       | `''` (empty — must be set) | **Yes**                                      |
| `REFRESH_TOKEN_SECRET` | JWT signing secret for refresh tokens                                | `''` (empty — must be set) | **Yes**                                      |
| `JWT_SECRET_KEY`       | JWT signing secret for access tokens                                 | `'satva'`                  | **Yes** — must be overridden in production   |
| `GOOGLE_CLIENT_ID`     | Google OAuth Client ID                                               | `''`                       | Required only if Google login is used        |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret                                           | `''`                       | Required only if Google login is used        |
| `GOOGLE_CALLBACKURL`   | Google OAuth callback URL                                            | `''`                       | Required only if Google login is used        |
| `GEMINI_API_KEY`       | Google Generative AI (Gemini) API key                                | `''`                       | Required only for AI record-summary features |

### Configuration Files

- **`.env`** — runtime secrets/config (not committed; must be created manually, see Installation).
- **`tsconfig.json`** — TypeScript compiler options (ESNext target, NodeNext module resolution, strict mode, `rootDir: src`, `outDir: dist`).
- **`.vscode/launch.json` / `.vscode/extensions.json`** — Editor-only VS Code debug/extension configuration (not part of runtime configuration).

### Secrets Required

Database credentials, `JWT_SECRET_KEY`, `REFRESH_TOKEN_SECRET`, `SECRET_SESSION`, and (optionally) Google OAuth credentials and the Gemini API key.

### How Configuration Works

`dotenv.config()` is called once at the top of `src/config/index.ts`, populating `process.env` from the `.env` file. All other modules import the single `env` object from this file rather than reading `process.env` directly — this centralizes configuration and provides safe fallback defaults for non-critical settings.

---

## 13. Installation

> The repository does not include an `.env.example`, seed script, or migration tool. The steps below are inferred from `package.json` scripts and the schema dump file, and are written so a new developer can get the project running.

```bash
# 1. Clone the repository
git clone https://gitlab.taskgrids.com/brijesh.chitroda/satva.git
cd satva

# 2. Install dependencies
npm install

# 3. Create environment variables
# Create a .env file in the project root with at least the following:
cat > .env << 'EOF'
PORT=3333
NODE_ENV=DEVELOPMENT
SECRET_SESSION=replace-with-a-strong-random-secret
LOG_LEVEL=info
DB_HOST=localhost
DB_PORT=3306
DB_NAME=satva_db
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
REFRESH_TOKEN_SECRET=replace-with-a-strong-random-secret
JWT_SECRET_KEY=replace-with-a-strong-random-secret
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACKURL=
GEMINI_API_KEY=
EOF

# 4. Database setup
# Create the database and import the provided schema/data dump.
mysql -u your_mysql_user -p -e "CREATE DATABASE satva_db CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;"
mysql -u your_mysql_user -p satva_db < "satva_db (1).sql"

# 5. Run migrations
# No migration framework is used — the SQL dump above IS the schema.
# Any future schema changes must be applied manually or via a new dump.

# 6. Seed database
# The dump already contains demo/sample data (hospitals, users, admins, etc.).
# To create a fresh Super Admin, use the API instead:
#   POST /api/v1/super-admin/seed-super-admin

# 7. Run development server (hot reload via tsx)
npm run dev

# 8. Run production build
npm run build      # compiles TypeScript -> dist/
npm start          # runs node dist/server.js
```

The server logs `Server is running on http://localhost:<PORT>` on successful startup, and creates the `uploads/` directory tree automatically on first boot if it does not exist.

---

## 14. Running the Project

| Mode                 | Command         | Description                                                                                                                                                                 |
| -------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Development**      | `npm run dev`   | Runs `tsx watch --clear-screen=false src/server.ts` — hot-reloads on file changes, runs TypeScript directly without a separate compile step.                                |
| **Production Build** | `npm run build` | Runs `tsc`, compiling `src/**/*` to `dist/` per `tsconfig.json`.                                                                                                            |
| **Production Run**   | `npm start`     | Runs `node dist/server.js` (requires `npm run build` first).                                                                                                                |
| **Testing**          | `npm test`      | **Not implemented** — the script is a placeholder: `echo "Error: no test specified" && exit 1`. No test framework (Jest, Vitest, Mocha, etc.) is present in `package.json`. |
| **Linting**          | Not configured  | No ESLint/Prettier config files found in the repository.                                                                                                                    |
| **Formatting**       | Not configured  | Same as above — no formatter configuration present.                                                                                                                         |

---

## 15. Error Handling

- **Custom Error Classes:** `HttpException` (base) and six typed subclasses — `BadRequestException` (400), `UnauthorizedException` (401), `ForbiddenException` (403), `NotFoundException` (404), `ConflictException` (409), `InternalServerException` (500) — defined in `src/common/helpers/http-exception.ts`.
- **Error Middleware:** `errorMiddleware` (registered as the final middleware in `src/app.ts`) inspects whether the thrown error is an `HttpException`; if so it uses its `statusCode`, otherwise it defaults to `500`. It always returns `{ success: false, message }` and logs the raw error object to the console (not currently routed through the Winston logger for error-level entries in this handler — see Known Limitations).
- **Validation Errors:** Zod validation failures are intercepted by `validateRequestBody`/`validateRequestQuery` _before_ reaching the controller, returning `400` with `data` containing Zod's `flatten().fieldErrors` and `message` set to the first issue's message — this uses the `generalResponse()` helper, giving validation errors a different (but similar) response shape than `errorMiddleware`'s `{ success, message }` shape.
- **404 Handling:** Any request that doesn't match a defined route is caught by `notFoundMiddleware`, returning `404` with `{ statusCode, message: "Route ... not found", data: null }`.
- **HTTP Response Codes:** Centralized in `src/common/constants/http.constants.ts` (`HttpStatus` object/enum), consumed by both the exception classes and `errorMiddleware`.
- **Logging:** Winston (`src/common/logger.ts`) with `winston-daily-rotate-file` writes to `logs/application-YYYY-MM-DD.log` and `logs/app.log`, used for lifecycle events (`server started running`, `Database connected successfully`) — most in-request errors are currently only sent to `console.log`/`console.error` rather than the structured logger.

---

## 16. Security

| Concern                       | Implementation                                                                                                                                                                                                                                                | Notes                                                                                                                                                                                                                 |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Authentication**            | JWT (access + refresh tokens) and Google OAuth 2.0 via Passport.                                                                                                                                                                                              | Access tokens expire in 1 day; refresh tokens in 15 days and are persisted server-side for revocation capability.                                                                                                     |
| **Authorization**             | Static RBAC via Express middleware chains (see §6).                                                                                                                                                                                                           | Coarse-grained — role-level only, no per-resource ownership checks are visible in the reviewed controllers beyond what's implied by filtering queries with the authenticated user's ID.                               |
| **Password Hashing**          | `bcrypt`, cost factor 10.                                                                                                                                                                                                                                     | Industry-standard.                                                                                                                                                                                                    |
| **Token Validation**          | `jsonwebtoken.verify()` against separate secrets for access vs. refresh tokens; expired-access-token flow gracefully falls back to refresh-token verification.                                                                                                |                                                                                                                                                                                                                       |
| **Input Validation**          | Zod schemas on nearly every mutating endpoint (`validateRequestBody`/`validateRequestQuery`).                                                                                                                                                                 | Not applied uniformly — some routes with request bodies (e.g. a few `PATCH`/`POST` endpoints in `doctor` and `notification` modules) do not have a visible Zod schema wired in.                                       |
| **SQL Injection Protection**  | All SQL uses parameterized queries via `mysql2`'s `pool.execute`/`pool.query` with `?` placeholders — no string concatenation of user input into SQL was observed.                                                                                            |                                                                                                                                                                                                                       |
| **XSS Protection**            | EJS auto-escapes interpolated output (`<%= %>`) by default; the codebase does not appear to disable escaping widely. No dedicated sanitization library (e.g. `dompurify`, `xss-clean`) is present.                                                            |                                                                                                                                                                                                                       |
| **CSRF**                      | **Not implemented.** No CSRF token middleware (e.g. `csurf`) was found.                                                                                                                                                                                       | Because the primary auth mechanism is a Bearer JWT (not solely cookies) for the API, CSRF risk is reduced for `/api/v1/*`, but the session-cookie-based flows (Google OAuth, EJS forms) are not explicitly protected. |
| **Rate Limiting**             | `express-rate-limit` applied only to the `/api/v1/auth/*` router (15 req / 10 min per IP).                                                                                                                                                                    | No rate limiting elsewhere (e.g. login-adjacent endpoints outside `/auth`, or the OTP endpoints registered via `AuthPageRoutes`).                                                                                     |
| **CORS**                      | **Not configured.** No `cors` package or explicit CORS headers were found in `package.json` or `app.ts`.                                                                                                                                                      | The app is designed to be same-origin (EJS pages call the API on the same host), which may be why CORS wasn't needed — but it should be added if a separate frontend origin is ever introduced.                       |
| **File Validation**           | Multer `fileFilter`/`imageFilter` restrict file extensions and cap image size at 2MB.                                                                                                                                                                         | Filtering is extension-based (`path.extname`), not MIME-type/content-based, which is a weaker guarantee against spoofed file types.                                                                                   |
| **Session Secret Hardcoding** | A **hardcoded** session secret (`"scret"`) is used in the _first_ `session()` call in `app.ts` (before the upload-folder bootstrap logic), separate from the second, properly configured `session({ secret: env.SESSION_SECRET, ... })` call that follows it. | See Known Limitations — likely leftover/dead code, but present in the shipped file.                                                                                                                                   |

---

## 17. Dependencies

### Runtime Dependencies (`dependencies`)

| Package                     | Purpose                                                                  |
| --------------------------- | ------------------------------------------------------------------------ |
| `@google/generative-ai`     | Google Gemini SDK — powers AI medical-record summarization.              |
| `bcrypt`                    | Password hashing.                                                        |
| `cookie-parser`             | Parses `Cookie` header (used to read the refresh-token cookie).          |
| `dotenv`                    | Loads `.env` file into `process.env`.                                    |
| `ejs`                       | Server-side templating engine for all rendered views.                    |
| `express`                   | Core web framework.                                                      |
| `express-rate-limit`        | Rate limiting on auth routes.                                            |
| `express-session`           | Session middleware (used for Passport/Google OAuth flow).                |
| `jsonwebtoken`              | JWT signing/verification for access & refresh tokens.                    |
| `libphonenumber-js`         | Phone number parsing/validation (supports the country-code dropdown UX). |
| `multer`                    | Multipart/form-data file upload handling.                                |
| `mysql2`                    | MySQL driver with Promise-based pooling.                                 |
| `passport`                  | Authentication middleware framework.                                     |
| `passport-google-oauth20`   | Google OAuth 2.0 strategy for Passport.                                  |
| `winston`                   | Structured application logging.                                          |
| `winston-daily-rotate-file` | Daily-rotated log file transport for Winston.                            |
| `zod`                       | Schema declaration and validation for request bodies/queries.            |

### Development Dependencies (`devDependencies`)

| Package                                                                                                                              | Purpose                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| `typescript`                                                                                                                         | TypeScript compiler.                                             |
| `tsx`                                                                                                                                | Fast TypeScript execution with watch mode for local development. |
| `@types/*` (bcrypt, cookie-parser, ejs, express, express-session, jsonwebtoken, multer, node, passport, passport-google-oauth20, pg) | Type definitions for the corresponding packages.                 |

> Note: `@types/pg` is present despite the project using MySQL (`mysql2`), not PostgreSQL — this appears to be an unused/leftover dependency.

---

## 18. Complete User Flow (Patient Example)

1. **Landing:** A visitor hits `/` and is served `index.ejs` (public landing page), with `/about`, `/contact`, and `/doctors` (public doctor listing) also accessible without authentication.
2. **Registration:** The visitor navigates to `/register` (EJS page), submits the form, which calls `POST /api/v1/auth/register`. The backend creates a `users` row (`role = PATIENT`) and a linked `patients` row, hashes the password, and returns a JWT.
3. **Login:** The user logs in via `/login`, calling `POST /api/v1/auth/login`. On success, the frontend receives an access token (stored client-side, likely `localStorage`/memory, based on the Bearer-token pattern) and a refresh-token cookie is set by the server.
4. **Dashboard:** The frontend redirects to `/patient/dashboard`, an EJS page that on load fires AJAX calls (from `public/js/*.js`) to endpoints like `GET /api/v1/patient/profile` and `GET /api/v1/notifications/unread/count`, using the stored access token as a Bearer header.
5. **Doctor Search:** The patient visits `/patient/doctors`, which calls `GET /api/v1/patient/doctors` with query filters validated by `search_doctors_schema` (e.g. specialty, hospital).
6. **Booking:** The patient selects a doctor and available slot (`GET /api/v1/appointments/slots`), then submits `POST /api/v1/appointments` to book. The backend validates slot availability against `doctor_schedules`, `doctor_leaves`, `doctor_status`, and existing `appointments`, generates a `confirmation_no`, and inserts the appointment with status `PAYMENT_PENDING` or `CONFIRMED` (per the ENUM).
7. **Notification:** A notification row is (expected to be) created for the relevant users via the `notification` module logic.
8. **Consultation:** On the appointment date, hospital staff check the patient in (`PUT /api/v1/staff/appointments/:id/checkin`), or for telemedicine appointments, a session is created/started via the `telemedicine` module.
9. **Medical Record:** After the consultation, the doctor creates a medical record (`POST /api/v1/doctor/post-medical-records`) with diagnosis, notes, optional file attachments, and optionally a prescription.
10. **Post-visit:** The patient can view the record and an AI-generated summary (`GET /api/v1/patient/records/:id/summary`), and view payment status (`GET /api/v1/patient/payments`).

---

## 19. Admin Flow

1. **Login:** Admin logs in via `/admin/login` → `POST /api/v1/auth/login` (admin accounts share the same `users`/login endpoint; role differentiation happens via the `role` column and subsequent RBAC checks).
2. **Dashboard/Stats:** Admin views hospital-wide statistics at `/admin/stats` → `GET /api/v1/admin/stats`.
3. **Doctor Management:** Admin views the doctor roster (`/admin/doctors` → `GET /api/v1/admin/showDoctors`), adds a new doctor (`/admin/add-doctor` → `POST /api/v1/admin/addDoctor`, validated by `addDoctorSchema`), edits an existing doctor (`PUT /api/v1/admin/doctors/:doctorId`), or deactivates/reactivates one (`PUT /api/v1/admin/toggleDoctorStatus/:id`).
4. **Staff Management:** Admin adds front-desk staff (`/admin/add-staff` → `POST /api/v1/admin/addStaff`, validated by `addStaffSchema`) and reviews the staff list (`/admin/staffs` → `GET /api/v1/admin/fetchStaff`).
5. **Patient/Appointment Oversight:** Admin can view all patients (`/admin/patients`) and all appointments (`/admin/appointments`) for their hospital, drilling into individual records.
6. **Hospital Settings:** Admin updates hospital-level settings at `/admin/settings` → `PUT /api/v1/admin/hospital`, validated by `updateHospitalSettingsSchema`.
7. **Compliance:** Admin reviews `/admin/audit-logs` → `GET /api/v1/admin/fetchAuditLogs` to see a trail of sensitive actions recorded by `AuditService`.

---

## 20. Folder Dependency Flow

```mermaid
flowchart LR
    Views["src/views (EJS)"] -->|rendered by| PageControllers["*.page.controller.ts"]
    PageControllers -->|registered by| PageRoutes["*.page.routes.ts"]
    PublicJS["public/js/*.js"] -->|fetch/AJAX| ApiRoutes["*.routes.ts (API)"]
    ApiRoutes --> Middleware["common/middlewares<br/>(auth, validation)"]
    Middleware --> Controllers["*.controller.ts"]
    Controllers --> Services["*.service.ts"]
    Services --> Repositories["*.repository.ts"]
    Repositories --> DBConn["database/connection.ts"]
    DBConn --> MySQL[(MySQL)]
    Services --> Common["common/helpers<br/>(HttpException, generalResponse)"]
    Services --> ExternalServices["services/<br/>(audit.service, gemini.service)"]
    App["app.ts"] --> PageRoutes
    App --> ApiRoutes
    Server["server.ts"] --> App
    Server --> DBConn
```

- `server.ts` depends on `app.ts` and `database/connection.ts`.
- `app.ts` depends on every module's `*.routes.ts` and `*.page.routes.ts`, plus global `common/middlewares`.
- Each module's `*.routes.ts` depends on its own `*.controller.ts`, relevant `common/middlewares`, its `validators/`, and (where applicable) `utils/multer.ts` or its own upload util.
- Each `*.controller.ts` depends only on its sibling `*.service.ts` and `common/helpers` (for exceptions/responses).
- Each `*.service.ts` depends on its sibling `*.repository.ts` and cross-cutting `services/` (e.g. `AuditService`).
- Each `*.repository.ts` depends only on `database/connection.ts`.
- No module directly imports another module's repository — cross-module data access (if any) goes through service-to-service calls (e.g. `staff.routes.ts` imports `AdminController` directly in one instance, which is a minor architectural inconsistency — see Known Limitations).

---

## 21. Code Flow

From the moment an HTTP request reaches the server until a response is returned:

1. Node's HTTP server (created in `server.ts` via `createServer(app)`) receives the raw request.
2. Express's middleware stack in `app.ts` runs in registration order: static file serving → `express.json()` → session (first, hardcoded-secret instance) → `express.urlencoded()` → static (again) → `cookieParser()` → static (again) → upload-folder existence check (only runs once, synchronously, at startup — not per-request) → session (second, properly configured instance) → Passport init/session.
3. Express matches the request path against the mounted routers in the order they were registered: `/admin` (page), `/staff` (page), `/api/v1` (all API modules), `/` (index), `/super-admin` (page), `/hospital` (page), `/about`, `/contact`, `/patient` (page), `/doctor` (page), `/` (auth pages).
4. If the path matches an `/api/v1/*` route, control passes into `buildApiRouter()`, which further routes to the specific module (e.g. `AppointmentRoutes`).
5. Module-level middleware runs (auth guard(s), then Zod validation, then Multer if applicable).
6. The matched controller method executes, typically wrapped in a `try/catch` (or relying on Express 5's native promise-rejection handling, given Express `^5.2.1` auto-forwards rejected async handlers to error middleware).
7. The controller calls its service; the service calls its repository; the repository executes SQL against the shared connection pool and returns rows.
8. The controller builds a response via `generalResponse()` (success) or throws an `HttpException` (failure), or for page controllers, calls `res.render('view-name', { data })`.
9. If an error was thrown anywhere in the chain, Express skips to `errorMiddleware` (registered last).
10. If no route matched at all, `notFoundMiddleware` returns a 404.
11. The response is serialized (JSON or rendered HTML) and sent back over the original HTTP connection.

---

## 22. Sequence Diagrams

### 22.1 Login

```mermaid
sequenceDiagram
    participant U as User
    participant R as AuthRoutes
    participant C as AuthController
    participant S as AuthService
    participant Repo as UserRepository
    participant DB as MySQL

    U->>R: POST /api/v1/auth/login
    R->>C: login(req, res)
    C->>S: login({email, password})
    S->>Repo: findUserByEmail(email)
    Repo->>DB: SELECT * FROM users WHERE email = ?
    DB-->>Repo: user row
    Repo-->>S: user
    alt user not found or password mismatch
        S-->>C: throw UnauthorizedException
        C-->>U: 401 { success:false, message }
    else success
        S->>S: sign() + signRefreshToken()
        S->>Repo: save refresh token (user_sessions)
        Repo->>DB: INSERT INTO user_sessions
        S-->>C: { accessToken, user }
        C-->>U: 200 { statusCode, message, data } + Set-Cookie refreshToken
    end
```

### 22.2 Registration (Patient)

```mermaid
sequenceDiagram
    participant U as User
    participant R as AuthRoutes
    participant C as AuthController
    participant S as AuthService
    participant Repo as UserRepository
    participant DB as MySQL
    participant Audit as AuditService

    U->>R: POST /api/v1/auth/register
    R->>C: register(req, res)
    C->>S: register(body)
    S->>Repo: findUserByEmail(email)
    Repo->>DB: SELECT ...
    DB-->>Repo: null
    S->>S: getHashedPassword(password)
    S->>Repo: createUser(email, hash, 'PATIENT')
    Repo->>DB: INSERT INTO users
    S->>Repo: createPatient(userId, ...)
    Repo->>DB: INSERT INTO patients
    S->>Audit: log(USER_LOGIN/REGISTER event)
    Audit->>DB: INSERT INTO audit_logs
    S->>S: sign() accessToken
    S-->>C: { accessToken, user }
    C-->>U: 200 response
```

### 22.3 Create Resource (Book Appointment)

```mermaid
sequenceDiagram
    participant P as Patient
    participant R as AppointmentRoutes
    participant C as AppointmentController
    participant S as AppointmentService
    participant Repo as AppointmentRepository
    participant DB as MySQL

    P->>R: POST /api/v1/appointments (patientAuth)
    R->>C: bookAppointment(req,res)
    C->>S: bookAppointment(patientId, payload)
    S->>Repo: checkSlotAvailability(doctorId, date, time)
    Repo->>DB: SELECT (schedules, leaves, existing appointments)
    DB-->>Repo: availability data
    alt slot unavailable
        S-->>C: throw BadRequestException
        C-->>P: 400
    else slot available
        S->>S: generateConfirmationNumber()
        S->>Repo: insertAppointment(...)
        Repo->>DB: INSERT INTO appointments
        S-->>C: appointment
        C-->>P: 201/200 { data: appointment }
    end
```

### 22.4 Update Resource (Reschedule Appointment)

```mermaid
sequenceDiagram
    participant P as Patient
    participant R as AppointmentRoutes
    participant C as AppointmentController
    participant S as AppointmentService
    participant Repo as AppointmentRepository
    participant DB as MySQL

    P->>R: PATCH /api/v1/appointments/:id/reschedule
    R->>C: rescheduleAppointment(req,res)
    C->>S: reschedule(id, newSlot, patientId)
    S->>Repo: findAppointmentById(id)
    Repo->>DB: SELECT * FROM appointments WHERE appointment_id=?
    DB-->>Repo: appointment
    S->>S: verify ownership (patient_id matches)
    S->>Repo: checkNewSlotAvailability(...)
    S->>Repo: updateAppointment(id, newSlot, status='RESCHEDULED')
    Repo->>DB: UPDATE appointments SET ...
    S->>Repo: insertStatusHistory(id, old, 'RESCHEDULED')
    Repo->>DB: INSERT INTO appointment_status_history
    S-->>C: updated appointment
    C-->>P: 200 { data }
```

### 22.5 Delete Resource (Remove Family Member)

```mermaid
sequenceDiagram
    participant P as Patient
    participant R as PatientRoutes
    participant C as PatientController
    participant S as PatientService
    participant Repo as PatientRepository
    participant DB as MySQL

    P->>R: DELETE /api/v1/patient/family/:memberId (patientAuth)
    R->>C: deleteFamilyMember(req,res)
    C->>S: deleteFamilyMember(patientId, memberId)
    S->>Repo: verifyOwnership(patientId, memberId)
    Repo->>DB: SELECT * FROM family_members WHERE member_id=? AND patient_id=?
    DB-->>Repo: row / null
    alt not owned
        S-->>C: throw ForbiddenException
        C-->>P: 403
    else owned
        S->>Repo: deleteById(memberId)
        Repo->>DB: DELETE FROM family_members WHERE member_id=?
        S-->>C: success
        C-->>P: 200 { message: "Deleted" }
    end
```

### 22.6 File Upload (Medical Record with Attachments)

```mermaid
sequenceDiagram
    participant D as Doctor
    participant R as DoctorRoutes
    participant MU as Multer (uploadMedicalRecords)
    participant C as DoctorController
    participant S as DoctorService
    participant Repo as DoctorRepository
    participant DB as MySQL
    participant FS as Disk (uploads/medical_records)

    D->>R: POST /api/v1/doctor/post-medical-records (multipart/form-data)
    R->>MU: files[] upload
    MU->>FS: write files to uploads/medical_records/
    MU-->>R: req.files populated
    R->>C: postPatientMedicalRecords(req,res)
    C->>S: createMedicalRecord(doctorId, body, files)
    S->>Repo: insertMedicalRecord(appointmentId, doctorId, patientId, diagnosis, notes)
    Repo->>DB: INSERT INTO medical_records
    loop for each uploaded file
        S->>Repo: insertAttachment(recordId, fileName, filePath)
        Repo->>DB: INSERT INTO medical_record_attachments
    end
    S-->>C: created record
    C-->>D: 201 { data: record }
```

---

## 23. Conclusion

Satva is a TypeScript/Express, MySQL-backed, multi-tenant Hospital Appointment Booking System that cleanly separates concerns into an 11-module, layered (Route → Controller → Service → Repository) backend, with parallel EJS "page" controllers for server-rendered UI and a JSON REST API under `/api/v1` consumed by vanilla JavaScript on the client. It implements a real-world set of hospital operations — multi-hospital tenancy, five distinct user roles with JWT + RBAC security, appointment booking with slot-availability and status-history tracking, medical records with AI-assisted (Gemini) summaries, telemedicine session management, and hospital administration/audit tooling — atop a 31-table relational schema with proper foreign keys and uniqueness constraints. The codebase is functional and reasonably well-organized for a team-built MVP, but currently lacks tests, linting, CI/CD, and a few security hardening measures (CORS, CSRF, content-based file validation) that a production rollout should address, as detailed in the Future Improvements and Known Limitations sections above.

---

## 24. Live Application Visual Demo & Feature Showcase

The following visual showcase demonstrates the complete end-to-end functionality of the Satva Hospital Appointment Booking System, captured live from the running application with EJS and MySQL. All 38 screenshots are archived in the `media/` directory.

---

### 24.1 🌟 Public Discovery & Patient Portal

#### Home / Landing Page
> **Feature Description**: Welcome hero banner with emergency helplines, quick doctor search bar, specialty discovery, and interactive health services overview.

<p align="center">
  <img src="media/01_landing_page.png" alt="Home / Landing Page" width="900" />
</p>

#### About Satva Hospital
> **Feature Description**: Institutional background, clinical vision, multi-specialty certifications, and excellence in patient care standards.

<p align="center">
  <img src="media/02_about_page.png" alt="About Satva Hospital" width="900" />
</p>

#### Contact Us & Emergency Inquiries
> **Feature Description**: Interactive patient communication form, hospital branch locations, 24/7 emergency contact lines, and support desk.

<p align="center">
  <img src="media/03_contact_page.png" alt="Contact Us & Emergency Inquiries" width="900" />
</p>

#### Find Doctors & Specialty Directory
> **Feature Description**: Comprehensive doctor search engine with medical specialty filter, experience badges, consultation fees, and direct booking actions.

<p align="center">
  <img src="media/04_find_doctors_directory.png" alt="Find Doctors & Specialty Directory" width="900" />
</p>

---

### 24.2 🔐 Multi-Role Authentication & Security Portals

#### Patient Sign-In Portal
> **Feature Description**: Secure credential login with Google OAuth 2.0 integration, password visibility toggle, remember-me support, and JWT authentication.

<p align="center">
  <img src="media/05_patient_login.png" alt="Patient Sign-In Portal" width="900" />
</p>

#### Patient Registration & Onboarding
> **Feature Description**: New patient sign-up featuring international phone formatting, country code selector, date of birth validation, and profile creation.

<p align="center">
  <img src="media/06_patient_register.png" alt="Patient Registration & Onboarding" width="900" />
</p>

#### Password Recovery Request
> **Feature Description**: Self-service password recovery initiating a 6-digit OTP dispatched to the patient's registered email address.

<p align="center">
  <img src="media/07_forgot_password.png" alt="Password Recovery Request" width="900" />
</p>

#### OTP Verification & Password Reset
> **Feature Description**: Interactive 6-digit verification screen with countdown timer, auto-focus digit inputs, and new password confirmation.

<p align="center">
  <img src="media/08_enter_otp_page.png" alt="OTP Verification & Password Reset" width="900" />
</p>

#### Doctor Secure Login Portal
> **Feature Description**: Dedicated clinical staff sign-in interface authenticating registered hospital doctors with role-based dashboard access.

<p align="center">
  <img src="media/09_doctor_login.png" alt="Doctor Secure Login Portal" width="900" />
</p>

#### Super Admin Platform Login
> **Feature Description**: Highest-privilege authentication portal for multi-hospital SaaS platform management and tenant administration.

<p align="center">
  <img src="media/10_super_admin_login.png" alt="Super Admin Platform Login" width="900" />
</p>

---

### 24.3 🩺 Patient Dashboard & Appointment Booking Flow

#### Patient Main Dashboard
> **Feature Description**: Personalized patient overview highlighting upcoming visits, quick appointment booking cards, doctor recommendations, and recent activity.

<p align="center">
  <img src="media/11_patient_dashboard.png" alt="Patient Main Dashboard" width="900" />
</p>

#### Interactive Appointment Booking & Slot Picker
> **Feature Description**: Multi-step booking engine allowing patients to pick a doctor, choose consultation date, select 30-min available time slots, and describe chief complaints.

<p align="center">
  <img src="media/12_patient_book_appointment.png" alt="Interactive Appointment Booking & Slot Picker" width="900" />
</p>

#### My Appointments & Status Ledger
> **Feature Description**: Real-time appointment ledger displaying appointment status badges (Confirmed, Checked-In, Completed), confirmation numbers, reschedule, and cancel options.

<p align="center">
  <img src="media/13_patient_my_appointments.png" alt="My Appointments & Status Ledger" width="900" />
</p>

#### Digital Medical Records Timeline
> **Feature Description**: Chronological health record timeline displaying previous consultations, primary diagnoses, doctor notes, and attached medical reports.

<p align="center">
  <img src="media/14_patient_medical_records.png" alt="Digital Medical Records Timeline" width="900" />
</p>

#### Consultation Record Details & AI Summary
> **Feature Description**: In-depth consultation review showing examination notes, digital prescription lines (medicine, dosage, frequency), and Google Gemini AI clinical summaries.

<p align="center">
  <img src="media/15_patient_record_details.png" alt="Consultation Record Details & AI Summary" width="900" />
</p>

#### Patient Profile & Health Insurance
> **Feature Description**: Patient demographics, blood group, emergency contact details, and policy document upload for cashless hospital treatments.

<p align="center">
  <img src="media/16_patient_profile.png" alt="Patient Profile & Health Insurance" width="900" />
</p>

#### In-App Notifications & Alerts
> **Feature Description**: Real-time alert center for consultation confirmations, reminder alerts, telemedicine links, and status change notices.

<p align="center">
  <img src="media/17_patient_notifications.png" alt="In-App Notifications & Alerts" width="900" />
</p>

#### Patient Billing & Payment Ledger
> **Feature Description**: Digital receipt ledger tracking transaction IDs, amounts, payment modes (UPI, Card, Net Banking), and payment statuses.

<p align="center">
  <img src="media/18_patient_payments.png" alt="Patient Billing & Payment Ledger" width="900" />
</p>

---

### 24.4 👨‍⚕️ Doctor Clinical Dashboard & Medical Records

#### Doctor Daily Clinical Dashboard
> **Feature Description**: Doctor command center featuring today's queue of patients, consultation stats, scheduled appointments breakdown, and quick action controls.

<p align="center">
  <img src="media/19_doctor_dashboard.png" alt="Doctor Daily Clinical Dashboard" width="900" />
</p>

#### Doctor Profile & Qualifications
> **Feature Description**: Verified doctor credentials including medical degrees (MBBS, MD, DM), graduation years, college institutions, and consultation fees.

<p align="center">
  <img src="media/20_doctor_profile.png" alt="Doctor Profile & Qualifications" width="900" />
</p>

#### Weekly Schedule & Shift Configuration
> **Feature Description**: Working hours management tool enabling doctors to configure working days, shift start/end hours, and 30-minute consultation intervals.

<p align="center">
  <img src="media/21_doctor_profile_edit.png" alt="Weekly Schedule & Shift Configuration" width="900" />
</p>

#### Create Consultation Record & Prescriptions
> **Feature Description**: Clinical documentation form for recording patient diagnoses, examination notes, attached diagnostic lab files, and structured prescriptions.

<p align="center">
  <img src="media/22_doctor_create_medical_record.png" alt="Create Consultation Record & Prescriptions" width="900" />
</p>

#### Patient Medical History Archive
> **Feature Description**: Doctor medical records lookup enabling practitioners to review patient historical diagnoses and previous treatment summaries.

<p align="center">
  <img src="media/23_doctor_patient_medical_records.png" alt="Patient Medical History Archive" width="900" />
</p>

---

### 24.5 🏥 Hospital Administration & Operations Management

#### Doctor Roster & Status Management
> **Feature Description**: Hospital-wide doctor directory featuring specialty badges, contact numbers, and live active/deactivated status toggles.

<p align="center">
  <img src="media/24_admin_doctors_management.png" alt="Doctor Roster & Status Management" width="900" />
</p>

#### Onboard New Medical Specialist
> **Feature Description**: Administrative form to onboard doctors with credentials, consultation fees, bio, hospital branch, and profile photos.

<p align="center">
  <img src="media/25_admin_add_doctor.png" alt="Onboard New Medical Specialist" width="900" />
</p>

#### Hospital Patient Master Directory
> **Feature Description**: Master patient registry with insurance status tags, demographic records, contact numbers, and appointment logs.

<p align="center">
  <img src="media/26_admin_patients_directory.png" alt="Hospital Patient Master Directory" width="900" />
</p>

#### Hospital Staff Roster Management
> **Feature Description**: Staff directory showing receptionists and nursing team members with assigned department roles and phone numbers.

<p align="center">
  <img src="media/27_admin_staff_management.png" alt="Hospital Staff Roster Management" width="900" />
</p>

#### Onboard Front-Desk Staff & Nurses
> **Feature Description**: Administrative staff provisioning form with role assignments (Receptionist, Nurse), gender, and address details.

<p align="center">
  <img src="media/28_admin_add_staff.png" alt="Onboard Front-Desk Staff & Nurses" width="900" />
</p>

#### Hospital Appointments Ledger
> **Feature Description**: Master operational appointments ledger covering all doctors and departments with live status tracking and doctor re-assignments.

<p align="center">
  <img src="media/29_admin_appointments_management.png" alt="Hospital Appointments Ledger" width="900" />
</p>

#### Hospital Profile & Operational Settings
> **Feature Description**: Hospital profile management including facility name, address, contact numbers, and billing configurations.

<p align="center">
  <img src="media/30_admin_hospital_settings.png" alt="Hospital Profile & Operational Settings" width="900" />
</p>

#### Security & Compliance Audit Logs
> **Feature Description**: System-wide compliance audit log capturing user logins, schedule updates, status changes, and originating IP addresses.

<p align="center">
  <img src="media/31_admin_audit_logs.png" alt="Security & Compliance Audit Logs" width="900" />
</p>

---

### 24.6 📋 Front-Desk Reception & Patient Check-In

#### Front-Desk Patient Check-In & Queue
> **Feature Description**: Front-desk operations interface for searching appointments via Confirmation Number, marking patient check-ins, and collecting payments.

<p align="center">
  <img src="media/32_staff_appointments_checkin.png" alt="Front-Desk Patient Check-In & Queue" width="900" />
</p>

#### Patient Intake & Identity Verification
> **Feature Description**: Receptionist patient directory allowing staff to verify identity, insurance policy numbers, and emergency contact numbers.

<p align="center">
  <img src="media/33_staff_patients_list.png" alt="Patient Intake & Identity Verification" width="900" />
</p>

#### Doctors On-Duty Overview
> **Feature Description**: Real-time doctor duty roster indicating available practitioners, consultation shift timings, and clinic room allocations.

<p align="center">
  <img src="media/34_staff_doctors_duty.png" alt="Doctors On-Duty Overview" width="900" />
</p>

---

### 24.7 🌐 Super Admin & Multi-Hospital SaaS Governance

#### Super Admin Multi-Hospital Platform Overview
> **Feature Description**: Global platform analytics reporting total onboarded hospital tenants, platform appointments, active doctors, and gross revenue.

<p align="center">
  <img src="media/35_super_admin_dashboard.png" alt="Super Admin Multi-Hospital Platform Overview" width="900" />
</p>

#### Provision Hospital Administrator
> **Feature Description**: Provisioning interface to create hospital administrator user accounts and assign them to specific hospital tenants.

<p align="center">
  <img src="media/36_super_admin_create_admin.png" alt="Provision Hospital Administrator" width="900" />
</p>

#### Onboard Hospital Tenant
> **Feature Description**: Multi-tenant onboarding form to register new hospital organizations with facility details, contact emails, and address.

<p align="center">
  <img src="media/37_super_admin_create_hospital.png" alt="Onboard Hospital Tenant" width="900" />
</p>

#### Hospital Tenants Directory
> **Feature Description**: Master directory of all hospital entities registered in the system with tenancy controls and administrative details.

<p align="center">
  <img src="media/38_super_admin_hospitals_list.png" alt="Hospital Tenants Directory" width="900" />
</p>

---

