import { useState, useEffect, useCallback, useMemo } from 'react';
import { clinicService } from '../../services/clinicService';
import { useToast } from '../../context/ToastContext';
import {
  Activity, Plus, Search, Edit, Trash2, CheckCircle2, XCircle,
  RefreshCw, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  MapPin, DollarSign, Tag, Eye, EyeOff
} from 'lucide-react';
import ServiceModal from './ServiceModal';

const serviceTypeConfig = {
  DENTAL: { label: 'Nha khoa điều trị', color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
  IMAGING: { label: 'Chẩn đoán hình ảnh', color: '#6d28d9', bg: '#ede9fe', border: '#ddd6fe' },
  LAB_TEST: { label: 'Xét nghiệm', color: '#c2410c', bg: '#fff7ed', border: '#fed7aa' },
  OTHER: { label: 'Dịch vụ khác', color: '#475569', bg: '#f1f5f9', border: '#cbd5e1' },
};

export default function ServiceManagement() {
  const toast = useToast();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [includeInactive, setIncludeInactive] = useState(true);

  // Modal
  const [modalState, setModalState] = useState({ open: false, service: null });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(searchTerm.trim());
      setPage(0);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        size,
        includeInactive,
        sort: 'id,asc', // Sắp xếp ID tăng dần
      };
      if (typeFilter) params.type = typeFilter;
      if (debouncedKeyword) params.keyword = debouncedKeyword;

      const res = await clinicService.getServices(params);
      const data = res.data.result;
      setServices(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      toast.error('Không thể tải danh mục dịch vụ nha khoa');
    } finally {
      setLoading(false);
    }
  }, [page, size, typeFilter, debouncedKeyword, includeInactive, toast]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

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

  const handleToggleStatus = async (srv) => {
    try {
      await clinicService.toggleServiceStatus(srv.id);
      toast.success(`Đã ${srv.active ? 'tạm ngưng' : 'kích hoạt'} dịch vụ "${srv.name}"`);
      fetchServices();
    } catch (err) {
      toast.error('Không thể thay đổi trạng thái dịch vụ');
    }
  };

  const handleDelete = async (srv) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa dịch vụ "${srv.name}"? Hành động này không thể hoàn tác nếu dịch vụ đã có chỉ định.`)) {
      return;
    }
    try {
      await clinicService.deleteService(srv.id);
      toast.success('Đã xóa dịch vụ khỏi danh mục');
      fetchServices();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xóa dịch vụ này');
    }
  };

  return (
    <div className="management-page">
      {/* Header */}
      <div className="management-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'var(--gray-900)' }}>
            Quản lý Dịch vụ Nha khoa
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--gray-500)', fontSize: '0.875rem' }}>
            Bảng giá các thủ thuật nha khoa, chẩn đoán hình ảnh và phòng thực hiện chỉ định
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setModalState({ open: true, service: null })}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: '#7c3aed',
            borderColor: '#7c3aed',
            padding: '10px 20px',
            borderRadius: 12,
            boxShadow: '0 4px 14px rgba(124, 58, 237, 0.25)',
          }}
        >
          <Plus size={18} />
          <span>Thêm dịch vụ mới</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          marginBottom: 20,
          border: '1px solid #ede9fe',
          borderRadius: 16,
          background: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            {/* 1. Keyword search */}
            <div style={{ position: 'relative', width: 260 }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
              <input
                type="text"
                className="form-input"
                placeholder="Tìm tên dịch vụ, mô tả..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: 36, height: 38, fontSize: '0.875rem' }}
              />
            </div>

            {/* 2. Type filter */}
            <select
              className="form-select"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(0);
              }}
              style={{ height: 38, fontSize: '0.875rem', minWidth: 180 }}
            >
              <option value="">Tất cả loại dịch vụ</option>
              <option value="DENTAL">Nha khoa điều trị (DENTAL)</option>
              <option value="IMAGING">Chẩn đoán hình ảnh (IMAGING)</option>
              <option value="LAB_TEST">Xét nghiệm (LAB_TEST)</option>
              <option value="OTHER">Khác (OTHER)</option>
            </select>

            {/* 3. Include Inactive Toggle */}
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', color: 'var(--gray-700)', cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(e) => {
                  setIncludeInactive(e.target.checked);
                  setPage(0);
                }}
                style={{ accentColor: '#7c3aed', width: 16, height: 16 }}
              />
              <span>Bao gồm dịch vụ tạm ngưng</span>
            </label>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>
              Tổng số: <strong style={{ color: 'var(--gray-800)' }}>{totalElements}</strong> dịch vụ
            </span>
            <button
              className="btn btn-outline btn-icon"
              onClick={fetchServices}
              disabled={loading}
              title="Làm mới danh sách"
              style={{ height: 38, width: 38 }}
            >
              <RefreshCw size={15} className={loading ? 'spinner' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Services Table Card */}
      <div className="card" style={{ overflow: 'hidden', border: '1px solid #ede9fe', borderRadius: 16 }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 85 }}>#ID ↑</th>
                <th>Tên dịch vụ nha khoa</th>
                <th>Phân loại</th>
                <th>Đơn giá (VNĐ)</th>
                <th>Phòng thực hiện</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'right', minWidth: 140 }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 48 }}>
                    <div className="spinner" style={{ margin: '0 auto' }} />
                    <p style={{ marginTop: 12, fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                      Đang tải danh mục dịch vụ...
                    </p>
                  </td>
                </tr>
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 48, color: 'var(--gray-400)' }}>
                    Không tìm thấy dịch vụ nào phù hợp
                  </td>
                </tr>
              ) : (
                services.map((srv) => {
                  const tInfo = serviceTypeConfig[srv.serviceType] || serviceTypeConfig.OTHER;
                  return (
                    <tr key={srv.id} style={{ transition: 'background 0.2s', opacity: srv.active ? 1 : 0.65 }}>
                      {/* ID */}
                      <td style={{ fontWeight: 700, color: '#6d28d9' }}>#{srv.id}</td>

                      {/* Name & Description */}
                      <td style={{ minWidth: 240 }}>
                        <div style={{ fontWeight: 700, color: 'var(--gray-900)', fontSize: '0.92rem' }}>
                          {srv.name}
                        </div>
                        {srv.description && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)', marginTop: 2, lineHeight: 1.4 }}>
                            {srv.description}
                          </div>
                        )}
                      </td>

                      {/* Type Badge */}
                      <td>
                        <span
                          className="badge"
                          style={{
                            background: tInfo.bg,
                            color: tInfo.color,
                            border: `1px solid ${tInfo.border}`,
                            fontWeight: 700,
                            fontSize: '0.72rem',
                          }}
                        >
                          {tInfo.label}
                        </span>
                      </td>

                      {/* Price */}
                      <td style={{ fontWeight: 800, color: '#047857', fontSize: '0.95rem' }}>
                        {Number(srv.price).toLocaleString('vi-VN')} đ
                      </td>

                      {/* Room */}
                      <td>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--gray-700)' }}>
                          <MapPin size={13} color="#7c3aed" />
                          <span>{srv.roomNumber}</span>
                        </div>
                      </td>

                      {/* Status (Cần gạt bật/tắt) */}
                      <td style={{ minWidth: 155 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                          <label
                            className="switch-control"
                            title={srv.active ? 'Cần gạt: Nhấn để tạm ngưng dịch vụ' : 'Cần gạt: Nhấn để kích hoạt dịch vụ'}
                          >
                            <input
                              type="checkbox"
                              checked={srv.active}
                              onChange={() => handleToggleStatus(srv)}
                            />
                            <span className="switch-slider" />
                          </label>
                          <span
                            style={{
                              fontSize: '0.8125rem',
                              fontWeight: 700,
                              color: srv.active ? '#15803d' : '#94a3b8',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {srv.active ? 'Hoạt động' : 'Tạm ngưng'}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                          {/* Edit button */}
                          <button
                            type="button"
                            className="btn btn-sm btn-outline btn-icon"
                            onClick={() => setModalState({ open: true, service: srv })}
                            title="Chỉnh sửa dịch vụ"
                            style={{ height: 32, width: 32 }}
                          >
                            <Edit size={14} />
                          </button>

                          {/* Delete button */}
                          <button
                            type="button"
                            className="btn btn-sm btn-icon"
                            onClick={() => handleDelete(srv)}
                            title="Xóa dịch vụ khỏi hệ thống"
                            style={{
                              height: 32,
                              width: 32,
                              background: '#fef2f2',
                              color: '#dc2626',
                              border: '1px solid #fee2e2',
                            }}
                          >
                            <Trash2 size={14} />
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
              trên tổng số <strong style={{ color: 'var(--gray-800)' }}>{totalElements}</strong> dịch vụ
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

      {/* Service Modal */}
      {modalState.open && (
        <ServiceModal
          service={modalState.service}
          onClose={() => setModalState({ open: false, service: null })}
          onSaved={() => {
            setModalState({ open: false, service: null });
            fetchServices();
          }}
        />
      )}
    </div>
  );
}

