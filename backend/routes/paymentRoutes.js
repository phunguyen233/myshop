// routes/paymentRoutes.js

import express from "express";
import { generateQR, cancelOrder } from "../controllers/paymentController.js";

const router = express.Router();

// API tạo QR động
router.get("/vietqr", generateQR);

// Hủy đơn hàng và hoàn trả tồn kho
router.post("/cancel", cancelOrder);

export default router;
