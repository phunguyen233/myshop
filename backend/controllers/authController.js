import db from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';

export const register = async (req, res) => {
  try {
    // Dữ liệu mong đợi: { ten_dang_nhap, mat_khau, ho_ten? , email?, so_dien_thoai? }
    const { ten_dang_nhap, mat_khau, ho_ten, email, so_dien_thoai } = req.body;
    const [exist] = await db.query("SELECT * FROM taikhoan WHERE ten_dang_nhap=?", [ten_dang_nhap]);
    if (exist.length > 0) return res.status(400).json({ message: "Tài khoản đã tồn tại" });

    const hash = await bcrypt.hash(mat_khau, 10);
    await db.query(
      "INSERT INTO taikhoan (ten_dang_nhap, mat_khau, ho_ten, email, so_dien_thoai) VALUES (?, ?, ?, ?, ?)",
      [ten_dang_nhap, hash, ho_ten || null, email || null, so_dien_thoai || null]
    );

    // Lấy thông tin user vừa tạo để trả về (frontend có thể tự động đăng nhập)
    const [newRows] = await db.query("SELECT * FROM taikhoan WHERE ten_dang_nhap=?", [ten_dang_nhap]);
    const newUser = newRows[0];

    // Xây dựng `userId` giống cách xử lý trong hàm login
    const userId = newUser?.ma_tai_khoan || newUser?.id || newUser?.ID || newUser?.ma_tk || null;
    const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_changed_for_dev_only";
    const token = jwt.sign({ id: userId, ten_dang_nhap: newUser.ten_dang_nhap, ho_ten: newUser.ho_ten }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({ message: "Đăng ký thành công", token, user: { id: userId, ten_dang_nhap: newUser.ten_dang_nhap, ho_ten: newUser.ho_ten, email: newUser.email } });
    } catch (err) {
    console.error("Lỗi khi đăng ký:", err);
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
    // Sử dụng secret dự phòng cho môi trường phát triển nếu JWT_SECRET chưa được thiết lập
    const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_changed_for_dev_only";

    // Cột khóa chính trong `taikhoan` có thể có tên khác nhau (ma_tai_khoan, id, ID).
    // Chọn trường id phù hợp nếu tồn tại.
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
    console.error("Lỗi khi đăng nhập:", err);
    res.status(500).json({ message: "Lỗi khi đăng nhập" });
  }
};

export const googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ message: 'Thiếu idToken' });

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) return res.status(500).json({ message: 'Server chưa cấu hình GOOGLE_CLIENT_ID' });

    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({ idToken, audience: clientId });
    const payload = ticket.getPayload();
    if (!payload) return res.status(400).json({ message: 'Token Google không hợp lệ' });

    const email = payload.email;
    const name = payload.name || payload.given_name || '';

    // Thử tìm tài khoản theo email
    const [rows] = await db.query('SELECT * FROM taikhoan WHERE email=?', [email]);
    let user = rows[0];
    if (!user) {
      // Tạo tài khoản mới dùng phần trước của email làm `ten_dang_nhap` nếu có
      // Nếu không có email, fallback sang `google_<sub>`
      const username = email ? String(email).split('@')[0] : `google_${payload.sub}`;
      // Đảm bảo `ten_dang_nhap` là duy nhất: nếu phần trước của email đã tồn tại, thử dùng email đầy đủ hoặc `google_<sub>`
      let finalUsername = username;
      const [check] = await db.query('SELECT * FROM taikhoan WHERE ten_dang_nhap=?', [finalUsername]);
      if (check.length > 0) {
        // thử dùng email đầy đủ làm `ten_dang_nhap`
        finalUsername = email || `google_${payload.sub}`;
        const [check2] = await db.query('SELECT * FROM taikhoan WHERE ten_dang_nhap=?', [finalUsername]);
        if (check2.length > 0) {
          finalUsername = `google_${payload.sub}`;
        }
      }
        const [rows] = await db.query('SELECT * FROM taikhoan WHERE email=?', [email]);
        // Tạo tài khoản mới dùng phần trước của email làm `ten_dang_nhap` nếu có
        // Nếu không có email, fallback sang `google_<sub>`
      const randomPwd = crypto.randomBytes(16).toString('hex');
      const hashedPwd = await bcrypt.hash(randomPwd, 10);
      await db.query('INSERT INTO taikhoan (ten_dang_nhap, mat_khau, ho_ten, email) VALUES (?, ?, ?, ?)', [finalUsername, hashedPwd, name || null, email || null]);
      const [newRows] = await db.query('SELECT * FROM taikhoan WHERE ten_dang_nhap=?', [finalUsername]);
      user = newRows[0];
    }

    const userId = user.ma_tai_khoan || user.id || user.ID || user.ma_tk || null;
    const role = user.vai_tro || user.role || null;
    const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_changed_for_dev_only';
    const token = jwt.sign({ id: userId, ten_dang_nhap: user.ten_dang_nhap, ho_ten: user.ho_ten, role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ message: 'Đăng nhập thành công', token, user: { id: userId, ten_dang_nhap: user.ten_dang_nhap, ho_ten: user.ho_ten, email: user.email, role } });
  } catch (err) {
    console.error('Lỗi khi đăng nhập bằng Google:', err);
    res.status(500).json({ message: 'Lỗi khi đăng nhập bằng Google' });
  }
};

