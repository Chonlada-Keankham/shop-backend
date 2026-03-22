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
exports.createOrderItem = async (req, res) => {
  try {
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

    const orderResult = await db.query(
      `
      SELECT *
      FROM orders
      WHERE id = $1
      LIMIT 1
      `,
      [order_id]
    );

    if (orderResult.rows.length === 0) {
      return sendError(res, 404, "Order not found");
    }

    const productResult = await db.query(
      `
      SELECT *
      FROM products
      WHERE id = $1
      LIMIT 1
      `,
      [product_id]
    );

    if (productResult.rows.length === 0) {
      return sendError(res, 404, "Product not found");
    }

    const insertResult = await db.query(
      `
      INSERT INTO order_items (
        order_id,
        product_id,
        product_name,
        price,
        quantity,
        subtotal
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [order_id, product_id, product_name, price, quantity, finalSubtotal]
    );

    return sendSuccess(
      res,
      201,
      "Order item created successfully",
      insertResult.rows[0]
    );
  } catch (error) {
    return sendError(res, 500, "Failed to create order item", error.message);
  }
};

// -------------------------------------------------------------------
// 🔸 GET ALL ORDER ITEMS
// -------------------------------------------------------------------
exports.getAllOrderItems = async (req, res) => {
  try {
    const result = await db.query(
      `
      SELECT *
      FROM order_items
      ORDER BY id DESC
      `
    );

    return sendSuccess(
      res,
      200,
      "Order items retrieved successfully",
      result.rows
    );
  } catch (error) {
    return sendError(res, 500, "Failed to get order items", error.message);
  }
};

// -------------------------------------------------------------------
// 🔸 GET ORDER ITEM BY ID
// -------------------------------------------------------------------
exports.getOrderItemById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
      return sendError(res, 400, "Valid order item id is required");
    }

    const result = await db.query(
      `
      SELECT *
      FROM order_items
      WHERE id = $1
      LIMIT 1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return sendError(res, 404, "Order item not found");
    }

    return sendSuccess(
      res,
      200,
      "Order item retrieved successfully",
      result.rows[0]
    );
  } catch (error) {
    return sendError(res, 500, "Failed to get order item", error.message);
  }
};

// -------------------------------------------------------------------
// 🔸 GET ORDER ITEMS BY ORDER ID
// -------------------------------------------------------------------
exports.getOrderItemsByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!isPositiveInteger(orderId)) {
      return sendError(res, 400, "Valid orderId is required");
    }

    const orderResult = await db.query(
      `
      SELECT *
      FROM orders
      WHERE id = $1
      LIMIT 1
      `,
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      return sendError(res, 404, "Order not found");
    }

    const result = await db.query(
      `
      SELECT *
      FROM order_items
      WHERE order_id = $1
      ORDER BY id DESC
      `,
      [orderId]
    );

    return sendSuccess(
      res,
      200,
      "Order items retrieved successfully",
      result.rows
    );
  } catch (error) {
    return sendError(res, 500, "Failed to get order items", error.message);
  }
};

// -------------------------------------------------------------------
// 🔸 UPDATE ORDER ITEM
// -------------------------------------------------------------------
exports.updateOrderItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { product_name, price, quantity } = req.body || {};

    if (!isPositiveInteger(id)) {
      return sendError(res, 400, "Valid order item id is required");
    }

    const currentResult = await db.query(
      `
      SELECT *
      FROM order_items
      WHERE id = $1
      LIMIT 1
      `,
      [id]
    );

    if (currentResult.rows.length === 0) {
      return sendError(res, 404, "Order item not found");
    }

    const currentItem = currentResult.rows[0];
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

    const updatedResult = await db.query(
      `
      UPDATE order_items
      SET product_name = $1, price = $2, quantity = $3, subtotal = $4
      WHERE id = $5
      RETURNING *
      `,
      [newProductName, newPrice, newQuantity, newSubtotal, id]
    );

    return sendSuccess(
      res,
      200,
      "Order item updated successfully",
      updatedResult.rows[0]
    );
  } catch (error) {
    return sendError(res, 500, "Failed to update order item", error.message);
  }
};

// -------------------------------------------------------------------
// 🔸 DELETE ORDER ITEM
// -------------------------------------------------------------------
exports.deleteOrderItem = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
      return sendError(res, 400, "Valid order item id is required");
    }

    const result = await db.query(
      `
      DELETE FROM order_items
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return sendError(res, 404, "Order item not found");
    }

    return sendSuccess(res, 200, "Order item deleted successfully");
  } catch (error) {
    return sendError(res, 500, "Failed to delete order item", error.message);
  }
};