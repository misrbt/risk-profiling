import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import {
  XMarkIcon,
  ShieldCheckIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import api, { permissionAPI } from '../../services/api';
import Swal from 'sweetalert2';

const PermissionModal = ({ isOpen, onClose, onSubmit, permission = null, roles = [] }) => {
  const isEdit = !!permission;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    assignedRoles: [],
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (isEdit && permission) {
        console.log('Loading permission for edit:', permission);
        setFormData({
          name: permission.name || '',
          slug: permission.slug || '',
          assignedRoles: permission.roles ? permission.roles.map(role => role.id) : [],
        });
      } else {
        // Reset form for new permission
        setFormData({
          name: '',
          slug: '',
          assignedRoles: [],
        });
      }
      setErrors({});
    }
  }, [isOpen, isEdit, permission]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-generate slug from name (only when creating new permission or when slug field is empty)
    if (name === 'name' && (!isEdit || formData.slug === '')) {
      const slug = value.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setFormData(prev => ({
        ...prev,
        slug: slug
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleRoleToggle = (roleId) => {
    setFormData(prev => ({
      ...prev,
      assignedRoles: prev.assignedRoles.includes(roleId)
        ? prev.assignedRoles.filter(id => id !== roleId)
        : [...prev.assignedRoles, roleId]
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Permission name is required';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Permission slug is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        name: formData.name,
        slug: formData.slug,
      };

      console.log('Submitting permission data:', {
        isEdit,
        permissionId: permission?.id,
        submitData,
        assignedRoles: formData.assignedRoles
      });

      let response;
      if (isEdit) {
        response = await permissionAPI.update(permission.id, submitData);
      } else {
        response = await permissionAPI.create(submitData);
      }

      console.log('API response:', response);

      if (response.data.success) {
        // Handle role assignments/removals
        const permissionId = response.data.data.id || permission.id;
        
        // Get current roles for the permission
        const currentRoles = permission?.roles?.map(role => role.id) || [];
        const newRoles = formData.assignedRoles;

        // Roles to add
        const rolesToAdd = newRoles.filter(roleId => !currentRoles.includes(roleId));
        // Roles to remove
        const rolesToRemove = currentRoles.filter(roleId => !newRoles.includes(roleId));

        // Add roles
        for (const roleId of rolesToAdd) {
          try {
            await permissionAPI.assignToRole(permissionId, roleId);
          } catch (error) {
            console.error('Error adding role:', error);
          }
        }

        // Remove roles
        for (const roleId of rolesToRemove) {
          try {
            await permissionAPI.removeFromRole(permissionId, roleId);
          } catch (error) {
            console.error('Error removing role:', error);
          }
        }

        Swal.fire({
          title: 'Success!',
          text: `Permission ${isEdit ? 'updated' : 'created'} successfully.`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          customClass: {
            popup: 'rounded-2xl',
          },
        });
        
        onSubmit();
      }
    } catch (error) {
      console.error('Error saving permission:', error);
      
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        Swal.fire({
          title: 'Error',
          text: error.response?.data?.message || 'Failed to save permission. Please try again.',
          icon: 'error',
          customClass: {
            popup: 'rounded-2xl',
          },
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        name: '',
        slug: '',
        assignedRoles: [],
      });
      setErrors({});
      onClose();
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gradient-to-br from-slate-900/90 via-slate-800/95 to-slate-900/90 backdrop-blur-md" />
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-2xl transition-all">
                <div className="border-b border-gray-200 pb-4 mb-6">
                  <Dialog.Title
                    as="h3"
                    className="text-xl font-bold leading-6 text-gray-900 flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                        <ShieldCheckIcon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {isEdit ? 'Edit Permission' : 'Add New Permission'}
                      </h3>
                    </div>
                    <button
                      type="button"
                      className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 rounded-lg hover:bg-gray-100"
                      onClick={handleClose}
                      disabled={loading}
                      aria-label="Close modal"
                    >
                      <XMarkIcon className="w-6 h-6" />
                    </button>
                  </Dialog.Title>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Permission Details Section */}
                  <div>
                    <h4 className="text-base font-semibold text-gray-900 flex items-center mb-4">
                      <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center mr-2">
                        <ShieldCheckIcon className="w-3 h-3 text-blue-600" />
                      </div>
                      Permission Details
                    </h4>
                    <div className="space-y-4">
                      {/* Permission Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Permission Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className={`block w-full px-3 py-2 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-0 ${
                            errors.name 
                              ? 'border-red-300 bg-red-50 focus:border-red-500' 
                              : 'border-gray-200 bg-gray-50 hover:border-gray-300 focus:border-blue-500 focus:bg-white'
                          }`}
                          placeholder="Enter permission name"
                          disabled={loading}
                        />
                        {errors.name && (
                          <p className="mt-1 text-xs text-red-600 flex items-center">
                            <span className="w-4 h-4 mr-1">⚠️</span>
                            {errors.name}
                          </p>
                        )}
                      </div>

                      {/* Permission Slug */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Permission Slug *
                        </label>
                        <input
                          type="text"
                          name="slug"
                          value={formData.slug}
                          onChange={handleInputChange}
                          className={`block w-full px-3 py-2 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-0 ${
                            errors.slug 
                              ? 'border-red-300 bg-red-50 focus:border-red-500' 
                              : 'border-gray-200 bg-gray-50 hover:border-gray-300 focus:border-blue-500 focus:bg-white'
                          }`}
                          placeholder="permission-slug"
                          disabled={loading}
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

                  {/* Role Assignment Section */}
                  <div>
                    <h4 className="text-base font-semibold text-gray-900 flex items-center mb-4">
                      <div className="w-6 h-6 bg-green-100 rounded-md flex items-center justify-center mr-2">
                        <UserGroupIcon className="w-3 h-3 text-green-600" />
                      </div>
                      Assign to Roles
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {roles.length > 0 ? (
                        roles.map((role) => (
                          <label
                            key={role.id}
                            className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={formData.assignedRoles.includes(role.id)}
                              onChange={() => handleRoleToggle(role.id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              disabled={loading}
                            />
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">{role.name}</p>
                              <p className="text-xs text-gray-500">{role.slug}</p>
                            </div>
                          </label>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">No roles available</p>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="border-t border-gray-200 pt-6">
                    <div className="flex flex-col sm:flex-row justify-end gap-3">
                      <button
                        type="button"
                        onClick={handleClose}
                        className="flex items-center justify-center px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all duration-200 order-2 sm:order-1"
                        disabled={loading}
                      >
                        <XMarkIcon className="w-4 h-4 mr-2" />
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex items-center justify-center px-6 py-2.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 order-1 sm:order-2 shadow-md"
                        disabled={loading}
                      >
                        {loading ? (
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
                            {isEdit ? 'Update Permission' : 'Create Permission'}
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
  );
};

export default PermissionModal;