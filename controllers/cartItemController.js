const db = require("../config/db");

// -------------------------------------------------------------------
// ADD ITEM TO CART
// -------------------------------------------------------------------
exports.addItemToCart = (req, res) => {
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

  const checkCartSql = `
    SELECT * FROM carts
    WHERE id = ? AND status = 'active'
    LIMIT 1
  `;

  db.query(checkCartSql, [cart_id], (cartErr, cartResult) => {
    if (cartErr) {
      return res.status(500).json({
        success: false,
        message: "Failed to check cart",
        error: cartErr.message,
      });
    }

    if (cartResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Active cart not found",
      });
    }

    const checkProductSql = `
      SELECT * FROM products
      WHERE id = ?
      LIMIT 1
    `;

    db.query(checkProductSql, [product_id], (productErr, productResult) => {
      if (productErr) {
        return res.status(500).json({
          success: false,
          message: "Failed to check product",
          error: productErr.message,
        });
      }

      if (productResult.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      const product = productResult[0];

      if (product.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: "Insufficient stock",
        });
      }

      const checkItemSql = `
        SELECT * FROM cart_items
        WHERE cart_id = ? AND product_id = ?
        LIMIT 1
      `;

      db.query(checkItemSql, [cart_id, product_id], (itemErr, itemResult) => {
        if (itemErr) {
          return res.status(500).json({
            success: false,
            message: "Failed to check cart item",
            error: itemErr.message,
          });
        }

        if (itemResult.length > 0) {
          const existingItem = itemResult[0];
          const newQuantity = existingItem.quantity + quantity;

          if (product.stock < newQuantity) {
            return res.status(400).json({
              success: false,
              message: "Insufficient stock for updated quantity",
            });
          }

          const updateSql = `
            UPDATE cart_items
            SET quantity = ?
            WHERE id = ?
          `;

          db.query(updateSql, [newQuantity, existingItem.id], (updateErr) => {
            if (updateErr) {
              return res.status(500).json({
                success: false,
                message: "Failed to update cart item quantity",
                error: updateErr.message,
              });
            }

            const getUpdatedItemSql = `
              SELECT ci.*, p.name AS product_name, p.price
              FROM cart_items ci
              JOIN products p ON ci.product_id = p.id
              WHERE ci.id = ?
            `;

            db.query(getUpdatedItemSql, [existingItem.id], (fetchErr, fetchResult) => {
              if (fetchErr) {
                return res.status(500).json({
                  success: false,
                  message: "Quantity updated but failed to fetch cart item",
                  error: fetchErr.message,
                });
              }

              return res.status(200).json({
                success: true,
                message: "Cart item quantity updated successfully",
                data: fetchResult[0],
              });
            });
          });
        } else {
          const insertSql = `
            INSERT INTO cart_items (cart_id, product_id, quantity)
            VALUES (?, ?, ?)
          `;

          db.query(insertSql, [cart_id, product_id, quantity], (insertErr, insertResult) => {
            if (insertErr) {
              return res.status(500).json({
                success: false,
                message: "Failed to add item to cart",
                error: insertErr.message,
              });
            }

            const getNewItemSql = `
              SELECT ci.*, p.name AS product_name, p.price
              FROM cart_items ci
              JOIN products p ON ci.product_id = p.id
              WHERE ci.id = ?
            `;

            db.query(getNewItemSql, [insertResult.insertId], (fetchErr, fetchResult) => {
              if (fetchErr) {
                return res.status(500).json({
                  success: false,
                  message: "Item added but failed to fetch cart item",
                  error: fetchErr.message,
                });
              }

              return res.status(201).json({
                success: true,
                message: "Item added to cart successfully",
                data: fetchResult[0],
              });
            });
          });
        }
      });
    });
  });
};

// -------------------------------------------------------------------
// GET ITEMS BY CART ID
// -------------------------------------------------------------------
exports.getItemsByCartId = (req, res) => {
  const { cartId } = req.params;

  const sql = `
    SELECT 
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
    WHERE ci.cart_id = ?
    ORDER BY ci.id DESC
  `;

  db.query(sql, [cartId], (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to get cart items",
        error: err.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Cart items retrieved successfully",
      data: result,
    });
  });
};

