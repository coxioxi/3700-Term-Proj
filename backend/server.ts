import { parseWorkbook } from "./parseExcel.ts";
import express from 'express';
import mysql from 'mysql2/promise';
import type { RowDataPacket } from 'mysql2/promise';
import bcrypt from 'bcrypt';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import XLSX from 'xlsx';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
const upload = multer({ storage: multer.memoryStorage() });

// Middleware to authenticate JWT tokens
function authMiddleware(req: any, res: any, next: any) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Invalid token format" });

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!, (err: any, user: any) => {
    if (err) return res.status(403).json({ message: "Invalid or expired token" });
    req.user = user; // attach decoded token to request
    next();
  });
}

// MySQL connection
const pool = mysql.createPool({
    host: 'localhost',
    user: 'comp3700',
    password: process.env.DB_PASSWORD,
    database: 'comp3700'
});

// Signup Endpoint 
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

        const adminID = adminResult.insertId; 

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


// Login Endpoint
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM administrator WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = rows[0];

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Create a JWT
    const payload = {
      adminID: user.adminID,
      username: user.name,
      email: user.email,
    };

    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET!, {
      expiresIn: "1d",
    });

    res.json({
      message: "Login successful",
      token: accessToken,
      username: user.name,
      adminID: user.adminID,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
});



