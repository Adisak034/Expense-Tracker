# Expense Tracker with PostgreSQL & Authentication

## Overview
This is a Node.js/Express application for managing expenses with OCR functionality. It now includes user authentication and uses PostgreSQL for data storage.

## Features
- 👤 User Registration & Login
- 🔐 Session-based Authentication  
- 💰 Personal Expense Management
- 📷 OCR Image Scanning (with n8n integration)
- 📊 Dashboard with Charts
- 🔍 Advanced Filtering & Search
- 📱 Mobile-friendly Interface

## Prerequisites
- Node.js (v14 or higher)
- MySQL (v8.0 or higher) or Docker
- n8n (optional, for OCR functionality)

## Installation

### 1. Clone and Setup
```bash
git clone <repository-url>
cd Ocr-Node
npm install
```

### 2. Database Setup

#### Option A: Using Docker (Recommended)
```bash
docker run --name expense-mysql -e MYSQL_ROOT_PASSWORD=mypassword -e MYSQL_DATABASE=expense_tracker -e MYSQL_USER=expense_user -e MYSQL_PASSWORD=mypassword -p 3306:3306 -d mysql:8.0
```

#### Option B: Local MySQL Installation
Create a MySQL database:
```sql
CREATE DATABASE expense_tracker;
CREATE USER 'expense_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON expense_tracker.* TO 'expense_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Environment Configuration
Copy `.env.example` to `.env` and update the values:
```bash
cp .env.example .env
```

Edit `.env` with your database credentials:
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=expense_tracker
DB_USER=expense_user
DB_PASSWORD=mypassword
SESSION_SECRET=your-very-secure-session-secret-key-here
```

### 4. Run the Application
```bash
node server.js
```

The application will:
- Start on http://localhost:3000
- Automatically create database tables if they don't exist
- Redirect unauthenticated users to login page

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Expenses Table
```sql
CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    item VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    expense_date DATE NOT NULL,
    category VARCHAR(50) NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user  
- `GET /api/auth/me` - Get current user info

### Expenses (Protected Routes)
- `GET /api/expenses` - Get user's expenses
- `POST /api/expenses` - Add new expense
- `GET /api/expenses/:id` - Get single expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense

### OCR
- `POST /api/ocr/upload` - Upload image for OCR processing

## Pages
- `/` - Home page (redirects to login if not authenticated)
- `/login` - Login page
- `/register` - Registration page
- `/add` - Add expense page (protected)
- `/dashboard` - Dashboard with charts (protected)

## OCR Integration (Optional)
If you want to use OCR functionality:

1. Install and setup n8n
2. Create a webhook workflow in n8n for OCR processing
3. Update the `N8N_WEBHOOK_URL` in your `.env` file

## Security Features
- Password hashing with bcrypt (12 salt rounds)
- Session-based authentication
- Protected routes with middleware
- User data isolation (users can only access their own expenses)

## Migration from SQLite
If migrating from the previous SQLite version:
1. Export your existing data from SQLite
2. Set up PostgreSQL as described above
3. Import your data to the new PostgreSQL database
4. Update user associations for existing expenses

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check database credentials in `.env`
- Verify database exists and user has permissions

### Authentication Issues
- Clear browser cookies/localStorage
- Check session secret is set in `.env`
- Verify user exists in database

### OCR Not Working
- Check n8n is running (if using OCR)
- Verify webhook URL is correct
- Check file upload permissions

## File Structure
```
├── server.js          # Main server file
├── database.js        # PostgreSQL connection setup
├── auth.js           # Authentication functions
├── package.json      # Dependencies
├── .env              # Environment variables
├── public/           # Frontend files
│   ├── login.html    # Login page
│   ├── register.html # Registration page
│   ├── index.html    # Home page
│   ├── add.html      # Add expense page
│   ├── dashboard.html # Dashboard page
│   ├── css/          # Stylesheets
│   └── js/           # Client-side JavaScript
└── uploads/          # Temporary file storage
```

## Development Notes
- All expense operations are user-scoped
- Sessions expire after 24 hours
- File uploads are temporarily stored and deleted after processing
- Frontend includes authentication checks and auto-redirect for protected pages