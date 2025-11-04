import axiosClient from "./axiosClient";

export interface LoginData {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

const authAPI = {
  // Đăng nhập admin
  login: (data: LoginData): Promise<LoginResponse> => {
    const url = "/auth/login";
    return axiosClient.post(url, data);
  },

  // Lấy thông tin người dùng hiện tại
  getCurrentUser: (): Promise<LoginResponse["user"]> => {
    const url = "/auth/me";
    return axiosClient.get(url);
  },
};

export default authAPI;
