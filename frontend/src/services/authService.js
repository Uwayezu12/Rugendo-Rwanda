import api from './api.js';

export const authService = {
  async register(payload) {
    const { data } = await api.post('/auth/register', payload);
    return data;
  },

  async login({ identifier, password }) {
    const { data } = await api.post('/auth/login', { identifier, password });
    if (data.data?.accessToken) {
      localStorage.setItem('rugendo-access-token', data.data.accessToken);
      localStorage.setItem('rugendo-refresh-token', data.data.refreshToken);
    }
    return data.data;
  },

  async googleAuth(credential) {
    const { data } = await api.post('/auth/google', { credential });
    if (data.data?.accessToken) {
      localStorage.setItem('rugendo-access-token', data.data.accessToken);
      localStorage.setItem('rugendo-refresh-token', data.data.refreshToken);
    }
    return data.data;
  },

  async logout() {
    try {
      const refreshToken = localStorage.getItem('rugendo-refresh-token');
      await api.post('/auth/logout', { refreshToken });
    } finally {
      localStorage.removeItem('rugendo-access-token');
      localStorage.removeItem('rugendo-refresh-token');
      localStorage.removeItem('rugendo-user');
    }
  },

  async getMe() {
    const { data } = await api.get('/me');
    return data.data;
  },

  async forgotPassword(email) {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data;
  },

  async resetPassword({ token, password }) {
    const { data } = await api.post('/auth/reset-password', { token, password });
    return data;
  },
};
