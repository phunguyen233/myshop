import express from "express";
import { getWarehouse, addWarehouse } from "../controllers/warehouseController.js";
import requireAdmin from "../middleware/requireAdmin.js";
const router = express.Router();
router.get("/", getWarehouse);
router.post("/", requireAdmin, addWarehouse);
export default router;
