import { useState, useRef } from 'react';
import { Camera, Upload, X, Loader } from 'lucide-react';
import { uploadFile } from '../../services/supabaseService';
import { getErrorMessage } from '../../utils/errorMessage';

export default function ImageUploader({
  currentImage,
  onUpload,
  folder = 'avatars',
  size = 'xl',
  autoUpload = true,
}) {
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type and size
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      alert('Chỉ chấp nhận file ảnh JPG, PNG hoặc WebP');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Kích thước ảnh không được vượt quá 5MB');
      return;
    }

    if (autoUpload) {
      // Auto-upload immediately to Supabase
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result);
      reader.readAsDataURL(file);

      setUploading(true);
      try {
        const publicUrl = await uploadFile(file, folder);
        onUpload?.(publicUrl);
        setPreview(null);
      } catch (err) {
        setPreview(null);
        alert(getErrorMessage(err, 'Tải ảnh lên thất bại. Vui lòng kiểm tra dung lượng và định dạng ảnh!'));
      } finally {
        setUploading(false);
        if (fileRef.current) fileRef.current.value = '';
      }
    } else {
      // Manual upload mode
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    const file = fileRef.current?.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const publicUrl = await uploadFile(file, folder);
      onUpload?.(publicUrl);
      setPreview(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      alert(getErrorMessage(err, 'Tải ảnh lên thất bại. Vui lòng kiểm tra dung lượng và định dạng ảnh!'));
    } finally {
      setUploading(false);
    }
  };

  const cancelPreview = () => {
    setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const displayImage = preview || currentImage;
  const sizeClass = `avatar-${size}`;
  const sizePx = size === 'xl' ? 120 : size === 'lg' ? 80 : 48;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div className="profile-avatar-wrapper" style={{ position: 'relative' }}>
        {displayImage ? (
          <img src={displayImage} alt="Avatar" className={`avatar ${sizeClass}`} />
        ) : (
          <div
            className={`avatar-placeholder ${sizeClass}`}
            style={{ width: sizePx, height: sizePx, fontSize: sizePx * 0.35 }}
          >
            <Camera size={sizePx * 0.3} />
          </div>
        )}

        {/* Loading Spinner overlay when uploading */}
        {uploading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: 'rgba(0, 0, 0, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              zIndex: 3,
            }}
          >
            <Loader size={sizePx * 0.35} className="spin-slow" />
          </div>
        )}

        {!uploading && (!preview || autoUpload) && (
          <label className="profile-avatar-edit" title="Chọn ảnh mới">
            <Camera size={14} />
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
          </label>
        )}
      </div>

      {uploading && (
        <span style={{ fontSize: '0.75rem', color: 'var(--primary-600)', fontWeight: 500 }}>
          Đang tải ảnh lên kho lưu trữ...
        </span>
      )}

      {!autoUpload && preview && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleUpload}
            disabled={uploading}
          >
            {uploading ? <Loader size={14} className="spinner-sm" /> : <Upload size={14} />}
            {uploading ? 'Đang tải...' : 'Lưu ảnh'}
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={cancelPreview} disabled={uploading}>
            <X size={14} />
            Hủy
          </button>
        </div>
      )}
    </div>
  );
}
