# 💰 Expense Tracker

แอปพลิเคชันติดตามค่าใช้จ่ายที่ทันสมัยและมีฟีเจอร์ครบครัน สร้างขึ้นด้วย Node.js, Express และ MySQL พร้อมระบบยืนยันตัวตนผู้ใช้, การประมวลผลใบเสร็จด้วย OCR และ UI ที่สวยงามและตอบสนองต่อทุกอุปกรณ์
A modern and feature-rich expense tracking application built with Node.js, Express, and MySQL, featuring user authentication, OCR receipt processing, and a beautiful, responsive UI.

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![n8n](https://img.shields.io/badge/n8n-EA4B71?style=for-the-badge&logo=n8n&logoColor=white)

## ✨ คุณสมบัติเด่น
## ✨ Key Features

### 🔐 ระบบยืนยันตัวตนผู้ใช้
### 🔐 User Authentication System
- **Secure Registration and Login** - Password hashing with bcrypt.
- **Session Management** - Uses Express-session for security.
- **Protected Routes** - Route protection with middleware.
- **Profile Management** - Profile page with usage statistics.

### 💸 การจัดการค่าใช้จ่าย
### 💸 Expense Management
- **Add Expenses** - Quickly record expenses with categories.
- **Dashboard** - Beautiful overview of expenses.
- **Category Management** - Organize expenses by category.
- **Date Filtering** - Filter expense data by date range.
- **User-Specific Data** - Each user only sees their own data.

### 📱 UI/UX ที่ทันสมัย
### 📱 Modern UI/UX
- **Responsive Design** - Primarily supports mobile usage with a bottom navigation menu.
- **SweetAlert2 Notifications** - Beautiful alerts and confirmations.
- **Clean Interface** - Modern and easy to use.

### 🔍 การผสานการทำงานกับ OCR
### 🔍 OCR Integration
- **Receipt Processing** - Upload receipts for automatic data extraction.
- **n8n Workflow** - Uses an n8n workflow to process images, call external OCR APIs, and send data back to the application (see [n8n Workflow Setup](#-n8n-workflow-setup)).
- **Automatic File Deletion** - Temporary files are automatically removed.
- **Real-time Updates** - Uses Server-Sent Events (SSE) to notify users when OCR processing is complete.

## 🚀 เริ่มต้นใช้งาน
## 🚀 Getting Started

### สิ่งที่ต้องมี
### Prerequisites

- **Node.js** (เวอร์ชัน 14 หรือสูงกว่า)
- **Docker** (สำหรับฐานข้อมูล MySQL)
- **npm**
- **Node.js** (version 14 or higher)
- **Docker** (for MySQL database)
- **npm**

### การติดตั้ง
### Installation

1.  **Clone the project**
    ```bash
    git clone https://github.com/Adisak034/Expense-Tracker.git
    cd Expense-Tracker
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Set up MySQL Database**
    ```bash
    docker run --name expense-mysql \
      -e MYSQL_ROOT_PASSWORD=rootpassword \
      -e MYSQL_DATABASE=expense_tracker \
      -e MYSQL_USER=expense_user \
      -e MYSQL_PASSWORD=mypassword \
      -p 3306:3306 -d mysql:8.0
    ```

4.  **Set up Environment Variables**
    ```bash
    # Copy and edit the .env file
    cp .env.example .env
    ```

5.  **Run the application**
    ```bash
    npm start
    ```

6.  **Access the application**
    - Open your browser and go to: `http://localhost:3000`
    - Register a new user or log in with an existing account.

## ⚙️ การตั้งค่า n8n Workflow
## ⚙️ n8n Workflow Setup

โปรเจกต์นี้ใช้ n8n เพื่อจัดการกระบวนการ OCR (Optical Character Recognition) โดยเซิร์ฟเวอร์ Node.js จะอัปโหลดภาพใบเสร็จไปยัง n8n webhook ซึ่งจะประมวลผลภาพและส่งข้อมูลที่ดึงออกมาได้กลับมา
This project uses n8n to manage the OCR (Optical Character Recognition) process. The Node.js server uploads receipt images to an n8n webhook, which then processes the images and sends the extracted data back.

### 1. ตั้งค่า n8n
### 1. n8n Setup

วิธีที่ง่ายที่สุดในการรัน n8n คือใช้ Docker:
```bash
docker run -it --rm --name n8n -p 5678:5678 -v ~/.n8n:/home/node/.n8n n8nio/n8n
```
เข้าใช้งาน n8n ได้ที่ `http://localhost:5678`

### 2. นำเข้า Workflow

1.  ไปที่หน้า n8n canvas
2.  คลิก `Workflows` ที่แถบด้านซ้าย
3.  คลิก `Import from File` และเลือกไฟล์ `n8n_workflow/Expense-Tracker-Workflow.json` จากโปรเจกต์นี้

### 3. กำหนดค่าและเปิดใช้งาน

1.  **รับ Webhook URL**: หลังจากนำเข้า ให้เปิดโหนด "Webhook1" คุณจะเห็น **Test URL** และ **Production URL** ให้คัดลอก **Production URL** ซึ่งจะมีลักษณะคล้าย `http://localhost:5678/webhook/upload-webhook`
2.  **อัปเดตค่าในเซิร์ฟเวอร์**: นำ URL ที่คัดลอกมาไปวางในไฟล์ `.env` สำหรับตัวแปร `N8N_WEBHOOK_URL`
3.  **ตรวจสอบ OCR API Key**: โหนด "iApp Recipt OCR" ใช้ API key `demo` สำหรับการใช้งานจริง ควรเปลี่ยนเป็นคีย์ของคุณเอง
4.  **ตรวจสอบ Callback URL**: โหนด "ส่งข้อมูล" (Send Data) ถูกตั้งค่าให้ส่งผลลัพธ์กลับไปที่ `http://localhost:3000/api/webhook/ocr-result` หากแอปของคุณรันบนที่อยู่หรือพอร์ตอื่น **ต้อง** อัปเดต URL ในโหนดนั้น
5.  **เปิดใช้งาน Workflow**: เปิดใช้งานโดยการสลับสวิตช์ `Active` ที่มุมบนขวาของ n8n canvas

### คำอธิบาย Workflow

Workflow ที่นำเข้ามา (`Expense-Tracker-Workflow.json`) ทำงานดังนี้:
1.  **Webhook1**: รับไฟล์ภาพและ `userId` จากแอปพลิเคชัน Node.js
2.  **Extract from File1 / Convert to File1**: เตรียมไฟล์สำหรับ OCR API
3.  **iApp Recipt OCR**: ส่งภาพไปยังบริการ OCR ของ `iapp.co.th`
4.  **If**: ตรวจสอบว่าการทำ OCR สำเร็จหรือไม่
5.  **ส่งข้อมูล (Send Data)**: หากสำเร็จ จะส่ง `Items`, `Amount`, และ `Date` พร้อม `userId` กลับไปยัง webhook ของแอปพลิเคชัน (`/api/webhook/ocr-result`)
6.  **ส่งข้อผิดพลาด (Send Error)**: หากล้มเหลว จะส่งข้อความแสดงข้อผิดพลาด

## 🗄️ การจัดการฐานข้อมูล

### ดูฐานข้อมูลผ่าน GUI

**ตัวเลือกที่ 1: phpMyAdmin (แนะนำ)**
```bash
docker run --name phpmyadmin -d --link expense-mysql:db -p 8080:80 phpmyadmin/phpmyadmin
```
เข้าใช้งานที่: `http://localhost:8080`
- ชื่อผู้ใช้: `expense_user`
- รหัสผ่าน: `mypassword`

**ตัวเลือกที่ 2: MySQL Workbench**
- Host: `localhost:3306`
- ชื่อผู้ใช้: `expense_user`
- รหัสผ่าน: `mypassword`
- ฐานข้อมูล: `expense_tracker`

### โครงสร้างฐานข้อมูล

**ตาราง Users**
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**ตาราง Expenses**
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

## 🔧 เอกสาร API

### Endpoints สำหรับการยืนยันตัวตน

| Method | Endpoint | คำอธิบาย | ต้องยืนยันตัวตน |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | ลงทะเบียนผู้ใช้ใหม่ | ❌ |
| POST | `/api/auth/login` | เข้าสู่ระบบ | ❌ |
| POST | `/api/auth/logout` | ออกจากระบบ | ✅ |
| PUT | `/api/auth/profile` | อัปเดตโปรไฟล์ | ✅ |
| PUT | `/api/auth/change-password` | เปลี่ยนรหัสผ่าน | ✅ |

### Endpoints สำหรับค่าใช้จ่าย

| Method | Endpoint | คำอธิบาย | ต้องยืนยันตัวตน |
|--------|----------|-------------|---------------|
| GET | `/api/expenses` | ดูค่าใช้จ่ายของผู้ใช้ | ✅ |
| POST | `/api/expenses` | เพิ่มค่าใช้จ่ายใหม่ | ✅ |
| PUT | `/api/expenses/:id` | อัปเดตค่าใช้จ่าย | ✅ |
| DELETE | `/api/expenses/:id` | ลบค่าใช้จ่าย | ✅ |

### Endpoints สำหรับ OCR

| Method | Endpoint | คำอธิบาย | ต้องยืนยันตัวตน |
|--------|----------|-------------|---------------|
| POST | `/api/ocr/upload` | อัปโหลดใบเสร็จสำหรับ OCR | ✅ |

### ตัวอย่าง Requests

**ลงทะเบียนผู้ใช้**
```javascript
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**เพิ่มค่าใช้จ่าย**
```javascript
POST /api/expenses
Content-Type: application/json

{
  "item": "อาหารกลางวัน",
  "amount": 25.50,
  "category": "อาหาร",
  "expense_date": "2024-01-15"
}
```

## 📁 โครงสร้างโปรเจกต์

```
expense-tracker/
├── server.js              # ไฟล์หลักของแอปพลิเคชัน
├── database.js            # การตั้งค่าการเชื่อมต่อ MySQL
├── auth.js                 # Middleware สำหรับการยืนยันตัวตน
├── package.json            # Dependencies และ Scripts
├── .env                    # การตั้งค่า Environment
├── .env.example           # เทมเพลต Environment
├── README.md              # เอกสารโปรเจกต์
├── .github/
│   └── copilot-instructions.md
├── public/                # ไฟล์สำหรับ Frontend
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── add.html
│   ├── dashboard.html
│   ├── profile.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── main.js
├── n8n_workflow/
│   └── Expense-Tracker-Workflow.json # n8n workflow สำหรับ OCR
└── uploads/               # ที่เก็บไฟล์ชั่วคราวสำหรับ OCR
```

## 🔒 คุณสมบัติด้านความปลอดภัย

- **การเข้ารหัสรหัสผ่าน** - ใช้ bcrypt
- **ความปลอดภัยของเซสชัน** - การตั้งค่าเซสชันที่ปลอดภัย
- **ป้องกัน SQL Injection** - ใช้ Prepared statements
- **ความปลอดภัยในการอัปโหลดไฟล์** - การลบไฟล์ชั่วคราว
- **การป้องกันเส้นทาง** - Middleware สำหรับป้องกันเส้นทาง

## 🌟 เทคโนโลยีที่ใช้

### Backend
- **Node.js**
- **Express.js**
- **MySQL2**
- **bcrypt**
- **express-session**
- **multer**
- **axios**

### Frontend
- **HTML5**
- **CSS3**
- **JavaScript ES6+**
- **SweetAlert2**

### Database & DevOps
- **MySQL**
- **Docker**
- **phpMyAdmin**

## 🚀 การนำไปใช้งาน (Deployment)

### การตั้งค่าสำหรับ Production

1.  **ตั้งค่า Environment Variables**
    ```bash
    NODE_ENV=production
    DB_HOST=your-mysql-host
    DB_USER=your-db-user
    DB_PASSWORD=your-db-password
    DB_NAME=expense_tracker
    SESSION_SECRET=your-secret-key
    OCR_SERVICE_URL=your-ocr-endpoint
    ```

2.  **ตั้งค่าฐานข้อมูล**
    - ตรวจสอบว่าได้ติดตั้ง MySQL
    - สร้างฐานข้อมูลและผู้ใช้พร้อมสิทธิ์ที่เหมาะสม
    - ตารางจะถูกสร้างขึ้นโดยอัตโนมัติในการรันครั้งแรก

3.  **การจัดการ Process**
    ```bash
    # ใช้ PM2
    npm install -g pm2
    pm2 start server.js --name expense-tracker
    pm2 startup
    pm2 save
    ```

## 👨‍💻 ผู้เขียน

**Adisak034**
- GitHub: [@Adisak034](https://github.com/Adisak034)
- ลิงก์โปรเจกต์: [https://github.com/Adisak034/Expense-Tracker](https://github.com/Adisak034/Expense-Tracker)

## 🙏 ขอบคุณ

- [SweetAlert2](https://sweetalert2.github.io/)
- [MySQL](https://www.mysql.com/)
- [Express.js](https://expressjs.com/)
- [Docker](https://www.docker.com/)