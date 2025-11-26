import express from "express";
import { getCustomers, addCustomer, updateCustomer, deleteCustomer, getCustomerOrders } from "../controllers/customerController.js";
import requireAdmin from "../middleware/requireAdmin.js";
const router = express.Router();
router.get("/", getCustomers);
router.get("/:id/orders", getCustomerOrders);
// Allow public customers creation from shop frontend (checkout)
router.post("/", addCustomer);
router.put("/:id", requireAdmin, updateCustomer);
router.delete("/:id", requireAdmin, deleteCustomer);
export default router;
