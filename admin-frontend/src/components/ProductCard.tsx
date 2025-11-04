import React, { useState, ChangeEvent, FormEvent } from "react";
import { Product } from "../types/Product";

interface Props {
  onSubmit: (product: Product) => void;
  initialData?: Product | null;
}

const ProductForm: React.FC<Props> = ({ onSubmit, initialData }) => {
  const [formData, setFormData] = useState<Product>(
    initialData || {
      ten_san_pham: "",
      gia_ban: 0,
      so_luong_ton: 0,
      hinh_anh: "",
      trang_thai: "hien",
    }
  );

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "gia_ban" || name === "so_luong_ton"
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      ten_san_pham: "",
      gia_ban: 0,
      so_luong_ton: 0,
      hinh_anh: "",
      trang_thai: "hien",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white rounded shadow mb-4">
      <h2 className="text-lg font-semibold mb-3">
        {initialData ? "🛠️ Sửa sản phẩm" : "➕ Thêm sản phẩm mới"}
      </h2>

      <input
        type="text"
        name="ten_san_pham"
        placeholder="Tên sản phẩm"
        value={formData.ten_san_pham}
        onChange={handleChange}
        className="border p-2 w-full mb-2"
        required
      />
      <input
        type="number"
        name="gia_ban"
        placeholder="Giá bán"
        value={formData.gia_ban}
        onChange={handleChange}
        className="border p-2 w-full mb-2"
        required
      />
      <input
        type="number"
        name="so_luong_ton"
        placeholder="Số lượng tồn"
        value={formData.so_luong_ton}
        onChange={handleChange}
        className="border p-2 w-full mb-2"
        required
      />
      <input
        type="text"
        name="hinh_anh"
        placeholder="Đường dẫn hình ảnh (URL)"
        value={formData.hinh_anh}
        onChange={handleChange}
        className="border p-2 w-full mb-2"
        required
      />

      <select
        name="trang_thai"
        value={formData.trang_thai}
        onChange={handleChange}
        className="border p-2 w-full mb-3"
      >
        <option value="hien">Hiện</option>
        <option value="an">Ẩn</option>
      </select>

      <button
        type="submit"
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        {initialData ? "Cập nhật" : "Thêm mới"}
      </button>
    </form>
  );
};

export default ProductForm;
export {};
