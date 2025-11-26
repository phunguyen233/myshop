import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

const API = "http://localhost:5000/api";

export default function Cart() {
  const [cart, setCart] = useState<Array<any>>([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const raw = localStorage.getItem("cart");
    setCart(raw ? JSON.parse(raw) : []);
  }, []);

  const save = (next: any) => {
    setCart(next);
    localStorage.setItem("cart", JSON.stringify(next));
  };

  const inc = (id: any) => {
    const next = cart.map((c) => (c.id === id ? { ...c, quantity: (c.quantity || 1) + 1 } : c));
    save(next);
  };

  const dec = (id: any) => {
    let next = cart.map((c) => (c.id === id ? { ...c, quantity: (c.quantity || 1) - 1 } : c));
    next = next.filter((c) => c.quantity > 0);
    save(next);
  };

  const remove = (id: any) => {
    const next = cart.filter((c) => c.id !== id);
    save(next);
  };

  const total = cart.reduce((s, c) => s + (c.quantity || 1) * Number(c.gia_ban || c.price || 0), 0);

  const handleCheckout = async () => {
    const token = localStorage.getItem("token");
    const userRaw = localStorage.getItem("user");
    if (!token || !userRaw) {
      // Inform user and redirect to auth page so they can login/register
      alert('Vui lòng đăng nhập hoặc đăng ký để tiếp tục đặt hàng');
      // include autoCheckout so after login we can continue the checkout flow
      navigate('/auth', { state: { from: '/cart', autoCheckout: true } });
      return;
    }

    const user = JSON.parse(userRaw);

    try {
      // create or find customer linked to account
      const custRes = await axios.post(`${API}/customers`, { ho_ten: user.ho_ten || user.ten_dang_nhap, ma_tai_khoan: user.id }, { headers: { Authorization: `Bearer ${token}` } });
      const ma_khach_hang = custRes.data.ma_khach_hang;

      const chi_tiet = cart.map((c) => ({ ma_san_pham: c.id, so_luong: c.quantity || 1, don_gia: c.gia_ban || c.price || 0 }));

      const orderRes = await axios.post(`${API}/orders`, { ma_khach_hang, tong_tien: total, chi_tiet }, { headers: { Authorization: `Bearer ${token}` } });
      alert('Đặt hàng thành công! Mã đơn: ' + orderRes.data.ma_don_hang);
      save([]);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || 'Lỗi khi đặt hàng');
    }
  };

  // If user was redirected to login for checkout, and now returns with autoCheckout flag,
  // automatically run checkout (only if logged in).
  React.useEffect(() => {
    const s = (location.state as any) || {};
    if (s.autoCheckout) {
      const tokenNow = localStorage.getItem('token');
      if (tokenNow) {
        // small delay so any navigation/localStorage updates settle
        setTimeout(() => {
          handleCheckout();
        }, 200);
      }
      // clear the state so we don't trigger again
      navigate('/cart', { replace: true, state: {} });
    }
  }, [location.state]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Giỏ hàng</h1>
      {cart.length === 0 ? (
        <p>Giỏ hàng của bạn đang trống.</p>
      ) : (
        <div className="space-y-4">
          {cart.map((c) => (
            <div key={c.id} className="flex items-center gap-4 border p-3 rounded">
              <img src={c.hinh_anh || '/placeholder.png'} alt={c.ten_san_pham} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }} />
              <div className="flex-1">
                <div className="font-semibold">{c.ten_san_pham}</div>
                <div className="text-green-600 font-bold">{Number(c.gia_ban || c.price || 0).toLocaleString()}đ</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => dec(c.id)} className="px-3 py-1 bg-gray-200 rounded">-</button>
                <div className="px-3">{c.quantity || 1}</div>
                <button onClick={() => inc(c.id)} className="px-3 py-1 bg-gray-200 rounded">+</button>
              </div>
              <button onClick={() => remove(c.id)} className="ml-4 text-red-600">✕</button>
            </div>
          ))}

          <div className="text-right font-semibold">Tổng: {Number(total).toLocaleString()}đ</div>

          <div className="text-right">
            <button onClick={handleCheckout} className="bg-blue-600 text-white px-6 py-2 rounded">Đặt hàng</button>
          </div>
        </div>
      )}
    </div>
  );
}
