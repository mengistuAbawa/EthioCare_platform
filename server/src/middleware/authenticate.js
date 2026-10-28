const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const token = authHeader.split(" ")[1];
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      return res.status(500).json({
        success: false,
        message: "Authentication configuration is missing.",
      });
    }

    let payload;
    try {
      payload = jwt.verify(token, jwtSecret, { algorithms: ["HS256"] });
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token.",
      });
    }

    const result = await pool.query(
      `SELECT id, full_name, email, phone, role, is_active, is_verified, created_at, updated_at
       FROM users
       WHERE id = $1`,
      [payload.sub]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({
        success: false,
        message: "Authentication failed.",
      });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: "Your account is inactive.",
      });
    }

    req.user = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      is_active: user.is_active,
      is_verified: user.is_verified,
    };

    return next();
  } catch (error) {
    console.error("Authentication middleware error:", error.message);
    return res.status(500).json({
      success: false,
      message: "An unexpected authentication error occurred.",
    });
  }
};

module.exports = { authenticate };
