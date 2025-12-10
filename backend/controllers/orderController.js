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
    // Dữ liệu mong đợi: { ma_khach_hang?, ma_tai_khoan?, ho_ten?, nam_sinh?, dia_chi?, so_dien_thoai?, ten_nguoi_nhan, so_dien_thoai_nhan, dia_chi_nhan, tong_tien, chi_tiet }
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

    // Nếu có `ma_tai_khoan`, ưu tiên sử dụng bản ghi `khachhang` hiện có cho tài khoản đó
    if (!final_ma_khach_hang && ma_tai_khoan) {
      const [rows] = await db.query("SELECT ma_khach_hang, so_dien_thoai FROM khachhang WHERE ma_tai_khoan = ?", [ma_tai_khoan]);
      if (rows.length > 0) {
        final_ma_khach_hang = rows[0].ma_khach_hang;
        // Nếu `so_dien_thoai` trong bản ghi khachhang hiện tại trống và người dùng cung cấp, cập nhật
        if (!rows[0].so_dien_thoai && so_dien_thoai) {
          await db.query("UPDATE khachhang SET so_dien_thoai = ? WHERE ma_khach_hang = ?", [so_dien_thoai, final_ma_khach_hang]);
        }
      } else {
        // Tạo bản ghi `khachhang` mới liên kết với tài khoản này
        const [ins] = await db.query(
          "INSERT INTO khachhang (ho_ten, so_dien_thoai, ma_tai_khoan) VALUES (?, ?, ?)",
          [ho_ten || null, so_dien_thoai || null, ma_tai_khoan]
        );
        final_ma_khach_hang = ins.insertId;
      }
    }

    // Nếu vẫn chưa có `ma_khach_hang` (khách vãng lai), tạo bản ghi `khachhang` không liên kết tài khoản
    if (!final_ma_khach_hang) {
      const [ins] = await db.query(
        "INSERT INTO khachhang (ho_ten, so_dien_thoai, ma_tai_khoan) VALUES (?, ?, NULL)",
        [ho_ten || null, so_dien_thoai || null]
      );
      final_ma_khach_hang = ins.insertId;
    }

    // Chèn bản ghi vào `donhang` kèm thông tin người nhận
    const [order] = await db.query(
      "INSERT INTO donhang (ma_khach_hang, ten_nguoi_nhan, so_dien_thoai_nhan, dia_chi_nhan, tong_tien, thoi_gian_mua) VALUES (?, ?, ?, ?, ?, NOW())",
      [final_ma_khach_hang, ten_nguoi_nhan || null, so_dien_thoai_nhan || null, dia_chi_nhan || null, tong_tien]
    );
    const ma_don_hang = order.insertId;

    // Chèn chi tiết đơn vào `chitiet_donhang`.
    // Ghi nhận tồn kho trước khi chèn chi tiết để phát hiện và trung hòa những thay đổi tự động do trigger DB (nếu có)
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

    // Sau khi chèn chi tiết, nếu trigger DB tự động giảm tồn kho, phục hồi phần chênh lệch để việc tạo đơn không làm thay đổi tồn kho.
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
      console.error('Cảnh báo: không thể trung hòa thay đổi tồn kho tự động sau khi tạo đơn', e);
    }

    // KHÔNG thay đổi tồn kho khi tạo đơn.
    // Việc điều chỉnh tồn kho chỉ thực hiện khi trạng thái đơn được cập nhật thành 'hoan_tat'.

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

    // Kiểm tra giá trị trạng thái có hợp lệ so với enum trong schema
    const allowed = ["cho_xu_ly", "hoan_tat", "huy"];
    if (!allowed.includes(trang_thai)) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ" });
    }

    // Nếu chuyển trạng thái sang 'hoan_tat' (hoàn tất), sẽ trừ tồn cho các sản phẩm trong đơn.
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [[current]] = await connection.query("SELECT trang_thai FROM donhang WHERE ma_don_hang = ? FOR UPDATE", [id]);
      if (!current) {
        await connection.rollback();
        return res.status(404).json({ message: "Đơn hàng không tồn tại" });
      }

      const prevStatus = current.trang_thai;

      // Nếu trạng thái trước đó khác 'hoan_tat' và hiện đang chuyển thành 'hoan_tat', thực hiện trừ tồn
      if (prevStatus !== 'hoan_tat' && trang_thai === 'hoan_tat') {
        // Lấy các sản phẩm trong đơn
        const [items] = await connection.query("SELECT ma_san_pham, so_luong FROM chitiet_donhang WHERE ma_don_hang = ?", [id]);
        for (const it of items) {
          const qty = Number(it.so_luong || 0);
          if (qty <= 0) continue;
          // Trừ tồn kho nhưng không cho giá trị xuống dưới 0
          await connection.query("UPDATE sanpham SET so_luong_ton = GREATEST(0, so_luong_ton - ?) WHERE ma_san_pham = ?", [qty, it.ma_san_pham]);
          // Ghi lịch sử tồn kho (thay đổi âm)
          await connection.query(
            "INSERT INTO lichsu_tonkho (ma_san_pham, so_luong_thay_doi, ly_do, ngay_thay_doi) VALUES (?, ?, ?, NOW())",
            [it.ma_san_pham, -qty, `Trừ tồn khi hoàn tất đơn ${id}`]
          );
        }
      }

      // Cập nhật trạng thái đơn hàng
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
