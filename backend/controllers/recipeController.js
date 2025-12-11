import db from "../config/db.js";

export const getRecipes = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.id,
              c.ma_san_pham,
              c.ma_nguyen_lieu,
              c.so_luong_can,
              c.don_vi_id AS recipe_don_vi_id,
              s.ten_san_pham,
              nl.ten_nguyen_lieu,
              nl.gia_nhap AS nguyenlieu_gia_nhap,
              nl.don_vi_id AS nl_don_vi_id,
              d.ten as recipe_don_vi,
              du.ten as nguyenlieu_don_vi,
              d.he_so_quy_doi AS recipe_he_so,
              du.he_so_quy_doi AS nl_he_so,
              -- cost for this recipe line converted to ingredient's unit price
              ((c.so_luong_can * COALESCE(d.he_so_quy_doi,1)) / NULLIF(COALESCE(du.he_so_quy_doi,1),0)) * COALESCE(nl.gia_nhap,0) AS cost_per_line
       FROM congthuc_sanpham c
       LEFT JOIN sanpham s ON c.ma_san_pham = s.ma_san_pham
       LEFT JOIN nguyenlieu nl ON c.ma_nguyen_lieu = nl.ma_nguyen_lieu
       LEFT JOIN donvi d ON c.don_vi_id = d.id
       LEFT JOIN donvi du ON nl.don_vi_id = du.id
       ORDER BY c.ma_san_pham`)
    ;
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi lấy danh sách công thức" });
  }
};

export const createRecipe = async (req, res) => {
  try {
    const { ma_san_pham, items } = req.body; // items: [{ ma_nguyen_lieu, so_luong_can, don_vi_id }]
    if (!ma_san_pham || !Array.isArray(items) || items.length === 0) return res.status(400).json({ message: "Thiếu thông tin công thức" });

    // Xoá công thức cũ của sản phẩm nếu có
    await db.query("DELETE FROM congthuc_sanpham WHERE ma_san_pham = ?", [ma_san_pham]);

    for (const it of items) {
      await db.query(
        "INSERT INTO congthuc_sanpham (ma_san_pham, ma_nguyen_lieu, so_luong_can, don_vi_id) VALUES (?, ?, ?, ?)",
        [ma_san_pham, it.ma_nguyen_lieu, it.so_luong_can, it.don_vi_id]
      );
    }

    // Calculate total ingredient cost for this product taking unit conversion into account
    const [costRows] = await db.query(
      `SELECT SUM(((c.so_luong_can * COALESCE(d.he_so_quy_doi,1)) / NULLIF(COALESCE(du.he_so_quy_doi,1),0)) * COALESCE(nl.gia_nhap,0)) AS total_cost
       FROM congthuc_sanpham c
       LEFT JOIN nguyenlieu nl ON c.ma_nguyen_lieu = nl.ma_nguyen_lieu
       LEFT JOIN donvi d ON c.don_vi_id = d.id
       LEFT JOIN donvi du ON nl.don_vi_id = du.id
       WHERE c.ma_san_pham = ?`,
      [ma_san_pham]
    );

    res.status(201).json({ message: "Lưu công thức thành công", total_cost: costRows[0]?.total_cost || 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi lưu công thức" });
  }
};

export const getRecipeByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const [rows] = await db.query(
      `SELECT c.*, nl.ten_nguyen_lieu, nl.gia_nhap AS nguyenlieu_gia_nhap, nl.don_vi_id AS nl_don_vi_id, d.ten as recipe_don_vi, du.ten as nguyenlieu_don_vi,
              d.he_so_quy_doi AS recipe_he_so, du.he_so_quy_doi AS nl_he_so,
              ((c.so_luong_can * COALESCE(d.he_so_quy_doi,1)) / NULLIF(COALESCE(du.he_so_quy_doi,1),0)) * COALESCE(nl.gia_nhap,0) AS cost_per_line
       FROM congthuc_sanpham c
       LEFT JOIN nguyenlieu nl ON c.ma_nguyen_lieu = nl.ma_nguyen_lieu
       LEFT JOIN donvi d ON c.don_vi_id = d.id
       LEFT JOIN donvi du ON nl.don_vi_id = du.id
       WHERE c.ma_san_pham = ?`,
      [productId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi lấy công thức sản phẩm" });
  }
};

export const deleteRecipeByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const [result] = await db.query("DELETE FROM congthuc_sanpham WHERE ma_san_pham = ?", [productId]);
    res.json({ message: 'Xóa công thức thành công', affected: result.affectedRows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi xóa công thức' });
  }
};
