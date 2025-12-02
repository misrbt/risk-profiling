import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { LoadingSpinner } from '../ui';

const ProtectedRoute = ({
  children,
  requiredRole = null,
  requiredPermission = null,
  requiredPermissions = null,
  requireAllPermissions = false,
  excludeRoles = null,
  fallbackRoute = null
}) => {
  const { isAuthenticated, user, loading } = useAuth();
  const { hasRole, hasPermission, hasAllPermissions, getDashboardRoute, canAccessRoute, isAdmin } = usePermissions();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-slate-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  // Don't store redirect location to ensure fresh login always goes to dashboard
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if roles are excluded (role exclusion logic)
  if (excludeRoles) {
    const excludedRolesList = Array.isArray(excludeRoles) ? excludeRoles : [excludeRoles];
    const hasExcludedRole = excludedRolesList.some(role => hasRole(role));

    if (hasExcludedRole) {
      const redirectTo = fallbackRoute || getDashboardRoute();
      console.log('ProtectedRoute - Role excluded, redirecting to:', redirectTo);
      return <Navigate to={redirectTo} replace />;
    }
  }

  // Check role requirement
  if (requiredRole) {
    console.log('ProtectedRoute - Required role:', requiredRole);
    console.log('ProtectedRoute - Current user roles:', user?.roles?.map(r => r.slug));

    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const hasRequiredRole = roles.some(role => hasRole(role));

    console.log('ProtectedRoute - Has required role:', hasRequiredRole);

    if (!hasRequiredRole) {
      const userHomePage = fallbackRoute || getDashboardRoute();
      console.log('ProtectedRoute - Redirecting to:', userHomePage);
      return <Navigate to={userHomePage} replace />;
    }
  }

  // Check single permission requirement
  if (requiredPermission) {
    if (!hasPermission(requiredPermission)) {
      // Instead of showing access denied, redirect to user's appropriate route
      const redirectTo = fallbackRoute || getDashboardRoute();
      console.log('ProtectedRoute - Permission denied, redirecting to:', redirectTo);
      return <Navigate to={redirectTo} replace />;
    }
  }

  // Check multiple permissions requirement
  if (requiredPermissions) {
    const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];

    const hasRequiredPermissions = requireAllPermissions
      ? hasAllPermissions(permissions)
      : permissions.some(permission => hasPermission(permission));

    if (!hasRequiredPermissions) {
      // Instead of showing access denied, redirect to user's appropriate route
      const redirectTo = fallbackRoute || getDashboardRoute();
      console.log('ProtectedRoute - Permissions denied, redirecting to:', redirectTo);
      return <Navigate to={redirectTo} replace />;
    }
  }

  // Check route-level access control
  const currentPath = location.pathname;
  if (!canAccessRoute(currentPath)) {
    // If admin tries to access role-exclusive route, redirect to admin dashboard
    if (isAdmin) {
      return <Navigate to="/admin/dashboard" replace />;
    }

    // For other users, show access denied or redirect
    const redirectTo = fallbackRoute || getDashboardRoute();
    return <Navigate to={redirectTo} replace />;
  }

  // Helper function to render access denied UI
  function renderAccessDenied() {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-md">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-600 mb-4">
            You don't have the required permissions to access this page. Please contact your administrator if you believe this is an error.
          </p>
          <div className="space-x-2">
            <button
              onClick={() => window.history.back()}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={() => window.location.href = getDashboardRoute()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render children if all checks pass
  return children;
};

export default ProtectedRoute;