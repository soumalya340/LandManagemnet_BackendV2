const { createTable, db } = require("./db_utils");

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
    console.error("❌ Error:", tableErr.message);
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
    console.log("✅ BlockParcelInfo inserted:", result.rows[0]);
    return result.rows[0];
  } catch (err) {
    console.error("❌ Error inserting blockparcelinfo:", err.message);
  } finally {
    if (client) client.release();
  }
}

// Export the database connection and utility functions
module.exports = {
  insertBlockParcelInfo,
};
