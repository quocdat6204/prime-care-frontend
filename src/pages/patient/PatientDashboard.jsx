import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { clinicService } from '../../services/clinicService';
import {
  Calendar, Clock, User, Stethoscope, Sparkles, HeartPulse,
  ShieldCheck, ArrowRight, CreditCard, CheckCircle2, ChevronRight,
  PhoneCall, AlertCircle, FileText, Search, MapPin, ChevronDown,
  Activity, Star, Smile, Award
} from 'lucide-react';
import PatientAppointmentDetailModal from './PatientAppointmentDetailModal';

// Danh sách 5 ngày từ hôm nay cho widget đặt lịch
const get5DaysFromToday = () => {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 5; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const displayWeekday = i === 0 ? 'Hôm nay' : i === 1 ? 'Ngày mai' : d.toLocaleDateString('vi-VN', { weekday: 'short' });
    const formattedDate = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    days.push({
      dateStr,
      label: `${displayWeekday} (${formattedDate})`,
    });
  }
  return days;
};

// 8 chuyên khoa phổ biến (Format chuẩn theo hình tham khảo)
const popularSpecialties = [
  {
    id: 'implant',
    icon: '🦷',
    name: 'Cấy ghép Implant',
    desc: 'Phục hồi răng mất an toàn, tích hợp xương sinh học vĩnh viễn.',
    symptom: 'Tư vấn cấy ghép Implant phục hình răng mất',
  },
  {
    id: 'porcelain',
    icon: '✨',
    name: 'Răng sứ thẩm mỹ',
    desc: 'Dán Veneer, bọc răng sứ nano trắng sáng chuẩn tỷ lệ vàng.',
    symptom: 'Khám và tư vấn làm răng sứ thẩm mỹ',
  },
  {
    id: 'orthodontics',
    icon: '😁',
    name: 'Niềng răng - Chỉnh nha',
    desc: 'Mắc cài tự buộc, khay trong suốt Invisalign căn chỉnh khớp cắn.',
    symptom: 'Tư vấn niềng răng chỉnh nha',
  },
  {
    id: 'pediatric',
    icon: '👶',
    name: 'Nha khoa trẻ em',
    desc: 'Khám tổng quát, nhổ răng sữa và chăm sóc nụ cười cho bé.',
    symptom: 'Khám răng định kỳ cho trẻ em',
  },
  {
    id: 'general',
    icon: '🩺',
    name: 'Khám tổng quát & Lấy cao răng',
    desc: 'Lấy cao răng siêu âm không buốt, đánh bóng men răng sáng khỏe.',
    symptom: 'Khám răng tổng quát và lấy cao răng',
  },
  {
    id: 'wisdom_tooth',
    icon: '🛡️',
    name: 'Nhổ răng khôn Piezotome',
    desc: 'Sóng siêu âm cao tần, nhổ răng ngầm êm ái, hồi phục sau 24h.',
    symptom: 'Khám và nhổ răng khôn Piezotome không đau',
  },
  {
    id: 'endodontics',
    icon: '⚡',
    name: 'Điều trị tủy & Sâu răng',
    desc: 'Trám răng thẩm mỹ Composite, điều trị tủy vi phẫu dứt điểm đau nhức.',
    symptom: 'Khám đau nhức răng, điều trị tủy',
  },
  {
    id: 'whitening',
    icon: '🌟',
    name: 'Tẩy trắng răng Laser',
    desc: 'Công nghệ Laser Whitening bật 3-5 tone chỉ sau 45 phút điều trị.',
    symptom: 'Tẩy trắng răng công nghệ cao Laser',
  },
];

