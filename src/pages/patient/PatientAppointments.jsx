import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Calendar, Clock, User, Stethoscope, AlertCircle, CheckCircle2,
  XCircle, CreditCard, ChevronRight, RefreshCw, Eye, Sparkles, Filter,
  PhoneCall, ShieldCheck, ArrowRight
} from 'lucide-react';
import { clinicService } from '../../services/clinicService';
import { paymentService } from '../../services/paymentService';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils/errorMessage';
import { formatDoctorRank } from '../../utils/doctorRank';
import PatientAppointmentDetailModal from './PatientAppointmentDetailModal';

const statusMap = {
  PENDING_PAYMENT: {
    label: 'Chờ thanh toán',
    color: '#b45309',
    bg: '#fef3c7',
    border: '#fde68a',
    dot: '#d97706',
    cardBorder: '#f59e0b',
    cardBg: 'linear-gradient(180deg, #fffbeb 0%, #ffffff 80px)',
    sttGradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    sttShadow: '0 4px 12px rgba(217, 119, 6, 0.28)',
    btnBg: '#fffbeb',
    btnBorder: '#fde68a',
    btnColor: '#b45309',
  },
  CONFIRMED: {
    label: 'Đã xác nhận',
    color: '#0284c7',
    bg: '#e0f2fe',
    border: '#bae6fd',
    dot: '#0284c7',
    cardBorder: '#38bdf8',
    cardBg: 'linear-gradient(180deg, #f0f9ff 0%, #ffffff 80px)',
    sttGradient: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
    sttShadow: '0 4px 12px rgba(2, 132, 199, 0.28)',
    btnBg: '#f0f9ff',
    btnBorder: '#bae6fd',
    btnColor: '#0284c7',
  },
  EXAMINING: {
    label: 'Đang khám',
    color: '#6d28d9',
    bg: '#ede9fe',
    border: '#ddd6fe',
    dot: '#7c3aed',
    cardBorder: '#a855f7',
    cardBg: 'linear-gradient(180deg, #faf5ff 0%, #ffffff 80px)',
    sttGradient: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
    sttShadow: '0 4px 12px rgba(124, 58, 237, 0.28)',
    btnBg: '#faf5ff',
    btnBorder: '#ddd6fe',
    btnColor: '#7c3aed',
  },
  COMPLETED: {
    label: 'Đã hoàn tất',
    color: '#15803d',
    bg: '#dcfce7',
    border: '#bbf7d0',
    dot: '#16a34a',
    cardBorder: '#4ade80',
    cardBg: 'linear-gradient(180deg, #f0fdf4 0%, #ffffff 80px)',
    sttGradient: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
    sttShadow: '0 4px 12px rgba(22, 163, 74, 0.28)',
    btnBg: '#f0fdf4',
    btnBorder: '#bbf7d0',
    btnColor: '#15803d',
  },
  CANCELLED: {
    label: 'Đã hủy',
    color: '#b91c1c',
    bg: '#fee2e2',
    border: '#fecaca',
    dot: '#dc2626',
    cardBorder: '#f87171',
    cardBg: 'linear-gradient(180deg, #fff1f2 0%, #ffffff 80px)',
    sttGradient: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
    sttShadow: '0 4px 12px rgba(220, 38, 38, 0.28)',
    btnBg: '#fff1f2',
    btnBorder: '#fecaca',
    btnColor: '#b91c1c',
  },
  EXPIRED: {
    label: 'Hết hạn giữ chỗ',
    color: '#475569',
    bg: '#f1f5f9',
    border: '#e2e8f0',
    dot: '#64748b',
    cardBorder: '#cbd5e1',
    cardBg: '#ffffff',
    sttGradient: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
    sttShadow: '0 4px 12px rgba(100, 116, 139, 0.28)',
    btnBg: '#f8fafc',
    btnBorder: '#e2e8f0',
    btnColor: '#475569',
  },
};

