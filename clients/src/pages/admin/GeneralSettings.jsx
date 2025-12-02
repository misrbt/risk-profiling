import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CogIcon,
  CloudIcon,
  GlobeAltIcon,
  CalendarIcon,
  PhotoIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import api from "../../services/api";
import { API_ENDPOINTS } from "../../config/constants";
import Swal from "sweetalert2";

const GeneralSettings = () => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    system_name: "",
    system_logo: "",
    timezone: "",
    date_format: "",
    time_format: "",
  });
  const [errors, setErrors] = useState({});
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoUploading, setLogoUploading] = useState(false);

  const timezones = [
    { value: "Asia/Manila", label: "Asia/Manila (UTC+8)" },
    { value: "UTC", label: "UTC (UTC+0)" },
    { value: "America/New_York", label: "America/New_York (EST)" },
    { value: "Europe/London", label: "Europe/London (GMT)" },
    { value: "Asia/Tokyo", label: "Asia/Tokyo (JST)" },
    { value: "Asia/Singapore", label: "Asia/Singapore (SGT)" },
  ];

  const dateFormats = [
    { value: "Y-m-d", label: "YYYY-MM-DD (2023-12-31)", example: "2023-12-31" },
    { value: "d/m/Y", label: "DD/MM/YYYY (31/12/2023)", example: "31/12/2023" },
    { value: "m/d/Y", label: "MM/DD/YYYY (12/31/2023)", example: "12/31/2023" },
    { value: "d-m-Y", label: "DD-MM-YYYY (31-12-2023)", example: "31-12-2023" },
    {
      value: "F j, Y",
      label: "Month DD, YYYY (December 31, 2023)",
      example: "December 31, 2023",
    },
  ];

  const timeFormats = [
    { value: "H:i:s", label: "24-hour (23:59:59)", example: "23:59:59" },
    {
      value: "h:i:s A",
      label: "12-hour (11:59:59 PM)",
      example: "11:59:59 PM",
    },
    { value: "H:i", label: "24-hour no seconds (23:59)", example: "23:59" },
    {
      value: "h:i A",
      label: "12-hour no seconds (11:59 PM)",
      example: "11:59 PM",
    },
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get(`${API_ENDPOINTS.SYSTEM_SETTINGS_GROUP}/general`);
      if (response.data.success) {
        const settingsData = response.data.data;
        const settingsMap = {};
        settingsData.forEach((setting) => {
          settingsMap[setting.key] = setting;
        });
        setSettings(settingsMap);

        setFormData({
          system_name: settingsMap.system_name?.value || "",
          system_logo: settingsMap.system_logo?.value || "",
          timezone: settingsMap.timezone?.value || "Asia/Manila",
          date_format: settingsMap.date_format?.value || "Y-m-d",
          time_format: settingsMap.time_format?.value || "H:i:s",
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      Swal.fire({
        title: "Error",
        text: "Failed to load general settings",
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
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleLogoFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/gif",
        "image/svg+xml",
      ];
      if (!validTypes.includes(file.type)) {
        Swal.fire({
          title: "Invalid File Type",
          text: "Please select a valid image file (JPEG, PNG, JPG, GIF, SVG).",
          icon: "error",
          customClass: {
            popup: "rounded-2xl",
          },
        });
        return;
      }

      // Validate file size (2MB)
      if (file.size > 2048 * 1024) {
        Swal.fire({
          title: "File Too Large",
          text: "Please select an image file smaller than 2MB.",
          icon: "error",
          customClass: {
            popup: "rounded-2xl",
          },
        });
        return;
      }

      setLogoFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = async () => {
    if (!logoFile) return;

    setLogoUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append("logo", logoFile);

    try {
      const response = await api.post(
        API_ENDPOINTS.SYSTEM_SETTINGS_UPLOAD_LOGO,
        formDataUpload,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        setFormData((prev) => ({
          ...prev,
          system_logo: response.data.data.logo_url,
        }));

        Swal.fire({
          title: "Success!",
          text: "Logo uploaded successfully.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
          customClass: {
            popup: "rounded-2xl",
          },
        });

        // Clear the file input
        setLogoFile(null);
        setLogoPreview(null);

        // Refresh settings to get the updated logo
        await fetchSettings();
      }
    } catch (error) {
      console.error("Error uploading logo:", error);
      Swal.fire({
        title: "Error",
        text:
          error.response?.data?.message ||
          "Failed to upload logo. Please try again.",
        icon: "error",
        customClass: {
          popup: "rounded-2xl",
        },
      });
    } finally {
      setLogoUploading(false);
    }
  };

  const handleLogoDelete = async () => {
    const result = await Swal.fire({
      title: "Delete Logo",
      text: "Are you sure you want to delete the current logo?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "rounded-2xl",
      },
    });

    if (result.isConfirmed) {
      try {
        const response = await api.delete(API_ENDPOINTS.SYSTEM_SETTINGS_DELETE_LOGO);

        if (response.data.success) {
          setFormData((prev) => ({
            ...prev,
            system_logo: "",
          }));

          Swal.fire({
            title: "Deleted!",
            text: "Logo deleted successfully.",
            icon: "success",
            timer: 2000,
            showConfirmButton: false,
            customClass: {
              popup: "rounded-2xl",
            },
          });

          await fetchSettings();
        }
      } catch (error) {
        console.error("Error deleting logo:", error);
        Swal.fire({
          title: "Error",
          text:
            error.response?.data?.message ||
            "Failed to delete logo. Please try again.",
          icon: "error",
          customClass: {
            popup: "rounded-2xl",
          },
        });
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.system_name.trim()) {
      newErrors.system_name = "System name is required";
    }

    if (!formData.timezone) {
      newErrors.timezone = "Timezone is required";
    }

    if (!formData.date_format) {
      newErrors.date_format = "Date format is required";
    }

    if (!formData.time_format) {
      newErrors.time_format = "Time format is required";
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
          key: "system_name",
          value: formData.system_name,
          type: "string",
          group: "general",
          description: "The name of the system displayed in the interface",
        },
        {
          key: "system_logo",
          value: formData.system_logo || null,
          type: "string",
          group: "general",
          description: "URL or path to the system logo",
        },
        {
          key: "timezone",
          value: formData.timezone,
          type: "string",
          group: "general",
          description: "Default system timezone",
        },
        {
          key: "date_format",
          value: formData.date_format,
          type: "string",
          group: "general",
          description: "Default date format for display",
        },
        {
          key: "time_format",
          value: formData.time_format,
          type: "string",
          group: "general",
          description: "Default time format for display",
        },
      ];

      const response = await api.put(API_ENDPOINTS.SYSTEM_SETTINGS, {
        settings: settingsArray,
      });

      if (response.data.success) {
        Swal.fire({
          title: "Success!",
          text: "General settings updated successfully.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
          customClass: {
            popup: "rounded-2xl",
          },
        });
        await fetchSettings();
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
    <div className="w-full my-11 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              General Settings
            </h1>
            <p className="mt-2 text-gray-600">
              Configure basic system settings and preferences
            </p>
          </div>
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
            <CogIcon className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* System Identity Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center mb-6">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <CloudIcon className="w-4 h-4 text-blue-600" />
              </div>
              System Identity
            </h2>

            <div className="space-y-6">
              {/* System Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  System Name *
                </label>
                <input
                  type="text"
                  name="system_name"
                  value={formData.system_name}
                  onChange={handleInputChange}
                  className={`block w-full px-3 py-2 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-0 ${
                    errors.system_name
                      ? "border-red-300 bg-red-50 focus:border-red-500"
                      : "border-gray-200 bg-gray-50 hover:border-gray-300 focus:border-blue-500 focus:bg-white"
                  }`}
                  placeholder="Enter system name"
                  disabled={saving}
                />
                {errors.system_name && (
                  <p className="mt-1 text-xs text-red-600 flex items-center">
                    <span className="w-4 h-4 mr-1">⚠️</span>
                    {errors.system_name}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  This name will be displayed in the application header and
                  browser title.
                </p>
              </div>

              {/* System Logo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  System Logo
                </label>

                {/* Current Logo Display */}
                {formData.system_logo && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <img
                          src={
                            formData.system_logo.startsWith("/")
                              ? `${
                                  import.meta.env.VITE_API_BASE_URL ||
                                  "http://localhost:8000"
                                }${formData.system_logo}`
                              : formData.system_logo
                          }
                          alt="Current Logo"
                          className="w-16 h-16 object-contain rounded-lg bg-white border border-gray-200"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Current Logo
                          </p>
                          <p className="text-xs text-gray-500">
                            Click delete to remove
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleLogoDelete}
                        className="flex items-center px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <TrashIcon className="w-4 h-4 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                )}

                {/* File Upload Area */}
                <div className="space-y-3">
                  {/* File Preview */}
                  {logoPreview && (
                    <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <img
                            src={logoPreview}
                            alt="Logo Preview"
                            className="w-16 h-16 object-contain rounded-lg bg-white border border-gray-200"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              New Logo Preview
                            </p>
                            <p className="text-xs text-gray-500">
                              {logoFile?.name}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleLogoUpload}
                          disabled={logoUploading}
                          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {logoUploading ? (
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
                              Uploading...
                            </>
                          ) : (
                            "Upload Logo"
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* File Input */}
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-gray-400 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <PhotoIcon className="w-8 h-8 mb-3 text-gray-400" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span>{" "}
                          or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, GIF, SVG up to 2MB
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleLogoFileChange}
                        disabled={saving || logoUploading}
                      />
                    </label>
                  </div>
                </div>

                <p className="mt-2 text-xs text-gray-500">
                  Upload a logo image for your system. Recommended size:
                  400x400px or larger.
                </p>
              </div>
            </div>
          </div>

          {/* Localization Section */}
          <div className="border-t border-gray-200 pt-8">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center mb-6">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <GlobeAltIcon className="w-4 h-4 text-green-600" />
              </div>
              Localization
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Timezone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timezone *
                </label>
                <select
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleInputChange}
                  className={`block w-full px-3 py-2 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-0 ${
                    errors.timezone
                      ? "border-red-300 bg-red-50 focus:border-red-500"
                      : "border-gray-200 bg-gray-50 hover:border-gray-300 focus:border-blue-500 focus:bg-white"
                  }`}
                  disabled={saving}
                >
                  <option value="">Select timezone</option>
                  {timezones.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
                {errors.timezone && (
                  <p className="mt-1 text-xs text-red-600">{errors.timezone}</p>
                )}
              </div>

              {/* Date Format */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Format *
                </label>
                <select
                  name="date_format"
                  value={formData.date_format}
                  onChange={handleInputChange}
                  className={`block w-full px-3 py-2 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-0 ${
                    errors.date_format
                      ? "border-red-300 bg-red-50 focus:border-red-500"
                      : "border-gray-200 bg-gray-50 hover:border-gray-300 focus:border-blue-500 focus:bg-white"
                  }`}
                  disabled={saving}
                >
                  <option value="">Select date format</option>
                  {dateFormats.map((format) => (
                    <option key={format.value} value={format.value}>
                      {format.label}
                    </option>
                  ))}
                </select>
                {errors.date_format && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.date_format}
                  </p>
                )}
              </div>

              {/* Time Format */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Format *
                </label>
                <select
                  name="time_format"
                  value={formData.time_format}
                  onChange={handleInputChange}
                  className={`block w-full px-3 py-2 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-0 ${
                    errors.time_format
                      ? "border-red-300 bg-red-50 focus:border-red-500"
                      : "border-gray-200 bg-gray-50 hover:border-gray-300 focus:border-blue-500 focus:bg-white"
                  }`}
                  disabled={saving}
                >
                  <option value="">Select time format</option>
                  {timeFormats.map((format) => (
                    <option key={format.value} value={format.value}>
                      {format.label}
                    </option>
                  ))}
                </select>
                {errors.time_format && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.time_format}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex justify-end">
              <motion.button
                type="submit"
                className="flex items-center justify-center px-6 py-2.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md"
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
                    <CogIcon className="w-4 h-4 mr-2" />
                    Save Settings
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

export default GeneralSettings;
