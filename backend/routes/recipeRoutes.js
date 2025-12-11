import express from "express";
import { getRecipes, createRecipe, getRecipeByProduct, deleteRecipeByProduct } from "../controllers/recipeController.js";
import requireAdmin from "../middleware/requireAdmin.js";

const router = express.Router();
router.get("/", getRecipes);
router.post("/", requireAdmin, createRecipe);
router.get("/product/:productId", getRecipeByProduct);
router.delete("/product/:productId", requireAdmin, deleteRecipeByProduct);

export default router;
