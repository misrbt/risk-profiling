import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  hasAnyPermission,
  hasAllPermissions,
  canAccessRoute,
  canAccessFeature,
  getRolePermissions,
  PERMISSIONS,
  UI_PERMISSIONS,
  ROUTE_PERMISSIONS,
  ROLE_EXCLUSIVE_ROUTES,
} from '../config/permissions';

/**
 * Custom hook for permission-based access control
 * Replaces hardcoded role checks with centralized permission management
 */
export const usePermissions = () => {
  const { user, isAuthenticated } = useAuth();

  // Extract user permissions from roles
  const userPermissions = useMemo(() => {
    if (!isAuthenticated || !user) return [];

    let permissions = [];

    // Try different user object structures to extract permissions
    if (user.data?.roles) {
      permissions = user.data.roles.flatMap(role =>
        role.permissions?.map(permission => permission.slug) || []
      );
    } else if (user.roles) {
      permissions = user.roles.flatMap(role =>
        role.permissions?.map(permission => permission.slug) || []
      );
    } else if (user.user?.roles) {
      permissions = user.user.roles.flatMap(role =>
        role.permissions?.map(permission => permission.slug) || []
      );
    }

    // Remove duplicates
    return [...new Set(permissions)];
  }, [user, isAuthenticated]);

  // Get user roles for legacy compatibility
  const userRoles = useMemo(() => {
    if (!isAuthenticated || !user) return [];

    let roles = [];

    if (user.data?.roles) {
      roles = user.data.roles.map(role => role.slug);
    } else if (user.roles) {
      roles = user.roles.map(role => role.slug);
    } else if (user.user?.roles) {
      roles = user.user.roles.map(role => role.slug);
    }

    return roles;
  }, [user, isAuthenticated]);

  /**
   * Check if user has any of the specified permissions
   * Admin has all permissions except for role-exclusive access
   */
  const hasPermission = (permission) => {
    if (!isAuthenticated) return false;

    // Admin has all permissions for features/content
    if (isAdmin) return true;

    if (Array.isArray(permission)) {
      return hasAnyPermission(userPermissions, permission);
    }

    return userPermissions.includes(permission);
  };

  /**
   * Check if user has all specified permissions
   */
  const hasAllRequiredPermissions = (permissions) => {
    if (!isAuthenticated) return false;
    return hasAllPermissions(userPermissions, permissions);
  };

  /**
   * Check if user has any of the specified roles (legacy compatibility)
   */
  const hasRole = (role) => {
    if (!isAuthenticated) return false;

    if (Array.isArray(role)) {
      return role.some(r => userRoles.includes(r));
    }

    return userRoles.includes(role);
  };

  /**
   * Check if user can access a specific route
   * Handles role-exclusive routes where admin cannot access
   */
  const canUserAccessRoute = (route) => {
    return canAccessRoute(userPermissions, userRoles, route);
  };

  /**
   * Check if user can access a UI feature
   */
  const canUserAccessFeature = (featureName) => {
    return canAccessFeature(userPermissions, featureName);
  };

  /**
   * Check if user is admin (has admin role)
   */
  const isAdmin = useMemo(() => {
    return userRoles.includes('admin');
  }, [userRoles]);

  /**
   * Check if user is compliance officer
   */
  const isCompliance = useMemo(() => {
    return userRoles.includes('compliance');
  }, [userRoles]);

  /**
   * Check if user is manager
   */
  const isManager = useMemo(() => {
    return userRoles.includes('manager');
  }, [userRoles]);

  /**
   * Check if user is regular user
   */
  const isRegularUser = useMemo(() => {
    return userRoles.includes('users');
  }, [userRoles]);

  /**
   * Check if user is audit
   */
  const isAudit = useMemo(() => {
    return userRoles.includes('audit');
  }, [userRoles]);

  /**
   * Get appropriate dashboard route for user
   */
  const getDashboardRoute = () => {
    if (isAdmin) return '/admin/dashboard';
    if (isAudit) return '/audit/dashboard';
    if (isCompliance || isManager) return '/dashboard';
    // Regular users should go to risk form to create assessments
    if (isRegularUser) return '/risk-form';
    // Default fallback
    return '/dashboard';
  };

  /**
   * Permission-based UI helpers
   */
  const can = {
    // User Management
    viewUsers: () => hasPermission(PERMISSIONS.VIEW_USERS),
    manageUsers: () => hasPermission(PERMISSIONS.MANAGE_USERS),

    // Role Management
    viewRoles: () => hasPermission(PERMISSIONS.VIEW_ROLES),
    manageRoles: () => hasPermission(PERMISSIONS.MANAGE_ROLES),

    // Permission Management
    viewPermissions: () => hasPermission(PERMISSIONS.VIEW_PERMISSIONS),
    managePermissions: () => hasPermission(PERMISSIONS.MANAGE_PERMISSIONS),

    // Customer Management
    viewCustomers: () => hasPermission(PERMISSIONS.VIEW_CUSTOMERS),
    manageCustomers: () => hasPermission(PERMISSIONS.MANAGE_CUSTOMERS),

    // Dashboard & Analytics
    viewBasicDashboard: () => hasPermission(PERMISSIONS.VIEW_BASIC_DASHBOARD),
    viewAdminDashboard: () => hasPermission(PERMISSIONS.VIEW_ADMIN_DASHBOARD),
    viewBranchAnalytics: () => hasPermission(PERMISSIONS.VIEW_BRANCH_ANALYTICS),
    viewSystemAnalytics: () => hasPermission(PERMISSIONS.VIEW_SYSTEM_ANALYTICS),

    // Reports
    viewBasicReports: () => hasPermission(PERMISSIONS.VIEW_BASIC_REPORTS),
    viewAdvancedReports: () => hasPermission(PERMISSIONS.VIEW_ADVANCED_REPORTS),
    exportReports: () => hasPermission(PERMISSIONS.EXPORT_REPORTS),

    // System Settings
    viewSystemSettings: () => hasPermission(PERMISSIONS.VIEW_SYSTEM_SETTINGS),
    manageSystemSettings: () => hasPermission(PERMISSIONS.MANAGE_SYSTEM_SETTINGS),

    // Audit Logs
    viewAuditLogs: () => hasPermission(PERMISSIONS.VIEW_AUDIT_LOGS),

    // Risk Management
    viewRiskSettings: () => hasPermission(PERMISSIONS.VIEW_RISK_SETTINGS),
    manageRiskSettings: () => hasPermission(PERMISSIONS.MANAGE_RISK_SETTINGS),
    createRiskAssessments: () => hasPermission(PERMISSIONS.CREATE_RISK_ASSESSMENTS),
    editRiskAssessments: () => hasPermission(PERMISSIONS.EDIT_RISK_ASSESSMENTS),
    deleteRiskAssessments: () => hasPermission(PERMISSIONS.DELETE_RISK_ASSESSMENTS),
  };

  /**
   * UI Feature access helpers
   */
  const canAccess = {
    dashboardBasic: () => canUserAccessFeature('DASHBOARD_BASIC'),
    dashboardAdmin: () => canUserAccessFeature('DASHBOARD_ADMIN'),
    dashboardRiskDistribution: () => canUserAccessFeature('DASHBOARD_RISK_DISTRIBUTION'),
    dashboardBranchStats: () => canUserAccessFeature('DASHBOARD_BRANCH_STATS'),
    dashboardSystemOverview: () => canUserAccessFeature('DASHBOARD_SYSTEM_OVERVIEW'),

    // Navigation
    navDashboard: () => canUserAccessFeature('NAV_DASHBOARD'),
    navRiskAssessment: () => canUserAccessFeature('NAV_RISK_ASSESSMENT'),
    navCustomers: () => canUserAccessFeature('NAV_CUSTOMERS'),
    navSettings: () => canUserAccessFeature('NAV_SETTINGS'),
    navUsers: () => canUserAccessFeature('NAV_USERS'),
    navRoles: () => canUserAccessFeature('NAV_ROLES'),
    navPermissions: () => canUserAccessFeature('NAV_PERMISSIONS'),
    navReports: () => canUserAccessFeature('NAV_REPORTS'),
    navAdvancedReports: () => canUserAccessFeature('NAV_ADVANCED_REPORTS'),
    navAuditLogs: () => canUserAccessFeature('NAV_AUDIT_LOGS'),
    navSystemSettings: () => canUserAccessFeature('NAV_SYSTEM_SETTINGS'),

    // Action buttons
    btnCreateUser: () => canUserAccessFeature('BTN_CREATE_USER'),
    btnEditUser: () => canUserAccessFeature('BTN_EDIT_USER'),
    btnDeleteUser: () => canUserAccessFeature('BTN_DELETE_USER'),
    btnCreateRole: () => canUserAccessFeature('BTN_CREATE_ROLE'),
    btnEditRole: () => canUserAccessFeature('BTN_EDIT_ROLE'),
    btnDeleteRole: () => canUserAccessFeature('BTN_DELETE_ROLE'),
    btnCreatePermission: () => canUserAccessFeature('BTN_CREATE_PERMISSION'),
    btnEditPermission: () => canUserAccessFeature('BTN_EDIT_PERMISSION'),
    btnDeletePermission: () => canUserAccessFeature('BTN_DELETE_PERMISSION'),
    btnManageCustomer: () => canUserAccessFeature('BTN_MANAGE_CUSTOMER'),
    btnExportData: () => canUserAccessFeature('BTN_EXPORT_DATA'),

    // Data sections
    sectionUserList: () => canUserAccessFeature('SECTION_USER_LIST'),
    sectionRoleList: () => canUserAccessFeature('SECTION_ROLE_LIST'),
    sectionPermissionList: () => canUserAccessFeature('SECTION_PERMISSION_LIST'),
    sectionCustomerList: () => canUserAccessFeature('SECTION_CUSTOMER_LIST'),
    sectionBranchAnalytics: () => canUserAccessFeature('SECTION_BRANCH_ANALYTICS'),
    sectionSystemStats: () => canUserAccessFeature('SECTION_SYSTEM_STATS'),
    sectionAuditLogs: () => canUserAccessFeature('SECTION_AUDIT_LOGS'),
  };

  return {
    // Core permission data
    userPermissions,
    userRoles,

    // Permission checking functions
    hasPermission,
    hasAllPermissions: hasAllRequiredPermissions,
    hasRole, // Legacy compatibility
    canAccessRoute: canUserAccessRoute,
    canAccessFeature: canUserAccessFeature,

    // Role helpers
    isAdmin,
    isCompliance,
    isManager,
    isRegularUser,
    isAudit,
    getDashboardRoute,

    // Semantic permission helpers
    can,
    canAccess,

    // Constants for direct use
    PERMISSIONS,
    UI_PERMISSIONS,
    ROUTE_PERMISSIONS,
    ROLE_EXCLUSIVE_ROUTES,
  };
};

export default usePermissions;