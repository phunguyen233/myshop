import { Link, useLocation } from "react-router-dom";

export default function Sidebar() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const linkClass = (path: string) =>
    `flex items-center px-4 py-3 rounded transition ${
      isActive(path)
        ? "bg-green-700 font-semibold"
        : "hover:bg-green-700"
    }`;

  return (
    <aside className="w-64 bg-green-800 text-white min-h-screen p-4 flex flex-col">
      <h2 className="text-2xl font-bold mb-8 text-center"> Admin</h2>
      
      <nav className="flex flex-col space-y-2 flex-1">
        {/* Trang chủ */}
        <Link to="/dashboard" className={linkClass("/dashboard")}>
          
          Trang chủ
        </Link>

        {/* Quản lý sản phẩm */}
        <div className="pt-4">
          <p className="text-xs font-bold text-green-300 uppercase px-4 mb-2">Sản phẩm</p>
          <Link to="/products" className={linkClass("/products")}>
            
            Quản lý sản phẩm
          </Link>
        </div>

        {/* Quản lý khách hàng */}
        <div className="pt-4">
          <p className="text-xs font-bold text-green-300 uppercase px-4 mb-2">Khách hàng</p>
          <Link to="/customers" className={linkClass("/customers")}>
            
            Danh sách khách hàng
          </Link>
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-green-700 pt-4 text-sm text-green-200">
        <p className="text-center">Admin Panel v1.0</p>
      </div>
    </aside>
  );
}
