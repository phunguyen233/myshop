import React, { useEffect, useState } from "react";
import { productAPI } from "../api/productAPI";
import { ingredientAPI } from "../api/ingredientAPI";
import { recipeAPI } from "../api/recipeAPI";
import { unitAPI } from "../api/unitAPI";
import axiosClient from "../api/axiosClient";

const Recipes: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [rows, setRows] = useState<Array<{ ma_nguyen_lieu:number, so_luong_can:number, don_vi_id:number }>>([]);
  const [savedRecipes, setSavedRecipes] = useState<any>({});
  const [editingProduct, setEditingProduct] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalRows, setModalRows] = useState<Array<{ ma_nguyen_lieu:number, so_luong_can:number, don_vi_id:number }>>([]);
  const [modalSelectedProduct, setModalSelectedProduct] = useState<number | null>(null);
  const [ingredientQuery, setIngredientQuery] = useState("");

  useEffect(() => {
    const fetch = async () => {
      try {
        const [p, i, u] = await Promise.all([productAPI.getAll(), ingredientAPI.getAll(), unitAPI.getAll()]);
        setProducts(p || []);
        setIngredients(i || []);
        setUnits(u || []);
      } catch (err) { console.error(err); }
    };
    fetch();
  }, []);

  const loadSaved = async () => {
    try {
      const rows = await recipeAPI.getAll();
      // group by product
      const map: any = {};
      for (const r of rows) {
        if (!map[r.ma_san_pham]) map[r.ma_san_pham] = { productName: r.ten_san_pham, items: [] };
        map[r.ma_san_pham].items.push(r);
      }
      setSavedRecipes(map);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { loadSaved(); }, []);

  const addRow = () => setRows([...rows, { ma_nguyen_lieu: 0, so_luong_can: 0, don_vi_id: 0 }]);
  const updateRow = (idx:number, key:string, value:any) => { const copy = [...rows]; (copy[idx] as any)[key]=value; setRows(copy); };

  const save = async () => {
    if (!selectedProduct) return alert('Chọn sản phẩm');
    try {
      const payload = { ma_san_pham: selectedProduct, items: rows.filter(r=>r.ma_nguyen_lieu && r.so_luong_can>0) };
      const res = await recipeAPI.create(payload);
      alert(`Lưu thành công (chi phí nguyên liệu: ${res.total_cost || 0})`);
      setRows([]);
      setEditingProduct(null);
      await loadSaved();
    } catch (err) { console.error(err); alert('Lỗi khi lưu công thức'); }
  };

  const handleEditRecipe = async (productId:number) => {
    try {
      const data = await recipeAPI.getByProduct(productId);
      // build rows from returned items
      const newRows = (data || []).map((it:any) => ({ ma_nguyen_lieu: it.ma_nguyen_lieu, so_luong_can: it.so_luong_can, don_vi_id: it.don_vi_id }));
      setRows(newRows);
      setSelectedProduct(productId);
      setEditingProduct(productId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      console.error(e);
      alert('Không thể tải công thức để sửa');
    }
  };

  const handleDeleteRecipe = async (productId:number) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa công thức này?')) return;
    try {
      await axiosClient.delete(`/recipes/product/${productId}`);
      await loadSaved();
      alert('Xóa công thức thành công');
    } catch (e) {
      console.error('Delete recipe failed', e);
      alert('Backend chưa hỗ trợ xóa công thức.');
    }
  };

  const filteredIngredients = ingredients.filter(i => !ingredientQuery ? true : (i.ten_nguyen_lieu || '').toLowerCase().includes(ingredientQuery.toLowerCase()) || String(i.ma_nguyen_lieu).includes(ingredientQuery));

  const addIngredientToModal = (ing:any) => {
    setModalRows(prev => [...prev, { ma_nguyen_lieu: ing.ma_nguyen_lieu, so_luong_can: 1, don_vi_id: ing.don_vi_id || 0 }]);
    setIngredientQuery('');
  };

  const removeModalRow = (idx:number) => setModalRows(prev => prev.filter((_,i)=>i!==idx));
  const updateModalRow = (idx:number, key:string, value:any) => { const copy = [...modalRows]; (copy[idx] as any)[key]=value; setModalRows(copy); };

  const saveModalRecipe = async () => {
    if (!modalSelectedProduct) return alert('Chọn sản phẩm trước khi lưu');
    const payload = { ma_san_pham: modalSelectedProduct, items: modalRows.filter(r=>r.ma_nguyen_lieu && r.so_luong_can>0) };
    try {
      await recipeAPI.create(payload);
      alert('Tạo công thức thành công');
      setShowCreateModal(false);
      setModalRows([]);
      setModalSelectedProduct(null);
      await loadSaved();
    } catch (e) {
      console.error(e);
      alert('Lỗi khi tạo công thức');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Công thức sản phẩm</h1>
      <div className="bg-card p-4 rounded">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Tìm kiếm công thức theo tên hoặc mã sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 border border-input bg-background text-foreground rounded-lg px-3 py-2 focus:outline-none"
            />
            <button onClick={() => {}} className="bg-gray-200 text-gray-800 hover:bg-gray-300 px-3 py-2 rounded-lg">Tìm</button>
          </div>
          <div>
            <button onClick={() => { setShowCreateModal(true); setModalRows([]); setModalSelectedProduct(null); }} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold">Tạo công thức</button>
          </div>
        </div>

        {/* Existing inline edit section kept below when editing a recipe (rows/state) */}
        {editingProduct && rows.length > 0 && (
          <div className="mb-4">
            <h4 className="font-semibold mb-2">Đang chỉnh sửa công thức sản phẩm #{editingProduct}</h4>
            {rows.map((r, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <select className="w-64" value={r.ma_nguyen_lieu} onChange={e => updateRow(idx, 'ma_nguyen_lieu', Number(e.target.value))}>
                  <option value={0}>Chọn nguyên liệu</option>
                  {ingredients.map(i => <option key={i.ma_nguyen_lieu} value={i.ma_nguyen_lieu}>{i.ten_nguyen_lieu}</option>)}
                </select>
                <input type="number" className="flex-1" value={r.so_luong_can} onChange={e => updateRow(idx, 'so_luong_can', Number(e.target.value))} />
                <select className="w-40" value={r.don_vi_id} onChange={e => updateRow(idx, 'don_vi_id', Number(e.target.value))}>
                  <option value={0}>Đơn vị</option>
                  {units.map(u => <option key={u.id} value={u.id}>{u.ten}</option>)}
                </select>
              </div>
            ))}
            <div className="mt-2">
              <button onClick={save} className="bg-blue-600 text-white px-4 py-2 rounded">Lưu thay đổi</button>
            </div>
          </div>
        )}
      </div>

        {/* Saved recipes list */}
        <div className="bg-card p-4 rounded">
          <h2 className="text-xl font-semibold mb-3">Danh sách công thức đã lưu</h2>
          {Object.keys(savedRecipes).length === 0 ? (
            <p className="text-muted-foreground">Chưa có công thức nào</p>
          ) : (
            Object.entries(savedRecipes)
              .filter(([pid, info]: any) => {
                if (!searchTerm) return true;
                const q = searchTerm.toLowerCase();
                const name = (info.productName || '').toLowerCase();
                return name.includes(q) || String(pid).includes(q);
              })
              .map(([productId, info]: any) => {
              const total = (info.items || []).reduce((s: number, it: any) => s + (Number(it.cost_per_line) || 0), 0);
              return (
                <div key={productId} className="mb-4 border border-border rounded p-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{info.productName} <span className="text-sm text-muted-foreground ml-2">{total ? `(${total.toLocaleString('vi-VN')}₫)` : ''}</span></h3>
                    <div className="flex items-center gap-2">
                      {editingProduct === Number(productId) && <span className="text-sm text-blue-600">Đang sửa</span>}
                      <button onClick={() => handleEditRecipe(Number(productId))} className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600">Sửa</button>
                      <button onClick={() => handleDeleteRecipe(Number(productId))} className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">Xóa</button>
                    </div>
                  </div>
                  <ul className="mt-2">
                    {info.items.map((it: any, idx: number) => (
                      <li key={idx} className="flex justify-between py-1 border-b border-border">
                          <div>
                            <div className="font-medium">{it.ten_nguyen_lieu}</div>
                            <div className="text-sm text-muted-foreground">
                              {(() => {
                                const qty = Number(it.so_luong_can) || 0;
                                const fmt = (v:number) => {
                                  if (!isFinite(v)) return '0';
                                  if (Math.abs(v - Math.round(v)) < 1e-9) return String(Math.round(v));
                                  // remove trailing zeros
                                  return String(v).replace(/\.?0+$/,'');
                                };
                                const unit = (it.recipe_don_vi || it.nguyenlieu_don_vi || '').trim();
                                return `${fmt(qty)}${unit ? ' ' + unit : ''}`;
                              })()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{(Number(it.cost_per_line) || 0).toString()}₫</div>
                          </div>
                        </li>
                    ))}
                  </ul>
                </div>
              );
            })
          )}
        </div>
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-6">
            <div className="bg-card text-card-foreground rounded-lg p-6 max-w-2xl w-full shadow-xl border border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Tạo công thức mới</h3>
                <button onClick={() => setShowCreateModal(false)} className="text-muted-foreground">Đóng</button>
              </div>
              <div className="mb-3">
                <label className="block text-sm mb-1">Chọn sản phẩm</label>
                <select value={modalSelectedProduct || ''} onChange={e => setModalSelectedProduct(e.target.value ? Number(e.target.value) : null)} className="w-full border border-input rounded px-3 py-2">
                  <option value="">-- Chọn sản phẩm --</option>
                  {products.map(p => <option key={p.ma_san_pham} value={p.ma_san_pham}>{p.ten_san_pham}</option>)}
                </select>
              </div>

              <div className="mb-3">
                <label className="block text-sm mb-1">Thêm nguyên liệu</label>
                <div className="flex gap-2 items-center">
                  <input value={ingredientQuery} onChange={e=>setIngredientQuery(e.target.value)} placeholder="Tìm nguyên liệu..." className="flex-1 border border-input rounded px-3 py-2" />
                  <div className="w-40 text-sm text-muted-foreground">Chọn từ danh sách rồi bấm Thêm</div>
                </div>
                <div className="mt-2 max-h-40 overflow-auto border border-border rounded p-2">
                  {filteredIngredients.slice(0,50).map(ing => (
                    <div key={ing.ma_nguyen_lieu} className="flex items-center justify-between py-1">
                      <div>{ing.ten_nguyen_lieu} <span className="text-sm text-muted-foreground">({ing.so_luong_ton || 0} tồn)</span></div>
                      <button onClick={() => addIngredientToModal(ing)} className="bg-blue-600 text-white px-2 py-1 rounded">Thêm</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                {modalRows.map((r, idx) => (
                  <div key={idx} className="flex gap-2 items-center mb-2">
                    <select className="w-64" value={r.ma_nguyen_lieu} onChange={e=>updateModalRow(idx,'ma_nguyen_lieu',Number(e.target.value))}>
                      <option value={0}>Chọn nguyên liệu</option>
                      {ingredients.map(i=> <option key={i.ma_nguyen_lieu} value={i.ma_nguyen_lieu}>{i.ten_nguyen_lieu}</option>)}
                    </select>
                    <input type="number" className="flex-1" value={r.so_luong_can} onChange={e=>updateModalRow(idx,'so_luong_can',Number(e.target.value))} />
                    <select className="w-40" value={r.don_vi_id} onChange={e=>updateModalRow(idx,'don_vi_id',Number(e.target.value))}>
                      <option value={0}>Đơn vị</option>
                      {units.map(u => <option key={u.id} value={u.id}>{u.ten}</option>)}
                    </select>
                    <button onClick={()=>removeModalRow(idx)} className="text-red-600">Xóa</button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2">
                <button onClick={() => setShowCreateModal(false)} className="bg-gray-300 px-3 py-2 rounded">Hủy</button>
                <button onClick={saveModalRecipe} className="bg-green-600 text-white px-4 py-2 rounded">Lưu</button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default Recipes;
