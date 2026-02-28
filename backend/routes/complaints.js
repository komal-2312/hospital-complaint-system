const express = require("express");
const router = express.Router();
console.log("Complaints routes loaded");
const pool = require("../config/db");

// Dashboard stats
router.get("/stats", async (req, res) => {
  try {

    // 1️⃣ Status counts
    const { staffDepartment } = req.query;

    let statusQuery = `
      SELECT 
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'Open') AS open,
        COUNT(*) FILTER (WHERE status = 'In Progress') AS in_progress,
        COUNT(*) FILTER (WHERE status = 'Resolved') AS resolved
      FROM complaints
      JOIN complaint_categories 
        ON complaints.category_id = complaint_categories.id
      JOIN departments
        ON complaint_categories.name = departments.name
    `;

    const values = [];

    if (staffDepartment) {
      values.push(staffDepartment);
      statusQuery += ` WHERE departments.name = $1`;
    }

    const statusResult = await pool.query(statusQuery, values);
    
    // 2️⃣ Department-wise counts
    let departmentQuery = `
      SELECT 
        departments.name AS department,
        COUNT(complaints.id) AS count
      FROM complaints
      JOIN complaint_categories 
        ON complaints.category_id = complaint_categories.id
      JOIN departments
        ON complaint_categories.name = departments.name
    `;

    if (staffDepartment) {
      departmentQuery += ` WHERE departments.name = $1`;
    }

    departmentQuery += `
      GROUP BY departments.name
      ORDER BY count DESC
    `;

    const departmentResult = await pool.query(departmentQuery, values);

    const stats = statusResult.rows[0];

    res.json({
      status_stats: {
        total: Number(stats.total),
        open: Number(stats.open),
        in_progress: Number(stats.in_progress),
        resolved: Number(stats.resolved)
      },
      department_stats: departmentResult.rows.map(d => ({
        department: d.department,
        count: Number(d.count)
      }))
    });

  } catch (error) {
    console.error("STATS ERROR:", error);
    res.status(500).json({ error: "Server error" });
  }
});
// --------------------
// GET /complaints
// --------------------
router.get("/", async (req, res) => {
  try {
    const { status, department, staffDepartment } = req.query;

    let query = `
      SELECT 
        complaints.id,
        complaints.description,
        complaints.priority,
        complaints.status,
        complaints.created_at,
        complaint_categories.name AS category,
        departments.name AS department
      FROM complaints
      JOIN complaint_categories 
        ON complaints.category_id = complaint_categories.id
      JOIN departments
        ON complaint_categories.name = departments.name
    `;

    const conditions = [];
    const values = [];

    if (status) {
      values.push(status);
      conditions.push(`complaints.status = $${values.length}`);
    }

    // If staffDepartment is provided, override normal department filtering
    if (staffDepartment) {
      values.push(staffDepartment);
      conditions.push(`departments.name = $${values.length}`);
    } 
    else if (department) {
      values.push(department);
      conditions.push(`departments.name = $${values.length}`);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY complaints.created_at DESC LIMIT 50";

    const result = await pool.query(query, values);

    res.json(result.rows);

  } catch (error) {
    console.error("FILTER ERROR:", error);
    res.status(500).json({ error: "Server error" });
  }
});


// --------------------
// POST /complaints/qr/:code
// --------------------
router.post("/qr/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const { description } = req.body;

    if (!description) {
      return res.status(400).json({
        error: "Description is required"
      });
    }

    // Find QR
    const qrResult = await pool.query(
      "SELECT * FROM qr_codes WHERE code = $1 AND active = true",
      [code]
    );

    if (qrResult.rows.length === 0) {
      return res.status(404).json({
        error: "Invalid or inactive QR code"
      });
    }

    const qr = qrResult.rows[0];

    // Get location
    const locationResult = await pool.query(
      "SELECT * FROM locations WHERE id = $1",
      [qr.location_id]
    );

    const location = locationResult.rows[0];

    // Get department
    const departmentResult = await pool.query(
      "SELECT * FROM departments WHERE id = $1",
      [location.department_id]
    );

    const department = departmentResult.rows[0];

    // Get matching complaint category
    const categoryResult = await pool.query(
      "SELECT * FROM complaint_categories WHERE name = $1",
      [department.name]
    );

    if (categoryResult.rows.length === 0) {
      return res.status(500).json({
        error: "No matching complaint category found"
      });
    }

    const category = categoryResult.rows[0];

    // Insert complaint
    const insertResult = await pool.query(
      `INSERT INTO complaints
       (qr_id, category_id, description, priority, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        qr.id,
        category.id,
        description,
        "Medium",
        "Open"
      ]
    );

    res.status(201).json({
      message: "Complaint submitted via QR successfully",
      complaint: insertResult.rows[0]
    });

  } catch (error) {
    console.error("QR ROUTE ERROR:", error);
    res.status(500).json({
      error: error.message
    });
  }
});

// Update complaint status
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatus = ["Open", "In Progress", "Resolved"];

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const result = await pool.query(
      `UPDATE complaints
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    res.json({
      message: "Status updated successfully",
      complaint: result.rows[0]
    });

  } catch (error) {
    console.error("PATCH ERROR:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
