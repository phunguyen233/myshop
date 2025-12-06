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

  const handleToggleVisibility = async (id: number) => {
    try {
      await productAPI.toggle(id);
      // refresh list to show updated trạng_thai
      fetchProducts();
    } catch (err) {
      console.error('Lỗi khi đổi trạng thái sản phẩm', err);
      alert('Lỗi khi đổi trạng thái sản phẩm');
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
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold text-foreground">📦 Quản lý sản phẩm</h2>
        <button
          onClick={handleAddClick}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-semibold transition shadow-sm"
        >
          Thêm sản phẩm
        </button>
      </div>

      <div className="flex items-center gap-2 w-full max-w-lg">
        <input
          type="text"
          placeholder="🔍 Tìm kiếm theo tên, mã sản phẩm..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full border border-input bg-background text-foreground rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
          onKeyDown={(e) => { if (e.key === 'Enter') { /* client-side filter reactive */ } }}
        />
        <button onClick={() => { }} className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-lg transition">Tìm</button>
      </div>

      {/* Form thêm/sửa sản phẩm */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card text-card-foreground rounded-lg p-8 max-w-md w-full shadow-xl border border-border">
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
                  className="w-full border border-input bg-background rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
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
                  className="w-full border border-input bg-background rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
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
                  className="w-full border border-input bg-background rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
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
                  className="w-full border border-input bg-background rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-2 rounded-lg font-semibold transition"
                >
                  Lưu
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-muted hover:bg-muted/80 text-muted-foreground py-2 rounded-lg font-semibold transition"
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
        <p className="text-center text-muted-foreground py-8">Đang tải dữ liệu...</p>
      ) : filteredProducts.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          {products.length === 0 ? "Chưa có sản phẩm nào. Hãy thêm sản phẩm mới!" : "Không tìm thấy sản phẩm nào."}
        </p>
      ) : (
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="p-4 font-medium">Mã</th>
                  <th className="p-4 font-medium">Tên sản phẩm</th>
                  <th className="p-4 font-medium text-center">Giá bán</th>
                  <th className="p-4 font-medium text-center">Tồn kho</th>
                  <th className="p-4 font-medium text-center">Hình ảnh</th>
                  <th className="p-4 font-medium text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProducts.map((p) => (
                  <tr key={p.ma_san_pham} className={`hover:bg-muted/50 transition-colors ${p.trang_thai !== 'hien' ? 'opacity-70' : ''}`}>
                    <td className="p-4 text-foreground">{p.ma_san_pham}</td>
                    <td className="p-4 font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <span>{p.ten_san_pham}</span>
                        {p.trang_thai !== 'hien' && (
                          <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">Đã ẩn</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-center text-foreground">{p.gia_ban.toLocaleString("vi-VN")}₫</td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${p.so_luong_ton > 0 ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive"
                        }`}>
                        {p.so_luong_ton}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {p.hinh_anh && (
                        <img src={p.hinh_anh} alt={p.ten_san_pham} className="w-10 h-10 object-cover rounded mx-auto border border-border" />
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEditClick(p)}
                          className="bg-card border border-border hover:bg-primary hover:text-primary-foreground text-foreground px-3 py-1 rounded transition text-xs"
                        >
                          Sửa
                        </button>

                        <button
                          onClick={() => handleDeleteClick(p.ma_san_pham)}
                          className="bg-card border border-border hover:bg-destructive hover:text-destructive-foreground text-foreground px-3 py-1 rounded transition text-xs"
                        >
                          Xóa
                        </button>

                        {/* Công tắc gạt */}
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={p.trang_thai === "hien"}
                            onChange={() => handleToggleVisibility(p.ma_san_pham)}
                          />
                          <div className="w-9 h-5 bg-muted rounded-full peer-checked:bg-primary transition"></div>
                          <div className="absolute left-1 top-1 bg-card w-3 h-3 rounded-full shadow transform peer-checked:translate-x-4 transition"></div>
                        </label>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
