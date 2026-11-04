import api from './api';

const USER_BASE = '/users';

export const userService = {
  getMyInfo() {
    return api.get(`${USER_BASE}/my-info`);
  },

  updateMyInfo(data) {
    return api.put(`${USER_BASE}/my-info`, data);
  },

  // Public/All user APIs
  getDoctors() {
    return api.get(`${USER_BASE}/doctors`);
  },

  // Admin APIs
  getUsers(params = {}) {
    return api.get(USER_BASE, { params });
  },

  getUserById(id) {
    return api.get(`${USER_BASE}/${id}`);
  },

  createUser(data) {
    return api.post(USER_BASE, data);
  },

  updateUser(id, data) {
    return api.put(`${USER_BASE}/${id}`, data);
  },

  deleteUser(id) {
    return api.delete(`${USER_BASE}/${id}`);
  },

  lockUser(id) {
    return api.put(`${USER_BASE}/${id}/lock`);
  },

  unlockUser(id) {
    return api.put(`${USER_BASE}/${id}/unlock`);
  },
};
