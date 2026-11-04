import { useState, useEffect, useMemo } from 'react';
import { X, Search, Check, Plus, Loader, Stethoscope, AlertCircle } from 'lucide-react';
import { clinicService } from '../../services/clinicService';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils/errorMessage';

const serviceTypeMap = {
  IMAGING: { label: 'Chẩn đoán hình ảnh', color: '#2563eb', bg: '#eff6ff' },
  LAB_TEST: { label: 'Xét nghiệm', color: '#7c3aed', bg: '#faf5ff' },
  DENTAL: { label: 'Thủ thuật nha khoa', color: '#059669', bg: '#ecfdf5' },
};

export default function OrderServicesModal({ appointmentId, existingServices = [], onClose, onSuccess, zIndex = 1400 }) {
  const toast = useToast();
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedServices, setSelectedServices] = useState({}); // { [id]: { note: '' } }

  // Set các ID dịch vụ đã được chỉ định trước đó (chưa hủy)
  const existingServiceIds = useMemo(() => {
    return new Set(
      existingServices
        .filter((s) => s.status !== 'CANCELLED')
        .map((s) => s.serviceId)
    );
  }, [existingServices]);

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        // Backend quy định param: includeInactive (mặc định false). Bác sĩ chỉ xem các dịch vụ đang hoạt động (active = true)
        const res = await clinicService.getServices({ includeInactive: false, size: 200 });
        const list = (res.data.result?.content || []).filter((s) => s.active !== false);
        setCatalog(list);
      } catch (err) {
        toast.error('Không thể tải danh mục dịch vụ y tế');
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, [toast]);

  // Lọc theo search và type
  const filteredCatalog = useMemo(() => {
    return catalog.filter((s) => {
      if (selectedType !== 'ALL' && s.serviceType !== selectedType) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = s.name?.toLowerCase().includes(term);
        const matchDesc = s.description?.toLowerCase().includes(term);
        const matchRoom = s.roomNumber?.toLowerCase().includes(term);
        if (!matchName && !matchDesc && !matchRoom) return false;
      }
      return true;
    });
  }, [catalog, selectedType, searchTerm]);

  const toggleSelectService = (service) => {
    if (existingServiceIds.has(service.id)) return;

    setSelectedServices((prev) => {
      const copy = { ...prev };
      if (copy[service.id]) {
        delete copy[service.id];
      } else {
        copy[service.id] = { note: '' };
      }
      return copy;
    });
  };

  const handleUpdateNote = (serviceId, note) => {
    setSelectedServices((prev) => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        note,
      },
    }));
  };

  const selectedCount = Object.keys(selectedServices).length;
  const totalCost = useMemo(() => {
    return Object.keys(selectedServices).reduce((sum, id) => {
      const s = catalog.find((item) => String(item.id) === String(id));
      return sum + Number(s?.price || 0);
    }, 0);
  }, [selectedServices, catalog]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedCount === 0) {
      toast.warning('Vui lòng chọn ít nhất 1 dịch vụ cần chỉ định');
      return;
    }

    const items = Object.entries(selectedServices).map(([serviceId, data]) => ({
      serviceId: Number(serviceId),
      note: data.note?.trim() || undefined,
    }));

    setSubmitting(true);
    try {
      await clinicService.orderAppointmentServices(appointmentId, { items });
      toast.success(`Đã chỉ định thành công ${items.length} dịch vụ cho bệnh nhân!`);
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Chỉ định dịch vụ thất bại. Vui lòng kiểm tra lại trạng thái ca khám!'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex }} onClick={onClose}>
      <div
        className="modal-content"
        style={{
          maxWidth: 820,
          width: '95vw',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="modal-header"
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--gray-900)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Stethoscope size={22} style={{ color: 'var(--doctor-accent)' }} />
              Chỉ định Dịch vụ Cận lâm sàng & Thủ thuật
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.825rem', color: 'var(--gray-500)' }}>
              Chọn các dịch vụ chụp chiếu, xét nghiệm hoặc thủ thuật nha khoa cần thực hiện cho lịch khám #{appointmentId}
            </p>
          </div>
          <button className="btn btn-icon btn-ghost" onClick={onClose} disabled={submitting}>
            <X size={20} />
          </button>
        </div>

        {/* Filter bar */}
        <div style={{ padding: '14px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Tìm tên dịch vụ, mô tả hoặc phòng thực hiện..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: 36, height: 38, fontSize: '0.875rem' }}
              />
            </div>

            {/* Type selector */}
            <div style={{ display: 'flex', gap: 6 }}>
              {[
                { key: 'ALL', label: 'Tất cả' },
                { key: 'IMAGING', label: 'Chẩn đoán hình ảnh' },
                { key: 'LAB_TEST', label: 'Xét nghiệm' },
                { key: 'DENTAL', label: 'Thủ thuật nha khoa' },
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  className={`btn btn-sm ${selectedType === t.key ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setSelectedType(t.key)}
                  style={{
                    fontSize: '0.8rem',
                    padding: '5px 12px',
                    borderRadius: 20,
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Body List */}
        <div style={{ padding: '16px 24px', flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto' }} />
              <p style={{ marginTop: 12, fontSize: '0.85rem', color: 'var(--gray-500)' }}>
                Đang tải danh mục dịch vụ y tế...
              </p>
            </div>
          ) : filteredCatalog.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--gray-400)' }}>
              <AlertCircle size={36} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
              <p style={{ fontSize: '0.9rem', color: 'var(--gray-600)', margin: 0 }}>
                Không tìm thấy dịch vụ nào phù hợp với bộ lọc
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredCatalog.map((service) => {
                const isSelected = Boolean(selectedServices[service.id]);
                const isAlreadyOrdered = existingServiceIds.has(service.id);
                const typeInfo = serviceTypeMap[service.serviceType] || { label: service.serviceType, color: '#475569', bg: '#f1f5f9' };

                return (
                  <div
                    key={service.id}
                    onClick={() => !isAlreadyOrdered && toggleSelectService(service)}
                    style={{
                      border: isSelected ? '2px solid var(--doctor-accent)' : '1px solid #e2e8f0',
                      background: isAlreadyOrdered ? '#f8fafc' : isSelected ? '#faf5ff' : '#ffffff',
                      borderRadius: 10,
                      padding: '12px 16px',
                      cursor: isAlreadyOrdered ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      opacity: isAlreadyOrdered ? 0.6 : 1,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      {/* Checkbox and info */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1 }}>
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 6,
                            border: isSelected ? 'none' : '2px solid #cbd5e1',
                            background: isSelected ? 'var(--doctor-accent)' : '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginTop: 2,
                            flexShrink: 0,
                          }}
                        >
                          {isSelected && <Check size={14} color="#ffffff" strokeWidth={3} />}
                        </div>

                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <strong style={{ fontSize: '0.925rem', color: isAlreadyOrdered ? 'var(--gray-500)' : 'var(--gray-900)' }}>
                              {service.name}
                            </strong>
                            <span
                              className="badge"
                              style={{
                                fontSize: '0.72rem',
                                background: typeInfo.bg,
                                color: typeInfo.color,
                                fontWeight: 600,
                              }}
                            >
                              {typeInfo.label}
                            </span>
                            {service.roomNumber && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                                ({service.roomNumber})
                              </span>
                            )}
                            {isAlreadyOrdered && (
                              <span className="badge" style={{ fontSize: '0.7rem', background: '#e2e8f0', color: '#475569' }}>
                                Đã chỉ định trước đó
                              </span>
                            )}
                          </div>

                          {service.description && (
                            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                              {service.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Price */}
                      <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '0.925rem', fontWeight: 800, color: 'var(--gray-900)' }}>
                          {Number(service.price || 0).toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                    </div>

                    {/* Ghi chú khi đã chọn */}
                    {isSelected && (
                      <div
                        style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed #ddd6fe' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Nhập ghi chú hoặc yêu cầu cụ thể (vd: Chụp cận chóp răng 36, xét nghiệm trước phẫu thuật...)"
                          value={selectedServices[service.id]?.note || ''}
                          onChange={(e) => handleUpdateNote(service.id, e.target.value)}
                          style={{ fontSize: '0.825rem', height: 34, background: '#ffffff' }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="modal-footer"
          style={{
            padding: '14px 24px',
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>
              Đã chọn: <strong style={{ color: 'var(--doctor-accent)' }}>{selectedCount}</strong> dịch vụ
              {selectedCount > 0 && (
                <span style={{ marginLeft: 8 }}>
                  (Tạm tính: <strong>{totalCost.toLocaleString('vi-VN')} đ</strong>)
                </span>
              )}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={onClose} disabled={submitting}>
              Hủy
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleSubmit}
              disabled={submitting || selectedCount === 0}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontWeight: 700,
                background: 'var(--doctor-accent)',
                borderColor: 'var(--doctor-accent)',
                minWidth: 160,
              }}
            >
              {submitting ? (
                <>
                  <Loader size={14} className="spin-slow" />
                  <span>Đang chỉ định...</span>
                </>
              ) : (
                <>
                  <Plus size={14} />
                  <span>Xác nhận chỉ định ({selectedCount})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

