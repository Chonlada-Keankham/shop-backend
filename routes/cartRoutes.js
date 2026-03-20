const express = require("express");
const router = express.Router();
const cartController = require("../controllers/CartController");

router.post("/", cartController.createCart);
router.get("/", cartController.getAllCarts);
router.get("/user/:userId/active", cartController.getActiveCartByUserId);
router.get("/:id", cartController.getCartById);
router.put("/:id/status", cartController.updateCartStatus);
router.delete("/:id", cartController.deleteCart);

module.exports = router;