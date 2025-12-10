import express from "express";
import { getRecipes, createRecipe, getRecipeByProduct } from "../controllers/recipeController.js";
import requireAdmin from "../middleware/requireAdmin.js";

const router = express.Router();
router.get("/", getRecipes);
router.post("/", requireAdmin, createRecipe);
router.get("/product/:productId", getRecipeByProduct);

export default router;
