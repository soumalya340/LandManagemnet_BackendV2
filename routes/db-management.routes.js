require("dotenv").config();
const { Pool } = require("pg");
const express = require("express");
const router = express.Router();
const { dropTable, createTable, showTableData } = require("../db/db_utils");

// PostgreSQL connection configuration
const db = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD, // fallback
  port: 5432,
});

// Drop entire table
router.delete("/table/:tableName", async (req, res) => {
  try {
    const { tableName } = req.params;

    if (!tableName) {
      return res.status(400).json({
        success: false,
        message: "Table name is required",
      });
    }

    const result = await dropTable(tableName);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message,
      });
    }

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Error dropping table:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Create table with custom columns
router.post("/create-table/:tableName", async (req, res) => {
  try {
    const { tableName } = req.params;
    const { columns } = req.body;

    if (!tableName) {
      return res.status(400).json({
        success: false,
        message: "Table name is required",
      });
    }

    if (!columns || typeof columns !== "string") {
      return res.status(400).json({
        success: false,
        message: "Columns definition is required and must be a string",
        example:
          "id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
      });
    }

    await createTable(tableName, columns);

    res.status(201).json({
      success: true,
      message: `Table '${tableName}' created successfully`,
      data: {
        tableName,
        columns,
      },
    });
  } catch (error) {
    console.error("Error creating table:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Route to show data from any table (generic showcase)
router.get("/show-table/:tableName", async (req, res) => {
  try {
    const { tableName } = req.params;

    if (!tableName) {
      return res.status(400).json({
        success: false,
        message: "Table name is required",
      });
    }

    // First check if table exists
    const tableExistsQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = $1
      )`;
    
    const tableExists = await db.query(tableExistsQuery, [tableName]);
    
    if (!tableExists.rows[0].exists) {
      return res.status(404).json({
        success: false,
        message: `Table '${tableName}' does not exist`,
        data: []
      });
    }

    // If table exists, show its data
    const result = await showTableData(tableName);

    res.status(200).json({
      success: true,
      message: result.message || `Data retrieved from '${tableName}' successfully`,
      data: result.data || []
    });

  } catch (error) {
    console.error("Error showing table data:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
});

// Test route for dynamic table insertion
router.post("/test-insertion/:tableName", async (req, res) => {
  try {
    const { tableName } = req.params;
    const { columns, values } = req.body;

    if (!tableName || !columns || !values) {
      return res.status(400).json({
        success: false,
        message: "Table name, columns, and values are required",
        example: {
          columns: ["name", "age", "email"],
          values: ["John Doe", 25, "john@example.com"],
        },
      });
    }

    // Create the INSERT query dynamically
    const columnsList = columns.join(", ");
    const placeholders = values.map((_, index) => `$${index + 1}`).join(", ");
    const query = `INSERT INTO ${tableName} (${columnsList}) VALUES (${placeholders}) RETURNING *`;

    const client = await db.connect();
    try {
      const result = await client.query(query, values);
      res.status(201).json({
        success: true,
        message: `Data inserted into '${tableName}' successfully`,
        data: result.rows[0],
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error in test insertion:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

module.exports = router;
