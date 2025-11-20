import { parseWorkbook } from "./parseExcel.ts";
import express from 'express';
import mysql from 'mysql2/promise';
import type { RowDataPacket } from 'mysql2/promise';
import bcrypt from 'bcrypt';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import XLSX from 'xlsx';
import fs from 'fs';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
const upload = multer({ storage: multer.memoryStorage() });

// MySQL connection pool
const pool = mysql.createPool({
    host: 'localhost',
    user: 'samuel',
    password: "<91233553So>",
    database: 'CleaningCompany'
});

// ================= Signup Endpoint =================
app.post('/signup', async (req, res) => {
    const { username, email, password, companyName, companyAddress, companyPhone } = req.body;

    if (!username || !email || !password || !companyName || !companyAddress) {
        return res.status(400).json({ message: 'Missing fields' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert admin and get ID
        const [adminResult]: any = await pool.query(
            'INSERT INTO administrator (name, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword]
        );

        const adminID = adminResult.insertId;  // <-- THE IMPORTANT PART

        // Insert company with foreign key
        await pool.query(
            'INSERT INTO company (name, address, phoneNum, adminID) VALUES (?, ?, ?, ?)',
            [companyName, companyAddress, companyPhone || null, adminID]
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


// ================= Excel Upload Endpoint =================
app.post("/upload-xlsx", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  try {
    // 1️⃣ For simplicity, assume companyID = 5 (in real app, derive from auth)
    const companyID = 6;

    // 3️⃣ Read the workbook from the uploaded file
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const { employees, clients } = parseWorkbook(workbook);

    // 4️⃣ Start a transaction and insert teams, employees, clients
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const teamMap: Record<string, number> = {};

      for (const emp of employees) {
        if (!teamMap[emp.team]) {
          // Insert team associated with this company
          const [teamResult]: any = await connection.query(
            "INSERT INTO team (name, companyID) VALUES (?, ?)",
            [emp.team, companyID]
          );
          teamMap[emp.team] = teamResult.insertId;
        }

        // Insert employee with the correct teamID
        await connection.query(
          "INSERT INTO employee (name, phoneNum, address, payRate, role, hoursWorked, teamID) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [
            emp.name,
            emp.phone,
            emp.address,
            emp.payRate,
            emp.role,
            emp.hoursWorked,
            teamMap[emp.team],
          ]
        );
      }

      // Similarly, insert clients referencing the correct teamID
      for (const client of clients) {
        const teamID = teamMap[client.team];
        await connection.query(
          `INSERT INTO client 
            (name, address, cleaningValue, houseSize, paymentMethod, dayOfCleaning, timeOfCleaning, specialRequest, typeClean, teamID) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            client.name,
            client.address,
            client.cleaningValue,
            client.houseSize,
            client.paymentMethod,
            client.dayOfCleaning,
            client.timeOfCleaning,
            client.specialRequest,
            client.typeClean,
            teamID,
          ]
        );
      }

      await connection.commit();
      connection.release();
      res.json({ message: "File processed and data saved successfully" });
    } catch (err) {
      await connection.rollback();
      connection.release();
      console.error(err);
      res.status(500).json({ message: "Database insert failed, rolled back" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to process Excel file" });
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
