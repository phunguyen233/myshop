import db from "../config/db.js";

export const getOrders = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT d.*, k.ho_ten as ten_khach_hang FROM donhang d LEFT JOIN khachhang k ON d.ma_khach_hang = k.ma_khach_hang ORDER BY d.thoi_gian_mua DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi lấy danh sách đơn hàng" });
  }
};

export const addOrder = async (req, res) => {
  try {
    const { ma_khach_hang, tong_tien, chi_tiet } = req.body;
    // Insert into donhang
    const [order] = await db.query(
      "INSERT INTO donhang (ma_khach_hang, tong_tien, thoi_gian_mua) VALUES (?, ?, NOW())",
      [ma_khach_hang, tong_tien]
    );
    const ma_don_hang = order.insertId;

    // Insert detail rows into chitiet_donhang. Triggers will update stock and history.
    for (const ct of chi_tiet) {
      await db.query(
        "INSERT INTO chitiet_donhang (ma_don_hang, ma_san_pham, so_luong, don_gia) VALUES (?, ?, ?, ?)",
        [ma_don_hang, ct.ma_san_pham, ct.so_luong, ct.don_gia]
      );
    }

    res.status(201).json({ message: "Tạo đơn hàng thành công", ma_don_hang });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi thêm đơn hàng" });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const [[order]] = await db.query(
      "SELECT d.*, k.ho_ten as ten_khach_hang, k.dia_chi, k.nam_sinh FROM donhang d LEFT JOIN khachhang k ON d.ma_khach_hang = k.ma_khach_hang WHERE d.ma_don_hang = ?",
      [id]
    );

    if (!order) return res.status(404).json({ message: "Đơn hàng không tồn tại" });

    const [items] = await db.query(
      "SELECT c.*, s.ten_san_pham, s.hinh_anh FROM chitiet_donhang c LEFT JOIN sanpham s ON c.ma_san_pham = s.ma_san_pham WHERE c.ma_don_hang = ?",
      [id]
    );

    res.json({ ...order, items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi lấy chi tiết đơn hàng" });
  }
};

export const searchOrders = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    const search = `%${q}%`;
    const [rows] = await db.query(
      `SELECT d.* FROM donhang d LEFT JOIN khachhang k ON d.ma_khach_hang = k.ma_khach_hang
       LEFT JOIN chitiet_donhang c ON c.ma_don_hang = d.ma_don_hang
       LEFT JOIN sanpham s ON s.ma_san_pham = c.ma_san_pham
       WHERE d.ma_don_hang LIKE ? OR k.ho_ten LIKE ? OR s.ten_san_pham LIKE ?
       GROUP BY d.ma_don_hang ORDER BY d.thoi_gian_mua DESC`,
      [search, search, search]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi tìm kiếm đơn hàng" });
  }
};
