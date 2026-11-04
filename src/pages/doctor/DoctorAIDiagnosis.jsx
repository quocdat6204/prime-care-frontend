import { useState, useRef } from 'react';
import {
  Sparkles, Upload, Image as ImageIcon, CheckCircle2, AlertCircle,
  RefreshCw, Copy, Check, Info, FileText, ArrowRight, Zap, ShieldAlert,
  Sliders, Activity
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

// Dữ liệu mẫu minh họa kết quả khi AI phân tích
const SAMPLE_PREVIEWS = [
  {
    id: 'sample-1',
    name: 'Ảnh X-quang Răng hàm R46 (Sâu ngà sâu)',
    url: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=600&q=80',
    mockResult: {
      diseaseName: 'Sâu ngà răng sâu (Dental Caries - Deep Dentin)',
      icdCode: 'K02.1',
      confidence: 96.2,
      severity: 'Nghiêm trọng (Cần can thiệp sớm)',
      severityColor: '#dc2626',
      severityBg: '#fee2e2',
      description: 'Phát hiện vùng thấu quang lớn phá hủy men và xâm lấn sâu vào lớp ngà răng số 46, đáy lỗ sâu sát trần buồng tủy.',
      differentials: [
        { name: 'Sâu ngà sâu sát tủy', prob: 96.2 },
        { name: 'Viêm tủy răng có hồi phục', prob: 84.5 },
        { name: 'Viêm quanh cuống răng mạn tính', prob: 12.0 },
      ],
      recommendations: [
        'Chụp phim cận chóp (Periapical X-ray) kiểm tra tình trạng chân răng và cuống răng.',
        'Kiểm tra thử tủy (thử nhiệt / thử điện) để đánh giá độ sống của tủy.',
        'Cân nhắc nạo sạch ngà mủn, hàn bảo tồn che tủy gián tiếp hoặc tiến hành điều trị tủy nếu có lộ tủy.',
      ],
    },
  },
  {
    id: 'sample-2',
    name: 'Ảnh X-quang Răng khôn R38 (Mọc lệch ngầm)',
    url: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=600&q=80',
    mockResult: {
      diseaseName: 'Răng khôn hàm dưới mọc lệch ngầm (Impacted Wisdom Tooth)',
      icdCode: 'K01.1',
      confidence: 98.5,
      severity: 'Cần phẫu thuật nhổ răng',
      severityColor: '#ea580c',
      severityBg: '#ffedd5',
      description: 'Răng số 38 mọc lệch gần góc 75 độ, tỳ trực tiếp vào cổ chân răng số 37, có nguy cơ gây tiêu xương ổ răng và sâu chân răng 37.',
      differentials: [
        { name: 'Răng khôn mọc lệch gần (Mesioangular)', prob: 98.5 },
        { name: 'Nang thân răng (Dentigerous cyst)', prob: 18.2 },
      ],
      recommendations: [
        'Chụp ConeBeam CT 3D khảo sát tương quan chân răng khôn với ống thần kinh răng dưới.',
        'Chỉ định phẫu thuật nhổ răng khôn mọc lệch để bảo vệ răng hàm số 37.',
        'Dùng kháng sinh và kháng viêm trước / sau tiểu phẫu nếu có dấu hiệu viêm lợi trùm.',
      ],
    },
  },
  {
    id: 'sample-3',
    name: 'Ảnh chụp khoang miệng (Viêm nướu & Cao răng độ III)',
    url: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=600&q=80',
    mockResult: {
      diseaseName: 'Viêm nướu răng mạn tính kèm vôi răng dưới nướu (Chronic Gingivitis)',
      icdCode: 'K05.1',
      confidence: 93.8,
      severity: 'Trung bình',
      severityColor: '#d97706',
      severityBg: '#fef3c7',
      description: 'Mô nướu viền đỏ sưng nề, tụt lợi nhẹ vùng răng cửa hàm dưới, mảng bám vôi răng dưới nướu tích tụ dày.',
      differentials: [
        { name: 'Viêm nướu mạn tính mảng bám', prob: 93.8 },
        { name: 'Viêm nha chu giai đoạn sớm', prob: 45.0 },
      ],
      recommendations: [
        'Lấy cao răng siêu âm trên và dưới nướu toàn bộ hai hàm.',
        'Bơm rửa túi lợi bằng dung dịch sát khuẩn Chlorhexidine 0.12%.',
        'Hướng dẫn bệnh nhân kỹ thuật chải răng Bass cải tiến và dùng chỉ nha khoa hàng ngày.',
      ],
    },
  },
];

export default function DoctorAIDiagnosis() {
  const toast = useToast();
  const fileInputRef = useRef(null);

  // States
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [diagnosisResult, setDiagnosisResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Xử lý khi chọn file ảnh từ máy
  const handleFileSelect = (file) => {
    if (!file) return;

    // Kiểm tra định dạng ảnh
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh hợp lệ (JPG, PNG, WEBP, JPEG)');
      return;
    }

    // Giới hạn 15MB
    if (file.size > 15 * 1024 * 1024) {
      toast.error('Dung lượng hình ảnh không được vượt quá 15MB');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setDiagnosisResult(null);
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Kéo thả ảnh
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Chọn ảnh mẫu thử nghiệm
  const handleSelectSample = (sample) => {
    setSelectedFile(null);
    setPreviewUrl(sample.url);
    setDiagnosisResult(sample.mockResult);
    toast.info(`Đã nạp ảnh mẫu: "${sample.name}"`);
  };

  // Reset
  const handleClearImage = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setDiagnosisResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * =========================================================================
   * GỌI PHÂN TÍCH AI (AI INFERENCE)
   * =========================================================================
   * TODO (Sau này khi bạn triển khai AI service, gắn API tại đây):
   * 
   * async function callDentalAIService(imageFile) {
   *   const formData = new FormData();
   *   formData.append('image', imageFile);
   *   const res = await api.post('/ai/dental-diagnose', formData, {
   *     headers: { 'Content-Type': 'multipart/form-data' }
   *   });
   *   return res.data.result;
   * }
   * =========================================================================
   */
  const handleAnalyzeImage = async () => {
    if (!previewUrl && !selectedFile) {
      toast.warning('Vui lòng tải lên ảnh chụp răng hoặc phim X-quang trước khi phân tích');
      return;
    }

    setAnalyzing(true);
    setDiagnosisResult(null);

    try {
      // Mô phỏng thời gian AI phân tích ảnh trong 1.6 giây
      await new Promise((resolve) => setTimeout(resolve, 1600));

      // Mặc định kết quả chẩn đoán mô phỏng thông minh
      const simulatedResult = {
        diseaseName: 'Sâu ngà răng sâu / Nguy cơ viêm tủy (Deep Dental Caries)',
        icdCode: 'K02.1',
        confidence: 95.8,
        severity: 'Nghiêm trọng (Cần xử lý sớm)',
        severityColor: '#dc2626',
        severityBg: '#fee2e2',
        description:
          'Hệ thống phát hiện tổn thương tiêu hủy cấu trúc mô cứng của răng với mật độ thấu quang cao tại mặt nhai và mặt tiếp giáp, độ sâu tổn thương tiến gần buồng tủy răng.',
        differentials: [
          { name: 'Sâu răng ngà sâu tiến triển', prob: 95.8 },
          { name: 'Viêm tủy răng tiền phát có thể hồi phục', prob: 78.4 },
          { name: 'Nứt vỡ thân răng vi thể', prob: 22.1 },
        ],
        recommendations: [
          'Thực hiện thăm khám trực tiếp bằng thám trâm và thử cảm giác nhiệt (Cold test).',
          'Chụp thêm phim X-quang cận chóp kỹ thuật số góc chuẩn để xác định ranh giới tủy.',
          'Làm sạch xoang hàn bằng mũi khoan siêu tốc, lót đáy canxi hydroxit hoặc MTA che tủy.',
        ],
      };

      setDiagnosisResult(simulatedResult);
      toast.success('AI đã phân tích xong và đưa ra dự đoán bệnh lý!');
    } catch (err) {
      toast.error('Có lỗi xảy ra trong quá trình phân tích hình ảnh');
    } finally {
      setAnalyzing(false);
    }
  };

  // Sao chép kết luận chẩn đoán vào clipboard
  const handleCopyConclusion = () => {
    if (!diagnosisResult) return;
    const text = `[AI Chẩn đoán]: ${diagnosisResult.diseaseName} (${diagnosisResult.icdCode}) - Độ tin cậy: ${diagnosisResult.confidence}%. ${diagnosisResult.description}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Đã sao chép kết luận AI vào clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleInputChange}
      />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: 'var(--gray-900)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Sparkles size={28} style={{ color: 'var(--doctor-accent)' }} />
              AI Chẩn đoán Bệnh Răng Miệng
            </h1>
            <span
              className="badge"
              style={{
                background: '#ede9fe',
                color: '#6d28d9',
                fontWeight: 700,
                fontSize: '0.75rem',
                padding: '4px 10px',
                borderRadius: 20,
              }}
            >
              AI Assistant Module (Ready for API)
            </span>
          </div>
          <p style={{ margin: 0, color: 'var(--gray-500)', fontSize: '0.9rem' }}>
            Hệ thống hỗ trợ bác sĩ nhận diện tự động các loại bệnh lý nha khoa (sâu răng, viêm tủy, răng khôn, viêm quanh cuống...) từ hình ảnh chụp hoặc phim X-quang
          </p>
        </div>
      </div>

      {/* Banner lưu ý */}
      <div
        style={{
          padding: '12px 18px',
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: 12,
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontSize: '0.85rem',
          color: '#1e40af',
        }}
      >
        <Info size={20} style={{ flexShrink: 0, color: '#2563eb' }} />
        <div style={{ flex: 1, lineHeight: 1.5 }}>
          <strong>Cơ chế hoạt động:</strong> Hình ảnh được phân tích trực tiếp từ thiết bị của bác sĩ gửi tới mô hình AI và không lưu trữ lên kho Supabase. Kết quả từ AI đóng vai trò tham vấn chuyên môn, hỗ trợ bác sĩ đưa ra chẩn đoán chính xác hơn.
        </div>
      </div>

      {/* Main Grid: Upload & Preview on Left, Analysis & Results on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 24, alignItems: 'start' }}>
        {/* ================= CỘT TRÁI: VÙNG TẢI ẢNH & PREVIEW ================= */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--gray-900)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <ImageIcon size={18} style={{ color: 'var(--doctor-accent)' }} />
              Hình ảnh cần phân tích
            </h3>
            {previewUrl && (
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={handleClearImage}
                style={{ fontSize: '0.8rem', color: '#dc2626' }}
              >
                Xóa ảnh
              </button>
            )}
          </div>

          <div style={{ padding: 20 }}>
            {/* Dropzone hoặc Preview */}
            {!previewUrl ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: isDragOver ? '2px dashed var(--doctor-accent)' : '2px dashed #cbd5e1',
                  background: isDragOver ? '#faf5ff' : '#f8fafc',
                  borderRadius: 14,
                  padding: '48px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: '#ede9fe',
                    color: 'var(--doctor-accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 14px',
                  }}
                >
                  <Upload size={26} />
                </div>
                <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: '1rem', color: 'var(--gray-800)' }}>
                  Kéo thả ảnh vào đây hoặc bấm để tải lên
                </p>
                <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--gray-500)' }}>
                  Hỗ trợ định dạng JPG, PNG, WEBP, ảnh chụp cận cảnh hoặc phim X-quang nha khoa (Tối đa 15MB)
                </p>
              </div>
            ) : (
              <div>
                <div
                  style={{
                    position: 'relative',
                    borderRadius: 12,
                    overflow: 'hidden',
                    border: '1px solid #e2e8f0',
                    background: '#0f172a',
                    textAlign: 'center',
                    minHeight: 280,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <img
                    src={previewUrl}
                    alt="Dental preview"
                    style={{
                      maxWidth: '100%',
                      maxHeight: 380,
                      objectFit: 'contain',
                      display: 'block',
                      margin: '0 auto',
                    }}
                  />

                  {/* Scanning overlay effect when analyzing */}
                  {analyzing && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(124, 58, 237, 0.25)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backdropFilter: 'blur(2px)',
                      }}
                    >
                      <div className="spinner" style={{ borderColor: '#ffffff', borderTopColor: 'transparent', width: 42, height: 42 }} />
                      <span style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.95rem', marginTop: 12, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                        AI đang quét và đối chiếu bệnh lý...
                      </span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                    {selectedFile ? `File: ${selectedFile.name} (${(selectedFile.size / 1024).toFixed(1)} KB)` : 'Ảnh minh họa thử nghiệm'}
                  </span>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={() => fileInputRef.current?.click()}
                    style={{ fontSize: '0.8rem' }}
                  >
                    Đổi ảnh khác
                  </button>
                </div>
              </div>
            )}

            {/* Action Analyze Button */}
            <div style={{ marginTop: 20 }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleAnalyzeImage}
                disabled={(!previewUrl && !selectedFile) || analyzing}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  background: 'var(--doctor-accent)',
                  borderColor: 'var(--doctor-accent)',
                }}
              >
                {analyzing ? (
                  <>
                    <RefreshCw size={18} className="spin-slow" />
                    <span>Đang phân tích bệnh lý...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>Phân tích hình ảnh với AI</span>
                  </>
                )}
              </button>
            </div>

            {/* Ảnh mẫu thử nghiệm (Quick sample selector) */}
            <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--gray-600)', display: 'block', marginBottom: 10 }}>
                Thử nhanh với ảnh mẫu bệnh án:
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {SAMPLE_PREVIEWS.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => handleSelectSample(sample)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      color: 'var(--gray-800)',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--doctor-accent)';
                      e.currentTarget.style.background = '#faf5ff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.background = '#f8fafc';
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{sample.name}</span>
                    <ArrowRight size={13} style={{ color: 'var(--gray-400)' }} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ================= CỘT PHẢI: KẾT QUẢ PHÂN TÍCH AI ================= */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--gray-900)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={18} style={{ color: '#16a34a' }} />
              Kết quả chẩn đoán bệnh lý
            </h3>
            {diagnosisResult && (
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={handleCopyConclusion}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', padding: '4px 10px' }}
              >
                {copied ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
                <span>{copied ? 'Đã sao chép' : 'Sao chép kết luận'}</span>
              </button>
            )}
          </div>

          <div style={{ padding: 20 }}>
            {!diagnosisResult && !analyzing ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--gray-400)' }}>
                <Zap size={48} style={{ margin: '0 auto 12px', opacity: 0.35, color: 'var(--doctor-accent)' }} />
                <p style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--gray-700)', margin: '0 0 6px' }}>
                  Chưa có dữ liệu phân tích
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', margin: 0, maxWidth: 360, marginInline: 'auto' }}>
                  Tải lên ảnh chụp khoang miệng hoặc phim X-quang răng rồi nhấn <strong>"Phân tích hình ảnh với AI"</strong> để xem kết quả nhận diện
                </p>
              </div>
            ) : analyzing ? (
              <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto 16px', width: 44, height: 44 }} />
                <h4 style={{ margin: '0 0 8px', fontSize: '1.05rem', fontWeight: 700, color: 'var(--gray-800)' }}>
                  Mô hình AI đang xử lý hình ảnh...
                </h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--gray-500)' }}>
                  Đang quét và so sánh các đặc trưng giải phẫu nha khoa với tập dữ liệu bệnh lý
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* 1. Primary Disease Identified */}
                <div
                  style={{
                    padding: 18,
                    background: '#f8fafc',
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    borderLeft: '4px solid var(--doctor-accent)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
                    <div>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Bệnh lý nhận diện chính
                      </span>
                      <h2 style={{ margin: '4px 0 0', fontSize: '1.2rem', fontWeight: 800, color: 'var(--gray-900)' }}>
                        {diagnosisResult.diseaseName}
                      </h2>
                    </div>

                    <span
                      className="badge"
                      style={{
                        background: diagnosisResult.severityBg,
                        color: diagnosisResult.severityColor,
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        padding: '4px 10px',
                        borderRadius: 6,
                      }}
                    >
                      {diagnosisResult.severity}
                    </span>
                  </div>

                  {/* Confidence Bar */}
                  <div style={{ marginTop: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray-700)' }}>
                        Độ tin cậy của mô hình (Confidence score)
                      </span>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--doctor-accent)' }}>
                        {diagnosisResult.confidence}%
                      </strong>
                    </div>
                    <div style={{ height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${diagnosisResult.confidence}%`,
                          background: 'linear-gradient(90deg, #7c3aed 0%, #10b981 100%)',
                          borderRadius: 4,
                          transition: 'width 0.6s ease',
                        }}
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <p style={{ margin: '14px 0 0', fontSize: '0.85rem', color: 'var(--gray-700)', lineHeight: 1.6 }}>
                    {diagnosisResult.description}
                  </p>
                </div>

                {/* 2. Differential Diagnoses */}
                {diagnosisResult.differentials && (
                  <div>
                    <h4 style={{ margin: '0 0 10px', fontSize: '0.9rem', fontWeight: 700, color: 'var(--gray-800)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Sliders size={15} style={{ color: 'var(--doctor-accent)' }} />
                      <span>Xác suất các bệnh lý liên quan khác</span>
                    </h4>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {diagnosisResult.differentials.map((item, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px 12px',
                            background: '#f8fafc',
                            borderRadius: 8,
                            fontSize: '0.825rem',
                          }}
                        >
                          <span style={{ color: 'var(--gray-800)', fontWeight: 500 }}>{item.name}</span>
                          <span style={{ fontWeight: 700, color: item.prob >= 80 ? 'var(--doctor-accent)' : 'var(--gray-500)' }}>
                            {item.prob}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Clinical Recommendations */}
                {diagnosisResult.recommendations && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 16 }}>
                    <h4 style={{ margin: '0 0 10px', fontSize: '0.9rem', fontWeight: 700, color: '#166534', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle2 size={16} />
                      <span>Gợi ý phác đồ & Hướng xử trí hỗ trợ Bác sĩ</span>
                    </h4>
                    <ul style={{ margin: 0, paddingLeft: 20, fontSize: '0.825rem', color: '#15803d', lineHeight: 1.6 }}>
                      {diagnosisResult.recommendations.map((rec, idx) => (
                        <li key={idx} style={{ marginBottom: 4 }}>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

