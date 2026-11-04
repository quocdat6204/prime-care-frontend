import { useState, useEffect, useCallback } from 'react';
import {
  X, CreditCard, CheckCircle2, XCircle, Clock, AlertCircle,
  Copy, RefreshCw, Calendar, ArrowRight, ShieldCheck, DollarSign
} from 'lucide-react';
import { paymentService } from '../../services/paymentService';
import { userService } from '../../services/userService';
import { useToast } from '../../context/ToastContext';

// Bảng mã phản hồi VNPay sang tiếng Việt
const vnpayResponseCodeLabels = {
  '00': 'Giao dịch thành công',
  '07': 'Trừ tiền thành công, nghi ngờ gian lận',
  '09': 'Thẻ/Tài khoản chưa đăng ký Internet Banking',
  '10': 'Xác thực thông tin thẻ/tài khoản sai quá 3 lần',
  '11': 'Đã hết hạn chờ thanh toán (Quá thời gian)',
  '12': 'Thẻ/Tài khoản bị khóa',
  '13': 'Nhập sai mật khẩu xác thực OTP',
  '24': 'Khách hàng hủy giao dịch trên VNPay',
  '51': 'Tài khoản không đủ số dư để thanh toán',
  '65': 'Tài khoản đã vượt quá hạn mức giao dịch trong ngày',
  '75': 'Ngân hàng thanh toán đang bảo trì',
  '79': 'Nhập sai mật khẩu thanh toán quá số lần quy định',
  '97': 'Chữ ký điện tử không hợp lệ (Sai checksum)',
};

const formatVND = (amount) => {
  if (amount == null) return '0 đ';
  return Number(amount).toLocaleString('vi-VN') + ' đ';
};

