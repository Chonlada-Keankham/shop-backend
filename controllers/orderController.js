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
// 🔸 CREATE ORDER (MANUAL / ADMIN)
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

// -------------------------------------------------------------------
// 🔸 GET MY ORDERS
// -------------------------------------------------------------------
exports.getMyOrders = (req, res) => {
  const userId = req.user.id;

  const sql = `
    SELECT *
    FROM orders
    WHERE user_id = ?
    ORDER BY id DESC
  `;

  db.query(sql, [userId], (err, result) => {
    if (err) {
      return sendError(res, 500, "Failed to get my orders", err.message);
    }

    return sendSuccess(res, 200, "My orders retrieved successfully", result);
  });
};

// -------------------------------------------------------------------
// 🔸 CHECKOUT
// -------------------------------------------------------------------
// -------------------------------------------------------------------
// 🔸 CHECKOUT
// -------------------------------------------------------------------
exports.checkout = (req, res) => {
  const userId = req.user.id;
  const { customer_name, customer_address, customer_phone } = req.body || {};

  console.log("CHECKOUT BODY:", req.body);
  console.log("CHECKOUT USER ID:", userId);

  if (!customer_name || !customer_address || !customer_phone) {
    return sendError(
      res,
      400,
      "customer_name, customer_address, and customer_phone are required"
    );
  }

  const getCartSql = `
    SELECT *
    FROM carts
    WHERE user_id = ? AND status = 'active'
    LIMIT 1
  `;

  db.query(getCartSql, [userId], (cartErr, cartResult) => {
    if (cartErr) {
      console.log("GET CART ERROR:", cartErr);
      return sendError(res, 500, "Failed to get active cart", cartErr.message);
    }

    console.log("CART RESULT:", cartResult);

    if (cartResult.length === 0) {
      return sendError(res, 404, "Active cart not found");
    }

    const cart = cartResult[0];

    const getItemsSql = `
      SELECT 
        ci.product_id,
        ci.quantity,
        p.name AS product_name,
        p.price,
        p.stock,
        (ci.quantity * p.price) AS subtotal
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.cart_id = ?
    `;

    db.query(getItemsSql, [cart.id], (itemsErr, itemsResult) => {
      if (itemsErr) {
        console.log("GET ITEMS ERROR:", itemsErr);
        return sendError(res, 500, "Failed to get cart items", itemsErr.message);
      }

      console.log("ITEMS RESULT:", itemsResult);

      if (itemsResult.length === 0) {
        return sendError(res, 400, "Cart is empty");
      }

      for (const item of itemsResult) {
        if (Number(item.stock) < Number(item.quantity)) {
          return sendError(
            res,
            400,
            `Insufficient stock for product: ${item.product_name}`
          );
        }
      }

      const subtotal = itemsResult.reduce(
        (sum, item) => sum + Number(item.subtotal),
        0
      );
      const discount = 0;
      const vat = Number((subtotal * 0.07).toFixed(2));
      const total = Number((subtotal - discount + vat).toFixed(2));
      const orderCode = `ORD-${Date.now()}`;

      console.log("ORDER DATA:", {
        orderCode,
        userId,
        customer_name,
        customer_address,
        customer_phone,
        subtotal,
        discount,
        vat,
        total,
      });

      const insertOrderSql = `
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
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      `;

      db.query(
        insertOrderSql,
        [
          orderCode,
          userId,
          customer_name,
          customer_address,
          customer_phone,
          subtotal,
          discount,
          vat,
          total,
        ],
        (orderErr, orderResult) => {
          if (orderErr) {
            console.log("INSERT ORDER ERROR:", orderErr);
            return sendError(res, 500, "Failed to create order", orderErr.message);
          }

          console.log("ORDER INSERT RESULT:", orderResult);

          const orderId = orderResult.insertId;

          const orderItemValues = itemsResult.map((item) => [
            orderId,
            item.product_id,
            item.product_name,
            item.price,
            item.quantity,
            item.subtotal,
          ]);

          console.log("ORDER ITEM VALUES:", orderItemValues);

          const insertOrderItemsSql = `
            INSERT INTO order_items (
              order_id,
              product_id,
              product_name,
              price,
              quantity,
              subtotal
            )
            VALUES ?
          `;

          db.query(insertOrderItemsSql, [orderItemValues], (orderItemsErr) => {
            if (orderItemsErr) {
              console.log("INSERT ORDER ITEMS ERROR:", orderItemsErr);
              return sendError(
                res,
                500,
                "Failed to create order items",
                orderItemsErr.message
              );
            }

            const stockUpdates = itemsResult.map((item) => {
              return new Promise((resolve, reject) => {
                db.query(
                  `UPDATE products SET stock = stock - ? WHERE id = ?`,
                  [item.quantity, item.product_id],
                  (stockErr) => {
                    if (stockErr) {
                      console.log("STOCK UPDATE ERROR:", stockErr);
                      reject(stockErr);
                    } else {
                      resolve();
                    }
                  }
                );
              });
            });

            Promise.all(stockUpdates)
              .then(() => {
                db.query(
                  `DELETE FROM cart_items WHERE cart_id = ?`,
                  [cart.id],
                  (deleteErr) => {
                    if (deleteErr) {
                      console.log("DELETE CART ITEMS ERROR:", deleteErr);
                      return sendError(
                        res,
                        500,
                        "Order created but failed to clear cart items",
                        deleteErr.message
                      );
                    }

                    db.query(
                      `UPDATE carts SET status = 'checked_out' WHERE id = ?`,
                      [cart.id],
                      (cartUpdateErr) => {
                        if (cartUpdateErr) {
                          console.log("UPDATE CART STATUS ERROR:", cartUpdateErr);
                          return sendError(
                            res,
                            500,
                            "Order created but failed to update cart status",
                            cartUpdateErr.message
                          );
                        }

                        return sendSuccess(res, 201, "Checkout successful", {
                          id: orderId,
                          order_code: orderCode,
                          customer_name,
                          customer_address,
                          customer_phone,
                          subtotal,
                          discount,
                          vat,
                          total,
                          status: "pending",
                        });
                      }
                    );
                  }
                );
              })
              .catch((stockErr) => {
                return sendError(
                  res,
                  500,
                  "Failed to update product stock",
                  stockErr.message
                );
              });
          });
        }
      );
    });
  });
};