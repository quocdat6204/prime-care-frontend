import { useState, useEffect } from 'react';
import { X, Calendar, Clock, DollarSign, Users, User, AlertCircle } from 'lucide-react';
import { clinicService } from '../../services/clinicService';
import { userService } from '../../services/userService';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils/errorMessage';
import { formatDoctorRank } from '../../utils/doctorRank';

export default function CreateSessionModal({ onClose, onCreated }) {
  const toast = useToast();
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Default date = tomorrow in YYYY-MM-DD
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().split('T')[0];

  const [form, setForm] = useState({
    doctorId: '',
    examDate: defaultDate,
    shift: 'MORNING',
    examinationFee: 150000,
    maxPatients: 12,
  });

  // Load list of doctors to populate dropdown
  useEffect(() => {
    const fetchDoctors = async () => {
      setLoadingDoctors(true);
      try {
        const res = await userService.getUsers({ role: 'DOCTOR', size: 100 });
        const docs = res.data.result?.content || [];
        setDoctors(docs);
        if (docs.length > 0) {
          setForm((prev) => ({ ...prev, doctorId: docs[0].id }));
        }
      } catch (err) {
        toast.error('Không thể tải danh sách bác sĩ');
      } finally {
        setLoadingDoctors(false);
      }
    };
    fetchDoctors();
  }, [toast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'examinationFee' || name === 'maxPatients' || name === 'doctorId' ? Number(value) : value,
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.doctorId) {
      setError('Vui lòng chọn bác sĩ phụ trách ca khám');
      return;
    }
    if (!form.examDate) {
      setError('Vui lòng chọn ngày khám');
      return;
    }
    if (form.maxPatients < 1 || form.maxPatients > 20) {
      setError('Số bệnh nhân tối đa phải từ 1 đến 20 bệnh nhân');
      return;
    }
    if (form.examinationFee < 0) {
      setError('Phí công khám không được âm');
      return;
    }

    setSubmitting(true);
    try {
      await clinicService.createSession(form);
      toast.success('Tạo ca khám bệnh thành công!');
      onCreated?.();
    } catch (err) {
      setError(getErrorMessage(err, 'Không thể tạo ca khám. Bác sĩ có thể đã có ca trực trong khung giờ này.'));
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
              <Calendar size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Phân công ca khám mới</h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                Xếp lịch trực và giới hạn lượng bệnh nhân cho Bác sĩ
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
            {/* 1. Chọn Bác sĩ */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                <User size={14} color="#7c3aed" />
                <span>Bác sĩ phụ trách *</span>
              </label>
              {loadingDoctors ? (
                <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>Đang tải danh sách bác sĩ...</div>
              ) : (
                <select
                  className="form-select"
                  name="doctorId"
                  value={form.doctorId}
                  onChange={handleChange}
                  required
                >
                  {doctors.length === 0 && <option value="">Không có bác sĩ nào</option>}
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.fullName || doc.username} {doc.rank ? `(${formatDoctorRank(doc.rank)})` : ''} - #{doc.id}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* 2. Ngày khám & Ca trực */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                  <Calendar size={14} color="#7c3aed" />
                  <span>Ngày khám *</span>
                </label>
                <input
                  type="date"
                  className="form-input"
                  name="examDate"
                  value={form.examDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                  <Clock size={14} color="#7c3aed" />
                  <span>Ca khám *</span>
                </label>
                <select
                  className="form-select"
                  name="shift"
                  value={form.shift}
                  onChange={handleChange}
                  required
                >
                  <option value="MORNING">Ca Sáng (08:00 - 12:00)</option>
                  <option value="AFTERNOON">Ca Chiều (13:30 - 17:30)</option>
                </select>
              </div>
            </div>

            {/* 3. Phí công khám & Số bệnh nhân tối đa */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                  <DollarSign size={14} color="#7c3aed" />
                  <span>Tiền công khám (VNĐ) *</span>
                </label>
                <input
                  type="number"
                  className="form-input"
                  name="examinationFee"
                  value={form.examinationFee}
                  step={10000}
                  min={0}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                  <Users size={14} color="#7c3aed" />
                  <span>Số BN tối đa (1-20) *</span>
                </label>
                <input
                  type="number"
                  className="form-input"
                  name="maxPatients"
                  value={form.maxPatients}
                  min={1}
                  max={20}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Info hint */}
            <div
              style={{
                fontSize: '0.8rem',
                color: '#6d28d9',
                background: '#faf5ff',
                border: '1px solid #ede9fe',
                borderRadius: 8,
                padding: '10px 14px',
                lineHeight: 1.4,
              }}
            >
              Ca khám sau khi tạo sẽ tự động ở trạng thái <strong>MỞ (OPEN)</strong> để người bệnh có thể nhìn thấy và đặt lịch khám trực tuyến.
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
                <span>{submitting ? 'Đang tạo ca...' : 'Xác nhận tạo ca'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

