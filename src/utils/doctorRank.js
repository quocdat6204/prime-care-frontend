/**
 * Mapping chức vụ / học hàm học vị của Bác sĩ sang tiếng Việt
 */
export const doctorRankLabels = {
  PROFESSOR: 'Giáo sư',
  DOCTORATE: 'Tiến sĩ',
  MASTER: 'Thạc sĩ',
};

export const doctorRankShortLabels = {
  PROFESSOR: 'GS',
  DOCTORATE: 'TS',
  MASTER: 'ThS',
};

const TITLE_PREFIX_RE = /^(GS|PGS|TS|ThS|BS|CKI{1,2}|BSCK\w*)\b/i;

/**
 * Format chức vụ bác sĩ sang tiếng Việt hiển thị
 * @param {string} rank - Mã chức vụ (PROFESSOR, DOCTORATE, MASTER, ...)
 * @returns {string} Tên chức vụ tiếng Việt
 */
export const formatDoctorRank = (rank) => {
  if (!rank) return '';
  const key = String(rank).trim().toUpperCase();
  return doctorRankLabels[key] || rank;
};

/**
 * Ghép học hàm/học vị vào trước tên bác sĩ, tránh lặp nếu tên trong DB đã chứa sẵn danh xưng.
 */
export const formatDoctorDisplayName = (fullName, rank, { short = false } = {}) => {
  const name = (fullName || '').trim();
  if (!name) return 'Bác sĩ';
  if (TITLE_PREFIX_RE.test(name)) return name;
  if (!rank) return name;

  const key = String(rank).trim().toUpperCase();
  const prefix = short
    ? (doctorRankShortLabels[key] ? `${doctorRankShortLabels[key]}. ` : '')
    : `${formatDoctorRank(rank)} `;
  return `${prefix}${name}`.trim();
};

