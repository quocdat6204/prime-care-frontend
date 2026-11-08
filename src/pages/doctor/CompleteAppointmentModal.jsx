import { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2, Pill, Loader, CheckCircle2, AlertTriangle, FileText, Search, Check } from 'lucide-react';
import { clinicService } from '../../services/clinicService';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils/errorMessage';

export default function CompleteAppointmentModal({ appointmentId, appointment, services = [], onClose, onSuccess, zIndex = 1400 }) {
  const toast = useToast();
  const [catalog, setCatalog] = useState([]);
  const [loadingMeds, setLoadingMeds] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [diagnosis, setDiagnosis] = useState(appointment?.diagnosis || '');
  const [doctorNote, setDoctorNote] = useState(appointment?.doctorNote || '');
  const [prescriptionItems, setPrescriptionItems] = useState([]);

  // Drug picker modal state
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerSelectedIds, setPickerSelectedIds] = useState(new Set());

  // Kiểm tra xem có dịch vụ cận lâm sàng nào chưa hoàn tất không
  const incompleteServices = services.filter(
    (s) => s.status !== 'CANCELLED' && (s.status !== 'COMPLETED' || !s.paidAt)
  );

  useEffect(() => {
    const fetchMedications = async () => {
      setLoadingMeds(true);
      try {
        // Backend quy định param: includeInactive (mặc định false). Bác sĩ chỉ xem các thuốc đang hoạt động (active = true)
        const res = await clinicService.getMedications({ includeInactive: false, size: 200 });
        const list = (res.data.result?.content || []).filter((m) => m.active !== false);
        setCatalog(list);
      } catch (err) {
        toast.error('Không thể tải danh mục thuốc');
      } finally {
        setLoadingMeds(false);
      }
    };
    fetchMedications();
  }, [toast]);

  // Mở bộ chọn thuốc
  const handleOpenPicker = () => {
    // Khởi tạo các ID đã có trong đơn thuốc vào picker
    const currentIds = new Set(prescriptionItems.map((item) => Number(item.medicationId)));
    setPickerSelectedIds(currentIds);
    setPickerSearch('');
    setShowPicker(true);
  };

  // Toggle chọn thuốc trong danh sách
  const togglePickerDrug = (medId) => {
    setPickerSelectedIds((prev) => {
      const copy = new Set(prev);
      if (copy.has(medId)) {
        copy.delete(medId);
      } else {
        copy.add(medId);
      }
      return copy;
    });
  };

  // Xác nhận sau khi tích chọn thuốc từ danh mục
  const handleApplyPickedDrugs = () => {
    const newItems = [];

    // 1. Giữ lại các thuốc đã có trong đơn (nếu vẫn được tích)
    prescriptionItems.forEach((existing) => {
      if (pickerSelectedIds.has(Number(existing.medicationId))) {
        newItems.push(existing);
      }
    });

    // 2. Bổ sung các thuốc mới được tích thêm
    pickerSelectedIds.forEach((id) => {
      const alreadyIn = newItems.some((item) => Number(item.medicationId) === id);
      if (!alreadyIn) {
        const med = catalog.find((m) => m.id === id);
        newItems.push({
          id: Date.now() + Math.random(),
          medicationId: id,
          medicationName: med?.name || 'Thuốc',
          strength: med?.strength || '',
          unit: med?.unit || med?.dosageForm || 'viên',
          quantity: 10,
          dosage: med?.strength ? `1 ${med.dosageForm || 'viên'} (${med.strength})` : '1 viên',
          frequency: '2 lần / ngày (sáng - tối sau ăn)',
          durationDays: 5,
          instruction: 'Uống nhiều nước, uống sau bữa ăn',
        });
      }
    });

    setPrescriptionItems(newItems);
    setShowPicker(false);
  };

  // Xóa một dòng thuốc khỏi đơn
  const handleRemoveItem = (itemId) => {
    setPrescriptionItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  // Cập nhật giá trị một trường của thuốc
  const handleUpdateItem = (itemId, field, value) => {
    setPrescriptionItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, [field]: value } : item))
    );
  };

  // Danh mục thuốc được lọc trong picker
  const filteredCatalog = useMemo(() => {
    if (!pickerSearch.trim()) return catalog;
    const term = pickerSearch.toLowerCase();
    return catalog.filter(
      (m) =>
        m.name?.toLowerCase().includes(term) ||
        m.strength?.toLowerCase().includes(term) ||
        m.description?.toLowerCase().includes(term)
    );
  }, [catalog, pickerSearch]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!diagnosis.trim()) {
      toast.warning('Bác sĩ vui lòng nhập kết quả chẩn đoán bệnh xác định');
      return;
    }

    if (incompleteServices.length > 0) {
      toast.error(
        `Còn ${incompleteServices.length} dịch vụ/thủ thuật chưa hoàn tất hoặc chưa thanh toán. Vui lòng hoàn tất hoặc hủy trước khi chốt buổi khám!`
      );
      return;
    }

    // Validate thuốc
    for (const item of prescriptionItems) {
      if (!item.medicationId) {
        toast.warning('Vui lòng chọn thuốc hợp lệ trong đơn');
        return;
      }
      if (!item.dosage?.trim() || !item.frequency?.trim()) {
        toast.warning(`Vui lòng nhập đầy đủ liều dùng và tần suất cho thuốc ${item.medicationName}`);
        return;
      }
    }

    const payload = {
      diagnosis: diagnosis.trim(),
      doctorNote: doctorNote.trim() || undefined,
      medications: prescriptionItems.map((item) => ({
        medicationId: Number(item.medicationId),
        quantity: Number(item.quantity) || 1,
        dosage: item.dosage.trim(),
        frequency: item.frequency.trim(),
        durationDays: Number(item.durationDays) || 1,
        instruction: item.instruction?.trim() || undefined,
      })),
    };

    setSubmitting(true);
    try {
      await clinicService.completeAppointment(appointmentId, payload);
      toast.success('Đã chốt chẩn đoán, xuất đơn thuốc và hoàn tất buổi khám thành công!');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể hoàn tất ca khám. Vui lòng kiểm tra lại dịch vụ cận lâm sàng!'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="modal-overlay" style={{ zIndex }} onClick={onClose}>
        <div
          className="modal-content"
          style={{
            maxWidth: 860,
            width: '95vw',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            padding: 0,
            overflow: 'hidden',
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
              background: '#ffffff',
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--gray-900)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={22} style={{ color: '#16a34a' }} />
                Chốt Chẩn đoán & Kê Đơn Thuốc
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.825rem', color: 'var(--gray-500)' }}>
                Lịch khám #{appointmentId} - Kết thúc buổi khám và lưu hồ sơ bệnh án
              </p>
            </div>
            <button className="btn btn-icon btn-ghost" onClick={onClose} disabled={submitting}>
              <X size={20} />
            </button>
          </div>

          {/* Warning if incomplete services */}
          {incompleteServices.length > 0 && (
            <div
              style={{
                padding: '12px 24px',
                background: '#fffbeb',
                borderBottom: '1px solid #fef3c7',
                color: '#b45309',
                fontSize: '0.825rem',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <AlertTriangle size={18} style={{ flexShrink: 0 }} />
              <div>
                <strong>Lưu ý quan trọng:</strong> Ca khám này còn <strong>{incompleteServices.length}</strong> dịch vụ / thủ thuật chưa hoàn tất hoặc chưa thanh toán ({incompleteServices.map((s) => s.serviceName).join(', ')}). Bác sĩ cần hoàn tất thủ thuật, chờ phòng xét nghiệm/chụp chiếu gửi kết quả hoặc hủy dịch vụ chưa làm trước khi chốt ca.
              </div>
            </div>
          )}

          {/* Body Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* 1. Phần Chẩn đoán & Lời dặn */}
              <div style={{ background: '#f8fafc', padding: 18, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 14px', fontSize: '0.95rem', fontWeight: 700, color: 'var(--gray-900)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={16} style={{ color: '#7c3aed' }} />
                  <span>Kết luận chuyên môn của Bác sĩ</span>
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: 'var(--gray-800)', marginBottom: 6 }}>
                      Chẩn đoán bệnh xác định *
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Nhập chẩn đoán bệnh xác định (Ví dụ: Viêm nha chu mạn tính độ II, Sâu ngà răng số 46, Viêm tủy răng không hồi phục...)"
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '10px 14px',
                        borderRadius: 8,
                        border: '1px solid #cbd5e1',
                        fontSize: '0.875rem',
                        fontFamily: 'inherit',
                        outline: 'none',
                        resize: 'vertical',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: 'var(--gray-800)', marginBottom: 6 }}>
                      Lời dặn / Ghi chú điều trị của Bác sĩ (Tùy chọn)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Hướng dẫn kiêng khem, chăm sóc răng miệng, thời gian hẹn tái khám..."
                      value={doctorNote}
                      onChange={(e) => setDoctorNote(e.target.value)}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '10px 14px',
                        borderRadius: 8,
                        border: '1px solid #cbd5e1',
                        fontSize: '0.875rem',
                        fontFamily: 'inherit',
                        outline: 'none',
                        resize: 'vertical',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* 2. Phần Đơn thuốc */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--gray-900)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Pill size={18} style={{ color: '#16a34a' }} />
                      <span>Đơn thuốc cấp cho bệnh nhân</span>
                      <span className="badge" style={{ background: '#eff6ff', color: '#1d4ed8', fontWeight: 700, fontSize: '0.75rem', padding: '3px 8px' }}>
                        {prescriptionItems.length} loại thuốc
                      </span>
                    </h4>
                    <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                      Tích chọn thuốc từ danh mục và điền hướng dẫn liều dùng cho từng thuốc
                    </p>
                  </div>

                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={handleOpenPicker}
                    disabled={loadingMeds}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: '#16a34a',
                      borderColor: '#16a34a',
                      fontWeight: 700,
                      padding: '6px 14px',
                    }}
                  >
                    <Plus size={15} />
                    <span>Thêm thuốc vào đơn</span>
                  </button>
                </div>

                {prescriptionItems.length === 0 ? (
                  <div
                    style={{
                      padding: 36,
                      textAlign: 'center',
                      background: '#f8fafc',
                      borderRadius: 12,
                      border: '1px dashed #cbd5e1',
                    }}
                  >
                    <Pill size={36} style={{ color: '#94a3b8', margin: '0 auto 8px', opacity: 0.7 }} />
                    <p style={{ margin: '0 0 4px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--gray-700)' }}>
                      Chưa có thuốc nào trong đơn
                    </p>
                    <p style={{ margin: '0 0 14px', fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                      Nhấn nút bên dưới để mở danh sách thuốc và tích chọn các loại thuốc cần kê
                    </p>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      onClick={handleOpenPicker}
                      disabled={loadingMeds}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600, borderColor: '#86efac', color: '#15803d', background: '#f0fdf4' }}
                    >
                      <Plus size={14} />
                      <span>Chọn thuốc từ danh mục</span>
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {prescriptionItems.map((item, idx) => (
                      <div
                        key={item.id}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderLeft: '4px solid #16a34a',
                          borderRadius: 10,
                          padding: '14px 18px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                        }}
                      >
                        {/* Drug title + Delete */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #f1f5f9' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontWeight: 800, color: '#16a34a', fontSize: '0.85rem' }}>
                              #{idx + 1}
                            </span>
                            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--gray-900)' }}>
                              {item.medicationName}
                            </span>
                            {item.strength && (
                              <span className="badge" style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.72rem' }}>
                                {item.strength}
                              </span>
                            )}
                            <span style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>
                              ({item.unit})
                            </span>
                          </div>

                          <button
                            type="button"
                            className="btn btn-icon btn-ghost btn-sm"
                            onClick={() => handleRemoveItem(item.id)}
                            title="Xóa thuốc này khỏi đơn"
                            style={{ color: '#dc2626' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        {/* Fields grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 10 }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--gray-600)', marginBottom: 4 }}>
                              Số lượng cấp ({item.unit}) *
                            </label>
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) => handleUpdateItem(item.id, 'quantity', e.target.value)}
                              required
                              style={{
                                width: '100%',
                                boxSizing: 'border-box',
                                height: 36,
                                padding: '6px 10px',
                                borderRadius: 6,
                                border: '1px solid #cbd5e1',
                                fontSize: '0.85rem',
                              }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--gray-600)', marginBottom: 4 }}>
                              Số ngày uống *
                            </label>
                            <input
                              type="number"
                              min={1}
                              value={item.durationDays}
                              onChange={(e) => handleUpdateItem(item.id, 'durationDays', e.target.value)}
                              required
                              style={{
                                width: '100%',
                                boxSizing: 'border-box',
                                height: 36,
                                padding: '6px 10px',
                                borderRadius: 6,
                                border: '1px solid #cbd5e1',
                                fontSize: '0.85rem',
                              }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--gray-600)', marginBottom: 4 }}>
                              Liều lượng mỗi lần *
                            </label>
                            <input
                              type="text"
                              value={item.dosage}
                              onChange={(e) => handleUpdateItem(item.id, 'dosage', e.target.value)}
                              placeholder="vd: 1 viên / lần"
                              required
                              style={{
                                width: '100%',
                                boxSizing: 'border-box',
                                height: 36,
                                padding: '6px 10px',
                                borderRadius: 6,
                                border: '1px solid #cbd5e1',
                                fontSize: '0.85rem',
                              }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--gray-600)', marginBottom: 4 }}>
                              Tần suất uống *
                            </label>
                            <input
                              type="text"
                              value={item.frequency}
                              onChange={(e) => handleUpdateItem(item.id, 'frequency', e.target.value)}
                              placeholder="vd: 2 lần / ngày sau ăn"
                              required
                              style={{
                                width: '100%',
                                boxSizing: 'border-box',
                                height: 36,
                                padding: '6px 10px',
                                borderRadius: 6,
                                border: '1px solid #cbd5e1',
                                fontSize: '0.85rem',
                              }}
                            />
                          </div>
                        </div>

                        {/* Note / Instruction */}
                        <div>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--gray-600)', marginBottom: 4 }}>
                            Ghi chú / Hướng dẫn cách dùng cho thuốc này
                          </label>
                          <input
                            type="text"
                            value={item.instruction}
                            onChange={(e) => handleUpdateItem(item.id, 'instruction', e.target.value)}
                            placeholder="vd: Uống sau bữa ăn sáng và tối, uống nhiều nước ấm..."
                            style={{
                              width: '100%',
                              boxSizing: 'border-box',
                              height: 36,
                              padding: '6px 10px',
                              borderRadius: 6,
                              border: '1px solid #cbd5e1',
                              fontSize: '0.85rem',
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
              <span style={{ fontSize: '0.825rem', color: 'var(--gray-600)' }}>
                Đã kê: <strong style={{ color: '#16a34a' }}>{prescriptionItems.length}</strong> loại thuốc
              </span>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn btn-outline btn-sm" onClick={onClose} disabled={submitting}>
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={submitting || incompleteServices.length > 0}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontWeight: 700,
                    background: '#16a34a',
                    borderColor: '#16a34a',
                    padding: '8px 18px',
                  }}
                >
                  {submitting ? (
                    <>
                      <Loader size={14} className="spin-slow" />
                      <span>Đang lưu hồ sơ...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      <span>Chốt & Hoàn tất ca khám</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* SUB-MODAL: BỘ CHỌN THUỐC TỪ DANH MỤC ĐỂ TÍCH CHỌN */}
      {showPicker && (
        <div className="modal-overlay" style={{ zIndex: zIndex + 50 }} onClick={() => setShowPicker(false)}>
          <div
            className="modal-content"
            style={{
              maxWidth: 720,
              width: '90vw',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              padding: 0,
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#ffffff',
              }}
            >
              <div>
                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--gray-900)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Pill size={18} style={{ color: '#16a34a' }} />
                  Tích chọn thuốc vào đơn
                </h4>
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                  Tích chọn một hoặc nhiều loại thuốc để thêm vào đơn điều trị
                </p>
              </div>
              <button className="btn btn-icon btn-ghost" onClick={() => setShowPicker(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Search */}
            <div style={{ padding: '12px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
                <input
                  type="text"
                  placeholder="Tìm kiếm thuốc theo tên, hàm lượng..."
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    height: 38,
                    paddingLeft: 36,
                    paddingRight: 12,
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem',
                  }}
                  autoFocus
                />
              </div>
            </div>

            {/* List with checkboxes */}
            <div style={{ padding: '12px 20px', flex: 1, overflowY: 'auto' }}>
              {filteredCatalog.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
                  Không tìm thấy loại thuốc nào phù hợp với từ khóa
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {filteredCatalog.map((drug) => {
                    const isChecked = pickerSelectedIds.has(drug.id);

                    return (
                      <div
                        key={drug.id}
                        onClick={() => togglePickerDrug(drug.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '10px 14px',
                          borderRadius: 8,
                          border: isChecked ? '1px solid #16a34a' : '1px solid #e2e8f0',
                          background: isChecked ? '#f0fdf4' : '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        {/* Checkbox square */}
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 5,
                            border: isChecked ? 'none' : '2px solid #cbd5e1',
                            background: isChecked ? '#16a34a' : '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {isChecked && <Check size={13} color="#ffffff" strokeWidth={3} />}
                        </div>

                        {/* Drug info */}
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <strong style={{ fontSize: '0.9rem', color: isChecked ? '#15803d' : 'var(--gray-900)' }}>
                              {drug.name}
                            </strong>
                            {drug.strength && (
                              <span className="badge" style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.72rem' }}>
                                {drug.strength}
                              </span>
                            )}
                            <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                              ({drug.unit || drug.dosageForm || 'Đơn vị'})
                            </span>
                          </div>
                          {drug.description && (
                            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--gray-500)' }}>
                              {drug.description}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer of Picker */}
            <div
              style={{
                padding: '12px 20px',
                borderTop: '1px solid #e2e8f0',
                background: '#f8fafc',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '0.825rem', color: 'var(--gray-600)' }}>
                Đã tích chọn: <strong style={{ color: '#16a34a' }}>{pickerSelectedIds.size}</strong> loại thuốc
              </span>

              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn btn-sm btn-outline" onClick={() => setShowPicker(false)}>
                  Hủy
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={handleApplyPickedDrugs}
                  style={{ background: '#16a34a', borderColor: '#16a34a', fontWeight: 700 }}
                >
                  Xác nhận ({pickerSelectedIds.size})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
