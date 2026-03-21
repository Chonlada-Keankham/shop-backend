const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");
const { verifyToken } = require("../middleware/authMiddleware");

// CREATE
router.post("/", verifyToken, cartController.createCart);

// READ
router.get("/", verifyToken, cartController.getAllCarts);
router.get("/user/:userId/active", verifyToken, cartController.getActiveCartByUserId);
router.get("/:id", verifyToken, cartController.getCartById);

// UPDATE
router.put("/:id/status", verifyToken, cartController.updateCartStatus);

// DELETE
router.delete("/:id", verifyToken, cartController.deleteCart);

module.exports = router;