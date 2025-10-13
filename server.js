const express = require('express');
const session = require('express-session');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const db = require('./database.js');
const auth = require('./auth.js');
const path = require('path');

const app = express();
const port = 3000;

// Store SSE connections
let sseClients = [];

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-here',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true if using HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Setup for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB file size limit
}); 

// IMPORTANT: Replace with your actual n8n webhook URL
const N8N_WEBHOOK_URL = 'http://localhost:5678/webhook/upload-webhook';

// --- Authentication Routes ---

// Register new user
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password, confirmPassword } = req.body;
        
        // Validation
        if (!username || !email || !password || !confirmPassword) {
            return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
        }
        
        if (password !== confirmPassword) {
            return res.status(400).json({ error: 'รหัสผ่านไม่ตรงกัน' });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' });
        }
        
        // Register user
        const userId = await auth.registerUser(username, email, password);
        
        res.json({
            message: 'สมัครสมาชิกสำเร็จ',
            userId: userId
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, usernameOrEmail, password } = req.body;
        const loginUsername = username || usernameOrEmail;
        
        if (!loginUsername || !password) {
            return res.status(400).json({ error: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' });
        }
        
        const user = await auth.loginUser(loginUsername, password);
        
        // Set session
        req.session.userId = user.id;
        req.session.username = user.username;
        
        res.json({
            message: 'เข้าสู่ระบบสำเร็จ',
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Logout user
app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการออกจากระบบ' });
        }
        res.clearCookie('connect.sid');
        res.json({ message: 'ออกจากระบบสำเร็จ' });
    });
});

// Get current user info
app.get('/api/auth/me', auth.requireAuth, async (req, res) => {
    try {
        const user = await auth.getUserById(req.session.userId);
        res.json({
            message: 'success',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                created_at: user.created_at
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้' });
    }
});

// Update user profile
app.put('/api/auth/profile', auth.requireAuth, async (req, res) => {
    try {
        const { username, email } = req.body;
        
        if (!username || !email) {
            return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
        }
        
        // Check if username or email already exists (exclude current user)
        const [existingUser] = await db.execute(
            'SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?',
            [username, email, req.session.userId]
        );
        
        if (existingUser.length > 0) {
            return res.status(400).json({ error: 'ชื่อผู้ใช้หรืออีเมลนี้มีอยู่แล้ว' });
        }
        
        // Update user profile
        await db.execute(
            'UPDATE users SET username = ?, email = ? WHERE id = ?',
            [username, email, req.session.userId]
        );
        
        // Update session username
        req.session.username = username;
        
        res.json({
            message: 'อัปเดตข้อมูลสำเร็จ',
            user: { username, email }
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล' });
    }
});

// Change password
app.put('/api/auth/change-password', auth.requireAuth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'กรุณากรอกรหัสผ่านให้ครบถ้วน' });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' });
        }
        
        // Get current user with password hash
        const [users] = await db.execute(
            'SELECT password_hash FROM users WHERE id = ?',
            [req.session.userId]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
        }
        
        const user = users[0];
        
        // Verify current password
        const bcrypt = require('bcrypt');
        const passwordMatch = await bcrypt.compare(currentPassword, user.password_hash);
        
        if (!passwordMatch) {
            return res.status(400).json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
        }
        
        // Hash new password
        const saltRounds = 12;
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
        
        // Update password
        await db.execute(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [newPasswordHash, req.session.userId]
        );
        
        res.json({
            message: 'เปลี่ยนรหัสผ่านสำเร็จ'
        });
    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน' });
    }
});

// Delete user account
app.delete('/api/auth/delete-account', auth.requireAuth, async (req, res) => {
    const userId = req.session.userId;
    console.log(`[API] DELETE /api/auth/delete-account - Attempting to delete user ID: ${userId}`);

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Delete all expenses for the user
        console.log(`Deleting expenses for user ID: ${userId}`);
        await connection.execute('DELETE FROM expenses WHERE user_id = ?', [userId]);

        // 2. Delete the user
        console.log(`Deleting user with ID: ${userId}`);
        const [result] = await connection.execute('DELETE FROM users WHERE id = ?', [userId]);

        if (result.affectedRows === 0) {
            throw new Error('ไม่พบผู้ใช้ที่จะลบ');
        }

        await connection.commit();
        console.log(`User ${userId} deleted successfully.`);

        // 3. Destroy the session
        req.session.destroy((err) => {
            if (err) {
                console.error('Error destroying session after account deletion:', err);
            }
            res.clearCookie('connect.sid');
            res.status(204).send(); // 204 No Content is appropriate for a successful DELETE
        });
    } catch (error) {
        await connection.rollback();
        console.error('Account deletion error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดร้ายแรงในการลบบัญชี' });
    } finally {
        connection.release();
    }
});

