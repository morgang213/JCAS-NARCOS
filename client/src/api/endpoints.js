import api from './client';

export const authApi = {
  login: async (username, pin) => {
    const response = await api.post('/auth/login', { username, pin });
    return response.data;
  },
};

export const boxApi = {
  getAll: async () => {
    const response = await api.get('/boxes');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/boxes/${id}`);
    return response.data;
  },

  create: async (boxData) => {
    const response = await api.post('/boxes', boxData);
    return response.data;
  },

  update: async (id, updates) => {
    const response = await api.put(`/boxes/${id}`, updates);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/boxes/${id}`);
    return response.data;
  },

  assign: async (id, userIds) => {
    const response = await api.post(`/boxes/${id}/assign`, { userIds });
    return response.data;
  },

  recordInventory: async (id, medications) => {
    const response = await api.post(`/boxes/${id}/inventory`, { medications });
    return response.data;
  },
};

export const userApi = {
  getAll: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  create: async (userData) => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  updateRole: async (id, role) => {
    const response = await api.put(`/users/${id}/role`, { role });
    return response.data;
  },

  resetPin: async (id, pin) => {
    const response = await api.put(`/users/${id}/reset-pin`, { pin });
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};

export const auditApi = {
  getLogs: async (params = {}) => {
    const response = await api.get('/audit-logs', { params });
    return response.data;
  },
};
