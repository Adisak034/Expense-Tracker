const bcrypt = require('bcrypt');
const db = require('./database');

// Authentication middleware
function requireAuth(req, res, next) {
    if (req.session && req.session.userId) {
        next();
    } else {
        res.status(401).json({ error: 'Authentication required' });
    }
}

// Register new user
async function registerUser(username, email, password) {
    try {
        // Check if user already exists
        const [existingUser] = await db.execute(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existingUser.length > 0) {
            throw new Error('Username or email already exists');
        }

        // Hash password
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Insert new user
        const [result] = await db.execute(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            [username, email, passwordHash]
        );

        // Get the inserted user
        const [newUser] = await db.execute(
            'SELECT id, username, email FROM users WHERE id = ?',
            [result.insertId]
        );

        return newUser[0];
    } catch (error) {
        throw error;
    }
}

// Login user
async function loginUser(usernameOrEmail, password) {
    try {
        // Find user by username or email
        const [result] = await db.execute(
            'SELECT id, username, email, password_hash FROM users WHERE username = ? OR email = ?',
            [usernameOrEmail, usernameOrEmail]
        );

        if (result.length === 0) {
            throw new Error('Invalid username/email or password');
        }

        const user = result[0];

        // Verify password
        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        
        if (!passwordMatch) {
            throw new Error('Invalid username/email or password');
        }

        // Return user info (without password hash)
        return {
            id: user.id,
            username: user.username,
            email: user.email
        };
    } catch (error) {
        throw error;
    }
}

// Get user by ID
async function getUserById(userId) {
    try {
        const [result] = await db.execute(
            'SELECT id, username, email, created_at FROM users WHERE id = ?',
            [userId]
        );

        return result[0] || null;
    } catch (error) {
        throw error;
    }
}

module.exports = {
    requireAuth,
    registerUser,
    loginUser,
    getUserById
};