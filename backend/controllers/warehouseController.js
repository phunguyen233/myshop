import db from "../config/db.js";

// Lấy danh sách nhập kho
export const getWarehouse = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM nhapkho ORDER BY thoi_gian_nhap DESC");
    res.json(rows);
  } catch {
    res.status(500).json({ message: "Lỗi khi lấy danh sách nhập kho" });
  }
};

// Thêm phiếu nhập
export const addWarehouse = async (req, res) => {
  try {
    // Expect payload: { don_vi_nhap, chi_tiet: [{ ma_san_pham, so_luong, don_gia_nhap }, ...] }
    const { don_vi_nhap, chi_tiet } = req.body;
    if (!chi_tiet || !Array.isArray(chi_tiet) || chi_tiet.length === 0) {
      return res.status(400).json({ message: "Thiếu chi tiết nhập kho" });
    }

    let tong_gia_tri = 0;
    for (const it of chi_tiet) {
      tong_gia_tri += (Number(it.so_luong) || 0) * (Number(it.don_gia_nhap) || 0);
    }

    const [result] = await db.query(
      "INSERT INTO nhapkho (don_vi_nhap, tong_gia_tri, thoi_gian_nhap) VALUES (?, ?, NOW())",
      [don_vi_nhap, tong_gia_tri]
    );
    const ma_nhap = result.insertId;

    for (const it of chi_tiet) {
      await db.query(
        "INSERT INTO chitiet_nhapkho (ma_nhap, ma_san_pham, so_luong, don_gia_nhap) VALUES (?, ?, ?, ?)",
        [ma_nhap, it.ma_san_pham, it.so_luong, it.don_gia_nhap]
      );
      // DB trigger trg_tang_tonkho_sau_khi_nhap will update sanpham and lichsu_tonkho
    }

    res.status(201).json({ message: "Nhập kho thành công", ma_nhap });
  } catch {
    res.status(500).json({ message: "Lỗi khi nhập kho" });
  }
};
