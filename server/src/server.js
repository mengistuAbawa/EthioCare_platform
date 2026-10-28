require("dotenv").config();

const app = require("./app");

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`EthioCare API running at http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

process.on("SIGINT", () => {
  server.close(() => {
    console.log("EthioCare server stopped.");
    process.exit(0);
  });
});