import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Calendar, Clock, User, Stethoscope, CheckCircle2,
  AlertCircle, RefreshCw, Eye, FileText, ChevronRight, LayoutGrid,
  ListFilter, Shield, Pill, Receipt, Award
} from 'lucide-react';
import { clinicService } from '../../services/clinicService';
import { userService } from '../../services/userService';
import { useToast } from '../../context/ToastContext';
import { formatDoctorRank } from '../../utils/doctorRank';
import AppointmentDetailModal from './AppointmentDetailModal';

const VALID_STATUSES = ['CONFIRMED', 'EXAMINING', 'COMPLETED'];

const statusConfig = {
  CONFIRMED: {
    title: 'Đã xác nhận',
    sub: 'Đã thanh toán phí khám & cấp số thứ tự, chờ tiếp nhận',
    color: '#2563eb',
    bg: '#eff6ff',
    border: '#bfdbfe',
    badgeBg: '#dbeafe',
  },
  EXAMINING: {
    title: 'Đang khám',
    sub: 'Bác sĩ đang tiếp nhận điều trị tại phòng khám',
    color: '#7c3aed',
    bg: '#faf5ff',
    border: '#ddd6fe',
    badgeBg: '#ede9fe',
  },
  COMPLETED: {
    title: 'Đã hoàn tất',
    sub: 'Đã kết thúc buổi khám, chẩn đoán & xuất đơn thuốc',
    color: '#16a34a',
    bg: '#f0fdf4',
    border: '#bbf7d0',
    badgeBg: '#dcfce7',
  },
};

