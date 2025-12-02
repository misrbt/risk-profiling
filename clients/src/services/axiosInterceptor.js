import axios from 'axios';
import { API_BASE_URL, LOGGING_ENABLED, DEBUG_ENABLED } from '../config/constants';

// Flag to prevent infinite loops during token refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Request interceptor to add token to headers
axios.interceptors.request.use(
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

// Enhanced response interceptor with token refresh and better error handling
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (LOGGING_ENABLED) {
        console.log('401 error detected - attempting token refresh');
      }

      // Check if we're already refreshing to prevent multiple simultaneous refresh attempts
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axios(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try to refresh the token
        const token = localStorage.getItem('authToken');
        if (token) {
          const refreshResponse = await axios.post('/auth/validate-token', {}, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (refreshResponse.data.valid) {
            if (LOGGING_ENABLED) {
              console.log('Token validation successful');
            }
            processQueue(null, token);
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axios(originalRequest);
          }
        }

        // If token validation fails, try to refresh
        const refreshResponse = await axios.post('/auth/refresh-token');
        const newToken = refreshResponse.data.token;

        localStorage.setItem('authToken', newToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

        if (LOGGING_ENABLED) {
          console.log('Token refreshed successfully');
        }

        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        return axios(originalRequest);
      } catch (refreshError) {
        if (LOGGING_ENABLED) {
          console.log('Token refresh failed - clearing session');
        }

        processQueue(refreshError, null);

        // Clear the token and redirect to login
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];

        // Trigger logout by dispatching a custom event
        window.dispatchEvent(new Event('auth:logout'));

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle 500 errors with better messaging
    if (error.response?.status === 500) {
      if (LOGGING_ENABLED) {
        console.error('Server error (500):', error.response.data);
      }

      // Create a user-friendly error
      const userError = new Error('Connection Failed. Please try again.');
      userError.status = 500;
      userError.originalError = error;
      return Promise.reject(userError);
    }

    // Handle network errors
    if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
      const networkError = new Error('Failed to connect to backend API: Network error');
      networkError.isNetworkError = true;
      return Promise.reject(networkError);
    }

    if (DEBUG_ENABLED && error.response) {
      console.error('API Error:', {
        url: error.config?.url,
        status: error.response.status,
        data: error.response.data
      });
    }

    return Promise.reject(error);
  }
);

// Helper function to set base URL and default headers
export const configureAxios = () => {
  axios.defaults.baseURL = API_BASE_URL;
  axios.defaults.headers.common['Accept'] = 'application/json';
  axios.defaults.headers.common['Content-Type'] = 'application/json';
  
  const token = localStorage.getItem('authToken');
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
};

// Function to clear axios configuration
export const clearAxiosConfig = () => {
  delete axios.defaults.headers.common['Authorization'];
};

export default axios;