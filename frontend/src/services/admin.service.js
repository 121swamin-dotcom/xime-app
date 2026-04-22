import api from './api.js';

export const competenciesService = {
  getMyCompetencies: () => api.get('/competencies'),
  rateCompetency:    (data) => api.post('/competencies/rate', data),
  rateTTF:           (data) => api.post('/competencies/rate-ttf', data),
  getEvidence:       () => api.get('/competencies/evidence'),
  submitEvidence:    (data) => api.post('/competencies/evidence', data),
};

export const counsellingService = {
  getMy:    () => api.get('/counselling'),
  request:  (data) => api.post('/counselling', data),
  getAll:   () => api.get('/counselling/all'),
  confirm:  (id, data) => api.post(`/counselling/${id}/confirm`, data),
  decline:  (id, data) => api.post(`/counselling/${id}/decline`, data),
};

export const mentoringService = {
  getMy:          () => api.get('/mentoring/my'),
  request:        (data) => api.post('/mentoring/request', data),
  logSession:     (data) => api.post('/mentoring/sessions', data),
  getAll:         () => api.get('/mentoring/all'),
  getRequests:    () => api.get('/mentoring/requests'),
  getMentors:     () => api.get('/mentoring/mentors'),
  assign:         (data) => api.post('/mentoring/assign', data),
};

export const adminService = {
  getOverview:          () => api.get('/admin/overview'),
  getActivations:       () => api.get('/admin/activations'),
  approveActivation:    (id) => api.post(`/admin/activations/${id}/approve`),
  rejectActivation:     (id) => api.post(`/admin/activations/${id}/reject`),
  getEvidenceQueue:     () => api.get('/admin/evidence'),
  approveEvidence:      (id, data) => api.post(`/admin/evidence/${id}/approve`, data),
  rejectEvidence:       (id, data) => api.post(`/admin/evidence/${id}/reject`, data),
  getElectiveChanges:   () => api.get('/admin/elective-changes'),
  approveElectiveChange:(id, data) => api.post(`/admin/elective-changes/${id}/approve`, data),
  rejectElectiveChange: (id, data) => api.post(`/admin/elective-changes/${id}/reject`, data),
  getStudents:          (q) => api.get('/admin/students', { params: { q } }),
  getStudentProfile:    (id) => api.get(`/admin/students/${id}`),
};
