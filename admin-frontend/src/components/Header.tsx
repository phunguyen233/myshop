export default function Header() {
  return (
    <header className="bg-gradient-to-r from-green-700 to-green-600 text-white shadow-lg p-6 flex justify-between items-center w-full">
      <div className="flex items-center space-x-3">
        
        <h1 className="text-3xl font-bold">Hệ thống quản lý của hàng</h1>
      </div>
      <div className="flex items-center space-x-6">
        <span className="text-lg font-semibold">👤 Admin</span>
        <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition">
          Đăng xuất
        </button>
      </div>
    </header>
  );
}
