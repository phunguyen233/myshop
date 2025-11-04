import db from "../config/db.js";

// Lấy danh sách nhập kho
export const getWarehouse = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM nhapkho ORDER BY ngay_nhap DESC");
    res.json(rows);
  } catch {
    res.status(500).json({ message: "Lỗi khi lấy danh sách nhập kho" });
  }
};

// Thêm phiếu nhập
export const addWarehouse = async (req, res) => {
  try {
    const { ma_san_pham, so_luong, gia_nhap } = req.body;
    await db.query(
      "INSERT INTO nhapkho (ma_san_pham, so_luong, gia_nhap, ngay_nhap) VALUES (?, ?, ?, NOW())",
      [ma_san_pham, so_luong, gia_nhap]
    );
    await db.query(
      "UPDATE sanpham SET so_luong_ton = so_luong_ton + ? WHERE ma_san_pham=?",
      [so_luong, ma_san_pham]
    );
    res.status(201).json({ message: "Nhập kho thành công" });
  } catch {
    res.status(500).json({ message: "Lỗi khi nhập kho" });
  }
};
