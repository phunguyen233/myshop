import axiosClient from "./axiosClient";
import type { Customer } from "../types/Customer";

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
  tong_tien?: number;
  trang_thai?: string;
  items?: OrderItem[];
  ten_khach_hang?: string;
  dia_chi?: string;
  nam_sinh?: string;
  ten_nguoi_nhan?: string;
  so_dien_thoai_nhan?: string;
  dia_chi_nhan?: string;
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
  create: async (payload: { ma_khach_hang?: number; ten_nguoi_nhan?: string; so_dien_thoai_nhan?: string; dia_chi_nhan?: string; tong_tien: number; chi_tiet: OrderItem[] }) => {
    const res = await axiosClient.post(endpoint, payload);
    return res.data;
  },
  search: async (q: string) => {
    const res = await axiosClient.get(`${endpoint}/search`, { params: { q } });
    return res.data;
  },
  updateStatus: async (id: number, trang_thai: string) => {
    const url = `${endpoint}/${id}/status`;
    console.debug('orderAPI.updateStatus ->', url, { trang_thai });
    const res = await axiosClient.put(url, { trang_thai });
    return res.data;
  },
};

export default orderAPI;
