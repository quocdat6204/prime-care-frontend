import { useState, useEffect, useCallback, useMemo } from 'react';
import { emailService } from '../../services/emailService';
import { useToast } from '../../context/ToastContext';
import {
  Mail, Send, Search, CheckCircle2, XCircle, RefreshCw,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Eye, RotateCcw, AlertCircle, Clock, CheckCheck, X
} from 'lucide-react';
import EmailDetailModal from './EmailDetailModal';
import SendEmailModal from './SendEmailModal';

export default function EmailManagement() {
  const toast = useToast();
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [sendModalState, setSendModalState] = useState({ open: false, initialData: null });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(searchTerm.trim());
      setPage(0);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchHistories = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        size,
      };
      if (debouncedKeyword) params.keyword = debouncedKeyword;
      if (statusFilter) params.status = statusFilter;

      const res = await emailService.getHistories(params);
      const data = res.data.result;
      setEmails(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      toast.error('Không thể tải nhật ký gửi email');
    } finally {
      setLoading(false);
    }
  }, [page, size, debouncedKeyword, statusFilter, toast]);

  useEffect(() => {
    fetchHistories();
  }, [fetchHistories]);

  // Generate pagination page numbers smart range
  const paginationRange = useMemo(() => {
    if (totalPages <= 1) return [0];
    const range = [];
    const maxVisible = 5;
    let start = Math.max(0, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages - 1, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(0, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    return range;
  }, [page, totalPages]);

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
      });
    } catch {
      return dateStr;
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setDebouncedKeyword('');
    setStatusFilter('');
    setPage(0);
  };

  return (
    <div className="management-page">
      {/* Header */}
      <div
        className="management-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #7c3aed, #9333ea)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)',
            }}
          >
            <Mail size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'var(--gray-900)' }}>
              Quản lý Email & Lịch sử gửi
            </h1>
            <p style={{ margin: '4px 0 0', color: 'var(--gray-500)', fontSize: '0.875rem' }}>
              Theo dõi nhật ký thông báo tự động, trạng thái qua Brevo SMTP và hỗ trợ soạn gửi email trực tiếp
            </p>
          </div>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setSendModalState({ open: true, initialData: null })}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)',
          }}
        >
          <Send size={16} />
          <span>Soạn & Gửi email mới</span>
        </button>
      </div>

      {/* Filter Bar Card */}
      <div
        className="card"
        style={{
          marginBottom: 20,
          padding: '16px 20px',
          background: '#fff',
          borderRadius: 14,
          border: '1px solid #ede9fe',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 14,
            flexWrap: 'wrap',
          }}
        >
          {/* Search Box */}
          <div style={{ flex: '1 1 280px', position: 'relative' }}>
            <Search
              size={17}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--gray-400)',
              }}
            />
            <input
              type="text"
              className="form-input"
              placeholder="Tìm kiếm theo địa chỉ email người nhận..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: 38, height: 40 }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--gray-400)',
                }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Status Filter Dropdown */}
          <div style={{ minWidth: 200 }}>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
              style={{ height: 40 }}
            >
              <option value="">Tất cả trạng thái gửi</option>
              <option value="SUCCESS">Gửi thành công (SUCCESS)</option>
              <option value="FAILED">Gửi thất bại (FAILED)</option>
            </select>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {(searchTerm || statusFilter) && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleResetFilters}
                style={{ height: 40 }}
              >
                Đặt lại
              </button>
            )}

            <button
              type="button"
              className="btn btn-outline btn-icon"
              onClick={fetchHistories}
              title="Tải lại danh sách"
              style={{ height: 40, width: 40 }}
            >
              <RefreshCw size={16} className={loading ? 'spinner' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Emails Table Card */}
      <div
        className="card"
        style={{
          overflow: 'hidden',
          border: '1px solid #ede9fe',
          borderRadius: 16,
          background: '#fff',
        }}
      >
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 85 }}>#ID ↓</th>
                <th>Người nhận (To)</th>
                <th>Tiêu đề email (Subject)</th>
                <th>Thời gian gửi</th>
                <th>Mã Brevo Message ID</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'right', minWidth: 130 }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 48 }}>
                    <div className="spinner" style={{ margin: '0 auto' }} />
                    <p style={{ marginTop: 12, fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                      Đang tải lịch sử gửi email...
                    </p>
                  </td>
                </tr>
              ) : emails.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 48, color: 'var(--gray-400)' }}>
                    Không có email nào phù hợp với bộ lọc tìm kiếm
                  </td>
                </tr>
              ) : (
                emails.map((item) => {
                  const isSuccess = item.status === 'SUCCESS';
                  return (
                    <tr key={item.id} style={{ transition: 'background 0.2s' }}>
                      {/* ID */}
                      <td style={{ fontWeight: 700, color: '#6d28d9' }}>#{item.id}</td>

                      {/* Recipient */}
                      <td>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <Mail size={14} color="#7c3aed" style={{ flexShrink: 0 }} />
                          <span style={{ fontWeight: 700, color: 'var(--gray-900)', fontSize: '0.9rem' }}>
                            {item.recipient}
                          </span>
                        </div>
                      </td>

                      {/* Subject */}
                      <td style={{ maxWidth: 280 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            color: 'var(--gray-800)',
                            fontSize: '0.875rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          title={item.subject}
                        >
                          {item.subject}
                        </div>
                      </td>

                      {/* Created At */}
                      <td style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <Clock size={13} color="var(--gray-400)" />
                          <span>{formatDateTime(item.createdAt)}</span>
                        </div>
                      </td>

                      {/* Message ID */}
                      <td>
                        {item.messageId ? (
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontSize: '0.75rem',
                              color: '#64748b',
                              background: '#f8fafc',
                              padding: '2px 6px',
                              borderRadius: 4,
                              border: '1px solid #e2e8f0',
                              maxWidth: 160,
                              display: 'inline-block',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                            title={item.messageId}
                          >
                            {item.messageId}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: 'var(--gray-400)', fontStyle: 'italic' }}>
                            ---
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td>
                        <span
                          className="badge"
                          style={{
                            background: isSuccess ? '#dcfce7' : '#fee2e2',
                            color: isSuccess ? '#15803d' : '#b91c1c',
                            border: `1px solid ${isSuccess ? '#bbf7d0' : '#fecaca'}`,
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          {isSuccess ? <CheckCheck size={12} /> : <XCircle size={12} />}
                          <span>{isSuccess ? 'Thành công' : 'Thất bại'}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                          {/* View Detail button */}
                          <button
                            type="button"
                            className="btn btn-sm btn-outline btn-icon"
                            onClick={() => setSelectedEmail(item)}
                            title="Xem chi tiết nội dung email"
                            style={{ height: 32, width: 32 }}
                          >
                            <Eye size={14} />
                          </button>

                          {/* Resend button */}
                          <button
                            type="button"
                            className="btn btn-sm btn-icon"
                            onClick={() => setSendModalState({ open: true, initialData: item })}
                            title="Soạn lại / Gửi lại email này"
                            style={{
                              height: 32,
                              width: 32,
                              background: '#f5f3ff',
                              color: '#7c3aed',
                              border: '1px solid #ddd6fe',
                            }}
                          >
                            <RotateCcw size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Complete, Responsive Pagination Bar */}
        <div className="table-pagination-footer">
          {/* Left: Rows per page & Range summary */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', color: 'var(--gray-600)' }}>
              <span>Hiển thị:</span>
              <select
                className="form-select"
                value={size}
                onChange={(e) => {
                  setSize(Number(e.target.value));
                  setPage(0);
                }}
                style={{ width: 'auto', padding: '4px 28px 4px 8px', height: 32, fontSize: '0.8125rem' }}
              >
                <option value={5}>5 dòng</option>
                <option value={10}>10 dòng</option>
                <option value={20}>20 dòng</option>
                <option value={50}>50 dòng</option>
              </select>
            </div>

            <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>
              Hiển thị{' '}
              <strong style={{ color: 'var(--gray-800)' }}>
                {totalElements === 0 ? 0 : page * size + 1} - {Math.min((page + 1) * size, totalElements)}
              </strong>{' '}
              trên tổng số <strong style={{ color: 'var(--gray-800)' }}>{totalElements}</strong> email
            </div>
          </div>

          {/* Right: Page navigation buttons */}
          <div className="pagination" style={{ padding: 0 }}>
            {/* First Page */}
            <button
              className="pagination-btn"
              disabled={page === 0 || loading}
              onClick={() => setPage(0)}
              title="Trang đầu"
            >
              <ChevronsLeft size={16} />
            </button>

            {/* Prev Page */}
            <button
              className="pagination-btn"
              disabled={page === 0 || loading}
              onClick={() => setPage(page - 1)}
              title="Trang trước"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Page number buttons */}
            {paginationRange.map((p) => (
              <button
                key={p}
                className={`pagination-btn ${page === p ? 'active' : ''}`}
                onClick={() => setPage(p)}
                disabled={loading}
              >
                {p + 1}
              </button>
            ))}

            {/* Next Page */}
            <button
              className="pagination-btn"
              disabled={page >= totalPages - 1 || totalPages === 0 || loading}
              onClick={() => setPage(page + 1)}
              title="Trang tiếp"
            >
              <ChevronRight size={16} />
            </button>

            {/* Last Page */}
            <button
              className="pagination-btn"
              disabled={page >= totalPages - 1 || totalPages === 0 || loading}
              onClick={() => setPage(Math.max(0, totalPages - 1))}
              title="Trang cuối"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedEmail && (
        <EmailDetailModal
          email={selectedEmail}
          onClose={() => setSelectedEmail(null)}
          onResend={(mail) => {
            setSendModalState({ open: true, initialData: mail });
          }}
        />
      )}

      {sendModalState.open && (
        <SendEmailModal
          initialData={sendModalState.initialData}
          onClose={() => setSendModalState({ open: false, initialData: null })}
          onSent={() => {
            setSendModalState({ open: false, initialData: null });
            fetchHistories();
          }}
        />
      )}
    </div>
  );
}

