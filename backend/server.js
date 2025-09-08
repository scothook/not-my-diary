const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require('dotenv').config({ path: './.env' });

const app = express();
const PORT = process.env.PORT || 5000;

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

app.get("/api/entries", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM entries ORDER BY created_at ASC;");
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database query failed"});
    }
});

app.post("/api/entries/batch", async (req, res) => {
  const entries = req.body; // [{ timestamp, text }, ...]

  if (!Array.isArray(entries) || entries.length === 0) {
    return res.status(400).json({ error: "No entries provided" });
  }

  const values = [];
  const placeholders = entries.map((e, i) => {
    const base = i * 2;
    values.push(e.timestamp, e.text);
    return `($${base + 1}, $${base + 2})`;
  });

  const query = `
    INSERT INTO entries (created_at, content)
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
