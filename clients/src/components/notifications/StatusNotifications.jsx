import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";
import websocketService from "../../services/websocketService";

const StatusNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user) return;

    // Initialize WebSocket connection
    const echo = websocketService.initialize();
    if (!echo) return;

    // Subscribe to user's private channel for status notifications
    const channel = websocketService.subscribeToPrivateChannel(`user.${user.id}`, {
      'edit-request.status-notification': handleStatusNotification,
    });

    return () => {
      if (channel) {
        websocketService.leaveChannel(`user.${user.id}`);
      }
    };
  }, [user]);

  const handleStatusNotification = (data) => {
    console.log('Status notification received:', data);

    const notification = {
      id: Date.now(),
      status: data.status,
      message: data.message,
      data: data.data,
      timestamp: data.timestamp || new Date().toISOString(),
      isRead: false,
    };

    // Add notification to list
    setNotifications(prev => [notification, ...prev]);

    // Show browser notification if permission granted
    if (Notification.permission === 'granted') {
      new Notification(
        data.status === 'approved' ? 'Edit Request Approved! ✅' : 'Edit Request Disapproved ❌',
        {
          body: data.message,
          icon: '/favicon.ico',
        }
      );
    }

    // Auto-remove notification after 10 seconds
    setTimeout(() => {
      removeNotification(notification.id);
    }, 10000);
  };

  const removeNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className="pointer-events-auto"
          >
            <div
              className={`max-w-sm w-full bg-white shadow-lg rounded-lg border-l-4 ${
                notification.status === 'approved'
                  ? 'border-green-500'
                  : 'border-red-500'
              } pointer-events-auto`}
            >
              <div className="p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {notification.status === 'approved' ? (
                      <svg
                        className="h-6 w-6 text-green-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-6 w-6 text-red-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3 w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {notification.status === 'approved' ? 'Request Approved!' : 'Request Disapproved'}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {notification.message}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {new Date(notification.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0 flex">
                    <button
                      className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      onClick={() => removeNotification(notification.id)}
                    >
                      <span className="sr-only">Close</span>
                      <svg
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default StatusNotifications;