import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import authAPI from "../api/authAPI";
import { useAuth } from "../contexts/AuthContext";

const Auth: React.FC = () => {
  // Login fields
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const { setToken } = useAuth();

  const from = (location.state as any)?.from?.pathname || "/dashboard";

  const normalize = (s?: string) =>
    (s || "")
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .trim();

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError("");
    try {
      const res = await authAPI.login({ ten_dang_nhap: username, mat_khau: password });

      const user = res.user || null;
      const rawRole = (user?.role || user?.vai_tro || "") as string;
      const roleNorm = normalize(rawRole);

      // Block non-admin roles (e.g., 'khach', 'guest') and accept admin roles
      const isAdmin = roleNorm.includes("admin") || roleNorm.includes("quan") || user?.ten_dang_nhap === "admin";

      if (!isAdmin) {
        setLoginError("Tài khoản này không đăng nhập được");
        return;
      }

      if (res.token) {
        setToken(res.token);
        if (res.user) localStorage.setItem("user", JSON.stringify(res.user));
      }
      navigate(from, { replace: true });
    } catch (err: any) {
      setLoginError(err?.response?.data?.message || "Tài khoản hoặc mật khẩu bị sai");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="bg-card text-card-foreground shadow-md rounded-xl px-6 py-6 w-full max-w-md border border-border">
        <h1 className="text-2xl font-bold text-center text-foreground">Hệ Thống Quản Lý Cửa Hàng</h1>
        <p className="text-sm text-muted-foreground text-center mt-1">Chỉ admin được phép đăng nhập tại đây.</p>

        <div className="mt-4">
          <form onSubmit={handleLogin} className="space-y-3">
            <input className="border border-input bg-background text-foreground p-2 w-full rounded-md focus:ring-2 focus:ring-black focus:outline-none" placeholder="Tên đăng nhập" value={username} onChange={(e) => setUsername(e.target.value)} />
            <input className="border border-input bg-background text-foreground p-2 w-full rounded-md focus:ring-2 focus:ring-black focus:outline-none" type="password" placeholder="Mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} />
            <div>
              {loginError && <p className="text-destructive text-sm mb-2 text-center">{loginError}</p>}
              <button type="submit" className="w-full py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white border border-transparent transition shadow-sm">Đăng nhập</button>
            </div>
          </form>
          <p className="text-xs text-muted-foreground mt-3 text-center">Muốn có tài khoản admin? Thêm trực tiếp dữ liệu tài khoản vào cơ sở dữ liệu.</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
