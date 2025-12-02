import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { NAVIGATION_ITEMS, APP_NAME } from "../config";
import { useAuth } from "../contexts/AuthContext";
import { usePermissions } from "../hooks/usePermissions";
import { UserAvatar } from "../components/ui";
import EditRequestNotifications from "../components/notifications/EditRequestNotifications";
import Logo from "../assets/rbt-logo.png.png";

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { canAccess, getDashboardRoute, isAdmin, isCompliance, isManager, isRegularUser, isAudit } = usePermissions();

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const isActive = (href) => {
    if (href === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(href);
  };

  const getUserDisplayName = () => {
    if (!user) return "User";
    if (user.full_name) return user.full_name;
    if (user.first_name && user.last_name) {
      return user.middle_initial
        ? `${user.first_name} ${user.middle_initial}. ${user.last_name}`
        : `${user.first_name} ${user.last_name}`;
    }
    return user.username || user.email || "User";
  };

  const getUserInitials = () => {
    if (!user) return "U";
    if (user.first_name && user.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(
        0
      )}`.toUpperCase();
    }
    if (user.first_name) return user.first_name.charAt(0).toUpperCase();
    if (user.username) return user.username.charAt(0).toUpperCase();
    if (user.email) return user.email.charAt(0).toUpperCase();
    return "U";
  };

  const handleLogout = async () => {
    setIsProfileDropdownOpen(false);
    await logout();
    navigate("/login");
  };

  const getFilteredNavigationItems = () => {
    if (!user) return [];

    // Audit role has custom navigation
    if (isAudit) {
      return [
        { name: "Dashboard", href: "/audit/dashboard", icon: "dashboard" },
        { name: "Customers", href: "/audit/customers", icon: "customers" },
        { name: "Audit Trail", href: "/audit/user-activity", icon: "activity" },
      ];
    }

    // Filter navigation items based on permissions and role restrictions
    return NAVIGATION_ITEMS.filter((item) => {
      switch (item.name) {
        case "Dashboard":
          return canAccess.navDashboard();
        case "Risk Assessment":
          // Explicitly exclude compliance users and managers from Risk Assessment
          return canAccess.navRiskAssessment() && !isCompliance && !isManager;
        case "Customers":
          return canAccess.navCustomers();
        case "Settings":
          return canAccess.navSettings();
        default:
          return true; // Allow unknown items by default
      }
    });
  };

  return (
    <nav className="bg-white shadow-lg border-b border-slate-200/60 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link
              to={getDashboardRoute()}
              className="flex items-center space-x-3"
            >
              <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center">
                <img
                  src={Logo}
                  alt="RBT Bank Logo"
                  className="w-8 h-8 object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  RBTBK
                </h1>
                <p className="text-xs text-slate-500">Risk Management</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {getFilteredNavigationItems().map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive(item.href)
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                    : "text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                }`}
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={item.icon}
                  />
                </svg>
                {item.name}
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <EditRequestNotifications />

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center space-x-2 p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <UserAvatar user={user} size="sm" showBorder={true} />
                <div className="hidden md:block">
                  <span className="text-sm font-medium">
                    {getUserDisplayName()}
                  </span>
                  {user?.roles && user.roles.length > 0 && (
                    <div className="text-xs text-slate-500">
                      {isAdmin
                        ? "Admin"
                        : isCompliance
                        ? "Compliance Officer"
                        : isManager
                        ? "Manager"
                        : isAudit
                        ? "Audit"
                        : "User"}
                    </div>
                  )}
                </div>
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isProfileDropdownOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                  {/* User Info Header */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      <UserAvatar user={user} size="md" showBorder={true} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {getUserDisplayName()}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user?.email}
                        </p>
                        {user?.roles && user.roles.length > 0 && (
                          <p className="text-xs text-blue-600 font-medium">
                            {isAdmin
                              ? "Admin"
                              : isCompliance
                              ? "Compliance Officer"
                              : isManager
                              ? "Manager"
                              : isAudit
                              ? "Audit"
                              : "User"}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <Link
                    to="/profile"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={() => setIsProfileDropdownOpen(false)}
                  >
                    <svg
                      className="w-4 h-4 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    Profile Settings
                  </Link>

                  <div className="border-t border-gray-100">
                    <button
                      className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors"
                      onClick={handleLogout}
                    >
                      <svg
                        className="w-4 h-4 mr-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={
                    isMenuOpen
                      ? "M6 18L18 6M6 6l12 12"
                      : "M4 6h16M4 12h16M4 18h16"
                  }
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-slate-200 pt-4 pb-4">
            <div className="space-y-1">
              {getFilteredNavigationItems().map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive(item.href)
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                      : "text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                  }`}
                >
                  <svg
                    className="w-5 h-5 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={item.icon}
                    />
                  </svg>
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
