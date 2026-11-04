import { useState } from 'react';
import {
  X, Mail, CheckCircle2, AlertCircle, Clock, Hash,
  Code, Eye, RotateCcw, Copy, Check
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function EmailDetailModal({ email, onClose, onResend }) {
  const toast = useToast();
  const [viewMode, setViewMode] = useState('preview'); // 'preview' | 'code'
  const [copied, setCopied] = useState(false);

  if (!email) return null;

  const isSuccess = email.status === 'SUCCESS';

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '---';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const handleCopyMessageId = () => {
    if (!email.messageId) return;
    navigator.clipboard.writeText(email.messageId);
    setCopied(true);
    toast.success('Đã sao chép Message ID');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 780,
          width: '95%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
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
                background: isSuccess ? '#dcfce7' : '#fee2e2',
                color: isSuccess ? '#15803d' : '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Mail size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--gray-900)' }}>
                  Chi tiết Email #{email.id}
                </h3>
                <span
                  className="badge"
                  style={{
                    background: isSuccess ? '#dcfce7' : '#fee2e2',
                    color: isSuccess ? '#15803d' : '#b91c1c',
                    border: `1px solid ${isSuccess ? '#bbf7d0' : '#fecaca'}`,
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    padding: '3px 8px',
                    borderRadius: 6,
                  }}
                >
                  {isSuccess ? 'Gửi thành công' : 'Gửi thất bại'}
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                Thời gian gửi: {formatDateTime(email.createdAt)}
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

        {/* Modal Body */}
        <div
          className="modal-body"
          style={{
            padding: '20px 24px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {/* Error Banner if FAILED */}
          {!isSuccess && email.errorMessage && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 10,
                padding: '12px 16px',
                color: '#dc2626',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong style={{ display: 'block', marginBottom: 2 }}>Lý do gửi thất bại:</strong>
                <span style={{ fontSize: '0.825rem', lineHeight: 1.5 }}>{email.errorMessage}</span>
              </div>
            </div>
          )}

          {/* Email Metadata Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 12,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: 16,
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Người nhận (Recipient)
              </div>
              <div style={{ fontSize: '0.925rem', fontWeight: 700, color: '#1e293b', marginTop: 4, wordBreak: 'break-all' }}>
                {email.recipient}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Brevo Message ID
              </div>
              <div style={{ fontSize: '0.825rem', fontWeight: 600, color: '#64748b', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6, wordBreak: 'break-all' }}>
                <span>{email.messageId || 'Không có (Thất bại)'}</span>
                {email.messageId && (
                  <button
                    onClick={handleCopyMessageId}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 2,
                      color: copied ? '#16a34a' : 'var(--gray-400)',
                    }}
                    title="Sao chép Message ID"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Subject Field */}
          <div>
            <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--gray-700)', display: 'block', marginBottom: 6 }}>
              Tiêu đề thư (Subject)
            </label>
            <div
              style={{
                padding: '10px 14px',
                background: '#fff',
                border: '1px solid var(--gray-200)',
                borderRadius: 10,
                fontSize: '0.925rem',
                fontWeight: 600,
                color: 'var(--gray-900)',
              }}
            >
              {email.subject}
            </div>
          </div>

          {/* Content Preview with Tabs */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--gray-700)' }}>
                Nội dung thư (Email Content)
              </label>

              <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 8, padding: 2 }}>
                <button
                  type="button"
                  onClick={() => setViewMode('preview')}
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    borderRadius: 6,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    background: viewMode === 'preview' ? '#fff' : 'transparent',
                    color: viewMode === 'preview' ? '#7c3aed' : '#64748b',
                    boxShadow: viewMode === 'preview' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  <Eye size={13} />
                  <span>Xem giao diện</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('code')}
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    borderRadius: 6,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    background: viewMode === 'code' ? '#fff' : 'transparent',
                    color: viewMode === 'code' ? '#7c3aed' : '#64748b',
                    boxShadow: viewMode === 'code' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  <Code size={13} />
                  <span>Mã nguồn HTML</span>
                </button>
              </div>
            </div>

            {viewMode === 'preview' ? (
              <div
                style={{
                  border: '1px solid var(--gray-200)',
                  borderRadius: 10,
                  overflow: 'hidden',
                  background: '#fff',
                }}
              >
                <iframe
                  title="email-preview"
                  srcDoc={email.content || '<p style="color:#94a3b8;font-style:italic">Không có nội dung hiển thị</p>'}
                  style={{
                    width: '100%',
                    minHeight: 280,
                    border: 'none',
                    display: 'block',
                  }}
                  sandbox="allow-same-origin"
                />
              </div>
            ) : (
              <pre
                style={{
                  background: '#0f172a',
                  color: '#e2e8f0',
                  padding: 14,
                  borderRadius: 10,
                  fontSize: '0.8rem',
                  lineHeight: 1.5,
                  maxHeight: 320,
                  overflow: 'auto',
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  margin: 0,
                }}
              >
                {email.content || '<!-- Không có nội dung -->'}
              </pre>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div
          className="modal-footer"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 24px',
            borderTop: '1px solid var(--gray-200)',
            background: '#fafafa',
          }}
        >
          {onResend && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                onClose();
                onResend(email);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                borderColor: '#7c3aed',
                color: '#7c3aed',
              }}
            >
              <RotateCcw size={15} />
              <span>Soạn / Gửi lại</span>
            </button>
          )}

          <button
            type="button"
            className="btn btn-primary"
            onClick={onClose}
            style={{ marginLeft: 'auto' }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

