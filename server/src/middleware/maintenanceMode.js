const jwt = require("jsonwebtoken");
const { getPlatformSettings } = require("../services/platformSettingsService");

const exemptPaths = new Set(["/auth/login", "/auth/logout", "/settings"]);

const maintenanceMode = async (req, res, next) => {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method) ||
      exemptPaths.has(req.path) || req.path.startsWith("/admin")) {
    return next();
  }

  try {
    const settings = await getPlatformSettings();
    if (!settings.maintenance_mode) return next();

    const token = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice(7)
      : "";
    if (token && process.env.JWT_SECRET) {
      try {
        const user = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
        if (user.role === "system_admin") return next();
      } catch {
        // Invalid or expired tokens do not grant an administrative maintenance bypass.
      }
    }

    return res.status(503).json({
      success: false,
      message: settings.maintenance_message,
      maintenance_mode: true,
    });
  } catch (error) {
    console.error("Maintenance mode check failed:", error.message);
    return res.status(503).json({
      success: false,
      message: "The service is temporarily unavailable.",
    });
  }
};

module.exports = maintenanceMode;
