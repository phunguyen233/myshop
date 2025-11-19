import express from "express";
import { getCustomers, addCustomer, updateCustomer, deleteCustomer, getCustomerOrders } from "../controllers/customerController.js";
const router = express.Router();
router.get("/", getCustomers);
router.get("/:id/orders", getCustomerOrders);
router.post("/", addCustomer);
router.put("/:id", updateCustomer);
router.delete("/:id", deleteCustomer);
export default router;
