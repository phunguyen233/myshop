import axios from "axios";

const axiosClient = axios.create({
  baseURL: "https://bepmam-backend.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach token automatically if present
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosClient;
