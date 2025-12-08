import db from "../config/db.js";

export const getOrders = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT d.ma_don_hang, d.ma_khach_hang, d.ten_nguoi_nhan, d.so_dien_thoai_nhan, d.dia_chi_nhan, d.tong_tien, d.trang_thai, DATE_FORMAT(CONVERT_TZ(d.thoi_gian_mua, @@session.time_zone, '+07:00'), '%Y-%m-%d %H:%i:%s') as thoi_gian_mua, k.ho_ten as ten_khach_hang, k.so_dien_thoai as khach_so_dien_thoai FROM donhang d LEFT JOIN khachhang k ON d.ma_khach_hang = k.ma_khach_hang ORDER BY d.thoi_gian_mua DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi lấy danh sách đơn hàng" });
  }
};

export const addOrder = async (req, res) => {
  try {
    // Expect payload: { ma_khach_hang?, ma_tai_khoan?, ho_ten?, nam_sinh?, dia_chi?, so_dien_thoai?, ten_nguoi_nhan, so_dien_thoai_nhan, dia_chi_nhan, tong_tien, chi_tiet }
    const {
      ma_khach_hang,
      ma_tai_khoan,
      ho_ten,
      so_dien_thoai,
      ten_nguoi_nhan,
      so_dien_thoai_nhan,
      dia_chi_nhan,
      tong_tien,
      chi_tiet,
    } = req.body;

    let final_ma_khach_hang = ma_khach_hang || null;

    // If ma_tai_khoan provided, prefer using existing khachhang row for that account
    if (!final_ma_khach_hang && ma_tai_khoan) {
      const [rows] = await db.query("SELECT ma_khach_hang, so_dien_thoai FROM khachhang WHERE ma_tai_khoan = ?", [ma_tai_khoan]);
      if (rows.length > 0) {
        final_ma_khach_hang = rows[0].ma_khach_hang;
        // If phone missing in existing khachhang and provided now, try to update it
        if (!rows[0].so_dien_thoai && so_dien_thoai) {
          await db.query("UPDATE khachhang SET so_dien_thoai = ? WHERE ma_khach_hang = ?", [so_dien_thoai, final_ma_khach_hang]);
        }
      } else {
        // create new khachhang linked to this account
        const [ins] = await db.query(
          "INSERT INTO khachhang (ho_ten, so_dien_thoai, ma_tai_khoan) VALUES (?, ?, ?)",
          [ho_ten || null, so_dien_thoai || null, ma_tai_khoan]
        );
        final_ma_khach_hang = ins.insertId;
      }
    }

    // If still no ma_khach_hang (guest checkout), create a khachhang row without account
    if (!final_ma_khach_hang) {
      const [ins] = await db.query(
        "INSERT INTO khachhang (ho_ten, so_dien_thoai, ma_tai_khoan) VALUES (?, ?, NULL)",
        [ho_ten || null, so_dien_thoai || null]
      );
      final_ma_khach_hang = ins.insertId;
    }

    // Insert into donhang with recipient info
    const [order] = await db.query(
      "INSERT INTO donhang (ma_khach_hang, ten_nguoi_nhan, so_dien_thoai_nhan, dia_chi_nhan, tong_tien, thoi_gian_mua) VALUES (?, ?, ?, ?, ?, NOW())",
      [final_ma_khach_hang, ten_nguoi_nhan || null, so_dien_thoai_nhan || null, dia_chi_nhan || null, tong_tien]
    );
    const ma_don_hang = order.insertId;

    // Insert detail rows into chitiet_donhang. Triggers will update stock and history.
    // Record stock before inserting details so we can detect/neutralize any automatic DB trigger changes
    const beforeStockMap = {};
    for (const ct of chi_tiet) {
      if (beforeStockMap[ct.ma_san_pham] === undefined) {
        const [[row]] = await db.query("SELECT so_luong_ton FROM sanpham WHERE ma_san_pham = ?", [ct.ma_san_pham]);
        beforeStockMap[ct.ma_san_pham] = row ? Number(row.so_luong_ton) : null;
      }
      await db.query(
        "INSERT INTO chitiet_donhang (ma_don_hang, ma_san_pham, so_luong, don_gia) VALUES (?, ?, ?, ?)",
        [ma_don_hang, ct.ma_san_pham, ct.so_luong, ct.don_gia]
      );
    }

    // After inserting details, if any DB trigger auto-decremented stock, restore the difference so creation does not change stock.
    try {
      for (const ct of chi_tiet) {
        const [[afterRow]] = await db.query("SELECT so_luong_ton FROM sanpham WHERE ma_san_pham = ?", [ct.ma_san_pham]);
        const before = beforeStockMap[ct.ma_san_pham];
        const after = afterRow ? Number(afterRow.so_luong_ton) : null;
        if (before != null && after != null && after < before) {
          const diff = before - after;
          await db.query("UPDATE sanpham SET so_luong_ton = so_luong_ton + ? WHERE ma_san_pham = ?", [diff, ct.ma_san_pham]);
          await db.query(
            "INSERT INTO lichsu_tonkho (ma_san_pham, so_luong_thay_doi, ly_do, ngay_thay_doi) VALUES (?, ?, ?, NOW())",
            [ct.ma_san_pham, diff, `Hoàn trả tạm do tạo đơn ${ma_don_hang}`]
          );
        }
      }
    } catch (e) {
      console.error('Warning: failed to neutralize automatic stock changes after order creation', e);
    }

    // Do NOT change product stock at order creation.
    // Stock adjustments happen only when order status is updated to 'hoan_tat'.

    res.status(201).json({ message: "Tạo đơn hàng thành công", ma_don_hang });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi thêm đơn hàng" });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const [[order]] = await db.query(
      "SELECT d.ma_don_hang, d.ma_khach_hang, d.ten_nguoi_nhan, d.so_dien_thoai_nhan, d.dia_chi_nhan, d.tong_tien, d.trang_thai, DATE_FORMAT(CONVERT_TZ(d.thoi_gian_mua, @@session.time_zone, '+07:00'), '%Y-%m-%d %H:%i:%s') as thoi_gian_mua, k.ho_ten as ten_khach_hang, k.so_dien_thoai as khach_so_dien_thoai FROM donhang d LEFT JOIN khachhang k ON d.ma_khach_hang = k.ma_khach_hang WHERE d.ma_don_hang = ?",
      [id]
    );

    if (!order) return res.status(404).json({ message: "Đơn hàng không tồn tại" });

    const [items] = await db.query(
      "SELECT c.*, s.ten_san_pham, s.hinh_anh FROM chitiet_donhang c LEFT JOIN sanpham s ON c.ma_san_pham = s.ma_san_pham WHERE c.ma_don_hang = ?",
      [id]
    );

    res.json({ ...order, items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi lấy chi tiết đơn hàng" });
  }
};

export const searchOrders = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    const search = `%${q}%`;
    const [rows] = await db.query(
      `SELECT d.ma_don_hang, d.ma_khach_hang, d.ten_nguoi_nhan, d.so_dien_thoai_nhan, d.dia_chi_nhan, d.tong_tien, d.trang_thai, DATE_FORMAT(CONVERT_TZ(d.thoi_gian_mua, @@session.time_zone, '+07:00'), '%Y-%m-%d %H:%i:%s') as thoi_gian_mua FROM donhang d LEFT JOIN khachhang k ON d.ma_khach_hang = k.ma_khach_hang
       LEFT JOIN chitiet_donhang c ON c.ma_don_hang = d.ma_don_hang
       LEFT JOIN sanpham s ON s.ma_san_pham = c.ma_san_pham
       WHERE d.ma_don_hang LIKE ? OR k.ho_ten LIKE ? OR s.ten_san_pham LIKE ?
       GROUP BY d.ma_don_hang ORDER BY d.thoi_gian_mua DESC`,
      [search, search, search]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi tìm kiếm đơn hàng" });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { trang_thai } = req.body;
    if (!trang_thai) return res.status(400).json({ message: "Thiếu trạng thái" });

    // Validate against allowed enum values in the database schema
    const allowed = ["cho_xu_ly", "hoan_tat", "huy"];
    if (!allowed.includes(trang_thai)) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ" });
    }

    // If transitioning to 'hoan_tat' from a non-completed state, deduct stock for items in the order.
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [[current]] = await connection.query("SELECT trang_thai FROM donhang WHERE ma_don_hang = ? FOR UPDATE", [id]);
      if (!current) {
        await connection.rollback();
        return res.status(404).json({ message: "Đơn hàng không tồn tại" });
      }

      const prevStatus = current.trang_thai;

      // If moving into 'hoan_tat' from a different state, apply stock deduction
      if (prevStatus !== 'hoan_tat' && trang_thai === 'hoan_tat') {
        // Get order items
        const [items] = await connection.query("SELECT ma_san_pham, so_luong FROM chitiet_donhang WHERE ma_don_hang = ?", [id]);
        for (const it of items) {
          const qty = Number(it.so_luong || 0);
          if (qty <= 0) continue;
          // Decrease stock but never set below 0
          await connection.query("UPDATE sanpham SET so_luong_ton = GREATEST(0, so_luong_ton - ?) WHERE ma_san_pham = ?", [qty, it.ma_san_pham]);
          // Insert stock history (negative change)
          await connection.query(
            "INSERT INTO lichsu_tonkho (ma_san_pham, so_luong_thay_doi, ly_do, ngay_thay_doi) VALUES (?, ?, ?, NOW())",
            [it.ma_san_pham, -qty, `Trừ tồn khi hoàn tất đơn ${id}`]
          );
        }
      }

      // Update order status
      await connection.query("UPDATE donhang SET trang_thai = ? WHERE ma_don_hang = ?", [trang_thai, id]);

      await connection.commit();

      const [[order]] = await db.query(
        "SELECT d.ma_don_hang, d.ma_khach_hang, d.ten_nguoi_nhan, d.so_dien_thoai_nhan, d.dia_chi_nhan, d.tong_tien, d.trang_thai, DATE_FORMAT(CONVERT_TZ(d.thoi_gian_mua, @@session.time_zone, '+07:00'), '%Y-%m-%d %H:%i:%s') as thoi_gian_mua, k.ho_ten as ten_khach_hang, k.so_dien_thoai as khach_so_dien_thoai FROM donhang d LEFT JOIN khachhang k ON d.ma_khach_hang = k.ma_khach_hang WHERE d.ma_don_hang = ?",
        [id]
      );

      res.json({ message: "Cập nhật trạng thái thành công", order });
    } catch (e) {
      await connection.rollback();
      console.error(e);
      res.status(500).json({ message: "Lỗi khi cập nhật trạng thái đơn" });
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi cập nhật trạng thái đơn" });
  }
};