export default function SessionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [session, setSession] = useState(location.state?.session || null);
  const [appointments, setAppointments] = useState([]);
  const [patientNames, setPatientNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [viewLayout, setViewLayout] = useState('board'); // 'board' (3 cột) | 'tabs' (chuyển tab)
  const [activeTab, setActiveTab] = useState('CONFIRMED');
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);

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

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      // 1. If session not passed in location state, load from admin sessions or doctor sessions
      if (!session) {
        try {
          const resSessions = await clinicService.getAdminSessions({ page: 0, size: 100 });
          const found = resSessions.data.result?.content?.find((s) => String(s.id) === String(id));
          if (found) setSession(found);
        } catch (e) {
          try {
            const resMy = await clinicService.getMySessions({ page: 0, size: 100 });
            const foundMy = resMy.data.result?.content?.find((s) => String(s.id) === String(id));
            if (foundMy) setSession(foundMy);
          } catch (e2) {
            console.warn('Could not load session metadata:', e2);
          }
        }
      }

      // 2. Load all appointments of this session
      const res = await clinicService.getSessionAppointments(id);
      const allApts = res.data.result || [];
      // CHỈ lấy các lịch khám hợp lệ: CONFIRMED, EXAMINING, COMPLETED
      const validApts = allApts.filter((a) => VALID_STATUSES.includes(a.status));
      setAppointments(validApts);
    } catch (err) {
      toast.error('Không thể tải danh sách lịch khám của ca này');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // Phân chia 3 nhóm trạng thái hợp lệ
  const confirmedList = appointments.filter((a) => a.status === 'CONFIRMED');
  const examiningList = appointments.filter((a) => a.status === 'EXAMINING');
  const completedList = appointments.filter((a) => a.status === 'COMPLETED');

  const groups = {
    CONFIRMED: confirmedList,
    EXAMINING: examiningList,
    COMPLETED: completedList,
  };

  const renderAppointmentCard = (apt) => {
    const cfg = statusConfig[apt.status] || statusConfig.CONFIRMED;

    return (
      <div
        key={apt.id}
        onClick={() => setSelectedAppointmentId(apt.id)}
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderLeft: `4px solid ${cfg.color}`,
          borderRadius: 12,
          padding: 16,
          boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
          cursor: 'pointer',
          transition: 'all 0.2s',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.08)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.04)';
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                background: '#ede9fe',
                color: '#6d28d9',
                fontWeight: 800,
                fontSize: '0.825rem',
                padding: '2px 8px',
                borderRadius: 8,
              }}
            >
              STT #{apt.queueNumber ?? '-'}
            </span>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--gray-900)' }}>
              Lịch khám #{apt.id}
            </span>
          </div>

          <span
            style={{
              background: cfg.badgeBg,
              color: cfg.color,
              fontWeight: 700,
              fontSize: '0.72rem',
              padding: '2px 8px',
              borderRadius: 6,
            }}
          >
            {cfg.title}
          </span>
        </div>

        <div style={{ fontSize: '0.825rem', color: 'var(--gray-700)' }}>
          <div>
            Bệnh nhân:{' '}
            <strong style={{ color: 'var(--gray-900)' }}>
              {apt.patientName || patientNames[apt.patientId]
                ? `${apt.patientName || patientNames[apt.patientId]} (#${apt.patientId})`
                : `Bệnh nhân #${apt.patientId}`}
            </strong>
          </div>
          <div style={{ marginTop: 4, color: 'var(--gray-500)', fontSize: '0.8rem' }}>
            Triệu chứng:{' '}
            <span style={{ color: 'var(--gray-800)' }}>
              {apt.symptoms || <em style={{ color: 'var(--gray-400)' }}>Không ghi nhận</em>}
            </span>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 10,
            borderTop: '1px dashed #e2e8f0',
            marginTop: 4,
          }}
        >
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>
            {Number(apt.examinationFee || session?.examinationFee || 0).toLocaleString('vi-VN')} đ
          </span>

          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedAppointmentId(apt.id);
            }}
            style={{
              fontSize: '0.75rem',
              padding: '4px 8px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              borderColor: '#c4b5fd',
              color: '#6d28d9',
              background: '#faf5ff',
              fontWeight: 600,
            }}
          >
            <Eye size={12} />
            <span>Hồ sơ & Dịch vụ</span>
            <ChevronRight size={12} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="management-page" style={{ paddingBottom: 40 }}>
      {/* Top Header / Back button */}
      <div style={{ marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => navigate('/admin/sessions')}
          className="btn btn-sm btn-ghost"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: 'var(--gray-600)',
            padding: '6px 0',
            marginBottom: 8,
            fontSize: '0.85rem',
          }}
        >
          <ArrowLeft size={16} />
          <span>Quay lại Quản lý ca khám</span>
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'var(--gray-900)' }}>
                Chi tiết Ca khám #{id}
              </h1>
              {session?.shift && (
                <span
                  className="badge"
                  style={{
                    background: session.shift === 'MORNING' ? '#eff6ff' : '#fff7ed',
                    color: session.shift === 'MORNING' ? '#1d4ed8' : '#c2410c',
                    border: '1px solid',
                    borderColor: session.shift === 'MORNING' ? '#bfdbfe' : '#fed7aa',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                  }}
                >
                  {session.shift === 'MORNING' ? 'Ca Sáng (08:00 - 12:00)' : 'Ca Chiều (13:30 - 17:30)'}
                </span>
              )}
              {session?.status && (
                <span
                  className="badge"
                  style={{
                    background: session.status === 'OPEN' ? '#dcfce7' : '#f1f5f9',
                    color: session.status === 'OPEN' ? '#15803d' : '#64748b',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                  }}
                >
                  {session.status === 'OPEN' ? 'Đang mở (OPEN)' : 'Đã đóng (CLOSED)'}
                </span>
              )}
            </div>

            <p style={{ margin: 0, color: 'var(--gray-600)', fontSize: '0.875rem' }}>
              Danh sách theo dõi các lịch hẹn hợp lệ trong ca: <strong>Đã xác nhận</strong>, <strong>Đang khám</strong> và <strong>Đã hoàn tất</strong>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Toggle View: Board (3 cột) vs Tabs */}
            <div style={{ display: 'flex', background: '#f1f5f9', padding: 3, borderRadius: 10 }}>
              <button
                type="button"
                onClick={() => setViewLayout('board')}
                className={`btn btn-sm ${viewLayout === 'board' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '5px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                title="Xem dạng 3 cột trực quan"
              >
                <LayoutGrid size={14} />
                <span>3 Cột (Board)</span>
              </button>
              <button
                type="button"
                onClick={() => setViewLayout('tabs')}
                className={`btn btn-sm ${viewLayout === 'tabs' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '5px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                title="Xem theo từng Tab trạng thái"
              >
                <ListFilter size={14} />
                <span>Theo Tab</span>
              </button>
            </div>

            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={loadData}
              disabled={loading}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <RefreshCw size={14} className={loading ? 'spin-slow' : ''} />
              <span>Làm mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* Session Metadata Banner */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          marginBottom: 20,
          background: 'linear-gradient(135deg, #f8fafc 0%, #ede9fe 100%)',
          border: '1px solid #ddd6fe',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          alignItems: 'center',
        }}
      >
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase', fontWeight: 600 }}>
            Bác sĩ phụ trách
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#6d28d9' }}>
              {session?.doctorRank ? `${formatDoctorRank(session.doctorRank)} ` : ''}{session?.doctorName || `Bác sĩ #${session?.doctorId || ''}`}
            </div>
          </div>
        </div>

        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase', fontWeight: 600 }}>
            Ngày khám bệnh
          </span>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--gray-800)', marginTop: 4 }}>
            {session?.examDate || '—'}
          </div>
        </div>

        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase', fontWeight: 600 }}>
            Tiền công khám
          </span>
          <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f766e', marginTop: 4 }}>
            {Number(session?.examinationFee || 0).toLocaleString('vi-VN')} đ
          </div>
        </div>

        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase', fontWeight: 600 }}>
            Lịch khám hợp lệ
          </span>
          <div style={{ fontWeight: 800, fontSize: '1rem', color: '#6d28d9', marginTop: 4 }}>
            {appointments.length} bệnh nhân
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto' }} />
          <p style={{ marginTop: 12, fontSize: '0.875rem', color: 'var(--gray-500)' }}>
            Đang tải danh sách lịch khám của ca #{id}...
          </p>
        </div>
      ) : appointments.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', background: '#ffffff', borderRadius: 16, border: '1px dashed #cbd5e1' }}>
          <AlertCircle size={40} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
          <h3 style={{ margin: '0 0 6px', color: 'var(--gray-800)' }}>Chưa có lịch khám hợp lệ nào</h3>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem', maxWidth: 450, margin: '0 auto' }}>
            Hiện chưa có bệnh nhân nào ở trạng thái ĐÃ XÁC NHẬN, ĐANG KHÁM hoặc ĐÃ HOÀN TẤT trong ca khám này.
          </p>
        </div>
      ) : (
        <>
          {/* ================= LAYOUT 1: DẠNG 3 CỘT (BOARD VIEW) ================= */}
          {viewLayout === 'board' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
                gap: 20,
                alignItems: 'flex-start',
              }}
            >
              {/* CỘT 1: CONFIRMED */}
              <div
                style={{
                  background: statusConfig.CONFIRMED.bg,
                  border: `1px solid ${statusConfig.CONFIRMED.border}`,
                  borderRadius: 16,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: `2px solid ${statusConfig.CONFIRMED.border}` }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: statusConfig.CONFIRMED.color }}>
                      1. ĐÃ XÁC NHẬN
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Chờ vào phòng khám</span>
                  </div>
                  <span
                    style={{
                      background: statusConfig.CONFIRMED.badgeBg,
                      color: statusConfig.CONFIRMED.color,
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      padding: '3px 10px',
                      borderRadius: 12,
                    }}
                  >
                    {confirmedList.length}
                  </span>
                </div>

                {confirmedList.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)', fontSize: '0.825rem', fontStyle: 'italic' }}>
                    Không có ca nào đang chờ
                  </div>
                ) : (
                  confirmedList.map((apt) => renderAppointmentCard(apt))
                )}
              </div>

              {/* CỘT 2: EXAMINING */}
              <div
                style={{
                  background: statusConfig.EXAMINING.bg,
                  border: `1px solid ${statusConfig.EXAMINING.border}`,
                  borderRadius: 16,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: `2px solid ${statusConfig.EXAMINING.border}` }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: statusConfig.EXAMINING.color }}>
                      2. ĐANG KHÁM
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Đang điều trị / cận lâm sàng</span>
                  </div>
                  <span
                    style={{
                      background: statusConfig.EXAMINING.badgeBg,
                      color: statusConfig.EXAMINING.color,
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      padding: '3px 10px',
                      borderRadius: 12,
                    }}
                  >
                    {examiningList.length}
                  </span>
                </div>

                {examiningList.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)', fontSize: '0.825rem', fontStyle: 'italic' }}>
                    Không có ca nào đang khám
                  </div>
                ) : (
                  examiningList.map((apt) => renderAppointmentCard(apt))
                )}
              </div>

              {/* CỘT 3: COMPLETED */}
              <div
                style={{
                  background: statusConfig.COMPLETED.bg,
                  border: `1px solid ${statusConfig.COMPLETED.border}`,
                  borderRadius: 16,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: `2px solid ${statusConfig.COMPLETED.border}` }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: statusConfig.COMPLETED.color }}>
                      3. ĐÃ HOÀN TẤT
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Đã chẩn đoán & có đơn thuốc</span>
                  </div>
                  <span
                    style={{
                      background: statusConfig.COMPLETED.badgeBg,
                      color: statusConfig.COMPLETED.color,
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      padding: '3px 10px',
                      borderRadius: 12,
                    }}
                  >
                    {completedList.length}
                  </span>
                </div>

                {completedList.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)', fontSize: '0.825rem', fontStyle: 'italic' }}>
                    Chưa có ca nào hoàn tất
                  </div>
                ) : (
                  completedList.map((apt) => renderAppointmentCard(apt))
                )}
              </div>
            </div>
          )}

          {/* ================= LAYOUT 2: DẠNG TABS THEO TRẠNG THÁI ================= */}
          {viewLayout === 'tabs' && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('CONFIRMED')}
                  style={{
                    padding: '14px 20px',
                    border: 'none',
                    background: activeTab === 'CONFIRMED' ? '#ffffff' : 'transparent',
                    borderBottom: activeTab === 'CONFIRMED' ? '2px solid #2563eb' : 'none',
                    fontWeight: 700,
                    color: activeTab === 'CONFIRMED' ? '#2563eb' : 'var(--gray-600)',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span>1. Đã xác nhận</span>
                  <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '2px 8px', borderRadius: 10, fontSize: '0.75rem' }}>
                    {confirmedList.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('EXAMINING')}
                  style={{
                    padding: '14px 20px',
                    border: 'none',
                    background: activeTab === 'EXAMINING' ? '#ffffff' : 'transparent',
                    borderBottom: activeTab === 'EXAMINING' ? '2px solid #7c3aed' : 'none',
                    fontWeight: 700,
                    color: activeTab === 'EXAMINING' ? '#7c3aed' : 'var(--gray-600)',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span>2. Đang khám</span>
                  <span style={{ background: '#ede9fe', color: '#6d28d9', padding: '2px 8px', borderRadius: 10, fontSize: '0.75rem' }}>
                    {examiningList.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('COMPLETED')}
                  style={{
                    padding: '14px 20px',
                    border: 'none',
                    background: activeTab === 'COMPLETED' ? '#ffffff' : 'transparent',
                    borderBottom: activeTab === 'COMPLETED' ? '2px solid #16a34a' : 'none',
                    fontWeight: 700,
                    color: activeTab === 'COMPLETED' ? '#16a34a' : 'var(--gray-600)',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span>3. Đã hoàn tất</span>
                  <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: 10, fontSize: '0.75rem' }}>
                    {completedList.length}
                  </span>
                </button>
              </div>

              <div style={{ padding: 20 }}>
                {groups[activeTab].length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)', fontSize: '0.875rem' }}>
                    Không có lịch khám nào ở trạng thái {statusConfig[activeTab]?.title}
                  </div>
                ) : (
                  <table className="data-table" style={{ margin: 0 }}>
                    <thead>
                      <tr>
                        <th style={{ width: 60, textAlign: 'center' }}>STT</th>
                        <th>Mã hẹn</th>
                        <th>Bệnh nhân</th>
                        <th>Triệu chứng ban đầu</th>
                        <th>Phí khám</th>
                        <th style={{ textAlign: 'right' }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groups[activeTab].map((apt) => (
                        <tr
                          key={apt.id}
                          onClick={() => setSelectedAppointmentId(apt.id)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td style={{ textAlign: 'center', fontWeight: 800, color: '#7c3aed' }}>
                            #{apt.queueNumber ?? '-'}
                          </td>
                          <td style={{ fontWeight: 700 }}>#{apt.id}</td>
                          <td>
                            {apt.patientName || patientNames[apt.patientId] ? (
                              <div>
                                <div style={{ fontWeight: 700, color: 'var(--gray-900)' }}>
                                  {apt.patientName || patientNames[apt.patientId]}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: 2 }}>
                                  Mã BN: #{apt.patientId}
                                </div>
                              </div>
                            ) : (
                              <strong>Bệnh nhân #{apt.patientId}</strong>
                            )}
                          </td>
                          <td style={{ fontSize: '0.825rem', color: 'var(--gray-600)', maxWidth: 280 }}>
                            {apt.symptoms || <span style={{ color: 'var(--gray-400)' }}>Không có</span>}
                          </td>
                          <td style={{ fontWeight: 700 }}>
                            {Number(apt.examinationFee || session?.examinationFee || 0).toLocaleString('vi-VN')} đ
                          </td>
                          <td style={{ textAlign: 'right' }}>
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
                                fontSize: '0.78rem',
                                padding: '5px 10px',
                                color: '#6d28d9',
                                borderColor: '#c4b5fd',
                              }}
                            >
                              <Eye size={13} />
                              <span>Hồ sơ chi tiết</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Appointment Detail Modal (Services, Medications, Invoices, Upload PDF) */}
      {selectedAppointmentId && (
        <AppointmentDetailModal
          appointmentId={selectedAppointmentId}
          onClose={() => setSelectedAppointmentId(null)}
          onRefreshParent={loadData}
        />
      )}
    </div>
  );
}

