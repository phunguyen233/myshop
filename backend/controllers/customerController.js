import db from "../config/db.js";

export const getCustomers = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM khachhang");
    res.json(rows);
  } catch {
    res.status(500).json({ message: "Lỗi khi lấy danh sách khách hàng" });
  }
};

export const addCustomer = async (req, res) => {
  try {
    const { ho_ten, nam_sinh, dia_chi, ma_tai_khoan } = req.body;
    const [result] = await db.query(
      "INSERT INTO khachhang (ho_ten, nam_sinh, dia_chi, ma_tai_khoan) VALUES (?, ?, ?, ?)",
      [ho_ten, nam_sinh || null, dia_chi || null, ma_tai_khoan || null]
    );
    const insertId = result.insertId;
    res.status(201).json({ message: "Thêm khách hàng thành công", ma_khach_hang: insertId });
  } catch {
    res.status(500).json({ message: "Lỗi khi thêm khách hàng" });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { ho_ten, nam_sinh, dia_chi, ma_tai_khoan } = req.body;
    await db.query(
      "UPDATE khachhang SET ho_ten=?, nam_sinh=?, dia_chi=?, ma_tai_khoan=? WHERE ma_khach_hang=?",
      [ho_ten, nam_sinh || null, dia_chi || null, ma_tai_khoan || null, id]
    );
    res.json({ message: "Cập nhật khách hàng thành công" });
  } catch {
    res.status(500).json({ message: "Lỗi khi cập nhật khách hàng" });
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM khachhang WHERE ma_khach_hang=?", [id]);
    res.json({ message: "Xóa khách hàng thành công" });
  } catch {
    res.status(500).json({ message: "Lỗi khi xóa khách hàng" });
  }
};

export const getCustomerOrders = async (req, res) => {
  try {
    const { id } = req.params;
    const [orders] = await db.query(
      "SELECT d.* FROM donhang d WHERE d.ma_khach_hang = ? ORDER BY d.thoi_gian_mua DESC",
      [id]
    );
    // For each order, fetch items
    const results = [];
    for (const o of orders) {
      const [items] = await db.query(
        "SELECT c.*, s.ten_san_pham FROM chitiet_donhang c LEFT JOIN sanpham s ON c.ma_san_pham = s.ma_san_pham WHERE c.ma_don_hang = ?",
        [o.ma_don_hang]
      );
      results.push({ ...o, items });
    }
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi lấy lịch sử mua hàng của khách" });
  }
};
