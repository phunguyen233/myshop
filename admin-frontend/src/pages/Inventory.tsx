import React, { useEffect, useState } from "react";
import { productAPI } from "../api/productAPI";
import { customerAPI } from "../api/customerAPI";
import { orderAPI } from "../api/orderAPI";
import { Product } from "../types/Product";

const Inventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [customerHistory, setCustomerHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [pRes, cRes] = await Promise.all([productAPI.getAll(), customerAPI.getAll()]);
        setProducts(pRes || []);
        setCustomers(cRes || []);
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu thống kê:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!selectedCustomer) {
        setCustomerHistory([]);
        return;
      }
      try {
        const res = await customerAPI.getOrders(selectedCustomer);
        setCustomerHistory(res || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchHistory();
  }, [selectedCustomer]);

  // Tổng giá trị tồn kho (ước tính bằng giá bán * số lượng tồn)
  const totalInventoryValue = products.reduce((sum, p) => sum + (p.gia_ban || 0) * (p.so_luong_ton || 0), 0);
  const lowStockThreshold = 5;
  const lowStockCount = products.reduce((cnt, p) => cnt + ((p.so_luong_ton || 0) <= lowStockThreshold ? 1 : 0), 0);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">📊 Thống kê</h1>

      {loading ? (
        <p className="text-gray-500">Đang tải dữ liệu...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-100 p-4 rounded shadow">
            <h3 className="text-sm text-gray-600">Tổng giá trị tồn kho</h3>
            <p className="text-2xl font-bold text-green-700">{totalInventoryValue.toLocaleString('vi-VN')}₫</p>
            <p className="text-sm text-gray-500">Tổng tiền tính theo giá bán hiện tại</p>
          </div>

          <div className="bg-yellow-100 p-4 rounded shadow">
            <h3 className="text-sm text-gray-600">Sản phẩm sắp hết hàng</h3>
            <p className="text-2xl font-bold text-yellow-700">{lowStockCount}</p>
            <p className="text-sm text-gray-500">Sản phẩm có tồn ≤ {lowStockThreshold}</p>
          </div>

          <div className="bg-blue-100 p-4 rounded shadow">
            <h3 className="text-sm text-gray-600">Tổng số sản phẩm</h3>
            <p className="text-2xl font-bold text-blue-700">{products.length}</p>
            <p className="text-sm text-gray-500">Các mặt hàng đang bán</p>
          </div>

          <div className="bg-indigo-100 p-4 rounded shadow">
            <h3 className="text-sm text-gray-600">Tổng khách hàng</h3>
            <p className="text-2xl font-bold text-indigo-700">{customers.length}</p>
            <p className="text-sm text-gray-500">Số lượng khách hàng đã đăng ký</p>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">📦 Danh sách tồn kho</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2">Mã SP</th>
                <th className="border p-2">Tên</th>
                <th className="border p-2">Số lượng</th>
                <th className="border p-2">Giá bán</th>
                <th className="border p-2">Giá trị tồn kho</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.ma_san_pham} className="hover:bg-gray-50">
                  <td className="border p-2">{p.ma_san_pham}</td>
                  <td className="border p-2">{p.ten_san_pham}</td>
                  <td className="border p-2 text-center">{p.so_luong_ton}</td>
                  <td className="border p-2 text-right">{p.gia_ban.toLocaleString('vi-VN')}₫</td>
                  <td className="border p-2 text-right">{((p.gia_ban || 0) * (p.so_luong_ton || 0)).toLocaleString('vi-VN')}₫</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">📜 Lịch sử mua hàng của khách hàng</h2>
        <div className="flex items-center gap-3 mb-4">
          <select value={selectedCustomer ?? ""} onChange={(e) => setSelectedCustomer(e.target.value ? Number(e.target.value) : null)} className="border px-3 py-2 rounded">
            <option value="">-- Chọn khách hàng --</option>
            {customers.map((c: any) => (
              <option key={c.ma_khach_hang} value={c.ma_khach_hang}>{c.ho_ten} (#{c.ma_khach_hang})</option>
            ))}
          </select>
        </div>

        {selectedCustomer ? (
          <div className="overflow-x-auto">
            {customerHistory.length === 0 ? (
              <p className="text-gray-500">Không có đơn hàng cho khách này.</p>
            ) : (
              <table className="w-full border-collapse border">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border p-2">Mã đơn</th>
                    <th className="border p-2">Thời gian</th>
                    <th className="border p-2">Tổng tiền</th>
                    <th className="border p-2">Chi tiết</th>
                  </tr>
                </thead>
                <tbody>
                  {customerHistory.map((h: any) => (
                    <tr key={h.ma_don_hang} className="hover:bg-gray-50">
                      <td className="border p-2">{h.ma_don_hang}</td>
                      <td className="border p-2">{h.thoi_gian_mua}</td>
                      <td className="border p-2 text-right">{h.tong_tien?.toLocaleString('vi-VN')}₫</td>
                      <td className="border p-2">
                        <ul>
                          {h.items?.map((it: any, idx: number) => (
                            <li key={idx}>{it.ten_san_pham} — x{it.so_luong} — {it.don_gia?.toLocaleString('vi-VN')}₫</li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <p className="text-gray-500">Chọn khách hàng để xem lịch sử mua hàng.</p>
        )}
      </div>
    </div>
  );
};

export default Inventory;
