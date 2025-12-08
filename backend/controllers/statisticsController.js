import db from "../config/db.js";

export const getStatistics = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = "month", full = "false" } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Cần cung cấp startDate và endDate" });
    }

    let groupByClause;
    let dateFormatDisplay;

    if (groupBy === "day") {
      // Convert purchase time to Vietnam timezone (+07:00) using DATE_ADD (avoids reliance on TZ tables)
      groupByClause = "DATE(DATE_ADD(d.thoi_gian_mua, INTERVAL 7 HOUR))";
      dateFormatDisplay = "DATE_FORMAT(DATE_ADD(d.thoi_gian_mua, INTERVAL 7 HOUR), '%Y-%m-%d')";
    } else if (groupBy === "year") {
      groupByClause = "YEAR(DATE_ADD(d.thoi_gian_mua, INTERVAL 7 HOUR))";
      dateFormatDisplay = "YEAR(DATE_ADD(d.thoi_gian_mua, INTERVAL 7 HOUR))";
    } else {
      // default month
      groupByClause = "DATE_FORMAT(DATE_ADD(d.thoi_gian_mua, INTERVAL 7 HOUR), '%Y-%m')";
      dateFormatDisplay = "DATE_FORMAT(DATE_ADD(d.thoi_gian_mua, INTERVAL 7 HOUR), '%Y-%m')";
    }

    const ordersQuery = `
      SELECT 
        ${dateFormatDisplay} as date,
        SUM(d.tong_tien) as revenue,
        COUNT(d.ma_don_hang) as orders
      FROM donhang d
      WHERE DATE(DATE_ADD(d.thoi_gian_mua, INTERVAL 7 HOUR)) >= ? AND DATE(DATE_ADD(d.thoi_gian_mua, INTERVAL 7 HOUR)) <= ? AND d.trang_thai = 'hoan_tat'
      GROUP BY ${groupByClause}
      ORDER BY ${dateFormatDisplay} ASC
    `;

    const [orderRows] = await db.query(ordersQuery, [startDate, endDate]);

    // Also fetch receipts grouped by the same period so we can report inventory cost per period
    // Build date expressions for receipts by replacing d.thoi_gian_mua with n.thoi_gian_nhap in dateFormatDisplay and groupByClause
    const receiptsDateFormat = dateFormatDisplay.replace(/DATE_ADD\(d\.thoi_gian_mua, INTERVAL 7 HOUR\)/g, "DATE_ADD(n.thoi_gian_nhap, INTERVAL 7 HOUR)").replace(/d\.thoi_gian_mua/g, 'n.thoi_gian_nhap');
    const receiptsGroupBy = groupByClause.replace(/DATE_ADD\(d\.thoi_gian_mua, INTERVAL 7 HOUR\)/g, "DATE_ADD(n.thoi_gian_nhap, INTERVAL 7 HOUR)").replace(/d\.thoi_gian_mua/g, 'n.thoi_gian_nhap');

    const receiptsQuery = `
      SELECT
        ${receiptsDateFormat} as date,
        COALESCE(SUM(n.tong_gia_tri),0) as inventory_cost
      FROM nhapkho n
      WHERE DATE(DATE_ADD(n.thoi_gian_nhap, INTERVAL 7 HOUR)) >= ? AND DATE(DATE_ADD(n.thoi_gian_nhap, INTERVAL 7 HOUR)) <= ?
      GROUP BY ${receiptsGroupBy}
      ORDER BY ${receiptsDateFormat} ASC
    `;

    const [receiptRows] = await db.query(receiptsQuery, [startDate, endDate]);

    // Merge orderRows and receiptRows by date
    const statMap = new Map();
    for (const row of orderRows) {
      const dateKey = String(row.date);
      statMap.set(dateKey, {
        date: dateKey,
        revenue: Number(row.revenue) || 0,
        orders: Number(row.orders) || 0,
        inventoryCost: 0,
      });
    }
    for (const r of receiptRows) {
      const dateKey = String(r.date);
      const existing = statMap.get(dateKey) || { date: dateKey, revenue: 0, orders: 0, inventoryCost: 0 };
      existing.inventoryCost = Number(r.inventory_cost) || 0;
      statMap.set(dateKey, existing);
    }

    const stats = Array.from(statMap.values()).map((s) => ({
      ...s,
      profit: Number((s.revenue || 0) - (s.inventoryCost || 0)),
    }));

    const totalRevenue = stats.reduce((s, it) => s + (it.revenue || 0), 0);
    const totalOrders = stats.reduce((s, it) => s + (it.orders || 0), 0);

    // Compute total inventory cost (sum of tong_gia_tri from nhapkho) in the same date range
    const [[invRow]] = await db.query(
      `SELECT COALESCE(SUM(tong_gia_tri),0) as inventory_cost FROM nhapkho WHERE DATE(DATE_ADD(thoi_gian_nhap, INTERVAL 7 HOUR)) >= ? AND DATE(DATE_ADD(thoi_gian_nhap, INTERVAL 7 HOUR)) <= ?`,
      [startDate, endDate]
    );
    const inventoryCost = Number(invRow?.inventory_cost || 0);

    // Profit = totalRevenue (completed orders revenue) - inventoryCost
    const profit = totalRevenue - inventoryCost;

    // If caller requests full data, include the raw completed orders and receipts lists
    if (String(full).toLowerCase() === 'true') {
      // Fetch completed orders in range
      const [orders] = await db.query(
        `SELECT d.ma_don_hang, d.ma_khach_hang, d.ten_nguoi_nhan, d.so_dien_thoai_nhan, d.dia_chi_nhan, d.tong_tien, d.trang_thai, DATE_FORMAT(DATE_ADD(d.thoi_gian_mua, INTERVAL 7 HOUR), '%Y-%m-%d %H:%i:%s') as thoi_gian_mua FROM donhang d WHERE DATE(DATE_ADD(d.thoi_gian_mua, INTERVAL 7 HOUR)) >= ? AND DATE(DATE_ADD(d.thoi_gian_mua, INTERVAL 7 HOUR)) <= ? AND d.trang_thai = 'hoan_tat' ORDER BY d.thoi_gian_mua DESC`,
        [startDate, endDate]
      );

      // Fetch receipts (nhapkho) in range
      const [receipts] = await db.query(
        `SELECT n.ma_nhap as ma_nhap, DATE_FORMAT(DATE_ADD(n.thoi_gian_nhap, INTERVAL 7 HOUR), '%Y-%m-%d %H:%i:%s') as thoi_gian_nhap, n.tong_gia_tri FROM nhapkho n WHERE DATE(DATE_ADD(n.thoi_gian_nhap, INTERVAL 7 HOUR)) >= ? AND DATE(DATE_ADD(n.thoi_gian_nhap, INTERVAL 7 HOUR)) <= ? ORDER BY n.thoi_gian_nhap DESC`,
        [startDate, endDate]
      );

      return res.json({ stats, totalRevenue, totalOrders, inventoryCost, profit, ordersList: orders, receiptsList: receipts });
    }

    res.json({ stats, totalRevenue, totalOrders, inventoryCost, profit });
  } catch (err) {
    console.error("Error in getStatistics:", err);
    res.status(500).json({ message: "Lỗi khi lấy thống kê", error: err.message });
  }
};
