import db from "../config/db.js";

export const getInventoryCurrent = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT ma_san_pham, ten_san_pham, so_luong_ton FROM sanpham ORDER BY ten_san_pham");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi lấy tồn kho" });
  }
};

export const getInventoryHistory = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT l.*, s.ten_san_pham FROM lichsu_tonkho l LEFT JOIN sanpham s ON l.ma_san_pham = s.ma_san_pham ORDER BY l.ngay_thay_doi DESC");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi lấy lịch sử tồn kho" });
  }
};

// Tính tồn kho tới một ngày (inclusive)
export const getInventoryAsOf = async (req, res) => {
  try {
    const { date } = req.query; // expected YYYY-MM-DD or full datetime
    if (!date) return res.status(400).json({ message: "Thiếu tham số date" });
    // Compute stock as of date by subtracting any changes after the date from current stock
    const [rows] = await db.query(
      `SELECT s.ma_san_pham, s.ten_san_pham,
        (s.so_luong_ton - COALESCE((SELECT SUM(l2.so_luong_thay_doi) FROM lichsu_tonkho l2 WHERE l2.ma_san_pham = s.ma_san_pham AND l2.ngay_thay_doi > ?),0)) AS so_luong_as_of
       FROM sanpham s`,
      [date]
    );
    res.json(rows.map(r => ({ ...r, so_luong_as_of: Number(r.so_luong_as_of) })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi tính tồn kho theo ngày" });
  }
};
