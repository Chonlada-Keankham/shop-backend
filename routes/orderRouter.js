const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { verifyToken } = require("../middleware/authMiddleware");

// USER
router.post("/checkout", verifyToken, orderController.checkout);
router.get("/my-orders", verifyToken, orderController.getMyOrders);

// GENERAL
router.post("/", orderController.createOrder);
router.get("/", orderController.getAllOrders);
router.get("/user/:userId", orderController.getOrdersByUserId);
router.patch("/:id/status", orderController.updateOrderStatus);
router.delete("/:id", orderController.deleteOrder);

// MUST BE LAST
router.get("/:id", orderController.getOrderById);

module.exports = router;