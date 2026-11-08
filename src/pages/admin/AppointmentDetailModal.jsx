import { useState, useEffect, useRef } from 'react';
import {
  X, Calendar, Clock, User, Stethoscope, FileText, Pill, Receipt,
  Upload, ExternalLink, CheckCircle2, AlertCircle, RefreshCw, Eye,
  CreditCard, Loader, ChevronRight, FileCheck, AlertTriangle, Play,
  Plus, Trash2, Phone, Mail, MapPin, UserCheck, Banknote
} from 'lucide-react';
import { clinicService } from '../../services/clinicService';
import { paymentService } from '../../services/paymentService';
import { userService } from '../../services/userService';
import { uploadFile } from '../../services/supabaseService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../utils/errorMessage';
import { formatDoctorRank } from '../../utils/doctorRank';
import InvoiceTransactionsModal from './InvoiceTransactionsModal';
import OrderServicesModal from '../doctor/OrderServicesModal';
import CompleteAppointmentModal from '../doctor/CompleteAppointmentModal';

const statusMap = {
  PENDING_PAYMENT: { label: 'Chờ thanh toán', color: '#f59e0b', bg: '#fef3c7' },
  CONFIRMED: { label: 'Đã xác nhận', color: '#2563eb', bg: '#dbeafe' },
  EXAMINING: { label: 'Đang khám', color: '#7c3aed', bg: '#ede9fe' },
  COMPLETED: { label: 'Đã hoàn tất', color: '#16a34a', bg: '#dcfce7' },
  CANCELLED: { label: 'Đã hủy', color: '#dc2626', bg: '#fee2e2' },
  EXPIRED: { label: 'Hết hạn', color: '#6b7280', bg: '#f3f4f6' },
};

const serviceStatusMap = {
  ORDERED: { label: 'Đã chỉ định', color: '#f59e0b', bg: '#fef3c7' },
  IN_PROGRESS: { label: 'Đang thực hiện', color: '#7c3aed', bg: '#ede9fe' },
  COMPLETED: { label: 'Đã có kết quả', color: '#16a34a', bg: '#dcfce7' },
  CANCELLED: { label: 'Đã hủy', color: '#dc2626', bg: '#fee2e2' },
};

const invoiceStatusMap = {
  PENDING: { label: 'Chờ thanh toán', color: '#f59e0b', bg: '#fef3c7' },
  PAID: { label: 'Đã thanh toán', color: '#16a34a', bg: '#dcfce7' },
  CANCELLED: { label: 'Đã hủy', color: '#dc2626', bg: '#fee2e2' },
};

