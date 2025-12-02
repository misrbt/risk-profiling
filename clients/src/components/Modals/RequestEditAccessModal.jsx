import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { API_ENDPOINTS } from "../../config/constants";
import { Button } from "../ui";
import { successAlert, errorAlert } from "../../utils/sweetAlertConfig";

const RequestEditAccessModal = ({
  showModal,
  setShowModal,
  customer,
  onRequestSubmitted
}) => {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!customer) return;

    setIsSubmitting(true);
    const token = localStorage.getItem("authToken");

    try {
      const response = await axios.post(
        API_ENDPOINTS.EDIT_REQUESTS,
        {
          customer_id: customer.id,
          reason: reason.trim() || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      if (response.data.success) {
        successAlert(
          "Request Submitted",
          response.data.message || "Your edit request has been submitted successfully."
        );
        setShowModal(false);
        setReason("");
        if (onRequestSubmitted) {
          onRequestSubmitted(response.data.data);
        }
      }
    } catch (error) {
      console.error("Error submitting edit request:", error);

      if (error.response?.data?.message) {
        errorAlert("Request Failed", error.response.data.message);
      } else if (error.response?.data?.errors) {
        const errorMessages = Object.values(error.response.data.errors).flat();
        errorAlert("Validation Error", errorMessages.join("\n"));
      } else {
        errorAlert("Request Failed", "Failed to submit edit request. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setShowModal(false);
      setReason("");
    }
  };

  return (
    <AnimatePresence>
      {showModal && customer && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Beautiful Background Overlay */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-800/95 to-slate-900/90 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={handleClose}
          />

          {/* Modal Content */}
          <motion.div
            className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-md w-full z-10"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition disabled:opacity-50"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="p-6">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-orange-100 mb-4">
                  <svg
                    className="h-6 w-6 text-orange-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Request Edit Access
                </h3>
                <p className="text-sm text-gray-600">
                  Request permission to edit the risk assessment for{" "}
                  <span className="font-medium text-gray-900">{customer.name}</span>
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Edit Request (Optional)
                  </label>
                  <textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 resize-none"
                    placeholder="Please explain why you need to edit this risk assessment..."
                    maxLength={500}
                    disabled={isSubmitting}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {reason.length}/500 characters
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    onClick={handleClose}
                    variant="outline"
                    disabled={isSubmitting}
                    className="px-4 py-2"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Request"}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RequestEditAccessModal;