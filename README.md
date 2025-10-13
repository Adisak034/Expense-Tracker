# 💰 Expense Tracker

A modern, full-featured expense tracking application built with Node.js, Express, and MySQL. Features user authentication, OCR receipt processing, and a beautiful responsive UI.

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

## ✨ Features

### 🔐 User Authentication
- **Secure Registration & Login** - bcrypt password hashing with salt rounds
- **Session Management** - Express-session for secure user sessions
- **Protected Routes** - Middleware-based route protection
- **Profile Management** - Complete user profile with statistics

### 💸 Expense Management
- **Add Expenses** - Quick expense entry with categories
- **View Dashboard** - Beautiful dashboard with expense overview
- **Category Management** - Organize expenses by categories
- **Date Filtering** - Filter expenses by date ranges
- **User-specific Data** - Each user sees only their own expenses

### 📱 Modern UI/UX
- **Responsive Design** - Mobile-first approach with bottom navigation
- **SweetAlert2 Integration** - Beautiful notifications and confirmations
- **Clean Interface** - Modern, intuitive user interface
- **Dark Theme Support** - Easy on the eyes design

### 🔍 OCR Integration
- **Receipt Processing** - Upload receipts for automatic data extraction
- **External Service Integration** - Configurable OCR service endpoints
- **Automatic Cleanup** - Temporary files are automatically removed

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v14 or higher)
- **Docker** (for MySQL database)
- **npm** package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Adisak034/Expense-Tracker.git
   cd Expense-Tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up MySQL Database**
   ```bash
   docker run --name expense-mysql \
     -e MYSQL_ROOT_PASSWORD=rootpassword \
     -e MYSQL_DATABASE=expense_tracker \
     -e MYSQL_USER=expense_user \
     -e MYSQL_PASSWORD=mypassword \
     -p 3306:3306 -d mysql:8.0
   ```

4. **Configure Environment**
   ```bash
   # Copy and edit environment file
   cp .env.example .env
   ```

5. **Start the Application**
   ```bash
   npm start
   ```

6. **Access the Application**
   - Open your browser and go to: `http://localhost:3000`
   - Register a new account or login with existing credentials

## 🗄️ Database Management

### View Database with GUI

**Option 1: phpMyAdmin (Recommended)**
```bash
docker run --name phpmyadmin -d --link expense-mysql:db -p 8080:80 phpmyadmin/phpmyadmin
```
Access at: `http://localhost:8080`
- Username: `expense_user`
- Password: `mypassword`

**Option 2: MySQL Workbench**
- Host: `localhost:3306`
- Username: `expense_user`
- Password: `mypassword`
- Database: `expense_tracker`

### Database Schema

**Users Table**
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Expenses Table**
```sql
CREATE TABLE expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  item TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  expense_date DATE NOT NULL,
  category VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## 🔧 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | ❌ |
| POST | `/api/auth/login` | User login | ❌ |
| POST | `/api/auth/logout` | User logout | ✅ |
| PUT | `/api/auth/profile` | Update profile | ✅ |
| PUT | `/api/auth/change-password` | Change password | ✅ |

### Expense Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/expenses` | Get user expenses | ✅ |
| POST | `/api/expenses` | Add new expense | ✅ |
| PUT | `/api/expenses/:id` | Update expense | ✅ |
| DELETE | `/api/expenses/:id` | Delete expense | ✅ |

### OCR Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/ocr/upload` | Upload receipt for OCR | ✅ |

### Example Requests

**Register User**
```javascript
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Add Expense**
```javascript
POST /api/expenses
Content-Type: application/json

{
  "item": "Lunch at Restaurant",
  "amount": 25.50,
  "category": "Food",
  "expense_date": "2024-01-15"
}
```

## 📁 Project Structure

```
expense-tracker/
├── server.js              # Main application entry point
├── database.js            # MySQL connection and setup
├── auth.js                 # Authentication middleware
├── package.json            # Dependencies and scripts
├── .env                    # Environment configuration
├── .env.example           # Environment template
├── README.md              # Project documentation
├── .github/
│   └── copilot-instructions.md
├── public/                # Frontend assets
│   ├── index.html         # Landing page
│   ├── login.html         # Login page
│   ├── register.html      # Registration page
│   ├── add.html           # Add expense page
│   ├── dashboard.html     # Dashboard page
│   ├── profile.html       # User profile page
│   ├── css/
│   │   └── style.css      # Main stylesheet
│   └── js/
│       ├── main.js        # Common JavaScript
│       ├── add.js         # Add expense functionality
│       └── dashboard.js   # Dashboard functionality
└── uploads/               # Temporary OCR file storage
```

## 🔒 Security Features

- **Password Hashing** - bcrypt with 12 salt rounds
- **Session Security** - Secure session configuration
- **SQL Injection Protection** - Prepared statements with mysql2
- **File Upload Security** - Temporary file cleanup
- **Route Protection** - Authentication middleware for protected routes

## 🌟 Technologies Used

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MySQL2** - MySQL client for Node.js
- **bcrypt** - Password hashing
- **express-session** - Session middleware
- **multer** - File upload handling
- **axios** - HTTP client for OCR integration

### Frontend
- **HTML5** - Modern web markup
- **CSS3** - Responsive styling
- **JavaScript ES6+** - Modern JavaScript
- **SweetAlert2** - Beautiful alerts and notifications

### Database & DevOps
- **MySQL 8.0** - Relational database
- **Docker** - Containerization
- **phpMyAdmin** - Database management

## 🚀 Deployment

### Production Setup

1. **Environment Variables**
   ```bash
   NODE_ENV=production
   DB_HOST=your-mysql-host
   DB_USER=your-db-user
   DB_PASSWORD=your-db-password
   DB_NAME=expense_tracker
   SESSION_SECRET=your-secret-key
   OCR_SERVICE_URL=your-ocr-endpoint
   ```

2. **Database Setup**
   - Ensure MySQL 8.0+ is installed
   - Create database and user with proper permissions
   - Tables will be created automatically on first run

3. **Process Management**
   ```bash
   # Using PM2
   npm install -g pm2
   pm2 start server.js --name expense-tracker
   pm2 startup
   pm2 save
   ```

## 📊 Features Roadmap

- [ ] Export expenses to CSV/Excel
- [ ] Expense categories management
- [ ] Budget tracking and alerts
- [ ] Recurring expenses
- [ ] Multi-currency support
- [ ] Expense reports and analytics
- [ ] Mobile app (React Native)
- [ ] API rate limiting
- [ ] Two-factor authentication

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Adisak034**
- GitHub: [@Adisak034](https://github.com/Adisak034)
- Project Link: [https://github.com/Adisak034/Expense-Tracker](https://github.com/Adisak034/Expense-Tracker)

## 🙏 Acknowledgments

- [SweetAlert2](https://sweetalert2.github.io/) for beautiful notifications
- [MySQL](https://www.mysql.com/) for reliable database management
- [Express.js](https://expressjs.com/) for the robust web framework
- [Docker](https://www.docker.com/) for containerization support

---

⭐ **Star this repository if it helped you!** ⭐