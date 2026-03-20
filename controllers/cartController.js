const db = require("../config/db");

// -------------------------------------------------------------------
// CREATE CART
// -------------------------------------------------------------------
exports.createCart = (req, res) => {
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({
      success: false,
      message: "user_id is required",
    });
  }

  const checkActiveCartSql = `
    SELECT * FROM carts 
    WHERE user_id = ? AND status = 'active'
    LIMIT 1
  `;

  db.query(checkActiveCartSql, [user_id], (checkErr, checkResult) => {
    if (checkErr) {
      return res.status(500).json({
        success: false,
        message: "Failed to check active cart",
        error: checkErr.message,
      });
    }

    if (checkResult.length > 0) {
      return res.status(200).json({
        success: true,
        message: "Active cart already exists",
        data: checkResult[0],
      });
    }

    const createCartSql = `
      INSERT INTO carts (user_id, status)
      VALUES (?, 'active')
    `;

    db.query(createCartSql, [user_id], (insertErr, insertResult) => {
      if (insertErr) {
        return res.status(500).json({
          success: false,
          message: "Failed to create cart",
          error: insertErr.message,
        });
      }

      const getNewCartSql = `SELECT * FROM carts WHERE id = ?`;

      db.query(getNewCartSql, [insertResult.insertId], (fetchErr, fetchResult) => {
        if (fetchErr) {
          return res.status(500).json({
            success: false,
            message: "Cart created but failed to fetch data",
            error: fetchErr.message,
          });
        }

        return res.status(201).json({
          success: true,
          message: "Cart created successfully",
          data: fetchResult[0],
        });
      });
    });
  });
};

// -------------------------------------------------------------------
// GET CART BY ID
// -------------------------------------------------------------------
exports.getCartById = (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT * FROM carts
    WHERE id = ?
  `;

  db.query(sql, [id], (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to get cart",
        error: err.message,
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Cart retrieved successfully",
      data: result[0],
    });
  });
};

// -------------------------------------------------------------------
// GET ACTIVE CART BY USER ID
// -------------------------------------------------------------------
exports.getActiveCartByUserId = (req, res) => {
  const { userId } = req.params;

  const sql = `
    SELECT * FROM carts
    WHERE user_id = ? AND status = 'active'
    LIMIT 1
  `;

  db.query(sql, [userId], (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to get active cart",
        error: err.message,
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Active cart not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Active cart retrieved successfully",
      data: result[0],
    });
  });
};

// -------------------------------------------------------------------
// GET ALL CARTS
// -------------------------------------------------------------------
exports.getAllCarts = (req, res) => {
  const sql = `
    SELECT * FROM carts
    ORDER BY id DESC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to get carts",
        error: err.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Carts retrieved successfully",
      data: result,
    });
  });
};

// -------------------------------------------------------------------
// UPDATE CART STATUS
// -------------------------------------------------------------------
exports.updateCartStatus = (req, res) => {
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
    SET status = ?
    WHERE id = ?
  `;

  db.query(updateSql, [status, id], (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to update cart status",
        error: err.message,
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const getUpdatedSql = `
      SELECT * FROM carts
      WHERE id = ?
    `;

    db.query(getUpdatedSql, [id], (fetchErr, fetchResult) => {
      if (fetchErr) {
        return res.status(500).json({
          success: false,
          message: "Status updated but failed to fetch cart",
          error: fetchErr.message,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Cart status updated successfully",
        data: fetchResult[0],
      });
    });
  });
};

// -------------------------------------------------------------------
// DELETE CART
// -------------------------------------------------------------------
exports.deleteCart = (req, res) => {
  const { id } = req.params;

  const sql = `
    DELETE FROM carts
    WHERE id = ?
  `;

  db.query(sql, [id], (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to delete cart",
        error: err.message,
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Cart deleted successfully",
    });
  });
};