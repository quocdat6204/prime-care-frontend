import { useState, useEffect } from 'react';
import {
  X, RefreshCw, Calendar, Clock, Stethoscope, User,
  Eye, FileText, AlertCircle, ChevronRight
} from 'lucide-react';
import { clinicService } from '../../services/clinicService';
import { useToast } from '../../context/ToastContext';
import { formatDoctorRank } from '../../utils/doctorRank';
import AppointmentDetailModal from './AppointmentDetailModal';

const statusMap = {
  PENDING_PAYMENT: { label: 'Chờ thanh toán', color: '#d97706', bg: '#fef3c7' },
  CONFIRMED: { label: 'Đã xác nhận', color: '#2563eb', bg: '#dbeafe' },
  EXAMINING: { label: 'Đang khám', color: '#7c3aed', bg: '#ede9fe' },
  COMPLETED: { label: 'Đã hoàn tất', color: '#16a34a', bg: '#dcfce7' },
  CANCELLED: { label: 'Đã hủy', color: '#dc2626', bg: '#fee2e2' },
  EXPIRED: { label: 'Hết hạn giữ chỗ', color: '#64748b', bg: '#f1f5f9' },
  REFUND_PENDING: { label: 'Chờ hoàn tiền', color: '#ea580c', bg: '#ffedd5' },
};

