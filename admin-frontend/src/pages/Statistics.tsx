import React, { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:5000/api";

interface StatData {
  date: string;
  revenue: number;
  orders: number;
}

export default function Statistics() {
  const [statistics, setStatistics] = useState<StatData[]>([]);
  const [filterType, setFilterType] = useState<"day" | "month" | "year">("month");
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);

  // Set default date range (last 30 days)
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    setEndDate(today.toISOString().split("T")[0]);
    setStartDate(thirtyDaysAgo.toISOString().split("T")[0]);
  }, []);

  const fetchStatistics = async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/statistics`, {
        params: { startDate, endDate, groupBy: filterType },
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data;
      setStatistics(data);

      // Calculate totals
      const revenue = data.reduce((sum: number, item: StatData) => sum + item.revenue, 0);
      const orders = data.reduce((sum: number, item: StatData) => sum + item.orders, 0);
      setTotalRevenue(revenue);
      setTotalOrders(orders);
    } catch (err: any) {
      console.error("Lỗi khi lấy thống kê:", err);
      alert(err?.response?.data?.message || "Lỗi khi lấy dữ liệu thống kê");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFilter = (days: number) => {
    const today = new Date();
    const pastDate = new Date(today.getTime() - days * 24 * 60 * 60 * 1000);
    setStartDate(pastDate.toISOString().split("T")[0]);
    setEndDate(today.toISOString().split("T")[0]);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-6 text-foreground">Thống kê doanh thu</h1>

      {/* Quick Filters */}
      <div className="bg-card text-card-foreground rounded-xl shadow-sm border border-border p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3">Lọc nhanh</h2>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => handleQuickFilter(7)}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition"
          >
            7 ngày qua
          </button>
          <button
            onClick={() => handleQuickFilter(30)}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition"
          >
            30 ngày qua
          </button>
          <button
            onClick={() => handleQuickFilter(90)}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition"
          >
            90 ngày qua
          </button>
          <button
            onClick={() => handleQuickFilter(365)}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition"
          >
            1 năm qua
          </button>
        </div>
      </div>

      {/* Date Range Picker */}
      <div className="bg-card text-card-foreground rounded-xl shadow-sm border border-border p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3">Chọn khoảng thời gian</h2>
        <div className="flex gap-4 items-end flex-wrap">
          <div>
            <label className="block text-sm font-medium mb-1 text-muted-foreground">Từ ngày</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-4 py-2 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-muted-foreground">Đến ngày</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-4 py-2 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-muted-foreground">Nhóm theo</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as "day" | "month" | "year")}
              className="px-4 py-2 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:outline-none"
            >
              <option value="day">Theo ngày</option>
              <option value="month">Theo tháng</option>
              <option value="year">Theo năm</option>
            </select>
          </div>
          <button
            onClick={fetchStatistics}
            disabled={loading}
            className="px-6 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg transition disabled:opacity-50"
          >
            {loading ? "Đang tải..." : "Tải dữ liệu"}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-card text-card-foreground rounded-xl shadow-sm border border-border p-6">
          <h3 className="text-muted-foreground text-sm font-medium">Tổng doanh thu</h3>
          <p className="text-3xl font-bold text-chart-1">
            {Number(totalRevenue).toLocaleString()}đ
          </p>
        </div>
        <div className="bg-card text-card-foreground rounded-xl shadow-sm border border-border p-6">
          <h3 className="text-muted-foreground text-sm font-medium">Tổng đơn hàng</h3>
          <p className="text-3xl font-bold text-chart-2">{totalOrders}</p>
        </div>
      </div>

      {/* Statistics Table */}
      <div className="bg-card text-card-foreground rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-medium">
                  {filterType === "day" ? "Ngày" : filterType === "month" ? "Tháng" : "Năm"}
                </th>
                <th className="px-6 py-3 text-right font-medium">
                  Doanh thu
                </th>
                <th className="px-6 py-3 text-right font-medium">
                  Số đơn hàng
                </th>
                <th className="px-6 py-3 text-right font-medium">
                  Doanh thu / đơn
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {statistics.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                    Không có dữ liệu để hiển thị
                  </td>
                </tr>
              ) : (
                statistics.map((stat, idx) => (
                  <tr key={idx} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-3 text-foreground">{stat.date}</td>
                    <td className="px-6 py-3 text-right font-semibold text-chart-1">
                      {Number(stat.revenue).toLocaleString()}đ
                    </td>
                    <td className="px-6 py-3 text-right text-foreground">{stat.orders}</td>
                    <td className="px-6 py-3 text-right text-muted-foreground">
                      {stat.orders > 0
                        ? Number(stat.revenue / stat.orders).toLocaleString("vi-VN", {
                          maximumFractionDigits: 0,
                        })
                        : 0}
                      đ
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
