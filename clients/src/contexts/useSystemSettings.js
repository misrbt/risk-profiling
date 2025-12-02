import { createContext, useContext } from 'react';

export const SystemSettingsContext = createContext();

export const useSystemSettings = () => {
  const context = useContext(SystemSettingsContext);
  if (!context) {
    throw new Error(
      'useSystemSettings must be used within a SystemSettingsProvider'
    );
  }
  return context;
};