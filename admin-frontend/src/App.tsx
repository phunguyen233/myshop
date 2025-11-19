import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import RequireAuth from "./components/RequireAuth";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Customers from "./pages/Customers";
import Orders from "./pages/Orders";
import Warehouse from "./pages/Warehouse";
import Inventory from "./pages/Inventory";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

function InnerApp() {
  const { token } = useAuth();

  return (
    <Router>
      {token ? (
        <div className="flex">
          <Sidebar />
          <div className="flex-1">
            <Header />
            <Routes>
              <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
              <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
              <Route path="/products" element={<RequireAuth><Products /></RequireAuth>} />
              <Route path="/customers" element={<RequireAuth><Customers /></RequireAuth>} />
              <Route path="/orders" element={<RequireAuth><Orders /></RequireAuth>} />
              <Route path="/warehouse" element={<RequireAuth><Warehouse /></RequireAuth>} />
              <Route path="/statistics" element={<RequireAuth><Inventory /></RequireAuth>} />
              <Route path="*" element={<RequireAuth><Dashboard /></RequireAuth>} />
            </Routes>
          </div>
        </div>
      ) : (
        <div>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            {/* If not authenticated, redirect everything else to login */}
            <Route path="*" element={<Login />} />
          </Routes>
        </div>
      )}
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <InnerApp />
    </AuthProvider>
  );
}

export default App;
