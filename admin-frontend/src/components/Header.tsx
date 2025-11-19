import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Header() {
  const navigate = useNavigate();
  const { setToken } = useAuth();
  const userRaw = localStorage.getItem("user");
  const user = userRaw ? JSON.parse(userRaw) : null;

  const handleLogout = () => {
    setToken(null);
    navigate("/login");
  };

  return (
    <header className="bg-gradient-to-r from-green-700 to-green-600 text-white shadow-lg p-6 flex justify-between items-center w-full">
      <div className="flex items-center space-x-3">
        <h1 className="text-3xl font-bold">Hệ thống quản lý của hàng</h1>
      </div>
      <div className="flex items-center space-x-6">
        {user ? (
          <>
            <span className="text-lg font-semibold">👤 {user.ho_ten || user.ten_dang_nhap}</span>
            <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition">
              Đăng xuất
            </button>
          </>
        ) : (
          <button onClick={() => navigate('/login')} className="bg-white text-green-700 px-4 py-2 rounded-lg font-semibold">
            Đăng nhập
          </button>
        )}
      </div>
    </header>
  );
}
