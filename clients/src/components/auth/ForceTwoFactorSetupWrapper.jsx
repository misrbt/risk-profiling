import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ForceTwoFactorSetupWrapper = ({ children }) => {
  const { twoFactorSetupRequired } = useAuth();
  const location = useLocation();

  if (twoFactorSetupRequired && location.pathname !== '/two-factor-setup') {
    return <Navigate to="/two-factor-setup" replace />;
  }

  return children;
};

export default ForceTwoFactorSetupWrapper;
