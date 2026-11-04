import { useState, useEffect } from 'react';
import {
  X, Calendar, Clock, User, Stethoscope, FileText, Pill, Receipt,
  CheckCircle2, AlertCircle, RefreshCw, ExternalLink, CreditCard,
  Sparkles, ShieldCheck, HeartPulse, ChevronRight
} from 'lucide-react';
import { clinicService } from '../../services/clinicService';
import { paymentService } from '../../services/paymentService';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils/errorMessage';
import { formatDoctorRank } from '../../utils/doctorRank';

const statusMap = {
  PENDING_PAYMENT: { label: 'Chờ thanh toán', color: '#d97706', bg: '#fef3c7' },
  CONFIRMED: { label: 'Đã xác nhận', color: '#0284c7', bg: '#e0f2fe' },
  EXAMINING: { label: 'Đang khám', color: '#7c3aed', bg: '#ede9fe' },
  COMPLETED: { label: 'Đã hoàn tất', color: '#059669', bg: '#d1fae5' },
  CANCELLED: { label: 'Đã hủy', color: '#dc2626', bg: '#fee2e2' },
  EXPIRED: { label: 'Hết hạn giữ chỗ', color: '#6b7280', bg: '#f3f4f6' },
};

const getServiceStatusBadge = (service) => {
  if (service.status === 'COMPLETED') {
    return { label: 'Đã có kết quả', color: '#059669', bg: '#d1fae5', isPaid: true };
  }
  if (service.status === 'IN_PROGRESS') {
    return { label: 'Đang thực hiện', color: '#7c3aed', bg: '#ede9fe', isPaid: true };
  }
  if (service.status === 'ORDERED') {
    if (service.paidAt) {
      return { label: 'Đã thanh toán • Chờ thực hiện', color: '#0d9488', bg: '#ccfbf1', isPaid: true };
    }
    return { label: 'Chờ thanh toán', color: '#d97706', bg: '#fef3c7', isPaid: false };
  }
  return { label: service.status || 'Chưa xác định', color: '#64748b', bg: '#f1f5f9', isPaid: Boolean(service.paidAt) };
};

function DoctorAvatar({ avatar, name, size = 52 }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [avatar]);

  if (avatar && !hasError) {
    return (
      <img
        src={avatar}
        alt={name || 'Bác sĩ'}
        onError={() => setHasError(true)}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          border: '2px solid #99f6e4',
          boxShadow: '0 4px 10px rgba(13, 148, 136, 0.2)',
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
        background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.2rem',
        fontWeight: 700,
        boxShadow: '0 4px 10px rgba(13, 148, 136, 0.2)',
        flexShrink: 0,
      }}
    >
      <Stethoscope size={Math.round(size * 0.5)} />
    </div>
  );
}

