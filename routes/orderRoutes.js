const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { verifyToken } = require("../middleware/authMiddleware");
const { isAdmin } = require("../middleware/roleMiddleware");

// USER
router.post("/checkout", verifyToken, orderController.checkout);
router.get("/my-orders", verifyToken, orderController.getMyOrders);

// ADMIN
router.get("/admin/all", verifyToken, isAdmin, orderController.getAllOrders);
router.patch("/admin/:id/status", verifyToken, isAdmin, orderController.updateOrderStatus);

// OPTIONAL
router.post("/", orderController.createOrder);
router.get("/user/:userId", orderController.getOrdersByUserId);
router.delete("/:id", orderController.deleteOrder);

// MUST BE LAST
router.get("/:id", verifyToken, orderController.getOrderById);

module.exports = router;