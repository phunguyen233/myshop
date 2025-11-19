import axiosClient from "./axiosClient";

export interface WarehouseEntry {
  ma_nhap?: number;
  thoi_gian_nhap?: string;
  don_vi_nhap: string;
  tong_gia_tri?: number;
}

const endpoint = "/warehouse";

export const warehouseAPI = {
  getAll: async (): Promise<any[]> => {
    const res = await axiosClient.get(endpoint);
    return res.data;
  },
  create: async (payload: any) => {
    const res = await axiosClient.post(endpoint, payload);
    return res.data;
  },
};

export default warehouseAPI;