export default function UserAppointmentsModal({ user, onClose }) {
  const toast = useToast();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterMode, setFilterMode] = useState('ALL');
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);

  const fetchAppointments = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await clinicService.getPatientAppointments(user.id);
      setAppointments(res.data.result || []);
    } catch (err) {
      console.error('Failed to load user appointments:', err);
      toast.error('Không thể tải lịch sử khám của người dùng này');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [user?.id]);

  if (!user) return null;

  const filteredAppointments = appointments.filter((apt) => {
    if (filterMode === 'ALL') return true;
    return apt.status === filterMode;
  });

  const countAll = appointments.length;
  const countConfirmed = appointments.filter((a) => a.status === 'CONFIRMED').length;
  const countExamining = appointments.filter((a) => a.status === 'EXAMINING').length;
  const countCompleted = appointments.filter((a) => a.status === 'COMPLETED').length;
  const countCancelled = appointments.filter((a) => a.status === 'CANCELLED').length;

  const STATUS_TABS = [
    { key: 'ALL', label: 'Tất cả', count: countAll },
    { key: 'CONFIRMED', label: 'Đã xác nhận', count: countConfirmed },
    { key: 'EXAMINING', label: 'Đang khám', count: countExamining },
    { key: 'COMPLETED', label: 'Đã hoàn tất', count: countCompleted },
    { key: 'CANCELLED', label: 'Đã hủy', count: countCancelled },
  ];

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div
          className="modal-content"
          style={{
            maxWidth: 1060,
            width: '95vw',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            padding: 0,
            overflow: 'hidden',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="modal-header"
            style={{
              padding: '18px 24px',
              borderBottom: '1px solid #e2e8f0',
              background: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)',
                  color: '#6d28d9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  border: '1px solid #c4b5fd',
                  flexShrink: 0,
                }}
              >
                {user.ava ? (
                  <img
                    src={user.ava}
                    alt=""
                    style={{ width: '100%', height: '100%', borderRadius: 12, objectFit: 'cover' }}
                  />
                ) : (
                  user.fullName?.charAt(0) || user.username?.charAt(0) || <User size={22} />
                )}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--gray-900)' }}>
                    Lịch khám của {user.fullName || user.username}
                  </h2>
                  <span
                    style={{
                      background: '#eff6ff',
                      color: '#1d4ed8',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      padding: '2px 8px',
                      borderRadius: 6,
                    }}
                  >
                    Mã BN: #{user.id}
                  </span>
                  <span
                    className={`badge badge-${user.role?.toLowerCase()}`}
                    style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                  >
                    {user.role}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    fontSize: '0.8125rem',
                    color: 'var(--gray-500)',
                    marginTop: 4,
                    flexWrap: 'wrap',
                  }}
                >
                  {user.phone && <span>SĐT: <strong style={{ color: 'var(--gray-700)' }}>{user.phone}</strong></span>}
                  {user.email && <span>Email: <strong style={{ color: 'var(--gray-700)' }}>{user.email}</strong></span>}
                  <span>
                    Tổng số: <strong style={{ color: '#6d28d9' }}>{appointments.length}</strong> lịch hẹn
                  </span>
                </div>
              </div>
            </div>

            <button className="btn btn-icon btn-ghost" onClick={onClose} title="Đóng">
              <X size={20} />
            </button>
          </div>

          {/* Filter Bar */}
          <div
            style={{
              padding: '10px 24px',
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {STATUS_TABS.map((tab) => {
                const isActive = filterMode === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setFilterMode(tab.key)}
                    style={{
                      fontSize: '0.78rem',
                      padding: '5px 11px',
                      borderRadius: 8,
                      fontWeight: isActive ? 700 : 500,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <span>{tab.label}</span>
                    <span
                      style={{
                        padding: '1px 6px',
                        borderRadius: 10,
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        background: isActive ? 'rgba(255, 255, 255, 0.25)' : '#e2e8f0',
                        color: isActive ? '#ffffff' : 'var(--gray-700)',
                      }}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={fetchAppointments}
              disabled={loading}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', height: 32 }}
            >
              <RefreshCw size={13} className={loading ? 'spin-slow' : ''} />
              <span>Làm mới</span>
            </button>
          </div>

          {/* Table Body */}
          <div className="modal-body" style={{ padding: 0, flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: 50, textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto' }} />
                <p style={{ marginTop: 12, fontSize: '0.85rem', color: 'var(--gray-500)' }}>
                  Đang tải lịch sử khám...
                </p>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center' }}>
                <Calendar size={42} style={{ color: '#cbd5e1', margin: '0 auto 12px' }} />
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--gray-700)' }}>
                  Chưa có lịch hẹn nào
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginTop: 4 }}>
                  {filterMode !== 'ALL'
                    ? 'Không có lịch hẹn nào ở trạng thái đã chọn.'
                    : 'Người dùng này chưa đăng ký lịch khám nào trong hệ thống.'}
                </p>
              </div>
            ) : (
              <table className="data-table" style={{ margin: 0, width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ width: 85, whiteSpace: 'nowrap', padding: '12px 14px' }}>MÃ HẸN</th>
                    <th style={{ minWidth: 160, whiteSpace: 'nowrap', padding: '12px 14px' }}>NGÀY & CA KHÁM</th>
                    <th style={{ minWidth: 170, whiteSpace: 'nowrap', padding: '12px 14px' }}>BÁC SĨ PHỤ TRÁCH</th>
                    <th style={{ minWidth: 140, whiteSpace: 'nowrap', padding: '12px 14px' }}>TRẠNG THÁI</th>
                    <th style={{ minWidth: 220, padding: '12px 14px' }}>TRIỆU CHỨNG / CHẨN ĐOÁN</th>
                    <th style={{ width: 120, textAlign: 'right', whiteSpace: 'nowrap', padding: '12px 14px' }}>PHÍ KHÁM</th>
                    <th style={{ width: 130, textAlign: 'right', whiteSpace: 'nowrap', padding: '12px 18px' }}>THAO TÁC</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map((apt) => {
                    const sInfo = statusMap[apt.status] || { label: apt.status, color: '#475569', bg: '#f1f5f9' };
                    return (
                      <tr
                        key={apt.id}
                        style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                        onClick={() => setSelectedAppointmentId(apt.id)}
                        className="hover-row"
                      >
                        {/* Mã hẹn & STT */}
                        <td style={{ padding: '14px', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 800, color: '#6d28d9', fontSize: '0.9rem' }}>
                            #{apt.id}
                          </div>
                          {apt.queueNumber != null && (
                            <div style={{ fontSize: '0.72rem', color: '#7c3aed', fontWeight: 700, marginTop: 2 }}>
                              STT #{apt.queueNumber}
                            </div>
                          )}
                        </td>

                        {/* Ngày & Ca khám */}
                        <td style={{ padding: '14px', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 700, color: 'var(--gray-900)', fontSize: '0.875rem' }}>
                            {apt.examDate || (apt.createdAt ? new Date(apt.createdAt).toLocaleDateString('vi-VN') : '—')}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: 2 }}>
                            {apt.shift === 'MORNING' ? 'Ca Sáng (08:00 - 12:00)' : apt.shift === 'AFTERNOON' ? 'Ca Chiều (13:30 - 17:30)' : `Ca khám #${apt.sessionId}`}
                          </div>
                        </td>

                        {/* Bác sĩ phụ trách */}
                        <td style={{ padding: '14px', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 700, color: 'var(--gray-800)', fontSize: '0.875rem' }}>
                            {apt.doctorRank ? `${formatDoctorRank(apt.doctorRank)} ` : ''}{apt.doctorName || 'Chưa phân công'}
                          </div>
                          {apt.doctorId && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: 2 }}>
                              Mã BS: #{apt.doctorId}
                            </div>
                          )}
                        </td>

                        {/* Trạng thái */}
                        <td style={{ padding: '14px', whiteSpace: 'nowrap' }}>
                          <span
                            className="badge"
                            style={{
                              background: sInfo.bg,
                              color: sInfo.color,
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              padding: '4px 10px',
                              borderRadius: 6,
                              display: 'inline-block',
                            }}
                          >
                            {sInfo.label}
                          </span>
                        </td>

                        {/* Triệu chứng / Chẩn đoán */}
                        <td style={{ padding: '14px', fontSize: '0.825rem', color: 'var(--gray-700)', lineHeight: 1.45 }}>
                          <div>
                            <span style={{ color: 'var(--gray-500)' }}>Triệu chứng: </span>
                            {apt.symptoms || <em style={{ color: 'var(--gray-400)' }}>Không có</em>}
                          </div>
                          {apt.diagnosis && (
                            <div style={{ marginTop: 4, color: '#6d28d9', fontWeight: 600 }}>
                              <span style={{ color: 'var(--gray-500)', fontWeight: 400 }}>Chẩn đoán: </span>
                              {apt.diagnosis}
                            </div>
                          )}
                        </td>

                        {/* Phí khám */}
                        <td style={{ padding: '14px', textAlign: 'right', fontWeight: 700, color: '#059669', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                          {Number(apt.examinationFee || 0).toLocaleString('vi-VN')} đ
                        </td>

                        {/* Thao tác */}
                        <td style={{ padding: '14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAppointmentId(apt.id);
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: '0.75rem',
                              padding: '4px 8px',
                              color: '#6d28d9',
                              borderColor: '#c4b5fd',
                              background: '#faf5ff',
                              fontWeight: 600,
                            }}
                          >
                            <Eye size={12} />
                            <span>Chi tiết</span>
                            <ChevronRight size={12} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '12px 24px',
              borderTop: '1px solid #e2e8f0',
              background: '#f8fafc',
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Đóng
            </button>
          </div>
        </div>
      </div>

      {/* Appointment Detail Modal (Xem đầy đủ cận lâm sàng, đơn thuốc, hóa đơn) */}
      {selectedAppointmentId && (
        <AppointmentDetailModal
          appointmentId={selectedAppointmentId}
          zIndex={1400}
          onClose={() => setSelectedAppointmentId(null)}
          onRefreshParent={fetchAppointments}
        />
      )}
    </>
  );
}

