import React, { useEffect, useState } from "react";
import { productAPI } from "../api/productAPI";
import { customerAPI } from "../api/customerAPI";
import { orderAPI } from "../api/orderAPI";
import { Product } from "../types/Product";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const Dashboard: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [customersCount, setCustomersCount] = useState<number>(0);
  const [ordersCount, setOrdersCount] = useState<number>(0);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ============================
  // 📌 Chỉ số Dashboard
  // ============================
  const totalProducts = products.length;

  // 💰 Doanh thu = tổng tiền các đơn hoàn tất
  const totalRevenue = orders
    .filter(order => order.trang_thai === "hoan_tat")
    .reduce((sum, order) => sum + parseFloat(String(order.tong_tien).replace(/[^0-9.-]/g, "")), 0);

  // ⭐ Hàm format tiền VND
  const formatVND = (value: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  // 📦 Tổng tồn kho
  const totalInventory = products.reduce(
    (sum, p) => sum + (p.so_luong_ton || 0),
    0
  );

  // Biểu đồ
  const chartData = products.slice(0, 5).map(p => ({
    name: p.ten_san_pham,
    price: Number(p.gia_ban) || 0,
    stock: Number(p.so_luong_ton) || 0
  }));
  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold text-foreground">📊 Bảng điều khiển</h1>

      {loading ? (
        <p className="text-center text-muted-foreground">Đang tải dữ liệu...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {/* Tổng sản phẩm */}
          <div className="bg-card p-6 rounded-xl shadow-sm border border-border hover:shadow-md transition-all">
            <h2 className="font-semibold text-muted-foreground mb-2">
              📦 Tổng sản phẩm
            </h2>
            <p className="text-3xl font-bold text-chart-1">{totalProducts}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Sản phẩm đang kinh doanh
            </p>
          </div>

          {/* Khách hàng */}
          <div className="bg-card p-6 rounded-xl shadow-sm border border-border hover:shadow-md transition-all">
            <h2 className="font-semibold text-muted-foreground mb-2">
              👥 Khách hàng
            </h2>
            <p className="text-3xl font-bold text-chart-2">{customersCount}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tổng số khách hàng
            </p>
          </div>

          {/* Đơn hàng */}
          <div className="bg-card p-6 rounded-xl shadow-sm border border-border hover:shadow-md transition-all">
            <h2 className="font-semibold text-muted-foreground mb-2">
              🧾 Đơn hàng
            </h2>
            <p className="text-3xl font-bold text-chart-3">{ordersCount}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tổng số đơn hàng
            </p>
          </div>

          {/* Doanh thu */}
          <div className="bg-card p-6 rounded-xl shadow-sm border border-border hover:shadow-md transition-all">
            <h2 className="font-semibold text-muted-foreground mb-2">
              💰 Doanh thu
            </h2>
            <p className="text-3xl font-bold text-chart-4">
              {formatVND(totalRevenue)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Tổng doanh thu đã hoàn tất
            </p>
          </div>

          {/* ⭐ NEW: Tổng tồn kho */}
          <div className="bg-card p-6 rounded-xl shadow-sm border border-border hover:shadow-md transition-all">
            <h2 className="font-semibold text-muted-foreground mb-2">
              📦 Tồn kho
            </h2>
            <p className="text-3xl font-bold text-chart-5">{totalInventory}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Số lượng tồn kho hiện tại
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Biểu đồ Giá bán */}
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground">
              � Biểu đồ Giá bán
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
                  <XAxis dataKey="name" stroke="var(--foreground)" />
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
              📦 Biểu đồ Tồn kho
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
                  <XAxis dataKey="name" stroke="var(--foreground)" />
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
