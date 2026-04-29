import api from './api.js';

export const placementsService = {
  getAll:          () => api.get('/placements'),
  getByCategory:   (code) => api.get(`/placements/by-category/${code}`),
};

export const calendarService = {
  getSlots: () => api.get('/calendar/slots'),
};
