import { useState, useEffect } from 'react';
import api from '../services/api';

/**
 * Hook to check if the application is in maintenance mode
 * @param {number} checkInterval - Interval in milliseconds to check maintenance status (default: 60000 = 1 minute)
 * @returns {Object} - { isMaintenanceMode: boolean, isLoading: boolean, checkMaintenanceStatus: function }
 */
const useMaintenanceMode = (checkInterval = 60000) => {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkMaintenanceStatus = async () => {
    try {
      const response = await api.get('/maintenance/status');
      setIsMaintenanceMode(response.data.maintenance_mode || false);
      setIsLoading(false);
      return response.data.maintenance_mode;
    } catch (error) {
      // If we get a 503 error, it means the app is in maintenance mode
      if (error.response && error.response.status === 503) {
        setIsMaintenanceMode(true);
        setIsLoading(false);
        return true;
      }

      // For other errors, assume the app is accessible
      setIsMaintenanceMode(false);
      setIsLoading(false);
      return false;
    }
  };

  useEffect(() => {
    // Check immediately on mount
    checkMaintenanceStatus();

    // Set up interval to check periodically
    const intervalId = setInterval(() => {
      checkMaintenanceStatus();
    }, checkInterval);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [checkInterval]);

  return {
    isMaintenanceMode,
    isLoading,
    checkMaintenanceStatus,
  };
};

export default useMaintenanceMode;
