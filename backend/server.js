import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import db from "./config/db.js";

import productRoutes from "./routes/productRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import warehouseRoutes from "./routes/warehouseRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import statisticsRoutes from "./routes/statisticsRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import unitRoutes from "./routes/unitRoutes.js";
import ingredientRoutes from "./routes/ingredientRoutes.js";
import recipeRoutes from "./routes/recipeRoutes.js";
import receiptRoutes from "./routes/receiptRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import path from "path";
import fs from "fs";

dotenv.config();

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

// Routes
app.use("/api/products", productRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/warehouse", warehouseRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/statistics", statisticsRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/units", unitRoutes);
app.use("/api/ingredients", ingredientRoutes);
app.use("/api/recipes", recipeRoutes);
app.use("/api/ingredient-receipts", receiptRoutes);
// Ensure uploads folder exists and serve it
const uploadsPath = path.join(process.cwd(), 'backend', 'uploads');
if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath, { recursive: true });
app.use('/uploads', express.static(uploadsPath));
app.use('/api/uploads', uploadRoutes);

app.get("/", (req, res) => {
  res.send("🚀 API Hệ thống quản lý cửa hàng đang hoạt động!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server chạy tại ${PORT}`));