// --- API Routes ---

// Get all expenses (protected route)
app.get('/api/expenses', auth.requireAuth, async (req, res) => {
    try {
        const sql = "SELECT * FROM expenses WHERE user_id = ? ORDER BY expense_date DESC";
        const [rows] = await db.execute(sql, [req.session.userId]);
        
        res.json({
            "message": "success",
            "data": rows
        });
    } catch (err) {
        res.status(400).json({"error": err.message});
    }
});

// Get single expense by ID (protected route)
app.get('/api/expenses/:id', auth.requireAuth, async (req, res) => {
    try {
        const id = req.params.id;
        const sql = 'SELECT * FROM expenses WHERE id = ? AND user_id = ?';
        
        console.log(`[API] GET /api/expenses/${id} - Fetching single expense`);
        
        const [rows] = await db.execute(sql, [id, req.session.userId]);
        
        if (rows.length === 0) {
            console.log(`[INFO] Expense with ID ${id} not found`);
            res.status(404).json({"error": "Expense not found"});
            return;
        }
        
        const row = rows[0];
        console.log(`[SUCCESS] Found expense:`, row);
        res.json({
            "message": "success",
            "data": row
        });
    } catch (err) {
        console.error(`[ERROR] Database error for expense ID ${req.params.id}:`, err.message);
        res.status(400).json({"error": err.message});
    }
});

// Add a new expense (protected route)
app.post('/api/expenses', auth.requireAuth, async (req, res) => {
    try {
        const { item, amount, expense_date, category } = req.body;
        if (!item || !amount || !expense_date || !category) {
            res.status(400).json({"error": "Please provide item, amount, expense_date, and category."});
            return;
        }
        
        const sql = 'INSERT INTO expenses (item, amount, expense_date, category, user_id) VALUES (?,?,?,?,?)';
        const [result] = await db.execute(sql, [item, amount, expense_date, category, req.session.userId]);
        
        res.json({
            "message": "success",
            "data": { item, amount, expense_date, category, user_id: req.session.userId },
            "id": result.insertId
        });
    } catch (err) {
        res.status(400).json({"error": err.message});
    }
});

// Update an expense (protected route)
app.put('/api/expenses/:id', auth.requireAuth, async (req, res) => {
    try {
        const { item, amount, expense_date, category } = req.body;
        const expenseId = req.params.id;
        
        console.log('PUT /api/expenses/:id received:');
        console.log('Expense ID:', expenseId);
        console.log('Request body:', req.body);
        
        if (!item || !amount || !expense_date || !category) {
            console.log('Missing required fields');
            res.status(400).json({"error": "Please provide item, amount, expense_date, and category."});
            return;
        }
        
        const sql = 'UPDATE expenses SET item = ?, amount = ?, expense_date = ?, category = ? WHERE id = ? AND user_id = ?';
        
        console.log('Executing SQL:', sql);
        
        const [result] = await db.execute(sql, [item, amount, expense_date, category, expenseId, req.session.userId]);
        
        console.log('Changes made:', result.affectedRows);
        
        if (result.affectedRows === 0) {
            console.log('No records updated - expense not found or not owned by user');
            res.status(404).json({"error": "Expense not found"});
            return;
        }
        
        console.log('Update successful');
        res.json({
            "message": "success",
            "data": { id: expenseId, item, amount, expense_date, category },
            "changes": result.affectedRows
        });
    } catch (err) {
        console.error('Database error:', err);
        res.status(400).json({"error": err.message});
    }
});

// Delete an expense (protected route)
app.delete('/api/expenses/:id', auth.requireAuth, async (req, res) => {
    try {
        const expenseId = req.params.id;
        
        console.log('DELETE /api/expenses/:id received:');
        console.log('Expense ID:', expenseId);
        
        const sql = 'DELETE FROM expenses WHERE id = ? AND user_id = ?';
        
        console.log('Executing SQL:', sql);
        
        const [result] = await db.execute(sql, [expenseId, req.session.userId]);
        
        console.log('Changes made:', result.affectedRows);
        
        if (result.affectedRows === 0) {
            console.log('No records deleted - expense not found or not owned by user');
            res.status(404).json({"error": "Expense not found"});
            return;
        }
        
        console.log('Delete successful');
        res.json({
            "message": "success",
            "changes": result.affectedRows
        });
    } catch (err) {
        console.error('Database error:', err);
        res.status(400).json({"error": err.message});
    }
});

