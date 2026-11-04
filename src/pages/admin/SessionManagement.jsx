import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { clinicService } from '../../services/clinicService';
import { userService } from '../../services/userService';
import { useToast } from '../../context/ToastContext';
import {
  Calendar, Plus, Clock, Users, DollarSign, Filter, RefreshCw,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Eye, CheckCircle2, XCircle, Stethoscope
} from 'lucide-react';
import CreateSessionModal from './CreateSessionModal';
import SessionAppointmentsModal from './SessionAppointmentsModal';
import { formatDoctorRank } from '../../utils/doctorRank';

export default function SessionManagement() {
  const toast = useToast();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filters
  const [dateFilter, setDateFilter] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');
  const [shiftFilter, setShiftFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Today helper
  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const isTodayOnly = dateFilter === todayStr;

  const handleToggleToday = (checked) => {
    setDateFilter(checked ? todayStr : '');
    setPage(0);
  };

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingSession, setViewingSession] = useState(null);

  // Load doctors for filter dropdown
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await userService.getUsers({ role: 'DOCTOR', size: 100 });
        setDoctors(res.data.result?.content || []);
      } catch (err) {
        console.error('Failed to load doctors:', err);
      }
    };
    fetchDoctors();
  }, []);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        size,
        sort: 'id,desc', // Luôn sắp xếp theo ID giảm dần
      };
      if (dateFilter) params.date = dateFilter;
      if (doctorFilter) params.doctorId = doctorFilter;
      if (shiftFilter) params.shift = shiftFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await clinicService.getAdminSessions(params);
      const data = res.data.result;
      setSessions(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      toast.error('Không thể tải danh sách ca khám');
    } finally {
      setLoading(false);
    }
  }, [page, size, dateFilter, doctorFilter, shiftFilter, statusFilter, toast]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Generate pagination page numbers smart range
  const paginationRange = useMemo(() => {
    if (totalPages <= 1) return [0];
    const range = [];
    const maxVisible = 5;
    let start = Math.max(0, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages - 1, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(0, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    return range;
  }, [page, totalPages]);

  const handleToggleStatus = async (session) => {
    const nextStatus = session.status === 'OPEN' ? 'ĐÓNG' : 'MỞ';
    if (!window.confirm(`Bạn có chắc chắn muốn ${nextStatus} ca khám #${session.id} của bác sĩ ${session.doctorName || ''}?`)) {
      return;
    }
    try {
      await clinicService.toggleSessionStatus(session.id);
      toast.success(`Đã chuyển trạng thái ca khám thành ${session.status === 'OPEN' ? 'ĐÃ ĐÓNG (CLOSED)' : 'ĐANG MỞ (OPEN)'}`);
      fetchSessions();
    } catch (err) {
      toast.error('Không thể chuyển trạng thái ca khám');
    }
  };

  const handleResetFilters = () => {
    setDateFilter('');
    setDoctorFilter('');
    setShiftFilter('');
    setStatusFilter('');
    setPage(0);
  };

  return (
    <div className="management-page">
      {/* Header */}
      <div className="management-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'var(--gray-900)' }}>
            Quản lý Ca khám bệnh
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--gray-500)', fontSize: '0.875rem' }}>
            Phân công ca trực cho Bác sĩ, định mức số lượng bệnh nhân và kiểm soát trạng thái đặt lịch
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: '#7c3aed',
            borderColor: '#7c3aed',
            padding: '10px 20px',
            borderRadius: 12,
            boxShadow: '0 4px 14px rgba(124, 58, 237, 0.25)',
          }}
        >
          <Plus size={18} />
          <span>Thêm ca khám mới</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          marginBottom: 20,
          border: '1px solid #ede9fe',
          borderRadius: 16,
          background: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            {/* 1. Date Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={15} color="#7c3aed" />
              <input
                type="date"
                className="form-input"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setPage(0);
                }}
                style={{ height: 38, fontSize: '0.875rem' }}
              />
            </div>

            {/* Checkbox lọc nhanh ca khám hôm nay */}
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                height: 38,
                padding: '0 12px',
                borderRadius: 8,
                background: isTodayOnly ? '#ede9fe' : '#f8fafc',
                border: `1.5px solid ${isTodayOnly ? '#7c3aed' : '#cbd5e1'}`,
                color: isTodayOnly ? '#6d28d9' : 'var(--gray-700)',
                fontSize: '0.85rem',
                fontWeight: isTodayOnly ? 700 : 500,
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'all 0.15s ease',
              }}
              title="Tích vào để lọc nhanh các ca khám diễn ra trong ngày hôm nay"
            >
              <input
                type="checkbox"
                checked={isTodayOnly}
                onChange={(e) => handleToggleToday(e.target.checked)}
                style={{
                  accentColor: '#7c3aed',
                  width: 16,
                  height: 16,
                  cursor: 'pointer',
                }}
              />
              <span>Hôm nay</span>
            </label>

            {/* 2. Doctor Filter */}
            <select
              className="form-select"
              value={doctorFilter}
              onChange={(e) => {
                setDoctorFilter(e.target.value);
                setPage(0);
              }}
              style={{ height: 38, fontSize: '0.875rem', minWidth: 190 }}
            >
              <option value="">Tất cả bác sĩ</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.fullName || d.username} {d.rank ? `(${formatDoctorRank(d.rank)})` : ''}
                </option>
              ))}
            </select>

            {/* 3. Shift Filter */}
            <select
              className="form-select"
              value={shiftFilter}
              onChange={(e) => {
                setShiftFilter(e.target.value);
                setPage(0);
              }}
              style={{ height: 38, fontSize: '0.875rem', minWidth: 150 }}
            >
              <option value="">Tất cả ca trực</option>
              <option value="MORNING">Ca Sáng (08:00 - 12:00)</option>
              <option value="AFTERNOON">Ca Chiều (13:30 - 17:30)</option>
            </select>

            {/* 4. Status Filter */}
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
              style={{ height: 38, fontSize: '0.875rem', minWidth: 140 }}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="OPEN">Đang mở (OPEN)</option>
              <option value="CLOSED">Đã đóng (CLOSED)</option>
            </select>

            {/* Reset Filters */}
            {(dateFilter || doctorFilter || shiftFilter || statusFilter) && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleResetFilters}
                style={{ fontSize: '0.8rem', color: '#dc2626' }}
              >
                Xóa bộ lọc
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>
              Tổng số: <strong style={{ color: 'var(--gray-800)' }}>{totalElements}</strong> ca khám
            </span>
            <button
              className="btn btn-outline btn-icon"
              onClick={fetchSessions}
              disabled={loading}
              title="Làm mới danh sách"
              style={{ height: 38, width: 38 }}
            >
              <RefreshCw size={15} className={loading ? 'spinner' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Sessions Table Card */}
      <div className="card" style={{ overflow: 'hidden', border: '1px solid #ede9fe', borderRadius: 16 }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 85 }}>#ID ↓</th>
                <th>Ngày khám & Ca trực</th>
                <th>Bác sĩ phụ trách</th>
                <th>Tiền công khám</th>
                <th>Lượng bệnh nhân (Đã nhận / Tối đa)</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'right', minWidth: 150 }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 48 }}>
                    <div className="spinner" style={{ margin: '0 auto' }} />
                    <p style={{ marginTop: 12, fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                      Đang tải danh sách ca khám...
                    </p>
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 48, color: 'var(--gray-400)' }}>
                    Không có ca khám nào phù hợp với bộ lọc tìm kiếm
                  </td>
                </tr>
              ) : (
                sessions.map((s) => {
                  const booked = s.lastQueueNumber || (s.maxPatients - (s.availableSlots ?? s.maxPatients));
                  const percent = Math.min(100, Math.round((booked / s.maxPatients) * 100));
                  return (
                    <tr
                      key={s.id}
                      onClick={() => navigate(`/admin/sessions/${s.id}`, { state: { session: s } })}
                      style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                      title="Nhấn vào ca khám để chuyển sang trang chi tiết (Chia 3 trạng thái hợp lệ)"
                    >
                      {/* ID */}
                      <td style={{ fontWeight: 700, color: '#6d28d9' }}>#{s.id}</td>

                      {/* Date & Shift */}
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--gray-900)' }}>{s.examDate}</div>
                        <span
                          className="badge"
                          style={{
                            background: s.shift === 'MORNING' ? '#eff6ff' : '#fff7ed',
                            color: s.shift === 'MORNING' ? '#1d4ed8' : '#c2410c',
                            border: '1px solid',
                            borderColor: s.shift === 'MORNING' ? '#bfdbfe' : '#fed7aa',
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            marginTop: 4,
                          }}
                        >
                          {s.shift === 'MORNING' ? 'Sáng (08:00 - 12:00)' : 'Chiều (13:30 - 17:30)'}
                        </span>
                      </td>

                      {/* Doctor info */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {s.doctorAvatar ? (
                            <img src={s.doctorAvatar} alt="" className="avatar avatar-sm" />
                          ) : (
                            <div
                              className="avatar-placeholder avatar-sm"
                              style={{
                                width: 34,
                                height: 34,
                                fontSize: '0.75rem',
                                background: '#ede9fe',
                                color: '#6d28d9',
                                fontWeight: 700,
                              }}
                            >
                              {(s.doctorName || 'D')[0]}
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--gray-800)' }}>
                              {s.doctorName || `Bác sĩ #${s.doctorId}`}
                            </div>
                            {s.doctorRank && (
                              <div style={{ fontSize: '0.75rem', color: '#6d28d9', fontWeight: 600 }}>
                                {formatDoctorRank(s.doctorRank)}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Fee */}
                      <td style={{ fontWeight: 700, color: 'var(--gray-900)' }}>
                        {Number(s.examinationFee).toLocaleString('vi-VN')} đ
                      </td>

                      {/* Patient capacity & progress */}
                      <td style={{ minWidth: 180 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: 4 }}>
                          <span>
                            Đã nhận: <strong>{booked}</strong> / {s.maxPatients}
                          </span>
                          <span style={{ color: percent >= 100 ? '#dc2626' : '#16a34a', fontWeight: 700 }}>
                            {percent}%
                          </span>
                        </div>
                        <div style={{ width: '100%', height: 6, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${percent}%`,
                              height: '100%',
                              background: percent >= 100 ? '#dc2626' : percent >= 75 ? '#f59e0b' : '#7c3aed',
                              borderRadius: 4,
                            }}
                          />
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)', marginTop: 4 }}>
                          Còn lại: <strong>{s.availableSlots ?? (s.maxPatients - booked)}</strong> chỗ trống
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        <span
                          className="badge"
                          style={{
                            background: s.status === 'OPEN' ? '#dcfce7' : '#f1f5f9',
                            color: s.status === 'OPEN' ? '#15803d' : '#64748b',
                            border: '1px solid',
                            borderColor: s.status === 'OPEN' ? '#bbf7d0' : '#e2e8f0',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                          }}
                        >
                          {s.status === 'OPEN' ? 'Đang mở (OPEN)' : 'Đã đóng (CLOSED)'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                          {/* View Appointments Popup */}
                          <button
                            type="button"
                            className="btn btn-sm btn-outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingSession(s);
                            }}
                            title="Xem popup danh sách đầy đủ tất cả lịch đặt (mọi trạng thái)"
                            style={{ padding: '6px 10px', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.8rem' }}
                          >
                            <Eye size={14} />
                            <span>Bệnh nhân</span>
                          </button>

                          {/* Toggle Open/Close status */}
                          <button
                            type="button"
                            className="btn btn-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleStatus(s);
                            }}
                            title={s.status === 'OPEN' ? 'Đóng ca khám (ngưng nhận đặt lịch)' : 'Mở lại ca khám'}
                            style={{
                              padding: '6px 10px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: '0.8rem',
                              background: s.status === 'OPEN' ? '#fff1f2' : '#f0fdf4',
                              color: s.status === 'OPEN' ? '#e11d48' : '#16a34a',
                              border: `1px solid ${s.status === 'OPEN' ? '#fecdd3' : '#bbf7d0'}`,
                            }}
                          >
                            {s.status === 'OPEN' ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
                            <span>{s.status === 'OPEN' ? 'Đóng ca' : 'Mở ca'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Complete, Responsive Pagination Bar */}
        <div className="table-pagination-footer">
          {/* Left: Rows per page & Range summary */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', color: 'var(--gray-600)' }}>
              <span>Hiển thị:</span>
              <select
                className="form-select"
                value={size}
                onChange={(e) => {
                  setSize(Number(e.target.value));
                  setPage(0);
                }}
                style={{ width: 'auto', padding: '4px 28px 4px 8px', height: 32, fontSize: '0.8125rem' }}
              >
                <option value={5}>5 dòng</option>
                <option value={10}>10 dòng</option>
                <option value={20}>20 dòng</option>
                <option value={50}>50 dòng</option>
              </select>
            </div>

            <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>
              Hiển thị{' '}
              <strong style={{ color: 'var(--gray-800)' }}>
                {totalElements === 0 ? 0 : page * size + 1} - {Math.min((page + 1) * size, totalElements)}
              </strong>{' '}
              trên tổng số <strong style={{ color: 'var(--gray-800)' }}>{totalElements}</strong> ca khám
            </div>
          </div>

          {/* Right: Page navigation buttons */}
          <div className="pagination" style={{ padding: 0 }}>
            {/* First Page */}
            <button
              className="pagination-btn"
              disabled={page === 0 || loading}
              onClick={() => setPage(0)}
              title="Trang đầu"
            >
              <ChevronsLeft size={16} />
            </button>

            {/* Prev Page */}
            <button
              className="pagination-btn"
              disabled={page === 0 || loading}
              onClick={() => setPage(page - 1)}
              title="Trang trước"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Page number buttons */}
            {paginationRange.map((p) => (
              <button
                key={p}
                className={`pagination-btn ${page === p ? 'active' : ''}`}
                onClick={() => setPage(p)}
                disabled={loading}
              >
                {p + 1}
              </button>
            ))}

            {/* Next Page */}
            <button
              className="pagination-btn"
              disabled={page >= totalPages - 1 || totalPages === 0 || loading}
              onClick={() => setPage(page + 1)}
              title="Trang tiếp"
            >
              <ChevronRight size={16} />
            </button>

            {/* Last Page */}
            <button
              className="pagination-btn"
              disabled={page >= totalPages - 1 || totalPages === 0 || loading}
              onClick={() => setPage(Math.max(0, totalPages - 1))}
              title="Trang cuối"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateSessionModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchSessions();
          }}
        />
      )}

      {viewingSession && (
        <SessionAppointmentsModal
          session={viewingSession}
          onClose={() => setViewingSession(null)}
          initialFilterMode="ALL"
        />
      )}
    </div>
  );
}

