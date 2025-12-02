import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ForcePasswordChangeModal from '../Modals/ForcePasswordChangeModal';

const ForcePasswordChangeWrapper = ({ children }) => {
  const { passwordChangeRequired, logout, setPasswordChangeRequired } = useAuth();
  const navigate = useNavigate();

  const handlePasswordChanged = async () => {
    // Password was changed successfully, user stays logged in
    // Clear the password change requirement flag
    setPasswordChangeRequired(false);

    // No need to logout - the user can continue using the system
    // Navigate to dashboard or home page
    navigate("/dashboard");
  };

  return (
    <>
      {children}
      <ForcePasswordChangeModal
        isOpen={passwordChangeRequired}
        onPasswordChanged={handlePasswordChanged}
        onClose={() => {}} // Cannot be closed - user must change password
      />
    </>
  );
};

export default ForcePasswordChangeWrapper;