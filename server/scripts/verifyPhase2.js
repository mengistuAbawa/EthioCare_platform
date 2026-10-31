require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 30000,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : { rejectUnauthorized: false },
});

const main = async () => {
  const migrations = await pool.query("SELECT filename FROM schema_migrations ORDER BY applied_at, filename");
  const permissions = await pool.query("SELECT role, COUNT(*)::int AS count FROM role_permissions GROUP BY role ORDER BY role");
  const mismatches = await pool.query("SELECT COUNT(*)::int AS mismatches FROM patient_health_assessments a JOIN doctors d ON d.id = a.doctor_id WHERE a.clinic_id <> d.clinic_id");
  const nulls = await pool.query("SELECT COUNT(*)::int AS nulls FROM patient_health_assessments WHERE clinic_id IS NULL");
  console.log(JSON.stringify({
    migrations: migrations.rows.map((row) => row.filename),
    permissionCounts: permissions.rows,
    assessmentClinicMismatches: mismatches.rows[0].mismatches,
    assessmentClinicNulls: nulls.rows[0].nulls,
  }, null, 2));
};

main().then(() => pool.end()).catch((error) => {
  console.error(error.message);
  pool.end().finally(() => process.exit(1));
});
