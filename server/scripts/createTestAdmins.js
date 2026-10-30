const crypto = require("crypto");
const readline = require("readline/promises");
const bcrypt = require("bcryptjs");
const pool = require("../src/config/db");

const prompt = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askRequired = async (label) => {
  const value = (await prompt.question(`${label}: `)).trim();

  if (!value) {
    throw new Error(`${label} is required.`);
  }

  return value;
};

const askAccount = async (label) => {
  const fullName = await askRequired(`${label} full name`);
  const email = (await askRequired(`${label} email`)).toLowerCase();

  if (!email.includes("@")) {
    throw new Error(`${label} email must be valid.`);
  }

  const password = await prompt.question(`${label} password (12+ characters): `);

  if (password.length < 12) {
    throw new Error(`${label} password must be at least 12 characters.`);
  }

  return {
    fullName,
    email,
    passwordHash: await bcrypt.hash(password, 12),
  };
};

const main = async () => {
  if (!["development", "test"].includes(process.env.NODE_ENV)) {
    throw new Error("Test admin accounts can only be created when NODE_ENV is development or test.");
  }

  const systemAdmin = await askAccount("System admin");
  const clinicAdmin = await askAccount("Clinic admin");
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const systemAdminResult = await client.query(
      `INSERT INTO users (full_name, email, password_hash, role, is_active, is_verified)
       VALUES ($1, $2, $3, 'system_admin', TRUE, TRUE)
       RETURNING id`,
      [systemAdmin.fullName, systemAdmin.email, systemAdmin.passwordHash]
    );

    const clinicAdminResult = await client.query(
      `INSERT INTO users (full_name, email, password_hash, role, is_active, is_verified)
       VALUES ($1, $2, $3, 'clinic_admin', TRUE, TRUE)
       RETURNING id`,
      [clinicAdmin.fullName, clinicAdmin.email, clinicAdmin.passwordHash]
    );

    const clinicResult = await client.query(
      `INSERT INTO clinics
         (slug, name, contact_email, city, address, verification_status, operational_status, created_by)
       VALUES ($1, $2, $3, $4, $5, 'pending', 'active', $6)
       RETURNING id`,
      [
        `test-clinic-${crypto.randomBytes(4).toString("hex")}`,
        "EthioCare Test Clinic",
        clinicAdmin.email,
        "Addis Ababa",
        "Development test clinic",
        clinicAdminResult.rows[0].id,
      ]
    );

    await client.query(
      `INSERT INTO clinic_members (clinic_id, user_id, role, is_active)
       VALUES ($1, $2, 'clinic_admin', TRUE)`,
      [clinicResult.rows[0].id, clinicAdminResult.rows[0].id]
    );

    await client.query("COMMIT");

    console.log("Created test accounts and a pending test clinic.");
    console.log(`System admin: ${systemAdmin.email}`);
    console.log(`Clinic admin: ${clinicAdmin.email}`);
    console.log(`Test clinic ID: ${clinicResult.rows[0].id}`);
    console.log("Use the passwords entered above to sign in.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

main()
  .catch((error) => {
    console.error(`Unable to create test admin accounts: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    prompt.close();
    await pool.end();
  });
