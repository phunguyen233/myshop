import express from "express";
import { getWarehouse, addWarehouse } from "../controllers/warehouseController.js";
const router = express.Router();
router.get("/", getWarehouse);
router.post("/", addWarehouse);
export default router;
