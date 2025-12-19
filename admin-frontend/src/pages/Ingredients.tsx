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
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFromWarehouse, setEditFromWarehouse] = useState(false);
  const [warehouseEditQty, setWarehouseEditQty] = useState<number>(0);
  const [warehouseEditUnitId, setWarehouseEditUnitId] = useState<number>(0);
  const [currentWarehouseItem, setCurrentWarehouseItem] = useState<any | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showReceiptsListModal, setShowReceiptsListModal] = useState(false);
  const [receiptsList, setReceiptsList] = useState<any[]>([]);
  const [selectedReceiptIngredientName, setSelectedReceiptIngredientName] = useState<string>("");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<'ingredients' | 'warehouse'>('ingredients');
  const refreshMergedData = async () => {
    try {
      const [u, ingr, wh] = await Promise.all([unitAPI.getAll(), ingredientAPI.getAll(), ingredientAPI.getWarehouse()]);
      setUnits(u || []);
      // merge warehouse info into ingredient items for easy rendering
      const whMap: Record<string, any> = {};
      (wh || []).forEach((w: any) => { whMap[w.ma_nguyen_lieu] = w; });
      const merged = (ingr || []).map((it: any) => ({ ...it, __warehouse: whMap[it.ma_nguyen_lieu] || { warehouse_qty: 0, warehouse_value: 0 } }));
      setItems(merged);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    refreshMergedData();
    const handler = (e: any) => {
      // when orders deduct ingredients or receipts change, refresh the list
      refreshMergedData();
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
        try {
          await ingredientAPI.update(editingId, form);
          setSuccessMsg("Cập nhật nguyên liệu thành công!");
        } catch (e: any) {
          console.error('Update failed', e);
          setAddError(e?.response?.data?.message || 'Lỗi khi cập nhật nguyên liệu');
        }
      } else {
        await ingredientAPI.add(form);
        setSuccessMsg("Thêm nguyên liệu thành công!");
      }
      // refresh merged data
      const wh = await ingredientAPI.getWarehouse();
      const list = await ingredientAPI.getAll();
      const whMap: Record<string, any> = {};
      (wh || []).forEach((w: any) => { whMap[w.ma_nguyen_lieu] = w; });
      const merged = (list || []).map((it: any) => ({ ...it, __warehouse: whMap[it.ma_nguyen_lieu] || { warehouse_qty: 0, warehouse_value: 0 } }));
      setItems(merged);
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

  const handleEdit = (item: any, fromWarehouse: boolean = false) => {
    setEditingId(item.ma_nguyen_lieu);
    setEditFromWarehouse(!!fromWarehouse);
    setForm({ ten_nguyen_lieu: item.ten_nguyen_lieu, so_luong_ton: item.so_luong_ton || 0, don_vi_id: item.don_vi_id || 0, gia_nhap: item.gia_nhap || 0 });
    if (fromWarehouse) {
      const whQty = (item.__warehouse && Number(item.__warehouse.warehouse_qty)) || 0;
      setWarehouseEditQty(whQty);
      setWarehouseEditUnitId(item.don_vi_id || 0);
      setCurrentWarehouseItem(item);
    } else {
      setWarehouseEditQty(0);
      setWarehouseEditUnitId(0);
      setCurrentWarehouseItem(null);
    }
    setShowEditModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa nguyên liệu này?')) return;
    try {
      await ingredientAPI.delete(id);
      const wh = await ingredientAPI.getWarehouse();
      const list = await ingredientAPI.getAll();
      const whMap: Record<string, any> = {};
      (wh || []).forEach((w: any) => { whMap[w.ma_nguyen_lieu] = w; });
      const merged = (list || []).map((it: any) => ({ ...it, __warehouse: whMap[it.ma_nguyen_lieu] || { warehouse_qty: 0, warehouse_value: 0 } }));
      setItems(merged);
      alert('Xóa nguyên liệu thành công');
    } catch (e: any) {
      console.error('Delete failed', e);
      alert(e?.response?.data?.message || 'Lỗi khi xóa nguyên liệu');
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
        don_vi_id: receipt.don_vi_id
      });
      // refresh merged data (warehouse aggregation)
      const wh = await ingredientAPI.getWarehouse();
      const list = await ingredientAPI.getAll();
      const whMap: Record<string, any> = {};
      (wh || []).forEach((w: any) => { whMap[w.ma_nguyen_lieu] = w; });
      const merged = (list || []).map((it: any) => ({ ...it, __warehouse: whMap[it.ma_nguyen_lieu] || { warehouse_qty: 0, warehouse_value: 0 } }));
      setItems(merged);
      setReceipt({ ma_nguyen_lieu: 0, so_luong_nhap: 0, don_vi_id: 0, don_gia: 0 });
      setShowReceiptModal(false);
      setSuccessMsg("Nhập kho nguyên liệu thành công!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      console.error(err);
      setReceiptError(err?.response?.data?.message || "Lỗi khi nhập kho");
    } finally {
      setReceiptLoading(false);
    }
  };

  const openAddModal = () => {
    setForm({ ten_nguyen_lieu: "", so_luong_ton: 0, don_vi_id: 0, gia_nhap: 0 });
    setEditingId(null);
    setShowAddModal(true);
  };

  const openReceiptModalFor = (item: any) => {
    setReceipt({ ma_nguyen_lieu: item.ma_nguyen_lieu, so_luong_nhap: 0, don_vi_id: item.don_vi_id || 0, don_gia: 0 });
    setShowReceiptModal(true);
  };

  const openReceiptsListFor = async (item: any) => {
    try {
      setSelectedReceiptIngredientName(item.ten_nguyen_lieu || '');
      setShowReceiptsListModal(true);
      const rows = await receiptAPI.listByIngredient(item.ma_nguyen_lieu);
      setReceiptsList(rows || []);
    } catch (e) {
      console.error('Lỗi khi tải phiếu nhập', e);
      setReceiptsList([]);
      setShowReceiptsListModal(true);
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

      <div className="w-full flex flex-col items-center gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setViewMode('warehouse')} className={`px-4 py-2 rounded-lg font-medium ${viewMode === 'warehouse' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Kho</button>
          <button onClick={() => setViewMode('ingredients')} className={`px-4 py-2 rounded-lg font-medium ${viewMode === 'ingredients' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Nguyên liệu</button>
        </div>

        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, mã..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 border border-input bg-background text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <button onClick={() => {}} className="bg-gray-200 text-gray-800 hover:bg-gray-300 px-3 py-2 rounded-lg transition">Tìm</button>
          </div>
          <div>
            {viewMode === 'ingredients' ? (
              <button onClick={openAddModal} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition shadow-sm">Thêm nguyên liệu</button>
            ) : (
              <button onClick={() => setShowReceiptModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-semibold transition shadow-sm">Nhập kho</button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-card p-6 rounded border border-border w-full">
        {viewMode === 'ingredients' ? (
          <>
            <h2 className="text-xl font-semibold mb-4">Danh sách nguyên liệu</h2>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="p-3 font-medium">Mã</th>
                    <th className="p-3 font-medium">Tên nguyên liệu</th>
                    <th className="p-3 font-medium text-right">Số lượng</th>
                    <th className="p-3 font-medium">Đơn vị</th>
                    <th className="p-3 font-medium text-right">Giá tổng</th>
                    <th className="p-3 font-medium text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.filter(i => !search || i.ten_nguyen_lieu.toLowerCase().includes(search.toLowerCase())).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-muted-foreground">
                        Chưa có nguyên liệu nào
                      </td>
                    </tr>
                    ) : (
                    items.filter(i => !search || i.ten_nguyen_lieu.toLowerCase().includes(search.toLowerCase())).map(i => (
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
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold mb-4">Kho nguyên liệu</h2>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                    <th className="p-3 font-medium">Mã</th>
                    <th className="p-3 font-medium">Tên nguyên liệu</th>
                    <th className="p-3 font-medium text-right">Số lượng</th>
                    <th className="p-3 font-medium">Đơn vị</th>
                    <th className="p-3 font-medium text-right">Giá trị (VNĐ)</th>
                    <th className="p-3 font-medium text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.filter(i => !search || i.ten_nguyen_lieu.toLowerCase().includes(search.toLowerCase())).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-muted-foreground">Chưa có dữ liệu kho</td>
                    </tr>
                  ) : (
                    // Kho view: lấy dữ liệu tổng nhập kho từ endpoint mới
                    // `ingredientAPI.getWarehouse()` trả về hàng với fields: ma_nguyen_lieu, ten_nguyen_lieu, don_vi_id, don_vi, gia_nhap, warehouse_qty, warehouse_value
                    items.filter(i => !search || i.ten_nguyen_lieu.toLowerCase().includes(search.toLowerCase())).map(i => {
                      const wh = i.__warehouse || { warehouse_qty: 0, warehouse_value: 0 };
                      const storedUnit = units.find(u => u.id === i.don_vi_id) || { he_so_quy_doi: 1, ten: '' };
                      const qty = Number(wh.warehouse_qty) || 0;
                      const value = Number(wh.warehouse_value) || 0;
                      return (
                        <tr key={i.ma_nguyen_lieu} className="hover:bg-muted/50 transition-colors">
                          <td className="p-3 text-foreground">{i.ma_nguyen_lieu}</td>
                          <td className="p-3 text-foreground font-medium">{i.ten_nguyen_lieu}</td>
                          <td className="p-3 text-right text-foreground">{fmtQty(qty)} {storedUnit.ten}</td>
                          <td className="p-3 text-foreground">{storedUnit.ten}</td>
                          <td className="p-3 text-right text-foreground">
                            {(() => {
                              const masterQty = Number(i.so_luong_ton) || 0;
                              const masterTotalPrice = Number(i.gia_nhap) || 0;
                              const warehouseQty = Number(wh.warehouse_qty) || 0;
                              const computed = masterQty > 0 ? (warehouseQty / masterQty) * masterTotalPrice : 0;
                              return Number(computed || 0).toLocaleString('vi-VN') + '₫';
                            })()}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={() => handleEdit(i, true)} className="px-3 py-1 rounded bg-white border border-border hover:bg-green-600 hover:text-white text-foreground text-xs">Sửa</button>
                              <button onClick={() => handleDelete(i.ma_nguyen_lieu)} className="px-3 py-1 rounded bg-white border border-border hover:bg-red-600 hover:text-white text-foreground text-xs">Xóa</button>
                              <button onClick={() => openReceiptsListFor(i)} className="px-3 py-1 rounded bg-white border border-border hover:bg-blue-600 hover:text-white text-foreground text-xs">Phiếu nhập</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAddModal(false)} />
          <div className="bg-white rounded shadow-lg p-6 z-10 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Thêm nguyên liệu</h3>
            {addError && <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-3 text-sm">{addError}</div>}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Tên nguyên liệu</label>
                <input value={form.ten_nguyen_lieu} onChange={e => setForm({ ...form, ten_nguyen_lieu: e.target.value })} className="w-full border border-input rounded px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Số lượng ban đầu</label>
                  <input type="number" min={0} value={form.so_luong_ton} onChange={e => setForm({ ...form, so_luong_ton: Number(e.target.value) })} className="w-full border border-input rounded px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Đơn vị</label>
                  <select value={form.don_vi_id} onChange={e => setForm({ ...form, don_vi_id: Number(e.target.value) })} className="w-full border border-input rounded px-3 py-2 text-sm">
                    <option value={0}>Chọn đơn vị</option>
                    {units.map(u => <option key={u.id} value={u.id}>{u.ten}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Giá tổng (VNĐ) — cho số lượng đã nhập</label>
                <input type="number" min={0} step="0.01" value={form.gia_nhap} onChange={e => setForm({ ...form, gia_nhap: Number(e.target.value) })} className="w-full border border-input rounded px-3 py-2 text-sm" />
              </div>
              <div className="flex gap-2 justify-end">
                <button className="px-4 py-2 rounded border" onClick={() => setShowAddModal(false)}>Hủy</button>
                <button onClick={async () => { await handleAdd(); setShowAddModal(false); }} className="px-4 py-2 rounded bg-blue-600 text-white">Lưu</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setShowEditModal(false); setEditFromWarehouse(false); }} />
          <div className="bg-white rounded shadow-lg p-6 z-10 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Sửa nguyên liệu</h3>
            {addError && <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-3 text-sm">{addError}</div>}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Tên nguyên liệu</label>
                {editFromWarehouse ? (
                  <div className="w-full border border-input rounded px-3 py-2 text-sm bg-gray-50">{form.ten_nguyen_lieu}</div>
                ) : (
                  <input value={form.ten_nguyen_lieu} onChange={e => setForm({ ...form, ten_nguyen_lieu: e.target.value })} className="w-full border border-input rounded px-3 py-2 text-sm" />
                )}
              </div>
              {editFromWarehouse ? (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">Số lượng (kho)</label>
                    <input type="number" min={0} step="0.0001" value={warehouseEditQty} onChange={e => setWarehouseEditQty(Number(e.target.value))} className="w-full border border-input rounded px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Đơn vị</label>
                    <select value={warehouseEditUnitId} onChange={e => setWarehouseEditUnitId(Number(e.target.value))} className="w-full border border-input rounded px-3 py-2 text-sm">
                      <option value={0}>Chọn đơn vị</option>
                      {units.map(u => <option key={u.id} value={u.id}>{u.ten}</option>)}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">Số lượng</label>
                    <input type="number" min={0} value={form.so_luong_ton} onChange={e => setForm({ ...form, so_luong_ton: Number(e.target.value) })} className="w-full border border-input rounded px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Đơn vị</label>
                    <select value={form.don_vi_id} onChange={e => setForm({ ...form, don_vi_id: Number(e.target.value) })} className="w-full border border-input rounded px-3 py-2 text-sm">
                      <option value={0}>Chọn đơn vị</option>
                      {units.map(u => <option key={u.id} value={u.id}>{u.ten}</option>)}
                    </select>
                  </div>
                </div>
              )}
              {!editFromWarehouse && (
                <div>
                  <label className="block text-sm font-medium mb-1">Giá tổng (VNĐ) — cho số lượng hiện tại</label>
                  <input type="number" min={0} step="0.01" value={form.gia_nhap} onChange={e => setForm({ ...form, gia_nhap: Number(e.target.value) })} className="w-full border border-input rounded px-3 py-2 text-sm" />
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <button className="px-4 py-2 rounded border" onClick={() => { setShowEditModal(false); setEditFromWarehouse(false); setCurrentWarehouseItem(null); }}>Hủy</button>
                <button onClick={async () => {
                    try {
                      if (editFromWarehouse && currentWarehouseItem) {
                        const prevQty = (currentWarehouseItem.__warehouse && Number(currentWarehouseItem.__warehouse.warehouse_qty)) || 0;
                        const newQty = Number(warehouseEditQty) || 0;
                        const delta = newQty - prevQty;
                        if (delta !== 0) {
                          // create an adjustment receipt in warehouse to reflect change
                          await receiptAPI.add(currentWarehouseItem.ma_nguyen_lieu, { so_luong_nhap: delta, don_vi_id: warehouseEditUnitId });
                        }
                        // refresh data
                        await refreshMergedData();
                        setShowEditModal(false);
                        setEditFromWarehouse(false);
                        setCurrentWarehouseItem(null);
                        return;
                      }
                      // not a warehouse-edit: save master ingredient
                      await handleAdd();
                      setShowEditModal(false);
                      setEditFromWarehouse(false);
                      setCurrentWarehouseItem(null);
                    } catch (e:any) {
                      console.error(e);
                      alert(e?.response?.data?.message || 'Lỗi khi lưu thay đổi');
                    }
                  }} className="px-4 py-2 rounded bg-blue-600 text-white">Lưu</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowReceiptModal(false)} />
          <div className="bg-white rounded shadow-lg p-6 z-10 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Nhập kho</h3>
            {receiptError && <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-3 text-sm">{receiptError}</div>}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Nguyên liệu</label>
                <select value={receipt.ma_nguyen_lieu} onChange={e => setReceipt({ ...receipt, ma_nguyen_lieu: Number(e.target.value) })} className="w-full border border-input rounded px-3 py-2 text-sm">
                  <option value={0}>-- Chọn nguyên liệu --</option>
                  {items.map(i => <option key={i.ma_nguyen_lieu} value={i.ma_nguyen_lieu}>{i.ten_nguyen_lieu}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Số lượng nhập</label>
                  <input type="number" min={0} step="0.01" value={receipt.so_luong_nhap} onChange={e => setReceipt({ ...receipt, so_luong_nhap: Number(e.target.value) })} className="w-full border border-input rounded px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Đơn vị</label>
                  <select value={receipt.don_vi_id} onChange={e => setReceipt({ ...receipt, don_vi_id: Number(e.target.value) })} className="w-full border border-input rounded px-3 py-2 text-sm">
                    <option value={0}>Đơn vị</option>
                    {units.map(u => <option key={u.id} value={u.id}>{u.ten}</option>)}
                  </select>
                </div>
              </div>
              {/* Đơn giá sẽ được tính tự động theo danh sách nguyên liệu (giá/1kg) */}
              {getReceiptPreview() && <div className="text-sm text-muted-foreground">Sẽ cộng: {getReceiptPreview()}</div>}
              <div className="flex gap-2 justify-end">
                <button className="px-4 py-2 rounded border" onClick={() => setShowReceiptModal(false)}>Hủy</button>
                <button onClick={async () => { await handleReceipt(); }} className="px-4 py-2 rounded bg-green-600 text-white">Lưu</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipts List Modal */}
      {showReceiptsListModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowReceiptsListModal(false)} />
          <div className="bg-white rounded shadow-lg p-6 z-10 w-full max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">Phiếu nhập — {selectedReceiptIngredientName}</h3>
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="h-80 overflow-y-auto">
                <div className="min-w-full overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 text-muted-foreground">
                      <tr>
                        <th className="p-3 font-medium">Thời gian</th>
                        <th className="p-3 font-medium">Nguyên liệu</th>
                        <th className="p-3 font-medium text-right">Số lượng</th>
                        <th className="p-3 font-medium">Đơn vị</th>
                        <th className="p-3 font-medium text-right">Đơn giá</th>
                        <th className="p-3 font-medium text-right">Tổng tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {receiptsList.length === 0 ? (
                        <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">Chưa có phiếu nhập</td></tr>
                      ) : (
                        receiptsList.map(r => {
                          const unit = units.find(u => u.id === r.don_vi_id) || { ten: '' };
                          const qty = Number(r.so_luong_nhap || 0);
                          const unitPrice = Number(r.don_gia || 0);
                          const total = qty * unitPrice;
                          const date = r.ngay_nhap ? String(r.ngay_nhap) : '';
                          return (
                            <tr key={r.id} className="hover:bg-muted/50 transition-colors">
                              <td className="p-3 text-foreground">{date}</td>
                              <td className="p-3 text-foreground">{selectedReceiptIngredientName}</td>
                              <td className="p-3 text-right text-foreground">{fmtQty(qty)}</td>
                              <td className="p-3 text-foreground">{unit.ten}</td>
                              <td className="p-3 text-right text-foreground">{Number(unitPrice || 0).toLocaleString('vi-VN')}₫</td>
                              <td className="p-3 text-right text-foreground">{Number(total || 0).toLocaleString('vi-VN')}₫</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={() => setShowReceiptsListModal(false)} className="px-4 py-2 rounded border">Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ingredients;
