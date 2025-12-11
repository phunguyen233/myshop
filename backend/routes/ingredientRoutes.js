import express from "express";
import { getIngredients, addIngredient, getIngredientById, updateIngredient, deleteIngredient } from "../controllers/ingredientController.js";
import requireAdmin from "../middleware/requireAdmin.js";

const router = express.Router();
router.get("/", getIngredients);
router.post("/", requireAdmin, addIngredient);
router.get("/:id", getIngredientById);
router.put("/:id", requireAdmin, updateIngredient);
router.delete("/:id", requireAdmin, deleteIngredient);

export default router;
