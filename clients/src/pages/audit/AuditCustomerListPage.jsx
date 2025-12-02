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
import { generatePrintContent } from "../../components/customers/PrintTemplate";
import { createCustomerColumns } from "../../utils/customerTableColumns.jsx";

export default function AuditCustomerListPage() {
  const { user, hasRole } = useAuth();
  const { systemLogo } = useSystemSettings();
  const { customers, loading, error } = useCustomerData();
  const location = useLocation();
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
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

  const canViewBranches = hasRole('audit') || hasRole('compliance') || hasRole('admin');
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
  }, [selectedCustomer, systemLogo]);

  const columns = useMemo(() => {
    // Audit role has read-only access - no edit buttons
    const isAdmin = false;
    const isManager = false;
    const isRegularUser = false;
    return createCustomerColumns(
      handleViewDetails,
      isAdmin,
      isManager,
      isRegularUser,
      () => {} // handleRequestEditAccess - not used for audit
    );
  }, [handleViewDetails]);

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
    </div>
  );
}
