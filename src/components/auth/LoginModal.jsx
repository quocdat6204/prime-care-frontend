import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, LogIn, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils/errorMessage';

export default function LoginModal({ onClose, onSwitchToRegister, onForgotPassword, onNeedOtp }) {
  const { login, generateOtp } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [error, setError] = useState('');
  const [isInactive, setIsInactive] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
    setIsInactive(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      setError('Vui lòng nhập tên đăng nhập và mật khẩu');
      return;
    }
    setLoading(true);
    setIsInactive(false);
    try {
      const data = await login(form);
      const userRole = data?.result?.role || localStorage.getItem('role');
      toast.success('Đăng nhập thành công!');
      onClose();

      // Immediately navigate to the corresponding role dashboard
      switch (userRole) {
        case 'ADMIN':
          navigate('/admin');
          break;
        case 'DOCTOR':
          navigate('/doctor');
          break;
        case 'PATIENT':
        default:
          navigate('/patient');
          break;
      }
    } catch (err) {
      const rawMsg = err?.response?.data?.message || err?.message || '';
      const inactiveDetected = /inactive/i.test(rawMsg);
      if (inactiveDetected) {
        setIsInactive(true);
        setError('Tài khoản của bạn chưa được kích hoạt qua mã xác thực OTP.');
      } else {
        const msg = getErrorMessage(err, 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // YÊU CẦU: Khi đăng nhập thấy tài khoản chưa kích hoạt thì mới bấm nhận mã OTP (4 số)
  const handleRequestOtpAndActivate = async () => {
    const uname = form.username.trim();
    if (!uname) {
      setError('Vui lòng nhập tên đăng nhập để nhận mã kích hoạt');
      return;
    }
    setRequestingOtp(true);
    try {
      await generateOtp({ username: uname });
      toast.info(`Mã OTP 4 số đã được gửi tới email của tài khoản "${uname}".`);
      onClose();
      onNeedOtp?.(uname);
    } catch (err) {
      const msg = getErrorMessage(err, 'Không thể gửi mã OTP. Vui lòng thử lại sau.');
      toast.error(msg);
    } finally {
      setRequestingOtp(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Đăng nhập</h2>
          <button className="btn btn-icon btn-ghost" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Tên đăng nhập</label>
                <input
                  className="form-input"
                  name="username"
                  placeholder="Nhập tên đăng nhập"
                  value={form.username}
                  onChange={handleChange}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">Mật khẩu</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="form-input"
                    name="password"
                    type={showPw ? 'text' : 'password'}
                    placeholder="Nhập mật khẩu"
                    value={form.password}
                    onChange={handleChange}
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    style={{
                      position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', color: 'var(--gray-400)', cursor: 'pointer',
                    }}
                  >
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Chỉ khi đăng nhập báo chưa kích hoạt thì mới xuất hiện phần nhận mã OTP */}
              {isInactive ? (
                <div style={{
                  background: '#fffbeb',
                  border: '1.5px solid #fde68a',
                  borderRadius: 14,
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  alignItems: 'center',
                  textAlign: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#b45309', fontWeight: 700, fontSize: '0.92rem' }}>
                    <AlertCircle size={20} />
                    <span>Tài khoản chưa được kích hoạt</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.83rem', color: '#92400e', lineHeight: 1.5 }}>
                    Tài khoản của bạn chưa kích hoạt. Bấm nút bên dưới để nhận mã OTP 4 số gửi về email và tiến hành kích hoạt.
                  </p>
                  <button
                    type="button"
                    className="btn btn-warning"
                    disabled={requestingOtp}
                    style={{
                      width: '100%',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      padding: '10px 16px',
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      borderColor: '#d97706',
                      color: '#ffffff',
                      borderRadius: 10,
                      boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)'
                    }}
                    onClick={handleRequestOtpAndActivate}
                  >
                    {requestingOtp ? (
                      <>
                        <span className="spinner spinner-sm" style={{ borderTopColor: '#fff' }} />
                        <span>Đang gửi mã OTP...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={18} />
                        <span>Nhận mã OTP kích hoạt</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                error && <div className="form-error" style={{ textAlign: 'center' }}>{error}</div>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={loading}
                style={{ width: '100%' }}
              >
                {loading ? (
                  <span className="spinner spinner-sm" style={{ borderTopColor: '#fff' }} />
                ) : (
                  <><LogIn size={18} /> Đăng nhập</>
                )}
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                <button
                  type="button"
                  style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                  onClick={onForgotPassword}
                >
                  Quên mật khẩu?
                </button>
                <button
                  type="button"
                  style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                  onClick={onSwitchToRegister}
                >
                  Chưa có tài khoản? Đăng ký
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
