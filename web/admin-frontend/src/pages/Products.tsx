import { useEffect, useState } from "react";
import { productAPI } from "../api/productAPI";
import { Product } from "../types/Product";
import axiosClient from "../api/axiosClient";

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
    mo_ta: "",
  });
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [productFieldErrors, setProductFieldErrors] = useState<{ ten_san_pham?: string; gia_ban?: string; }>({});

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
    // client-side validation
    const errs: { ten_san_pham?: string; gia_ban?: string } = {};
    if (!formData.ten_san_pham || !formData.ten_san_pham.trim()) errs.ten_san_pham = 'Vui lòng nhập tên sản phẩm';
    if (!formData.gia_ban || Number(formData.gia_ban) <= 0) errs.gia_ban = 'Vui lòng nhập giá bán hợp lệ';
    if (Object.keys(errs).length) {
      setProductFieldErrors(errs);
      const msgs = Object.values(errs).join('\n');
      alert('Vui lòng hoàn thành thông tin sản phẩm:\n' + msgs);
      return;
    }
    setProductFieldErrors({});

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

  const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Lọc sản phẩm dựa trên tìm kiếm
  const filteredProducts = products.filter((p) =>
    p.ten_san_pham.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.ma_san_pham.toString().includes(searchTerm)
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold text-foreground"> Quản lý sản phẩm</h2>
      </div>

      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, mã..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64 border border-input bg-background text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
            onKeyDown={(e) => { if (e.key === 'Enter') { /* client-side filter reactive */ } }}
          />
          <button onClick={() => { }} className="bg-gray-200 text-gray-800 hover:bg-gray-300 px-3 py-2 rounded-lg transition">Tìm</button>
        </div>
        <div>
          <button
            onClick={handleAddClick}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition shadow-sm"
          >
            Thêm sản phẩm
          </button>
        </div>
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
                  className={`w-full border border-input bg-background rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black ${productFieldErrors.ten_san_pham ? 'border-red-500' : ''}`}
                  required
                />
                {productFieldErrors.ten_san_pham && <p className="text-red-600 text-xs mt-1">{productFieldErrors.ten_san_pham}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Giá bán (₫)</label>
                <input
                  type="number"
                  name="gia_ban"
                  value={formData.gia_ban}
                  onChange={handleInputChange}
                  className={`w-full border border-input bg-background rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black ${productFieldErrors.gia_ban ? 'border-red-500' : ''}`}
                  required
                />
                {productFieldErrors.gia_ban && <p className="text-red-600 text-xs mt-1">{productFieldErrors.gia_ban}</p>}
              </div>
              {/* Removed Số lượng tồn input as requested */}
              <div>
                <label className="block text-sm font-semibold mb-1">URL Hình ảnh</label>
                <div className="flex gap-2 items-center">
                  <input type="file" accept="image/*" onChange={async (e) => {
                    const f = e.target.files && e.target.files[0];
                    if (!f) return;
                    try {
                      setUploading(true);
                      const fd = new FormData();
                      fd.append('file', f);
                      const res = await axiosClient.post('/uploads', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                      const url = res.data.url;
                      setFormData(prev => ({ ...prev, hinh_anh: url } as Product));
                      setPreview(url);
                    } catch (err) {
                      console.error('Upload failed', err);
                      alert('Tải ảnh lên thất bại');
                    } finally { setUploading(false); }
                  }} className="" />
                  {uploading ? <div className="text-sm text-muted-foreground">Đang tải...</div> : null}
                </div>
                <input type="hidden" name="hinh_anh" value={formData.hinh_anh} />
                {preview && <img src={preview} alt="preview" className="mt-2 w-32 h-20 object-cover rounded" />}
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Mô tả</label>
                <textarea
                  name="mo_ta"
                  value={formData.mo_ta}
                  onChange={handleTextAreaChange}
                  rows={4}
                  className="w-full border border-input bg-background rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Mô tả sản phẩm (tùy chọn)"
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
                      {p.hinh_anh && (
                        <img src={p.hinh_anh} alt={p.ten_san_pham} className="w-10 h-10 object-cover rounded mx-auto border border-border" />
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEditClick(p)}
                          className="bg-white border border-border hover:bg-green-600 hover:text-white text-foreground px-3 py-1 rounded transition text-xs"
                        >
                          Sửa
                        </button>

                        <button
                          onClick={() => handleDeleteClick(p.ma_san_pham)}
                          className="bg-white border border-border hover:bg-red-600 hover:text-white text-foreground px-3 py-1 rounded transition text-xs"
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
                          <div className="w-9 h-5 bg-gray-300 rounded-full peer-checked:bg-green-600 transition"></div>
                          <div className="absolute left-1 top-1 bg-white w-3 h-3 rounded-full shadow transform peer-checked:translate-x-4 transition"></div>
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