export default function PatientAppointmentDetailModal({ appointmentId, onClose, onRefreshParent }) {
  const toast = useToast();
  const [detail, setDetail] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('services'); // 'services' | 'medications' | 'invoices'
  const [paying, setPaying] = useState(false);

  const apt = detail?.appointment || {};
  const session = detail?.session || {};
  const allServices = detail?.services || [];
  const medications = detail?.medications || [];

  // YÊU CẦU: Người dùng chỉ thấy được những dịch vụ hợp lệ (chưa bị hủy)
  const validServices = allServices.filter((s) => s.status !== 'CANCELLED');

  // Danh sách các dịch vụ hợp lệ cần thanh toán (status = ORDERED và chưa thanh toán)
  const payableServices = validServices.filter((s) => s.status === 'ORDERED' && !s.paidAt);
  const totalPayableServicesAmount = payableServices.reduce((sum, s) => sum + (Number(s.unitPrice) || 0), 0);

  const fetchDetail = async () => {
    if (!appointmentId) return;
    setLoading(true);
    try {
      const res = await clinicService.getAppointmentDetail(appointmentId);
      setDetail(res.data.result);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tải thông tin chi tiết lịch khám'));
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    if (!appointmentId) return;
    try {
      const res = await paymentService.getInvoicesByAppointment(appointmentId);
      setInvoices(res.data.result || []);
    } catch (err) {
      console.warn('Lỗi tải hóa đơn:', err);
    }
  };

  useEffect(() => {
    fetchDetail();
    fetchInvoices();
  }, [appointmentId]);

  // Thanh toán tiền công khám (EXAMINATION)
  const handlePayExaminationFee = async () => {
    setPaying(true);
    try {
      const res = await paymentService.createPayment({
        appointmentId: apt.id,
        type: 'EXAMINATION',
        serviceItemIds: [],
      });
      const paymentUrl = res.data?.result?.paymentUrl;
      if (paymentUrl) {
        toast.info('Đang chuyển hướng sang cổng thanh toán VNPay...');
        window.location.href = paymentUrl;
      } else {
        toast.error('Không nhận được URL thanh toán từ máy chủ.');
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Khởi tạo thanh toán thất bại'));
    } finally {
      setPaying(false);
    }
  };

  // YÊU CẦU: Khi thanh toán thì sẽ gửi toàn bộ các id dịch vụ phù hợp để thanh toán
  const handlePayServices = async () => {
    if (payableServices.length === 0) {
      toast.info('Không có dịch vụ nào cần thanh toán.');
      return;
    }

    // Gửi toàn bộ ID của các dịch vụ phù hợp
    const serviceItemIds = payableServices.map((s) => s.id);

    setPaying(true);
    try {
      const res = await paymentService.createPayment({
        appointmentId: apt.id,
        type: 'SERVICES',
        serviceItemIds: serviceItemIds,
      });
      const paymentUrl = res.data?.result?.paymentUrl;
      if (paymentUrl) {
        toast.info('Đang chuyển hướng sang cổng thanh toán VNPay...');
        window.location.href = paymentUrl;
      } else {
        toast.error('Không nhận được URL thanh toán từ máy chủ.');
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Khởi tạo thanh toán dịch vụ thất bại'));
    } finally {
      setPaying(false);
    }
  };

  const currentStatus = statusMap[apt.status] || {
    label: apt.status || 'Chưa xác định',
    color: '#64748b',
    bg: '#f1f5f9',
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1200 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 780,
          maxHeight: '92vh',
          borderRadius: 20,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(13, 148, 136, 0.15)',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            background: 'linear-gradient(135deg, #0f766e, #0d9488)',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  padding: '4px 10px',
                  borderRadius: 20,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                }}
              >
                LỊCH HẸN #{apt.id || appointmentId}
              </span>
              <span
                style={{
                  background: currentStatus.bg,
                  color: currentStatus.color,
                  padding: '3px 10px',
                  borderRadius: 12,
                  fontSize: '0.78rem',
                  fontWeight: 700,
                }}
              >
                {currentStatus.label}
              </span>
            </div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>
              Chi tiết Phiếu khám Nha khoa
            </h2>
          </div>
          <button
            onClick={onClose}
            className="btn btn-icon btn-ghost"
            style={{ color: '#ffffff', background: 'rgba(255,255,255,0.15)', borderRadius: '50%' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 32px', background: '#f8fafc' }}>
          {loading ? (
            <div style={{ padding: '60px 0', textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto 16px' }} />
              <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>Đang tải thông tin lịch khám...</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Doctor & Session Card */}
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: 16,
                  padding: '18px 20px',
                  border: '1px solid #ccfbf1',
                  boxShadow: '0 2px 8px rgba(13, 148, 136, 0.05)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 16,
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <DoctorAvatar
                    avatar={session.doctorAvatar || session.doctor?.avatar || session.doctor?.ava || apt.doctorAvatar}
                    name={session.doctorName}
                    size={52}
                  />
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#0d9488', fontWeight: 600 }}>
                      BÁC SĨ ĐIỀU TRỊ PHỤ TRÁCH
                    </div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                      {session.doctorName || 'Bác sĩ chuyên khoa Primecare'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                      <span
                        style={{
                          background: '#f0fdfa',
                          color: '#0f766e',
                          border: '1px solid #99f6e4',
                          borderRadius: 6,
                          padding: '1px 8px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                        }}
                      >
                        {formatDoctorRank(session.doctorRank) || 'Bác sĩ Nha khoa'}
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: 16,
                    background: '#f0fdfa',
                    padding: '10px 16px',
                    borderRadius: 12,
                    border: '1px solid #ccfbf1',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#0d9488', fontWeight: 600, textTransform: 'uppercase' }}>
                      Ngày khám
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f766e' }}>
                      {session.examDate || 'Hôm nay'}
                    </div>
                  </div>
                  <div style={{ width: 1, background: '#99f6e4' }} />
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#0d9488', fontWeight: 600, textTransform: 'uppercase' }}>
                      Ca khám
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f766e' }}>
                      {session.shift === 'MORNING' ? 'Sáng (08:00 - 12:00)' : 'Chiều (13:30 - 17:30)'}
                    </div>
                  </div>
                  {apt.queueNumber && (
                    <>
                      <div style={{ width: 1, background: '#99f6e4' }} />
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#0d9488', fontWeight: 600, textTransform: 'uppercase' }}>
                          Số thứ tự
                        </div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0d9488' }}>
                          #{apt.queueNumber}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Notice when appointment is PENDING_PAYMENT */}
              {apt.status === 'PENDING_PAYMENT' && (
                <div
                  style={{
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: 14,
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: '#fef3c7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#d97706',
                      }}
                    >
                      <CreditCard size={22} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#92400e', fontSize: '0.95rem' }}>
                        Chờ thanh toán phí giữ chỗ khám (10 phút)
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#b45309' }}>
                        Số tiền: <strong>{Number(session.examinationFee || 150000).toLocaleString('vi-VN')} đ</strong>.
                        Sau khi thanh toán, lịch hẹn sẽ được xác nhận tự động.
                      </div>
                    </div>
                  </div>
                  <button
                    className="btn btn-warning"
                    disabled={paying}
                    onClick={handlePayExaminationFee}
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '10px 18px',
                      borderRadius: 10,
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {paying ? <RefreshCw size={16} className="spin-slow" /> : <CreditCard size={16} />}
                    <span>Thanh toán VNPay ngay</span>
                  </button>
                </div>
              )}

              {/* Symptoms & Diagnosis Note */}
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: 16,
                  padding: 20,
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>
                      Triệu chứng bệnh nhân mô tả
                    </div>
                    <div
                      style={{
                        fontSize: '0.9rem',
                        color: '#1e293b',
                        background: '#f8fafc',
                        padding: '10px 14px',
                        borderRadius: 10,
                        border: '1px solid #f1f5f9',
                        minHeight: 48,
                      }}
                    >
                      {apt.symptoms || 'Không có mô tả triệu chứng ban đầu.'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0d9488', textTransform: 'uppercase', marginBottom: 4 }}>
                      Chẩn đoán từ Bác sĩ
                    </div>
                    <div
                      style={{
                        fontSize: '0.9rem',
                        color: '#0f766e',
                        background: '#f0fdfa',
                        padding: '10px 14px',
                        borderRadius: 10,
                        border: '1px solid #ccfbf1',
                        minHeight: 48,
                        fontWeight: apt.diagnosis ? 600 : 400,
                      }}
                    >
                      {apt.diagnosis || 'Bác sĩ chưa ghi nhận chẩn đoán (ca khám đang chờ tiếp nhận).'}
                    </div>
                  </div>
                </div>

                {apt.doctorNote && (
                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px dashed #e2e8f0' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Lời dặn của Bác sĩ: </span>
                    <span style={{ fontSize: '0.88rem', color: '#334155', fontStyle: 'italic' }}>"{apt.doctorNote}"</span>
                  </div>
                )}
              </div>

              {/* Tabs Navigation */}
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  borderBottom: '2px solid #e2e8f0',
                  paddingBottom: 2,
                }}
              >
                <button
                  type="button"
                  onClick={() => setActiveTab('services')}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '10px 16px',
                    cursor: 'pointer',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    color: activeTab === 'services' ? '#0d9488' : '#64748b',
                    borderBottom: activeTab === 'services' ? '3px solid #0d9488' : '3px solid transparent',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Sparkles size={16} />
                  <span>Dịch vụ chỉ định ({validServices.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('medications')}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '10px 16px',
                    cursor: 'pointer',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    color: activeTab === 'medications' ? '#0d9488' : '#64748b',
                    borderBottom: activeTab === 'medications' ? '3px solid #0d9488' : '3px solid transparent',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Pill size={16} />
                  <span>Đơn thuốc ({medications.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('invoices')}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '10px 16px',
                    cursor: 'pointer',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    color: activeTab === 'invoices' ? '#0d9488' : '#64748b',
                    borderBottom: activeTab === 'invoices' ? '3px solid #0d9488' : '3px solid transparent',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Receipt size={16} />
                  <span>Hóa đơn ({invoices.length})</span>
                </button>
              </div>

              {/* TAB 1: VALID SERVICES ONLY */}
              {activeTab === 'services' && (
                <div>
                  {/* Payable Services Banner */}
                  {payableServices.length > 0 && (
                    <div
                      style={{
                        background: 'linear-gradient(135deg, #fff1f2 0%, #fee2e2 100%)',
                        border: '1.5px solid #fca5a5',
                        borderRadius: 14,
                        padding: '16px 20px',
                        marginBottom: 16,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 12,
                        boxShadow: '0 4px 14px rgba(220, 38, 38, 0.08)',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#b91c1c', fontWeight: 800 }}>
                          <AlertCircle size={18} color="#dc2626" />
                          <span>Có {payableServices.length} dịch vụ cần thanh toán</span>
                        </div>
                        <div style={{ fontSize: '0.86rem', color: '#991b1b', marginTop: 2 }}>
                          Tổng chi phí dịch vụ: <strong style={{ fontSize: '1.08rem', color: '#dc2626', fontWeight: 900 }}>{totalPayableServicesAmount.toLocaleString('vi-VN')} đ</strong>
                        </div>
                      </div>
                      <button
                        disabled={paying}
                        onClick={handlePayServices}
                        style={{
                          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                          color: '#ffffff',
                          border: 'none',
                          padding: '11px 22px',
                          borderRadius: 10,
                          fontWeight: 800,
                          fontSize: '0.92rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          cursor: paying ? 'wait' : 'pointer',
                          boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => !paying && (e.currentTarget.style.background = '#b91c1c')}
                        onMouseLeave={(e) => !paying && (e.currentTarget.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)')}
                      >
                        {paying ? <RefreshCw size={16} className="spin-slow" /> : <CreditCard size={17} />}
                        <span>Thanh toán tất cả dịch vụ qua VNPay</span>
                      </button>
                    </div>
                  )}

                  {validServices.length === 0 ? (
                    <div
                      style={{
                        background: '#ffffff',
                        borderRadius: 16,
                        padding: '40px 20px',
                        textAlign: 'center',
                        color: 'var(--gray-400)',
                        border: '1px dashed #cbd5e1',
                      }}
                    >
                      <Sparkles size={36} style={{ marginBottom: 10, opacity: 0.5 }} />
                      <p style={{ margin: 0, fontWeight: 500 }}>Chưa có dịch vụ nha khoa nào được chỉ định cho ca khám này.</p>
                      <p style={{ margin: '4px 0 0', fontSize: '0.8rem' }}>Bác sĩ sẽ kiểm tra và chỉ định dịch vụ trong buổi khám trực tiếp.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {validServices.map((service, index) => {
                        const sStatus = getServiceStatusBadge(service);

                        return (
                          <div
                            key={service.id || index}
                            style={{
                              background: '#ffffff',
                              borderRadius: 14,
                              padding: '16px 18px',
                              border: '1px solid #e2e8f0',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 10,
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span
                                    style={{
                                      width: 24,
                                      height: 24,
                                      borderRadius: '50%',
                                      background: '#f0fdfa',
                                      color: '#0d9488',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '0.75rem',
                                      fontWeight: 700,
                                    }}
                                  >
                                    {index + 1}
                                  </span>
                                  <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: '#0f172a' }}>
                                    {service.serviceName}
                                  </h4>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4, marginLeft: 32 }}>
                                  Phòng thực hiện: <strong>{service.roomNumber || 'Phòng khám tổng quát'}</strong>
                                  {service.serviceType && ` • Loại: ${service.serviceType}`}
                                </div>
                              </div>

                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f766e' }}>
                                  {Number(service.unitPrice || 0).toLocaleString('vi-VN')} đ
                                </div>
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    marginTop: 4,
                                    padding: '3px 8px',
                                    borderRadius: 10,
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    background: sStatus.bg,
                                    color: sStatus.color,
                                  }}
                                >
                                  {sStatus.isPaid && <CheckCircle2 size={12} />}
                                  <span>{sStatus.label}</span>
                                </span>
                              </div>
                            </div>

                            {/* Service Results / Doctor Note if available */}
                            {(service.resultUrl || service.note) && (
                              <div
                                style={{
                                  background: '#f8fafc',
                                  borderRadius: 10,
                                  padding: '10px 12px',
                                  fontSize: '0.83rem',
                                  marginLeft: 32,
                                  border: '1px solid #e2e8f0',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                }}
                              >
                                <div>
                                  <span style={{ fontWeight: 600, color: '#475569' }}>Kết quả: </span>
                                  <span style={{ color: '#1e293b' }}>{service.note || 'Đã có kết quả khám.'}</span>
                                </div>
                                {service.resultUrl && (
                                  <a
                                    href={service.resultUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn btn-sm btn-outline"
                                    style={{
                                      fontSize: '0.75rem',
                                      padding: '4px 10px',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 4,
                                      color: '#0d9488',
                                      borderColor: '#0d9488',
                                    }}
                                  >
                                    <ExternalLink size={13} />
                                    <span>Xem ảnh/kết quả</span>
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: MEDICATIONS */}
              {activeTab === 'medications' && (
                <div>
                  {medications.length === 0 ? (
                    <div
                      style={{
                        background: '#ffffff',
                        borderRadius: 16,
                        padding: '40px 20px',
                        textAlign: 'center',
                        color: 'var(--gray-400)',
                        border: '1px dashed #cbd5e1',
                      }}
                    >
                      <Pill size={36} style={{ marginBottom: 10, opacity: 0.5 }} />
                      <p style={{ margin: 0, fontWeight: 500 }}>Chưa có đơn thuốc nào được kê cho lần khám này.</p>
                      <p style={{ margin: '4px 0 0', fontSize: '0.8rem' }}>Đơn thuốc sẽ xuất hiện tại đây khi bác sĩ hoàn tất buổi khám.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {medications.map((med, idx) => (
                        <div
                          key={med.id || idx}
                          style={{
                            background: '#ffffff',
                            borderRadius: 14,
                            padding: '16px 18px',
                            border: '1px solid #e2e8f0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span
                                style={{
                                  width: 24,
                                  height: 24,
                                  borderRadius: '50%',
                                  background: '#eff6ff',
                                  color: '#2563eb',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                }}
                              >
                                {idx + 1}
                              </span>
                              <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: '#0f172a' }}>
                                {med.medicineName} {med.strength && `(${med.strength})`}
                              </h4>
                            </div>
                            <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: 4, marginLeft: 32 }}>
                              Liều dùng: <strong>{med.dosage || '1 viên'}</strong> • Tần suất:{' '}
                              <strong>{med.frequency || '2 lần/ngày'}</strong>
                              {med.instruction && ` • Hướng dẫn: ${med.instruction}`}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                              SL: {med.quantity}
                            </div>
                            {med.durationDays && (
                              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                Trong {med.durationDays} ngày
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: INVOICES */}
              {activeTab === 'invoices' && (
                <div>
                  {invoices.length === 0 ? (
                    <div
                      style={{
                        background: '#ffffff',
                        borderRadius: 16,
                        padding: '40px 20px',
                        textAlign: 'center',
                        color: 'var(--gray-400)',
                        border: '1px dashed #cbd5e1',
                      }}
                    >
                      <Receipt size={36} style={{ marginBottom: 10, opacity: 0.5 }} />
                      <p style={{ margin: 0, fontWeight: 500 }}>Chưa có hóa đơn thanh toán nào.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {invoices.map((inv) => {
                        const isPaid = inv.status === 'PAID';
                        return (
                          <div
                            key={inv.id}
                            style={{
                              background: '#ffffff',
                              borderRadius: 14,
                              padding: '16px 18px',
                              border: '1px solid #e2e8f0',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span
                                  style={{
                                    background: inv.type === 'EXAMINATION' ? '#eff6ff' : '#f0fdfa',
                                    color: inv.type === 'EXAMINATION' ? '#2563eb' : '#0d9488',
                                    fontWeight: 700,
                                    fontSize: '0.75rem',
                                    padding: '2px 8px',
                                    borderRadius: 6,
                                  }}
                                >
                                  {inv.type === 'EXAMINATION' ? 'CÔNG KHÁM BÁC SĨ' : 'DỊCH VỤ NHA KHOA'}
                                </span>
                                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                  Hóa đơn #{inv.id}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>
                                Ngày tạo: {new Date(inv.createdAt || Date.now()).toLocaleDateString('vi-VN')}
                                {inv.paidAt && ` • Thanh toán: ${new Date(inv.paidAt).toLocaleTimeString('vi-VN')}`}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                                {Number(inv.amount || 0).toLocaleString('vi-VN')} đ
                              </div>
                              <span
                                style={{
                                  display: 'inline-block',
                                  marginTop: 4,
                                  padding: '2px 8px',
                                  borderRadius: 8,
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  background: isPaid ? '#dcfce7' : '#fef3c7',
                                  color: isPaid ? '#16a34a' : '#d97706',
                                }}
                              >
                                {isPaid ? 'Đã thanh toán' : 'Chờ thanh toán'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '14px 24px',
            background: '#ffffff',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: '0.82rem', color: 'var(--gray-500)' }}>
            Trung tâm chăm sóc khách hàng: <strong>1900 8888</strong>
          </div>
          <button className="btn btn-secondary" onClick={onClose} style={{ borderRadius: 10 }}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

