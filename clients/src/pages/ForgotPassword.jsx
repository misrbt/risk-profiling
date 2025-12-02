import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui";
import { useSystemSettings } from "../contexts/SystemSettingsContext";
import rbtLogo from "../assets/rbt-logo.png.png";
import Swal from "sweetalert2";

const ForgotPassword = () => {
  const { systemLogo } = useSystemSettings();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://risk-profiling.rbtbank.com/api"
        }/auth/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setSent(true);
        Swal.fire({
          title: "Email Sent!",
          text: data.message,
          icon: "success",
          confirmButtonText: "OK",
          confirmButtonColor: "#3B82F6",
        });
      } else {
        Swal.fire({
          title: "Error",
          text: data.message || "Failed to send password reset email",
          icon: "error",
          confirmButtonText: "OK",
          confirmButtonColor: "#EF4444",
        });
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      Swal.fire({
        title: "Error",
        text: "Network error. Please try again.",
        icon: "error",
        confirmButtonText: "OK",
        confirmButtonColor: "#EF4444",
      });
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white">
                Check Your Email
              </h1>
              <p className="text-blue-100 mt-2">Password reset link sent</p>
            </div>

            {/* Content */}
            <div className="p-6 text-center">
              <p className="text-slate-600 mb-6">
                We've sent a password reset link to <strong>{email}</strong>.
                Please check your email and follow the instructions to reset
                your password.
              </p>

              <div className="space-y-4">
                <Link
                  to="/login"
                  className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  Back to Login
                </Link>

                <button
                  onClick={() => {
                    setSent(false);
                    setEmail("");
                  }}
                  className="block w-full text-blue-600 hover:text-blue-700 font-medium py-2 transition-colors"
                >
                  Try Different Email
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-xl overflow-hidden bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <img
                src={systemLogo ? (systemLogo.startsWith('/') ? `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}${systemLogo}` : systemLogo) : rbtLogo}
                alt="System Logo"
                className="w-10 h-10 object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-white">Forgot Password?</h1>
            <p className="text-blue-100 mt-2">
              Enter your email to reset password
            </p>
          </div>

          {/* Form */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-slate-700 mb-2"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter your email address"
                  required
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02]"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                    Sending...
                  </div>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </form>

            {/* Back to Login */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              <div className="text-center">
                <span className="text-slate-600">Remember your password? </span>
                <Link
                  to="/login"
                  className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-slate-500">
          <p>© 2025 BTBK. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
