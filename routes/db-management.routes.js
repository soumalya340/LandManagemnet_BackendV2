require("dotenv").config();
const { Pool } = require("pg");
const express = require("express");
const router = express.Router();
const { dropTable, createTable, showTableData } = require("../db/db_utils");
const {
  checkPlotTableExists,
  syncPlotsWithBlockchain,
} = require("../db/plots");
const {
  checkBlockParcelTableExists,
  syncBlockParcelWithBlockchain,
} = require("../db/blockparcel");
const {
  checkRequestTableExists,
  syncRequestsWithBlockchain,
} = require("../db/request");

// PostgreSQL connection configuration
const db = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD, // fallback
  port: 5432,
});

/**
 * Database Health Check
 *
 * Why/When: Check if the database connection is working properly.
 * Useful for health monitoring and debugging database connectivity issues.
 *
 * Returns: Database connection status and health information
 */
router.get("/health", async (req, res) => {
  try {
    console.log("Checking database health...");
    const client = await db.connect();
    try {
      await client.query("SELECT 1");
      res.status(200).json({
        success: true,
        message: "Database connection is healthy",
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Database connection error:", error);
    res.status(503).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
    });
  }
});

/**
 * Show Plots Table Data
 *
 * Why/When: View all data from the plots table in the database.
 * Useful for debugging and data inspection of plot records.
 *
 * Returns: All records from the plots table with proper formatting
 */
router.get("/show-plots", async (req, res) => {
  try {
    // Check if plots table exists and sync if needed
    console.log("Checking if plots table exists...");
    const tableExists = await checkPlotTableExists();

    if (tableExists) {
      console.log("Plots table exists");
      // Check if table is empty and sync if needed
      const result = await showTableData("plots");
      if (!result.data || result.data.length === 0) {
        console.log("Table is empty, syncing plots data with blockchain...");
        await syncPlotsWithBlockchain();
      }
    } else {
      console.log("Plots table does not exist");
      console.log("Syncing plots data with blockchain...");
      await syncPlotsWithBlockchain();
    }

    const result = await showTableData("plots");

    res.status(200).json({
      success: true,
      message: result.message || "Plots data retrieved successfully",
      data: result.data || [],
    });
  } catch (error) {
    console.error("Error showing plots data:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

/**
 * Show Block Parcel Table Data
 *
 * Why/When: View all data from the blockparcelinfo table in the database.
 * Useful for debugging and data inspection of block parcel records.
 *
 * Returns: All records from the blockparcelinfo table with proper formatting
 */
router.get("/show-blockparcel", async (req, res) => {
  try {
    // Check if blockparcel table exists and sync if needed
    console.log("Checking if blockparcel table exists...");
    const tableExists = await checkBlockParcelTableExists();

    if (tableExists) {
      console.log("Blockparcel table exists");
      // Check if table is empty and sync if needed
      const result = await showTableData("blockparcelinfo");
      if (!result.data || result.data.length === 0) {
        console.log("Table is empty, syncing blockparcel data with blockchain...");
        await syncBlockParcelWithBlockchain();
      }
    } else {
      console.log("Blockparcel table does not exist");
      console.log("Syncing blockparcel data with blockchain...");
      await syncBlockParcelWithBlockchain();
    }

    const result = await showTableData("blockparcelinfo");

    res.status(200).json({
      success: true,
      message: result.message || "Block parcel data retrieved successfully",
      data: result.data || [],
    });
  } catch (error) {
    console.error("Error showing block parcel data:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

/**
 * Show Request Table Data
 *
 * Why/When: View all data from the request table in the database.
 * Useful for debugging and data inspection of transfer request records.
 *
 * Returns: All records from the request table with proper formatting
 */
router.get("/show-request", async (req, res) => {
  try {
    // Check if request table exists and sync if needed
    console.log("Checking if request table exists...");
    const tableExists = await checkRequestTableExists();

    if (tableExists) {
      console.log("Request table exists");
      // Check if table is empty and sync if needed
      const result = await showTableData("request");
      if (!result.data || result.data.length === 0) {
        console.log("Table is empty, syncing request data with blockchain...");
        await syncRequestsWithBlockchain();
      }
    } else {
      console.log("Request table does not exist");
      console.log("Syncing request data with blockchain...");
      await syncRequestsWithBlockchain();
    }

    const result = await showTableData("request");

    res.status(200).json({
      success: true,
      message: result.message || "Request data retrieved successfully",
      data: result.data || [],
    });
  } catch (error) {
    console.error("Error showing request data:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

/**
 * Get Plot by Name (Database)
 *
 * Why/When: Get plot details by plot name from the local database.
 * Useful for searching plots by name and retrieving plot information.
 *
 * Parameters:
 * - plotName: The name of the plot to retrieve details for
 *
 * Returns: Plot details including plot name, parcel IDs, amounts, and creation timestamp
 */
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

/**
 * Get Specific Block and Parcel by Name
 *
 * Why/When: Get specific block and parcel details by their names from the database.
 * Useful for searching specific block-parcel combinations.
 *
 * Parameters:
 * - blockName: The name of the block to search for
 * - parcelName: The name of the parcel to search for
 *
 * Returns: Block parcel details including token ID, total supply, metadata, and creation timestamp
 */
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

/**
 * Drop Plots Table
 *
 * Why/When: Delete the entire plots table from the database.
 * Use with caution - this permanently removes all plot data.
 *
 * Security: This is a destructive operation that permanently deletes all plot records.
 *
 * Returns: Confirmation of table deletion
 */
router.delete("/table/plots", async (req, res) => {
  try {
    const result = await dropTable("plots");

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
    console.error("Error dropping plots table:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

/**
 * Drop Request Table
 *
 * Why/When: Delete the entire request table from the database.
 * Use with caution - this permanently removes all transfer request data.
 *
 * Security: This is a destructive operation that permanently deletes all request records.
 *
 * Returns: Confirmation of table deletion
 */
router.delete("/table/request", async (req, res) => {
  try {
    const result = await dropTable("request");

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
    console.error("Error dropping request table:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

/**
 * Drop Block Parcel Info Table
 *
 * Why/When: Delete the entire blockparcelinfo table from the database.
 * Use with caution - this permanently removes all block parcel data.
 *
 * Security: This is a destructive operation that permanently deletes all block parcel records.
 *
 * Returns: Confirmation of table deletion
 */
router.delete("/table/blockparcelinfo", async (req, res) => {
  try {
    const result = await dropTable("blockparcelinfo");

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
    console.error("Error dropping blockparcelinfo table:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

module.exports = router;