export const googleCodeLogin = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: 'Thiếu code' });

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) return res.status(500).json({ message: 'Server chưa cấu hình thông tin client Google' });

    const client = new OAuth2Client(clientId, clientSecret, 'postmessage');
    const tokenResponse = await client.getToken(code);
    const tokens = tokenResponse.tokens;
    const idToken = tokens.id_token;
    if (!idToken) return res.status(400).json({ message: 'Không nhận được id_token từ Google' });

    const ticket = await client.verifyIdToken({ idToken, audience: clientId });
    const payload = ticket.getPayload();
    if (!payload) return res.status(400).json({ message: 'Invalid Google token' });

    const email = payload.email;
    const name = payload.name || payload.given_name || '';

    // Tìm hoặc tạo tài khoản theo email
    const [rows] = await db.query('SELECT * FROM taikhoan WHERE email=?', [email]);
    let user = rows[0];
    if (!user) {
      const username = email ? String(email).split('@')[0] : `google_${payload.sub}`;
      let finalUsername = username;
      const [check] = await db.query('SELECT * FROM taikhoan WHERE ten_dang_nhap=?', [finalUsername]);
      if (check.length > 0) {
        finalUsername = email || `google_${payload.sub}`;
        const [check2] = await db.query('SELECT * FROM taikhoan WHERE ten_dang_nhap=?', [finalUsername]);
        if (check2.length > 0) {
          finalUsername = `google_${payload.sub}`;
        }
      }
      // Sinh mật khẩu ngẫu nhiên cho tài khoản (đã hash) vì cột `mat_khau` có ràng buộc NOT NULL trong schema
      const randomPwd2 = crypto.randomBytes(16).toString('hex');
      const hashedPwd2 = await bcrypt.hash(randomPwd2, 10);
      await db.query('INSERT INTO taikhoan (ten_dang_nhap, mat_khau, ho_ten, email) VALUES (?, ?, ?, ?)', [finalUsername, hashedPwd2, name || null, email || null]);
      const [newRows] = await db.query('SELECT * FROM taikhoan WHERE ten_dang_nhap=?', [finalUsername]);
      user = newRows[0];
    }

    const userId = user.ma_tai_khoan || user.id || user.ID || user.ma_tk || null;
    const role = user.vai_tro || user.role || null;
    const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_changed_for_dev_only';
    const token = jwt.sign({ id: userId, ten_dang_nhap: user.ten_dang_nhap, ho_ten: user.ho_ten, role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ message: 'Đăng nhập thành công', token, user: { id: userId, ten_dang_nhap: user.ten_dang_nhap, ho_ten: user.ho_ten, email: user.email, role } });
  } catch (err) {
    console.error('Lỗi khi đăng nhập bằng Google (code):', err);
    res.status(500).json({ message: 'Lỗi khi đăng nhập bằng Google (code)' });
  }
};
