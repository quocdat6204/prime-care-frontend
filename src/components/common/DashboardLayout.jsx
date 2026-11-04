import { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PrimeLogo from './PrimeLogo';
import {
  LayoutDashboard, Users, User, Stethoscope, Shield,
  HeartPulse, LogOut, Menu, X, ChevronRight, ChevronDown,
  Mail, Phone, CheckCircle2, Calendar, Activity, Pill, BarChart3,
  CreditCard, Sparkles, Clock
} from 'lucide-react';

export default function DashboardLayout({ children }) {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setProfileDropdownOpen(false);
    await logout();
    navigate('/');
  };

  const getRoleConfig = () => {
    switch (role) {
      case 'ADMIN':
        return {
          themeClass: 'role-theme-admin',
          roleName: 'Quản trị viên',
          portalTitle: 'Trung tâm Quản trị',
          portalBadge: 'ADMIN',
          badgeIcon: <Shield size={14} />,
          dashboardPath: '/admin',
          profilePath: '/admin/profile',
          links: [
            { to: '/admin', end: true, label: 'Tổng quan', icon: <LayoutDashboard size={18} /> },
            { to: '/admin/statistics', label: 'Thống kê chi tiết', icon: <BarChart3 size={18} /> },
            { to: '/admin/users', label: 'Quản lý người dùng', icon: <Users size={18} /> },
            { to: '/admin/sessions', label: 'Quản lý ca khám', icon: <Calendar size={18} /> },
            { to: '/admin/services', label: 'Quản lý dịch vụ', icon: <Activity size={18} /> },
            { to: '/admin/medications', label: 'Quản lý thuốc', icon: <Pill size={18} /> },
            { to: '/admin/invoices', label: 'Quản lý hóa đơn', icon: <CreditCard size={18} /> },
            { to: '/admin/emails', label: 'Quản lý Email', icon: <Mail size={18} /> },
            { to: '/admin/profile', label: 'Hồ sơ quản trị', icon: <User size={18} /> },
          ],
        };
      case 'DOCTOR':
        return {
          themeClass: 'role-theme-doctor',
          roleName: 'Bác sĩ',
          portalTitle: 'Cổng Bác sĩ Chuyên khoa',
          portalBadge: 'DOCTOR',
          badgeIcon: <Stethoscope size={14} />,
          dashboardPath: '/doctor',
          profilePath: '/doctor/profile',
          links: [
            { to: '/doctor', end: true, label: 'Bảng điều khiển', icon: <LayoutDashboard size={18} /> },
            { to: '/doctor/schedule', label: 'Lịch khám bệnh', icon: <Calendar size={18} /> },
            { to: '/doctor/ai-diagnosis', label: 'AI Chẩn đoán bệnh răng', icon: <Sparkles size={18} /> },
            { to: '/doctor/profile', label: 'Hồ sơ chuyên môn', icon: <Stethoscope size={18} /> },
          ],
        };
      case 'USER':
      case 'PATIENT':
      default:
        return {
          themeClass: 'role-theme-patient',
          roleName: role === 'USER' ? 'Người dùng' : 'Bệnh nhân',
          portalTitle: 'Cổng Bệnh nhân & Khách hàng',
          portalBadge: role === 'USER' ? 'USER' : 'PATIENT',
          badgeIcon: <HeartPulse size={14} />,
          dashboardPath: '/patient',
          profilePath: '/patient/profile',
          links: [
            { to: '/patient', end: true, label: 'Tổng quan', icon: <LayoutDashboard size={18} /> },
            { to: '/patient/booking', label: 'Đặt lịch khám', icon: <Calendar size={18} /> },
            { to: '/patient/appointments', label: 'Lịch hẹn của tôi', icon: <Clock size={18} /> },
            { to: '/patient/profile', label: 'Hồ sơ cá nhân', icon: <User size={18} /> },
          ],
        };
    }
  };

  const config = getRoleConfig();

  return (
    <div className={`dashboard-wrapper ${config.themeClass}`}>
      {/* Dedicated Role Dashboard Topbar */}
      <header className="dashboard-topbar">
        <div className="dash-topbar-left">
          <Link to={config.dashboardPath} className="dash-brand-link">
            <PrimeLogo size={28} />
            <div className="dash-brand-titles">
              <span className="dash-brand-name">Primecare</span>
              <span className="dash-brand-portal">{config.portalTitle}</span>
            </div>
          </Link>
          <div className="dash-role-badge">
            {config.badgeIcon}
            <span>{config.roleName}</span>
          </div>
        </div>

        <div className="dash-topbar-right" ref={profileRef}>
          {/* Avatar Button Trigger */}
          <button
            type="button"
            className={`dash-avatar-trigger-btn ${profileDropdownOpen ? 'active' : ''}`}
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            title="Xem thông tin cá nhân"
          >
            <div className="dash-user-avatar">
              {user?.ava ? (
                <img
                  src={user.ava}
                  alt="Avatar"
                  className="dash-avatar-img"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextElementSibling) {
                      e.currentTarget.nextElementSibling.style.display = 'inline';
                    }
                  }}
                />
              ) : null}
              <span style={{ display: user?.ava ? 'none' : 'inline' }}>
                {(user?.fullName?.trim() || user?.username?.trim() || 'U')[0].toUpperCase()}
              </span>
            </div>
            <div className="dash-avatar-trigger-info">
              <span className="dash-trigger-name">{user?.fullName || user?.username}</span>
              <span className="dash-trigger-role">{config.roleName}</span>
            </div>
            <ChevronDown
              size={15}
              className={`dash-avatar-chevron ${profileDropdownOpen ? 'rotated' : ''}`}
            />
          </button>

          {/* Profile Dropdown Menu */}
          {profileDropdownOpen && (
            <div className="dash-profile-dropdown">
              <div className="dash-dropdown-header">
                <div className="dash-dropdown-avatar-wrap">
                  <div className="dash-dropdown-avatar">
                    {user?.ava ? (
                      <img
                        src={user.ava}
                        alt="Avatar"
                        className="dash-avatar-img"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          if (e.currentTarget.nextElementSibling) {
                            e.currentTarget.nextElementSibling.style.display = 'inline';
                          }
                        }}
                      />
                    ) : null}
                    <span style={{ display: user?.ava ? 'none' : 'inline' }}>
                      {(user?.fullName?.trim() || user?.username?.trim() || 'U')[0].toUpperCase()}
                    </span>
                  </div>
                  <span className="dash-avatar-online-dot" title="Đang hoạt động" />
                </div>
                <div className="dash-dropdown-user-info">
                  <div className="dash-dropdown-name">{user?.fullName || user?.username}</div>
                  <div className="dash-dropdown-email">{user?.email || `@${user?.username}`}</div>
                  <div className="dash-dropdown-role-pill">
                    {config.badgeIcon}
                    <span>{config.roleName}</span>
                  </div>
                </div>
              </div>

              {/* Extra user details preview */}
              <div className="dash-dropdown-meta">
                {user?.phone && (
                  <div className="dash-meta-item">
                    <Phone size={13} />
                    <span>{user.phone}</span>
                  </div>
                )}
                <div className="dash-meta-item">
                  <CheckCircle2 size={13} className="text-emerald" />
                  <span>Trạng thái: {user?.status === 'ACTIVE' ? 'Đã kích hoạt' : (user?.status || 'Hoạt động')}</span>
                </div>
              </div>

              <div className="dash-dropdown-divider" />

              <div className="dash-dropdown-menu">
                <Link
                  to={config.profilePath}
                  className="dash-dropdown-item"
                  onClick={() => setProfileDropdownOpen(false)}
                >
                  <User size={16} />
                  <span>Hồ sơ & Thông tin cá nhân</span>
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="dash-dropdown-item dash-dropdown-logout"
                >
                  <LogOut size={16} />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          )}

          <button
            className="dash-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Main Container: Sidebar + Content */}
      <div className="dashboard-container">
        {/* Sidebar */}
        <aside className={`dashboard-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <div className="dash-sidebar-header">
            <div className="dash-sidebar-label">DANH MỤC QUẢN TRỊ</div>
          </div>

          <nav className="dash-sidebar-nav">
            {config.links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) => `dash-sidebar-link ${isActive ? 'active' : ''}`}
              >
                {link.icon}
                <span>{link.label}</span>
                <ChevronRight size={14} className="dash-link-arrow" />
              </NavLink>
            ))}
          </nav>

          <div className="dash-sidebar-footer">
            <div className="dash-support-card">
              <span className="support-badge">Hỗ trợ kỹ thuật</span>
              <p>Hotline: 1900 6868</p>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="dashboard-content-area">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}

