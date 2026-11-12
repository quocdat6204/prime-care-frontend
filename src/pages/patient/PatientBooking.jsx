import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Calendar, Clock, User, Stethoscope, Sparkles, CheckCircle2,
  AlertCircle, ChevronRight, CreditCard, X,
  ArrowRight, ArrowLeft, RefreshCw, Check
} from 'lucide-react';
import { clinicService } from '../../services/clinicService';
import { userService } from '../../services/userService';
import { paymentService } from '../../services/paymentService';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils/errorMessage';
import { formatDoctorRank } from '../../utils/doctorRank';

// Format YYYY-MM-DD theo giờ địa phương (tránh lệch timezone UTC)
const formatLocalDate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Tạo danh sách ĐÚNG 5 NGÀY từ ngày hôm nay
const get5DaysFromToday = () => {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 5; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = formatLocalDate(d);
    const weekday = d.toLocaleDateString('vi-VN', { weekday: 'long' });
    const formattedDate = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    days.push({
      dateStr,
      displayWeekday: i === 0 ? 'Hôm nay' : i === 1 ? 'Ngày mai' : weekday,
      formattedDate,
      isToday: i === 0,
      fullDateLabel: d.toLocaleDateString('vi-VN', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
    });
  }
  return days;
};

// Component hiển thị Avatar Bác sĩ có fallback chữ cái đầu nếu ảnh lỗi hoặc chưa có
function DoctorAvatar({ avatar, name, size = 48 }) {
  const [hasError, setHasError] = useState(false);
  const initial = (name || 'B')[0].toUpperCase();

  if (avatar && !hasError) {
    return (
      <img
        src={avatar}
        alt={name}
        onError={() => setHasError(true)}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          border: '2px solid #ccfbf1',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 800,
        fontSize: size >= 48 ? '1.15rem' : '0.9rem',
        flexShrink: 0,
        boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)',
      }}
    >
      {initial}
    </div>
  );
}

