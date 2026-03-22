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
exports.createOrder = async (req, res) => {
  try {
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

    const userResult = await db.query(
      `
      SELECT id
      FROM users
      WHERE id = $1
      LIMIT 1
      `,
      [user_id]
    );

    if (userResult.rows.length === 0) {
      return sendError(res, 404, "User not found");
    }

    const codeResult = await db.query(
      `
      SELECT id
      FROM orders
      WHERE order_code = $1
      LIMIT 1
      `,
      [order_code]
    );

    if (codeResult.rows.length > 0) {
      return sendError(res, 400, "order_code already exists");
    }

    const insertResult = await db.query(
      `
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
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
      `,
      [
        order_code,
        user_id,
        customer_name,
        customer_address,
        customer_phone,
        Number(subtotal),
        Number(discount),
        Number(vat),
        Number(total),
        status,
      ]
    );

    return sendSuccess(
      res,
      201,
      "Order created successfully",
      insertResult.rows[0]
    );
  } catch (error) {
    return sendError(res, 500, "Failed to create order", error.message);
  }
};

// -------------------------------------------------------------------
// 🔸 GET ALL ORDERS
// -------------------------------------------------------------------
exports.getAllOrders = async (req, res) => {
  try {
    const result = await db.query(
      `
      SELECT *
      FROM orders
      ORDER BY id DESC
      `
    );

    return sendSuccess(res, 200, "Orders retrieved successfully", result.rows);
  } catch (error) {
    return sendError(res, 500, "Failed to get orders", error.message);
  }
};

// -------------------------------------------------------------------
// 🔸 GET ORDER BY ID
// -------------------------------------------------------------------
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
      return sendError(res, 400, "Valid order id is required");
    }

    const result = await db.query(
      `
      SELECT *
      FROM orders
      WHERE id = $1
      LIMIT 1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return sendError(res, 404, "Order not found");
    }

    return sendSuccess(
      res,
      200,
      "Order retrieved successfully",
      result.rows[0]
    );
  } catch (error) {
    return sendError(res, 500, "Failed to get order", error.message);
  }
};

// -------------------------------------------------------------------
// 🔸 GET ORDERS BY USER ID
// -------------------------------------------------------------------
exports.getOrdersByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!isPositiveInteger(userId)) {
      return sendError(res, 400, "Valid userId is required");
    }

    const result = await db.query(
      `
      SELECT *
      FROM orders
      WHERE user_id = $1
      ORDER BY id DESC
      `,
      [userId]
    );

    return sendSuccess(
      res,
      200,
      "User orders retrieved successfully",
      result.rows
    );
  } catch (error) {
    return sendError(res, 500, "Failed to get user orders", error.message);
  }
};

// -------------------------------------------------------------------
// 🔸 UPDATE ORDER STATUS
// -------------------------------------------------------------------
exports.updateOrderStatus = async (req, res) => {
  try {
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

    const result = await db.query(
      `
      UPDATE orders
      SET status = $1
      WHERE id = $2
      RETURNING *
      `,
      [status, id]
    );

    if (result.rows.length === 0) {
      return sendError(res, 404, "Order not found");
    }

    return sendSuccess(
      res,
      200,
      "Order status updated successfully",
      result.rows[0]
    );
  } catch (error) {
    return sendError(res, 500, "Failed to update order status", error.message);
  }
};

// -------------------------------------------------------------------
// 🔸 DELETE ORDER
// -------------------------------------------------------------------
exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
      return sendError(res, 400, "Valid order id is required");
    }

    const result = await db.query(
      `
      DELETE FROM orders
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return sendError(res, 404, "Order not found");
    }

    return sendSuccess(res, 200, "Order deleted successfully");
  } catch (error) {
    return sendError(res, 500, "Failed to delete order", error.message);
  }
};

// -------------------------------------------------------------------
// 🔸 GET MY ORDERS
// -------------------------------------------------------------------
exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `
      SELECT *
      FROM orders
      WHERE user_id = $1
      ORDER BY id DESC
      `,
      [userId]
    );

    return sendSuccess(
      res,
      200,
      "My orders retrieved successfully",
      result.rows
    );
  } catch (error) {
    return sendError(res, 500, "Failed to get my orders", error.message);
  }
};

// -------------------------------------------------------------------
// 🔸 CHECKOUT
// -------------------------------------------------------------------
exports.checkout = async (req, res) => {
  const client = await db.connect();

  try {
    const userId = req.user.id;
    const { customer_name, customer_address, customer_phone } = req.body || {};

    if (!customer_name || !customer_address || !customer_phone) {
      client.release();
      return sendError(
        res,
        400,
        "customer_name, customer_address, and customer_phone are required"
      );
    }

    await client.query("BEGIN");

    const cartResult = await client.query(
      `
      SELECT *
      FROM carts
      WHERE user_id = $1 AND status = 'active'
      LIMIT 1
      `,
      [userId]
    );

    if (cartResult.rows.length === 0) {
      await client.query("ROLLBACK");
      client.release();
      return sendError(res, 404, "Active cart not found");
    }

    const cart = cartResult.rows[0];

    const itemsResult = await client.query(
      `
      SELECT 
        ci.product_id,
        ci.quantity,
        p.name AS product_name,
        p.price,
        p.stock,
        (ci.quantity * p.price) AS subtotal
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.cart_id = $1
      ORDER BY ci.id ASC
      `,
      [cart.id]
    );

    if (itemsResult.rows.length === 0) {
      await client.query("ROLLBACK");
      client.release();
      return sendError(res, 400, "Cart is empty");
    }

    for (const item of itemsResult.rows) {
      if (Number(item.stock) < Number(item.quantity)) {
        await client.query("ROLLBACK");
        client.release();
        return sendError(
          res,
          400,
          `Insufficient stock for product: ${item.product_name}`
        );
      }
    }

    const subtotal = itemsResult.rows.reduce(
      (sum, item) => sum + Number(item.subtotal),
      0
    );
    const discount = 0;
    const vat = Number((subtotal * 0.07).toFixed(2));
    const total = Number((subtotal - discount + vat).toFixed(2));
    const orderCode = `ORD-${Date.now()}`;

    const orderInsertResult = await client.query(
      `
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
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
      RETURNING *
      `,
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
      ]
    );

    const order = orderInsertResult.rows[0];

    for (const item of itemsResult.rows) {
      await client.query(
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
        `,
        [
          order.id,
          item.product_id,
          item.product_name,
          item.price,
          item.quantity,
          item.subtotal,
        ]
      );
    }

    for (const item of itemsResult.rows) {
      await client.query(
        `
        UPDATE products
        SET stock = stock - $1
        WHERE id = $2
        `,
        [item.quantity, item.product_id]
      );
    }

    await client.query(
      `
      DELETE FROM cart_items
      WHERE cart_id = $1
      `,
      [cart.id]
    );

    await client.query(
      `
      UPDATE carts
      SET status = 'checked_out', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      `,
      [cart.id]
    );

    await client.query("COMMIT");
    client.release();

    return sendSuccess(res, 201, "Checkout successful", {
      id: order.id,
      order_code: order.order_code,
      customer_name: order.customer_name,
      customer_address: order.customer_address,
      customer_phone: order.customer_phone,
      subtotal: Number(order.subtotal),
      discount: Number(order.discount),
      vat: Number(order.vat),
      total: Number(order.total),
      status: order.status,
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (_) {}
    client.release();
    return sendError(res, 500, "Failed to checkout", error.message);
  }
};