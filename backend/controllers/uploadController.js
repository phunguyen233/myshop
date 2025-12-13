import path from "path";
import fs from "fs";

export const uploadImage = (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const filename = req.file.filename;
    const host = req.get('host');
    const protocol = req.protocol;
    // Return full URL
    const url = `${protocol}://${host}/uploads/${filename}`;
    res.status(201).json({ url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi tải ảnh lên' });
  }
};
