const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const db = require('./database.js');
const path = require('path');

const app = express();
const port = 3000;

// Store SSE connections
let sseClients = [];

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

// --- API Routes ---

// Get all expenses
app.get('/api/expenses', (req, res) => {
    const sql = "select * from expenses ORDER BY expense_date DESC";
    const params = [];
    db.all(sql, params, (err, rows) => {
        if (err) {
          res.status(400).json({"error":err.message});
          return;
        }
        res.json({
            "message":"success",
            "data":rows
        });
      });
});

// Get single expense by ID
app.get('/api/expenses/:id', (req, res) => {
    const id = req.params.id;
    const sql = 'SELECT * FROM expenses WHERE id = ?';
    
    console.log(`[API] GET /api/expenses/${id} - Fetching single expense`);
    
    db.get(sql, [id], (err, row) => {
        if (err) {
            console.error(`[ERROR] Database error for expense ID ${id}:`, err.message);
            res.status(400).json({"error": err.message});
            return;
        }
        
        if (!row) {
            console.log(`[INFO] Expense with ID ${id} not found`);
            res.status(404).json({"error": "Expense not found"});
            return;
        }
        
        console.log(`[SUCCESS] Found expense:`, row);
        res.json({
            "message": "success",
            "data": row
        });
    });
});

// Add a new expense
app.post('/api/expenses', (req, res) => {
    const { item, amount, expense_date, category } = req.body;
    if (!item || !amount || !expense_date || !category) {
        res.status(400).json({"error": "Please provide item, amount, expense_date, and category."});
        return;
    }
    const sql = 'INSERT INTO expenses (item, amount, expense_date, category) VALUES (?,?,?,?)';
    const params = [item, amount, expense_date, category];
    db.run(sql, params, function (err, result) {
        if (err){
            res.status(400).json({"error": err.message})
            return;
        }
        res.json({
            "message": "success",
            "data": { item, amount, expense_date, category },
            "id" : this.lastID
        })
    });
});

// Update an expense
app.put('/api/expenses/:id', (req, res) => {
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
    
    const sql = 'UPDATE expenses SET item = ?, amount = ?, expense_date = ?, category = ? WHERE id = ?';
    const params = [item, amount, expense_date, category, expenseId];
    
    console.log('Executing SQL:', sql);
    console.log('With params:', params);
    
    db.run(sql, params, function (err) {
        if (err) {
            console.error('Database error:', err);
            res.status(400).json({"error": err.message});
            return;
        }
        
        console.log('Changes made:', this.changes);
        
        if (this.changes === 0) {
            console.log('No records updated - expense not found');
            res.status(404).json({"error": "Expense not found"});
            return;
        }
        
        console.log('Update successful');
        res.json({
            "message": "success",
            "data": { id: expenseId, item, amount, expense_date, category },
            "changes": this.changes
        });
    });
});

// Delete an expense
app.delete('/api/expenses/:id', (req, res) => {
    const expenseId = req.params.id;
    
    console.log('DELETE /api/expenses/:id received:');
    console.log('Expense ID:', expenseId);
    
    const sql = 'DELETE FROM expenses WHERE id = ?';
    const params = [expenseId];
    
    console.log('Executing SQL:', sql);
    console.log('With params:', params);
    
    db.run(sql, params, function (err) {
        if (err) {
            console.error('Database error:', err);
            res.status(400).json({"error": err.message});
            return;
        }
        
        console.log('Changes made:', this.changes);
        
        if (this.changes === 0) {
            console.log('No records deleted - expense not found');
            res.status(404).json({"error": "Expense not found"});
            return;
        }
        
        console.log('Delete successful');
        res.json({
            "message": "success",
            "changes": this.changes
        });
    });
});

// SSE endpoint for real-time updates
app.get('/api/sse/ocr-updates', (req, res) => {
    // Set headers for SSE
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Add client to the list
    const clientId = Date.now();
    const newClient = {
        id: clientId,
        response: res
    };
    sseClients.push(newClient);

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Connected to OCR updates' })}\n\n`);

    // Remove client when connection closes
    req.on('close', () => {
        sseClients = sseClients.filter(client => client.id !== clientId);
        console.log(`Client ${clientId} disconnected from SSE`);
    });
});

// Function to broadcast OCR results to all connected clients
function broadcastOCRResult(ocrData) {
    const message = JSON.stringify({
        type: 'ocr-result',
        data: ocrData
    });

    sseClients.forEach(client => {
        try {
            client.response.write(`data: ${message}\n\n`);
        } catch (error) {
            console.error('Error sending SSE message:', error);
        }
    });
}

// Webhook endpoint to receive OCR results from n8n
app.post('/api/webhook/ocr-result', (req, res) => {
    console.log('Received OCR result from n8n:', req.body);
    
    // Broadcast the OCR result to all connected clients
    broadcastOCRResult(req.body);
    
    res.json({
        "message": "OCR result received and broadcasted successfully",
        "timestamp": new Date().toISOString()
    });
});

// Upload image for OCR
app.post('/api/ocr/upload', upload.single('ocrFile'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    console.log('File received:', req.file);
    const filePath = path.join(__dirname, req.file.path);
    
    try {
        const form = new FormData();
        // IMPORTANT: n8n webhook must be configured to receive a file on the 'file' field
        form.append('file', fs.createReadStream(filePath));

        console.log(`Forwarding file to n8n webhook: ${N8N_WEBHOOK_URL}`);

        const response = await axios.post(N8N_WEBHOOK_URL, form, {
            headers: {
                ...form.getHeaders()
            }
        });

        console.log('n8n response status:', response.status);
        console.log('n8n response data:', response.data);

        // Clean up the uploaded file
        fs.unlink(filePath, (err) => {
            if (err) console.error("Error deleting temp file:", err);
        });

        // Assuming n8n returns a JSON response with the extracted text
        res.json(response.data);

    } catch (error) {
        console.error('--- ERROR SENDING FILE TO N8N ---');
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('Data:', error.response.data);
            console.error('Status:', error.response.status);
            console.error('Headers:', error.response.headers);
        } else if (error.request) {
            // The request was made but no response was received
            console.error('Request:', error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Error Message:', error.message);
        }
        console.error('------------------------------------');

        // Clean up the uploaded file in case of an error
        fs.unlink(filePath, (err) => {
            if (err) console.error("Error deleting temp file:", err);
        });
        res.status(500).json({ error: 'Failed to process OCR. Check server logs for details.' });
    }
});


// --- Serve Frontend Files ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/add', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'add.html'));
});
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});


app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
