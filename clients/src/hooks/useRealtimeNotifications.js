import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import websocketService from '../services/websocketService';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/constants';

/**
 * Hook for managing real-time edit request notifications
 * @returns {Object} Notification state and functions
 */
export const useRealtimeNotifications = () => {
  const { user, hasRole } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const channelRef = useRef(null);
  const initialized = useRef(false);

  // Fetch initial pending requests
  const fetchInitialRequests = useCallback(async () => {
    if (!hasRole('manager') && !hasRole('admin')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(API_ENDPOINTS.MANAGER_PENDING_REQUESTS, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      if (response.data.success && response.data.data) {
        const newCount = response.data.data.length;
        const currentCount = pendingRequests.length;

        console.log(`📊 Pending requests: ${currentCount} → ${newCount}`);

        if (newCount > currentCount) {
          console.log('✅ NEW REQUEST DETECTED! Updating list...');
        }

        setPendingRequests(response.data.data);
        setHasUnreadNotifications(response.data.data.length > 0);
      }
    } catch (error) {
      console.error('❌ Error fetching pending requests:', error);
    }
  }, [hasRole, pendingRequests.length]);

  // Initialize notification system (WebSocket with polling fallback)
  const initializeConnection = useCallback(() => {
    if (!user || initialized.current) {
      return;
    }

    // Only initialize for managers and admins
    if (!hasRole('manager') && !hasRole('admin')) {
      console.log('Notifications not needed for current user role');
      return;
    }

    console.log('Initializing notification system for user:', user.email);

    // Try WebSocket first, fallback to polling if it fails
    try {
      const echo = websocketService.getEcho();
      if (echo) {
        console.log('Attempting WebSocket connection...');
        setConnectionStatus('connecting');
        initialized.current = true;

        // Fetch initial requests
        fetchInitialRequests();

        // Subscribe to edit-requests channel for managers
        const editRequestsChannel = echo.channel('edit-requests');

        editRequestsChannel
          .listen('edit-request.created', (data) => {
            console.log('New edit request received via WebSocket:', data);
            setPendingRequests(prev => {
              const exists = prev.some(req => req.id === data.data.id);
              if (exists) return prev;
              const newRequests = [...prev, data.data];
              setHasUnreadNotifications(true);
              if (Notification.permission === 'granted') {
                new Notification('New Edit Request', {
                  body: `${data.data.user_name} wants to edit ${data.data.customer_name}`,
                  icon: '/favicon.ico'
                });
              }
              return newRequests;
            });
          })
          .listen('edit-request.updated', (data) => {
            console.log('Edit request updated via WebSocket:', data);
            setPendingRequests(prev => {
              if (data.data.status === 'approved' || data.data.status === 'disapproved') {
                return prev.filter(req => req.id !== data.data.id);
              }
              return prev.map(req =>
                req.id === data.data.id ? { ...req, ...data.data } : req
              );
            });
          });

        // Set up connection status tracking
        websocketService.onConnected(() => {
          console.log('WebSocket connected - real-time notifications active');
          setIsConnected(true);
          setConnectionStatus('connected');
        });

        websocketService.onDisconnected(() => {
          console.log('WebSocket disconnected - falling back to polling');
          fallbackToPolling();
        });

        // Store channel references for cleanup
        channelRef.current = { editRequestsChannel, type: 'websocket' };

      } else {
        throw new Error('WebSocket service not available');
      }
    } catch (error) {
      console.log('WebSocket failed, using polling fallback:', error.message);
      fallbackToPolling();
    }

    // Fallback polling function
    function fallbackToPolling() {
      console.log('🔄 Starting polling mode with 2-second intervals for edit requests');
      setConnectionStatus('polling');
      setIsConnected(true);
      initialized.current = true;

      // Fetch immediately
      console.log('📡 Fetching initial edit requests...');
      fetchInitialRequests();

      // Then poll every 2 seconds
      const pollingInterval = setInterval(() => {
        console.log('📡 Polling for new edit requests...');
        fetchInitialRequests();
      }, 2000);

      channelRef.current = { pollingInterval, type: 'polling' };
    }

  }, [user, hasRole, fetchInitialRequests]);

  // Mark notifications as read
  const markAsRead = useCallback(() => {
    setHasUnreadNotifications(false);
  }, []);

  // Remove a specific request from the list
  const removePendingRequest = useCallback((requestId) => {
    setPendingRequests(prev => prev.filter(req => req.id !== requestId));
  }, []);

  // Cleanup on unmount or user change
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        if (channelRef.current.type === 'websocket') {
          // Leave WebSocket channels
          if (channelRef.current.editRequestsChannel) {
            websocketService.leaveChannel('edit-requests');
          }
        } else if (channelRef.current.type === 'polling') {
          // Clear polling interval
          if (channelRef.current.pollingInterval) {
            clearInterval(channelRef.current.pollingInterval);
          }
        }
        channelRef.current = null;
      }
      if (initialized.current) {
        initialized.current = false;
      }
    };
  }, [user]);

  // Initialize connection when user changes
  useEffect(() => {
    if (user && (hasRole('manager') || hasRole('admin'))) {
      initializeConnection();
      // Also fetch initial requests immediately for managers
      fetchInitialRequests();
    } else {
      // Cleanup if user doesn't have required role
      if (channelRef.current) {
        if (channelRef.current.type === 'websocket') {
          // Leave WebSocket channels
          if (channelRef.current.editRequestsChannel) {
            websocketService.leaveChannel('edit-requests');
          }
        } else if (channelRef.current.type === 'polling') {
          // Clear polling interval
          if (channelRef.current.pollingInterval) {
            clearInterval(channelRef.current.pollingInterval);
          }
        }
        channelRef.current = null;
      }
      if (initialized.current) {
        initialized.current = false;
      }
      setPendingRequests([]);
      setHasUnreadNotifications(false);
      setIsConnected(false);
      setConnectionStatus('disconnected');
    }
  }, [user, hasRole, initializeConnection, fetchInitialRequests]);

  // Request browser notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  }, []);

  return {
    // Connection state
    isConnected,
    connectionStatus,

    // Notification data
    pendingRequests,
    hasUnreadNotifications,

    // Actions
    markAsRead,
    removePendingRequest,
    requestNotificationPermission,

    // WebSocket service for manual operations
    websocketService,
  };
};