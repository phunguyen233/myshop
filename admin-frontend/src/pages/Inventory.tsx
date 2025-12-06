import React, { useEffect, useState } from "react";
import { productAPI } from "../api/productAPI";
import { customerAPI } from "../api/customerAPI";
import { Product } from "../types/Product";

const Inventory: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
    const [customerHistory, setCustomerHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                setLoading(true);
                const [pRes, cRes] = await Promise.all([productAPI.getAll(), customerAPI.getAll()]);
                setProducts(pRes || []);
                setCustomers(cRes || []);
            } catch (err) {
                console.error("Lỗi khi tải dữ liệu thống kê:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!selectedCustomer) {
                setCustomerHistory([]);
                return;
            }
            try {
                const res = await customerAPI.getOrders(selectedCustomer);
                setCustomerHistory(res || []);
            } catch (err) {
                console.error(err);
            }
        };
        fetchHistory();
    }, [selectedCustomer]);

    // Tổng giá trị tồn kho (ước tính bằng giá bán * số lượng tồn)
    const totalInventoryValue = products.reduce((sum, p) => sum + (p.gia_ban || 0) * (p.so_luong_ton || 0), 0);
    const lowStockThreshold = 5;
    const lowStockCount = products.reduce((cnt, p) => cnt + ((p.so_luong_ton || 0) <= lowStockThreshold ? 1 : 0), 0);

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-bold mb-6 text-foreground">📊 Thống kê</h1>

            {loading ? (
                <p className="text-muted-foreground">Đang tải dữ liệu...</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-card text-card-foreground p-4 rounded-xl shadow-sm border border-border">
                        <h3 className="text-sm font-medium text-muted-foreground">Tổng giá trị tồn kho</h3>
                        <p className="text-2xl font-bold text-chart-1">{totalInventoryValue.toLocaleString('vi-VN')}₫</p>
                        <p className="text-sm text-muted-foreground">Tổng tiền tính theo giá bán hiện tại</p>
                    </div>

                    <div className="bg-card text-card-foreground p-4 rounded-xl shadow-sm border border-border">
                        <h3 className="text-sm font-medium text-muted-foreground">Sản phẩm sắp hết hàng</h3>
                        <p className="text-2xl font-bold text-chart-2">{lowStockCount}</p>
                        <p className="text-sm text-muted-foreground">Sản phẩm có tồn ≤ {lowStockThreshold}</p>
                    </div>

                    <div className="bg-card text-card-foreground p-4 rounded-xl shadow-sm border border-border">
                        <h3 className="text-sm font-medium text-muted-foreground">Tổng số sản phẩm</h3>
                        <p className="text-2xl font-bold text-chart-3">{products.length}</p>
                        <p className="text-sm text-muted-foreground">Các mặt hàng đang bán</p>
                    </div>

                    <div className="bg-card text-card-foreground p-4 rounded-xl shadow-sm border border-border">
                        <h3 className="text-sm font-medium text-muted-foreground">Tổng khách hàng</h3>
                        <p className="text-2xl font-bold text-chart-4">{customers.length}</p>
                        <p className="text-sm text-muted-foreground">Số lượng khách hàng đã đăng ký</p>
                    </div>
                </div>
            )}

            <div className="mb-6 bg-card text-card-foreground rounded-xl shadow-sm border border-border p-6">
                <h2 className="text-xl font-semibold mb-3">📦 Danh sách tồn kho</h2>
                <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted/50 text-muted-foreground">
                            <tr>
                                <th className="p-3 font-medium">Mã SP</th>
                                <th className="p-3 font-medium">Tên</th>
                                <th className="p-3 font-medium">Số lượng</th>
                                <th className="p-3 font-medium">Giá bán</th>
                                <th className="p-3 font-medium">Giá trị tồn kho</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {products.map((p) => (
                                <tr key={p.ma_san_pham} className="hover:bg-muted/50 transition-colors">
                                    <td className="p-3 text-foreground">{p.ma_san_pham}</td>
                                    <td className="p-3 text-foreground">{p.ten_san_pham}</td>
                                    <td className="p-3 text-center text-foreground">{p.so_luong_ton}</td>
                                    <td className="p-3 text-right text-foreground">{p.gia_ban.toLocaleString('vi-VN')}₫</td>
                                    <td className="p-3 text-right text-foreground">{((p.gia_ban || 0) * (p.so_luong_ton || 0)).toLocaleString('vi-VN')}₫</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mb-6 bg-card text-card-foreground rounded-xl shadow-sm border border-border p-6">
                <h2 className="text-xl font-semibold mb-3">📜 Lịch sử mua hàng của khách hàng</h2>
                <div className="flex items-center gap-3 mb-4">
                    <select value={selectedCustomer ?? ""} onChange={(e) => setSelectedCustomer(e.target.value ? Number(e.target.value) : null)} className="border border-input bg-background text-foreground px-3 py-2 rounded-lg focus:ring-2 focus:ring-ring focus:outline-none">
                        <option value="">-- Chọn khách hàng --</option>
                        {customers.map((c: any) => (
                            <option key={c.ma_khach_hang} value={c.ma_khach_hang}>{c.ho_ten} (#{c.ma_khach_hang})</option>
                        ))}
                    </select>
                </div>

                {selectedCustomer ? (
                    <div className="overflow-x-auto rounded-lg border border-border">
                        {customerHistory.length === 0 ? (
                            <p className="text-muted-foreground p-4">Không có đơn hàng cho khách này.</p>
                        ) : (
                            <table className="w-full text-left text-sm">
                                <thead className="bg-muted/50 text-muted-foreground">
                                    <tr>
                                        <th className="p-3 font-medium">Mã đơn</th>
                                        <th className="p-3 font-medium">Thời gian</th>
                                        <th className="p-3 font-medium">Tổng tiền</th>
                                        <th className="p-3 font-medium">Chi tiết</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {customerHistory.map((h: any) => (
                                        <tr key={h.ma_don_hang} className="hover:bg-muted/50 transition-colors">
                                            <td className="p-3 text-foreground">{h.ma_don_hang}</td>
                                            <td className="p-3 text-foreground">{h.thoi_gian_mua}</td>
                                            <td className="p-3 text-right text-foreground">{h.tong_tien?.toLocaleString('vi-VN')}₫</td>
                                            <td className="p-3 text-foreground">
                                                <ul className="list-disc list-inside">
                                                    {h.items?.map((it: any, idx: number) => (
                                                        <li key={idx}>{it.ten_san_pham} — x{it.so_luong} — {it.don_gia?.toLocaleString('vi-VN')}₫</li>
                                                    ))}
                                                </ul>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                ) : (
                    <p className="text-muted-foreground">Chọn khách hàng để xem lịch sử mua hàng.</p>
                )}
            </div>
        </div>
    );
};

export default Inventory;
