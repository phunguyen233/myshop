import express from "express";
import { getOrders, addOrder, getOrderById, searchOrders, updateOrderStatus } from "../controllers/orderController.js";
import requireAdmin from "../middleware/requireAdmin.js";
const router = express.Router();
router.get("/search", searchOrders);
router.get("/", getOrders);
router.get("/:id", getOrderById);
router.put("/:id/status", requireAdmin, updateOrderStatus);
// Public/payment webhook friendly endpoint to mark order as paid (no admin middleware)
router.post("/:id/paid", async (req, res, next) => {
	// set the desired status and forward to updateOrderStatus handler
	req.body = req.body || {};
	req.body.trang_thai = 'da_thanh_toan';
	return updateOrderStatus(req, res, next);
});
router.post("/", addOrder);
export default router;
