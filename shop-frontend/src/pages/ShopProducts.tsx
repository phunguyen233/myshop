import React, { useEffect, useState } from "react";
import axios from "axios";
import { Product } from "../types/Product";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000/api/products";

export default function ShopProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState<string>("");
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [pressedButton, setPressedButton] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(API_URL)
      .then((res) => {
        const mapped: Product[] = res.data.map((row: any) => ({
          id: row.ma_san_pham ?? row.id,
          ten_san_pham: row.ten_san_pham ?? row.name ?? "",
          gia_ban: row.gia_ban ?? 0,
          so_luong_ton: row.so_luong_ton ?? 0,
          hinh_anh: row.hinh_anh ?? "",
          hien_thi: (row.trang_thai ?? row.hien_thi) === "hien" || row.hien_thi === true,
        }));

        setProducts(mapped.filter((p) => p.hien_thi));
      })
      .catch((err) => {
        console.error("Lỗi khi lấy sản phẩm:", err);
      });
  }, []);

  const handleAddToCart = (product: Product) => {
    try {
      const raw = localStorage.getItem("cart");
      const cart: Array<any> = raw ? JSON.parse(raw) : [];
      const existing = cart.find((c) => c.id === product.id);
      if (existing) {
        existing.quantity = (existing.quantity || 1) + 1;
      } else {
        cart.push({ ...product, quantity: 1 });
      }
      localStorage.setItem("cart", JSON.stringify(cart));
      // small feedback (can be replaced with a toast)
      // eslint-disable-next-line no-alert
      alert(`${product.ten_san_pham} đã được thêm vào giỏ hàng`);
    } catch (err) {
      console.error("Lỗi khi thêm vào giỏ hàng:", err);
    }
  };

  const handleDetails = (product: Product) => {
    navigate(`/product/${product.id}`);
  };
  const filteredProducts = products.filter((p) =>
    p.ten_san_pham?.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-8 flex items-center justify-center" style={{ marginTop: 24 }}>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm sản phẩm..."
          style={{height:35, width: 600, borderRadius: 28, marginBottom: 30 }}
          className=" p-4 border border-gray-300 shadow-lg text-sm"
          aria-label="Tìm sản phẩm"
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 265px)", gap: 16, justifyContent: "center" }}>
        {filteredProducts.map((p) => (
          <div key={p.id} style={{ padding: 4, width: 265 }}>
            <div
              onMouseEnter={() => setHoveredId(p.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="bg-white rounded-2xl shadow-sm overflow-hidden transition border border-gray-200"
              style={{
                padding: 20,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                transform: hoveredId === p.id ? "translateY(-6px)" : "none", 
                boxShadow: hoveredId === p.id ? "0px 10px 20px rgba(0,0,0,0.12)" : undefined,
                transition: "transform 150ms ease, box-shadow 250ms ease",
              }}
            >
              {/* Image (square 1:1) */}
              <div
                className="w-full mb-2 overflow-hidden rounded-xl"
                style={{ position: "relative", width: "100%", paddingTop: "100%", }}
              >
                <img
                  src={p.hinh_anh || "/placeholder.png"}
                  alt={p.ten_san_pham}
                  onError={(e: any) => {
                    e.currentTarget.src = "/placeholder.png";
                  }}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: 20,
                  }}
                />
              </div>

              {/* Info under the image */}
              <div className="text-center px-2">
                <h2 className="font-semibold text-lg mb-1 truncate">{p.ten_san_pham}</h2>
                <p className="text-green-600 font-bold mb-3">{Number(p.gia_ban).toLocaleString()}đ</p>
              </div>

              {/* Buttons row: Add to cart (green) + Details (white) */}
              <div className="px-2 mt-3 flex gap-4 items-center">
                <button
                  type="button"
                  onClick={() => handleAddToCart(p)}
                  onMouseDown={() => setPressedButton(`${p.id}-add`)}
                  onMouseUp={() => setPressedButton(null)}
                  onMouseLeave={() => setPressedButton(null)}
                  onTouchStart={() => setPressedButton(`${p.id}-add`)}
                  onTouchEnd={() => setPressedButton(null)}
                  className={
                    `flex-1 text-white py-3 text-base rounded-2xl transition transform duration-100 focus:outline-none focus:ring-2 focus:ring-green-300 shadow-sm ` +
                    (pressedButton === `${p.id}-add`
                      ? "bg-green-900 scale-95"
                      : "bg-green-600 hover:bg-green-700 active:bg-green-800")
                  }
                >
                  Thêm giỏ hàng
                </button>
                <button
                  type="button"
                  onClick={() => handleDetails(p)}
                  onMouseDown={() => setPressedButton(`${p.id}-details`)}
                  onMouseUp={() => setPressedButton(null)}
                  onMouseLeave={() => setPressedButton(null)}
                  onTouchStart={() => setPressedButton(`${p.id}-details`)}
                  onTouchEnd={() => setPressedButton(null)}
                  className={
                    `flex-1 text-gray-800 border border-gray-300 py-3 text-base rounded-2xl transition transform duration-100 focus:outline-none focus:ring-2 focus:ring-gray-200 shadow-sm ` +
                    (pressedButton === `${p.id}-details`
                      ? "bg-gray-300 scale-95"
                      : "bg-white hover:bg-gray-100 active:bg-gray-200")
                  }
                >
                  Chi tiết
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
