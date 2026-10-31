const readline = require("readline/promises");
const bcrypt = require("bcryptjs");
const pool = require("../src/config/db");

const prompt = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askRequired = async (label) => {
  const value = (await prompt.question(`${label}: `)).trim();
  if (!value) throw new Error(`${label} is required.`);
  return value;
};

const main = async () => {
  const fullName = await askRequired("System admin full name");
  const email = (await askRequired("System admin email")).toLowerCase();
  const password = await prompt.question("System admin password (12+ characters): ");

  if (!email.includes("@")) {
    throw new Error("System admin email must be valid.");
  }
  if (password.length < 12) {
    throw new Error("System admin password must be at least 12 characters.");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext('ethiocare.system-admin-bootstrap'))");

    const existingAdmin = await client.query(
      `SELECT id FROM users WHERE role = 'system_admin' LIMIT 1`
    );

    if (existingAdmin.rowCount > 0) {
      throw new Error(
        "A System Admin account already exists. Use an existing administrator's User Management screen to create another account."
      );
    }

    const existingEmail = await client.query(
      `SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [email]
    );

    if (existingEmail.rowCount > 0) {
      throw new Error("That email already belongs to another account.");
    }

    const result = await client.query(
      `INSERT INTO users
         (full_name, email, password_hash, role, is_active, is_verified)
       VALUES ($1, $2, $3, 'system_admin', TRUE, TRUE)
       RETURNING id, email`,
      [fullName, email, passwordHash]
    );

    await client.query("COMMIT");
    console.log(`Created System Admin account: ${result.rows[0].email}`);
    console.log("Sign in through the deployed application.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

main()
  .catch((error) => {
    console.error(`Unable to create System Admin account: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    prompt.close();
    await pool.end();
  });
