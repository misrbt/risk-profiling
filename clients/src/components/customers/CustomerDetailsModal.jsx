import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { getRiskColor } from "../../utils/riskUtils";

const CustomerDetailsModal = ({
  showDetailsModal,
  selectedCustomer,
  setShowDetailsModal,
  handlePrint,
}) => {
  const { user } = useAuth();

  // Check if user is admin
  const isAdmin = user?.roles?.some(role => role.slug === 'admin');
  return (
    <AnimatePresence>
      {showDetailsModal && selectedCustomer && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Background Overlay */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-800/95 to-slate-900/90 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setShowDetailsModal(false)}
          />

          {/* Modal Content */}
          <motion.div
            className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-6xl w-full h-[95vh] sm:h-auto sm:max-h-[90vh] flex flex-col z-10"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowDetailsModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
              aria-label="Close modal"
            >
              <svg
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

            {/* Modal Header */}
            <div className="flex-shrink-0 p-4 sm:p-6 md:p-8 lg:p-10 pb-2 sm:pb-4">
              <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold mb-2 text-blue-700 pr-8">
                Name: {selectedCustomer.name}
              </h2>

              {/* Action buttons */}
              <div className="flex justify-end gap-2 my-2 sm:my-4">
                {isAdmin && (
                  <Link
                    to={`/admin/customers/${selectedCustomer.id}/edit`}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg shadow-md text-sm transition duration-300 w-auto flex items-center gap-1"
                    onClick={() => setShowDetailsModal(false)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </Link>
                )}
                <button
                  onClick={handlePrint}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg shadow-md text-sm transition duration-300 w-auto flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print
                </button>
              </div>
            </div>

            {/* Modal Content - Scrollable */}
            {selectedCustomer.selections && (
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 lg:px-10 pb-4 sm:pb-6 md:pb-8 lg:pb-10">
                <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold mb-3 sm:mb-4 text-blue-700 text-center">
                  Client Risk Profile
                </h3>
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
                      {selectedCustomer.selections.map((criteria, i) =>
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
                            <td className="px-2 sm:px-3 md:px-6 py-2 sm:py-3 md:py-4 text-xs sm:text-sm text-gray-500 w-1/2">
                              <div className="break-words">
                                {opt.optionLabel}
                              </div>
                            </td>
                            <td className="px-2 sm:px-3 md:px-6 py-2 sm:py-3 md:py-4 text-xs sm:text-sm text-gray-500 w-1/6">
                              <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap">
                                {opt.points} {opt.points === 0 || opt.points === 1 ? 'pt' : 'pts'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot className="bg-gray-500 text-white">
                      <tr>
                        <td
                          colSpan={2}
                          className="px-2 sm:px-3 md:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-bold uppercase"
                        >
                          Total Score
                        </td>
                        <td className="px-2 sm:px-3 md:px-6 py-2 sm:py-3 text-xs sm:text-sm font-bold">
                          <span className="bg-white text-gray-900 px-1.5 sm:px-2 py-1 rounded font-bold">
                            {selectedCustomer.totalScore} {selectedCustomer.totalScore === 0 || selectedCustomer.totalScore === 1 ? 'pt' : 'pts'}
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
                            className={`px-1.5 sm:px-2 py-1 rounded font-bold ${getRiskColor(
                              selectedCustomer.riskLevel
                            )}`}
                          >
                            {selectedCustomer.riskLevel}
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
      )}
    </AnimatePresence>
  );
};

export default CustomerDetailsModal;
