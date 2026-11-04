import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { userService } from '../../services/userService';
import { authService } from '../../services/authService';
import {
  Save, Lock, Mail, Phone, MapPin, User as UserIcon,
  Eye, EyeOff, Check, ShieldCheck, CheckCircle2
} from 'lucide-react';

export default function PatientProfile() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    email: user?.email || '',
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    address: user?.address || '',
    gender: user?.gender || '',
  });
  const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [showOldPw, setShowOldPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const passwordCriteria = [
    { label: 'Tối thiểu 8 ký tự (tối đa 128)', valid: pwForm.newPassword.length >= 8 && pwForm.newPassword.length <= 128 },
    { label: 'Ít nhất 1 chữ in hoa (A-Z)', valid: /[A-Z]/.test(pwForm.newPassword) },
    { label: 'Ít nhất 1 chữ in thường (a-z)', valid: /[a-z]/.test(pwForm.newPassword) },
    { label: 'Ít nhất 1 chữ số (0-9)', valid: /\d/.test(pwForm.newPassword) },
    { label: 'Ít nhất 1 ký tự đặc biệt (!@#$%^&*...)', valid: /[^a-zA-Z0-9]/.test(pwForm.newPassword) },
  ];
  const isPasswordValid = passwordCriteria.every((c) => c.valid);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await userService.updateMyInfo(form);
      updateUser(res.data.result);
      toast.success('Cập nhật hồ sơ bệnh nhân thành công!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cập nhật thất bại, vui lòng thử lại');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!pwForm.oldPassword || !pwForm.newPassword) {
      toast.warning('Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới');
      return;
    }
    if (!isPasswordValid) {
      toast.error('Mật khẩu mới chưa đáp ứng đầy đủ các tiêu chuẩn bảo mật!');
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp với mật khẩu mới');
      return;
    }
    setPwLoading(true);
    try {
      await authService.changePassword({
        oldPassword: pwForm.oldPassword,
        newPassword: pwForm.newPassword,
      });
      toast.success('Đổi mật khẩu thành công!');
      setPwForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đổi mật khẩu thất bại');
    } finally {
      setPwLoading(false);
    }
  };

  const tabs = [
    { key: 'profile', label: 'Thông tin cá nhân', icon: <UserIcon size={16} /> },
    { key: 'password', label: 'Đổi mật khẩu', icon: <Lock size={16} /> },
  ];

  const initialLetter = (user?.fullName || user?.username || 'B')[0].toUpperCase();

  return (
    <div style={{ maxWidth: 840, margin: '36px auto 80px', padding: '0 24px', width: '100%' }}>
      {/* 1. PROFILE HEADER CARD (Centered, Clean & No Avatar Upload) */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 20,
          border: '1.5px solid #e2e8f0',
          padding: '28px 32px',
          boxShadow: '0 6px 20px rgba(0, 0, 0, 0.03)',
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          marginBottom: 24,
          flexWrap: 'wrap',
        }}
      >
        {/* Fixed Patient Initials Avatar (No Camera / No Upload) */}
        <div
          style={{
            width: 76,
            height: 76,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            fontWeight: 800,
            boxShadow: '0 8px 24px rgba(13, 148, 136, 0.28)',
            flexShrink: 0,
            border: '3px solid #ffffff',
            outline: '2px solid #ccfbf1',
          }}
        >
          {initialLetter}
        </div>

        {/* Profile Info */}
        <div style={{ flex: 1, minWidth: 240 }}>
          <h2 style={{ margin: '0 0 4px', fontSize: '1.5rem', fontWeight: 900, color: '#0f172a' }}>
            {user?.fullName || 'Họ và tên Bệnh nhân'}
          </h2>
          <p style={{ margin: '0 0 10px', fontSize: '0.88rem', color: '#64748b' }}>
            @{user?.username || 'username'}
          </p>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span
              style={{
                background: '#f0fdfa',
                color: '#0d9488',
                border: '1px solid #ccfbf1',
                padding: '4px 12px',
                borderRadius: 20,
                fontSize: '0.78rem',
                fontWeight: 800,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
              }}
            >
              BỆNH NHÂN
            </span>
            <span
              style={{
                background: user?.status === 'ACTIVE' ? '#ecfdf5' : '#f8fafc',
                color: user?.status === 'ACTIVE' ? '#059669' : '#64748b',
                border: `1px solid ${user?.status === 'ACTIVE' ? '#a7f3d0' : '#e2e8f0'}`,
                padding: '4px 12px',
                borderRadius: 20,
                fontSize: '0.78rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <CheckCircle2 size={13} color={user?.status === 'ACTIVE' ? '#059669' : '#64748b'} />
              <span>{user?.status === 'ACTIVE' ? 'ĐÃ KÍCH HOẠT' : (user?.status || 'HOẠT ĐỘNG')}</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. NAVIGATION TABS */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                borderRadius: 12,
                fontSize: '0.92rem',
                fontWeight: 700,
                border: isActive ? '1.5px solid #0d9488' : '1.5px solid #e2e8f0',
                background: isActive ? '#0d9488' : '#ffffff',
                color: isActive ? '#ffffff' : '#475569',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: isActive ? '0 4px 12px rgba(13, 148, 136, 0.25)' : 'none',
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. TAB 1: THÔNG TIN CÁ NHÂN */}
      {activeTab === 'profile' && (
        <div
          style={{
            background: '#ffffff',
            borderRadius: 20,
            border: '1.5px solid #e2e8f0',
            padding: '32px 36px',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.03)',
          }}
        >
          <div style={{ marginBottom: 24, borderBottom: '1px solid #f1f5f9', paddingBottom: 16 }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
              Hồ sơ Bệnh nhân
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
              Thông tin của bạn được dùng để ghi nhận lịch hẹn và liên hệ khi đến khám tại phòng khám.
            </p>
          </div>

          <form onSubmit={handleSaveProfile}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 20 }}>
              {/* Email (Readonly or Editable) */}
              <div>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: '#334155',
                    marginBottom: 6,
                  }}
                >
                  <Mail size={15} color="#0d9488" />
                  <span>Địa chỉ Email</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Nhập email..."
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: 10,
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.92rem',
                    color: '#0f172a',
                    outline: 'none',
                    transition: 'border-color 0.15s ease',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#0d9488')}
                  onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
                />
              </div>

              {/* Họ và tên */}
              <div>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: '#334155',
                    marginBottom: 6,
                  }}
                >
                  <UserIcon size={15} color="#0d9488" />
                  <span>Họ và tên</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Nhập họ và tên..."
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: 10,
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.92rem',
                    color: '#0f172a',
                    outline: 'none',
                    transition: 'border-color 0.15s ease',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#0d9488')}
                  onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
                />
              </div>

              {/* Số điện thoại */}
              <div>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: '#334155',
                    marginBottom: 6,
                  }}
                >
                  <Phone size={15} color="#0d9488" />
                  <span>Số điện thoại</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Nhập số điện thoại..."
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: 10,
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.92rem',
                    color: '#0f172a',
                    outline: 'none',
                    transition: 'border-color 0.15s ease',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#0d9488')}
                  onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
                />
              </div>

              {/* Giới tính */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: '#334155',
                    marginBottom: 6,
                  }}
                >
                  Giới tính
                </label>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: 10,
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.92rem',
                    color: '#0f172a',
                    outline: 'none',
                    background: '#ffffff',
                    cursor: 'pointer',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#0d9488')}
                  onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
                >
                  <option value="">Chọn giới tính</option>
                  <option value="MALE">Nam</option>
                  <option value="FEMALE">Nữ</option>
                  <option value="OTHER">Khác</option>
                </select>
              </div>
            </div>

            {/* Địa chỉ (Full width) */}
            <div style={{ marginBottom: 28 }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: '#334155',
                  marginBottom: 6,
                }}
              >
                <MapPin size={15} color="#0d9488" />
                <span>Địa chỉ liên hệ</span>
              </label>
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Nhập địa chỉ của bạn (Số nhà, đường, quận/huyện...)..."
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: 10,
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.92rem',
                  color: '#0f172a',
                  outline: 'none',
                  transition: 'border-color 0.15s ease',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#0d9488')}
                onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
              />
            </div>

            {/* Nút lưu thay đổi */}
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  background: '#0d9488',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 12,
                  padding: '12px 32px',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 4px 14px rgba(13, 148, 136, 0.35)',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => !saving && (e.currentTarget.style.background = '#0f766e')}
                onMouseLeave={(e) => !saving && (e.currentTarget.style.background = '#0d9488')}
              >
                <Save size={18} />
                <span>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. TAB 2: ĐỔI MẬT KHẨU */}
      {activeTab === 'password' && (
        <div
          style={{
            background: '#ffffff',
            borderRadius: 20,
            border: '1.5px solid #e2e8f0',
            padding: '32px 36px',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.03)',
            maxWidth: 580,
          }}
        >
          <div style={{ marginBottom: 24, borderBottom: '1px solid #f1f5f9', paddingBottom: 16 }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
              Thay đổi mật khẩu Bệnh nhân
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
              Để bảo mật hồ sơ khám chữa bệnh, vui lòng thiết lập mật khẩu mạnh đáp ứng đầy đủ các tiêu chuẩn bảo mật.
            </p>
          </div>

          <form onSubmit={handleChangePassword}>
            {/* 1. Mật khẩu hiện tại */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Mật khẩu hiện tại *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showOldPw ? 'text' : 'password'}
                  value={pwForm.oldPassword}
                  onChange={(e) => setPwForm({ ...pwForm, oldPassword: e.target.value })}
                  placeholder="Nhập mật khẩu hiện tại..."
                  required
                  style={{
                    width: '100%',
                    padding: '11px 40px 11px 14px',
                    borderRadius: 10,
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.92rem',
                    color: '#0f172a',
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowOldPw(!showOldPw)}
                  tabIndex={-1}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {showOldPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* 2. Mật khẩu mới */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Mật khẩu mới *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNewPw ? 'text' : 'password'}
                  value={pwForm.newPassword}
                  onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                  placeholder="Nhập mật khẩu mới..."
                  required
                  style={{
                    width: '100%',
                    padding: '11px 40px 11px 14px',
                    borderRadius: 10,
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.92rem',
                    color: '#0f172a',
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(!showNewPw)}
                  tabIndex={-1}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {showNewPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Checklist tiêu chuẩn bảo mật */}
            <div
              style={{
                padding: '12px 14px',
                background: isPasswordValid ? '#f0fdf4' : '#f8fafc',
                border: `1.5px solid ${isPasswordValid ? '#86efac' : '#e2e8f0'}`,
                borderRadius: 10,
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  color: isPasswordValid ? '#15803d' : '#475569',
                  marginBottom: 6,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <ShieldCheck size={15} color={isPasswordValid ? '#15803d' : '#0d9488'} />
                <span>Yêu cầu mật khẩu mới:</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 5 }}>
                {passwordCriteria.map((c, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: '0.76rem',
                      color: c.valid ? '#16a34a' : '#64748b',
                      fontWeight: c.valid ? 700 : 500,
                    }}
                  >
                    {c.valid ? (
                      <Check size={14} style={{ color: '#16a34a', flexShrink: 0 }} />
                    ) : (
                      <span style={{ width: 12, height: 12, borderRadius: '50%', border: '1.5px solid #cbd5e1', display: 'inline-block', flexShrink: 0 }} />
                    )}
                    <span>{c.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Xác nhận mật khẩu mới */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Xác nhận mật khẩu mới *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPw ? 'text' : 'password'}
                  value={pwForm.confirmPassword}
                  onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                  placeholder="Nhập lại mật khẩu mới..."
                  required
                  style={{
                    width: '100%',
                    padding: '11px 40px 11px 14px',
                    borderRadius: 10,
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.92rem',
                    color: '#0f172a',
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw(!showConfirmPw)}
                  tabIndex={-1}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {showConfirmPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {pwForm.confirmPassword && (
                <span
                  style={{
                    fontSize: '0.78rem',
                    marginTop: 6,
                    display: 'block',
                    color: pwForm.newPassword === pwForm.confirmPassword ? '#16a34a' : '#dc2626',
                    fontWeight: 700,
                  }}
                >
                  {pwForm.newPassword === pwForm.confirmPassword ? '✓ Mật khẩu xác nhận trùng khớp' : '✗ Mật khẩu xác nhận chưa khớp'}
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={pwLoading || !isPasswordValid || (pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword)}
              style={{
                background: '#0d9488',
                color: '#ffffff',
                border: 'none',
                borderRadius: 12,
                padding: '12px 28px',
                fontWeight: 800,
                fontSize: '0.92rem',
                cursor: pwLoading ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 14px rgba(13, 148, 136, 0.35)',
              }}
            >
              <Lock size={16} />
              <span>{pwLoading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
