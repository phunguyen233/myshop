import express from "express";
import { getStatistics } from "../controllers/statisticsController.js";
import requireAdmin from "../middleware/requireAdmin.js";

const router = express.Router();

// Get statistics with time-based filtering (admin only)
router.get("/", requireAdmin, getStatistics);

export default router;
