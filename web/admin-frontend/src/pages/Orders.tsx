import React, { useEffect, useState } from "react";
import { orderAPI, Order } from "../api/orderAPI";
import { productAPI } from "../api/productAPI";
import { customerAPI } from "../api/customerAPI";
import { ingredientAPI } from "../api/ingredientAPI";

const Orders: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);
    const [query, setQuery] = useState("");
    const [selectedStatus, setSelectedStatus] = useState<'all' | 'cho_xu_ly' | 'da_thanh_toan' | 'dang_giao' | 'hoan_tat' | 'huy'>('all');
    const [detail, setDetail] = useState<Order | null>(null);
    const [newStatus, setNewStatus] = useState<string>("");
    const [filterOpen, setFilterOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [shipFee, setShipFee] = useState<number | null>(null);
    const [packagingOptions, setPackagingOptions] = useState<any[]>([]);
    const [packagedItems, setPackagedItems] = useState<Array<{ ma_nguyen_lieu: number; ten_nguyen_lieu?: string; so_luong: number; don_gia: number }>>([]);
    const [voucherType, setVoucherType] = useState<'amount' | 'percent'>('amount');
    const [voucherValue, setVoucherValue] = useState<number>(0);
    const [selectedPackagingId, setSelectedPackagingId] = useState<number | null>(null);
    const [packQty, setPackQty] = useState<number>(1);
    const [showAddModal, setShowAddModal] = useState(false);
    const [customers, setCustomers] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);

    // add order form state
    const [selectedCustomer, setSelectedCustomer] = useState<number | undefined>(undefined);
    // recipient name removed from schema
    const [recipientPhone, setRecipientPhone] = useState("");
    const [recipientAddress, setRecipientAddress] = useState("");
    const [deliveryTime, setDeliveryTime] = useState<string | null>(null);
    const [orderItems, setOrderItems] = useState<Array<{ ma_san_pham: number; ten_san_pham?: string; so_luong: number; don_gia: number }>>([]);
    const [orderFieldErrors, setOrderFieldErrors] = useState<{ customer?: string; items?: string; phone?: string; address?: string }>({});

    // Use enum values from your DB: 'cho_xu_ly','da_thanh_toan','dang_giao','hoan_tat','huy'
    const statuses = ["cho_xu_ly", "da_thanh_toan", "dang_giao", "hoan_tat", "huy"];
    const statusLabels: Record<string, string> = {
        cho_xu_ly: "Chờ xử lý",
        da_thanh_toan: "Đã thanh toán",
        dang_giao: "Đang giao",
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
        setRecipientPhone("");
        setDeliveryTime(null);
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
        // client-side validation: only require at least one product line
        const errs: { items?: string } = {};
        if (!orderItems || orderItems.length === 0) errs.items = 'Vui lòng thêm ít nhất một sản phẩm';
        if (Object.keys(errs).length) {
            setOrderFieldErrors(errs as any);
            alert('Vui lòng thêm ít nhất một sản phẩm để tạo đơn hàng');
            return;
        }
        setOrderFieldErrors({});

        try {
            const chi_tiet = orderItems.map(it => ({ ma_san_pham: it.ma_san_pham, so_luong: it.so_luong, don_gia: it.don_gia }));
            const payload: any = { ma_khach_hang: selectedCustomer, so_dien_thoai_nhan: recipientPhone || null, dia_chi_nhan: recipientAddress || null, thoi_gian_giao: deliveryTime || undefined, tong_tien: computeTotal(), chi_tiet };
            await orderAPI.create(payload);
            alert('Tạo đơn hàng thành công');
            setShowAddModal(false);
            fetchOrders();
            // notify dashboard/statistics to refresh totals
            try { window.dispatchEvent(new Event('statsUpdated')); } catch (e) { /* ignore */ }
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
            setShipFee(typeof data.tien_ship !== 'undefined' && data.tien_ship !== null ? Number(data.tien_ship) : 0);
            setVoucherValue(typeof data.so_tien_giam === 'number' ? Number(data.so_tien_giam) : 0);
            setVoucherType('amount');
            // load packaging options (ingredients of type 'dong_goi')
            try {
                const ingr = await ingredientAPI.getAll();
                const packs = (ingr || []).filter((i:any) => i.loai_nguyen_lieu === 'dong_goi');
                setPackagingOptions(packs);
            } catch (e) {
                console.error('Không thể tải nguyên liệu đóng gói', e);
                setPackagingOptions([]);
            }
            setPackagedItems([]);
        } catch (err) {
            console.error(err);
            alert("Lỗi khi lấy chi tiết");
        }
    };

    const handleAddPackagedItem = async () => {
        if (!selectedPackagingId) return alert('Vui lòng chọn nguyên liệu đóng gói');
        if (!packQty || packQty <= 0) return alert('Số lượng phải lớn hơn 0');
        try {
            // get current warehouse aggregated quantities
            const wh = await ingredientAPI.getWarehouse();
            const w = (wh || []).find((x:any) => Number(x.ma_nguyen_lieu) === Number(selectedPackagingId));
            const available = w ? Number(w.warehouse_qty || 0) : (packagingOptions.find(p => p.ma_nguyen_lieu === selectedPackagingId)?.so_luong_ton || 0);
            if (available < packQty) {
                return alert('Trong kho không đủ nguyên liệu đóng gói cho số lượng này');
            }

            const p = packagingOptions.find(x => x.ma_nguyen_lieu === selectedPackagingId);
            if (!p) return alert('Nguyên liệu đóng gói không tồn tại');
            const perUnit = (Number(p.gia_nhap || 0) && Number(p.so_luong_ton || 0) > 0) ? (Number(p.gia_nhap || 0) / Number(p.so_luong_ton || 1)) : Number(p.gia_nhap || 0);
            const existing = packagedItems.find(it => it.ma_nguyen_lieu === selectedPackagingId);
            if (existing) {
                setPackagedItems(packagedItems.map(it => it.ma_nguyen_lieu === existing.ma_nguyen_lieu ? { ...it, so_luong: it.so_luong + packQty } : it));
            } else {
                setPackagedItems([...packagedItems, { ma_nguyen_lieu: p.ma_nguyen_lieu, ten_nguyen_lieu: p.ten_nguyen_lieu, so_luong: packQty, don_gia: perUnit }]);
            }
        } catch (e) {
            console.error('Lỗi kiểm tra kho đóng gói', e);
            alert('Không thể kiểm tra kho đóng gói');
        }
    };

    const handleUpdateStatus = async () => {
        if (!detail?.ma_don_hang) return;
        try {
            const previousStatus = detail.trang_thai;
            // validate allowed transitions on client side too
            const allowedTransitions: Record<string, string[]> = {
                cho_xu_ly: ['da_thanh_toan','huy'],
                da_thanh_toan: ['dang_giao'],
                dang_giao: ['da_thanh_toan','hoan_tat'],
                hoan_tat: [],
                huy: []
            };
            if (previousStatus === 'huy' || previousStatus === 'hoan_tat') {
                alert('Đơn hàng ở trạng thái này không được chỉnh trạng thái.');
                return;
            }
            if (previousStatus && previousStatus !== newStatus) {
                const allowed = allowedTransitions[previousStatus] || [];
                if (!allowed.includes(newStatus)) {
                    alert('Không được phép chuyển trạng thái từ "' + (previousStatus || '') + '" sang "' + (newStatus || '') + '"');
                    return;
                }
            }

            // require ship fee when saving to 'da_thanh_toan'
            if (newStatus === 'da_thanh_toan' && (shipFee === null || typeof shipFee === 'undefined')) {
                alert('Vui lòng nhập tiền ship trước khi lưu trạng thái Đã thanh toán.');
                return;
            }

            const resp: any = await orderAPI.updateStatus(detail.ma_don_hang, newStatus, shipFee ?? undefined, packagedItems.length ? packagedItems : undefined, voucherType, voucherValue);
            alert(resp?.message || 'Cập nhật trạng thái thành công');
            // refresh list and detail
            fetchOrders();
            const updated = await orderAPI.getById(detail.ma_don_hang);
            // attach packaged items locally so UI shows packaged totals
            const packaged_total = packagedItems.reduce((s, it) => s + (it.so_luong || 0) * (it.don_gia || 0), 0);
            setDetail({ ...updated, packagedItems, packaged_total });
            // If the backend returned deductions, notify Ingredients page to refresh and show summary
            try {
                if (resp?.deductions && Array.isArray(resp.deductions) && resp.deductions.length > 0) {
                    // dispatch a global event so Ingredients page can refresh
                    window.dispatchEvent(new CustomEvent('ingredientsUpdated', { detail: { deductions: resp.deductions } }));
                    // build a short summary for the admin
                    const lines = resp.deductions.map((d: any) => {
                        const name = d.ten_nguyen_lieu || d.ma_nguyen_lieu;
                        const before = Number(d.before || 0);
                        const after = Number(d.after || 0);
                        const unit = d.don_vi || '';
                        return `${name}: ${before}${unit} → ${after}${unit}`;
                    });
                    alert('Đã trừ nguyên liệu theo công thức:\n' + lines.join('\n'));
                }

                // revenue/stat updates
                if (previousStatus !== 'da_thanh_toan' && newStatus === 'da_thanh_toan') {
                    const amount = Number(updated.tong_tien || 0);
                    window.dispatchEvent(new CustomEvent('statsUpdated', { detail: { orderCompletedAmount: amount } }));
                } else if (previousStatus === 'da_thanh_toan' && newStatus !== 'da_thanh_toan') {
                    const amount = Number(updated.tong_tien || 0);
                    window.dispatchEvent(new CustomEvent('statsUpdated', { detail: { orderRevertedAmount: amount } }));
                } else {
                    window.dispatchEvent(new Event('statsUpdated'));
                }
            } catch (e) { /* ignore */ }
        } catch (err) {
            console.error(err);
            // show backend error message when available
            const msg = (err as any)?.response?.data?.message || (err as any)?.message || 'Lỗi khi cập nhật trạng thái';
            alert(msg);
        }
    };

    // client-side filter based on selectedStatus and selectedDate (delivery date YYYY-MM-DD)
    const displayedOrders = orders.filter(o => {
        if (selectedStatus !== 'all' && o.trang_thai !== selectedStatus) return false;
        if (selectedDate) {
            const t = o.thoi_gian_giao || '';
            if (!t.startsWith(selectedDate)) return false;
        }
        return true;
    });

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl font-bold text-foreground"> Quản lý đơn hàng</h1>
            </div>

            <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Tìm kiếm theo mã, khách, sản phẩm..."
                        className="w-64 border border-input bg-background text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                    />
                    <button onClick={handleSearch} className="bg-gray-200 text-gray-800 hover:bg-gray-300 px-3 py-2 rounded-lg transition">
                        Tìm
                    </button>
                </div>
                <div>
                    <button onClick={openAddModal} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition shadow-sm">
                        Thêm đơn hàng
                    </button>
                </div>
            </div>

                    <div className="mt-3">
                        <div className="relative inline-block">
                            <button onClick={() => setFilterOpen(v => !v)} className="px-4 py-2 rounded border bg-white text-gray-800 min-w-[160px] text-left">
                                {statusLabels[selectedStatus] || 'Bộ lọc'}
                            </button>
                            {filterOpen && (
                                <div className="absolute mt-2 bg-white border border-border rounded shadow-md z-50 w-48">
                                    {['all', 'da_thanh_toan', 'dang_giao', 'hoan_tat', 'huy', 'cho_xu_ly'].map((s:any) => (
                                        <button key={s} onClick={() => { setSelectedStatus(s as any); setFilterOpen(false); }} className={`block w-full text-left px-4 py-2 whitespace-nowrap hover:bg-gray-100 ${selectedStatus === s ? 'bg-muted/50 font-semibold' : ''}`}>
                                            {statusLabels[s] || s}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="inline-block ml-3 align-middle">
                            <input type="date" value={selectedDate ?? ''} onChange={(e) => setSelectedDate(e.target.value || null)} className="border border-input rounded px-3 py-2" />
                            {selectedDate && <button onClick={() => setSelectedDate(null)} className="ml-2 px-2 py-1 text-sm border rounded">Xóa</button>}
                        </div>
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
                                    <th className="p-4 font-medium">Thời gian giao</th>
                                    <th className="p-4 font-medium">SĐT nhận</th>
                                    <th className="p-4 font-medium">Thời gian mua</th>
                                    <th className="p-4 font-medium">Tổng tiền</th>
                                    <th className="p-4 font-medium">Lãi</th>
                                    <th className="p-4 font-medium">Trạng thái</th>
                                    <th className="p-4 font-medium">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {displayedOrders.map((o) => (
                                    <tr key={o.ma_don_hang} className="hover:bg-muted/50 transition-colors">
                                        <td className="p-4 text-foreground">{o.ma_don_hang}</td>
                                        <td className="p-4 text-foreground">{o.ten_khach_hang || ('#' + (o.ma_khach_hang ?? '-'))}</td>
                                        <td className="p-4 text-foreground">{o.thoi_gian_giao || ''}</td>
                                        <td className="p-4 text-foreground">{o.so_dien_thoai_nhan || '-'}</td>
                                        <td className="p-4 text-foreground">{o.thoi_gian_mua}</td>
                                        <td className="p-4 text-foreground">{Number(o.tong_tien || 0).toLocaleString('vi-VN')}₫</td>
                                        <td className="p-4 text-foreground">{Number(o.profit || 0).toLocaleString('vi-VN')}₫</td>
                                        <td className="p-4 text-foreground">
                                            {o.trang_thai === 'hoan_tat' ? (
                                                <span className="inline-block px-2 py-1 rounded-full bg-green-600 text-white text-sm font-semibold">Hoàn thành</span>
                                            ) : o.trang_thai === 'da_thanh_toan' ? (
                                                <span className="inline-block px-2 py-1 rounded-full bg-emerald-600 text-white text-sm font-semibold">Đã thanh toán</span>
                                            ) : o.trang_thai === 'dang_giao' ? (
                                                <span className="inline-block px-2 py-1 rounded-full bg-yellow-500 text-white text-sm font-semibold">Đang giao</span>
                                            ) : o.trang_thai === 'huy' ? (
                                                <span className="inline-block px-2 py-1 rounded-full bg-red-600 text-white text-sm font-semibold">Đã hủy</span>
                                            ) : (
                                                <span className="inline-block px-2 py-1 rounded-full bg-gray-200 text-gray-800 text-sm font-semibold">Chờ xử lý</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <button onClick={() => handleViewDetail(o.ma_don_hang!)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-xs transition">
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
                                <select className={`w-full border border-input bg-background text-foreground px-3 py-2 rounded mt-1 focus:ring-2 focus:ring-black focus:outline-none ${orderFieldErrors.customer ? 'border-red-500' : ''}`} value={selectedCustomer ?? ''} onChange={(e) => setSelectedCustomer(e.target.value ? Number(e.target.value) : undefined)}>

                                    <option value="">-- Chọn khách --</option>
                                    {customers.map(c => (
                                        <option key={c.ma_khach_hang} value={c.ma_khach_hang}>{c.ho_ten} {c.so_dien_thoai ? `(${c.so_dien_thoai})` : ''}</option>
                                    ))}
                                </select>
                                {orderFieldErrors.customer && <p className="text-red-600 text-xs mt-1">{orderFieldErrors.customer}</p>}
                            </div>
                            
                                                            <div>
                                                                <label className="text-sm font-medium text-muted-foreground">Số điện thoại người nhận</label>
                                                                <input className={`w-full border border-input bg-background text-foreground px-3 py-2 rounded mt-1 focus:ring-2 focus:ring-black focus:outline-none ${orderFieldErrors.phone ? 'border-red-500' : ''}`} value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} />
                                                                {orderFieldErrors.phone && <p className="text-red-600 text-xs mt-1">{orderFieldErrors.phone}</p>}
                                                            </div>
                                                            <div>
                                                                <label className="text-sm font-medium text-muted-foreground">Thời gian giao</label>
                                                                <input type="datetime-local" value={deliveryTime ?? ''} onChange={(e) => setDeliveryTime(e.target.value || null)} className="w-full border border-input bg-background text-foreground px-3 py-2 rounded mt-1 focus:ring-2 focus:ring-black focus:outline-none" />
                                                            </div>
                                                            <div>
                                                                <label className="text-sm font-medium text-muted-foreground">Địa chỉ nhận</label>
                                <input className={`w-full border border-input bg-background text-foreground px-3 py-2 rounded mt-1 focus:ring-2 focus:ring-black focus:outline-none ${orderFieldErrors.address ? 'border-red-500' : ''}`} value={recipientAddress} onChange={(e) => setRecipientAddress(e.target.value)} />
                                {orderFieldErrors.address && <p className="text-red-600 text-xs mt-1">{orderFieldErrors.address}</p>}
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="text-sm font-medium text-muted-foreground">Thêm sản phẩm</label>
                            <div className="flex gap-2 mt-2">
                                <select id="add-product-select" className="flex-1 border border-input bg-background text-foreground px-3 py-2 rounded focus:ring-2 focus:ring-black focus:outline-none" defaultValue="">
                                    <option value="">-- Chọn sản phẩm --</option>
                                    {products.map(p => (
                                        <option key={p.ma_san_pham || p.id} value={p.ma_san_pham || p.id}>{p.ten_san_pham || p.ten || p.name} - {p.gia_ban ?? p.gia ?? p.price}đ</option>
                                    ))}
                                </select>
                                <button className="bg-white border border-gray-300 text-gray-800 px-4 py-2 rounded transition hover:bg-blue-600 hover:text-white" onClick={() => {
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
                                            <td className="p-2">
                                                <button onClick={() => removeProductLine(it.ma_san_pham)} className="border border-border px-3 py-1 rounded text-foreground hover:bg-red-600 hover:text-white transition">Xóa</button>
                                            </td>
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
                                    <button onClick={() => setShowAddModal(false)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded transition">Hủy</button>
                                    <button onClick={handleCreateOrder} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition">Tạo đơn</button>
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
                                <p className="text-sm text-muted-foreground">SĐT nhận</p>
                                <p className="font-semibold text-foreground">{detail.so_dien_thoai_nhan || '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Địa chỉ nhận</p>
                                <p className="font-semibold text-foreground">{detail.dia_chi_nhan || detail.dia_chi || '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Thời gian giao</p>
                                <p className="font-semibold text-foreground">{detail.thoi_gian_giao || ''}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Ngày mua</p>
                                <p className="font-semibold text-foreground">{detail.thoi_gian_mua}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Trạng thái</p>
                                    <div className="flex items-center gap-3 mt-1">
                                                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="border border-input bg-background text-foreground rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black">
                                                    {statuses.map((s) => {
                                                        // compute whether this target status should be disabled based on current status
                                                        const current = detail?.trang_thai || '';
                                                        const allowedTransitions: Record<string, string[]> = {
                                                            cho_xu_ly: ['da_thanh_toan','huy'],
                                                            da_thanh_toan: ['dang_giao'],
                                                            dang_giao: ['hoan_tat'],
                                                            hoan_tat: [],
                                                            huy: []
                                                        };
                                                        let disabled = false;
                                                        if (current === 'huy' || current === 'hoan_tat') {
                                                            disabled = s !== current; // don't allow changing when in these states
                                                        } else if (current && current !== s) {
                                                            const allowed = allowedTransitions[current] || [];
                                                            if (!allowed.includes(s)) disabled = true;
                                                        }
                                                        return <option key={s} value={s} disabled={disabled}>{statusLabels[s]}</option>;
                                                    })}
                                                </select>
                                                <button onClick={handleUpdateStatus} disabled={detail?.trang_thai === 'huy' || detail?.trang_thai === 'hoan_tat'} className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded transition text-sm disabled:opacity-50">Lưu</button>
                                    </div>
                                            {(newStatus === 'dang_giao') && (
                                                <div className="mt-3 space-y-3">
                                                    <div>
                                                        <label className="text-sm font-medium text-muted-foreground">Nguyên liệu đóng gói</label>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <select value={selectedPackagingId ?? ''} onChange={(e) => setSelectedPackagingId(e.target.value ? Number(e.target.value) : null)} className="border border-input rounded px-2 py-1 w-40 truncate">
                                                                <option value="">-- Chọn nguyên liệu đóng gói --</option>
                                                                {packagingOptions.map(p => (
                                                                    <option key={p.ma_nguyen_lieu} value={p.ma_nguyen_lieu}>{p.ten_nguyen_lieu}</option>
                                                                ))}
                                                            </select>
                                                            <input type="number" min={1} value={packQty} onChange={(e) => setPackQty(Number(e.target.value))} className="w-20 border border-input rounded px-2 py-1 text-sm text-center" />
                                                            <button onClick={handleAddPackagedItem} className="px-3 py-2 bg-blue-600 text-white rounded">Thêm</button>
                                                        </div>
                                                        {packagedItems.length > 0 && (
                                                            <div className="mt-2">
                                                                <table className="w-full text-sm">
                                                                    <thead>
                                                                        <tr className="text-muted-foreground">
                                                                            <th className="p-2 text-left w-[40%]">Nguyên liệu</th>
                                                                            <th className="p-2 text-center w-20">Số lượng</th>
                                                                            <th className="p-2 text-right w-28">Đơn giá</th>
                                                                            <th className="p-2 text-right w-28">Thành tiền</th>
                                                                            <th className="p-2 text-center w-16">X</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {packagedItems.map((it, idx) => (
                                                                            <tr key={idx} className="border-t">
                                                                                <td className="p-2 max-w-[180px] truncate">{it.ten_nguyen_lieu}</td>
                                                                                <td className="p-2 text-center">{it.so_luong}</td>
                                                                                <td className="p-2 text-right">{Number(it.don_gia || 0).toLocaleString('vi-VN')}₫</td>
                                                                                <td className="p-2 text-right">{Number((it.so_luong || 0) * (it.don_gia || 0)).toLocaleString('vi-VN')}₫</td>
                                                                                <td className="p-2 text-center"><button onClick={() => setPackagedItems(packagedItems.filter((_, i) => i !== idx))} className="px-2 py-1 rounded border">Xóa</button></td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-medium text-muted-foreground">Tiền ship (VNĐ)</label>
                                                        <input type="number" min={0} value={shipFee ?? 0} onChange={(e) => setShipFee(Number(e.target.value))} className="w-48 border border-input rounded px-3 py-2 mt-1 text-foreground" />
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-medium text-muted-foreground">Voucher giảm giá</label>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <select value={voucherType} onChange={(e) => setVoucherType(e.target.value as any)} className="border border-input rounded px-2 py-1">
                                                                <option value="amount">Số tiền (VNĐ)</option>
                                                                <option value="percent">Phần trăm (%)</option>
                                                            </select>
                                                            <input type="number" min={0} value={voucherValue} onChange={(e) => setVoucherValue(Number(e.target.value))} className="w-40 border border-input rounded px-2 py-1" />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
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
                            <p className="font-medium text-foreground">Tiền ship: {Number(detail.tien_ship ?? 0).toLocaleString('vi-VN')}₫</p>
                            <p className="font-medium text-foreground">Tổng đóng gói: {Number(detail.tien_dong_goi ?? detail.packaged_total ?? 0).toLocaleString('vi-VN')}₫</p>
                            <p className="font-medium text-foreground">Tiền giảm: {Number(detail.so_tien_giam ?? 0).toLocaleString('vi-VN')}₫</p>
                            <p className="font-bold text-foreground">Tổng hàng: {Number(detail.total_after_discount ?? detail.tong_tien ?? 0).toLocaleString('vi-VN')}₫</p>
                            <div className="flex justify-end items-center gap-2">
                                <button onClick={() => setDetail(null)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded mt-2 transition">Đóng</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Orders;