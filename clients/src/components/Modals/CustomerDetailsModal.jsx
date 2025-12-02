import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  exportModalCSV,
  exportModalExcel,
  exportModalPDF,
  printCustomer,
} from "../../utils/exportFunctions";
import { getRiskColorClass, formatDate } from "../../utils/helpers";
import Logo from "../../assets/rbt-logo.png.png";

export default function CustomerDetailsModal({ customer, onClose }) {
  if (!customer) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-800/95 to-slate-900/90 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-6xl w-full h-[95vh] sm:h-auto sm:max-h-[90vh] flex flex-col z-10"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3 }}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
            aria-label="Close modal"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Modal Header - Fixed */}
          <div className="flex-shrink-0 p-4 sm:p-6 md:p-8 lg:p-10 pb-2 sm:pb-4">
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold mb-2 text-blue-700 pr-8">
              Name: {customer.name}
            </h2>

            {/* Export buttons */}
            <div className="flex flex-wrap justify-center sm:justify-end gap-1 sm:gap-2 md:gap-3 my-2 sm:my-4">
              <button
                onClick={() => exportModalCSV(customer)}
                className="bg-green-600 hover:bg-green-700 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-md sm:rounded-lg shadow-md text-xs sm:text-sm transition duration-300 flex-1 sm:flex-initial min-w-[60px] sm:min-w-0"
              >
                <span className="hidden sm:inline">Export </span>CSV
              </button>
              <button
                onClick={() => exportModalExcel(customer)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-md sm:rounded-lg shadow-md text-xs sm:text-sm transition duration-300 flex-1 sm:flex-initial min-w-[60px] sm:min-w-0"
              >
                <span className="hidden sm:inline">Export </span>Excel
              </button>
              <button
                onClick={() => exportModalPDF(customer)}
                className="bg-red-600 hover:bg-red-700 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-md sm:rounded-lg shadow-md text-xs sm:text-sm transition duration-300 flex-1 sm:flex-initial min-w-[60px] sm:min-w-0"
              >
                <span className="hidden sm:inline">Export </span>PDF
              </button>
              <button
                onClick={() => printCustomer(customer, Logo)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-md sm:rounded-lg shadow-md text-xs sm:text-sm transition duration-300 flex-1 sm:flex-initial min-w-[60px] sm:min-w-0"
              >
                Print
              </button>
            </div>
          </div>

          {/* Modal Content - Scrollable */}
          {customer.selections && (
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 lg:px-10 pb-4 sm:pb-6 md:pb-8 lg:pb-10">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-2">
                <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-blue-700">
                  Client Risk Profile
                </h3>
                <div className="text-xs sm:text-sm text-gray-600">
                  Date Assessed: {formatDate(customer.created_at)}
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg shadow-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-blue-600 text-white">
                    <tr>
                      <th className="px-2 sm:px-3 md:px-6 py-2 sm:py-3 text-left text-xs font-medium uppercase tracking-wider w-1/3">
                        Criteria
                      </th>
                      <th className="px-2 sm:px-3 md:px-6 py-2 sm:py-3 text-left text-xs font-medium uppercase tracking-wider w-1/2">
                        Sub-Criteria
                      </th>
                      <th className="px-2 sm:px-3 md:px-6 py-2 sm:py-3 text-left text-xs font-medium uppercase tracking-wider w-1/6">
                        Points
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {customer.selections.map((criteria, i) =>
                      criteria.options.map((opt, j) => (
                        <tr key={`${i}-${j}`} className="hover:bg-gray-50">
                          {j === 0 && (
                            <td
                              rowSpan={criteria.options.length}
                              className="px-2 sm:px-3 md:px-6 py-2 sm:py-3 md:py-4 text-xs sm:text-sm font-medium text-gray-900 border-r border-gray-200 align-top w-1/3"
                            >
                              <div className="break-words">
                                {criteria.criteriaCategory}
                              </div>
                            </td>
                          )}
                          <td className="px-2 sm:px-3 md:px-6 py-2 sm:py-3 md:py-4 text-xs sm:text-sm text-gray-600 w-1/2">
                            <div className="break-words">{opt.optionLabel}</div>
                          </td>
                          <td className="px-2 sm:px-3 md:px-6 py-2 sm:py-3 md:py-4 text-xs sm:text-sm text-gray-600 w-1/6">
                            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap">
                              {opt.points} {opt.points === 0 || opt.points === 1 ? 'pt' : 'pts'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot className="bg-black text-white">
                    <tr>
                      <td
                        colSpan={2}
                        className="px-2 sm:px-3 md:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-bold uppercase"
                      >
                        Total Score
                      </td>
                      <td className="px-2 sm:px-3 md:px-6 py-2 sm:py-3 text-xs sm:text-sm font-bold">
                        <span className="bg-white text-gray-900 px-1.5 sm:px-2 py-1 rounded font-bold">
                          {customer.totalScore} {customer.totalScore === 0 || customer.totalScore === 1 ? 'pt' : 'pts'}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td
                        colSpan={2}
                        className="px-2 sm:px-3 md:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-bold uppercase"
                      >
                        Risk Level
                      </td>
                      <td className="px-2 sm:px-3 md:px-6 py-2 sm:py-3 text-xs sm:text-sm font-bold">
                        <span
                          className={`px-1.5 sm:px-2 py-1 rounded font-bold ${getRiskColorClass(
                            customer.riskLevel
                          )}`}
                        >
                          {customer.riskLevel}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
