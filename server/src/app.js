const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const pool = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const clinicRoutes = require("./routes/clinicRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const clinicDoctorRoutes = require("./routes/clinicDoctorRoutes");
const assessmentRoutes = require("./routes/assessmentRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const patientAppointmentRoutes = require("./routes/patientAppointmentRoutes");
const doctorPortalRoutes = require("./routes/doctorPortalRoutes");
const adminRoutes = require("./routes/adminRoutes");
const receptionistRoutes = require("./routes/receptionistRoutes");
const platformSettingsRoutes = require("./routes/platformSettingsRoutes");
const maintenanceMode = require("./middleware/maintenanceMode");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.disable("x-powered-by");

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many requests. Please try again later.",
    },
  })
);

app.use("/api", maintenanceMode);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to the EthioCare API",
  });
});

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    return res.status(200).json({
      success: true,
      message: "EthioCare API and database are ready",
      timestamp: new Date().toISOString(),
    });
  } catch {
    console.error("API readiness check failed.");
    return res.status(503).json({
      success: false,
      message: "The API is temporarily unavailable.",
    });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/settings", platformSettingsRoutes);
app.use("/api/clinics", clinicRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/clinics", clinicDoctorRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/appointments", patientAppointmentRoutes);
app.use("/api/doctor-portal", doctorPortalRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/receptionist", receptionistRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use(errorHandler);

module.exports = app;