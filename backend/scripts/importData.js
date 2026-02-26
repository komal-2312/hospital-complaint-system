const XLSX = require("xlsx");
const path = require("path");
const pool = require("../config/db");

function excelDateToJSDate(serial) {
  const excelEpoch = new Date(1899, 11, 30);
  return new Date(excelEpoch.getTime() + serial * 86400000);
}

async function importComplaints() {
  try {

    console.log("Reading Excel file...");

    const filePath = path.join(
      __dirname,
      "../data/Hospital_Complaints_10000_Department_Location_Aligned.xlsx"
    );

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheetData = XLSX.utils.sheet_to_json(
      workbook.Sheets[sheetName]
    );

    console.log("Total complaints found:", sheetData.length);

    // Get category mapping
    const categoryRes = await pool.query(
      "SELECT id, name FROM complaint_categories"
    );

    const categoryMap = {};
    categoryRes.rows.forEach(row => {
      categoryMap[row.name] = row.id;
    });

    // Insert complaints
    let count = 0;

    for (const row of sheetData) {

      const categoryId = categoryMap[row.department_label];

      const createdAt = excelDateToJSDate(row.complaint_date);

      await pool.query(
        `INSERT INTO complaints 
         (category_id, description, priority, status, created_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          categoryId,
          row.complaint_text,
          row.priority_level,
          row.complaint_status,
          createdAt
        ]
      );

      count++;

      if (count % 1000 === 0)
        console.log(count + " complaints inserted");
    }

    console.log("Import complete.");
    process.exit();

  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

importComplaints();