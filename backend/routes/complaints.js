const express = require("express");
const router = express.Router();
const pool = require("../config/db");

/* ========================
   GET RECENT COMPLAINTS
======================== */
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        complaints.id,
        complaints.description,
        complaints.priority,
        complaints.status,
        complaints.created_at,
        complaint_categories.name AS category
      FROM complaints
      LEFT JOIN complaint_categories 
      ON complaints.category_id = complaint_categories.id
      ORDER BY complaints.created_at DESC
      LIMIT 50
    `);

    res.json(result.rows);

  } catch (error) {
    console.error("GET ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

/* ========================
   CREATE NEW COMPLAINT
======================== */
router.post("/", async (req, res) => {
  try {

    const { description } = req.body;

    if (!description) {
      return res.status(400).json({
        error: "Description is required"
      });
    }

    const result = await pool.query(
      `INSERT INTO complaints 
       (qr_id, category_id, description, priority, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        1,
        1,
        description,
        "Medium",
        "Open"
      ]
    );

    res.status(201).json({
      message: "Complaint submitted successfully",
      complaint: result.rows[0]
    });

  } catch (error) {

    console.error("POST ERROR:", error.message);

    res.status(500).json({
      error: error.message
    });

  }
});

module.exports = router;