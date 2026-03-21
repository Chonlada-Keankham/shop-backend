const express = require("express");
const router = express.Router();
const orderItemController = require("../controllers/orderItemController");
const { verifyToken } = require("../middleware/authMiddleware");

// CREATE
router.post("/", verifyToken, orderItemController.createOrderItem);

// READ
router.get("/", verifyToken, orderItemController.getAllOrderItems);
router.get("/order/:orderId", verifyToken, orderItemController.getOrderItemsByOrderId);
router.get("/:id", verifyToken, orderItemController.getOrderItemById);

// UPDATE
router.put("/:id", verifyToken, orderItemController.updateOrderItem);

// DELETE
router.delete("/:id", verifyToken, orderItemController.deleteOrderItem);

module.exports = router;