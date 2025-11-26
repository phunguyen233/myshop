import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Header() {
  const navigate = useNavigate();
  const { setToken, sidebarCollapsed, setSidebarCollapsed } = useAuth();
  const userRaw = localStorage.getItem("user");
  const user = userRaw ? JSON.parse(userRaw) : null;

  const handleLogout = () => {
    setToken(null);
    navigate("/login");
  };

  return (
    <header className="bg-white text-gray-800 shadow-sm border-b border-gray-200 p-4 flex justify-between items-center w-full">
      <div className="flex items-center space-x-3">
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-2 rounded-md hover:bg-gray-100 transition mr-2 text-gray-700"
          aria-label="Toggle sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Hệ thống quản lý cửa hàng</h1>
      </div>
      <div className="flex items-center space-x-6">
        {user ? (
          <span className="text-lg font-semibold">👤 {user.ho_ten || user.ten_dang_nhap}</span>
        ) : (
          <button onClick={() => navigate('/login')} className="bg-white text-gray-800 px-4 py-2 rounded-lg font-semibold border border-gray-200">
            Đăng nhập
          </button>
        )}
      </div>
    </header>
  );
}
