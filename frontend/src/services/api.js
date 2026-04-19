import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("rugendo-access-token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem("rugendo-refresh-token");

        const { data } = await axios.post(
          `${API_BASE_URL}/api/auth/refresh`,
          { refreshToken },
          { withCredentials: true },
        );

        const newAccess = data.data?.accessToken || data.accessToken;
        const newRefresh = data.data?.refreshToken || data.refreshToken;

        localStorage.setItem("rugendo-access-token", newAccess);
        if (newRefresh)
          localStorage.setItem("rugendo-refresh-token", newRefresh);

        original.headers.Authorization = `Bearer ${newAccess}`;
        return api(original);
      } catch {
        localStorage.removeItem("rugendo-access-token");
        localStorage.removeItem("rugendo-refresh-token");
        localStorage.removeItem("rugendo-user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default api;
