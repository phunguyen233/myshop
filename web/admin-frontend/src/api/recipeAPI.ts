import axios from "./axiosClient";

export const recipeAPI = {
  getAll: async () => {
    const res = await axios.get(`/recipes/`);
    return res.data;
  },
  create: async (payload: any) => {
    const res = await axios.post(`/recipes/`, payload);
    return res.data;
  },
  getByProduct: async (productId: number) => {
    const res = await axios.get(`/recipes/product/${productId}`);
    return res.data;
  }
};
