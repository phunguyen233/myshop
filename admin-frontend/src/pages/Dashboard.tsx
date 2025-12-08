import React, { useEffect, useState } from "react";
import { productAPI } from "../api/productAPI";
import { customerAPI } from "../api/customerAPI";
import { orderAPI } from "../api/orderAPI";
import { Product } from "../types/Product";
import axiosClient from "../api/axiosClient";
import PieChart from "../components/PieChart";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from "recharts";

const Dashboard: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [customersCount, setCustomersCount] = useState<number>(0);
  const [ordersCount, setOrdersCount] = useState<number>(0);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [totalInventoryCost, setTotalInventoryCost] = useState<number>(0);
  const [profit, setProfit] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [prodRes, custRes, orderRes] = await Promise.all([
          productAPI.getAll(),
          customerAPI.getAll(),
          orderAPI.getAll(),
        ]);

        setProducts(prodRes || []);
        setCustomersCount((custRes || []).length || 0);
        setOrders(orderRes || []);
        setOrdersCount((orderRes || []).length || 0);

        // Compute totalRevenue from completed orders (server may also provide totals,
        // but ensure dashboard totalRevenue equals sum of orders with trạng_thái = 'hoan_tat')
        try {
          const completedRevenue = (orderRes || []).reduce((sum: number, o: any) => {
            const status = o.trang_thai || o.trangThai || o.status;
            const amount = Number(o.tong_tien || o.tongTien || o.total || 0) || 0;
            return sum + ((status === 'hoan_tat') ? amount : 0);
          }, 0);
          setTotalRevenue(completedRevenue);

          // Fetch inventory cost from statistics (last 30 days) to compute profit
          const today = new Date();
          const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          const startDate = thirtyDaysAgo.toISOString().split("T")[0];
          const endDate = today.toISOString().split("T")[0];
          const statRes = await axiosClient.get(`/statistics`, { params: { startDate, endDate, full: true } });
          const d = statRes.data || {};
          const invCost = Number(d.inventoryCost || 0);
          setTotalInventoryCost(invCost);
          // profit = revenue from completed orders - inventory cost
          setProfit(completedRevenue - invCost);
        } catch (e) {
          console.error("Không lấy được thống kê cho dashboard:", e);
        }
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // listen for external updates (orders completed, new receipts)
    const handler = (e: Event) => {
      try {
        const ev = e as CustomEvent;
        const d = ev?.detail || {};
        if (d && (d.orderCompletedAmount || d.orderRevertedAmount || d.inventoryAdded)) {
          // compute new totals based on previous values and the delta in the event
          setTotalRevenue((prevRevenue) => {
            const inc = Number(d.orderCompletedAmount || 0);
            const dec = Number(d.orderRevertedAmount || 0);
            const nextRevenue = prevRevenue + inc - dec;
            // also update profit using current inventory cost state
            setTotalInventoryCost((prevInv) => {
              const addInv = Number(d.inventoryAdded || 0);
              const nextInv = prevInv + addInv;
              setProfit(nextRevenue - nextInv);
              return nextInv;
            });
            // schedule a quick refetch to sync with server
            setTimeout(() => { fetchData(); }, 200);
            return nextRevenue;
          });
        } else {
          // generic update — refetch full stats
          fetchData();
        }
      } catch (err) {
        console.error('statsUpdated handler error', err);
        fetchData();
      }
    };
    window.addEventListener('statsUpdated', handler);
    return () => window.removeEventListener('statsUpdated', handler);
  }, []);

  // ============================
  // 📌 Chỉ số Dashboard
  // ============================
  const totalProducts = products.length;
  // avoid redeclaring `totalRevenue` (state) — compute product list total separately
  const totalProductsValue = products.reduce((sum, product) => sum + product.gia_ban, 0);
  const totalInventory = products.reduce((sum, product) => sum + product.so_luong_ton, 0);

  // local formatter for VND values
  const formatVND = (value: number) => `${Number(value || 0).toLocaleString('vi-VN')} đ`;

  // Data for charts
  const chartData = products.map((p) => ({
    name: p.ten_san_pham,
    price: Number(p.gia_ban || 0),
    stock: Number(p.so_luong_ton || 0),
  }));

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6"> Bảng điều khiển</h1>

      {loading ? (
        <p className="text-center text-muted-foreground">Đang tải dữ liệu...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition border border-border">
            <h2 className="font-semibold text-gray-800">Tổng sản phẩm</h2>
            <p className="text-3xl font-bold text-blue-600">{totalProducts}</p>
            <p className="text-sm text-gray-500">Sản phẩm đang kinh doanh</p>
          </div>

          {/* Đơn hàng */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-border hover:shadow-md transition-all">
            <h2 className="font-semibold text-gray-800 mb-2"> Đơn hàng</h2>
            <p className="text-3xl font-bold text-blue-600">{ordersCount}</p>
            <p className="text-sm text-gray-500 mt-1">Tổng số đơn hàng</p>
          </div>

          {/* Doanh thu */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-border hover:shadow-md transition-all">
            <h2 className="font-semibold text-gray-800 mb-2">Doanh thu</h2>
            <p className="text-3xl font-bold text-green-600">{formatVND(totalRevenue)}</p>
            <p className="text-sm text-gray-500 mt-1">Tổng doanh thu số đơn hàng đã hoàn tất</p>
          </div>

          {/* ⭐ NEW: Tổng tồn kho */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-border hover:shadow-md transition-all">
            <h2 className="font-semibold text-gray-800 mb-2"> Tồn kho</h2>
            <p className="text-3xl font-bold text-yellow-600">{totalInventory}</p>
            <p className="text-sm text-gray-500 mt-1">Số lượng tồn kho hiện tại</p>
          </div>
        </div>
      )}

      {/* Revenue / Inventory / Profit chart */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">Phân bố: Doanh thu / Nhập kho / Lợi nhuận (30 ngày gần nhất)</h2>
        <div className="flex flex-col md:flex-row md:items-center md:gap-6">
          <div className="flex-1">
            <PieChart
              data={[
                { label: "Tổng doanh thu", value: totalRevenue, color: "#16a34a" },
                { label: "Tổng tiền nhập sản phẩm", value: totalInventoryCost, color: "#f59e0b" },
                { label: "Tiền lãi", value: Math.max(0, profit), color: "#3b82f6" },
              ]}
            />
          </div>
          <div className="mt-6 md:mt-0 md:w-1/3">
            <div className="bg-gray-50 p-4 rounded mb-3">
              <div className="text-sm text-gray-600">Tổng doanh thu</div>
              <div className="text-2xl font-bold text-green-700">{Number(totalRevenue).toLocaleString()} đ</div>
            </div>
            <div className="bg-gray-50 p-4 rounded mb-3">
              <div className="text-sm text-gray-600">Tổng tiền nhập sản phẩm</div>
              <div className="text-2xl font-bold text-yellow-700">{Number(totalInventoryCost).toLocaleString()} đ</div>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <div className="text-sm text-gray-600">Tiền lãi</div>
              <div className={`text-2xl font-bold ${profit >= 0 ? 'text-green-700' : 'text-red-600'}`}>{Number(profit).toLocaleString()} đ</div>
            </div>
            {profit < 0 && (
              <p className="text-sm text-red-600 mt-3">Lưu ý: Tiền lãi âm (lỗ) trong khoảng thời gian đã chọn.</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Biểu đồ Giá bán */}
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground">
               Biểu đồ Giá bán
            </h2>
          </div>

          {products.length > 0 ? (
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                  />
                  <XAxis dataKey="name" stroke="var(--foreground)" tick={false} axisLine={false} tickLine={false} />
                  <YAxis stroke="var(--foreground)" />
                  <Tooltip
                    cursor={{ fill: "rgba(200, 200, 200, 0.2)" }}
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderColor: "var(--border)",
                      color: "var(--foreground)",
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="price"
                    name="Giá bán"
                    fill="var(--chart-1)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Chưa có sản phẩm
            </p>
          )}
        </div>

        {/* Biểu đồ Tồn kho */}
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground">
               Biểu đồ Tồn kho
            </h2>
          </div>

          {products.length > 0 ? (
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                  />
                  <XAxis dataKey="name" stroke="var(--foreground)" tick={false} axisLine={false} tickLine={false} />
                  <YAxis stroke="var(--foreground)" />
                  <Tooltip
                    cursor={{ fill: "rgba(200, 200, 200, 0.2)" }}
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderColor: "var(--border)",
                      color: "var(--foreground)",
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="stock"
                    name="Tồn kho"
                    fill="var(--chart-2)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Chưa có sản phẩm
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
