import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // fetch a few products to show as preview
    axios
      .get("http://localhost:5000/api/products")
      .then((res) => setProducts((res.data || []).slice(0, 4)))
      .catch(() => setProducts([]));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <header className="bg-gradient-to-r from-green-600 to-emerald-500 text-white">
        <div className="max-w-7xl mx-auto px-6 py-20 lg:py-28 flex flex-col lg:flex-row items-center gap-8">
          <div className="w-full lg:w-1/2">
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-4">MyShop — Mua sắm thông minh, giao nhanh</h1>
            <p className="text-lg sm:text-xl text-green-100 mb-6">Sản phẩm chất lượng, giá hợp lý và dịch vụ tận tâm. Khám phá bộ sưu tập mới nhất và nhận giao hàng nhanh chóng.</p>
            <div className="flex gap-3">
              <button onClick={() => navigate('/shop')} className="bg-white text-green-700 font-semibold px-6 py-3 rounded-lg shadow hover:shadow-lg">Mua ngay</button>
              <button onClick={() => navigate('/about')} className="bg-transparent border border-white/40 text-white px-5 py-3 rounded-lg hover:bg-white/10">Tìm hiểu thêm</button>
            </div>
          </div>
          <div className="w-full lg:w-1/2">
            <div className="bg-white rounded-2xl p-4 shadow-lg">
              <img src="/hero-products.jpg" alt="hero" className="w-full h-64 object-cover rounded-xl" onError={(e:any)=>{e.currentTarget.src='/placeholder.png'}}/>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Features */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <svg className="mx-auto mb-3 text-green-600" width="36" height="36" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <h3 className="font-semibold mb-1">Chất lượng đảm bảo</h3>
            <p className="text-sm text-gray-500">Sản phẩm chính hãng, kiểm định trước khi giao.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <svg className="mx-auto mb-3 text-green-600" width="36" height="36" viewBox="0 0 24 24" fill="none"><path d="M3 12h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <h3 className="font-semibold mb-1">Giao hàng nhanh</h3>
            <p className="text-sm text-gray-500">Nhiều lựa chọn giao hàng, thời gian nhanh chóng.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <svg className="mx-auto mb-3 text-green-600" width="36" height="36" viewBox="0 0 24 24" fill="none"><path d="M12 5v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <h3 className="font-semibold mb-1">Hỗ trợ 24/7</h3>
            <p className="text-sm text-gray-500">Đội ngũ chăm sóc luôn sẵn sàng giải đáp.</p>
          </div>
        </section>

        {/* Featured products preview */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Sản phẩm nổi bật</h2>
            <button onClick={() => navigate('/shop')} className="text-sm text-green-600 hover:underline">Xem tất cả</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.length === 0 ? (
              Array.from({length:4}).map((_,i)=>(
                <div key={i} className="bg-white rounded-lg p-4 shadow animate-pulse">
                  <div className="h-40 bg-gray-200 rounded mb-3"/>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"/>
                  <div className="h-4 bg-gray-200 rounded w-1/2"/>
                </div>
              ))
            ) : (
              products.map((p:any) => (
                <div key={p.ma_san_pham || p.id} className="bg-white rounded-lg p-4 shadow flex flex-col">
                  <div className="h-40 mb-3">
                    <img src={p.hinh_anh || '/placeholder.png'} alt={p.ten_san_pham || p.name} className="w-full h-full object-cover rounded" onError={(e:any)=>{e.currentTarget.src='/placeholder.png'}}/>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm mb-2 truncate">{p.ten_san_pham || p.name}</h3>
                    <div className="text-green-600 font-bold">{Number(p.gia_ban || p.gia || p.price || 0).toLocaleString()}₫</div>
                  </div>
                  <div className="mt-3">
                    <button onClick={() => navigate('/product/' + (p.ma_san_pham || p.id))} className="w-full bg-green-600 text-white py-2 rounded">Chi tiết</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Newsletter / CTA */}
        <section className="bg-gradient-to-r from-gray-100 to-white border border-gray-200 rounded-lg p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-semibold">Nhận thông tin khuyến mãi</h3>
            <p className="text-sm text-gray-600">Đăng ký nhận thông tin từ MyShop để không bỏ lỡ ưu đãi.</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <input placeholder="Email của bạn" className="px-4 py-2 border rounded w-full md:w-72" />
            <button className="bg-green-600 text-white px-5 py-2 rounded">Đăng ký</button>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-6 py-8 text-sm text-gray-600">© {new Date().getFullYear()} MyShop. All rights reserved.</div>
      </footer>
    </div>
  );
}
