import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { userService } from '../../services/userService';
import { authService } from '../../services/authService';
import ImageUploader from '../../components/common/ImageUploader';
import { Save, Lock, Mail, Phone, User as UserIcon, Award, Eye, EyeOff, Check, X, ShieldCheck } from 'lucide-react';

const rankLabels = {
  PROFESSOR: 'Giáo sư / Phó Giáo sư',
  DOCTORATE: 'Tiến sĩ Y khoa',
  MASTER: 'Thạc sĩ / BS Chuyên khoa',
};

export default function DoctorProfile() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    email: user?.email || '',
    fullName: user?.fullName || '',
    phone: user?.phone || '',
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
      toast.success('Cập nhật thông tin thành công!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cập nhật thất bại');
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
    { key: 'profile', label: 'Hồ sơ bác sĩ', icon: <UserIcon size={16} /> },
    { key: 'password', label: 'Đổi mật khẩu', icon: <Lock size={16} /> },
  ];

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', width: '100%' }}>
      {/* Page Title */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--gray-900)', margin: '0 0 4px' }}>
          Hồ sơ Chuyên môn Bác sĩ
        </h1>
        <p style={{ margin: 0, color: 'var(--gray-500)', fontSize: '0.875rem' }}>
          Quản lý thông tin định danh y khoa, học hàm học vị và thiết lập bảo mật tài khoản
        </p>
      </div>

      {/* Doctor Header Card */}
      <div
        className="card"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          padding: 24,
          marginBottom: 20,
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <ImageUploader
          currentImage={user?.ava}
          folder="avatars"
          size="xl"
          onUpload={async (url) => {
            try {
              const res = await userService.updateMyInfo({ ava: url });
              updateUser(res.data.result);
              toast.success('Cập nhật ảnh đại diện thành công!');
            } catch {
              toast.error('Lưu ảnh thất bại');
            }
          }}
        />
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--gray-900)', margin: '0 0 4px' }}>
            {user?.fullName}
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', margin: '0 0 10px' }}>
            @{user?.username}
          </p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span
              className="badge"
              style={{
                background: '#eff6ff',
                color: '#2563eb',
                fontWeight: 700,
                fontSize: '0.75rem',
                padding: '4px 10px',
                borderRadius: 20,
              }}
            >
              Bác sĩ Nha khoa
            </span>
            {user?.rank && (
              <span
                style={{
                  background: '#f0fdf4',
                  color: '#15803d',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  padding: '4px 10px',
                  borderRadius: 20,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Award size={13} />
                <span>{rankLabels[user.rank] || user.rank}</span>
              </span>
            )}
            <span
              className="badge"
              style={{
                background: user?.status === 'ACTIVE' ? '#dcfce7' : '#fee2e2',
                color: user?.status === 'ACTIVE' ? '#15803d' : '#b91c1c',
                fontWeight: 700,
                fontSize: '0.75rem',
                padding: '4px 10px',
                borderRadius: 20,
              }}
            >
              {user?.status === 'ACTIVE' ? 'Đang hoạt động' : user?.status}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              className="btn btn-sm"
              style={{
                background: isActive ? 'var(--doctor-accent)' : '#ffffff',
                color: isActive ? '#ffffff' : 'var(--gray-700)',
                border: `1.5px solid ${isActive ? 'var(--doctor-accent)' : '#cbd5e1'}`,
                padding: '8px 18px',
                fontWeight: isActive ? 700 : 500,
                borderRadius: 10,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s ease',
              }}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Profile Info */}
      {activeTab === 'profile' && (
        <div className="card" style={{ padding: 28, background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0' }}>
          <div style={{ marginBottom: 20, borderBottom: '1px solid #f1f5f9', paddingBottom: 14 }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 700, color: 'var(--gray-900)' }}>
              Thông tin Bác sĩ
            </h3>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--gray-500)' }}>
              Cập nhật thông tin liên hệ và hồ sơ cá nhân hiển thị trên hệ thống
            </p>
          </div>

          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Mail size={14} style={{ color: 'var(--doctor-accent)' }} />
                  <span>Địa chỉ Email *</span>
                </label>
                <input
                  className="form-input"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <UserIcon size={14} style={{ color: 'var(--doctor-accent)' }} />
                  <span>Họ và tên *</span>
                </label>
                <input
                  className="form-input"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Phone size={14} style={{ color: 'var(--doctor-accent)' }} />
                  <span>Số điện thoại</span>
                </label>
                <input
                  className="form-input"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="0912345678"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Award size={14} style={{ color: 'var(--doctor-accent)' }} />
                  <span>Học hàm / Cấp bậc</span>
                </label>
                <input
                  className="form-input"
                  value={rankLabels[user?.rank] || 'Chưa xác định'}
                  disabled
                  style={{ background: '#f8fafc', color: 'var(--gray-600)', cursor: 'not-allowed' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
                style={{
                  background: 'var(--doctor-accent)',
                  borderColor: 'var(--doctor-accent)',
                  padding: '10px 24px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  fontWeight: 600,
                  borderRadius: 10,
                }}
              >
                {saving ? <span className="spinner spinner-sm" style={{ borderTopColor: '#fff' }} /> : <Save size={16} />}
                <span>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Password */}
      {activeTab === 'password' && (
        <div className="card" style={{ padding: 28, background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0' }}>
          <div style={{ marginBottom: 20, borderBottom: '1px solid #f1f5f9', paddingBottom: 14 }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 700, color: 'var(--gray-900)' }}>
              Thay đổi mật khẩu Bác sĩ
            </h3>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--gray-500)' }}>
              Để bảo mật tài khoản, vui lòng thiết lập mật khẩu mạnh đáp ứng đầy đủ các tiêu chuẩn bảo mật hệ thống
            </p>
          </div>

          <form onSubmit={handleChangePassword} style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* 1. Mật khẩu hiện tại */}
            <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Mật khẩu hiện tại *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="form-input"
                    type={showOldPw ? 'text' : 'password'}
                    value={pwForm.oldPassword}
                    onChange={(e) => setPwForm({ ...pwForm, oldPassword: e.target.value })}
                    placeholder="Nhập mật khẩu hiện tại..."
                    required
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPw(!showOldPw)}
                    tabIndex={-1}
                    aria-label={showOldPw ? 'Ẩn' : 'Hiện'}
                    title={showOldPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--gray-400)',
                      padding: 4,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {showOldPw ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* 2. Mật khẩu mới */}
              <div className="form-group" style={{ marginBottom: 10 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Mật khẩu mới *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="form-input"
                    type={showNewPw ? 'text' : 'password'}
                    value={pwForm.newPassword}
                    onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                    placeholder="Nhập mật khẩu mới..."
                    required
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    tabIndex={-1}
                    aria-label={showNewPw ? 'Ẩn' : 'Hiện'}
                    title={showNewPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--gray-400)',
                      padding: 4,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {showNewPw ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Password Requirements Checklist */}
              <div
                style={{
                  padding: '12px 14px',
                  background: isPasswordValid ? '#f0fdf4' : '#f8fafc',
                  border: `1px solid ${isPasswordValid ? '#bbf7d0' : '#e2e8f0'}`,
                  borderRadius: 10,
                  marginBottom: 16,
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: isPasswordValid ? '#15803d' : 'var(--gray-700)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ShieldCheck size={14} />
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
                        fontSize: '0.75rem',
                        color: c.valid ? '#16a34a' : 'var(--gray-500)',
                        fontWeight: c.valid ? 600 : 400,
                      }}
                    >
                      {c.valid ? (
                        <Check size={13} style={{ color: '#16a34a', flexShrink: 0 }} />
                      ) : (
                        <span style={{ width: 13, height: 13, borderRadius: '50%', border: '1.5px solid #cbd5e1', display: 'inline-block', flexShrink: 0 }} />
                      )}
                      <span>{c.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Xác nhận mật khẩu mới */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>Xác nhận mật khẩu mới *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="form-input"
                    type={showConfirmPw ? 'text' : 'password'}
                    value={pwForm.confirmPassword}
                    onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                    placeholder="Nhập lại mật khẩu mới..."
                    required
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                    tabIndex={-1}
                    aria-label={showConfirmPw ? 'Ẩn' : 'Hiện'}
                    title={showConfirmPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--gray-400)',
                      padding: 4,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {showConfirmPw ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {pwForm.confirmPassword && (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      marginTop: 4,
                      display: 'block',
                      color: pwForm.newPassword === pwForm.confirmPassword ? '#16a34a' : '#dc2626',
                      fontWeight: 600,
                    }}
                  >
                    {pwForm.newPassword === pwForm.confirmPassword ? '✓ Mật khẩu xác nhận trùng khớp' : '✗ Mật khẩu xác nhận chưa khớp'}
                  </span>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={pwLoading || !isPasswordValid || (pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword)}
                style={{
                  background: 'var(--doctor-accent)',
                  borderColor: 'var(--doctor-accent)',
                  padding: '10px 18px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {pwLoading ? <span className="spinner spinner-sm" style={{ borderTopColor: '#fff' }} /> : <Lock size={16} />}
                <span>Đổi mật khẩu</span>
              </button>
            </form>
        </div>
      )}
    </div>
  );
}
