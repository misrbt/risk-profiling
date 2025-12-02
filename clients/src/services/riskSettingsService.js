import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../config/constants';

// Helper function to get endpoints based on user role
const getRiskEndpoints = () => {
  try {
    // Get user data from localStorage - this is where AuthContext stores it
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userRoles = user.roles || [];

    // Check if user has admin role
    const isAdmin = userRoles.some(role => role.slug === 'admin');
    // Check if user has compliance role
    const isCompliance = userRoles.some(role => role.slug === 'compliance');
    // Check if user has users role
    const isUser = userRoles.some(role => role.slug === 'users');

    if (isAdmin) {
      return {
        CRITERIA: API_ENDPOINTS.ADMIN_RISK_CRITERIA,
        OPTIONS: API_ENDPOINTS.ADMIN_RISK_OPTIONS,
        SELECTION_CONFIG: API_ENDPOINTS.ADMIN_SELECTION_CONFIG,
        RISK_THRESHOLDS: API_ENDPOINTS.ADMIN_RISK_THRESHOLDS,
      };
    } else if (isCompliance) {
      // Compliance endpoints
      return {
        CRITERIA: API_ENDPOINTS.RISK_CRITERIA,
        OPTIONS: API_ENDPOINTS.RISK_OPTIONS,
        SELECTION_CONFIG: API_ENDPOINTS.SELECTION_CONFIG,
        RISK_THRESHOLDS: '/risk-thresholds',
      };
    } else if (isUser) {
      // User endpoints - users only need selection config
      return {
        CRITERIA: API_ENDPOINTS.CRITERIA,
        OPTIONS: API_ENDPOINTS.RISK_OPTIONS,
        SELECTION_CONFIG: API_ENDPOINTS.USER_SELECTION_CONFIG,
        RISK_THRESHOLDS: '/user/risk-thresholds',
      };
    } else {
      // Default to compliance endpoints
      return {
        CRITERIA: API_ENDPOINTS.RISK_CRITERIA,
        OPTIONS: API_ENDPOINTS.RISK_OPTIONS,
        SELECTION_CONFIG: API_ENDPOINTS.SELECTION_CONFIG,
        RISK_THRESHOLDS: '/risk-thresholds',
      };
    }
  } catch (error) {
    console.error('Error determining risk endpoints:', error);
    // Fallback to compliance endpoints
    return {
      CRITERIA: API_ENDPOINTS.RISK_CRITERIA,
      OPTIONS: API_ENDPOINTS.RISK_OPTIONS,
      SELECTION_CONFIG: API_ENDPOINTS.SELECTION_CONFIG,
      RISK_THRESHOLDS: '/risk-thresholds',
    };
  }
};

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    throw error;
  }
);

