const db = require("../config/db");

// -------------------------------------------------------------------
// CREATE PRODUCT
// -------------------------------------------------------------------
exports.createProduct = async (req, res) => {
  const { name, description, price, stock, image } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO products (name, description, price, stock, image)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, description, price, stock, image]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -------------------------------------------------------------------
// GET ALL PRODUCTS
// -------------------------------------------------------------------
exports.getAllProducts = async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM products ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -------------------------------------------------------------------
// GET PRODUCT BY ID
// -------------------------------------------------------------------
exports.getProductById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query("SELECT * FROM products WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -------------------------------------------------------------------
// UPDATE PRODUCT
// -------------------------------------------------------------------
exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, description, price, stock, image } = req.body;

  try {
    const result = await db.query(
      `UPDATE products
       SET name = $1,
           description = $2,
           price = $3,
           stock = $4,
           image = $5
       WHERE id = $6
       RETURNING *`,
      [name, description, price, stock, image, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -------------------------------------------------------------------
// DELETE PRODUCT
// -------------------------------------------------------------------
exports.deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      "DELETE FROM products WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};