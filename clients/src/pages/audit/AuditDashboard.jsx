import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardContent } from "../../components/ui";
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
import {
  UserGroupIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  ChartBarIcon,
  BuildingOffice2Icon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from "@heroicons/react/24/outline";
import {
  FiUsers,
  FiTrendingUp,
  FiBarChart,
  FiFilter,
  FiMapPin,
  FiCalendar,
} from "react-icons/fi";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import { API_ENDPOINTS } from "../../config/constants";

const AuditDashboard = () => {
  console.log("AuditDashboard component rendering");

  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Add debugging
  console.log("Audit user:", user);
  console.log("Is authenticated:", isAuthenticated);
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
  const [branchViewTab, setBranchViewTab] = useState("table");
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    fetchBranchStats();
    fetchAnalyticsData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log("Audit fetching dashboard data...");

      if (!isAuthenticated) {
        console.log("User not authenticated, skipping API call");
        setError("User not authenticated");
        return;
      }

      // Audit should use specific audit dashboard endpoint with read-only permissions
      const response = await api.get(API_ENDPOINTS.AUDIT_DASHBOARD);
      console.log("Dashboard API response:", response);

      if (response.data) {
        console.log("Dashboard data received:", response.data);
        setDashboardData(response.data);
        setError(null);
      } else {
        throw new Error("No data received from API");
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      console.error("Error details:", {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message,
      });
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load dashboard data"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchBranchStats = async () => {
    console.log("🔄 Audit fetchBranchStats called");
    try {
      const response = await api.get(
        API_ENDPOINTS.AUDIT_DASHBOARD_BRANCH_STATS
      );
      console.log("✅ Audit fetchBranchStats response:", response.data);

      const dataArray = Array.isArray(response.data)
        ? response.data
        : Object.values(response.data);
      setBranchStats(dataArray);
    } catch (err) {
      console.log("❌ Audit fetchBranchStats error:", err);
      console.error("Error fetching branch stats:", err);
    }
  };

  const fetchAnalyticsData = async () => {
    console.log("🔄 Audit fetchAnalyticsData called");
    try {
      setAnalyticsLoading(true);
      const response = await api.get(API_ENDPOINTS.AUDIT_DASHBOARD_ANALYTICS);
      console.log("✅ Audit fetchAnalyticsData response:", response.data);
      setAnalyticsData(response.data);
    } catch (err) {
      console.log("❌ Audit fetchAnalyticsData error:", err);
      console.error("Error fetching analytics data:", err);
    } finally {
      setAnalyticsLoading(false);
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

  // Helper function to navigate to customer list with filters
  const navigateToCustomerList = (riskLevel = null) => {
    const baseRoute = "/audit/customers";
    if (riskLevel) {
      navigate(`${baseRoute}?risk=${riskLevel}`);
    } else {
      navigate(baseRoute);
    }
  };

  // Add authentication check
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="text-yellow-800">
              Please log in to access the dashboard.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading dashboard...</p>
          <p className="text-xs text-slate-400 mt-2">
            Fetching dashboard data...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-8xl mx-auto px-6 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800 mb-2">
            <strong>Error:</strong> {error}
          </div>
          <div className="text-sm text-red-600 mb-3">
            This might be due to permission issues or API connectivity problems.
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchDashboardData}
              className="text-red-600 hover:text-red-800 underline text-sm"
            >
              Try again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="text-red-600 hover:text-red-800 underline text-sm"
            >
              Reload page
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { totalCustomers, riskStats, recentCustomers, additionalStats } =
    dashboardData;

  // Audit has full system access (like compliance)
  const isAdminUser = () => true;

  // Emergency fallback - if something is wrong with the component logic
  if (!loading && !error && !dashboardData) {
    console.log("Emergency fallback triggered");
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <h2 className="font-semibold text-yellow-800">
            Dashboard Loading Issue
          </h2>
          <p className="text-yellow-700 text-sm mt-1">
            The dashboard data hasn't loaded properly. This could be due to:
          </p>
          <ul className="text-yellow-700 text-sm mt-2 ml-4 list-disc">
            <li>API permission issues</li>
            <li>Authentication problems</li>
            <li>Network connectivity</li>
            <li>Server-side errors</li>
          </ul>
          <button
            onClick={fetchDashboardData}
            className="mt-3 bg-yellow-600 text-white px-4 py-2 rounded text-sm hover:bg-yellow-700"
          >
            Retry Loading
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Dashboard</h1>
          <p className="text-gray-600 mb-4">System management interface</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded">
              <h3 className="font-medium text-blue-800">Status</h3>
              <p className="text-blue-600">Dashboard components loading...</p>
            </div>
            <div className="bg-green-50 p-4 rounded">
              <h3 className="font-medium text-green-800">Authentication</h3>
              <p className="text-green-600">
                {isAuthenticated ? "Authenticated" : "Not authenticated"}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded">
              <h3 className="font-medium text-purple-800">Actions</h3>
              <button
                onClick={() => window.location.reload()}
                className="text-purple-600 hover:text-purple-800 text-sm underline"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Chart colors
  const CHART_COLORS = ["#10B981", "#F59E0B", "#EF4444", "#6366F1", "#8B5CF6"];
  const PIE_COLORS = {
    "Low Risk": "#10B981",
    "Moderate Risk": "#F59E0B",
    "High Risk": "#EF4444",
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              Dashboard
            </h1>
            <p className="text-slate-600">
              Read-only system overview and data monitoring
            </p>
          </div>
          <div className="hidden lg:flex items-center space-x-3 bg-slate-50 px-4 py-2 rounded-full">
            <div className="flex items-center space-x-1 text-xs text-slate-500">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <span>System Overview</span>
            </div>
            <div className="w-px h-4 bg-slate-300"></div>
            <div className="flex items-center space-x-1 text-xs text-slate-500">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Risk Analysis</span>
            </div>
            <div className="w-px h-4 bg-slate-300"></div>
            <div className="flex items-center space-x-1 text-xs text-slate-500">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              <span>Performance</span>
            </div>
            <div className="w-px h-4 bg-slate-300"></div>
            <div className="flex items-center space-x-1 text-xs text-slate-500">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              <span>Management</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 1: Key Performance Indicators */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-3">
          <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">1</span>
          </div>
          System Performance Indicators
        </h2>
        <p className="text-slate-600 text-sm mb-3">
          Complete system statistics and risk management overview
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs sm:text-sm font-medium">
                  Total Clients
                </p>
                <p className="text-xl sm:text-2xl font-bold">
                  {totalCustomers}
                </p>
                <p className="text-xs text-blue-100 mt-1">System-wide</p>
                <button
                  onClick={() => navigateToCustomerList()}
                  className="group inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-blue-100 hover:text-white text-xs font-medium rounded-md transition-all duration-200 backdrop-blur-sm border border-white/20 hover:border-white/30"
                >
                  <span>View Details</span>
                  <svg
                    className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
              <div className="p-2 sm:p-3 bg-green bg-opacity-20 rounded-full">
                <FiUsers className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Low Risk</p>
                <p className="text-2xl font-bold">{riskStats.low}</p>
                <p className="text-xs text-green-100 mt-1">Safe clients</p>
                <button
                  onClick={() => navigateToCustomerList("low")}
                  className="group inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-green-100 hover:text-white text-xs font-medium rounded-md transition-all duration-200 backdrop-blur-sm border border-white/20 hover:border-white/30"
                >
                  <span>View Details</span>
                  <svg
                    className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
              <div className="p-3 bg-green bg-opacity-20 rounded-full">
                <CheckCircleIcon className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm font-medium">
                  Moderate Risk
                </p>
                <p className="text-2xl font-bold">{riskStats.moderate}</p>
                <p className="text-xs text-yellow-100 mt-1">
                  Monitoring required
                </p>
                <button
                  onClick={() => navigateToCustomerList("moderate")}
                  className="group inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-yellow-100 hover:text-white text-xs font-medium rounded-md transition-all duration-200 backdrop-blur-sm border border-white/20 hover:border-white/30"
                >
                  <span>View Details</span>
                  <svg
                    className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
              <div className="p-3 bg-green bg-opacity-20 rounded-full">
                <ClockIcon className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">High Risk</p>
                <p className="text-2xl font-bold">{riskStats.high}</p>
                <p className="text-xs text-red-100 mt-1">Immediate attention</p>
                <button
                  onClick={() => navigateToCustomerList("high")}
                  className="group inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-red-100 hover:text-white text-xs font-medium rounded-md transition-all duration-200 backdrop-blur-sm border border-white/20 hover:border-white/30"
                >
                  <span>View Details</span>
                  <svg
                    className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
              <div className="p-3 bg-green bg-opacity-20 rounded-full">
                <ExclamationTriangleIcon className="h-6 w-6" />
              </div>
            </div>
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
          bank wide risk distribution and recent assessment activity
        </p>
        <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent mb-3"></div>
      </div>
      <div className="grid gap-6 mb-8 grid-cols-1 lg:grid-cols-2">
        {/* Risk Distribution Analysis - Audit has full access */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <FiBarChart className="h-5 w-5" />
              Bank-wide Risk Distribution
            </h3>
          </CardHeader>
          <CardContent>
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

      {/* Section 3: Branch Performance Management - Audit has full access */}
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

      {/* Branch Assessment Summary */}
      <div className="mb-8">
        <Card className="w-full max-w-none">
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h3 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                <FiMapPin className="h-6 w-6" />
                Branch Assessment Overview
              </h3>
              {branchStats.length > 0 && (
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
              )}
            </div>
          </CardHeader>
          <CardContent>
            {branchStats.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <BuildingOffice2Icon className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                <p className="text-lg font-medium mb-2">
                  No Branch Data Available
                </p>
                <p className="text-sm">
                  Branch statistics will appear here once data is loaded
                </p>
              </div>
            ) : branchViewTab === "table" ? (
              <>
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
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
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
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </>
            ) : branchViewTab === "chart" ? (
              <>
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
                      <YAxis fontSize={12} tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          fontSize: "14px",
                        }}
                      />
                      <Legend wrapperStyle={{ paddingTop: "20px" }} />
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
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuditDashboard;
