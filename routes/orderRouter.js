const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { verifyToken } = require("../middleware/authMiddleware");

router.post("/", orderController.createOrder);
router.get("/", orderController.getAllOrders);
router.get("/user/:userId", orderController.getOrdersByUserId);
router.get("/:id", orderController.getOrderById);
router.patch("/:id/status", orderController.updateOrderStatus);
router.delete("/:id", orderController.deleteOrder);
router.post("/checkout", verifyToken, orderController.checkout);

// NEW (สำคัญ)
router.get("/my-orders", verifyToken, (req, res) => {
    const userId = req.user.id;

    db.query(
        `SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC`,
        [userId],
        (err, result) => {
            if (err) {
                return res.status(500).json({ message: "Error" });
            }

            res.json(result);
        }
    );
});
module.exports = router;