import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Sparkles, Upload, Image as ImageIcon, RefreshCw, Copy, Check, Info, Zap,
  ShieldAlert, AlertTriangle, Download, Eye, EyeOff, Activity, Cpu,
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
  { name: 'v4_lite', label: 'Chính xác (v4_lite)', description: 'Độ chính xác cao nhất, chậm hơn một chút.', loaded: true },
  { name: 'v3_fast', label: 'Nhanh (v3_fast)', description: 'Nhanh hơn, kém hơn chút ở sâu răng và viêm quanh chóp.', loaded: true },
];
const MAX_MB = 10;

const fmtScore = (s) => s.toFixed(2);

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
    const lines = summary.filter((s) => s.count > 0)
      .map((s) => `- ${s.name_vi}: ${s.count} vùng (độ tin cậy cao nhất ${fmtScore(s.max_score)})`);
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

  const pathologyFound = summary.filter((s) => s.group === 'pathology' && s.count > 0);

  return (
    <div style={{ paddingBottom: 40 }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        style={{ display: 'none' }}
        onChange={(e) => handleFileSelect(e.target.files?.[0])}
      />

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: '0 0 6px', fontSize: '1.6rem', fontWeight: 800, color: 'var(--gray-900)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Sparkles size={28} style={{ color: 'var(--doctor-accent)' }} />
          AI hỗ trợ đọc phim X-quang toàn cảnh
        </h1>
        <p style={{ margin: 0, color: 'var(--gray-500)', fontSize: '0.9rem' }}>
          Đánh dấu vị trí 9 loại tổn thương và cấu trúc: viêm quanh chóp, sâu răng, răng khôn, mất răng, miếng trám, điều trị tủy, implant, mão sứ, cầu răng sứ.
        </p>
      </div>

      {/* Lưu ý */}
      <div style={{ padding: '12px 18px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, marginBottom: 20, display: 'flex', gap: 12, fontSize: '0.85rem', color: '#92400e', lineHeight: 1.55 }}>
        <ShieldAlert size={20} style={{ flexShrink: 0, color: '#d97706', marginTop: 1 }} />
        <div>
          <strong>Công cụ hỗ trợ, không thay thế chẩn đoán của bác sĩ.</strong> Chỉ dùng phim X-quang toàn cảnh (panoramic), đúng chiều.
          Độ tin cậy dùng để xếp hạng vùng đánh dấu, <strong>không phải xác suất mắc bệnh</strong>. Ảnh chỉ được phân tích, không được lưu lại.
        </div>
      </div>

      {/* Ảnh và điều khiển */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--gray-900)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ImageIcon size={18} style={{ color: 'var(--doctor-accent)' }} />
            Phim X-quang
          </h3>
          {previewUrl && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn btn-sm btn-outline" onClick={() => fileInputRef.current?.click()} disabled={analyzing}>
                Đổi ảnh khác
              </button>
              <button type="button" className="btn btn-sm btn-ghost" onClick={handleClear} disabled={analyzing} style={{ color: '#dc2626' }}>
                Xóa ảnh
              </button>
            </div>
          )}
        </div>

        <div style={{ padding: 20 }}>
          {!previewUrl ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragOver(false); handleFileSelect(e.dataTransfer.files?.[0]); }}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: isDragOver ? '2px dashed var(--doctor-accent)' : '2px dashed #cbd5e1',
                background: isDragOver ? '#eff6ff' : '#f8fafc',
                borderRadius: 14, padding: '48px 20px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#dbeafe', color: 'var(--doctor-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <Upload size={26} />
              </div>
              <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: '1rem', color: 'var(--gray-800)' }}>
                Kéo thả phim vào đây hoặc bấm để tải lên
              </p>
              <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--gray-500)' }}>
                Phim X-quang toàn cảnh, định dạng JPG hoặc PNG, tối đa {MAX_MB}MB
              </p>
            </div>
          ) : (
            <XrayCanvas
              src={previewUrl}
              result={result}
              boxes={visible}
              hoverIdx={hoverIdx}
              setHoverIdx={setHoverIdx}
              analyzing={analyzing}
            />
          )}

          {/* Chọn mô hình + nút phân tích */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap', marginTop: 18 }}>
            <div style={{ flex: '1 1 320px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--gray-600)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Cpu size={14} /> Mô hình
              </span>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {models.map((m) => {
                  const active = model === m.name;
                  return (
                    <button
                      key={m.name}
                      type="button"
                      disabled={!m.loaded || analyzing}
                      onClick={() => setModel(m.name)}
                      title={m.loaded ? m.description : `Chưa sẵn sàng: ${m.error || 'mô hình chưa được nạp'}`}
                      style={{
                        flex: '1 1 150px', textAlign: 'left', padding: '10px 12px', borderRadius: 10, cursor: m.loaded ? 'pointer' : 'not-allowed',
                        border: active ? '2px solid var(--doctor-accent)' : '1px solid #e2e8f0',
                        background: active ? '#eff6ff' : '#fff', opacity: m.loaded ? 1 : 0.5,
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--gray-900)' }}>{m.label || m.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: 2 }}>
                        {m.loaded ? m.description : 'Chưa sẵn sàng'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleAnalyze}
              disabled={!file || analyzing}
              style={{ flex: '0 1 260px', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontWeight: 700, background: 'var(--doctor-accent)', borderColor: 'var(--doctor-accent)' }}
            >
              {analyzing ? <><RefreshCw size={18} className="spin-slow" /><span>Đang phân tích...</span></> : <><Sparkles size={18} /><span>Phân tích phim</span></>}
            </button>
          </div>
        </div>
      </div>

      {/* Kết quả */}
      {!result ? (
        <div className="card" style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--gray-400)' }}>
          <Zap size={44} style={{ margin: '0 auto 12px', opacity: 0.35, color: 'var(--doctor-accent)' }} />
          <p style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--gray-700)', margin: '0 0 6px' }}>Chưa có kết quả</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', margin: 0 }}>
            Tải phim lên, chọn mô hình rồi bấm <strong>Phân tích phim</strong>.
          </p>
        </div>
      ) : (
        <>
          {result.warnings?.length > 0 && (
            <div style={{ padding: '12px 18px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, marginBottom: 20, fontSize: '0.85rem', color: '#991b1b' }}>
              {result.warnings.map((w) => (
                <div key={w} style={{ display: 'flex', gap: 8, alignItems: 'center' }}><AlertTriangle size={16} /> {w}</div>
              ))}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20, alignItems: 'start' }}>
            {/* Tóm tắt theo lớp */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--gray-900)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Activity size={18} style={{ color: '#16a34a' }} /> Tóm tắt
                </h3>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="button" className="btn btn-sm btn-outline" onClick={handleCopy} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.78rem' }}>
                    {copied ? <Check size={13} color="#16a34a" /> : <Copy size={13} />} {copied ? 'Đã chép' : 'Sao chép'}
                  </button>
                  <button type="button" className="btn btn-sm btn-outline" onClick={handleDownloadJson} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.78rem' }}>
                    <Download size={13} /> JSON
                  </button>
                </div>
              </div>
              <div style={{ padding: 20 }}>
                <div style={{ padding: '10px 14px', borderRadius: 10, marginBottom: 14, fontSize: '0.85rem', background: pathologyFound.length ? '#fff7ed' : '#f0fdf4', color: pathologyFound.length ? '#9a3412' : '#166534', border: `1px solid ${pathologyFound.length ? '#fed7aa' : '#bbf7d0'}` }}>
                  {pathologyFound.length
                    ? <>Có vùng nghi ngờ <strong>{pathologyFound.map((s) => `${s.name_vi.toLowerCase()} (${s.count})`).join(', ')}</strong> trên ngưỡng {fmtScore(minScore)}.</>
                    : <>Không có vùng nghi ngờ bệnh lý nào trên ngưỡng {fmtScore(minScore)}.</>}
                </div>

                {/* Ngưỡng */}
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--gray-600)', marginBottom: 4 }}>
                  Ngưỡng độ tin cậy: <span style={{ color: 'var(--doctor-accent)' }}>{fmtScore(minScore)}</span>
                </label>
                <input type="range" min={result.score_thr ?? 0.3} max={0.9} step={0.05} value={minScore}
                  onChange={(e) => setMinScore(Number(e.target.value))} style={{ width: '100%' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--gray-500)', marginBottom: 14 }}>
                  <span>0.3: ít bỏ sót, nhiều báo nhầm hơn</span><span>0.5+: gọn, dễ bỏ sót</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {summary.map((s) => {
                    const off = hidden.has(s.class_id);
                    return (
                      <button key={s.class_id} type="button" onClick={() => toggleClass(s.class_id)}
                        title={off ? 'Bấm để hiện trên ảnh' : 'Bấm để ẩn trên ảnh'}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 8, border: '1px solid #f1f5f9', background: s.count ? '#fff' : '#f8fafc', cursor: 'pointer', opacity: off ? 0.45 : 1, textAlign: 'left' }}>
                        <span style={{ width: 12, height: 12, borderRadius: 3, background: CLASS_COLORS[s.class_id], flexShrink: 0 }} />
                        <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: s.group === 'pathology' ? 700 : 500, color: 'var(--gray-800)' }}>
                          {s.name_vi} <span style={{ fontWeight: 400, color: 'var(--gray-400)', fontSize: '0.75rem' }}>· {GROUP_LABELS[s.group]}</span>
                        </span>
                        <span style={{ fontSize: '0.8rem', color: s.count ? 'var(--gray-900)' : 'var(--gray-400)', fontWeight: 700 }}>{s.count}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', width: 40, textAlign: 'right' }}>{s.count ? fmtScore(s.max_score) : '–'}</span>
                        {off ? <EyeOff size={14} color="#94a3b8" /> : <Eye size={14} color="#94a3b8" />}
                      </button>
                    );
                  })}
                </div>
                <p style={{ margin: '12px 0 0', fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                  Mô hình {result.model} · {result.device?.startsWith('cuda') ? 'GPU' : 'CPU'} · {Math.round(result.inference_ms)} ms · ảnh {result.image_width}×{result.image_height}
                </p>
              </div>
            </div>

            {/* Danh sách vùng đánh dấu */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--gray-900)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Info size={18} style={{ color: 'var(--doctor-accent)' }} /> Các vùng đánh dấu ({visible.length})
                </h3>
              </div>
              <div style={{ padding: 12, maxHeight: 520, overflowY: 'auto' }}>
                {visible.length === 0 ? (
                  <p style={{ padding: 20, textAlign: 'center', color: 'var(--gray-500)', fontSize: '0.85rem', margin: 0 }}>
                    Không có vùng nào trên ngưỡng hiện tại.
                  </p>
                ) : visible.map((d) => (
                  <div key={d.idx}
                    onMouseEnter={() => setHoverIdx(d.idx)} onMouseLeave={() => setHoverIdx(null)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: hoverIdx === d.idx ? '#f1f5f9' : 'transparent', cursor: 'default' }}>
                    <span style={{ width: 12, height: 12, borderRadius: 3, border: `2px ${d.score >= STRONG_SCORE ? 'solid' : 'dashed'} ${CLASS_COLORS[d.class_id]}`, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: '0.85rem', color: 'var(--gray-800)', fontWeight: d.group === 'pathology' ? 700 : 500 }}>
                      {d.name_vi}
                      {d.score < STRONG_SCORE && <span style={{ marginLeft: 6, fontSize: '0.72rem', color: '#b45309', fontWeight: 600 }}>cần xem lại</span>}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>độ tin cậy {fmtScore(d.score)}</span>
                  </div>
                ))}
              </div>
              <div style={{ padding: '10px 20px', borderTop: '1px solid #f1f5f9', fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                Nét liền: độ tin cậy ≥ {STRONG_SCORE}. Nét đứt: dưới {STRONG_SCORE}, cần bác sĩ xem lại. Rê chuột lên dòng để làm nổi vùng trên ảnh.
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Ảnh phim kèm các khung vẽ bằng SVG. viewBox = kích thước ảnh gốc nên toạ độ bbox dùng trực tiếp.
function XrayCanvas({ src, result, boxes, hoverIdx, setHoverIdx, analyzing }) {
  const W = result?.image_width;
  const H = result?.image_height;
  const fontSize = W ? Math.max(14, W / 80) : 14;

  return (
    <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0', background: '#0f172a' }}>
      <img src={src} alt="Phim X-quang" style={{ display: 'block', width: '100%', height: 'auto' }} />
      {result && (
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          {boxes.map((d) => {
            const [x1, y1, x2, y2] = d.bbox_xyxy;
            const color = CLASS_COLORS[d.class_id];
            const active = hoverIdx === d.idx;
            const dim = hoverIdx !== null && !active;
            const label = `${d.name_vi} ${fmtScore(d.score)}`;
            return (
              <g key={d.idx} opacity={dim ? 0.3 : 1} onMouseEnter={() => setHoverIdx(d.idx)} onMouseLeave={() => setHoverIdx(null)} style={{ cursor: 'default' }}>
                <rect x={x1} y={y1} width={x2 - x1} height={y2 - y1} fill={active ? `${color}33` : 'transparent'}
                  stroke={color} strokeWidth={active ? 3.5 : 2} vectorEffect="non-scaling-stroke"
                  strokeDasharray={d.score >= STRONG_SCORE ? undefined : '6 4'} />
                <rect x={x1} y={Math.max(0, y1 - fontSize * 1.35)} width={label.length * fontSize * 0.58 + fontSize * 0.6} height={fontSize * 1.35} fill={color} rx={3} />
                <text x={x1 + fontSize * 0.3} y={Math.max(0, y1 - fontSize * 1.35) + fontSize * 1.02} fill="#fff" fontSize={fontSize} fontWeight={700} fontFamily="sans-serif">
                  {label}
                </text>
                <title>{`${d.name_vi} (${d.class}) – độ tin cậy ${fmtScore(d.score)}`}</title>
              </g>
            );
          })}
        </svg>
      )}
      {analyzing && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.55)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner" style={{ borderColor: '#ffffff', borderTopColor: 'transparent', width: 42, height: 42 }} />
          <span style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.95rem', marginTop: 12 }}>Mô hình đang phân tích phim...</span>
        </div>
      )}
    </div>
  );
}
