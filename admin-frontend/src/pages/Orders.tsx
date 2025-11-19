import React, { useEffect, useState } from "react";
import { orderAPI, Order } from "../api/orderAPI";
import { productAPI } from "../api/productAPI";

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState<Order | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await orderAPI.getAll();
      setOrders(data);
    } catch (err) {
      console.error(err);
      alert("Lỗi khi lấy đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleSearch = async () => {
    try {
      const res = await orderAPI.search(query);
      setOrders(res);
    } catch (err) {
      console.error(err);
      alert("Lỗi tìm kiếm");
    }
  };

  const handleViewDetail = async (id: number) => {
    try {
      const data = await orderAPI.getById(id);
      setDetail(data);
    } catch (err) {
      console.error(err);
      alert("Lỗi khi lấy chi tiết");
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">🧾 Quản lý đơn hàng</h1>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm kiếm theo mã, khách, sản phẩm..."
            className="w-full sm:w-64 border px-3 py-2 rounded"
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
          />
          <button onClick={handleSearch} className="bg-blue-500 text-white px-4 py-2 rounded">
            Tìm
          </button>
        </div>
      </div>

      {loading ? (
        <p>Đang tải...</p>
      ) : orders.length === 0 ? (
        <p>Chưa có đơn hàng</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-3">Mã đơn</th>
                <th className="border p-3">Khách</th>
                <th className="border p-3">Thời gian</th>
                <th className="border p-3">Tổng tiền</th>
                <th className="border p-3">Trạng thái</th>
                <th className="border p-3">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.ma_don_hang} className="hover:bg-gray-50">
                  <td className="border p-3">{o.ma_don_hang}</td>
                  <td className="border p-3">{o.ten_khach_hang || o.ma_khach_hang}</td>
                  <td className="border p-3">{o.thoi_gian_mua}</td>
                  <td className="border p-3">{o.tong_tien}</td>
                  <td className="border p-3">{o.trang_thai}</td>
                  <td className="border p-3">
                    <button onClick={() => handleViewDetail(o.ma_don_hang!)} className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1 rounded text-sm">
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {detail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full shadow-xl max-h-screen overflow-y-auto">
            <h3 className="text-2xl font-bold mb-4">Chi tiết đơn hàng #{detail.ma_don_hang}</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Khách hàng</p>
                <p className="font-semibold">{detail.ten_khach_hang}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Ngày mua</p>
                <p className="font-semibold">{detail.thoi_gian_mua}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Địa chỉ</p>
                <p className="font-semibold">{detail.dia_chi}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Trạng thái</p>
                <p className="font-semibold">{detail.trang_thai}</p>
              </div>
            </div>
            <h4 className="font-semibold mb-3">Danh sách sản phẩm</h4>
            <div className="overflow-x-auto mb-4">
              <table className="w-full border-collapse border text-sm">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border p-2">Sản phẩm</th>
                    <th className="border p-2">Số lượng</th>
                    <th className="border p-2">Đơn giá</th>
                    <th className="border p-2">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.items?.map((it: any, idx: number) => (
                    <tr key={idx}>
                      <td className="border p-2">{it.ten_san_pham}</td>
                      <td className="border p-2">{it.so_luong}</td>
                      <td className="border p-2">{it.don_gia}</td>
                      <td className="border p-2">{it.so_luong * it.don_gia}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-right pt-4 border-t">
              <p className="font-bold">Tổng cộng: {detail.tong_tien}đ</p>
              <button onClick={() => setDetail(null)} className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded mt-2">Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
