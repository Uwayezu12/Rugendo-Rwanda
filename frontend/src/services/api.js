import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // send refresh token cookie
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('rugendo-access-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 — attempt token refresh, then retry once
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('rugendo-refresh-token');
        const { data } = await axios.post('/api/auth/refresh', { refreshToken }, { withCredentials: true });
        const newAccess = data.data?.accessToken || data.accessToken;
        const newRefresh = data.data?.refreshToken || data.refreshToken;
        localStorage.setItem('rugendo-access-token', newAccess);
        if (newRefresh) localStorage.setItem('rugendo-refresh-token', newRefresh);
        original.headers.Authorization = `Bearer ${newAccess}`;
        return api(original);
      } catch {
        // Refresh failed — clear session and redirect
        localStorage.removeItem('rugendo-access-token');
        localStorage.removeItem('rugendo-user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
