import React, { useState } from "react";
import authAPI from "../api/authAPI";


const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await authAPI.login({ email, password });
      localStorage.setItem("token", res.token);
      setMessage("✅ Đăng nhập thành công!");
    } catch {
      setMessage("❌ Sai tài khoản hoặc mật khẩu");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <form
        onSubmit={handleLogin}
        className="bg-white shadow-md rounded px-8 pt-6 pb-8 w-80"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">Đăng nhập Admin</h2>
        <input
          className="border p-2 w-full mb-3 rounded"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="border p-2 w-full mb-3 rounded"
          type="password"
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white w-full py-2 rounded hover:bg-blue-700"
        >
          Đăng nhập
        </button>
        {message && <p className="mt-3 text-center">{message}</p>}
      </form>
    </div>
  );
};

export default Login;
