import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheckIcon,
  ClockIcon,
  KeyIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import api from "../../services/api";
import { API_ENDPOINTS } from "../../config/constants";
import sessionManager from "../../services/sessionManager";
import Swal from "sweetalert2";

const SecuritySettings = () => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    auto_logout_minutes: 10,
    session_lifetime: 120,
    token_expiration_minutes: 60,
    password_min_length: 8,
    require_password_uppercase: true,
    require_password_lowercase: true,
    require_password_numbers: true,
    require_password_symbols: true,
    password_expiration_enabled: false,
    password_expiration_months: 3,
    password_expiration_roles: ["Manager", "Audit", "Compliance", "User"],
    two_factor_enabled: false,
    two_factor_roles: ["Manager", "Audit", "Compliance", "User"],
  });
  const [errors, setErrors] = useState({});

  const logoutOptions = [
    { value: 0, label: "Never (Disable auto-logout)" },
    { value: 5, label: "5 minutes" },
    { value: 10, label: "10 minutes" },
    { value: 15, label: "15 minutes" },
    { value: 30, label: "30 minutes" },
    { value: 60, label: "1 hour" },
    { value: 120, label: "2 hours" },
  ];

  const tokenOptions = [
    { value: 0, label: "Never expire" },
    { value: 15, label: "15 minutes" },
    { value: 30, label: "30 minutes" },
    { value: 60, label: "1 hour" },
    { value: 120, label: "2 hours" },
    { value: 240, label: "4 hours" },
    { value: 480, label: "8 hours" },
    { value: 1440, label: "24 hours" },
  ];

  const sessionOptions = [
    { value: 60, label: "1 hour" },
    { value: 120, label: "2 hours" },
    { value: 240, label: "4 hours" },
    { value: 480, label: "8 hours" },
    { value: 1440, label: "24 hours" },
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get(`${API_ENDPOINTS.SYSTEM_SETTINGS_GROUP}/security`);
      if (response.data.success) {
        const settingsData = response.data.data;
        const settingsMap = {};
        settingsData.forEach((setting) => {
          settingsMap[setting.key] = setting;
        });
        setSettings(settingsMap);

        setFormData({
          auto_logout_minutes:
            parseInt(settingsMap.auto_logout_minutes?.value) || 10,
          session_lifetime:
            parseInt(settingsMap.session_lifetime?.value) || 120,
          token_expiration_minutes:
            parseInt(settingsMap.token_expiration_minutes?.value) || 60,
          password_min_length:
            parseInt(settingsMap.password_min_length?.value) || 8,
          require_password_uppercase:
            settingsMap.require_password_uppercase?.value === true ||
            settingsMap.require_password_uppercase?.value === "true",
          require_password_lowercase:
            settingsMap.require_password_lowercase?.value === true ||
            settingsMap.require_password_lowercase?.value === "true",
          require_password_numbers:
            settingsMap.require_password_numbers?.value === true ||
            settingsMap.require_password_numbers?.value === "true",
          require_password_symbols:
            settingsMap.require_password_symbols?.value === true ||
            settingsMap.require_password_symbols?.value === "true",
          password_expiration_enabled:
            settingsMap.password_expiration_enabled?.value === true ||
            settingsMap.password_expiration_enabled?.value === "true",
          password_expiration_months:
            parseInt(settingsMap.password_expiration_months?.value) || 3,
          password_expiration_roles:
            settingsMap.password_expiration_roles?.value
              ? (typeof settingsMap.password_expiration_roles.value === 'string'
                  ? JSON.parse(settingsMap.password_expiration_roles.value)
                  : settingsMap.password_expiration_roles.value)
              : ["Manager", "Audit", "Compliance", "User"],
          two_factor_enabled:
            settingsMap.two_factor_enabled?.value === true ||
            settingsMap.two_factor_enabled?.value === "true",
          two_factor_roles:
            settingsMap.two_factor_roles?.value
              ? (typeof settingsMap.two_factor_roles.value === 'string'
                  ? JSON.parse(settingsMap.two_factor_roles.value)
                  : settingsMap.two_factor_roles.value)
              : ["Manager", "Audit", "Compliance", "User"],
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      Swal.fire({
        title: "Error",
        text: "Failed to load security settings",
        icon: "error",
        customClass: {
          popup: "rounded-2xl",
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
          ? parseInt(value) || 0
          : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (formData.password_min_length < 6) {
      newErrors.password_min_length =
        "Password minimum length must be at least 6 characters";
    }

    if (formData.password_min_length > 50) {
      newErrors.password_min_length =
        "Password minimum length cannot exceed 50 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      const settingsArray = [
        {
          key: "auto_logout_minutes",
          value: formData.auto_logout_minutes,
          type: "number",
          group: "security",
          description: "Auto logout time in minutes (0 for never)",
        },
        {
          key: "session_lifetime",
          value: formData.session_lifetime,
          type: "number",
          group: "security",
          description: "Session lifetime in minutes",
        },
        {
          key: "token_expiration_minutes",
          value: formData.token_expiration_minutes,
          type: "number",
          group: "security",
          description: "API token expiration in minutes (0 for never expire)",
        },
        {
          key: "password_min_length",
          value: formData.password_min_length,
          type: "number",
          group: "security",
          description: "Minimum password length requirement",
        },
        {
          key: "require_password_uppercase",
          value: formData.require_password_uppercase,
          type: "boolean",
          group: "security",
          description: "Require uppercase letter in password",
        },
        {
          key: "require_password_lowercase",
          value: formData.require_password_lowercase,
          type: "boolean",
          group: "security",
          description: "Require lowercase letter in password",
        },
        {
          key: "require_password_numbers",
          value: formData.require_password_numbers,
          type: "boolean",
          group: "security",
          description: "Require numbers in password",
        },
        {
          key: "require_password_symbols",
          value: formData.require_password_symbols,
          type: "boolean",
          group: "security",
          description: "Require symbols in password",
        },
        {
          key: "password_expiration_enabled",
          value: formData.password_expiration_enabled,
          type: "boolean",
          group: "security",
          description: "Enable password expiration policy",
        },
        {
          key: "password_expiration_months",
          value: formData.password_expiration_months,
          type: "number",
          group: "security",
          description: "Number of months until password expires",
        },
        {
          key: "password_expiration_roles",
          value: JSON.stringify(formData.password_expiration_roles),
          type: "json",
          group: "security",
          description: "Roles affected by password expiration (Admin is always excluded)",
        },
      ];

      const response = await api.put(API_ENDPOINTS.SYSTEM_SETTINGS, {
        settings: settingsArray,
      });

      if (response.data.success) {
        Swal.fire({
          title: "Success!",
          text: "Security settings updated successfully.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
          customClass: {
            popup: "rounded-2xl",
          },
        });
        await fetchSettings();

        // Reload session manager settings to apply new auto logout timeout
        await sessionManager.reloadSettings();
      }
    } catch (error) {
      console.error("Error saving settings:", error);

      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        Swal.fire({
          title: "Error",
          text:
            error.response?.data?.message ||
            "Failed to save settings. Please try again.",
          icon: "error",
          customClass: {
            popup: "rounded-2xl",
          },
        });
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl my-12 mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Security Settings
            </h1>
            <p className="mt-2 text-gray-600">
              Configure security policies and authentication settings
            </p>
          </div>
          <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center">
            <ShieldCheckIcon className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Session & Authentication Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center mb-6">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <ClockIcon className="w-4 h-4 text-blue-600" />
              </div>
              Session & Authentication
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Auto Logout */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auto Logout Timer
                </label>
                <select
                  name="auto_logout_minutes"
                  value={formData.auto_logout_minutes}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 rounded-lg border-2 border-gray-200 bg-gray-50 hover:border-gray-300 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-0 transition-all duration-200"
                  disabled={saving}
                >
                  {logoutOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Automatically log out inactive users after this time.
                </p>
              </div>

              {/* Session Lifetime */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Lifetime
                </label>
                <select
                  name="session_lifetime"
                  value={formData.session_lifetime}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 rounded-lg border-2 border-gray-200 bg-gray-50 hover:border-gray-300 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-0 transition-all duration-200"
                  disabled={saving}
                >
                  {sessionOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Maximum session duration before requiring re-authentication.
                </p>
              </div>

              {/* Token Expiration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Token Expiration
                </label>
                <select
                  name="token_expiration_minutes"
                  value={formData.token_expiration_minutes}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 rounded-lg border-2 border-gray-200 bg-gray-50 hover:border-gray-300 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-0 transition-all duration-200"
                  disabled={saving}
                >
                  {tokenOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  How long API tokens remain valid before expiring.
                </p>
              </div>
            </div>
          </div>

          {/* Password Policy Section */}
          <div className="border-t border-gray-200 pt-8">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center mb-6">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <LockClosedIcon className="w-4 h-4 text-green-600" />
              </div>
              Password Policy
            </h2>

            <div className="space-y-6">
              {/* Password Minimum Length */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Password Length
                  </label>
                  <input
                    type="number"
                    name="password_min_length"
                    value={formData.password_min_length}
                    onChange={handleInputChange}
                    min="6"
                    max="50"
                    className={`block w-full px-3 py-2 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-0 ${
                      errors.password_min_length
                        ? "border-red-300 bg-red-50 focus:border-red-500"
                        : "border-gray-200 bg-gray-50 hover:border-gray-300 focus:border-blue-500 focus:bg-white"
                    }`}
                    disabled={saving}
                  />
                  {errors.password_min_length && (
                    <p className="mt-1 text-xs text-red-600 flex items-center">
                      <span className="w-4 h-4 mr-1">⚠️</span>
                      {errors.password_min_length}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Minimum number of characters required in passwords.
                  </p>
                </div>
              </div>

              {/* Password Requirements */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Password Requirements
                </label>
                <div className="space-y-3">
                  <label className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      name="require_password_uppercase"
                      checked={formData.require_password_uppercase}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      disabled={saving}
                    />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        Require Uppercase Letters
                      </p>
                      <p className="text-xs text-gray-500">
                        Passwords must contain at least one uppercase letter
                        (A-Z)
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      name="require_password_lowercase"
                      checked={formData.require_password_lowercase}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      disabled={saving}
                    />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        Require Lowercase Letters
                      </p>
                      <p className="text-xs text-gray-500">
                        Passwords must contain at least one lowercase letter
                        (a-z)
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      name="require_password_numbers"
                      checked={formData.require_password_numbers}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      disabled={saving}
                    />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        Require Numbers
                      </p>
                      <p className="text-xs text-gray-500">
                        Passwords must contain at least one number (0-9)
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      name="require_password_symbols"
                      checked={formData.require_password_symbols}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      disabled={saving}
                    />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        Require Symbols
                      </p>
                      <p className="text-xs text-gray-500">
                        Passwords must contain at least one special character
                        (!@#$%^&*)
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Password Expiration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Password Expiration Policy
                </label>
                <div className="space-y-4">
                  {/* Enable/Disable Toggle */}
                  <label className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      name="password_expiration_enabled"
                      checked={formData.password_expiration_enabled}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      disabled={saving}
                    />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        Enable Password Expiration
                      </p>
                      <p className="text-xs text-gray-500">
                        Require users to change their passwords periodically (Admin is always excluded)
                      </p>
                    </div>
                  </label>

                  {/* Expiration Months - Only show if enabled */}
                  {formData.password_expiration_enabled && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Password Expires After (Months)
                        </label>
                        <select
                          name="password_expiration_months"
                          value={formData.password_expiration_months}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={saving}
                        >
                          <option value="1">1 Month</option>
                          <option value="2">2 Months</option>
                          <option value="3">3 Months</option>
                          <option value="6">6 Months</option>
                          <option value="12">12 Months</option>
                        </select>
                        <p className="mt-1 text-xs text-gray-500">
                          Users will be required to change their password after this period
                        </p>
                      </div>

                      {/* Affected Roles */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Affected Roles (Admin is always excluded)
                        </label>
                        <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
                          {["Manager", "Audit", "Compliance", "User"].map((role) => (
                            <label key={role} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={formData.password_expiration_roles.includes(role)}
                                onChange={(e) => {
                                  const roles = e.target.checked
                                    ? [...formData.password_expiration_roles, role]
                                    : formData.password_expiration_roles.filter(r => r !== role);
                                  setFormData({ ...formData, password_expiration_roles: roles });
                                }}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                disabled={saving}
                              />
                              <span className="ml-2 text-sm text-gray-700">{role}</span>
                            </label>
                          ))}
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          Password expiration will only apply to selected roles
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Two-Factor Authentication */}
              <div className="border-t border-gray-200 pt-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <ShieldCheckIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <h3 className="text-lg font-medium text-gray-900">
                      Two-Factor Authentication (2FA)
                    </h3>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Two-Factor Authentication Policy
                  </label>
                  <div className="space-y-4">
                    {/* Enable/Disable Toggle */}
                    <label className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        name="two_factor_enabled"
                        checked={formData.two_factor_enabled}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        disabled={saving}
                      />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          Enable Two-Factor Authentication
                        </p>
                        <p className="text-xs text-gray-500">
                          Require users to verify identity with a second factor (Admin is always excluded)
                        </p>
                      </div>
                    </label>

                    {/* Affected Roles - Only show if enabled */}
                    {formData.two_factor_enabled && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Affected Roles (Admin is always excluded)
                        </label>
                        <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
                          {["Manager", "Audit", "Compliance", "User"].map((role) => (
                            <label key={role} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={formData.two_factor_roles.includes(role)}
                                onChange={(e) => {
                                  const roles = e.target.checked
                                    ? [...formData.two_factor_roles, role]
                                    : formData.two_factor_roles.filter(r => r !== role);
                                  setFormData({ ...formData, two_factor_roles: roles });
                                }}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                disabled={saving}
                              />
                              <span className="ml-2 text-sm text-gray-700">{role}</span>
                            </label>
                          ))}
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          Two-factor authentication will be required for selected roles
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Security Notes */}
          <div className="border-t border-gray-200 pt-8">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <KeyIcon className="h-5 w-5 text-yellow-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Security Notes
                  </h3>
                  <div className="mt-2 text-xs text-yellow-700">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>
                        Auto-logout helps protect against unauthorized access on
                        shared devices
                      </li>
                      <li>
                        Token expiration settings apply to new tokens only
                      </li>
                      <li>
                        Stronger password policies improve overall system
                        security
                      </li>
                      <li>
                        Changes take effect immediately for new user
                        registrations and password changes
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex justify-end">
              <motion.button
                type="submit"
                className="flex items-center justify-center px-6 py-2.5 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md"
                disabled={saving}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {saving ? (
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
                    <ShieldCheckIcon className="w-4 h-4 mr-2" />
                    Save Security Settings
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SecuritySettings;
