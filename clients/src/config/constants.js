// API Configuration - Use environment variables with fallbacks
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
export const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin;

export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: 'auth/login',
  REGISTER: 'auth/register',
  LOGOUT: 'auth/logout',
  PROFILE: 'auth/profile',
  REFRESH_TOKEN: 'auth/refresh-token',
  VALIDATE_TOKEN: 'auth/validate-token',
  REVOKE_TOKEN: 'auth/revoke-token',
  LOGOUT_ALL: 'auth/logout-all',
  CHANGE_PASSWORD: 'auth/change-password',
  UPLOAD_PROFILE_PICTURE: 'auth/upload-profile-picture',
  TOKENS: 'auth/tokens',
  ACTIVE_USERS: 'admin/auth/active-users',
  
  // User management endpoints (Admin only)
  USERS: 'admin/users',

  // Role management endpoints (Admin only)
  ROLES: 'admin/roles',

  // Permission management endpoints (Admin only)
  PERMISSIONS: 'admin/permissions',

  // User Activity endpoints (Admin/Compliance only)
  USER_ACTIVITIES: 'admin/user-activities',
  USER_ACTIVITIES_STATS: 'admin/user-activities/stats',

  // Audit Logs endpoints (Admin only)
  ADMIN_AUDIT_LOGS: 'admin/audit-logs',
  ADMIN_AUDIT_LOGS_STATS: 'admin/audit-logs/stats',
  
  // Customer endpoints - Role-specific with separate permissions
  CUSTOMERS: 'admin/customers', // Admin customer access (view + edit)
  CUSTOMERS_LIST: 'user/customers-list', // User-specific customer listing
  CUSTOMERS_INDEX: 'admin/customers', // Admin customer listing (view + edit)
  CREATE_CUSTOMER: 'user/customers', // User-specific customer creation
  CRITERIA: 'user/criteria', // User-specific criteria access

  // Admin-specific risk assessment endpoints
  ADMIN_CRITERIA: 'admin/criteria',
  ADMIN_CREATE_CUSTOMER: 'admin/customers',

  // Manager-specific endpoints
  MANAGER_CUSTOMERS: 'manager/customers', // Manager-specific customer viewing
  MANAGER_CUSTOMERS_LIST: 'manager/customers-list', // Manager customer listing
  MANAGER_DASHBOARD: 'manager/dashboard', // Manager dashboard
  MANAGER_ANALYTICS: 'manager/dashboard/analytics', // Manager analytics
  MANAGER_BRANCH_STATS: 'manager/dashboard/branch-stats', // Manager branch stats
  MANAGER_CRITERIA: 'manager/criteria', // Manager criteria access
  MANAGER_RISK_THRESHOLDS: 'manager/risk-thresholds', // Manager risk thresholds

  // Compliance-specific endpoints (view-only)
  COMPLIANCE_CUSTOMERS: 'compliance/customers', // Compliance customer viewing (read-only)

  // Audit-specific endpoints (read-only)
  AUDIT_DASHBOARD: 'audit/dashboard',
  AUDIT_DASHBOARD_ANALYTICS: 'audit/dashboard/analytics',
  AUDIT_DASHBOARD_BRANCH_STATS: 'audit/dashboard/branch-stats',
  AUDIT_CUSTOMERS: 'audit/customers',
  AUDIT_CUSTOMERS_LIST: 'audit/customers-list',
  AUDIT_USER_ACTIVITIES: 'audit/user-activities',
  AUDIT_USER_ACTIVITIES_STATS: 'audit/user-activities/stats',
  AUDIT_LOGS: 'audit/audit-logs',
  AUDIT_LOGS_STATS: 'audit/audit-logs/stats',
  AUDIT_ACTIVE_USERS: 'audit/auth/active-users',

  // System Settings endpoints (Admin only)
  SYSTEM_SETTINGS: 'admin/system-settings',
  SYSTEM_SETTINGS_GROUP: 'admin/system-settings/group',
  SYSTEM_SETTINGS_UPLOAD_LOGO: 'admin/system-settings/upload-logo',
  SYSTEM_SETTINGS_DELETE_LOGO: 'admin/system-settings/logo',

  DASHBOARD: 'admin/dashboard',
  DASHBOARD_ANALYTICS: 'admin/dashboard/analytics',
  DASHBOARD_BRANCH_STATS: 'admin/dashboard/branch-stats',

  // Risk Settings endpoints (Admin and Compliance)
  ADMIN_RISK_CRITERIA: 'admin/risk-settings/criteria',
  ADMIN_RISK_OPTIONS: 'admin/risk-settings/options',
  ADMIN_SELECTION_CONFIG: 'admin/risk-settings/selection-config',
  ADMIN_RISK_THRESHOLDS: 'admin/risk-thresholds',

  // Risk Settings endpoints (Compliance only)
  RISK_CRITERIA: 'compliance/risk-settings/criteria',
  RISK_OPTIONS: 'compliance/risk-settings/options',
  SELECTION_CONFIG: 'compliance/risk-settings/selection-config',

  // Risk Settings endpoints (User only)
  USER_SELECTION_CONFIG: 'user/risk-settings/selection-config',

  // Branch endpoints
  BRANCHES_DROPDOWN: 'branches/dropdown',

  // Edit Request endpoints
  EDIT_REQUESTS: 'user/edit-requests',
  CHECK_EDIT_ACCESS: (customerId) => `user/edit-requests/check-access/${customerId}`,
  USER_EDIT_REQUESTS: 'user/edit-requests/my-requests',
  MANAGER_PENDING_REQUESTS: 'manager/edit-requests/pending',
  MANAGER_UPDATE_REQUEST_STATUS: (requestId) => `manager/edit-requests/${requestId}/status`,

};

