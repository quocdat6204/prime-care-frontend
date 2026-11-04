/**
 * utils/errorMessage.js
 * 
 * Bảng dịch và chuyển đổi toàn bộ thông báo lỗi từ Backend / Axios / Hệ thống sang Tiếng Việt.
 * Đảm bảo người dùng cuối chỉ nhìn thấy thông báo thuần Việt rõ ràng, dễ hiểu.
 */

const ERROR_TRANSLATIONS = [
  // 1. User & Authentication (user-service ErrorCode.java)
  { pattern: /username already exists/i, vi: 'Tên đăng nhập đã tồn tại, vui lòng chọn tên khác' },
  { pattern: /email already exists/i, vi: 'Địa chỉ email này đã được sử dụng bởi tài khoản khác' },
  { pattern: /user not found/i, vi: 'Không tìm thấy thông tin tài khoản người dùng' },
  { pattern: /admin cannot be fixed/i, vi: 'Không thể chỉnh sửa hoặc thao tác trên tài khoản Quản trị viên cấp cao' },
  { pattern: /username or password is wrong/i, vi: 'Tên đăng nhập hoặc mật khẩu không chính xác' },
  { pattern: /unauthenticated/i, vi: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' },
  { pattern: /do not have permission/i, vi: 'Bạn không có quyền thực hiện thao tác này' },
  { pattern: /unauthorized/i, vi: 'Bạn không có quyền truy cập hoặc thực hiện hành động này' },
  { pattern: /user account is inactive/i, vi: 'Tài khoản chưa được kích hoạt. Vui lòng xác thực mã OTP gửi về email.' },
  { pattern: /invalid or expired otp/i, vi: 'Mã OTP không chính xác hoặc đã hết hạn' },
  { pattern: /user account is locked/i, vi: 'Tài khoản của bạn hiện đang bị khóa. Vui lòng liên hệ quản trị viên.' },
  { pattern: /old password is incorrect/i, vi: 'Mật khẩu cũ không chính xác' },
  { pattern: /email does not match with username/i, vi: 'Email không khớp với tên đăng nhập đã đăng ký' },

  // 2. Clinic & Medical Service (clinic-service ErrorCode.java)
  { pattern: /already have an active appointment in this session/i, vi: 'Bạn đã có lịch hẹn trong ca khám này rồi, không thể đặt trùng lặp!' },
  { pattern: /session is full/i, vi: 'Ca khám này đã đủ số lượng bệnh nhân, vui lòng chọn ca khám khác!' },
  { pattern: /session is closed or in the past/i, vi: 'Ca khám này đã đóng hoặc đã qua thời gian tiếp nhận!' },
  { pattern: /exam date cannot be in the past/i, vi: 'Ngày khám không thể ở trong quá khứ!' },
  { pattern: /only unpaid pending appointments can be cancelled/i, vi: 'Chỉ có thể hủy lịch hẹn chưa thanh toán đang trong thời gian giữ chỗ!' },
  { pattern: /appointment must be paid and confirmed/i, vi: 'Lịch hẹn phải được thanh toán và xác nhận trước khi khám!' },
  { pattern: /appointment is not awaiting payment/i, vi: 'Lịch hẹn không ở trạng thái chờ thanh toán!' },
  { pattern: /service is cancelled or already paid/i, vi: 'Dịch vụ đã được thanh toán hoặc đã bị hủy bỏ!' },
  { pattern: /service is inactive/i, vi: 'Dịch vụ y tế này hiện đang tạm ngưng phục vụ!' },
  { pattern: /resource not found/i, vi: 'Không tìm thấy dữ liệu yêu cầu' },
  { pattern: /data conflict occurred/i, vi: 'Dữ liệu bị trùng lặp hoặc xung đột với bản ghi khác' },
  { pattern: /invalid request/i, vi: 'Yêu cầu không hợp lệ, vui lòng kiểm tra lại thông tin' },
  { pattern: /uncategorized error/i, vi: 'Lỗi hệ thống chưa được phân loại, vui lòng thử lại sau' },

  // 3. Validation Annotations (Jakarta Bean Validation)
  { pattern: /email format is invalid/i, vi: 'Định dạng địa chỉ email không hợp lệ' },
  { pattern: /email must not exceed/i, vi: 'Email không được vượt quá độ dài cho phép' },
  { pattern: /full name must not exceed/i, vi: 'Họ và tên không được vượt quá 255 ký tự' },
  { pattern: /phone must not exceed/i, vi: 'Số điện thoại không được vượt quá 20 ký tự' },
  { pattern: /address must not exceed/i, vi: 'Địa chỉ không được vượt quá 500 ký tự' },
  { pattern: /password must be at least/i, vi: 'Mật khẩu phải có độ dài tối thiểu 8 ký tự' },

  // 4. Axios & Network Errors
  { pattern: /network error/i, vi: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng!' },
  { pattern: /timeout of/i, vi: 'Yêu cầu phản hồi quá lâu (quá thời gian chờ). Vui lòng thử lại.' },
  { pattern: /status code 400/i, vi: 'Dữ liệu gửi lên không hợp lệ, vui lòng kiểm tra lại' },
  { pattern: /status code 401/i, vi: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' },
  { pattern: /status code 403/i, vi: 'Bạn không có quyền thực hiện thao tác này' },
  { pattern: /status code 404/i, vi: 'Không tìm thấy máy chủ hoặc dữ liệu yêu cầu (404)' },
  { pattern: /status code 409/i, vi: 'Dữ liệu bị trùng lặp trong hệ thống (409)' },
  { pattern: /status code 500/i, vi: 'Máy chủ nội bộ gặp sự cố. Vui lòng liên hệ quản trị viên hoặc thử lại sau.' },
  { pattern: /status code (502|503|504)/i, vi: 'Cổng dịch vụ tạm thời không phản hồi. Vui lòng thử lại sau giây lát.' },

  // 5. Supabase / Storage
  { pattern: /upload failed/i, vi: 'Tải tệp tin lên thất bại, vui lòng kiểm tra lại' },
  { pattern: /delete failed/i, vi: 'Xóa tệp tin thất bại' },
  { pattern: /bucket not found/i, vi: 'Không tìm thấy thư mục lưu trữ' },
  { pattern: /row-level security/i, vi: 'Không đủ quyền truy cập kho lưu trữ ảnh' },

  // 6. Email Service Errors
  { pattern: /cannot send email via brevo/i, vi: 'Không thể gửi email qua Brevo. Vui lòng kiểm tra lại địa chỉ hoặc API Key.' },
  { pattern: /email provider error/i, vi: 'Dịch vụ Brevo phản hồi không hợp lệ.' },

  // 6. Generic Common Terms
  { pattern: /failed to fetch/i, vi: 'Không thể tải dữ liệu từ máy chủ' },
  { pattern: /bad credentials/i, vi: 'Tên đăng nhập hoặc mật khẩu không chính xác' },
  { pattern: /token.*expired/i, vi: 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.' },
];

// Kiểm tra xem chuỗi có chứa ký tự tiếng Việt có dấu hay không
const VIETNAMESE_ACCENT_REGEX = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;

/**
 * Chuyển đổi một chuỗi thông điệp hoặc mã lỗi sang Tiếng Việt
 * @param {string} message - Thông điệp gốc
 * @param {string} defaultMessage - Thông điệp tiếng Việt mặc định nếu không khớp
 * @returns {string} - Thông điệp tiếng Việt
 */
export function translateErrorMessage(message, defaultMessage = 'Đã có lỗi xảy ra. Vui lòng thử lại sau.') {
  if (!message || typeof message !== 'string') {
    return defaultMessage;
  }

  const trimmed = message.trim();
  if (!trimmed) {
    return defaultMessage;
  }

  // Nếu thông báo đã có dấu tiếng Việt chuẩn thì giữ nguyên
  if (VIETNAMESE_ACCENT_REGEX.test(trimmed)) {
    return trimmed;
  }

  // Duyệt bảng dịch regex
  for (const item of ERROR_TRANSLATIONS) {
    if (item.pattern.test(trimmed)) {
      return item.vi;
    }
  }

  // Nếu là chuỗi tiếng Anh không xác định, trả về defaultMessage tiếng Việt
  return defaultMessage;
}

/**
 * Rút trích thông điệp tiếng Việt an toàn từ đối tượng error (Axios Error / Error instance / string)
 * @param {any} err - Đối tượng lỗi bắt được từ catch(err)
 * @param {string} fallbackViMessage - Câu thông báo tiếng Việt mặc định
 * @returns {string}
 */
export function getErrorMessage(err, fallbackViMessage = 'Đã có lỗi xảy ra, vui lòng thử lại!') {
  if (!err) return fallbackViMessage;

  // Nếu truyền trực tiếp chuỗi
  if (typeof err === 'string') {
    return translateErrorMessage(err, fallbackViMessage);
  }

  // Lấy message từ cấu trúc phản hồi Backend Spring Boot: { code, message, result }
  const beMessage =
    err.response?.data?.message ||
    err.response?.data?.error ||
    err.response?.data?.detail;

  if (beMessage && typeof beMessage === 'string') {
    return translateErrorMessage(beMessage, fallbackViMessage);
  }

  // Lấy message từ Error object tiêu chuẩn (e.g. Network Error, AxiosError)
  if (err.message && typeof err.message === 'string') {
    return translateErrorMessage(err.message, fallbackViMessage);
  }

  return fallbackViMessage;
}

