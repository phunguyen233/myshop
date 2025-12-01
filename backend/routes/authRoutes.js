import express from "express";
import { register, login, googleLogin, googleCodeLogin } from "../controllers/authController.js";
const router = express.Router();
router.post("/register", register);
router.post("/login", login);
router.post("/google", googleLogin);
router.post("/google/code", googleCodeLogin);
export default router;
