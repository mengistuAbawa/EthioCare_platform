const readline = require("readline/promises");
const bcrypt = require("bcryptjs");
const pool = require("../src/config/db");

const prompt = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const main = async () => {
  const email = (await prompt.question("Existing System admin email: ")).trim().toLowerCase();
  const password = await prompt.question("New password (12+ characters): ");

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

    const result = await client.query(
      `UPDATE users
       SET password_hash = $1,
           is_active = TRUE,
           is_verified = TRUE,
           updated_at = CURRENT_TIMESTAMP
       WHERE role = 'system_admin'
         AND LOWER(email) = LOWER($2)
       RETURNING id, email`,
      [passwordHash, email]
    );

    if (result.rowCount === 0) {
      throw new Error("No System Admin account matched that email and role.");
    }

    await client.query("COMMIT");
    console.log(`Reset System Admin password for: ${result.rows[0].email}`);
    console.log("Sign in through the deployed application with the new password.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

main()
  .catch((error) => {
    console.error(`Unable to reset System Admin password: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    prompt.close();
    await pool.end();
  });
