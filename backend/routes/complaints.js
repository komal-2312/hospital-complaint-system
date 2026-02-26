const express = require("express");
const router = express.Router();

const pool = require("../config/db");


// GET all complaints
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
      JOIN complaint_categories 
      ON complaints.category_id = complaint_categories.id
      ORDER BY complaints.created_at DESC
      LIMIT 50
    `);

    res.json(result.rows);

  } catch (error) {

    console.error(error);
    res.status(500).json({ error: "Server error" });

  }
});


module.exports = router;