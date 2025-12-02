import React, { useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import {
  XMarkIcon,
  UserIcon,
  EyeIcon,
  EyeSlashIcon,
  ShieldCheckIcon,
  KeyIcon,
} from "@heroicons/react/24/outline";
import api from "../../services/api";
import Swal from "sweetalert2";
import { API_ENDPOINTS } from "../../config/constants";

const UserModal = ({
  isOpen,
  onClose,
  onUserAdded,
  user = null,
  roles = [],
}) => {
  const isEdit = !!user;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    middle_initial: "",
    last_name: "",
    username: "",
    email: "",
    role: "",
    branch_id: "",
    status: "active",
  });
  const [branches, setBranches] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      fetchBranches();
      if (isEdit && user) {
        setFormData({
          first_name: user.first_name || "",
          middle_initial: user.middle_initial || "",
          last_name: user.last_name || "",
          username: user.username || "",
          email: user.email || "",
          role: user.roles?.[0]?.slug || "",
          branch_id: user.branch_id ? String(user.branch_id) : "",
          status: user.status || "active",
        });
      } else {
        // Reset form for new user
        setFormData({
          first_name: "",
          middle_initial: "",
          last_name: "",
          username: "",
          email: "",
          password: "",
          password_confirmation: "",
          role: "",
          branch_id: "",
          status: "active",
        });
      }
      setErrors({});
    }
  }, [isOpen, isEdit, user]);

  const fetchBranches = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.BRANCHES_DROPDOWN);
      const branchData = Array.isArray(response.data)
        ? response.data
        : response.data.data || [];
      const sortedBranches = (branchData || []).sort((a, b) => {
        if (a.brcode && b.brcode) {
          return a.brcode.localeCompare(b.brcode);
        }
        return 0;
      });
      setBranches(sortedBranches);
    } catch (error) {
      console.error("Error fetching branches:", error);
      setBranches([]); // Ensure branches is always an array
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = "First name is required";
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = "Last name is required";
    }

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    // Password validation only for edit mode if password is provided
    if (isEdit && formData.password && !formData.password_confirmation) {
      newErrors.password_confirmation = "Please confirm your password";
    }

    if (
      isEdit &&
      formData.password &&
      formData.password !== formData.password_confirmation
    ) {
      newErrors.password_confirmation = "Passwords do not match";
    }

    if (!formData.role) {
      newErrors.role = "Role is required";
    }

    if (!formData.branch_id) {
      newErrors.branch_id = "Branch is required";
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
      // Find the role ID from the slug
      const selectedRole = roles.find((r) => r.slug === formData.role);
      if (!selectedRole) {
        Swal.fire("Error", "Please select a valid role.", "error");
        setLoading(false);
        return;
      }

      const submitData = {
        first_name: formData.first_name,
        middle_initial: formData.middle_initial || null,
        last_name: formData.last_name,
        username: formData.username,
        email: formData.email,
        status: formData.status,
        branch_id: parseInt(formData.branch_id),
        role_ids: [selectedRole.id],
      };

      // Add password fields only for edit mode when password is provided
      if (isEdit && formData.password) {
        submitData.password = formData.password;
        submitData.password_confirmation = formData.password_confirmation;
      }

      if (isEdit) {
        await api.put(`${API_ENDPOINTS.USERS}/${user.id}`, submitData);
        Swal.fire({
          title: "Success!",
          text: "User updated successfully",
          icon: "success",
          confirmButtonColor: "#3b82f6",
          timer: 3000,
          timerProgressBar: true,
          showConfirmButton: false,
        });
      } else {
        const response = await api.post(API_ENDPOINTS.USERS, submitData);

        // Display success message with temporary password if provided
        let message = "User created successfully!";
        if (response.data.temporary_password) {
          message += `<br><br><div class="bg-blue-50 border border-blue-200 rounded-md p-3">
            <strong class="text-blue-800">Temporary Password:</strong><br>
            <code style="background: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-size: 16px;">${response.data.temporary_password}</code>
            <br><small class="text-blue-600 mt-2 block">Please provide this to the user securely.</small>
          </div>`;
        }

        Swal.fire({
          title: "Success!",
          html: message,
          icon: "success",
          confirmButtonColor: "#3b82f6",
          confirmButtonText: "OK",
          showConfirmButton: true,
        });
      }

      onUserAdded();
      onClose();
    } catch (error) {
      console.error("Error saving user:", error);

      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        Swal.fire(
          "Error",
          error.response?.data?.message ||
            "Failed to save user. Please try again.",
          "error"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        first_name: "",
        middle_initial: "",
        last_name: "",
        username: "",
        email: "",
        password: "",
        password_confirmation: "",
        role: "",
        branch_id: "",
        status: "active",
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
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl sm:rounded-3xl bg-white p-6 text-left align-middle shadow-2xl transition-all">
                <div className="border-b border-gray-200 pb-4 mb-6">
                  <Dialog.Title
                    as="h3"
                    className="text-xl font-bold leading-6 text-gray-900 flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                        <UserIcon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {isEdit ? "Edit User" : "Add New User"}
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

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Personal Information Section */}
                  <div>
                    <h4 className="text-base font-semibold text-gray-900 flex items-center mb-4">
                      <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center mr-2">
                        <UserIcon className="w-3 h-3 text-blue-600" />
                      </div>
                      Personal Information
                    </h4>
                    <div className="grid grid-cols-12 gap-4">
                      {/* First Name - Takes 5 columns */}
                      <div className="col-span-12 md:col-span-5">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name *
                        </label>
                        <input
                          type="text"
                          name="first_name"
                          value={formData.first_name}
                          onChange={handleInputChange}
                          className={`block w-full px-3 py-2 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-0 ${
                            errors.first_name
                              ? "border-red-300 bg-red-50 focus:border-red-500"
                              : "border-gray-200 bg-gray-50 hover:border-gray-300 focus:border-blue-500 focus:bg-white"
                          }`}
                          placeholder="Enter first name"
                          disabled={loading}
                        />
                        {errors.first_name && (
                          <p className="mt-1 text-xs text-red-600 flex items-center">
                            <span className="w-4 h-4 mr-1">⚠️</span>
                            {errors.first_name}
                          </p>
                        )}
                      </div>

                      {/* Middle Initial - Takes 2 columns */}
                      <div className="col-span-12 md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          M.I.
                        </label>
                        <input
                          type="text"
                          name="middle_initial"
                          value={formData.middle_initial}
                          onChange={handleInputChange}
                          maxLength="1"
                          className="block w-full px-3 py-2 rounded-lg border-2 border-gray-200 bg-gray-50 hover:border-gray-300 focus:border-blue-500 focus:bg-white transition-all duration-200 focus:outline-none focus:ring-0 text-center uppercase"
                          placeholder="M"
                          disabled={loading}
                        />
                      </div>

                      {/* Last Name - Takes 5 columns */}
                      <div className="col-span-12 md:col-span-5">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          name="last_name"
                          value={formData.last_name}
                          onChange={handleInputChange}
                          className={`block w-full px-3 py-2 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-0 ${
                            errors.last_name
                              ? "border-red-300 bg-red-50 focus:border-red-500"
                              : "border-gray-200 bg-gray-50 hover:border-gray-300 focus:border-blue-500 focus:bg-white"
                          }`}
                          placeholder="Enter last name"
                          disabled={loading}
                        />
                        {errors.last_name && (
                          <p className="mt-1 text-xs text-red-600 flex items-center">
                            <span className="w-4 h-4 mr-1">⚠️</span>
                            {errors.last_name}
                          </p>
                        )}
                      </div>

                      {/* Username - Takes full width on a new row */}
                      <div className="col-span-12">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Username *
                        </label>
                        <input
                          type="text"
                          name="username"
                          value={formData.username}
                          onChange={handleInputChange}
                          className={`block w-full px-3 py-2 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-0 ${
                            errors.username
                              ? "border-red-300 bg-red-50 focus:border-red-500"
                              : "border-gray-200 bg-gray-50 hover:border-gray-300 focus:border-blue-500 focus:bg-white"
                          }`}
                          placeholder="Enter username"
                          disabled={loading}
                        />
                        {errors.username && (
                          <p className="mt-1 text-xs text-red-600 flex items-center">
                            <span className="w-4 h-4 mr-1">⚠️</span>
                            {errors.username}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Account & Security Section */}
                  <div>
                    <h4 className="text-base font-semibold text-gray-900 flex items-center mb-4">
                      <div className="w-6 h-6 bg-green-100 rounded-md flex items-center justify-center mr-2">
                        <ShieldCheckIcon className="w-3 h-3 text-green-600" />
                      </div>
                      Account & Security
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Email */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className={`block w-full px-3 py-2 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-0 ${
                            errors.email
                              ? "border-red-300 bg-red-50 focus:border-red-500"
                              : "border-gray-200 bg-gray-50 hover:border-gray-300 focus:border-blue-500 focus:bg-white"
                          }`}
                          placeholder="Enter email address"
                          disabled={loading}
                        />
                        {errors.email && (
                          <p className="mt-1 text-xs text-red-600 flex items-center">
                            <span className="w-4 h-4 mr-1">⚠️</span>
                            {errors.email}
                          </p>
                        )}
                      </div>

                      {/* Role */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          User Role *
                        </label>
                        <select
                          name="role"
                          value={formData.role}
                          onChange={handleInputChange}
                          className={`block w-full px-3 py-2 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-0 appearance-none ${
                            errors.role
                              ? "border-red-300 bg-red-50 focus:border-red-500"
                              : "border-gray-200 bg-gray-50 hover:border-gray-300 focus:border-blue-500 focus:bg-white"
                          }`}
                          disabled={loading}
                        >
                          <option value="" disabled>
                            Select a role
                          </option>
                          {roles.map((role) => (
                            <option key={role.id} value={role.slug}>
                              {role.name}
                            </option>
                          ))}
                        </select>
                        {errors.role && (
                          <p className="mt-1 text-xs text-red-600 flex items-center">
                            <span className="w-4 h-4 mr-1">⚠️</span>
                            {errors.role}
                          </p>
                        )}
                      </div>

                      {/* Branch */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Branch Assignment *
                        </label>
                        <select
                          name="branch_id"
                          value={formData.branch_id}
                          onChange={handleInputChange}
                          className={`block w-full px-3 py-2 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-0 appearance-none text-gray-900 ${
                            errors.branch_id
                              ? "border-red-300 bg-red-50 focus:border-red-500"
                              : "border-gray-200 bg-gray-50 hover:border-gray-300 focus:border-blue-500 focus:bg-white"
                          }`}
                          disabled={loading}
                        >
                          <option value="" disabled className="text-gray-500">
                            {isEdit && formData.branch_id
                              ? branches.find(
                                  (b) =>
                                    String(b.value) ===
                                    String(formData.branch_id)
                                )?.branch_name || "Select a branch"
                              : "Select a branch"}
                          </option>
                          {branches.map((branch, index) => (
                            <option
                              key={branch.value || `branch-${index}`}
                              value={String(branch.value)}
                              className="text-gray-900 bg-white"
                            >
                              {branch.branch_name || `Branch ${index + 1}`}
                            </option>
                          ))}
                        </select>

                        {errors.branch_id && (
                          <p className="mt-1 text-xs text-red-600 flex items-center">
                            <span className="w-4 h-4 mr-1">⚠️</span>
                            {errors.branch_id}
                          </p>
                        )}
                      </div>

                      {/* Status */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Account Status *
                        </label>
                        <select
                          name="status"
                          value={formData.status}
                          onChange={handleInputChange}
                          className="block w-full px-3 py-2 rounded-lg border-2 border-gray-200 bg-gray-50 hover:border-gray-300 focus:border-blue-500 focus:bg-white transition-all duration-200 focus:outline-none focus:ring-0 appearance-none"
                          disabled={loading}
                        >
                          <option value="active">✓ Active</option>
                          <option value="inactive">❌ Inactive</option>
                        </select>
                      </div>
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
                            <svg
                              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Saving...
                          </>
                        ) : (
                          <>
                            <UserIcon className="w-4 h-4 mr-2" />
                            {isEdit ? "Update User" : "Create User"}
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

export default UserModal;
