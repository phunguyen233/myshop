import axiosClient from "./axiosClient";

export interface OrderItem {
  id?: number;
  ma_don_hang?: number;
  ma_san_pham: number;
  so_luong: number;
  don_gia: number;
  ten_san_pham?: string;
}

export interface Order {
  ma_don_hang?: number;
  ma_khach_hang?: number;
  thoi_gian_mua?: string;
  thoi_gian_giao?: string;
  tong_tien?: number;
  trang_thai?: string;
  items?: OrderItem[];
  ten_khach_hang?: string;
  dia_chi?: string;
  nam_sinh?: string;
  so_dien_thoai_nhan?: string;
  dia_chi_nhan?: string;
  tien_ship?: number;
  profit?: number;
  tien_dong_goi?: number;
  packagedItems?: Array<{ ma_nguyen_lieu: number; ten_nguyen_lieu?: string; so_luong: number; don_gia: number }>;
  packaged_total?: number;
  product_total?: number;
  so_tien_giam?: number;
  total_after_discount?: number;
}

const endpoint = "/orders";

export const orderAPI = {
  getAll: async (): Promise<Order[]> => {
    const res = await axiosClient.get(endpoint);
    return res.data;
  },
  getById: async (id: number): Promise<Order> => {
    const res = await axiosClient.get(`${endpoint}/${id}`);
    return res.data;
  },
  create: async (payload: { ma_khach_hang?: number; so_dien_thoai_nhan?: string; dia_chi_nhan?: string; thoi_gian_giao?: string; tien_ship?: number; tong_tien: number; chi_tiet: OrderItem[]; so_tien_giam?: number }) => {
    const res = await axiosClient.post(endpoint, payload);
    return res.data;
  },
  search: async (q: string) => {
    const res = await axiosClient.get(`${endpoint}/search`, { params: { q } });
    return res.data;
  },
  updateStatus: async (id: number, trang_thai: string, tien_ship?: number, packagedItems?: any[], voucherType?: 'amount' | 'percent', voucherValue?: number) => {
    const url = `${endpoint}/${id}/status`;
    const payload: any = { trang_thai };
    if (typeof tien_ship === 'number') payload.tien_ship = tien_ship;
    if (Array.isArray(packagedItems) && packagedItems.length > 0) payload.packaged_items = packagedItems;
    if (voucherType && typeof voucherValue !== 'undefined') {
      // prefer explicit type+value; backend will compute so_tien_giam
      payload.voucher_type = voucherType;
      payload.voucher_value = voucherValue;
    }
    console.debug('orderAPI.updateStatus ->', url, payload);
    const res = await axiosClient.put(url, payload);
    return res.data;
  },
};

export default orderAPI;
