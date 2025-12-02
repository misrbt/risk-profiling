import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export function useCustomers(endpoint) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getErrorMessage = (error) => {
    if (!error.response) {
      return "Failed to fetch customer data - Server is not responding. Please check if the backend server is running.";
    }
    
    const status = error.response.status;
    const data = error.response.data;
    
    // Check if response is HTML (Laravel error page)
    if (typeof data === 'string' && data.includes('<!DOCTYPE html>')) {
      return "Failed to fetch customer data - API endpoint not found. Please check the server configuration.";
    }
    
    switch (status) {
      case 404:
        return "Failed to fetch customer data - API endpoint not found.";
      case 500:
        return "Failed to fetch customer data - Server error occurred.";
      case 403:
        return "Failed to fetch customer data - Access denied.";
      case 401:
        return "Session expired, please login again.";
      default:
        return `Failed to fetch customer data - Server returned error ${status}.`;
    }
  };

  useEffect(() => {
    let mounted = true;
    
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(endpoint, {
          timeout: 10000, // 10 second timeout
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        if (!mounted) return;
        
        // Validate response data
        const data = response.data;
        if (Array.isArray(data)) {
          setCustomers(data);
        } else if (data && Array.isArray(data.data)) {
          setCustomers(data.data);
        } else {
          setCustomers([]);
          console.warn("Unexpected response format:", data);
        }
      } catch (err) {
        if (!mounted) return;
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
        console.error("Error fetching customers:", err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchCustomers();
    
    return () => {
      mounted = false;
    };
  }, [endpoint]);

  const refetch = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(endpoint, {
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      // Validate response data
      const data = response.data;
      if (Array.isArray(data)) {
        setCustomers(data);
      } else if (data && Array.isArray(data.data)) {
        setCustomers(data.data);
      } else {
        setCustomers([]);
        console.warn("Unexpected response format:", data);
      }
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      console.error("Error fetching customers:", err);
    } finally {
      setLoading(false);
    }
  };

  return { customers, setCustomers, loading, error, refetch };
}
