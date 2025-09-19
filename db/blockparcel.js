const { createTable, db } = require("./db_utils");
const { getAllLandInfo } = require("../utils/info");

// Function to check if blockparcelinfo table exists
async function checkBlockParcelTableExists() {
  let client;
  try {
    client = await db.connect();
    const query = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'blockparcelinfo'
      )
    `;
    const result = await client.query(query);
    return result.rows[0].exists;
  } catch (err) {
    console.error(
      "Error checking if blockparcelinfo table exists:",
      err.message
    );
    return false;
  } finally {
    if (client) client.release();
  }
}

// Function to insert into blockparcelinfo
async function insertBlockParcelInfo(data) {
  let client;
  // Check if table exists
  try {
    const tableExists = await db.query(`
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'blockparcelinfo'
        )`);
    if (!tableExists.rows[0].exists) {
      const columns = `
        token_id INTEGER PRIMARY KEY,
        parcel_name VARCHAR(255) NOT NULL,
        block_name VARCHAR(255) NOT NULL,
        total_supply INTEGER NOT NULL,
        metadata TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        `;
      await createTable("blockparcelinfo", columns);
    }
  } catch (tableErr) {
    console.error("Error:", tableErr.message);
    throw tableErr;
  }
  try {
    client = await db.connect();
    const query = `
      INSERT INTO blockparcelinfo (token_id, parcel_name, block_name,total_supply ,metadata)
      VALUES ($1, $2, $3, $4 , $5)
      RETURNING *
    `;
    const values = [
      data.token_id,
      data.parcel_name,
      data.block_name,
      data.total_supply,
      data.metadata,
    ];
    const result = await client.query(query, values);
    console.log("BlockParcelInfo inserted:", result.rows[0]);
    return result.rows[0];
  } catch (err) {
    console.error("Error inserting blockparcelinfo:", err.message);
  } finally {
    if (client) client.release();
  }
}

// Function to sync blockparcel data with blockchain (only if table is empty/newly created)
async function syncBlockParcelWithBlockchain() {
  let client;
  try {
    console.log("Checking if blockparcel sync is needed...");

    // First ensure table exists with correct schema
    try {
      const tableExists = await checkBlockParcelTableExists();
      if (!tableExists) {
        console.log("Creating blockparcelinfo table...");
        const columns = `
          token_id INTEGER PRIMARY KEY,
          parcel_name VARCHAR(255) NOT NULL,
          block_name VARCHAR(255) NOT NULL,
          total_supply INTEGER NOT NULL,
          metadata TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        `;
        await createTable("blockparcelinfo", columns);
        console.log("✅ Blockparcelinfo table created successfully");
      }
    } catch (tableError) {
      console.error("Error creating blockparcelinfo table:", tableError.message);
      throw tableError;
    }

    client = await db.connect();

    // Check if table is empty (newly created)
    const countResult = await client.query(
      "SELECT COUNT(*) FROM blockparcelinfo"
    );
    const recordCount = parseInt(countResult.rows[0].count);

    if (recordCount > 0) {
      console.log(
        `📊 Blockparcel table already has ${recordCount} records. Skipping sync.`
      );
      return {
        success: true,
        syncedCount: 0,
        message: "Blockparcel table already populated, sync skipped",
        skipped: true,
      };
    }

    console.log(
      "🔄 Table is empty, syncing blockparcel data with blockchain..."
    );

    // Fetch all land info from blockchain
    const landInfoJson = await getAllLandInfo();
    const landInfo = JSON.parse(landInfoJson);

    if (!landInfo.success) {
      throw new Error(`Failed to fetch blockchain data: ${landInfo.error}`);
    }

    // Insert blockchain data
    let insertedCount = 0;
    let tokenId = 1; // Use sequential counter instead of parsing key

    for (const [key, landData] of Object.entries(landInfo.data)) {
      console.log(`Processing blockchain data with key: "${key}"`);

      try {
        // Validate required data fields
        if (!landData || !landData.parcelInfo || !landData.blockInfo) {
          console.log(`Skipping invalid land data for key "${key}"`);
          continue;
        }

        const query = `
          INSERT INTO blockparcelinfo (token_id, parcel_name, block_name, total_supply, metadata)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (token_id) DO UPDATE SET
            parcel_name = EXCLUDED.parcel_name,
            block_name = EXCLUDED.block_name,
            total_supply = EXCLUDED.total_supply,
            metadata = EXCLUDED.metadata
        `;

        const values = [
          tokenId, // Use sequential token_id
          landData.parcelInfo,
          landData.blockInfo,
          parseInt(landData.totalSupply) || 0,
          landData.blockParcelTokenURI || '',
        ];

        await client.query(query, values);
        insertedCount++;
        console.log(
          `✅ Synced land ${tokenId}: ${landData.blockInfo} - ${landData.parcelInfo}`
        );
        tokenId++; // Increment for next record
      } catch (insertError) {
        console.error(
          `❌ Error inserting land ${tokenId}:`,
          insertError.message
        );
        console.error('Land data:', landData);
        tokenId++; // Still increment to avoid duplicate IDs
      }
    }

    console.log(
      `Successfully synced ${insertedCount} land records from blockchain`
    );
    return {
      success: true,
      syncedCount: insertedCount,
      message: `Synced ${insertedCount} land records with blockchain`,
    };
  } catch (error) {
    console.error("Error syncing blockparcel with blockchain:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to sync blockparcel data with blockchain",
    };
  } finally {
    if (client) client.release();
  }
}

// Export the database connection and utility functions
module.exports = {
  insertBlockParcelInfo,
  checkBlockParcelTableExists,
  syncBlockParcelWithBlockchain,
};
