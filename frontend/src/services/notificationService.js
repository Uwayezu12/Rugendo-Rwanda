import api from './api.js';

export const notificationService = {
  async getNotifications(params = {}) {
    const { data } = await api.get('/notifications', { params });
    return data.data;
  },

  async getUnreadCount() {
    const { data } = await api.get('/notifications/unread-count');
    return data.data;
  },

  async markAsRead(id) {
    const { data } = await api.patch(`/notifications/${id}/read`);
    return data.data;
  },

  async markAllRead() {
    const { data } = await api.patch('/notifications/read-all');
    return data.data;
  },

  async archiveNotification(id) {
    const { data } = await api.patch(`/notifications/${id}/archive`);
    return data.data;
  },
};
