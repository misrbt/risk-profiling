import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  UserIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  KeyIcon,
  SignalIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
import api from "../../services/api";
import Swal from "sweetalert2";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import UserModal from "../../components/Modals/UserModal";
import { API_ENDPOINTS } from "../../config/constants";
import ActiveUsersTab from "../../components/ActiveUsersTab";

const UserManagement = () => {
  const { user: currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [activeTab, setActiveTab] = useState("users"); // 'users' or 'active'

  const fetchUsers = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) {
        setInitialLoad(true);
      } else {
        setLoading(true);
      }
      const response = await api.get(API_ENDPOINTS.USERS);
      console.log("Users API response:", response.data);

      if (response.data.success && response.data.data) {
        console.log("Setting users:", response.data.data);
        setUsers(response.data.data);
      } else {
        console.log("No users data found in response");
        setUsers([]);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      Swal.fire({
        title: "Error",
        text: "Failed to fetch users",
        icon: "error",
        backdrop: "rgba(0,0,0,0.5)",
        customClass: {
          popup: "rounded-2xl shadow-2xl",
          title: "text-xl font-bold text-gray-900",
          htmlContainer: "text-gray-600",
          confirmButton:
            "px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 shadow-md",
        },
        buttonsStyling: false,
      });
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.ROLES);
      setRoles(response.data.data || response.data);
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  useEffect(() => {
    fetchUsers(true);
    fetchRoles();

    // Refetch users when the page becomes visible again (but not when modal is open)
    const handleVisibilityChange = () => {
      if (!document.hidden && !isModalOpen) {
        fetchUsers();
      }
    };

    // Refetch users when window regains focus (but not when modal is open)
    const handleFocus = () => {
      if (!isModalOpen) {
        fetchUsers();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchUsers, isModalOpen]);

  const handleResetPassword = useCallback(
    async (userId, userName) => {
      const isOwnAccount = currentUser && currentUser.id === userId;

      const result = await Swal.fire({
        title: "Reset Password",
        html: `
        <p class="mb-4">Are you sure you want to reset password for <strong>${userName}</strong>?</p>
        ${
          isOwnAccount
            ? `<div class="mb-4 p-3 bg-orange-100 border border-orange-300 rounded-md">
          <p class="text-orange-800 text-sm font-medium">⚠️ Warning</p>
          <p class="text-orange-700 text-sm mt-1">You are resetting your own password. You will be logged out after this action.</p>
        </div>`
            : ""
        }
        <div class="text-left bg-gray-50 p-3 rounded-md">
          <p class="text-sm text-gray-600 mb-2"><strong>What will happen:</strong></p>
          <ul class="text-sm text-gray-600 list-disc list-inside space-y-1">
            <li>A temporary password will be generated</li>
            <li>User must change password on next login</li>
            <li>All existing user sessions will be terminated</li>
          </ul>
        </div>
      `,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#f59e0b",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes, reset password",
        cancelButtonText: "Cancel",
        backdrop: `
        rgba(0,0,0,0.5)
        left top
        no-repeat
      `,
        customClass: {
          popup: "rounded-2xl shadow-2xl backdrop-blur-sm",
          title: "text-xl font-bold text-gray-900 mb-2",
          htmlContainer: "text-gray-600 mb-4",
          confirmButton:
            "px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 shadow-md mr-3",
          cancelButton:
            "px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200",
          actions: "flex-row-reverse gap-3",
        },
        buttonsStyling: false,
        allowOutsideClick: () => !Swal.isLoading(),
        showClass: {
          popup: "animate__animated animate__fadeInUp animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__fadeOutDown animate__faster",
        },
      });

      if (result.isConfirmed) {
        try {
          const response = await api.post(`/admin/users/${userId}/reset-password`);

          await fetchUsers();

          let message = response.data.message || "Password reset successfully.";
          if (response.data.temporary_password) {
            message += `<br><br><div class="bg-blue-50 border border-blue-200 rounded-md p-3">
            <strong class="text-blue-800">Temporary Password:</strong><br>
            <code style="background: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-size: 14px;">${response.data.temporary_password}</code>
            <br><small class="text-blue-600 mt-2 block">Please provide this to the user securely.</small>
          </div>`;
          }

          if (isOwnAccount) {
            message += `<br><br><div class="bg-orange-50 border border-orange-200 rounded-md p-3">
            <em class="text-orange-700 text-sm">You will be redirected to the login page in 3 seconds...</em>
          </div>`;
          }

          await Swal.fire({
            title: "Password Reset!",
            html: message,
            icon: "success",
            confirmButtonText: "OK",
            customClass: {
              popup: "rounded-2xl",
            },
          });

          // If user reset their own password, log them out and redirect to login
          if (isOwnAccount) {
            setTimeout(async () => {
              await logout();
              navigate("/login");
            }, 3000);
          }
        } catch (error) {
          console.error("Error resetting password:", error);
          Swal.fire({
            title: "Error",
            text: error.response?.data?.message || "Failed to reset password",
            icon: "error",
            customClass: {
              popup: "rounded-2xl",
            },
          });
        }
      }
    },
    [currentUser, fetchUsers, logout, navigate]
  );

  const handleResetMfa = useCallback(
    async (userId, userName) => {
      const isOwnAccount = currentUser && currentUser.id === userId;

      const result = await Swal.fire({
        title: "Reset MFA",
        html: `
        <p class="mb-4">Are you sure you want to reset two-factor authentication for <strong>${userName}</strong>?</p>
        ${
          isOwnAccount
            ? `<div class="mb-4 p-3 bg-orange-100 border border-orange-300 rounded-md">
          <p class="text-orange-800 text-sm font-medium">⚠️ Warning</p>
          <p class="text-orange-700 text-sm mt-1">You are resetting your own MFA. You will be logged out after this action.</p>
        </div>`
            : ""
        }
        <div class="text-left bg-gray-50 p-3 rounded-md">
          <p class="text-sm text-gray-600 mb-2"><strong>What will happen:</strong></p>
          <ul class="text-sm text-gray-600 list-disc list-inside space-y-1">
            <li>The user's current authenticator enrollment will be cleared</li>
            <li>User must set up two-factor authentication again (scan a new QR code)</li>
            <li>All existing user sessions will be terminated</li>
          </ul>
        </div>
      `,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#f59e0b",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes, reset MFA",
        cancelButtonText: "Cancel",
        backdrop: `
        rgba(0,0,0,0.5)
        left top
        no-repeat
      `,
        customClass: {
          popup: "rounded-2xl shadow-2xl backdrop-blur-sm",
          title: "text-xl font-bold text-gray-900 mb-2",
          htmlContainer: "text-gray-600 mb-4",
          confirmButton:
            "px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 shadow-md mr-3",
          cancelButton:
            "px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200",
          actions: "flex-row-reverse gap-3",
        },
        buttonsStyling: false,
        allowOutsideClick: () => !Swal.isLoading(),
        showClass: {
          popup: "animate__animated animate__fadeInUp animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__fadeOutDown animate__faster",
        },
      });

      if (result.isConfirmed) {
        try {
          const response = await api.post(`/admin/users/${userId}/reset-mfa`);

          await fetchUsers();

          let message = response.data.message || "MFA reset successfully.";

          if (isOwnAccount) {
            message += `<br><br><div class="bg-orange-50 border border-orange-200 rounded-md p-3">
            <em class="text-orange-700 text-sm">You will be redirected to the login page in 3 seconds...</em>
          </div>`;
          }

          await Swal.fire({
            title: "MFA Reset!",
            html: message,
            icon: "success",
            confirmButtonText: "OK",
            customClass: {
              popup: "rounded-2xl",
            },
          });

          if (isOwnAccount) {
            setTimeout(async () => {
              await logout();
              navigate("/login");
            }, 3000);
          }
        } catch (error) {
          console.error("Error resetting MFA:", error);
          Swal.fire({
            title: "Error",
            text: error.response?.data?.message || "Failed to reset MFA",
            icon: "error",
            customClass: {
              popup: "rounded-2xl",
            },
          });
        }
      }
    },
    [currentUser, fetchUsers, logout, navigate]
  );

  const handleStatusChange = useCallback(
    async (userId, newStatus) => {
      try {
        await api.put(`/admin/users/${userId}/status`, { status: newStatus });
        await fetchUsers();
        Swal.fire({
          title: "Success",
          text: `User status updated to ${newStatus}`,
          icon: "success",
          backdrop: "rgba(0,0,0,0.5)",
          customClass: {
            popup: "rounded-2xl shadow-2xl",
            title: "text-xl font-bold text-gray-900",
            htmlContainer: "text-gray-600",
            confirmButton:
              "px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 shadow-md",
          },
          buttonsStyling: false,
        });
      } catch (error) {
        console.error("Error updating user status:", error);
        Swal.fire({
          title: "Error",
          text: "Failed to update user status",
          icon: "error",
          backdrop: "rgba(0,0,0,0.5)",
          customClass: {
            popup: "rounded-2xl shadow-2xl",
            title: "text-xl font-bold text-gray-900",
            htmlContainer: "text-gray-600",
            confirmButton:
              "px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 shadow-md",
          },
          buttonsStyling: false,
        });
      }
    },
    [fetchUsers]
  );

  const getRoleBadgeColor = useCallback((roleSlug) => {
    const colors = {
      admin: "bg-blue-100 text-blue-600",
      compliance: "bg-indigo-100 text-indigo-800",
      manager: "bg-green-100 text-green-800",
      users: "bg-gray-100 text-gray-800",
      audit: "bg-orange-100 text-gray-800",
    };
    return colors[roleSlug] || "bg-gray-100 text-gray-800";
  }, []);

  const getStatusBadgeColor = useCallback((status) => {
    return status === "active"
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";
  }, []);

  const handleOpenModal = useCallback((user = null) => {
    setEditingUser(user);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingUser(null);
  }, []);

  const handleUserAdded = useCallback(() => {
    fetchUsers();
    handleCloseModal();
  }, [fetchUsers, handleCloseModal]);

  // Filter data based on role and status
  const filteredData = useMemo(() => {
    return users.filter((user) => {
      const matchesRole =
        selectedRole === "all" ||
        user.roles?.some((role) => role.slug === selectedRole);
      const matchesStatus =
        statusFilter === "all" || user.status === statusFilter;
      return matchesRole && matchesStatus;
    });
  }, [users, selectedRole, statusFilter]);

  // Table columns definition
  const columns = useMemo(
    () => [
      {
        accessorKey: "full_name",
        header: "User",
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-900">
                  {user.full_name || `${user.first_name} ${user.last_name}`}
                </div>
              </div>
            </div>
          );
        },
        enableSorting: true,
        filterFn: (row, columnId, value) => {
          const user = row.original;
          const searchValue = value.toLowerCase();
          return (
            user.full_name?.toLowerCase().includes(searchValue) ||
            user.first_name?.toLowerCase().includes(searchValue) ||
            user.last_name?.toLowerCase().includes(searchValue) ||
            user.username?.toLowerCase().includes(searchValue) ||
            user.email?.toLowerCase().includes(searchValue)
          );
        },
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ getValue }) => (
          <div className="text-sm text-gray-900">{getValue()}</div>
        ),
        enableSorting: true,
      },
      {
        accessorKey: "roles",
        header: "Roles",
        cell: ({ row }) => {
          const roles = row.original.roles || [];
          return (
            <div className="flex flex-wrap gap-1">
              {roles.map((role) => (
                <span
                  key={role.id}
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(
                    role.slug
                  )}`}
                >
                  <ShieldCheckIcon className="w-3 h-3 mr-1" />
                  {role.name}
                </span>
              ))}
            </div>
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row, getValue }) => {
          const user = row.original;
          return (
            <select
              value={getValue()}
              onChange={(e) => handleStatusChange(user.id, e.target.value)}
              className={`text-xs font-medium px-2.5 py-0.5 rounded-full border-0 ${getStatusBadgeColor(
                getValue()
              )}`}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          );
        },
        enableSorting: true,
      },
      {
        accessorKey: "branch",
        header: "Branch",
        cell: ({ row }) => {
          const branch = row.original.branch;
          return (
            <div className="text-sm text-gray-900">
              {branch ? branch.name : "Not Assigned"}
            </div>
          );
        },
        enableSorting: true,
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleOpenModal(user)}
                className="text-blue-600 hover:text-blue-900"
                title="Edit User"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() =>
                  handleResetPassword(user.id, user.full_name || user.username)
                }
                className="text-yellow-600 hover:text-yellow-900"
                title="Reset Password"
              >
                <KeyIcon className="w-4 h-4" />
              </button>
              {user.two_factor_enabled && (
                <button
                  onClick={() =>
                    handleResetMfa(user.id, user.full_name || user.username)
                  }
                  className="text-purple-600 hover:text-purple-900"
                  title="Reset MFA"
                >
                  <ShieldExclamationIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        },
        enableSorting: false,
      },
    ],
    [
      getRoleBadgeColor,
      getStatusBadgeColor,
      handleStatusChange,
      handleOpenModal,
      handleResetPassword,
      handleResetMfa,
    ]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: "includesString",
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  if (initialLoad) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
          User Management
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Manage user accounts, roles, and permissions
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('users')}
              className={`${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <UserIcon className="w-5 h-5 mr-2" />
              All Users
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`${
                activeTab === 'active'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <SignalIcon className="w-5 h-5 mr-2" />
              Active Users
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'active' ? (
        <ActiveUsersTab />
      ) : (
        <>
      {/* Actions Bar */}
      <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={globalFilter ?? ""}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="w-full sm:w-auto pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Role Filter */}
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              {roles.map((role) => (
                <option key={role.id} value={role.slug}>
                  {role.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Add User Button */}
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add New User
          </button>
        </div>
      </div>

      {/* Users DataTable */}
      <div className="bg-white rounded-lg shadow-sm my-10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={
                            header.column.getCanSort()
                              ? "cursor-pointer select-none flex items-center space-x-1"
                              : ""
                          }
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <span>
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                          </span>
                          {header.column.getCanSort() && (
                            <span className="flex flex-col">
                              <ChevronUpIcon
                                className={`w-3 h-3 ${
                                  header.column.getIsSorted() === "asc"
                                    ? "text-gray-900"
                                    : "text-gray-400"
                                }`}
                              />
                              <ChevronDownIcon
                                className={`w-3 h-3 -mt-1 ${
                                  header.column.getIsSorted() === "desc"
                                    ? "text-gray-900"
                                    : "text-gray-400"
                                }`}
                              />
                            </span>
                          )}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* No Data State */}
        {table.getRowModel().rows.length === 0 && (
          <div className="text-center py-12">
            <UserIcon className="mx-auto w-12 h-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No users found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {globalFilter || selectedRole !== "all" || statusFilter !== "all"
                ? "Try adjusting your search criteria."
                : "Get started by adding a new user."}
            </p>
          </div>
        )}

        {/* Pagination */}
        {table.getPageCount() > 1 && (
          <div className="bg-white border-t  border-gray-200">
            {/* Mobile Pagination */}
            <div className="sm:hidden px-4 py-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeftIcon className="w-4 h-4 mr-1" />
                  Previous
                </button>

                <span className="text-sm text-gray-700 font-medium">
                  Page {table.getState().pagination.pageIndex + 1} of{" "}
                  {table.getPageCount()}
                </span>

                <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <ChevronRightIcon className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>

            {/* Desktop Pagination */}
            <div className="hidden sm:block  px-6 py-4">
              <div className="flex items-center justify-between">
                {/* Left side - Results info and page size selector */}
                <div className="flex items-center space-x-6">
                  <div className="text-sm text-gray-700">
                    Showing{" "}
                    <span className="font-semibold">
                      {table.getState().pagination.pageIndex *
                        table.getState().pagination.pageSize +
                        1}
                    </span>{" "}
                    to{" "}
                    <span className="font-semibold">
                      {Math.min(
                        (table.getState().pagination.pageIndex + 1) *
                          table.getState().pagination.pageSize,
                        table.getFilteredRowModel().rows.length
                      )}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold">
                      {table.getFilteredRowModel().rows.length}
                    </span>{" "}
                    results
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-700">Show:</span>
                    <select
                      value={table.getState().pagination.pageSize}
                      onChange={(e) =>
                        table.setPageSize(Number(e.target.value))
                      }
                      className="block w-20 rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
                    >
                      {[10, 20, 30, 50, 100].map((pageSize) => (
                        <option key={pageSize} value={pageSize}>
                          {pageSize}
                        </option>
                      ))}
                    </select>
                    <span className="text-sm text-gray-700">entries</span>
                  </div>
                </div>

                {/* Right side - Navigation controls */}
                <nav
                  className="flex items-center space-x-1"
                  aria-label="Pagination"
                >
                  <button
                    onClick={() => table.setPageIndex(0)}
                    disabled={!table.getCanPreviousPage()}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    First
                  </button>

                  <button
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border-t border-b border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeftIcon className="w-4 h-4 mr-1" />
                    Previous
                  </button>

                  <div className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-900 bg-gray-50 border-t border-b border-gray-300">
                    Page {table.getState().pagination.pageIndex + 1} of{" "}
                    {table.getPageCount()}
                  </div>

                  <button
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border-t border-b border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                    <ChevronRightIcon className="w-4 h-4 ml-1" />
                  </button>

                  <button
                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                    disabled={!table.getCanNextPage()}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Last
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

        </>
      )}

      {/* User Modal */}
      <UserModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onUserAdded={handleUserAdded}
        user={editingUser}
        roles={roles}
      />
    </motion.div>
  );
};

export default UserManagement;
