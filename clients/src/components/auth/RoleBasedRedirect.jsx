import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';

const RoleBasedRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const { hasRole, getDashboardRoute } = usePermissions();
  const [redirectCount, setRedirectCount] = useState(0);

  // Prevent infinite redirect loops
  useEffect(() => {
    setRedirectCount(prev => prev + 1);
  }, []);

  // If we've redirected too many times, show error
  if (redirectCount > 3) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-4">Too many redirects. Please login again.</p>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = '/login';
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Wait for authentication to complete
  if (loading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p>Loading user data...</p>
        </div>
      </div>
    );
  }

  // Determine redirect path based on user role
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  console.log('RoleBasedRedirect - User:', user);
  console.log('RoleBasedRedirect - User roles:', user?.roles);
  console.log('RoleBasedRedirect - hasRole admin:', hasRole('admin'));
  console.log('RoleBasedRedirect - hasRole compliance:', hasRole('compliance'));
  console.log('RoleBasedRedirect - hasRole manager:', hasRole('manager'));

  const redirectPath = getDashboardRoute();

  console.log('RoleBasedRedirect - Final redirect path:', redirectPath);

  return <Navigate to={redirectPath} replace />;
};

export default RoleBasedRedirect;