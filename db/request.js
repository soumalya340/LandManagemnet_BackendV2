const { createTable, db } = require("./db_utils");
const { getAllTransferRequestInfo } = require("../utils/info");

// Function to check if request table exists
async function checkRequestTableExists() {
  let client;
  try {
    client = await db.connect();
    const query = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'request'
      )
    `;
    const result = await client.query(query);
    return result.rows[0].exists;
  } catch (err) {
    console.error("Error checking if request table exists:", err.message);
    return false;
  } finally {
    if (client) client.release();
  }
}

// Function to check if request Id exists
async function checkRequestExists(requestId) {
  let client;
  try {
    client = await db.connect();
    const query = `
      SELECT * FROM request 
      WHERE request_id = $1
    `;
    const result = await client.query(query, [requestId]);
    return result.rows[0];
  } catch (err) {
    console.error("Error checking request:", err.message);
    throw err;
  } finally {
    if (client) client.release();
  }
}

// Function to update request status
async function updateRequestStatus(requestId, role) {
  let client;
  try {
    client = await db.connect();

    // First get current status
    const currentStatus = await checkRequestExists(requestId);
    if (!currentStatus) {
      throw new Error(`Request ID ${requestId} not found`);
    }

    // Update the appropriate role's approval
    let updateField;
    switch (role) {
      case 1:
        updateField = "land_authority = true";
        break;
      case 2:
        updateField = "bank = true";
        break;
      case 3:
        updateField = "lawyer = true";
        break;
      default:
        throw new Error("Invalid role");
    }

    const query = `
      UPDATE request 
      SET ${updateField},
          current_status = CASE 
            WHEN land_authority AND lawyer AND bank THEN 'COMPLETED'
            ELSE 'IN_PROGRESS'
          END
      WHERE request_id = $1
      RETURNING *
    `;

    const result = await client.query(query, [requestId]);
    console.log(`Request ${requestId} updated for role ${role}`);
    return result.rows[0];
  } catch (err) {
    console.error("Error updating request:", err.message);
    throw err;
  } finally {
    if (client) client.release();
  }
}

// Generic insert function for new requests
async function insertRequest(data) {
  let client;
  try {
    const tableExists = await db.query(`
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'request'
        )`);
    if (!tableExists.rows[0].exists) {
      const columns = `
            id SERIAL PRIMARY KEY,
            request_id INTEGER NOT NULL,
            plot_id INTEGER NOT NULL,
            is_plot BOOLEAN NOT NULL,
            land_authority BOOLEAN NOT NULL,
            lawyer BOOLEAN NOT NULL,
            bank BOOLEAN NOT NULL,
            current_status VARCHAR(100) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(request_id)
        `;

      await createTable("request", columns);
    }
  } catch (tableErr) {
    console.error("Error:", tableErr.message);
    throw tableErr;
  }
  try {
    client = await db.connect();
    const query = `
      INSERT INTO request (request_id, plot_id, is_plot, land_authority, lawyer, bank, current_status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const result = await client.query(query, [
      data.request_id,
      data.plot_id,
      data.is_plot,
      data.land_authority,
      data.lawyer,
      data.bank,
      data.current_status,
    ]);
    console.log(`Record inserted into request table successfully`);
    return result.rows[0];
  } catch (err) {
    if (err.code === "23505") {
      console.error("Duplicate entry for UNIQUE column. Skipping insert.");
    } else {
      console.error("Error inserting record:", err);
    }
    return null;
  } finally {
    if (client) client.release();
  }
}

