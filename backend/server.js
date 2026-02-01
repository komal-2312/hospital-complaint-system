const express = require("express");
const pool = require("./config/db");

const app = express();

app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

// Test database route
app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Database connection failed ❌");
  }
});

// Start server
app.listen(5000, () => {
  console.log("Server running on port 5000 ✅");
});
