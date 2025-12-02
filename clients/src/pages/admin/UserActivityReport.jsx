import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  createColumnHelper,
  flexRender,
} from "@tanstack/react-table";
import {
  MagnifyingGlassIcon,
  ChartBarIcon,
  UserIcon,
  ClockIcon,
  ComputerDesktopIcon,
  MapPinIcon,
  CalendarDaysIcon,
  FunnelIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import api from "../../services/api";
import Swal from "sweetalert2";
import { API_ENDPOINTS } from "../../config/constants";
import { usePermissions } from "../../hooks/usePermissions";
import { useLocation } from "react-router-dom";

const UserActivityReport = () => {
  console.log('🔄 UserActivityReport: Component starting to render');
  const { isAudit } = usePermissions();
  const location = useLocation();
  const isAuditRole = isAudit || location.pathname.startsWith('/audit');

  const [activities, setActivities] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [auditStats, setAuditStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([]);
  const [pageSize, setPageSize] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [activeTab, setActiveTab] = useState("activities"); // 'activities' or 'audit'

  // Filters
  const [filters, setFilters] = useState({
    action: "",
    user_id: "",
    entity_type: "",
    resource_type: "",
    resource_id: "",
    start_date: "",
    end_date: "",
    search: "",
    ip_address: "",
  });

  const [showFilters, setShowFilters] = useState(false);

  const columnHelper = createColumnHelper();

  const getActionBadgeColor = (action) => {
    const colors = {
      login: "bg-green-100 text-green-800",
      logout: "bg-red-100 text-red-800",
      logout_all: "bg-red-100 text-red-800",
      created: "bg-blue-100 text-blue-800",
      updated: "bg-yellow-100 text-yellow-800",
      deleted: "bg-red-100 text-red-800",
      viewed: "bg-gray-100 text-gray-800",
    };
    return colors[action] || "bg-gray-100 text-gray-800";
  };

  const getResourceTypeIcon = (resourceType) => {
    const icons = {
      auth: <ShieldCheckIcon className="w-4 h-4" />,
      users: <UserIcon className="w-4 h-4" />,
      customers: <UserIcon className="w-4 h-4" />,
      criteria: <DocumentArrowDownIcon className="w-4 h-4" />,
      options: <DocumentArrowDownIcon className="w-4 h-4" />,
    };
    return icons[resourceType] || <DocumentArrowDownIcon className="w-4 h-4" />;
  };

  // User Activities columns
  const activityColumns = [
    columnHelper.accessor("user.name", {
      header: "User",
      size: 250,
      cell: (info) => (
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
            <UserIcon className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{info.getValue()}</div>
            <div className="text-sm text-gray-500">
              {info.row.original.user.first_name}{" "}
              {info.row.original.user.last_name}
            </div>
            <div className="text-xs text-blue-600">
              {info.row.original.user.roles?.join(", ")}
            </div>
          </div>
        </div>
      ),
    }),
    columnHelper.accessor("action", {
      header: "Action",
      size: 120,
      cell: (info) => (
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getActionBadgeColor(
            info.getValue()
          )}`}
        >
          {info.getValue().replace(/_/g, " ").toUpperCase()}
        </span>
      ),
    }),
    columnHelper.accessor("description", {
      header: "Description",
      size: 300,
      cell: (info) => (
        <div className="max-w-xs">
          <p className="text-sm text-gray-900 truncate">{info.getValue()}</p>
          {info.row.original.entity_type && (
            <p className="text-xs text-gray-500">
              {info.row.original.entity_type} #{info.row.original.entity_id}
            </p>
          )}
        </div>
      ),
    }),
    columnHelper.accessor((row) => row.performed_at || row.formatted_date, {
      id: "when_activity",
      header: "When",
      size: 180,
      cell: (info) => {
        const row = info.row.original;
        const timestamp = row.performed_at;

        // If no timestamp, use formatted_date from backend as fallback
        if (!timestamp) {
          return (
            <div>
              <div className="text-sm text-gray-900">{row.formatted_date || 'N/A'}</div>
              {row.time_ago && <div className="text-xs text-gray-500">{row.time_ago}</div>}
            </div>
          );
        }

        const date = new Date(timestamp);
        // Check if date is valid
        if (isNaN(date.getTime())) {
          return (
            <div>
              <div className="text-sm text-gray-900">{row.formatted_date || 'N/A'}</div>
              {row.time_ago && <div className="text-xs text-gray-500">{row.time_ago}</div>}
            </div>
          );
        }

        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        let timeAgo;
        if (diffMins < 1) timeAgo = 'Just now';
        else if (diffMins < 60) timeAgo = `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        else if (diffHours < 24) timeAgo = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        else if (diffDays < 7) timeAgo = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        else timeAgo = date.toLocaleDateString();

        const formattedDate = date.toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });

        return (
          <div>
            <div className="text-sm text-gray-900">{formattedDate}</div>
            <div className="text-xs text-gray-500">{timeAgo}</div>
          </div>
        );
      },
    }),
    columnHelper.accessor("ip_address", {
      header: "IP Address",
      cell: (info) => (
        <div className="flex items-center text-sm text-gray-600">
          <MapPinIcon className="w-4 h-4 mr-1" />
          {info.getValue() || "Unknown"}
        </div>
      ),
      size: 140,
    }),
    columnHelper.display({
      id: "actions",
      header: "Actions",
      size: 100,
      cell: (info) => (
        <button
          onClick={() => viewActivityDetails(info.row.original)}
          className="text-blue-600 hover:text-blue-900 text-sm font-medium"
        >
          <EyeIcon className="w-4 h-4" />
        </button>
      ),
    }),
  ];

  // Audit Logs columns
  const auditColumns = [
    columnHelper.accessor("user.name", {
      header: "User",
      size: 200,
      cell: (info) => (
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
            <UserIcon className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">
              {info.getValue() || "System"}
            </div>
            <div className="text-sm text-gray-500">
              {info.row.original.user.first_name}{" "}
              {info.row.original.user.last_name}
            </div>
            <div className="text-xs text-blue-600">
              {info.row.original.user.roles?.join(", ")}
            </div>
          </div>
        </div>
      ),
    }),
    columnHelper.accessor("action", {
      header: "Action",
      size: 100,
      cell: (info) => (
        <div className="flex items-center">
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getActionBadgeColor(
              info.getValue()
            )}`}
          >
            {info.getValue().replace(/_/g, " ").toUpperCase()}
          </span>
        </div>
      ),
    }),
    columnHelper.accessor("resource_type", {
      header: "Resource",
      size: 120,
      cell: (info) => (
        <div className="flex items-center">
          <div className="w-6 h-6 text-gray-500 mr-2">
            {getResourceTypeIcon(info.getValue())}
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">
              {info.getValue()?.toUpperCase() || "N/A"}
            </div>
            {info.row.original.resource_id && (
              <div className="text-xs text-gray-500">
                ID: {info.row.original.resource_id}
              </div>
            )}
          </div>
        </div>
      ),
    }),
    columnHelper.accessor("changes_summary", {
      header: "Changes",
      size: 250,
      cell: (info) => (
        <div className="max-w-xs">
          {info.getValue() ? (
            <p className="text-sm text-gray-600 truncate">{info.getValue()}</p>
          ) : (
            <span className="text-xs text-gray-400 italic">
              No changes recorded
            </span>
          )}
        </div>
      ),
    }),
    columnHelper.accessor((row) => row.created_at || row.formatted_date, {
      id: "when_audit",
      header: "When",
      size: 150,
      cell: (info) => {
        const row = info.row.original;
        const timestamp = row.created_at;

        // If no timestamp, use formatted_date from backend as fallback
        if (!timestamp) {
          return (
            <div>
              <div className="text-sm text-gray-900">{row.formatted_date || 'N/A'}</div>
              {row.time_ago && <div className="text-xs text-gray-500">{row.time_ago}</div>}
            </div>
          );
        }

        const date = new Date(timestamp);
        // Check if date is valid
        if (isNaN(date.getTime())) {
          return (
            <div>
              <div className="text-sm text-gray-900">{row.formatted_date || 'N/A'}</div>
              {row.time_ago && <div className="text-xs text-gray-500">{row.time_ago}</div>}
            </div>
          );
        }

        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        let timeAgo;
        if (diffMins < 1) timeAgo = 'Just now';
        else if (diffMins < 60) timeAgo = `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        else if (diffHours < 24) timeAgo = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        else if (diffDays < 7) timeAgo = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        else timeAgo = date.toLocaleDateString();

        const formattedDate = date.toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });

        return (
          <div>
            <div className="text-sm text-gray-900">{formattedDate}</div>
            <div className="text-xs text-gray-500">{timeAgo}</div>
          </div>
        );
      },
    }),
    columnHelper.accessor("ip_address", {
      header: "IP Address",
      size: 120,
      cell: (info) => (
        <div className="flex items-center text-sm text-gray-600">
          <MapPinIcon className="w-4 h-4 mr-1" />
          {info.getValue() || "Unknown"}
        </div>
      ),
    }),
    columnHelper.accessor("browser_info", {
      header: "Browser",
      size: 150,
      cell: (info) => (
        <div className="flex items-center text-sm text-gray-600">
          <ComputerDesktopIcon className="w-4 h-4 mr-1" />
          <div>
            <div>{info.getValue()?.browser || "Unknown"}</div>
            <div className="text-xs text-gray-400">
              {info.getValue()?.platform || "Unknown"}
            </div>
          </div>
        </div>
      ),
    }),
    columnHelper.display({
      id: "actions",
      header: "Actions",
      size: 80,
      cell: (info) => (
        <button
          onClick={() => viewAuditDetails(info.row.original)}
          className="text-blue-600 hover:text-blue-900 text-sm font-medium"
        >
          <EyeIcon className="w-4 h-4" />
        </button>
      ),
    }),
  ];

  const currentData = activeTab === "activities" ? activities : auditLogs;
  const currentColumns =
    activeTab === "activities" ? activityColumns : auditColumns;

  const table = useReactTable({
    data: currentData,
    columns: currentColumns,
    state: {
      globalFilter,
      sorting,
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: "includesString",
    manualPagination: true,
    pageCount: totalPages,
  });

  useEffect(() => {
    const loadData = async () => {
      if (activeTab === "activities") {
        await fetchActivities();
        await fetchStats();
      } else {
        await fetchAuditLogs();
        await fetchAuditStats();
      }
      await fetchUsers();
    };
    loadData();
  }, [currentPage, pageSize, filters, activeTab]);

  useEffect(() => {
    table.setPageSize(pageSize);
  }, [pageSize, table]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        per_page: pageSize,
        ...filters,
      };

      console.log("Fetching activities with params:", params);
      const endpoint = isAuditRole ? API_ENDPOINTS.AUDIT_USER_ACTIVITIES : API_ENDPOINTS.USER_ACTIVITIES;
      const response = await api.get(endpoint, { params });
      console.log("Activities response:", response.data);

      if (response.data.success) {
        setActivities(response.data.data);
        setTotalPages(response.data.meta.last_page);
        setTotalRecords(response.data.meta.total);
        console.log("Activities set:", response.data.data);
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
      Swal.fire({
        title: "Error",
        text: "Failed to load user activities",
        icon: "error",
        customClass: { popup: "rounded-2xl" },
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.USERS);
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const endpoint = isAuditRole ? API_ENDPOINTS.AUDIT_USER_ACTIVITIES_STATS : API_ENDPOINTS.USER_ACTIVITIES_STATS;
      const response = await api.get(endpoint);
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page: currentPage,
        per_page: pageSize,
        ...filters,
      };

      console.log("🔄 UserActivityReport: Fetching audit logs with params:", params);
      const endpoint = isAuditRole ? API_ENDPOINTS.AUDIT_LOGS : API_ENDPOINTS.ADMIN_AUDIT_LOGS;
      const response = await api.get(endpoint, { params });
      console.log("✅ UserActivityReport: Audit logs response:", response.data);

      if (response.data.success) {
        setAuditLogs(response.data.data || []);
        setTotalPages(response.data.meta?.last_page || 1);
        setTotalRecords(response.data.meta?.total || 0);
        console.log("✅ UserActivityReport: Audit logs loaded successfully:", response.data.data?.length, "records");
      } else {
        console.error("❌ UserActivityReport: API returned success=false");
        setError("Failed to load audit logs: " + (response.data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to load audit logs";

      console.error("🚨 UserActivityReport: Setting error state:", errorMessage);
      setError(errorMessage);

      Swal.fire({
        title: "Error",
        text: `Failed to load audit logs: ${errorMessage}`,
        icon: "error",
        customClass: { popup: "rounded-2xl" },
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditStats = async () => {
    try {
      const endpoint = isAuditRole ? API_ENDPOINTS.AUDIT_LOGS_STATS : API_ENDPOINTS.ADMIN_AUDIT_LOGS_STATS;
      const response = await api.get(endpoint);
      if (response.data.success) {
        setAuditStats(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching audit stats:", error);
    }
  };

  const viewActivityDetails = (activity) => {
    Swal.fire({
      title: "Activity Details",
      html: `
        <div class="text-left space-y-3">
          <div><strong>User:</strong> ${activity.user.name} (${
        activity.user.email
      })</div>
          <div><strong>Action:</strong> ${activity.action.replace(
            /_/g,
            " "
          )}</div>
          <div><strong>Description:</strong> ${activity.description}</div>
          <div><strong>Time:</strong> ${activity.formatted_date}</div>
          <div><strong>IP Address:</strong> ${
            activity.ip_address || "Unknown"
          }</div>
          ${
            activity.metadata
              ? `<div><strong>Additional Info:</strong><br><pre class="text-xs bg-gray-100 p-2 rounded mt-1">${JSON.stringify(
                  activity.metadata,
                  null,
                  2
                )}</pre></div>`
              : ""
          }
        </div>
      `,
      confirmButtonText: "Close",
      customClass: { popup: "rounded-2xl" },
    });
  };

  const viewAuditDetails = (auditLog) => {
    const hasChanges = auditLog.old_values || auditLog.new_values;

    Swal.fire({
      title: "Audit Log Details",
      html: `
        <div class="text-left space-y-3">
          <div><strong>User:</strong> ${auditLog.user.name} (${
        auditLog.user.email
      })</div>
          <div><strong>Action:</strong> ${auditLog.action.replace(
            /_/g,
            " "
          )}</div>
          <div><strong>Resource:</strong> ${auditLog.resource_type} ${
        auditLog.resource_id ? "#" + auditLog.resource_id : ""
      }</div>
          <div><strong>Time:</strong> ${auditLog.formatted_date}</div>
          <div><strong>IP Address:</strong> ${
            auditLog.ip_address || "Unknown"
          }</div>
          <div><strong>Browser:</strong> ${
            auditLog.browser_info?.browser || "Unknown"
          } on ${auditLog.browser_info?.platform || "Unknown"}</div>
          ${
            auditLog.session_id
              ? `<div><strong>Session ID:</strong> ${auditLog.session_id}</div>`
              : ""
          }
          ${
            hasChanges
              ? `
            <div class="mt-4">
              <strong>Changes:</strong>
              ${
                auditLog.old_values
                  ? `<div class="mt-2"><strong>Old Values:</strong><br><pre class="text-xs bg-red-50 p-2 rounded mt-1">${JSON.stringify(
                      auditLog.old_values,
                      null,
                      2
                    )}</pre></div>`
                  : ""
              }
              ${
                auditLog.new_values
                  ? `<div class="mt-2"><strong>New Values:</strong><br><pre class="text-xs bg-green-50 p-2 rounded mt-1">${JSON.stringify(
                      auditLog.new_values,
                      null,
                      2
                    )}</pre></div>`
                  : ""
              }
            </div>
          `
              : ""
          }
        </div>
      `,
      confirmButtonText: "Close",
      customClass: { popup: "rounded-2xl max-w-2xl" },
    });
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      action: "",
      user_id: "",
      entity_type: "",
      resource_type: "",
      resource_id: "",
      start_date: "",
      end_date: "",
      search: "",
      ip_address: "",
    });
    setCurrentPage(1);
  };

  // Early error display
  if (error) {
    console.log('🚨 UserActivityReport: Rendering error state');
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-red-800">Error Loading Audit Trail</h3>
              <p className="mt-2 text-red-700">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  activeTab === 'activities' ? fetchActivities() : fetchAuditLogs();
                }}
                className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading && currentData.length === 0) {
    console.log('🔄 UserActivityReport: Rendering loading state');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        <div className="ml-4">
          <p className="text-lg text-gray-600">Loading audit trail...</p>
          <p className="text-sm text-gray-500">Tab: {activeTab}</p>
        </div>
      </div>
    );
  }

  console.log('🟢 UserActivityReport: Rendering main component', {
    activeTab,
    loading,
    error,
    auditLogsLength: auditLogs?.length,
    activitiesLength: activities?.length,
    currentDataLength: currentData?.length
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              User Activity Report
            </h1>
            <p className="mt-2 text-gray-600">
              Track all user interactions and activities in the application
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FunnelIcon className="w-4 h-4 mr-2" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1">
          <nav className="flex space-x-1" aria-label="Tabs">
            <button
              onClick={() => {
                setActiveTab("activities");
                setCurrentPage(1);
              }}
              className={`${
                activeTab === "activities"
                  ? "bg-blue-500 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              } px-3 py-2 font-medium text-sm rounded-lg transition-all duration-200 flex items-center`}
            >
              <UserIcon className="w-5 h-5 mr-2" />
              User Activities
            </button>
            <button
              onClick={() => {
                setActiveTab("audit");
                setCurrentPage(1);
              }}
              className={`${
                activeTab === "audit"
                  ? "bg-blue-500 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              } px-3 py-2 font-medium text-sm rounded-lg transition-all duration-200 flex items-center`}
            >
              <ShieldCheckIcon className="w-5 h-5 mr-2" />
              Audit Logs
            </button>
          </nav>
        </div>
      </div>

      {/* Stats Cards */}
      {((activeTab === "activities" && stats) ||
        (activeTab === "audit" && auditStats)) && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  {activeTab === "activities"
                    ? "Total Activities"
                    : "Total Audit Logs"}
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {activeTab === "activities"
                    ? stats?.total_activities
                    : auditStats?.total_logs}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Active Users
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {(activeTab === "activities"
                    ? stats?.top_users?.length
                    : auditStats?.top_users?.length) || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Most Common Action
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {(activeTab === "activities"
                    ? stats?.top_actions?.[0]?.action
                    : auditStats?.top_actions?.[0]?.action
                  )?.replace(/_/g, " ") || "N/A"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CalendarDaysIcon className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Date Range</p>
                <p className="text-sm font-semibold text-gray-900">
                  Last 30 days
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8"
        >
          <div
            className={`grid grid-cols-1 md:grid-cols-${
              activeTab === "audit" ? "4" : "3"
            } gap-4`}
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Action
              </label>
              <select
                value={filters.action}
                onChange={(e) => handleFilterChange("action", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All Actions</option>
                {activeTab === "activities" ? (
                  <>
                    <option value="login">Login</option>
                    <option value="create_risk_assessment">
                      Create Risk Assessment
                    </option>
                    <option value="view_customers">View Customers</option>
                  </>
                ) : (
                  <>
                    <option value="login">Login</option>
                    <option value="logout">Logout</option>
                    <option value="created">Created</option>
                    <option value="updated">Updated</option>
                    <option value="deleted">Deleted</option>
                    <option value="viewed">Viewed</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User
              </label>
              <select
                value={filters.user_id}
                onChange={(e) => handleFilterChange("user_id", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All Users</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) =>
                  handleFilterChange("start_date", e.target.value)
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => handleFilterChange("end_date", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            {activeTab === "audit" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resource Type
                </label>
                <select
                  value={filters.resource_type}
                  onChange={(e) =>
                    handleFilterChange("resource_type", e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">All Resources</option>
                  <option value="auth">Authentication</option>
                  <option value="users">Users</option>
                  <option value="customers">Customers</option>
                  <option value="criteria">Criteria</option>
                  <option value="options">Options</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {activeTab === "audit" ? "IP Address" : "Search"}
              </label>
              {activeTab === "audit" ? (
                <input
                  type="text"
                  value={filters.ip_address}
                  onChange={(e) =>
                    handleFilterChange("ip_address", e.target.value)
                  }
                  placeholder="Search IP addresses..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              ) : (
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  placeholder="Search in descriptions..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              )}
            </div>

            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table
            className="w-full divide-y divide-gray-200"
            style={{ minWidth: "1200px" }}
          >
            <thead className="bg-gray-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider transition-colors ${
                        header.column.getCanSort()
                          ? "cursor-pointer hover:bg-gray-100 hover:text-blue-600"
                          : ""
                      }`}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center space-x-1">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        {header.column.getCanSort() && (
                          <span className="text-gray-400">
                            {{
                              asc: "↑",
                              desc: "↓",
                            }[header.column.getIsSorted()] ?? "↕"}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentData.length > 0 ? (
                currentData.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-gray-50">
                    {table.getHeaderGroups()[0].headers.map((header) => (
                      <td
                        key={header.id}
                        className="px-6 py-4 whitespace-nowrap"
                      >
                        {flexRender(header.column.columnDef.cell, {
                          getValue: () => {
                            if (header.id === "user.name")
                              return item.user?.name;
                            if (header.id === "action") return item.action;
                            if (header.id === "description")
                              return item.description;
                            if (header.id === "resource_type")
                              return item.resource_type;
                            if (header.id === "changes_summary")
                              return item.changes_summary;
                            if (header.id === "performed_at")
                              return item.performed_at;
                            if (header.id === "formatted_date")
                              return item.formatted_date;
                            if (header.id === "ip_address")
                              return item.ip_address;
                            if (header.id === "browser_info")
                              return item.browser_info;
                            return null;
                          },
                          row: { original: item },
                        })}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={currentColumns.length}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    {loading
                      ? `Loading ${activeTab}...`
                      : `No ${activeTab} found`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Simplified Pagination */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
          {/* Results Info */}
          <div className="flex items-center space-x-4">
            <p className="text-sm text-gray-600">
              <span className="font-medium">{totalRecords}</span> total results
            </p>
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Show:</label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {[15, 25, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>

            <div className="px-4 py-1 text-sm text-gray-700 bg-blue-50 border border-blue-200 rounded-md">
              Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
            </div>

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserActivityReport;
