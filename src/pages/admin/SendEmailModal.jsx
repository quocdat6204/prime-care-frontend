import { useState, useEffect } from 'react';
import { X, Send, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import { emailService } from '../../services/emailService';
import { useToast } from '../../context/ToastContext';

export default function SendEmailModal({ initialData, onClose, onSent }) {
  const toast = useToast();
  const [form, setForm] = useState({
    to: '',
    subject: '',
    htmlContent: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialData) {
      setForm({
        to: initialData.recipient || initialData.to || '',
        subject: initialData.subject ? `[Gửi lại] ${initialData.subject}` : '',
        htmlContent: initialData.content || initialData.htmlContent || '',
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleApplyTemplate = (type) => {
    if (type === 'appointment') {
      setForm((prev) => ({
        ...prev,
        subject: 'Thông báo lịch hẹn khám nha khoa - Primecare',
        htmlContent: `<h3>Kính gửi Quý khách,</h3>
<p>Phòng khám nha khoa Primecare xin thông báo lịch hẹn khám của Quý khách đã được xác nhận thành công.</p>
<ul>
  <li><strong>Ngày khám:</strong> Ngày mai</li>
  <li><strong>Địa chỉ:</strong> Phòng khám Nha khoa Primecare</li>
</ul>
<p>Vui lòng có mặt trước giờ hẹn 10 phút để được phục vụ chu đáo nhất.</p>
<p>Trân trọng,<br/><strong>Đội ngũ Y bác sĩ Primecare</strong></p>`,
      }));
    } else if (type === 'notice') {
      setForm((prev) => ({
        ...prev,
        subject: 'Thông báo quan trọng từ Trung tâm Quản trị Primecare',
        htmlContent: `<h3>Xin chào Quý khách,</h3>
<p>Hệ thống phòng khám Primecare xin gửi thông báo cập nhật về dịch vụ...</p>
<p>Nếu Quý khách có bất kỳ thắc mắc nào, vui lòng liên hệ tổng đài <strong>1900 6868</strong> để được hỗ trợ 24/7.</p>
<p>Trân trọng cảm ơn!</p>`,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.to.trim()) {
      setError('Vui lòng nhập địa chỉ email người nhận');
      return;
    }
    if (!form.subject.trim()) {
      setError('Vui lòng nhập tiêu đề email');
      return;
    }
    if (!form.htmlContent.trim()) {
      setError('Vui lòng nhập nội dung thư');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await emailService.sendEmail({
        to: form.to.trim(),
        subject: form.subject.trim(),
        htmlContent: form.htmlContent.trim(),
      });
      toast.success(`Đã gửi email thành công đến ${form.to.trim()}!`);
      if (onSent) onSent();
    } catch (err) {
      const serverMsg = err.response?.data?.message;
      setError(serverMsg || 'Không thể gửi email qua Brevo. Vui lòng kiểm tra lại địa chỉ email hoặc cấu hình API Key.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 680,
          width: '95%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          className="modal-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 24px',
            borderBottom: '1px solid var(--gray-200)',
            background: '#faf5ff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #7c3aed, #9333ea)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Send size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--gray-900)' }}>
                {initialData ? 'Soạn lại / Gửi lại Email' : 'Soạn & Gửi Email mới'}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                Gửi trực tiếp qua dịch vụ Brevo SMTP API
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-icon"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--gray-500)',
              padding: 4,
              borderRadius: 8,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div
          className="modal-body"
          style={{
            padding: '20px 24px',
            overflowY: 'auto',
          }}
        >
          {error && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 10,
                padding: '10px 14px',
                color: '#dc2626',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 16,
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Quick template buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)', fontWeight: 600 }}>Mẫu nhanh:</span>
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={() => handleApplyTemplate('appointment')}
              style={{ fontSize: '0.75rem', padding: '4px 10px', height: 28 }}
            >
              <FileText size={12} style={{ marginRight: 4 }} />
              Nhắc lịch hẹn
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={() => handleApplyTemplate('notice')}
              style={{ fontSize: '0.75rem', padding: '4px 10px', height: 28 }}
            >
              <FileText size={12} style={{ marginRight: 4 }} />
              Thông báo chung
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Recipient */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 600 }}>
                Email người nhận (To) *
              </label>
              <input
                type="email"
                className="form-input"
                name="to"
                value={form.to}
                onChange={handleChange}
                placeholder="Ví dụ: benhnhan@gmail.com"
                required
              />
            </div>

            {/* Subject */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 600 }}>
                Tiêu đề email (Subject) *
              </label>
              <input
                type="text"
                className="form-input"
                name="subject"
                value={form.subject}
                onChange={handleChange}
                placeholder="Ví dụ: Xác nhận lịch khám hoặc thông báo quan trọng"
                required
              />
            </div>

            {/* Content (HTML) */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <label className="form-label" style={{ fontWeight: 600, margin: 0 }}>
                  Nội dung thư (Hỗ trợ HTML) *
                </label>
                <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>
                  Hỗ trợ các thẻ: &lt;p&gt;, &lt;strong&gt;, &lt;h3&gt;, &lt;ul&gt;...
                </span>
              </div>
              <textarea
                className="form-input"
                name="htmlContent"
                value={form.htmlContent}
                onChange={handleChange}
                rows={9}
                placeholder="Nhập nội dung thư hoặc mã HTML..."
                style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '0.85rem' }}
                required
              />
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={onClose}
                disabled={submitting}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
                style={{
                  minWidth: 120,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                {submitting ? (
                  <>
                    <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                    <span>Đang gửi...</span>
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    <span>Gửi thư ngay</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

