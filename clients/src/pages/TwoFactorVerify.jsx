import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthLayout } from "../layouts";
import { useAuth } from "../contexts/AuthContext";
import { useSystemSettings } from "../contexts/SystemSettingsContext";
import { getDefaultPathForUser } from "../utils/roleRedirect";
import api from "../services/api";
import Swal from "sweetalert2";
import Logo from "../assets/rbt-logo.png.png";

export default function TwoFactorVerify() {
  const navigate = useNavigate();
  const location = useLocation();
  const { completeTwoFactorLogin, isAuthenticated, user } = useAuth();
  const { systemName, systemLogo } = useSystemSettings();

  const userId = location.state?.userId;

  const [code, setCode] = useState("");
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // No pending challenge to resolve (e.g. page refresh) - back to login
  useEffect(() => {
    if (!userId) {
      navigate("/login", { replace: true });
    }
  }, [userId, navigate]);

  // Already logged in (e.g. completed verification then navigated back)
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(getDefaultPathForUser(user), { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleVerify = async (e) => {
    e.preventDefault();

    if (!code.trim()) {
      setError("Please enter a code");
      return;
    }

    if (!useRecoveryCode && code.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.post("/two-factor/verify", {
        user_id: userId,
        code: code.trim(),
      });

      if (response.data.success) {
        const remaining = response.data.data?.remaining_codes;
        if (remaining !== undefined && remaining <= 2) {
          Swal.fire({
            icon: "warning",
            title: remaining === 0 ? "Last Recovery Code Used" : "Recovery Codes Running Low",
            text:
              remaining === 0
                ? "That was your last recovery code. Regenerate new codes from your profile as soon as you're in."
                : `You have ${remaining} recovery code(s) left.`,
            customClass: { popup: "rounded-2xl" },
          });
        }

        const result = await completeTwoFactorLogin(response.data.data);
        navigate(getDefaultPathForUser(result.user), { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed");
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e) => {
    const value = useRecoveryCode
      ? e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")
      : e.target.value.replace(/\D/g, "").slice(0, 6);
    setCode(value);
    if (error) setError("");
  };

  return (
    <AuthLayout>
      <div className="max-w-md w-full space-y-3 sm:space-y-4 lg:space-y-6">
        <div className="text-center">
          <div className="mx-auto rounded-full flex items-center justify-center mb-6">
            <img
              src={
                systemLogo
                  ? systemLogo.startsWith("/")
                    ? `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"}${systemLogo}`
                    : systemLogo
                  : Logo
              }
              alt="System Logo"
              className="h-24 w-24 sm:h-32 sm:w-32 lg:h-40 lg:w-40 object-contain"
            />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mt-2 sm:mt-4 lg:mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {systemName}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Two-factor verification required
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-md border border-slate-200/60 p-3 sm:p-4 lg:p-6">
          <form className="space-y-3 sm:space-y-4" onSubmit={handleVerify}>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                {useRecoveryCode
                  ? "Enter one of your recovery codes to access your account."
                  : "Open your authenticator app and enter the 6-digit code to continue."}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-0.5">
                {useRecoveryCode ? "Recovery Code" : "Verification Code"}
              </label>
              <input
                type="text"
                value={code}
                onChange={handleCodeChange}
                className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 focus:bg-white"
                placeholder={useRecoveryCode ? "XXXXXXXXXX" : "000000"}
                maxLength={useRecoveryCode ? 10 : 6}
                autoFocus
                disabled={loading}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || !code.trim()}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Verifying...
                  </div>
                ) : (
                  "Verify"
                )}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setUseRecoveryCode(!useRecoveryCode);
                  setCode("");
                  setError("");
                }}
                disabled={loading}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {useRecoveryCode ? "Use authenticator app instead" : "Use a recovery code"}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate("/login", { replace: true })}
                disabled={loading}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                Back to login
              </button>
            </div>
          </form>
        </div>
      </div>
    </AuthLayout>
  );
}
