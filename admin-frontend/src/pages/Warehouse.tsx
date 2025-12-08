import React, { useEffect, useState } from "react";
import { warehouseAPI } from "../api/warehouseAPI";
import { productAPI } from "../api/productAPI";

const Warehouse: React.FC = () => {
    const [entries, setEntries] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [form, setForm] = useState({ ma_san_pham: 0, so_luong: "", gia_nhap: "" });
    const [selectedDate, setSelectedDate] = useState<string>("");
    const [warehouseFieldErrors, setWarehouseFieldErrors] = useState<{ ma_san_pham?: string; so_luong?: string; gia_nhap?: string }>({});

    const fetchEntries = async () => {
        try {
            const data = await warehouseAPI.getAll();
            setEntries(data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchProducts = async () => {
        try {
            const data = await productAPI.getAll();
            setProducts(data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchEntries();
        fetchProducts();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // client-side validation
        const errs: { ma_san_pham?: string; so_luong?: string; gia_nhap?: string } = {};
        if (!form.ma_san_pham || Number(form.ma_san_pham) <= 0) errs.ma_san_pham = 'Vui lòng chọn sản phẩm';
        const qty = Number(form.so_luong || 0);
        if (!qty || qty <= 0) errs.so_luong = 'Số lượng phải lớn hơn 0';
        const price = Number(form.gia_nhap || 0);
        if (!price || price <= 0) errs.gia_nhap = 'Giá nhập phải lớn hơn 0';
        if (Object.keys(errs).length) {
            setWarehouseFieldErrors(errs);
            const msgs = Object.values(errs).join('\n');
            alert('Vui lòng điền đầy đủ thông tin nhập kho:\n' + msgs);
            return;
        }
        setWarehouseFieldErrors({});

        try {
            const payload = {
                don_vi_nhap: "",
                chi_tiet: [
                    { ma_san_pham: form.ma_san_pham, so_luong: qty, don_gia_nhap: price },
                ],
            };
            await warehouseAPI.create(payload);
            alert("Nhập kho thành công");
            setForm({ ma_san_pham: 0, so_luong: "", gia_nhap: "" });
            fetchEntries();
            fetchProducts();
            // notify dashboard/statistics to refresh totals (inventory cost changed)
            try {
                const added = Number(price * qty || 0);
                window.dispatchEvent(new CustomEvent('statsUpdated', { detail: { inventoryAdded: added } }));
            } catch (e) { /* ignore */ }
        } catch (err) {
            console.error(err);
            alert("Lỗi khi nhập kho");
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-foreground"> Quản lý nhập kho</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card text-card-foreground p-6 rounded-xl shadow-sm border border-border">
                    <h3 className="font-semibold mb-4 text-lg">Thêm phiếu nhập</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">Sản phẩm</label>
                            <select value={form.ma_san_pham} onChange={(e) => setForm({ ...form, ma_san_pham: Number(e.target.value) })} className={`w-full border border-input bg-background text-foreground px-3 py-2 rounded-lg focus:ring-2 focus:ring-black focus:outline-none ${warehouseFieldErrors.ma_san_pham ? 'border-red-500' : ''}`}>
                                <option value={0}>-- Chọn sản phẩm --</option>
                                {products.map((p) => (
                                    <option key={p.ma_san_pham} value={p.ma_san_pham}>{p.ten_san_pham}</option>
                                ))}
                            </select>
                            {warehouseFieldErrors.ma_san_pham && <p className="text-red-600 text-xs mt-1">{warehouseFieldErrors.ma_san_pham}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">Số lượng</label>
                            <input inputMode="numeric" pattern="[0-9]*" value={form.so_luong} onChange={(e) => setForm({ ...form, so_luong: e.target.value })} className={`w-full border border-input bg-background text-foreground px-3 py-2 rounded-lg focus:ring-2 focus:ring-black focus:outline-none ${warehouseFieldErrors.so_luong ? 'border-red-500' : ''}`} />
                            {warehouseFieldErrors.so_luong && <p className="text-red-600 text-xs mt-1">{warehouseFieldErrors.so_luong}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">Giá nhập</label>
                            <input inputMode="numeric" pattern="[0-9]*" value={form.gia_nhap} onChange={(e) => setForm({ ...form, gia_nhap: e.target.value })} className={`w-full border border-input bg-background text-foreground px-3 py-2 rounded-lg focus:ring-2 focus:ring-black focus:outline-none ${warehouseFieldErrors.gia_nhap ? 'border-red-500' : ''}`} />
                            {warehouseFieldErrors.gia_nhap && <p className="text-red-600 text-xs mt-1">{warehouseFieldErrors.gia_nhap}</p>}
                        </div>
                        <div className="pt-2">
                            <button className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition shadow-sm">Nhập kho</button>
                        </div>
                    </form>
                </div>

                <div className="bg-card text-card-foreground p-6 rounded-xl shadow-sm border border-border">
                    <h3 className="font-semibold mb-4 text-lg">Danh sách phiếu nhập</h3>

                    <div className="flex items-center gap-3 mb-3">
                        <label className="text-sm text-muted-foreground">Chọn ngày</label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="border border-input bg-background text-foreground px-3 py-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                        <button
                            onClick={() => { /* no-op, filtering is reactive */ }}
                            className="bg-gray-200 text-gray-800 hover:bg-gray-300 px-3 py-1 rounded-lg transition"
                        >
                            Xem
                        </button>
                        <button
                            onClick={() => setSelectedDate("")}
                            className="bg-white border border-border hover:bg-gray-100 px-3 py-1 rounded-lg transition"
                        >
                            Xóa lọc
                        </button>
                    </div>

                    <div className="rounded-lg border border-border overflow-hidden">
                        <div className="h-80 overflow-y-auto">
                            <div className="min-w-full overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-muted/50 text-muted-foreground">
                                        <tr>
                                            <th className="p-3 font-medium">Mã</th>
                                            <th className="p-3 font-medium">Thời gian</th>
                                            <th className="p-3 font-medium">Tổng giá trị</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {(selectedDate ? entries.filter((e: any) => {
                                            try {
                                                // Try to match YYYY-MM-DD within the timestamp string
                                                return String(e.thoi_gian_nhap || "").includes(selectedDate);
                                            } catch (err) {
                                                return false;
                                            }
                                        }) : entries).map((e: any) => {
                                            const totalValue = Number(e.tong_gia_tri || 0);
                                            return (
                                                <tr key={e.ma_nhap} className="hover:bg-muted/50 transition-colors">
                                                    <td className="p-3 text-foreground">{e.ma_nhap}</td>
                                                    <td className="p-3 text-foreground">{e.thoi_gian_nhap}</td>
                                                    <td className="p-3 text-foreground">{totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Warehouse;