import React from 'react';

export default function PrivacyPolicyModal({ isOpen, onClose }) {
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
                Privacy Policy
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
                <h4 className="font-semibold text-gray-900 mb-2">Information We Collect</h4>
                <p>
                  We collect information you provide directly to us, such as when you create an account, conduct risk assessments, or contact us for support. This may include:
                </p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>Personal identification information (name, email address)</li>
                  <li>Customer risk assessment data</li>
                  <li>System usage and interaction data</li>
                  <li>Communication preferences</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">How We Use Your Information</h4>
                <p>
                  We use the information we collect to:
                </p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>Provide and maintain our risk management services</li>
                  <li>Process and analyze customer risk profiles</li>
                  <li>Communicate with you about your account and services</li>
                  <li>Comply with legal and regulatory requirements</li>
                  <li>Improve our services and develop new features</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Information Sharing and Disclosure</h4>
                <p>
                  We do not sell, trade, or otherwise transfer your personal information to third parties except in the following circumstances:
                </p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>With your explicit consent</li>
                  <li>To comply with legal obligations</li>
                  <li>To protect our rights and prevent fraud</li>
                  <li>In connection with a business transfer or merger</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Data Security</h4>
                <p>
                  We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes:
                </p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>Encryption of data in transit and at rest</li>
                  <li>Regular security assessments and audits</li>
                  <li>Access controls and authentication measures</li>
                  <li>Employee training on data protection</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Data Retention</h4>
                <p>
                  We retain your personal information for as long as necessary to fulfill the purposes outlined in this privacy policy, unless a longer retention period is required or permitted by law. Risk assessment data may be retained for regulatory compliance purposes.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Your Rights</h4>
                <p>
                  You have the right to:
                </p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>Access and review your personal information</li>
                  <li>Request correction of inaccurate data</li>
                  <li>Request deletion of your data (subject to legal requirements)</li>
                  <li>Object to processing of your personal information</li>
                  <li>Request data portability</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Cookies and Tracking</h4>
                <p>
                  We use cookies and similar tracking technologies to enhance your experience, analyze usage patterns, and improve our services. You can control cookie settings through your browser preferences.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Changes to This Policy</h4>
                <p>
                  We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Contact Us</h4>
                <p>
                  If you have any questions about this Privacy Policy, please contact us at:<br />
                  RBT Bank Inc.<br />
                  Talisayan, Misamis Oriental, Philippines<br />
                  Email: privacy@rbtbank.com<br />
                  Phone: +63 (XX) XXX-XXXX
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