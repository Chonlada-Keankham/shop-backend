const db = require('../config/db');

// -------------------------------------------------------------------
// 🔸 CREATE PRODUCT
// -------------------------------------------------------------------
const createProduct = (req, res) => {
  const { name, price, stock, image } = req.body;

  if (!name || !price) {
    return res.status(400).json({
      message: 'Name and price are required',
    });
  }

  const sql =
    'INSERT INTO products (name, price, stock, image) VALUES (?, ?, ?, ?)';

  db.query(sql, [name, price, stock || 0, image || null], (err, result) => {
    if (err) {
      return res.status(500).json({ message: err.message });
    }

    res.status(201).json({
      message: 'Product created successfully',
      productId: result.insertId,
    });
  });
};

// -------------------------------------------------------------------
// 🔸 GET ALL PRODUCTS
// -------------------------------------------------------------------
const getAllProducts = (req, res) => {
  const sql = 'SELECT * FROM products ORDER BY id DESC';

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ message: err.message });
    }

    res.status(200).json(results);
  });
};

// -------------------------------------------------------------------
// 🔸 GET PRODUCT BY ID
// -------------------------------------------------------------------
const getProductById = (req, res) => {
  const { id } = req.params;

  const sql = 'SELECT * FROM products WHERE id = ?';

  db.query(sql, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ message: err.message });
    }

    if (results.length === 0) {
      return res.status(404).json({
        message: 'Product not found',
      });
    }

    res.status(200).json(results[0]);
  });
};

// -------------------------------------------------------------------
// 🔸 PATCH PRODUCT
// -------------------------------------------------------------------
const patchProduct = (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (!updates || Object.keys(updates).length === 0) {
    return res.status(400).json({
      message: 'No data provided for update',
    });
  }

  const updateKeys = Object.keys(updates);
  const isValid = updateKeys.every((key) => ['name', 'price', 'stock', 'image'].includes(key));

  if (!isValid) {
    return res.status(400).json({
      message: 'Invalid field(s) in request body',
    });
  }

  const setClause = updateKeys.map((key) => `${key} = ?`).join(', ');
  const values = updateKeys.map((key) => updates[key]);

  const sql = `UPDATE products SET ${setClause} WHERE id = ?`;

  db.query(sql, [...values, id], (err, result) => {
    if (err) {
      return res.status(500).json({
        message: err.message,
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Product not found',
      });
    }

    return res.status(200).json({
      message: 'Product updated successfully',
    });
  });
};

// -------------------------------------------------------------------
// 🔸 DELETE PRODUCT
// -------------------------------------------------------------------
const deleteProduct = (req, res) => {
  const { id } = req.params;

  const sql = 'DELETE FROM products WHERE id = ?';

  db.query(sql, [id], (err, result) => {
    if (err) {
      return res.status(500).json({ message: err.message });
    }

    res.status(200).json({
      message: 'Product deleted successfully',
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