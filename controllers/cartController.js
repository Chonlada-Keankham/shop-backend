const db = require("../config/db");

// -------------------------------------------------------------------
// CREATE CART
// -------------------------------------------------------------------
exports.createCart = async (req, res) => {
  try {
    const user_id = req.user?.id || req.body.user_id;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "user_id is required",
      });
    }

    const checkActiveCartSql = `
      SELECT * FROM carts
      WHERE user_id = $1 AND status = 'active'
      LIMIT 1
    `;

    const checkResult = await db.query(checkActiveCartSql, [user_id]);

    if (checkResult.rows.length > 0) {
      return res.status(200).json({
        success: true,
        message: "Active cart already exists",
        data: checkResult.rows[0],
      });
    }

    const createCartSql = `
      INSERT INTO carts (user_id, status)
      VALUES ($1, 'active')
      RETURNING *
    `;

    const insertResult = await db.query(createCartSql, [user_id]);

    return res.status(201).json({
      success: true,
      message: "Cart created successfully",
      data: insertResult.rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create cart",
      error: error.message,
    });
  }
};

// -------------------------------------------------------------------
// GET CART BY ID
// -------------------------------------------------------------------
exports.getCartById = async (req, res) => {
  try {
    const { id } = req.params;

    const sql = `
      SELECT * FROM carts
      WHERE id = $1
    `;

    const result = await db.query(sql, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Cart retrieved successfully",
      data: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to get cart",
      error: error.message,
    });
  }
};

// -------------------------------------------------------------------
// GET ACTIVE CART BY USER ID
// -------------------------------------------------------------------
exports.getActiveCartByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const sql = `
      SELECT * FROM carts
      WHERE user_id = $1 AND status = 'active'
      LIMIT 1
    `;

    const result = await db.query(sql, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Active cart not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Active cart retrieved successfully",
      data: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to get active cart",
      error: error.message,
    });
  }
};

// -------------------------------------------------------------------
// GET ALL CARTS
// -------------------------------------------------------------------
exports.getAllCarts = async (req, res) => {
  try {
    const sql = `
      SELECT * FROM carts
      ORDER BY id DESC
    `;

    const result = await db.query(sql);

    return res.status(200).json({
      success: true,
      message: "Carts retrieved successfully",
      data: result.rows,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to get carts",
      error: error.message,
    });
  }
};

// -------------------------------------------------------------------
// UPDATE CART STATUS
// -------------------------------------------------------------------
exports.updateCartStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatus = ["active", "checked_out"];

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "status is required",
      });
    }

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const updateSql = `
      UPDATE carts
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;

    const result = await db.query(updateSql, [status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Cart status updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update cart status",
      error: error.message,
    });
  }
};

// -------------------------------------------------------------------
// DELETE CART
// -------------------------------------------------------------------
exports.deleteCart = async (req, res) => {
  try {
    const { id } = req.params;

    const sql = `
      DELETE FROM carts
      WHERE id = $1
      RETURNING *
    `;

    const result = await db.query(sql, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Cart deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete cart",
      error: error.message,
    });
  }
};