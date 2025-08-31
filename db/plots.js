const { createTable, db } = require("./db_utils");

// Helper function to count data fields
function countDataFields(data) {
  const expectedFields = ["plot_id", "current_holder", "list_of_parcels", "amount"];
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
      // Check if amount column exists
      const columnExists = await db.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'plots' AND column_name = 'amount'
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
        current_holder VARCHAR(255) NOT NULL,
        list_of_parcels NUMERIC[] NOT NULL,
        amount NUMERIC[] NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      `;
      await createTable("plots", columns);
      console.log("✅ Plots table created with correct schema");
    }
  } catch (tableErr) {
    console.error("❌ Error:", tableErr.message);
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
      INSERT INTO plots (plot_id, current_holder, list_of_parcels, amount)
      VALUES ($1, $2, $3 , $4)
      RETURNING *
    `;
    const values = [
      data.plot_id,
      data.current_holder,
      data.list_of_parcels,
      data.amount,
    ];
    const result = await client.query(query, values);
    console.log("✅ Plot inserted:", result.rows[0]);
    return result.rows[0];
  } catch (err) {
    console.error("❌ Error inserting plot:", err.message);
  } finally {
    if (client) client.release();
  }
}

module.exports = {
  insertPlot,
};
