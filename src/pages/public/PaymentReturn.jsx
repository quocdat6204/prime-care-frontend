import { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { paymentService } from '../../services/paymentService';
import { useToast } from '../../context/ToastContext';

export default function PaymentReturn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const processedRef = useRef(false);

  useEffect(() => {
    // Ngăn chặn chạy lặp lại nhiều lần (gây ra vòng lặp vô tận và đẻ ra hàng loạt toast)
    if (processedRef.current) return;
    processedRef.current = true;

    // 1. Sao chép các tham số VNPay để gửi lên backend xác thực
    const currentParams = Object.fromEntries(searchParams.entries());

    // 2. Xóa ngay lập tức các tham số nhạy cảm của VNPay khỏi thanh URL trình duyệt
    window.history.replaceState({}, '', '/payment-return');

    const processReturn = async () => {
      try {
        const res = await paymentService.handlePaymentReturn(currentParams);
        const result = res.data?.result;

        if (result?.success) {
          // Chuyển hướng sang trang lịch hẹn (trang lịch hẹn sẽ hiển thị 1 thông báo thành công duy nhất)
          navigate('/patient/appointments?paymentSuccess=true', { replace: true });
        } else {
          toast.error(result?.message || 'Thanh toán không thành công');
          navigate('/patient/appointments?paymentSuccess=false', { replace: true });
        }
      } catch (err) {
        toast.error('Có lỗi xảy ra khi xác thực giao dịch thanh toán.');
        navigate('/patient/appointments', { replace: true });
      }
    };

    processReturn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ padding: '80px 20px', textAlign: 'center' }}>
      <div className="spinner spinner-lg" style={{ margin: '0 auto 16px' }} />
      <h2>Đang xác thực kết quả thanh toán VNPay...</h2>
      <p style={{ color: 'var(--gray-500)', marginTop: 8 }}>Vui lòng đợi trong giây lát, hệ thống đang chuyển về trang lịch hẹn của bạn.</p>
    </div>
  );
}