// Application Constants - Use environment variables with fallbacks
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'RBT Bank Risk Management';
export const COMPANY_NAME = import.meta.env.VITE_COMPANY_NAME || 'RBT Bank Inc.';
export const COMPANY_LOCATION = import.meta.env.VITE_COMPANY_LOCATION || 'Talisayan, Misamis Oriental, Philippines';

// Environment Configuration
export const IS_PRODUCTION = import.meta.env.VITE_NODE_ENV === 'production';
export const IS_DEVELOPMENT = import.meta.env.VITE_NODE_ENV === 'development';
export const DEBUG_ENABLED = import.meta.env.VITE_DEBUG === 'true';
export const DEV_TOOLS_ENABLED = import.meta.env.VITE_ENABLE_DEV_TOOLS === 'true';
export const LOGGING_ENABLED = import.meta.env.VITE_ENABLE_LOGGING === 'true';

// Session Configuration
export const SESSION_TIMEOUT = parseInt(import.meta.env.VITE_SESSION_TIMEOUT) || 30; // minutes
export const TOKEN_REFRESH_INTERVAL = parseInt(import.meta.env.VITE_TOKEN_REFRESH_INTERVAL) || 25; // minutes

// Export Configuration
export const MAX_EXPORT_RECORDS = parseInt(import.meta.env.VITE_MAX_EXPORT_RECORDS) || 1000;

// Risk Levels
export const RISK_LEVELS = {
  LOW: 'LOW RISK',
  MODERATE: 'MODERATE RISK',
  HIGH: 'HIGH RISK',
};

// Risk Level Colors
export const RISK_COLORS = {
  [RISK_LEVELS.LOW]: 'text-green-600 font-bold',
  [RISK_LEVELS.MODERATE]: 'text-yellow-600 font-bold',
  [RISK_LEVELS.HIGH]: 'text-red-600 font-bold',
};

// Table Configuration
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

// Export Formats
export const EXPORT_FORMATS = {
  CSV: 'csv',
  EXCEL: 'xlsx',
  PDF: 'pdf',
};

// Navigation Menu Items
export const NAVIGATION_ITEMS = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z',
  },
    {
    name: 'Risk Assessment',
    href: '/risk-form',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    name: 'Customers',
    href: '/customers',
    icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
  },
  {
    name: 'Settings',
    href: '/risk-settings',
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  },

];