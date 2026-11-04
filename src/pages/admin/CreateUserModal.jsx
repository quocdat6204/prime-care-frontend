import { useState } from 'react';
import { X, UserPlus, Sparkles, Award, Eye, EyeOff, Check, ShieldCheck } from 'lucide-react';
import { userService } from '../../services/userService';
import { useToast } from '../../context/ToastContext';
import ImageUploader from '../../components/common/ImageUploader';

export default function CreateUserModal({ onClose, onCreated }) {
  const toast = useToast();
  const [role, setRole] = useState('DOCTOR');
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    phone: '',
    rank: 'MASTER',
    address: '',
    gender: 'MALE',
    ava: '',
  });
  const [loading, setLoading] = useState(false);

  const passwordCriteria = [
    { label: 'Tối thiểu 8 ký tự (tối đa 128)', valid: form.password.length >= 8 && form.password.length <= 128 },
    { label: 'Ít nhất 1 chữ in hoa (A-Z)', valid: /[A-Z]/.test(form.password) },
    { label: 'Ít nhất 1 chữ in thường (a-z)', valid: /[a-z]/.test(form.password) },
    { label: 'Ít nhất 1 chữ số (0-9)', valid: /\d/.test(form.password) },
    { label: 'Ít nhất 1 ký tự đặc biệt (!@#$%^&*...)', valid: /[^a-zA-Z0-9]/.test(form.password) },
  ];
  const isPasswordValid = passwordCriteria.every((c) => c.valid);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarUploaded = (url) => {
    setForm((prev) => ({ ...prev, ava: url }));
    toast.success('Đã tải ảnh lên Supabase thành công!');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.email || !form.password || !form.fullName) {
      toast.error('Vui lòng điền các thông tin bắt buộc (*)');
      return;
    }
    if (!isPasswordValid) {
      toast.error('Mật khẩu chưa đáp ứng đầy đủ các tiêu chuẩn bảo mật hệ thống');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        fullName: form.fullName.trim(),
        phone: form.phone.trim() || undefined,
        role: role,
      };

      if (role === 'DOCTOR') {
        payload.rank = form.rank;
        if (form.ava) payload.ava = form.ava;
      } else if (role === 'PATIENT') {
        if (form.address) payload.address = form.address.trim();
        if (form.gender) payload.gender = form.gender;
      }

      await userService.createUser(payload);
      toast.success(`Đã tạo tài khoản ${role === 'DOCTOR' ? 'Bác sĩ' : role === 'PATIENT' ? 'Bệnh nhân' : 'Admin'} thành công!`);
      onCreated();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Tạo người dùng thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="avatar-placeholder" style={{ width: 36, height: 36, background: 'var(--primary-subtle)', color: 'var(--primary-600)' }}>
              <UserPlus size={18} />
            </div>
            <div>
              <h2 className="modal-title">Tạo người dùng mới</h2>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--gray-500)' }}>
                Khởi tạo tài khoản Bác sĩ, Bệnh nhân hoặc Quản trị viên
              </p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Đóng">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ maxHeight: 'calc(80vh - 120px)', overflowY: 'auto' }}>
            {/* Role Switcher */}
            <div className="form-group">
              <label className="form-label">Vai trò (Role) *</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[
                  { value: 'DOCTOR', label: 'Bác sĩ Nha khoa' },
                  { value: 'PATIENT', label: 'Bệnh nhân' },
                  { value: 'ADMIN', label: 'Quản trị viên' },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className={`btn ${role === item.value ? 'btn-primary' : 'btn-outline'}`}
                    style={{ fontSize: '0.8125rem', padding: '8px 10px' }}
                    onClick={() => setRole(item.value)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* If Doctor: Avatar & Rank */}
            {role === 'DOCTOR' && (
              <div style={{ padding: '14px', background: 'var(--primary-subtle)', borderRadius: 'var(--radius)', marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <ImageUploader
                    currentImage={form.ava}
                    onUpload={handleAvatarUploaded}
                    folder="avatars"
                    size="lg"
                  />
                  <div style={{ flex: 1 }}>
                    <label className="form-label">
                      <Award size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                      Học hàm / Học vị bác sĩ *
                    </label>
                    <select
                      className="form-select"
                      name="rank"
                      value={form.rank}
                      onChange={handleChange}
                    >
                      <option value="MASTER">Thạc sĩ / Bác sĩ CKI (MASTER)</option>
                      <option value="DOCTORATE">Tiến sĩ Y khoa (DOCTORATE)</option>
                      <option value="PROFESSOR">Giáo sư / PGS (PROFESSOR)</option>
                    </select>
                    <span style={{ fontSize: '0.75rem', color: 'var(--primary-700)', marginTop: 4, display: 'block' }}>
                      Ảnh đại diện tải lên trực tiếp lưu trữ Supabase Storage
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Common fields */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Tên đăng nhập *</label>
                <input
                  type="text"
                  name="username"
                  className="form-input"
                  required
                  placeholder="vd: dr_minh hoặc nguyenan"
                  value={form.username}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Mật khẩu *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    className="form-input"
                    required
                    placeholder="Tối thiểu 8 ký tự, có hoa, thường, số, ký tự đặc biệt"
                    value={form.password}
                    onChange={handleChange}
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
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
                      justifyContent: 'center',
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Password checklist for Admin creating new user */}
            {form.password && (
              <div
                style={{
                  padding: '10px 12px',
                  background: isPasswordValid ? '#f0fdf4' : '#f8fafc',
                  border: `1px solid ${isPasswordValid ? '#bbf7d0' : '#e2e8f0'}`,
                  borderRadius: 8,
                  marginBottom: 16,
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: isPasswordValid ? '#15803d' : 'var(--gray-700)', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <ShieldCheck size={13} />
                  <span>Yêu cầu mật khẩu hệ thống:</span>
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

            <div className="form-group">
              <label className="form-label">Họ và tên đầy đủ *</label>
              <input
                type="text"
                name="fullName"
                className="form-input"
                required
                placeholder={role === 'DOCTOR' ? 'vd: Bác sĩ Trần Văn Minh' : 'vd: Nguyễn Thị Ánh'}
                value={form.fullName}
                onChange={handleChange}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Địa chỉ Email *</label>
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  required
                  placeholder="email@example.com"
                  value={form.email}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Số điện thoại</label>
                <input
                  type="tel"
                  name="phone"
                  className="form-input"
                  placeholder="0912345678"
                  value={form.phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Patient-specific fields */}
            {role === 'PATIENT' && (
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Giới tính</label>
                  <select
                    className="form-select"
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                  >
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Địa chỉ liên hệ</label>
                  <input
                    type="text"
                    name="address"
                    className="form-input"
                    placeholder="Quận/Huyện, Tỉnh/TP"
                    value={form.address}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <div className="spinner" style={{ width: 14, height: 14 }} /> Đang tạo...
                </>
              ) : (
                'Tạo tài khoản'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
