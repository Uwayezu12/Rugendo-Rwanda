import api from './api.js';

export const bookingService = {
  async searchSchedules(params) {
    const { data } = await api.get('/schedules/search', { params });
    return data;
  },

  async getScheduleById(id) {
    const { data } = await api.get(`/schedules/${id}`);
    return data;
  },

  async createBooking(payload) {
    const { data } = await api.post('/bookings', payload);
    return data;
  },

  async getMyBookings() {
    const { data } = await api.get('/bookings/my');
    return data;
  },

  async getBookingById(id) {
    const { data } = await api.get(`/bookings/${id}`);
    return data;
  },

  async cancelBooking(id) {
    const { data } = await api.patch(`/bookings/${id}/cancel`);
    return data;
  },

  // Simulated payment. method: 'simulated' (success) | 'fail' (simulated failure)
  async payBooking({ bookingId, method = 'simulated' }) {
    const { data } = await api.post('/payments/pay', { bookingId, method });
    return data;
  },
};
