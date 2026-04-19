import api from './api.js';

export const boardingService = {
  // Look up a booking by reference (RW-XXXXXXXX format).
  // Returns { data: [...bookings], message }
  async searchBookings(query) {
    const { data } = await api.get('/boarding/lookup', { params: { query } });
    return data;
  },

  async validateBoarding(payload) {
    const { data } = await api.post('/boarding/validate', payload);
    return data;
  },
};
