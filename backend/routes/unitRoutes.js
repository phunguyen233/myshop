import express from "express";
import { getUnits, addUnit } from "../controllers/unitController.js";
import requireAdmin from "../middleware/requireAdmin.js";

const router = express.Router();
router.get("/", getUnits);
router.post("/", requireAdmin, addUnit);

export default router;
