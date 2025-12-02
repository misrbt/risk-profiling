import React, { useState, useEffect, Fragment } from "react";
import { motion } from "framer-motion";
import { Dialog, Transition } from '@headlessui/react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ShieldCheckIcon,
  KeyIcon,
  UserGroupIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import api from "../../services/api";
import Swal from "sweetalert2";
import PermissionGate from "../../components/auth/PermissionGate";
import { usePermissions } from "../../hooks/usePermissions";
import { API_ENDPOINTS } from "../../config/constants";

const RoleManagement = () => {
  const { can, PERMISSIONS } = usePermissions();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    permissions: [],
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.ROLES);
      setRoles(response.data.data || response.data);
    } catch (error) {
      console.error("Error fetching roles:", error);
      Swal.fire("Error", "Failed to fetch roles", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.PERMISSIONS);
      setPermissions(response.data.data || response.data);
    } catch (error) {
      console.error("Error fetching permissions:", error);
    }
  };

  const handleCreateRole = () => {
    setEditingRole(null);
    setFormData({
      name: "",
      slug: "",
      permissions: [],
    });
    setShowModal(true);
  };

  const handleEditRole = (role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      slug: role.slug,
      permissions: role.permissions?.map((p) => p.id) || [],
    });
    setShowModal(true);
  };

  const handleDeleteRole = async (roleId, roleName) => {
    const result = await Swal.fire({
      title: "Delete Role",
      text: `Are you sure you want to delete the role "${roleName}"? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete role",
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`${API_ENDPOINTS.ROLES}/${roleId}`);
        await fetchRoles();
        Swal.fire("Deleted!", "Role has been deleted successfully.", "success");
      } catch (error) {
        console.error("Error deleting role:", error);
        Swal.fire("Error", "Failed to delete role", "error");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Role name is required';
    }
    if (!formData.slug.trim()) {
      newErrors.slug = 'Role slug is required';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setModalLoading(true);

    try {
      const roleData = {
        name: formData.name,
        slug: formData.slug,
        permissions: formData.permissions,
      };

      if (editingRole) {
        await api.put(`${API_ENDPOINTS.ROLES}/${editingRole.id}`, roleData);
        Swal.fire({
          title: 'Success!',
          text: 'Role updated successfully.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          customClass: {
            popup: 'rounded-2xl',
          },
        });
      } else {
        await api.post(API_ENDPOINTS.ROLES, roleData);
        Swal.fire({
          title: 'Success!',
          text: 'Role created successfully.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          customClass: {
            popup: 'rounded-2xl',
          },
        });
      }

      setShowModal(false);
      await fetchRoles();
    } catch (error) {
      console.error("Error saving role:", error);
      
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        Swal.fire({
          title: 'Error',
          text: error.response?.data?.message || 'Failed to save role. Please try again.',
          icon: 'error',
          customClass: {
            popup: 'rounded-2xl',
          },
        });
      }
    } finally {
      setModalLoading(false);
    }
  };

  const handlePermissionChange = (permissionId, checked) => {
    if (checked) {
      setFormData((prev) => ({
        ...prev,
        permissions: [...prev.permissions, permissionId],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        permissions: prev.permissions.filter((id) => id !== permissionId),
      }));
    }
  };

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^\w ]+/g, "")
      .replace(/ +/g, "-");
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name,
      slug: generateSlug(name),
    }));
    
    // Clear error when user starts typing
    if (errors.name) {
      setErrors(prev => ({ ...prev, name: '' }));
    }
  };

  const handleSlugChange = (e) => {
    const slug = e.target.value;
    setFormData((prev) => ({
      ...prev,
      slug,
    }));
    
    // Clear error when user starts typing
    if (errors.slug) {
      setErrors(prev => ({ ...prev, slug: '' }));
    }
  };

  const handleCloseModal = () => {
    if (!modalLoading) {
      setShowModal(false);
      setErrors({});
      setFormData({
        name: "",
        slug: "",
        permissions: [],
      });
    }
  };

  if (loading) {
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
      className="max-w-7xl mx-auto"
    >
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Role Management</h1>
          <p className="text-gray-600">
            Manage user roles and their permissions
          </p>
        </div>
        <PermissionGate permission={PERMISSIONS.MANAGE_ROLES}>
          <button
            onClick={handleCreateRole}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Create New Role
          </button>
        </PermissionGate>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role) => (
          <div
            key={role.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    role.slug === "admin"
                      ? "bg-red-100 text-red-600"
                      : role.slug === "compliance"
                      ? "bg-blue-100 text-blue-600"
                      : role.slug === "manager"
                      ? "bg-green-100 text-green-600"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  <ShieldCheckIcon className="w-6 h-6" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {role.name}
                  </h3>
                  <p className="text-sm text-gray-500">{role.slug}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <PermissionGate permission={PERMISSIONS.MANAGE_ROLES}>
                  <button
                    onClick={() => handleEditRole(role)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                </PermissionGate>
                <PermissionGate permission={PERMISSIONS.MANAGE_ROLES}>
                  {role.slug !== "admin" && (
                    <button
                      onClick={() => handleDeleteRole(role.id, role.name)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </PermissionGate>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center text-sm text-gray-600 mb-2">
                <UserGroupIcon className="w-4 h-4 mr-1" />
                <span>{role.users_count || 0} users assigned</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <KeyIcon className="w-4 h-4 mr-1" />
                <span>{role.permissions?.length || 0} permissions</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Permissions
              </p>
              <div className="flex flex-wrap gap-1">
                {role.permissions?.slice(0, 3).map((permission) => (
                  <span
                    key={permission.id}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                  >
                    {permission.name}
                  </span>
                ))}
                {role.permissions?.length > 3 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    +{role.permissions.length - 3} more
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modern Modal */}
      <Transition appear show={showModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={handleCloseModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-2xl transition-all">
                  <div className="border-b border-gray-200 pb-4 mb-6">
                    <Dialog.Title
                      as="h3"
                      className="text-xl font-bold leading-6 text-gray-900 flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                          <ShieldCheckIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">
                            {editingRole ? 'Edit Role' : 'Add New Role'}
                          </h3>
                          <p className="text-sm text-gray-500 font-normal">
                            {editingRole
                              ? "Update role details and permissions"
                              : "Define a new role with specific permissions"}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 rounded-lg hover:bg-gray-100"
                        onClick={handleCloseModal}
                        disabled={modalLoading}
                        aria-label="Close modal"
                      >
                        <XMarkIcon className="w-6 h-6" />
                      </button>
                    </Dialog.Title>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Role Details Section */}
                    <div>
                      <h4 className="text-base font-semibold text-gray-900 flex items-center mb-4">
                        <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center mr-2">
                          <ShieldCheckIcon className="w-3 h-3 text-blue-600" />
                        </div>
                        Role Details
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Role Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Role Name *
                          </label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={handleNameChange}
                            className={`block w-full px-3 py-2 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-0 ${
                              errors.name 
                                ? 'border-red-300 bg-red-50 focus:border-red-500' 
                                : 'border-gray-200 bg-gray-50 hover:border-gray-300 focus:border-blue-500 focus:bg-white'
                            }`}
                            placeholder="Enter role name"
                            disabled={modalLoading}
                          />
                          {errors.name && (
                            <p className="mt-1 text-xs text-red-600 flex items-center">
                              <span className="w-4 h-4 mr-1">⚠️</span>
                              {errors.name}
                            </p>
                          )}
                        </div>

                        {/* Role Slug */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Role Slug *
                          </label>
                          <input
                            type="text"
                            value={formData.slug}
                            onChange={handleSlugChange}
                            className={`block w-full px-3 py-2 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-0 ${
                              errors.slug 
                                ? 'border-red-300 bg-red-50 focus:border-red-500' 
                                : 'border-gray-200 bg-gray-50 hover:border-gray-300 focus:border-blue-500 focus:bg-white'
                            }`}
                            placeholder="role-slug"
                            disabled={modalLoading}
                          />
                          {errors.slug && (
                            <p className="mt-1 text-xs text-red-600 flex items-center">
                              <span className="w-4 h-4 mr-1">⚠️</span>
                              {errors.slug}
                            </p>
                          )}
                          <p className="mt-1 text-xs text-gray-500">
                            Used for programmatic access. Auto-generated from name.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Permissions Section */}
                    <div>
                      <h4 className="text-base font-semibold text-gray-900 flex items-center mb-4">
                        <div className="w-6 h-6 bg-green-100 rounded-md flex items-center justify-center mr-2">
                          <KeyIcon className="w-3 h-3 text-green-600" />
                        </div>
                        Assign Permissions
                      </h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50">
                        {permissions.length > 0 ? (
                          permissions.map((permission) => (
                            <label
                              key={permission.id}
                              className="flex items-center p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={formData.permissions.includes(permission.id)}
                                onChange={(e) =>
                                  handlePermissionChange(
                                    permission.id,
                                    e.target.checked
                                  )
                                }
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                disabled={modalLoading}
                              />
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">{permission.name}</p>
                                <p className="text-xs text-gray-500">{permission.slug}</p>
                              </div>
                            </label>
                          ))
                        ) : (
                          <p className="text-gray-500 text-sm text-center py-4">No permissions available</p>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        Selected: {formData.permissions.length} of {permissions.length} permissions
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="border-t border-gray-200 pt-6">
                      <div className="flex flex-col sm:flex-row justify-end gap-3">
                        <button
                          type="button"
                          onClick={handleCloseModal}
                          className="flex items-center justify-center px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all duration-200 order-2 sm:order-1"
                          disabled={modalLoading}
                        >
                          <XMarkIcon className="w-4 h-4 mr-2" />
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex items-center justify-center px-6 py-2.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 order-1 sm:order-2 shadow-md"
                          disabled={modalLoading}
                        >
                          {modalLoading ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Saving...
                            </>
                          ) : (
                            <>
                              <ShieldCheckIcon className="w-4 h-4 mr-2" />
                              {editingRole ? 'Update Role' : 'Create Role'}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Summary Stats */}
    </motion.div>
  );
};

export default RoleManagement;
