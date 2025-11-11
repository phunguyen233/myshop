import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Customers from "./pages/Customers";

function App() {
  return (
    <Router>
      <div className="flex">
        <Sidebar />
        <div className="flex-1">
          <Header />
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/customers" element={<Customers />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