export default function PatientBooking() {
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fiveDays = get5DaysFromToday();

  const paramDate = searchParams.get('date');
  const paramSymptom = searchParams.get('symptom') || '';
  const paramDoctorId = searchParams.get('doctorId');

  // Chế độ đặt lịch:
  // null: Màn hình chọn ban đầu (2 lựa chọn: theo ngày hoặc theo bác sĩ)
  // 'BY_DATE': Đặt theo ngày khám (luồng hiện tại)
  // 'BY_DOCTOR': Đặt theo bác sĩ (dropdown chọn bác sĩ + hiện tất cả ca trong 5 ngày tới)
  const [bookingMode, setBookingMode] = useState(
    paramDoctorId ? 'BY_DOCTOR' : paramDate ? 'BY_DATE' : null
  );

  // --- STATE CHẾ ĐỘ: ĐẶT THEO NGÀY ---
  const initialDay = fiveDays.find((d) => d.dateStr === paramDate) || fiveDays[0];
  const [selectedDay, setSelectedDay] = useState(initialDay);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- STATE CHẾ ĐỘ: ĐẶT THEO BÁC SĨ ---
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState(paramDoctorId ? Number(paramDoctorId) : '');
  const [doctorSessionsByDay, setDoctorSessionsByDay] = useState({});
  const [loadingDoctorSessions, setLoadingDoctorSessions] = useState(false);

  // Chung
  const [currentTime, setCurrentTime] = useState(new Date());
  const [myActiveSessionIds, setMyActiveSessionIds] = useState(new Set());

  // Booking Modal State
  const [selectedSession, setSelectedSession] = useState(null);
  const [symptoms, setSymptoms] = useState(paramSymptom);
  const [submitting, setSubmitting] = useState(false);
  const [bookedAppointment, setBookedAppointment] = useState(null);
  const [paying, setPaying] = useState(false);

  // Đồng bộ lại khi URL đổi lúc đang ở sẵn trang này (ví dụ bấm nút "Đặt lịch hẹn" của chatbot):
  // useState chỉ đọc tham số URL ở lần mở trang đầu tiên nên phải cập nhật thủ công.
  useEffect(() => {
    if (paramDoctorId) {
      setBookingMode('BY_DOCTOR');
      setSelectedDoctorId(Number(paramDoctorId));
    } else if (paramDate) {
      setBookingMode('BY_DATE');
    }
    if (paramDate) {
      const day = fiveDays.find((d) => d.dateStr === paramDate);
      if (day) setSelectedDay((prev) => (prev.dateStr === day.dateStr ? prev : day));
    }
  }, [paramDate, paramDoctorId]);

  // Lấy danh sách các ca khám bệnh nhân đã đặt và đang hoạt động
  const fetchMyActiveAppointments = async () => {
    try {
      const res = await clinicService.getMyAppointments({ page: 0, size: 50 });
      const raw = res.data?.result;
      const list = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.content) ? raw.content : []);
      const activeIds = new Set(
        list
          .filter((a) => a && ['PENDING_PAYMENT', 'CONFIRMED', 'EXAMINING'].includes(a.status))
          .map((a) => a.sessionId)
          .filter(Boolean)
      );
      setMyActiveSessionIds(activeIds);
    } catch {
      // Bệnh nhân chưa đăng nhập hoặc lỗi mạng -> bỏ qua
    }
  };

  useEffect(() => {
    fetchMyActiveAppointments();
  }, []);

  // Cập nhật đồng hồ mỗi 30s để kiểm tra thời gian hết hạn ca trực
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Tải danh sách bác sĩ nha khoa từ User Service
  const fetchDoctors = async () => {
    setLoadingDoctors(true);
    try {
      const res = await userService.getDoctors();
      const raw = res.data?.result || [];
      const list = Array.isArray(raw) ? raw : [];
      setDoctors(list);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tải danh sách bác sĩ nha khoa'));
      setDoctors([]);
    } finally {
      setLoadingDoctors(false);
    }
  };

  // Tự động tải bác sĩ khi vào chế độ Đặt theo bác sĩ
  useEffect(() => {
    if (bookingMode === 'BY_DOCTOR' && doctors.length === 0) {
      fetchDoctors();
    }
  }, [bookingMode]);

  // Kiểm tra ca khám hết hạn nhận đặt lịch
  // Nếu là ngày hôm nay:
  // - Ca Sáng: sau 08:00 (>= 8*60) không cho phép đặt
  // - Ca Chiều: sau 13:30 (>= 13*60 + 30) không cho phép đặt
  const isSessionExpired = (sess, day) => {
    if (!sess || !day) return false;
    const now = currentTime;
    const todayStr = formatLocalDate(now);

    // Ngày trong quá khứ -> hết hạn
    if (day.dateStr < todayStr) return true;

    // Nếu chọn ngày hôm nay -> kiểm tra giờ bắt đầu ca
    if (day.dateStr === todayStr) {
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      if (sess.shift === 'MORNING' && currentMinutes >= 8 * 60) {
        return true;
      }
      if (sess.shift === 'AFTERNOON' && currentMinutes >= 13 * 60 + 30) {
        return true;
      }
    }

    return false;
  };

  // Tải danh sách ca khám theo 1 ngày (dành cho chế độ BY_DATE)
  const fetchSessions = async (dateStr) => {
    setLoading(true);
    try {
      const res = await clinicService.getAvailableSessions({ date: dateStr });
      const raw = res.data?.result;
      const list = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.content) ? raw.content : []);
      setSessions(list);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tải danh sách ca khám'));
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (bookingMode === 'BY_DATE' && selectedDay) {
      fetchSessions(selectedDay.dateStr);
    }
  }, [selectedDay, bookingMode]);

  // Tải toàn bộ ca khám trong 5 ngày tới của 1 bác sĩ (dành cho chế độ BY_DOCTOR)
  const fetchDoctor5DaysSessions = async (docId) => {
    if (!docId) {
      setDoctorSessionsByDay({});
      return;
    }
    setLoadingDoctorSessions(true);
    try {
      const results = await Promise.all(
        fiveDays.map((d) =>
          clinicService.getAvailableSessions({ date: d.dateStr, doctorId: docId })
        )
      );
      const mapping = {};
      fiveDays.forEach((d, idx) => {
        const raw = results[idx]?.data?.result;
        const list = Array.isArray(raw)
          ? raw
          : raw && Array.isArray(raw.content)
          ? raw.content
          : [];
        mapping[d.dateStr] = list;
      });
      setDoctorSessionsByDay(mapping);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tải lịch khám 5 ngày của bác sĩ'));
      setDoctorSessionsByDay({});
    } finally {
      setLoadingDoctorSessions(false);
    }
  };

  useEffect(() => {
    if (bookingMode === 'BY_DOCTOR' && selectedDoctorId) {
      fetchDoctor5DaysSessions(selectedDoctorId);
    }
  }, [selectedDoctorId, bookingMode]);

  // Mở modal đặt lịch khám (hỗ trợ truyền cả ngày tương ứng của ca đó)
  const handleOpenBooking = (session, day = selectedDay) => {
    if (myActiveSessionIds.has(session.id)) {
      toast.warning('Bạn đã có lịch hẹn trong ca khám này rồi. Vui lòng kiểm tra trang Lịch hẹn của tôi!');
      return;
    }
    if (isSessionExpired(session, day)) {
      toast.warning('Ca khám này đã qua thời gian tiếp nhận đặt lịch.');
      return;
    }
    const available = Number(session.availableSlots ?? session.maxPatients ?? 0);
    if (available <= 0) {
      toast.warning('Ca khám này đã đủ số lượng bệnh nhân.');
      return;
    }
    setSelectedDay(day);
    setSelectedSession(session);
    setSymptoms(paramSymptom || '');
    setBookedAppointment(null);
  };

  // Xác nhận đặt lịch khám
  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!selectedSession) return;
    if (myActiveSessionIds.has(selectedSession.id)) {
      toast.error('Bạn đã có lịch hẹn trong ca khám này rồi, không thể đặt trùng lặp!');
      return;
    }
    if (isSessionExpired(selectedSession, selectedDay)) {
      toast.error('Ca khám này đã qua thời gian tiếp nhận đặt lịch.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await clinicService.bookAppointment({
        sessionId: selectedSession.id,
        symptoms: symptoms.trim() || 'Khám răng tổng quát định kỳ',
      });
      const newApt = res.data?.result;
      setBookedAppointment(newApt);
      toast.success('Đặt lịch thành công! Vui lòng thanh toán tiền công khám để xác nhận lịch hẹn.');

      // Refresh dữ liệu cả 2 chế độ
      if (selectedDay) {
        fetchSessions(selectedDay.dateStr);
      }
      if (selectedDoctorId) {
        fetchDoctor5DaysSessions(selectedDoctorId);
      }
      fetchMyActiveAppointments();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Đặt lịch khám thất bại. Vui lòng thử lại sau.'));
    } finally {
      setSubmitting(false);
    }
  };

  // Khởi tạo thanh toán VNPay
  const handlePayNow = async () => {
    if (!bookedAppointment) return;
    setPaying(true);
    try {
      const res = await paymentService.createPayment({
        appointmentId: bookedAppointment.id,
        type: 'EXAMINATION',
        serviceItemIds: [],
      });
      const paymentUrl = res.data?.result?.paymentUrl;
      if (paymentUrl) {
        toast.info('Đang chuyển hướng sang cổng thanh toán VNPay...');
        window.location.href = paymentUrl;
      } else {
        toast.error('Không tìm thấy link thanh toán VNPay.');
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể khởi tạo thanh toán'));
    } finally {
      setPaying(false);
    }
  };

  // Làm mới dữ liệu theo chế độ hiện tại
  const handleRefresh = () => {
    if (bookingMode === 'BY_DOCTOR') {
      if (selectedDoctorId) {
        fetchDoctor5DaysSessions(selectedDoctorId);
      }
      fetchDoctors();
    } else {
      if (selectedDay) {
        fetchSessions(selectedDay.dateStr);
      }
    }
  };

  // Tìm bác sĩ đang chọn
  const currentSelectedDoctor = doctors.find((d) => d.id === selectedDoctorId);

  // =========================================================================
  // RENDER 1: MÀN HÌNH CHỌN BAN ĐẦU (2 LỰA CHỌN: THEO NGÀY HOẶC THEO BÁC SĨ)
  // =========================================================================
  if (bookingMode === null) {
    return (
      <div className="patient-booking-container">
        {/* Banner Header */}
        <div className="patient-booking-header">
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: '#0d9488',
                color: '#ffffff',
                padding: '4px 12px',
                borderRadius: 20,
                fontSize: '0.76rem',
                fontWeight: 800,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                marginBottom: 10,
              }}
            >
              <Sparkles size={13} />
              <span>HỆ THỐNG ĐẶT LỊCH NHA KHOA TRỰC TUYẾN</span>
            </div>

            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, margin: '0 0 6px', color: '#0f172a', letterSpacing: '-0.5px' }}>
              Chọn Hình Thức Đặt Lịch Khám
            </h1>
            <p style={{ margin: 0, fontSize: '0.92rem', color: '#475569', lineHeight: 1.5 }}>
              Vui lòng chọn hình thức đặt lịch phù hợp với nhu cầu của bạn để tiếp tục.
            </p>
          </div>
        </div>

        {/* 2 Lựa chọn đặt lịch */}
        <div className="patient-booking-modes-grid">
          {/* LỰA CHỌN 1: THEO NGÀY */}
          <div
            className="patient-booking-mode-card"
            onClick={() => setBookingMode('BY_DATE')}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    background: '#f0fdfa',
                    color: '#0d9488',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(13, 148, 136, 0.15)',
                  }}
                >
                  <Calendar size={28} />
                </div>
                <span
                  style={{
                    background: '#f0fdfa',
                    color: '#0d9488',
                    border: '1px solid #ccfbf1',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    padding: '4px 12px',
                    borderRadius: 20,
                    textTransform: 'uppercase',
                  }}
                >
                  Linh hoạt ngày
                </span>
              </div>

              <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0f172a', margin: '0 0 8px' }}>
                Đặt Lịch Theo Ngày
              </h2>
              <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.5, margin: '0 0 16px' }}>
                Chọn ngày bạn muốn đến khám trong 5 ngày tới. Hệ thống sẽ hiển thị toàn bộ các ca trực sáng/chiều của các bác sĩ trong ngày đó.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.84rem', color: '#334155' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Check size={16} color="#0d9488" />
                  <span>Chọn ngày theo thời gian rảnh của bạn</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Check size={16} color="#0d9488" />
                  <span>Xem tất cả các bác sĩ trực trong ngày</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Check size={16} color="#0d9488" />
                  <span>Chủ động so sánh số lượng chỗ khám</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              style={{
                background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 14,
                padding: '14px',
                fontWeight: 800,
                fontSize: '0.92rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 14px rgba(13, 148, 136, 0.25)',
              }}
            >
              <span>Chọn Đặt Theo Ngày</span>
              <ArrowRight size={17} />
            </button>
          </div>

          {/* LỰA CHỌN 2: THEO BÁC SĨ */}
          <div
            className="patient-booking-mode-card"
            onClick={() => setBookingMode('BY_DOCTOR')}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    background: '#eff6ff',
                    color: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)',
                  }}
                >
                  <Stethoscope size={28} />
                </div>
                <span
                  style={{
                    background: '#eff6ff',
                    color: '#2563eb',
                    border: '1px solid #bfdbfe',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    padding: '4px 12px',
                    borderRadius: 20,
                    textTransform: 'uppercase',
                  }}
                >
                  Ưu tiên bác sĩ
                </span>
              </div>

              <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0f172a', margin: '0 0 8px' }}>
                Đặt Lịch Theo Bác Sĩ
              </h2>
              <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.5, margin: '0 0 16px' }}>
                Chọn bác sĩ nha khoa mà bạn tin tưởng. Xem trọn vẹn toàn bộ các ca trực trong 5 ngày tới của bác sĩ mà không cần bấm chọn từng ngày.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.84rem', color: '#334155' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Check size={16} color="#2563eb" />
                  <span>Chọn bác sĩ nha khoa quen thuộc</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Check size={16} color="#2563eb" />
                  <span>Xem đầy đủ lịch 5 ngày trên một màn hình</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Check size={16} color="#2563eb" />
                  <span>Đặt giữ chỗ nhanh chóng theo ca phù hợp</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              style={{
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 14,
                padding: '14px',
                fontWeight: 800,
                fontSize: '0.92rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
              }}
            >
              <span>Chọn Đặt Theo Bác Sĩ</span>
              <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER 2: GIAO DIỆN CHÍNH (THEO NGÀY HOẶC THEO BÁC SĨ)
  // =========================================================================
  return (
    <div className="patient-booking-container">
      {/* 1. HEADER CÓ NÚT QUAY LẠI VÀ NÚT LÀM MỚI */}
      <div className="patient-booking-header">
        <div>
          {/* Nút quay lại chọn hình thức */}
          <button
            type="button"
            onClick={() => setBookingMode(null)}
            className="patient-booking-back-btn"
            style={{ marginBottom: 12 }}
          >
            <ArrowLeft size={16} />
            <span>Đổi hình thức đặt lịch</span>
          </button>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: bookingMode === 'BY_DOCTOR' ? '#2563eb' : '#0d9488',
              color: '#ffffff',
              padding: '4px 12px',
              borderRadius: 20,
              fontSize: '0.74rem',
              fontWeight: 800,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              marginBottom: 8,
              marginLeft: 10,
            }}
          >
            {bookingMode === 'BY_DOCTOR' ? <Stethoscope size={13} /> : <Calendar size={13} />}
            <span>
              {bookingMode === 'BY_DOCTOR' ? 'ĐẶT LỊCH THEO BÁC SĨ' : 'ĐẶT LỊCH THEO NGÀY KHÁM'}
            </span>
          </div>

          <h1 style={{ fontSize: '1.7rem', fontWeight: 900, margin: '0 0 6px', color: '#0f172a', letterSpacing: '-0.5px' }}>
            {bookingMode === 'BY_DOCTOR'
              ? 'Lịch Khám 5 Ngày Của Bác Sĩ Nha Khoa'
              : 'Chọn Ngày Khám & Bác Sĩ Nha Khoa'}
          </h1>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569', lineHeight: 1.5 }}>
            {bookingMode === 'BY_DOCTOR'
              ? 'Chọn bác sĩ để xem đầy đủ toàn bộ các ca trực trong 5 ngày tới bắt đầu từ hôm nay.'
              : 'Hệ thống chỉ mở đặt lịch trực tuyến trong 5 ngày gần nhất bắt đầu từ hôm nay.'}
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={loading || loadingDoctorSessions}
          style={{
            background: '#ffffff',
            border: '1.5px solid #cbd5e1',
            borderRadius: 12,
            padding: '10px 18px',
            fontWeight: 700,
            fontSize: '0.88rem',
            color: '#0f172a',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#0d9488';
            e.currentTarget.style.color = '#0d9488';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#cbd5e1';
            e.currentTarget.style.color = '#0f172a';
          }}
        >
          <RefreshCw size={15} className={(loading || loadingDoctorSessions) ? 'spin-slow' : ''} />
          <span>Làm mới lịch trực</span>
        </button>
      </div>

      {/* =================================================================== */}
      {/* TRƯỜNG HỢP A: ĐẶT THEO BÁC SĨ (BY_DOCTOR)                           */}
      {/* =================================================================== */}
      {bookingMode === 'BY_DOCTOR' ? (
        <>
          {/* BƯỚC 1: DROPDOWN CHỌN BÁC SĨ */}
          <div className="patient-booking-step-card">
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 4px', color: '#0f172a' }}>
                Bước 1: Chọn bác sĩ nha khoa
              </h2>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                Chọn bác sĩ để hiển thị đầy đủ lịch trực trong 5 ngày tới
              </p>
            </div>

            {/* Dropdown Select Box */}
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value ? Number(e.target.value) : '')}
              disabled={loadingDoctors}
              style={{
                width: '100%',
                padding: '14px 18px',
                borderRadius: 14,
                border: '2px solid #0d9488',
                fontSize: '0.96rem',
                fontWeight: 700,
                color: selectedDoctorId ? '#0f172a' : '#64748b',
                background: '#ffffff',
                outline: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(13, 148, 136, 0.08)',
                boxSizing: 'border-box',
              }}
            >
              <option value="">-- Vui lòng chọn một bác sĩ nha khoa --</option>
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.fullName || doc.username} {doc.rank ? `(${formatDoctorRank(doc.rank)})` : ''} - #{doc.id}
                </option>
              ))}
            </select>

            {/* Thẻ hiển thị tóm tắt bác sĩ đã chọn */}
            {currentSelectedDoctor && (
              <div
                style={{
                  marginTop: 18,
                  padding: '16px 20px',
                  background: 'linear-gradient(135deg, #f0fdfa 0%, #e6fffa 100%)',
                  border: '1.5px solid #ccfbf1',
                  borderRadius: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 14,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <DoctorAvatar
                    avatar={currentSelectedDoctor.ava}
                    name={currentSelectedDoctor.fullName}
                    size={52}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>
                        {currentSelectedDoctor.fullName}
                      </h3>
                      {currentSelectedDoctor.rank && (
                        <span
                          style={{
                            background: '#0d9488',
                            color: '#ffffff',
                            padding: '2px 10px',
                            borderRadius: 12,
                            fontSize: '0.74rem',
                            fontWeight: 800,
                          }}
                        >
                          {formatDoctorRank(currentSelectedDoctor.rank)}
                        </span>
                      )}
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#0f766e', fontWeight: 600 }}>
                      Phòng khám số 1 • Khám & Điều trị tổng quát nha khoa
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#0d9488',
                    background: '#ffffff',
                    padding: '6px 14px',
                    borderRadius: 20,
                    border: '1px solid #99f6e4',
                  }}
                >
                  Đang xem lịch 5 ngày tới
                </div>
              </div>
            )}
          </div>

          {/* BƯỚC 2: HIỂN THỊ TẤT CẢ CÁC CA THEO TỪNG NGÀY TRONG 5 NGÀY TỚI */}
          {!selectedDoctorId ? (
            <div
              className="patient-booking-step-card"
              style={{
                padding: '48px 24px',
                textAlign: 'center',
                border: '2px dashed #cbd5e1',
                borderRadius: 20,
                background: '#f8fafc',
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: '#ffffff',
                  margin: '0 auto 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                <Stethoscope size={28} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
                Chưa chọn bác sĩ nha khoa
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0 }}>
                Vui lòng chọn bác sĩ từ <strong>hộp thoại Dropdown ở Bước 1 phía trên</strong> để xem toàn bộ lịch khám trong 5 ngày tới.
              </p>
            </div>
          ) : loadingDoctorSessions ? (
            <div className="patient-booking-step-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto 16px' }} />
              <p style={{ color: '#0f172a', fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
                Đang tải đầy đủ lịch trực 5 ngày của bác sĩ {currentSelectedDoctor?.fullName}...
              </p>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: 16 }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 4px', color: '#0f172a' }}>
                  Bước 2: Lịch khám 5 ngày tới của {currentSelectedDoctor?.fullName}
                </h2>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                  Hiển thị đầy đủ tất cả ca sáng và ca chiều từ hôm nay đến 5 ngày tới. Bấm vào ca còn chỗ để đặt lịch ngay.
                </p>
              </div>

              {/* Lặp qua 5 ngày để hiển thị các ca khám */}
              {fiveDays.map((day) => {
                const daySessions = doctorSessionsByDay[day.dateStr] || [];
                const isToday = day.isToday;

                return (
                  <div
                    key={day.dateStr}
                    className="patient-booking-step-card"
                    style={{ marginBottom: 20 }}
                  >
                    {/* Header Ngày */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 16,
                        paddingBottom: 12,
                        borderBottom: '1.5px solid #f1f5f9',
                        flexWrap: 'wrap',
                        gap: 10,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 10,
                            background: isToday ? '#fef3c7' : '#f0fdfa',
                            color: isToday ? '#b45309' : '#0d9488',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 900,
                            fontSize: '0.9rem',
                          }}
                        >
                          <Calendar size={18} />
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                            {day.displayWeekday} - Ngày {day.formattedDate}
                          </h3>
                          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>
                            {day.fullDateLabel}
                          </div>
                        </div>
                      </div>

                      <span
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          color: daySessions.length > 0 ? '#0d9488' : '#94a3b8',
                          background: daySessions.length > 0 ? '#f0fdfa' : '#f8fafc',
                          padding: '4px 12px',
                          borderRadius: 20,
                          border: `1px solid ${daySessions.length > 0 ? '#ccfbf1' : '#e2e8f0'}`,
                        }}
                      >
                        {daySessions.length > 0 ? `${daySessions.length} ca khám` : 'Không có ca trực'}
                      </span>
                    </div>

                    {/* Danh sách ca khám trong ngày */}
                    {daySessions.length === 0 ? (
                      <div
                        style={{
                          padding: '16px',
                          textAlign: 'center',
                          background: '#f8fafc',
                          borderRadius: 12,
                          border: '1px dashed #cbd5e1',
                          color: '#64748b',
                          fontSize: '0.86rem',
                        }}
                      >
                        Bác sĩ không có ca trực trong ngày này ({day.formattedDate}).
                      </div>
                    ) : (
                      <div className="patient-booking-sessions-grid">
                        {daySessions.map((sess) => {
                          const available = Number(sess.availableSlots ?? sess.maxPatients ?? 0);
                          const isFull = available <= 0;
                          const isExpired = isSessionExpired(sess, day);
                          const isAlreadyBooked = myActiveSessionIds.has(sess.id);
                          const isDisabled = isFull || isExpired || isAlreadyBooked;

                          return (
                            <div
                              key={sess.id}
                              className="patient-booking-session-item"
                              style={{
                                background: isAlreadyBooked ? '#f0fdfa' : isExpired ? '#f8fafc' : '#ffffff',
                                borderRadius: 16,
                                padding: '18px',
                                border: isAlreadyBooked
                                  ? '1.5px solid #99f6e4'
                                  : isExpired
                                  ? '1.5px dashed #cbd5e1'
                                  : '1.5px solid #e2e8f0',
                                boxShadow: isExpired ? 'none' : '0 4px 14px rgba(0, 0, 0, 0.03)',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                gap: 14,
                                opacity: isExpired ? 0.65 : 1,
                                cursor: isDisabled ? 'not-allowed' : 'default',
                              }}
                            >
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 6 }}>
                                  <span
                                    style={{
                                      background: isExpired ? '#f1f5f9' : sess.shift === 'MORNING' ? '#eff6ff' : '#fffbeb',
                                      color: isExpired ? '#64748b' : sess.shift === 'MORNING' ? '#2563eb' : '#d97706',
                                      border: `1px solid ${isExpired ? '#e2e8f0' : sess.shift === 'MORNING' ? '#bfdbfe' : '#fde68a'}`,
                                      fontWeight: 800,
                                      fontSize: '0.78rem',
                                      padding: '4px 10px',
                                      borderRadius: 20,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 5,
                                    }}
                                  >
                                    <Clock size={13} />
                                    <span>
                                      {sess.shift === 'MORNING' ? 'Ca Sáng (08:00 - 12:00)' : 'Ca Chiều (13:30 - 17:30)'}
                                    </span>
                                  </span>

                                  <span
                                    style={{
                                      background: isAlreadyBooked ? '#ccfbf1' : isExpired ? '#f1f5f9' : isFull ? '#fee2e2' : '#ecfdf5',
                                      color: isAlreadyBooked ? '#0f766e' : isExpired ? '#64748b' : isFull ? '#dc2626' : '#059669',
                                      border: `1px solid ${isAlreadyBooked ? '#5eead4' : isExpired ? '#cbd5e1' : isFull ? '#fecaca' : '#a7f3d0'}`,
                                      fontSize: '0.74rem',
                                      fontWeight: 800,
                                      padding: '3px 9px',
                                      borderRadius: 20,
                                    }}
                                  >
                                    {isAlreadyBooked ? 'Bạn đã đặt ca này' : isExpired ? 'Đã quá giờ' : isFull ? 'Hết chỗ' : `Còn ${available} chỗ`}
                                  </span>
                                </div>

                                <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: 6 }}>
                                  Phòng khám số 1 • Khám & Điều trị nha khoa
                                </div>

                                {isAlreadyBooked && (
                                  <div style={{ background: '#f0fdfa', color: '#0f766e', border: '1px solid #ccfbf1', borderRadius: 8, padding: '6px 10px', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                                    <Check size={14} color="#0d9488" />
                                    <span>Bạn đã có một phiếu khám trong ca trực này.</span>
                                  </div>
                                )}
                                {isExpired && !isAlreadyBooked && (
                                  <div style={{ background: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3', borderRadius: 8, padding: '6px 10px', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                                    <AlertCircle size={14} color="#e11d48" />
                                    <span>{sess.shift === 'MORNING' ? 'Đã qua 08:00 sáng - Ngưng nhận đặt lịch' : 'Đã qua 13:30 chiều - Ngưng nhận đặt lịch'}</span>
                                  </div>
                                )}
                              </div>

                              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Phí công khám:</span>
                                  <strong style={{ fontSize: '1.05rem', color: isExpired ? '#64748b' : '#0d9488', fontWeight: 900 }}>150.000 đ</strong>
                                </div>

                                <button
                                  type="button"
                                  disabled={isDisabled}
                                  onClick={() => !isDisabled && handleOpenBooking(sess, day)}
                                  style={{
                                    width: '100%',
                                    background: isAlreadyBooked ? '#f1f5f9' : isExpired ? '#cbd5e1' : isFull ? '#e2e8f0' : '#0d9488',
                                    color: isAlreadyBooked ? '#64748b' : isExpired ? '#475569' : isFull ? '#94a3b8' : '#ffffff',
                                    border: isAlreadyBooked ? '1px solid #cbd5e1' : 'none',
                                    borderRadius: 10,
                                    padding: '10px 14px',
                                    fontWeight: 800,
                                    fontSize: '0.85rem',
                                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6,
                                    transition: 'all 0.15s ease',
                                  }}
                                  onMouseEnter={(e) => !isDisabled && (e.currentTarget.style.background = '#0f766e')}
                                  onMouseLeave={(e) => !isDisabled && (e.currentTarget.style.background = '#0d9488')}
                                >
                                  <span>
                                    {isAlreadyBooked ? 'Đã có lịch hẹn' : isExpired ? 'Đã quá giờ đặt' : isFull ? 'Đã đủ số lượng' : 'Chọn ca khám này'}
                                  </span>
                                  {!isDisabled && <ChevronRight size={15} />}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* =================================================================== */
        /* TRƯỜNG HỢP B: ĐẶT THEO NGÀY KHÁM (BY_DATE - HIỆN TẠI)               */
        /* =================================================================== */
        <>
          {/* BƯỚC 1: CHỌN NGÀY KHÁM TRONG 5 NGÀY TỚI */}
          <div className="patient-booking-step-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 4px', color: '#0f172a' }}>
                  Bước 1: Chọn ngày khám trong 5 ngày tới
                </h2>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                  Chỉ hiển thị chính xác 5 ngày bắt đầu từ ngày hôm nay
                </p>
              </div>

              <div
                className="patient-booking-selected-badge"
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: '#0d9488',
                  background: '#f0fdfa',
                  padding: '6px 14px',
                  borderRadius: 20,
                  border: '1px solid #ccfbf1',
                }}
              >
                Đang chọn: <strong>{selectedDay.fullDateLabel}</strong>
              </div>
            </div>

            {/* Mobile Dropdown */}
            <div className="patient-booking-days-mobile">
              <select
                value={selectedDay.dateStr}
                onChange={(e) => {
                  const found = fiveDays.find((d) => d.dateStr === e.target.value);
                  if (found) setSelectedDay(found);
                }}
                className="patient-booking-date-select"
              >
                {fiveDays.map((d, idx) => {
                  const prefix = idx === 0 ? 'Hôm nay - ' : idx === 1 ? 'Ngày mai - ' : '';
                  return (
                    <option key={d.dateStr} value={d.dateStr}>
                      {prefix}{d.fullDateLabel}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Desktop 5 Cards Grid */}
            <div className="patient-booking-days-desktop">
              {fiveDays.map((day) => {
                const isSelected = selectedDay.dateStr === day.dateStr;
                return (
                  <button
                    key={day.dateStr}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    style={{
                      background: isSelected ? 'linear-gradient(145deg, #0d9488, #0f766e)' : '#ffffff',
                      color: isSelected ? '#ffffff' : '#0f172a',
                      border: isSelected ? '2px solid #0d9488' : '1.5px solid #e2e8f0',
                      borderRadius: 16,
                      padding: '16px 12px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.18s ease',
                      boxShadow: isSelected
                        ? '0 6px 20px rgba(13, 148, 136, 0.3)'
                        : '0 2px 4px rgba(0,0,0,0.02)',
                      transform: isSelected ? 'translateY(-2px)' : 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = '#0d9488';
                        e.currentTarget.style.background = '#f0fdfa';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = '#e2e8f0';
                        e.currentTarget.style.background = '#ffffff';
                      }
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: isSelected ? '#ccfbf1' : '#64748b',
                      }}
                    >
                      {day.displayWeekday}
                    </span>

                    <span
                      style={{
                        fontSize: '1.55rem',
                        fontWeight: 900,
                        letterSpacing: '-0.5px',
                        color: isSelected ? '#ffffff' : '#0f172a',
                      }}
                    >
                      {day.formattedDate}
                    </span>

                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '3px 10px',
                        borderRadius: 12,
                        background: isSelected ? 'rgba(255,255,255,0.22)' : day.isToday ? '#fef3c7' : '#f1f5f9',
                        color: isSelected ? '#ffffff' : day.isToday ? '#b45309' : '#64748b',
                        marginTop: 4,
                      }}
                    >
                      {isSelected ? 'ĐANG CHỌN' : day.isToday ? 'HÔM NAY' : 'CHỌN KHÁM'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* BƯỚC 2: DANH SÁCH CA KHÁM CHO NGÀY ĐÃ CHỌN */}
          <div className="patient-booking-step-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  Bước 2: Chọn ca khám bác sĩ ({selectedDay.displayWeekday}, ngày {selectedDay.formattedDate})
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  Danh sách ca khám đang mở tiếp nhận bệnh nhân
                </p>
              </div>
              <span
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  color: '#0d9488',
                  background: '#f0fdfa',
                  padding: '6px 14px',
                  borderRadius: 20,
                  border: '1px solid #ccfbf1',
                }}
              >
                {sessions.length} ca khám khả dụng
              </span>
            </div>

            {loading ? (
              <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto 16px' }} />
                <p style={{ color: '#0f172a', fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
                  Đang tìm kiếm ca trực của các bác sĩ nha khoa...
                </p>
              </div>
            ) : sessions.length === 0 ? (
              <div
                style={{
                  padding: '48px 24px',
                  textAlign: 'center',
                  border: '2px dashed #cbd5e1',
                  borderRadius: 16,
                  background: '#f8fafc',
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: '#ffffff',
                    margin: '0 auto 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#64748b',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                >
                  <Calendar size={26} />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
                  Chưa có ca khám nào mở trong ngày {selectedDay.formattedDate}
                </h3>
                <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0 }}>
                  Vui lòng chọn ngày khác ở <strong>Bước 1 phía trên</strong> để xem các ca trực của bác sĩ nha khoa.
                </p>
              </div>
            ) : (
              <div className="patient-booking-sessions-grid">
                {sessions.map((sess) => {
                  const available = Number(sess.availableSlots ?? sess.maxPatients ?? 0);
                  const isFull = available <= 0;
                  const isExpired = isSessionExpired(sess, selectedDay);
                  const isAlreadyBooked = myActiveSessionIds.has(sess.id);
                  const isDisabled = isFull || isExpired || isAlreadyBooked;

                  const doctorName = sess.doctorName || sess.doctor?.fullName || 'Bác sĩ chuyên khoa';
                  const doctorRank = sess.doctorRank || sess.doctor?.rank;
                  const doctorAvatar = sess.doctorAvatar || sess.doctor?.avatar || sess.doctor?.ava || sess.avatar || sess.doctorAva;

                  return (
                    <div
                      key={sess.id}
                      className="patient-booking-session-item"
                      style={{
                        background: isAlreadyBooked ? '#f0fdfa' : isExpired ? '#f8fafc' : '#ffffff',
                        borderRadius: 18,
                        padding: '22px',
                        border: isAlreadyBooked
                          ? '1.5px solid #99f6e4'
                          : isExpired
                          ? '1.5px dashed #cbd5e1'
                          : '1.5px solid #e2e8f0',
                        boxShadow: isExpired ? 'none' : '0 4px 14px rgba(0, 0, 0, 0.03)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: 16,
                        opacity: isExpired ? 0.62 : 1,
                        filter: isExpired ? 'grayscale(20%)' : 'none',
                        transition: 'all 0.18s ease',
                        cursor: isDisabled ? 'not-allowed' : 'default',
                        boxSizing: 'border-box',
                      }}
                      onMouseEnter={(e) => {
                        if (!isDisabled) {
                          e.currentTarget.style.borderColor = '#0d9488';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 8px 24px rgba(13, 148, 136, 0.12)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isDisabled) {
                          e.currentTarget.style.borderColor = '#e2e8f0';
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.03)';
                        }
                      }}
                    >
                      <div>
                        {/* Khung giờ & Số chỗ */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                          <span
                            style={{
                              background: isExpired ? '#f1f5f9' : sess.shift === 'MORNING' ? '#eff6ff' : '#fffbeb',
                              color: isExpired ? '#64748b' : sess.shift === 'MORNING' ? '#2563eb' : '#d97706',
                              border: `1px solid ${isExpired ? '#e2e8f0' : sess.shift === 'MORNING' ? '#bfdbfe' : '#fde68a'}`,
                              fontWeight: 800,
                              fontSize: '0.78rem',
                              padding: '4px 10px',
                              borderRadius: 20,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            <Clock size={13} />
                            <span>
                              {sess.shift === 'MORNING' ? 'Ca Sáng (08:00 - 12:00)' : 'Ca Chiều (13:30 - 17:30)'}
                            </span>
                          </span>

                          <span
                            style={{
                              background: isAlreadyBooked
                                ? '#ccfbf1'
                                : isExpired
                                ? '#f1f5f9'
                                : isFull
                                ? '#fee2e2'
                                : '#ecfdf5',
                              color: isAlreadyBooked
                                ? '#0f766e'
                                : isExpired
                                ? '#64748b'
                                : isFull
                                ? '#dc2626'
                                : '#059669',
                              border: `1px solid ${
                                isAlreadyBooked
                                  ? '#5eead4'
                                  : isExpired
                                  ? '#cbd5e1'
                                  : isFull
                                  ? '#fecaca'
                                  : '#a7f3d0'
                              }`,
                              fontSize: '0.76rem',
                              fontWeight: 800,
                              padding: '3px 10px',
                              borderRadius: 20,
                            }}
                          >
                            {isAlreadyBooked
                              ? 'Bạn đã đặt ca này'
                              : isExpired
                              ? 'Đã quá giờ đặt'
                              : isFull
                              ? 'Đã hết chỗ'
                              : `Còn ${available} chỗ`}
                          </span>
                        </div>

                        {/* Thông tin bác sĩ */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <DoctorAvatar avatar={doctorAvatar} name={doctorName} size={48} />

                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <h3 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 800, color: '#0f172a' }}>
                                {doctorName}
                              </h3>
                              {doctorRank && (
                                <span
                                  style={{
                                    background: '#f0fdfa',
                                    color: '#0d9488',
                                    border: '1px solid #ccfbf1',
                                    padding: '2px 8px',
                                    borderRadius: 6,
                                    fontSize: '0.72rem',
                                    fontWeight: 800,
                                  }}
                                >
                                  {formatDoctorRank(doctorRank)}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 3 }}>
                              Phòng khám số 1 • Khám & Điều trị tổng quát
                            </div>
                          </div>
                        </div>

                        {/* Lý do khóa */}
                        {isAlreadyBooked ? (
                          <div
                            style={{
                              background: '#f0fdfa',
                              color: '#0f766e',
                              border: '1px solid #ccfbf1',
                              borderRadius: 10,
                              padding: '7px 12px',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              marginTop: 12,
                            }}
                          >
                            <Check size={14} color="#0d9488" style={{ flexShrink: 0 }} />
                            <span>Bạn đã có một phiếu khám trong ca trực này.</span>
                          </div>
                        ) : isExpired ? (
                          <div
                            style={{
                              background: '#fff1f2',
                              color: '#e11d48',
                              border: '1px solid #fecdd3',
                              borderRadius: 10,
                              padding: '7px 12px',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              marginTop: 12,
                            }}
                          >
                            <AlertCircle size={14} color="#e11d48" style={{ flexShrink: 0 }} />
                            <span>
                              {sess.shift === 'MORNING'
                                ? 'Đã qua 08:00 sáng - Ngưng nhận đặt lịch ca này'
                                : 'Đã qua 13:30 chiều - Ngưng nhận đặt lịch ca này'}
                            </span>
                          </div>
                        ) : null}
                      </div>

                      {/* Phí & Nút hành động */}
                      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
                          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Phí công khám ban đầu:</span>
                          <strong style={{ fontSize: '1.15rem', color: isExpired ? '#64748b' : '#0d9488', fontWeight: 900 }}>150.000 đ</strong>
                        </div>

                        <button
                          type="button"
                          disabled={isDisabled}
                          onClick={() => !isDisabled && handleOpenBooking(sess, selectedDay)}
                          style={{
                            width: '100%',
                            background: isAlreadyBooked
                              ? '#f1f5f9'
                              : isExpired
                              ? '#cbd5e1'
                              : isFull
                              ? '#e2e8f0'
                              : '#0d9488',
                            color: isAlreadyBooked
                              ? '#64748b'
                              : isExpired
                              ? '#475569'
                              : isFull
                              ? '#94a3b8'
                              : '#ffffff',
                            border: isAlreadyBooked ? '1px solid #cbd5e1' : 'none',
                            borderRadius: 12,
                            padding: '11px 16px',
                            fontWeight: 800,
                            fontSize: '0.88rem',
                            cursor: isDisabled ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            boxShadow: isDisabled ? 'none' : '0 4px 14px rgba(13, 148, 136, 0.25)',
                            transition: 'background 0.15s ease',
                          }}
                          onMouseEnter={(e) => !isDisabled && (e.currentTarget.style.background = '#0f766e')}
                          onMouseLeave={(e) => !isDisabled && (e.currentTarget.style.background = '#0d9488')}
                        >
                          <span>
                            {isAlreadyBooked
                              ? 'Đã có lịch hẹn ở ca này'
                              : isExpired
                              ? sess.shift === 'MORNING'
                                ? 'Đã qua 08:00 (Ngưng nhận ca sáng)'
                                : 'Đã qua 13:30 (Ngưng nhận ca chiều)'
                              : isFull
                              ? 'Ca khám đã đủ số lượng'
                              : 'Chọn ca khám này'}
                          </span>
                          {!isDisabled && <ChevronRight size={16} />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* =================================================================== */}
      {/* 3. MODAL ĐẶT LỊCH KHÁM & THANH TOÁN (DÙNG CHUNG CHO CẢ 2 CHẾ ĐỘ)    */}
      {/* =================================================================== */}
      {selectedSession && (
        <div className="modal-overlay" onClick={() => !submitting && setSelectedSession(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 500,
              width: '90%',
              borderRadius: 20,
              padding: 0,
              overflow: 'hidden',
              boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                color: '#ffffff',
                padding: '20px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: 'rgba(255, 255, 255, 0.18)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Calendar size={20} color="#ffffff" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#ffffff' }}>
                    Xác Nhận Giữ Chỗ Khám
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: '#ccfbf1', marginTop: 2 }}>
                    {selectedDay.fullDateLabel}
                  </div>
                </div>
              </div>

              {!submitting && (
                <button
                  type="button"
                  onClick={() => setSelectedSession(null)}
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    border: 'none',
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    cursor: 'pointer',
                  }}
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
              {bookedAppointment ? (
                /* Thành công - Hiện thông báo thanh toán */
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      background: '#ecfdf5',
                      color: '#059669',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                      border: '2px solid #a7f3d0',
                    }}
                  >
                    <CheckCircle2 size={36} />
                  </div>

                  <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: '0 0 6px' }}>
                    Đã Giữ Chỗ Thành Công!
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 0 20px', lineHeight: 1.5 }}>
                    Mã phiếu khám của bạn là <strong style={{ color: '#0d9488' }}>#{bookedAppointment.id}</strong>.
                    Lịch hẹn đang được giữ chỗ trong <strong>10 phút</strong>. Vui lòng thanh toán tiền công khám ban đầu để hoàn tất xác nhận.
                  </p>

                  <div
                    style={{
                      background: '#f8fafc',
                      borderRadius: 14,
                      padding: '16px',
                      border: '1.5px solid #e2e8f0',
                      textAlign: 'left',
                      marginBottom: 20,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', marginBottom: 10 }}>
                      <span style={{ color: '#64748b' }}>Bác sĩ khám:</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <DoctorAvatar
                          avatar={selectedSession.doctorAvatar || selectedSession.doctor?.avatar || selectedSession.doctor?.ava}
                          name={selectedSession.doctorName || selectedSession.doctor?.fullName}
                          size={28}
                        />
                        <strong style={{ color: '#0f172a' }}>{selectedSession.doctorName || selectedSession.doctor?.fullName}</strong>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 8 }}>
                      <span style={{ color: '#64748b' }}>Khung giờ:</span>
                      <strong style={{ color: '#0f172a' }}>
                        {selectedSession.shift === 'MORNING' ? 'Ca Sáng (08:00 - 12:00)' : 'Ca Chiều (13:30 - 17:30)'}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', paddingTop: 8, borderTop: '1px dashed #cbd5e1' }}>
                      <span style={{ color: '#64748b', fontWeight: 700 }}>Tiền công khám:</span>
                      <strong style={{ color: '#0d9488', fontSize: '1.1rem' }}>150.000 đ</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => navigate('/patient/appointments')}
                      style={{
                        flex: 1,
                        background: '#f1f5f9',
                        color: '#0f172a',
                        border: '1px solid #cbd5e1',
                        borderRadius: 12,
                        padding: '12px',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                      }}
                    >
                      Xem lịch sau
                    </button>

                    <button
                      type="button"
                      disabled={paying}
                      onClick={handlePayNow}
                      style={{
                        flex: 1.5,
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: 12,
                        padding: '12px',
                        fontWeight: 800,
                        fontSize: '0.92rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        boxShadow: '0 4px 14px rgba(217, 119, 6, 0.35)',
                      }}
                    >
                      <CreditCard size={18} />
                      <span>{paying ? 'Đang chuyển VNPay...' : 'Thanh toán ngay'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Form xác nhận đặt lịch */
                <form onSubmit={handleConfirmBooking} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div
                    style={{
                      background: '#f8fafc',
                      borderRadius: 14,
                      padding: '16px',
                      border: '1.5px solid #e2e8f0',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', marginBottom: 8 }}>
                      <span style={{ color: '#64748b' }}>Bác sĩ phụ trách:</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <DoctorAvatar
                          avatar={selectedSession.doctorAvatar || selectedSession.doctor?.avatar || selectedSession.doctor?.ava}
                          name={selectedSession.doctorName || selectedSession.doctor?.fullName}
                          size={28}
                        />
                        <strong style={{ color: '#0f172a' }}>{selectedSession.doctorName || selectedSession.doctor?.fullName}</strong>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 6 }}>
                      <span style={{ color: '#64748b' }}>Thời gian ca trực:</span>
                      <strong style={{ color: '#0d9488' }}>
                        {selectedSession.shift === 'MORNING' ? '08:00 - 12:00' : '13:30 - 17:30'} • {selectedDay.formattedDate}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', paddingTop: 8, borderTop: '1px dashed #cbd5e1' }}>
                      <span style={{ color: '#64748b', fontWeight: 600 }}>Phí công khám:</span>
                      <strong style={{ color: '#0d9488', fontSize: '1.05rem', fontWeight: 900 }}>150.000 đ</strong>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                      Lý do hoặc triệu chứng răng miệng:
                    </label>
                    <textarea
                      rows={3}
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      placeholder="Ví dụ: Đau buốt răng số 6 khi nhai, muốn lấy cao răng, kiểm tra răng khôn..."
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: 12,
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.88rem',
                        color: '#0f172a',
                        outline: 'none',
                        resize: 'none',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => setSelectedSession(null)}
                      style={{
                        flex: 1,
                        background: '#ffffff',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: 12,
                        padding: '12px',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        color: '#475569',
                        cursor: 'pointer',
                      }}
                    >
                      Hủy bỏ
                    </button>

                    <button
                      type="submit"
                      disabled={submitting}
                      style={{
                        flex: 1.5,
                        background: '#0d9488',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: 12,
                        padding: '12px',
                        fontWeight: 800,
                        fontSize: '0.92rem',
                        cursor: submitting ? 'wait' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        boxShadow: '0 4px 14px rgba(13, 148, 136, 0.3)',
                      }}
                    >
                      <span>{submitting ? 'Đang gửi thông tin...' : 'Tiến hành giữ chỗ'}</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
