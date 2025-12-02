import React from 'react';

export default function TermsOfServiceModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Background overlay */}
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gradient-to-br from-slate-900/90 via-slate-800/95 to-slate-900/90 backdrop-blur-md transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                Terms of Service
              </h3>
              <button
                onClick={onClose}
                className="rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white px-6 py-4 max-h-96 overflow-y-auto">
            <div className="text-sm text-gray-700 space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">1. Acceptance of Terms</h4>
                <p>
                  By accessing and using the RBT Bank Risk Management System, you accept and agree to be bound by the terms and provision of this agreement.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">2. Use License</h4>
                <p>
                  Permission is granted to temporarily access the Risk Management System for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
                </p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>modify or copy the materials</li>
                  <li>use the materials for any commercial purpose or for any public display</li>
                  <li>attempt to decompile or reverse engineer any software</li>
                  <li>remove any copyright or other proprietary notations</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">3. Data Protection and Privacy</h4>
                <p>
                  We are committed to protecting your privacy and personal information. All customer data and risk assessments are handled in accordance with banking regulations and industry best practices.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">4. User Responsibilities</h4>
                <p>
                  Users are responsible for maintaining the confidentiality of their account information and for all activities that occur under their account. You agree to:
                </p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>provide accurate and complete information</li>
                  <li>maintain the security of your login credentials</li>
                  <li>comply with all applicable laws and regulations</li>
                  <li>report any unauthorized use immediately</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">5. System Availability</h4>
                <p>
                  While we strive to maintain system availability, we do not guarantee uninterrupted access. The system may be temporarily unavailable due to maintenance, updates, or technical issues.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">6. Limitation of Liability</h4>
                <p>
                  RBT Bank shall not be liable for any damages arising from the use or inability to use this system, including but not limited to direct, indirect, incidental, or consequential damages.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">7. Changes to Terms</h4>
                <p>
                  RBT Bank reserves the right to modify these terms at any time. Users will be notified of significant changes and continued use of the system constitutes acceptance of the modified terms.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">8. Contact Information</h4>
                <p>
                  For questions about these Terms of Service, please contact:<br />
                  RBT Bank Inc.<br />
                  Talisayan, Misamis Oriental, Philippines<br />
                  Email: support@rbtbank.com
                </p>
              </div>

              <div className="text-xs text-gray-500 pt-4 border-t">
                <p>Last updated: {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-3">
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}