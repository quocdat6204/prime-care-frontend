import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { clinicService } from '../../services/clinicService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import {
  Calendar, Clock, Users, RefreshCw, ChevronLeft, ChevronRight,
  Eye, Stethoscope, CheckCircle2, XCircle, Filter, CalendarDays,
  Sun, Sunset, ArrowRight
} from 'lucide-react';
import SessionAppointmentsModal from '../admin/SessionAppointmentsModal';
import { formatDoctorRank } from '../../utils/doctorRank';

export default function DoctorSchedule() {
  const toast = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Date helpers
  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const tomorrowStr = useMemo(() => {
    const tom = new Date();
    tom.setDate(tom.getDate() + 1);
    const y = tom.getFullYear();
    const m = String(tom.getMonth() + 1).padStart(2, '0');
    const d = String(tom.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  // Filter states (Mặc định chọn ngày hôm nay để bác sĩ tiện theo dõi ca trực hiện tại)
  const [dateFilter, setDateFilter] = useState(todayStr);
  const [shiftFilter, setShiftFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal xem danh sách lịch hẹn trong ca
  const [viewingSession, setViewingSession] = useState(null);

  // Lấy danh sách ca khám của chính bác sĩ đăng nhập
  const fetchMySessions = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        size,
      };
      if (dateFilter) {
        params.date = dateFilter;
      }

      const res = await clinicService.getMySessions(params);
      const data = res.data.result;
      let content = data.content || [];

      // Filter shift & status on client if chosen
      if (shiftFilter) {
        content = content.filter((s) => s.shift === shiftFilter);
      }
      if (statusFilter) {
        content = content.filter((s) => s.status === statusFilter);
      }

      setSessions(content);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      console.error('Error fetching doctor sessions:', err);
      toast.error('Không thể tải lịch khám của bác sĩ');
    } finally {
      setLoading(false);
    }
  }, [page, size, dateFilter, shiftFilter, statusFilter, toast]);

  useEffect(() => {
    fetchMySessions();
  }, [fetchMySessions]);

  // Format ngày sang tiếng Việt (Thứ..., ngày dd/mm/yyyy)
  const formatVietnameseDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const [year, month, day] = dateStr.split('-');
      const d = new Date(year, month - 1, day);
      const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
      const dayName = days[d.getDay()];
      return `${dayName}, ${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  // Thống kê nhanh theo danh sách hiện tại
  const stats = useMemo(() => {
    const totalSessions = totalElements;
    const totalPatientsBooked = sessions.reduce((acc, s) => acc + (s.lastQueueNumber || 0), 0);
    const openSessions = sessions.filter((s) => s.status === 'OPEN').length;
    return { totalSessions, totalPatientsBooked, openSessions };
  }, [totalElements, sessions]);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>
            <Calendar size={28} style={{ color: 'var(--doctor-accent)' }} />
            Lịch khám bệnh & Ca trực
          </h1>
          <p style={{ margin: '6px 0 0', color: 'var(--gray-500)', fontSize: '0.9rem' }}>
            Theo dõi ca trực hôm nay, ngày mai hoặc tra cứu các ngày khác để tiếp nhận bệnh nhân khám nha khoa
          </p>
        </div>

        <button
          className="btn btn-outline"
          onClick={fetchMySessions}
          disabled={loading}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
        >
          <RefreshCw size={16} className={loading ? 'spin-slow' : ''} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--doctor-bg)', color: 'var(--doctor-accent)' }}>
            <CalendarDays size={22} />
          </div>
          <div className="stat-info">
            <h3>Ca khám đang xem</h3>
            <div className="stat-value">{sessions.length}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
            <Users size={22} />
          </div>
          <div className="stat-info">
            <h3>Bệnh nhân đã đăng ký</h3>
            <div className="stat-value">{stats.totalPatientsBooked}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <Stethoscope size={22} />
          </div>
          <div className="stat-info">
            <h3>Bác sĩ phụ trách</h3>
            <div className="stat-value" style={{ fontSize: '1.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.fullName || 'Bác sĩ'}
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar bộ lọc ngày và ca */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body" style={{ padding: '16px 20px' }}>
          {/* Quick Date Selectors */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--gray-600)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Filter size={15} /> Xem nhanh:
            </span>

            <button
              type="button"
              className={`btn btn-sm ${dateFilter === todayStr ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => {
                setDateFilter(todayStr);
                setPage(0);
              }}
              style={{ borderRadius: 20, padding: '4px 14px', fontSize: '0.825rem' }}
            >
              Hôm nay ({todayStr.split('-').reverse().slice(0, 2).join('/')})
            </button>

            <button
              type="button"
              className={`btn btn-sm ${dateFilter === tomorrowStr ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => {
                setDateFilter(tomorrowStr);
                setPage(0);
              }}
              style={{ borderRadius: 20, padding: '4px 14px', fontSize: '0.825rem' }}
            >
              Ngày mai ({tomorrowStr.split('-').reverse().slice(0, 2).join('/')})
            </button>

            <button
              type="button"
              className={`btn btn-sm ${!dateFilter ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => {
                setDateFilter('');
                setPage(0);
              }}
              style={{ borderRadius: 20, padding: '4px 14px', fontSize: '0.825rem' }}
            >
              Tất cả các ngày
            </button>
          </div>

          {/* Form chọn ngày & ca trực */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
            {/* Date picker */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--gray-700)', whiteSpace: 'nowrap' }}>
                Chọn ngày:
              </label>
              <input
                type="date"
                className="form-control"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setPage(0);
                }}
                style={{ width: 170, height: 38, fontSize: '0.875rem' }}
              />
            </div>

            {/* Shift select */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--gray-700)', whiteSpace: 'nowrap' }}>
                Ca trực:
              </label>
              <select
                className="form-control"
                value={shiftFilter}
                onChange={(e) => {
                  setShiftFilter(e.target.value);
                  setPage(0);
                }}
                style={{ width: 190, height: 38, fontSize: '0.875rem' }}
              >
                <option value="">Tất cả ca trực</option>
                <option value="MORNING">Ca Sáng (08:00 - 12:00)</option>
                <option value="AFTERNOON">Ca Chiều (13:30 - 17:30)</option>
              </select>
            </div>

            {/* Status select */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--gray-700)', whiteSpace: 'nowrap' }}>
                Trạng thái:
              </label>
              <select
                className="form-control"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(0);
                }}
                style={{ width: 170, height: 38, fontSize: '0.875rem' }}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="OPEN">Đang mở (OPEN)</option>
                <option value="CLOSED">Đã đóng (CLOSED)</option>
              </select>
            </div>

            {/* Reset Filter Button */}
            {(dateFilter || shiftFilter || statusFilter) && (
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => {
                  setDateFilter('');
                  setShiftFilter('');
                  setStatusFilter('');
                  setPage(0);
                }}
                style={{ fontSize: '0.825rem', color: 'var(--gray-500)', marginLeft: 'auto' }}
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Danh sách ca khám */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>Danh sách ca khám được phân công</span>
            {dateFilter && (
              <span className="badge" style={{ background: '#eff6ff', color: '#1d4ed8', fontWeight: 600, fontSize: '0.8rem' }}>
                {formatVietnameseDate(dateFilter)}
              </span>
            )}
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>
            Tìm thấy <strong>{sessions.length}</strong> ca khám
          </span>
        </div>

        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto' }} />
              <p style={{ marginTop: 12, fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                Đang tải danh sách lịch khám của bác sĩ...
              </p>
            </div>
          ) : sessions.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: 'var(--gray-400)' }}>
              <Calendar size={48} style={{ marginBottom: 12, opacity: 0.35 }} />
              <p style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--gray-600)', margin: '0 0 6px' }}>
                {dateFilter
                  ? `Không có ca khám nào vào ngày ${formatVietnameseDate(dateFilter)}`
                  : 'Bác sĩ chưa có ca khám nào được phân công'}
              </p>
              <p style={{ fontSize: '0.85rem', margin: 0 }}>
                {dateFilter ? (
                  <button
                    type="button"
                    className="btn btn-sm btn-link"
                    onClick={() => setDateFilter('')}
                    style={{ textDecoration: 'none', color: 'var(--doctor-accent)', fontWeight: 600 }}
                  >
                    Xem tất cả các ca khám của tôi
                  </button>
                ) : (
                  'Vui lòng liên hệ quản trị viên nếu bạn cần mở ca khám mới.'
                )}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table" style={{ margin: 0, width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ width: 80, textAlign: 'center', padding: '12px 16px' }}>MÃ CA</th>
                    <th style={{ minWidth: 200, padding: '12px 16px' }}>NGÀY KHÁM</th>
                    <th style={{ minWidth: 180, padding: '12px 16px' }}>CA TRỰC</th>
                    <th style={{ minWidth: 200, padding: '12px 16px' }}>LƯỢNG BỆNH NHÂN</th>
                    <th style={{ minWidth: 130, padding: '12px 16px' }}>PHÍ KHÁM</th>
                    <th style={{ minWidth: 120, padding: '12px 16px' }}>TRẠNG THÁI</th>
                    <th style={{ minWidth: 220, textAlign: 'center', padding: '12px 16px' }}>THAO TÁC</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => {
                    const isToday = s.examDate === todayStr;
                    const isTomorrow = s.examDate === tomorrowStr;
                    const isMorning = s.shift === 'MORNING';
                    const booked = s.lastQueueNumber || 0;
                    const max = s.maxPatients || 0;
                    const percent = max > 0 ? Math.min(100, Math.round((booked / max) * 100)) : 0;

                    return (
                      <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        {/* ID */}
                        <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--gray-700)', padding: '14px 16px' }}>
                          #{s.id}
                        </td>

                        {/* Exam Date */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--gray-900)', fontSize: '0.9rem' }}>
                            {formatVietnameseDate(s.examDate)}
                          </div>
                          <div style={{ marginTop: 4 }}>
                            {isToday ? (
                              <span className="badge" style={{ background: '#dcfce7', color: '#15803d', fontWeight: 700, fontSize: '0.72rem' }}>
                                Hôm nay
                              </span>
                            ) : isTomorrow ? (
                              <span className="badge" style={{ background: '#dbeafe', color: '#1d4ed8', fontWeight: 700, fontSize: '0.72rem' }}>
                                Ngày mai
                              </span>
                            ) : s.examDate > todayStr ? (
                              <span className="badge" style={{ background: '#ede9fe', color: '#6d28d9', fontWeight: 600, fontSize: '0.72rem' }}>
                                Sắp tới
                              </span>
                            ) : (
                              <span className="badge" style={{ background: '#f1f5f9', color: '#64748b', fontWeight: 500, fontSize: '0.72rem' }}>
                                Đã diễn ra
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Shift */}
                        <td style={{ padding: '14px 16px' }}>
                          <span
                            className="badge"
                            style={{
                              background: isMorning ? '#eff6ff' : '#fff7ed',
                              color: isMorning ? '#1d4ed8' : '#c2410c',
                              border: '1px solid',
                              borderColor: isMorning ? '#bfdbfe' : '#fed7aa',
                              fontWeight: 700,
                              fontSize: '0.78rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '5px 10px',
                            }}
                          >
                            {isMorning ? <Sun size={13} /> : <Sunset size={13} />}
                            {isMorning ? 'Sáng (08:00 - 12:00)' : 'Chiều (13:30 - 17:30)'}
                          </span>
                        </td>

                        {/* Patients Capacity */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--gray-800)' }}>
                              {booked} / {max} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--gray-500)' }}>bệnh nhân</span>
                            </span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: percent >= 90 ? '#dc2626' : 'var(--gray-500)' }}>
                              {percent}%
                            </span>
                          </div>
                          <div style={{ height: 6, width: '100%', background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                            <div
                              style={{
                                height: '100%',
                                width: `${percent}%`,
                                background: percent >= 90 ? '#ef4444' : percent >= 60 ? '#f59e0b' : 'var(--doctor-accent)',
                                borderRadius: 3,
                                transition: 'width 0.3s',
                              }}
                            />
                          </div>
                        </td>

                        {/* Fee */}
                        <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--gray-900)', fontSize: '0.875rem' }}>
                          {Number(s.examinationFee || 0).toLocaleString('vi-VN')} đ
                        </td>

                        {/* Status */}
                        <td style={{ padding: '14px 16px' }}>
                          {s.status === 'OPEN' ? (
                            <span className="badge" style={{ background: '#dcfce7', color: '#16a34a', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                              <CheckCircle2 size={12} /> Đang mở
                            </span>
                          ) : (
                            <span className="badge" style={{ background: '#f1f5f9', color: '#64748b', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                              <XCircle size={12} /> Đã đóng
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            {/* Nút vào phòng khám chính */}
                            <button
                              type="button"
                              className="btn btn-sm btn-primary"
                              onClick={() => navigate(`/doctor/sessions/${s.id}`, { state: { session: s } })}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                background: 'var(--doctor-accent)',
                                borderColor: 'var(--doctor-accent)',
                              }}
                              title="Vào tiếp nhận và khám bệnh nhân của ca này"
                            >
                              <Stethoscope size={14} />
                              <span>Vào khám</span>
                              <ArrowRight size={13} />
                            </button>

                            {/* Nút xem danh sách bệnh nhân */}
                            <button
                              type="button"
                              className="btn btn-sm btn-outline"
                              onClick={() => setViewingSession(s)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                fontSize: '0.8rem',
                              }}
                              title="Xem danh sách các bệnh nhân đã đăng ký"
                            >
                              <Eye size={13} />
                              <span>DS hẹn</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Phân trang */}
        {totalPages > 1 && (
          <div
            className="card-footer"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 20px',
              borderTop: '1px solid #f1f5f9',
            }}
          >
            <span style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>
              Trang <strong>{page + 1}</strong> / <strong>{totalPages}</strong> (Tổng <strong>{totalElements}</strong> ca khám)
            </span>

            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal danh sách hẹn của ca */}
      {viewingSession && (
        <SessionAppointmentsModal
          session={viewingSession}
          onClose={() => setViewingSession(null)}
        />
      )}
    </div>
  );
}

