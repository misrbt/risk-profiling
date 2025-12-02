import React, { useState } from 'react';
import { Card, Button } from '../ui';
import { FunnelIcon } from '@heroicons/react/24/outline';
import GlobalFilter from '../GlobalFilter';

const CustomerFilters = ({ 
  filters, 
  handleFilterChange, 
  handleClearFilters, 
  isComplianceOfficer,
  branches,
  loadingBranches,
  globalFilter,
  setGlobalFilter,
}) => {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <Card className="bg-white rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden p-6 mb-8">
      <div className="flex items-center justify-end">
        <Button
          onClick={() => setShowFilters(!showFilters)}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <FunnelIcon className="w-4 h-4" />
          <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
        </Button>
      </div>

      {/* Filter Content - Collapsible */}
      <div 
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          showFilters 
            ? 'max-h-96 opacity-100' 
            : 'max-h-0 opacity-0'
        }`}
      >
        <div className="space-y-6 pt-6 mt-6 border-t border-gray-200">
          {/* Search Row */}
          <div className="flex justify-start items-center">
            <div className="flex-1 max-w-md">
              <GlobalFilter globalFilter={globalFilter} setGlobalFilter={setGlobalFilter} />
            </div>
          </div>

          {/* Advanced Filters Row */}
          <div>
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${isComplianceOfficer ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>

            {/* Date From Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">From Date</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Date To Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">To Date</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Risk Level Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Risk Level</label>
              <select
                value={filters.riskLevel}
                onChange={(e) => handleFilterChange("riskLevel", e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">All Risk Levels</option>
                <option value="LOW RISK">Low Risk</option>
                <option value="MODERATE RISK">Moderate Risk</option>
                <option value="HIGH RISK">High Risk</option>
              </select>
            </div>

            {/* Branch Filter - Only show for compliance officers */}
            {isComplianceOfficer && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Branch</label>
                <select
                  value={filters.branchId}
                  onChange={(e) => handleFilterChange("branchId", e.target.value)}
                  disabled={loadingBranches}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">{loadingBranches ? "Loading branches..." : "All Branches"}</option>
                  {branches.map((branch) => (
                    <option key={branch.value} value={branch.value}>{branch.branch_name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

            {/* Filter Actions */}
            <div className="flex justify-end mt-4 pt-4 border-t">
              <Button variant="outline" onClick={handleClearFilters} className="text-sm">
                Clear Filters
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default CustomerFilters;