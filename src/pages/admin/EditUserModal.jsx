import { useState, useEffect } from 'react';
import { X, Edit2, Shield, Stethoscope, HeartPulse, Save, Lock, Unlock, Key, Mail, Phone, MapPin, Award, Eye, EyeOff } from 'lucide-react';
import { userService } from '../../services/userService';
import { useToast } from '../../context/ToastContext';
import ImageUploader from '../../components/common/ImageUploader';

const roleLabels = { ADMIN: 'Quản trị viên', DOCTOR: 'Bác sĩ Nha khoa', PATIENT: 'Bệnh nhân', USER: 'Người dùng' };
const rankLabels = { PROFESSOR: 'Giáo sư / PGS', DOCTORATE: 'Tiến sĩ Y khoa', MASTER: 'Thạc sĩ / BSCK' };

export default function EditUserModal({ user, onClose, onUpdated }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState(user?.status || 'ACTIVE');
  const [form, setForm] = useState({
    username: user?.username || '',
    email: user?.email || '',
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    password: '',
    rank: user?.rank || 'MASTER',
    address: user?.address || '',
    gender: user?.gender || 'MALE',
    ava: user?.ava || '',
  });

  useEffect(() => {
    async function loadDetail() {
      try {
        const res = await userService.getUserById(user.id);
        const data = res.data.result;
        setStatus(data.status || 'ACTIVE');
        setForm({
          username: data.username || '',
          email: data.email || '',
          fullName: data.fullName || '',
          phone: data.phone || '',
          password: '',
          rank: data.rank || 'MASTER',
          address: data.address || '',
          gender: data.gender || 'MALE',
          ava: data.ava || '',
        });
      } catch (err) {
        console.error('Failed to fetch full user detail, using row data:', err);
      } finally {
        setFetching(false);
      }
    }
    if (user?.id) {
      loadDetail();
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarUploaded = (url) => {
    setForm((prev) => ({ ...prev, ava: url }));
    toast.success('Đã tải ảnh lên Supabase thành công! Nhấn "Lưu thay đổi" để áp dụng.');
  };

  const handleToggleLock = async () => {
    try {
      if (status === 'LOCKED') {
        await userService.unlockUser(user.id);
        setStatus('ACTIVE');
        toast.success('Đã mở khóa tài khoản thành công');
      } else {
        if (!window.confirm('Bạn có chắc muốn khóa tài khoản này? Người dùng sẽ không thể đăng nhập.')) return;
        await userService.lockUser(user.id);
        setStatus('LOCKED');
        toast.success('Đã khóa tài khoản thành công');
      }
      onUpdated?.(false); // Notify update without closing modal immediately
    } catch (err) {
      toast.error(err.response?.data?.message || 'Thao tác trạng thái thất bại');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.email.trim()) {
      toast.error('Vui lòng điền Họ tên và Email (*)');
      return;
    }

    // Validate password only if admin entered something
    if (form.password) {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,128}$/;
      if (!passwordRegex.test(form.password)) {
        toast.error('Mật khẩu mới phải từ 8 ký tự, gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt');
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        email: form.email.trim(),
        full_name: form.fullName.trim(),
        fullName: form.fullName.trim(),
        phone: form.phone.trim() || undefined,
      };

      if (form.password) {
        payload.password = form.password;
      }

      if (user.role === 'DOCTOR') {
        payload.rank = form.rank;
        payload.ava = form.ava || undefined;
      } else if (user.role === 'PATIENT') {
        payload.address = form.address.trim() || undefined;
        payload.gender = form.gender;
      }

      await userService.updateUser(user.id, payload);
      toast.success('Cập nhật thông tin người dùng thành công!');
      onUpdated?.(true); // Close modal and refresh list
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = () => {
    switch (user?.role) {
      case 'DOCTOR':
        return <Stethoscope size={16} />;
      case 'ADMIN':
        return <Shield size={16} />;
      default:
        return <HeartPulse size={16} />;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              className="avatar-placeholder"
              style={{
                width: 40,
                height: 40,
                background: 'var(--primary-subtle)',
                color: 'var(--primary-600)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <Edit2 size={18} />
            </div>
            <div>
              <h2 className="modal-title" style={{ fontSize: '1.15rem', margin: 0 }}>
                Chỉnh sửa tài khoản #{user.id}
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.8125rem', color: 'var(--gray-500)' }}>
                Tài khoản: <strong>{user.username}</strong>
              </p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Đóng">
            <X size={18} />
          </button>
        </div>

        {fetching ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto' }} />
            <p style={{ marginTop: 12, fontSize: '0.875rem', color: 'var(--gray-500)' }}>
              Đang tải dữ liệu chi tiết...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="modal-body" style={{ maxHeight: 'calc(85vh - 140px)', overflowY: 'auto' }}>
              {/* Account Meta Bar */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  background: '#f8fafc',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #e2e8f0',
                  marginBottom: 18,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    className={`badge badge-${user.role?.toLowerCase()}`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    {getRoleIcon()}
                    <span>{roleLabels[user.role] || user.role}</span>
                  </span>
                  <span className={`badge badge-${status.toLowerCase()}`}>
                    {status === 'ACTIVE' ? 'Hoạt động' : status === 'LOCKED' ? 'Đã khóa' : status}
                  </span>
                </div>

                {user.role !== 'ADMIN' && (
                  <button
                    type="button"
                    onClick={handleToggleLock}
                    className="btn btn-sm btn-ghost"
                    style={{
                      fontSize: '0.8125rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      color: status === 'LOCKED' ? '#059669' : '#d97706',
                    }}
                  >
                    {status === 'LOCKED' ? <Unlock size={14} /> : <Lock size={14} />}
                    <span>{status === 'LOCKED' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}</span>
                  </button>
                )}
              </div>

              {/* Basic Fields */}
              <div className="form-group">
                <label className="form-label">Họ và tên *</label>
                <input
                  type="text"
                  name="fullName"
                  className="form-input"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Nhập họ và tên đầy đủ..."
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Địa chỉ Email *</label>
                  <input
                    type="email"
                    name="email"
                    className="form-input"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="email@nhakhoa.vn"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Số điện thoại</label>
                  <input
                    type="tel"
                    name="phone"
                    className="form-input"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="0912345678"
                  />
                </div>
              </div>

              {/* New Password (Optional) */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Key size={14} color="var(--primary-600)" />
                  <span>Đổi mật khẩu mới (Tùy chọn)</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    className="form-input"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Để trống nếu không muốn đổi mật khẩu"
                    autoComplete="new-password"
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
                <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: 4, display: 'block' }}>
                  Nếu nhập: Tối thiểu 8 ký tự, có chữ hoa, thường, số và ký tự đặc biệt
                </span>
              </div>

              {/* Doctor Specific Fields */}
              {user.role === 'DOCTOR' && (
                <div style={{ background: '#eff6ff', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid #dbeafe', marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1e40af', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Award size={16} />
                    <span>Thông tin Bác sĩ Chuyên khoa</span>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Cấp bậc / Học hàm - Học vị</label>
                    <select
                      name="rank"
                      className="form-select"
                      value={form.rank}
                      onChange={handleChange}
                    >
                      <option value="MASTER">Thạc sĩ / Bác sĩ Chuyên khoa (MASTER)</option>
                      <option value="DOCTORATE">Tiến sĩ Y khoa (DOCTORATE)</option>
                      <option value="PROFESSOR">Giáo sư / Phó Giáo sư (PROFESSOR)</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Ảnh đại diện Bác sĩ</label>
                    <ImageUploader
                      currentImage={form.ava}
                      onUpload={handleAvatarUploaded}
                      folder="avatars"
                      size="md"
                    />
                  </div>
                </div>
              )}

              {/* Patient Specific Fields */}
              {user.role === 'PATIENT' && (
                <div style={{ background: '#f0fdfa', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid #ccfbf1', marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f766e', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <HeartPulse size={16} />
                    <span>Hồ sơ Bệnh nhân</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 14 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Giới tính</label>
                      <select
                        name="gender"
                        className="form-select"
                        value={form.gender}
                        onChange={handleChange}
                      >
                        <option value="MALE">Nam</option>
                        <option value="FEMALE">Nữ</option>
                        <option value="OTHER">Khác</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Địa chỉ</label>
                      <input
                        type="text"
                        name="address"
                        className="form-input"
                        value={form.address}
                        onChange={handleChange}
                        placeholder="Số nhà, đường, quận/huyện, tỉnh thành..."
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="modal-footer" style={{ borderTop: '1px solid var(--gray-200)', padding: '16px 20px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>
                Hủy bỏ
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Save size={16} />
                <span>{loading ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

