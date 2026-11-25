import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { clinicService } from '../../services/clinicService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import {
  Calendar, Users, UserCheck, RefreshCw, ChevronLeft, ChevronRight,
  Eye, Stethoscope, CheckCircle2, XCircle, CalendarDays,
  Sun, Sunset, ArrowRight, Clock
} from 'lucide-react';
import SessionAppointmentsModal from '../admin/SessionAppointmentsModal';
import { formatDoctorDisplayName } from '../../utils/doctorRank';

const WEEKDAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const VIETNAMESE_DAYS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

const formatLocalDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const parseLocalDate = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const formatVietnameseDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = parseLocalDate(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${VIETNAMESE_DAYS[d.getDay()]}, ${day}/${month}/${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
};

const formatShortDate = (dateStr) => {
  if (!dateStr) return '';
  const [, m, d] = dateStr.split('-');
  return `${d}/${m}`;
};

/**
 * Tạo lưới lịch 6 tuần (42 ô) bắt đầu từ Thứ 2 cho tháng đang xem,
 * giúp chiều cao khung lịch luôn cố định và lấy đủ khoảng ngày from/to cho API.
 */
const buildCalendarGrid = (year, month) => {
  const firstOfMonth = new Date(year, month, 1);
  // Quy đổi getDay() (CN=0..T7=6) sang chuẩn T2=0..CN=6
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const startDate = new Date(year, month, 1 - startOffset);

  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    cells.push({
      dateStr: formatLocalDate(d),
      dayNumber: d.getDate(),
      year: d.getFullYear(),
      month: d.getMonth(),
      isCurrentMonth: d.getMonth() === month && d.getFullYear() === year,
    });
  }

  return {
    cells,
    from: cells[0].dateStr,
    to: cells[41].dateStr,
    monthPrefix: `${year}-${String(month + 1).padStart(2, '0')}`,
  };
};

const getRelativeDayBadge = (dateStr, todayStr, tomorrowStr) => {
  if (dateStr === todayStr) {
    return { label: 'Hôm nay', bg: '#dcfce7', color: '#15803d' };
  }
  if (dateStr === tomorrowStr) {
    return { label: 'Ngày mai', bg: '#dbeafe', color: '#1d4ed8' };
  }
  if (dateStr > todayStr) {
    return { label: 'Sắp tới', bg: '#ede9fe', color: '#6d28d9' };
  }
  return { label: 'Đã diễn ra', bg: '#f1f5f9', color: '#64748b' };
};

