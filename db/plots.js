const { createTable, db } = require("./db_utils");
const { getAllPlotAccountInfo } = require("../utils/info");

// Helper function to count data fields
function countDataFields(data) {
  const expectedFields = [
    "plot_id",
    "plot_name",
    "current_holder",
    "list_of_parcels",
    "amount",
  ];
  const actualFields = Object.keys(data);

  console.log("Expected fields:", expectedFields.length);
  console.log("Actual fields:", actualFields.length);
  console.log("Fields present:", actualFields);

  return {
    expected: expectedFields,
    actual: actualFields,
    isComplete: expectedFields.every((field) => data.hasOwnProperty(field)),
  };
}

// Function to check if plots table exists
async function checkPlotTableExists() {
  let client;
  try {
    client = await db.connect();
    const query = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'plots'
      )
    `;
    const result = await client.query(query);
    return result.rows[0].exists;
  } catch (err) {
    console.error("Error checking if plots table exists:", err.message);
    return false;
  } finally {
    if (client) client.release();
  }
}

// Function to insert into plots
async function insertPlot(data) {
  let client;

  try {
    // Check if table exists and has correct schema
    const tableExists = await db.query(`
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'plots'
        )`);

    if (tableExists.rows[0].exists) {
      // Check if plot_name column exists
      const columnExists = await db.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'plots' AND column_name = 'plot_name'
        )`);

      if (!columnExists.rows[0].exists) {
        // Drop and recreate table if schema is wrong
        console.log("⚠️ Table schema mismatch. Recreating plots table...");
        await db.query("DROP TABLE IF EXISTS plots");
      }
    }

    // Create table if it doesn't exist or was dropped
    const tableExistsAfter = await db.query(`
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'plots'
        )`);

    if (!tableExistsAfter.rows[0].exists) {
      const columns = `
        plot_id INTEGER PRIMARY KEY,
        plot_name VARCHAR(255) NOT NULL UNIQUE,
        current_holder VARCHAR(255) NOT NULL,
        list_of_parcels NUMERIC[] NOT NULL,
        amount NUMERIC[] NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      `;
      await createTable("plots", columns);
      console.log(" Plots table created with correct schema");
    }
  } catch (tableErr) {
    console.error(" Error:", tableErr.message);
    throw tableErr;
  }
  try {
    // Check data fields
    const fieldCount = countDataFields(data);
    if (!fieldCount.isComplete) {
      throw new Error(
        `Missing required fields. Need: ${fieldCount.expected.join(", ")}`
      );
    }
    client = await db.connect();

    if (!Array.isArray(data.list_of_parcels)) {
      throw new Error("list_of_parcels must be an array of numbers");
    }
    if (!Array.isArray(data.amount)) {
      throw new Error("amount must be an array of numbers");
    }
    if (data.list_of_parcels.length !== data.amount.length) {
      throw new Error(
        "list_of_parcels and amount arrays must be the same length"
      );
    }

    const query = `
      INSERT INTO plots (plot_id, plot_name, current_holder, list_of_parcels, amount)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [
      data.plot_id,
      data.plot_name,
      data.current_holder,
      data.list_of_parcels,
      data.amount,
    ];
    const result = await client.query(query, values);
    console.log(" Plot inserted:", result.rows[0]);
    return result.rows[0];
  } catch (err) {
    console.error("Error inserting plot:", err.message);
  } finally {
    if (client) client.release();
  }
}

// Function to check if plot name exists
async function checkPlotNameExists(plotName) {
  let client;

  try {
    client = await db.connect();

    const query = `
      SELECT EXISTS (
        SELECT 1 FROM plots 
        WHERE plot_name = $1
      )
    `;

    const result = await client.query(query, [plotName]);
    return result.rows[0].exists;
  } catch (err) {
    console.error(" Error checking plot name:", err.message);
    throw err;
  } finally {
    if (client) client.release();
  }
}

// Function to sync plots data with blockchain (only if table is empty/newly created)
async function syncPlotsWithBlockchain() {
  let client;
  try {
    console.log("Checking if plots sync is needed...");

    // First ensure table exists with correct schema
    try {
      const tableExists = await checkPlotTableExists();
      if (!tableExists) {
        console.log("Creating plots table...");
        const columns = `
          plot_id INTEGER PRIMARY KEY,
          plot_name VARCHAR(255) NOT NULL UNIQUE,
          current_holder VARCHAR(255) NOT NULL,
          list_of_parcels NUMERIC[] NOT NULL,
          amount NUMERIC[] NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        `;
        await createTable("plots", columns);
        console.log("✅ Plots table created successfully");
      }
    } catch (tableError) {
      console.error("Error creating plots table:", tableError.message);
      throw tableError;
    }

    client = await db.connect();

    // Check if table is empty (newly created)
    const countResult = await client.query("SELECT COUNT(*) FROM plots");
    const recordCount = parseInt(countResult.rows[0].count);

    if (recordCount > 0) {
      console.log(
        ` Plots table already has ${recordCount} records. Skipping sync.`
      );
      return {
        success: true,
        syncedCount: 0,
        message: "Plots table already populated, sync skipped",
        skipped: true,
      };
    }

    console.log(" Table is empty, syncing plots data with blockchain...");

    // Fetch all plot info from blockchain
    const plotInfoJson = await getAllPlotAccountInfo();
    const plotInfo = JSON.parse(plotInfoJson);

    if (!plotInfo.success) {
      throw new Error(`Failed to fetch blockchain data: ${plotInfo.error}`);
    }

    // Insert blockchain data
    let insertedCount = 0;
    let plotId = 1; // Use sequential counter instead of parsing key

    for (const [key, plotData] of Object.entries(plotInfo.data)) {
      console.log(`Processing blockchain plot data with key: "${key}"`);

      try {
        // Validate required data fields
        if (!plotData || !plotData.plotName || !plotData.plotOwner) {
          console.log(`Skipping invalid plot data for key "${key}"`);
          continue;
        }

        // Validate and process parcel arrays
        const parcelIds = Array.isArray(plotData.parcelIds)
          ? plotData.parcelIds.map((id) => parseInt(id) || 0).filter(id => id > 0)
          : [];

        const parcelAmounts = Array.isArray(plotData.parcelAmounts)
          ? plotData.parcelAmounts.map((amount) => parseInt(amount) || 0).filter(amount => amount > 0)
          : [];

        // Skip if no valid parcels
        if (parcelIds.length === 0 || parcelAmounts.length === 0) {
          console.log(`Skipping plot with no valid parcels for key "${key}"`);
          continue;
        }

        const query = `
          INSERT INTO plots (plot_id, plot_name, current_holder, list_of_parcels, amount)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (plot_id) DO UPDATE SET
            plot_name = EXCLUDED.plot_name,
            current_holder = EXCLUDED.current_holder,
            list_of_parcels = EXCLUDED.list_of_parcels,
            amount = EXCLUDED.amount
        `;

        const values = [
          plotId, // Use sequential plot_id
          plotData.plotName,
          plotData.plotOwner,
          parcelIds,
          parcelAmounts,
        ];

        await client.query(query, values);
        insertedCount++;
        console.log(
          `✅ Synced plot ${plotId}: ${plotData.plotName} - Owner: ${plotData.plotOwner}`
        );
        plotId++; // Increment for next record
      } catch (insertError) {
        console.error(
          `❌ Error inserting plot ${plotId}:`,
          insertError.message
        );
        console.error('Plot data:', plotData);
        plotId++; // Still increment to avoid duplicate IDs
      }
    }

    console.log(
      `Successfully synced ${insertedCount} plot records from blockchain`
    );
    return {
      success: true,
      syncedCount: insertedCount,
      message: `Synced ${insertedCount} plot records with blockchain`,
    };
  } catch (error) {
    console.error(" Error syncing plots with blockchain:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to sync plots data with blockchain",
    };
  } finally {
    if (client) client.release();
  }
}

// Function to update plot owner
async function updatePlotOwner(plotId, newOwner) {
  let client;
  try {
    client = await db.connect();

    const query = `
      UPDATE plots 
      SET current_holder = $1 
      WHERE plot_id = $2
      RETURNING *
    `;

    const result = await client.query(query, [newOwner, plotId]);

    if (result.rows.length === 0) {
      throw new Error(`Plot with ID ${plotId} not found`);
    }

    console.log(`Plot ${plotId} owner updated to: ${newOwner}`);
    return result.rows[0];
  } catch (err) {
    console.error("Error updating plot owner:", err.message);
    throw err;
  } finally {
    if (client) client.release();
  }
}

module.exports = {
  insertPlot,
  checkPlotNameExists,
  checkPlotTableExists,
  syncPlotsWithBlockchain,
  updatePlotOwner,
};
