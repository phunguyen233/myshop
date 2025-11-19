import { useEffect, useState } from "react";
import { productAPI } from "../api/productAPI";
import { Product } from "../types/Product";

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Product>({
    ma_san_pham: 0,
    ten_san_pham: "",
    gia_ban: 0,
    so_luong_ton: 0,
    hinh_anh: "",
  });

  // Lấy danh sách sản phẩm
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productAPI.getAll();
      setProducts(data);
    } catch (error) {
      console.error("Lỗi khi lấy sản phẩm:", error);
      alert("Lỗi khi lấy danh sách sản phẩm!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Mở form thêm sản phẩm
  const handleAddClick = () => {
    setEditingId(null);
    setFormData({ ma_san_pham: 0, ten_san_pham: "", gia_ban: 0, so_luong_ton: 0, hinh_anh: "" });
    setShowForm(true);
  };

  // Mở form sửa sản phẩm
  const handleEditClick = (product: Product) => {
    setEditingId(product.ma_san_pham);
    setFormData(product);
    setShowForm(true);
  };

  // Xóa sản phẩm
  const handleDeleteClick = async (id: number) => {
    if (window.confirm("Bạn chắc chắn muốn xóa sản phẩm này?")) {
      try {
        await productAPI.delete(id);
        alert("Xóa sản phẩm thành công!");
        fetchProducts();
      } catch (error) {
        console.error("Lỗi khi xóa sản phẩm:", error);
        alert("Lỗi khi xóa sản phẩm!");
      }
    }
  };

  // Xử lý submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        // Cập nhật sản phẩm
        await productAPI.update(editingId, formData);
        alert("Cập nhật sản phẩm thành công!");
      } else {
        // Thêm sản phẩm mới
        await productAPI.create(formData);
        alert("Thêm sản phẩm thành công!");
      }
      setShowForm(false);
      fetchProducts();
    } catch (error) {
      console.error("Lỗi:", error);
      alert("Lỗi khi lưu sản phẩm!");
    }
  };

  // Xử lý thay đổi input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "gia_ban" || name === "so_luong_ton" ? parseFloat(value) : value,
    });
  };

  // Lọc sản phẩm dựa trên tìm kiếm
  const filteredProducts = products.filter((p) =>
    p.ten_san_pham.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.ma_san_pham.toString().includes(searchTerm)
  );

  return (
    <div className="p-6">
      {/* Header với nút thêm sản phẩm */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">📦 Quản lý sản phẩm</h2>
        <button
          onClick={handleAddClick}
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-semibold transition"
        >
           Thêm sản phẩm
        </button>
      </div>

      {/* Thanh tìm kiếm */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="🔍 Tìm kiếm theo tên hoặc mã sản phẩm..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-64 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Form thêm/sửa sản phẩm */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-xl">
            <h3 className="text-2xl font-bold mb-6">
              {editingId ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Tên sản phẩm</label>
                <input
                  type="text"
                  name="ten_san_pham"
                  value={formData.ten_san_pham}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Giá bán (₫)</label>
                <input
                  type="number"
                  name="gia_ban"
                  value={formData.gia_ban}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Số lượng tồn</label>
                <input
                  type="number"
                  name="so_luong_ton"
                  value={formData.so_luong_ton}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">URL Hình ảnh</label>
                <input
                  type="text"
                  name="hinh_anh"
                  value={formData.hinh_anh}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-semibold transition"
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

      {/* Danh sách sản phẩm */}
      {loading ? (
        <p className="text-center text-gray-500 py-8">Đang tải dữ liệu...</p>
      ) : filteredProducts.length === 0 ? (
        <p className="text-center text-gray-500 py-8">
          {products.length === 0 ? "Chưa có sản phẩm nào. Hãy thêm sản phẩm mới!" : "Không tìm thấy sản phẩm nào."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-3 text-left">Mã</th>
                <th className="border p-3 text-left">Tên sản phẩm</th>
                <th className="border p-3 text-center">Giá bán</th>
                <th className="border p-3 text-center">Tồn kho</th>
                <th className="border p-3 text-center">Hình ảnh</th>
                <th className="border p-3 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr key={p.ma_san_pham} className="hover:bg-gray-50">
                  <td className="border p-3">{p.ma_san_pham}</td>
                  <td className="border p-3 font-semibold">{p.ten_san_pham}</td>
                  <td className="border p-3 text-center">{p.gia_ban.toLocaleString("vi-VN")}₫</td>
                  <td className="border p-3 text-center">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      p.so_luong_ton > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}>
                      {p.so_luong_ton}
                    </span>
                  </td>
                  <td className="border p-3 text-center">
                    {p.hinh_anh && (
                      <img src={p.hinh_anh} alt={p.ten_san_pham} className="w-12 h-12 object-cover rounded mx-auto" />
                    )}
                  </td>
                  <td className="border p-3 text-center space-x-2">
                    <button
                      onClick={() => handleEditClick(p)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded inline-block transition"
                    >
                       Sửa
                    </button>
                    <button
                      onClick={() => handleDeleteClick(p.ma_san_pham)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded inline-block transition"
                    >
                       Xóa
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
}
