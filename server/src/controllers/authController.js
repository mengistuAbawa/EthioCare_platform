const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const serializeUser = (user) => ({
  id: user.id,
  full_name: user.full_name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  is_active: user.is_active,
  is_verified: user.is_verified,
  created_at: user.created_at,
  updated_at: user.updated_at,
});

const logAuditEvent = async ({ actor_id, action, entity, entity_id, details = {} }) => {
  try {
    await pool.query(
      `INSERT INTO audit_logs (actor_id, action, entity, entity_id, details)
       VALUES ($1, $2, $3, $4, $5::jsonb)`,
      [actor_id ?? null, action, entity, entity_id ? String(entity_id) : null, JSON.stringify(details)]
    );
  } catch (error) {
    console.error("Audit log write failed:", error.message);
  }
};

const register = async (req, res) => {
  try {
    const { full_name, email, phone, password } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();

    const requestedRole = typeof req.body.role === "string"
      ? req.body.role.trim().toLowerCase()
      : "";

    const forbiddenRoles = [
      "system_admin",
      "clinic_admin",
      "doctor",
      "receptionist",
    ];

    if (forbiddenRoles.includes(requestedRole)) {
      return res.status(400).json({
        success: false,
        message: "Public registration cannot create privileged accounts.",
      });
    }

    const existingUser = await pool.query(
      `SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [normalizedEmail]
    );

    if (existingUser.rowCount > 0) {
      return res.status(200).json({
        success: true,
        message: "Registration request processed. Try signing in; if you cannot access your account, contact your platform administrator through an established support channel.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const insertResult = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, phone, role, is_active, is_verified)
       VALUES ($1, $2, $3, $4, 'patient', TRUE, FALSE)
       RETURNING id, full_name, email, phone, role, is_active, is_verified, created_at, updated_at`,
      [String(full_name).trim(), normalizedEmail, passwordHash, phone ? String(phone).trim() : null]
    );

    const user = insertResult.rows[0];

    await logAuditEvent({
      actor_id: user.id,
      action: "user_registered",
      entity: "users",
      entity_id: user.id,
      details: {
        role: user.role,
        is_verified: user.is_verified,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Registration request processed. Try signing in; if you cannot access your account, contact your platform administrator through an established support channel.",
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(200).json({
        success: true,
        message: "Registration request processed. Try signing in; if you cannot access your account, contact your platform administrator through an established support channel.",
      });
    }

    console.error("Registration error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to create the account.",
    });
  }
};

const login = async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    const result = await pool.query(
      `SELECT id, full_name, email, phone, role, password_hash, is_active, is_verified, created_at, updated_at
       FROM users
       WHERE LOWER(email) = LOWER($1)
       LIMIT 1`,
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: "Your account is inactive.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return res.status(500).json({
        success: false,
        message: "Authentication configuration is missing.",
      });
    }

    const token = jwt.sign(
      {
        sub: String(user.id),
        role: user.role,
        email: user.email,
      },
      secret,
      {
        algorithm: "HS256",
        expiresIn: process.env.JWT_EXPIRES_IN || "8h",
      }
    );

    await logAuditEvent({
      actor_id: user.id,
      action: "user_login",
      entity: "users",
      entity_id: user.id,
      details: {
        role: user.role,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        token,
        user: serializeUser(user),
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Login failed.",
    });
  }
};

const getMe = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, full_name, email, phone, role, is_active, is_verified, created_at, updated_at
       FROM users
       WHERE id = $1`,
      [req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        user: serializeUser(result.rows[0]),
      },
    });
  } catch (error) {
    console.error("Get current user error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to load the current user.",
    });
  }
};

const logout = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
};

const updateProfile = async (req, res) => {
  try {
    const allowedFields = ["full_name", "phone"];
    const updates = {};

    allowedFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        const value = req.body[field];

        if (field === "full_name") {
          updates.full_name = typeof value === "string" ? value.trim() : value;
        }

        if (field === "phone") {
          updates.phone = value === null || value === "" ? null : String(value).trim();
        }
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid profile fields were provided.",
      });
    }

    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClauses = fields.map((field, index) => `${field} = $${index + 1}`).join(", ");

    const result = await pool.query(
      `UPDATE users
       SET ${setClauses}, updated_at = NOW()
       WHERE id = $${fields.length + 1}
       RETURNING id, full_name, email, phone, role, is_active, is_verified, created_at, updated_at`,
      [...values, req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    await logAuditEvent({
      actor_id: req.user.id,
      action: "user_profile_updated",
      entity: "users",
      entity_id: req.user.id,
      details: {
        fields: Object.keys(updates),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: {
        user: serializeUser(result.rows[0]),
      },
    });
  } catch (error) {
    console.error("Profile update error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to update the profile.",
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  logout,
  updateProfile,
};
