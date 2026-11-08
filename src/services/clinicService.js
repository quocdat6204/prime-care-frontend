import api from './api';

const CLINIC_BASE = '/clinic';

export const clinicService = {
  // ==========================================
  // 1. Quản lý Ca khám (Exam Sessions)
  // ==========================================
  getAdminSessions(params = {}) {
    return api.get(`${CLINIC_BASE}/sessions/admin`, { params });
  },

  getMySessions(params = {}) {
    return api.get(`${CLINIC_BASE}/sessions/my`, { params });
  },

  getAvailableSessions(params = {}) {
    return api.get(`${CLINIC_BASE}/sessions`, { params });
  },

  createSession(data) {
    return api.post(`${CLINIC_BASE}/sessions`, data);
  },

  toggleSessionStatus(id) {
    return api.patch(`${CLINIC_BASE}/sessions/${id}/status`);
  },

  getSessionAppointments(id, status) {
    const params = status ? { status } : {};
    return api.get(`${CLINIC_BASE}/sessions/${id}/appointments`, { params });
  },

  getPatientAppointments(patientId) {
    return api.get(`${CLINIC_BASE}/appointments/patient/${patientId}`);
  },

  getMyAppointments(params = {}) {
    return api.get(`${CLINIC_BASE}/appointments/my`, { params });
  },

  bookAppointment(data) {
    return api.post(`${CLINIC_BASE}/appointments`, data);
  },

  walkInAppointment(sessionId, data) {
    return api.post(`${CLINIC_BASE}/sessions/${sessionId}/walk-in`, data);
  },

  reconcileCashInvoice(appointmentId) {
    return api.post(`${CLINIC_BASE}/appointments/${appointmentId}/reconcile-invoice`);
  },

  cancelAppointment(id) {
    return api.post(`${CLINIC_BASE}/appointments/${id}/cancel`);
  },

  getAppointmentDetail(id) {
    return api.get(`${CLINIC_BASE}/appointments/${id}`);
  },

  startAppointment(id) {
    return api.post(`${CLINIC_BASE}/appointments/${id}/start`);
  },

  orderAppointmentServices(appointmentId, data) {
    return api.post(`${CLINIC_BASE}/appointments/${appointmentId}/services`, data);
  },

  cancelAppointmentService(serviceId) {
    return api.post(`${CLINIC_BASE}/appointment-services/${serviceId}/cancel`);
  },

  completeAppointment(appointmentId, data) {
    return api.post(`${CLINIC_BASE}/appointments/${appointmentId}/complete`, data);
  },

  startAppointmentService(id) {
    return api.post(`${CLINIC_BASE}/appointment-services/${id}/start`);
  },

  completeAppointmentService(id, data) {
    return api.post(`${CLINIC_BASE}/appointment-services/${id}/complete`, data);
  },

  // ==========================================
  // 2. Danh mục Dịch vụ Nha khoa (Services)
  // ==========================================
  getServices(params = {}) {
    return api.get(`${CLINIC_BASE}/services`, { params });
  },

  createService(data) {
    return api.post(`${CLINIC_BASE}/services`, data);
  },

  updateService(id, data) {
    return api.put(`${CLINIC_BASE}/services/${id}`, data);
  },

  toggleServiceStatus(id) {
    return api.patch(`${CLINIC_BASE}/services/${id}/status`);
  },

  deleteService(id) {
    return api.delete(`${CLINIC_BASE}/services/${id}`);
  },

  // ==========================================
  // 3. Danh mục Thuốc Nha khoa (Medications)
  // ==========================================
  getMedications(params = {}) {
    return api.get(`${CLINIC_BASE}/medications`, { params });
  },

  createMedication(data) {
    return api.post(`${CLINIC_BASE}/medications`, data);
  },

  updateMedication(id, data) {
    return api.put(`${CLINIC_BASE}/medications/${id}`, data);
  },

  toggleMedicationStatus(id) {
    return api.patch(`${CLINIC_BASE}/medications/${id}/status`);
  },

  deleteMedication(id) {
    return api.delete(`${CLINIC_BASE}/medications/${id}`);
  },
};

