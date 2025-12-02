import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSystemSettings } from '../../contexts/SystemSettingsContext';
import { UserAvatar } from '../ui';
import { RoleGuard } from '../auth';
import rbtLogo from '../../assets/rbt-logo.png.png';

const Header = () => {
  const { user, logout, isComplianceOfficer, isRegularUser } = useAuth();
  const { systemLogo } = useSystemSettings();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getUserDisplayName = () => {
    if (!user) return '';
    return user.full_name || `${user.first_name} ${user.last_name}` || user.email;
  };

  const getUserRole = () => {
    if (!user || !user.roles || user.roles.length === 0) return 'User';
    return user.roles.map(role => role.name).join(', ');
  };

  return (
    <header className="bg-white shadow-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Navigation */}
          <div className="flex items-center space-x-8">
            <Link to="/dashboard" className="flex items-center space-x-3">
              <img
                src={systemLogo ? (systemLogo.startsWith('/') ? `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}${systemLogo}` : systemLogo) : rbtLogo}
                alt="System Logo"
                className="w-8 h-8 object-contain"
              />
              <span className="font-semibold text-slate-900">Risk Profiling</span>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden md:flex space-x-6">
              <Link 
                to="/dashboard" 
                className="text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Dashboard
              </Link>
              
              <RoleGuard roles={['compliance', 'manager', 'users']}>
                <Link
                  to="/customers"
                  className="text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Customers
                </Link>
              </RoleGuard>

              <RoleGuard roles={['manager', 'users']}>
                <Link
                  to="/risk-form"
                  className="text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Risk Assessment
                </Link>
              </RoleGuard>

              <RoleGuard roles={['compliance']}>
                <Link
                  to="/risk-settings"
                  className="text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Risk Settings
                </Link>
              </RoleGuard>

              <RoleGuard roles={['compliance']}>
                <Link 
                  to="/reports" 
                  className="text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Reports
                </Link>
              </RoleGuard>
            </nav>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* Role Badge */}
            <div className="hidden sm:block">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                isComplianceOfficer() 
                  ? 'bg-purple-100 text-purple-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {getUserRole()}
              </span>
            </div>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-2 text-slate-700 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md p-2"
              >
                <UserAvatar user={user} size="sm" showBorder={true} />
                <span className="hidden md:block text-sm font-medium">
                  {getUserDisplayName()}
                </span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                  <div className="py-1">
                    <div className="px-4 py-2 text-xs text-slate-500 border-b border-slate-100">
                      Signed in as<br />
                      <span className="font-medium text-slate-900">{user?.email}</span>
                    </div>
                    
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      onClick={() => setShowDropdown(false)}
                    >
                      Profile Settings
                    </Link>
                    
                    <RoleGuard roles={['compliance']}>
                      <Link
                        to="/admin"
                        className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        onClick={() => setShowDropdown(false)}
                      >
                        Admin Panel
                      </Link>
                    </RoleGuard>
                    
                    <div className="border-t border-slate-100">
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          handleLogout();
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowDropdown(false)}
        />
      )}
    </header>
  );
};

export default Header;