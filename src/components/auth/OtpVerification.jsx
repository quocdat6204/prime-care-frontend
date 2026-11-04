import { useState, useRef, useEffect } from 'react';
import { X, ShieldCheck, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils/errorMessage';

export default function OtpVerification({ username, onClose, onVerified }) {
  const { verifyOtp, generateOtp } = useAuth();
  const toast = useToast();
  const [userVal, setUserVal] = useState(username || '');
  // OTP là 4 số theo chuẩn backend user-service
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef([]);

  useEffect(() => {
    if (username) {
      setUserVal(username);
    }
    inputRefs.current[0]?.focus();
  }, [username]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError('');
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    const newOtp = [...otp];
    for (let i = 0; i < 4; i++) {
      newOtp[i] = pasted[i] || '';
    }
    setOtp(newOtp);
    const nextEmpty = newOtp.findIndex((d) => !d);
    inputRefs.current[nextEmpty === -1 ? 3 : nextEmpty]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const targetUser = userVal.trim();
    if (!targetUser) {
      setError('Vui lòng nhập tên đăng nhập');
      return;
    }
    const code = otp.join('');
    if (code.length !== 4) {
      setError('Vui lòng nhập đủ 4 chữ số OTP');
      return;
    }
    setLoading(true);
    try {
      await verifyOtp({ username: targetUser, otp: code });
      toast.success('Kích hoạt tài khoản thành công! Bạn có thể đăng nhập ngay.');
      onVerified?.();
    } catch (err) {
      const msg = getErrorMessage(err, 'Mã OTP không hợp lệ hoặc đã hết hạn');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    const targetUser = userVal.trim();
    if (!targetUser) {
      setError('Vui lòng nhập tên đăng nhập để gửi lại OTP');
      return;
    }
    setResending(true);
    try {
      await generateOtp({ username: targetUser });
      toast.info('Mã OTP 4 số mới đã được gửi tới email của bạn');
      setOtp(['', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      const msg = getErrorMessage(err, 'Gửi lại OTP thất bại');
      toast.error(msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <h2>Kích hoạt tài khoản</h2>
          <button className="btn btn-icon btn-ghost" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body" style={{ textAlign: 'center' }}>
          <div style={{
            width: 64, height: 64, margin: '0 auto 16px',
            borderRadius: '50%', background: '#ccfbf1',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ShieldCheck size={32} color="#0d9488" />
          </div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f766e', marginBottom: 6 }}>
            Xác thực mã OTP (4 chữ số)
          </h3>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem', marginBottom: 20 }}>
            Mã OTP gồm <strong>4 chữ số</strong> đã được gửi tới email của tài khoản <strong>{userVal || 'bạn'}</strong>.
          </p>

          <form onSubmit={handleSubmit}>
            {!username && (
              <div className="form-group" style={{ marginBottom: 16, textAlign: 'left' }}>
                <label className="form-label">Tên đăng nhập</label>
                <input
                  className="form-input"
                  placeholder="Nhập tên đăng nhập cần kích hoạt"
                  value={userVal}
                  onChange={(e) => {
                    setUserVal(e.target.value);
                    setError('');
                  }}
                  autoFocus
                />
              </div>
            )}

            {username && (
              <div style={{
                background: '#f0fdfa',
                border: '1px solid #ccfbf1',
                borderRadius: 10,
                padding: '8px 14px',
                fontSize: '0.85rem',
                color: '#0f766e',
                marginBottom: 20,
                display: 'inline-block'
              }}>
                Tài khoản kích hoạt: <strong>{username}</strong>
              </div>
            )}

            {/* 4 Ô INPUT CHO MÃ OTP 4 SỐ */}
            <div style={{
              display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 20,
            }}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (inputRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onPaste={i === 0 ? handlePaste : undefined}
                  style={{
                    width: 58, height: 66, textAlign: 'center',
                    fontSize: '1.75rem', fontWeight: 800,
                    color: '#0f766e',
                    border: '2px solid #ccfbf1',
                    borderRadius: 14,
                    background: '#f8fafc',
                    transition: 'all 0.15s ease',
                    outline: 'none',
                    boxShadow: digit ? '0 2px 8px rgba(13, 148, 136, 0.15)' : 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0d9488';
                    e.target.style.background = '#ffffff';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#ccfbf1';
                    e.target.style.background = '#f8fafc';
                  }}
                />
              ))}
            </div>

            {error && <div className="form-error" style={{ marginBottom: 14 }}>{error}</div>}

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{
                width: '100%',
                marginBottom: 12,
                background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
                borderRadius: 12,
                fontWeight: 700
              }}
            >
              {loading ? (
                <span className="spinner spinner-sm" style={{ borderTopColor: '#fff' }} />
              ) : (
                'Xác nhận kích hoạt'
              )}
            </button>

            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={resending}
              onClick={handleResend}
              style={{
                color: '#0d9488',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: '0.8125rem',
                fontWeight: 600
              }}
            >
              <RefreshCw size={14} className={resending ? 'spin-slow' : ''} />
              <span>{resending ? 'Đang gửi lại...' : 'Chưa nhận được mã? Gửi lại OTP'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
