import api from './api';

const STATISTIC_BASE = '/api/statistics';

export const statisticService = {
  /**
   * API 1: Báo cáo tổng quan KPI Dashboard theo tháng
   * @param {Object} params - { month: number, year: number }
   */
  getOverview(params) {
    return api.get(`${STATISTIC_BASE}/overview`, { params });
  },

  /**
   * API 2: Thống kê doanh thu theo thời gian
   * @param {Object} params - { from: string, to: string, groupBy?: 'DAY' | 'MONTH' }
   */
  getRevenue(params) {
    return api.get(`${STATISTIC_BASE}/revenue`, { params });
  },

  /**
   * API 3: Thống kê cơ cấu doanh thu theo loại dịch vụ
   * @param {Object} params - { from: string, to: string }
   */
  getRevenueByServiceType(params) {
    return api.get(`${STATISTIC_BASE}/revenue/by-service-type`, { params });
  },

  /**
   * API 4: Thống kê số lượng lượt khám theo thời gian
   * @param {Object} params - { from: string, to: string, groupBy?: 'DAY' | 'MONTH' }
   */
  getAppointmentStats(params) {
    return api.get(`${STATISTIC_BASE}/appointments`, { params });
  },

  /**
   * API 5: Thống kê lượt khám phân bổ theo ca trực (Sáng / Chiều)
   * @param {Object} params - { from: string, to: string }
   */
  getAppointmentsByShift(params) {
    return api.get(`${STATISTIC_BASE}/appointments/by-shift`, { params });
  },

  /**
   * API 6: Báo cáo hiệu suất bác sĩ
   * @param {Object} params - { from: string, to: string }
   */
  getDoctorPerformance(params) {
    return api.get(`${STATISTIC_BASE}/doctors/performance`, { params });
  },

  /**
   * API 7: Thống kê tăng trưởng bệnh nhân mới
   * @param {Object} params - { from: string, to: string, groupBy?: 'MONTH' | 'DAY' | 'YEAR' }
   */
  getPatientGrowth(params) {
    return api.get(`${STATISTIC_BASE}/patients/growth`, { params });
  },

  /**
   * API 8: Top dịch vụ nha khoa chỉ định nhiều nhất
   * @param {Object} params - { from: string, to: string, limit?: number }
   */
  getTopServices(params) {
    return api.get(`${STATISTIC_BASE}/services/top`, { params });
  },

  /**
   * API 9: Top thuốc kê đơn nhiều nhất
   * @param {Object} params - { from: string, to: string, limit?: number }
   */
  getTopMedications(params) {
    return api.get(`${STATISTIC_BASE}/medications/top`, { params });
  },

  /**
   * API 10: Tổng kết thanh toán & cổng ngân hàng VNPAY
   * @param {Object} params - { from: string, to: string }
   */
  getPaymentSummary(params) {
    return api.get(`${STATISTIC_BASE}/payments/summary`, { params });
  },

  /**
   * API Giám sát hạ tầng: Kiểm tra trạng thái hoạt động thực tế của 5 vi dịch vụ (User, Clinic, Payment, Email, Statistic)
   */
  getSystemHealth() {
    return api.get(`${STATISTIC_BASE}/system/health`);
  },
};

