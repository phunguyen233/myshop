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
import Statistics from "./pages/Statistics";
import Ingredients from "./pages/Ingredients";
import Recipes from "./pages/Recipes";
import Auth from "./pages/Auth";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";

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
              <Route path="/ingredients" element={<RequireAuth><Ingredients /></RequireAuth>} />
              <Route path="/recipes" element={<RequireAuth><Recipes /></RequireAuth>} />
              <Route path="/orders" element={<RequireAuth><Orders /></RequireAuth>} />
              <Route path="/warehouse" element={<RequireAuth><Warehouse /></RequireAuth>} />
              <Route path="/inventory" element={<RequireAuth><Inventory /></RequireAuth>} />
              <Route path="/statistics" element={<RequireAuth><Statistics /></RequireAuth>} />
              <Route path="*" element={<RequireAuth><Dashboard /></RequireAuth>} />
            </Routes>
          </div>
        </div>
      ) : (
        <div>
          <Routes>
            <Route path="/login" element={<Auth />} />
            <Route path="/register" element={<Auth />} />
            {/* If not authenticated, redirect everything else to login */}
            <Route path="*" element={<Auth />} />
          </Routes>
        </div>
      )}
    </Router>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <InnerApp />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
