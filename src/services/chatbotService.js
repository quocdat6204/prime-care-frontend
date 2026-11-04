import api from './api';

export const chatbotService = {
  /**
   * Gửi tin nhắn đến Trợ lý AI Nha Khoa
   * @param {string} message Câu hỏi của người dùng
   * @param {string} conversationId Mã phiên trò chuyện (tùy chọn)
   */
  sendMessage(message, conversationId = null) {
    return api.post('/chatbot/message', { message, conversationId });
  },

  /**
   * Lấy lịch sử trò chuyện đã lưu trong Redis của người dùng
   */
  getHistory() {
    return api.get('/chatbot/history');
  },

  /**
   * Xóa lịch sử trò chuyện trong Redis để làm mới ngữ cảnh
   */
  clearHistory() {
    return api.delete('/chatbot/history');
  },

  /**
   * Kiểm tra trạng thái hoạt động của chatbot-service
   */
  checkHealth() {
    return api.get('/chatbot/health');
  },
};