// Excel Upload Endpoint
app.post("/upload-xlsx", authMiddleware, upload.single("file"), async (req: any, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  try {
    // Get admin ID from JWT
    const adminID = req.user.adminID;

    // Get the companyID that belongs to this admin
    const [companyRows] = await pool.query<any[]>(
      "SELECT companyID FROM company WHERE adminID = ?",
      [adminID]
    );

    if (companyRows.length === 0) {
      return res.status(404).json({ message: "Company not found for this user" });
    }

    const companyID = companyRows[0].companyID;

    // Parse spreadsheet
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const { employees, clients } = parseWorkbook(workbook);

    // Begin DB transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const teamMap: Record<string, number> = {};

      // Insert teams + employees
      for (const emp of employees) {
        if (!teamMap[emp.team]) {
          const [teamResult]: any = await connection.query(
            "INSERT INTO team (name, companyID, expenses) VALUES (?, ?, ?)",
            [emp.team, companyID, emp.teamExpense || null]
          );
          teamMap[emp.team] = teamResult.insertId;
        }

        await connection.query(
          "INSERT INTO employee (name, phoneNum, address, payRate, role, hoursWorked, teamID) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [
            emp.name,
            emp.phone,
            emp.address,
            emp.payRate,
            emp.role,
            emp.hoursWorked,
            teamMap[emp.team]
          ]
        );
      }

      // Insert clients
      for (const client of clients) {
        const teamID = teamMap[client.team];
        await connection.query(
          `INSERT INTO client 
            (name, address, cleaningValue, houseSize, paymentMethod, dayOfCleaning, timeOfCleaning, specialRequest, typeClean, phoneNumber, teamID) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
            client.phone,
            teamID
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

// Get Clients Endpoint
app.post('/getClients', authMiddleware, async (req: any, res) => {
    const teamID = req.body.teamID;

    try {
        const [clients] = await pool.execute(
          "SELECT name, phoneNumber, dayOfCleaning, timeOfCleaning, typeClean, paymentMethod, houseSize, cleaningValue, address, specialRequest FROM client WHERE teamID = ?",
          [teamID]
        );

        res.json({ clients });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Database error" });
    }
});

// Get Teams Endpoint
app.get('/getTeams', authMiddleware, async (req: any, res) => {
  const adminID = req.user.adminID;

  try {
    const [companyRows] = await pool.query<any[]>(
      "SELECT companyID FROM company WHERE adminID = ?",
      [adminID]
    );

    if (companyRows.length === 0)
      return res.status(404).json({ message: "Company not found for this user" });

    const companyID = companyRows[0].companyID;

    const [teams] = await pool.execute(
      "SELECT teamID, name FROM team WHERE companyID = ?",
      [companyID]
    );

    res.json({ teams });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
});

// GET clients by team and day
app.get("/getClientsByTeamAndDay", authMiddleware, async (req: any, res) => {
  try {
    const adminID = req.user.adminID; // retrieved from token
    const { teamID, day } = req.query;

    if (!teamID || !day) {
      return res.status(400).json({ success: false, message: "teamID and day are required" });
    }

    // Get company ID from adminID
    const [companyRows] = await pool.query<any[]>(
      "SELECT companyID FROM company WHERE adminID = ?",
      [adminID]
    );

    if (companyRows.length === 0) {
      return res.status(404).json({ success: false, message: "Company not found for this admin" });
    }

    const companyID = companyRows[0].companyID;

    // Verify team belongs to this company
    const [teamRows] = await pool.query<any[]>(
      "SELECT * FROM team WHERE teamID = ? AND companyID = ?",
      [teamID, companyID]
    );

    if (teamRows.length === 0) {
      return res.status(404).json({ success: false, message: "Team not found for this admin's company" });
    }

    // Get clients for the team on the selected day
    const [clients] = await pool.query<any[]>(
      `
      SELECT clientID, name, address, timeOfCleaning, dayOfCleaning, cleaningValue
      FROM client
      WHERE teamID = ? AND DAYNAME(dayOfCleaning) = ?
      ORDER BY timeOfCleaning ASC
      `,
      [teamID, day]
    );

    res.json({ success: true, clients });
  } catch (err) {
    console.error("Error fetching clients by team and day:", err);
    res.status(500).json({ success: false, message: "Failed to fetch clients" });
  }
});

// Finance Report Endpoint
app.get("/finance-report", authMiddleware, async (req: any, res) => {
  try {
    const adminID = req.user.adminID;

    // Get companyID from adminID
    const [companyRows] = await pool.query<RowDataPacket[]>(
      "SELECT companyID FROM company WHERE adminID = ?",
      [adminID]
    );

    if (companyRows.length === 0) 
      return res.status(404).json({ success: false, message: "Company not found for this user" });

    const companyID = companyRows[0].companyID;

    // Query all teams of this company
    const [rows] = await pool.query<RowDataPacket[]>(
      `
      SELECT 
          t.teamID,
          t.name AS teamName,
          t.expenses AS totalExpenses,
          COALESCE(SUM(e.hoursWorked * e.payRate), 0) AS totalEmployeePay,
          (
              SELECT COALESCE(SUM(c.cleaningValue), 0)
              FROM client c
              WHERE c.teamID = t.teamID
          ) AS totalRevenue
      FROM team t
      LEFT JOIN employee e ON e.teamID = t.teamID
      WHERE t.companyID = ?
      GROUP BY t.teamID;
      `,
      [companyID]
    );

    const teamsWithProfit = (rows as any[]).map((team) => {
      const profit = team.totalRevenue - team.totalEmployeePay - team.totalExpenses;
      return {
        teamID: team.teamID,
        teamName: team.teamName,
        revenue: team.totalRevenue,
        payroll: team.totalEmployeePay,
        expenses: team.totalExpenses,
        profit,
      };
    });

    const company = {
      totalRevenue: teamsWithProfit.reduce((sum, t) => sum + t.revenue, 0),
      totalPayroll: teamsWithProfit.reduce((sum, t) => sum + t.payroll, 0),
      totalExpenses: teamsWithProfit.reduce((sum, t) => sum + t.expenses, 0),
      totalProfit: teamsWithProfit.reduce((sum, t) => sum + t.profit, 0),
    };

    res.json({
      success: true,
      teams: teamsWithProfit,
      company,
    });
  } catch (err) {
    console.error("Finance report error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch finance report",
    });
  }
});



// Check Credentials Endpoint
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

// Reset Password Endpoint
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

// Serve React static files
app.use(express.static(path.join(__dirname, '../dist')));

// Catch-all route for React Router
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Start server
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
