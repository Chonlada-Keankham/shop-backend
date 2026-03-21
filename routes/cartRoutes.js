const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");
const { verifyToken } = require("../middleware/authMiddleware");

router.post("/", verifyToken, cartController.createCart);
router.get("/", verifyToken, cartController.getAllCarts);
router.get("/user/:userId/active", verifyToken, cartController.getActiveCartByUserId);
router.get("/:id", verifyToken, cartController.getCartById);
router.put("/:id/status", verifyToken, cartController.updateCartStatus);
router.delete("/:id", cartController.deleteCart);
router.post("/", verifyToken, cartController.createCart);
router.get("/user/active", verifyToken, cartController.getActiveCartByUserId);
module.exports = router;