export default function PatientAppointments() {
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [payingId, setPayingId] = useState(null);
  const paymentHandledRef = useRef(false);

  const fetchAppointments = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await clinicService.getMyAppointments({ page: 0, size: 50, sort: 'id,desc' });
      const raw = res.data?.result;
      let list = [];
      if (Array.isArray(raw)) {
        list = raw;
      } else if (raw && Array.isArray(raw.content)) {
        list = raw.content;
      }
      setAppointments(list);
    } catch (err) {
      if (!silent) toast.error(getErrorMessage(err, 'Không thể tải danh sách lịch hẹn của bạn'));
      setAppointments([]);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // YÊU CẦU: Thanh toán xong quay lại trang lịch hẹn
  useEffect(() => {
    const paymentSuccess = searchParams.get('paymentSuccess');
    if (paymentSuccess === 'true' && !paymentHandledRef.current) {
      paymentHandledRef.current = true;
      toast.success('Thanh toán thành công! Đang đồng bộ trạng thái ca khám...');
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('paymentSuccess');
      newParams.delete('orderId');
      newParams.delete('responseCode');
      setSearchParams(newParams, { replace: true });

      // Lần 1: Gọi ngay lập tức
      fetchAppointments();

      // Lần 2 & 3: Tự động cập nhật ngầm sau 800ms và 2000ms để đảm bảo Kafka Consumer đã commit sang DB
      const t1 = setTimeout(() => {
        fetchAppointments(true);
      }, 800);

      const t2 = setTimeout(() => {
        fetchAppointments(true);
      }, 2000);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    } else if (paymentSuccess === 'false' && !paymentHandledRef.current) {
      paymentHandledRef.current = true;
      toast.error('Giao dịch thanh toán không thành công hoặc bạn đã hủy giao dịch.');
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('paymentSuccess');
      newParams.delete('orderId');
      newParams.delete('responseCode');
      setSearchParams(newParams, { replace: true });
      fetchAppointments();
    } else if (!paymentSuccess) {
      fetchAppointments();
    }
  }, [searchParams]);

  const handleCancel = async (aptId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy lịch hẹn giữ chỗ này?')) return;
    setCancellingId(aptId);
    try {
      await clinicService.cancelAppointment(aptId);
      toast.success('Đã hủy lịch hẹn thành công');
      fetchAppointments();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Hủy lịch hẹn thất bại'));
    } finally {
      setCancellingId(null);
    }
  };

  const handleQuickPay = async (apt) => {
    setPayingId(apt.id);
    try {
      const res = await paymentService.createPayment({
        appointmentId: apt.id,
        type: 'EXAMINATION',
        serviceItemIds: [],
      });
      const paymentUrl = res.data?.result?.paymentUrl;
      if (paymentUrl) {
        toast.info('Đang chuyển hướng sang cổng VNPay...');
        window.location.href = paymentUrl;
      } else {
        toast.error('Không tìm thấy URL thanh toán');
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Khởi tạo thanh toán thất bại'));
    } finally {
      setPayingId(null);
    }
  };

  const aptList = Array.isArray(appointments) ? appointments : [];
  const filteredAppointments = aptList
    .filter((apt) => {
      if (!apt) return false;
      if (activeFilter === 'ALL') return true;
      if (activeFilter === 'PENDING') return apt.status === 'PENDING_PAYMENT';
      if (activeFilter === 'CONFIRMED') return apt.status === 'CONFIRMED';
      if (activeFilter === 'EXAMINING') return apt.status === 'EXAMINING';
      if (activeFilter === 'COMPLETED') return apt.status === 'COMPLETED';
      if (activeFilter === 'CANCELLED') return apt.status === 'CANCELLED' || apt.status === 'EXPIRED';
      return true;
    })
    .sort((a, b) => {
      // YÊU CẦU: Ưu tiên lịch hẹn đang khám (EXAMINING) lên đầu danh sách
      const isExaminingA = a.status === 'EXAMINING' ? 0 : 1;
      const isExaminingB = b.status === 'EXAMINING' ? 0 : 1;
      if (isExaminingA !== isExaminingB) {
        return isExaminingA - isExaminingB;
      }
      // Các lịch hẹn còn lại giữ thứ tự ID giảm dần (mới nhất lên trên)
      return (b.id || 0) - (a.id || 0);
    });

  return (
    <div className="patient-appts-container">
      {/* 1. Header Banner */}
      <div className="patient-appts-banner">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span
              className="patient-appts-badge"
              style={{
                background: '#0d9488',
                color: '#ffffff',
                padding: '4px 12px',
                borderRadius: 20,
                fontSize: '0.76rem',
                fontWeight: 850,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
              }}
            >
              HỒ SƠ ĐIỀU TRỊ NHA KHOA
            </span>
          </div>
          <h1 className="patient-appts-title">
            Lịch Hẹn Khám Của Tôi
          </h1>
          <p className="patient-appts-desc">
            Theo dõi số thứ tự khám, lịch sử thăm khám, đơn thuốc và thanh toán phí khám trực tuyến
          </p>
        </div>

        <div className="patient-appts-banner-actions" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={() => fetchAppointments()}
            disabled={loading}
            className="patient-appts-refresh-btn"
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
            <RefreshCw size={15} className={loading ? 'spin-slow' : ''} />
            <span>Làm mới</span>
          </button>

          <button
            type="button"
            className="patient-btn-book-desktop"
            onClick={() => navigate('/patient/booking')}
            style={{
              background: 'linear-gradient(135deg, #0d9488, #0f766e)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 12,
              padding: '10px 20px',
              fontWeight: 800,
              fontSize: '0.9rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(13, 148, 136, 0.3)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
          >
            <Calendar size={16} />
            <span>+ Đặt ca khám mới</span>
          </button>
        </div>
      </div>

      {/* 2. Filter Tabs - Clean Modern Pills */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          overflowX: 'auto',
          paddingBottom: 4,
        }}
      >
        {[
          { key: 'ALL', label: 'Tất cả lịch hẹn', count: aptList.length },
          { key: 'PENDING', label: 'Chờ thanh toán', count: aptList.filter((a) => a && a.status === 'PENDING_PAYMENT').length },
          { key: 'CONFIRMED', label: 'Đã xác nhận', count: aptList.filter((a) => a && a.status === 'CONFIRMED').length },
          { key: 'EXAMINING', label: 'Đang khám', count: aptList.filter((a) => a && a.status === 'EXAMINING').length },
          { key: 'COMPLETED', label: 'Đã hoàn tất', count: aptList.filter((a) => a && a.status === 'COMPLETED').length },
          { key: 'CANCELLED', label: 'Đã hủy / Quá hạn', count: aptList.filter((a) => a && (a.status === 'CANCELLED' || a.status === 'EXPIRED')).length },
        ].map((tab) => {
          const isActive = activeFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              className="patient-appts-filter-btn"
              onClick={() => setActiveFilter(tab.key)}
              style={{
                background: isActive ? '#0d9488' : '#ffffff',
                color: isActive ? '#ffffff' : '#475569',
                border: isActive ? '1.5px solid #0d9488' : '1.5px solid #e2e8f0',
                borderRadius: 12,
                padding: '9px 16px',
                fontSize: '0.86rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                boxShadow: isActive ? '0 4px 12px rgba(13, 148, 136, 0.25)' : '0 2px 4px rgba(0,0,0,0.02)',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = '#0d9488';
                  e.currentTarget.style.color = '#0d9488';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.color = '#475569';
                }
              }}
            >
              <span>{tab.label}</span>
              <span
                style={{
                  background: isActive ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                  color: isActive ? '#ffffff' : '#64748b',
                  fontSize: '0.74rem',
                  padding: '2px 8px',
                  borderRadius: 10,
                  fontWeight: 800,
                }}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Appointments List */}
      {loading ? (
        <div
          style={{
            background: '#ffffff',
            borderRadius: 20,
            padding: '60px 20px',
            textAlign: 'center',
            border: '1.5px solid #e2e8f0',
            boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
          }}
        >
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: '#0f172a', fontSize: '0.95rem', fontWeight: 700 }}>
            Đang nạp danh sách lịch hẹn của bạn...
          </p>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div
          style={{
            background: '#ffffff',
            borderRadius: 20,
            padding: '56px 24px',
            textAlign: 'center',
            border: '2px dashed #cbd5e1',
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: '#f1f5f9',
              margin: '0 auto 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
            }}
          >
            <Calendar size={32} />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
            Không có lịch hẹn nào phù hợp
          </h3>
          <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 0 20px' }}>
            {activeFilter === 'ALL'
              ? 'Bạn chưa có lịch hẹn khám răng nào trên hệ thống.'
              : 'Không có ca khám nào ở trạng thái lọc này.'}
          </p>
          <button
            onClick={() => navigate('/patient/booking')}
            style={{
              background: 'linear-gradient(135deg, #0d9488, #0f766e)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 12,
              padding: '11px 22px',
              fontWeight: 800,
              fontSize: '0.92rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(13, 148, 136, 0.3)',
            }}
          >
            Đặt lịch khám ngay (5 ngày tới)
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filteredAppointments.map((apt) => {
            const st = statusMap[apt.status] || {
              label: apt.status,
              color: '#475569',
              bg: '#f1f5f9',
              border: '#e2e8f0',
              dot: '#64748b',
            };
            const isPendingPayment = apt.status === 'PENDING_PAYMENT';
            const aptDate = apt.sessionDate || apt.date || apt.appointmentDate || (apt.session && apt.session.date);
            const aptShift = apt.sessionShift || (apt.session && apt.session.shift);
            const doctorName = apt.doctorName || (apt.doctor && apt.doctor.fullName) || (apt.session && apt.session.doctorName) || 'Bác sĩ chuyên khoa';
            const doctorRank = apt.doctorRank || (apt.doctor && apt.doctor.rank);

            return (
              <div
                key={apt.id}
                className="patient-appts-card"
                style={{
                  background: st.cardBg,
                  borderRadius: 18,
                  padding: '22px 26px',
                  border: `2px solid ${st.cardBorder}`,
                  boxShadow: `0 4px 18px ${st.border}30`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  transition: 'all 0.18s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = st.dot;
                  e.currentTarget.style.boxShadow = `0 8px 24px ${st.border}60`;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = st.cardBorder;
                  e.currentTarget.style.boxShadow = `0 4px 18px ${st.border}30`;
                  e.currentTarget.style.transform = 'none';
                }}
              >
                {/* Top Section */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: 14,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    {/* STT Badge theo màu trạng thái */}
                    <div
                      className="patient-appts-stt"
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 14,
                        background: st.sttGradient,
                        color: '#ffffff',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: '1.15rem',
                        flexShrink: 0,
                        boxShadow: st.sttShadow,
                      }}
                    >
                      <span style={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.9 }}>STT</span>
                      <span>#{apt.queueNumber || apt.id}</span>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '1.08rem', fontWeight: 900, color: '#0f172a' }}>
                          Phiếu khám #{apt.id}
                        </span>

                        <span
                          style={{
                            background: st.bg,
                            color: st.color,
                            border: `1px solid ${st.border}`,
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            padding: '3px 10px',
                            borderRadius: 12,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: st.dot }} />
                          {st.label}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 4, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <span>
                          Bác sĩ: <strong style={{ color: '#0f172a' }}>{doctorName}</strong>
                          {doctorRank && ` (${formatDoctorRank(doctorRank)})`}
                        </span>
                        {aptDate && (
                          <span>
                            • Ngày khám: <strong style={{ color: '#0d9488' }}>{aptDate}</strong>
                            {aptShift && ` (${aptShift === 'MORNING' ? '08:00 - 12:00' : '13:30 - 17:30'})`}
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: 4 }}>
                        Lý do khám: <span style={{ color: '#334155', fontWeight: 600 }}>{apt.symptoms || 'Khám răng tổng quát'}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                      Phí công khám
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0d9488', marginTop: 2 }}>
                      {Number(apt.examinationFee || 150000).toLocaleString('vi-VN')} đ
                    </div>
                  </div>
                </div>

                {/* Pending Payment Warning & Actions */}
                {isPendingPayment && (
                  <div
                    style={{
                      background: '#fffbeb',
                      borderRadius: 14,
                      padding: '12px 18px',
                      border: '1.5px solid #fde68a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 12,
                    }}
                  >
                    <div style={{ fontSize: '0.85rem', color: '#b45309', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
                      <AlertCircle size={17} color="#d97706" />
                      <span>Ca khám đang được giữ chỗ trong 10 phút. Vui lòng thanh toán tiền công khám để xác nhận lịch.</span>
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        disabled={payingId === apt.id}
                        onClick={() => handleQuickPay(apt)}
                        style={{
                          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                          color: '#ffffff',
                          border: 'none',
                          fontWeight: 800,
                          fontSize: '0.84rem',
                          borderRadius: 10,
                          padding: '8px 16px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          cursor: 'pointer',
                          boxShadow: '0 3px 10px rgba(245, 158, 11, 0.3)',
                        }}
                      >
                        <CreditCard size={15} />
                        <span>{payingId === apt.id ? 'Đang kết nối...' : 'Thanh toán VNPay'}</span>
                      </button>

                      <button
                        disabled={cancellingId === apt.id}
                        onClick={() => handleCancel(apt.id)}
                        style={{
                          background: '#fee2e2',
                          color: '#dc2626',
                          border: '1px solid #fca5a5',
                          fontWeight: 800,
                          fontSize: '0.82rem',
                          borderRadius: 10,
                          padding: '8px 14px',
                          cursor: 'pointer',
                        }}
                      >
                        {cancellingId === apt.id ? 'Đang hủy...' : 'Hủy lịch'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Bottom Actions Row */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: 12,
                    borderTop: '1px solid #f1f5f9',
                    flexWrap: 'wrap',
                    gap: 10,
                  }}
                >
                  <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 500 }}>
                    {apt.status === 'CONFIRMED' && '✓ Đã xác nhận giữ chỗ thành công. Quý khách vui lòng đến trước giờ khám 10 phút.'}
                    {apt.status === 'EXAMINING' && '🩺 Bác sĩ đang trực tiếp thăm khám và chỉ định dịch vụ điều trị.'}
                    {apt.status === 'COMPLETED' && '🎉 Buổi khám đã hoàn tất. Bạn có thể xem kết quả điều trị và đơn thuốc.'}
                    {apt.status === 'CANCELLED' && '✕ Ca khám này đã bị hủy bỏ.'}
                    {apt.status === 'EXPIRED' && '✕ Đã quá hạn giữ chỗ 10 phút.'}
                  </div>

                  <button
                    onClick={() => setSelectedAppointmentId(apt.id)}
                    style={{
                      background: st.btnBg,
                      border: `1.5px solid ${st.btnBorder}`,
                      color: st.btnColor,
                      borderRadius: 10,
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '7px 16px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = st.dot;
                      e.currentTarget.style.color = '#ffffff';
                      e.currentTarget.style.borderColor = st.dot;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = st.btnBg;
                      e.currentTarget.style.color = st.btnColor;
                      e.currentTarget.style.borderColor = st.btnBorder;
                    }}
                  >
                    <Eye size={15} />
                    <span>Xem chi tiết phiếu khám</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL CHI TIẾT LỊCH HẸN */}
      {selectedAppointmentId && (
        <PatientAppointmentDetailModal
          appointmentId={selectedAppointmentId}
          onClose={() => setSelectedAppointmentId(null)}
          onRefreshParent={fetchAppointments}
        />
      )}
    </div>
  );
}
