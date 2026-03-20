const db = require("../config/db");

// -------------------------------------------------------------------
// 🔸 HELPERS
// -------------------------------------------------------------------
const sendError = (res, statusCode, message, error = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(error && { error }),
  });
};

const sendSuccess = (res, statusCode, message, data = null) => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...(data !== null && { data }),
  });
};

const isPositiveInteger = (value) => {
  return Number.isInteger(Number(value)) && Number(value) > 0;
};

// -------------------------------------------------------------------
// 🔸 CREATE ORDER
// -------------------------------------------------------------------
exports.createOrder = (req, res) => {
  const {
    order_code,
    user_id,
    customer_name,
    customer_address,
    customer_phone,
    subtotal = 0,
    discount = 0,
    vat = 0,
    total = 0,
    status = "pending",
  } = req.body || {};

  const allowedStatus = ["pending", "completed", "cancelled"];

  if (!order_code) {
    return sendError(res, 400, "order_code is required");
  }

  if (!isPositiveInteger(user_id)) {
    return sendError(res, 400, "Valid user_id is required");
  }

  if (!customer_name) {
    return sendError(res, 400, "customer_name is required");
  }

  if (!customer_address) {
    return sendError(res, 400, "customer_address is required");
  }

  if (!customer_phone) {
    return sendError(res, 400, "customer_phone is required");
  }

  if (!allowedStatus.includes(status)) {
    return sendError(res, 400, "Invalid status value");
  }

  const checkUserSql = `
    SELECT id
    FROM users
    WHERE id = ?
    LIMIT 1
  `;

  db.query(checkUserSql, [user_id], (userErr, userResult) => {
    if (userErr) {
      return sendError(res, 500, "Failed to check user", userErr.message);
    }

    if (userResult.length === 0) {
      return sendError(res, 404, "User not found");
    }

    const checkOrderCodeSql = `
      SELECT id
      FROM orders
      WHERE order_code = ?
      LIMIT 1
    `;

    db.query(checkOrderCodeSql, [order_code], (codeErr, codeResult) => {
      if (codeErr) {
        return sendError(res, 500, "Failed to check order_code", codeErr.message);
      }

      if (codeResult.length > 0) {
        return sendError(res, 400, "order_code already exists");
      }

      const insertSql = `
        INSERT INTO orders (
          order_code,
          user_id,
          customer_name,
          customer_address,
          customer_phone,
          subtotal,
          discount,
          vat,
          total,
          status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.query(
        insertSql,
        [
          order_code,
          user_id,
          customer_name,
          customer_address,
          customer_phone,
          subtotal,
          discount,
          vat,
          total,
          status,
        ],
        (insertErr, insertResult) => {
          if (insertErr) {
            return sendError(res, 500, "Failed to create order", insertErr.message);
          }

          const getNewOrderSql = `
            SELECT *
            FROM orders
            WHERE id = ?
            LIMIT 1
          `;

          db.query(getNewOrderSql, [insertResult.insertId], (fetchErr, fetchResult) => {
            if (fetchErr) {
              return sendError(
                res,
                500,
                "Order created but failed to fetch data",
                fetchErr.message
              );
            }

            return sendSuccess(res, 201, "Order created successfully", fetchResult[0]);
          });
        }
      );
    });
  });
};

// -------------------------------------------------------------------
// 🔸 GET ALL ORDERS
// -------------------------------------------------------------------
exports.getAllOrders = (req, res) => {
  const sql = `
    SELECT *
    FROM orders
    ORDER BY id DESC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      return sendError(res, 500, "Failed to get orders", err.message);
    }

    return sendSuccess(res, 200, "Orders retrieved successfully", result);
  });
};

// -------------------------------------------------------------------
// 🔸 GET ORDER BY ID
// -------------------------------------------------------------------
exports.getOrderById = (req, res) => {
  const { id } = req.params;

  if (!isPositiveInteger(id)) {
    return sendError(res, 400, "Valid order id is required");
  }

  const sql = `
    SELECT *
    FROM orders
    WHERE id = ?
    LIMIT 1
  `;

  db.query(sql, [id], (err, result) => {
    if (err) {
      return sendError(res, 500, "Failed to get order", err.message);
    }

    if (result.length === 0) {
      return sendError(res, 404, "Order not found");
    }

    return sendSuccess(res, 200, "Order retrieved successfully", result[0]);
  });
};

// -------------------------------------------------------------------
// 🔸 GET ORDERS BY USER ID
// -------------------------------------------------------------------
exports.getOrdersByUserId = (req, res) => {
  const { userId } = req.params;

  if (!isPositiveInteger(userId)) {
    return sendError(res, 400, "Valid userId is required");
  }

  const sql = `
    SELECT *
    FROM orders
    WHERE user_id = ?
    ORDER BY id DESC
  `;

  db.query(sql, [userId], (err, result) => {
    if (err) {
      return sendError(res, 500, "Failed to get user orders", err.message);
    }

    return sendSuccess(res, 200, "User orders retrieved successfully", result);
  });
};

// -------------------------------------------------------------------
// 🔸 UPDATE ORDER STATUS
// -------------------------------------------------------------------
exports.updateOrderStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};

  const allowedStatus = ["pending", "completed", "cancelled"];

  if (!isPositiveInteger(id)) {
    return sendError(res, 400, "Valid order id is required");
  }

  if (!status) {
    return sendError(res, 400, "status is required");
  }

  if (!allowedStatus.includes(status)) {
    return sendError(res, 400, "Invalid status value");
  }

  const checkOrderSql = `
    SELECT *
    FROM orders
    WHERE id = ?
    LIMIT 1
  `;

  db.query(checkOrderSql, [id], (checkErr, checkResult) => {
    if (checkErr) {
      return sendError(res, 500, "Failed to check order", checkErr.message);
    }

    if (checkResult.length === 0) {
      return sendError(res, 404, "Order not found");
    }

    const updateSql = `
      UPDATE orders
      SET status = ?
      WHERE id = ?
    `;

    db.query(updateSql, [status, id], (updateErr) => {
      if (updateErr) {
        return sendError(res, 500, "Failed to update order status", updateErr.message);
      }

      const getUpdatedSql = `
        SELECT *
        FROM orders
        WHERE id = ?
        LIMIT 1
      `;

      db.query(getUpdatedSql, [id], (fetchErr, fetchResult) => {
        if (fetchErr) {
          return sendError(
            res,
            500,
            "Status updated but failed to fetch order",
            fetchErr.message
          );
        }

        return sendSuccess(
          res,
          200,
          "Order status updated successfully",
          fetchResult[0]
        );
      });
    });
  });
};

// -------------------------------------------------------------------
// 🔸 DELETE ORDER
// -------------------------------------------------------------------
exports.deleteOrder = (req, res) => {
  const { id } = req.params;

  if (!isPositiveInteger(id)) {
    return sendError(res, 400, "Valid order id is required");
  }

  const checkSql = `
    SELECT *
    FROM orders
    WHERE id = ?
    LIMIT 1
  `;

  db.query(checkSql, [id], (checkErr, checkResult) => {
    if (checkErr) {
      return sendError(res, 500, "Failed to check order", checkErr.message);
    }

    if (checkResult.length === 0) {
      return sendError(res, 404, "Order not found");
    }

    const deleteSql = `
      DELETE FROM orders
      WHERE id = ?
    `;

    db.query(deleteSql, [id], (deleteErr) => {
      if (deleteErr) {
        return sendError(res, 500, "Failed to delete order", deleteErr.message);
      }

      return sendSuccess(res, 200, "Order deleted successfully");
    });
  });
};