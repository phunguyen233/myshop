import React, { useEffect, useState } from "react";
import { warehouseAPI } from "../api/warehouseAPI";
import { productAPI } from "../api/productAPI";

const Warehouse: React.FC = () => {
  const [entries, setEntries] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [form, setForm] = useState({ ma_san_pham: 0, so_luong: 0, gia_nhap: 0, don_vi_nhap: "" });

  const fetchEntries = async () => {
    try {
      const data = await warehouseAPI.getAll();
      setEntries(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await productAPI.getAll();
      setProducts(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEntries();
    fetchProducts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        don_vi_nhap: form.don_vi_nhap,
        chi_tiet: [
          { ma_san_pham: form.ma_san_pham, so_luong: form.so_luong, don_gia_nhap: form.gia_nhap },
        ],
      };
      await warehouseAPI.create(payload);
      alert("Nhập kho thành công");
      setForm({ ma_san_pham: 0, so_luong: 0, gia_nhap: 0, don_vi_nhap: "" });
      fetchEntries();
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert("Lỗi khi nhập kho");
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">📥 Quản lý nhập kho</h1>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-4">Thêm phiếu nhập</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm">Sản phẩm</label>
              <select value={form.ma_san_pham} onChange={(e) => setForm({ ...form, ma_san_pham: Number(e.target.value) })} className="w-full border px-2 py-2 rounded">
                <option value={0}>-- Chọn sản phẩm --</option>
                {products.map((p) => (
                  <option key={p.ma_san_pham} value={p.ma_san_pham}>{p.ten_san_pham}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm">Số lượng</label>
              <input type="number" value={form.so_luong} onChange={(e) => setForm({ ...form, so_luong: Number(e.target.value) })} className="w-full border px-2 py-2 rounded" />
            </div>
            <div>
              <label className="block text-sm">Giá nhập</label>
              <input type="number" value={form.gia_nhap} onChange={(e) => setForm({ ...form, gia_nhap: Number(e.target.value) })} className="w-full border px-2 py-2 rounded" />
            </div>
            <div>
              <label className="block text-sm">Đơn vị nhập</label>
              <input type="text" value={form.don_vi_nhap} onChange={(e) => setForm({ ...form, don_vi_nhap: e.target.value })} className="w-full border px-2 py-2 rounded" />
            </div>
            <div>
              <button className="bg-green-600 text-white px-4 py-2 rounded">Nhập kho</button>
            </div>
          </form>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-4">Danh sách phiếu nhập</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border p-2">Mã</th>
                  <th className="border p-2">Thời gian</th>
                  <th className="border p-2">Đơn vị</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e: any) => (
                  <tr key={e.ma_nhap} className="hover:bg-gray-50">
                    <td className="border p-2">{e.ma_nhap}</td>
                    <td className="border p-2">{e.thoi_gian_nhap}</td>
                    <td className="border p-2">{e.don_vi_nhap}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Warehouse;
