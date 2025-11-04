import React, { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";

interface Customer {
  id: number;
  ten_khach_hang: string;
  so_dien_thoai: string;
  email: string;
}

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);

  const fetchCustomers = async () => {
    const res = await axiosClient.get("/customers");
    setCustomers(res.data);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">👥 Danh sách khách hàng</h1>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">ID</th>
            <th className="border p-2">Tên khách hàng</th>
            <th className="border p-2">Số điện thoại</th>
            <th className="border p-2">Email</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr key={c.id}>
              <td className="border p-2 text-center">{c.id}</td>
              <td className="border p-2">{c.ten_khach_hang}</td>
              <td className="border p-2">{c.so_dien_thoai}</td>
              <td className="border p-2">{c.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Customers;
