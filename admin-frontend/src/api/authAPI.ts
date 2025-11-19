import axiosClient from "./axiosClient";

const endpoint = "/auth";

export const authAPI = {
  register: async (payload: { ten_dang_nhap: string; mat_khau: string; ho_ten?: string; email?: string; so_dien_thoai?: string }) => {
    const res = await axiosClient.post(`${endpoint}/register`, payload);
    return res.data;
  },
  login: async (payload: { ten_dang_nhap: string; mat_khau: string }) => {
    const res = await axiosClient.post(`${endpoint}/login`, payload);
    return res.data;
  },
};

export default authAPI;
