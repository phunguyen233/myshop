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
  },
  update: async (id: number, payload: any) => {
    const res = await axios.put(`/ingredients/${id}`, payload);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await axios.delete(`/ingredients/${id}`);
    return res.data;
  }
};

export default ingredientAPI;
