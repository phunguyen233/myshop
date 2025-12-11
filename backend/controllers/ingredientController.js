import db from "../config/db.js";

export const getIngredients = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT nl.*, d.ten as don_vi
       FROM nguyenlieu nl
       LEFT JOIN donvi d ON nl.don_vi_id = d.id
       ORDER BY nl.ten_nguyen_lieu`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi lấy danh sách nguyên liệu" });
  }
};

export const addIngredient = async (req, res) => {
  try {
    const { ten_nguyen_lieu, so_luong_ton, don_vi_id, gia_nhap } = req.body;
    if (!ten_nguyen_lieu || don_vi_id == null) return res.status(400).json({ message: "Thiếu thông tin nguyên liệu" });
    const [result] = await db.query(
      "INSERT INTO nguyenlieu (ten_nguyen_lieu, so_luong_ton, don_vi_id, gia_nhap) VALUES (?, ?, ?, ?)",
      [ten_nguyen_lieu, so_luong_ton || 0, don_vi_id, gia_nhap || 0]
    );
    res.status(201).json({ message: "Thêm nguyên liệu thành công", id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi thêm nguyên liệu" });
  }
};

export const getIngredientById = async (req, res) => {
  try {
    const { id } = req.params;
    const [[row]] = await db.query(
      `SELECT nl.*, d.ten as don_vi FROM nguyenlieu nl LEFT JOIN donvi d ON nl.don_vi_id = d.id WHERE nl.ma_nguyen_lieu = ?`,
      [id]
    );
    if (!row) return res.status(404).json({ message: "Nguyên liệu không tồn tại" });

    const [receipts] = await db.query(
      "SELECT * FROM nhapkho_nguyenlieu WHERE ma_nguyen_lieu = ? ORDER BY ngay_nhap DESC",
      [id]
    );

    res.json({ ...row, receipts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi lấy chi tiết nguyên liệu" });
  }
};

export const updateIngredient = async (req, res) => {
  try {
    const { id } = req.params;
    const { ten_nguyen_lieu, so_luong_ton, don_vi_id, gia_nhap } = req.body;
    const [result] = await db.query(
      "UPDATE nguyenlieu SET ten_nguyen_lieu = ?, so_luong_ton = ?, don_vi_id = ?, gia_nhap = ? WHERE ma_nguyen_lieu = ?",
      [ten_nguyen_lieu, so_luong_ton || 0, don_vi_id, gia_nhap || 0, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Nguyên liệu không tồn tại' });
    res.json({ message: 'Cập nhật nguyên liệu thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi cập nhật nguyên liệu' });
  }
};

export const deleteIngredient = async (req, res) => {
  try {
    const { id } = req.params;
    // Kiểm tra xem nguyên liệu có được sử dụng trong bất kỳ công thức sản phẩm nào không
    const [used] = await db.query("SELECT 1 FROM congthuc_sanpham WHERE ma_nguyen_lieu = ? LIMIT 1", [id]);
    if (used.length > 0) {
      return res.status(409).json({ message: 'Nguyên liệu đang được sử dụng trong công thức, không thể xóa' });
    }

    const [result] = await db.query("DELETE FROM nguyenlieu WHERE ma_nguyen_lieu = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Nguyên liệu không tồn tại' });
    res.json({ message: 'Xóa nguyên liệu thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi xóa nguyên liệu' });
  }
};
