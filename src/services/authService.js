import api from './api';

const AUTH_BASE = '/authenticate';

export const authService = {
  register(data) {
    return api.post(`${AUTH_BASE}/register`, data);
  },

  login(data) {
    return api.post(`${AUTH_BASE}/login`, data);
  },

  logout(refreshToken) {
    return api.post(`${AUTH_BASE}/logout`, { refreshToken });
  },

  refreshToken(refreshToken) {
    return api.post(`${AUTH_BASE}/refresh`, { refreshToken });
  },

  verifyOtp(data) {
    return api.post(`${AUTH_BASE}/verify-otp`, data);
  },

  generateOtp(data) {
    return api.post(`${AUTH_BASE}/generate-otp`, data);
  },

  changePassword(data) {
    return api.post(`${AUTH_BASE}/change-password`, data);
  },

  forgotPassword(data) {
    return api.post(`${AUTH_BASE}/forgot-password`, data);
  },
};
