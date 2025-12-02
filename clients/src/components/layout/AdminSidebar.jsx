import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSystemSettings } from "../../contexts/SystemSettingsContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  HomeIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CogIcon,
  BuildingOffice2Icon,
  ClipboardDocumentListIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  KeyIcon,
  UsersIcon,
  Bars3Icon,
  ClipboardDocumentCheckIcon,
  UserCircleIcon,
  AdjustmentsHorizontalIcon,
  LockClosedIcon,
  DocumentMagnifyingGlassIcon,
  SignalIcon,
} from "@heroicons/react/24/outline";
import rbtLogo from "../../assets/rbt-logo.png.png";

const AdminSidebar = ({
  user,
  collapsed = false,
  onToggleCollapse,
  onMobileClose,
}) => {
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState({
    "Risk Profiling": false,
    "Users": false,
    "Audit Trail": false,
    "Settings": false,
  });
  const { systemName, companyName, systemLogo } = useSystemSettings();

  console.log("AdminSidebar rendering - User:", user);
  console.log("AdminSidebar rendering - Current location:", location.pathname);

  const menuItems = [
    {
      title: "Dashboard",
      icon: HomeIcon,
      path: "/admin/dashboard",
      description: "Overview",
      priority: 1,
      badge: null,
    },
    {
      title: "Risk Profiling",
      icon: ShieldCheckIcon,
      priority: 1,
      badge: null,
      children: [
        {
          title: "New Assessment",
          path: "/admin/risk-assessment",
          description: "Create new",
          icon: ClipboardDocumentCheckIcon,
        },
        {
          title: "Customer Profiles",
          path: "/admin/customers",
          description: "View all",
          icon: UserCircleIcon,
        },
        {
          title: "Risk Settings",
          path: "/admin/risk-settings",
          description: "Configure",
          icon: AdjustmentsHorizontalIcon,
        },
      ],
    },
    {
      title: "User Management",
      icon: UserGroupIcon,
      priority: 2,
      badge: null,
      children: [
        {
          title: "All Users",
          path: "/admin/users",
          description: "Manage users",
          icon: UsersIcon,
        },
        {
          title: "Roles",
          path: "/admin/roles",
          description: "Manage roles",
          icon: ShieldCheckIcon,
        },
        {
          title: "Permissions",
          path: "/admin/permissions",
          description: "Access control",
          icon: KeyIcon,
        },
      ],
    },
    {
      title: "Audit & Reports",
      icon: DocumentMagnifyingGlassIcon,
      priority: 2,
      badge: null,
      children: [
        {
          title: "User Activity",
          path: "/admin/reports/activity",
          description: "Activity logs",
          icon: ChartBarIcon,
        },
      ],
    },
    {
      title: "System Settings",
      icon: CogIcon,
      priority: 3,
      badge: null,
      children: [
        {
          title: "General",
          path: "/admin/settings/general",
          description: "System info",
          icon: AdjustmentsHorizontalIcon,
        },
        {
          title: "Security",
          path: "/admin/settings/security",
          description: "Security",
          icon: LockClosedIcon,
        },
      ],
    },
  ];

  // Return all menu items without filtering
  const getVisibleMenuItems = () => {
    return menuItems;
  };

  const toggleSection = (title) => {
    setExpandedSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const isActiveItem = (path) => {
    return location.pathname === path;
  };

  const isActiveSection = (children) => {
    return children?.some((child) => location.pathname === child.path);
  };

  // Close mobile menu when clicking on a link
  const handleLinkClick = () => {
    if (onMobileClose) {
      onMobileClose();
    }
  };

  return (
    <div
      className={`bg-gradient-to-b from-white to-slate-50 shadow-xl border-r border-slate-200/60 transition-all duration-300 ${
        collapsed ? "lg:w-20 w-80" : "w-80"
      } h-[calc(100vh-4rem)] flex flex-col`}
    >
      {/* Header */}
      <div className={`${collapsed ? "p-3" : "p-6"} border-b border-slate-200/60`}>
        <div className={`flex items-center ${collapsed ? "justify-between" : "justify-between"} relative`}>
          {collapsed ? (
            /* Collapsed mode - show logo on left, toggle on right */
            <>
              <div className="flex items-center justify-center">
                <div className="w-8 h-8 flex items-center justify-center">
                  <img
                    src={
                      systemLogo
                        ? systemLogo.startsWith("/")
                          ? `${
                              import.meta.env.VITE_API_BASE_URL ||
                              "http://localhost:8000"
                            }${systemLogo}`
                          : systemLogo
                        : rbtLogo
                    }
                    alt="System Logo"
                    className="w-8 h-8 object-contain"
                  />
                </div>
              </div>
              <div className="hidden lg:flex items-center">
                <button
                  onClick={() => onToggleCollapse && onToggleCollapse(!collapsed)}
                  className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                >
                  <Bars3Icon className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            /* Expanded mode - show logo with text on left, toggle on right */
            <>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 flex items-center justify-center">
                  <img
                    src={
                      systemLogo
                        ? systemLogo.startsWith("/")
                          ? `${
                              import.meta.env.VITE_API_BASE_URL ||
                              "http://localhost:8000"
                            }${systemLogo}`
                          : systemLogo
                        : rbtLogo
                    }
                    alt="System Logo"
                    className="w-12 h-12 object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-[12px] font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {systemName}
                  </h1>
                  <p className="text-xs text-slate-500">System Administrator</p>
                </div>
              </div>
              <div className="hidden lg:flex items-center">
                <button
                  onClick={() => onToggleCollapse && onToggleCollapse(!collapsed)}
                  className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                >
                  <Bars3Icon className="w-5 h-5" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 ${collapsed ? "px-2 py-4" : "px-4 py-4"} space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 hover:scrollbar-thumb-slate-400`}>
        {getVisibleMenuItems().map((item, index) => (
          <div key={item.title}>
            {/* Section divider */}
            {!collapsed && index > 0 && item.priority !== getVisibleMenuItems()[index - 1]?.priority && (
              <div className="my-3 border-t border-slate-200/60"></div>
            )}
            {item.children ? (
              <div>
                <div className="relative group">
                  {collapsed ? (
                    // In collapsed mode, navigate to first child directly
                    <Link
                      to={item.children[0].path}
                      onClick={handleLinkClick}
                      className={`w-full flex items-center justify-center p-2 rounded-xl transition-all duration-200 group ${
                        isActiveSection(item.children)
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                          : "text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                      }`}
                    >
                      {item.showLogo ? (
                        <img
                          src={
                            systemLogo
                              ? systemLogo.startsWith("/")
                                ? `${
                                    import.meta.env.VITE_API_BASE_URL ||
                                    "http://localhost:8000"
                                  }${systemLogo}`
                                : systemLogo
                              : rbtLogo
                          }
                          alt="System Logo"
                          className="w-5 h-5 object-contain"
                        />
                      ) : (
                        <item.icon
                          className={`w-5 h-5 ${
                            isActiveSection(item.children)
                              ? "text-white"
                              : "text-slate-500 group-hover:text-blue-600"
                          }`}
                        />
                      )}
                    </Link>
                  ) : (
                    // In expanded mode, show dropdown toggle
                    <button
                      onClick={() => toggleSection(item.title)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 group ${
                        isActiveSection(item.children)
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                          : "text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                      }`}
                    >
                      <div className="flex items-center">
                        {item.showLogo ? (
                          <img
                            src={
                              systemLogo
                                ? systemLogo.startsWith("/")
                                  ? `${
                                      import.meta.env.VITE_API_BASE_URL ||
                                      "http://localhost:8000"
                                    }${systemLogo}`
                                  : systemLogo
                                : rbtLogo
                            }
                            alt="System Logo"
                            className="w-5 h-5 mr-3 object-contain"
                          />
                        ) : (
                          <item.icon
                            className={`w-5 h-5 mr-3 ${
                              isActiveSection(item.children)
                                ? "text-white"
                                : "text-slate-500 group-hover:text-blue-600"
                            }`}
                          />
                        )}
                        <span className="font-medium">{item.title}</span>
                      </div>
                      <ChevronDownIcon
                        className={`w-4 h-4 transition-transform duration-200 ${
                          expandedSections[item.title] ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  )}

                  {/* Enhanced tooltip for collapsed mode */}
                  {collapsed && (
                    <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-xs rounded-md px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      <div className="font-medium mb-1">{item.title}</div>
                      <div className="space-y-1">
                        {item.children.slice(0, 3).map((child, index) => (
                          <div key={index} className="text-gray-300 text-xs">
                            • {child.title}
                          </div>
                        ))}
                        {item.children.length > 3 && (
                          <div className="text-gray-400 text-xs">
                            +{item.children.length - 3} more
                          </div>
                        )}
                      </div>
                      <div className="absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900"></div>
                    </div>
                  )}
                </div>

                <AnimatePresence>
                  {expandedSections[item.title] && !collapsed && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="ml-8 mt-2 space-y-1 border-l-2 border-slate-100 pl-4"
                      >
                        {item.children.map((child) => {
                          const ChildIcon = child.icon;
                          return (
                            <Link
                              key={child.path}
                              to={child.path}
                              onClick={handleLinkClick}
                              className={`block p-3 rounded-lg transition-all duration-200 group ${
                                isActiveItem(child.path)
                                  ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md"
                                  : "text-slate-500 hover:text-blue-600 hover:bg-blue-50/70"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  {ChildIcon && (
                                    <ChildIcon
                                      className={`w-4 h-4 ${
                                        isActiveItem(child.path)
                                          ? "text-white"
                                          : "text-slate-400 group-hover:text-blue-500"
                                      }`}
                                    />
                                  )}
                                  <div
                                    className={`text-sm font-medium ${
                                      isActiveItem(child.path)
                                        ? "text-white"
                                        : "text-slate-700 group-hover:text-blue-700"
                                    }`}
                                  >
                                    {child.title}
                                  </div>
                                </div>
                                <div
                                  className={`text-xs ${
                                    isActiveItem(child.path)
                                      ? "text-blue-100"
                                      : "text-slate-400 group-hover:text-blue-500"
                                  }`}
                                >
                                  {child.description}
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </motion.div>
                    )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="relative group">
                <Link
                  to={item.path}
                  onClick={handleLinkClick}
                  className={`flex items-center ${collapsed ? "justify-center p-2" : "p-3"} rounded-xl transition-all duration-200 group ${
                    isActiveItem(item.path)
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                      : "text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                  }`}
                >
                  <item.icon
                    className={`w-5 h-5 ${collapsed ? "" : "mr-3"} ${
                      isActiveItem(item.path)
                        ? "text-white"
                        : "text-slate-500 group-hover:text-blue-600"
                    }`}
                  />
                  {!collapsed && (
                    <div className="flex items-center justify-between flex-1">
                      <div className="font-medium">{item.title}</div>
                      <div
                        className={`text-xs ${
                          isActiveItem(item.path)
                            ? "text-blue-100"
                            : "text-slate-400 group-hover:text-blue-500"
                        }`}
                      >
                        {item.description}
                      </div>
                    </div>
                  )}
                </Link>

                {/* Tooltip for collapsed mode */}
                {collapsed && (
                  <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-xs rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    {item.title}
                    <div className="absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900"></div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
};

export default AdminSidebar;
