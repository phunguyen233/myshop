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
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Thống kê doanh thu</h1>

      {/* Quick Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3">Lọc nhanh</h2>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => handleQuickFilter(7)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            7 ngày qua
          </button>
          <button
            onClick={() => handleQuickFilter(30)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            30 ngày qua
          </button>
          <button
            onClick={() => handleQuickFilter(90)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            90 ngày qua
          </button>
          <button
            onClick={() => handleQuickFilter(365)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            1 năm qua
          </button>
        </div>
      </div>

      {/* Date Range Picker */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3">Chọn khoảng thời gian</h2>
        <div className="flex gap-4 items-end flex-wrap">
          <div>
            <label className="block text-sm font-medium mb-1">Từ ngày</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Đến ngày</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nhóm theo</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as "day" | "month" | "year")}
              className="px-4 py-2 border border-gray-300 rounded"
            >
              <option value="day">Theo ngày</option>
              <option value="month">Theo tháng</option>
              <option value="year">Theo năm</option>
            </select>
          </div>
          <button
            onClick={fetchStatistics}
            disabled={loading}
            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
          >
            {loading ? "Đang tải..." : "Tải dữ liệu"}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-gray-600 text-sm font-medium">Tổng doanh thu</h3>
          <p className="text-3xl font-bold text-green-600">
            {Number(totalRevenue).toLocaleString()}đ
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-gray-600 text-sm font-medium">Tổng đơn hàng</h3>
          <p className="text-3xl font-bold text-blue-600">{totalOrders}</p>
        </div>
      </div>

      {/* Statistics Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-6 py-3 text-left font-semibold text-gray-700">
                {filterType === "day" ? "Ngày" : filterType === "month" ? "Tháng" : "Năm"}
              </th>
              <th className="px-6 py-3 text-right font-semibold text-gray-700">
                Doanh thu
              </th>
              <th className="px-6 py-3 text-right font-semibold text-gray-700">
                Số đơn hàng
              </th>
              <th className="px-6 py-3 text-right font-semibold text-gray-700">
                Doanh thu / đơn
              </th>
            </tr>
          </thead>
          <tbody>
            {statistics.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  Không có dữ liệu để hiển thị
                </td>
              </tr>
            ) : (
              statistics.map((stat, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-3 text-gray-700">{stat.date}</td>
                  <td className="px-6 py-3 text-right font-semibold text-green-600">
                    {Number(stat.revenue).toLocaleString()}đ
                  </td>
                  <td className="px-6 py-3 text-right text-gray-700">{stat.orders}</td>
                  <td className="px-6 py-3 text-right text-gray-600">
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
  );
}
