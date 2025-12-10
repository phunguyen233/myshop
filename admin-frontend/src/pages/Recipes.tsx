import React, { useEffect, useState } from "react";
import { productAPI } from "../api/productAPI";
import { ingredientAPI } from "../api/ingredientAPI";
import { recipeAPI } from "../api/recipeAPI";

const Recipes: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [rows, setRows] = useState<Array<{ ma_nguyen_lieu:number, so_luong_can:number, don_vi_id:number }>>([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [p, i] = await Promise.all([productAPI.getAll(), ingredientAPI.getAll()]);
        setProducts(p || []);
        setIngredients(i || []);
      } catch (err) { console.error(err); }
    };
    fetch();
  }, []);

  const addRow = () => setRows([...rows, { ma_nguyen_lieu: 0, so_luong_can: 0, don_vi_id: 0 }]);
  const updateRow = (idx:number, key:string, value:any) => { const copy = [...rows]; (copy[idx] as any)[key]=value; setRows(copy); };

  const save = async () => {
    if (!selectedProduct) return alert('Chọn sản phẩm');
    try {
      const payload = { ma_san_pham: selectedProduct, items: rows.filter(r=>r.ma_nguyen_lieu && r.so_luong_can>0) };
      const res = await recipeAPI.create(payload);
      alert(`Lưu thành công (chi phí nguyên liệu: ${res.total_cost || 0})`);
      setRows([]);
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
              {ingredients.map(i => i.don_vi_id && <option key={i.don_vi_id} value={i.don_vi_id}>{i.don_vi}</option>)}
            </select>
          </div>
        ))}

        <div className="mt-4">
          <button onClick={save} className="bg-green-600 text-white px-4 py-2 rounded">Lưu công thức</button>
        </div>
      </div>
    </div>
  );
};

export default Recipes;
