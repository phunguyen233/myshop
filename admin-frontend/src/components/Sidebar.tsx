import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-green-800 text-white min-h-screen p-4">
      <h2 className="text-xl font-bold mb-6">🌿 Admin Dashboard</h2>
      <nav className="flex flex-col space-y-3">
        <Link to="/" className="hover:bg-green-700 p-2 rounded">Trang chủ</Link>
        <Link to="/products" className="hover:bg-green-700 p-2 rounded">Sản phẩm</Link>
        <Link to="/add-product" className="hover:bg-green-700 p-2 rounded">Thêm sản phẩm</Link>
        <Link to="/customers" className="hover:bg-green-700 p-2 rounded">Khách hàng</Link>
      </nav>
    </aside>
  );
}
