import api from './api.js';

export const analyticsService = {
  getPeerBenchmark:        () => api.get('/analytics/peer-benchmark'),
  getCareerPathway:        () => api.get('/analytics/career-pathway'),
  getCareerPathwayAdmin:   (studentId) => api.get(`/analytics/career-pathway/${studentId}`),
  getRoleAnalytics:        (category) => api.get('/analytics/role-analytics', { params: { category } }),
  getEvidenceGallery:      () => api.get('/analytics/evidence-gallery'),
};
