import db from "../config/db.js";

export const getProducts = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM sanpham WHERE trang_thai='hien'");
    res.json(rows);
  } catch {
    res.status(500).json({ message: "Lỗi khi lấy danh sách sản phẩm" });
  }
};

export const addProduct = async (req, res) => {
  try {
    const { ten_san_pham, gia_ban, so_luong_ton, hinh_anh } = req.body;
    const [result] = await db.query(
      "INSERT INTO sanpham (ten_san_pham, gia_ban, so_luong_ton, hinh_anh) VALUES (?, ?, ?, ?)",
      [ten_san_pham, gia_ban, so_luong_ton, hinh_anh]
    );
    res.status(201).json({ message: "Thêm sản phẩm thành công", id: result.insertId });
  } catch {
    res.status(500).json({ message: "Lỗi khi thêm sản phẩm" });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { ten_san_pham, gia_ban, so_luong_ton, hinh_anh, trang_thai } = req.body;
    await db.query(
      "UPDATE sanpham SET ten_san_pham=?, gia_ban=?, so_luong_ton=?, hinh_anh=?, trang_thai=? WHERE ma_san_pham=?",
      [ten_san_pham, gia_ban, so_luong_ton, hinh_anh, trang_thai, id]
    );
    res.json({ message: "Cập nhật sản phẩm thành công" });
  } catch {
    res.status(500).json({ message: "Lỗi khi cập nhật sản phẩm" });
  }
};

export const toggleProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query(
      "UPDATE sanpham SET trang_thai = IF(trang_thai='hien','an','hien') WHERE ma_san_pham=?",
      [id]
    );
    res.json({ message: "Đã thay đổi trạng thái sản phẩm" });
  } catch {
    res.status(500).json({ message: "Lỗi khi thay đổi trạng thái" });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM sanpham WHERE ma_san_pham=?", [id]);
    res.json({ message: "Xóa sản phẩm thành công" });
  } catch {
    res.status(500).json({ message: "Lỗi khi xóa sản phẩm" });
  }
};
