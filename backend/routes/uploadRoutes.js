import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import requireAdmin from "../middleware/requireAdmin.js";
import { uploadImage } from "../controllers/uploadController.js";

const router = express.Router();

const uploadsDir = path.join(process.cwd(), 'backend', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9.\-_%]/g, '_');
    cb(null, `${Date.now()}_${safe}`);
  }
});

const upload = multer({ storage });

// POST /api/uploads - upload image (admin)
router.post('/', requireAdmin, upload.single('file'), uploadImage);

export default router;
