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
        data: [],
      });
    }

    // If table exists, show its data
    const result = await showTableData(tableName);

    res.status(200).json({
      success: true,
      message:
        result.message || `Data retrieved from '${tableName}' successfully`,
      data: result.data || [],
    });
  } catch (error) {
    console.error("Error showing table data:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Get plot details by plot name
router.get("/plot/:plotName", async (req, res) => {
  try {
    const { plotName } = req.params;

    if (!plotName) {
      return res.status(400).json({
        success: false,
        message: "Plot name is required",
      });
    }

    // Query to get plot details by plot name
    const query = `SELECT * FROM plots WHERE plot_name = $1`;

    const client = await db.connect();
    try {
      const result = await client.query(query, [plotName]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: `Plot '${plotName}' not found`,
          data: null,
        });
      }

      res.status(200).json({
        success: true,
        message: `Plot details retrieved successfully`,
        data: result.rows[0],
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error retrieving plot details:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Get block parcel details by block name and parcel name
router.get("/blockparcel/:blockName/:parcelName", async (req, res) => {
  try {
    const { blockName, parcelName } = req.params;

    if (!blockName || !parcelName) {
      return res.status(400).json({
        success: false,
        message: "Both block name and parcel name are required",
      });
    }

    // Query to get block parcel details by block name and parcel name
    const query = `SELECT * FROM blockparcelinfo WHERE block_name = $1 AND parcel_name = $2`;

    const client = await db.connect();
    try {
      const result = await client.query(query, [blockName, parcelName]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: `Block '${blockName}' with parcel '${parcelName}' not found`,
          data: null,
        });
      }

      res.status(200).json({
        success: true,
        message: `Block parcel details retrieved successfully`,
        data: result.rows[0],
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error retrieving block parcel details:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
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
