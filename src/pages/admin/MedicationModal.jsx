import { useState, useEffect } from 'react';
import { X, Pill, FileText, AlertCircle } from 'lucide-react';
import { clinicService } from '../../services/clinicService';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils/errorMessage';

export default function MedicationModal({ medication, onClose, onSaved }) {
  const toast = useToast();
  const isEditing = Boolean(medication?.id);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    strength: '',
    dosageForm: 'Viên nén',
    unit: 'Viên',
    description: '',
    active: true,
  });

  useEffect(() => {
    if (medication) {
      setForm({
        name: medication.name || '',
        strength: medication.strength || '',
        dosageForm: medication.dosageForm || 'Viên nén',
        unit: medication.unit || 'Viên',
        description: medication.description || '',
        active: medication.active ?? true,
      });
    }
  }, [medication]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Vui lòng nhập tên thuốc / biệt dược');
      return;
    }
    if (!form.strength.trim()) {
      setError('Vui lòng nhập hàm lượng / nồng độ (ví dụ: 500mg, 625mg)');
      return;
    }
    if (!form.dosageForm.trim()) {
      setError('Vui lòng nhập dạng bào chế (ví dụ: Viên nén, Dung dịch...)');
      return;
    }
    if (!form.unit.trim()) {
      setError('Vui lòng nhập đơn vị tính (ví dụ: Viên, Chai, Gói...)');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        strength: form.strength.trim(),
        dosageForm: form.dosageForm.trim(),
        unit: form.unit.trim(),
        description: form.description.trim() || undefined,
        active: form.active,
      };

      if (isEditing) {
        await clinicService.updateMedication(medication.id, payload);
        toast.success('Cập nhật thông tin thuốc thành công!');
      } else {
        await clinicService.createMedication(payload);
        toast.success('Thêm thuốc mới vào danh mục thành công!');
      }
      onSaved?.();
    } catch (err) {
      setError(getErrorMessage(err, isEditing ? 'Cập nhật thuốc thất bại' : 'Thêm thuốc thất bại'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
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
              <Pill size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>
                {isEditing ? `Chỉnh sửa thuốc #${medication.id}` : 'Thêm thuốc mới vào danh mục'}
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                {isEditing ? 'Cập nhật hàm lượng, dạng bào chế và hướng dẫn sử dụng' : 'Khai báo thuốc phục vụ Bác sĩ kê đơn'}
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
            {/* Tên thuốc */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 600 }}>Tên thuốc / Biệt dược *</label>
              <input
                type="text"
                className="form-input"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Ví dụ: Augmentin, Panadol Extra, Nước súc miệng Kin..."
                required
              />
            </div>

            {/* Hàm lượng & Dạng bào chế */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Hàm lượng / Nồng độ *</label>
                <input
                  type="text"
                  className="form-input"
                  name="strength"
                  value={form.strength}
                  onChange={handleChange}
                  placeholder="Ví dụ: 625mg, 500mg, 0.12%..."
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Dạng bào chế *</label>
                <input
                  type="text"
                  className="form-input"
                  name="dosageForm"
                  value={form.dosageForm}
                  onChange={handleChange}
                  placeholder="Viên nén, Dung dịch, Gel..."
                  required
                />
              </div>
            </div>

            {/* Đơn vị tính */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 600 }}>Đơn vị tính xuất kho *</label>
              <input
                type="text"
                className="form-input"
                name="unit"
                value={form.unit}
                onChange={handleChange}
                placeholder="Ví dụ: Viên, Chai 250ml, Tuýp 10g, Gói..."
                required
              />
            </div>

            {/* Mô tả / Chỉ định */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                <FileText size={14} color="#7c3aed" />
                <span>Mô tả & Hướng dẫn sử dụng</span>
              </label>
              <textarea
                className="form-input"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                placeholder="Chỉ định lâm sàng: Giảm đau răng, kháng viêm, sát khuẩn khoang miệng..."
                style={{ resize: 'vertical' }}
              />
            </div>

            {/* Trạng thái sử dụng (Cần gạt) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--gray-800)' }}>
                  Trạng thái lưu hành thuốc
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)', marginTop: 2 }}>
                  {form.active ? 'Thuốc đang sẵn sàng (Bác sĩ có thể kê đơn)' : 'Tạm ngưng sử dụng loại thuốc này'}
                </div>
              </div>
              <label className="switch-control" htmlFor="activeMedSwitch">
                <input
                  type="checkbox"
                  id="activeMedSwitch"
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
                <span>{submitting ? 'Đang lưu...' : isEditing ? 'Lưu thay đổi' : 'Thêm thuốc'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

