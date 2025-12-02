import React, { useState, useEffect } from "react";
import api from "../services/api";
import { SystemSettingsContext } from "./useSystemSettings";
import { API_ENDPOINTS } from "../config/constants";

const SystemSettingsProvider = ({ children }) => {
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
    fetchSettings();
  }, []);

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

export default SystemSettingsProvider;
