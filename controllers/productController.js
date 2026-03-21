const db = require('../config/db');

// -------------------------------------------------------------------
// GET ALL PRODUCTS (PUBLIC)
// -------------------------------------------------------------------
exports.getAllProducts = (req, res) => {
  const sql = `
    SELECT * FROM products
    ORDER BY id DESC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch products",
        error: err.message,
      });
    }

    return res.status(200).json({
      success: true,
      data: result,
    });
  });
};

// -------------------------------------------------------------------
// GET PRODUCT BY ID (PUBLIC)
// -------------------------------------------------------------------
exports.getProductById = (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT * FROM products
    WHERE id = ?
    LIMIT 1
  `;

  db.query(sql, [id], (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch product",
        error: err.message,
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: result[0],
    });
  });
};

// -------------------------------------------------------------------
// CREATE PRODUCT (ADMIN)
// -------------------------------------------------------------------
exports.createProduct = (req, res) => {
  const { name, price, stock, image } = req.body || {};

  if (!name || price === undefined || stock === undefined) {
    return res.status(400).json({
      success: false,
      message: "name, price and stock are required",
    });
  }

  const sql = `
    INSERT INTO products (name, price, stock, image)
    VALUES (?, ?, ?, ?)
  `;

  db.query(sql, [name, price, stock, image || null], (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to create product",
        error: err.message,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: {
        id: result.insertId,
        name,
        price,
        stock,
        image: image || null,
      },
    });
  });
};

// -------------------------------------------------------------------
// UPDATE PRODUCT (ADMIN)
// -------------------------------------------------------------------
exports.updateProduct = (req, res) => {
  const { id } = req.params;
  const { name, price, stock, image } = req.body || {};

  if (!name || price === undefined || stock === undefined) {
    return res.status(400).json({
      success: false,
      message: "name, price and stock are required",
    });
  }

  const sql = `
    UPDATE products
    SET name = ?, price = ?, stock = ?, image = ?
    WHERE id = ?
  `;

  db.query(sql, [name, price, stock, image || null, id], (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to update product",
        error: err.message,
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
    });
  });
};

// -------------------------------------------------------------------
// DELETE PRODUCT (ADMIN)
// -------------------------------------------------------------------
exports.deleteProduct = (req, res) => {
  const { id } = req.params;

  const sql = `
    DELETE FROM products
    WHERE id = ?
  `;

  db.query(sql, [id], (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to delete product",
        error: err.message,
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  });
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  patchProduct,
  deleteProduct,
};