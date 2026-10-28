const pool = require("../config/db");

const getUnreadNotificationCount = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*)::int AS unread_count
       FROM notifications
       WHERE recipient_id = $1 AND is_read = FALSE`,
      [req.user.id]
    );

    return res.status(200).json({
      success: true,
      data: {
        unread_count: result.rows[0]?.unread_count ?? 0,
      },
    });
  } catch (error) {
    console.error("Unread notification count error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to load the unread notification count.",
    });
  }
};

const listMyNotifications = async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 20);
  const offset = (page - 1) * limit;
  const filters = ["recipient_id = $1"];
  const values = [req.user.id];

  if (req.query.read === "true" || req.query.read === "false") {
    values.push(req.query.read === "true");
    filters.push(`is_read = $${values.length}`);
  }

  const whereClause = filters.join(" AND ");

  try {
    const [count, rows] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS total FROM notifications WHERE ${whereClause}`, values),
      pool.query(
        `SELECT id, title, message, type, is_read, created_at
           FROM notifications
          WHERE ${whereClause}
          ORDER BY created_at DESC, id DESC
          LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
        [...values, limit, offset]
      ),
    ]);
    const total = count.rows[0].total;
    return res.status(200).json({
      success: true,
      data: {
        notifications: rows.rows,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    console.error("Patient notification list error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to load your notifications." });
  }
};

const markMyNotificationRead = async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE notifications
          SET is_read = TRUE
        WHERE id = $1 AND recipient_id = $2
        RETURNING id, is_read`,
      [req.params.notificationId, req.user.id]
    );
    if (!result.rowCount) {
      return res.status(404).json({ success: false, message: "Notification not found." });
    }
    return res.status(200).json({ success: true, data: { notification: result.rows[0] } });
  } catch (error) {
    console.error("Patient notification update error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to update this notification." });
  }
};

const markAllMyNotificationsRead = async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE notifications
          SET is_read = TRUE
        WHERE recipient_id = $1 AND is_read = FALSE`,
      [req.user.id]
    );
    return res.status(200).json({
      success: true,
      data: { updated_count: result.rowCount },
    });
  } catch (error) {
    console.error("Patient notification bulk update error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to update your notifications." });
  }
};

module.exports = {
  getUnreadNotificationCount,
  listMyNotifications,
  markMyNotificationRead,
  markAllMyNotificationsRead,
};
