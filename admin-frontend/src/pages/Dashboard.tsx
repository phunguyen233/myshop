import React from "react";

const Dashboard: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">📊 Bảng điều khiển</h1>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-100 p-4 rounded shadow">
          <h2 className="font-semibold">Sản phẩm</h2>
          <p className="text-2xl font-bold">32</p>
        </div>
        <div className="bg-green-100 p-4 rounded shadow">
          <h2 className="font-semibold">Khách hàng</h2>
          <p className="text-2xl font-bold">12</p>
        </div>
        <div className="bg-yellow-100 p-4 rounded shadow">
          <h2 className="font-semibold">Doanh thu tháng</h2>
          <p className="text-2xl font-bold">25,000,000₫</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
