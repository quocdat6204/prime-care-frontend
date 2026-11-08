import { useState, useEffect } from 'react';
import { X, RefreshCw, UserPlus } from 'lucide-react';
import { clinicService } from '../../services/clinicService';
import { userService } from '../../services/userService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { formatDoctorRank } from '../../utils/doctorRank';
import WalkInModal from './WalkInModal';

// Đầy đủ 7 trạng thái nghiệp vụ chuẩn theo tài liệu CLINIC_SERVICE_API.md
const statusMap = {
  PENDING_PAYMENT: { label: 'Chờ thanh toán', color: '#d97706', bg: '#fef3c7' },
  CONFIRMED: { label: 'Đã xác nhận', color: '#2563eb', bg: '#dbeafe' },
  EXAMINING: { label: 'Đang khám', color: '#7c3aed', bg: '#ede9fe' },
  COMPLETED: { label: 'Đã hoàn tất', color: '#16a34a', bg: '#dcfce7' },
  CANCELLED: { label: 'Đã hủy', color: '#dc2626', bg: '#fee2e2' },
  EXPIRED: { label: 'Hết hạn giữ chỗ', color: '#64748b', bg: '#f1f5f9' },
  REFUND_PENDING: { label: 'Chờ hoàn tiền', color: '#ea580c', bg: '#ffedd5' },
};

