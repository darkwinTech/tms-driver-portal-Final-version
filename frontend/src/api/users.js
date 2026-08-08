import apiClient from './axiosClient.js';

export function listUsers(role) {
  return apiClient.get('/users', { params: role ? { role } : {} });
}

export function listPendingUsers() {
  return apiClient.get('/users/pending');
}

export function approveUser(id) {
  return apiClient.post(`/users/${id}/approve`);
}

export function rejectUser(id, reason) {
  return apiClient.post(`/users/${id}/reject`, { reason });
}
