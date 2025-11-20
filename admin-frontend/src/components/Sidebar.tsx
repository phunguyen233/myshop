import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Sidebar() {
  const location = useLocation();
  const { sidebarCollapsed } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const linkClass = (path: string) =>
    `flex items-center ${sidebarCollapsed ? "justify-center" : "px-4"} py-2 rounded transition-all duration-300 ease-in-out ${
      isActive(path)
        ? "bg-white text-gray-900 shadow-sm font-semibold"
        : "text-gray-700 hover:bg-gray-200"
    }`;

  return (
    <aside className={`${sidebarCollapsed ? "w-12" : "w-64"} bg-gray-100 text-gray-800 min-h-screen p-2 flex flex-col transition-all duration-300 ease-in-out`}> 
      {!sidebarCollapsed && (
        <h2 className="text-2xl font-bold mb-6 text-center">Admin</h2>
      )}

      <nav className={sidebarCollapsed ? "flex flex-col gap-2 items-center pt-3" : "flex flex-col gap-1 flex-1"}>
        {/* Trang chủ */}
        <Link to="/dashboard" className={linkClass("/dashboard")}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`h-5 w-5 text-gray-700 ${sidebarCollapsed ? "" : "mr-3"}`}>
            <path d="M3 9.5V20a1 1 0 001 1h5v-7h4v7h5a1 1 0 001-1V9.5a1 1 0 00-.37-.77l-8-6.5a1 1 0 00-1.26 0l-8 6.5A1 1 0 003 9.5z" />
          </svg>
          {!sidebarCollapsed && <span>Trang chủ</span>}
        </Link>

        {/* Quản lý sản phẩm */}
        <Link to="/products" className={linkClass("/products")}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`h-5 w-5 text-gray-700 ${sidebarCollapsed ? "" : "mr-3"}`}>
            <path d="M21 16V8a2 2 0 00-1-1.73l-8-5a2 2 0 00-2 0l-8 5A2 2 0 002 8v8a2 2 0 001 1.73l8 5a2 2 0 002 0l8-5A2 2 0 0021 16zM12 3.1L18.6 7 12 10.9 5.4 7 12 3.1zM4 9.2l7 4v7.6L4 16.8V9.2zM13 21.8v-7.6l7-4v7.6l-7 4z" />
          </svg>
          {!sidebarCollapsed && <span>Sản phẩm</span>}
        </Link>

        {/* Quản lý khách hàng */}
        <Link to="/customers" className={linkClass("/customers")}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`h-5 w-5 text-gray-700 ${sidebarCollapsed ? "" : "mr-3"}`}>
            <path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-5 0-9 2.5-9 6v2h18v-2c0-3.5-4-6-9-6z" />
          </svg>
          {!sidebarCollapsed && <span>Khách hàng</span>}
        </Link>

        {/* Quản lý đơn hàng */}
        <Link to="/orders" className={linkClass("/orders")}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`h-5 w-5 text-gray-700 ${sidebarCollapsed ? "" : "mr-3"}`}>
            <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 5h13m-9 0a1 1 0 11-2 0 1 1 0 012 0zm8 0a1 1 0 11-2 0 1 1 0 012 0z" />
          </svg>
          {!sidebarCollapsed && <span>Đơn hàng</span>}
        </Link>

        {/* Nhập kho */}
        <Link to="/warehouse" className={linkClass("/warehouse")}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`h-5 w-5 text-gray-700 ${sidebarCollapsed ? "" : "mr-3"}`}>
            <path d="M3 3h18v2H3V3zm2 6h14v10H5V9zm2 2v6h4v-6H7zm6-2l4 4 4-8-8 4z" />
          </svg>
          {!sidebarCollapsed && <span>Nhập kho</span>}
        </Link>

        {/* Thống kê */}
        <Link to="/statistics" className={linkClass("/statistics")}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`h-5 w-5 text-gray-600 ${sidebarCollapsed ? "" : "mr-3"}`}>
            <path d="M3 3h18v2H3V3zm3 6h2v10H6V9zm4 4h2v6h-2v-6zm4-8h2v14h-2V5zm4 8h2v6h-2v-6z" />
          </svg>
          {!sidebarCollapsed && <span>Thống kê</span>}
        </Link>
      </nav>

      {!sidebarCollapsed && (
        <div className="border-t border-gray-200 pt-4 text-sm text-gray-500 text-center">
          <p>Admin Panel v1.0</p>
        </div>
      )}
    </aside>
  );
}
