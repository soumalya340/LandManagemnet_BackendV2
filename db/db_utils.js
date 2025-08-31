require("dotenv").config();
const { Pool } = require("pg");

// PostgreSQL connection configuration
const db = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD, // fallback
  port: 5432,
});

// Function to drop any table completely
async function dropTable(tableName) {
  let client;
  try {
    client = await db.connect();

    // Check if table exists first
    const tableExistsQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = $1
      )`;
    const tableExists = await client.query(tableExistsQuery, [tableName]);

    if (!tableExists.rows[0].exists) {
      console.log(`⚠️ Table '${tableName}' does not exist`);
      return { success: false, message: `Table '${tableName}' does not exist` };
    }

    // Drop the table
    const dropQuery = `DROP TABLE ${tableName} CASCADE`;
    await client.query(dropQuery);

    console.log(`✅ Table '${tableName}' dropped successfully`);
    return {
      success: true,
      message: `Table '${tableName}' dropped successfully`,
    };
  } catch (err) {
    console.error(`❌ Error dropping table '${tableName}':`, err.message);
    throw err;
  } finally {
    if (client) client.release();
  }
}

// Generic function to create a table
async function createTable(tableName, columns) {
  let client;
  try {
    client = await db.connect();
    const query = `CREATE TABLE IF NOT EXISTS ${tableName} (${columns})`;
    await client.query(query);
    console.log(`✅ Table '${tableName}' created successfully`);
  } catch (err) {
    console.error("❌ Error creating table:", err.message);
    throw err;
  } finally {
    if (client) client.release();
  }
}

// Generic function to show data from any table
async function showTableData(tableName) {
  let client;
  try {
    client = await db.connect();

    // Check if table exists first
    const tableExistsQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = $1
      )`;
    const tableExists = await client.query(tableExistsQuery, [tableName]);

    if (!tableExists.rows[0].exists) {
      console.log(`⚠️ Table '${tableName}' does not exist`);
      return {
        success: false,
        message: `Table '${tableName}' does not exist`,
        data: [],
      };
    }

    const query = `SELECT * FROM ${tableName} ORDER BY 1 ASC`;
    const result = await client.query(query);

    if (result.rows.length === 0) {
      console.log(`📋 No data found in table '${tableName}'.`);
      return {
        success: true,
        message: `No data found in table '${tableName}'`,
        data: [],
      };
    } else {
      console.log(`📋 Data from table '${tableName}':`);
      console.table(result.rows);
      return {
        success: true,
        message: `Data retrieved from table '${tableName}' successfully`,
        data: result.rows,
      };
    }
  } catch (err) {
    console.error(
      `❌ Error showing data from table '${tableName}':`,
      err.message
    );
    throw err;
  } finally {
    if (client) client.release();
  }
}

module.exports = {
  db,
  dropTable,
  createTable,
  showTableData,
};
