import React, { useEffect, useState } from "react";
import { ingredientAPI } from "../api/ingredientAPI";
import axiosClient from "../api/axiosClient";
import { unitAPI } from "../api/unitAPI";
import { receiptAPI } from "../api/receiptAPI";

const Ingredients: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [form, setForm] = useState({ ten_nguyen_lieu: "", so_luong_ton: 0, don_vi_id: 0, gia_nhap: 0 });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [receipt, setReceipt] = useState({ ma_nguyen_lieu: 0, so_luong_nhap: 0, don_vi_id: 0, don_gia: 0 });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [receiptError, setReceiptError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

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
    const handler = (e: any) => {
      // when orders deduct ingredients, refresh the list
      fetch();
    };
    window.addEventListener('ingredientsUpdated', handler);
    return () => window.removeEventListener('ingredientsUpdated', handler);
  }, []);

  const handleAdd = async () => {
    setAddError("");
    setSuccessMsg("");

    // Validation
    if (!form.ten_nguyen_lieu.trim()) {
      setAddError("Vui lòng nhập tên nguyên liệu");
      return;
    }
    if (form.don_vi_id <= 0) {
      setAddError("Vui lòng chọn đơn vị");
      return;
    }
    if (form.so_luong_ton < 0) {
      setAddError("Số lượng không được âm");
      return;
    }

    try {
      setAddLoading(true);
      if (editingId) {
        // Try to update via PUT — backend may not support update; show error if it fails
        try {
          await axiosClient.put(`/ingredients/${editingId}`, form);
          setSuccessMsg("Cập nhật nguyên liệu thành công!");
        } catch (e) {
          console.error('Update failed', e);
          alert('Backend chưa hỗ trợ cập nhật nguyên liệu.');
        }
      } else {
        await ingredientAPI.add(form);
        setSuccessMsg("Thêm nguyên liệu thành công!");
      }
      const list = await ingredientAPI.getAll();
      setItems(list);
      setForm({ ten_nguyen_lieu: "", so_luong_ton: 0, don_vi_id: 0, gia_nhap: 0 });
      setEditingId(null);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      console.error(err);
      setAddError(err?.response?.data?.message || "Lỗi khi thêm nguyên liệu");
    } finally {
      setAddLoading(false);
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.ma_nguyen_lieu);
    setForm({ ten_nguyen_lieu: item.ten_nguyen_lieu, so_luong_ton: item.so_luong_ton || 0, don_vi_id: item.don_vi_id || 0, gia_nhap: item.gia_nhap || 0 });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa nguyên liệu này?')) return;
    try {
      // Try delete — backend may not provide delete endpoint
      await axiosClient.delete(`/ingredients/${id}`);
      const list = await ingredientAPI.getAll();
      setItems(list);
      alert('Xóa nguyên liệu thành công');
    } catch (e) {
      console.error('Delete failed', e);
      alert('Backend chưa hỗ trợ xóa nguyên liệu.');
    }
  };

  const handleReceipt = async () => {
    setReceiptError("");
    setSuccessMsg("");

    // Validation
    if (receipt.ma_nguyen_lieu <= 0) {
      setReceiptError("Vui lòng chọn nguyên liệu");
      return;
    }
    if (receipt.so_luong_nhap <= 0) {
      setReceiptError("Số lượng nhập phải lớn hơn 0");
      return;
    }
    if (receipt.don_vi_id <= 0) {
      setReceiptError("Vui lòng chọn đơn vị");
      return;
    }

    try {
      setReceiptLoading(true);
      await receiptAPI.add(receipt.ma_nguyen_lieu, { 
        so_luong_nhap: receipt.so_luong_nhap, 
        don_vi_id: receipt.don_vi_id, 
        don_gia: receipt.don_gia 
      });
      const list = await ingredientAPI.getAll();
      setItems(list);
      setReceipt({ ma_nguyen_lieu: 0, so_luong_nhap: 0, don_vi_id: 0, don_gia: 0 });
      setSuccessMsg("Nhập kho nguyên liệu thành công!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      console.error(err);
      setReceiptError(err?.response?.data?.message || "Lỗi khi nhập kho");
    } finally {
      setReceiptLoading(false);
    }
  };

  // compute converted preview for receipt: show how much will be added in the ingredient's stored unit
  const getReceiptPreview = () => {
    try {
      if (!receipt.ma_nguyen_lieu || !receipt.don_vi_id || !receipt.so_luong_nhap) return null;
      const ingredient = items.find(i => i.ma_nguyen_lieu === receipt.ma_nguyen_lieu);
      if (!ingredient) return null;
      const storedUnitId = ingredient.don_vi_id;
      const storedUnit = units.find(u => u.id === storedUnitId);
      const incomingUnit = units.find(u => u.id === receipt.don_vi_id);
      if (!storedUnit || !incomingUnit) return null;
      const nlHs = Number(storedUnit.he_so_quy_doi) || 1;
      const incomingHs = Number(incomingUnit.he_so_quy_doi) || 1;
      const qty = Number(receipt.so_luong_nhap) || 0;
      const converted = nlHs ? (qty * incomingHs) / nlHs : qty;
      const fmt = (v:number) => {
        if (!isFinite(v)) return '0';
        if (Math.abs(v - Math.round(v)) < 1e-9) return String(Math.round(v));
        return v.toFixed(4).replace(/\.?0+$/,'');
      };
      return `${fmt(converted)} ${storedUnit.ten}`;
    } catch (e) {
      return null;
    }
  };

  const fmtQty = (v: any) => {
    const num = Number(v || 0);
    if (!isFinite(num)) return String(v ?? '0');
    if (Math.abs(num - Math.round(num)) < 1e-9) return String(Math.round(num));
    // show up to 4 decimal places but trim trailing zeros
    return num.toFixed(4).replace(/\.?0+$/, '');
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Nguyên liệu</h1>

      {successMsg && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card p-4 rounded border border-border">
          <h3 className="font-semibold mb-4 text-lg">Thêm nguyên liệu</h3>

          {addError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-3 text-sm">
              {addError}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Tên nguyên liệu</label>
              <input 
                type="text"
                className="w-full border border-input rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                placeholder="Vd: Bột mì, Đường, Sữa..." 
                value={form.ten_nguyen_lieu} 
                onChange={e => setForm({ ...form, ten_nguyen_lieu: e.target.value })} 
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium mb-1">Số lượng ban đầu</label>
                <input 
                  type="number" 
                  className="w-full border border-input rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  min="0"
                  value={form.so_luong_ton} 
                  onChange={e => setForm({ ...form, so_luong_ton: Number(e.target.value) })} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Đơn vị</label>
                <select 
                  className="w-full border border-input rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={form.don_vi_id} 
                  onChange={e => setForm({ ...form, don_vi_id: Number(e.target.value) })}
                >
                  <option value={0}>Chọn đơn vị</option>
                  {units.map(u => <option key={u.id} value={u.id}>{u.ten}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Giá nhập (VNĐ)</label>
              <input 
                type="number" 
                className="w-full border border-input rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                min="0"
                step="0.01"
                placeholder="0" 
                value={form.gia_nhap} 
                onChange={e => setForm({ ...form, gia_nhap: Number(e.target.value) })} 
              />
            </div>

            <button 
              onClick={handleAdd} 
              disabled={addLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded font-medium transition"
            >
              {addLoading ? "Đang lưu..." : "Thêm nguyên liệu"}
            </button>
          </div>
        </div>

        <div className="bg-card p-4 rounded border border-border">
          <h3 className="font-semibold mb-4 text-lg">Nhập kho nguyên liệu</h3>

          {receiptError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-3 text-sm">
              {receiptError}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Chọn nguyên liệu</label>
              <select 
                className="w-full border border-input rounded px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                value={receipt.ma_nguyen_lieu} 
                onChange={e => setReceipt({ ...receipt, ma_nguyen_lieu: Number(e.target.value) })}
              >
                <option value={0}>-- Chọn nguyên liệu --</option>
                {items.map(i => <option key={i.ma_nguyen_lieu} value={i.ma_nguyen_lieu}>{i.ten_nguyen_lieu}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium mb-1">Số lượng nhập</label>
                <input 
                  type="number" 
                  className="w-full border border-input rounded px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                  min="0"
                  step="0.01"
                  value={receipt.so_luong_nhap} 
                  onChange={e => setReceipt({ ...receipt, so_luong_nhap: Number(e.target.value) })} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Đơn vị</label>
                <select 
                  className="w-full border border-input rounded px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                  value={receipt.don_vi_id} 
                  onChange={e => setReceipt({ ...receipt, don_vi_id: Number(e.target.value) })}
                >
                  <option value={0}>Đơn vị</option>
                  {units.map(u => <option key={u.id} value={u.id}>{u.ten}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Đơn giá (VNĐ)</label>
              <input 
                type="number" 
                className="w-full border border-input rounded px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                min="0"
                step="0.01"
                placeholder="0" 
                value={receipt.don_gia} 
                onChange={e => setReceipt({ ...receipt, don_gia: Number(e.target.value) })} 
              />
            </div>

            <button 
              onClick={handleReceipt} 
              disabled={receiptLoading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded font-medium transition"
            >
              {receiptLoading ? "Đang nhập..." : "Nhập kho"}
            </button>
            {/* Preview of converted quantity (before submit) */}
            {getReceiptPreview() && (
              <div className="mt-2 text-sm text-muted-foreground">Sẽ cộng: {getReceiptPreview()}</div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-card p-6 rounded border border-border">
        <h2 className="text-xl font-semibold mb-4">Danh sách nguyên liệu</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="p-3 font-medium">Mã</th>
                <th className="p-3 font-medium">Tên nguyên liệu</th>
                <th className="p-3 font-medium text-right">Số lượng</th>
                <th className="p-3 font-medium">Đơn vị</th>
                <th className="p-3 font-medium text-right">Giá nhập</th>
                <th className="p-3 font-medium text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-muted-foreground">
                    Chưa có nguyên liệu nào
                  </td>
                </tr>
                ) : (
                items.map(i => (
                  <tr key={i.ma_nguyen_lieu} className="hover:bg-muted/50 transition-colors">
                    <td className="p-3 text-foreground">{i.ma_nguyen_lieu}</td>
                    <td className="p-3 text-foreground font-medium">{i.ten_nguyen_lieu}</td>
                    <td className="p-3 text-right text-foreground">{fmtQty(i.so_luong_ton)}</td>
                    <td className="p-3 text-foreground">{i.don_vi}</td>
                    <td className="p-3 text-right text-foreground">{(i.gia_nhap || 0).toLocaleString('vi-VN')}₫</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleEdit(i)} className="px-3 py-1 rounded bg-white border border-border hover:bg-green-600 hover:text-white text-foreground text-xs">Sửa</button>
                        <button onClick={() => handleDelete(i.ma_nguyen_lieu)} className="px-3 py-1 rounded bg-white border border-border hover:bg-red-600 hover:text-white text-foreground text-xs">Xóa</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Ingredients;
