import client from './client';

export const authAPI = {
  signup: (data) => client.post('/auth/signup', data),
  login: (data) => {
    const formData = new URLSearchParams();
    formData.append('username', data.email);
    formData.append('password', data.password);
    return client.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  },
  me: () => client.get('/auth/me'),
};

export const dashboardAPI = {
  getKPIs: () => client.get('/dashboard/kpis'),
  getOverdueReturns: () => client.get('/dashboard/overdue-returns'),
};

export const departmentsAPI = {
  list: (params) => client.get('/departments/', { params }),
  get: (id) => client.get(`/departments/${id}`),
  create: (data) => client.post('/departments/', data),
  update: (id, data) => client.put(`/departments/${id}`, data),
  deactivate: (id) => client.patch(`/departments/${id}/deactivate`),
};

export const categoriesAPI = {
  list: (params) => client.get('/categories/', { params }),
  get: (id) => client.get(`/categories/${id}`),
  create: (data) => client.post('/categories/', data),
  update: (id, data) => client.put(`/categories/${id}`, data),
};

export const usersAPI = {
  list: (params) => client.get('/users/', { params }),
  get: (id) => client.get(`/users/${id}`),
  update: (id, data) => client.put(`/users/${id}`, data),
  promote: (id, data) => client.patch(`/users/${id}/promote`, data),
  deactivate: (id) => client.patch(`/users/${id}/deactivate`),
};

export const assetsAPI = {
  list: (params) => client.get('/assets/', { params }),
  get: (id) => client.get(`/assets/${id}`),
  create: (data) => client.post('/assets/', data),
  update: (id, data) => client.put(`/assets/${id}`, data),
  changeStatus: (id, data) => client.patch(`/assets/${id}/status`, data),
  getHistory: (id) => client.get(`/assets/${id}/history`),
};

export const allocationsAPI = {
  list: (params) => client.get('/allocations/', { params }),
  allocate: (data) => client.post('/allocations/', data),
  return: (id, data) => client.patch(`/allocations/${id}/return`, data),
  getOverdue: () => client.get('/allocations/overdue'),
};

export const transfersAPI = {
  list: (params) => client.get('/transfers/', { params }),
  create: (data) => client.post('/transfers/', data),
  approve: (id, data) => client.patch(`/transfers/${id}/approve`, data),
  reject: (id, data) => client.patch(`/transfers/${id}/reject`, data),
  complete: (id) => client.patch(`/transfers/${id}/complete`),
};

export const bookingsAPI = {
  list: (params) => client.get('/bookings/', { params }),
  create: (data) => client.post('/bookings/', data),
  cancel: (id) => client.patch(`/bookings/${id}/cancel`),
  getResourceCalendar: (assetId, params) => client.get(`/bookings/calendar/${assetId}`, { params }),
};

export const maintenanceAPI = {
  list: (params) => client.get('/maintenance/', { params }),
  create: (data) => client.post('/maintenance/', data),
  approve: (id) => client.patch(`/maintenance/${id}/approve`),
  reject: (id, data) => client.patch(`/maintenance/${id}/reject`, data),
  assign: (id, data) => client.patch(`/maintenance/${id}/assign`, data),
  start: (id) => client.patch(`/maintenance/${id}/start`),
  resolve: (id, data) => client.patch(`/maintenance/${id}/resolve`, data),
};

export const auditsAPI = {
  listCycles: (params) => client.get('/audits/', { params }),
  createCycle: (data) => client.post('/audits/', data),
  getCycle: (id) => client.get(`/audits/${id}`),
  addAssets: (id, data) => client.post(`/audits/${id}/assets`, data),
  verifyAsset: (cycleId, itemId, data) => client.patch(`/audits/${cycleId}/assets/${itemId}/verify`, data),
  closeCycle: (id) => client.patch(`/audits/${id}/close`),
  getDiscrepancies: (id) => client.get(`/audits/${id}/discrepancies`),
};

export const notificationsAPI = {
  list: (params) => client.get('/notifications/', { params }),
  getUnreadCount: () => client.get('/notifications/unread-count'),
  markRead: (id) => client.patch(`/notifications/${id}/read`),
  markAllRead: () => client.patch('/notifications/read-all'),
};

export const activityLogsAPI = {
  list: (params) => client.get('/activity-logs/', { params }),
};
