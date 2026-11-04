import { useState } from 'react';
import { X, Send } from 'lucide-react';
import { authService } from '../../services/authService';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils/errorMessage';

export default function ForgotPasswordModal({ onClose, onSwitchToLogin }) {
  const toast = useToast();
  const [form, setForm] = useState({ username: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.email) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và email');
      return;
    }
    setLoading(true);
    try {
      await authService.forgotPassword(form);
      toast.success('Mật khẩu mới đã được gửi tới email của bạn!');
      onSwitchToLogin?.();
    } catch (err) {
      const msg = getErrorMessage(err, 'Không thể khôi phục mật khẩu. Vui lòng kiểm tra lại thông tin.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <h2>Quên mật khẩu</h2>
          <button className="btn btn-icon btn-ghost" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem', marginBottom: 20 }}>
            Nhập tên đăng nhập và email đã đăng ký. Mật khẩu mới sẽ được gửi qua email.
          </p>
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
                <label className="form-label">Email</label>
                <input
                  className="form-input"
                  name="email"
                  type="email"
                  placeholder="email@example.com"
                  value={form.email}
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
                  <><Send size={16} /> Gửi mật khẩu mới</>
                )}
              </button>

              <div style={{ textAlign: 'center', fontSize: '0.8125rem' }}>
                <button
                  type="button"
                  style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                  onClick={onSwitchToLogin}
                >
                  Quay lại đăng nhập
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
