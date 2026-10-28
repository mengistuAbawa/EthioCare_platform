const { Pool } = require("pg");
const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

pool.on("error", () => {
  console.error("Unexpected PostgreSQL pool error.");
});

module.exports = pool;