const express = require("express");
const router = express.Router();
const cartItemController = require("../controllers/cartItemController");
const { verifyToken } = require("../middleware/authMiddleware");

router.post("/", verifyToken, cartItemController.addItemToCart);
router.get("/cart/:cartId/total", verifyToken, cartItemController.getCartTotalByCartId);
router.get("/cart/:cartId", verifyToken, cartItemController.getItemsByCartId);
router.get("/:id", verifyToken, cartItemController.getCartItemById);
router.put("/:id", verifyToken, cartItemController.updateCartItemQuantity);
router.delete("/:id", verifyToken, cartItemController.deleteCartItem);

module.exports = router;