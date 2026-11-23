import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Sparkles, Upload, RefreshCw, Copy, Check, ShieldAlert, AlertTriangle, Download,
  Eye, EyeOff, Maximize2, X, Tag, Trash2, ImagePlus, Cpu, SlidersHorizontal, ListChecks,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { xrayService } from '../../services/xrayService';
import { getErrorMessage } from '../../utils/errorMessage';

// Màu theo lớp; hai lớp bệnh lý dùng màu nóng để nổi bật
const CLASS_COLORS = {
  0: '#dc2626', // Viêm quanh chóp
  1: '#f97316', // Sâu răng
  2: '#3b82f6', // Răng khôn
  3: '#8b5cf6', // Mất răng
  4: '#14b8a6', // Miếng trám
  5: '#22c55e', // Điều trị tủy
  6: '#eab308', // Implant
  7: '#ec4899', // Mão sứ
  8: '#06b6d4', // Cầu răng sứ
};
const GROUP_LABELS = { pathology: 'Bệnh lý', structure: 'Cấu trúc', restoration: 'Phục hình' };
const STRONG_SCORE = 0.5; // từ ngưỡng này vẽ nét liền; thấp hơn vẽ nét đứt "cần xem lại"
const FALLBACK_MODELS = [
  { name: 'v4_lite', label: 'Chính xác', description: 'Độ chính xác cao nhất', loaded: true },
  { name: 'v3_fast', label: 'Nhanh', description: 'Nhanh hơn khoảng 2,4 lần', loaded: true },
];
const MAX_MB = 10;

const fmtScore = (s) => s.toFixed(2);
const shortLabel = (m) => (m.label || m.name).replace(/\s*\(.*\)\s*$/, '');

// CSS riêng của trang (bố cục 2 cột, tự xếp chồng trên màn hình hẹp)
const PAGE_CSS = `
.xr-layout { display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 20px; align-items: start; }
@media (max-width: 1100px) { .xr-layout { grid-template-columns: 1fr; } }
.xr-panel { position: sticky; top: 16px; display: flex; flex-direction: column; gap: 16px; }
@media (max-width: 1100px) { .xr-panel { position: static; } }
.xr-section-title { display: flex; align-items: center; gap: 8px; margin: 0 0 10px; font-size: 0.8rem; font-weight: 700; color: var(--gray-600); text-transform: uppercase; letter-spacing: 0.4px; }
.xr-model { flex: 1; text-align: left; padding: 9px 12px; border-radius: 10px; border: 1px solid #e2e8f0; background: #fff; cursor: pointer; transition: all .15s; }
.xr-model:hover:not(:disabled) { border-color: var(--doctor-accent); }
.xr-model.active { border: 2px solid var(--doctor-accent); background: #eff6ff; padding: 8px 11px; }
.xr-model:disabled { opacity: .5; cursor: not-allowed; }
.xr-tool { display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 8px; border: 1px solid #334155; background: rgba(15,23,42,.6); color: #e2e8f0; font-size: 0.78rem; font-weight: 600; cursor: pointer; }
.xr-tool:hover { background: #1e293b; }
.xr-tool.on { background: #2563eb; border-color: #2563eb; color: #fff; }
.xr-row { display: flex; align-items: center; gap: 10px; padding: 7px 10px; border-radius: 8px; cursor: pointer; }
.xr-row:hover, .xr-row.hover { background: #f1f5f9; }
`;

