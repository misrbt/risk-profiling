import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../config/constants';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      delete axios.defaults.headers.common['Authorization'];
      
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// User management API methods
export const userAPI = {
  getAll: (params = {}) => api.get(API_ENDPOINTS.USERS, { params }),
  getById: (id) => api.get(`${API_ENDPOINTS.USERS}/${id}`),
  create: (data) => api.post(API_ENDPOINTS.USERS, data),
  update: (id, data) => api.put(`${API_ENDPOINTS.USERS}/${id}`, data),
  delete: (id) => api.delete(`${API_ENDPOINTS.USERS}/${id}`),
  updateStatus: (id, status) => api.put(`${API_ENDPOINTS.USERS}/${id}/status`, { status }),
  assignRole: (id, roleId) => api.post(`${API_ENDPOINTS.USERS}/${id}/roles`, { role_id: roleId }),
  removeRole: (id, roleId) => api.delete(`${API_ENDPOINTS.USERS}/${id}/roles`, { data: { role_id: roleId } }),
  syncRoles: (id, roleIds) => api.put(`${API_ENDPOINTS.USERS}/${id}/roles`, { role_ids: roleIds }),
};

// Role management API methods
export const roleAPI = {
  getAll: (params = {}) => api.get(API_ENDPOINTS.ROLES, { params }),
  getById: (id) => api.get(`${API_ENDPOINTS.ROLES}/${id}`),
  create: (data) => api.post(API_ENDPOINTS.ROLES, data),
  update: (id, data) => api.put(`${API_ENDPOINTS.ROLES}/${id}`, data),
  delete: (id) => api.delete(`${API_ENDPOINTS.ROLES}/${id}`),
  assignToUser: (id, userId) => api.post(`${API_ENDPOINTS.ROLES}/${id}/users`, { user_id: userId }),
  removeFromUser: (id, userId) => api.delete(`${API_ENDPOINTS.ROLES}/${id}/users`, { data: { user_id: userId } }),
};

// Permission management API methods
export const permissionAPI = {
  getAll: (params = {}) => api.get(API_ENDPOINTS.PERMISSIONS, { params }),
  getById: (id) => api.get(`${API_ENDPOINTS.PERMISSIONS}/${id}`),
  create: (data) => api.post(API_ENDPOINTS.PERMISSIONS, data),
  update: (id, data) => api.put(`${API_ENDPOINTS.PERMISSIONS}/${id}`, data),
  delete: (id) => api.delete(`${API_ENDPOINTS.PERMISSIONS}/${id}`),
  assignToRole: (id, roleId) => api.post(`${API_ENDPOINTS.PERMISSIONS}/${id}/roles`, { role_id: roleId }),
  removeFromRole: (id, roleId) => api.delete(`${API_ENDPOINTS.PERMISSIONS}/${id}/roles`, { data: { role_id: roleId } }),
};

// Customer management API methods
export const customerAPI = {
  getAll: (params = {}) => api.get(API_ENDPOINTS.CUSTOMERS_INDEX, { params }),
  getList: (params = {}) => api.get(API_ENDPOINTS.CUSTOMERS, { params }),
  create: (data) => api.post(API_ENDPOINTS.CREATE_CUSTOMER, data),
  getCriteria: () => api.get(API_ENDPOINTS.CRITERIA),
};

// Dashboard API methods
export const dashboardAPI = {
  getData: () => api.get(API_ENDPOINTS.DASHBOARD),
  getAnalytics: () => api.get(API_ENDPOINTS.DASHBOARD_ANALYTICS),
  getBranchStats: () => api.get(API_ENDPOINTS.DASHBOARD_BRANCH_STATS),
};

// Branch API methods
export const branchAPI = {
  getDropdown: () => api.get(API_ENDPOINTS.BRANCHES_DROPDOWN),
};

// Risk Settings API methods (Compliance only)
export const riskSettingsAPI = {
  criteria: {
    getAll: (params = {}) => api.get(API_ENDPOINTS.RISK_CRITERIA, { params }),
    getById: (id) => api.get(`${API_ENDPOINTS.RISK_CRITERIA}/${id}`),
    create: (data) => api.post(API_ENDPOINTS.RISK_CRITERIA, data),
    update: (id, data) => api.put(`${API_ENDPOINTS.RISK_CRITERIA}/${id}`, data),
    delete: (id) => api.delete(`${API_ENDPOINTS.RISK_CRITERIA}/${id}`),
    getDropdown: () => api.get(`${API_ENDPOINTS.RISK_CRITERIA}/dropdown`),
  },
  options: {
    getAll: (params = {}) => api.get(API_ENDPOINTS.RISK_OPTIONS, { params }),
    getById: (id) => api.get(`${API_ENDPOINTS.RISK_OPTIONS}/${id}`),
    create: (data) => api.post(API_ENDPOINTS.RISK_OPTIONS, data),
    update: (id, data) => api.put(`${API_ENDPOINTS.RISK_OPTIONS}/${id}`, data),
    delete: (id) => api.delete(`${API_ENDPOINTS.RISK_OPTIONS}/${id}`),
    getByCriteria: (criteriaId) => api.get(`${API_ENDPOINTS.RISK_OPTIONS}/criteria/${criteriaId}`),
  },
};

// Export the main api instance as default
export default api;