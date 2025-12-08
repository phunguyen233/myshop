import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../logobepmam.jpg";
import "./Header.css";

export default function Header() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [showMenu, setShowMenu] = useState(false);

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

  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <header className="site-header">
      <div className="header-left" onClick={() => navigate('/')}>
        <img src={logo} alt="Logo" className="header-logo" />
        <span className="header-name">Bếp Mầm</span>
      </div>

      <nav className="header-center">
        <Link to="/" className="nav-link">Trang chủ</Link>
        <Link to="/products" className="nav-link">Sản phẩm</Link>
        <Link to="/about" className="nav-link">Giới thiệu</Link>
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
          <div className="relative" ref={menuRef}>
            <button onClick={() => setShowMenu(s => !s)} className="px-3 py-1 rounded bg-white border border-gray-200 hover:shadow-sm flex items-center gap-2">
              <span className="text-sm font-medium">{user.ho_ten || user.ten_dang_nhap}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-lg py-2 z-40">
                <button onClick={() => { navigate('/orders-history'); setShowMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-100">Đơn hàng</button>
                <button onClick={() => { handleLogout(); setShowMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-100">Đăng xuất</button>
              </div>
            )}
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
