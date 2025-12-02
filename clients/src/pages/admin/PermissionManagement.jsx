import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  createColumnHelper,
  flexRender,
} from "@tanstack/react-table";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  ShieldCheckIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import api, { permissionAPI, roleAPI } from "../../services/api";
import Swal from "sweetalert2";
import PermissionModal from "../../components/Modals/PermissionModal";
import PermissionGate from "../../components/auth/PermissionGate";
import { usePermissions } from "../../hooks/usePermissions";

const PermissionManagement = () => {
  const { can, PERMISSIONS } = usePermissions();
  const [permissions, setPermissions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([]);
  const [rowSelection, setRowSelection] = useState({});
  const [pageSize, setPageSize] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState(null);

  const columnHelper = createColumnHelper();

  const columns = [
    columnHelper.accessor("name", {
      header: "Permission Name",
      cell: (info) => (
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
            <ShieldCheckIcon className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{info.getValue()}</div>
            <div className="text-sm text-gray-500">
              {info.row.original.slug}
            </div>
          </div>
        </div>
      ),
    }),
    columnHelper.accessor("roles", {
      header: "Assigned Roles",
      cell: (info) => {
        const roles = info.getValue() || [];
        return (
          <div className="flex flex-wrap gap-1">
            {roles.length > 0 ? (
              roles.map((role) => (
                <span
                  key={role.id}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                >
                  <UserGroupIcon className="w-3 h-3 mr-1" />
                  {role.name}
                </span>
              ))
            ) : (
              <span className="text-gray-400 text-sm">No roles assigned</span>
            )}
          </div>
        );
      },
    }),
    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: (info) => (
        <div className="flex items-center space-x-2">
          <PermissionGate permission={PERMISSIONS.MANAGE_PERMISSIONS}>
            <button
              onClick={() => handleEdit(info.row.original)}
              className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <PencilIcon className="w-4 h-4 mr-1" />
              Edit
            </button>
          </PermissionGate>
          <PermissionGate permission={PERMISSIONS.MANAGE_PERMISSIONS}>
            <button
              onClick={() => handleDelete(info.row.original)}
              className="inline-flex items-center px-3 py-1 border border-red-300 shadow-sm text-xs leading-4 font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              <TrashIcon className="w-4 h-4 mr-1" />
              Delete
            </button>
          </PermissionGate>
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data: permissions,
    columns,
    state: {
      globalFilter,
      sorting,
      rowSelection,
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: "includesString",
    initialState: {
      pagination: {
        pageSize: pageSize,
      },
    },
    enableGlobalFilter: true,
    enableSorting: true,
    enableFilters: true,
    enableColumnFilters: true,
    enableRowSelection: false, // Disabled for now as it's not needed for permissions
    enablePagination: true,
  });

  useEffect(() => {
    fetchPermissions();
    fetchRoles();
  }, []);

  useEffect(() => {
    table.setPageSize(pageSize);
  }, [pageSize, table]);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const response = await permissionAPI.getAll();
      if (response.data.success) {
        setPermissions(response.data.data);
      } else {
        throw new Error("API response indicated failure");
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to load permissions";
      Swal.fire({
        title: "Error",
        text: errorMessage,
        icon: "error",
        customClass: {
          popup: "rounded-2xl",
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await roleAPI.getAll();
      if (response.data.success) {
        setRoles(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  const handleAdd = () => {
    setSelectedPermission(null);
    setIsModalOpen(true);
  };

  const handleEdit = (permission) => {
    console.log("handleEdit called with permission:", permission);
    setSelectedPermission(permission);
    setIsModalOpen(true);
  };

  const handleDelete = async (permission) => {
    const result = await Swal.fire({
      title: "Delete Permission",
      text: `Are you sure you want to delete "${permission.name}"? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      backdrop: true,
      customClass: {
        popup: "rounded-2xl",
        title: "text-lg font-semibold",
        content: "text-sm",
        confirmButton: "rounded-lg px-4 py-2 font-medium",
        cancelButton: "rounded-lg px-4 py-2 font-medium",
      },
    });

    if (result.isConfirmed) {
      try {
        const response = await permissionAPI.delete(permission.id);
        if (response.data.success) {
          await fetchPermissions();
          Swal.fire({
            title: "Deleted!",
            text: "Permission has been deleted successfully.",
            icon: "success",
            timer: 2000,
            showConfirmButton: false,
            customClass: {
              popup: "rounded-2xl",
            },
          });
        }
      } catch (error) {
        console.error("Error deleting permission:", error);
        Swal.fire({
          title: "Error!",
          text: error.response?.data?.message || "Failed to delete permission.",
          icon: "error",
          customClass: {
            popup: "rounded-2xl",
          },
        });
      }
    }
  };

  const handleModalSubmit = async () => {
    console.log("handleModalSubmit called - refreshing permissions");
    await fetchPermissions();
    setIsModalOpen(false);
    setSelectedPermission(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl my-12 mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Permission Management
            </h1>
            <p className="mt-2 text-gray-600">
              Manage system permissions and assign them to roles
            </p>
          </div>
          <PermissionGate permission={PERMISSIONS.MANAGE_PERMISSIONS}>
            <motion.button
              onClick={handleAdd}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Add Permission
            </motion.button>
          </PermissionGate>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Total Permissions
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {permissions.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserGroupIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Assigned Permissions
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {
                  permissions.filter((p) => p.roles && p.roles.length > 0)
                    .length
                }
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ShieldCheckIcon className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Unassigned Permissions
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {
                  permissions.filter((p) => !p.roles || p.roles.length === 0)
                    .length
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search permissions..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Show:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {[5, 10, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {size} rows
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
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

        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{" "}
                <span className="font-medium">
                  {table.getState().pagination.pageIndex *
                    table.getState().pagination.pageSize +
                    1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(
                    (table.getState().pagination.pageIndex + 1) *
                      table.getState().pagination.pageSize,
                    table.getFilteredRowModel().rows.length
                  )}
                </span>{" "}
                of{" "}
                <span className="font-medium">
                  {table.getFilteredRowModel().rows.length}
                </span>{" "}
                results
              </p>
            </div>
            <div>
              <nav
                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination"
              >
                <button
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  First
                </button>
                <button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                  Page {table.getState().pagination.pageIndex + 1} of{" "}
                  {table.getPageCount()}
                </span>
                <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
                <button
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Last
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Permission Testing Section */}


      {/* Permission Modal */}
      <PermissionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        permission={selectedPermission}
        roles={roles}
      />
    </div>
  );
};

export default PermissionManagement;
