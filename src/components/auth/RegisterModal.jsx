import { useState } from 'react';
import { X, UserPlus, Eye, EyeOff, Check, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils/errorMessage';

export default function RegisterModal({ onClose, onSwitchToLogin, onNeedOtp }) {
  const { register } = useAuth();
  const toast = useToast();
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    phone: '',
    address: '',
    gender: '',
  });

  const passwordCriteria = [
    { label: 'Tối thiểu 8 ký tự (tối đa 128)', valid: form.password.length >= 8 && form.password.length <= 128 },
    { label: 'Ít nhất 1 chữ in hoa (A-Z)', valid: /[A-Z]/.test(form.password) },
    { label: 'Ít nhất 1 chữ in thường (a-z)', valid: /[a-z]/.test(form.password) },
    { label: 'Ít nhất 1 chữ số (0-9)', valid: /\d/.test(form.password) },
    { label: 'Ít nhất 1 ký tự đặc biệt (!@#$%^&*...)', valid: /[^a-zA-Z0-9]/.test(form.password) },
  ];
  const isPasswordValid = passwordCriteria.every((c) => c.valid);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.email || !form.password || !form.fullName) {
      setError('Vui lòng điền đầy đủ các trường bắt buộc (*)');
      return;
    }
    if (!isPasswordValid) {
      setError('Mật khẩu chưa đáp ứng đầy đủ các tiêu chuẩn bảo mật hệ thống');
      return;
    }
    if (form.password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp với mật khẩu đã nhập');
      return;
    }
    setLoading(true);
    try {
      await register(form);
      toast.success('Đăng ký thành công! Vui lòng nhập mã OTP từ email.');
      onNeedOtp?.(form.username);
    } catch (err) {
      const msg = getErrorMessage(err, 'Đăng ký thất bại. Vui lòng thử lại sau.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <h2>Đăng ký tài khoản</h2>
          <button className="btn btn-icon btn-ghost" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="profile-form-row">
                <div className="form-group">
                  <label className="form-label">Tên đăng nhập *</label>
                  <input
                    className="form-input"
                    name="username"
                    placeholder="vd: nguyenvana"
                    value={form.username}
                    onChange={handleChange}
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Họ và tên *</label>
                  <input
                    className="form-input"
                    name="fullName"
                    placeholder="Nguyễn Văn A"
                    value={form.fullName}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email *</label>
                <input
                  className="form-input"
                  name="email"
                  type="email"
                  placeholder="email@example.com"
                  value={form.email}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Mật khẩu *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="form-input"
                    name="password"
                    type={showPw ? 'text' : 'password'}
                    placeholder="Nhập mật khẩu..."
                    value={form.password}
                    onChange={handleChange}
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    tabIndex={-1}
                    aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    title={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    style={{
                      position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', color: 'var(--gray-400)', cursor: 'pointer',
                    }}
                  >
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Password Requirements Checklist */}
              {form.password && (
                <div
                  style={{
                    padding: '10px 12px',
                    background: isPasswordValid ? '#f0fdf4' : '#f8fafc',
                    border: `1px solid ${isPasswordValid ? '#bbf7d0' : '#e2e8f0'}`,
                    borderRadius: 8,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: isPasswordValid ? '#15803d' : 'var(--gray-700)', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <ShieldCheck size={13} />
                    <span>Yêu cầu mật khẩu:</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 4 }}>
                    {passwordCriteria.map((c, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: '0.73rem',
                          color: c.valid ? '#16a34a' : 'var(--gray-500)',
                          fontWeight: c.valid ? 600 : 400,
                        }}
                      >
                        {c.valid ? (
                          <Check size={12} style={{ color: '#16a34a', flexShrink: 0 }} />
                        ) : (
                          <span style={{ width: 12, height: 12, borderRadius: '50%', border: '1.5px solid #cbd5e1', display: 'inline-block', flexShrink: 0 }} />
                        )}
                        <span>{c.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Confirm Password */}
              <div className="form-group">
                <label className="form-label">Xác nhận mật khẩu *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="form-input"
                    name="confirmPassword"
                    type={showConfirmPw ? 'text' : 'password'}
                    placeholder="Nhập lại mật khẩu..."
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError('');
                    }}
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                    tabIndex={-1}
                    aria-label={showConfirmPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    title={showConfirmPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    style={{
                      position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', color: 'var(--gray-400)', cursor: 'pointer',
                    }}
                  >
                    {showConfirmPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {confirmPassword && (
                  <span
                    style={{
                      fontSize: '0.73rem',
                      marginTop: 3,
                      display: 'block',
                      color: form.password === confirmPassword ? '#16a34a' : '#dc2626',
                      fontWeight: 600,
                    }}
                  >
                    {form.password === confirmPassword ? '✓ Mật khẩu xác nhận trùng khớp' : '✗ Mật khẩu xác nhận chưa khớp'}
                  </span>
                )}
              </div>

              <div className="profile-form-row">
                <div className="form-group">
                  <label className="form-label">Số điện thoại</label>
                  <input
                    className="form-input"
                    name="phone"
                    placeholder="0987654321"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Giới tính</label>
                  <select className="form-select" name="gender" value={form.gender} onChange={handleChange}>
                    <option value="">Chọn giới tính</option>
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Địa chỉ</label>
                <input
                  className="form-input"
                  name="address"
                  placeholder="123 Đường ABC, Quận XYZ"
                  value={form.address}
                  onChange={handleChange}
                />
              </div>

              {error && <div className="form-error" style={{ textAlign: 'center' }}>{error}</div>}

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={loading}
                style={{ width: '100%' }}
              >
                {loading ? (
                  <span className="spinner spinner-sm" style={{ borderTopColor: '#fff' }} />
                ) : (
                  <><UserPlus size={18} /> Đăng ký</>
                )}
              </button>

              <div style={{ textAlign: 'center', fontSize: '0.8125rem' }}>
                <button
                  type="button"
                  style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                  onClick={onSwitchToLogin}
                >
                  Đã có tài khoản? Đăng nhập
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
