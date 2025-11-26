import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../logo.svg";
import "./Header.css";

export default function Header() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const raw = localStorage.getItem("user");
    setUser(raw ? JSON.parse(raw) : null);

    const storageHandler = () => {
      const r = localStorage.getItem("user");
      setUser(r ? JSON.parse(r) : null);
    };

    // storage event only fires on other windows/tabs. Use a custom event for same-tab updates.
    const authHandler = () => {
      const r = localStorage.getItem("user");
      setUser(r ? JSON.parse(r) : null);
    };

    window.addEventListener("storage", storageHandler);
    window.addEventListener("authChange", authHandler as EventListener);
    return () => {
      window.removeEventListener("storage", storageHandler);
      window.removeEventListener("authChange", authHandler as EventListener);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    // notify same-tab listeners
    window.dispatchEvent(new Event('authChange'));
    navigate('/auth');
  };

  return (
    <header className="site-header">
      <div className="header-left" onClick={() => navigate('/')}>
        <img src={logo} alt="Logo" className="header-logo" />
        <span className="header-name">MyShop</span>
      </div>

      <nav className="header-center">
        <Link to="/" className="nav-link">Trang chủ</Link>
        <Link to="/products" className="nav-link">Sản phẩm</Link>
        <Link to="/details" className="nav-link">Chi tiết</Link>
        <Link to="/contact" className="nav-link">Liên hệ</Link>
        <Link to="/branches" className="nav-link">Chi nhánh</Link>
      </nav>

      <div className="header-right">
        <button className="icon-btn" onClick={() => navigate('/cart')} title="Giỏ hàng">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 6H21L20 14H8L6 6Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="10" cy="19" r="1" fill="currentColor"/>
            <circle cx="18" cy="19" r="1" fill="currentColor"/>
          </svg>
        </button>

        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">{user.ho_ten || user.ten_dang_nhap}</span>
            <button onClick={handleLogout} className="px-3 py-1 rounded bg-white border border-gray-200 hover:bg-red-500 hover:text-white">Đăng xuất</button>
          </div>
        ) : (
          <button className="icon-btn" onClick={() => navigate('/auth')} title="Tài khoản">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
      </div>
    </header>
  );
}
