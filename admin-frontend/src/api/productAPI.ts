import axiosClient from "./axiosClient";
import { Product } from "../types/Product";

export const productAPI = {
  getAll: async (): Promise<Product[]> => {
    const res = await axiosClient.get("/products");
    return res.data;
  },
  create: async (data: Product) => {
    const res = await axiosClient.post("/products", data);
    return res.data;
  },
  update: async (id: number, data: Product) => {
    const res = await axiosClient.put(`/products/${id}`, data);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await axiosClient.delete(`/products/${id}`);
    return res.data;
  },
};
