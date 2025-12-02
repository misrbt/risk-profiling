import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_ENDPOINTS } from "../config/constants";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  Button,
  ProgressBar,
  StepIndicator,
  AnimatedCard,
} from "../components/ui";
import {
  confirmationAlert,
  successAlert,
  errorAlert,
  infoAlert,
} from "../utils/sweetAlertConfig";
import { useAuth } from "../contexts/AuthContext";
import { riskSettingsService } from "../services/riskSettingsService";
import Swal from "sweetalert2";
import { generatePrintContent } from "../components/customers/PrintTemplate";
import { useSystemSettings } from "../contexts/SystemSettingsContext";
import { useNavigate } from "react-router-dom";

export default function RiskAssessmentPage() {
  const { user, isRegularUser, isComplianceOfficer, hasRole } = useAuth();
  const { systemLogo } = useSystemSettings();
  const navigate = useNavigate();

  // Helper function to get role-based endpoints
  const getAssessmentEndpoints = () => {
    if (hasRole("admin")) {
      return {
        CRITERIA: API_ENDPOINTS.ADMIN_CRITERIA,
        CREATE_CUSTOMER: API_ENDPOINTS.ADMIN_CREATE_CUSTOMER,
      };
    } else {
      return {
        CRITERIA: API_ENDPOINTS.CRITERIA,
        CREATE_CUSTOMER: API_ENDPOINTS.CREATE_CUSTOMER,
      };
    }
  };
  const [criteria, setCriteria] = useState([]);
  const [responses, setResponses] = useState({});
  const [selectionConfig, setSelectionConfig] = useState({});
  const [name, setName] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [result, setResult] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [error, setError] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [completedStepsCount, setCompletedStepsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const token = localStorage.getItem("authToken");

    // Fetch both criteria and selection configuration
    const endpoints = getAssessmentEndpoints();
    Promise.all([
      axios.get(endpoints.CRITERIA, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }),
      // Fetch selection configuration using service
      riskSettingsService.selectionConfig.getAll(),
    ])
      .then(([criteriaRes, configRes]) => {
        setCriteria(criteriaRes.data);
        setSelectionConfig(configRes.data || {});
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching criteria", err);
        setIsLoading(false);
      });
  }, []);

  // Fetch branches and set default branch based on user role
  useEffect(() => {
    if (!user) return;

    // For regular users, set their branch automatically
    if (
      user.roles &&
      user.roles.some((role) => role.slug === "users") &&
      user.branch_id
    ) {
      const branchIdStr = user.branch_id.toString();
      if (selectedBranch !== branchIdStr) {
        setSelectedBranch(branchIdStr);
      }
      return;
    }

    // For compliance officers, fetch all branches except Head Office (id: 1)
    if (user.roles && user.roles.some((role) => role.slug === "admin")) {
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
            // Filter out Head Office (id: 1)
            const filteredBranches = res.data.data.filter(
              (branch) => branch.value !== 1
            );
            setBranches(filteredBranches);
          }
          setLoadingBranches(false);
        })
        .catch((err) => {
          console.error("Error fetching branches", err);
          setLoadingBranches(false);
        });
    }
  }, [user, selectedBranch]);

  const handleSelect = (criteriaId, optionId) => {
    const isMultiple = selectionConfig[criteriaId] === "multiple";

    if (isMultiple) {
      // Handle multiple selection (checkboxes)
      setResponses((prev) => {
        const currentSelections = prev[criteriaId] || [];
        const isSelected = currentSelections.includes(optionId);

        if (isSelected) {
          // Remove option
          const newSelections = currentSelections.filter(
            (id) => id !== optionId
          );
          return {
            ...prev,
            [criteriaId]: newSelections.length > 0 ? newSelections : undefined,
          };
        } else {
          // Add option
          return {
            ...prev,
            [criteriaId]: [...currentSelections, optionId],
          };
        }
      });
    } else {
      // Handle single selection (radio buttons) - default behavior
      setResponses((prev) => ({
        ...prev,
        [criteriaId]: optionId,
      }));
    }
    setError(""); // Clear error when user selects an option
  };

  const handleSubmit = async () => {
    const result = await confirmationAlert(
      "Submit Assessment?",
      "Are you sure you want to submit this risk assessment? This action cannot be undone.",
      "Yes, Submit Assessment"
    );

    if (result.isConfirmed) {
      setIsLoading(true);
      // Flatten responses for multiple selection criteria
      const allSelectedOptionIds = Object.values(responses).flatMap(
        (response) => (Array.isArray(response) ? response : [response])
      );

      try {
        const token = localStorage.getItem("authToken");

        // Determine the correct branch_id to use
        // For compliance: use selectedBranch
        // For users: let backend determine from authenticated user
        const requestData = {
          name,
          responses: allSelectedOptionIds,
        };

        // Only include branch_id if explicitly selected (compliance officers)
        if (selectedBranch) {
          requestData.branch_id = selectedBranch;
        }

        const endpoints = getAssessmentEndpoints();
        const response = await axios.post(
          endpoints.CREATE_CUSTOMER,
          requestData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          }
        );

        const resultData = {
          riskLevel: response.data.risk_level,
          totalScore: response.data.total_score,
          customerId: response.data.customer?.id,
        };

        setResult(resultData);
        setShowReviewModal(false);
        setIsLoading(false);

        // Show final success alert with two buttons
        const finalResult = await Swal.fire({
          title: "Assessment Complete!",
          html: `
            <div style="text-align: center; padding: 20px;">
              <p style="font-size: 18px; margin-bottom: 15px;"><strong>Customer:</strong> ${name}</p>
              <p style="font-size: 18px; margin-bottom: 15px;"><strong>Risk Level:</strong> <span style="color: ${
                resultData.riskLevel === "HIGH RISK"
                  ? "#dc2626"
                  : resultData.riskLevel === "MODERATE RISK"
                  ? "#ca8a04"
                  : "#16a34a"
              }; font-weight: bold;">${resultData.riskLevel}</span></p>
              <p style="font-size: 18px; margin-bottom: 15px;"><strong>Total Score:</strong> ${resultData.totalScore}</p>
            </div>
          `,
          icon: "success",
          showCancelButton: true,
          showDenyButton: true,
          confirmButtonText: "Start New Assessment",
          denyButtonText: "Print Assessment",
          cancelButtonText: "Close",
          confirmButtonColor: "#3b82f6",
          denyButtonColor: "#10b981",
          cancelButtonColor: "#64748b",
          customClass: {
            popup: "rounded-2xl shadow-2xl",
            confirmButton: "rounded-lg px-6 py-3 font-medium",
            denyButton: "rounded-lg px-6 py-3 font-medium",
            cancelButton: "rounded-lg px-6 py-3 font-medium",
          },
        });

        // Handle user action
        if (finalResult.isConfirmed) {
          // Start new assessment
          handleResetAssessment();
        } else if (finalResult.isDenied) {
          // Print assessment - pass the customer ID and data
          await handlePrintAssessment(response.data.id, name, resultData);
        } else if (finalResult.dismiss === Swal.DismissReason.cancel) {
          // Close button clicked - navigate to customer list
          handleNavigateToCustomerList();
        }
      } catch (err) {
        setIsLoading(false);

        await errorAlert(
          "Submission Failed!",
          err.response?.data?.message ||
            "Failed to save assessment data. Please check your connection and try again.",
          "Try Again"
        );

        setError("Failed to save data. Please try again.");
      }
    }
  };

  const handleCloseModal = async () => {
    const result = await infoAlert(
      "Assessment Complete!",
      "Thank you for completing the risk assessment. You can now start a new assessment if needed.",
      "Start New Assessment"
    );

    if (result.isConfirmed) {
      setShowModal(false);
      setName("");
      setResponses({});
      setResult(null);
      setError("");
      setCurrentStep(0);
      setCompletedStepsCount(0);
    }
  };

  // Reset assessment to start new one
  const handleResetAssessment = () => {
    setName("");
    setResponses({});
    setResult(null);
    setError("");
    setCurrentStep(0);
    setCompletedStepsCount(0);
    setShowModal(false);
    setShowReviewModal(false);
    setSelectedBranch("");
  };

  // Navigate to customer list based on role
  const handleNavigateToCustomerList = () => {
    if (hasRole("admin")) {
      navigate("/admin/customers");
    } else if (hasRole("manager")) {
      navigate("/manager/customers");
    } else if (hasRole("compliance")) {
      navigate("/compliance/customers");
    } else if (hasRole("audit")) {
      navigate("/audit/customers");
    } else {
      navigate("/customers");
    }
  };

  // Print assessment
  const handlePrintAssessment = async (customerId, customerName, resultData) => {
    if (!customerId) {
      await errorAlert("Print Error", "Customer ID not available for printing.", "OK");
      return;
    }

    try {
      // Show loading
      Swal.fire({
        title: "Preparing Print...",
        text: "Please wait while we prepare your assessment for printing.",
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      // Fetch full customer details with selections
      const token = localStorage.getItem("authToken");

      // Determine the correct endpoint based on role
      let customerEndpoint;
      if (hasRole("admin")) {
        customerEndpoint = `admin/customers/${customerId}`;
      } else if (hasRole("manager")) {
        customerEndpoint = `manager/customers/${customerId}`;
      } else if (hasRole("compliance")) {
        customerEndpoint = `compliance/customers/${customerId}`;
      } else {
        customerEndpoint = `user/customers/${customerId}`;
      }

      const response = await axios.get(customerEndpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      Swal.close();

      // Extract data from response (backend returns { success: true, data: {...} })
      const data = response.data.success ? response.data.data : response.data;

      // Prepare customer data for printing
      const customerData = {
        id: data.id,
        name: data.name,
        totalScore: data.totalScore || data.total_score,
        riskLevel: data.riskLevel || data.risk_level,
        created_at: data.created_at,
        selections: data.selections || [],
        createdByName: user?.full_name || user?.name || "Unknown",
      };

      const currentDate = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const printWindow = window.open("", "_blank");
      const printContent = generatePrintContent(customerData, currentDate, systemLogo);
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();

      // Show the success alert again after printing
      const secondResult = await Swal.fire({
        title: "Assessment Complete!",
        html: `
          <div style="text-align: center; padding: 20px;">
            <p style="font-size: 18px; margin-bottom: 15px;"><strong>Customer:</strong> ${customerName}</p>
            <p style="font-size: 18px; margin-bottom: 15px;"><strong>Risk Level:</strong> <span style="color: ${
              resultData.riskLevel === "HIGH RISK"
                ? "#dc2626"
                : resultData.riskLevel === "MODERATE RISK"
                ? "#ca8a04"
                : "#16a34a"
            }; font-weight: bold;">${resultData.riskLevel}</span></p>
            <p style="font-size: 18px; margin-bottom: 15px;"><strong>Total Score:</strong> ${resultData.totalScore}</p>
          </div>
        `,
        icon: "success",
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: "Start New Assessment",
        denyButtonText: "Print Assessment",
        cancelButtonText: "Close",
        confirmButtonColor: "#3b82f6",
        denyButtonColor: "#10b981",
        cancelButtonColor: "#64748b",
        customClass: {
          popup: "rounded-2xl shadow-2xl",
          confirmButton: "rounded-lg px-6 py-3 font-medium",
          denyButton: "rounded-lg px-6 py-3 font-medium",
          cancelButton: "rounded-lg px-6 py-3 font-medium",
        },
      });

      // Handle the second result
      if (secondResult.isConfirmed) {
        handleResetAssessment();
      } else if (secondResult.isDenied) {
        await handlePrintAssessment(customerId, customerName, resultData);
      } else if (secondResult.dismiss === Swal.DismissReason.cancel) {
        handleNavigateToCustomerList();
      }
    } catch (err) {
      Swal.close();
      console.error("Print error:", err);
      await errorAlert("Print Error", "Failed to fetch customer details for printing. Please try again.", "OK");
    }
  };

  const getRiskColor = (risk) => {
    if (risk === "HIGH RISK") return "text-red-600";
    if (risk === "MODERATE RISK") return "text-yellow-600";
    return "text-green-600";
  };

  const getRiskIcon = (risk) => {
    if (risk === "HIGH RISK")
      return (
        <svg
          className="w-16 h-16 text-red-500 mx-auto mb-4"
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
      );
    if (risk === "MODERATE RISK")
      return (
        <svg
          className="w-16 h-16 text-yellow-500 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    return (
      <svg
        className="w-16 h-16 text-green-500 mx-auto mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    );
  };

  const handleNext = () => {
    if (currentStep === 0) {
      if (!name.trim()) {
        setError("Customer name is required.");
        return;
      }
      // For compliance officers, require explicit branch selection
      if (
        user &&
        user.roles &&
        user.roles.some((role) => role.slug === "compliance")
      ) {
        if (!selectedBranch) {
          setError("Please select a branch.");
          return;
        }
      }

      // For regular users, branch validation is handled differently
      // Their branch_id will be automatically used from their profile
      setError("");
      setCurrentStep(1);
      setCompletedStepsCount(1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const currentCriteria = criteria[currentStep - 1];
    const currentResponse = responses[currentCriteria.id];
    const isMultiple = selectionConfig[currentCriteria.id] === "multiple";

    if (
      !currentResponse ||
      (isMultiple &&
        (!Array.isArray(currentResponse) || currentResponse.length === 0))
    ) {
      setError("Please select at least one option before proceeding.");
      return;
    }
    setError("");

    if (currentStep < criteria.length) {
      setCurrentStep((prev) => prev + 1);
      setCompletedStepsCount((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setShowReviewModal(true);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      setError("");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const totalSteps = criteria.length + 1;
  const progress =
    totalSteps > 0
      ? Math.min(100, Math.round((completedStepsCount / totalSteps) * 100))
      : 0;

  // Loading state
  if (isLoading && criteria.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="p-8 text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-slate-700">
            Loading Assessment...
          </h3>
          <p className="text-slate-500 mt-2">
            Please wait while we prepare your risk assessment
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-10 h-2  bg-slate-200 z-50">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-600 to-indigo-600"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>

      <div className="mx-auto px-0 xs:px-1 sm:px-1 md:py-2 lg:px-3 pt-4 pb-8 w-full max-w-4xl xs:max-w-6xl sm:max-w-none md:max-w-none lg:max-w-none xl:max-w-none 2xl:max-w-none">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-4"
        >
          {/* Step Indicator */}
          {criteria.length > 0 && (
            <div className="mt-8">
              <StepIndicator
                steps={[
                  { name: "Info" },
                  ...criteria.map((c, i) => ({ name: `Q${i + 1}` })),
                ]}
                currentStep={currentStep}
              />
            </div>
          )}
        </motion.div>

        <AnimatePresence mode="wait">
          {/* Step 0: Customer Name */}
          {currentStep === 0 && (
            <motion.div
              key="name-step"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
            >
              <AnimatedCard
                className="p-4 sm:p-6 md:p-8 max-w-sm sm:max-w-2xl md:max-w-6xl lg:max-w-6xl xl:max-w-6xl mx-auto w-full"
                style={{
                  background:
                    "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
                  color: "white",
                }}
              >
                <div className="text-center">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg
                      className="w-10 h-10 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>

                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 text-center break-words">
                    Welcome!
                  </h2>
                  <p className="text-white/80 mb-4 sm:mb-6 md:mb-8 text-sm sm:text-base text-center">
                    Let's start by getting the customer's information
                  </p>

                  <div className="relative">
                    <input
                      type="text"
                      placeholder="ex. Juan S. Dela cruz"
                      className={`w-full max-w-full px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base md:text-lg rounded-lg sm:rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-4 bg-white/90 backdrop-blur-sm text-slate-800 placeholder-slate-500 ${
                        error
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                          : "border-white/30 focus:border-white focus:ring-white/20"
                      }`}
                      value={name}
                      onChange={(e) => {
                        const capitalizedValue = e.target.value
                          .split(" ")
                          .map(
                            (word) =>
                              word.charAt(0).toUpperCase() +
                              word.slice(1).toLowerCase()
                          )
                          .join(" ");
                        setName(capitalizedValue);
                      }}
                      onKeyPress={(e) => e.key === "Enter" && handleNext()}
                    />
                    {name && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2"
                      >
                        <svg
                          className="w-6 h-6 text-green-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </motion.div>
                    )}
                  </div>

                  {/* Branch Selection - Only show for compliance officers */}
                  {user &&
                    user.roles &&
                    user.roles.some((role) => role.slug === "admin") && (
                      <div className="relative mt-4">
                        <div className="relative">
                          <select
                            value={selectedBranch}
                            onChange={(e) => setSelectedBranch(e.target.value)}
                            disabled={loadingBranches}
                            className={`w-full max-w-full px-4 sm:px-6 py-3 sm:py-4 pr-12 text-sm sm:text-base md:text-lg rounded-lg sm:rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-4 bg-white/90 backdrop-blur-sm text-slate-800 placeholder-slate-500 appearance-none cursor-pointer ${
                              error && !selectedBranch
                                ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                                : "border-white/30 focus:border-white focus:ring-white/20"
                            } disabled:opacity-60 disabled:cursor-not-allowed`}
                          >
                            <option value="" className="text-slate-500">
                              {loadingBranches
                                ? "Loading branches..."
                                : "Select branch"}
                            </option>
                            {branches.map((branch) => (
                              <option
                                key={branch.value}
                                value={branch.value}
                                className="text-slate-800"
                              >
                                {branch.branch_name}
                              </option>
                            ))}
                          </select>

                          {/* Custom dropdown arrow */}
                          <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                            {selectedBranch ? (
                              <motion.div
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex items-center justify-center"
                              >
                                <svg
                                  className="w-5 h-5 text-green-500"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              </motion.div>
                            ) : (
                              <svg
                                className={`w-5 h-5 transition-colors duration-200 ${
                                  loadingBranches
                                    ? "text-slate-400 animate-spin"
                                    : "text-slate-400"
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                {loadingBranches ? (
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                  />
                                ) : (
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 9l-7 7-7-7"
                                  />
                                )}
                              </svg>
                            )}
                          </div>
                        </div>

                        {/* Branch icon and helper text */}
                        <div className="mt-2 flex items-center text-white/70 text-xs">
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
                              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 8v-3a1 1 0 011-1h4a1 1 0 011 1v3M9 21h6"
                            />
                          </svg>
                          <span>
                            Choose the branch for this customer assessment
                          </span>
                        </div>
                      </div>
                    )}

                  {/* Display selected branch info for regular users */}
                  {user &&
                    user.roles &&
                    user.roles.some((role) => role.slug === "users") &&
                    user.branch && (
                      <div className="mt-4 p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg">
                        <p className="text-white/80 text-sm">
                          Branch:{" "}
                          <span className="font-medium text-white">
                            {user.branch.display_name ||
                              `${user.branch.branch_name} (${user.branch.brak})`}
                          </span>
                        </p>
                      </div>
                    )}

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-3 bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-lg"
                    >
                      <p className="text-red-100 font-medium">{error}</p>
                    </motion.div>
                  )}
                </div>
              </AnimatedCard>
            </motion.div>
          )}

          {/* Question Steps */}
          {currentStep > 0 && criteria.length > 0 && (
            <motion.div
              key={`question-${currentStep}`}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
            >
              <AnimatedCard
                className="p-2 sm:p-3 md:p-4 relative overflow-hidden w-full max-w-[calc(100%-3rem)] mx-auto"
                style={{
                  background:
                    "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
                }}
              >
                {/* Decorative Elements */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full"></div>
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full"></div>
                <div className="text-center mb-8 relative z-10">
                  <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white mb-2 text-center break-words px-2">
                    {criteria[currentStep - 1]?.category}
                  </h2>
                  <p className="text-white/80 text-sm sm:text-base text-center">
                    {selectionConfig[criteria[currentStep - 1]?.id] ===
                    "multiple"
                      ? "Please select all applicable options"
                      : "Please select the most appropriate option"}
                  </p>
                </div>

                <div
                  className={`grid w-full max-w-none mx-2 relative z-10 ${(() => {
                    const optionsCount = (
                      criteria[currentStep - 1]?.options ?? []
                    ).length;
                    if (optionsCount === 2)
                      return "grid-cols-2 place-items-center justify-center max-w-2xl mx-auto gap-3 sm:gap-4";
                    if (optionsCount === 3)
                      return "grid-cols-3 place-items-center justify-center max-w-4xl mx-auto gap-3 sm:gap-4";
                    if (optionsCount === 5)
                      return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-3 sm:gap-4";
                    if (optionsCount === 8)
                      return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-3";
                    if (optionsCount === 7)
                      return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-1 sm:gap-2 md:gap-2";
                    if (optionsCount === 9)
                      return "grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-1 sm:gap-2 md:gap-2";
                    if (optionsCount === 15)
                      return "grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-1 sm:gap-1 md:gap-2";
                    if (optionsCount >= 6)
                      return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-3 sm:gap-4";
                    return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4";
                  })()}`}
                >
                  {(criteria[currentStep - 1]?.options ?? []).map(
                    (option, index) => {
                      const currentCriteria = criteria[currentStep - 1];
                      const isMultiple =
                        selectionConfig[currentCriteria.id] === "multiple";
                      const currentResponse = responses[currentCriteria.id];
                      const isSelected = isMultiple
                        ? Array.isArray(currentResponse) &&
                          currentResponse.includes(option.id)
                        : currentResponse === option.id;
                      const optionsCount = (
                        criteria[currentStep - 1]?.options ?? []
                      ).length;
                      const cardSize =
                        optionsCount === 15
                          ? "min-h-[4rem] sm:min-h-[4.5rem] md:min-h-[5rem] h-auto min-w-[6rem] sm:min-w-[7rem] md:min-w-[8rem]"
                          : optionsCount === 8
                          ? "h-36 sm:h-40 md:h-44"
                          : optionsCount >= 6
                          ? "h-32 sm:h-36 md:h-40 min-w-[7rem] sm:min-w-[8rem] md:min-w-[9rem]"
                          : "h-28 sm:h-32 md:h-36";
                      const cardAspect =
                        optionsCount === 15 ? "" : "aspect-square";
                      return (
                        <motion.div
                          key={option.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          onClick={() =>
                            handleSelect(
                              criteria[currentStep - 1].id,
                              option.id
                            )
                          }
                          className={`cursor-pointer p-3 sm:p-4 md:p-5 rounded-xl border-2 transition-all duration-300 transform hover:scale-[1.02] backdrop-blur-sm w-full ${cardSize} ${cardAspect} flex flex-col items-center justify-center text-center relative ${
                            isSelected
                              ? "border-green-400 bg-white/20 shadow-lg ring-4 ring-green-400/30"
                              : "border-white/30 bg-white/20 hover:border-white/50 hover:bg-white/30"
                          }`}
                        >
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                            >
                              <svg
                                className="w-4 h-4 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </motion.div>
                          )}
                          <div className="flex flex-col items-center justify-center h-full w-full">
                            <span
                              className={`text-sm sm:text-base md:text-lg font-medium break-words word-wrap text-center px-2 py-1 whitespace-normal leading-tight ${
                                isSelected ? "text-green-300" : "text-white"
                              }`}
                            >
                              {option.label}
                            </span>
                            <span
                              className={`text-xs sm:text-sm font-semibold mt-1 ${
                                isSelected ? "text-green-200" : "text-white/70"
                              }`}
                            >
                              {option.points} {option.points === 0 || option.points === 1 ? 'point' : 'points'}
                            </span>
                          </div>
                        </motion.div>
                      );
                    }
                  )}
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-3 bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-lg relative z-10"
                  >
                    <p className="text-red-100 font-medium text-center">
                      {error}
                    </p>
                  </motion.div>
                )}
              </AnimatedCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-8 sm:mt-10 mb-12 sm:mb-16 w-full max-w-full sm:max-w-2xl mx-auto gap-2 sm:gap-0 px-4 py-4 pb-8 sm:pb-12">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className={`text-xs sm:text-sm px-3 sm:px-4 py-2 order-3 sm:order-1 w-full sm:w-auto ${
              currentStep === 0 ? "opacity-0 pointer-events-none" : ""
            }`}
            icon={
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            }
          >
            Previous
          </Button>

          <div className="flex space-x-2 order-1 sm:order-2">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
                  i <= currentStep ? "bg-blue-500 scale-110" : "bg-slate-300"
                }`}
              />
            ))}
          </div>

          <Button
            onClick={handleNext}
            loading={isLoading}
            className="text-xs sm:text-sm px-3 sm:px-4 py-2 order-2 sm:order-3 w-full sm:w-auto"
            icon={
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            }
          >
            {currentStep === criteria.length ? "Review" : "Next"}
          </Button>
        </div>

        {/* Review Modal */}
        <AnimatePresence>
          {showReviewModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-xs sm:max-w-lg md:max-w-2xl w-full max-h-[85vh] sm:max-h-[80vh] overflow-hidden mx-2 flex flex-col"
              >
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-4 sm:px-6 md:px-8 py-4 sm:py-6 text-white">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold break-words">
                    Review Your Responses
                  </h2>
                  <p className="text-blue-100 text-sm sm:text-base">
                    Please verify all information before submitting
                  </p>
                </div>

                <div className="p-4 sm:p-6 md:p-8 flex-1 overflow-y-auto">
                  <div className="mb-6 p-4 bg-blue-50 rounded-xl">
                    <h3 className="font-bold text-slate-800 mb-1">
                      Customer Information
                    </h3>
                    <p className="text-slate-600">{name}</p>
                  </div>

                  <div className="space-y-4">
                    {criteria.map((c) => {
                      const isMultiple = selectionConfig[c.id] === "multiple";
                      const currentResponse = responses[c.id];

                      let displayText = "Not answered";
                      if (currentResponse) {
                        if (isMultiple && Array.isArray(currentResponse)) {
                          const selectedOptions = c.options.filter((o) =>
                            currentResponse.includes(o.id)
                          );
                          displayText = selectedOptions
                            .map((o) => o.label)
                            .join(", ");
                        } else if (!isMultiple) {
                          const selectedOption = c.options.find(
                            (o) => o.id === currentResponse
                          );
                          displayText = selectedOption?.label || "Not answered";
                        }
                      }

                      return (
                        <div
                          key={c.id}
                          className="p-4 border border-slate-200 rounded-xl"
                        >
                          <h4 className="font-semibold text-slate-800 mb-2">
                            {c.category}
                            {isMultiple && (
                              <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                                Multiple Selection
                              </span>
                            )}
                          </h4>
                          <p className="text-slate-600">{displayText}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex-shrink-0 px-4 sm:px-6 md:px-8 py-4 sm:py-6 bg-slate-50 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 border-t border-slate-200">
                  <Button
                    variant="outline"
                    onClick={() => setShowReviewModal(false)}
                    className="w-full sm:w-auto text-sm sm:text-base px-4 py-3 sm:py-2 min-h-[44px] font-medium"
                  >
                    Go Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    loading={isLoading}
                    className="w-full sm:w-auto text-sm sm:text-base px-4 py-3 sm:py-2 min-h-[44px] font-medium bg-blue-600 hover:bg-blue-700"
                  >
                    Submit Assessment
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result Modal */}
        <AnimatePresence>
          {showModal && result && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-xs sm:max-w-sm md:max-w-md w-full text-center p-4 sm:p-6 md:p-8 mx-2"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
                >
                  {getRiskIcon(result.riskLevel)}
                </motion.div>

                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800 mb-4 break-words">
                  Assessment Complete!
                </h2>

                <div className="space-y-4 mb-8">
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-sm text-slate-600 mb-1">Risk Level</p>
                    <p
                      className={`text-lg sm:text-xl md:text-2xl font-bold ${getRiskColor(
                        result.riskLevel
                      )}`}
                    >
                      {result.riskLevel}
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-sm text-slate-600 mb-1">Total Score</p>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800">
                      {result.totalScore}
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleCloseModal}
                  className="w-full text-sm sm:text-base px-4 py-2"
                  size="lg"
                >
                  Start New Assessment
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
