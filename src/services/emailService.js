import api from './api';

export const emailService = {
  /**
   * Lấy lịch sử gửi email có phân trang và bộ lọc (Dành cho ADMIN)
   * @param {Object} params - { page, size, status, keyword }
   */
  getHistories(params = {}) {
    return api.get('/emails/history', { params });
  },

  /**
   * Gửi email trực tiếp qua Brevo
   * @param {Object} data - { to, subject, htmlContent }
   */
  sendEmail(data) {
    return api.post('/emails/send', data);
  },
};

