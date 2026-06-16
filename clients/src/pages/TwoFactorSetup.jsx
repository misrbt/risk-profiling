import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheckIcon, KeyIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline";
import { AuthLayout } from "../layouts";
import { useAuth } from "../contexts/AuthContext";
import { useSystemSettings } from "../contexts/SystemSettingsContext";
import { getDefaultPathForUser } from "../utils/roleRedirect";
import api from "../services/api";
import Swal from "sweetalert2";
import Logo from "../assets/rbt-logo.png.png";

export default function TwoFactorSetup() {
  const navigate = useNavigate();
  const { user, isAuthenticated, twoFactorSetupRequired, setTwoFactorSetupRequired } = useAuth();
  const { systemName, systemLogo } = useSystemSettings();

  const [step, setStep] = useState(1); // 1: intro, 2: scan + verify, 3: recovery codes
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [secret, setSecret] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [error, setError] = useState("");

  // Nothing to set up, or not logged in - send elsewhere
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
    } else if (!twoFactorSetupRequired) {
      navigate(getDefaultPathForUser(user), { replace: true });
    }
  }, [isAuthenticated, twoFactorSetupRequired, user, navigate]);

  const handleEnable = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.post("/two-factor/enable");
      if (response.data.success) {
        setQrCode(response.data.data.qr_code_svg);
        setSecret(response.data.data.secret);
        setStep(2);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to start two-factor setup");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await api.post("/two-factor/confirm", { code: verificationCode });
      if (response.data.success) {
        setRecoveryCodes(response.data.data.recovery_codes);
        setStep(3);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid verification code");
      setVerificationCode("");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAllCodes = () => {
    navigator.clipboard.writeText(recoveryCodes.join("\n"));
    Swal.fire({
      icon: "success",
      title: "Copied!",
      timer: 1200,
      showConfirmButton: false,
      customClass: { popup: "rounded-2xl" },
    });
  };

  const handlePrintCodes = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>2FA Recovery Codes</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            .code { font-family: monospace; font-size: 16px; padding: 10px; background: #f3f4f6; margin: 5px 0; border-radius: 4px; }
            .warning { color: #dc2626; margin-top: 20px; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Two-Factor Authentication Recovery Codes</h1>
          <p>Store these codes in a safe place. Each code can only be used once.</p>
          ${recoveryCodes.map((code) => `<div class="code">${code}</div>`).join("")}
          <p class="warning">Keep these codes secure. Anyone with these codes can access your account.</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleFinish = () => {
    setTwoFactorSetupRequired(false);
    navigate(getDefaultPathForUser(user), { replace: true });
  };

  return (
    <AuthLayout>
      <div className="max-w-xl w-full space-y-3 sm:space-y-4 lg:space-y-6">
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
            Two-factor authentication setup required - Step {step} of 3
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-md border border-slate-200/60 p-4 sm:p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Your role requires two-factor authentication</h3>
                <p className="text-sm text-blue-800">
                  After entering your password, you'll need to enter a 6-digit code from your authenticator app. This is a one-time setup.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Before you start:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                  <li>Install an authenticator app on your mobile device (Google Authenticator, Authy, Microsoft Authenticator, etc.)</li>
                  <li>Keep your phone handy to scan the QR code</li>
                  <li>Save your recovery codes in a secure location</li>
                </ol>
              </div>

              <button
                onClick={handleEnable}
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? "Setting up..." : "Continue to Setup"}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> Scan this QR code with your authenticator app. You won't be able to see this QR code again.
                </p>
              </div>

              <div className="flex flex-col items-center space-y-4">
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200" dangerouslySetInnerHTML={{ __html: qrCode }} />
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Or enter this code manually:</p>
                  <div className="flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded-lg">
                    <code className="font-mono text-sm text-gray-900">{secret}</code>
                    <button onClick={() => navigator.clipboard.writeText(secret)} className="text-blue-600 hover:text-blue-700">
                      <DocumentDuplicateIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter the 6-digit code from your authenticator app
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => {
                    setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                    setError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && verificationCode.length === 6) handleVerify();
                  }}
                  className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 focus:bg-white"
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                />
              </div>

              <button
                onClick={handleVerify}
                disabled={loading || verificationCode.length !== 6}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? "Verifying..." : "Verify and Continue"}
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">Two-Factor Authentication Enabled</h3>
                <p className="text-sm text-green-800">
                  Your account is now protected with 2FA. Save these recovery codes in a secure location.
                </p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-900 mb-2 flex items-center">
                  <KeyIcon className="w-5 h-5 mr-2" />
                  Recovery Codes
                </h4>
                <p className="text-sm text-red-800">
                  Each recovery code can only be used once. Store them securely and keep them secret.
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {recoveryCodes.map((code, index) => (
                    <div key={index} className="flex items-center justify-between bg-white px-4 py-3 rounded-lg border border-gray-200">
                      <code className="font-mono text-sm text-gray-900">{code}</code>
                    </div>
                  ))}
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleCopyAllCodes}
                    className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    <DocumentDuplicateIcon className="w-4 h-4 inline mr-2" />
                    Copy All
                  </button>
                  <button
                    onClick={handlePrintCodes}
                    className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    Print
                  </button>
                </div>
              </div>

              <button
                onClick={handleFinish}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-all duration-200"
              >
                <ShieldCheckIcon className="w-4 h-4 mr-2" />
                I've Saved My Recovery Codes
              </button>
            </div>
          )}
        </div>
      </div>
    </AuthLayout>
  );
}
