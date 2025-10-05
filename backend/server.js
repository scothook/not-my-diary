const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require('dotenv').config({ path: './.env' });

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "jwt_secret";

app.use(cors()); // Allow cross-origin requests
app.use(express.json()); // Middleware to parse JSON

// Database Connection Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Required for Railway SSL
});

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});

app.post("/api/register", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: "Email and password required" });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email",
    [email, hashedPassword]
    );
    
    res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    console.error(err);
    if (err.code === "23505") {
      res.status(409).json({ error: "User already exists" });
    } else {
      res.status(500).json({ error: "Database error" });
    }
  }
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: "Email and password required" });

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0)
      return res.status(401).json({ error: "Invalid credentials" });

    const user = result.rows[0];
    const userId = user.id;
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ userId, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

app.get("/api/entries", authenticateToken, async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM entries ORDER BY created_at ASC;");
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database query failed"});
    }
});

app.post("/api/entries/batch", authenticateToken, async (req, res) => {
  const entries = req.body; // [{ timestamp, text }, ...]

  if (!Array.isArray(entries) || entries.length === 0) {
    return res.status(400).json({ error: "No entries provided" });
  }

  const values = [];
  const placeholders = entries.map((e, i) => {
    const base = i * 3;
    values.push(e.timestamp, e.text, e.userId);
    return `($${base + 1}, $${base + 2}), $${base + 3}`;
  });

  const query = `
    INSERT INTO entries (created_at, content, user_id)
    VALUES ${placeholders.join(", ")}
    ON CONFLICT DO NOTHING
    RETURNING *;
  `;

  try {
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database insert failed" });
  }
});
