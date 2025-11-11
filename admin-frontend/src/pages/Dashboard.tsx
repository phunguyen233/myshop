import React, { useEffect, useState } from "react";
import { productAPI } from "../api/productAPI";
import { Product } from "../types/Product";

const Dashboard: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await productAPI.getAll();
        setProducts(data);
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Tính toán chỉ số
  const totalProducts = products.length;
  const totalRevenue = products.reduce((sum, product) => sum + product.gia_ban, 0);
  const totalInventory = products.reduce((sum, product) => sum + product.so_luong_ton, 0);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">📊 Bảng điều khiển</h1>

      {loading ? (
        <p className="text-center text-gray-500">Đang tải dữ liệu...</p>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-100 p-4 rounded shadow hover:shadow-lg transition">
            <h2 className="font-semibold text-gray-700">📦 Tổng sản phẩm</h2>
            <p className="text-3xl font-bold text-blue-600">{totalProducts}</p>
            <p className="text-sm text-gray-500">Sản phẩm đang kinh doanh</p>
          </div>
          
          <div className="bg-green-100 p-4 rounded shadow hover:shadow-lg transition">
            <h2 className="font-semibold text-gray-700">📊 Tồn kho</h2>
            <p className="text-3xl font-bold text-green-600">{totalInventory}</p>
            <p className="text-sm text-gray-500">Sản phẩm trong kho</p>
          </div>
          
          <div className="bg-yellow-100 p-4 rounded shadow hover:shadow-lg transition">
            <h2 className="font-semibold text-gray-700">💰 Tổng giá trị</h2>
            <p className="text-3xl font-bold text-yellow-600">{(totalRevenue / 1000000).toFixed(1)}M</p>
            <p className="text-sm text-gray-500">{totalRevenue.toLocaleString('vi-VN')}₫</p>
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">📋 Sản phẩm mới nhất</h2>
        {products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border p-2">Mã</th>
                  <th className="border p-2">Tên sản phẩm</th>
                  <th className="border p-2">Giá bán</th>
                  <th className="border p-2">Tồn kho</th>
                </tr>
              </thead>
              <tbody>
                {products.slice(0, 5).map((p) => (
                  <tr key={p.ma_san_pham} className="hover:bg-gray-100">
                    <td className="border p-2 text-center">{p.ma_san_pham}</td>
                    <td className="border p-2">{p.ten_san_pham}</td>
                    <td className="border p-2">{p.gia_ban.toLocaleString('vi-VN')}₫</td>
                    <td className="border p-2 text-center">{p.so_luong_ton}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">Chưa có sản phẩm</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
