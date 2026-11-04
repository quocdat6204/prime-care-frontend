/**
 * Mapping chức vụ / học hàm học vị của Bác sĩ sang tiếng Việt
 */
export const doctorRankLabels = {
  PROFESSOR: 'Giáo sư',
  DOCTORATE: 'Tiến sĩ',
  MASTER: 'Thạc sĩ',
};

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

