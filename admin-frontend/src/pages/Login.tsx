import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import authAPI from "../api/authAPI";
import { useAuth } from "../contexts/AuthContext";

const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { setToken } = useAuth();

  const from = (location.state as any)?.from?.pathname || "/dashboard";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await authAPI.login({ ten_dang_nhap: username, mat_khau: password });
      if (res.token) {
        setToken(res.token);
        if (res.user) localStorage.setItem("user", JSON.stringify(res.user));
      }
      navigate(from, { replace: true });
    } catch (err: any) {
      alert(err?.response?.data?.message || "Sai tài khoản hoặc mật khẩu");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <form onSubmit={handleLogin} className="bg-white shadow-md rounded px-8 pt-6 pb-8 w-80">
        <h2 className="text-2xl font-bold mb-4 text-center">Đăng nhập Admin</h2>
        <input
          className="border p-2 w-full mb-3 rounded"
          placeholder="Tên đăng nhập"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          className="border p-2 w-full mb-3 rounded"
          type="password"
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="flex items-center justify-between">
          <button type="submit" className="bg-blue-600 text-white w-full py-2 rounded hover:bg-blue-700">Đăng nhập</button>
        </div>
        <div className="mt-3 text-center">
          <Link to="/register" className="text-sm text-blue-600">Chưa có tài khoản? Đăng ký</Link>
        </div>
      </form>
    </div>
  );
};

export default Login;
