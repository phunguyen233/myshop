import React, { useEffect, useState } from "react";
import { orderAPI, Order } from "../api/orderAPI";
import { productAPI } from "../api/productAPI";
import { customerAPI } from "../api/customerAPI";

const Orders: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);
    const [query, setQuery] = useState("");
    const [detail, setDetail] = useState<Order | null>(null);
    const [newStatus, setNewStatus] = useState<string>("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [customers, setCustomers] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);

    // add order form state
    const [selectedCustomer, setSelectedCustomer] = useState<number | undefined>(undefined);
    const [recipientName, setRecipientName] = useState("");
    const [recipientPhone, setRecipientPhone] = useState("");
    const [recipientAddress, setRecipientAddress] = useState("");
    const [orderItems, setOrderItems] = useState<Array<{ ma_san_pham: number; ten_san_pham?: string; so_luong: number; don_gia: number }>>([]);

    // Use enum values from your DB: 'cho_xu_ly','hoan_tat','huy'
    const statuses = ["cho_xu_ly", "hoan_tat", "huy"];
    const statusLabels: Record<string, string> = {
        cho_xu_ly: "Chờ xử lý",
        hoan_tat: "Hoàn thành",
        huy: "Đã hủy",
    };

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const data = await orderAPI.getAll();
            setOrders(data);
        } catch (err) {
            console.error(err);
            alert("Lỗi khi lấy đơn hàng");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchCustomers = async () => {
        try {
            const data = await customerAPI.getAll();
            setCustomers(data);
        } catch (err) {
            console.error('Lỗi khi lấy khách hàng', err);
        }
    };

    const fetchProducts = async () => {
        try {
            const data = await productAPI.getAll();
            setProducts(data);
        } catch (err) {
            console.error('Lỗi khi lấy sản phẩm', err);
        }
    };

    const handleSearch = async () => {
        try {
            const res = await orderAPI.search(query);
            setOrders(res);
        } catch (err) {
            console.error(err);
            alert("Lỗi tìm kiếm");
        }
    };

    const openAddModal = async () => {
        await Promise.all([fetchCustomers(), fetchProducts()]);
        setSelectedCustomer(undefined);
        setRecipientName("");
        setRecipientPhone("");
        setOrderItems([]);
        setShowAddModal(true);
    };

    const addProductLine = (productId: number) => {
        const p = products.find((x) => x.ma_san_pham === productId || x.id === productId);
        if (!p) return;
        const existing = orderItems.find((it) => it.ma_san_pham === (p.ma_san_pham || p.id));
        if (existing) {
            setOrderItems(orderItems.map(it => it.ma_san_pham === existing.ma_san_pham ? { ...it, so_luong: it.so_luong + 1 } : it));
        } else {
            setOrderItems([...orderItems, { ma_san_pham: p.ma_san_pham || p.id, ten_san_pham: p.ten_san_pham || p.ten_san_pham || p.ten_san_pham, so_luong: 1, don_gia: Number(p.gia_ban || p.gia || p.price || 0) }]);
        }
    };

    const removeProductLine = (ma_san_pham: number) => {
        setOrderItems(orderItems.filter(it => it.ma_san_pham !== ma_san_pham));
    };

    const setQtyFor = (ma_san_pham: number, qty: number) => {
        if (qty <= 0) return removeProductLine(ma_san_pham);
        setOrderItems(orderItems.map(it => it.ma_san_pham === ma_san_pham ? { ...it, so_luong: qty } : it));
    };

    const computeTotal = () => orderItems.reduce((s, it) => s + (it.so_luong || 0) * (it.don_gia || 0), 0);

    const handleCreateOrder = async () => {
        try {
            const chi_tiet = orderItems.map(it => ({ ma_san_pham: it.ma_san_pham, so_luong: it.so_luong, don_gia: it.don_gia }));
            const payload: any = { ma_khach_hang: selectedCustomer, ten_nguoi_nhan: recipientName || null, so_dien_thoai_nhan: recipientPhone || null, dia_chi_nhan: recipientAddress || null, tong_tien: computeTotal(), chi_tiet };
            await orderAPI.create(payload);
            alert('Tạo đơn hàng thành công');
            setShowAddModal(false);
            fetchOrders();
        } catch (err) {
            console.error('Lỗi tạo đơn', err);
            alert('Lỗi khi tạo đơn hàng');
        }
    };

    const handleViewDetail = async (id: number) => {
        try {
            const data = await orderAPI.getById(id);
            setDetail(data);
            setNewStatus(data.trang_thai || "cho_xu_ly");
        } catch (err) {
            console.error(err);
            alert("Lỗi khi lấy chi tiết");
        }
    };

    const handleUpdateStatus = async () => {
        if (!detail?.ma_don_hang) return;
        try {
            await orderAPI.updateStatus(detail.ma_don_hang, newStatus);
            alert('Cập nhật trạng thái thành công');
            // refresh list and detail
            fetchOrders();
            const updated = await orderAPI.getById(detail.ma_don_hang);
            setDetail(updated);
        } catch (err) {
            console.error(err);
            // show backend error message when available
            const msg = (err as any)?.response?.data?.message || (err as any)?.message || 'Lỗi khi cập nhật trạng thái';
            alert(msg);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl font-bold text-foreground">🧾 Quản lý đơn hàng</h1>
                <button onClick={openAddModal} className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-semibold transition shadow-sm">
                    Thêm đơn hàng
                </button>
            </div>

            <div className="flex items-center gap-2 w-full max-w-lg">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Tìm kiếm theo mã, khách, sản phẩm..."
                    className="w-full border border-input bg-background text-foreground rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                />
                <button onClick={handleSearch} className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-lg transition">
                    Tìm
                </button>
            </div>

            {loading ? (
                <p className="text-center text-muted-foreground py-8">Đang tải...</p>
            ) : orders.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Chưa có đơn hàng</p>
            ) : (
                <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted/50 text-muted-foreground">
                                <tr>
                                    <th className="p-4 font-medium">Mã đơn</th>
                                    <th className="p-4 font-medium">Khách</th>
                                    <th className="p-4 font-medium">Người nhận</th>
                                    <th className="p-4 font-medium">SĐT nhận</th>
                                    <th className="p-4 font-medium">Thời gian</th>
                                    <th className="p-4 font-medium">Tổng tiền</th>
                                    <th className="p-4 font-medium">Trạng thái</th>
                                    <th className="p-4 font-medium">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {orders.map((o) => (
                                    <tr key={o.ma_don_hang} className="hover:bg-muted/50 transition-colors">
                                        <td className="p-4 text-foreground">{o.ma_don_hang}</td>
                                        <td className="p-4 text-foreground">{o.ten_khach_hang || ('#' + (o.ma_khach_hang ?? '-'))}</td>
                                        <td className="p-4 text-foreground">{o.ten_nguoi_nhan || '-'}</td>
                                        <td className="p-4 text-foreground">{o.so_dien_thoai_nhan || '-'}</td>
                                        <td className="p-4 text-foreground">{o.thoi_gian_mua}</td>
                                        <td className="p-4 text-foreground">{o.tong_tien}</td>
                                        <td className="p-4 text-foreground">{(o.trang_thai && (o.trang_thai === 'cho_xu_ly' ? 'Chờ xử lý' : o.trang_thai === 'hoan_tat' ? 'Hoàn thành' : o.trang_thai === 'huy' ? 'Đã hủy' : o.trang_thai)) || 'Chờ xử lý'}</td>
                                        <td className="p-4">
                                            <button onClick={() => handleViewDetail(o.ma_don_hang!)} className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-3 py-1 rounded text-xs transition">
                                                Chi tiết
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Add Order Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card text-card-foreground rounded-lg p-6 max-w-3xl w-full shadow-xl max-h-screen overflow-y-auto border border-border">
                        <h3 className="text-2xl font-bold mb-4">Thêm đơn hàng mới</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Khách hàng </label>
                                <select className="w-full border border-input bg-background text-foreground px-3 py-2 rounded mt-1 focus:ring-2 focus:ring-ring focus:outline-none" value={selectedCustomer ?? ''} onChange={(e) => setSelectedCustomer(e.target.value ? Number(e.target.value) : undefined)}>

                                    {customers.map(c => (
                                        <option key={c.ma_khach_hang} value={c.ma_khach_hang}>{c.ho_ten} {c.so_dien_thoai ? `(${c.so_dien_thoai})` : ''}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Tên người nhận</label>
                                <input className="w-full border border-input bg-background text-foreground px-3 py-2 rounded mt-1 focus:ring-2 focus:ring-ring focus:outline-none" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Số điện thoại người nhận</label>
                                <input className="w-full border border-input bg-background text-foreground px-3 py-2 rounded mt-1 focus:ring-2 focus:ring-ring focus:outline-none" value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Địa chỉ nhận</label>
                                <input className="w-full border border-input bg-background text-foreground px-3 py-2 rounded mt-1 focus:ring-2 focus:ring-ring focus:outline-none" value={recipientAddress} onChange={(e) => setRecipientAddress(e.target.value)} />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="text-sm font-medium text-muted-foreground">Thêm sản phẩm</label>
                            <div className="flex gap-2 mt-2">
                                <select id="add-product-select" className="flex-1 border border-input bg-background text-foreground px-3 py-2 rounded focus:ring-2 focus:ring-ring focus:outline-none" defaultValue="">
                                    <option value="">-- Chọn sản phẩm --</option>
                                    {products.map(p => (
                                        <option key={p.ma_san_pham || p.id} value={p.ma_san_pham || p.id}>{p.ten_san_pham || p.ten || p.name} - {p.gia_ban ?? p.gia ?? p.price}đ</option>
                                    ))}
                                </select>
                                <button className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2 rounded transition" onClick={() => {
                                    const sel = (document.getElementById('add-product-select') as HTMLSelectElement).value;
                                    if (sel) addProductLine(Number(sel));
                                }}>Thêm</button>
                            </div>
                        </div>

                        <div className="overflow-x-auto mb-4 border border-border rounded-md">
                            <table className="w-full border-collapse text-sm">
                                <thead>
                                    <tr className="bg-muted/50 text-muted-foreground">
                                        <th className="p-2 text-left">Sản phẩm</th>
                                        <th className="p-2 text-left">Số lượng</th>
                                        <th className="p-2 text-left">Đơn giá</th>
                                        <th className="p-2 text-left">Thành tiền</th>
                                        <th className="p-2 text-left">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {orderItems.map(it => (
                                        <tr key={it.ma_san_pham}>
                                            <td className="p-2 text-foreground">{it.ten_san_pham || ('#' + it.ma_san_pham)}</td>
                                            <td className="p-2">
                                                <input type="number" min={1} className="w-20 border border-input bg-background text-foreground px-2 py-1 rounded" value={it.so_luong} onChange={(e) => setQtyFor(it.ma_san_pham, Number(e.target.value))} />
                                            </td>
                                            <td className="p-2 text-foreground">{it.don_gia}</td>
                                            <td className="p-2 text-foreground">{(it.so_luong * it.don_gia)}</td>
                                            <td className="p-2"><button className="text-destructive hover:text-destructive/80" onClick={() => removeProductLine(it.ma_san_pham)}>Xóa</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-between items-center border-t border-border pt-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Tổng tiền</p>
                                <p className="font-bold text-lg text-foreground">{computeTotal()} đ</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setShowAddModal(false)} className="bg-muted hover:bg-muted/80 text-muted-foreground px-4 py-2 rounded transition">Hủy</button>
                                <button onClick={handleCreateOrder} className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded transition">Tạo đơn</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {detail && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card text-card-foreground rounded-lg p-6 max-w-2xl w-full shadow-xl max-h-screen overflow-y-auto border border-border">
                        <h3 className="text-2xl font-bold mb-4">Chi tiết đơn hàng #{detail.ma_don_hang}</h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Khách hàng</p>
                                <p className="font-semibold text-foreground">{detail.ten_khach_hang}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Người nhận</p>
                                <p className="font-semibold text-foreground">{detail.ten_nguoi_nhan || '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">SĐT nhận</p>
                                <p className="font-semibold text-foreground">{detail.so_dien_thoai_nhan || '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Địa chỉ nhận</p>
                                <p className="font-semibold text-foreground">{detail.dia_chi_nhan || detail.dia_chi || '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Ngày mua</p>
                                <p className="font-semibold text-foreground">{detail.thoi_gian_mua}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Trạng thái</p>
                                <div className="flex items-center gap-3 mt-1">
                                    <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="border border-input bg-background text-foreground rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring">
                                        {statuses.map((s) => (
                                            <option key={s} value={s}>{statusLabels[s]}</option>
                                        ))}
                                    </select>
                                    <button onClick={handleUpdateStatus} className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-2 rounded transition text-sm">Lưu</button>
                                </div>
                            </div>
                        </div>
                        <h4 className="font-semibold mb-3 text-foreground">Danh sách sản phẩm</h4>
                        <div className="overflow-x-auto mb-4 border border-border rounded-md">
                            <table className="w-full border-collapse text-sm">
                                <thead>
                                    <tr className="bg-muted/50 text-muted-foreground">
                                        <th className="p-2 text-left">Sản phẩm</th>
                                        <th className="p-2 text-left">Số lượng</th>
                                        <th className="p-2 text-left">Đơn giá</th>
                                        <th className="p-2 text-left">Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {detail.items?.map((it: any, idx: number) => (
                                        <tr key={idx}>
                                            <td className="p-2 text-foreground">{it.ten_san_pham}</td>
                                            <td className="p-2 text-foreground">{it.so_luong}</td>
                                            <td className="p-2 text-foreground">{it.don_gia}</td>
                                            <td className="p-2 text-foreground">{it.so_luong * it.don_gia}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="text-right pt-4 border-t border-border">
                            <p className="font-bold text-foreground">Tổng cộng: {detail.tong_tien}đ</p>
                            <button onClick={() => setDetail(null)} className="bg-muted hover:bg-muted/80 text-muted-foreground px-4 py-2 rounded mt-2 transition">Đóng</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Orders;
