import express from "express";
import { addReceipt, getReceiptsByIngredient } from "../controllers/receiptController.js";
import requireAdmin from "../middleware/requireAdmin.js";

const router = express.Router();
router.post("/:ma_nguyen_lieu", requireAdmin, addReceipt);
router.get("/:ma_nguyen_lieu", getReceiptsByIngredient);

export default router;
