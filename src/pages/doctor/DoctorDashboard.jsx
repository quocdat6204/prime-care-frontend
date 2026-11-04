import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { clinicService } from '../../services/clinicService';
import {
  Calendar, Users, Stethoscope, Award, ArrowRight, Sun, Sunset,
  CheckCircle2, XCircle, CalendarDays, Eye
} from 'lucide-react';
import SessionAppointmentsModal from '../admin/SessionAppointmentsModal';

const rankLabels = {
  PROFESSOR: 'GS',
  DOCTORATE: 'TS',
  MASTER: 'ThS',
};

export default function DoctorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [todaySessions, setTodaySessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingSession, setViewingSession] = useState(null);

  const todayStr = (() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  })();

  useEffect(() => {
    const fetchTodaySessions = async () => {
      setLoading(true);
      try {
        const res = await clinicService.getMySessions({ date: todayStr, size: 20 });
        setTodaySessions(res.data.result?.content || []);
      } catch (err) {
        console.warn('Could not load today sessions for doctor:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTodaySessions();
  }, [todayStr]);

  const totalPatientsToday = todaySessions.reduce((acc, s) => acc + (s.lastQueueNumber || 0), 0);

  return (
    <div>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>
          <Stethoscope size={28} style={{ marginRight: 8, verticalAlign: 'middle', color: 'var(--doctor-accent)' }} />
          Xin chào, {rankLabels[user?.rank] ? `${rankLabels[user.rank]}. ` : ''}{user?.fullName}
        </h1>

        <button
          className="btn btn-primary"
          onClick={() => navigate('/doctor/schedule')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 700 }}
        >
          <CalendarDays size={18} />
          <span>Xem lịch khám các ngày khác</span>
          <ArrowRight size={16} />
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--doctor-bg)', color: 'var(--doctor-accent)' }}>
            <Calendar size={24} />
          </div>
          <div className="stat-info">
            <h3>Lịch khám hôm nay</h3>
            <div className="stat-value">{todaySessions.length}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
            <Users size={24} />
          </div>
          <div className="stat-info">
            <h3>Bệnh nhân hôm nay</h3>
            <div className="stat-value">{totalPatientsToday}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>
            <Award size={24} />
          </div>
          <div className="stat-info">
            <h3>Cấp bậc chuyên môn</h3>
            <div className="stat-value" style={{ fontSize: '1.25rem' }}>
              {user?.rank ? (
                <span className={`rank-badge rank-${user.rank.toLowerCase()}`}>
                  {user.rank === 'PROFESSOR' ? 'Giáo sư' : user.rank === 'DOCTORATE' ? 'Tiến sĩ' : 'Thạc sĩ'}
                </span>
              ) : (
                'Bác sĩ'
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ca khám hôm nay của bác sĩ */}
      <div className="card" style={{ marginBottom: 24, borderTop: '3px solid var(--doctor-accent)' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px' }}>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={18} style={{ color: 'var(--doctor-accent)' }} />
              <span>Ca khám hôm nay của bạn ({todayStr.split('-').reverse().join('/')})</span>
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--gray-500)' }}>
              Tiếp nhận bệnh nhân trong ngày hoặc chuyển sang tab lịch khám để xem các ngày tiếp theo
            </p>
          </div>

          <button
            className="btn btn-sm btn-outline"
            onClick={() => navigate('/doctor/schedule')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.825rem' }}
          >
            <span>Lịch các ngày khác</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto' }} />
              <p style={{ marginTop: 10, fontSize: '0.85rem', color: 'var(--gray-500)' }}>
                Đang tải ca khám hôm nay...
              </p>
            </div>
          ) : todaySessions.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
              <Stethoscope size={40} style={{ marginBottom: 10, opacity: 0.35 }} />
              <p style={{ fontWeight: 600, color: 'var(--gray-700)', margin: '0 0 4px' }}>
                Hôm nay bạn chưa có ca khám nào được phân công
              </p>
              <p style={{ fontSize: '0.85rem', margin: '0 0 16px' }}>
                Bạn có thể tra cứu lịch phân công ngày mai hoặc các ngày khác trong tuần
              </p>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={() => navigate('/doctor/schedule')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <CalendarDays size={15} />
                <span>Mở tab Lịch khám bệnh</span>
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table" style={{ margin: 0, width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ width: 80, textAlign: 'center', padding: '12px 16px' }}>MÃ CA</th>
                    <th style={{ minWidth: 180, padding: '12px 16px' }}>CA TRỰC</th>
                    <th style={{ minWidth: 200, padding: '12px 16px' }}>TIẾP NHẬN BỆNH NHÂN</th>
                    <th style={{ minWidth: 130, padding: '12px 16px' }}>PHÍ KHÁM</th>
                    <th style={{ minWidth: 120, padding: '12px 16px' }}>TRẠNG THÁI</th>
                    <th style={{ minWidth: 220, textAlign: 'center', padding: '12px 16px' }}>THAO TÁC</th>
                  </tr>
                </thead>
                <tbody>
                  {todaySessions.map((s) => {
                    const isMorning = s.shift === 'MORNING';
                    const booked = s.lastQueueNumber || 0;
                    const max = s.maxPatients || 0;
                    const percent = max > 0 ? Math.min(100, Math.round((booked / max) * 100)) : 0;

                    return (
                      <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--gray-700)', padding: '14px 16px' }}>
                          #{s.id}
                        </td>

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
                              }}
                            />
                          </div>
                        </td>

                        <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--gray-900)', fontSize: '0.875rem' }}>
                          {Number(s.examinationFee || 0).toLocaleString('vi-VN')} đ
                        </td>

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

                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
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
                            >
                              <Stethoscope size={14} />
                              <span>Vào khám</span>
                              <ArrowRight size={13} />
                            </button>

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
      </div>

      {/* Doctor Info Card */}
      <div className="card">
        <div className="card-body">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16, color: 'var(--gray-900)' }}>
            Hồ sơ bác sĩ nha khoa
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {user?.ava ? (
              <img src={user.ava} alt="avatar" className="avatar avatar-lg" />
            ) : (
              <div className="avatar-placeholder avatar-lg" style={{ width: 80, height: 80, fontSize: '1.5rem' }}>
                {user?.fullName?.charAt(0)}
              </div>
            )}
            <div>
              <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--gray-900)' }}>
                {user?.fullName}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>{user?.email}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginTop: 2 }}>
                SĐT: {user?.phone || 'Chưa cập nhật'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal appointments */}
      {viewingSession && (
        <SessionAppointmentsModal
          session={viewingSession}
          onClose={() => setViewingSession(null)}
        />
      )}
    </div>
  );
}
