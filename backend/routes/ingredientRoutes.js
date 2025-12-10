import express from "express";
import { getIngredients, addIngredient, getIngredientById } from "../controllers/ingredientController.js";
import requireAdmin from "../middleware/requireAdmin.js";

const router = express.Router();
router.get("/", getIngredients);
router.post("/", requireAdmin, addIngredient);
router.get("/:id", getIngredientById);

export default router;
