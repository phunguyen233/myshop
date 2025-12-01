import React, { useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";

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

  // Google Identity Services: render button and handle credential
  useEffect(() => {
    const scriptId = 'gsi-client-script';
    if ((window as any).google || document.getElementById(scriptId)) {
      initGSI();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.id = scriptId;
    script.async = true;
    script.defer = true;
    script.onload = initGSI;
    document.head.appendChild(script);

    function initGSI() {
      try {
        const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
        if (!(window as any).google || !clientId) return;
        // Initialize ID token client (one-tap / credential responses)
        (window as any).google.accounts.id.initialize({
          client_id: clientId,
          callback: async (resp: any) => {
            try {
              const idToken = resp?.credential;
              if (!idToken) return;
              const res = await axios.post(`${API}/auth/google`, { idToken });
              if (res.data?.token) {
                localStorage.setItem('token', res.data.token);
                if (res.data.user) localStorage.setItem('user', JSON.stringify(res.data.user));
                window.dispatchEvent(new Event('authChange'));
                setLoginSuccess('Đăng nhập thành công');
                setTimeout(() => navigate(from, { replace: true, state: { autoCheckout: stateFrom.autoCheckout } }), 700);
              }
            } catch (e: any) {
              setLoginError(e?.response?.data?.message || 'Lỗi đăng nhập Google');
            }
          }
        });

        // Initialize Authorization Code client for server-side exchange
        try {
          const codeClient = (window as any).google.accounts.oauth2.initCodeClient({
            client_id: clientId,
            scope: 'openid profile email',
            ux_mode: 'popup',
            callback: async (resp: any) => {
              try {
                const code = resp?.code;
                if (!code) return;
                const res = await axios.post(`${API}/auth/google/code`, { code });
                if (res.data?.token) {
                  localStorage.setItem('token', res.data.token);
                  if (res.data.user) localStorage.setItem('user', JSON.stringify(res.data.user));
                  window.dispatchEvent(new Event('authChange'));
                  setLoginSuccess('Đăng nhập thành công');
                  setTimeout(() => navigate(from, { replace: true, state: { autoCheckout: stateFrom.autoCheckout } }), 700);
                }
              } catch (e: any) {
                setLoginError(e?.response?.data?.message || 'Lỗi đăng nhập Google (code)');
              }
            }
          });
          // expose to window so our custom button can use it
          (window as any).__googleCodeClient = codeClient;
        } catch (err) {
          console.debug('Could not init code client', err);
        }
        // render button into container
        const container = document.getElementById('g_id_signin');
        if (container) {
          (window as any).google.accounts.id.renderButton(container, { theme: 'outline', size: 'large', text: 'signin_with' });
        }
      } catch (err) {
        console.error('GSI init error', err);
      }
    }
  }, []);

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
            <div className="text-center text-sm text-gray-500 mt-2">Hoặc đăng nhập bằng</div>
            <div className="flex justify-center mt-2">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    // trigger Google Identity prompt (custom button)
                    if (!(window as any).google) {
                      setLoginError('Google Sign-in chưa được nạp hoặc chưa cấu hình');
                      return;
                    }
                    try {
                      const codeClient = (window as any).__googleCodeClient;
                      if (codeClient && typeof codeClient.requestCode === 'function') {
                        codeClient.requestCode();
                      } else if ((window as any).google && (window as any).google.accounts && (window as any).google.accounts.id) {
                        (window as any).google.accounts.id.prompt();
                      } else {
                        setLoginError('Google Sign-in chưa sẵn sàng');
                      }
                    } catch (err) {
                      console.error('GSI prompt/code request error', err);
                      setLoginError('Không thể mở Google Sign-in');
                    }
                  }}
                  className="flex items-center gap-3 bg-white border rounded px-3 py-2 hover:shadow-sm"
                >
                  {/* Google logo */}
                  <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.27 1.53 8.14 2.79l6.03-6.03C34.56 3.2 29.65 1.5 24 1.5 14.81 1.5 6.99 6.86 3.3 14.34l7.42 5.78C12.95 15.01 18.97 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.5 24c0-1.6-.15-3.14-.42-4.62H24v8.76h12.88c-.55 2.96-2.21 5.46-4.72 7.15l7.42 5.77C43.99 36.77 46.5 30.8 46.5 24z"/>
                    <path fill="#FBBC05" d="M10.72 29.12A14.94 14.94 0 0 1 9.5 24c0-1.92.34-3.76.95-5.44L3.03 12.8A23.99 23.99 0 0 0 1.5 24c0 3.42.82 6.65 2.27 9.5l7-4.38z"/>
                    <path fill="#34A853" d="M24 46.5c6.45 0 11.87-2.14 15.83-5.82l-7.42-5.77C30.35 36.64 27.3 37.9 24 37.9c-5.03 0-11.05-5.51-13.28-10.62l-7.42 5.78C6.99 41.64 14.81 46.5 24 46.5z"/>
                  </svg>
                  <span className="text-sm font-medium">Google</span>
                </button>
                <div id="g_id_signin" style={{ display: 'none' }}></div>
              </div>
            </div>
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
