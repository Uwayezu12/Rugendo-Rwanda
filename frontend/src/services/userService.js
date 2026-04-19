import api from './api.js';

export const userService = {
  async getProfile() {
    const { data } = await api.get('/users/me');
    return data;
  },

  async updateProfile(payload) {
    const { data } = await api.patch('/users/me', payload);
    return data;
  },

  async deleteAccount() {
    const { data } = await api.delete('/users/me');
    return data;
  },
};
