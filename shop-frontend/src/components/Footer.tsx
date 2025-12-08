import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-12 border-t border-border bg-card text-card-foreground dark:bg-gray-900 dark:text-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Logo + description */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center text-white">
              {/* simple kitchen logo */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 3h18v2H3V3z" fill="white" />
                <path d="M7 7h10v5a5 5 0 01-10 0V7z" fill="white" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold">Bếp Mầm</h3>
              <p className="text-sm text-muted-foreground dark:text-gray-400">Thực phẩm sạch, nấu ăn yêu thương — chăm sóc từng bữa ăn cho gia đình.</p>
            </div>
          </div>

          <ul className="text-sm mt-4 space-y-2 text-muted-foreground dark:text-gray-400">
            <li>Địa chỉ: 9A Sơn Kỳ, Phường Tân Sơn Nhì, TP. Hồ Chí Minh</li>
            <li>Hỗ trợ khách hàng: <a href="tel:19009150" className="text-green-600">1900.9150</a></li>
          </ul>
        </div>

        {/* Links column (Về chúng tôi) */}
        <div>
          <h4 className="font-semibold mb-3">Về chúng tôi</h4>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <Link to="/" className="text-muted-foreground dark:text-gray-300 hover:text-green-600">Trang chủ</Link>
            <Link to="/products" className="text-muted-foreground dark:text-gray-300 hover:text-green-600">Sản phẩm</Link>
            <Link to="/about" className="text-muted-foreground dark:text-gray-300 hover:text-green-600">Giới thiệu</Link>
            <Link to="/contact" className="text-muted-foreground dark:text-gray-300 hover:text-green-600">Liên hệ</Link>
            <Link to="/branches" className="text-muted-foreground dark:text-gray-300 hover:text-green-600">Chi nhánh</Link>
          </div>
        </div>

        {/* Kết nối column */}
        <div>
          <h4 className="font-semibold mb-3">Kết nối</h4>
          <div className="flex items-center gap-4">
            <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:opacity-90">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 10-11.5 9.9v-7h-2.2V12h2.2V9.8c0-2.2 1.3-3.5 3.3-3.5.9 0 1.8.1 1.8.1v2h-1c-1 0-1.3.6-1.3 1.2V12h2.3l-.4 2.9h-1.9v7A10 10 0 0022 12z" /></svg>
            </a>

            <a href="https://zalo.me" target="_blank" rel="noopener noreferrer" aria-label="Zalo" className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center hover:opacity-90">
              {/* simple Zalo icon */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 5.58 2 10c0 2.22 1.16 4.25 3 5.67V22l3-1.64C11.02 21.82 11.99 22 12 22c5.52 0 10-3.58 10-8s-4.48-12-10-12zM8.5 9.5h2V11H8.5v2H7V7h3.5v2.5z"/></svg>
            </a>

            <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 via-yellow-400 to-purple-600 text-white flex items-center justify-center hover:opacity-90">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5zm5 6.2A4.8 4.8 0 1016.8 13 4.8 4.8 0 0012 8.2zm6.4-2.6a1.2 1.2 0 11-1.2 1.2 1.2 1.2 0 011.2-1.2z"/></svg>
            </a>
          </div>

          <div className="mt-6 text-sm text-muted-foreground dark:text-gray-400">
            <div className="mb-1">Giờ mở cửa: 7:00 - 20:00</div>
            <div>Email: <a href="mailto:info@bepmam.example" className="text-green-600">info@bepmam.example</a></div>
          </div>
        </div>
      </div>

      {/* Bottom gradient bar */}
      <div className="bg-gradient-to-r from-green-700 to-green-400 text-white text-sm py-3">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <div>© {year} Bếp Mầm. Bản quyền thuộc về Bếp Mầm.</div>
          <div className="flex items-center gap-3">
            <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white/20 hover:bg-white/30">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12A10 10 0 1012 22v-7h-2v-3h2V9.5c0-2 1.2-3.1 3-3.1.9 0 1.8.1 1.8.1v2h-1c-1 0-1.3.6-1.3 1.2V12h2.3L18 14.9H15v7A10 10 0 0022 12z"/></svg>
            </a>
            <a href="https://zalo.me" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white/20 hover:bg-white/30">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 5.58 2 10c0 2.22 1.16 4.25 3 5.67V22l3-1.64C11.02 21.82 11.99 22 12 22c5.52 0 10-3.58 10-8s-4.48-12-10-12zM8.5 9.5h2V11H8.5v2H7V7h3.5v2.5z"/></svg>
            </a>
            <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white/20 hover:bg-white/30">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5zm5 6.2A4.8 4.8 0 1016.8 13 4.8 4.8 0 0012 8.2zm6.4-2.6a1.2 1.2 0 11-1.2 1.2 1.2 1.2 0 011.2-1.2z"/></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
