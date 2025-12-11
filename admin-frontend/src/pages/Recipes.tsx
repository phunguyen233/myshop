import React, { useEffect, useState } from "react";
import { productAPI } from "../api/productAPI";
import { ingredientAPI } from "../api/ingredientAPI";
import { recipeAPI } from "../api/recipeAPI";
import { unitAPI } from "../api/unitAPI";

const Recipes: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [rows, setRows] = useState<Array<{ ma_nguyen_lieu:number, so_luong_can:number, don_vi_id:number }>>([]);
  const [savedRecipes, setSavedRecipes] = useState<any>({});

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
      await loadSaved();
    } catch (err) { console.error(err); alert('Lỗi khi lưu công thức'); }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Công thức sản phẩm</h1>
      <div className="bg-card p-4 rounded">
        <div className="flex gap-3 mb-3">
          <select className="flex-1" value={selectedProduct || ''} onChange={e => setSelectedProduct(e.target.value ? Number(e.target.value) : null)}>
            <option value="">-- Chọn sản phẩm --</option>
            {products.map(p => <option key={p.ma_san_pham} value={p.ma_san_pham}>{p.ten_san_pham}</option>)}
          </select>
          <button onClick={addRow} className="bg-blue-600 text-white px-3 py-2 rounded">Thêm nguyên liệu</button>
        </div>

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

        <div className="mt-4">
          <button onClick={save} className="bg-green-600 text-white px-4 py-2 rounded">Lưu công thức</button>
        </div>
        </div>

        {/* Saved recipes list */}
        <div className="bg-card p-4 rounded">
          <h2 className="text-xl font-semibold mb-3">Danh sách công thức đã lưu</h2>
          {Object.keys(savedRecipes).length === 0 ? (
            <p className="text-muted-foreground">Chưa có công thức nào</p>
          ) : (
            Object.entries(savedRecipes).map(([productId, info]: any) => {
              const total = (info.items || []).reduce((s: number, it: any) => s + (Number(it.cost_per_line) || 0), 0);
              return (
                <div key={productId} className="mb-4 border border-border rounded p-3">
                  <h3 className="font-semibold">{info.productName} — Tổng chi phí: {total.toLocaleString('vi-VN')}₫</h3>
                  <ul className="mt-2">
                    {info.items.map((it: any, idx: number) => (
                      <li key={idx} className="flex justify-between py-1 border-b border-border">
                          <div>
                            <div className="font-medium">{it.ten_nguyen_lieu}</div>
                            <div className="text-sm text-muted-foreground">
                              {it.so_luong_can} {it.recipe_don_vi}
                              {(() => {
                                // compute converted quantity in ingredient's stored unit
                                const recipeQty = Number(it.so_luong_can) || 0;
                                const recipeHs = Number(it.recipe_he_so) || 1;
                                const nlHs = Number(it.nl_he_so) || 1;
                                const converted = nlHs ? (recipeQty * recipeHs) / nlHs : recipeQty;
                                const fmt = (v:number) => {
                                  if (!isFinite(v)) return '0';
                                  if (Math.abs(v - Math.round(v)) < 1e-9) return String(Math.round(v));
                                  return v.toFixed(4).replace(/\.?0+$/,'');
                                };
                                // If the entered quantity and unit already match the ingredient's stored unit, show compact form
                                const recipeUnit = (it.recipe_don_vi || '').trim();
                                const nlUnit = (it.nguyenlieu_don_vi || '').trim();
                                if (Math.abs(converted - recipeQty) < 1e-9 && recipeUnit && recipeUnit === nlUnit) {
                                  return (` ${fmt(converted)}${nlUnit}`);
                                }
                                return (` • ${fmt(converted)} ${it.nguyenlieu_don_vi}`);
                              })()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{(Number(it.cost_per_line) || 0).toLocaleString('vi-VN')}₫</div>
                            <div className="text-sm text-muted-foreground">Số tiền nguyên liệu: {(Number(it.cost_per_line)||0).toLocaleString('vi-VN')}₫</div>
                          </div>
                        </li>
                    ))}
                  </ul>
                </div>
              );
            })
          )}
        </div>
    </div>
  );
};

export default Recipes;
