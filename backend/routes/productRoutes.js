import express from "express";
import { getProducts, addProduct, updateProduct, toggleProduct, deleteProduct } from "../controllers/productController.js";
const router = express.Router();
router.get("/", getProducts);
router.post("/", addProduct);
router.put("/:id", updateProduct);
router.patch("/:id/toggle", toggleProduct);
router.delete("/:id", deleteProduct);
export default router;
