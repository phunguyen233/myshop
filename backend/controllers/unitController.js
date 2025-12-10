import db from "../config/db.js";

export const getUnits = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM donvi ORDER BY id");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi lấy danh sách đơn vị" });
  }
};

export const addUnit = async (req, res) => {
  try {
    const { ten, he_so_quy_doi } = req.body;
    if (!ten || he_so_quy_doi == null) return res.status(400).json({ message: "Thiếu thông tin đơn vị" });
    const [result] = await db.query("INSERT INTO donvi (ten, he_so_quy_doi) VALUES (?, ?)", [ten, he_so_quy_doi]);
    res.status(201).json({ message: "Thêm đơn vị thành công", id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi thêm đơn vị" });
  }
};
