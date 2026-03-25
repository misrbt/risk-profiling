import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../config/constants';
import authApi from '../services/authApi';
import sessionManager from '../services/sessionManager';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordChangeRequired, setPasswordChangeRequired] = useState(false);

  // Initialize auth state from localStorage (REVERTED TO SIMPLE APPROACH)
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser);

          setToken(storedToken);
          setUser(parsedUser);
          setIsAuthenticated(true);

          // Set axios default header
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;

          // Initialize session manager
          setTimeout(async () => {
            await sessionManager.init({
              isAuthenticated: true,
              logout: logout,
              setUserData: setUserData
            });
          }, 100);

          console.log('Session restored from localStorage');
        } else {
          // No stored auth data
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        logout(); // Clear invalid data
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for logout events triggered by axios interceptor
    const handleLogoutEvent = () => {
      logout();
    };

    window.addEventListener('auth:logout', handleLogoutEvent);

    // Cleanup event listener
    return () => {
      window.removeEventListener('auth:logout', handleLogoutEvent);
    };
  }, []);

  const login = async (email, password, rememberMe = false) => {
    try {
      // Use centralized auth API with system_slug
      const response = await authApi.post('/auth/login', {
        login: email,
        password,
        system_slug: 'risk_profiling',
      });

      if (response.data.success) {
        const { token: authToken, user: rawUser, access } = response.data.data;

        // Map centralized response to the format this frontend expects
        const userData = {
          ...rawUser,
          roles: access ? [{
            id: 0,
            name: access.role.charAt(0).toUpperCase() + access.role.slice(1),
            slug: access.role,
            permissions: (access.permissions || []).map(p => ({ slug: p })),
          }] : [],
          permissions: access?.permissions || [],
        };

        // Store in state
        setToken(authToken);
        setUser(userData);
        setIsAuthenticated(true);
        setPasswordChangeRequired(false);

        // Store in localStorage
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('user', JSON.stringify(userData));

        // Set axios default header
        axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;

        // Start session management
        await sessionManager.init({
          isAuthenticated: true,
          logout: logout,
          setUserData: setUserData
        });

        return {
          success: true,
          user: userData,
          password_expired: false,
          days_until_password_expires: null
        };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed. Please try again.'
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post(API_ENDPOINTS.REGISTER, userData);
      
      if (response.data.success) {
        return { success: true, message: 'Registration successful!' };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error.response?.data?.errors) {
        // Handle Laravel validation errors
        const errorMessages = Object.values(error.response.data.errors).flat();
        return { success: false, message: errorMessages.join(', ') };
      }
      
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed. Please try again.'
      };
    }
  };

  const logout = async () => {
    try {
      // Stop session tracking
      sessionManager.stopTracking();

      // Call centralized auth logout endpoint
      if (token) {
        await authApi.post('/auth/logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all auth data
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setPasswordChangeRequired(false);

      // Clear tokens from localStorage
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');

      // Clear any stored redirect paths to ensure fresh login goes to dashboard
      sessionStorage.removeItem('redirectPath');
      sessionStorage.removeItem('lastVisitedPath');

      // Remove axios default header
      delete axios.defaults.headers.common['Authorization'];

      // Clear router history state to prevent redirect to last visited page
      if (typeof window !== 'undefined' && window.history) {
        window.history.replaceState(null, '', '/login');
      }
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put(API_ENDPOINTS.PROFILE, profileData);

      if (response.data.success) {
        const updatedUser = response.data.data.user;
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return { success: true, user: updatedUser };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error('Profile update error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Profile update failed.'
      };
    }
  };

  const refreshUser = async () => {
    try {
      console.log('🔄 AuthContext: Refreshing user data from API');
      const response = await axios.get(API_ENDPOINTS.PROFILE);

      if (response.data.success) {
        const refreshedUser = response.data.data;
        console.log('✅ AuthContext: User data refreshed', refreshedUser);
        setUser(refreshedUser);
        localStorage.setItem('user', JSON.stringify(refreshedUser));
        return { success: true, user: refreshedUser };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error('❌ AuthContext: User refresh error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to refresh user data.'
      };
    }
  };

  // Function to directly update user state (for cases where we already have updated user data)
  const setUserData = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // Check if user has specific role
  const hasRole = (role) => {
    if (!user || !user.roles) {
      console.log(`hasRole(${role}) - No user or roles:`, { user, roles: user?.roles });
      return false;
    }
    
    const hasRoleResult = user.roles.some(userRole => userRole.slug === role);
    console.log(`hasRole(${role}) - User roles:`, user.roles.map(r => r.slug), 'Result:', hasRoleResult);
    
    return hasRoleResult;
  };

  // Check if user has specific permission
  const hasPermission = (permission) => {
    if (!user || !user.roles) return false;

    // Admin has ALL permissions - no restrictions
    if (hasRole('admin')) return true;

    return user.roles.some(role =>
      role.permissions && role.permissions.some(perm => perm.slug === permission)
    );
  };

  // Check if user is compliance officer
  const isComplianceOfficer = () => hasRole('compliance');

  // Check if user is manager
  const isManager = () => hasRole('manager');

  // Check if user is regular user
  const isRegularUser = () => hasRole('users');

  // Check if user is admin
  const isAdmin = () => hasRole('admin');

  // Check if user can access customer data
  const canViewCustomers = () => {
    // Admin has unrestricted access
    if (hasRole('admin')) return true;
    return hasPermission('view-customers') || hasRole('compliance') || hasRole('users');
  };

  // Check if user can manage customers
  const canManageCustomers = () => {
    // Admin has unrestricted access
    if (hasRole('admin')) return true;
    return hasPermission('manage-customers') || hasRole('compliance') || hasRole('users');
  };

  const value = {
    // State
    user,
    token,
    loading,
    isAuthenticated,
    passwordChangeRequired,
    
    // Actions
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
    setUserData,
    setPasswordChangeRequired,
    
    // Role/Permission checks
    hasRole,
    hasPermission,
    isComplianceOfficer,
    isManager,
    isRegularUser,
    isAdmin,
    canViewCustomers,
    canManageCustomers,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;