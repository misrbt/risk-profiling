import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";
import { API_ENDPOINTS } from "../config/constants";
import { useAuth } from "./AuthContext";

const SystemSettingsContext = createContext();

export const useSystemSettings = () => {
  const context = useContext(SystemSettingsContext);
  if (!context) {
    throw new Error(
      "useSystemSettings must be used within a SystemSettingsProvider"
    );
  }
  return context;
};

export const SystemSettingsProvider = ({ children }) => {
  const { user, hasRole } = useAuth();
  const [settings, setSettings] = useState({
    system_name: "Risk Profiling System", // Default fallback
    company_name: "RBT Bank Inc.",
    system_logo: null,
    timezone: "Asia/Manila",
    date_format: "Y-m-d",
    time_format: "H:i:s",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);

      // Only try to fetch settings if user exists and has admin role
      if (!user || !hasRole('admin')) {
        console.log('User does not have admin role or user not loaded, using default settings');
        setLoading(false);
        return;
      }

      const response = await api.get(`${API_ENDPOINTS.SYSTEM_SETTINGS_GROUP}/general`);
      if (response.data.success && response.data.data) {
        // Transform the settings array to an object
        const settingsObject = {};
        response.data.data.forEach((setting) => {
          settingsObject[setting.key] = setting.value;
        });
        setSettings((prev) => ({ ...prev, ...settingsObject }));
      }
    } catch (error) {
      console.error("Error fetching system settings:", error);
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const refreshSettings = () => {
    fetchSettings();
  };

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user, hasRole]);

  const contextValue = {
    settings,
    loading,
    error,
    updateSetting,
    refreshSettings,
    // Convenient getters
    systemName: settings.system_name || "Risk Profiling System",
    companyName: settings.company_name || "RBT Bank Inc.",
    systemLogo: settings.system_logo,
  };

  return (
    <SystemSettingsContext.Provider value={contextValue}>
      {children}
    </SystemSettingsContext.Provider>
  );
};

export default SystemSettingsContext;
