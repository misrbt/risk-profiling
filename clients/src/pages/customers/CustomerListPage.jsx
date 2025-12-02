import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
} from "@tanstack/react-table";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { API_ENDPOINTS } from "../../config/constants";
import {
  GlobalFilter,
  CustomerTable,
  Pagination,
} from "../../components/table";
import { Card, LoadingSpinner } from "../../components/ui";
import { useAuth } from "../../contexts/AuthContext";
import { useSystemSettings } from "../../contexts/SystemSettingsContext";
import {
  useCustomerData,
  useCustomerFilters,
} from "../../hooks/useCustomerData";
import { useCustomerExport } from "../../hooks/useCustomerExport";
import CustomerFilters from "../../components/customers/CustomerFilters";
import CustomerDetailsModal from "../../components/customers/CustomerDetailsModal";
import RequestEditAccessModal from "../../components/Modals/RequestEditAccessModal";
import { generatePrintContent } from "../../components/customers/PrintTemplate";
import { createCustomerColumns } from "../../utils/customerTableColumns.jsx";
export default function CustomerListPage() {
  const { user, hasRole } = useAuth();
  const { systemLogo } = useSystemSettings();
  const { customers, loading, error } = useCustomerData();
  const location = useLocation();
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestCustomer, setRequestCustomer] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Timeout protection for loading state
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setLoadingTimeout(true);
      }, 15000); // 15 second timeout

      return () => clearTimeout(timer);
    } else {
      setLoadingTimeout(false);
    }
  }, [loading]);

  const canViewBranches = hasRole('compliance') || hasRole('admin');
  const { filteredCustomers, filters, handleFilterChange, handleClearFilters } =
    useCustomerFilters(customers, canViewBranches);
  const { exportToCSV, exportToExcel, exportToPDF } = useCustomerExport();

  // Handle URL parameters for filtering
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const riskParam = searchParams.get('risk');

    if (riskParam) {
      // Map URL risk parameter to filter values
      const riskMapping = {
        'low': 'LOW RISK',
        'moderate': 'MODERATE RISK',
        'high': 'HIGH RISK'
      };

      const riskLevel = riskMapping[riskParam.toLowerCase()];
      if (riskLevel) {
        handleFilterChange('riskLevel', riskLevel);
      }
    }
  }, [location.search, handleFilterChange]);

  useEffect(() => {
    if (!canViewBranches) return;
    setLoadingBranches(true);
    const token = localStorage.getItem("authToken");
    axios
      .get(API_ENDPOINTS.BRANCHES_DROPDOWN, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => {
        if (res.data.success) {
          const filteredBranches = res.data.data.filter(
            (branch) => branch.value !== 1
          );
          const sortedBranches = filteredBranches.sort((a, b) => {
            if (a.brcode && b.brcode) return a.brcode.localeCompare(b.brcode);
            return 0;
          });
          setBranches(sortedBranches);
        }
        setLoadingBranches(false);
      })
      .catch(() => setLoadingBranches(false));
  }, [canViewBranches]);

  const handleViewDetails = useCallback((customer) => {
    setSelectedCustomer(customer);
    setShowDetailsModal(true);
  }, []);

  const handlePrint = useCallback(() => {
    if (!selectedCustomer) return;
    const currentDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const printWindow = window.open("", "_blank");
    const printContent = generatePrintContent(
      selectedCustomer,
      currentDate,
      systemLogo
    );
    printWindow.document.write(printContent);
    printWindow.document.close();
  }, [selectedCustomer]);

  const handleRequestEditAccess = useCallback((customer) => {
    setRequestCustomer(customer);
    setShowRequestModal(true);
  }, []);

  const handleRequestSubmitted = useCallback((requestData) => {
    // You can add any additional logic here if needed
    console.log("Edit request submitted:", requestData);
  }, []);

  const columns = useMemo(() => {
    const isAdmin = hasRole('admin');
    const isManager = hasRole('manager');
    const isRegularUser = hasRole('users') && !isAdmin && !isManager;
    return createCustomerColumns(
      handleViewDetails,
      isAdmin,
      isManager,
      isRegularUser,
      handleRequestEditAccess
    );
  }, [handleViewDetails, hasRole, handleRequestEditAccess]);

  const table = useReactTable({
    data: filteredCustomers,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    filterFns: {
      includesString: (row, columnId, filterValue) =>
        String(row.getValue(columnId))
          .toLowerCase()
          .includes(filterValue.toLowerCase()),
    },
  });

  if (loading && !loadingTimeout) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="p-8">
          <LoadingSpinner size="lg" text="Loading customer data..." />
        </Card>
      </div>
    );
  }

  // Show error or timeout fallback
  if (loadingTimeout || error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {loadingTimeout ? "Loading Timeout" : "Error Loading Data"}
            </h2>
            <p className="text-gray-600 mb-4">
              {error || "The page is taking too long to load. This might be a temporary issue."}
            </p>
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Refresh Page
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/login';
                }}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Logout and Login Again
              </button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Card className="p-8 max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">
            Error Connection Failed. Please try again.
          </h3>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="text-sm text-slate-600 mb-6">
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Your token is expired please Logout and Login again.</li>
              <li>You have proper authentication tokens if required</li>
            </ul>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Reload the page
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <CustomerFilters
        filters={filters}
        handleFilterChange={handleFilterChange}
        handleClearFilters={handleClearFilters}
        filteredCustomers={filteredCustomers}
        isComplianceOfficer={canViewBranches}
        branches={branches}
        loadingBranches={loadingBranches}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        GlobalFilter={GlobalFilter}
      />
      <Card className="overflow-hidden">
        <CustomerTable table={table} columns={columns} />
      </Card>
      <div className="mt-6">
        <Pagination table={table} />
      </div>
      <CustomerDetailsModal
        showDetailsModal={showDetailsModal}
        selectedCustomer={selectedCustomer}
        setShowDetailsModal={setShowDetailsModal}
        exportToCSV={exportToCSV}
        exportToExcel={exportToExcel}
        exportToPDF={exportToPDF}
        handlePrint={handlePrint}
      />
      <RequestEditAccessModal
        showModal={showRequestModal}
        setShowModal={setShowRequestModal}
        customer={requestCustomer}
        onRequestSubmitted={handleRequestSubmitted}
      />
    </div>
  );
}
