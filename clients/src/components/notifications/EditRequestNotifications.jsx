import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { API_ENDPOINTS } from "../../config/constants";
import { useAuth } from "../../contexts/AuthContext";
import { successAlert, errorAlert } from "../../utils/sweetAlertConfig";
import { useRealtimeNotifications } from "../../hooks/useRealtimeNotifications";

const EditRequestNotifications = () => {
  const { hasRole } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  // Use real-time notifications hook
  const {
    isConnected,
    connectionStatus,
    pendingRequests,
    hasUnreadNotifications,
    markAsRead,
    removePendingRequest,
  } = useRealtimeNotifications();

  // Only show for managers
  if (!hasRole('manager')) {
    return null;
  }

  // Fallback API call for when WebSocket is not connected
  const fetchPendingRequests = async () => {
    setLoading(true);
    const token = localStorage.getItem("authToken");

    try {
      const response = await axios.get(API_ENDPOINTS.MANAGER_PENDING_REQUESTS, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      // This is now just for fallback - real-time hook manages the state
      console.log("Fallback API call result:", response.data);
    } catch (error) {
      console.error("Error fetching pending requests:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fallback polling when WebSocket is not connected
  useEffect(() => {
    if (!isConnected) {
      fetchPendingRequests();
      const interval = setInterval(fetchPendingRequests, 30000);
      return () => clearInterval(interval);
    }
  }, [isConnected]);

  // Reset unread state when dropdown opens
  useEffect(() => {
    if (isOpen && pendingRequests.length > 0) {
      markAsRead();
    }
  }, [isOpen, pendingRequests.length, markAsRead]);

  const handleAction = async (requestId, action, notes = '') => {
    setActionLoading(requestId);
    const token = localStorage.getItem("authToken");

    try {
      const response = await axios.put(
        API_ENDPOINTS.MANAGER_UPDATE_REQUEST_STATUS(requestId),
        {
          status: action,
          manager_notes: notes || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      if (response.data.success) {
        successAlert(
          action === 'approved' ? 'Request Approved' : 'Request Disapproved',
          response.data.message
        );

        // Remove the request from the local list (WebSocket will also handle this)
        removePendingRequest(requestId);
      }
    } catch (error) {
      console.error("Error updating request status:", error);
      errorAlert(
        "Action Failed",
        error.response?.data?.message || "Failed to update request status."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleQuickAction = (requestId, action) => {
    handleAction(requestId, action);
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          // Mark notifications as read when opening the dropdown
          if (!isOpen && pendingRequests.length > 0) {
            markAsRead();
          }
        }}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full transition-colors"
        title="Edit Requests"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-5 5v-5z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9zM13.73 21a2 2 0 01-3.46 0"
          />
        </svg>

        {/* Badge */}
        {pendingRequests.length > 0 && hasUnreadNotifications && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {pendingRequests.length > 99 ? '99+' : pendingRequests.length}
          </span>
        )}

        {/* Connection Status Indicator */}
        <span
          className={`absolute -bottom-1 -right-1 w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-400' : 'bg-yellow-400'
          }`}
          title={`Real-time ${isConnected ? 'connected' : 'disconnected'} (${connectionStatus})`}
        ></span>

      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
          >
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Edit Requests
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        isConnected
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full mr-1 ${
                          isConnected ? 'bg-green-400' : 'bg-yellow-400'
                        }`}
                      ></span>
                      {isConnected ? 'Real-time' : 'Polling'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <p className="text-sm text-gray-600 mt-2">Loading requests...</p>
                </div>
              ) : pendingRequests.length === 0 ? (
                <div className="p-6 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No pending requests</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    All edit requests have been handled.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <svg
                                  className="h-4 w-4 text-blue-600"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                  />
                                </svg>
                              </div>
                            </div>
                            <div className="ml-3 flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {request.user_name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {request.user_email}
                              </p>
                              <p className="text-sm text-gray-700 mt-1">
                                Wants to edit: <span className="font-medium">{request.customer_name}</span>
                              </p>
                              {request.reason && (
                                <p className="text-xs text-gray-600 mt-1 italic">
                                  "{request.reason}"
                                </p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                {request.created_at}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-3 flex space-x-2">
                        <button
                          onClick={() => handleQuickAction(request.id, 'approved')}
                          disabled={actionLoading === request.id}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium py-2 px-3 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading === request.id ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                              Processing...
                            </div>
                          ) : (
                            'Approve'
                          )}
                        </button>
                        <button
                          onClick={() => handleQuickAction(request.id, 'disapproved')}
                          disabled={actionLoading === request.id}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium py-2 px-3 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading === request.id ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                              Processing...
                            </div>
                          ) : (
                            'Disapprove'
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay to close dropdown when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default EditRequestNotifications;