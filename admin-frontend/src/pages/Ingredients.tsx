import React, { useEffect, useState } from "react";
import { ingredientAPI } from "../api/ingredientAPI";
import { unitAPI } from "../api/unitAPI";
import { receiptAPI } from "../api/receiptAPI";

const Ingredients: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [form, setForm] = useState({ ten_nguyen_lieu: "", so_luong_ton: 0, don_vi_id: 0, gia_nhap: 0 });
  const [receipt, setReceipt] = useState({ ma_nguyen_lieu: 0, so_luong_nhap: 0, don_vi_id: 0, don_gia: 0 });

  useEffect(() => {
    const fetch = async () => {
      try {
        const [u, ingr] = await Promise.all([unitAPI.getAll(), ingredientAPI.getAll()]);
        setUnits(u || []);
        setItems(ingr || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetch();
  }, []);

  const handleAdd = async () => {
    try {
      await ingredientAPI.add(form);
      const list = await ingredientAPI.getAll();
      setItems(list);
      setForm({ ten_nguyen_lieu: "", so_luong_ton: 0, don_vi_id: 0, gia_nhap: 0 });
    } catch (err) { console.error(err); }
  };

  const handleReceipt = async () => {
    try {
      await receiptAPI.add(receipt.ma_nguyen_lieu, { so_luong_nhap: receipt.so_luong_nhap, don_vi_id: receipt.don_vi_id, don_gia: receipt.don_gia });
      const list = await ingredientAPI.getAll();
      setItems(list);
      setReceipt({ ma_nguyen_lieu: 0, so_luong_nhap: 0, don_vi_id: 0, don_gia: 0 });
    } catch (err) { console.error(err); }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Nguyên liệu</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card p-4 rounded">
          <h3 className="font-semibold mb-2">Thêm nguyên liệu</h3>
          <input className="w-full mb-2" placeholder="Tên nguyên liệu" value={form.ten_nguyen_lieu} onChange={e => setForm({ ...form, ten_nguyen_lieu: e.target.value })} />
          <div className="flex gap-2 mb-2">
            <input type="number" className="flex-1" value={form.so_luong_ton} onChange={e => setForm({ ...form, so_luong_ton: Number(e.target.value) })} />
            <select className="w-40" value={form.don_vi_id} onChange={e => setForm({ ...form, don_vi_id: Number(e.target.value) })}>
              <option value={0}>Chọn đơn vị</option>
              {units.map(u => <option key={u.id} value={u.id}>{u.ten}</option>)}
            </select>
          </div>
          <input type="number" className="w-full mb-2" placeholder="Giá nhập (VNĐ)" value={form.gia_nhap} onChange={e => setForm({ ...form, gia_nhap: Number(e.target.value) })} />
          <button onClick={handleAdd} className="bg-blue-600 text-white px-4 py-2 rounded">Thêm</button>
        </div>

        <div className="bg-card p-4 rounded">
          <h3 className="font-semibold mb-2">Nhập kho nguyên liệu</h3>
          <select className="w-full mb-2" value={receipt.ma_nguyen_lieu} onChange={e => setReceipt({ ...receipt, ma_nguyen_lieu: Number(e.target.value) })}>
            <option value={0}>Chọn nguyên liệu</option>
            {items.map(i => <option key={i.ma_nguyen_lieu} value={i.ma_nguyen_lieu}>{i.ten_nguyen_lieu}</option>)}
          </select>
          <div className="flex gap-2 mb-2">
            <input type="number" className="flex-1" value={receipt.so_luong_nhap} onChange={e => setReceipt({ ...receipt, so_luong_nhap: Number(e.target.value) })} />
            <select className="w-40" value={receipt.don_vi_id} onChange={e => setReceipt({ ...receipt, don_vi_id: Number(e.target.value) })}>
              <option value={0}>Đơn vị</option>
              {units.map(u => <option key={u.id} value={u.id}>{u.ten}</option>)}
            </select>
          </div>
          <input type="number" className="w-full mb-2" placeholder="Đơn giá (VNĐ)" value={receipt.don_gia} onChange={e => setReceipt({ ...receipt, don_gia: Number(e.target.value) })} />
          <button onClick={handleReceipt} className="bg-green-600 text-white px-4 py-2 rounded">Nhập kho</button>
        </div>
      </div>

      <div className="bg-card p-4 rounded">
        <h2 className="font-semibold mb-3">Danh sách nguyên liệu</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="p-3">Mã</th>
                <th className="p-3">Tên</th>
                <th className="p-3">Số lượng</th>
                <th className="p-3">Đơn vị</th>
                <th className="p-3">Giá nhập</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map(i => (
                <tr key={i.ma_nguyen_lieu}>
                  <td className="p-3">{i.ma_nguyen_lieu}</td>
                  <td className="p-3">{i.ten_nguyen_lieu}</td>
                  <td className="p-3">{i.so_luong_ton}</td>
                  <td className="p-3">{i.don_vi}</td>
                  <td className="p-3">{(i.gia_nhap || 0).toLocaleString('vi-VN')}₫</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Ingredients;
