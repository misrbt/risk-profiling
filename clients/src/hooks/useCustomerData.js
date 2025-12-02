import { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { API_ENDPOINTS } from '../config/constants';
import { useAuth } from '../contexts/AuthContext';
import websocketService from '../services/websocketService';

export const useCustomerData = () => {
  const { user, isAuthenticated } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetchAttempts, setFetchAttempts] = useState(0);

  // Determine the correct endpoint based on user role
  const getCustomerEndpoint = () => {
    if (user?.roles?.some(role => role.slug === 'admin')) {
      return API_ENDPOINTS.CUSTOMERS_INDEX; // admin/customers
    } else if (user?.roles?.some(role => role.slug === 'compliance')) {
      return API_ENDPOINTS.COMPLIANCE_CUSTOMERS; // compliance/customers
    } else if (user?.roles?.some(role => role.slug === 'audit')) {
      return API_ENDPOINTS.AUDIT_CUSTOMERS_LIST; // audit/customers-list
    } else if (user?.roles?.some(role => role.slug === 'manager')) {
      return API_ENDPOINTS.MANAGER_CUSTOMERS_LIST; // manager/customers-list
    } else {
      return API_ENDPOINTS.CUSTOMERS_LIST; // user/customers-list
    }
  };

  const fetchCustomers = async () => {
    // Prevent infinite fetch attempts
    if (fetchAttempts >= 3) {
      setError("Too many failed attempts. Please refresh the page or login again.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setFetchAttempts(prev => prev + 1);

    const endpoint = getCustomerEndpoint();
    console.log('Fetching customers from endpoint:', endpoint);

    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const res = await api.get(endpoint, {
        signal: controller.signal,
        timeout: 10000
      });

      clearTimeout(timeoutId);

      if (res.data && Array.isArray(res.data)) {
        setCustomers(res.data);
      } else {
        console.error("Invalid customer data format:", res.data);
        setError("Invalid data format received from server");
        setCustomers([]);
      }
    } catch (err) {
      console.error("Failed to fetch customers:", err);
      console.error("Error response:", err.response?.data);
      console.error("Error status:", err.response?.status);

      let errorMessage;
      if (err.response?.status === 401) {
        errorMessage = "Your session has expired. Please login again.";
      } else if (err.response?.status === 403) {
        errorMessage = "You don't have permission to view customer data.";
      } else if (err.response?.status === 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (err.code === 'ECONNABORTED' || err.message === 'Network Error') {
        errorMessage = "Failed to connect to backend API: Connection Failed. Please try again.";
      } else {
        errorMessage = err.response?.data?.message || err.message || "Unknown error occurred";
      }

      setError(errorMessage);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if authenticated and user data is available
    if (isAuthenticated && user && user.roles && user.roles.length > 0) {
      console.log('User authenticated with roles:', user.roles.map(r => r.slug));
      fetchCustomers();
    } else if (isAuthenticated && !user) {
      console.warn('User is authenticated but user data is missing');
      setError("User data is missing. Please logout and login again.");
      setLoading(false);
    } else if (!isAuthenticated) {
      console.log('User not authenticated, skipping customer fetch');
      setLoading(false);
    }
  }, [isAuthenticated, user?.id]); // Only depend on authentication status and user ID to prevent infinite loops

  // Polling for edit approval updates (checking every 3 seconds)
  useEffect(() => {
    if (!user || !user.id) return;

    console.log('📡 Starting auto-refresh polling for edit approvals (3-second intervals)...');

    let lastApprovedCount = 0;

    // Function to check for approval changes
    const checkForApprovals = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        // Check user's own edit requests
        const response = await api.get('user/edit-requests/my-requests', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success && response.data.data) {
          // Count currently approved and not expired requests
          const approvedRequests = response.data.data.filter(req =>
            req.status === 'approved' && !req.has_expired
          );

          const currentApprovedCount = approvedRequests.length;

          // If approved count increased, refresh customer list
          if (currentApprovedCount > lastApprovedCount) {
            console.log(`✅ New approval detected! (${lastApprovedCount} → ${currentApprovedCount})`);
            console.log('🔄 Auto-refreshing customer list to show edit button...');

            // Small delay to ensure backend processed everything
            setTimeout(() => {
              fetchCustomers();
            }, 500);
          }

          lastApprovedCount = currentApprovedCount;
        }
      } catch (error) {
        // Silently handle errors - don't spam console
        if (error.response?.status !== 401) {
          console.error('Polling error:', error.message);
        }
      }
    };

    // Start polling every 3 seconds
    const pollingInterval = setInterval(checkForApprovals, 3000);

    // Cleanup on unmount
    return () => {
      console.log('🛑 Stopping edit approval polling');
      clearInterval(pollingInterval);
    };
  }, [user?.id]);

  return { customers, loading, error, refetch: fetchCustomers };
};

export const useCustomerFilters = (customers, isComplianceOfficer) => {
  const [filters, setFilters] = useState({
    dateFrom: "", dateTo: "", riskLevel: "", search: "", branchId: "",
  });

  const filteredCustomers = useMemo(() => {
    let filtered = [...customers];

    if (filters.search) {
      filtered = filtered.filter((customer) =>
        customer.name.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.riskLevel) {
      filtered = filtered.filter((customer) => customer.riskLevel === filters.riskLevel);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter((customer) => customer.date_created >= filters.dateFrom);
    }

    if (filters.dateTo) {
      filtered = filtered.filter((customer) => customer.date_created <= filters.dateTo);
    }

    if (filters.branchId && isComplianceOfficer) {
      filtered = filtered.filter((customer) => {
        const customerBranchId = customer.branch_id;
        const selectedBranchId = parseInt(filters.branchId);
        return customerBranchId === selectedBranchId;
      });
    }

    return filtered;
  }, [customers, filters, isComplianceOfficer]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({ dateFrom: "", dateTo: "", riskLevel: "", search: "", branchId: "" });
  };

  return { filteredCustomers, filters, handleFilterChange, handleClearFilters };
};