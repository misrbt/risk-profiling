import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheckIcon, XMarkIcon, KeyIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';
import Swal from 'sweetalert2';

const TwoFactorSetupModal = ({ isOpen, onClose, onComplete }) => {
  const [step, setStep] = useState(1); // 1: QR Code, 2: Verify, 3: Recovery Codes
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [error, setError] = useState('');

  const handleEnable2FA = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.post('/two-factor/enable');

      if (response.data.success) {
        setQrCode(response.data.data.qr_code_svg);
        setSecret(response.data.data.secret);
        setStep(2);
      }
    } catch (error) {
      console.error('2FA Enable Error:', error);
      setError(error.response?.data?.message || 'Failed to enable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await api.post('/two-factor/confirm', {
        code: verificationCode,
      });

      if (response.data.success) {
        setRecoveryCodes(response.data.data.recovery_codes);
        setStep(3);
      }
    } catch (error) {
      console.error('2FA Verify Error:', error);
      setError(error.response?.data?.message || 'Invalid verification code');
      setVerificationCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    Swal.fire({
      icon: 'success',
      title: 'Copied!',
      text: 'Recovery code copied to clipboard',
      timer: 1500,
      showConfirmButton: false,
      customClass: {
        popup: 'rounded-2xl',
      },
    });
  };

  const handleCopyAllCodes = () => {
    const allCodes = recoveryCodes.join('\n');
    navigator.clipboard.writeText(allCodes);
    Swal.fire({
      icon: 'success',
      title: 'Copied!',
      text: 'All recovery codes copied to clipboard',
      timer: 1500,
      showConfirmButton: false,
      customClass: {
        popup: 'rounded-2xl',
      },
    });
  };

  const handlePrintCodes = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>2FA Recovery Codes</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            h1 { color: #1f2937; }
            .codes { margin-top: 20px; }
            .code {
              font-family: monospace;
              font-size: 16px;
              padding: 10px;
              background: #f3f4f6;
              margin: 5px 0;
              border-radius: 4px;
            }
            .warning {
              color: #dc2626;
              margin-top: 20px;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <h1>Two-Factor Authentication Recovery Codes</h1>
          <p>Store these codes in a safe place. Each code can only be used once.</p>
          <div class="codes">
            ${recoveryCodes.map(code => `<div class="code">${code}</div>`).join('')}
          </div>
          <p class="warning">⚠️ Keep these codes secure. Anyone with these codes can access your account.</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleComplete = () => {
    Swal.fire({
      icon: 'success',
      title: '2FA Enabled!',
      text: 'Two-factor authentication has been successfully enabled for your account.',
      confirmButtonText: 'Got it',
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700',
      },
      buttonsStyling: false,
    });
    onComplete && onComplete();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <ShieldCheckIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Enable Two-Factor Authentication</h2>
                <p className="text-sm text-blue-100">Step {step} of 3</p>
              </div>
            </div>
            {step === 3 && (
              <button
                onClick={handleComplete}
                className="text-white hover:text-blue-100 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Introduction and Enable Button */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">What is Two-Factor Authentication?</h3>
                <p className="text-sm text-blue-800">
                  Two-factor authentication (2FA) adds an extra layer of security to your account. After entering your password, you'll need to enter a 6-digit code from your authenticator app.
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
                onClick={handleEnable2FA}
                disabled={loading}
                className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Setting up...
                  </span>
                ) : (
                  'Continue to Setup'
                )}
              </button>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: QR Code and Verification */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> Scan this QR code with your authenticator app. You won't be able to see this QR code again.
                </p>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center space-y-4">
                <div
                  className="bg-white p-4 rounded-lg border-2 border-gray-200"
                  dangerouslySetInnerHTML={{ __html: qrCode }}
                />

                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Or enter this code manually:</p>
                  <div className="flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded-lg">
                    <code className="font-mono text-sm text-gray-900">{secret}</code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(secret);
                        Swal.fire({
                          icon: 'success',
                          title: 'Copied!',
                          timer: 1000,
                          showConfirmButton: false,
                        });
                      }}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <DocumentDuplicateIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Verification Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter the 6-digit code from your authenticator app
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setVerificationCode(value);
                    setError('');
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && verificationCode.length === 6) {
                      handleVerifyCode();
                    }
                  }}
                  className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                onClick={handleVerifyCode}
                disabled={loading || verificationCode.length !== 6}
                className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Verifying...' : 'Verify and Continue'}
              </button>
            </div>
          )}

          {/* Step 3: Recovery Codes */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">🎉 Two-Factor Authentication Enabled!</h3>
                <p className="text-sm text-green-800">
                  Your account is now protected with 2FA. Save these recovery codes in a secure location.
                </p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-900 mb-2 flex items-center">
                  <KeyIcon className="w-5 h-5 mr-2" />
                  Recovery Codes
                </h4>
                <p className="text-sm text-red-800 mb-3">
                  <strong>Important:</strong> Each recovery code can only be used once. Store them securely and keep them secret.
                </p>
              </div>

              {/* Recovery Codes Grid */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {recoveryCodes.map((code, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-white px-4 py-3 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors group"
                    >
                      <code className="font-mono text-sm text-gray-900">{code}</code>
                      <button
                        onClick={() => handleCopyCode(code)}
                        className="text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <DocumentDuplicateIcon className="w-4 h-4" />
                      </button>
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
                    🖨️ Print
                  </button>
                </div>
              </div>

              <button
                onClick={handleComplete}
                className="w-full px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
              >
                I've Saved My Recovery Codes
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default TwoFactorSetupModal;
