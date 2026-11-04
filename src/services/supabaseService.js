import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const defaultBucket = import.meta.env.VITE_SUPABASE_BUCKET || 'dental-assets';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Upload file lên Supabase Storage (Hàm dùng chung)
 * @param {File} file - File cần upload
 * @param {string} folder - Thư mục con (ví dụ: 'avatars', 'xray', 'prescriptions')
 * @param {string} bucket - Tên bucket (mặc định: 'dental-assets')
 * @returns {Promise<string>} publicUrl - URL công khai của file đã upload
 */
export async function uploadFile(file, folder = 'avatars', bucket = defaultBucket) {
  const timestamp = Date.now();
  const ext = file.name.split('.').pop();
  const sanitized = file.name
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 50);
  const fileName = `${folder}/${sanitized}_${timestamp}.${ext}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Tải tệp tin lên thất bại: ${error.message || 'Lỗi không xác định'}`);
  }

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

/**
 * Xóa file trên Supabase Storage
 * @param {string} fileUrl - URL đầy đủ hoặc path tương đối
 * @param {string} bucket
 */
export async function deleteFile(fileUrl, bucket = defaultBucket) {
  let filePath = fileUrl;
  if (fileUrl.includes(bucket)) {
    filePath = fileUrl.split(`${bucket}/`).pop();
  }

  const { error } = await supabase.storage
    .from(bucket)
    .remove([filePath]);

  if (error) {
    throw new Error(`Xóa tệp tin thất bại: ${error.message || 'Lỗi không xác định'}`);
  }
}

/**
 * Lấy URL công khai từ path
 */
export function getPublicUrl(path, bucket = defaultBucket) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export default supabase;
