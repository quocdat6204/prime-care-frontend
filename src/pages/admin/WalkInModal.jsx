import { useState, useEffect, useRef } from 'react';
import {
  X, Search, User, Phone, CheckCircle2, AlertTriangle,
  Banknote, Calendar, Clock, Stethoscope, UserCheck, Loader2
} from 'lucide-react';
import { clinicService } from '../../services/clinicService';
import { userService } from '../../services/userService';
import { useToast } from '../../context/ToastContext';
import { formatDoctorRank } from '../../utils/doctorRank';

export default function WalkInModal({ session, onClose, onSuccess, zIndex = 1500 }) {
  const toast = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [patients, setPatients] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [symptoms, setSymptoms] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const searchTimeoutRef = useRef(null);

  // Tìm kiếm bệnh nhân theo từ khóa (họ tên, sđt, email, username)
  const searchPatients = async (query = '') => {
    setSearching(true);
    try {
      const params = { size: 15 };
      if (query && query.trim().length > 0) {
        params.keyword = query.trim();
      }
      // Tìm kiếm người dùng trong hệ thống (lọc role PATIENT hoặc USER nếu có)
      const res = await userService.getUsers(params);
      const list = res.data?.result?.content || res.data?.result || [];
      // Lọc bỏ bác sĩ và admin, chỉ giữ lại bệnh nhân / người dùng thông thường
      const patientOnly = list.filter((u) => u.role === 'PATIENT' || u.role === 'USER' || !u.role);
      setPatients(patientOnly.length > 0 ? patientOnly : list);
      setHasSearched(true);
    } catch (err) {
      console.error('Lỗi tìm kiếm bệnh nhân:', err);
      toast.error('Không thể tìm kiếm bệnh nhân');
    } finally {
      setSearching(false);
    }
  };

  // Tự động load một số bệnh nhân ban đầu khi mở modal
  useEffect(() => {
    searchPatients('');
  }, []);

  // Debounce search khi người dùng gõ từ khóa
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchPatients(val);
    }, 350);
  };

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
  };

  const handleDeselectPatient = () => {
    setSelectedPatient(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatient) {
      toast.error('Vui lòng chọn bệnh nhân');
      return;
    }

    if (!session?.id) {
      toast.error('Không tìm thấy thông tin ca khám');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        patientId: selectedPatient.id,
        symptoms: symptoms.trim() || undefined,
      };

      const res = await clinicService.walkInAppointment(session.id, payload);
      const appointment = res.data?.result;

      toast.success(
        `Đã tiếp nhận bệnh nhân ${selectedPatient.fullName || selectedPatient.id} thành công! Số thứ tự: #${appointment?.queueNumber || 'Mới'}`
      );
      if (onSuccess) {
        onSuccess(appointment);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Tiếp nhận bệnh nhân thất bại';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const fee = Number(session?.examinationFee || 0);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: zIndex,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          maxWidth: 680,
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'modalSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                }}
              >
                <UserCheck size={18} />
              </span>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#065f46' }}>
                Tiếp nhận bệnh nhân tại quầy
              </h2>
            </div>
            <p style={{ margin: '4px 0 0 40px', fontSize: '0.85rem', color: '#047857' }}>
              Đăng ký khám trực tiếp cho bệnh nhân đã có tài khoản | Tự động thu tiền mặt & cấp STT
            </p>
          </div>
          <button
            type="button"
            className="btn btn-icon btn-ghost"
            onClick={onClose}
            style={{ color: '#065f46' }}
            title="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: 24, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Thông tin ca khám tóm tắt */}
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 12,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 12,
              fontSize: '0.85rem',
            }}
          >
            <div>
              <span style={{ color: 'var(--gray-500)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>
                Ca khám & Bác sĩ
              </span>
              <div style={{ fontWeight: 700, color: '#1e293b', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Stethoscope size={14} color="#6d28d9" />
                <span>
                  {session?.doctorRank ? `${formatDoctorRank(session.doctorRank)} ` : ''}
                  {session?.doctorName || `Bác sĩ #${session?.doctorId}`}
                </span>
              </div>
            </div>

            <div>
              <span style={{ color: 'var(--gray-500)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>
                Thời gian
              </span>
              <div style={{ fontWeight: 700, color: '#1e293b', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={14} color="#2563eb" />
                <span>{session?.examDate}</span>
                <span style={{ color: 'var(--gray-400)' }}>•</span>
                <span>{session?.shift === 'MORNING' ? 'Sáng' : 'Chiều'}</span>
              </div>
            </div>

            <div>
              <span style={{ color: 'var(--gray-500)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>
                Phí khám trực tiếp
              </span>
              <div style={{ fontWeight: 800, color: '#059669', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Banknote size={15} color="#059669" />
                <span>{fee.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>
          </div>

          {/* Banner Overbooking / Hết chỗ */}
          {session?.availableSlots !== undefined && session.availableSlots <= 0 && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                background: '#fffbeb',
                border: '1px solid #fde68a',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: '0.825rem',
                color: '#92400e',
              }}
            >
              <AlertTriangle size={18} color="#d97706" style={{ flexShrink: 0 }} />
              <div>
                <strong>Ca khám đã hết lượt đặt trực tuyến.</strong> Hệ thống hỗ trợ tiếp nhận bổ sung tại quầy
                (Overbooking) và tự động cấp số thứ tự tiếp theo cho bệnh nhân.
              </div>
            </div>
          )}

          {/* BƯỚC 1: Chọn bệnh nhân */}
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', marginBottom: 8, color: '#1e293b' }}>
              1. Chọn bệnh nhân khám <span style={{ color: '#dc2626' }}>*</span>
            </label>

            {/* Nếu đã chọn bệnh nhân */}
            {selectedPatient ? (
              <div
                style={{
                  padding: 14,
                  borderRadius: 12,
                  background: '#f0fdf4',
                  border: '1.5px solid #86efac',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: '50%',
                      background: '#dcfce7',
                      color: '#15803d',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1rem',
                    }}
                  >
                    {selectedPatient.fullName ? selectedPatient.fullName.charAt(0).toUpperCase() : 'BN'}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <strong style={{ fontSize: '0.95rem', color: '#14532d' }}>
                        {selectedPatient.fullName || `Bệnh nhân #${selectedPatient.id}`}
                      </strong>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          background: '#bbf7d0',
                          color: '#166534',
                          padding: '1px 8px',
                          borderRadius: 6,
                          fontWeight: 700,
                        }}
                      >
                        Mã BN #{selectedPatient.id}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#166534', marginTop: 2, display: 'flex', gap: 12 }}>
                      {selectedPatient.phone && <span>SĐT: {selectedPatient.phone}</span>}
                      {selectedPatient.gender && <span>Giới tính: {selectedPatient.gender === 'MALE' ? 'Nam' : selectedPatient.gender === 'FEMALE' ? 'Nữ' : selectedPatient.gender}</span>}
                      {selectedPatient.email && <span>Email: {selectedPatient.email}</span>}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={handleDeselectPatient}
                  style={{ borderColor: '#86efac', color: '#166534', fontSize: '0.75rem', fontWeight: 600 }}
                >
                  Đổi bệnh nhân khác
                </button>
              </div>
            ) : (
              /* Ô tìm kiếm bệnh nhân */
              <div>
                <div style={{ position: 'relative', marginBottom: 10 }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Nhập tên, số điện thoại hoặc email bệnh nhân để tìm kiếm..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    style={{
                      paddingLeft: 38,
                      paddingRight: searching ? 38 : 12,
                      borderRadius: 10,
                      borderColor: '#cbd5e1',
                      fontSize: '0.875rem',
                      height: 42,
                    }}
                    autoFocus
                  />
                  <Search
                    size={18}
                    style={{
                      position: 'absolute',
                      left: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--gray-400)',
                    }}
                  />
                  {searching && (
                    <div
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                      }}
                    >
                      <Loader2 size={16} className="spin-slow" color="#059669" />
                    </div>
                  )}
                </div>

                {/* Danh sách kết quả tìm kiếm */}
                <div
                  style={{
                    maxHeight: 220,
                    overflowY: 'auto',
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                    background: '#ffffff',
                  }}
                >
                  {patients.length === 0 ? (
                    <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--gray-500)', fontSize: '0.85rem' }}>
                      {hasSearched
                        ? 'Không tìm thấy bệnh nhân nào phù hợp với từ khóa'
                        : 'Đang tải danh sách bệnh nhân...'}
                    </div>
                  ) : (
                    patients.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => handleSelectPatient(p)}
                        style={{
                          padding: '10px 14px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          borderBottom: '1px solid #f1f5f9',
                          cursor: 'pointer',
                          transition: 'background-color 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f8fafc';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <strong style={{ fontSize: '0.875rem', color: '#1e293b' }}>
                              {p.fullName || `Tài khoản #${p.id}`}
                            </strong>
                            <span style={{ fontSize: '0.72rem', color: 'var(--gray-400)' }}>#{p.id}</span>
                            {p.gender && (
                              <span
                                style={{
                                  fontSize: '0.7rem',
                                  padding: '1px 6px',
                                  borderRadius: 4,
                                  background: '#f1f5f9',
                                  color: 'var(--gray-600)',
                                }}
                              >
                                {p.gender === 'MALE' ? 'Nam' : p.gender === 'FEMALE' ? 'Nữ' : p.gender}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)', marginTop: 2, display: 'flex', gap: 12 }}>
                            {p.phone && <span>SĐT: {p.phone}</span>}
                            {p.email && <span>Email: {p.email}</span>}
                          </div>
                        </div>

                        <button
                          type="button"
                          className="btn btn-sm btn-outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectPatient(p);
                          }}
                          style={{
                            fontSize: '0.75rem',
                            padding: '4px 10px',
                            borderColor: '#10b981',
                            color: '#059669',
                            fontWeight: 600,
                          }}
                        >
                          Chọn
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* BƯỚC 2: Triệu chứng / Lý do khám */}
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', marginBottom: 6, color: '#1e293b' }}>
              2. Triệu chứng ban đầu / Lý do khám (Tùy chọn)
            </label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="VD: Đau nhức răng hàm dưới bên phải, chảy máu chân răng khi đánh răng..."
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              style={{
                borderRadius: 10,
                borderColor: '#cbd5e1',
                fontSize: '0.875rem',
                resize: 'vertical',
              }}
              maxLength={2000}
            />
          </div>

          {/* Quy trình xử lý tự động thông báo cho Lễ tân */}
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 10,
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              fontSize: '0.8rem',
              color: '#166534',
            }}
          >
            <Banknote size={18} color="#16a34a" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong>Quy trình thu tiền & cấp số tự động:</strong>
              <div style={{ marginTop: 2 }}>
                Khi ấn "Xác nhận", hệ thống sẽ lập hóa đơn tiền mặt cho phí khám ({fee.toLocaleString('vi-VN')} đ),
                đánh dấu <strong>ĐÃ THANH TOÁN (CASH)</strong>, cấp ngay <strong>Số thứ tự (STT)</strong> và đưa lịch hẹn vào danh sách
                <strong> ĐÃ XÁC NHẬN</strong> để bác sĩ sẵn sàng khám.
              </div>
            </div>
          </div>
        </div>

        {/* Footer Modal */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <button
            type="button"
            className="btn btn-outline"
            onClick={onClose}
            disabled={submitting}
            style={{ fontWeight: 600 }}
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={!selectedPatient || submitting}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              borderColor: '#059669',
              fontWeight: 700,
              padding: '8px 20px',
              boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
            }}
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="spin-slow" />
                <span>Đang tiếp nhận...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>Xác nhận tiếp nhận tại quầy</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

