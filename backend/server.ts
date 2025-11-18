import express from 'express';
import mysql from 'mysql2/promise';
import type { RowDataPacket } from 'mysql2/promise';
import bcrypt from 'bcrypt';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// MySQL connection pool
const pool = mysql.createPool({
    host: 'localhost',
    user: 'samuel',
    password: "<91233553So>",
    database: 'CleaningCompany'
});

// ================= Signup Endpoint =================
app.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Missing fields' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.query(
            'INSERT INTO administrator (name, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword]
        );

        res.status(200).json({ message: 'Signup successful!' });
    } catch (err: any) {
        console.error(err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Email already exists' });
        }
        res.status(500).json({ message: 'Database error' });
    }
});

// ================= Login Endpoint =================
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Missing fields' });
    }

    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM administrator WHERE email = ?',
            [email]
        );

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = rows[0];
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        res.status(200).json({ message: 'Login successful', username: user.name });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database error' });
    }
});

// ================= Check Credentials Endpoint =================
app.post('/check-credentials', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ valid: false, message: "Missing fields" });

    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM administrator WHERE email = ?',
            [email]
        );

        if (rows.length === 0) return res.status(404).json({ valid: false, message: "Email not found" });

        const user = rows[0];
        const match = await bcrypt.compare(password, user.password);

        res.json({ valid: match });
    } catch (err) {
        console.error(err);
        res.status(500).json({ valid: false, message: "Server error" });
    }
});

// ================= Reset Password Endpoint =================
app.post('/reset-password', async (req, res) => {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) return res.status(400).json({ message: "Missing fields" });

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.query(
            'UPDATE administrator SET password = ? WHERE email = ?',
            [hashedPassword, email]
        );
        res.json({ message: "Password updated successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// Start server
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
