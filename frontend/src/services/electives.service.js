import api from './api.js';

export const electivesService = {
  getTargets:         () => api.get('/electives/targets'),
  setTargets:         (data) => api.post('/electives/targets', data),
  getRegistrations:   () => api.get('/electives/registrations'),
  register:           (data) => api.post('/electives/register', data),
  getRoleFit:         () => api.get('/electives/role-fit'),
  getChangeRequests:  () => api.get('/electives/change-requests'),
  requestChange:      (data) => api.post('/electives/change-requests', data),
  getDashboard:       () => api.get('/dashboard'),
};
