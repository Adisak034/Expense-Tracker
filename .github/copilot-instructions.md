# Copilot Instructions for Expense Tracker

## Project Overview
This is a Node.js/Express application for managing personal expenses with user authentication, OCR capabilities, and modern UI. It uses MySQL for data storage and integrates with external OCR services for receipt processing. The application features a complete authentication system, responsive design with SweetAlert2 notifications, and comprehensive user profile management.

## Architecture & Data Flow
- **Database:**
  - MySQL 8.0 running in Docker container (`expense-mysql`)
  - `database.js` manages MySQL connection pooling and table initialization
  - Tables: `users` (id, username, email, password_hash, created_at), `expenses` (id, user_id, item, amount, expense_date, category, created_at)
  - Foreign key relationship: expenses.user_id -> users.id with CASCADE delete
  - Environment variables for database configuration (see `.env` file)
  - phpMyAdmin available at localhost:8080 for database management
- **Backend:**
  - `server.js` is the main entry point with Express routes for expenses, OCR, and authentication
  - `auth.js` handles user registration, login, profile management with bcrypt password hashing (12 salt rounds)
  - Session-based authentication with express-session and secure cookie configuration
  - Protected routes require authentication middleware (`requireAuth`)
  - OCR uploads handled via `/api/ocr/upload` with n8n webhook integration
  - API endpoints: auth (register/login/profile/logout), expenses (CRUD), OCR (upload)
- **Frontend:**
  - Static files served from `public/` directory
  - Pages: `login.html`, `register.html`, `index.html` (landing), `add.html`, `dashboard.html`, `profile.html`
  - Client-side logic in `public/js/` (main.js, add.js, dashboard.js) with SweetAlert2 integration
  - Responsive CSS with mobile-first design in `public/css/style.css`
  - Bottom navigation with 4 main sections: Home, Add, Dashboard, Profile
  - Clean UI without header clutter - all user management centralized in profile page
- **Uploads:**
  - Temporary file storage in `uploads/` directory for OCR processing
  - Automatic file cleanup after processing (success or error)

## Developer Workflows
- **Database Setup:**
  - Start MySQL container: `docker run --name expense-mysql -e MYSQL_ROOT_PASSWORD=rootpassword -e MYSQL_DATABASE=expense_tracker -e MYSQL_USER=expense_user -e MYSQL_PASSWORD=mypassword -p 3306:3306 -d mysql:8.0`
  - Optional phpMyAdmin: `docker run --name phpmyadmin -d --link expense-mysql:db -p 8080:80 phpmyadmin/phpmyadmin`
  - Database tables are auto-created on application startup via `initializeDatabase()`
- **Start the server:**
  - Install dependencies: `npm install`
  - Configure environment: Update `.env` with database credentials
  - Start development server: `npm start` (runs `node server.js`)
  - Application runs on `http://localhost:3000`
  - phpMyAdmin (if running) available at `http://localhost:8080`
- **Environment Configuration:**
  - `.env` file contains database credentials, session secret, OCR webhook URL
  - MySQL connection: expense_user/mypassword@localhost:3306/expense_tracker
  - Session secret for secure authentication
  - n8n webhook URL for OCR processing
- **Authentication Flow:**
  - Users must register/login to access protected routes
  - bcrypt password hashing with 12 salt rounds
  - Express-session for persistent login state
  - Automatic redirect to login for unauthenticated requests
  - Profile page includes user statistics and account management

## Project-Specific Patterns
- All API endpoints return JSON responses with a `message` and `data` field.
- Uploaded files are always deleted after OCR processing (success or error).
- Dates for expenses are stored in `YYYY-MM-DD` format.
- The backend expects form uploads for OCR under the field name `ocrFile`.

## External Dependencies
- **Backend Core:** Express v5.1.0, MySQL2 v3.15.2 (see `package.json`)
- **Authentication:** bcrypt v5.1.1 (password hashing), express-session v1.18.1 (session management)
- **File Handling:** Multer v2.0.2 (file uploads), Axios v1.12.2 + Form-Data v4.0.0 (OCR integration)
- **Frontend Enhancement:** SweetAlert2 v11 (CDN) for beautiful UI notifications and confirmations
- **Database & DevOps:** Docker (MySQL 8.0 + phpMyAdmin containers)
- **External Services:** n8n workflow for OCR processing (webhook integration)

## Key Files & Directories
- **Backend Core:**
  - `server.js`: Main server logic and API routes (auth, expenses, OCR)
  - `database.js`: MySQL connection pooling and schema initialization
  - `auth.js`: Authentication middleware and user management functions
- **Frontend Assets (`public/`):**
  - `index.html`: Landing page with clean navigation
  - `login.html`, `register.html`: Authentication pages
  - `add.html`: Expense entry form with OCR upload
  - `dashboard.html`: Expense overview and management
  - `profile.html`: User profile, statistics, and account settings
  - `css/style.css`: Responsive CSS with mobile-first design
  - `js/main.js`: Common authentication and navigation logic
  - `js/add.js`: Expense creation and OCR functionality
  - `js/dashboard.js`: Dashboard data display and management
- **Configuration & Storage:**
  - `.env`: Database credentials, session secrets, OCR webhook URL
  - `uploads/`: Temporary OCR file storage (auto-cleanup)
  - `README.md`: Comprehensive project documentation
  - `.github/copilot-instructions.md`: This development guide

## Example: Adding an Expense (Authenticated)
- POST `/api/expenses` with `{ "item": "Lunch", "amount": 12.5, "category": "Food" }`
- Requires valid user session

## Example: User Registration
- POST `/api/auth/register` with `{ "username": "john", "email": "john@example.com", "password": "securepass" }`

## Example: Uploading for OCR
- POST `/api/ocr/upload` with a file field named `ocrFile`

---
For unclear or missing conventions, ask the user for clarification before making assumptions.
