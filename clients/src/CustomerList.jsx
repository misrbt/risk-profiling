import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
} from "@tanstack/react-table";
import { useCustomers } from "./hooks/useCustomers";
import { useModal } from "./hooks/useModal";
import { getRiskColor } from "./utils/riskUtils";
import { API_BASE_URL } from "./config/constants";
import { exportCSV, exportExcel, exportPDF } from "./utils/exportUtils";
import GlobalFilter from "./components/GlobalFilter";
import ExportButtons from "./components/ExportButtons";
import CustomerTable from "./components/CustomerTable";
import Pagination from "./components/Pagination";
import CustomerDetailsModal from "./components/CustomerDetailsModal";
import { Button } from "./components/ui";
import { FunnelIcon } from "@heroicons/react/24/outline";

export default function CustomerList() {
  const { customers, loading, error, refetch } = useCustomers("customers-list");
  const { showModal, openModal, closeModal, selectedCustomer } = useModal();
  const [globalFilter, setGlobalFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const handleViewDetails = useCallback(
    (customer) => {
      openModal(customer);
    },
    [openModal]
  );

  const columns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "totalScore",
        header: "Total Score",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "riskLevel",
        header: "Risk Level",
        cell: (info) => (
          <span className={getRiskColor(info.getValue())}>
            {info.getValue()}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: (info) => (
          <button
            onClick={() => handleViewDetails(info.row.original)}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            View Details
          </button>
        ),
      },
    ],
    [handleViewDetails]
  );

  const table = useReactTable({
    data: customers,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const handleExportCSV = useCallback(() => exportCSV(customers), [customers]);
  const handleExportExcel = useCallback(
    () => exportExcel(customers),
    [customers]
  );
  const handleExportPDF = useCallback(() => exportPDF(customers), [customers]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-slate-200/60">
          <div className="relative inline-block">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-indigo-400 rounded-full animate-spin animation-delay-150"></div>
          </div>
          <h3 className="mt-6 text-lg font-semibold text-slate-700">
            Loading Customer Data
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Please wait while we fetch the latest information...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-red-200/60 max-w-md mx-4">
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
            Something went wrong
          </h3>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            onClick={refetch}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="relative">
        {/* Header Section */}
        <div className="bg-white shadow-lg border-b border-slate-200/60">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                Customer Risk Management
              </h1>
              <p className="text-slate-600 text-lg">
                Comprehensive customer risk assessment and analysis
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-2 py-2">
          {/* Filter Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden p-6 mb-2">
            <div className="flex items-center justify-between">
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <FunnelIcon className="w-4 h-4" />
                <span>{showFilters ? "Hide Filters" : "Show Filters"}</span>
              </Button>
            </div>

            {/* Filter Content - Collapsible */}
            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden ${
                showFilters ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="flex flex-col lg:flex-row justify-between items-center gap-6 pt-6 mt-6 border-t border-gray-200">
                <div className="flex-1 max-w-md">
                  <GlobalFilter
                    globalFilter={globalFilter}
                    setGlobalFilter={setGlobalFilter}
                  />
                </div>
                <ExportButtons
                  onExportCSV={handleExportCSV}
                  onExportExcel={handleExportExcel}
                  onExportPDF={handleExportPDF}
                />
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden">
            <CustomerTable table={table} columns={columns} />
          </div>

          {/* Pagination Section */}
          <div className="mt-6">
            <Pagination table={table} />
          </div>
        </div>

        {/* Modal */}
        <CustomerDetailsModal
          showModal={showModal}
          customer={selectedCustomer}
          onClose={closeModal}
        />
      </div>
    </div>
  );
}
