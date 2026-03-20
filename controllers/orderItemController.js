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
// 🔸 CREATE ORDER ITEM
// -------------------------------------------------------------------
exports.createOrderItem = (req, res) => {
  const {
    order_id,
    product_id,
    product_name,
    price,
    quantity,
    subtotal,
  } = req.body || {};

  if (!isPositiveInteger(order_id)) {
    return sendError(res, 400, "Valid order_id is required");
  }

  if (!isPositiveInteger(product_id)) {
    return sendError(res, 400, "Valid product_id is required");
  }

  if (!product_name) {
    return sendError(res, 400, "product_name is required");
  }

  if (price === undefined || price === null || Number(price) < 0) {
    return sendError(res, 400, "Valid price is required");
  }

  if (!isPositiveInteger(quantity)) {
    return sendError(res, 400, "quantity must be a positive integer");
  }

  const finalSubtotal =
    subtotal !== undefined && subtotal !== null
      ? Number(subtotal)
      : Number(price) * Number(quantity);

  const checkOrderSql = `
    SELECT *
    FROM orders
    WHERE id = ?
    LIMIT 1
  `;

  db.query(checkOrderSql, [order_id], (orderErr, orderResult) => {
    if (orderErr) {
      return sendError(res, 500, "Failed to check order", orderErr.message);
    }

    if (orderResult.length === 0) {
      return sendError(res, 404, "Order not found");
    }

    const checkProductSql = `
      SELECT *
      FROM products
      WHERE id = ?
      LIMIT 1
    `;

    db.query(checkProductSql, [product_id], (productErr, productResult) => {
      if (productErr) {
        return sendError(res, 500, "Failed to check product", productErr.message);
      }

      if (productResult.length === 0) {
        return sendError(res, 404, "Product not found");
      }

      const insertSql = `
        INSERT INTO order_items (
          order_id,
          product_id,
          product_name,
          price,
          quantity,
          subtotal
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      db.query(
        insertSql,
        [order_id, product_id, product_name, price, quantity, finalSubtotal],
        (insertErr, insertResult) => {
          if (insertErr) {
            return sendError(
              res,
              500,
              "Failed to create order item",
              insertErr.message
            );
          }

          const getNewItemSql = `
            SELECT *
            FROM order_items
            WHERE id = ?
            LIMIT 1
          `;

          db.query(getNewItemSql, [insertResult.insertId], (fetchErr, fetchResult) => {
            if (fetchErr) {
              return sendError(
                res,
                500,
                "Order item created but failed to fetch data",
                fetchErr.message
              );
            }

            return sendSuccess(
              res,
              201,
              "Order item created successfully",
              fetchResult[0]
            );
          });
        }
      );
    });
  });
};

// -------------------------------------------------------------------
// 🔸 GET ALL ORDER ITEMS
// -------------------------------------------------------------------
exports.getAllOrderItems = (req, res) => {
  const sql = `
    SELECT *
    FROM order_items
    ORDER BY id DESC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      return sendError(res, 500, "Failed to get order items", err.message);
    }

    return sendSuccess(res, 200, "Order items retrieved successfully", result);
  });
};

// -------------------------------------------------------------------
// 🔸 GET ORDER ITEM BY ID
// -------------------------------------------------------------------
exports.getOrderItemById = (req, res) => {
  const { id } = req.params;

  if (!isPositiveInteger(id)) {
    return sendError(res, 400, "Valid order item id is required");
  }

  const sql = `
    SELECT *
    FROM order_items
    WHERE id = ?
    LIMIT 1
  `;

  db.query(sql, [id], (err, result) => {
    if (err) {
      return sendError(res, 500, "Failed to get order item", err.message);
    }

    if (result.length === 0) {
      return sendError(res, 404, "Order item not found");
    }

    return sendSuccess(res, 200, "Order item retrieved successfully", result[0]);
  });
};

// -------------------------------------------------------------------
// 🔸 GET ORDER ITEMS BY ORDER ID
// -------------------------------------------------------------------
exports.getOrderItemsByOrderId = (req, res) => {
  const { orderId } = req.params;

  if (!isPositiveInteger(orderId)) {
    return sendError(res, 400, "Valid orderId is required");
  }

  const checkOrderSql = `
    SELECT *
    FROM orders
    WHERE id = ?
    LIMIT 1
  `;

  db.query(checkOrderSql, [orderId], (checkErr, checkResult) => {
    if (checkErr) {
      return sendError(res, 500, "Failed to check order", checkErr.message);
    }

    if (checkResult.length === 0) {
      return sendError(res, 404, "Order not found");
    }

    const sql = `
      SELECT *
      FROM order_items
      WHERE order_id = ?
      ORDER BY id DESC
    `;

    db.query(sql, [orderId], (err, result) => {
      if (err) {
        return sendError(res, 500, "Failed to get order items", err.message);
      }

      return sendSuccess(res, 200, "Order items retrieved successfully", result);
    });
  });
};

// -------------------------------------------------------------------
// 🔸 UPDATE ORDER ITEM
// -------------------------------------------------------------------
exports.updateOrderItem = (req, res) => {
  const { id } = req.params;
  const { product_name, price, quantity } = req.body || {};

  if (!isPositiveInteger(id)) {
    return sendError(res, 400, "Valid order item id is required");
  }

  const checkSql = `
    SELECT *
    FROM order_items
    WHERE id = ?
    LIMIT 1
  `;

  db.query(checkSql, [id], (checkErr, checkResult) => {
    if (checkErr) {
      return sendError(res, 500, "Failed to check order item", checkErr.message);
    }

    if (checkResult.length === 0) {
      return sendError(res, 404, "Order item not found");
    }

    const currentItem = checkResult[0];
    const newProductName = product_name ?? currentItem.product_name;
    const newPrice = price ?? currentItem.price;
    const newQuantity = quantity ?? currentItem.quantity;
    const newSubtotal = Number(newPrice) * Number(newQuantity);

    if (!newProductName) {
      return sendError(res, 400, "product_name is required");
    }

    if (Number(newPrice) < 0) {
      return sendError(res, 400, "price must be greater than or equal to 0");
    }

    if (!isPositiveInteger(newQuantity)) {
      return sendError(res, 400, "quantity must be a positive integer");
    }

    const updateSql = `
      UPDATE order_items
      SET product_name = ?, price = ?, quantity = ?, subtotal = ?
      WHERE id = ?
    `;

    db.query(
      updateSql,
      [newProductName, newPrice, newQuantity, newSubtotal, id],
      (updateErr) => {
        if (updateErr) {
          return sendError(res, 500, "Failed to update order item", updateErr.message);
        }

        const getUpdatedSql = `
          SELECT *
          FROM order_items
          WHERE id = ?
          LIMIT 1
        `;

        db.query(getUpdatedSql, [id], (fetchErr, fetchResult) => {
          if (fetchErr) {
            return sendError(
              res,
              500,
              "Order item updated but failed to fetch data",
              fetchErr.message
            );
          }

          return sendSuccess(
            res,
            200,
            "Order item updated successfully",
            fetchResult[0]
          );
        });
      }
    );
  });
};

// -------------------------------------------------------------------
// 🔸 DELETE ORDER ITEM
// -------------------------------------------------------------------
exports.deleteOrderItem = (req, res) => {
  const { id } = req.params;

  if (!isPositiveInteger(id)) {
    return sendError(res, 400, "Valid order item id is required");
  }

  const checkSql = `
    SELECT *
    FROM order_items
    WHERE id = ?
    LIMIT 1
  `;

  db.query(checkSql, [id], (checkErr, checkResult) => {
    if (checkErr) {
      return sendError(res, 500, "Failed to check order item", checkErr.message);
    }

    if (checkResult.length === 0) {
      return sendError(res, 404, "Order item not found");
    }

    const deleteSql = `
      DELETE FROM order_items
      WHERE id = ?
    `;

    db.query(deleteSql, [id], (deleteErr) => {
      if (deleteErr) {
        return sendError(res, 500, "Failed to delete order item", deleteErr.message);
      }

      return sendSuccess(res, 200, "Order item deleted successfully");
    });
  });
};