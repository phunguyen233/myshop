import axios from "./axiosClient";

export const ingredientAPI = {
  getAll: async () => {
    const res = await axios.get(`/ingredients/`);
    return res.data;
  },
  add: async (payload: any) => {
    const res = await axios.post(`/ingredients/`, payload);
    return res.data;
  },
  getById: async (id: number) => {
    const res = await axios.get(`/ingredients/${id}`);
    return res.data;
  }
};