function DoctorCalendar({
  currentMonth,
  calendar,
  selectedDate,
  todayStr,
  indicatorsByDate,
  loading,
  onPrevMonth,
  onNextMonth,
  onGoToday,
  onSelectCell,
}) {
  const isViewingToday =
    selectedDate === todayStr &&
    currentMonth.year === Number(todayStr.slice(0, 4)) &&
    currentMonth.month === Number(todayStr.slice(5, 7)) - 1;

  return (
    <div className="card">
      <div
        className="card-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 18px',
          borderBottom: '1px solid #f1f5f9',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={onPrevMonth}
            aria-label="Tháng trước"
            style={{ width: 32, height: 32, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ChevronLeft size={16} />
          </button>

          <h2 style={{ margin: '0 6px', fontSize: '1rem', fontWeight: 800, color: 'var(--gray-900)', minWidth: 126, textAlign: 'center' }}>
            Tháng {currentMonth.month + 1}, {currentMonth.year}
          </h2>

          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={onNextMonth}
            aria-label="Tháng sau"
            style={{ width: 32, height: 32, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <button
          type="button"
          className={`btn btn-sm ${isViewingToday ? 'btn-primary' : 'btn-outline'}`}
          onClick={onGoToday}
          style={{ borderRadius: 20, padding: '4px 12px', fontSize: '0.78rem', fontWeight: 700 }}
        >
          Hôm nay
        </button>
      </div>

      <div className="card-body" style={{ padding: '14px 16px 16px', opacity: loading ? 0.7 : 1, transition: 'opacity 0.15s' }}>
        <div className="doctor-cal-weekdays">
          {WEEKDAY_LABELS.map((label, idx) => (
            <div key={label} className={`doctor-cal-weekday ${idx === 6 ? 'is-sunday' : ''}`}>
              {label}
            </div>
          ))}
        </div>

        <div className="doctor-cal-days" style={{ marginTop: 4 }}>
          {calendar.cells.map((cell) => {
            const info = indicatorsByDate.get(cell.dateStr);
            const isSelected = cell.dateStr === selectedDate;
            const isToday = cell.dateStr === todayStr;
            const hasSessions = Boolean(info && (info.hasMorning || info.hasAfternoon));

            const classNames = [
              'doctor-cal-day',
              !cell.isCurrentMonth && 'is-outside',
              hasSessions && 'has-sessions',
              isToday && 'is-today',
              isSelected && 'is-selected',
            ]
              .filter(Boolean)
              .join(' ');

            const shiftSummary = [];
            if (info?.hasMorning) shiftSummary.push('Ca sáng');
            if (info?.hasAfternoon) shiftSummary.push('Ca chiều');
            const tooltip = shiftSummary.length > 0
              ? `${formatShortDate(cell.dateStr)} - Có lịch: ${shiftSummary.join(', ')}`
              : `${formatShortDate(cell.dateStr)} - Không có ca khám`;

            return (
              <button
                key={cell.dateStr}
                type="button"
                className={classNames}
                onClick={() => onSelectCell(cell)}
                title={tooltip}
                aria-label={tooltip}
                aria-pressed={isSelected}
              >
                <span className="doctor-cal-day-num">{cell.dayNumber}</span>
                <span className="doctor-cal-dots" aria-hidden="true">
                  {info?.hasMorning && <span className="doctor-cal-dot doctor-cal-dot--morning" />}
                  {info?.hasAfternoon && <span className="doctor-cal-dot doctor-cal-dot--afternoon" />}
                </span>
              </button>
            );
          })}
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            marginTop: 14,
            paddingTop: 12,
            borderTop: '1px solid #f1f5f9',
            fontSize: '0.75rem',
            color: 'var(--gray-500)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span className="doctor-cal-dot doctor-cal-dot--morning" /> Ca Sáng
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span className="doctor-cal-dot doctor-cal-dot--afternoon" /> Ca Chiều
            </span>
          </div>

          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                border: '1.5px solid #3b82f6',
                background: '#eff6ff',
                display: 'inline-block',
              }}
            />
            Hôm nay
          </span>
        </div>
      </div>
    </div>
  );
}

function SessionCard({ session, onOpenDetail, onOpenAppointments }) {
  const isMorning = session.shift === 'MORNING';
  const booked = session.lastQueueNumber || 0;
  const max = session.maxPatients || 0;
  const percent = max > 0 ? Math.min(100, Math.round((booked / max) * 100)) : 0;
  const availableSlots = session.availableSlots ?? Math.max(0, max - booked);
  const progressColor = percent >= 90 ? '#ef4444' : percent >= 60 ? '#f59e0b' : 'var(--doctor-accent)';

  return (
    <div className={`doctor-session-card ${isMorning ? 'doctor-session-card--morning' : 'doctor-session-card--afternoon'}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span
            className="badge"
            style={{
              background: isMorning ? '#eff6ff' : '#fff7ed',
              color: isMorning ? '#1d4ed8' : '#c2410c',
              border: '1px solid',
              borderColor: isMorning ? '#bfdbfe' : '#fed7aa',
              fontWeight: 700,
              fontSize: '0.8rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 12px',
            }}
          >
            {isMorning ? <Sun size={14} /> : <Sunset size={14} />}
            {isMorning ? 'Ca Sáng (08:00 - 12:00)' : 'Ca Chiều (13:30 - 17:30)'}
          </span>

          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--gray-500)' }}>
            Mã ca #{session.id}
          </span>
        </div>

        {session.status === 'OPEN' ? (
          <span className="badge" style={{ background: '#dcfce7', color: '#16a34a', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <CheckCircle2 size={12} /> Đang mở
          </span>
        ) : (
          <span className="badge" style={{ background: '#f1f5f9', color: '#64748b', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <XCircle size={12} /> Đã đóng
          </span>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 14,
          padding: '12px 14px',
          background: '#f8fafc',
          borderRadius: 10,
          marginBottom: 16,
        }}
      >
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--gray-500)', fontWeight: 600 }}>Bệnh nhân đã đặt</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: percent >= 90 ? '#dc2626' : 'var(--gray-600)' }}>
              {percent}%
            </span>
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--gray-900)', marginBottom: 6 }}>
            {booked} / {max} <span style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--gray-500)' }}>người</span>
          </div>
          <div style={{ height: 6, width: '100%', background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${percent}%`, background: progressColor, borderRadius: 3, transition: 'width 0.3s' }} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--gray-500)', fontWeight: 600, marginBottom: 4 }}>Chỗ còn trống</span>
          <span style={{ fontSize: '0.95rem', fontWeight: 800, color: availableSlots > 0 ? '#059669' : '#dc2626' }}>
            {availableSlots} chỗ
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--gray-500)', fontWeight: 600, marginBottom: 4 }}>Phí khám</span>
          <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--gray-900)' }}>
            {Number(session.examinationFee || 0).toLocaleString('vi-VN')} đ
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <button
          type="button"
          className="btn btn-sm btn-outline"
          onClick={() => onOpenAppointments(session)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 600 }}
          title="Xem danh sách các bệnh nhân đã đăng ký"
        >
          <Eye size={14} />
          <span>DS hẹn</span>
        </button>

        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={() => onOpenDetail(session)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: '0.82rem',
            fontWeight: 700,
            background: 'var(--doctor-accent)',
            borderColor: 'var(--doctor-accent)',
          }}
          title="Vào tiếp nhận và khám bệnh nhân của ca này"
        >
          <Stethoscope size={15} />
          <span>Vào khám</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}