export default function PatientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const fiveDays = get5DaysFromToday();
  const [selectedDate, setSelectedDate] = useState(fiveDays[0]?.dateStr || '');

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      try {
        const res = await clinicService.getMyAppointments({ page: 0, size: 20, sort: 'id,desc' });
        const raw = res.data?.result;
        let list = [];
        if (Array.isArray(raw)) {
          list = raw;
        } else if (raw && Array.isArray(raw.content)) {
          list = raw.content;
        }
        setAppointments(list);
      } catch (err) {
        console.warn('Lỗi tải danh sách lịch khám:', err);
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  const aptList = Array.isArray(appointments) ? appointments : [];
  const upcomingApts = aptList.filter(
    (a) => a && (a.status === 'CONFIRMED' || a.status === 'EXAMINING' || a.status === 'PENDING_PAYMENT')
  );
  const completedApts = aptList.filter((a) => a && a.status === 'COMPLETED');
  const pendingPaymentApts = aptList.filter((a) => a && a.status === 'PENDING_PAYMENT');

  const nextAppointment = upcomingApts[0];

  // Xử lý nút đặt lịch theo ngày chọn
  const handleSearchDoctorAndBook = () => {
    navigate(`/patient/booking?date=${selectedDate}`);
  };

  const handleSelectSpecialtyCard = (item) => {
    navigate(`/patient/booking?symptom=${encodeURIComponent(item.symptom)}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 50, paddingBottom: 60 }}>
      {/* ======================================================== */}
      {/* 1. HERO SECTION (Format chuẩn MediBook theo hình tham khảo) */}
      {/* ======================================================== */}
      <section
        style={{
          position: 'relative',
          background: 'linear-gradient(135deg, #022c22 0%, #064e3b 45%, #0f766e 100%)',
          padding: '48px 24px 64px',
          color: '#ffffff',
          overflow: 'hidden',
        }}
      >
        <div style={{ maxWidth: 1140, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          {/* Top Row: Left Hero Info + Right Dental Smile Showcase */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 32,
              marginBottom: 32,
              flexWrap: 'wrap',
            }}
          >
            {/* Left Content */}
            <div style={{ flex: '1 1 520px', textAlign: 'left' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  letterSpacing: '1px',
                  color: '#5eead4',
                  textTransform: 'uppercase',
                  marginBottom: 12,
                }}
              >
                <Sparkles size={16} color="#5eead4" />
                <span>CHĂM SÓC NỤ CƯỜI SÁNG KHỎE DỄ DÀNG HƠN</span>
              </div>

              <h1
                style={{
                  fontSize: 'clamp(2rem, 3.5vw, 2.85rem)',
                  fontWeight: 900,
                  lineHeight: 1.18,
                  margin: '0 0 14px',
                  color: '#ffffff',
                  letterSpacing: '-0.5px',
                }}
              >
                Đặt lịch khám như đặt một <br /> chuyến đi
              </h1>

              <p
                style={{
                  fontSize: '1.02rem',
                  color: '#e2e8f0',
                  margin: 0,
                  lineHeight: 1.55,
                  fontWeight: 400,
                  maxWidth: 520,
                }}
              >
                Chọn vấn đề sức khỏe, bác sĩ phù hợp và khung giờ thuận tiện chỉ trong vài phút.
              </p>
            </div>

            {/* Right Photo: Dental Smile Photo uploaded by user */}
            <div
              style={{
                flex: '0 1 380px',
                display: 'flex',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  borderRadius: 20,
                  overflow: 'hidden',
                  boxShadow: '0 16px 40px rgba(0, 0, 0, 0.35)',
                  border: '3px solid rgba(255, 255, 255, 0.25)',
                  background: '#ffffff',
                  width: '100%',
                  maxWidth: 380,
                }}
              >
                <img
                  src="/dental-smile-hero.jpg"
                  alt="Nụ cười sáng khỏe Primecare"
                  style={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: 240,
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: 10,
                    left: 10,
                    right: 10,
                    background: 'rgba(15, 23, 42, 0.82)',
                    backdropFilter: 'blur(8px)',
                    color: '#ffffff',
                    padding: '6px 12px',
                    borderRadius: 10,
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                  }}
                >
                  <Sparkles size={14} color="#facc15" />
                  <span>Nụ cười chuẩn tỷ lệ vàng • Chăm sóc không đau</span>
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* FLOATING QUICK BOOKING WIDGET (5 NGÀY GẦN NHẤT) */}
          {/* ======================================================== */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              boxShadow: '0 16px 40px rgba(15, 23, 42, 0.22)',
              padding: '12px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 16,
              color: '#0f172a',
            }}
          >
            {/* Chọn ngày muốn khám (5 ngày cố định) */}
            <div style={{ flex: '1 1 320px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: '#f0fdfa',
                  color: '#0d9488',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  border: '1px solid #ccfbf1',
                }}
              >
                <Calendar size={22} />
              </div>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    color: '#64748b',
                    marginBottom: 4,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Ngày muốn khám (5 ngày tới)
                </label>
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{
                    width: '100%',
                    border: 'none',
                    background: 'transparent',
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: '#0f172a',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {fiveDays.map((d) => (
                    <option key={d.dateStr} value={d.dateStr}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action Button: Tìm ca khám (MediBook Teal Button) */}
            <div>
              <button
                type="button"
                onClick={handleSearchDoctorAndBook}
                style={{
                  background: '#0d9488',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 12,
                  padding: '13px 32px',
                  fontWeight: 800,
                  fontSize: '0.98rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'background 0.15s ease',
                  boxShadow: '0 4px 14px rgba(13, 148, 136, 0.35)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#0f766e')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#0d9488')}
              >
                <Search size={18} />
                <span>Tìm ca khám</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Container */}
      <div style={{ maxWidth: 1180, margin: '0 auto', width: '100%', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 50 }}>
        {/* ======================================================== */}
        {/* LỊCH HẸN GẦN NHẤT CỦA BỆNH NHÂN (Nổi bật nếu có) */}
        {/* ======================================================== */}
        {nextAppointment && (
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              padding: '22px 28px',
              border: '2px solid #0d9488',
              boxShadow: '0 8px 24px rgba(13, 148, 136, 0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span
                  style={{
                    background: '#0d9488',
                    color: '#ffffff',
                    padding: '4px 12px',
                    borderRadius: 6,
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    letterSpacing: '0.5px',
                  }}
                >
                  LỊCH KHÁM GẦN NHẤT CỦA BẠN
                </span>
                <span
                  style={{
                    background: nextAppointment.status === 'CONFIRMED' ? '#dcfce7' : '#fef3c7',
                    color: nextAppointment.status === 'CONFIRMED' ? '#15803d' : '#b45309',
                    padding: '4px 12px',
                    borderRadius: 20,
                    fontSize: '0.8rem',
                    fontWeight: 800,
                  }}
                >
                  {nextAppointment.status === 'CONFIRMED' ? 'Đã xác nhận' : 'Chờ thanh toán'}
                </span>
              </div>

              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  Lịch hẹn khám #{nextAppointment.id} {nextAppointment.queueNumber && `• STT: #${nextAppointment.queueNumber}`}
                </h3>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569' }}>
                  Triệu chứng: <strong style={{ color: '#0f172a' }}>{nextAppointment.symptoms || 'Khám răng tổng quát'}</strong>
                </p>
              </div>
            </div>

            <div>
              <button
                onClick={() => setSelectedAppointmentId(nextAppointment.id)}
                style={{
                  background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '11px 22px',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
              >
                <span>Xem chi tiết & Dịch vụ</span>
                <span style={{ fontSize: '1.1rem' }}>→</span>
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 2. CHUYÊN KHOA PHỔ BIẾN (Format chuẩn MediBook: 4x2 Grid) */}
        {/* ======================================================== */}
        <section id="specialties-section">
          {/* Section Header */}
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                fontSize: '0.78rem',
                fontWeight: 800,
                letterSpacing: '1px',
                color: '#0d9488',
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              CHUYÊN KHOA PHỔ BIẾN
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>
              Bạn đang cần khám vấn đề gì?
            </h2>
          </div>

          {/* 4x2 Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: 18,
            }}
          >
            {popularSpecialties.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelectSpecialtyCard(item)}
                style={{
                  background: '#ffffff',
                  borderRadius: 14,
                  padding: '20px 18px',
                  border: '1.5px solid #e2e8f0',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 16,
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#0d9488';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(13, 148, 136, 0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.03)';
                }}
              >
                {/* Circular Icon Container */}
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: '#f0fdfa',
                    border: '1px solid #ccfbf1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.35rem',
                    flexShrink: 0,
                  }}
                >
                  {item.icon}
                </div>

                {/* Content */}
                <div>
                  <h4
                    style={{
                      margin: '0 0 6px',
                      fontSize: '0.98rem',
                      fontWeight: 800,
                      color: '#0f172a',
                    }}
                  >
                    {item.name}
                  </h4>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.8rem',
                      color: '#64748b',
                      lineHeight: 1.45,
                    }}
                  >
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ======================================================== */}
        {/* 3. HOẠT ĐỘNG & THỐNG KÊ NHANH CỦA TÀI KHOẢN BỆNH NHÂN */}
        {/* ======================================================== */}
        <section>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 18,
            }}
          >
            {/* Card 1: Upcoming */}
            <div
              onClick={() => navigate('/patient/appointments')}
              style={{
                background: '#ffffff',
                borderRadius: 14,
                padding: '20px 22px',
                border: '1.5px solid #e2e8f0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: '#f0fdfa',
                  color: '#0d9488',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Calendar size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Lịch khám sắp tới</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>
                  {upcomingApts.length}
                </div>
              </div>
            </div>

            {/* Card 2: Completed */}
            <div
              onClick={() => navigate('/patient/appointments')}
              style={{
                background: '#ffffff',
                borderRadius: 14,
                padding: '20px 22px',
                border: '1.5px solid #e2e8f0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: '#eff6ff',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle2 size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Đã hoàn tất khám</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>
                  {completedApts.length}
                </div>
              </div>
            </div>

            {/* Card 3: Pending Payment */}
            <div
              onClick={() => navigate('/patient/appointments')}
              style={{
                background: '#ffffff',
                borderRadius: 14,
                padding: '20px 22px',
                border: '1.5px solid #e2e8f0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: '#fffbeb',
                  color: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CreditCard size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Chờ thanh toán</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#b45309' }}>
                  {pendingPaymentApts.length}
                </div>
              </div>
            </div>

            {/* Card 4: Hotline Support */}
            <div
              style={{
                background: '#0f172a',
                color: '#ffffff',
                borderRadius: 14,
                padding: '20px 22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                  Tổng đài cấp cứu 24/7
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#5eead4', marginTop: 2 }}>
                  1900 8888
                </div>
              </div>
              <PhoneCall size={24} color="#5eead4" />
            </div>
          </div>
        </section>
      </div>

      {/* Appointment Detail Modal if opened */}
      {selectedAppointmentId && (
        <PatientAppointmentDetailModal
          appointmentId={selectedAppointmentId}
          onClose={() => setSelectedAppointmentId(null)}
        />
      )}
    </div>
  );
}