// SSE endpoint for real-time updates
// NOTE: This is now less critical for OCR but can be kept for other real-time features.
app.get('/api/sse/ocr-updates', auth.requireAuth, (req, res) => {
    // Set headers for SSE
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    });

    // Add client to the list
    const clientId = Date.now();
    const newClient = {
        id: clientId,
        response: res,
        userId: req.session.userId // Associate connection with user
    };
    sseClients.push(newClient);

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Connected to OCR updates' })}\n\n`);

    // Remove client when connection closes
    req.on('close', () => {
        sseClients = sseClients.filter(client => client.id !== clientId);
        console.log(`Client ${clientId} (User: ${newClient.userId}) disconnected from SSE`);
    });
});

// Function to broadcast OCR results to all connected clients
// NOTE: This function is no longer used by the primary OCR flow but is kept for potential future use.
function sendOCRResultToUser(userId, ocrData) {
    const message = JSON.stringify({
        type: 'ocr-result',
        data: ocrData
    });

    // Compare userId as numbers to avoid type mismatch (e.g., 123 vs "123")
    const client = sseClients.find(c => Number(c.userId) === Number(userId));

    if (client) {
        try {
            client.response.write(`data: ${message}\n\n`);
            console.log(`[SSE] Sent OCR result to user ${userId}`);
        } catch (error) {
            console.error(`Error sending SSE message to user ${userId}:`, error);
        }
    }
}

// Webhook endpoint to receive OCR results from n8n
// NOTE: This endpoint is now a fallback and should ideally not be used. The /api/ocr/upload endpoint should handle the response directly.
app.post('/api/webhook/ocr-result', (req, res) => {
    console.log('Received OCR result from n8n:', req.body);
    
    const { userId, ...ocrData } = req.body;

    if (!userId) {
        return res.status(400).json({ "message": "Missing userId in webhook payload" });
    }
    
    // No need to parseInt here as the comparison in sendOCRResultToUser handles it
    sendOCRResultToUser(userId, ocrData);
    
    res.json({
        "message": "OCR result received and broadcasted successfully",
        "timestamp": new Date().toISOString()
    });
});

// Upload image for OCR
app.post('/api/ocr/upload', auth.requireAuth, upload.single('ocrFile'), (req, res) => { 
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const userId = req.session.userId;
    console.log(`File received from user ID ${userId}:`, req.file);
    const filePath = path.join(__dirname, req.file.path);

    try {
        const form = new FormData();
        // IMPORTANT: n8n webhook must be configured to receive a file on the 'file' field
        form.append('file', fs.createReadStream(filePath));
        // Pass the userId to n8n so it can be returned in the webhook payload.
        form.append('userId', userId);

        console.log(`Forwarding file to n8n webhook: ${N8N_WEBHOOK_URL}`);

        // Fire-and-forget: Send to n8n but don't wait for the full OCR response.
        // n8n will call our /api/webhook/ocr-result endpoint when it's done.
        axios.post(N8N_WEBHOOK_URL, form, {
            headers: {
                ...form.getHeaders()
            }
        }).then(response => {
            console.log('n8n initial response:', response.data);
            // Clean up the file after successfully sending it
            fs.unlink(filePath, (err) => {
                if (err) console.error("Error deleting temp file after sending:", err);
            });
        }).catch(error => {
            console.error('Error sending file to n8n:', error.message);
            // Still try to clean up the file
            fs.unlink(filePath, (err) => {
                if (err) console.error("Error deleting temp file on error:", err);
            });
        });

        // Immediately respond to the client that the upload was successful and processing has started.
        res.json({ message: 'File uploaded, processing started.' });

    } catch (error) {
        console.error('Error during file upload preparation:', error);
        res.status(500).json({ error: 'Failed to handle file upload.' });
    }
});


// --- Serve Frontend Files ---
app.get('/', (req, res) => {
    if (req.session.userId) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } else {
        res.sendFile(path.join(__dirname, 'public', 'login.html'));
    }
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/add', (req, res) => {
    if (req.session.userId) {
        res.sendFile(path.join(__dirname, 'public', 'add.html'));
    } else {
        res.redirect('/login');
    }
});

app.get('/dashboard', (req, res) => {
    if (req.session.userId) {
        res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
    } else {
        res.redirect('/login');
    }
});

app.get('/profile', (req, res) => {
    if (req.session.userId) {
        res.sendFile(path.join(__dirname, 'public', 'profile.html'));
    } else {
        res.redirect('/login');
    }
});


app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});