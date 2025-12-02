import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

/**
 * Hook to track user activity and send heartbeat to server
 * Updates user's last_seen_at timestamp every 30 seconds
 */
export const useActivityHeartbeat = () => {
  const { user, isAuthenticated } = useAuth();
  const intervalRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  // Track user activity
  useEffect(() => {
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    // Track various user interactions
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keypress', updateActivity);
    window.addEventListener('click', updateActivity);
    window.addEventListener('scroll', updateActivity);
    window.addEventListener('touchstart', updateActivity);

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keypress', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('scroll', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
    };
  }, []);

  // Send heartbeat to server
  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    console.log('🫀 Activity heartbeat started for user:', user.email);

    // Send heartbeat immediately
    sendHeartbeat();

    // Then send every 30 seconds if user is active
    intervalRef.current = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;
      const isActive = timeSinceLastActivity < 60000; // Active in last 60 seconds

      if (isActive) {
        sendHeartbeat();
      } else {
        console.log('⏸️ User inactive, skipping heartbeat');
      }
    }, 30000); // Every 30 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        console.log('🛑 Activity heartbeat stopped');
      }
    };
  }, [isAuthenticated, user]);

  const sendHeartbeat = async () => {
    try {
      await api.post('online-users/heartbeat');
      console.log('💓 Heartbeat sent');
    } catch (error) {
      // Silent fail - don't spam console
      if (error.response?.status !== 401) {
        console.error('Heartbeat error:', error.message);
      }
    }
  };

  return null;
};
