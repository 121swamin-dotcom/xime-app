import api from './api.js';

export const authService = {
  login:         (data) => api.post('/auth/login', data),
  activate:      (data) => api.post('/auth/activate', data),
  forgotPassword:(data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};
