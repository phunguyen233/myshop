import path from "path";
import fs from "fs";
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const localPath = req.file.path;

    // Upload to Cloudinary
    const folder = process.env.CLOUDINARY_FOLDER || 'myshop';
    const uploadResult = await cloudinary.uploader.upload(localPath, { folder, resource_type: 'image' });

    // Remove local file after upload
    try { fs.unlinkSync(localPath); } catch (e) { /* ignore */ }

    const url = uploadResult.secure_url || uploadResult.url;
    if (!url) return res.status(500).json({ message: 'Không nhận được URL từ Cloudinary' });

    // Return Cloudinary URL for frontend to save into DB
    res.status(201).json({ url });
  } catch (err) {
    console.error('Upload error', err);
    res.status(500).json({ message: 'Lỗi khi tải ảnh lên' });
  }
};