export default function DoctorAIDiagnosis() {
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [models, setModels] = useState(FALLBACK_MODELS);
  const [model, setModel] = useState('v4_lite');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [minScore, setMinScore] = useState(0.3);
  const [hidden, setHidden] = useState(() => new Set());
  const [hoverIdx, setHoverIdx] = useState(null);
  const [showLabels, setShowLabels] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Danh sách mô hình từ server (để biết mô hình nào đã nạp xong)
  useEffect(() => {
    xrayService.getModels()
      .then((res) => {
        const r = res.data?.result;
        if (Array.isArray(r?.models) && r.models.length) setModels(r.models);
        if (r?.default_model) setModel(r.default_model);
      })
      .catch(() => { /* service chưa chạy: vẫn cho chọn, lỗi sẽ báo khi phân tích */ });
  }, []);

  // Giải phóng URL ảnh xem trước khi đổi ảnh / rời trang
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  // Esc để thoát chế độ toàn màn hình
  useEffect(() => {
    if (!fullscreen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setFullscreen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreen]);

  const handleFileSelect = (f) => {
    if (!f) return;
    if (!['image/jpeg', 'image/png'].includes(f.type)) {
      toast.error('Chỉ nhận ảnh JPG hoặc PNG');
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      toast.error(`Dung lượng ảnh không được vượt quá ${MAX_MB}MB`);
      return;
    }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setResult(null);
    setHidden(new Set());
  };

  const handleClear = () => {
    setFile(null);
    setPreviewUrl('');
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAnalyze = async () => {
    if (!file) {
      toast.warning('Vui lòng tải lên phim X-quang toàn cảnh trước khi phân tích');
      return;
    }
    setAnalyzing(true);
    setResult(null);
    try {
      const res = await xrayService.analyze(file, model);
      const r = res.data?.result;
      setResult(r);
      setHidden(new Set());
      toast.success(`Đã phân tích xong: ${r.num_detections} vùng được đánh dấu`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không phân tích được ảnh, vui lòng thử lại'));
    } finally {
      setAnalyzing(false);
    }
  };

  // Box đang hiển thị: trên ngưỡng bác sĩ chọn và lớp không bị ẩn
  const visible = useMemo(() => {
    if (!result) return [];
    return result.detections
      .map((d, idx) => ({ ...d, idx }))
      .filter((d) => d.score >= minScore && !hidden.has(d.class_id));
  }, [result, minScore, hidden]);

  // Tóm tắt theo lớp, tính lại theo ngưỡng hiện tại
  const summary = useMemo(() => {
    if (!result) return [];
    return result.summary.map((s) => {
      const boxes = result.detections.filter((d) => d.class_id === s.class_id && d.score >= minScore);
      return { ...s, count: boxes.length, max_score: boxes.reduce((m, b) => Math.max(m, b.score), 0) };
    });
  }, [result, minScore]);

  const found = summary.filter((s) => s.count > 0);
  const pathologyFound = found.filter((s) => s.group === 'pathology');

  const toggleClass = (cid) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(cid)) next.delete(cid); else next.add(cid);
      return next;
    });
  };

  const handleDownloadJson = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ket-qua-xquang-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    if (!result) return;
    const lines = found.map((s) => `- ${s.name_vi}: ${s.count} vùng (độ tin cậy cao nhất ${fmtScore(s.max_score)})`);
    const text = [
      `[AI hỗ trợ đọc phim - mô hình ${result.model}, ngưỡng ${fmtScore(minScore)}]`,
      ...(lines.length ? lines : ['- Không phát hiện vùng nào trên ngưỡng']),
      'Kết quả chỉ mang tính tham khảo, cần bác sĩ xác nhận.',
    ].join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Đã sao chép tóm tắt');
    setTimeout(() => setCopied(false), 2000);
  };

  const canvasProps = { src: previewUrl, result, boxes: visible, hoverIdx, setHoverIdx, showLabels, analyzing };

  return (
    <div style={{ paddingBottom: 32 }}>
      <style>{PAGE_CSS}</style>
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" style={{ display: 'none' }}
        onChange={(e) => handleFileSelect(e.target.files?.[0])} />

      <div className="xr-layout">
      {/* ============ CỘT TRÁI: TIÊU ĐỀ + KHUNG XEM PHIM ============ */}
      <div style={{ minWidth: 0 }}>
      {/* Header gọn + lưu ý một dòng (nằm trong cột trái để cột phải bắt đầu ngang tiêu đề) */}
      <div style={{ marginBottom: 14 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '1.45rem', fontWeight: 800, color: 'var(--gray-900)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Sparkles size={24} style={{ color: 'var(--doctor-accent)' }} />
          AI hỗ trợ đọc phim X-quang
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: '#92400e' }}>
          <ShieldAlert size={15} style={{ color: '#d97706', flexShrink: 0 }} />
          <span>
            Công cụ hỗ trợ, <strong>không thay thế chẩn đoán của bác sĩ</strong>. Chỉ dùng phim toàn cảnh (panoramic).
            Độ tin cậy không phải xác suất mắc bệnh. Ảnh không được lưu lại.
          </span>
        </div>
      </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {!previewUrl ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragOver(false); handleFileSelect(e.dataTransfer.files?.[0]); }}
              onClick={() => fileInputRef.current?.click()}
              style={{
                margin: 16, height: 360, borderRadius: 14, cursor: 'pointer', transition: 'all 0.2s',
                border: isDragOver ? '2px dashed var(--doctor-accent)' : '2px dashed #cbd5e1',
                background: isDragOver ? '#eff6ff' : '#f8fafc',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 20,
              }}
            >
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#dbeafe', color: 'var(--doctor-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <Upload size={26} />
              </div>
              <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: '1rem', color: 'var(--gray-800)' }}>Kéo thả phim vào đây hoặc bấm để chọn</p>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--gray-500)' }}>Phim X-quang toàn cảnh · JPG hoặc PNG · tối đa {MAX_MB}MB</p>
            </div>
          ) : (
            <>
              {/* Thanh công cụ trên ảnh */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', padding: '10px 12px', background: '#0f172a' }}>
                <span style={{ color: '#cbd5e1', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '45%' }} title={file?.name}>
                  {file?.name}
                  {result && <span style={{ color: '#64748b' }}> · {result.image_width}×{result.image_height}</span>}
                </span>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {result && (
                    <button type="button" className={`xr-tool ${showLabels ? 'on' : ''}`} onClick={() => setShowLabels((v) => !v)} title="Bật/tắt nhãn chữ trên khung">
                      <Tag size={14} /> Nhãn
                    </button>
                  )}
                  <button type="button" className="xr-tool" onClick={() => setFullscreen(true)} title="Xem toàn màn hình">
                    <Maximize2 size={14} /> Phóng to
                  </button>
                  <button type="button" className="xr-tool" onClick={() => fileInputRef.current?.click()} disabled={analyzing}>
                    <ImagePlus size={14} /> Đổi ảnh
                  </button>
                  <button type="button" className="xr-tool" onClick={handleClear} disabled={analyzing} style={{ color: '#fca5a5' }}>
                    <Trash2 size={14} /> Xóa
                  </button>
                </div>
              </div>
              <XrayCanvas {...canvasProps} maxHeight="62vh" />
              {result?.warnings?.length > 0 && (
                <div style={{ padding: '10px 14px', background: '#fef2f2', borderTop: '1px solid #fecaca', fontSize: '0.8rem', color: '#991b1b' }}>
                  {result.warnings.map((w) => (
                    <div key={w} style={{ display: 'flex', gap: 8, alignItems: 'center' }}><AlertTriangle size={14} /> {w}</div>
                  ))}
                </div>
              )}
              {result && (
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', padding: '8px 14px', borderTop: '1px solid #f1f5f9', fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 18, borderTop: '2px solid #475569' }} /> độ tin cậy ≥ {STRONG_SCORE}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 18, borderTop: '2px dashed #475569' }} /> dưới {STRONG_SCORE}: cần xem lại
                  </span>
                  <span>Rê chuột lên khung hoặc dòng bên phải để làm nổi vùng đó.</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

        {/* ============ CỘT PHẢI: THAO TÁC & KẾT QUẢ ============ */}
        <div className="xr-panel">
          {/* Chọn mô hình + phân tích */}
          <div className="card" style={{ padding: 16 }}>
            <h4 className="xr-section-title"><Cpu size={14} /> Mô hình</h4>
            <div style={{ display: 'flex', gap: 8 }}>
              {models.map((m) => (
                <button key={m.name} type="button" disabled={!m.loaded || analyzing}
                  className={`xr-model ${model === m.name ? 'active' : ''}`}
                  onClick={() => setModel(m.name)}
                  title={m.loaded ? m.description : `Chưa sẵn sàng: ${m.error || 'mô hình chưa được nạp'}`}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--gray-900)' }}>{shortLabel(m)}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', marginTop: 1 }}>{m.loaded ? m.name : 'Chưa sẵn sàng'}</div>
                </button>
              ))}
            </div>
            <button type="button" className="btn btn-primary" onClick={handleAnalyze} disabled={!file || analyzing}
              style={{ width: '100%', marginTop: 12, padding: '11px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 700, background: 'var(--doctor-accent)', borderColor: 'var(--doctor-accent)' }}>
              {analyzing
                ? <><RefreshCw size={17} className="spin-slow" /> Đang phân tích...</>
                : <><Sparkles size={17} /> {result ? 'Phân tích lại' : 'Phân tích phim'}</>}
            </button>
            {!file && <p style={{ margin: '8px 0 0', fontSize: '0.75rem', color: 'var(--gray-500)', textAlign: 'center' }}>Tải phim lên ở khung bên trái trước.</p>}
          </div>

          {result && (
            <>
              {/* Tóm tắt */}
              <div className="card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <h4 className="xr-section-title" style={{ margin: 0 }}><SlidersHorizontal size={14} /> Kết quả</h4>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button type="button" className="btn btn-sm btn-outline" onClick={handleCopy} title="Sao chép tóm tắt" style={{ padding: '4px 8px' }}>
                      {copied ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                    </button>
                    <button type="button" className="btn btn-sm btn-outline" onClick={handleDownloadJson} title="Tải file JSON" style={{ padding: '4px 8px' }}>
                      <Download size={14} />
                    </button>
                  </div>
                </div>

                <div style={{ padding: '10px 12px', borderRadius: 10, marginBottom: 14, fontSize: '0.83rem', lineHeight: 1.5,
                  background: pathologyFound.length ? '#fff7ed' : '#f0fdf4', color: pathologyFound.length ? '#9a3412' : '#166534',
                  border: `1px solid ${pathologyFound.length ? '#fed7aa' : '#bbf7d0'}` }}>
                  {pathologyFound.length
                    ? <>Nghi ngờ <strong>{pathologyFound.map((s) => `${s.name_vi.toLowerCase()} (${s.count})`).join(', ')}</strong></>
                    : <>Không có vùng nghi ngờ bệnh lý trên ngưỡng</>}
                </div>

                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, color: 'var(--gray-600)' }}>
                  <span>Ngưỡng độ tin cậy</span><span style={{ color: 'var(--doctor-accent)' }}>{fmtScore(minScore)}</span>
                </label>
                <input type="range" min={result.score_thr ?? 0.3} max={0.9} step={0.05} value={minScore}
                  onChange={(e) => setMinScore(Number(e.target.value))} style={{ width: '100%', margin: '4px 0 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--gray-400)', marginBottom: 12 }}>
                  <span>ít bỏ sót</span><span>ít báo nhầm</span>
                </div>

                {/* Chỉ liệt kê lớp có phát hiện; bấm để ẩn/hiện trên ảnh */}
                {found.length === 0 ? (
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--gray-500)' }}>Không có vùng nào trên ngưỡng hiện tại.</p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {found.map((s) => {
                      const off = hidden.has(s.class_id);
                      const c = CLASS_COLORS[s.class_id];
                      return (
                        <button key={s.class_id} type="button" onClick={() => toggleClass(s.class_id)}
                          title={`${GROUP_LABELS[s.group]} · cao nhất ${fmtScore(s.max_score)} · bấm để ${off ? 'hiện' : 'ẩn'}`}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 999, cursor: 'pointer',
                            border: `1px solid ${c}`, background: off ? '#fff' : `${c}14`, opacity: off ? 0.45 : 1,
                            fontSize: '0.78rem', fontWeight: s.group === 'pathology' ? 700 : 600, color: 'var(--gray-800)' }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
                          {s.name_vi} <span style={{ color: 'var(--gray-500)' }}>{s.count}</span>
                          {off ? <EyeOff size={12} color="#94a3b8" /> : <Eye size={12} color="#94a3b8" />}
                        </button>
                      );
                    })}
                  </div>
                )}
                <p style={{ margin: '12px 0 0', fontSize: '0.72rem', color: 'var(--gray-400)' }}>
                  {result.model} · {result.device?.startsWith('cuda') ? 'GPU' : 'CPU'} · {Math.round(result.inference_ms)} ms
                </p>
              </div>

              {/* Danh sách vùng */}
              <div className="card" style={{ padding: 16 }}>
                <h4 className="xr-section-title"><ListChecks size={14} /> Các vùng đánh dấu ({visible.length})</h4>
                <div style={{ maxHeight: 280, overflowY: 'auto', margin: '0 -6px' }}>
                  {visible.length === 0 ? (
                    <p style={{ margin: 0, padding: '0 6px', fontSize: '0.82rem', color: 'var(--gray-500)' }}>Không có vùng nào đang hiển thị.</p>
                  ) : visible.map((d) => (
                    <div key={d.idx} className={`xr-row ${hoverIdx === d.idx ? 'hover' : ''}`}
                      onMouseEnter={() => setHoverIdx(d.idx)} onMouseLeave={() => setHoverIdx(null)}>
                      <span style={{ width: 12, height: 12, borderRadius: 3, flexShrink: 0, border: `2px ${d.score >= STRONG_SCORE ? 'solid' : 'dashed'} ${CLASS_COLORS[d.class_id]}` }} />
                      <span style={{ flex: 1, fontSize: '0.83rem', color: 'var(--gray-800)', fontWeight: d.group === 'pathology' ? 700 : 500 }}>
                        {d.name_vi}
                        {d.score < STRONG_SCORE && <span style={{ marginLeft: 6, fontSize: '0.7rem', color: '#b45309', fontWeight: 600 }}>cần xem lại</span>}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--gray-600)', fontVariantNumeric: 'tabular-nums' }}>{fmtScore(d.score)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Xem toàn màn hình */}
      {fullscreen && previewUrl && (
        <div onClick={() => setFullscreen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(2, 6, 23, 0.92)', display: 'flex', flexDirection: 'column', padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 10 }} onClick={(e) => e.stopPropagation()}>
            {result && (
              <button type="button" className={`xr-tool ${showLabels ? 'on' : ''}`} onClick={() => setShowLabels((v) => !v)}>
                <Tag size={14} /> Nhãn
              </button>
            )}
            <button type="button" className="xr-tool" onClick={() => setFullscreen(false)}><X size={14} /> Đóng (Esc)</button>
          </div>
          <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => e.stopPropagation()}>
            <XrayCanvas {...canvasProps} maxHeight="calc(100vh - 90px)" bare />
          </div>
        </div>
      )}
    </div>
  );
}

