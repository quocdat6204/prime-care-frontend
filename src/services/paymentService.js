import api from './api';

export const paymentService = {
  /**
   * Khởi tạo giao dịch thanh toán VNPay (EXAMINATION hoặc SERVICES)
   * @param {Object} data - { appointmentId, type, serviceItemIds }
   */
  createPayment(data) {
    return api.post('/api/vnpay/create-payment', data);
  },

  /**
   * Thu tiền mặt tại quầy cho các dịch vụ chỉ định (Dành cho ADMIN)
   * @param {Object} data - { appointmentId, type: 'SERVICES', serviceItemIds }
   */
  payWithCash(data) {
    return api.post('/api/vnpay/cash-payment', data);
  },

  /**
   * Xử lý kết quả trả về từ VNPay (nếu gọi từ Frontend)
   * @param {Object} params
   */
  handlePaymentReturn(params) {
    return api.get('/api/vnpay/payment-return', { params });
  },

  /**
   * Lấy danh sách tất cả hóa đơn (Dành cho ADMIN)
   * @param {Object} params - { status, page, size, sort }
   */
  getInvoices(params = {}) {
    return api.get('/api/vnpay/invoices', { params });
  },

  /**
   * Lấy danh sách các lần giao dịch của một hóa đơn (Dành cho ADMIN)
   * @param {number|string} invoiceId
   */
  getTransactionsByInvoice(invoiceId) {
    return api.get(`/api/vnpay/invoices/${invoiceId}/transactions`);
  },

  /**
   * Lấy danh sách hóa đơn theo lịch hẹn khám
   * @param {number|string} appointmentId
   */
  getInvoicesByAppointment(appointmentId) {
    return api.get(`/api/vnpay/appointments/${appointmentId}/invoices`);
  },
};

