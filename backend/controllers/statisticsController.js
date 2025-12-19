import db from "../config/db.js";

export const getStatistics = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = "month", full = "false" } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Cần cung cấp startDate và endDate" });
    }

    let groupExpr;       // biểu thức dùng trong GROUP BY
    let selectExpr;      // biểu thức dùng trong SELECT

    if (groupBy === "day") {
      groupExpr = "DATE_FORMAT(DATE_ADD(d.thoi_gian_mua, INTERVAL 7 HOUR), '%Y-%m-%d')";
      selectExpr = groupExpr;
    } else if (groupBy === "year") {
      groupExpr = "YEAR(DATE_ADD(d.thoi_gian_mua, INTERVAL 7 HOUR))";
      selectExpr = groupExpr;
    } else {
      // Mặc định: nhóm theo tháng
      groupExpr = "DATE_FORMAT(DATE_ADD(d.thoi_gian_mua, INTERVAL 7 HOUR), '%Y-%m')";
      selectExpr = groupExpr;
    }

    const ordersQuery = `
      SELECT 
        ${selectExpr} AS date,
        SUM(d.tong_tien) AS revenue,
        COUNT(d.ma_don_hang) AS orders
      FROM donhang d
      WHERE DATE(DATE_ADD(d.thoi_gian_mua, INTERVAL 7 HOUR)) BETWEEN ? AND ?
        AND d.trang_thai = 'hoan_tat'
      GROUP BY ${groupExpr}
      ORDER BY date ASC
    `;
    console.log("Truy vấn đơn hàng:", ordersQuery);

    const [orderRows] = await db.query(ordersQuery, [startDate, endDate]);
    console.log("Kết quả đơn hàng:", orderRows);

    // Receipts query
    const receiptsGroupExpr = groupExpr.replace(/d\.thoi_gian_mua/g, 'n.ngay_nhap');
    const receiptsSelectExpr = selectExpr.replace(/d\.thoi_gian_mua/g, 'n.ngay_nhap');

    // Aggregate inventory cost from ingredient receipts table (nhapkho_nguyenlieu)
    // Sum of (so_luong_nhap * don_gia) — note entries can be negative for deductions
    const receiptsQuery = `
      SELECT
        ${receiptsSelectExpr} AS date,
        COALESCE(SUM(n.so_luong_nhap * n.don_gia), 0) AS inventory_cost
      FROM nhapkho_nguyenlieu n
      WHERE DATE(DATE_ADD(n.ngay_nhap, INTERVAL 7 HOUR)) BETWEEN ? AND ?
      GROUP BY ${receiptsGroupExpr}
      ORDER BY date ASC
    `;
    console.log("Truy vấn phiếu nhập:", receiptsQuery);

    const [receiptRows] = await db.query(receiptsQuery, [startDate, endDate]);
    console.log("Kết quả phiếu nhập:", receiptRows);

    // Merge data
    const statMap = new Map();
    for (const row of orderRows) {
      statMap.set(row.date, {
        date: row.date,
        revenue: Number(row.revenue) || 0,
        orders: Number(row.orders) || 0,
        inventoryCost: 0,
      });
    }
    for (const r of receiptRows) {
      const existing = statMap.get(r.date) || { date: r.date, revenue: 0, orders: 0, inventoryCost: 0 };
      existing.inventoryCost = Number(r.inventory_cost) || 0;
      statMap.set(r.date, existing);
    }

    const stats = Array.from(statMap.values()).map(s => ({
      ...s,
      profit: (s.revenue || 0) - (s.inventoryCost || 0)
    }));

    const totalRevenue = stats.reduce((sum, s) => sum + (s.revenue || 0), 0);
    const totalOrders = stats.reduce((sum, s) => sum + (s.orders || 0), 0);

    // Tổng tiền nhập nguyên liệu trong khoảng (tính từ bảng nhapkho_nguyenlieu)
    const [[invRow]] = await db.query(
      `SELECT COALESCE(SUM(so_luong_nhap * don_gia),0) AS inventory_cost
       FROM nhapkho_nguyenlieu
       WHERE DATE(DATE_ADD(ngay_nhap, INTERVAL 7 HOUR)) BETWEEN ? AND ?`,
      [startDate, endDate]
    );
    const inventoryCost = Number(invRow?.inventory_cost || 0);
    const profit = totalRevenue - inventoryCost;

    if (String(full).toLowerCase() === 'true') {
      const [ordersList] = await db.query(
        `SELECT d.ma_don_hang, d.ma_khach_hang, d.ten_nguoi_nhan, d.so_dien_thoai_nhan, d.dia_chi_nhan, d.tong_tien, d.trang_thai,
        DATE_FORMAT(DATE_ADD(d.thoi_gian_mua, INTERVAL 7 HOUR), '%Y-%m-%d %H:%i:%s') AS thoi_gian_mua
        FROM donhang d
        WHERE DATE(DATE_ADD(d.thoi_gian_mua, INTERVAL 7 HOUR)) BETWEEN ? AND ? 
        AND d.trang_thai = 'hoan_tat'
        ORDER BY d.thoi_gian_mua DESC`,
        [startDate, endDate]
      );

      const [receiptsList] = await db.query(
        `SELECT n.id, n.ma_nguyen_lieu, ng.ten_nguyen_lieu, n.so_luong_nhap, n.don_vi_id, d.ten AS don_vi, n.don_gia, 
                (n.so_luong_nhap * n.don_gia) AS tong_tien, 
                DATE_FORMAT(DATE_ADD(n.ngay_nhap, INTERVAL 7 HOUR), '%Y-%m-%d %H:%i:%s') AS ngay_nhap
         FROM nhapkho_nguyenlieu n
         LEFT JOIN nguyenlieu ng ON ng.ma_nguyen_lieu = n.ma_nguyen_lieu
         LEFT JOIN donvi d ON d.id = n.don_vi_id
         WHERE DATE(DATE_ADD(n.ngay_nhap, INTERVAL 7 HOUR)) BETWEEN ? AND ?
         ORDER BY n.ngay_nhap DESC`,
        [startDate, endDate]
      );

      return res.json({ stats, totalRevenue, totalOrders, inventoryCost, profit, ordersList, receiptsList });
    }

    res.json({ stats, totalRevenue, totalOrders, inventoryCost, profit });

  } catch (err) {
    console.error("Lỗi khi lấy thống kê:", err);
    res.status(500).json({ message: "Lỗi khi lấy thống kê", error: err.message });
  }
};
