import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardContent } from "../components/ui";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import axios from "axios";
import {
  API_ENDPOINTS,
  API_BASE_URL,
  RISK_LEVELS,
  RISK_COLORS,
} from "../config/constants";
import {
  FiUsers,
  FiTrendingUp,
  FiBarChart,
  FiFilter,
  FiMapPin,
  FiCalendar,
} from "react-icons/fi";
import { usePermissions } from "../hooks/usePermissions";
import PermissionGate from "../components/auth/PermissionGate";
import { PERMISSIONS } from "../config/permissions";

export default function Dashboard() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    totalCustomers: 0,
    riskStats: { low: 0, moderate: 0, high: 0 },
    recentCustomers: [],
    additionalStats: { todayCount: 0, thisWeekCount: 0, thisMonthCount: 0 },
  });
  const [branchStats, setBranchStats] = useState([]);
  const [analyticsData, setAnalyticsData] = useState({
    daily: [],
    weekly: [],
    monthly: [],
  });
  const [activeTab, setActiveTab] = useState("today");
  const [analyticsTab, setAnalyticsTab] = useState("daily");
  const [branchViewTab, setBranchViewTab] = useState("table"); // 'table' or 'cards'
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState({});
  const [userRole, setUserRole] = useState(
    localStorage.getItem("userRole") || ""
  );
  const [userBranch, setUserBranch] = useState(() => {
    const branchName =
      localStorage.getItem("userBranchName") ||
      localStorage.getItem("branchName") ||
      localStorage.getItem("userBranch") ||
      "";
  });

  // Helper function to navigate to customer list with filters
  const navigateToCustomerList = (riskLevel = null) => {
    const baseRoute = '/customers';
    if (riskLevel) {
      // Pass risk level as URL parameter for filtering
      navigate(`${baseRoute}?risk=${riskLevel}`);
    } else {
      // Navigate to all customers
      navigate(baseRoute);
    }
  };

  useEffect(() => {
    console.log("Dashboard useEffect - userRole:", userRole);
    fetchUserProfile();
    fetchDashboardData();
    if (
      userRole === "compliance" ||
      userRole === "manager" ||
      userRole === "users" ||
      !userRole
    ) {
      console.log("✅ Fetching branch stats and analytics for role:", userRole);
      fetchBranchStats();
      fetchAnalyticsData();
    } else {
      console.log("❌ Not fetching branch stats for role:", userRole);
    }
  }, [userRole]);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const response = await axios.get(API_ENDPOINTS.PROFILE, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      const userData = response.data;
      setUser(userData); // Store full user data

      // Update user role if available - check actual API structure
      if (
        userData.data &&
        userData.data.roles &&
        userData.data.roles.length > 0
      ) {
        const role = userData.data.roles[0].name.toLowerCase(); // Convert to lowercase
        setUserRole(role);
        localStorage.setItem("userRole", role);
      } else if (userData.roles && userData.roles.length > 0) {
        const role = userData.roles[0].name.toLowerCase();
        setUserRole(role);
        localStorage.setItem("userRole", role);
      } else if (userData.role) {
        setUserRole(userData.role.toLowerCase());
        localStorage.setItem("userRole", userData.role.toLowerCase());
      } else if (
        userData.user &&
        userData.user.roles &&
        userData.user.roles.length > 0
      ) {
        const role = userData.user.roles[0].name.toLowerCase();
        setUserRole(role);
        localStorage.setItem("userRole", role);
      } else if (userData.user && userData.user.role) {
        setUserRole(userData.user.role.toLowerCase());
        localStorage.setItem("userRole", userData.user.role.toLowerCase());
      }

      // Update branch information if available
      if (userData.branch && userData.branch.name) {
        setUserBranch(userData.branch.name);
        localStorage.setItem("userBranchName", userData.branch.name);
        localStorage.setItem("userBranchId", userData.branch.id);
      } else if (userData.branch_name) {
        setUserBranch(userData.branch_name);
        localStorage.setItem("userBranchName", userData.branch_name);
      } else if (userData.user && userData.user.branch) {
        setUserBranch(userData.user.branch.name || userData.user.branch);
        localStorage.setItem(
          "userBranchName",
          userData.user.branch.name || userData.user.branch
        );
        if (userData.user.branch.id) {
          localStorage.setItem("userBranchId", userData.user.branch.id);
        }
      } else {
        console.log("No branch information found in profile data");
        // Clear any invalid branch data
        setUserBranch("");
        localStorage.removeItem("userBranchName");
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
      // Don't show error to user for profile fetch as it's background info
    }
  };

  const fetchBranchStats = async () => {
    console.log("🔄 fetchBranchStats called");
    try {
      const token = localStorage.getItem("authToken");
      console.log("Token exists:", !!token);
      const response = await axios.get(
        `${API_BASE_URL}/${API_ENDPOINTS.DASHBOARD_BRANCH_STATS}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
      console.log("✅ fetchBranchStats response:", response.data);
      console.log(
        "✅ Response data type:",
        typeof response.data,
        "Is array:",
        Array.isArray(response.data)
      );

      // Ensure we always work with an array
      const dataArray = Array.isArray(response.data)
        ? response.data
        : Object.values(response.data);
      console.log(
        "✅ Converted to array:",
        dataArray,
        "Length:",
        dataArray.length
      );
      setBranchStats(dataArray);
    } catch (err) {
      console.log("❌ fetchBranchStats error:", err);
      console.error("Error fetching branch stats:", err);
    }
  };

  const fetchAnalyticsData = async () => {
    console.log("🔄 fetchAnalyticsData called");
    try {
      setAnalyticsLoading(true);
      const token = localStorage.getItem("authToken");
      const response = await axios.get(
        `${API_BASE_URL}/${API_ENDPOINTS.DASHBOARD_ANALYTICS}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
      console.log("✅ fetchAnalyticsData response:", response.data);
      setAnalyticsData(response.data);
    } catch (err) {
      console.log("❌ fetchAnalyticsData error:", err);
      console.error("Error fetching analytics data:", err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      const userBranchId =
        localStorage.getItem("userBranchId") ||
        localStorage.getItem("branchId") ||
        localStorage.getItem("userBranch");

      // Build query parameters for branch filtering
      const params = new URLSearchParams();
      if (userBranchId && userRole !== "compliance") {
        params.append("branch_id", userBranchId);
      } else if (userRole === "compliance") {
        console.log("Compliance user - fetching ALL branch data");
      } else {
        console.log("No branch filtering applied");
      }

      const url = `${API_ENDPOINTS.DASHBOARD}${
        params.toString() ? "?" + params.toString() : ""
      }`;
      console.log("Dashboard API URL:", url);

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      setDashboardData(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case "LOW RISK":
        return "bg-green-100 text-green-800";
      case "MODERATE RISK":
        return "bg-yellow-100 text-yellow-800";
      case "HIGH RISK":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">{error}</div>
          <button
            onClick={fetchDashboardData}
            className="mt-2 text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const { totalCustomers, riskStats, recentCustomers, additionalStats } =
    dashboardData;

  // Check if user has compliance role
  const isComplianceUser = () => {
    // Get role from localStorage as fallback
    const storedRole = localStorage.getItem("userRole");

    // Check userRole state (lowercase)
    if (userRole === "compliance") {
      return true;
    }

    // Check localStorage (lowercase)
    if (storedRole === "compliance") {
      return true;
    }

    // Check user.data.roles array (actual API structure)
    if (
      user &&
      user.data &&
      user.data.roles &&
      user.data.roles.some(
        (role) => role.name && role.name.toLowerCase() === "compliance"
      )
    ) {
      return true;
    }

    // Check user.roles array (fallback)
    if (
      user &&
      user.roles &&
      user.roles.some(
        (role) => role.name && role.name.toLowerCase() === "compliance"
      )
    ) {
      return true;
    }

    // Check nested user.user.roles structure
    if (
      user &&
      user.user &&
      user.user.roles &&
      user.user.roles.some(
        (role) => role.name && role.name.toLowerCase() === "compliance"
      )
    ) {
      return true;
    }

    // Check if user has a direct role property
    if (user && user.role && user.role.toLowerCase() === "compliance") {
      return true;
    }

    // Check if user.data has a direct role property
    if (
      user &&
      user.data &&
      user.data.role &&
      user.data.role.toLowerCase() === "compliance"
    ) {
      return true;
    }

    return false;
  };

  // Chart colors
  const CHART_COLORS = ["#10B981", "#F59E0B", "#EF4444", "#6366F1", "#8B5CF6"];
  const PIE_COLORS = {
    "Low Risk": "#10B981",
    "Moderate Risk": "#F59E0B",
    "High Risk": "#EF4444",
  };

  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              Dashboard
            </h1>
            <p className="text-slate-600">
              Welcome to RBT Bank Client Risk Management System
            </p>
          </div>
          {(userRole === "compliance" ||
            userRole === "manager" ||
            !userRole) && (
            <div className="hidden lg:flex items-center space-x-3 bg-slate-50 px-4 py-2 rounded-full">
              <div className="flex items-center space-x-1 text-xs text-slate-500">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>Overview</span>
              </div>
              <div className="w-px h-4 bg-slate-300"></div>
              <div className="flex items-center space-x-1 text-xs text-slate-500">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>Analysis</span>
              </div>
              <div className="w-px h-4 bg-slate-300"></div>
              <div className="flex items-center space-x-1 text-xs text-slate-500">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                <span>Performance</span>
              </div>
              <div className="w-px h-4 bg-slate-300"></div>
              <div className="flex items-center space-x-1 text-xs text-slate-500">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                <span>Analytics</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section 1: Key Performance Indicators */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-3">
          <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">1</span>
          </div>
          Key Performance Indicators
        </h2>
        <p className="text-slate-600 text-sm mb-3">
          Overall client risk statistics at a glance
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-blue-100 text-sm font-medium">
                  Total Clients
                </p>
                <p className="text-2xl font-bold">{totalCustomers}</p>
              </div>
              <div className="p-3 bg-green bg-opacity-20 rounded-full">
                <FiUsers className="h-6 w-6" />
              </div>
            </div>
            <button
              onClick={() => navigateToCustomerList()}
              className="group inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-blue-100 hover:text-white text-xs font-medium rounded-md transition-all duration-200 backdrop-blur-sm border border-white/20 hover:border-white/30"
            >
              <span>View Details</span>
              <svg className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-green-100 text-sm font-medium">Low Risk</p>
                <p className="text-2xl font-bold">{riskStats.low}</p>
              </div>
              <div className="p-3 bg-green bg-opacity-20 rounded-full">
                <FiTrendingUp className="h-6 w-6" />
              </div>
            </div>
            <button
              onClick={() => navigateToCustomerList('low')}
              className="group inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-green-100 hover:text-white text-xs font-medium rounded-md transition-all duration-200 backdrop-blur-sm border border-white/20 hover:border-white/30"
            >
              <span>View Details</span>
              <svg className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-yellow-100 text-sm font-medium">
                  Moderate Risk
                </p>
                <p className="text-2xl font-bold">{riskStats.moderate}</p>
              </div>
              <div className="p-3 bg-green bg-opacity-20 rounded-full">
                <FiBarChart className="h-6 w-6" />
              </div>
            </div>
            <button
              onClick={() => navigateToCustomerList('moderate')}
              className="group inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-yellow-100 hover:text-white text-xs font-medium rounded-md transition-all duration-200 backdrop-blur-sm border border-white/20 hover:border-white/30"
            >
              <span>View Details</span>
              <svg className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-red-100 text-sm font-medium">High Risk</p>
                <p className="text-2xl font-bold">{riskStats.high}</p>
              </div>
              <div className="p-3 bg-green bg-opacity-20 rounded-full">
                <FiFilter className="h-6 w-6" />
              </div>
            </div>
            <button
              onClick={() => navigateToCustomerList('high')}
              className="group inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-red-100 hover:text-white text-xs font-medium rounded-md transition-all duration-200 backdrop-blur-sm border border-white/20 hover:border-white/30"
            >
              <span>View Details</span>
              <svg className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Section 2: Risk Analysis Overview */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-3">
          <div className="w-6 h-6 bg-green-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">2</span>
          </div>
          Risk Analysis Overview
        </h2>
        <p className="text-slate-600 text-sm mb-3">
          Current risk distribution and recent assessment activity
        </p>
        <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent mb-3"></div>
      </div>
      <div
        className={`grid gap-6 mb-8 ${
          isComplianceUser() ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
        }`}
      >
        {/* Risk Distribution Analysis - Compliance Only */}
        {isComplianceUser() && (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <FiBarChart className="h-5 w-5" />
                Bank-wide Risk Distribution
              </h3>
            </CardHeader>
            <CardContent>
              {/* Enhanced Progress Bars */}
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-green-700">
                        Low Risk
                      </span>
                    </div>
                    <span className="text-lg font-bold text-green-600">
                      {riskStats.low}
                    </span>
                  </div>
                  <div className="w-full bg-green-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${
                          totalCustomers > 0
                            ? (riskStats.low / totalCustomers) * 100
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-green-600 mt-1 font-medium">
                    {totalCustomers > 0
                      ? Math.round((riskStats.low / totalCustomers) * 100)
                      : 0}
                    % of total customers
                  </p>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm font-medium text-yellow-700">
                        Moderate Risk
                      </span>
                    </div>
                    <span className="text-lg font-bold text-yellow-600">
                      {riskStats.moderate}
                    </span>
                  </div>
                  <div className="w-full bg-yellow-200 rounded-full h-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${
                          totalCustomers > 0
                            ? (riskStats.moderate / totalCustomers) * 100
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-yellow-600 mt-1 font-medium">
                    {totalCustomers > 0
                      ? Math.round((riskStats.moderate / totalCustomers) * 100)
                      : 0}
                    % of total customers
                  </p>
                </div>

                <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm font-medium text-red-700">
                        High Risk
                      </span>
                    </div>
                    <span className="text-lg font-bold text-red-600">
                      {riskStats.high}
                    </span>
                  </div>
                  <div className="w-full bg-red-200 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${
                          totalCustomers > 0
                            ? (riskStats.high / totalCustomers) * 100
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-red-600 mt-1 font-medium">
                    {totalCustomers > 0
                      ? Math.round((riskStats.high / totalCustomers) * 100)
                      : 0}
                    % of total customers
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Assessment Activity */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <FiUsers className="h-5 w-5" />
              Recent Assessments
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentCustomers.length > 0 ? (
                recentCustomers.slice(0, 5).map((customer) => (
                  <div
                    key={customer.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-all duration-200 border border-transparent hover:border-slate-200 hover:shadow-sm"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shadow-sm">
                        <span className="text-white text-sm font-semibold">
                          {customer.initials ||
                            customer.name?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-800 text-sm mb-1">
                          {customer.name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <span className="text-slate-400">•</span>
                          <span>{customer.time_ago}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${getRiskColor(
                          customer.riskLevel
                        )} shadow-sm`}
                      >
                        {customer.riskLevel?.replace(" RISK", "") || "N/A"}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <FiUsers className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                  <p className="text-lg font-medium mb-2">
                    No recent assessments
                  </p>
                  <p className="text-sm">
                    Recent customer assessments will appear here
                  </p>
                </div>
              )}
            </div>

            {/* Summary Footer */}
            {recentCustomers.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="flex justify-between items-center text-sm text-slate-600">
                  <span>
                    Showing latest {Math.min(recentCustomers.length, 10)}{" "}
                    assessments
                  </span>
                  <span className="font-medium">
                    {totalCustomers} total customers
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Section 3: Branch Performance Management */}
      {(userRole === "compliance" || userRole === "manager" || !userRole) && (
        <>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-3">
              <div className="w-6 h-6 bg-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">3</span>
              </div>
              Branch Performance Overview
            </h2>
            <p className="text-slate-600 text-sm mb-3">
              Comprehensive view of branch-wise risk assessment performance
            </p>
            <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent mb-3"></div>
          </div>
          {/* Branch Assessment Summary - Combined View with Tabs */}
          {branchStats.length > 0 && (
            <div className="mb-8">
              <Card className="w-full max-w-none">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h3 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                      <FiMapPin className="h-6 w-6" />
                      Branch Assessment Overview
                    </h3>
                    <div className="flex bg-slate-100 rounded-lg p-1">
                      <button
                        onClick={() => setBranchViewTab("table")}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                          branchViewTab === "table"
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Table View
                      </button>
                      <button
                        onClick={() => setBranchViewTab("cards")}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                          branchViewTab === "cards"
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Card View
                      </button>
                      <button
                        onClick={() => setBranchViewTab("chart")}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                          branchViewTab === "chart"
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Chart View
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {branchViewTab === "table" ? (
                    <>
                      {/* Table View */}
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-slate-200">
                              <th className="text-left py-3 px-4 font-semibold text-slate-700">
                                Branch Name
                              </th>
                              <th className="text-center py-3 px-4 font-semibold text-slate-700">
                                Total Assessments
                              </th>
                              <th className="text-center py-3 px-4 font-semibold text-green-700">
                                Low Risk
                              </th>
                              <th className="text-center py-3 px-4 font-semibold text-yellow-700">
                                Moderate Risk
                              </th>
                              <th className="text-center py-3 px-4 font-semibold text-red-700">
                                High Risk
                              </th>
                              <th className="text-left py-3 px-4 font-semibold text-slate-700">
                                Risk Distribution
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {branchStats.map((branch, index) => {
                              const totalAssessments =
                                (branch.low_risk || 0) +
                                (branch.moderate_risk || 0) +
                                (branch.high_risk || 0);
                              return (
                                <tr
                                  key={branch.id || branch.branch_name}
                                  className={`${
                                    index % 2 === 0 ? "bg-slate-50" : "bg-white"
                                  } hover:bg-slate-100 transition-colors`}
                                >
                                  <td className="py-3 px-4 font-medium text-slate-800">
                                    {branch.branch_name}
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full text-sm font-bold">
                                      {totalAssessments}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <span className="inline-flex items-center justify-center w-8 h-8 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                                      {branch.low_risk || 0}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <span className="inline-flex items-center justify-center w-8 h-8 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
                                      {branch.moderate_risk || 0}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <span className="inline-flex items-center justify-center w-8 h-8 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                                      {branch.high_risk || 0}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="flex w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                      {totalAssessments > 0 && (
                                        <>
                                          <div
                                            className="bg-green-500"
                                            style={{
                                              width: `${
                                                ((branch.low_risk || 0) /
                                                  totalAssessments) *
                                                100
                                              }%`,
                                            }}
                                          />
                                          <div
                                            className="bg-yellow-500"
                                            style={{
                                              width: `${
                                                ((branch.moderate_risk || 0) /
                                                  totalAssessments) *
                                                100
                                              }%`,
                                            }}
                                          />
                                          <div
                                            className="bg-red-500"
                                            style={{
                                              width: `${
                                                ((branch.high_risk || 0) /
                                                  totalAssessments) *
                                                100
                                              }%`,
                                            }}
                                          />
                                        </>
                                      )}
                                    </div>
                                    {totalAssessments > 0 && (
                                      <div className="text-xs text-slate-500 mt-1">
                                        {Math.round(
                                          ((branch.low_risk || 0) /
                                            totalAssessments) *
                                            100
                                        )}
                                        % •{" "}
                                        {Math.round(
                                          ((branch.moderate_risk || 0) /
                                            totalAssessments) *
                                            100
                                        )}
                                        % •{" "}
                                        {Math.round(
                                          ((branch.high_risk || 0) /
                                            totalAssessments) *
                                            100
                                        )}
                                        %
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Summary Footer */}
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <div className="flex justify-between items-center text-sm text-slate-600">
                          <span>
                            Total Branches:{" "}
                            <span className="font-semibold">
                              {branchStats.length}
                            </span>
                          </span>
                          <span>
                            Total Assessments:{" "}
                            <span className="font-semibold">
                              {branchStats.reduce(
                                (sum, branch) =>
                                  sum +
                                  (branch.low_risk || 0) +
                                  (branch.moderate_risk || 0) +
                                  (branch.high_risk || 0),
                                0
                              )}
                            </span>
                          </span>
                        </div>
                      </div>
                    </>
                  ) : branchViewTab === "cards" ? (
                    <>
                      {/* Card View */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {branchStats.map((branch) => {
                          const totalAssessments =
                            (branch.low_risk || 0) +
                            (branch.moderate_risk || 0) +
                            (branch.high_risk || 0);
                          return (
                            <Card
                              key={branch.id || branch.branch_name}
                              className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow"
                            >
                              <CardContent className="p-4">
                                <div className="mb-4">
                                  <h4 className="font-semibold text-slate-800 text-sm mb-1 truncate">
                                    {branch.branch_name}
                                  </h4>
                                  <div className="flex items-center gap-2 text-2xl font-bold text-blue-600">
                                    <span>{totalAssessments}</span>
                                    <span className="text-sm font-normal text-slate-500">
                                      total
                                    </span>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-green-600 font-medium">
                                      Low Risk
                                    </span>
                                    <span className="font-semibold">
                                      {branch.low_risk || 0}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-yellow-600 font-medium">
                                      Moderate Risk
                                    </span>
                                    <span className="font-semibold">
                                      {branch.moderate_risk || 0}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-red-600 font-medium">
                                      High Risk
                                    </span>
                                    <span className="font-semibold">
                                      {branch.high_risk || 0}
                                    </span>
                                  </div>
                                </div>
                                {/* Progress Bar */}
                                <div className="mt-4 space-y-1">
                                  <div className="flex w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                    {totalAssessments > 0 && (
                                      <>
                                        <div
                                          className="bg-green-500"
                                          style={{
                                            width: `${
                                              ((branch.low_risk || 0) /
                                                totalAssessments) *
                                              100
                                            }%`,
                                          }}
                                        />
                                        <div
                                          className="bg-yellow-500"
                                          style={{
                                            width: `${
                                              ((branch.moderate_risk || 0) /
                                                totalAssessments) *
                                              100
                                            }%`,
                                          }}
                                        />
                                        <div
                                          className="bg-red-500"
                                          style={{
                                            width: `${
                                              ((branch.high_risk || 0) /
                                                totalAssessments) *
                                              100
                                            }%`,
                                          }}
                                        />
                                      </>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>

                      {/* Summary Footer for Cards */}
                      <div className="mt-6 pt-4 border-t border-slate-200">
                        <div className="flex justify-between items-center text-sm text-slate-600">
                          <span>
                            Total Branches:{" "}
                            <span className="font-semibold">
                              {branchStats.length}
                            </span>
                          </span>
                          <span>
                            Total Assessments:{" "}
                            <span className="font-semibold">
                              {branchStats.reduce(
                                (sum, branch) =>
                                  sum +
                                  (branch.low_risk || 0) +
                                  (branch.moderate_risk || 0) +
                                  (branch.high_risk || 0),
                                0
                              )}
                            </span>
                          </span>
                        </div>
                      </div>
                    </>
                  ) : branchViewTab === "chart" ? (
                    <>
                      {/* Chart View - Risk Assessment Distribution */}
                      <div className="mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                          {(() => {
                            const totalLow = branchStats.reduce(
                              (sum, item) => sum + (item.low_risk || 0),
                              0
                            );
                            const totalModerate = branchStats.reduce(
                              (sum, item) => sum + (item.moderate_risk || 0),
                              0
                            );
                            const totalHigh = branchStats.reduce(
                              (sum, item) => sum + (item.high_risk || 0),
                              0
                            );
                            const totalAll =
                              totalLow + totalModerate + totalHigh;

                            return [
                              {
                                label: "Total Assessments",
                                value: totalAll,
                                color: "bg-blue-500",
                                textColor: "text-blue-600",
                              },
                              {
                                label: "Low Risk",
                                value: totalLow,
                                color: "bg-green-500",
                                textColor: "text-green-600",
                              },
                              {
                                label: "Moderate Risk",
                                value: totalModerate,
                                color: "bg-yellow-500",
                                textColor: "text-yellow-600",
                              },
                              {
                                label: "High Risk",
                                value: totalHigh,
                                color: "bg-red-500",
                                textColor: "text-red-600",
                              },
                            ].map((stat, index) => (
                              <Card key={index} className="border-0 shadow-md">
                                <CardContent className="p-4">
                                  <div className="flex items-center space-x-3">
                                    <div
                                      className={`w-3 h-3 ${stat.color} rounded-full`}
                                    ></div>
                                    <div>
                                      <p className="text-sm font-medium text-slate-600">
                                        {stat.label}
                                      </p>
                                      <p
                                        className={`text-2xl font-bold ${stat.textColor}`}
                                      >
                                        {stat.value}
                                      </p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ));
                          })()}
                        </div>

                        {/* Bar Chart */}
                        <div className="h-96 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={branchStats.map((item) => ({
                                ...item,
                                branch_name: item.branch_name || "Unknown",
                              }))}
                              margin={{
                                top: 20,
                                right: 30,
                                left: 40,
                                bottom: 80,
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                              <XAxis 
                                dataKey="branch_name"
                                angle={-45}
                                textAnchor="end"
                                height={80}
                                fontSize={12}
                                tick={{ fontSize: 12 }}
                                interval={0}
                              />
                              <YAxis 
                                fontSize={12}
                                tick={{ fontSize: 12 }}
                              />
                              <Tooltip 
                                contentStyle={{
                                  backgroundColor: '#f8fafc',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: '8px',
                                  fontSize: '14px'
                                }}
                              />
                              <Legend 
                                wrapperStyle={{ paddingTop: '20px' }}
                              />
                              <Bar
                                dataKey="low_risk"
                                stackId="a"
                                fill="#10B981"
                                name="Low Risk"
                                radius={[0, 0, 0, 0]}
                              />
                              <Bar
                                dataKey="moderate_risk"
                                stackId="a"
                                fill="#F59E0B"
                                name="Moderate Risk"
                                radius={[0, 0, 0, 0]}
                              />
                              <Bar
                                dataKey="high_risk"
                                stackId="a"
                                fill="#EF4444"
                                name="High Risk"
                                radius={[2, 2, 0, 0]}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
