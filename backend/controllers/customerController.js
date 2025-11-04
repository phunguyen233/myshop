import db from "../config/db.js";

export const getCustomers = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM khachhang");
    res.json(rows);
  } catch {
    res.status(500).json({ message: "Lỗi khi lấy danh sách khách hàng" });
  }
};

export const addCustomer = async (req, res) => {
  try {
    const { ten_khach_hang, sdt, dia_chi } = req.body;
    await db.query(
      "INSERT INTO khachhang (ten_khach_hang, sdt, dia_chi) VALUES (?, ?, ?)",
      [ten_khach_hang, sdt, dia_chi]
    );
    res.status(201).json({ message: "Thêm khách hàng thành công" });
  } catch {
    res.status(500).json({ message: "Lỗi khi thêm khách hàng" });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { ten_khach_hang, sdt, dia_chi } = req.body;
    await db.query(
      "UPDATE khachhang SET ten_khach_hang=?, sdt=?, dia_chi=? WHERE ma_khach_hang=?",
      [ten_khach_hang, sdt, dia_chi, id]
    );
    res.json({ message: "Cập nhật khách hàng thành công" });
  } catch {
    res.status(500).json({ message: "Lỗi khi cập nhật khách hàng" });
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM khachhang WHERE ma_khach_hang=?", [id]);
    res.json({ message: "Xóa khách hàng thành công" });
  } catch {
    res.status(500).json({ message: "Lỗi khi xóa khách hàng" });
  }
};
