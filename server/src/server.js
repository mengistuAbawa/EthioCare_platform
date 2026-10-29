require("dotenv").config();

const app = require("./app");
const pool = require("./config/db");

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`EthioCare API running at http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

let shuttingDown = false;
const shutdown = (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`Received ${signal}; shutting down EthioCare API.`);
  server.close(() => {
    pool.end()
      .then(() => {
        console.log("EthioCare server stopped.");
        process.exit(0);
      })
      .catch(() => {
        console.error("Failed to close the database connection pool cleanly.");
        process.exit(1);
      });
  });
};

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));