export const riskSettingsService = {
  // Criteria API calls
  criteria: {
    // Get all criteria
    getAll: async () => {
      try {
        const endpoints = getRiskEndpoints();
        const response = await api.get(endpoints.CRITERIA);
        return response.data;
      } catch (error) {
        console.error('Criteria API Error:', error.response || error);
        const message = error.response?.data?.message || error.message || 'Failed to fetch criteria';
        throw new Error(message);
      }
    },

    // Get criteria for dropdown
    getDropdown: async () => {
      try {
        const endpoints = getRiskEndpoints();
        const response = await api.get(`${endpoints.CRITERIA}/dropdown`);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch criteria dropdown');
      }
    },

    // Get single criteria
    getById: async (id) => {
      try {
        const endpoints = getRiskEndpoints();
        const response = await api.get(`${endpoints.CRITERIA}/${id}`);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch criteria');
      }
    },

    // Create new criteria
    create: async (data) => {
      try {
        const endpoints = getRiskEndpoints();
        const response = await api.post(endpoints.CRITERIA, data);
        return response.data;
      } catch (error) {
        const message = error.response?.data?.message || 'Failed to create criteria';
        const errors = error.response?.data?.errors || {};
        throw { message, errors, status: error.response?.status };
      }
    },

    // Update criteria
    update: async (id, data) => {
      try {
        const endpoints = getRiskEndpoints();
        const response = await api.put(`${endpoints.CRITERIA}/${id}`, data);
        return response.data;
      } catch (error) {
        const message = error.response?.data?.message || 'Failed to update criteria';
        const errors = error.response?.data?.errors || {};
        throw { message, errors, status: error.response?.status };
      }
    },

    // Delete criteria
    delete: async (id) => {
      try {
        const endpoints = getRiskEndpoints();
        const response = await api.delete(`${endpoints.CRITERIA}/${id}`);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to delete criteria');
      }
    }
  },

  // Options API calls
  options: {
    // Get all options
    getAll: async (criteriaId = null) => {
      try {
        const endpoints = getRiskEndpoints();
        const url = criteriaId
          ? `${endpoints.OPTIONS}?criteria_id=${criteriaId}`
          : endpoints.OPTIONS;
        const response = await api.get(url);
        return response.data;
      } catch (error) {
        console.error('Options API Error:', error.response || error);
        const message = error.response?.data?.message || error.message || 'Failed to fetch options';
        throw new Error(message);
      }
    },

    // Get options by criteria
    getByCriteria: async (criteriaId) => {
      try {
        const endpoints = getRiskEndpoints();
        const response = await api.get(`${endpoints.OPTIONS}/criteria/${criteriaId}`);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch options for criteria');
      }
    },

    // Get single option
    getById: async (id) => {
      try {
        const endpoints = getRiskEndpoints();
        const response = await api.get(`${endpoints.OPTIONS}/${id}`);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch option');
      }
    },

    // Create new option
    create: async (data) => {
      try {
        const endpoints = getRiskEndpoints();
        const response = await api.post(endpoints.OPTIONS, data);
        return response.data;
      } catch (error) {
        const message = error.response?.data?.message || 'Failed to create option';
        const errors = error.response?.data?.errors || {};
        throw { message, errors, status: error.response?.status };
      }
    },

    // Update option
    update: async (id, data) => {
      try {
        const endpoints = getRiskEndpoints();
        const response = await api.put(`${endpoints.OPTIONS}/${id}`, data);
        return response.data;
      } catch (error) {
        const message = error.response?.data?.message || 'Failed to update option';
        const errors = error.response?.data?.errors || {};
        throw { message, errors, status: error.response?.status };
      }
    },

    // Delete option
    delete: async (id) => {
      try {
        const endpoints = getRiskEndpoints();
        const response = await api.delete(`${endpoints.OPTIONS}/${id}`);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to delete option');
      }
    }
  },

  // Selection Configuration API calls
  selectionConfig: {
    // Get all selection configurations
    getAll: async () => {
      try {
        const endpoints = getRiskEndpoints();
        const response = await api.get(endpoints.SELECTION_CONFIG);
        return response.data;
      } catch (error) {
        console.error('Selection Config API Error:', error.response || error);
        // Return empty config if endpoint doesn't exist yet
        return { success: false, data: {} };
      }
    },

    // Save selection configuration
    save: async (data) => {
      try {
        const endpoints = getRiskEndpoints();
        console.log('[SelectionConfig] Saving to endpoint:', endpoints.SELECTION_CONFIG);
        console.log('[SelectionConfig] Payload:', data);
        const response = await api.post(endpoints.SELECTION_CONFIG, data);
        console.log('[SelectionConfig] Response:', response.data);
        return response.data;
      } catch (error) {
        console.error('[SelectionConfig] Error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message
        });
        const message = error.response?.data?.message || error.message || 'Failed to save selection configuration';
        const errors = error.response?.data?.errors || {};
        throw { message, errors, status: error.response?.status };
      }
    },

    // Update selection configuration
    update: async (data) => {
      try {
        const endpoints = getRiskEndpoints();
        const response = await api.put(endpoints.SELECTION_CONFIG, data);
        return response.data;
      } catch (error) {
        const message = error.response?.data?.message || 'Failed to update selection configuration';
        const errors = error.response?.data?.errors || {};
        throw { message, errors, status: error.response?.status };
      }
    }
  },

  // Risk Thresholds API calls
  riskThresholds: {
    // Get risk thresholds
    get: async () => {
      try {
        const endpoints = getRiskEndpoints();
        const response = await api.get(endpoints.RISK_THRESHOLDS);
        return response.data;
      } catch (error) {
        console.error('Risk Thresholds API Error:', error.response || error);
        // Return default thresholds if endpoint doesn't exist yet
        return {
          success: true,
          data: {
            low_threshold: 10,
            moderate_threshold: 16,
            high_threshold: 19
          }
        };
      }
    },

    // Save risk thresholds
    save: async (data) => {
      try {
        const endpoints = getRiskEndpoints();
        const isAdmin = endpoints.CRITERIA.includes('admin');
        const endpoint = isAdmin ? 'admin/risk-settings/risk-thresholds' : 'compliance/risk-settings/risk-thresholds';
        const response = await api.post(endpoint, {
          thresholds: data
        });
        return response.data;
      } catch (error) {
        const message = error.response?.data?.message || 'Failed to save risk thresholds';
        const errors = error.response?.data?.errors || {};
        throw { message, errors, status: error.response?.status };
      }
    }
  }
};

export default riskSettingsService;