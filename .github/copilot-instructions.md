# Copilot Instructions for Expense Tracker

## Project Overview
This is a Node.js/Express application for managing personal expenses with user authentication, OCR capabilities, and modern UI. It uses MySQL for data storage and integrates with external OCR services for receipt processing.

## Architecture & Data Flow
- **Database:**
  - MySQL 8.0 running in Docker container
  - `database.js` manages MySQL connection pooling and table initialization
  - Tables: `users` (authentication), `expenses` (user expense records with foreign keys)
  - Environment variables for database configuration (see `.env` file)
- **Backend:**
  - `server.js` is the main entry point with Express routes for expenses, OCR, and authentication
  - `auth.js` handles user registration, login, profile management with bcrypt password hashing
  - Session-based authentication with express-session
  - Protected routes require authentication middleware
  - OCR uploads handled via `/api/ocr/upload` with external service integration
- **Frontend:**
  - Static files served from `public/` directory
  - Pages: `login.html`, `register.html`, `index.html`, `add.html`, `dashboard.html`, `profile.html`
  - Client-side logic in `public/js/` with SweetAlert2 integration for notifications
  - Responsive CSS with mobile-first design in `public/css/style.css`
  - Bottom navigation with 4 main sections
- **Uploads:**
  - Temporary file storage in `uploads/` directory for OCR processing

## Developer Workflows
- **Database Setup:**
  - Start MySQL container: `docker run --name expense-mysql -e MYSQL_ROOT_PASSWORD=rootpassword -e MYSQL_DATABASE=expense_tracker -e MYSQL_USER=expense_user -e MYSQL_PASSWORD=mypassword -p 3306:3306 -d mysql:8.0`
  - Database tables are auto-created on application startup
- **Start the server:**
  - Install dependencies: `npm install`
  - Start development server: `npm start` (runs `node server.js`)
  - Application runs on `http://localhost:3000`
- **Environment Configuration:**
  - Copy `.env.example` to `.env` and configure database settings
  - Set OCR service URL if using external OCR integration
- **Authentication:**
  - Users must register/login to access the application
  - Session-based authentication with secure password hashing

## Project-Specific Patterns
- All API endpoints return JSON responses with a `message` and `data` field.
- Uploaded files are always deleted after OCR processing (success or error).
- Dates for expenses are stored in `YYYY-MM-DD` format.
- The backend expects form uploads for OCR under the field name `ocrFile`.

## External Dependencies
- Express, Multer, Axios, Form-Data, MySQL2 (see `package.json`)
- bcrypt for password hashing, express-session for session management
- SweetAlert2 for beautiful UI notifications and confirmations
- Docker for MySQL container deployment

## Key Files & Directories
- `server.js`: Main server logic and API routes
- `database.js`: MySQL setup and table creation
- `auth.js`: Authentication middleware and user management
- `public/`: Frontend assets
- `uploads/`: Temporary file storage for OCR
- `.env`: Environment configuration (database, OCR settings)

## Example: Adding an Expense (Authenticated)
- POST `/api/expenses` with `{ "item": "Lunch", "amount": 12.5, "category": "Food" }`
- Requires valid user session

## Example: User Registration
- POST `/api/auth/register` with `{ "username": "john", "email": "john@example.com", "password": "securepass" }`

## Example: Uploading for OCR
- POST `/api/ocr/upload` with a file field named `ocrFile`

---
For unclear or missing conventions, ask the user for clarification before making assumptions.
