const express = require("express");
const router = express.Router();
const cartItemController = require("../controllers/cartItemController");

router.post("/", cartItemController.addItemToCart);
router.get("/cart/:cartId/total", cartItemController.getCartTotalByCartId);
router.get("/cart/:cartId", cartItemController.getItemsByCartId);
router.get("/:id", cartItemController.getCartItemById);
router.put("/:id", cartItemController.updateCartItemQuantity);
router.delete("/:id", cartItemController.deleteCartItem);

module.exports = router;