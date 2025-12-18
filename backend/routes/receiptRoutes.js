import express from "express";
import { addReceipt, getReceiptsByIngredient, updateReceipt, deleteReceipt } from "../controllers/receiptController.js";
import requireAdmin from "../middleware/requireAdmin.js";

const router = express.Router();
router.post("/:ma_nguyen_lieu", requireAdmin, addReceipt);
router.get("/:ma_nguyen_lieu", getReceiptsByIngredient);
router.put("/entry/:id", requireAdmin, updateReceipt);
router.delete("/entry/:id", requireAdmin, deleteReceipt);

export default router;
