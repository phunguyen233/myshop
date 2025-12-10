import axios from "./axiosClient";

export const receiptAPI = {
  add: async (ma_nguyen_lieu: number, payload: any) => {
    const res = await axios.post(`/ingredient-receipts/${ma_nguyen_lieu}`, payload);
    return res.data;
  },
  listByIngredient: async (ma_nguyen_lieu: number) => {
    const res = await axios.get(`/ingredient-receipts/${ma_nguyen_lieu}`);
    return res.data;
  }
};
