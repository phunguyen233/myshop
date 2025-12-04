import db from "../config/db.js";

export const getStatistics = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = "month" } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Cần cung cấp startDate và endDate" });
    }

    let groupByClause;
    let dateFormatDisplay;

    if (groupBy === "day") {
      groupByClause = "DATE(d.thoi_gian_mua)";
      dateFormatDisplay = "DATE(d.thoi_gian_mua)";
    } else if (groupBy === "year") {
      groupByClause = "YEAR(d.thoi_gian_mua)";
      dateFormatDisplay = "YEAR(d.thoi_gian_mua)";
    } else {
      // default month
      groupByClause = "DATE_FORMAT(d.thoi_gian_mua, '%Y-%m')";
      dateFormatDisplay = "DATE_FORMAT(d.thoi_gian_mua, '%Y-%m')";
    }

    const query = `
      SELECT 
        ${dateFormatDisplay} as date,
        SUM(d.tong_tien) as revenue,
        COUNT(d.ma_don_hang) as orders
      FROM donhang d
      WHERE DATE(d.thoi_gian_mua) >= ? AND DATE(d.thoi_gian_mua) <= ?
      GROUP BY ${groupByClause}
      ORDER BY ${dateFormatDisplay} ASC
    `;

    const [rows] = await db.query(query, [startDate, endDate]);

    // Format the response
    const stats = rows.map((row) => ({
      date: String(row.date),
      revenue: Number(row.revenue) || 0,
      orders: Number(row.orders) || 0,
    }));

    res.json(stats);
  } catch (err) {
    console.error("Error in getStatistics:", err);
    res.status(500).json({ message: "Lỗi khi lấy thống kê", error: err.message });
  }
};