export default function AppointmentDetailModal({ appointmentId, onClose, onRefreshParent, zIndex = 1300 }) {
  const toast = useToast();
  const { role, user } = useAuth();
  const isDoctor = role === 'DOCTOR';
  const isAdmin = role === 'ADMIN';

  const [activeTab, setActiveTab] = useState('services'); // 'services' | 'medications' | 'invoices'
  const [detail, setDetail] = useState(null);
  const [patientInfo, setPatientInfo] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  // Doctor modals & actions
  const [showOrderServicesModal, setShowOrderServicesModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [startingAppointment, setStartingAppointment] = useState(false);
  const [cancellingServiceId, setCancellingServiceId] = useState(null);
  
  // Starting service state (Admin / Doctor)
  const [startingServiceId, setStartingServiceId] = useState(null);

  // Upload PDF state (Admin)
  const [uploadingServiceId, setUploadingServiceId] = useState(null);
  const [selectedServiceForUpload, setSelectedServiceForUpload] = useState(null);
  const [notePrompt, setNotePrompt] = useState('');
  const [pendingFile, setPendingFile] = useState(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const fileInputRef = useRef(null);

  // View transactions of an invoice
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Cash payment state (Admin)
  const [showCashPaymentModal, setShowCashPaymentModal] = useState(false);
  const [payingCash, setPayingCash] = useState(false);
  const [reconciling, setReconciling] = useState(false);

  const apt = detail?.appointment || {};
  const session = detail?.session || {};
  const services = detail?.services || [];
  const medications = detail?.medications || [];

  // Lọc các dịch vụ đã chỉ định nhưng chưa thanh toán
  const unpaidServices = services.filter((s) => s.status === 'ORDERED' && !s.paidAt);
  const totalUnpaidAmount = unpaidServices.reduce((sum, s) => sum + (Number(s.unitPrice) || 0), 0);

  // Bác sĩ phụ trách ca khám
  const isAssignedDoctor = isDoctor && (
    (session?.doctorId != null && String(user?.id) === String(session?.doctorId)) ||
    (apt?.doctorId != null && String(user?.id) === String(apt?.doctorId)) ||
    !session?.doctorId
  );

  // Quyền quản lý thủ thuật nha khoa / điều trị tại chỗ (DENTAL, OTHER): Bác sĩ phụ trách hoặc Admin
  const canManageProcedure = (isAssignedDoctor || isAdmin) && apt?.status === 'EXAMINING';

  // Quyền quản lý cận lâm sàng (LAB_TEST, IMAGING): Chỉ Admin / Kỹ thuật viên
  const canManageParaclinical = isAdmin && apt?.status === 'EXAMINING';

  const fetchDetail = async () => {
    if (!appointmentId) return;
    setLoading(true);
    try {
      const res = await clinicService.getAppointmentDetail(appointmentId);
      setDetail(res.data.result);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tải thông tin chi tiết lịch khám'));
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    if (!appointmentId) return;
    setLoadingInvoices(true);
    try {
      const res = await paymentService.getInvoicesByAppointment(appointmentId);
      setInvoices(res.data.result || []);
    } catch (err) {
      console.warn('Lỗi tải hóa đơn:', err);
    } finally {
      setLoadingInvoices(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    fetchInvoices();
  }, [appointmentId]);

  useEffect(() => {
    if (apt?.patientId) {
      if (apt.patientName && apt.patientPhone) {
        setPatientInfo({
          fullName: apt.patientName,
          phone: apt.patientPhone,
          email: apt.patientEmail,
          gender: apt.patientGender,
          address: apt.patientAddress,
          avatar: apt.patientAvatar,
        });
      } else {
        userService
          .getUserById(apt.patientId)
          .then((res) => {
            const u = res.data?.result || res.data;
            if (u) setPatientInfo(u);
          })
          .catch((err) => {
            console.warn('Could not load patient info:', err);
          });
      }
    }
  }, [apt?.patientId, apt?.patientName]);

  // Handle Start Service (ORDERED -> IN_PROGRESS)
  const handleStartService = async (service) => {
    if (apt?.status !== 'EXAMINING') {
      toast.warning('Chỉ có thể bắt đầu dịch vụ khi ca khám đang ở trạng thái ĐANG KHÁM');
      return;
    }
    if (service.status !== 'ORDERED') {
      toast.warning('Chỉ có dịch vụ ở trạng thái ĐÃ CHỈ ĐỊNH mới có thể bắt đầu thực hiện');
      return;
    }
    if (!service.paidAt) {
      toast.warning(`Dịch vụ "${service.serviceName}" chưa được thanh toán! Bệnh nhân cần thanh toán hóa đơn dịch vụ trước khi tiếp nhận.`);
      return;
    }
    setStartingServiceId(service.id);
    try {
      await clinicService.startAppointmentService(service.id);
      toast.success(
        isLabOrImaging(service)
          ? `Dịch vụ "${service.serviceName}" đã chuyển sang trạng thái Đang thực hiện!`
          : `Bác sĩ đã bắt đầu thực hiện thủ thuật "${service.serviceName}"!`
      );
      fetchDetail();
      onRefreshParent?.();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể bắt đầu thực hiện dịch vụ. Lưu ý dịch vụ phải được thanh toán trước!'));
    } finally {
      setStartingServiceId(null);
    }
  };

  // Bác sĩ tiếp nhận ca khám (CONFIRMED -> EXAMINING)
  const handleStartAppointment = async () => {
    setStartingAppointment(true);
    try {
      await clinicService.startAppointment(appointmentId);
      toast.success('Bác sĩ đã tiếp nhận bệnh nhân thành công! Ca khám chuyển sang ĐANG KHÁM.');
      fetchDetail();
      onRefreshParent?.();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tiếp nhận bệnh nhân vào khám'));
    } finally {
      setStartingAppointment(false);
    }
  };

  // Bác sĩ hủy dịch vụ đã chỉ định (khi chưa thanh toán)
  const handleCancelService = async (service) => {
    if (!window.confirm(`Bạn có chắc chắn muốn hủy chỉ định dịch vụ "${service.serviceName}" không?`)) {
      return;
    }
    setCancellingServiceId(service.id);
    try {
      await clinicService.cancelAppointmentService(service.id);
      toast.success(`Đã hủy chỉ định dịch vụ "${service.serviceName}" thành công!`);
      fetchDetail();
      onRefreshParent?.();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể hủy chỉ định dịch vụ này'));
    } finally {
      setCancellingServiceId(null);
    }
  };

  // Quản trị viên thu tiền mặt tại quầy cho các dịch vụ chỉ định
  const handleConfirmCashPayment = async () => {
    if (unpaidServices.length === 0) {
      toast.warning('Không có dịch vụ nào cần thanh toán.');
      return;
    }
    setPayingCash(true);
    try {
      await paymentService.payWithCash({
        appointmentId: apt.id,
        type: 'SERVICES',
        serviceItemIds: unpaidServices.map((s) => s.id),
      });
      toast.success(
        `Đã thu tiền mặt thành công ${Number(totalUnpaidAmount).toLocaleString('vi-VN')} đ cho ${unpaidServices.length} dịch vụ!`
      );
      setShowCashPaymentModal(false);
      fetchDetail();
      fetchInvoices();
      onRefreshParent?.();
      setTimeout(() => {
        fetchDetail();
        fetchInvoices();
        onRefreshParent?.();
      }, 500);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Thanh toán tiền mặt thất bại. Vui lòng kiểm tra lại!'));
    } finally {
      setPayingCash(false);
    }
  };

  // Đồng bộ bù hóa đơn tiền mặt cho phí khám nếu trước đó payment-service bị gián đoạn
  const handleReconcileInvoice = async () => {
    setReconciling(true);
    try {
      const res = await clinicService.reconcileCashInvoice(appointmentId);
      if (res.data?.result) {
        toast.success(`Đã đồng bộ bù hóa đơn tiền mặt thành công! (Mã HĐ: #${res.data.result})`);
        await fetchDetail();
        await fetchInvoices();
        onRefreshParent?.();
      } else {
        toast.info('Lịch hẹn này không có phí khám hoặc đã có hóa đơn rồi.');
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Đồng bộ hóa đơn thất bại. Hệ thống sẽ tự động quét và thử lại sau.'));
    } finally {
      setReconciling(false);
    }
  };

  // Helper check whether service requires mandatory lab/imaging result file
  const isLabOrImaging = (srv) => srv?.serviceType === 'LAB_TEST' || srv?.serviceType === 'IMAGING';

  // Handle PDF file selection (Allowed when IN_PROGRESS or COMPLETED)
  const handleTriggerUpload = (service) => {
    if (apt?.status !== 'EXAMINING') {
      toast.warning('Chỉ có thể tải lên kết quả khi ca khám đang ở trạng thái ĐANG KHÁM');
      return;
    }
    if (service.status === 'CANCELLED') {
      toast.error('Dịch vụ này đã bị hủy, không thể tải lên kết quả');
      return;
    }
    if (service.status !== 'IN_PROGRESS' && service.status !== 'COMPLETED') {
      toast.warning('Dịch vụ cần được tiếp nhận "Bắt đầu thực hiện" (IN_PROGRESS) trước khi tải lên kết quả');
      return;
    }
    setSelectedServiceForUpload(service);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // Handle complete for dental / procedural services (no mandatory file)
  const handleTriggerCompleteProcedure = (service) => {
    if (apt?.status !== 'EXAMINING') {
      toast.warning('Chỉ có thể hoàn tất dịch vụ khi ca khám đang ở trạng thái ĐANG KHÁM');
      return;
    }
    if (service.status === 'CANCELLED') {
      toast.error('Dịch vụ này đã bị hủy, không thể thao tác');
      return;
    }
    if (service.status !== 'IN_PROGRESS' && service.status !== 'COMPLETED') {
      toast.warning('Dịch vụ cần được tiếp nhận "Bắt đầu thực hiện" (IN_PROGRESS) trước khi hoàn tất');
      return;
    }
    setSelectedServiceForUpload(service);
    setPendingFile(null);
    setNotePrompt(service.note || `Đã hoàn tất thủ thuật ${service.serviceName || ''}`);
    setShowNoteModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate PDF
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      toast.error('Chỉ chấp nhận file định dạng PDF (*.pdf)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Kích thước file PDF không được vượt quá 10MB');
      return;
    }

    setPendingFile(file);
    if (!notePrompt) {
      setNotePrompt(selectedServiceForUpload?.note || `Kết quả dịch vụ ${selectedServiceForUpload?.serviceName || ''}`);
    }
    setShowNoteModal(true);
  };

  const handleConfirmUpload = async () => {
    if (!selectedServiceForUpload) return;
    const service = selectedServiceForUpload;
    const needsFile = isLabOrImaging(service);

    if (needsFile && !pendingFile && !service.resultUrl) {
      toast.error('Dịch vụ xét nghiệm hoặc chẩn đoán hình ảnh bắt buộc phải có file PDF kết quả!');
      return;
    }

    setUploadingServiceId(service.id);
    setShowNoteModal(false);

    try {
      let publicUrl = service.resultUrl || undefined;

      // 1. Upload to Supabase if new file was selected
      if (pendingFile) {
        toast.info('Đang tải file PDF lên kho lưu trữ Supabase (results)...');
        publicUrl = await uploadFile(pendingFile, 'results');
      }

      // 2. Complete service with resultUrl (optional for DENTAL) & note
      await clinicService.completeAppointmentService(service.id, {
        resultUrl: publicUrl,
        note: notePrompt.trim() || undefined,
      });

      toast.success(
        service.status === 'COMPLETED'
          ? 'Đã cập nhật dịch vụ thành công!'
          : 'Đã hoàn tất dịch vụ thành công!'
      );
      fetchDetail();
      onRefreshParent?.();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Hoàn tất dịch vụ thất bại. Vui lòng kiểm tra lại trạng thái dịch vụ hoặc quyền hạn!'));
    } finally {
      setUploadingServiceId(null);
      setPendingFile(null);
      setSelectedServiceForUpload(null);
    }
  };

  if (!appointmentId) return null;

  const statusInfo = statusMap[apt.status] || { label: apt.status, color: '#475569', bg: '#f1f5f9' };

  return (
    <>
      {/* Hidden file input for PDF upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <div className="modal-overlay" style={{ zIndex }} onClick={onClose}>
        <div
          className="modal-content"
          style={{ maxWidth: 900, maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              padding: '20px 24px',
              background: '#ffffff',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: 'var(--gray-900)' }}>
                  Hồ sơ Lịch khám #{apt.id || appointmentId}
                </h2>
                {apt.queueNumber != null && (
                  <span
                    style={{
                      background: '#ede9fe',
                      color: '#6d28d9',
                      padding: '3px 10px',
                      borderRadius: 20,
                      fontWeight: 800,
                      fontSize: '0.8rem',
                    }}
                  >
                    STT #{apt.queueNumber}
                  </span>
                )}
                <span
                  className="badge"
                  style={{
                    background: statusInfo.bg,
                    color: statusInfo.color,
                    fontWeight: 700,
                    fontSize: '0.75rem',
                  }}
                >
                  {statusInfo.label}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 16, fontSize: '0.85rem', color: 'var(--gray-600)', flexWrap: 'wrap' }}>
                <span>
                  Bác sĩ: <strong style={{ color: 'var(--gray-800)' }}>{session.doctorRank ? `${formatDoctorRank(session.doctorRank)} ` : ''}{session.doctorName || 'Chưa cập nhật'}</strong>
                </span>
                <span>
                  Ngày khám: <strong style={{ color: 'var(--gray-800)' }}>{session.examDate || '—'}</strong> ({session.shift === 'MORNING' ? 'Ca Sáng' : 'Ca Chiều'})
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {isDoctor && apt?.status === 'CONFIRMED' && (
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={handleStartAppointment}
                  disabled={startingAppointment}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'var(--doctor-accent)',
                    borderColor: 'var(--doctor-accent)',
                    fontWeight: 700,
                  }}
                >
                  {startingAppointment ? <Loader size={14} className="spin-slow" /> : <Stethoscope size={14} />}
                  <span>{startingAppointment ? 'Đang tiếp nhận...' : 'Tiếp nhận khám'}</span>
                </button>
              )}

              <button className="btn btn-icon btn-ghost" onClick={onClose} title="Đóng">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Patient Information Section */}
          <div
            style={{
              padding: '12px 24px',
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
            }}
          >
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: '12px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                      color: '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1rem',
                      border: '1px solid #bfdbfe',
                    }}
                  >
                    {patientInfo?.avatar ? (
                      <img
                        src={patientInfo.avatar}
                        alt="avatar"
                        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      <User size={18} />
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Thông tin Bệnh nhân
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--gray-900)' }}>
                      {patientInfo?.fullName || apt.patientName || `Bệnh nhân #${apt.patientId || '—'}`}
                      {apt.patientId && (
                        <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, marginLeft: 8 }}>
                          (Mã BN: #{apt.patientId})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      fontSize: '0.8rem',
                      background: '#f1f5f9',
                      padding: '4px 10px',
                      borderRadius: 8,
                      color: '#475569',
                      fontWeight: 600,
                    }}
                  >
                    <UserCheck size={14} color="#64748b" />
                    <span>
                      {patientInfo?.gender === 'MALE' || apt.patientGender === 'MALE'
                        ? 'Nam'
                        : patientInfo?.gender === 'FEMALE' || apt.patientGender === 'FEMALE'
                        ? 'Nữ'
                        : 'Giới tính: Khác'}
                    </span>
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 10,
                  fontSize: '0.825rem',
                  paddingTop: 8,
                  borderTop: '1px dashed #f1f5f9',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Phone size={13} style={{ color: '#64748b', flexShrink: 0 }} />
                  <span style={{ color: '#64748b' }}>SĐT:</span>
                  <strong style={{ color: '#1e293b' }}>
                    {patientInfo?.phone || apt.patientPhone || 'Chưa cập nhật'}
                  </strong>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Mail size={13} style={{ color: '#64748b', flexShrink: 0 }} />
                  <span style={{ color: '#64748b' }}>Email:</span>
                  <strong style={{ color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {patientInfo?.email || apt.patientEmail || 'Chưa cập nhật'}
                  </strong>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, gridColumn: 'span 2' }}>
                  <MapPin size={13} style={{ color: '#64748b', flexShrink: 0 }} />
                  <span style={{ color: '#64748b' }}>Địa chỉ:</span>
                  <strong style={{ color: '#1e293b' }}>
                    {patientInfo?.address || apt.patientAddress || 'Chưa cập nhật'}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Summary Banner */}
          <div
            style={{
              padding: '12px 24px',
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 12,
              fontSize: '0.825rem',
            }}
          >
            <div>
              <span style={{ color: 'var(--gray-500)', display: 'block', marginBottom: 2 }}>Triệu chứng ban đầu:</span>
              <strong style={{ color: 'var(--gray-800)' }}>{apt.symptoms || 'Không ghi nhận'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--gray-500)', display: 'block', marginBottom: 2 }}>Chẩn đoán của Bác sĩ:</span>
              <strong style={{ color: apt.diagnosis ? '#6d28d9' : 'var(--gray-400)' }}>
                {apt.diagnosis || 'Chưa chốt chẩn đoán'}
              </strong>
            </div>
            {apt.doctorNote && (
              <div style={{ gridColumn: '1 / -1' }}>
                <span style={{ color: 'var(--gray-500)', display: 'block', marginBottom: 2 }}>Lời dặn bác sĩ:</span>
                <span style={{ color: 'var(--gray-700)', fontStyle: 'italic' }}>"{apt.doctorNote}"</span>
              </div>
            )}
          </div>

          {/* Tab Navigation */}
          <div
            style={{
              display: 'flex',
              borderBottom: '2px solid #e2e8f0',
              background: '#ffffff',
              padding: '0 24px',
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('services')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 18px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontWeight: activeTab === 'services' ? 700 : 500,
                color: activeTab === 'services' ? '#7c3aed' : 'var(--gray-600)',
                borderBottom: activeTab === 'services' ? '2px solid #7c3aed' : '2px solid transparent',
                marginBottom: -2,
                fontSize: '0.875rem',
                transition: 'all 0.2s',
              }}
            >
              <Stethoscope size={16} />
              <span>Dịch vụ chỉ định</span>
              <span
                style={{
                  background: activeTab === 'services' ? '#ede9fe' : '#f1f5f9',
                  color: activeTab === 'services' ? '#6d28d9' : '#64748b',
                  padding: '2px 7px',
                  borderRadius: 12,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
              >
                {services.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('medications')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 18px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontWeight: activeTab === 'medications' ? 700 : 500,
                color: activeTab === 'medications' ? '#7c3aed' : 'var(--gray-600)',
                borderBottom: activeTab === 'medications' ? '2px solid #7c3aed' : '2px solid transparent',
                marginBottom: -2,
                fontSize: '0.875rem',
                transition: 'all 0.2s',
              }}
            >
              <Pill size={16} />
              <span>Đơn thuốc</span>
              <span
                style={{
                  background: activeTab === 'medications' ? '#ede9fe' : '#f1f5f9',
                  color: activeTab === 'medications' ? '#6d28d9' : '#64748b',
                  padding: '2px 7px',
                  borderRadius: 12,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
              >
                {medications.length}
              </span>
            </button>

            {/* Tab Hóa đơn & Thanh toán - Chỉ dành cho Quản trị viên/Thu ngân, Bác sĩ không được xem */}
            {!isDoctor && (
              <button
                type="button"
                onClick={() => setActiveTab('invoices')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 18px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontWeight: activeTab === 'invoices' ? 700 : 500,
                  color: activeTab === 'invoices' ? '#7c3aed' : 'var(--gray-600)',
                  borderBottom: activeTab === 'invoices' ? '2px solid #7c3aed' : '2px solid transparent',
                  marginBottom: -2,
                  fontSize: '0.875rem',
                  transition: 'all 0.2s',
                }}
              >
                <Receipt size={16} />
                <span>Hóa đơn & Thanh toán</span>
                <span
                  style={{
                    background: activeTab === 'invoices' ? '#ede9fe' : '#f1f5f9',
                    color: activeTab === 'invoices' ? '#6d28d9' : '#64748b',
                    padding: '2px 7px',
                    borderRadius: 12,
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}
                >
                  {invoices.length}
                </span>
              </button>
            )}
          </div>

          {/* Modal Body / Tab Content */}
          <div style={{ padding: 24, flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: 48, textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto' }} />
                <p style={{ marginTop: 12, fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                  Đang tải dữ liệu hồ sơ lịch khám...
                </p>
              </div>
            ) : (
              <>
                {/* ================= TAB 1: DỊCH VỤ ================= */}
                {activeTab === 'services' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Danh sách dịch vụ cận lâm sàng / thủ thuật</h3>
                        <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                          {isDoctor
                            ? 'Bác sĩ trực tiếp thực hiện các thủ thuật nha khoa tại chỗ và theo dõi kết quả cận lâm sàng do phòng xét nghiệm gửi về'
                            : <>Tiếp nhận và tải file kết quả cận lâm sàng (PDF) hoặc hỗ trợ quản lý thủ thuật điều trị</>}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {isDoctor && apt?.status === 'EXAMINING' && (
                          <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            onClick={() => setShowOrderServicesModal(true)}
                            style={{
                              display: 'inline-flex',
                              gap: 6,
                              alignItems: 'center',
                              background: 'var(--doctor-accent)',
                              borderColor: 'var(--doctor-accent)',
                              fontWeight: 700,
                            }}
                          >
                            <Plus size={14} />
                            <span>Chỉ định dịch vụ</span>
                          </button>
                        )}
                        <button className="btn btn-sm btn-outline" onClick={fetchDetail} style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                          <RefreshCw size={13} />
                          <span>Tải lại</span>
                        </button>
                      </div>
                    </div>

                    {/* Banner nhắc thu tiền mặt cho Admin khi có dịch vụ chưa thanh toán */}
                    {isAdmin && unpaidServices.length > 0 && apt?.status === 'EXAMINING' && (
                      <div
                        style={{
                          marginBottom: 16,
                          padding: '14px 18px',
                          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                          border: '1.5px solid #86efac',
                          borderRadius: 12,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 12,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 10,
                              background: '#bbf7d0',
                              color: '#15803d',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <Banknote size={22} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#166534', fontSize: '0.92rem' }}>
                              Có {unpaidServices.length} dịch vụ chỉ định chưa thanh toán
                            </div>
                            <div style={{ fontSize: '0.82rem', color: '#15803d', marginTop: 2 }}>
                              Tổng tiền mặt cần thu: <strong style={{ color: '#14532d', fontSize: '1.05rem', fontWeight: 800 }}>{totalUnpaidAmount.toLocaleString('vi-VN')} đ</strong>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={() => setShowCashPaymentModal(true)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            background: '#16a34a',
                            borderColor: '#16a34a',
                            color: '#ffffff',
                            fontWeight: 700,
                            padding: '8px 16px',
                            boxShadow: '0 2px 4px rgba(22, 163, 74, 0.25)',
                          }}
                        >
                          <Banknote size={15} />
                          <span>Thu tiền mặt tại quầy</span>
                        </button>
                      </div>
                    )}

                    {services.length === 0 ? (
                      <div style={{ padding: 40, textAlign: 'center', background: '#f8fafc', borderRadius: 12, border: '1px dashed #cbd5e1' }}>
                        <Stethoscope size={36} style={{ color: '#94a3b8', margin: '0 auto 8px' }} />
                        <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem', margin: 0 }}>
                          Chưa có dịch vụ cận lâm sàng hoặc thủ thuật nào được chỉ định cho ca này.
                        </p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {services.map((srv) => {
                          const srvStatus = serviceStatusMap[srv.status] || { label: srv.status, color: '#475569', bg: '#f1f5f9' };
                          const isUploading = uploadingServiceId === srv.id;

                          return (
                            <div
                              key={srv.id}
                              style={{
                                padding: 16,
                                background: '#ffffff',
                                border: '1px solid #e2e8f0',
                                borderRadius: 12,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: 16,
                                flexWrap: 'wrap',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                              }}
                            >
                              <div style={{ flex: 1, minWidth: 260 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--gray-900)' }}>
                                    {srv.serviceName}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: '0.72rem',
                                      padding: '2px 8px',
                                      borderRadius: 6,
                                      background: '#f1f5f9',
                                      color: '#475569',
                                      fontWeight: 600,
                                    }}
                                  >
                                    {srv.serviceType}
                                  </span>
                                  <span
                                    className="badge"
                                    style={{
                                      background: srvStatus.bg,
                                      color: srvStatus.color,
                                      fontWeight: 700,
                                      fontSize: '0.72rem',
                                    }}
                                  >
                                    {srvStatus.label}
                                  </span>
                                </div>

                                <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                                  <span>Đơn giá: <strong style={{ color: 'var(--gray-800)' }}>{Number(srv.unitPrice || 0).toLocaleString('vi-VN')} đ</strong></span>
                                  {srv.roomNumber && <span>Phòng: <strong>{srv.roomNumber}</strong></span>}
                                  <span>Thanh toán: <strong style={{ color: srv.paidAt ? '#16a34a' : '#ea580c' }}>{srv.paidAt ? 'Đã thanh toán' : 'Chưa thanh toán'}</strong></span>
                                  {srv.note && <span>Ghi chú: <em style={{ color: 'var(--gray-700)' }}>{srv.note}</em></span>}
                                </div>
                              </div>

                              {/* Action: View Result or Start Service or Upload Result */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {srv.resultUrl ? (
                                  <a
                                    href={srv.resultUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-sm"
                                    title="Nhấn để mở file PDF kết quả trong tab mới"
                                    style={{
                                      background: '#eff6ff',
                                      color: '#1d4ed8',
                                      borderColor: '#bfdbfe',
                                      fontWeight: 600,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 6,
                                      padding: '7px 12px',
                                    }}
                                  >
                                    <FileCheck size={15} style={{ color: '#2563eb' }} />
                                    <span>Xem kết quả PDF</span>
                                    <ExternalLink size={13} />
                                  </a>
                                ) : srv.status === 'COMPLETED' ? (
                                  <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                    <CheckCircle2 size={14} />
                                    <span>Đã hoàn tất thủ thuật</span>
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '0.78rem', color: 'var(--gray-400)', fontStyle: 'italic', marginRight: 4 }}>
                                    {srv.status === 'CANCELLED'
                                      ? 'Dịch vụ đã hủy'
                                      : srv.status === 'ORDERED'
                                      ? (isLabOrImaging(srv) ? 'Chờ phòng xét nghiệm tiếp nhận' : 'Chờ bắt đầu thực hiện')
                                      : srv.status === 'IN_PROGRESS'
                                      ? (isLabOrImaging(srv) ? 'Đang xét nghiệm/chụp chiếu' : 'Đang thực hiện thủ thuật')
                                      : 'Chưa có kết quả'}
                                  </span>
                                )}

                                {/* Hủy chỉ định dịch vụ (nếu chưa thanh toán) */}
                                {(isDoctor || isAdmin) && apt?.status === 'EXAMINING' && srv.status === 'ORDERED' && !srv.paidAt && (
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-ghost"
                                    onClick={() => handleCancelService(srv)}
                                    disabled={cancellingServiceId === srv.id}
                                    title="Hủy chỉ định dịch vụ này (khi chưa thanh toán)"
                                    style={{ color: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 10px', fontSize: '0.8rem' }}
                                  >
                                    {cancellingServiceId === srv.id ? <Loader size={13} className="spin-slow" /> : <Trash2 size={13} />}
                                    <span>Hủy chỉ định</span>
                                  </button>
                                )}

                                {/* 1. DỊCH VỤ CẬN LÂM SÀNG (LAB_TEST, IMAGING): Dành cho ADMIN / Kỹ thuật viên */}
                                {isLabOrImaging(srv) && canManageParaclinical && (
                                  <>
                                    {/* Nút 1: Tiếp nhận xét nghiệm / chụp (ORDERED -> IN_PROGRESS) */}
                                    {srv.status === 'ORDERED' && (
                                      <button
                                        type="button"
                                        className="btn btn-sm"
                                        onClick={() => handleStartService(srv)}
                                        disabled={startingServiceId === srv.id || !srv.paidAt}
                                        title={
                                          !srv.paidAt
                                            ? 'Dịch vụ chưa được thanh toán! Bệnh nhân cần thanh toán hóa đơn trước khi tiếp nhận.'
                                            : 'Tiếp nhận và bắt đầu thực hiện xét nghiệm/chụp chiếu (IN_PROGRESS)'
                                        }
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: 6,
                                          background: !srv.paidAt ? '#f1f5f9' : '#f5f3ff',
                                          color: !srv.paidAt ? '#94a3b8' : '#6d28d9',
                                          borderColor: !srv.paidAt ? '#e2e8f0' : '#ddd6fe',
                                          fontWeight: 600,
                                          padding: '7px 12px',
                                          cursor: startingServiceId === srv.id || !srv.paidAt ? 'not-allowed' : 'pointer',
                                        }}
                                      >
                                        {startingServiceId === srv.id ? (
                                          <Loader size={14} className="spin-slow" />
                                        ) : (
                                          <Play size={14} />
                                        )}
                                        <span>
                                          {startingServiceId === srv.id
                                            ? 'Đang tiếp nhận...'
                                            : !srv.paidAt
                                            ? 'Chưa thanh toán'
                                            : 'Tiếp nhận thực hiện'}
                                        </span>
                                      </button>
                                    )}

                                    {/* Nút 2: Tải file kết quả PDF (IN_PROGRESS -> COMPLETED) */}
                                    {srv.status === 'IN_PROGRESS' && (
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline"
                                        onClick={() => handleTriggerUpload(srv)}
                                        disabled={isUploading}
                                        title="Tải lên file kết quả PDF lên Supabase Storage và hoàn tất dịch vụ"
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: 6,
                                          borderColor: '#c4b5fd',
                                          color: '#6d28d9',
                                          background: '#faf5ff',
                                          fontWeight: 600,
                                          padding: '7px 12px',
                                          cursor: isUploading ? 'not-allowed' : 'pointer',
                                        }}
                                      >
                                        {isUploading ? (
                                          <Loader size={14} className="spin-slow" />
                                        ) : (
                                          <Upload size={14} />
                                        )}
                                        <span>{isUploading ? 'Đang tải...' : 'Tải lên PDF'}</span>
                                      </button>
                                    )}

                                    {/* Nút 3: Tải lại file PDF mới khi đã COMPLETED */}
                                    {srv.status === 'COMPLETED' && (
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline"
                                        onClick={() => handleTriggerUpload(srv)}
                                        disabled={isUploading}
                                        title="Tải lại file kết quả PDF mới lên Supabase Storage để cập nhật kết quả"
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: 6,
                                          borderColor: '#cbd5e1',
                                          color: '#475569',
                                          background: '#f8fafc',
                                          fontWeight: 600,
                                          padding: '7px 12px',
                                          cursor: isUploading ? 'not-allowed' : 'pointer',
                                        }}
                                      >
                                        {isUploading ? (
                                          <Loader size={14} className="spin-slow" />
                                        ) : (
                                          <Upload size={14} />
                                        )}
                                        <span>{isUploading ? 'Đang tải...' : 'Tải lại PDF'}</span>
                                      </button>
                                    )}
                                  </>
                                )}

                                {/* 2. DỊCH VỤ THỦ THUẬT / NHA KHOA ĐIỀU TRỊ (DENTAL, OTHER): Bác sĩ phụ trách hoặc Admin */}
                                {!isLabOrImaging(srv) && canManageProcedure && (
                                  <>
                                    {/* Nút 1: Bắt đầu thủ thuật (ORDERED -> IN_PROGRESS) */}
                                    {srv.status === 'ORDERED' && (
                                      <button
                                        type="button"
                                        className="btn btn-sm"
                                        onClick={() => handleStartService(srv)}
                                        disabled={startingServiceId === srv.id || !srv.paidAt}
                                        title={
                                          !srv.paidAt
                                            ? 'Dịch vụ chưa được thanh toán! Bệnh nhân cần thanh toán trước khi tiến hành thủ thuật.'
                                            : 'Bác sĩ bắt đầu thực hiện thủ thuật điều trị'
                                        }
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: 6,
                                          background: !srv.paidAt ? '#f1f5f9' : '#f0fdf4',
                                          color: !srv.paidAt ? '#94a3b8' : '#15803d',
                                          borderColor: !srv.paidAt ? '#e2e8f0' : '#86efac',
                                          fontWeight: 700,
                                          padding: '7px 12px',
                                          cursor: startingServiceId === srv.id || !srv.paidAt ? 'not-allowed' : 'pointer',
                                        }}
                                      >
                                        {startingServiceId === srv.id ? (
                                          <Loader size={14} className="spin-slow" />
                                        ) : (
                                          <Play size={14} />
                                        )}
                                        <span>
                                          {startingServiceId === srv.id
                                            ? 'Đang bắt đầu...'
                                            : !srv.paidAt
                                            ? 'Chưa thanh toán'
                                            : 'Bắt đầu thủ thuật'}
                                        </span>
                                      </button>
                                    )}

                                    {/* Nút 2: Hoàn tất thủ thuật (IN_PROGRESS -> COMPLETED) */}
                                    {srv.status === 'IN_PROGRESS' && (
                                      <button
                                        type="button"
                                        className="btn btn-sm"
                                        onClick={() => handleTriggerCompleteProcedure(srv)}
                                        disabled={isUploading}
                                        title="Hoàn tất thủ thuật điều trị và nhập ghi chú lâm sàng (không bắt buộc tải PDF)"
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: 6,
                                          borderColor: '#86efac',
                                          color: '#15803d',
                                          background: '#f0fdf4',
                                          fontWeight: 700,
                                          padding: '7px 12px',
                                          cursor: isUploading ? 'not-allowed' : 'pointer',
                                        }}
                                      >
                                        {isUploading ? (
                                          <Loader size={14} className="spin-slow" />
                                        ) : (
                                          <CheckCircle2 size={14} />
                                        )}
                                        <span>{isUploading ? 'Đang lưu...' : 'Hoàn tất thủ thuật'}</span>
                                      </button>
                                    )}

                                    {/* Nút 3: Cập nhật ghi chú khi đã COMPLETED */}
                                    {srv.status === 'COMPLETED' && (
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline"
                                        onClick={() => handleTriggerCompleteProcedure(srv)}
                                        disabled={isUploading}
                                        title="Cập nhật ghi chú thủ thuật hoặc bổ sung file đính kèm nếu có"
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: 6,
                                          borderColor: '#cbd5e1',
                                          color: '#475569',
                                          background: '#f8fafc',
                                          fontWeight: 600,
                                          padding: '7px 12px',
                                          cursor: isUploading ? 'not-allowed' : 'pointer',
                                        }}
                                      >
                                        <FileText size={14} />
                                        <span>Cập nhật ghi chú</span>
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ================= TAB 2: ĐƠN THUỐC ================= */}
                {activeTab === 'medications' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                          Đơn thuốc do Bác sĩ chỉ định
                        </h3>
                        <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                          Danh sách thuốc kê đơn kèm hướng dẫn liều dùng cho bệnh nhân
                        </p>
                      </div>

                      {/* Nút cập nhật chỉ hiện ở góc trên khi đã có đơn thuốc và ca đang khám */}
                      {isDoctor && apt?.status === 'EXAMINING' && medications.length > 0 && (
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() => setShowCompleteModal(true)}
                          style={{
                            display: 'inline-flex',
                            gap: 6,
                            alignItems: 'center',
                            background: '#16a34a',
                            borderColor: '#16a34a',
                            fontWeight: 700,
                          }}
                        >
                          <Pill size={14} />
                          <span>Cập nhật đơn thuốc & Chốt khám</span>
                        </button>
                      )}
                    </div>

                    {medications.length === 0 ? (
                      <div style={{ padding: 48, textAlign: 'center', background: '#f8fafc', borderRadius: 12, border: '1px dashed #cbd5e1' }}>
                        <Pill size={40} style={{ color: '#94a3b8', margin: '0 auto 10px' }} />
                        <p style={{ color: 'var(--gray-600)', fontSize: '0.9rem', fontWeight: 600, margin: '0 0 4px' }}>
                          Bác sĩ chưa kê đơn thuốc cho lịch khám này
                        </p>
                        <p style={{ color: 'var(--gray-500)', fontSize: '0.825rem', margin: '0 0 16px' }}>
                          Sau khi có kết quả chẩn đoán, bác sĩ tiến hành kê đơn thuốc và hoàn tất ca khám
                        </p>
                        {isDoctor && apt?.status === 'EXAMINING' && (
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => setShowCompleteModal(true)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 8,
                              background: '#16a34a',
                              borderColor: '#16a34a',
                              fontWeight: 700,
                              margin: '0 auto',
                              padding: '8px 20px',
                            }}
                          >
                            <Plus size={16} />
                            <span>Kê đơn thuốc & Chốt chẩn đoán</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <table className="data-table" style={{ margin: 0 }}>
                          <thead>
                            <tr>
                              <th style={{ width: 40 }}>STT</th>
                              <th>Tên thuốc</th>
                              <th>Hàm lượng</th>
                              <th>Số lượng</th>
                              <th>Liều dùng & Tần suất</th>
                              <th>Hướng dẫn sử dụng</th>
                            </tr>
                          </thead>
                          <tbody>
                            {medications.map((med, idx) => (
                              <tr key={med.id || idx}>
                                <td style={{ fontWeight: 700, color: 'var(--gray-500)' }}>{idx + 1}</td>
                                <td style={{ fontWeight: 700, color: 'var(--gray-900)' }}>{med.medicineName}</td>
                                <td><span className="badge" style={{ background: '#f1f5f9', color: '#475569' }}>{med.strength || '—'}</span></td>
                                <td style={{ fontWeight: 700, color: '#6d28d9' }}>{med.quantity}</td>
                                <td style={{ fontSize: '0.825rem' }}>
                                  <div style={{ fontWeight: 600 }}>{med.dosage}</div>
                                  <div style={{ color: 'var(--gray-500)', fontSize: '0.78rem' }}>{med.frequency} ({med.durationDays} ngày)</div>
                                </td>
                                <td style={{ fontSize: '0.825rem', color: 'var(--gray-700)', maxWidth: 260 }}>
                                  {med.instruction || 'Theo chỉ định của bác sĩ'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* ================= TAB 3: HÓA ĐƠN ================= */}
                {activeTab === 'invoices' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Danh sách Hóa đơn & Giao dịch thanh toán</h3>
                        <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                          Hóa đơn tiền công khám ban đầu và các dịch vụ nha khoa cận lâm sàng qua cổng VNPAY
                        </p>
                      </div>
                      <button className="btn btn-sm btn-outline" onClick={fetchInvoices} disabled={loadingInvoices} style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                        <RefreshCw size={13} className={loadingInvoices ? 'spin-slow' : ''} />
                        <span>Làm mới</span>
                      </button>
                    </div>

                    {/* Banner cảnh báo hóa đơn phí khám chưa được đồng bộ (nếu trước đó payment-service down) */}
                    {isAdmin && Number(apt?.examinationFee || 0) > 0 && !apt?.examinationInvoiceId && (
                      <div
                        style={{
                          padding: '12px 16px',
                          borderRadius: 12,
                          background: '#fffbeb',
                          border: '1px solid #fde68a',
                          marginBottom: 16,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 12,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <AlertTriangle size={18} color="#d97706" style={{ flexShrink: 0 }} />
                          <div style={{ fontSize: '0.825rem', color: '#92400e' }}>
                            <strong>Phí khám ({Number(apt.examinationFee).toLocaleString('vi-VN')} đ)</strong> chưa có mã hóa đơn do kết nối tới payment-service bị gián đoạn trước đó. Background Job đang tự động quét để bù hóa đơn.
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={handleReconcileInvoice}
                          disabled={reconciling}
                          style={{
                            fontSize: '0.78rem',
                            padding: '4px 12px',
                            whiteSpace: 'nowrap',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            background: '#d97706',
                            borderColor: '#d97706',
                            fontWeight: 700,
                          }}
                        >
                          <RefreshCw size={13} className={reconciling ? 'spin-slow' : ''} />
                          <span>Đồng bộ bù ngay</span>
                        </button>
                      </div>
                    )}

                    {loadingInvoices ? (
                      <div style={{ padding: 40, textAlign: 'center' }}>
                        <div className="spinner" style={{ margin: '0 auto' }} />
                        <p style={{ marginTop: 10, fontSize: '0.85rem', color: 'var(--gray-500)' }}>Đang tải hóa đơn...</p>
                      </div>
                    ) : invoices.length === 0 ? (
                      <div style={{ padding: 40, textAlign: 'center', background: '#f8fafc', borderRadius: 12, border: '1px dashed #cbd5e1' }}>
                        <Receipt size={36} style={{ color: '#94a3b8', margin: '0 auto 8px' }} />
                        <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem', margin: 0 }}>
                          Chưa có hóa đơn nào được tạo cho lịch khám này.
                        </p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {invoices.map((inv) => {
                          const invStatus = invoiceStatusMap[inv.status] || { label: inv.status, color: '#475569', bg: '#f1f5f9' };
                          const isExam = inv.type === 'EXAMINATION';

                          return (
                            <div
                              key={inv.id}
                              style={{
                                border: '1px solid #e2e8f0',
                                borderRadius: 12,
                                background: '#ffffff',
                                overflow: 'hidden',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                              }}
                            >
                              <div
                                style={{
                                  padding: '14px 18px',
                                  background: isExam ? '#faf5ff' : '#f0fdf4',
                                  borderBottom: '1px solid #e2e8f0',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  flexWrap: 'wrap',
                                  gap: 10,
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--gray-900)' }}>
                                    Hóa đơn #{inv.id}
                                  </span>
                                  <span
                                    className="badge"
                                    style={{
                                      background: isExam ? '#ede9fe' : '#dcfce7',
                                      color: isExam ? '#6d28d9' : '#15803d',
                                      fontWeight: 700,
                                      fontSize: '0.72rem',
                                    }}
                                  >
                                    {isExam ? 'TIỀN CÔNG KHÁM (EXAMINATION)' : 'DỊCH VỤ CẬN LÂM SÀNG (SERVICES)'}
                                  </span>
                                  <span
                                    className="badge"
                                    style={{
                                      background: invStatus.bg,
                                      color: invStatus.color,
                                      fontWeight: 700,
                                      fontSize: '0.72rem',
                                    }}
                                  >
                                    {invStatus.label}
                                  </span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--gray-900)' }}>
                                    {Number(inv.amount || 0).toLocaleString('vi-VN')} đ
                                  </span>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline"
                                    onClick={() => setSelectedInvoice(inv)}
                                    title="Xem chi tiết các lần giao dịch VNPay"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.8rem', padding: '6px 10px' }}
                                  >
                                    <CreditCard size={14} />
                                    <span>Lịch sử VNPay</span>
                                  </button>
                                </div>
                              </div>

                              <div style={{ padding: '12px 18px', fontSize: '0.8125rem', color: 'var(--gray-600)' }}>
                                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: inv.services?.length ? 10 : 0 }}>
                                  <span>Ngày tạo: <strong>{inv.createdAt ? new Date(inv.createdAt).toLocaleString('vi-VN') : '—'}</strong></span>
                                  {inv.paidAt && (
                                    <span style={{ color: '#16a34a' }}>
                                      Thanh toán lúc: <strong>{new Date(inv.paidAt).toLocaleString('vi-VN')}</strong>
                                    </span>
                                  )}
                                </div>

                                {isExam ? (
                                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed #e2e8f0' }}>
                                    <span style={{ fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: 6 }}>
                                      Chi tiết mục thanh toán:
                                    </span>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--gray-700)' }}>
                                      <span>
                                        • <strong>Tiền công khám ban đầu</strong>
                                        {session?.doctorName && (
                                          <span style={{ fontSize: '0.78rem', color: 'var(--gray-500)', marginLeft: 6 }}>
                                            (Bác sĩ: {session.doctorName})
                                          </span>
                                        )}
                                      </span>
                                      <span style={{ fontWeight: 700, color: 'var(--gray-900)' }}>
                                        {Number(inv.amount || session?.examinationFee || 0).toLocaleString('vi-VN')} đ
                                      </span>
                                    </div>
                                  </div>
                                ) : inv.services && inv.services.length > 0 ? (
                                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed #e2e8f0' }}>
                                    <span style={{ fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: 6 }}>
                                      Các mục thanh toán trong hóa đơn:
                                    </span>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                      {inv.services.map((s, idx) => {
                                        const itemPrice = Number(s.unitPrice ?? s.price ?? s.amount ?? 0);
                                        return (
                                          <div key={s.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--gray-700)' }}>
                                            <span>
                                              • <strong>{s.serviceName}</strong>
                                              {s.serviceType && (
                                                <span style={{ fontSize: '0.72rem', marginLeft: 6, padding: '1px 6px', background: '#f1f5f9', borderRadius: 4, color: '#475569', fontWeight: 600 }}>
                                                  {s.serviceType}
                                                </span>
                                              )}
                                              {s.roomNumber && <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginLeft: 6 }}>({s.roomNumber})</span>}
                                            </span>
                                            <span style={{ fontWeight: 700, color: 'var(--gray-900)' }}>
                                              {itemPrice.toLocaleString('vi-VN')} đ
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '14px 24px',
              background: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            <button type="button" className="btn btn-primary" onClick={onClose} style={{ minWidth: 100 }}>
              Đóng
            </button>
          </div>
        </div>
      </div>

      {/* Note / Complete Modal */}
      {showNoteModal && (
        <div className="modal-overlay" style={{ zIndex: zIndex + 50 }} onClick={() => setShowNoteModal(false)}>
          <div className="modal-content" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                {isLabOrImaging(selectedServiceForUpload)
                  ? 'Xác nhận tải lên kết quả (PDF)'
                  : 'Xác nhận hoàn tất dịch vụ'}
              </h3>
              <button className="btn btn-icon btn-ghost" onClick={() => setShowNoteModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '16px 20px' }}>
              <div style={{ marginBottom: 14 }}>
                <span style={{ fontSize: '0.825rem', color: 'var(--gray-500)', display: 'block', marginBottom: 4 }}>
                  Dịch vụ thực hiện:
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <strong style={{ fontSize: '0.95rem', color: '#6d28d9' }}>
                    {selectedServiceForUpload?.serviceName}
                  </strong>
                  <span className="badge" style={{ fontSize: '0.72rem', background: '#f1f5f9', color: '#475569', fontWeight: 600 }}>
                    {selectedServiceForUpload?.serviceType}
                  </span>
                </div>
              </div>

              {/* File section */}
              {pendingFile ? (
                <div style={{ marginBottom: 14, padding: 10, background: '#eff6ff', borderRadius: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <FileText size={20} style={{ color: '#2563eb' }} />
                  <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--gray-800)' }}>{pendingFile?.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                      {((pendingFile?.size || 0) / 1024).toFixed(1)} KB | Lưu tại <code>results/</code>
                    </div>
                  </div>
                  {!isLabOrImaging(selectedServiceForUpload) && (
                    <button
                      type="button"
                      className="btn btn-icon btn-ghost btn-sm"
                      onClick={() => setPendingFile(null)}
                      title="Gỡ file đính kèm"
                      style={{ color: '#dc2626' }}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ) : (
                !isLabOrImaging(selectedServiceForUpload) && (
                  <div style={{ marginBottom: 14, padding: '10px 12px', background: '#f8fafc', borderRadius: 8, border: '1px dashed #cbd5e1' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.825rem', color: 'var(--gray-600)' }}>
                        Đính kèm file PDF kết quả (Không bắt buộc):
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={() => fileInputRef.current?.click()}
                        style={{ fontSize: '0.78rem', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                      >
                        <Upload size={13} />
                        <span>Chọn file</span>
                      </button>
                    </div>
                    {selectedServiceForUpload?.resultUrl && (
                      <div style={{ marginTop: 8, fontSize: '0.78rem', color: '#2563eb' }}>
                        Đang có file kết quả: <a href={selectedServiceForUpload.resultUrl} target="_blank" rel="noopener noreferrer">Xem file hiện tại</a>
                      </div>
                    )}
                  </div>
                )
              )}

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>
                  {isLabOrImaging(selectedServiceForUpload) ? 'Kết luận chuyên môn / Ghi chú' : 'Ghi chú điều trị / Diễn tiến thủ thuật'}
                </label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={notePrompt}
                  onChange={(e) => setNotePrompt(e.target.value)}
                  placeholder={
                    isLabOrImaging(selectedServiceForUpload)
                      ? "Nhập nhận định kết quả chụp chiếu hoặc xét nghiệm..."
                      : "Nhập ghi chú điều trị (ví dụ: đã hàn răng composite mặt nhai, bệnh nhân không đau)..."
                  }
                />
              </div>
            </div>

            <div className="modal-footer" style={{ padding: '12px 20px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowNoteModal(false)}>
                Hủy
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmUpload}
                disabled={uploadingServiceId === selectedServiceForUpload?.id}
                style={{
                  background: isLabOrImaging(selectedServiceForUpload) ? '#7c3aed' : '#16a34a',
                  borderColor: isLabOrImaging(selectedServiceForUpload) ? '#7c3aed' : '#16a34a',
                }}
              >
                {uploadingServiceId === selectedServiceForUpload?.id ? (
                  <>
                    <Loader size={14} className="spin-slow" style={{ marginRight: 6 }} />
                    <span>Đang xử lý...</span>
                  </>
                ) : isLabOrImaging(selectedServiceForUpload) ? (
                  <>
                    <Upload size={14} style={{ marginRight: 6 }} />
                    <span>Tải lên & Lưu kết quả</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} style={{ marginRight: 6 }} />
                    <span>Xác nhận hoàn tất</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Transactions Modal */}
      {selectedInvoice && (
        <InvoiceTransactionsModal
          invoice={selectedInvoice}
          zIndex={zIndex + 50}
          onClose={() => setSelectedInvoice(null)}
        />
      )}

      {/* Doctor Modal: Chỉ định dịch vụ */}
      {showOrderServicesModal && (
        <OrderServicesModal
          appointmentId={appointmentId}
          existingServices={services}
          zIndex={zIndex + 50}
          onClose={() => setShowOrderServicesModal(false)}
          onSuccess={() => {
            fetchDetail();
            onRefreshParent?.();
          }}
        />
      )}

      {/* Doctor Modal: Kê đơn thuốc & Hoàn tất ca khám */}
      {showCompleteModal && (
        <CompleteAppointmentModal
          appointmentId={appointmentId}
          appointment={apt}
          services={services}
          zIndex={zIndex + 50}
          onClose={() => setShowCompleteModal(false)}
          onSuccess={() => {
            fetchDetail();
            onRefreshParent?.();
          }}
        />
      )}

      {/* Admin Modal: Xác nhận thu tiền mặt tại quầy */}
      {showCashPaymentModal && (
        <div className="modal-overlay" onClick={() => !payingCash && setShowCashPaymentModal(false)} style={{ zIndex: zIndex + 60 }}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 540, borderRadius: 16, overflow: 'hidden', padding: 0 }}
          >
            <div
              className="modal-header"
              style={{
                padding: '16px 20px',
                background: 'linear-gradient(135deg, #15803d 0%, #16a34a 100%)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: 7, borderRadius: 8, display: 'flex' }}>
                  <Banknote size={20} color="#fff" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
                    Thu tiền mặt tại quầy
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'rgba(255,255,255,0.85)' }}>
                    Xác nhận đã nhận tiền mặt từ bệnh nhân để kích hoạt dịch vụ
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-icon btn-ghost"
                onClick={() => setShowCashPaymentModal(false)}
                disabled={payingCash}
                style={{ color: '#fff' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px 24px' }}>
              {/* Thông tin bệnh nhân */}
              <div
                style={{
                  padding: '12px 16px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  marginBottom: 16,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>Bệnh nhân</div>
                  <div style={{ fontWeight: 700, color: 'var(--gray-900)', fontSize: '0.95rem' }}>
                    {apt.patientName || 'Chưa cập nhật'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>Mã lịch hẹn</div>
                  <div style={{ fontWeight: 700, color: '#2563eb', fontSize: '0.95rem' }}>
                    #{apt.id}
                  </div>
                </div>
              </div>

              {/* Danh sách dịch vụ thanh toán */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--gray-700)', marginBottom: 8 }}>
                  Danh sách dịch vụ cần thu tiền ({unpaidServices.length}):
                </div>
                <div
                  style={{
                    maxHeight: 180,
                    overflowY: 'auto',
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                    padding: '8px 12px',
                    background: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  {unpaidServices.map((srv, idx) => (
                    <div
                      key={srv.id || idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.85rem',
                        paddingBottom: idx !== unpaidServices.length - 1 ? 6 : 0,
                        borderBottom: idx !== unpaidServices.length - 1 ? '1px dashed #f1f5f9' : 'none',
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 600, color: 'var(--gray-800)' }}>{srv.serviceName}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--gray-500)', marginLeft: 6 }}>({srv.serviceType})</span>
                      </div>
                      <span style={{ fontWeight: 700, color: 'var(--gray-900)' }}>
                        {Number(srv.unitPrice || 0).toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tổng tiền cần thu */}
              <div
                style={{
                  padding: '16px',
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                  border: '1.5px solid #86efac',
                  borderRadius: 12,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.85rem', color: '#166534', fontWeight: 600 }}>Tổng tiền mặt cần thu:</span>
                  <div style={{ fontSize: '0.75rem', color: '#15803d', marginTop: 2 }}>
                    Phương thức: <strong>Tiền mặt tại quầy (CASH)</strong>
                  </div>
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#15803d' }}>
                  {totalUnpaidAmount.toLocaleString('vi-VN')} đ
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ padding: '14px 20px', display: 'flex', justifyContent: 'flex-end', gap: 10, background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setShowCashPaymentModal(false)}
                disabled={payingCash}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmCashPayment}
                disabled={payingCash}
                style={{
                  background: '#16a34a',
                  borderColor: '#16a34a',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {payingCash ? (
                  <>
                    <Loader size={16} className="spin-slow" />
                    <span>Đang ghi nhận thu tiền...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Xác nhận đã nhận {totalUnpaidAmount.toLocaleString('vi-VN')} đ</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

