import db from "../config/db.js";

export const addReceipt = async (req, res) => {
  try {
    const { ma_nguyen_lieu } = req.params;
    const { so_luong_nhap, don_vi_id, don_gia } = req.body;
    if (!ma_nguyen_lieu || so_luong_nhap == null || don_vi_id == null) return res.status(400).json({ message: "Thiếu thông tin phiếu nhập" });

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [ins] = await connection.query(
        "INSERT INTO nhapkho_nguyenlieu (ma_nguyen_lieu, so_luong_nhap, don_vi_id, don_gia, ngay_nhap) VALUES (?, ?, ?, ?, NOW())",
        [ma_nguyen_lieu, so_luong_nhap, don_vi_id, don_gia || 0]
      );

      // Tăng tồn kho nguyên liệu
      await connection.query("UPDATE nguyenlieu SET so_luong_ton = so_luong_ton + ? WHERE ma_nguyen_lieu = ?", [so_luong_nhap, ma_nguyen_lieu]);

      // Ghi lich su ton kho (nếu có bảng lichsu_tonkho)
      await connection.query(
        "INSERT INTO lichsu_tonkho (ma_san_pham, so_luong_thay_doi, ly_do, ngay_thay_doi) VALUES (?, ?, ?, NOW())",
        [ma_nguyen_lieu, so_luong_nhap, `Nhập kho nguyên liệu (phiếu ${ins.insertId})`]
      );

      await connection.commit();
      res.status(201).json({ message: "Nhập kho nguyên liệu thành công", id: ins.insertId });
    } catch (e) {
      await connection.rollback();
      console.error(e);
      res.status(500).json({ message: "Lỗi khi nhập kho nguyên liệu" });
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

export const getReceiptsByIngredient = async (req, res) => {
  try {
    const { ma_nguyen_lieu } = req.params;
    const [rows] = await db.query("SELECT * FROM nhapkho_nguyenlieu WHERE ma_nguyen_lieu = ? ORDER BY ngay_nhap DESC", [ma_nguyen_lieu]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi lấy phiếu nhập" });
  }
};
