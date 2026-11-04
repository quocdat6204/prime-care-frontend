import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { statisticService } from '../../services/statisticService';
import {
  Users, Stethoscope, Shield, HeartPulse, Activity,
  ArrowRight, RefreshCw, Server, CheckCircle2, HardDrive,
  Mail, Clock, Layers, Sparkles, TrendingUp, DollarSign,
  Calendar, CheckCheck, XCircle, AlertCircle, BarChart3,
  CreditCard
} from 'lucide-react';

const roleLabels = { ADMIN: 'Admin', DOCTOR: 'Bác sĩ', PATIENT: 'Bệnh nhân', USER: 'User' };
const statusLabels = { ACTIVE: 'Hoạt động', INACTIVE: 'Chưa kích hoạt', LOCKED: 'Đã khóa' };

export default function AdminDashboard() {
  const { user } = useAuth();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [overviewData, setOverviewData] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [healthError, setHealthError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    doctors: 0,
    patients: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [allRes, docRes, patRes, overviewRes, healthRes] = await Promise.allSettled([
        userService.getUsers({ size: 1 }),
        userService.getUsers({ role: 'DOCTOR', size: 1 }),
        userService.getUsers({ role: 'PATIENT', size: 1 }),
        statisticService.getOverview({ month: selectedMonth, year: selectedYear }),
        statisticService.getSystemHealth(),
      ]);

      setStats({
        total: allRes.status === 'fulfilled' ? allRes.value.data?.result?.totalElements || 0 : 0,
        doctors: docRes.status === 'fulfilled' ? docRes.value.data?.result?.totalElements || 0 : 0,
        patients: patRes.status === 'fulfilled' ? patRes.value.data?.result?.totalElements || 0 : 0,
      });

      if (overviewRes.status === 'fulfilled') {
        setOverviewData(overviewRes.value.data?.result || null);
      }

      if (healthRes.status === 'fulfilled') {
        setSystemHealth(healthRes.value.data?.result || null);
        setHealthError(null);
      } else {
        const status = healthRes.reason?.response?.status || 'ERR';
        console.warn('Lỗi gọi API health check:', healthRes.reason);
        setSystemHealth(null);
        setHealthError(status);
      }
    } catch (err) {
      console.error('Failed to load admin dashboard overview:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const doctorPercent = stats.total > 0 ? Math.round((stats.doctors / stats.total) * 100) : 0;
  const patientPercent = stats.total > 0 ? Math.round((stats.patients / stats.total) * 100) : 0;
  const adminCount = Math.max(0, stats.total - stats.doctors - stats.patients);
  const adminPercent = Math.max(0, 100 - doctorPercent - patientPercent);

  const todayFormatted = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date());

  const getRoleIcon = (role) => {
    switch (role) {
      case 'DOCTOR':
        return <Stethoscope size={13} />;
      case 'PATIENT':
        return <HeartPulse size={13} />;
      case 'ADMIN':
        return <Shield size={13} />;
      default:
        return <Users size={13} />;
    }
  };

  return (
    <div>
      {/* 1. Modern Welcome Banner */}
      <div className="admin-welcome-banner">
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: '#ede9fe', borderRadius: 9999, color: '#6d28d9', fontSize: '0.75rem', fontWeight: 700, marginBottom: 8 }}>
            <Sparkles size={13} />
            <span>TRUNG TÂM ĐIỀU HÀNH HỆ THỐNG</span>
          </div>
          <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800, color: 'var(--gray-900)' }}>
            Chào mừng trở lại, {user?.fullName || user?.username} 👋
          </h1>
          <p style={{ margin: '6px 0 0', color: 'var(--gray-500)', fontSize: '0.875rem' }}>
            Hôm nay là <strong style={{ color: 'var(--gray-700)' }}>{todayFormatted}</strong>. Tất cả các vi dịch vụ phòng khám đang vận hành tối ưu.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => loadData(true)}
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#ffffff' }}
            title="Làm mới dữ liệu"
            disabled={loading || refreshing}
          >
            <RefreshCw size={15} className={refreshing ? 'spin-slow' : ''} />
            <span>{refreshing ? 'Đang cập nhật...' : 'Làm mới'}</span>
          </button>
          <Link
            to="/admin/statistics"
            className="btn btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              borderColor: '#7c3aed',
              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)',
            }}
          >
            <BarChart3 size={16} />
            <span>Thống kê chi tiết</span>
          </Link>
        </div>
      </div>

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid #e2e8f0', paddingBottom: 10 }}>
        <button
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 18px',
            background: '#ede9fe',
            color: '#6d28d9',
            fontWeight: 700,
            fontSize: '0.875rem',
            borderRadius: 10,
            border: 'none',
            cursor: 'default',
          }}
        >
          <Activity size={16} />
          <span>Tổng quan</span>
        </button>

        <Link
          to="/admin/statistics"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 18px',
            background: 'transparent',
            color: 'var(--gray-600)',
            fontWeight: 600,
            fontSize: '0.875rem',
            borderRadius: 10,
            textDecoration: 'none',
            transition: 'all 0.2s',
          }}
        >
          <BarChart3 size={16} />
          <span>Thống kê chi tiết (9 báo cáo)</span>
        </Link>
      </div>

      {/* 2. Key KPI Stats Grid */}
      <div className="admin-stats-grid">
        {/* Total Users */}
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f3e8ff', color: '#7c3aed' }}>
            <Users size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', fontWeight: 600 }}>Tổng người dùng</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--gray-900)', lineHeight: 1.2, margin: '2px 0 4px' }}>
              {loading ? '...' : stats.total}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: 600 }}>
              Toàn bộ tài khoản hệ thống
            </div>
          </div>
        </div>

        {/* Doctors */}
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dbeafe', color: '#2563eb' }}>
            <Stethoscope size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', fontWeight: 600 }}>Bác sĩ Nha khoa</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--gray-900)', lineHeight: 1.2, margin: '2px 0 4px' }}>
              {loading ? '...' : stats.doctors}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600 }}>
              {doctorPercent}% cơ cấu nhân sự
            </div>
          </div>
        </div>

        {/* Patients */}
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ccfbf1', color: '#0f766e' }}>
            <HeartPulse size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', fontWeight: 600 }}>Bệnh nhân đăng ký</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--gray-900)', lineHeight: 1.2, margin: '2px 0 4px' }}>
              {loading ? '...' : stats.patients}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#0f766e', fontWeight: 600 }}>
              {patientPercent}% hồ sơ khám bệnh
            </div>
          </div>
        </div>

        {/* Real-time System Health (Eureka Discovery) */}
        <div className="stat-card">
          <div
            className="stat-icon"
            style={{
              background: !systemHealth ? '#f8fafc' : systemHealth.downServices === 0 ? '#dcfce7' : '#fee2e2',
              color: !systemHealth ? '#64748b' : systemHealth.downServices === 0 ? '#16a34a' : '#dc2626',
            }}
          >
            <Activity size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', fontWeight: 600 }}>Hạ tầng Vi Dịch Vụ</div>
            <div
              style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                color: !systemHealth ? 'var(--gray-400)' : systemHealth.downServices === 0 ? '#16a34a' : '#dc2626',
                lineHeight: 1.2,
                margin: '2px 0 4px',
              }}
            >
              {loading ? '...' : systemHealth ? `${systemHealth.healthPercentage}% Online` : '--'}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: '0.75rem',
                color: !systemHealth ? (healthError ? '#dc2626' : 'var(--gray-500)') : systemHealth.downServices === 0 ? '#15803d' : '#b91c1c',
                fontWeight: 600,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: !systemHealth ? (healthError ? '#dc2626' : '#94a3b8') : systemHealth.downServices === 0 ? '#16a34a' : '#dc2626',
                  display: 'inline-block',
                }}
              />
              <span>
                {systemHealth
                  ? `${systemHealth.upServices}/${systemHealth.totalServices} Dịch vụ hoạt động`
                  : healthError
                  ? `Chưa kết nối (${healthError}) - Cần restart service`
                  : 'Đang kiểm tra kết nối...'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Dashboard Columns (Recent Users + Distribution & System Health) */}
      <div className="admin-content-grid">
        {/* Left Column: KPI Operational Overview Card (API 1 - Thay thế mục tài khoản mới đăng ký) */}
        <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="admin-card-header" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--gray-900)' }}>
                <TrendingUp size={18} color="#7c3aed" />
                <span>Báo cáo Tổng quan Hoạt động & KPI Tháng</span>
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--gray-500)' }}>
                Tổng hợp chỉ số Lịch hẹn khám, Doanh thu, Bệnh nhân & Bác sĩ từ các vi dịch vụ
              </p>
            </div>

            {/* Month & Year Selectors */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <select
                className="form-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                style={{ height: 32, fontSize: '0.8125rem', padding: '4px 24px 4px 8px', width: 'auto' }}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>Tháng {m}</option>
                ))}
              </select>

              <select
                className="form-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                style={{ height: 32, fontSize: '0.8125rem', padding: '4px 24px 4px 8px', width: 'auto' }}
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto' }} />
              <p style={{ marginTop: 12, color: 'var(--gray-500)', fontSize: '0.85rem' }}>Đang tải số liệu tổng quan...</p>
            </div>
          ) : !overviewData ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
              Không có dữ liệu tổng quan cho Tháng {selectedMonth}/{selectedYear}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* 1. Appointments Summary */}
              <div style={{ background: '#f8fafc', padding: 14, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Calendar size={15} color="#2563eb" />
                    Lịch hẹn khám bệnh ({overviewData.appointments?.total || 0} lượt)
                  </span>
                  <span className="badge" style={{ background: '#dcfce7', color: '#15803d', fontWeight: 700, fontSize: '0.75rem' }}>
                    Tỷ lệ hoàn thành: {overviewData.appointments?.completionRate || 0}%
                  </span>
                </div>

                {/* Completion Progress Bar */}
                <div style={{ height: 8, background: '#e2e8f0', borderRadius: 9999, overflow: 'hidden', marginBottom: 10 }}>
                  <div
                    style={{
                      width: `${Math.min(100, overviewData.appointments?.completionRate || 0)}%`,
                      background: 'linear-gradient(90deg, #10b981, #059669)',
                      height: '100%',
                      borderRadius: 9999,
                      transition: 'width 0.6s ease',
                    }}
                  />
                </div>

                {/* 3 Status Pills */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, textAlign: 'center' }}>
                  <div style={{ background: '#fff', padding: '6px 8px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>Đã khám xong</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#15803d' }}>
                      {overviewData.appointments?.completed || 0}
                    </div>
                  </div>
                  <div style={{ background: '#fff', padding: '6px 8px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>Đã hủy ca</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#dc2626' }}>
                      {overviewData.appointments?.cancelled || 0}
                    </div>
                  </div>
                  <div style={{ background: '#fff', padding: '6px 8px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>Quá hạn giữ chỗ</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#d97706' }}>
                      {overviewData.appointments?.expired || 0}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Monthly Revenue */}
              <div style={{ background: '#f0fdf4', padding: 14, borderRadius: 12, border: '1px solid #bbf7d0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#166534', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <DollarSign size={15} color="#15803d" />
                    Tổng doanh thu tháng {selectedMonth}/{selectedYear}
                  </span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#15803d' }}>
                    {(overviewData.revenue?.total || 0).toLocaleString('vi-VN')} đ
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
                  <div style={{ background: '#fff', padding: '8px 10px', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Tiền công khám bác sĩ</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#2563eb', marginTop: 2 }}>
                      {(overviewData.revenue?.examination || 0).toLocaleString('vi-VN')} đ
                    </div>
                  </div>
                  <div style={{ background: '#fff', padding: '8px 10px', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Doanh thu dịch vụ nha khoa</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#7c3aed', marginTop: 2 }}>
                      {(overviewData.revenue?.services || 0).toLocaleString('vi-VN')} đ
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Patients Growth & Doctors active */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: 600 }}>Bệnh nhân đăng ký mới</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0d9488', marginTop: 2 }}>
                    +{overviewData.patients?.newThisMonth || 0}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                    Lũy kế: {overviewData.patients?.totalRegistered || 0} bệnh nhân
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: 600 }}>Bác sĩ đang hoạt động</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#2563eb', marginTop: 2 }}>
                    {overviewData.doctors?.totalActive || 0} bác sĩ
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                    Phụ trách các ca khám trực
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick link to detailed statistics */}
          <div style={{ marginTop: 4, paddingTop: 12, borderTop: '1px solid #f3f4f6', textAlign: 'center' }}>
            <Link
              to="/admin/statistics"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: '0.875rem',
                fontWeight: 700,
                color: '#7c3aed',
                textDecoration: 'none',
              }}
            >
              <span>Xem toàn bộ 9 báo cáo thống kê chi tiết</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        {/* Right Column: User Distribution & System Health Monitor */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* 3.1 Role Distribution */}
          <div className="admin-card">
            <div className="admin-card-header" style={{ marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--gray-900)' }}>
                <Layers size={18} color="#7c3aed" />
                <span>Cơ cấu người dùng</span>
              </h3>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7c3aed', background: '#ede9fe', padding: '2px 8px', borderRadius: 9999 }}>
                {stats.total} Tài khoản
              </span>
            </div>

            {/* Visual Multi-segment bar */}
            <div style={{ height: 10, width: '100%', borderRadius: 9999, background: '#f3f4f6', display: 'flex', overflow: 'hidden', margin: '12px 0 16px' }}>
              <div style={{ width: `${patientPercent}%`, background: '#0d9488', transition: 'width 0.5s ease' }} title={`Bệnh nhân: ${patientPercent}%`} />
              <div style={{ width: `${doctorPercent}%`, background: '#2563eb', transition: 'width 0.5s ease' }} title={`Bác sĩ: ${doctorPercent}%`} />
              <div style={{ width: `${adminPercent}%`, background: '#7c3aed', transition: 'width 0.5s ease' }} title={`Quản trị: ${adminPercent}%`} />
            </div>

            {/* Breakdown Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#0d9488' }} />
                  <span style={{ color: 'var(--gray-700)' }}>Bệnh nhân</span>
                </div>
                <div>
                  <strong>{stats.patients}</strong> <span style={{ color: 'var(--gray-400)' }}>({patientPercent}%)</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#2563eb' }} />
                  <span style={{ color: 'var(--gray-700)' }}>Bác sĩ Nha khoa</span>
                </div>
                <div>
                  <strong>{stats.doctors}</strong> <span style={{ color: 'var(--gray-400)' }}>({doctorPercent}%)</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#7c3aed' }} />
                  <span style={{ color: 'var(--gray-700)' }}>Quản trị viên</span>
                </div>
                <div>
                  <strong>{adminCount}</strong> <span style={{ color: 'var(--gray-400)' }}>({adminPercent}%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3.2 Real-time Microservices Health Monitor */}
          <div className="admin-card">
            <div className="admin-card-header" style={{ marginBottom: 14 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--gray-900)' }}>
                  <Server size={18} color="#16a34a" />
                  <span>Giám sát 5 Vi Dịch Vụ (Eureka Live)</span>
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                  Kiểm tra trạng thái thời gian thực từ Service Discovery
                </p>
              </div>
              <span
                className="badge"
                style={{
                  background: !systemHealth ? '#f1f5f9' : systemHealth.downServices === 0 ? '#dcfce7' : '#fee2e2',
                  color: !systemHealth ? '#64748b' : systemHealth.downServices === 0 ? '#15803d' : '#b91c1c',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                }}
              >
                {systemHealth ? `${systemHealth.upServices} / ${systemHealth.totalServices} UP` : healthError ? 'LỖI' : '...'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {healthError ? (
                <div
                  style={{
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: 12,
                    padding: '12px 14px',
                    color: '#92400e',
                    fontSize: '0.8rem',
                    lineHeight: 1.5,
                  }}
                >
                  <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <AlertCircle size={15} color="#b45309" />
                    <span>Chưa nhận được phản hồi từ endpoint</span>
                  </div>
                  <div>
                    API <code>/api/statistics/system/health</code> báo lỗi <strong>HTTP {healthError}</strong>.
                  </div>
                  <div style={{ marginTop: 6, fontSize: '0.75rem', color: '#b45309' }}>
                    💡 <strong>Nguyên nhân:</strong> Backend <code>statistic-service</code> chưa được khởi động lại sau khi nạp code Java mới. Bạn chỉ cần restart lại tiến trình <code>statistic-service</code>!
                  </div>
                </div>
              ) : (!systemHealth?.services || systemHealth.services.length === 0) ? (
                <div style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 20 }}>
                  Đang kiểm tra kết nối Eureka Registry...
                </div>
              ) : (
                systemHealth.services.map((svc) => {
                  const isUp = svc.status === 'UP';
                  const getSvcIcon = (id) => {
                    switch (id) {
                      case 'user-service': return <Shield size={16} color={isUp ? '#2563eb' : '#94a3b8'} />;
                      case 'clinic-service': return <Stethoscope size={16} color={isUp ? '#059669' : '#94a3b8'} />;
                      case 'payment-service': return <CreditCard size={16} color={isUp ? '#d97706' : '#94a3b8'} />;
                      case 'email-service': return <Mail size={16} color={isUp ? '#7c3aed' : '#94a3b8'} />;
                      default: return <BarChart3 size={16} color={isUp ? '#4f46e5' : '#94a3b8'} />;
                    }
                  };

                  return (
                    <div
                      key={svc.serviceId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: isUp ? '#f8fafc' : '#fef2f2',
                        borderRadius: 12,
                        border: `1px solid ${isUp ? '#e2e8f0' : '#fecaca'}`,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: isUp ? '#ffffff' : '#fee2e2',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: `1px solid ${isUp ? '#e2e8f0' : '#fca5a5'}`,
                          }}
                        >
                          {getSvcIcon(svc.serviceId)}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--gray-800)' }}>
                            {svc.displayName}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)' }}>
                            Port {svc.port} • {svc.serviceId}
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: isUp ? '#16a34a' : '#dc2626',
                          background: isUp ? '#dcfce7' : '#fee2e2',
                          padding: '3px 8px',
                          borderRadius: 6,
                        }}
                      >
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: isUp ? '#16a34a' : '#dc2626',
                            display: 'inline-block',
                          }}
                        />
                        <span>{isUp ? 'Hoạt động' : 'Mất kết nối'}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
