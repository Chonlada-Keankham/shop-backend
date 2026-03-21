const express = require("express");
const router = express.Router();
const orderItemController = require("../controllers/orderItemController");
const { verifyToken } = require("../middleware/authMiddleware");

router.post("/", verifyToken, orderItemController.createOrderItem);
router.get("/", verifyToken, orderItemController.getAllOrderItems);
router.get("/order/:orderId", verifyToken, orderItemController.getOrderItemsByOrderId);
router.get("/:id", verifyToken, orderItemController.getOrderItemById);
router.put("/:id", verifyToken, orderItemController.updateOrderItem);
router.delete("/:id", verifyToken, orderItemController.deleteOrderItem);

module.exports = router;