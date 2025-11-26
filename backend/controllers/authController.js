import db from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  try {
    // Expect payload: { ten_dang_nhap, mat_khau, ho_ten? , email?, so_dien_thoai? }
    const { ten_dang_nhap, mat_khau, ho_ten, email, so_dien_thoai } = req.body;
    const [exist] = await db.query("SELECT * FROM taikhoan WHERE ten_dang_nhap=?", [ten_dang_nhap]);
    if (exist.length > 0) return res.status(400).json({ message: "Tài khoản đã tồn tại" });

    const hash = await bcrypt.hash(mat_khau, 10);
    await db.query(
      "INSERT INTO taikhoan (ten_dang_nhap, mat_khau, ho_ten, email, so_dien_thoai) VALUES (?, ?, ?, ?, ?)",
      [ten_dang_nhap, hash, ho_ten || null, email || null, so_dien_thoai || null]
    );

    // Fetch the created user to return (so frontend can auto-login)
    const [newRows] = await db.query("SELECT * FROM taikhoan WHERE ten_dang_nhap=?", [ten_dang_nhap]);
    const newUser = newRows[0];

    // Build userId the same way as in login
    const userId = newUser?.ma_tai_khoan || newUser?.id || newUser?.ID || newUser?.ma_tk || null;
    const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_changed_for_dev_only";
    const token = jwt.sign({ id: userId, ten_dang_nhap: newUser.ten_dang_nhap, ho_ten: newUser.ho_ten }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({ message: "Đăng ký thành công", token, user: { id: userId, ten_dang_nhap: newUser.ten_dang_nhap, ho_ten: newUser.ho_ten, email: newUser.email } });
  } catch (err) {
    console.error("Error in register:", err);
    res.status(500).json({ message: "Lỗi khi đăng ký" });
  }
};

export const login = async (req, res) => {
  try {
    const { ten_dang_nhap, mat_khau } = req.body;
    const [rows] = await db.query("SELECT * FROM taikhoan WHERE ten_dang_nhap=?", [ten_dang_nhap]);
    if (rows.length === 0) return res.status(400).json({ message: "Sai tài khoản" });

    const user = rows[0];
    const match = await bcrypt.compare(mat_khau, user.mat_khau);
    if (!match) return res.status(400).json({ message: "Sai mật khẩu" });
    // Use a fallback secret for development if JWT_SECRET is not set
    const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_changed_for_dev_only";

    // The primary key column in taikhoan could be named differently (ma_tai_khoan, id, ID).
    // Pick a sensible id field if present.
    const userId = user.ma_tai_khoan || user.id || user.ID || user.ma_tk || null;

    const role = user.vai_tro || user.role || (user.ten_dang_nhap === 'admin' ? 'admin' : null);
    const token = jwt.sign({ id: userId, ten_dang_nhap: user.ten_dang_nhap, ho_ten: user.ho_ten, role }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      message: "Đăng nhập thành công",
      token,
      user: { id: userId, ten_dang_nhap: user.ten_dang_nhap, ho_ten: user.ho_ten, email: user.email, role },
    });
  } catch (err) {
    console.error("Error in login:", err);
    res.status(500).json({ message: "Lỗi khi đăng nhập" });
  }
};