// -------------------------------------------------------------------
// GET CART ITEM BY ID
// -------------------------------------------------------------------
exports.getCartItemById = (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT 
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
    WHERE ci.id = ?
    LIMIT 1
  `;

  db.query(sql, [id], (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to get cart item",
        error: err.message,
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Cart item retrieved successfully",
      data: result[0],
    });
  });
};

// -------------------------------------------------------------------
// UPDATE CART ITEM QUANTITY
// -------------------------------------------------------------------
exports.updateCartItemQuantity = (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body || {};

  if (!quantity) {
    return res.status(400).json({
      success: false,
      message: "quantity is required",
    });
  }

  if (quantity <= 0) {
    return res.status(400).json({
      success: false,
      message: "quantity must be greater than 0",
    });
  }

  const checkItemSql = `
    SELECT ci.*, p.stock
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    WHERE ci.id = ?
    LIMIT 1
  `;

  db.query(checkItemSql, [id], (checkErr, checkResult) => {
    if (checkErr) {
      return res.status(500).json({
        success: false,
        message: "Failed to check cart item",
        error: checkErr.message,
      });
    }

    if (checkResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    const cartItem = checkResult[0];

    if (quantity > cartItem.stock) {
      return res.status(400).json({
        success: false,
        message: "Insufficient stock",
      });
    }

    const updateSql = `
      UPDATE cart_items
      SET quantity = ?
      WHERE id = ?
    `;

    db.query(updateSql, [quantity, id], (updateErr) => {
      if (updateErr) {
        return res.status(500).json({
          success: false,
          message: "Failed to update cart item quantity",
          error: updateErr.message,
        });
      }

      const getUpdatedSql = `
        SELECT 
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
        WHERE ci.id = ?
        LIMIT 1
      `;

      db.query(getUpdatedSql, [id], (fetchErr, fetchResult) => {
        if (fetchErr) {
          return res.status(500).json({
            success: false,
            message: "Quantity updated but failed to fetch cart item",
            error: fetchErr.message,
          });
        }

        return res.status(200).json({
          success: true,
          message: "Cart item quantity updated successfully",
          data: fetchResult[0],
        });
      });
    });
  });
};

// -------------------------------------------------------------------
// DELETE CART ITEM
// -------------------------------------------------------------------
exports.deleteCartItem = (req, res) => {
  const { id } = req.params;

  const checkSql = `
    SELECT * FROM cart_items
    WHERE id = ?
    LIMIT 1
  `;

  db.query(checkSql, [id], (checkErr, checkResult) => {
    if (checkErr) {
      return res.status(500).json({
        success: false,
        message: "Failed to check cart item",
        error: checkErr.message,
      });
    }

    if (checkResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    const deleteSql = `
      DELETE FROM cart_items
      WHERE id = ?
    `;

    db.query(deleteSql, [id], (deleteErr) => {
      if (deleteErr) {
        return res.status(500).json({
          success: false,
          message: "Failed to delete cart item",
          error: deleteErr.message,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Cart item deleted successfully",
      });
    });
  });
};

// -------------------------------------------------------------------
// GET CART TOTAL BY CART ID
// -------------------------------------------------------------------
exports.getCartTotalByCartId = (req, res) => {
  const { cartId } = req.params;

  const sql = `
    SELECT 
      ci.cart_id,
      COALESCE(SUM(p.price * ci.quantity), 0) AS total_price
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    WHERE ci.cart_id = ?
    GROUP BY ci.cart_id
  `;

  db.query(sql, [cartId], (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to get cart total",
        error: err.message,
      });
    }

    if (result.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Cart total retrieved successfully",
        data: {
          cart_id: Number(cartId),
          total_price: 0,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Cart total retrieved successfully",
      data: result[0],
    });
  });
};