export default function DoctorDashboard() {
  const toast = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const todayStr = useMemo(() => formatLocalDate(new Date()), []);
  const tomorrowStr = useMemo(() => {
    const tom = new Date();
    tom.setDate(tom.getDate() + 1);
    return formatLocalDate(tom);
  }, []);

  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const [monthSessions, setMonthSessions] = useState([]);
  // Giữ riêng ca khám hôm nay để KPI hôm nay không bị về 0 khi bác sĩ lật sang tháng khác
  const [todaySessions, setTodaySessions] = useState([]);
  const [loading, setLoading] = useState(false);

  const [shiftFilter, setShiftFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewingSession, setViewingSession] = useState(null);

  const calendar = useMemo(
    () => buildCalendarGrid(currentMonth.year, currentMonth.month),
    [currentMonth.year, currentMonth.month]
  );

  const fetchTodaySessions = useCallback(async () => {
    try {
      const res = await clinicService.getMySessions({ date: todayStr, size: 20 });
      setTodaySessions(res.data.result?.content || []);
    } catch (err) {
      console.warn('Could not load today sessions for doctor:', err);
    }
  }, [todayStr]);

  const fetchMonthSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await clinicService.getMySessions({
        from: calendar.from,
        to: calendar.to,
        page: 0,
        size: 200,
      });
      const content = res.data.result?.content || [];
      setMonthSessions(content);

      // Khi khung lịch tháng hiện tại chứa ngày hôm nay, cập nhật luôn KPI hôm nay không cần gọi thêm API
      if (todayStr >= calendar.from && todayStr <= calendar.to) {
        setTodaySessions(content.filter((s) => s.examDate === todayStr));
      }
    } catch (err) {
      console.error('Error fetching doctor sessions:', err);
      toast.error('Không thể tải lịch khám của bác sĩ');
    } finally {
      setLoading(false);
    }
  }, [calendar.from, calendar.to, todayStr, toast]);

  useEffect(() => {
    fetchMonthSessions();
  }, [fetchMonthSessions]);

  const handleRefresh = useCallback(() => {
    fetchMonthSessions();
    if (todayStr < calendar.from || todayStr > calendar.to) {
      fetchTodaySessions();
    }
  }, [fetchMonthSessions, fetchTodaySessions, todayStr, calendar.from, calendar.to]);

  // Gom nhóm ca khám theo ngày để chấm lịch và chuyển ngày tức thì (0ms)
  const sessionsByDate = useMemo(() => {
    const map = new Map();
    for (const s of monthSessions) {
      if (!s.examDate) continue;
      const list = map.get(s.examDate) || [];
      list.push(s);
      map.set(s.examDate, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => (a.shift === 'MORNING' ? -1 : 1) - (b.shift === 'MORNING' ? -1 : 1));
    }
    return map;
  }, [monthSessions]);

  const indicatorsByDate = useMemo(() => {
    const map = new Map();
    for (const [dateStr, list] of sessionsByDate.entries()) {
      map.set(dateStr, {
        hasMorning: list.some((s) => s.shift === 'MORNING'),
        hasAfternoon: list.some((s) => s.shift === 'AFTERNOON'),
      });
    }
    return map;
  }, [sessionsByDate]);

  const selectedDaySessions = useMemo(() => {
    const list = sessionsByDate.get(selectedDate) || [];
    return list.filter((s) => {
      if (shiftFilter && s.shift !== shiftFilter) return false;
      if (statusFilter && s.status !== statusFilter) return false;
      return true;
    });
  }, [sessionsByDate, selectedDate, shiftFilter, statusFilter]);

  const todayStats = useMemo(() => {
    const patientsCount = todaySessions.reduce((acc, s) => acc + (s.lastQueueNumber || 0), 0);
    return {
      sessionsCount: todaySessions.length,
      patientsCount,
    };
  }, [todaySessions]);

  const monthStats = useMemo(() => {
    const inMonth = monthSessions.filter((s) => s.examDate?.startsWith(calendar.monthPrefix));
    const uniqueDays = new Set(inMonth.map((s) => s.examDate)).size;
    const totalPatients = inMonth.reduce((acc, s) => acc + (s.lastQueueNumber || 0), 0);
    return {
      totalSessions: inMonth.length,
      uniqueDays,
      totalPatients,
    };
  }, [monthSessions, calendar.monthPrefix]);

  const nearestScheduledDate = useMemo(() => {
    const dates = [...sessionsByDate.keys()]
      .filter((d) => d.startsWith(calendar.monthPrefix) && d !== selectedDate)
      .sort();
    if (dates.length === 0) return null;
    return dates.find((d) => d >= todayStr) || dates[dates.length - 1];
  }, [sessionsByDate, calendar.monthPrefix, selectedDate, todayStr]);

  const switchMonth = (offset) => {
    const next = new Date(currentMonth.year, currentMonth.month + offset, 1);
    const nextYear = next.getFullYear();
    const nextMonth = next.getMonth();
    setCurrentMonth({ year: nextYear, month: nextMonth });

    const todayDate = parseLocalDate(todayStr);
    if (nextYear === todayDate.getFullYear() && nextMonth === todayDate.getMonth()) {
      setSelectedDate(todayStr);
    } else {
      setSelectedDate(formatLocalDate(next));
    }
  };

  const handleGoToday = () => {
    const now = parseLocalDate(todayStr);
    setCurrentMonth({ year: now.getFullYear(), month: now.getMonth() });
    setSelectedDate(todayStr);
  };

  const handleSelectCell = (cell) => {
    setSelectedDate(cell.dateStr);
    if (!cell.isCurrentMonth) {
      setCurrentMonth({ year: cell.year, month: cell.month });
    }
  };

  const selectedBadge = getRelativeDayBadge(selectedDate, todayStr, tomorrowStr);
  const doctorGreetingName = formatDoctorDisplayName(user?.fullName, user?.rank, { short: true });

  return (
    <div>
      {/* Header chào mừng */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>
            <Stethoscope size={28} style={{ color: 'var(--doctor-accent)' }} />
            <span>Xin chào, {doctorGreetingName}</span>
          </h1>
          <p style={{ margin: '6px 0 0', color: 'var(--gray-500)', fontSize: '0.9rem' }}>
            Hôm nay {formatVietnameseDate(todayStr)} •{' '}
            {todayStats.sessionsCount > 0
              ? `Bạn có ${todayStats.sessionsCount} ca khám (${todayStats.patientsCount} bệnh nhân đã đăng ký)`
              : 'Chưa có ca khám nào được phân công hôm nay'}
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline"
          onClick={handleRefresh}
          disabled={loading}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
        >
          <RefreshCw size={16} className={loading ? 'spin-slow' : ''} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Summary KPI Cards: Hôm nay & Tháng đang xem */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(215px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--doctor-bg)', color: 'var(--doctor-accent)' }}>
            <Calendar size={22} />
          </div>
          <div className="stat-info">
            <h3>Ca khám hôm nay</h3>
            <div className="stat-value">{todayStats.sessionsCount}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
            <UserCheck size={22} />
          </div>
          <div className="stat-info">
            <h3>Bệnh nhân hôm nay</h3>
            <div className="stat-value">{todayStats.patientsCount}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <CalendarDays size={22} />
          </div>
          <div className="stat-info">
            <h3>Lịch tháng {currentMonth.month + 1}/{currentMonth.year}</h3>
            <div className="stat-value">
              {monthStats.totalSessions}{' '}
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--gray-500)', whiteSpace: 'nowrap' }}>
                ca / {monthStats.uniqueDays} ngày
              </span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fff7ed', color: '#ea580c' }}>
            <Users size={22} />
          </div>
          <div className="stat-info">
            <h3>Bệnh nhân trong tháng</h3>
            <div className="stat-value">{monthStats.totalPatients}</div>
          </div>
        </div>
      </div>

      {/* Split View: Lịch tháng (trái) + Ca khám ngày đang chọn (phải) */}
      <div className="doctor-schedule-split">
        <DoctorCalendar
          currentMonth={currentMonth}
          calendar={calendar}
          selectedDate={selectedDate}
          todayStr={todayStr}
          indicatorsByDate={indicatorsByDate}
          loading={loading}
          onPrevMonth={() => switchMonth(-1)}
          onNextMonth={() => switchMonth(1)}
          onGoToday={handleGoToday}
          onSelectCell={handleSelectCell}
        />

        <div className="card">
          <div
            className="card-header"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              padding: '16px 20px',
              borderBottom: '1px solid #f1f5f9',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.08rem', fontWeight: 800, margin: 0, color: 'var(--gray-900)' }}>
                  {formatVietnameseDate(selectedDate)}
                </h2>
                <span className="badge" style={{ background: selectedBadge.bg, color: selectedBadge.color, fontWeight: 700, fontSize: '0.72rem' }}>
                  {selectedBadge.label}
                </span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--gray-500)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Clock size={13} />
                <span>
                  {selectedDaySessions.length > 0
                    ? `Có ${selectedDaySessions.length} ca khám được phân công`
                    : 'Không có ca khám nào trong ngày này'}
                </span>
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <select
                className="form-control"
                value={shiftFilter}
                onChange={(e) => setShiftFilter(e.target.value)}
                aria-label="Lọc ca trực"
                style={{ width: 132, height: 34, fontSize: '0.82rem', padding: '0 10px' }}
              >
                <option value="">Tất cả ca</option>
                <option value="MORNING">Ca Sáng</option>
                <option value="AFTERNOON">Ca Chiều</option>
              </select>

              <select
                className="form-control"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Lọc trạng thái"
                style={{ width: 148, height: 34, fontSize: '0.82rem', padding: '0 10px' }}
              >
                <option value="">Mọi trạng thái</option>
                <option value="OPEN">Đang mở</option>
                <option value="CLOSED">Đã đóng</option>
              </select>
            </div>
          </div>

          <div className="card-body" style={{ padding: 20 }}>
            {loading && monthSessions.length === 0 ? (
              <div style={{ padding: '48px 20px', textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto' }} />
                <p style={{ marginTop: 12, fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                  Đang tải lịch khám của bác sĩ...
                </p>
              </div>
            ) : selectedDaySessions.length === 0 ? (
              <div style={{ padding: '44px 20px', textAlign: 'center', color: 'var(--gray-400)' }}>
                <Calendar size={44} style={{ margin: '0 auto 12px', opacity: 0.35 }} />
                <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--gray-700)', margin: '0 0 6px' }}>
                  Không có ca khám nào vào ngày {formatShortDate(selectedDate)}
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', margin: '0 0 16px' }}>
                  {(shiftFilter || statusFilter) && (sessionsByDate.get(selectedDate)?.length || 0) > 0
                    ? 'Có ca khám trong ngày này nhưng không khớp bộ lọc Ca trực / Trạng thái hiện tại.'
                    : 'Hãy chọn các ngày có dấu chấm màu trên lịch để xem ca trực được phân công.'}
                </p>

                <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
                  {(shiftFilter || statusFilter) && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      onClick={() => {
                        setShiftFilter('');
                        setStatusFilter('');
                      }}
                    >
                      Xóa bộ lọc
                    </button>
                  )}

                  {nearestScheduledDate && (
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => setSelectedDate(nearestScheduledDate)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        background: 'var(--doctor-accent)',
                        borderColor: 'var(--doctor-accent)',
                      }}
                    >
                      <CalendarDays size={14} />
                      <span>Đến ngày có lịch gần nhất ({formatShortDate(nearestScheduledDate)})</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {selectedDaySessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    onOpenDetail={(s) => navigate(`/doctor/sessions/${s.id}`, { state: { session: s } })}
                    onOpenAppointments={(s) => setViewingSession(s)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {viewingSession && (
        <SessionAppointmentsModal
          session={viewingSession}
          onClose={() => setViewingSession(null)}
        />
      )}
    </div>
  );
}
