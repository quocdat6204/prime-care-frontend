import { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  LayoutDashboard, Calendar, Clock, User, LogOut,
  PhoneCall, ChevronDown, Menu, X, ShieldCheck,
  Stethoscope, Activity, Sparkles, Plus, MapPin, Receipt
} from 'lucide-react';
import ChatbotWidget from '../common/ChatbotWidget';

export default function PatientLayout({ children, onLoginClick, onRegisterClick }) {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  const navLinks = [
    { to: '/patient', end: true, label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { to: '/patient/booking', label: 'Ca khám', icon: <Calendar size={18} /> },
    { to: '/patient/appointments', label: 'Lịch hẹn', icon: <Clock size={18} /> },
    { to: '/patient/profile', label: 'Tài khoản', icon: <User size={18} /> },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc', color: '#1e293b' }}>
      {/* 1. TOP HEADER (MediBook style: Clean white navbar with logo, horizontal menu links & user avatar) */}
      <header
        style={{
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 20,
          }}
        >
          {/* MediBook-style Logo: Teal Plus Icon + Bold Brand Text */}
          <Link
            to="/patient"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              textDecoration: 'none',
              color: '#0f172a',
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: '#0d9488',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 900,
                boxShadow: '0 2px 8px rgba(13, 148, 136, 0.3)',
              }}
            >
              <Plus size={22} strokeWidth={3.5} />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px' }}>
                Prime
              </span>
              <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0d9488', letterSpacing: '-0.5px' }}>
                care
              </span>
            </div>
          </Link>

          {/* MediBook-style Desktop Navigation (Horizontal text links) */}
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 32,
            }}
            className="patient-desktop-nav"
          >
            <NavLink
              to="/patient"
              end
              style={({ isActive }) => ({
                textDecoration: 'none',
                fontSize: '0.94rem',
                fontWeight: isActive ? 800 : 600,
                color: isActive ? '#0d9488' : '#475569',
                borderBottom: isActive ? '2.5px solid #0d9488' : '2.5px solid transparent',
                padding: '6px 2px',
                transition: 'all 0.15s ease',
              })}
            >
              Dashboard
            </NavLink>

            <NavLink
              to="/patient/booking"
              style={({ isActive }) => ({
                textDecoration: 'none',
                fontSize: '0.94rem',
                fontWeight: isActive ? 800 : 600,
                color: isActive ? '#0d9488' : '#475569',
                borderBottom: isActive ? '2.5px solid #0d9488' : '2.5px solid transparent',
                padding: '6px 2px',
                transition: 'all 0.15s ease',
              })}
            >
              Ca khám
            </NavLink>

            <NavLink
              to="/patient/appointments"
              style={({ isActive }) => ({
                textDecoration: 'none',
                fontSize: '0.94rem',
                fontWeight: isActive ? 800 : 600,
                color: isActive ? '#0d9488' : '#475569',
                borderBottom: isActive ? '2.5px solid #0d9488' : '2.5px solid transparent',
                padding: '6px 2px',
                transition: 'all 0.15s ease',
              })}
            >
              Lịch hẹn
            </NavLink>
          </nav>

          {/* User Profile Avatar with dropdown OR Login Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {user ? (
              <div style={{ position: 'relative' }} ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    background: '#ffffff',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: 24,
                    padding: '4px 12px 4px 5px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: '#0d9488',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    {user?.ava ? (
                      <img src={user.ava} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      (user?.fullName || user?.username || 'B')[0].toUpperCase()
                    )}
                  </div>

                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                    {user?.fullName || user?.username || 'Tài khoản'}
                  </span>

                  <ChevronDown
                    size={15}
                    color="#64748b"
                    style={{
                      transform: profileDropdownOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s ease',
                    }}
                  />
                </button>

              {/* Profile Dropdown */}
              {profileDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 8px)',
                    width: 250,
                    background: '#ffffff',
                    borderRadius: 14,
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.12)',
                    padding: 8,
                    zIndex: 1100,
                  }}
                >
                  <div
                    style={{
                      padding: '10px 12px',
                      background: '#f8fafc',
                      borderRadius: 10,
                      marginBottom: 6,
                    }}
                  >
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>
                      {user?.fullName || user?.username}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>
                      {user?.email || 'Bệnh nhân Primecare'}
                    </div>
                  </div>

                  <Link
                    to="/patient/profile"
                    onClick={() => setProfileDropdownOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '9px 12px',
                      borderRadius: 8,
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      color: '#1e293b',
                      textDecoration: 'none',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f0fdfa')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <User size={16} color="#0d9488" />
                    <span>Hồ sơ & Tài khoản</span>
                  </Link>

                  <Link
                    to="/patient/appointments"
                    onClick={() => setProfileDropdownOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '9px 12px',
                      borderRadius: 8,
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      color: '#1e293b',
                      textDecoration: 'none',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f0fdfa')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Clock size={16} color="#0d9488" />
                    <span>Lịch hẹn của tôi</span>
                  </Link>

                  <div style={{ height: 1, background: '#f1f5f9', margin: '6px 0' }} />

                  <button
                    type="button"
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '9px 12px',
                      borderRadius: 8,
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      color: '#dc2626',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#fee2e2')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <LogOut size={16} />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  type="button"
                  onClick={onLoginClick}
                  style={{
                    background: '#0d9488',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 18px',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                  }}
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  onClick={onRegisterClick}
                  style={{
                    background: '#f1f5f9',
                    color: '#0f172a',
                    border: '1px solid #cbd5e1',
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                  }}
                >
                  Đăng ký
                </button>
              </div>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="patient-mobile-toggle-btn"
              style={{
                display: 'none',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                padding: '7px',
                cursor: 'pointer',
              }}
            >
              <Menu size={20} color="#0f172a" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. MOBILE RIGHT-TO-LEFT SIDEBAR DRAWER */}
      {/* Dark Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.52)',
            backdropFilter: 'blur(3px)',
            zIndex: 1999,
          }}
        />
      )}

      {/* Off-Canvas Sidebar sliding from Right to Left */}
      <aside
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(310px, 84vw)',
          background: '#ffffff',
          boxShadow: mobileMenuOpen ? '-8px 0 36px rgba(15, 23, 42, 0.25)' : 'none',
          zIndex: 2000,
          display: 'flex',
          flexDirection: 'column',
          transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
          visibility: mobileMenuOpen ? 'visible' : 'hidden',
          overflowY: 'auto',
        }}
      >
        {/* Drawer Header: Logo + Close Button */}
        <div
          style={{
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: '#0d9488',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
              }}
            >
              <Plus size={18} strokeWidth={3.5} />
            </div>
            <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>
              Prime<span style={{ color: '#0d9488' }}>care</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#0f172a',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* User profile snippet in sidebar */}
        {user ? (
          <div
            style={{
              padding: '16px 20px',
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: '#0d9488',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '1.1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {(user?.fullName || user?.username || 'B')[0].toUpperCase()}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  color: '#0f172a',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user?.fullName || user?.username}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
                BỆNH NHÂN • {user?.status === 'ACTIVE' ? 'ĐÃ KÍCH HOẠT' : (user?.status || 'HOẠT ĐỘNG')}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onLoginClick?.();
              }}
              style={{
                flex: 1,
                background: '#0d9488',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                padding: '9px 12px',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
              }}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onRegisterClick?.();
              }}
              style={{
                flex: 1,
                background: '#ffffff',
                color: '#0f172a',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                padding: '9px 12px',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
              }}
            >
              Đăng ký
            </button>
          </div>
        )}

        {/* Navigation Links list */}
        <nav style={{ padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          {navLinks.map((link) => (
            <NavLink
              key={link.to + link.label}
              to={link.to}
              end={link.end}
              onClick={() => setMobileMenuOpen(false)}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 10,
                fontSize: '0.92rem',
                fontWeight: 700,
                textDecoration: 'none',
                background: isActive ? '#f0fdfa' : 'transparent',
                color: isActive ? '#0d9488' : '#334155',
                transition: 'all 0.15s ease',
              })}
            >
              {link.icon}
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer Area in Sidebar */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
          {user && (
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                borderRadius: 10,
                fontSize: '0.9rem',
                fontWeight: 700,
                color: '#dc2626',
                background: '#fee2e2',
                border: 'none',
                cursor: 'pointer',
                marginBottom: 12,
              }}
            >
              <LogOut size={16} />
              <span>Đăng xuất</span>
            </button>
          )}

          <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
            <PhoneCall size={14} color="#0d9488" />
            <span>Hotline 24/7: <strong style={{ color: '#0d9488' }}>1900 8888</strong></span>
          </div>
        </div>
      </aside>

      {/* 2. MAIN PATIENT PORTAL CONTENT */}
      <main style={{ flex: 1, width: '100%' }}>
        {children}
      </main>

      {/* 3. CLEAN MODERN FOOTER */}
      <footer
        style={{
          background: '#0f172a',
          color: '#94a3b8',
          padding: '40px 24px 30px',
          borderTop: '1px solid #1e293b',
          marginTop: 'auto',
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 20,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ffffff' }}>
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 6,
                  background: '#0d9488',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                }}
              >
                <Plus size={18} strokeWidth={3} />
              </div>
              <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>Primecare Dental</span>
            </div>
            <p style={{ margin: '8px 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
              Đặt lịch khám nha khoa như đặt một chuyến đi • Hotline: 1900 8888
            </p>
          </div>

          <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
            © 2026 Primecare Clinic. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Floating AI Dental Assistant Widget (Chỉ hiển thị riêng ở giao diện Patient) */}
      <ChatbotWidget onOpenLogin={onLoginClick} />
    </div>
  );
}
