# Frontend DentalCare - Hệ Thống Đặt Lịch Khám Nha Khoa

Ứng dụng Frontend React (Vite) dành cho phòng khám chuyên khoa Răng - Hàm - Mặt, kết nối trực tiếp với `user-service` qua API Gateway (Port 9000).

---

## 🌟 Tính Năng Nổi Bật

1. **Giao Diện Theo Từng Vai Trò (`Role-based UI`):**
   - 🧑 **Bệnh nhân (`PATIENT`):** Tông màu Soft Teal nhẹ nhàng. Đăng ký & kích hoạt mã OTP qua email, xem/sửa thông tin hồ sơ (địa chỉ, số điện thoại, giới tính), đổi mật khẩu cá nhân.
   - 🩺 **Bác sĩ Nha khoa (`DOCTOR`):** Tông màu Medical Blue tin cậy. Hiển thị học hàm/học vị (`PROFESSOR` - GS, `DOCTORATE` - TS, `MASTER` - ThS), đổi ảnh đại diện (Avatar) tải lên lưu trữ Supabase Storage, bảng điều khiển ca khám.
   - 🛡️ **Quản trị viên (`ADMIN`):** Tông màu Indigo chuyên nghiệp. Thống kê số lượng, quản lý người dùng với phân trang & lọc role, Khóa/Mở khóa tài khoản, tạo Bác sĩ mới (chọn học hàm, tải ảnh đại diện Supabase).

2. **Cơ Chế Tự Động Refresh Token (Axios Interceptor):**
   - Lưu trữ `accessToken` và `refreshToken` an toàn tại Client.
   - Tự động bắt lỗi `401 Unauthorized` khi `accessToken` hết hạn, gọi API `/authenticate/refresh` để nhận `accessToken` mới và retry các request ngầm mà không làm gián đoạn trải nghiệm người dùng.

3. **Hàm Dùng Chung Supabase Storage (`supabaseService.js`):**
   - Đóng gói logic upload file lên bucket Supabase (`dental-assets`).
   - Có thể tái sử dụng dễ dàng cho avatar, phim chụp X-quang răng (X-Ray/CT ConeBeam) và hồ sơ bệnh án sau này.

4. **Tương Thích Thiết Bị Di Động (Mobile-First):**
   - Thanh điều hướng thông minh tự động chuyển sang Mobile Bottom Nav trên màn hình điện thoại.
   - Bảng biểu có thanh cuộn ngang `table-responsive`, modal co giãn theo kích thước màn hình cảm ứng.

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy

### 1. Cấu hình biến môi trường
Kiểm tra hoặc tạo file `.env` từ `.env.example`:
```env
VITE_API_URL=http://localhost:9000
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
VITE_SUPABASE_BUCKET=dental-assets
```

### 2. Cài đặt thư viện
```bash
cd FE
npm install
```

### 3. Khởi chạy môi trường phát triển (Dev Server)
```bash
npm run dev
```
Truy cập tại: `http://localhost:5173`

### 4. Build phiên bản triển khai (Production Build)
```bash
npm run build
```