const formatDateTime = (isoString) => {
  if (!isoString) return '—';
  try {
    return new Date(isoString).toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
};

const formatPayDate = (payDate) => {
  if (!payDate) return '—';
  if (payDate.length === 14) {
    const year = payDate.substring(0, 4);
    const month = payDate.substring(4, 6);
    const day = payDate.substring(6, 8);
    const hour = payDate.substring(8, 10);
    const min = payDate.substring(10, 12);
    const sec = payDate.substring(12, 14);
    return `${hour}:${min}:${sec} ${day}/${month}/${year}`;
  }
  return formatDateTime(payDate);
};

export default function InvoiceTransactionsModal({ invoice, onClose, patientName: propPatientName, zIndex = 1400 }) {
  const toast = useToast();
  const [transactions, setTransactions] = useState([]);
  const [resolvedPatientName, setResolvedPatientName] = useState(propPatientName || '');
  const [loading, setLoading] = useState(false);
  const [copiedTxn, setCopiedTxn] = useState('');

  useEffect(() => {
    if (propPatientName) {
      setResolvedPatientName(propPatientName);
    } else if (invoice?.patientId) {
      userService
        .getUserById(invoice.patientId)
        .then((res) => {
          const u = res.data?.result || res.data;
          if (u?.fullName) setResolvedPatientName(u.fullName);
        })
        .catch(() => {});
    }
  }, [propPatientName, invoice?.patientId]);

  const fetchTransactions = useCallback(async () => {
    if (!invoice?.id) return;
    setLoading(true);
    try {
      const res = await paymentService.getTransactionsByInvoice(invoice.id);
      setTransactions(res.data?.result || []);
    } catch (err) {
      console.error('Failed to load invoice transactions:', err);
      toast.error('Không thể tải lịch sử giao dịch của hóa đơn');
    } finally {
      setLoading(false);
    }
  }, [invoice?.id, toast]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedTxn(text);
    toast.success('Đã sao chép mã giao dịch!');
    setTimeout(() => setCopiedTxn(''), 2000);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PAID':
        return { label: 'Đã thanh toán', bg: '#dcfce7', color: '#15803d', icon: <CheckCircle2 size={13} /> };
      case 'PENDING':
        return { label: 'Chờ thanh toán', bg: '#fef3c7', color: '#b45309', icon: <Clock size={13} /> };
      case 'CANCELLED':
        return { label: 'Đã hủy', bg: '#fee2e2', color: '#b91c1c', icon: <XCircle size={13} /> };
      default:
        return { label: status || '—', bg: '#f1f5f9', color: '#475569', icon: null };
    }
  };

  const getTxnStatusBadge = (status) => {
    switch (status) {
      case 'SUCCESS':
        return { label: 'Thành công', bg: '#dcfce7', color: '#15803d', icon: <CheckCircle2 size={14} /> };
      case 'FAILED':
        return { label: 'Thất bại', bg: '#fee2e2', color: '#b91c1c', icon: <XCircle size={14} /> };
      case 'PENDING':
        return { label: 'Đang xử lý', bg: '#fef3c7', color: '#b45309', icon: <Clock size={14} /> };
      default:
        return { label: status || '—', bg: '#f1f5f9', color: '#475569', icon: null };
    }
  };

  if (!invoice) return null;

  const invBadge = getStatusBadge(invoice.status);

  return (
    <div className="modal-overlay" style={{ zIndex }} onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: 760, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header" style={{ padding: '18px 24px', borderBottom: '1px solid var(--gray-100)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: '#ede9fe',
                color: '#6d28d9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <CreditCard size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--gray-900)' }}>
                  Chi tiết Hóa đơn #{invoice.id}
                </h2>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '3px 8px',
                    borderRadius: 6,
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background: invBadge.bg,
                    color: invBadge.color,
                  }}
                >
                  {invBadge.icon}
                  {invBadge.label}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--gray-500)', marginTop: 2 }}>
                Nhật ký các lần thực hiện giao dịch thanh toán qua cổng VNPay
              </p>
            </div>
          </div>
          <button className="btn btn-icon btn-ghost" onClick={onClose} title="Đóng">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {/* Card Thông tin tóm tắt Hóa đơn */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: '16px 20px',
              marginBottom: 20,
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 16,
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Khoản thanh toán
                </span>
                <div style={{ fontWeight: 700, color: 'var(--gray-800)', marginTop: 4 }}>
                  {invoice.type === 'EXAMINATION' ? (
                    <span style={{ color: '#6d28d9' }}>🩺 Tiền công khám</span>
                  ) : (
                    <span style={{ color: '#0284c7' }}>🦷 Dịch vụ nha khoa</span>
                  )}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Số tiền hóa đơn
                </span>
                <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#059669', marginTop: 2 }}>
                  {formatVND(invoice.amount)}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Lịch hẹn & Bệnh nhân
                </span>
                <div style={{ fontWeight: 600, color: 'var(--gray-800)', marginTop: 4 }}>
                  Hẹn: #{invoice.appointmentId} | BN:{' '}
                  {resolvedPatientName ? (
                    <strong style={{ color: 'var(--gray-900)' }}>
                      {resolvedPatientName}{' '}
                      <span style={{ color: 'var(--gray-500)', fontWeight: 500, fontSize: '0.75rem' }}>
                        (#{invoice.patientId})
                      </span>
                    </strong>
                  ) : (
                    `#${invoice.patientId}`
                  )}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Thời gian tạo
                </span>
                <div style={{ fontSize: '0.8125rem', color: 'var(--gray-700)', marginTop: 4 }}>
                  {formatDateTime(invoice.createdAt)}
                </div>
              </div>

              {invoice.paidAt && (
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Thời gian thanh toán
                  </span>
                  <div style={{ fontSize: '0.8125rem', color: '#15803d', fontWeight: 600, marginTop: 4 }}>
                    {formatDateTime(invoice.paidAt)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tiêu đề danh sách giao dịch */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={{ margin: 0, fontSize: '0.975rem', fontWeight: 700, color: 'var(--gray-800)' }}>
                Lịch sử các lần giao dịch ({transactions.length})
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                (1 hóa đơn có thể có nhiều lần thử thanh toán)
              </span>
            </div>
            <button
              className="btn btn-outline btn-sm"
              onClick={fetchTransactions}
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.785rem' }}
            >
              <RefreshCw size={13} className={loading ? 'spinner' : ''} />
              <span>Làm mới</span>
            </button>
          </div>

          {/* Nội dung danh sách giao dịch */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div className="spinner spinner-md" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>Đang tải lịch sử giao dịch...</div>
            </div>
          ) : transactions.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '36px 20px',
                background: '#f8fafc',
                borderRadius: 12,
                border: '1px dashed #cbd5e1',
              }}
            >
              <AlertCircle size={32} color="#94a3b8" style={{ marginBottom: 10 }} />
              <div style={{ fontWeight: 600, color: 'var(--gray-700)', marginBottom: 4 }}>
                Chưa có lần giao dịch VNPay nào
              </div>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--gray-500)', maxWidth: 420, marginInline: 'auto' }}>
                Hóa đơn này được tạo nhưng người dùng chưa bấm xác nhận chuyển hướng sang cổng thanh toán VNPay.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {transactions.map((txn, index) => {
                const txnBadge = getTxnStatusBadge(txn.status);
                const responseDesc = txn.responseCode ? (vnpayResponseCodeLabels[txn.responseCode] || `Mã: ${txn.responseCode}`) : null;

                return (
                  <div
                    key={txn.id || index}
                    style={{
                      border: `1px solid ${txn.status === 'SUCCESS' ? '#bbf7d0' : txn.status === 'FAILED' ? '#fecaca' : '#e2e8f0'}`,
                      background: txn.status === 'SUCCESS' ? '#f0fdf4' : txn.status === 'FAILED' ? '#fffbfb' : '#ffffff',
                      borderRadius: 12,
                      padding: 16,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {/* Header dòng giao dịch */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingBottom: 12,
                        marginBottom: 12,
                        borderBottom: '1px solid rgba(0,0,0,0.06)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            background: txn.status === 'SUCCESS' ? '#dcfce7' : '#fee2e2',
                            color: txn.status === 'SUCCESS' ? '#15803d' : '#b91c1c',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                          }}
                        >
                          #{index + 1}
                        </span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--gray-900)' }}>
                            Giao dịch #{txn.id} • {txn.paymentMethod || 'VNPAY'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                            Khởi tạo: {formatDateTime(txn.createdAt)}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: '1rem', fontWeight: 800, color: txn.status === 'SUCCESS' ? '#15803d' : 'var(--gray-800)' }}>
                          {formatVND(txn.amount)}
                        </span>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '4px 10px',
                            borderRadius: 6,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: txnBadge.bg,
                            color: txnBadge.color,
                          }}
                        >
                          {txnBadge.icon}
                          {txnBadge.label}
                        </span>
                      </div>
                    </div>

                    {/* Chi tiết kỹ thuật của giao dịch */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: 12,
                        fontSize: '0.8125rem',
                      }}
                    >
                      {/* txnRef */}
                      <div>
                        <span style={{ color: 'var(--gray-500)', fontSize: '0.75rem', display: 'block', marginBottom: 2 }}>
                          Mã tham chiếu (TxnRef):
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <code
                            style={{
                              background: '#f1f5f9',
                              padding: '2px 6px',
                              borderRadius: 4,
                              fontFamily: 'monospace',
                              fontWeight: 600,
                              color: '#334155',
                              fontSize: '0.75rem',
                            }}
                          >
                            {txn.txnRef || '—'}
                          </code>
                          {txn.txnRef && (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(txn.txnRef)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 2,
                                color: copiedTxn === txn.txnRef ? '#16a34a' : 'var(--gray-400)',
                              }}
                              title="Sao chép TxnRef"
                            >
                              <Copy size={13} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* vnpTransactionNo */}
                      <div>
                        <span style={{ color: 'var(--gray-500)', fontSize: '0.75rem', display: 'block', marginBottom: 2 }}>
                          Mã giao dịch VNPay:
                        </span>
                        <strong style={{ color: txn.vnpTransactionNo ? '#0f172a' : 'var(--gray-400)' }}>
                          {txn.vnpTransactionNo || 'Chưa ghi nhận'}
                        </strong>
                      </div>

                      {/* bankCode */}
                      <div>
                        <span style={{ color: 'var(--gray-500)', fontSize: '0.75rem', display: 'block', marginBottom: 2 }}>
                          Ngân hàng thanh toán:
                        </span>
                        <span
                          style={{
                            fontWeight: 700,
                            color: txn.bankCode ? '#1e40af' : 'var(--gray-500)',
                            background: txn.bankCode ? '#eff6ff' : 'transparent',
                            padding: txn.bankCode ? '1px 6px' : 0,
                            borderRadius: 4,
                          }}
                        >
                          {txn.bankCode || '—'}
                        </span>
                      </div>

                      {/* payDate */}
                      <div>
                        <span style={{ color: 'var(--gray-500)', fontSize: '0.75rem', display: 'block', marginBottom: 2 }}>
                          Thời gian thanh toán VNPay:
                        </span>
                        <span>{formatPayDate(txn.payDate)}</span>
                      </div>

                      {/* Response Code */}
                      <div style={{ gridColumn: '1 / -1' }}>
                        <span style={{ color: 'var(--gray-500)', fontSize: '0.75rem', display: 'block', marginBottom: 2 }}>
                          Kết quả từ VNPay (Response Code):
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: 4,
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              background: txn.responseCode === '00' ? '#dcfce7' : '#fee2e2',
                              color: txn.responseCode === '00' ? '#166534' : '#991b1b',
                            }}
                          >
                            Mã: {txn.responseCode || 'Chưa có'}
                          </span>
                          {responseDesc && (
                            <span style={{ color: txn.responseCode === '00' ? '#15803d' : '#dc2626', fontWeight: 600 }}>
                              {responseDesc}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className="modal-footer"
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--gray-100)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button className="btn btn-secondary" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

