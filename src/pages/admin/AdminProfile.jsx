import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { userService } from '../../services/userService';
import { authService } from '../../services/authService';
import { Save, Lock, Mail, Phone, User as UserIcon, Shield, CheckCircle2, Key, ShieldCheck } from 'lucide-react';

export default function AdminProfile() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    email: user?.email || '',
    fullName: user?.fullName || '',
    phone: user?.phone || '',
  });

  useEffect(() => {
    if (user) {
      setForm({
        email: user.email || '',
        fullName: user.fullName || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const [pwForm, setPwForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [pwLoading, setPwLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.email.trim()) {
      toast.error('Vui lòng điền Họ tên và Email');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        fullName: form.fullName.trim(),
        full_name: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
      };
      const res = await userService.updateMyInfo(payload);
      const updatedData = res.data.result;
      updateUser(updatedData);
      toast.success('Cập nhật thông tin quản trị viên thành công!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!pwForm.oldPassword || !pwForm.newPassword) {
      toast.warning('Vui lòng nhập đầy đủ mật khẩu cũ và mới');
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,128}$/;
    if (!passwordRegex.test(pwForm.newPassword)) {
      toast.error('Mật khẩu mới phải từ 8 ký tự, gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt');
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

  return (
    <div className="admin-profile-container">
      {/* Page Title & Breadcrumb */}
      <div className="admin-profile-header">
        <h1>Hồ sơ Quản trị viên</h1>
        <p>Quản lý thông tin định danh và cài đặt bảo mật cho tài khoản Quản trị viên hệ thống</p>
      </div>

      {/* Main 2-Column Responsive Grid */}
      <div className="admin-profile-grid">
        {/* Left Column: Admin Identity Overview Card */}
        <div className="admin-profile-card">
          <div className="admin-profile-sidebar">
            {/* Admin Avatar Badge (Letter Initial - No Image Upload as Admin has no 'ava' field) */}
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: '50%',
                margin: '0 auto',
                background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontSize: '2.5rem',
                fontWeight: 800,
                boxShadow: '0 8px 24px rgba(124, 58, 237, 0.25)',
                border: '4px solid #ede9fe',
              }}
              title="Quản trị viên hệ thống"
            >
              {(user?.fullName?.trim() || user?.username?.trim() || 'A')[0].toUpperCase()}
            </div>

            <h2 style={{ margin: '16px 0 4px', fontSize: '1.25rem', fontWeight: 800, color: 'var(--gray-900)' }}>
              {user?.fullName || user?.username}
            </h2>
            <div style={{ fontSize: '0.85rem', color: '#6d28d9', fontWeight: 600, marginBottom: 14 }}>
              @{user?.username}
            </div>

            {/* Role Badges */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
              <span
                style={{
                  background: '#ede9fe',
                  color: '#6d28d9',
                  padding: '5px 12px',
                  borderRadius: 20,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  border: '1px solid #ddd6fe',
                }}
              >
                <Shield size={13} />
                <span>QUẢN TRỊ VIÊN</span>
              </span>
              <span
                style={{
                  background: '#dcfce7',
                  color: '#15803d',
                  padding: '5px 12px',
                  borderRadius: 20,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  border: '1px solid #bbf7d0',
                }}
              >
                <CheckCircle2 size={13} />
                <span>ĐÃ KÍCH HOẠT</span>
              </span>
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 18, textAlign: 'left' }}>
              <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gray-400)', fontWeight: 700, marginBottom: 12 }}>
                Thông tin hệ thống
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--gray-700)' }}>
                  <Mail size={15} color="#7c3aed" style={{ flexShrink: 0 }} />
                  <span style={{ wordBreak: 'break-all' }}>{user?.email || 'Chưa cập nhật'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--gray-700)' }}>
                  <Phone size={15} color="#7c3aed" style={{ flexShrink: 0 }} />
                  <span>{user?.phone || 'Chưa cập nhật'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--gray-700)' }}>
                  <ShieldCheck size={15} color="#7c3aed" style={{ flexShrink: 0 }} />
                  <span>Toàn quyền quản trị (Super Admin)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Tabbed Content Card */}
        <div className="admin-profile-card" style={{ padding: '24px 28px' }}>
          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid #ede9fe', paddingBottom: 14 }}>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`btn btn-sm ${activeTab === tab.key ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '9px 20px',
                  borderRadius: 12,
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  borderColor: activeTab === tab.key ? '#7c3aed' : '#e2e8f0',
                  background: activeTab === tab.key ? '#7c3aed' : '#ffffff',
                  color: activeTab === tab.key ? '#ffffff' : '#475569',
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab 1: Edit Profile (Admin-only fields) */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--gray-900)' }}>
                  Thông tin định danh Quản trị viên
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--gray-500)' }}>
                  Cập nhật họ tên, email và số điện thoại liên lạc của quản trị viên
                </p>
              </div>

              {/* Row 1: FullName and Email */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                    <UserIcon size={14} color="#7c3aed" />
                    <span>Họ và tên *</span>
                  </label>
                  <input
                    className="form-input"
                    name="fullName"
                    type="text"
                    value={form.fullName}
                    onChange={handleChange}
                    placeholder="Nhập họ và tên..."
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                    <Mail size={14} color="#7c3aed" />
                    <span>Địa chỉ Email *</span>
                  </label>
                  <input
                    className="form-input"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="admin@nhakhoa.vn"
                    required
                  />
                </div>
              </div>

              {/* Row 2: Phone and Username */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                    <Phone size={14} color="#7c3aed" />
                    <span>Số điện thoại</span>
                  </label>
                  <input
                    className="form-input"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="0912345678"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                    <Shield size={14} color="#7c3aed" />
                    <span>Tên đăng nhập (Username)</span>
                  </label>
                  <input
                    className="form-input"
                    type="text"
                    value={user?.username || ''}
                    disabled
                    style={{ background: '#f8fafc', color: 'var(--gray-500)', cursor: 'not-allowed' }}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--gray-400)', marginTop: 4, display: 'block' }}>
                    Tên đăng nhập là định danh bảo mật, không thể thay đổi
                  </span>
                </div>
              </div>

              {/* Admin Privileges Info Box */}
              <div
                style={{
                  padding: '14px 18px',
                  background: '#faf5ff',
                  borderRadius: 12,
                  border: '1px solid #ede9fe',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: '#ede9fe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#6d28d9',
                    flexShrink: 0,
                  }}
                >
                  <Shield size={18} />
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#581c87', lineHeight: 1.5 }}>
                  Tài khoản được cấp quyền <strong>Toàn quyền Quản trị (SUPER ADMIN)</strong> trong chuỗi Primecare, bao gồm quản lý người dùng, phân quyền bác sĩ và giám sát hệ thống.
                </div>
              </div>

              {/* Action Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 4 }}>
                <button
                  type="submit"
                  className="btn"
                  disabled={saving}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '11px 26px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    borderRadius: 12,
                    background: '#7c3aed',
                    color: '#ffffff',
                    border: 'none',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(124, 58, 237, 0.25)',
                  }}
                >
                  {saving ? (
                    <span className="spinner spinner-sm" style={{ borderTopColor: '#fff' }} />
                  ) : (
                    <Save size={16} />
                  )}
                  <span>{saving ? 'Đang lưu thay đổi...' : 'Lưu thay đổi'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Tab 2: Change Password */}
          {activeTab === 'password' && (
            <form onSubmit={handleChangePassword} style={{ maxWidth: 460, display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--gray-900)' }}>
                  Đổi mật khẩu Quản trị viên
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--gray-500)' }}>
                  Nên sử dụng mật khẩu mạnh để bảo vệ quyền hạn cao nhất của hệ thống
                </p>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Mật khẩu hiện tại *</label>
                <input
                  className="form-input"
                  type="password"
                  value={pwForm.oldPassword}
                  onChange={(e) => setPwForm({ ...pwForm, oldPassword: e.target.value })}
                  placeholder="Nhập mật khẩu hiện tại..."
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Mật khẩu mới *</label>
                <input
                  className="form-input"
                  type="password"
                  value={pwForm.newPassword}
                  onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                  placeholder="Nhập mật khẩu mới..."
                  required
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--gray-400)', marginTop: 4, display: 'block' }}>
                  Tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt
                </span>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Xác nhận mật khẩu mới *</label>
                <input
                  className="form-input"
                  type="password"
                  value={pwForm.confirmPassword}
                  onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                  placeholder="Nhập lại mật khẩu mới..."
                  required
                />
              </div>

              <div style={{ marginTop: 6 }}>
                <button
                  type="submit"
                  className="btn"
                  disabled={pwLoading}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '11px 26px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    borderRadius: 12,
                    background: '#7c3aed',
                    color: '#ffffff',
                    border: 'none',
                    cursor: pwLoading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(124, 58, 237, 0.25)',
                  }}
                >
                  {pwLoading ? (
                    <span className="spinner spinner-sm" style={{ borderTopColor: '#fff' }} />
                  ) : (
                    <Key size={16} />
                  )}
                  <span>{pwLoading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
