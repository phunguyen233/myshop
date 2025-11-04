import db from "../config/db.js";

export const getOrders = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM hoadon ORDER BY ngay_lap DESC"
    );
    res.json(rows);
  } catch {
    res.status(500).json({ message: "Lỗi khi lấy danh sách đơn hàng" });
  }
};

export const addOrder = async (req, res) => {
  try {
    const { ma_khach_hang, tong_tien, chi_tiet } = req.body;
    const [order] = await db.query(
      "INSERT INTO hoadon (ma_khach_hang, tong_tien, ngay_lap) VALUES (?, ?, NOW())",
      [ma_khach_hang, tong_tien]
    );
    const ma_hoa_don = order.insertId;

    for (const ct of chi_tiet) {
      await db.query(
        "INSERT INTO chitiethoadon (ma_hoa_don, ma_san_pham, so_luong, don_gia) VALUES (?, ?, ?, ?)",
        [ma_hoa_don, ct.ma_san_pham, ct.so_luong, ct.don_gia]
      );
      await db.query(
        "UPDATE sanpham SET so_luong_ton = so_luong_ton - ? WHERE ma_san_pham=?",
        [ct.so_luong, ct.ma_san_pham]
      );
    }

    res.status(201).json({ message: "Tạo đơn hàng thành công" });
  } catch {
    res.status(500).json({ message: "Lỗi khi thêm đơn hàng" });
  }
};
