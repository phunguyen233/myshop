import express from "express";
import { getOrders, addOrder, getOrderById, searchOrders } from "../controllers/orderController.js";
const router = express.Router();
router.get("/search", searchOrders);
router.get("/", getOrders);
router.get("/:id", getOrderById);
router.post("/", addOrder);
export default router;
