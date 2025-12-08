import React, { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";
import { orderAPI } from "../api/orderAPI";

interface StatData {
  date: string;
  revenue: number;
  orders: number;
  inventoryCost?: number;
  profit?: number;
}

export default function StatisticsPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [groupBy, setGroupBy] = useState<"day" | "month" | "year">("month");

  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<StatData[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [inventoryCost, setInventoryCost] = useState(0);
  const [profit, setProfit] = useState(0);

  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [receiptsList, setReceiptsList] = useState<any[]>([]);

  // Helper để format date theo local time YYYY-MM-DD
  const formatDateLocal = (date: Date) => {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().split("T")[0];
  };

  // Hàm tính ngày bắt đầu mặc định theo quy ước
  const getDefaultDates = (gb: "day" | "month" | "year") => {
    const today = new Date();
    let defaultStart: Date;

    if (gb === "day") {
      // 30 ngày gần nhất (tính cả hôm nay là 30 ngày) -> lùi lại 29 ngày
      defaultStart = new Date(today);
      defaultStart.setDate(today.getDate() - 29);
    } else if (gb === "month") {
      // 12 tháng gần nhất -> lùi lại 11 tháng
      defaultStart = new Date(today);
      defaultStart.setMonth(today.getMonth() - 11);
      defaultStart.setDate(1);
    } else if (gb === "year") {
      // 10 năm gần nhất -> lùi lại 9 năm
      defaultStart = new Date(today);
      defaultStart.setFullYear(today.getFullYear() - 9);
      defaultStart.setMonth(0, 1);
    } else {
      defaultStart = today;
    }

    return {
      sd: formatDateLocal(defaultStart),
      ed: formatDateLocal(today),
    };
  };

  const fetchStatistics = async (sDate?: string, eDate?: string, grp?: "day" | "month" | "year") => {
    const gb = grp || groupBy;
    let sd = sDate || startDate;
    let ed = eDate || endDate;

    // Nếu chưa có ngày, lấy mặc định
    if (!sd || !ed) {
      const defaultDates = getDefaultDates(gb);
      sd = sd || defaultDates.sd;
      ed = ed || defaultDates.ed;
      setStartDate(sd);
      setEndDate(ed);
    }

    try {
      setLoading(true);
      const res = await axiosClient.get(`/statistics`, {
        params: { startDate: sd, endDate: ed, groupBy: gb, full: true },
      });
      console.log("Statistics response:", res.data);
      const data = res.data || {};
      setStats(data.stats || []);
      setInventoryCost(data.inventoryCost || 0);
      setOrdersList(data.ordersList || []);
      setReceiptsList(data.receiptsList || []);

      // Tính tổng từ đơn hoàn tất
      try {
        const allOrders = await orderAPI.getAll();
        const completed = (allOrders || []).filter((o: any) => {
          const status = o.trang_thai || o.trangThai || o.status;
          if (status !== "hoan_tat") return false;
          const time = o.thoi_gian_mua || o.created_at || o.createdAt || o.time;
          if (!time) return false;
          const d = new Date(time);
          if (isNaN(d.getTime())) return false;
          // Sử dụng formatDateLocal để so sánh ngày theo local time
          const ds = formatDateLocal(d);
          return ds >= sd && ds <= ed;
        });

        const revenueSum = completed.reduce(
          (s: number, o: any) => s + (Number(o.tong_tien || o.tongTien || o.total || 0) || 0),
          0
        );
        setTotalRevenue(revenueSum);
        setTotalOrders(completed.length || 0);
        setProfit(revenueSum - Number(data.inventoryCost || 0));
      } catch (e) {
        console.warn("Không thể lấy danh sách đơn để tính tổng doanh thu, dùng dữ liệu server nếu có", e);
        setTotalRevenue(data.totalRevenue || 0);
        setTotalOrders(data.totalOrders || 0);
        setProfit(data.profit || 0);
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi lấy thống kê!");
    } finally {
      setLoading(false);
    }
  };

  // Khi đổi groupBy, tự động cập nhật khoảng thời gian mặc định và tải dữ liệu
  useEffect(() => {
    const defaultDates = getDefaultDates(groupBy);
    setStartDate(defaultDates.sd);
    setEndDate(defaultDates.ed);
    fetchStatistics(defaultDates.sd, defaultDates.ed, groupBy);
  }, [groupBy]);

  // Quick Filter vẫn hoạt động
  const handleQuickFilter = (days: number) => {
    const today = new Date();
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - (days - 1)); // Bao gồm hôm nay

    const sDate = formatDateLocal(pastDate);
    const eDate = formatDateLocal(today);

    setStartDate(sDate);
    setEndDate(eDate);

    // Gọi API ngay khi chọn filter
    fetchStatistics(sDate, eDate);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Thống kê doanh thu</h1>

      {/* Quick Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3">Lọc nhanh</h2>
        <div className="flex gap-3 flex-wrap">
          <button onClick={() => handleQuickFilter(7)} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            7 ngày qua
          </button>
          <button onClick={() => handleQuickFilter(30)} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            30 ngày qua
          </button>
          <button onClick={() => handleQuickFilter(90)} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            90 ngày qua
          </button>
          <button onClick={() => handleQuickFilter(365)} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
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
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as "day" | "month" | "year")}
              className="px-4 py-2 border border-gray-300 rounded"
            >
              <option value="day">Theo ngày</option>
              <option value="month">Theo tháng</option>
              <option value="year">Theo năm</option>
            </select>
          </div>
          <button
            onClick={() => fetchStatistics()}
            disabled={loading}
            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
          >
            {loading ? "Đang tải..." : "Tải dữ liệu"}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-gray-600 text-sm font-medium">Tổng doanh thu</h3>
          <p className="text-3xl font-bold text-green-600">{Number(totalRevenue).toLocaleString()}đ</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-gray-600 text-sm font-medium">Tổng đơn hàng</h3>
          <p className="text-3xl font-bold text-blue-600">{totalOrders}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-gray-600 text-sm font-medium">Tổng tiền nhập sản phẩm</h3>
          <p className="text-3xl font-bold text-yellow-600">{Number(inventoryCost).toLocaleString()}đ</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-gray-600 text-sm font-medium">Tiền lãi</h3>
          <p className={`text-3xl font-bold ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>{Number(profit).toLocaleString()}đ</p>
        </div>
      </div>

      {/* Statistics Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-6 py-3 text-left font-semibold text-gray-700">
                {groupBy === "day" ? "Ngày" : groupBy === "month" ? "Tháng" : "Năm"}
              </th>
              <th className="px-6 py-3 text-right font-semibold text-gray-700">Doanh thu</th>
              <th className="px-6 py-3 text-right font-semibold text-gray-700">Số đơn hàng</th>
              <th className="px-6 py-3 text-right font-semibold text-gray-700">Tiền nhập kho</th>
              <th className="px-6 py-3 text-right font-semibold text-gray-700">Tiền lãi</th>
              <th className="px-6 py-3 text-right font-semibold text-gray-700">Doanh thu / đơn</th>
            </tr>
          </thead>
          <tbody>
            {stats.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  Không có dữ liệu để hiển thị
                </td>
              </tr>
            ) : (
              stats.map((stat, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-3 text-gray-700">{stat.date}</td>
                  <td className="px-6 py-3 text-right font-semibold text-green-600">{Number(stat.revenue).toLocaleString()}đ</td>
                  <td className="px-6 py-3 text-right text-gray-700">{stat.orders}</td>
                  <td className="px-6 py-3 text-right text-yellow-600">{Number(stat.inventoryCost || 0).toLocaleString()}đ</td>
                  <td className={`px-6 py-3 text-right ${((stat.profit || 0) >= 0 ? "text-green-600" : "text-red-600")}`}>{Number(stat.profit || 0).toLocaleString()}đ</td>
                  <td className="px-6 py-3 text-right text-gray-600">
                    {stat.orders > 0
                      ? Number((stat.revenue || 0) / stat.orders).toLocaleString("vi-VN", { maximumFractionDigits: 0 })
                      : 0}đ
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
