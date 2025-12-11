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

      // Lấy thông tin đơn vị lưu trữ của nguyên liệu và hệ số quy đổi
      const [nlRows] = await connection.query(
        `SELECT nl.don_vi_id AS nl_don_vi_id, d.he_so_quy_doi AS nl_he_so, din.he_so_quy_doi AS incoming_he_so
         FROM nguyenlieu nl
         LEFT JOIN donvi d ON nl.don_vi_id = d.id
         LEFT JOIN donvi din ON din.id = ?
         WHERE nl.ma_nguyen_lieu = ?`,
        [don_vi_id, ma_nguyen_lieu]
      );

      const info = nlRows && nlRows[0] ? nlRows[0] : null;
      // Nếu không có thông tin đơn vị, fallback: cộng trực tiếp
      let converted = Number(so_luong_nhap);
      if (info && info.nl_he_so && info.incoming_he_so) {
        // Chuyển số lượng nhập (theo đơn vị incoming) về đơn vị của nguyên liệu
        // công thức: converted = so_luong_nhap * incoming_he_so / nl_he_so
        const nl_he_so = Number(info.nl_he_so) || 1;
        const incoming_he_so = Number(info.incoming_he_so) || 1;
        converted = (Number(so_luong_nhap) * incoming_he_so) / nl_he_so;
      }

      // Tăng tồn kho nguyên liệu bằng lượng đã quy đổi về đơn vị lưu trữ
      await connection.query("UPDATE nguyenlieu SET so_luong_ton = so_luong_ton + ? WHERE ma_nguyen_lieu = ?", [converted, ma_nguyen_lieu]);

      // Ghi lich su ton kho (nếu có bảng lichsu_tonkho) - ghi lượng đã quy đổi
      await connection.query(
        "INSERT INTO lichsu_tonkho (ma_san_pham, so_luong_thay_doi, ly_do, ngay_thay_doi) VALUES (?, ?, ?, NOW())",
        [ma_nguyen_lieu, converted, `Nhập kho nguyên liệu (phiếu ${ins.insertId})`]
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
