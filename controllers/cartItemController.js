const db = require("../config/db");

// -------------------------------------------------------------------
// ADD ITEM TO CART
// -------------------------------------------------------------------
exports.addItemToCart = async (req, res) => {
  try {
    const { cart_id, product_id, quantity } = req.body || {};

    if (!cart_id || !product_id || !quantity) {
      return res.status(400).json({
        success: false,
        message: "cart_id, product_id, and quantity are required",
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "quantity must be greater than 0",
      });
    }

    // ตรวจสอบ cart
    const cartCheck = await db.query(
      `SELECT * FROM carts WHERE id = $1 AND status = 'active' LIMIT 1`,
      [cart_id]
    );

    if (cartCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Active cart not found",
      });
    }

    // ตรวจสอบสินค้า
    const productCheck = await db.query(
      `SELECT * FROM products WHERE id = $1 LIMIT 1`,
      [product_id]
    );

    if (productCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const product = productCheck.rows[0];

    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: "Insufficient stock",
      });
    }

    // เช็คว่ามี item อยู่แล้วไหม
    const itemCheck = await db.query(
      `SELECT * FROM cart_items WHERE cart_id = $1 AND product_id = $2 LIMIT 1`,
      [cart_id, product_id]
    );

    if (itemCheck.rows.length > 0) {
      const existing = itemCheck.rows[0];
      const newQty = existing.quantity + quantity;

      if (product.stock < newQty) {
        return res.status(400).json({
          success: false,
          message: "Insufficient stock for updated quantity",
        });
      }

      await db.query(
        `UPDATE cart_items SET quantity = $1 WHERE id = $2`,
        [newQty, existing.id]
      );

      const updated = await db.query(
        `SELECT ci.*, p.name AS product_name, p.price
         FROM cart_items ci
         JOIN products p ON ci.product_id = p.id
         WHERE ci.id = $1`,
        [existing.id]
      );

      return res.json({
        success: true,
        message: "Cart item updated",
        data: updated.rows[0],
      });
    }

    // insert ใหม่
    const insert = await db.query(
      `INSERT INTO cart_items (cart_id, product_id, quantity)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [cart_id, product_id, quantity]
    );

    const newItem = await db.query(
      `SELECT ci.*, p.name AS product_name, p.price
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.id = $1`,
      [insert.rows[0].id]
    );

    return res.status(201).json({
      success: true,
      message: "Item added",
      data: newItem.rows[0],
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// -------------------------------------------------------------------
// GET ITEMS BY CART
// -------------------------------------------------------------------
exports.getItemsByCartId = async (req, res) => {
  try {
    const { cartId } = req.params;

    const result = await db.query(
      `SELECT 
        ci.id,
        ci.cart_id,
        ci.product_id,
        p.name AS product_name,
        p.price,
        ci.quantity,
        (p.price * ci.quantity) AS subtotal,
        ci.created_at,
        ci.updated_at
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.cart_id = $1
       ORDER BY ci.id DESC`,
      [cartId]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -------------------------------------------------------------------
// UPDATE QUANTITY
// -------------------------------------------------------------------
exports.updateCartItemQuantity = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ message: "Invalid quantity" });
    }

    const check = await db.query(
      `SELECT ci.*, p.stock
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.id = $1`,
      [id]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ message: "Item not found" });
    }

    if (quantity > check.rows[0].stock) {
      return res.status(400).json({ message: "Insufficient stock" });
    }

    await db.query(
      `UPDATE cart_items SET quantity = $1 WHERE id = $2`,
      [quantity, id]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -------------------------------------------------------------------
// DELETE
// -------------------------------------------------------------------
exports.deleteCartItem = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `DELETE FROM cart_items WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Not found" });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -------------------------------------------------------------------
// TOTAL
// -------------------------------------------------------------------
exports.getCartTotalByCartId = async (req, res) => {
  try {
    const { cartId } = req.params;

    const result = await db.query(
      `SELECT 
        COALESCE(SUM(p.price * ci.quantity), 0) AS total_price
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.cart_id = $1`,
      [cartId]
    );

    res.json({
      success: true,
      data: {
        cart_id: Number(cartId),
        total_price: Number(result.rows[0].total_price),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};