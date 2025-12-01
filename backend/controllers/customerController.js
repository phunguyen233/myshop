import db from "../config/db.js";

export const getCustomers = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT ma_khach_hang, ho_ten, so_dien_thoai, ma_tai_khoan, DATE_FORMAT(CONVERT_TZ(ngay_tao, @@session.time_zone, '+07:00'), '%Y-%m-%d %H:%i:%s') as ngay_tao FROM khachhang"
    );
    res.json(rows);
  } catch {
    res.status(500).json({ message: "Lỗi khi lấy danh sách khách hàng" });
  }
};

export const addCustomer = async (req, res) => {
  try {
    const { ho_ten, so_dien_thoai, ma_tai_khoan } = req.body;
    // If ma_tai_khoan provided, ensure we don't create duplicate customer rows for same account
    if (ma_tai_khoan) {
      const [exists] = await db.query("SELECT * FROM khachhang WHERE ma_tai_khoan = ?", [ma_tai_khoan]);
      if (exists.length > 0) {
        // Return existing customer id instead of creating a new row
        return res.status(200).json({ message: "Khách hàng đã tồn tại cho tài khoản này", ma_khach_hang: exists[0].ma_khach_hang });
      }
    }
    const [result] = await db.query(
      "INSERT INTO khachhang (ho_ten, so_dien_thoai, ma_tai_khoan) VALUES (?, ?, ?)",
      [ho_ten, so_dien_thoai || null, ma_tai_khoan || null]
    );
    const insertId = result.insertId;
    res.status(201).json({ message: "Thêm khách hàng thành công", ma_khach_hang: insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi thêm khách hàng" });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { ho_ten, so_dien_thoai, ma_tai_khoan } = req.body;
    // If trying to assign ma_tai_khoan, ensure it's not already used by other customer
    if (ma_tai_khoan) {
      const [rows] = await db.query("SELECT * FROM khachhang WHERE ma_tai_khoan = ? AND ma_khach_hang <> ?", [ma_tai_khoan, id]);
      if (rows.length > 0) {
        return res.status(409).json({ message: 'Tài khoản này đã được gán cho khách hàng khác' });
      }
    }
    await db.query(
      "UPDATE khachhang SET ho_ten=?, so_dien_thoai=?, ma_tai_khoan=? WHERE ma_khach_hang=?",
      [ho_ten, so_dien_thoai || null, ma_tai_khoan || null, id]
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
      "SELECT d.ma_don_hang, d.ma_khach_hang, d.ten_nguoi_nhan, d.so_dien_thoai_nhan, d.dia_chi_nhan, d.tong_tien, d.trang_thai, DATE_FORMAT(CONVERT_TZ(d.thoi_gian_mua, @@session.time_zone, '+07:00'), '%Y-%m-%d %H:%i:%s') as thoi_gian_mua FROM donhang d WHERE d.ma_khach_hang = ? ORDER BY d.thoi_gian_mua DESC",
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