// Function to sync request data with blockchain (only if table is empty/newly created)
async function syncRequestsWithBlockchain() {
  let client;
  try {
    console.log("Checking if request sync is needed...");

    // First ensure table exists with correct schema
    try {
      const tableExists = await checkRequestTableExists();
      if (!tableExists) {
        console.log("Creating request table...");
        const columns = `
          id SERIAL PRIMARY KEY,
          request_id INTEGER NOT NULL,
          plot_id INTEGER NOT NULL,
          is_plot BOOLEAN NOT NULL,
          land_authority BOOLEAN NOT NULL,
          lawyer BOOLEAN NOT NULL,
          bank BOOLEAN NOT NULL,
          current_status VARCHAR(100) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(request_id)
        `;
        await createTable("request", columns);
        console.log("✅ Request table created successfully");
      }
    } catch (tableError) {
      console.error("Error creating request table:", tableError.message);
      throw tableError;
    }

    client = await db.connect();

    // Check if table is empty (newly created)
    const countResult = await client.query("SELECT COUNT(*) FROM request");
    const recordCount = parseInt(countResult.rows[0].count);

    if (recordCount > 0) {
      console.log(
        `📊 Request table already has ${recordCount} records. Skipping sync.`
      );
      return {
        success: true,
        syncedCount: 0,
        message: "Request table already populated, sync skipped",
        skipped: true,
      };
    }

    console.log("Table is empty, syncing request data with blockchain...");

    // Fetch all transfer request info from blockchain
    const requestInfoJson = await getAllTransferRequestInfo();
    const requestInfo = JSON.parse(requestInfoJson);

    if (!requestInfo.success) {
      throw new Error(`Failed to fetch blockchain data: ${requestInfo.error}`);
    }

    // Insert blockchain data
    let insertedCount = 0;
    let requestId = 1; // Use sequential counter instead of parsing key

    for (const [key, requestData] of Object.entries(requestInfo.data)) {
      console.log(`Processing blockchain request data with key: "${key}"`);

      try {
        // Validate required data fields
        if (!requestData || requestData.plotId === undefined) {
          console.log(`Skipping invalid request data for key "${key}"`);
          continue;
        }

        // Determine if it's a plot transfer or parcel transfer
        const isPlotTransfer = requestData.isPlotTransfer || false;

        // Determine approvals status
        const landAuthority = requestData.landAuthorityApproved || false;
        const lawyer = requestData.lawyerApproved || false;
        const bank = requestData.bankApproved || false;

        // Determine current status based on approvals
        let currentStatus = "PENDING";
        if (landAuthority && lawyer && bank) {
          currentStatus = "COMPLETED";
        } else if (landAuthority || lawyer || bank) {
          currentStatus = "IN_PROGRESS";
        }

        const query = `
          INSERT INTO request (request_id, plot_id, is_plot, land_authority, lawyer, bank, current_status)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (request_id) DO UPDATE SET
            plot_id = EXCLUDED.plot_id,
            is_plot = EXCLUDED.is_plot,
            land_authority = EXCLUDED.land_authority,
            lawyer = EXCLUDED.lawyer,
            bank = EXCLUDED.bank,
            current_status = EXCLUDED.current_status
        `;

        const values = [
          requestId, // Use sequential request_id
          parseInt(requestData.plotId) || 0,
          isPlotTransfer,
          landAuthority,
          lawyer,
          bank,
          currentStatus,
        ];

        await client.query(query, values);
        insertedCount++;
        console.log(
          `✅ Synced request ${requestId}: Status ${currentStatus} - Plot: ${requestData.plotId}`
        );
        requestId++; // Increment for next record
      } catch (insertError) {
        console.error(
          `❌ Error inserting request ${requestId}:`,
          insertError.message
        );
        console.error('Request data:', requestData);
        requestId++; // Still increment to avoid duplicate IDs
      }
    }

    console.log(
      `Successfully synced ${insertedCount} request records from blockchain`
    );
    return {
      success: true,
      syncedCount: insertedCount,
      message: `Synced ${insertedCount} request records with blockchain`,
    };
  } catch (error) {
    console.error("Error syncing requests with blockchain:", error.message);
    return {
      success: false,
      error: error.message,
      message: "Failed to sync request data with blockchain",
    };
  } finally {
    if (client) client.release();
  }
}

module.exports = {
  insertRequest,
  checkRequestExists,
  checkRequestTableExists,
  updateRequestStatus,
  syncRequestsWithBlockchain,
};
