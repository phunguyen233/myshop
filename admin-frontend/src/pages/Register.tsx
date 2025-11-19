import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import authAPI from "../api/authAPI";
import { useAuth } from "../contexts/AuthContext";

const Register: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [hoTen, setHoTen] = useState("");
  const [email, setEmail] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();
  const { setToken } = useAuth();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await authAPI.register({ ten_dang_nhap: username, mat_khau: password, ho_ten: hoTen, email });
      // Show green success message
      setSuccessMessage("Đã đăng ký thành công");

      // If backend returns token, auto-login after a short delay so user sees the success message
      if (res?.token) {
        setToken(res.token);
        if (res.user) localStorage.setItem("user", JSON.stringify(res.user));
        setTimeout(() => navigate("/dashboard", { replace: true }), 700);
        return;
      }

      // Otherwise show message and then navigate to login
      setTimeout(() => navigate("/login", { replace: true }), 1200);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Lỗi đăng ký");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <form onSubmit={handleRegister} className="bg-white shadow-md rounded px-8 pt-6 pb-8 w-96">
        <h2 className="text-2xl font-bold mb-4 text-center">Đăng ký</h2>
        {successMessage && <p className="text-green-600 text-center mb-2">{successMessage}</p>}
        <input className="border p-2 w-full mb-3 rounded" placeholder="Tên đăng nhập" value={username} onChange={(e) => setUsername(e.target.value)} />
        <input className="border p-2 w-full mb-3 rounded" placeholder="Họ tên" value={hoTen} onChange={(e) => setHoTen(e.target.value)} />
        <input className="border p-2 w-full mb-3 rounded" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="border p-2 w-full mb-3 rounded" type="password" placeholder="Mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} />
        <div className="flex items-center justify-between">
          <button type="submit" className="bg-green-600 text-white w-full py-2 rounded hover:bg-green-700">Đăng ký</button>
        </div>
      </form>
    </div>
  );
};

export default Register;
