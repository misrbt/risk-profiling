import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  EyeIcon,
  EyeSlashIcon,
  KeyIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import api from "../../services/api";
import Swal from "sweetalert2";

const ForcePasswordChangeModal = ({ isOpen, onPasswordChanged }) => {
  const [formData, setFormData] = useState({
    current_password: "",
    password: "",
    password_confirmation: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        current_password: "",
        password: "",
        password_confirmation: "",
      });
      setErrors({});
      setPasswordStrength(0);
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    }
  }, [isOpen]);

  const checkPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "password") {
      setPasswordStrength(checkPasswordStrength(value));
    }

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const getStrengthColor = () => {
    if (passwordStrength <= 2) return "bg-red-500";
    if (passwordStrength <= 3) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStrengthText = () => {
    if (passwordStrength <= 2) return "Weak";
    if (passwordStrength <= 3) return "Medium";
    return "Strong";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const response = await api.put("/auth/change-password", formData);

      if (response.data.success) {
        await Swal.fire({
          title: "Password Changed Successfully!",
          text: "Your password has been updated. You can now continue using the system.",
          icon: "success",
          timer: 3000,
          showConfirmButton: false,
          customClass: {
            popup: "rounded-2xl",
          },
        });

        onPasswordChanged();
      }
    } catch (error) {
      console.error("Password change error:", error);

      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        Swal.fire({
          title: "Error",
          text:
            error.response?.data?.message ||
            "Failed to change password. Please try again.",
          icon: "error",
          customClass: {
            popup: "rounded-2xl",
          },
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop - Cannot be dismissed */}
      <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md mx-4"
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4 rounded-t-2xl">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <ExclamationTriangleIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Password Change Required
                </h3>
                <p className="text-orange-100 text-sm">
                  You must update your temporary password
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-3">
                <ShieldCheckIcon className="w-5 h-5 text-orange-600 mt-0.5" />
                <div className="text-sm text-orange-800">
                  <p className="font-medium mb-1">Security Notice</p>
                  <p>
                    You are currently using a temporary password. For your
                    security, you must create a new password before continuing.
                  </p>
                </div>
              </div>
            </div>

            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Password *
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  name="current_password"
                  value={formData.current_password}
                  onChange={handleInputChange}
                  className={`block w-full pr-10 px-3 py-2 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-0 ${
                    errors.current_password
                      ? "border-red-300 bg-red-50 focus:border-red-500"
                      : "border-gray-200 bg-gray-50 hover:border-gray-300 focus:border-blue-500 focus:bg-white"
                  }`}
                  placeholder="Enter your temporary password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.current_password && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.current_password[0]}
                </p>
              )}
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password *
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`block w-full pr-10 px-3 py-2 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-0 ${
                    errors.password
                      ? "border-red-300 bg-red-50 focus:border-red-500"
                      : "border-gray-200 bg-gray-50 hover:border-gray-300 focus:border-blue-500 focus:bg-white"
                  }`}
                  placeholder="Enter your new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor()}`}
                        style={{ width: `${(passwordStrength / 5) * 100}%` }}
                      />
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        passwordStrength <= 2
                          ? "text-red-600"
                          : passwordStrength <= 3
                          ? "text-yellow-600"
                          : "text-green-600"
                      }`}
                    >
                      {getStrengthText()}
                    </span>
                  </div>
                </div>
              )}

              {errors.password && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.password[0]}
                </p>
              )}

              <p className="mt-1 text-xs text-gray-500">
                Password must be at least 8 characters with uppercase,
                lowercase, number, and special character.
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="password_confirmation"
                  value={formData.password_confirmation}
                  onChange={handleInputChange}
                  className={`block w-full pr-10 px-3 py-2 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-0 ${
                    errors.password_confirmation
                      ? "border-red-300 bg-red-50 focus:border-red-500"
                      : "border-gray-200 bg-gray-50 hover:border-gray-300 focus:border-blue-500 focus:bg-white"
                  }`}
                  placeholder="Confirm your new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password_confirmation && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.password_confirmation[0]}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <motion.button
                type="submit"
                disabled={loading || passwordStrength < 3}
                className={`w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium text-white transition-all duration-200 ${
                  loading || passwordStrength < 3
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg"
                }`}
                whileHover={
                  loading || passwordStrength < 3 ? {} : { scale: 1.02 }
                }
                whileTap={
                  loading || passwordStrength < 3 ? {} : { scale: 0.98 }
                }
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
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
                    Changing Password...
                  </>
                ) : (
                  <>
                    <KeyIcon className="w-5 h-5 mr-2" />
                    Change Password
                  </>
                )}
              </motion.button>
            </div>

            <div className="pt-2 text-center">
              <p className="text-xs text-gray-500">
                This action cannot be cancelled. You must change your password
                to continue.
              </p>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default ForcePasswordChangeModal;
