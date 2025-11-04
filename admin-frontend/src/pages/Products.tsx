import { useEffect, useState } from "react";
import { productAPI } from "../api/productAPI";
import { Product } from "../types/Product";

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    productAPI.getAll().then(setProducts);
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">📦 Danh sách sản phẩm</h2>
      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Mã</th>
            <th className="border p-2">Tên sản phẩm</th>
            <th className="border p-2">Giá bán</th>
            <th className="border p-2">Số lượng</th>
            <th className="border p-2">Hình ảnh</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.ma_san_pham}>
              <td className="border p-2 text-center">{p.ma_san_pham}</td>
              <td className="border p-2">{p.ten_san_pham}</td>
              <td className="border p-2">{p.gia_ban.toLocaleString()}₫</td>
              <td className="border p-2 text-center">{p.so_luong_ton}</td>
              <td className="border p-2">
                <img src={p.hinh_anh} alt={p.ten_san_pham} className="w-16 h-16 object-cover rounded" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
