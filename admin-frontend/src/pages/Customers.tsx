import React, { useEffect, useState } from "react";
import { customerAPI, Customer } from "../api/customerAPI";

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Customer>({
    ma_khach_hang: 0,
    ten_khach_hang: "",
    sdt: "",
    dia_chi: "",
  });

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
  setFormData({ ma_khach_hang: 0, ten_khach_hang: "", sdt: "", dia_chi: "" });
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

  // Xử lý submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        // Cập nhật khách hàng
        await customerAPI.update(editingId, formData);
        alert("Cập nhật khách hàng thành công!");
      } else {
        // Thêm khách hàng mới
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
    if (name === "sdt") {
      setFormData({ ...formData, sdt: value });
    } else if (name === "ten_khach_hang") {
      setFormData({ ...formData, ten_khach_hang: value });
    } else if (name === "dia_chi") {
      setFormData({ ...formData, dia_chi: value });
    }
  };

  return (
    <div className="p-6">
      {/* Header với nút thêm khách hàng */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">👥 Quản lý khách hàng</h1>
        <button
          onClick={handleAddClick}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold transition"
        >
          ➕ Thêm khách hàng
        </button>
      </div>

      {/* Form thêm/sửa khách hàng */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-xl">
            <h3 className="text-2xl font-bold mb-6">
              {editingId ? "✏️ Sửa khách hàng" : "➕ Thêm khách hàng mới"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Tên khách hàng</label>
                <input
                  type="text"
                  name="ten_khach_hang"
                  value={formData.ten_khach_hang}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Số điện thoại</label>
                <input
                  type="tel"
                  name="sdt"
                  value={formData.sdt}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Địa chỉ</label>
                <input
                  type="text"
                  name="dia_chi"
                  value={formData.dia_chi}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-semibold transition"
                >
                  Lưu
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-2 rounded-lg font-semibold transition"
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
        <p className="text-center text-gray-500 py-8">Đang tải dữ liệu...</p>
      ) : customers.length === 0 ? (
        <p className="text-center text-gray-500 py-8">Chưa có khách hàng nào. Hãy thêm khách hàng mới!</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-3 text-left">Mã KH</th>
                <th className="border p-3 text-left">Tên khách hàng</th>
                <th className="border p-3 text-center">Số điện thoại</th>
                <th className="border p-3 text-left">Địa chỉ</th>
                <th className="border p-3 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.ma_khach_hang} className="hover:bg-gray-50">
                  <td className="border p-3 text-center">{c.ma_khach_hang}</td>
                  <td className="border p-3 font-semibold">{c.ten_khach_hang}</td>
                  <td className="border p-3 text-center">{c.sdt}</td>
                  <td className="border p-3">{c.dia_chi}</td>
                  <td className="border p-3 text-center space-x-2">
                    <button
                      onClick={() => handleEditClick(c)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded inline-block transition"
                    >
                      ✏️ Sửa
                    </button>
                    <button
                      onClick={() => handleDeleteClick(c.ma_khach_hang)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded inline-block transition"
                    >
                      🗑️ Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Customers;
