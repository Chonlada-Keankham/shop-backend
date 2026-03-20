const express = require('express');
const router = express.Router();

const {
  createProduct,
  getAllProducts,
  getProductById,
  patchProduct,
  deleteProduct,
} = require('../controllers/productController');

// CREATE
router.post('/', createProduct);

// READ
router.get('/', getAllProducts);
router.get('/:id', getProductById);

// UPDATE
router.patch('/:id',patchProduct );

// DELETE
router.delete('/:id', deleteProduct);

module.exports = router;