import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CreditCard, Search, CheckCircle2, XCircle, Clock, RefreshCw,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Eye, Filter, RotateCcw, AlertCircle, FileText, ArrowRight,
  TrendingUp, Activity, Calendar
} from 'lucide-react';
import { paymentService } from '../../services/paymentService';
import { userService } from '../../services/userService';
import { useToast } from '../../context/ToastContext';
import InvoiceTransactionsModal from './InvoiceTransactionsModal';

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
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
};

export default function InvoiceManagement() {
  const toast = useToast();
  const [invoices, setInvoices] = useState([]);
  const [patientMap, setPatientMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected invoice for transactions modal
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        size,
        sort: 'createdAt,desc',
      };
      if (statusFilter) {
        params.status = statusFilter;
      }

      const res = await paymentService.getInvoices(params);
      const data = res.data?.result;
      setInvoices(data?.content || []);
      setTotalPages(data?.totalPages || 0);
      setTotalElements(data?.totalElements || 0);
    } catch (err) {
      console.error('Failed to load invoices:', err);
      toast.error('Không thể tải danh sách hóa đơn');
    } finally {
      setLoading(false);
    }
  }, [page, size, statusFilter, toast]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Tải tên bệnh nhân tương ứng cho từng hóa đơn
  useEffect(() => {
    const missingIds = [
      ...new Set(
        invoices
          .filter((inv) => inv.patientId && !patientMap[inv.patientId])
          .map((inv) => inv.patientId)
      ),
    ];
    if (missingIds.length > 0) {
      missingIds.forEach(async (pId) => {
        try {
          const res = await userService.getUserById(pId);
          const u = res.data?.result || res.data;
          if (u) {
            setPatientMap((prev) => ({ ...prev, [pId]: u }));
          }
        } catch (e) {
          // ignore fallback
        }
      });
    }
  }, [invoices]);

  // Client-side filtering for type or search if needed (hỗ trợ tìm cả theo tên bệnh nhân)
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // Filter by type
      if (typeFilter && inv.type !== typeFilter) {
        return false;
      }
      // Search by ID, appointmentId, patientId, hoặc tên bệnh nhân
      if (searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        const matchesId = String(inv.id).includes(term);
        const matchesAppt = String(inv.appointmentId).includes(term);
        const matchesPatientId = String(inv.patientId).includes(term);
        const pName = (patientMap[inv.patientId]?.fullName || '').toLowerCase();
        const matchesPatientName = pName.includes(term);

        if (!matchesId && !matchesAppt && !matchesPatientId && !matchesPatientName) {
          return false;
        }
      }
      return true;
    });
  }, [invoices, typeFilter, searchTerm, patientMap]);

  // Quick stats from current data
  const stats = useMemo(() => {
    let paidCount = 0;
    let pendingCount = 0;
    let totalRevenue = 0;

    invoices.forEach((inv) => {
      if (inv.status === 'PAID') {
        paidCount++;
        totalRevenue += Number(inv.amount || 0);
      } else if (inv.status === 'PENDING') {
        pendingCount++;
      }
    });

    return { paidCount, pendingCount, totalRevenue };
  }, [invoices]);

  const handleResetFilters = () => {
    setStatusFilter('');
    setTypeFilter('');
    setSearchTerm('');
    setPage(0);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PAID':
        return {
          label: 'Đã thanh toán',
          bg: '#dcfce7',
          color: '#15803d',
          icon: <CheckCircle2 size={13} />,
        };
      case 'PENDING':
        return {
          label: 'Chờ thanh toán',
          bg: '#fef3c7',
          color: '#b45309',
          icon: <Clock size={13} />,
        };
      case 'CANCELLED':
        return {
          label: 'Đã hủy',
          bg: '#fee2e2',
          color: '#b91c1c',
          icon: <XCircle size={13} />,
        };
      default:
        return { label: status || '—', bg: '#f1f5f9', color: '#475569', icon: null };
    }
  };

  return (
    <div className="dashboard-content" style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: '#ede9fe',
              color: '#6d28d9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(109, 40, 217, 0.15)',
            }}
          >
            <CreditCard size={26} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--gray-900)' }}>
              Quản lý Hóa đơn & Giao dịch
            </h1>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--gray-500)', marginTop: 2 }}>
              Theo dõi lịch sử hóa đơn thanh toán tiền khám, dịch vụ cận lâm sàng và các giao dịch qua cổng VNPay
            </p>
          </div>
        </div>

        <button
          className="btn btn-secondary"
          onClick={fetchInvoices}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <RefreshCw size={16} className={loading ? 'spinner' : ''} />
          <span>Làm mới danh sách</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: '#f1f5f9',
              color: '#475569',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FileText size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', fontWeight: 600 }}>TỔNG SỐ HÓA ĐƠN</div>
            <div style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--gray-900)' }}>
              {totalElements} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--gray-500)' }}>hóa đơn</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: '#dcfce7',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8125rem', color: '#16a34a', fontWeight: 600 }}>ĐÃ THANH TOÁN (TRANG NÀY)</div>
            <div style={{ fontSize: '1.375rem', fontWeight: 800, color: '#15803d' }}>
              {stats.paidCount} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#16a34a' }}>hóa đơn</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: '#fef3c7',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8125rem', color: '#b45309', fontWeight: 600 }}>CHỜ THANH TOÁN (TRANG NÀY)</div>
            <div style={{ fontSize: '1.375rem', fontWeight: 800, color: '#b45309' }}>
              {stats.pendingCount} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#b45309' }}>hóa đơn</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TrendingUp size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8125rem', color: '#059669', fontWeight: 600 }}>DOANH THU ĐÃ THU (TRANG NÀY)</div>
            <div style={{ fontSize: '1.375rem', fontWeight: 800, color: '#047857' }}>
              {formatVND(stats.totalRevenue)}
            </div>
          </div>
        </div>
      </div>

      {/* Main Card: Toolbar + Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Toolbar Filter */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--gray-100)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 12,
            background: '#fafafa',
          }}
        >
          {/* Search by IDs */}
          <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 200 }}>
            <Search
              size={16}
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
              placeholder="Tìm theo Mã HĐ, Lịch hẹn, Mã BN, Tên bệnh nhân..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: 36, height: 38, fontSize: '0.875rem' }}
            />
          </div>

          {/* Status Filter */}
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            style={{ height: 38, fontSize: '0.875rem', minWidth: 170 }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="PAID">Đã thanh toán (PAID)</option>
            <option value="PENDING">Chờ thanh toán (PENDING)</option>
            <option value="CANCELLED">Đã hủy (CANCELLED)</option>
          </select>

          {/* Type Filter */}
          <select
            className="form-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ height: 38, fontSize: '0.875rem', minWidth: 190 }}
          >
            <option value="">Tất cả khoản thu</option>
            <option value="EXAMINATION">Tiền công khám bác sĩ</option>
            <option value="SERVICES">Dịch vụ nha khoa chỉ định</option>
          </select>

          {/* Reset button */}
          {(statusFilter || typeFilter || searchTerm) && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleResetFilters}
              style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#dc2626' }}
            >
              <RotateCcw size={14} />
              <span>Đặt lại</span>
            </button>
          )}

          <div style={{ marginLeft: 'auto', fontSize: '0.8125rem', color: 'var(--gray-500)' }}>
            Hiển thị <strong>{filteredInvoices.length}</strong> / <strong>{totalElements}</strong> hóa đơn
          </div>
        </div>

        {/* Invoices Table */}
        <div className="table-responsive">
          <table className="data-table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th style={{ width: 90 }}>Mã HĐ</th>
                <th style={{ minWidth: 160 }}>Khoản thanh toán</th>
                <th style={{ minWidth: 150 }}>Lịch hẹn & Bệnh nhân</th>
                <th style={{ minWidth: 130 }}>Số tiền</th>
                <th style={{ minWidth: 140 }}>Trạng thái</th>
                <th style={{ minWidth: 150 }}>Ngày tạo</th>
                <th style={{ minWidth: 150 }}>Ngày thanh toán</th>
                <th style={{ width: 130, textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '50px 0' }}>
                    <div className="spinner spinner-md" style={{ margin: '0 auto 12px' }} />
                    <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>Đang tải danh sách hóa đơn...</div>
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '50px 0' }}>
                    <AlertCircle size={36} color="#94a3b8" style={{ marginBottom: 10 }} />
                    <div style={{ fontWeight: 600, color: 'var(--gray-700)', fontSize: '1rem' }}>
                      Không có hóa đơn nào
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginTop: 4 }}>
                      {statusFilter || typeFilter || searchTerm
                        ? 'Không tìm thấy hóa đơn phù hợp với điều kiện lọc'
                        : 'Hệ thống chưa ghi nhận hóa đơn thanh toán nào'}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const badge = getStatusBadge(inv.status);
                  return (
                    <tr
                      key={inv.id}
                      onClick={() => setSelectedInvoice(inv)}
                      style={{
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease',
                      }}
                      className="hover-row"
                    >
                      {/* ID */}
                      <td style={{ fontWeight: 700, color: '#6d28d9' }}>
                        #{inv.id}
                      </td>

                      {/* Type */}
                      <td>
                        {inv.type === 'EXAMINATION' ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '3px 8px',
                              borderRadius: 6,
                              background: '#ede9fe',
                              color: '#6d28d9',
                              fontSize: '0.785rem',
                              fontWeight: 600,
                            }}
                          >
                            🩺 Tiền công khám
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '3px 8px',
                              borderRadius: 6,
                              background: '#e0f2fe',
                              color: '#0369a1',
                              fontSize: '0.785rem',
                              fontWeight: 600,
                            }}
                          >
                            🦷 Dịch vụ nha khoa
                          </span>
                        )}
                      </td>

                      {/* Appointment & Patient */}
                      <td>
                        <div style={{ fontSize: '0.8125rem' }}>
                          <div style={{ marginBottom: 3 }}>
                            <span style={{ color: 'var(--gray-500)' }}>Hẹn: </span>
                            <strong style={{ color: 'var(--gray-800)' }}>#{inv.appointmentId}</strong>
                          </div>
                          <div>
                            <span style={{ color: 'var(--gray-500)' }}>BN: </span>
                            {patientMap[inv.patientId]?.fullName ? (
                              <strong style={{ color: 'var(--gray-900)' }}>
                                {patientMap[inv.patientId].fullName}{' '}
                                <span style={{ color: 'var(--gray-500)', fontWeight: 500, fontSize: '0.75rem' }}>
                                  (#{inv.patientId})
                                </span>
                              </strong>
                            ) : (
                              <strong style={{ color: 'var(--gray-800)' }}>#{inv.patientId}</strong>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Amount */}
                      <td style={{ fontWeight: 800, fontSize: '0.925rem', color: '#059669' }}>
                        {formatVND(inv.amount)}
                      </td>

                      {/* Status */}
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: badge.bg,
                            color: badge.color,
                          }}
                        >
                          {badge.icon}
                          {badge.label}
                        </span>
                      </td>

                      {/* CreatedAt */}
                      <td style={{ fontSize: '0.8125rem', color: 'var(--gray-600)' }}>
                        {formatDateTime(inv.createdAt)}
                      </td>

                      {/* PaidAt */}
                      <td style={{ fontSize: '0.8125rem', color: inv.paidAt ? '#15803d' : 'var(--gray-400)', fontWeight: inv.paidAt ? 600 : 400 }}>
                        {formatDateTime(inv.paidAt)}
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => setSelectedInvoice(inv)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '5px 10px',
                            fontSize: '0.775rem',
                            borderRadius: 6,
                          }}
                          title="Xem chi tiết các lần giao dịch"
                        >
                          <Eye size={13} />
                          <span>Giao dịch</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 0 && (
          <div
            style={{
              padding: '14px 20px',
              borderTop: '1px solid var(--gray-100)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
              background: '#ffffff',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.8125rem', color: 'var(--gray-500)' }}>
              <span>Trang <strong>{page + 1}</strong> / <strong>{totalPages}</strong></span>
              <span>•</span>
              <span>
                Hiển thị
                <select
                  value={size}
                  onChange={(e) => {
                    setSize(Number(e.target.value));
                    setPage(0);
                  }}
                  className="form-select"
                  style={{
                    display: 'inline-block',
                    width: 'auto',
                    height: 28,
                    padding: '2px 24px 2px 8px',
                    margin: '0 6px',
                    fontSize: '0.8125rem',
                  }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                dòng / trang
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                className="btn btn-icon btn-ghost btn-sm"
                onClick={() => setPage(0)}
                disabled={page === 0 || loading}
                title="Trang đầu"
              >
                <ChevronsLeft size={16} />
              </button>
              <button
                className="btn btn-icon btn-ghost btn-sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0 || loading}
                title="Trang trước"
              >
                <ChevronLeft size={16} />
              </button>

              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  background: '#f1f5f9',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  color: 'var(--gray-700)',
                  margin: '0 4px',
                }}
              >
                {page + 1}
              </span>

              <button
                className="btn btn-icon btn-ghost btn-sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1 || loading}
                title="Trang tiếp"
              >
                <ChevronRight size={16} />
              </button>
              <button
                className="btn btn-icon btn-ghost btn-sm"
                onClick={() => setPage(totalPages - 1)}
                disabled={page >= totalPages - 1 || loading}
                title="Trang cuối"
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transactions Detail Modal */}
      {selectedInvoice && (
        <InvoiceTransactionsModal
          invoice={selectedInvoice}
          patientName={patientMap[selectedInvoice.patientId]?.fullName}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
}
