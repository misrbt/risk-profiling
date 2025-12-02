import React, { useState, useEffect } from "react";
import axios from "axios";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import { API_BASE_URL, API_ENDPOINTS } from "./config/constants";
import { riskSettingsService } from "./services/riskSettingsService";

function RiskForm() {
  const [criteria, setCriteria] = useState([]);
  const [responses, setResponses] = useState({});
  const [selectionConfig, setSelectionConfig] = useState({});
  const [name, setName] = useState("");
  const [result, setResult] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [error, setError] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [completedStepsCount, setCompletedStepsCount] = useState(0);

  useEffect(() => {
    // Create authenticated axios instance
    const authAxios = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    // Fetch both criteria and selection configuration
    Promise.all([
      authAxios.get(API_ENDPOINTS.CRITERIA),
      riskSettingsService.selectionConfig.getAll()
    ])
      .then(([criteriaRes, configRes]) => {
        setCriteria(criteriaRes.data);
        if (configRes?.success && configRes?.data) {
          setSelectionConfig(configRes.data);
        }
      })
      .catch((err) => {
        console.error("Error fetching data", err);
        // If selection config fails, just load criteria
        authAxios
          .get(API_ENDPOINTS.CRITERIA)
          .then((res) => setCriteria(res.data))
          .catch((err) => console.error("Error fetching criteria", err));
      });
  }, []);

  const handleSelect = (criteriaId, optionId) => {
    const isMultiple = selectionConfig[criteriaId] === "multiple";

    if (isMultiple) {
      // Handle multiple selection (checkboxes)
      setResponses((prev) => {
        const current = prev[criteriaId] || [];
        const isCurrentlySelected = Array.isArray(current)
          ? current.includes(optionId)
          : current === optionId;

        if (isCurrentlySelected) {
          // Remove from selection
          return {
            ...prev,
            [criteriaId]: current.filter((id) => id !== optionId),
          };
        } else {
          // Add to selection
          return {
            ...prev,
            [criteriaId]: Array.isArray(current)
              ? [...current, optionId]
              : [optionId],
          };
        }
      });
    } else {
      // Handle single selection (radio)
      setResponses((prev) => ({
        ...prev,
        [criteriaId]: optionId,
      }));
    }
  };

  const handleSubmit = () => {
    // Flatten responses for submission
    const allSelectedOptionIds = Object.values(responses).flat();

    // Create authenticated axios instance
    const authAxios = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    authAxios
      .post(API_ENDPOINTS.CREATE_CUSTOMER, {
        name,
        responses: allSelectedOptionIds,
      })
      .then((res) => {
        setResult({
          riskLevel: res.data.risk_level,
          totalScore: res.data.total_score,
        });
        setShowReviewModal(false);
        setShowModal(true);
      })
      .catch(() => {
        setError("Failed to save data.");
      });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setName("");
    setResponses({});
    setResult(null);
    setError("");
    setCurrentStep(0);
    setCompletedStepsCount(0);
  };

  const getRiskColor = (risk) => {
    if (risk === "HIGH RISK") return "text-red-600 font-extrabold";
    if (risk === "MODERATE RISK") return "text-yellow-500 font-extrabold";
    return "text-green-600 font-extrabold";
  };

  const handleNext = () => {
    if (currentStep === 0) {
      if (!name.trim()) {
        setError("Customer name is required.");
        return;
      }
      setError("");
      setCurrentStep(1);
      setCompletedStepsCount(1);
      return;
    }

    const currentCriteria = criteria[currentStep - 1];
    const currentResponse = responses[currentCriteria.id];
    const isMultiple = selectionConfig[currentCriteria.id] === "multiple";

    // Validation: Check if at least one option is selected
    if (
      !currentResponse ||
      (Array.isArray(currentResponse) && currentResponse.length === 0)
    ) {
      setError(
        isMultiple
          ? "Please select at least one option before proceeding."
          : "Please select an option before proceeding."
      );
      return;
    }
    setError("");

    if (currentStep < criteria.length) {
      setCurrentStep((prev) => prev + 1);
      setCompletedStepsCount((prev) => prev + 1);
    } else {
      setShowReviewModal(true);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      setError("");
    }
  };

  const totalSteps = criteria.length + 1;
  const progress =
    totalSteps > 0
      ? Math.min(100, Math.round((completedStepsCount / totalSteps) * 100))
      : 0;

  return (
    <div className="min-h-screen w-full overflow-x-hidden flex flex-col items-center justify-center bg-gray-50 p-2 sm:p-4 md:p-6">
      {criteria.length > 0 && (
        <div
          className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <div
            className="bg-blue-600 h-full transition-all duration-500 ease-in-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}

      {criteria.length > 0 && (
        <div className="fixed top-2 left-2 sm:top-4 sm:left-4 z-50 text-sm sm:text-lg md:text-xl font-bold text-gray-700 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-md max-w-[80px] truncate">
          {progress}%
        </div>
      )}
      <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 md:mb-8 text-blue-800 text-center drop-shadow-sm px-2 w-full max-w-full break-words">
        Client Risk Profile
      </h1>

      {currentStep === 0 && (
        <div className="relative flex items-center justify-center w-full max-w-full sm:max-w-4xl h-auto min-h-[250px] sm:min-h-[300px] overflow-hidden px-2">
          <div className="absolute left-0 sm:-left-8 bottom-0 -translate-y-1/2 opacity-0 hidden">
            <ChevronLeftIcon className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" />
          </div>

          <div className="flex flex-col items-center text-center w-full max-w-full px-2 sm:px-4 md:px-8 lg:px-12">
            <h2 className="text-lg sm:text-xl md:text-2xl font-semibold mb-4 sm:mb-6 w-full max-w-full break-words">
              Client Name
            </h2>
            <div className="w-full max-w-full flex mb-6 sm:mb-10 justify-center">
              <input
                type="text"
                placeholder="ex. Juan S. Dela cruz"
                className={`w-full max-w-xs sm:max-w-sm md:max-w-md px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-sm sm:text-base md:text-lg rounded-lg sm:rounded-xl border-2 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  error
                    ? "border-red-500 bg-red-50 focus:ring-red-500"
                    : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                }`}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            {error && (
              <p className="text-red-500 mt-2 sm:mt-3 text-sm sm:text-base md:text-lg text-center">
                {error}
              </p>
            )}
          </div>

          <ChevronRightIcon
            onClick={handleNext}
            className="absolute right-1 sm:right-2 md:-right-8 top-1/2 -translate-y-1/2 w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-gray-500 hover:text-blue-600 cursor-pointer transition-colors duration-200 bg-white/80 backdrop-blur-sm rounded-full p-1 flex-shrink-0"
          />
        </div>
      )}

      {currentStep > 0 && criteria.length > 0 && (
        <div className="relative flex flex-col items-center justify-center w-full max-w-full sm:max-w-6xl min-h-[250px] sm:min-h-[300px] px-1 sm:px-2 md:px-4 lg:px-8 overflow-hidden">
          <ChevronLeftIcon
            onClick={handlePrev}
            className="absolute left-1 sm:left-2 md:-left-8 top-1/2 -translate-y-1/2 w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-gray-500 hover:text-blue-600 cursor-pointer transition-colors duration-200 bg-white/80 backdrop-blur-sm rounded-full p-1 z-10 flex-shrink-0"
          />

          <div className="flex flex-col items-center text-center w-full max-w-full px-4 sm:px-6 md:px-8">
            <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold mb-2 sm:mb-3 px-1 w-full max-w-full break-words text-center">
              {criteria[currentStep - 1]?.category}
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mb-4">
              {selectionConfig[criteria[currentStep - 1]?.id] === "multiple"
                ? "Select all that apply"
                : "Select one option"}
            </p>
            <div
              className={`grid gap-2 sm:gap-3 md:gap-4 w-full max-w-full sm:max-w-4xl overflow-hidden ${
                criteria[currentStep - 1]?.options.length > 4
                  ? "grid-cols-1 sm:grid-cols-2"
                  : "grid-cols-1 sm:grid-cols-2"
              }`}
            >
              {(criteria[currentStep - 1]?.options ?? []).map((o) => {
                const currentCriteria = criteria[currentStep - 1];
                const isMultiple =
                  selectionConfig[currentCriteria.id] === "multiple";
                const currentResponse = responses[currentCriteria.id];
                const isSelected = isMultiple
                  ? Array.isArray(currentResponse) &&
                    currentResponse.includes(o.id)
                  : currentResponse === o.id;

                return (
                  <div
                    key={o.id}
                    onClick={() => handleSelect(currentCriteria.id, o.id)}
                    className={`cursor-pointer py-2 sm:py-3 md:py-4 px-2 sm:px-3 text-xs sm:text-sm md:text-base min-h-[50px] sm:min-h-[60px] md:min-h-[80px] flex flex-col items-center justify-center text-center rounded-lg sm:rounded-xl border-2 transition-all duration-200 shadow-md w-full max-w-full relative ${
                      isSelected
                        ? "border-green-600 bg-green-200 scale-105 shadow-lg"
                        : "border-gray-300 hover:border-green-400 hover:bg-green-50 hover:scale-102"
                    }`}
                  >
                    {/* Checkbox/Radio indicator */}
                    {isMultiple && (
                      <div
                        className={`absolute top-2 left-2 w-5 h-5 rounded border-2 flex items-center justify-center ${
                          isSelected
                            ? "bg-green-600 border-green-600"
                            : "bg-white border-gray-400"
                        }`}
                      >
                        {isSelected && (
                          <svg
                            className="w-3 h-3 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                    )}
                    <span className="break-words leading-tight hyphens-auto text-center px-1">
                      {o.label}
                    </span>
                    <span
                      className={`text-xs mt-1 font-semibold ${
                        isSelected ? "text-green-700" : "text-gray-500"
                      }`}
                    >
                      {o.points}{" "}
                      {o.points === 0 || o.points === 1 ? "point" : "points"}
                    </span>
                  </div>
                );
              })}
            </div>
            {error && (
              <p className="text-red-500 mt-2 sm:mt-3 text-sm sm:text-base md:text-lg text-center px-2">
                {error}
              </p>
            )}
          </div>

          <ChevronRightIcon
            onClick={handleNext}
            className="absolute right-1 sm:right-2 md:-right-8 top-1/2 -translate-y-1/2 w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-gray-500 hover:text-blue-600 cursor-pointer transition-colors duration-200 bg-white/80 backdrop-blur-sm rounded-full p-1 z-10 flex-shrink-0"
          />
        </div>
      )}

      {showReviewModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-2 sm:p-4 overflow-x-hidden">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-xs sm:max-w-lg md:max-w-2xl w-full max-h-[90vh] overflow-y-auto p-3 sm:p-4 md:p-6 mx-2">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold mb-3 sm:mb-4 text-center">
              Review Your Responses
            </h2>
            <p className="mb-3 sm:mb-4 text-sm sm:text-base md:text-lg">
              <strong>Customer Name:</strong> {name}
            </p>
            <div className="mb-4 sm:mb-6 max-h-60 sm:max-h-80 overflow-y-auto">
              <ul className="space-y-2 sm:space-y-3">
                {criteria.map((c) => {
                  const isMultiple = selectionConfig[c.id] === "multiple";
                  const currentResponse = responses[c.id];

                  let displayText = "Not answered";

                  if (isMultiple && Array.isArray(currentResponse)) {
                    const selectedOptions = c.options.filter((o) =>
                      currentResponse.includes(o.id)
                    );
                    if (selectedOptions.length > 0) {
                      displayText = selectedOptions
                        .map((o) => o.label)
                        .join(", ");
                    }
                  } else {
                    const selectedOption = c.options.find(
                      (o) => o.id === currentResponse
                    );
                    if (selectedOption) {
                      displayText = selectedOption.label;
                    }
                  }

                  return (
                    <li
                      key={c.id}
                      className="text-sm sm:text-base border-b border-gray-200 pb-2"
                    >
                      <strong className="block sm:inline">{c.category}:</strong>{" "}
                      <span className="text-gray-700">{displayText}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="flex flex-col sm:flex-row justify-center sm:justify-end gap-2 sm:gap-4">
              <button
                onClick={() => setShowReviewModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-black px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base transition-colors duration-200 order-2 sm:order-1"
              >
                Go Back
              </button>
              <button
                onClick={handleSubmit}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base transition-colors duration-200 order-1 sm:order-2"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && result && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-2 sm:p-4 overflow-x-hidden">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-xs sm:max-w-sm md:max-w-md w-full p-3 sm:p-4 md:p-6 text-center mx-2">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold mb-3 sm:mb-4">
              Risk Profiling Complete!
            </h2>
            <p className="text-base sm:text-lg md:text-xl mb-2 sm:mb-3">
              <strong>Risk Level: </strong>
              <span className={getRiskColor(result.riskLevel)}>
                {result.riskLevel}
              </span>
            </p>
            <p className="mb-4 sm:mb-6 text-base sm:text-lg md:text-xl">
              <strong>Total Score: </strong>
              {result.totalScore}
            </p>
            <button
              onClick={handleCloseModal}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 text-base sm:text-lg md:text-xl rounded-lg sm:rounded-xl transition-colors duration-200 min-w-[100px]"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default RiskForm;
