import axios from "./axiosClient";

export const unitAPI = {
  getAll: async () => {
    const res = await axios.get(`/units/`);
    return res.data;
  },
  add: async (payload: { ten: string; he_so_quy_doi: number }) => {
    const res = await axios.post(`/units/`, payload);
    return res.data;
  },
};
