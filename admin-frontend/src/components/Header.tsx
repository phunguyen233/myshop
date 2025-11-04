export default function Header() {
  return (
    <header className="bg-white shadow p-4 flex justify-between items-center">
      <h1 className="text-2xl font-semibold">Hệ thống quản lý cửa hàng</h1>
      <div className="flex items-center space-x-4">
        <span>👤 Admin</span>
        <button className="bg-red-500 text-white px-3 py-1 rounded">Đăng xuất</button>
      </div>
    </header>
  );
}
