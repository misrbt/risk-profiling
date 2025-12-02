import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from './ui';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  UserGroupIcon,
  SignalIcon,
  ClockIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

const OnlineUsers = () => {
  const { isAuthenticated } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [stats, setStats] = useState({ total_online: 0, total_recently_active: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    fetchOnlineUsers();

    // Poll every 10 seconds for updates
    const interval = setInterval(fetchOnlineUsers, 10000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const fetchOnlineUsers = async () => {
    try {
      const response = await api.get('online-users');

      console.log('Online users response:', response.data);

      if (response.data.success) {
        setOnlineUsers(response.data.data.users);
        setStats({
          total_online: response.data.data.total_online,
          total_recently_active: response.data.data.total_recently_active,
        });
        setError(null);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching online users:', err);
      console.error('Error response:', err.response);
      setError('Failed to load online users: ' + (err.response?.data?.message || err.message));
      setLoading(false);
    }
  };

  const getRoleColor = (roles) => {
    if (roles.includes('Admin')) return 'bg-red-100 text-red-800 border-red-200';
    if (roles.includes('Manager')) return 'bg-purple-100 text-purple-800 border-purple-200';
    if (roles.includes('Compliance')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (roles.includes('Audit')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getRoleBadge = (roles) => {
    if (roles.includes('Admin')) return 'Admin';
    if (roles.includes('Manager')) return 'Manager';
    if (roles.includes('Compliance')) return 'Compliance';
    if (roles.includes('Audit')) return 'Audit';
    return 'User';
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading online users...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-red-600">{error}</div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <SignalIcon className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">Online Users</h2>
              <p className="text-green-100 text-sm">Real-time user activity tracking</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{stats.total_online}</div>
            <div className="text-green-100 text-sm">Active Now</div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 p-6 bg-gray-50">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-full">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.total_online}</div>
              <div className="text-sm text-gray-600">Online (Last 2 min)</div>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <ClockIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.total_recently_active}</div>
              <div className="text-sm text-gray-600">Recently Active</div>
            </div>
          </div>
        </div>
      </div>

      {/* User List */}
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <UserGroupIcon className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Active Users</h3>
        </div>

        {onlineUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <UserCircleIcon className="w-16 h-16 mx-auto mb-3 text-gray-300" />
            <p>No users currently online</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {onlineUsers.map((user) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-4">
                    {/* Status Indicator */}
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                        {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </div>
                      {user.is_online && (
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full animate-pulse"></div>
                      )}
                    </div>

                    {/* User Info */}
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-semibold text-gray-900">{user.name}</p>
                        {user.is_online && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                            Online
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        <ClockIcon className="w-3 h-3 inline mr-1" />
                        {user.last_seen_human}
                      </p>
                    </div>
                  </div>

                  {/* Role Badge */}
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRoleColor(user.roles)}`}>
                      {getRoleBadge(user.roles)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Auto-refresh indicator */}
      <div className="px-6 pb-4 text-center text-xs text-gray-400">
        <div className="flex items-center justify-center space-x-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span>Auto-refreshing every 10 seconds</span>
        </div>
      </div>
    </Card>
  );
};

export default OnlineUsers;
