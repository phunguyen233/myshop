import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import authAPI from "../api/authAPI";
import { useAuth } from "../contexts/AuthContext";

const Auth: React.FC = () => {
  const [tab, setTab] = useState<"login" | "register">("login");

  // Login fields
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Register fields
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [hoTen, setHoTen] = useState("");
  const [email, setEmail] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [registerError, setRegisterError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const { setToken } = useAuth();

  const from = (location.state as any)?.from?.pathname || "/dashboard";

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError("");
    try {
      const res = await authAPI.login({ ten_dang_nhap: username, mat_khau: password });
      if (res.token) {
        setToken(res.token);
        if (res.user) localStorage.setItem("user", JSON.stringify(res.user));
      }
      navigate(from, { replace: true });
    } catch (err: any) {
      setLoginError(err?.response?.data?.message || "Tài khoản hoặc mật khẩu bị sai");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError("");
    try {
      const res = await authAPI.register({ ten_dang_nhap: regUsername, mat_khau: regPassword, ho_ten: hoTen, email });
      // Show only success message; do NOT auto-login. User must login to access admin.
      setSuccessMessage("Đăng ký thành công. Vui lòng đăng nhập để tiếp tục.");
      // Clear any previous errors
      setRegisterError("");
      setLoginError("");
      // Reset register fields (optional)
      setRegPassword("");
      // After a short delay, switch to login tab so user can sign in
      setTimeout(() => {
        setTab("login");
      }, 900);
    } catch (err: any) {
      setSuccessMessage("");
      setRegisterError(err?.response?.data?.message || "Lỗi đăng ký");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white shadow-md rounded px-6 py-6 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center">Hệ Thống Quản Lý Cửa Hàng</h1>
        <p className="text-sm text-gray-500 text-center mt-1">đăng nhập hoặc đăng ký để tiếp tục</p>

        <div className="mt-4 bg-gray-100 rounded-lg p-1 flex gap-1 h-10">
          <button
            onClick={() => setTab("login")}
            className={`flex-1 rounded-md text-center transition-all duration-150 focus:outline-none ${
              tab === "login" ? "bg-white shadow-sm font-semibold" : "bg-transparent text-gray-600"
            }`}
          >
            Đăng nhập
          </button>
          <button
            onClick={() => setTab("register")}
            className={`flex-1 rounded-md text-center transition-all duration-150 focus:outline-none ${
              tab === "register" ? "bg-white shadow-sm font-semibold" : "bg-transparent text-gray-600"
            }`}
          >
            Đăng ký
          </button>
        </div>

        <div className="mt-4">
          {tab === "login" ? (
            <>
              <form onSubmit={handleLogin} className="space-y-3">
                <input className="border p-2 w-full rounded-md bg-transparent" placeholder="Tên đăng nhập" value={username} onChange={(e) => setUsername(e.target.value)} />
                <input className="border p-2 w-full rounded-md bg-transparent" type="password" placeholder="Mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} />
                <div>
                  {loginError && <p className="text-red-600 text-sm mb-2 text-center">{loginError}</p>}
                  <button type="submit" className="bg-blue-600 text-white w-full py-2 rounded-md hover:bg-blue-700 border border-transparent">Đăng nhập</button>
                </div>
              </form>
            </>
          ) : (
            <>
              <form onSubmit={handleRegister} className="space-y-3">
                <input className="border p-2 w-full rounded-md bg-transparent" placeholder="Tên đăng nhập" value={regUsername} onChange={(e) => setRegUsername(e.target.value)} />
                <input className="border p-2 w-full rounded-md bg-transparent" placeholder="Họ tên" value={hoTen} onChange={(e) => setHoTen(e.target.value)} />
                <input className="border p-2 w-full rounded-md bg-transparent" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <input className="border p-2 w-full rounded-md bg-transparent" type="password" placeholder="Mật khẩu" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} />
                <div>
                  {successMessage && <p className="text-green-600 text-sm mb-2 text-center">{successMessage}</p>}
                  {registerError && <p className="text-red-600 text-sm mb-2 text-center">{registerError}</p>}
                  <button type="submit" className="bg-green-600 text-white w-full py-2 rounded-md hover:bg-green-700 border border-transparent">Đăng ký</button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