export default function SessionAppointmentsModal({ session, onClose, initialFilterMode = 'ALL' }) {
  const toast = useToast();
  const { role } = useAuth();
  const isDoctor = role === 'DOCTOR';
  const [appointments, setAppointments] = useState([]);
  const [patientNames, setPatientNames] = useState({});
  const [loading, setLoading] = useState(false);
  const [filterMode, setFilterMode] = useState(initialFilterMode);
  const [showWalkInModal, setShowWalkInModal] = useState(false);

  useEffect(() => {
    // Fallback load tên bệnh nhân nếu backend chưa kịp gắn patientName
    const missingIds = [
      ...new Set(
        appointments
          .filter((a) => !a.patientName && a.patientId && !patientNames[a.patientId])
          .map((a) => a.patientId)
      ),
    ];
    if (missingIds.length > 0) {
      missingIds.forEach(async (pId) => {
        try {
          const res = await userService.getUserById(pId);
          const u = res.data?.result || res.data;
          if (u?.fullName) {
            setPatientNames((prev) => ({ ...prev, [pId]: u.fullName }));
          }
        } catch (e) {
          // Ignore fallback error
        }
      });
    }
  }, [appointments]);

  useEffect(() => {
    setFilterMode(initialFilterMode);
  }, [initialFilterMode, session?.id]);

  const fetchAppointments = async () => {
    if (!session?.id) return;
    setLoading(true);
    try {
      // Fetch all appointments of this session
      const res = await clinicService.getSessionAppointments(session.id);
      setAppointments(res.data.result || []);
    } catch (err) {
      toast.error('Không thể tải danh sách lịch hẹn của ca khám này');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [session?.id]);

  if (!session) return null;

  // Lọc lịch khám theo trạng thái đã chọn
  const filteredAppointments = appointments.filter((apt) => {
    if (filterMode === 'ALL') return true;
    return apt.status === filterMode;
  });

  // Tính số lượng đầy đủ cho từng trạng thái theo chuẩn CLINIC_SERVICE_API.md
  const countAll = appointments.length;
  const countPending = appointments.filter((a) => a.status === 'PENDING_PAYMENT').length;
  const countConfirmed = appointments.filter((a) => a.status === 'CONFIRMED').length;
  const countExamining = appointments.filter((a) => a.status === 'EXAMINING').length;
  const countCompleted = appointments.filter((a) => a.status === 'COMPLETED').length;
  const countCancelled = appointments.filter((a) => a.status === 'CANCELLED').length;
  const countExpired = appointments.filter((a) => a.status === 'EXPIRED').length;
  const countRefund = appointments.filter((a) => a.status === 'REFUND_PENDING').length;

  const STATUS_TABS = isDoctor
    ? [
        { key: 'ALL', label: 'Tất cả ca hợp lệ', count: countAll },
        { key: 'CONFIRMED', label: 'Đã xác nhận', count: countConfirmed },
        { key: 'EXAMINING', label: 'Đang khám', count: countExamining },
        { key: 'COMPLETED', label: 'Đã hoàn tất', count: countCompleted },
      ]
    : [
        { key: 'ALL', label: 'Tất cả trạng thái', count: countAll },
        { key: 'PENDING_PAYMENT', label: 'Chờ thanh toán', count: countPending },
        { key: 'CONFIRMED', label: 'Đã xác nhận', count: countConfirmed },
        { key: 'EXAMINING', label: 'Đang khám', count: countExamining },
        { key: 'COMPLETED', label: 'Đã hoàn tất', count: countCompleted },
        { key: 'CANCELLED', label: 'Đã hủy', count: countCancelled },
        { key: 'EXPIRED', label: 'Hết hạn', count: countExpired },
        { key: 'REFUND_PENDING', label: 'Chờ hoàn tiền', count: countRefund },
      ];

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div
          className="modal-content"
          style={{
            maxWidth: 1080,
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
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              background: '#ffffff',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--gray-900)' }}>
                  Danh sách toàn bộ lịch đặt trong ca #{session.id}
                </h2>
                <span
                  className="badge"
                  style={{
                    background: session.shift === 'MORNING' ? '#eff6ff' : '#fff7ed',
                    color: session.shift === 'MORNING' ? '#1d4ed8' : '#c2410c',
                    border: '1px solid',
                    borderColor: session.shift === 'MORNING' ? '#bfdbfe' : '#fed7aa',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    padding: '3px 10px',
                  }}
                >
                  {session.shift === 'MORNING' ? 'Ca Sáng (08:00 - 12:00)' : 'Ca Chiều (13:30 - 17:30)'}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--gray-500)' }}>
                Hiển thị đầy đủ tất cả lịch hẹn bệnh nhân đã đặt ở mọi trạng thái nghiệp vụ | Bác sĩ:{' '}
                <strong style={{ color: 'var(--gray-800)' }}>
                  {session.doctorRank ? `${formatDoctorRank(session.doctorRank)} ` : ''}
                  {session.doctorName || `Bác sĩ #${session.doctorId}`}
                </strong>{' '}
                | Ngày: <strong style={{ color: 'var(--gray-800)' }}>{session.examDate}</strong>
              </p>
            </div>

            <button className="btn btn-icon btn-ghost" onClick={onClose} title="Đóng">
              <X size={20} />
            </button>
          </div>

          {/* Filter Toolbar / Status Tabs (ĐẦY ĐỦ TẤT CẢ TRẠNG THÁI) */}
          <div
            style={{
              padding: '12px 24px',
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                flexWrap: 'wrap',
                flex: 1,
              }}
            >
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
                      whiteSpace: 'nowrap',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <span>{tab.label}</span>
                    <span
                      style={{
                        marginLeft: 2,
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

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {!isDoctor && session?.status === 'OPEN' && (
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => setShowWalkInModal(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.8rem',
                    whiteSpace: 'nowrap',
                    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                    borderColor: '#059669',
                    fontWeight: 700,
                    height: 32,
                  }}
                >
                  <UserPlus size={14} />
                  <span>Tiếp nhận tại quầy</span>
                </button>
              )}

              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={fetchAppointments}
                disabled={loading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: '0.8rem',
                  whiteSpace: 'nowrap',
                  height: 32,
                }}
              >
                <RefreshCw size={13} className={loading ? 'spin-slow' : ''} />
                <span>Làm mới</span>
              </button>
            </div>
          </div>

          {/* Body Table - Bảng rộng rãi, không bị rớt chữ xuống dòng */}
          <div className="modal-body" style={{ padding: 0, flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: 50, textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto' }} />
                <p style={{ marginTop: 12, fontSize: '0.85rem', color: 'var(--gray-500)' }}>
                  Đang tải danh sách lịch hẹn...
                </p>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div style={{ padding: 50, textAlign: 'center', color: 'var(--gray-400)' }}>
                Không có lịch khám nào ở trạng thái này
              </div>
            ) : (
              <table className="data-table" style={{ margin: 0, width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ width: 75, textAlign: 'center', whiteSpace: 'nowrap', padding: '12px 14px' }}>
                      STT
                    </th>
                    <th style={{ width: 95, whiteSpace: 'nowrap', padding: '12px 14px' }}>
                      MÃ HẸN
                    </th>
                    <th style={{ minWidth: 150, whiteSpace: 'nowrap', padding: '12px 14px' }}>
                      BỆNH NHÂN
                    </th>
                    <th style={{ minWidth: 150, whiteSpace: 'nowrap', padding: '12px 14px' }}>
                      TRẠNG THÁI
                    </th>
                    <th style={{ minWidth: 280, padding: '12px 14px' }}>
                      TRIỆU CHỨNG BAN ĐẦU
                    </th>
                    <th style={{ minWidth: 140, textAlign: 'right', whiteSpace: 'nowrap', padding: '12px 18px' }}>
                      PHÍ KHÁM
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map((apt) => {
                    const sInfo = statusMap[apt.status] || { label: apt.status, color: '#475569', bg: '#f1f5f9' };
                    return (
                      <tr
                        key={apt.id}
                        style={{ borderBottom: '1px solid #f1f5f9' }}
                      >
                        {/* STT */}
                        <td style={{ textAlign: 'center', fontWeight: 800, color: '#7c3aed', whiteSpace: 'nowrap', padding: '14px' }}>
                          {apt.queueNumber ? `#${apt.queueNumber}` : '—'}
                        </td>

                        {/* Mã hẹn */}
                        <td style={{ fontWeight: 700, color: 'var(--gray-900)', whiteSpace: 'nowrap', padding: '14px' }}>
                          #{apt.id}
                        </td>

                        {/* Bệnh nhân (Không rớt chữ, hiển thị cả Họ tên và Mã BN) */}
                        <td style={{ whiteSpace: 'nowrap', padding: '14px' }}>
                          {apt.patientName || patientNames[apt.patientId] ? (
                            <div>
                              <div style={{ fontWeight: 700, color: 'var(--gray-900)', fontSize: '0.9rem' }}>
                                {apt.patientName || patientNames[apt.patientId]}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: 2 }}>
                                Mã BN: #{apt.patientId}
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.875rem', color: 'var(--gray-800)', fontWeight: 600 }}>
                              Bệnh nhân #{apt.patientId}
                            </span>
                          )}
                        </td>

                        {/* Trạng thái (Huy hiệu chuẩn không rớt dòng) */}
                        <td style={{ whiteSpace: 'nowrap', padding: '14px' }}>
                          <span
                            className="badge"
                            style={{
                              background: sInfo.bg,
                              color: sInfo.color,
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              padding: '5px 12px',
                              borderRadius: 6,
                              display: 'inline-block',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {sInfo.label}
                          </span>
                        </td>

                        {/* Triệu chứng ban đầu */}
                        <td style={{ fontSize: '0.85rem', color: 'var(--gray-700)', padding: '14px', lineHeight: 1.5 }}>
                          {apt.symptoms || <span style={{ color: 'var(--gray-400)', fontStyle: 'italic' }}>Không có</span>}
                        </td>

                        {/* Phí khám (Không rớt chữ đ) */}
                        <td style={{ fontWeight: 700, color: 'var(--gray-900)', whiteSpace: 'nowrap', textAlign: 'right', padding: '14px 18px' }}>
                          {Number(apt.examinationFee || session.examinationFee).toLocaleString('vi-VN')} đ
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
            className="modal-footer"
            style={{
              padding: '12px 24px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f8fafc',
            }}
          >
            <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>
              Đang hiển thị: <strong style={{ color: 'var(--gray-800)' }}>{filteredAppointments.length}</strong> / <strong>{appointments.length}</strong> lịch đặt trong ca
            </div>
            <button className="btn btn-outline btn-sm" onClick={onClose} style={{ minWidth: 80 }}>
              Đóng
            </button>
          </div>
        </div>
      </div>

      {showWalkInModal && (
        <WalkInModal
          session={session}
          onClose={() => setShowWalkInModal(false)}
          onSuccess={() => {
            setShowWalkInModal(false);
            fetchAppointments();
          }}
        />
      )}
    </>
  );
}
