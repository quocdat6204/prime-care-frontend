import api from './api';

// Phân tích phim X-quang toàn cảnh (xray-service, chỉ bác sĩ)
export const xrayService = {
  /** Danh sách mô hình, mô hình mặc định và ngưỡng mặc định */
  getModels() {
    return api.get('/xray/models');
  },

  /**
   * Gửi một phim X-quang để phát hiện tổn thương.
   * @param {File} file Ảnh JPG/PNG
   * @param {string} model 'v4_lite' | 'v3_fast'
   */
  analyze(file, model) {
    const formData = new FormData();
    formData.append('file', file);
    if (model) formData.append('model', model);
    // Để axios tự đặt Content-Type kèm boundary của multipart
    return api.post('/xray/analyze', formData, {
      headers: { 'Content-Type': undefined },
      timeout: 120000,
    });
  },
};
