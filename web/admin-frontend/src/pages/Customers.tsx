import React, { useEffect, useState } from "react";
import { customerAPI, Customer } from "../api/customerAPI";
import { orderAPI, Order } from "../api/orderAPI";

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [formData, setFormData] = useState<Customer>({
    ma_khach_hang: 0,
    ho_ten: "",
    so_dien_thoai: undefined,
    ma_tai_khoan: undefined,
  } as Customer);

  // Lấy danh sách khách hàng
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await customerAPI.getAll();
      setCustomers(data);
    } catch (error) {
      console.error("Lỗi khi lấy khách hàng:", error);
      alert("Lỗi khi lấy danh sách khách hàng!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Mở form thêm khách hàng
  const handleAddClick = () => {
    setEditingId(null);
    setFormData({ ma_khach_hang: 0, ho_ten: "", so_dien_thoai: undefined, ma_tai_khoan: undefined } as Customer);
    setShowForm(true);
  };

  // Mở form sửa khách hàng
  const handleEditClick = (customer: Customer) => {
    setEditingId(customer.ma_khach_hang);
    setFormData(customer);
    setShowForm(true);
  };

  // Xóa khách hàng
  const handleDeleteClick = async (id: number) => {
    if (window.confirm("Bạn chắc chắn muốn xóa khách hàng này?")) {
      try {
        await customerAPI.delete(id);
        alert("Xóa khách hàng thành công!");
        fetchCustomers();
      } catch (error) {
        console.error("Lỗi khi xóa khách hàng:", error);
        alert("Lỗi khi xóa khách hàng!");
      }
    }
  };

  // (Lịch sử mua hàng được chuyển sang trang Thống kê)
  const validatePhone = (phone: string) => {
    if (!phone) {
      alert("Số điện thoại không được để trống.");
      return false;
    }
    if (!/^[0-9]+$/.test(phone)) {
      alert("Số điện thoại chỉ được chứa chữ số.");
      return false;
    }
    if (phone.length !== 10) {
      alert("Số điện thoại phải có đúng 10 số.");
      return false;
    }
    return true;
  };
  // Xử lý submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const phone = (formData.so_dien_thoai || "").trim();
      const errs: string[] = [];
      if (!formData.ho_ten || !formData.ho_ten.trim()) errs.push('Tên khách hàng');
      if (!phone) errs.push('Số điện thoại');
      if (errs.length) {
        alert('Vui lòng điền đầy đủ các trường: ' + errs.join(', '));
        return;
      }
      if (!validatePhone(phone)) {
        return;
      }
      if (editingId) {
        // Cập nhật khách hàng
        await customerAPI.update(editingId, formData);
        alert("Cập nhật khách hàng thành công!");
      } else {
        const existsByPhone = customers.some(c => (c.so_dien_thoai || "").trim() === phone);
        if (existsByPhone) {
          alert("Số điện thoại đã tồn tại trong danh sách khách hàng — không thêm được.");
          return;
        }
        // Nếu chưa trùng, tạo mới
        await customerAPI.create(formData);
        alert("Thêm khách hàng thành công!");
      }
      setShowForm(false);
      fetchCustomers();
    } catch (error) {
      console.error("Lỗi:", error);
      alert("Lỗi khi lưu khách hàng!");
    }
  };

  // Xử lý thay đổi input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "ho_ten") {
      setFormData({ ...formData, ho_ten: value });
    } else if (name === "so_dien_thoai") {
      setFormData({ ...formData, so_dien_thoai: value });
    }
  };

  // Lọc khách hàng theo tìm kiếm (tên hoặc mã hoặc số điện thoại)
  const filteredCustomers = customers.filter((c) => {
    const q = (searchTerm || "").trim().toLowerCase();
    if (!q) return true;
    return (
      (c.ho_ten || "").toLowerCase().includes(q) ||
      c.ma_khach_hang.toString().includes(q) ||
      ((c.so_dien_thoai || "").toLowerCase().includes(q))
    );
  });

  const fetchOrdersForCustomer = async (id: number) => {
    try {
      setLoadingOrders(true);
      const all = await orderAPI.getAll();
      const filtered = all.filter((o) => o.ma_khach_hang === id);
      setCustomerOrders(filtered);
    } catch (err) {
      console.error('Lỗi khi lấy đơn hàng của khách hàng', err);
      setCustomerOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleSelectCustomer = (id: number) => {
    setSelectedCustomerId(id);
    fetchOrdersForCustomer(id);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-foreground"> Quản lý khách hàng</h1>
      </div>

      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Tìm theo tên, mã hoặc SĐT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64 border border-input bg-background text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
            onKeyDown={(e) => { if (e.key === 'Enter') { /* client-side filter is reactive */ } }}
          />
          <button onClick={() => { /* no-op: filter is reactive */ }} className="bg-gray-200 text-gray-800 hover:bg-gray-300 px-3 py-2 rounded-lg transition">Tìm</button>
        </div>
        <div>
          <button
            onClick={handleAddClick}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition shadow-sm"
          >
            Thêm khách hàng
          </button>
        </div>
      </div>

      {/* Form thêm/sửa khách hàng */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card text-card-foreground rounded-lg p-8 max-w-md w-full shadow-xl border border-border">
            <h3 className="text-2xl font-bold mb-6">
              {editingId ? " Sửa khách hàng" : "Thêm khách hàng mới"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Tên khách hàng</label>
                <input
                  type="text"
                  name="ho_ten"
                  value={formData.ho_ten}
                  onChange={handleInputChange}
                  className="w-full border border-input bg-background rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Số điện thoại</label>
                <input
                  type="text"
                  name="so_dien_thoai"
                  value={formData.so_dien_thoai ?? ""}
                  onChange={handleInputChange}
                  className="w-full border border-input bg-background rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold transition"
                >
                  Lưu
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg font-semibold transition"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Danh sách khách hàng */}
      {loading ? (
        <p className="text-center text-muted-foreground py-8">Đang tải dữ liệu...</p>
      ) : filteredCustomers.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          {customers.length === 0 ? "Chưa có khách hàng nào. Hãy thêm khách hàng mới!" : "Không tìm thấy khách hàng nào."}
        </p>
      ) : (
        <>
          <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
            <div className="h-80 overflow-y-auto">
              <div className="min-w-full overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="p-4 font-medium text-left">Mã KH</th>
                      <th className="p-4 font-medium">Tên khách hàng</th>
                      <th className="p-4 font-medium">SĐT</th>
                      <th className="p-4 font-medium">Ngày tạo</th>
                      <th className="p-4 font-medium text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredCustomers.map((c) => (
                      <tr
                        key={c.ma_khach_hang}
                        onClick={() => handleSelectCustomer(c.ma_khach_hang)}
                        className={`cursor-pointer transition-colors ${selectedCustomerId === c.ma_khach_hang ? 'bg-muted/40' : 'hover:bg-gray-100'}`}>
                        <td className="p-4 text-left text-foreground">{c.ma_khach_hang}</td>
                        <td className="p-4 font-semibold text-foreground">{c.ho_ten}</td>
                        <td className="p-4 text-foreground">{c.so_dien_thoai || '-'}</td>
                        <td className="p-4 text-foreground">{c.ngay_tao || '-'}</td>
                        <td className="p-4 text-center space-x-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEditClick(c); }}
                            className="bg-white border border-border hover:bg-green-600 hover:text-white text-foreground px-3 py-1 rounded inline-block transition text-xs"
                          >
                            Sửa
                          </button>

                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteClick(c.ma_khach_hang); }}
                            className="bg-white border border-border hover:bg-red-600 hover:text-white text-foreground px-3 py-1 rounded inline-block transition text-xs"
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Lịch sử mua hàng của khách hàng đã chọn */}
          <div className="bg-card text-card-foreground p-6 rounded-xl shadow-sm border border-border mt-4">
            <h3 className="font-semibold mb-4 text-lg">Lịch sử mua hàng</h3>
            {!selectedCustomerId ? (
              <p className="text-muted-foreground">Chọn một khách hàng ở trên để xem lịch sử mua hàng.</p>
            ) : loadingOrders ? (
              <p className="text-muted-foreground">Đang tải lịch sử mua hàng...</p>
            ) : customerOrders.length === 0 ? (
              <p className="text-muted-foreground">Chưa có đơn hàng nào cho khách hàng này.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="p-3 font-medium">Mã đơn</th>
                      <th className="p-3 font-medium">Thời gian</th>
                      <th className="p-3 font-medium">Tổng tiền</th>
                      <th className="p-3 font-medium">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {customerOrders.map((o) => (
                      <tr key={o.ma_don_hang} className="hover:bg-muted/50 transition-colors">
                        <td className="p-3 text-foreground">{o.ma_don_hang}</td>
                        <td className="p-3 text-foreground">{o.thoi_gian_mua || '-'}</td>
                        <td className="p-3 text-foreground">{(o.tong_tien || 0).toLocaleString()}</td>
                        <td className="p-3 text-foreground">{o.trang_thai || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
      {/* Lịch sử mua hàng đã được chuyển sang trang Thống kê */}
    </div>
  );
};

export default Customers;