import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getRiskColor } from "../utils/riskUtils";
import { exportModalDataToCSV, exportModalDataToExcel, exportModalDataToPDF, handlePrint } from "../utils/exportUtils";

export default function CustomerDetailsModal({ showModal, customer, onClose }) {
  if (!showModal || !customer) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-800/95 to-slate-900/90 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
        />

        <motion.div
          className="relative bg-white rounded-3xl shadow-2xl max-w-6xl w-full mx-4 z-10 overflow-hidden"
          initial={{ opacity: 0, scale: 0.85, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 50 }}
          transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6 text-white">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/70 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200"
              aria-label="Close modal"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="pr-12">
              <h2 className="text-3xl font-bold mb-2">Customer Risk Profile</h2>
              <p className="text-xl text-blue-100">{customer.name}</p>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Action Buttons */}
            <div className="flex flex-wrap justify-end gap-3 mb-8">
              <button
                onClick={() => exportModalDataToCSV(customer)}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white text-sm font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </button>
              <button
                onClick={() => exportModalDataToExcel(customer)}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-sm font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Export Excel
              </button>
              <button
                onClick={() => exportModalDataToPDF(customer)}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white text-sm font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export PDF
              </button>
              <button
                onClick={() => handlePrint(customer)}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white text-sm font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </button>
            </div>

            {customer.selections && (
              <div>
                <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-6 mb-6">
                  <h3 className="text-2xl font-bold text-slate-800 mb-4 text-center">
                    Risk Assessment Details
                  </h3>
                  
                  <div className="overflow-hidden rounded-xl shadow-lg border border-slate-200">
                    <table className="min-w-full">
                      <thead>
                        <tr className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
                          <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">
                            Criteria
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">
                            Sub-Criteria
                          </th>
                          <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider">
                            Points
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {customer.selections.map((criteria, i) =>
                          criteria.options.map((opt, j) => (
                            <tr
                              key={`${i}-${j}`}
                              className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 ${
                                (i + j) % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                              }`}
                            >
                              {j === 0 && (
                                <td
                                  rowSpan={criteria.options.length}
                                  className="px-6 py-4 text-sm font-semibold text-slate-800 border-r border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50"
                                >
                                  {criteria.criteriaCategory}
                                </td>
                              )}
                              <td className="px-6 py-4 text-sm text-slate-700">
                                {opt.optionLabel}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200">
                                  {opt.points} {opt.points === 0 || opt.points === 1 ? 'pt' : 'pts'}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gradient-to-r from-slate-600 to-slate-700 text-white">
                          <td
                            colSpan={2}
                            className="px-6 py-4 text-sm font-bold uppercase tracking-wide"
                          >
                            Total Score
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center px-4 py-2 rounded-full text-lg font-bold bg-white text-slate-800">
                              {customer.totalScore} {customer.totalScore === 0 || customer.totalScore === 1 ? 'pt' : 'pts'}
                            </span>
                          </td>
                        </tr>
                        <tr className="bg-gradient-to-r from-slate-700 to-slate-800 text-white">
                          <td
                            colSpan={2}
                            className="px-6 py-4 text-sm font-bold uppercase tracking-wide"
                          >
                            Risk Level
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-bold ${getRiskColor(customer.riskLevel)} bg-white`}>
                              {customer.riskLevel}
                            </span>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}