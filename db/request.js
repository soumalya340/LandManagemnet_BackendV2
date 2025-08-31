const { createTable, db } = require("./db_utils");

// Function to check if request exists
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
    console.log(`✅ Request ${requestId} updated for role ${role}`);
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
            land_authority BOOLEAN NOT NULL,
            lawyer BOOLEAN NOT NULL,
            bank BOOLEAN NOT NULL,
            current_status VARCHAR(100) NOT NULL,
            UNIQUE(request_id)
        `;

      await createTable("request", columns);
    }
  } catch (tableErr) {
    console.error("❌ Error:", tableErr.message);
    throw tableErr;
  }
  try {
    client = await db.connect();
    const query = `
      INSERT INTO request (request_id, plot_id, land_authority, lawyer, bank, current_status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const result = await client.query(query, [
      data.request_id,
      data.plot_id,
      data.land_authority,
      data.lawyer,
      data.bank,
      data.current_status,
    ]);
    console.log(`Record inserted into request table successfully`);
    return result.rows[0];
  } catch (err) {
    if (err.code === "23505") {
      console.error("⚠️ Duplicate entry for UNIQUE column. Skipping insert.");
    } else {
      console.error("Error inserting record:", err);
    }
    return null;
  } finally {
    if (client) client.release();
  }
}

module.exports = {
  insertRequest,
  checkRequestExists,
  updateRequestStatus,
};
