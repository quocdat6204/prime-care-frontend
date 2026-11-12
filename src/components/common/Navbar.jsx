import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PrimeLogo from './PrimeLogo';
import {
  Menu, X, Calendar, Phone, Search, ChevronDown,
  Home, Info, Stethoscope, Tag, BookOpen, UserCheck,
  Image as ImageIcon, Star, HelpCircle, LogOut, User,
  LayoutDashboard
} from 'lucide-react';

export default function Navbar({ onLoginClick, onRegisterClick }) {
  const { user, role, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setMenuOpen(false);
  };

  const getDashboardPath = () => {
    switch (role) {
      case 'ADMIN': return '/admin';
      case 'DOCTOR': return '/doctor';
      case 'PATIENT': return '/patient';
      default: return '/';
    }
  };

  const getRoleLabel = () => {
    switch (role) {
      case 'ADMIN': return 'Quản trị viên';
      case 'DOCTOR': return 'Bác sĩ';
      case 'PATIENT': return 'Bệnh nhân';
      default: return '';
    }
  };

  const navTabs = [
    { id: 'home', label: 'Trang Chủ', icon: Home, hash: '#home' },
    { id: 'about', label: 'Giới Thiệu', icon: Info, hash: '#about' },
    { id: 'services', label: 'Dịch Vụ', icon: Stethoscope, hash: '#services' },
    { id: 'doctors', label: 'Bác Sĩ', icon: UserCheck, hash: '#doctors' },
    { id: 'reviews', label: 'Cảm Nhận', icon: Star, hash: '#reviews' },
    { id: 'faq', label: 'FAQ', icon: HelpCircle, hash: '#faq' },
  ];

  const handleNavClick = (tab) => {
    setActiveTab(tab.id);
    setMenuOpen(false);

    if (location.pathname !== '/') {
      navigate('/' + tab.hash);
      return;
    }

    if (tab.id === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setTimeout(() => {
      const element = document.getElementById(tab.id);
      if (element) {
        const headerEl = document.querySelector('.prime-header');
        const headerHeight = headerEl ? headerEl.getBoundingClientRect().height : 70;
        const extraOffset = tab.id === 'doctors' ? 6 : (window.innerHeight < 800 ? 10 : 20);
        const headerOffset = headerHeight + extraOffset;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({
          top: Math.max(0, offsetPosition),
          behavior: 'smooth',
        });
      }
    }, 60);
  };

  const handleBookAppointment = () => {
    if (user) {
      navigate('/patient');
    } else {
      if (onRegisterClick) {
        onRegisterClick();
      } else if (onLoginClick) {
        onLoginClick();
      }
    }
    setMenuOpen(false);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    setTimeout(() => {
      const servicesSection = document.getElementById('services');
      if (servicesSection) {
        const headerEl = document.querySelector('.prime-header');
        const headerHeight = headerEl ? headerEl.getBoundingClientRect().height : 70;
        const headerOffset = headerHeight + 25;
        const elementPosition = servicesSection.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({
          top: Math.max(0, offsetPosition),
          behavior: 'smooth',
        });
      }
    }, 60);
  };

  // Observe scroll position to highlight active tab
  useEffect(() => {
    if (location.pathname !== '/') return;

    const handleScroll = () => {
      const scrollPos = window.scrollY + 160;
      const sections = ['faq', 'reviews', 'doctors', 'about', 'services'];
      for (const sId of sections) {
        const el = document.getElementById(sId);
        if (el && el.offsetTop <= scrollPos) {
          setActiveTab(sId);
          return;
        }
      }
      if (window.scrollY < 400) {
        setActiveTab('home');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  return (
    <header className="prime-header">
      {/* Top Tier Navbar */}
      <div className="prime-topbar">
        <div className="prime-container topbar-inner">
          {/* Logo */}
          <Link to="/" className="topbar-brand" onClick={() => setActiveTab('home')}>
            <PrimeLogo size={34} />
          </Link>

          {/* Search Box */}
          <form className="topbar-search" onSubmit={handleSearchSubmit}>
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Bạn cần tìm kiếm gì?"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button type="button" className="search-chevron-btn" aria-label="Bộ lọc">
              <ChevronDown size={15} />
            </button>
          </form>

          {/* Right Section: Hotline, Booking CTA & Auth */}
          <div className="topbar-actions">
            {/* Phone Hotline */}
            <a href="tel:+84123456789" className="topbar-hotline">
              <span className="hotline-icon-badge">
                <Phone size={15} />
              </span>
              <span className="hotline-text">
                <span className="hotline-label">Liên Hệ Ngay/</span>
                <span className="hotline-number">+84 123456789</span>
              </span>
            </a>

            {/* Book Appointment CTA */}
            <button className="btn-prime-navy" onClick={handleBookAppointment}>
              <Calendar size={16} />
              <span>Đặt lịch hẹn</span>
            </button>

            {/* User or Auth Buttons */}
            {!user ? (
              <div className="topbar-auth">
                <button
                  className="btn-auth-login"
                  onClick={() => onLoginClick?.()}
                >
                  Đăng nhập
                </button>
                <button
                  className="btn-auth-register"
                  onClick={() => onRegisterClick?.()}
                >
                  Đăng ký
                </button>
              </div>
            ) : (
              <div className="topbar-user-menu">
                <Link to={getDashboardPath()} className="topbar-user-chip">
                  {user.ava ? (
                    <img src={user.ava} alt="avatar" className="user-avatar-sm" />
                  ) : (
                    <div className="user-avatar-placeholder">
                      {user.fullName?.charAt(0) || <User size={14} />}
                    </div>
                  )}
                  <div className="topbar-user-info">
                    <span className="user-name">{user.fullName || user.username}</span>
                    <span className="user-role-badge">{getRoleLabel()}</span>
                  </div>
                </Link>
                <button
                  className="btn-user-logout"
                  onClick={handleLogout}
                  title="Đăng xuất"
                  aria-label="Đăng xuất"
                >
                  <LogOut size={16} />
                </button>
              </div>
            )}

            {/* Mobile Toggle Button */}
            <button
              className="prime-mobile-toggle"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle navigation"
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Second Tier: Menu Tabs Navigation */}
      <nav className={`prime-menubar ${menuOpen ? 'mobile-open' : ''}`}>
        <div className="prime-container menubar-inner">
          <ul className="menubar-tabs">
            {navTabs.map((tab) => {
              const IconComp = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <li key={tab.id} className="menubar-tab-item">
                  <button
                    type="button"
                    onClick={() => handleNavClick(tab)}
                    className={`menubar-tab-btn ${isActive ? 'active' : ''}`}
                  >
                    <span className={`tab-icon-wrap ${isActive ? 'active-icon' : ''}`}>
                      <IconComp size={16} />
                    </span>
                    <span className="tab-label">{tab.label}</span>
                    {isActive && <span className="tab-active-indicator" />}
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Mobile Extra Actions when drawer is open */}
          {menuOpen && (
            <div className="mobile-drawer-footer">
              <a href="tel:+84123456789" className="mobile-hotline-link">
                <Phone size={16} />
                <span>Hotline: +84 123456789</span>
              </a>
              <button className="btn-prime-navy w-full" onClick={handleBookAppointment}>
                <Calendar size={16} />
                <span>Đặt lịch hẹn khám</span>
              </button>
              {!user ? (
                <div className="mobile-auth-grid">
                  <button
                    className="btn-auth-login"
                    onClick={() => { onLoginClick?.(); setMenuOpen(false); }}
                  >
                    Đăng nhập
                  </button>
                  <button
                    className="btn-auth-register"
                    onClick={() => { onRegisterClick?.(); setMenuOpen(false); }}
                  >
                    Đăng ký
                  </button>
                </div>
              ) : (
                <div className="mobile-user-actions">
                  <Link
                    to={getDashboardPath()}
                    className="btn-dash-link"
                    onClick={() => setMenuOpen(false)}
                  >
                    <LayoutDashboard size={16} />
                    <span>Trang quản trị ({getRoleLabel()})</span>
                  </Link>
                  <button className="btn-auth-logout" onClick={handleLogout}>
                    <LogOut size={16} />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
