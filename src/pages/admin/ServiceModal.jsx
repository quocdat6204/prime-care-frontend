import { useState, useEffect } from 'react';
import { X, Activity, DollarSign, MapPin, FileText, AlertCircle } from 'lucide-react';
import { clinicService } from '../../services/clinicService';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils/errorMessage';

export default function ServiceModal({ service, onClose, onSaved }) {
  const toast = useToast();
  const isEditing = Boolean(service?.id);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    serviceType: 'DENTAL',
    price: 200000,
    roomNumber: '',
    description: '',
    active: true,
  });

  useEffect(() => {
    if (service) {
      setForm({
        name: service.name || '',
        serviceType: service.serviceType || 'DENTAL',
        price: service.price || 0,
        roomNumber: service.roomNumber || '',
        description: service.description || '',
        active: service.active ?? true,
      });
    }
  }, [service]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : name === 'price' ? Number(value) : value,
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Vui lòng nhập tên dịch vụ nha khoa');
      return;
    }
    if (form.price < 0) {
      setError('Giá dịch vụ không được âm');
      return;
    }
    if (!form.roomNumber.trim()) {
      setError('Vui lòng nhập phòng thực hiện');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        serviceType: form.serviceType,
        price: form.price,
        roomNumber: form.roomNumber.trim(),
        description: form.description.trim() || undefined,
        active: form.active,
      };

      if (isEditing) {
        await clinicService.updateService(service.id, payload);
        toast.success('Cập nhật dịch vụ nha khoa thành công!');
      } else {
        await clinicService.createService(payload);
        toast.success('Thêm dịch vụ nha khoa mới thành công!');
      }
      onSaved?.();
    } catch (err) {
      setError(getErrorMessage(err, isEditing ? 'Cập nhật dịch vụ thất bại' : 'Thêm dịch vụ thất bại'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: '#ede9fe',
                color: '#6d28d9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Activity size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>
                {isEditing ? `Chỉnh sửa dịch vụ #${service.id}` : 'Thêm dịch vụ nha khoa mới'}
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                {isEditing ? 'Cập nhật giá, phòng thực hiện và mô tả dịch vụ' : 'Khai báo dịch vụ vào bảng giá phòng khám'}
              </p>
            </div>
          </div>
          <button className="btn btn-icon btn-ghost" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
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

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Tên dịch vụ */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 600 }}>Tên dịch vụ nha khoa *</label>
              <input
                type="text"
                className="form-input"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Ví dụ: Cạo vôi răng & Đánh bóng 2 hàm, Nhổ răng khôn..."
                required
              />
            </div>

            {/* Loại dịch vụ & Giá */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Loại dịch vụ *</label>
                <select
                  className="form-select"
                  name="serviceType"
                  value={form.serviceType}
                  onChange={handleChange}
                  required
                >
                  <option value="DENTAL">Nha khoa điều trị (DENTAL)</option>
                  <option value="IMAGING">Chẩn đoán hình ảnh (IMAGING)</option>
                  <option value="LAB_TEST">Xét nghiệm (LAB_TEST)</option>
                  <option value="OTHER">Dịch vụ khác (OTHER)</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <DollarSign size={14} color="#7c3aed" />
                  <span>Đơn giá (VNĐ) *</span>
                </label>
                <input
                  type="number"
                  className="form-input"
                  name="price"
                  value={form.price}
                  step={10000}
                  min={0}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Phòng thực hiện */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={14} color="#7c3aed" />
                <span>Phòng / Ghế thực hiện *</span>
              </label>
              <input
                type="text"
                className="form-input"
                name="roomNumber"
                value={form.roomNumber}
                onChange={handleChange}
                placeholder="Ví dụ: Phòng P.201 - Ghế nha 03, Phòng X-Quang P.102..."
                required
              />
            </div>

            {/* Mô tả chi tiết */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                <FileText size={14} color="#7c3aed" />
                <span>Mô tả dịch vụ</span>
              </label>
              <textarea
                className="form-input"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                placeholder="Mô tả kỹ thuật, chỉ định lâm sàng, vật liệu sử dụng..."
                style={{ resize: 'vertical' }}
              />
            </div>

            {/* Trạng thái hoạt động (Cần gạt) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--gray-800)' }}>
                  Trạng thái kích hoạt dịch vụ
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)', marginTop: 2 }}>
                  {form.active ? 'Dịch vụ đang hoạt động (Bác sĩ có thể chỉ định)' : 'Tạm ngưng cung cấp dịch vụ này'}
                </div>
              </div>
              <label className="switch-control" htmlFor="activeSwitch">
                <input
                  type="checkbox"
                  id="activeSwitch"
                  name="active"
                  checked={form.active}
                  onChange={handleChange}
                />
                <span className="switch-slider" />
              </label>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting}>
                Hủy
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
                style={{
                  background: '#7c3aed',
                  borderColor: '#7c3aed',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {submitting ? <span className="spinner spinner-sm" style={{ borderTopColor: '#fff' }} /> : null}
                <span>{submitting ? 'Đang lưu...' : isEditing ? 'Lưu thay đổi' : 'Thêm dịch vụ'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