// Ảnh phim kèm khung vẽ bằng SVG. Khung bọc co theo đúng kích thước ảnh hiển thị, viewBox = kích thước ảnh gốc
// nên toạ độ bbox dùng trực tiếp, không cần quy đổi.
function XrayCanvas({ src, result, boxes, hoverIdx, setHoverIdx, showLabels, analyzing, maxHeight, bare = false }) {
  const W = result?.image_width;
  const H = result?.image_height;
  const fontSize = W ? Math.max(14, W / 85) : 14;

  return (
    <div style={{ background: bare ? 'transparent' : '#0f172a', padding: bare ? 0 : 12, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%', lineHeight: 0 }}>
        <img src={src} alt="Phim X-quang"
          style={{ display: 'block', maxWidth: '100%', maxHeight, width: 'auto', height: 'auto', borderRadius: bare ? 6 : 4 }} />
        {result && (
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            {boxes.map((d) => {
              const [x1, y1, x2, y2] = d.bbox_xyxy;
              const color = CLASS_COLORS[d.class_id];
              const active = hoverIdx === d.idx;
              const dim = hoverIdx !== null && !active;
              const label = `${d.name_vi} ${fmtScore(d.score)}`;
              const labelY = Math.max(0, y1 - fontSize * 1.35);
              return (
                <g key={d.idx} opacity={dim ? 0.25 : 1} onMouseEnter={() => setHoverIdx(d.idx)} onMouseLeave={() => setHoverIdx(null)}>
                  <rect x={x1} y={y1} width={x2 - x1} height={y2 - y1} fill={active ? `${color}33` : 'transparent'}
                    stroke={color} strokeWidth={active ? 3.5 : 2} vectorEffect="non-scaling-stroke"
                    strokeDasharray={d.score >= STRONG_SCORE ? undefined : '6 4'} />
                  {(showLabels || active) && (
                    <>
                      <rect x={x1} y={labelY} width={label.length * fontSize * 0.56 + fontSize * 0.6} height={fontSize * 1.35} fill={color} rx={3} />
                      <text x={x1 + fontSize * 0.3} y={labelY + fontSize * 1.02} fill="#fff" fontSize={fontSize} fontWeight={700} fontFamily="sans-serif">
                        {label}
                      </text>
                    </>
                  )}
                  <title>{`${d.name_vi} (${d.class}) – độ tin cậy ${fmtScore(d.score)}`}</title>
                </g>
              );
            })}
          </svg>
        )}
        {analyzing && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: 1.4 }}>
            <div className="spinner" style={{ borderColor: '#ffffff', borderTopColor: 'transparent', width: 40, height: 40 }} />
            <span style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.9rem', marginTop: 12 }}>Mô hình đang phân tích phim...</span>
          </div>
        )}
      </div>
    </div>
  );
}
