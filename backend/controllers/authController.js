import db from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  try {
    const { username, password } = req.body;
    const [exist] = await db.query("SELECT * FROM taikhoan WHERE username=?", [username]);
    if (exist.length > 0) return res.status(400).json({ message: "Tài khoản đã tồn tại" });

    const hash = await bcrypt.hash(password, 10);
    await db.query("INSERT INTO taikhoan (username, password) VALUES (?, ?)", [username, hash]);
    res.status(201).json({ message: "Đăng ký thành công" });
  } catch {
    res.status(500).json({ message: "Lỗi khi đăng ký" });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const [rows] = await db.query("SELECT * FROM taikhoan WHERE username=?", [username]);
    if (rows.length === 0) return res.status(400).json({ message: "Sai tài khoản" });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Sai mật khẩu" });

    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.json({ message: "Đăng nhập thành công", token });
  } catch {
    res.status(500).json({ message: "Lỗi khi đăng nhập" });
  }
};
