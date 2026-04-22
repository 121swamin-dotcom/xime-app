import api from './api.js';

export const coursesService = {
  getAll:  () => api.get('/courses'),
  getOne:  (code) => api.get(`/courses/${code}`),
};

export const rolesService = {
  getCategories:   () => api.get('/roles/categories'),
  getCategory:     (code) => api.get(`/roles/categories/${code}`),
  getCompanies:    () => api.get('/roles/companies'),
};
