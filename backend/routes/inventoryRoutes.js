import express from "express";
import { getInventoryCurrent, getInventoryHistory, getInventoryAsOf } from "../controllers/inventoryController.js";
const router = express.Router();

router.get("/current", getInventoryCurrent);
router.get("/history", getInventoryHistory);
router.get("/asof", getInventoryAsOf);

export default router;
