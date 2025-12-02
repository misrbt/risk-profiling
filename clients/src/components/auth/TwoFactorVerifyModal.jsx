import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheckIcon, KeyIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';

const TwoFactorVerifyModal = ({ userId, onVerified, onError }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);

  const handleVerify = async () => {
    if (!code.trim()) {
      setError('Please enter a code');
      return;
    }

    if (!useRecoveryCode && code.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await api.post('/two-factor/verify', {
        user_id: userId,
        code: code.trim(),
      });

      if (response.data.success) {
        // Show remaining codes warning if recovery code was used
        if (response.data.data?.remaining_codes !== undefined) {
          const remaining = response.data.data.remaining_codes;
          if (remaining === 0) {
            alert('⚠️ This was your last recovery code! Please regenerate new codes immediately after logging in.');
          } else if (remaining <= 2) {
            alert(`⚠️ Warning: You only have ${remaining} recovery code(s) left. Consider regenerating new codes.`);
          }
        }

        onVerified();
      }
    } catch (err) {
      console.error('2FA Verify Error:', err);
      const errorMessage = err.response?.data?.message || 'Verification failed';
      setError(errorMessage);
      setCode('');
      onError && onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && code.length >= 6) {
      handleVerify();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <ShieldCheckIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Two-Factor Authentication</h2>
              <p className="text-sm text-blue-100">Enter your verification code</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              {useRecoveryCode
                ? 'Enter one of your recovery codes to access your account.'
                : 'Open your authenticator app and enter the 6-digit code to continue.'}
            </p>
          </div>

          {/* Code Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {useRecoveryCode ? 'Recovery Code' : 'Verification Code'}
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => {
                const value = useRecoveryCode
                  ? e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
                  : e.target.value.replace(/\D/g, '').slice(0, 6);
                setCode(value);
                setError('');
              }}
              onKeyPress={handleKeyPress}
              className={`w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={useRecoveryCode ? 'XXXX-XXXX' : '000000'}
              maxLength={useRecoveryCode ? 10 : 6}
              autoFocus
              disabled={loading}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Verify Button */}
          <button
            onClick={handleVerify}
            disabled={loading || !code.trim() || (!useRecoveryCode && code.length !== 6)}
            className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying...
              </span>
            ) : (
              'Verify'
            )}
          </button>

          {/* Toggle Recovery Code */}
          <div className="text-center">
            <button
              onClick={() => {
                setUseRecoveryCode(!useRecoveryCode);
                setCode('');
                setError('');
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center mx-auto"
              disabled={loading}
            >
              <KeyIcon className="w-4 h-4 mr-1" />
              {useRecoveryCode ? 'Use authenticator app instead' : 'Use a recovery code'}
            </button>
          </div>

          {/* Help Text */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              {useRecoveryCode
                ? 'Recovery codes are provided when you first set up 2FA'
                : 'Lost access to your authenticator? Use a recovery code instead'}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TwoFactorVerifyModal;
