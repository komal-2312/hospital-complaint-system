const express = require("express");
const pool = require("./config/db");

const app = express();

const complaintsRoutes = require("./routes/complaints");

// THIS MUST COME FIRST
app.use(express.json());

app.use("/complaints", complaintsRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

// Test DB route
app.get("/test-db", async (req, res) => {
  const result = await pool.query("SELECT NOW()");
  res.json(result.rows[0]);
});

app.listen(5000, () => {
  console.log("Server running on port 5000 ✅");
});