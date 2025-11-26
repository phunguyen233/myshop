import React, { useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

const API = "http://localhost:5000/api";

export default function Auth() {
  const [tab, setTab] = useState<"login" | "register">("login");

  // login
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginSuccess, setLoginSuccess] = useState("");

  // register
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [hoTen, setHoTen] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const stateFrom = (location.state as any) || {};
  const from = stateFrom.from || "/";

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError("");
    setLoginSuccess("");
    try {
      const res = await axios.post(`${API}/auth/login`, { ten_dang_nhap: username, mat_khau: password });
      if (res.data?.token) {
        localStorage.setItem("token", res.data.token);
        if (res.data.user) localStorage.setItem("user", JSON.stringify(res.data.user));
        // Notify same-tab listeners that auth state changed
        window.dispatchEvent(new Event('authChange'));
        // show success message then navigate
        setLoginSuccess("Đăng nhập thành công");
        // Preserve autoCheckout flag so cart can resume checkout automatically
        setTimeout(() => navigate(from, { replace: true, state: { autoCheckout: stateFrom.autoCheckout } }), 700);
      }
    } catch (err: any) {
      setLoginError(err?.response?.data?.message || "Lỗi đăng nhập");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError("");
    setRegisterSuccess("");
    try {
      const res = await axios.post(`${API}/auth/register`, { ten_dang_nhap: regUsername, mat_khau: regPassword, ho_ten: hoTen, email, so_dien_thoai: phone });
      // Show success message and then switch to login tab. Do NOT auto-login.
      setRegisterSuccess("Đăng ký thành công");
      setTimeout(() => {
        setTab("login");
        setRegisterSuccess("");
      }, 900);
    } catch (err: any) {
      setRegisterError(err?.response?.data?.message || "Lỗi đăng ký");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white shadow-md rounded-lg w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-center mb-2">Đăng nhập hoặc đăng ký để tiếp tục</h2>
        <div className="flex gap-2 mb-4">
          <button onClick={() => setTab("login")} className={`flex-1 py-2 rounded ${tab === "login" ? "bg-gray-100 font-semibold" : "bg-transparent"}`}>Đăng nhập</button>
          <button onClick={() => setTab("register")} className={`flex-1 py-2 rounded ${tab === "register" ? "bg-gray-100 font-semibold" : "bg-transparent"}`}>Đăng ký</button>
        </div>

        {tab === "login" ? (
          <form onSubmit={handleLogin} className="space-y-3">
            {loginError && <p className="text-red-600 text-sm">{loginError}</p>}
            {loginSuccess && <p className="text-green-600 text-sm">{loginSuccess}</p>}
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Tên đăng nhập" className="w-full p-2 border rounded" />
            <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mật khẩu" type="password" className="w-full p-2 border rounded" />
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">{loginSuccess ? "Đăng nhập thành công" : "Đăng nhập"}</button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3">
            {registerError && <p className="text-red-600 text-sm">{registerError}</p>}
            {registerSuccess && <p className="text-green-600 text-sm">{registerSuccess}</p>}
            <input value={regUsername} onChange={(e) => setRegUsername(e.target.value)} placeholder="Tên đăng nhập" className="w-full p-2 border rounded" />
            <input value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder="Mật khẩu" type="password" className="w-full p-2 border rounded" />
            <input value={hoTen} onChange={(e) => setHoTen(e.target.value)} placeholder="Họ tên" className="w-full p-2 border rounded" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full p-2 border rounded" />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Số điện thoại" className="w-full p-2 border rounded" />
            <button type="submit" className="w-full bg-green-600 text-white py-2 rounded">{registerSuccess ? "Đăng ký thành công" : "Đăng ký"}</button>
          </form>
        )}
      </div>
    </div>
  );
}
