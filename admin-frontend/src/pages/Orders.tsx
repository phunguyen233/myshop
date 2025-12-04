import React, { useEffect, useState } from "react";
import { orderAPI, Order } from "../api/orderAPI";
import { productAPI } from "../api/productAPI";
import { customerAPI } from "../api/customerAPI";

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // add order form state
  const [selectedCustomer, setSelectedCustomer] = useState<number | undefined>(undefined);
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [orderItems, setOrderItems] = useState<Array<{ ma_san_pham: number; ten_san_pham?: string; so_luong: number; don_gia: number }>>([]);

  // Use enum values from your DB: 'cho_xu_ly','hoan_tat','huy'
  const statuses = ["cho_xu_ly", "hoan_tat", "huy"];
  const statusLabels: Record<string, string> = {
    cho_xu_ly: "Chờ xử lý",
    hoan_tat: "Hoàn thành",
    huy: "Đã hủy",
  };

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

  const fetchCustomers = async () => {
    try {
      const data = await customerAPI.getAll();
      setCustomers(data);
    } catch (err) {
      console.error('Lỗi khi lấy khách hàng', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await productAPI.getAll();
      setProducts(data);
    } catch (err) {
      console.error('Lỗi khi lấy sản phẩm', err);
    }
  };

  const handleSearch = async () => {
    try {
      const res = await orderAPI.search(query);
      setOrders(res);
    } catch (err) {
      console.error(err);
      alert("Lỗi tìm kiếm");
    }
  };

  const openAddModal = async () => {
    await Promise.all([fetchCustomers(), fetchProducts()]);
    setSelectedCustomer(undefined);
    setRecipientName("");
    setRecipientPhone("");
    setOrderItems([]);
    setShowAddModal(true);
  };

  const addProductLine = (productId: number) => {
    const p = products.find((x) => x.ma_san_pham === productId || x.id === productId);
    if (!p) return;
    const existing = orderItems.find((it) => it.ma_san_pham === (p.ma_san_pham || p.id));
    if (existing) {
      setOrderItems(orderItems.map(it => it.ma_san_pham === existing.ma_san_pham ? { ...it, so_luong: it.so_luong + 1 } : it));
    } else {
      setOrderItems([...orderItems, { ma_san_pham: p.ma_san_pham || p.id, ten_san_pham: p.ten_san_pham || p.ten_san_pham || p.ten_san_pham, so_luong: 1, don_gia: Number(p.gia_ban || p.gia || p.price || 0) }]);
    }
  };

  const removeProductLine = (ma_san_pham: number) => {
    setOrderItems(orderItems.filter(it => it.ma_san_pham !== ma_san_pham));
  };

  const setQtyFor = (ma_san_pham: number, qty: number) => {
    if (qty <= 0) return removeProductLine(ma_san_pham);
    setOrderItems(orderItems.map(it => it.ma_san_pham === ma_san_pham ? { ...it, so_luong: qty } : it));
  };

  const computeTotal = () => orderItems.reduce((s, it) => s + (it.so_luong || 0) * (it.don_gia || 0), 0);

  const handleCreateOrder = async () => {
    try {
      const chi_tiet = orderItems.map(it => ({ ma_san_pham: it.ma_san_pham, so_luong: it.so_luong, don_gia: it.don_gia }));
      const payload: any = { ma_khach_hang: selectedCustomer, ten_nguoi_nhan: recipientName || null, so_dien_thoai_nhan: recipientPhone || null, dia_chi_nhan: recipientAddress || null, tong_tien: computeTotal(), chi_tiet };
      await orderAPI.create(payload);
      alert('Tạo đơn hàng thành công');
      setShowAddModal(false);
      fetchOrders();
    } catch (err) {
      console.error('Lỗi tạo đơn', err);
      alert('Lỗi khi tạo đơn hàng');
    }
  };

  const handleViewDetail = async (id: number) => {
    try {
      const data = await orderAPI.getById(id);
      setDetail(data);
      setNewStatus(data.trang_thai || "cho_xu_ly");
    } catch (err) {
      console.error(err);
      alert("Lỗi khi lấy chi tiết");
    }
  };

  const handleUpdateStatus = async () => {
    if (!detail?.ma_don_hang) return;
    try {
      await orderAPI.updateStatus(detail.ma_don_hang, newStatus);
      alert('Cập nhật trạng thái thành công');
      // refresh list and detail
      fetchOrders();
      const updated = await orderAPI.getById(detail.ma_don_hang);
      setDetail(updated);
    } catch (err) {
      console.error(err);
      // show backend error message when available
      const msg = (err as any)?.response?.data?.message || (err as any)?.message || 'Lỗi khi cập nhật trạng thái';
      alert(msg);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">🧾 Quản lý đơn hàng</h1>
        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center gap-2 w-full max-w-lg">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm kiếm theo mã, khách, sản phẩm..."
              className="w-full border px-3 py-2 rounded-lg"
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
            />
            <button onClick={handleSearch} className="bg-blue-500 text-white px-4 py-2 rounded">
              Tìm
            </button>
          </div>
          <div>
            <button onClick={openAddModal} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">
              Thêm đơn hàng 
            </button>
          </div>
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
                <th className="border p-3">Người nhận</th>
                <th className="border p-3">SĐT nhận</th>
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
                  <td className="border p-3">{o.ten_khach_hang || ('#' + (o.ma_khach_hang ?? '-'))}</td>
                  <td className="border p-3">{o.ten_nguoi_nhan || '-'}</td>
                  <td className="border p-3">{o.so_dien_thoai_nhan || '-'}</td>
                  <td className="border p-3">{o.thoi_gian_mua}</td>
                  <td className="border p-3">{o.tong_tien}</td>
                  <td className="border p-3">{(o.trang_thai && (o.trang_thai === 'cho_xu_ly' ? 'Chờ xử lý' : o.trang_thai === 'hoan_tat' ? 'Hoàn thành' : o.trang_thai === 'huy' ? 'Đã hủy' : o.trang_thai)) || 'Chờ xử lý'}</td>
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

      {/* Add Order Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full shadow-xl max-h-screen overflow-y-auto">
            <h3 className="text-2xl font-bold mb-4">Thêm đơn hàng mới</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm text-gray-600">Khách hàng </label>
                <select className="w-full border px-3 py-2 rounded mt-1" value={selectedCustomer ?? ''} onChange={(e) => setSelectedCustomer(e.target.value ? Number(e.target.value) : undefined)}>
                  
                  {customers.map(c => (
                    <option key={c.ma_khach_hang} value={c.ma_khach_hang}>{c.ho_ten} {c.so_dien_thoai ? `(${c.so_dien_thoai})` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600">Tên người nhận</label>
                <input className="w-full border px-3 py-2 rounded mt-1" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-gray-600">Số điện thoại người nhận</label>
                <input className="w-full border px-3 py-2 rounded mt-1" value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-gray-600">Địa chỉ nhận</label>
                <input className="w-full border px-3 py-2 rounded mt-1" value={recipientAddress} onChange={(e) => setRecipientAddress(e.target.value)} />
              </div>
            </div>

            <div className="mb-4">
              <label className="text-sm text-gray-600">Thêm sản phẩm</label>
              <div className="flex gap-2 mt-2">
                <select id="add-product-select" className="flex-1 border px-3 py-2 rounded" defaultValue="">
                  <option value="">-- Chọn sản phẩm --</option>
                  {products.map(p => (
                    <option key={p.ma_san_pham || p.id} value={p.ma_san_pham || p.id}>{p.ten_san_pham || p.ten || p.name} - {p.gia_ban ?? p.gia ?? p.price}đ</option>
                  ))}
                </select>
                <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded" onClick={() => {
                  const sel = (document.getElementById('add-product-select') as HTMLSelectElement).value;
                  if (sel) addProductLine(Number(sel));
                }}>Thêm</button>
              </div>
            </div>

            <div className="overflow-x-auto mb-4">
              <table className="w-full border-collapse border text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2">Sản phẩm</th>
                    <th className="border p-2">Số lượng</th>
                    <th className="border p-2">Đơn giá</th>
                    <th className="border p-2">Thành tiền</th>
                    <th className="border p-2">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {orderItems.map(it => (
                    <tr key={it.ma_san_pham}>
                      <td className="border p-2">{it.ten_san_pham || ('#' + it.ma_san_pham)}</td>
                      <td className="border p-2">
                        <input type="number" min={1} className="w-20 border px-2 py-1 rounded" value={it.so_luong} onChange={(e) => setQtyFor(it.ma_san_pham, Number(e.target.value))} />
                      </td>
                      <td className="border p-2">{it.don_gia}</td>
                      <td className="border p-2">{(it.so_luong * it.don_gia)}</td>
                      <td className="border p-2"><button className="text-red-600" onClick={() => removeProductLine(it.ma_san_pham)}>Xóa</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center border-t pt-4">
              <div>
                <p className="text-sm text-gray-600">Tổng tiền</p>
                <p className="font-bold text-lg">{computeTotal()} đ</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowAddModal(false)} className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded">Hủy</button>
                <button onClick={handleCreateOrder} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">Tạo đơn</button>
              </div>
            </div>
          </div>
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
                <p className="text-sm text-gray-600">Người nhận</p>
                <p className="font-semibold">{detail.ten_nguoi_nhan || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">SĐT nhận</p>
                <p className="font-semibold">{detail.so_dien_thoai_nhan || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Địa chỉ nhận</p>
                <p className="font-semibold">{detail.dia_chi_nhan || detail.dia_chi || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Ngày mua</p>
                <p className="font-semibold">{detail.thoi_gian_mua}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Trạng thái</p>
                <div className="flex items-center gap-3">
                  <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="border rounded px-3 py-2">
                    {statuses.map((s) => (
                      <option key={s} value={s}>{statusLabels[s]}</option>
                    ))}
                  </select>
                  <button onClick={handleUpdateStatus} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded">Lưu</button>
                </div>
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
