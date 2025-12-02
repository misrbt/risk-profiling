import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import PasswordExpiredModal from './PasswordExpiredModal';

const PasswordExpiredWrapper = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const [showPasswordExpiredModal, setShowPasswordExpiredModal] = useState(false);

  useEffect(() => {
    // Check if password is expired whenever user state changes
    if (!loading && isAuthenticated && user) {
      const passwordExpired = localStorage.getItem('password_expired') === 'true';

      console.log('PasswordExpiredWrapper: Checking password expiration', {
        isAuthenticated,
        user: user?.email,
        passwordExpired,
        localStorage_value: localStorage.getItem('password_expired')
      });

      if (passwordExpired) {
        setShowPasswordExpiredModal(true);
      }
    }
  }, [user, isAuthenticated, loading]);

  const handlePasswordChanged = () => {
    console.log('PasswordExpiredWrapper: Password changed successfully');
    // Clear the expired flag
    localStorage.removeItem('password_expired');
    localStorage.removeItem('days_until_password_expires');
    setShowPasswordExpiredModal(false);
  };

  if (loading) {
    return children;
  }

  return (
    <>
      {children}
      {showPasswordExpiredModal && (
        <PasswordExpiredModal onPasswordChanged={handlePasswordChanged} />
      )}
    </>
  );
};

export default PasswordExpiredWrapper;
