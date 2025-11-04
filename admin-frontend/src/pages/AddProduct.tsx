import { useState } from "react";
import { productAPI } from "../api/productAPI";

export default function AddProduct() {
  const [form, setForm] = useState({
    ten_san_pham: "",
    gia_ban: "",
    so_luong_ton: "",
    hinh_anh: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await productAPI.create({
      ten_san_pham: form.ten_san_pham,
      gia_ban: Number(form.gia_ban),
      so_luong_ton: Number(form.so_luong_ton),
      hinh_anh: form.hinh_anh,
    });
    alert("✅ Đã thêm sản phẩm!");
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">➕ Thêm sản phẩm</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Tên sản phẩm"
          className="border p-2 w-full"
          onChange={(e) => setForm({ ...form, ten_san_pham: e.target.value })}
        />
        <input
          type="number"
          placeholder="Giá bán"
          className="border p-2 w-full"
          onChange={(e) => setForm({ ...form, gia_ban: e.target.value })}
        />
        <input
          type="number"
          placeholder="Số lượng tồn"
          className="border p-2 w-full"
          onChange={(e) => setForm({ ...form, so_luong_ton: e.target.value })}
        />
        <input
          type="text"
          placeholder="Đường dẫn hình ảnh"
          className="border p-2 w-full"
          onChange={(e) => setForm({ ...form, hinh_anh: e.target.value })}
        />
        <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          Thêm sản phẩm
        </button>
      </form>
    </div>
  );
}
