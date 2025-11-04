import React, { useEffect, useState } from "react";
import axios from "axios";
import { Product } from "../types/Product";

const API_URL = "http://localhost:5000/api/products";

export default function ShopProducts() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    axios.get<Product[]>(API_URL).then((res) => {
      const visible = res.data.filter((p) => p.hien_thi);
      setProducts(visible);
    });
  }, []);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-center mb-8">🛍️ Sản phẩm cửa hàng</h1>

      <div className="grid grid-cols-4 gap-6">
        {products.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl shadow hover:shadow-lg transition p-4">
            <img
              src={p.hinh_anh}
              alt={p.ten_san_pham}
              className="w-full h-48 object-cover rounded-xl mb-2"
            />
            <h2 className="font-semibold text-lg">{p.ten_san_pham}</h2>
            <p className="text-green-600 font-bold">{p.gia_ban.toLocaleString()}đ</p>
          </div>
        ))}
      </div>
    </div>
  );
}
