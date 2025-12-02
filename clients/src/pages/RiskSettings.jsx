import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, Button, LoadingSpinner } from "../components/ui";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { riskSettingsService } from "../services/riskSettingsService";
import Swal from "sweetalert2";

export default function RiskSettings() {
  // Helper function for proper singular/plural grammar
  const formatPoints = (points) => {
    const numPoints = parseInt(points);
    return `${numPoints} ${numPoints === 1 ? "point" : "points"}`;
  };

  // State for active tab
  const [activeTab, setActiveTab] = useState("criteria");

  // State for Risk Level Thresholds
  const [riskThresholds, setRiskThresholds] = useState({
    low_threshold: 10,
    moderate_threshold: 16,
    high_threshold: 19,
  });
  const [thresholdsLoading, setThresholdsLoading] = useState(false);
  const [showThresholdModal, setShowThresholdModal] = useState(false);
  const [thresholdForm, setThresholdForm] = useState({
    low_threshold: 10,
    moderate_threshold: 16,
    high_threshold: 19,
  });

  // State for Selection Configuration
  const [selectionConfig, setSelectionConfig] = useState({});
  const [selectionLoading, setSelectionLoading] = useState(false);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [editingSelection, setEditingSelection] = useState(null);
  const [selectionForm, setSelectionForm] = useState({
    criteria_id: "",
    selection_type: "single", // default: single, multiple
  });

  // State for Criteria
  const [criteria, setCriteria] = useState([]);
  const [criteriaLoading, setCriteriaLoading] = useState(false);
  const [showCriteriaModal, setShowCriteriaModal] = useState(false);
  const [editingCriteria, setEditingCriteria] = useState(null);
  const [criteriaForm, setCriteriaForm] = useState({ category: "" });

  // State for Options
  const [options, setOptions] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [editingOption, setEditingOption] = useState(null);
  const [optionForm, setOptionForm] = useState({
    label: "",
    points: "",
    criteria_id: "",
  });
  const [selectedCriteriaId, setSelectedCriteriaId] = useState("");

  // Data table state
  const [criteriaSearch, setCriteriaSearch] = useState("");
  const [criteriaPageSize, setCriteriaPageSize] = useState(10);
  const [criteriaCurrentPage, setCriteriaCurrentPage] = useState(1);

  const [optionsSearch, setOptionsSearch] = useState("");
  const [optionsPageSize, setOptionsPageSize] = useState(10);
  const [optionsCurrentPage, setOptionsCurrentPage] = useState(1);

  // Load data on component mount
  useEffect(() => {
    const initializeData = async () => {
      await loadCriteria();
      await loadSelectionConfig();
    };

    initializeData();
  }, []);

  // Load criteria from API
  const loadCriteria = async () => {
    setCriteriaLoading(true);
    try {
      const response = await riskSettingsService.criteria.getAll();
      setCriteria(response.data || []);
    } catch (error) {
      console.error("Error loading criteria:", error);

      // Check if it's an authentication error
      if (
        error.message.includes("401") ||
        error.message.includes("Unauthorized")
      ) {
        Swal.fire({
          title: "Authentication Error",
          text: "Please log in again to access risk settings.",
          icon: "warning",
          confirmButtonColor: "#3b82f6",
        }).then(() => {
          window.location.href = "/login";
        });
      } else if (
        error.message.includes("403") ||
        error.message.includes("Forbidden")
      ) {
        Swal.fire({
          title: "Access Denied",
          text: "You need admin or compliance officer privileges to access risk settings.",
          icon: "warning",
          confirmButtonColor: "#3b82f6",
        });
      } else {
        Swal.fire({
          title: "Error",
          text: `Failed to load criteria: ${error.message}`,
          icon: "error",
          confirmButtonColor: "#3b82f6",
        });
      }
    } finally {
      setCriteriaLoading(false);
    }
  };

  // Load options from API
  const loadOptions = async (criteriaId = null) => {
    setOptionsLoading(true);
    try {
      const response = await riskSettingsService.options.getAll(criteriaId);
      setOptions(response.data || []);
    } catch (error) {
      console.error("Error loading options:", error);

      // Check if it's an authentication error
      if (
        error.message.includes("401") ||
        error.message.includes("Unauthorized")
      ) {
        Swal.fire({
          title: "Authentication Error",
          text: "Please log in again to access risk settings.",
          icon: "warning",
          confirmButtonColor: "#3b82f6",
        }).then(() => {
          window.location.href = "/login";
        });
      } else if (
        error.message.includes("403") ||
        error.message.includes("Forbidden")
      ) {
        Swal.fire({
          title: "Access Denied",
          text: "You need admin or compliance officer privileges to access risk settings.",
          icon: "warning",
          confirmButtonColor: "#3b82f6",
        });
      } else {
        Swal.fire({
          title: "Error",
          text: `Failed to load options: ${error.message}`,
          icon: "error",
          confirmButtonColor: "#3b82f6",
        });
      }
    } finally {
      setOptionsLoading(false);
    }
  };

  // Load selection configuration from API
  const loadSelectionConfig = async () => {
    setSelectionLoading(true);
    try {
      const response = await riskSettingsService.selectionConfig.getAll();
      setSelectionConfig(response.data || {});
    } catch (error) {
      console.error("Error loading selection config:", error);
      setSelectionConfig({});
    } finally {
      setSelectionLoading(false);
    }
  };

  // Save selection configuration to API
  const saveSelectionConfig = async () => {
    setSelectionLoading(true);
    try {
      const response = await riskSettingsService.selectionConfig.save({
        config: selectionConfig,
      });

      Swal.fire({
        title: "Success!",
        text: "Selection configuration saved successfully.",
        icon: "success",
        confirmButtonColor: "#3b82f6",
      });

      return response;
    } catch (error) {
      console.error("Error saving selection config:", error);

      Swal.fire({
        title: "Error",
        text: error.message || "Failed to save selection configuration",
        icon: "error",
        confirmButtonColor: "#3b82f6",
      });

      throw error;
    } finally {
      setSelectionLoading(false);
    }
  };

  // Load options when switching to options tab or criteria filter changes
  useEffect(() => {
    if (activeTab === "options") {
      loadOptions(selectedCriteriaId || null);
    }
  }, [selectedCriteriaId, activeTab]);

  // Criteria CRUD functions
  const handleCreateCriteria = () => {
    setEditingCriteria(null);
    setCriteriaForm({ category: "" });
    setShowCriteriaModal(true);
  };

  const handleEditCriteria = (criteria) => {
    setEditingCriteria(criteria);
    setCriteriaForm({ category: criteria.category });
    setShowCriteriaModal(true);
  };

  const handleDeleteCriteria = async (id, categoryName) => {
    const result = await Swal.fire({
      title: "Delete Criteria",
      text: `Are you sure you want to delete "${categoryName}"? This will also delete all associated options.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      setCriteriaLoading(true);
      try {
        await riskSettingsService.criteria.delete(id);
        await loadCriteria();
        await loadOptions();
        Swal.fire({
          title: "Deleted!",
          text: "Criteria has been deleted successfully.",
          icon: "success",
          confirmButtonColor: "#3b82f6",
          timer: 3000,
          timerProgressBar: true,
          showConfirmButton: false,
        });
      } catch (error) {
        console.error("Error deleting criteria:", error);
        Swal.fire({
          title: "Error",
          text: "Failed to delete criteria. Please try again.",
          icon: "error",
          confirmButtonColor: "#3b82f6",
        });
      } finally {
        setCriteriaLoading(false);
      }
    }
  };

  const handleSaveCriteria = async () => {
    if (!criteriaForm.category.trim()) {
      Swal.fire({
        title: "Validation Error",
        text: "Please enter a category name.",
        icon: "warning",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    setCriteriaLoading(true);
    try {
      if (editingCriteria) {
        await riskSettingsService.criteria.update(editingCriteria.id, {
          category: criteriaForm.category.trim(),
        });
        Swal.fire({
          title: "Success!",
          text: "Criteria updated successfully.",
          icon: "success",
          confirmButtonColor: "#3b82f6",
          timer: 3000,
          timerProgressBar: true,
          showConfirmButton: false,
        });
      } else {
        await riskSettingsService.criteria.create({
          category: criteriaForm.category.trim(),
        });
        Swal.fire({
          title: "Success!",
          text: "Criteria created successfully.",
          icon: "success",
          confirmButtonColor: "#3b82f6",
          timer: 3000,
          timerProgressBar: true,
          showConfirmButton: false,
        });
      }
      setShowCriteriaModal(false);
      await loadCriteria();
      if (activeTab === "options") {
        await loadOptions();
      }
    } catch (error) {
      console.error("Error saving criteria:", error);
      if (error.errors && error.errors.category) {
        Swal.fire({
          title: "Validation Error",
          text: error.errors.category[0],
          icon: "warning",
          confirmButtonColor: "#3b82f6",
        });
      } else {
        Swal.fire({
          title: "Error",
          text: error.message || "Failed to save criteria. Please try again.",
          icon: "error",
          confirmButtonColor: "#3b82f6",
        });
      }
    } finally {
      setCriteriaLoading(false);
    }
  };

  // Options CRUD functions
  const handleCreateOption = () => {
    setEditingOption(null);
    setOptionForm({ label: "", points: "", criteria_id: "" });
    setShowOptionsModal(true);
  };

  const handleEditOption = (option) => {
    setEditingOption(option);
    setOptionForm({
      label: option.label,
      points: option.points.toString(),
      criteria_id: option.criteria_id.toString(),
    });
    setShowOptionsModal(true);
  };

  const handleDeleteOption = async (id, optionLabel) => {
    const result = await Swal.fire({
      title: "Delete Option",
      text: `Are you sure you want to delete "${optionLabel}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      setOptionsLoading(true);
      try {
        await riskSettingsService.options.delete(id);
        await loadOptions(selectedCriteriaId || null);
        Swal.fire({
          title: "Deleted!",
          text: "Option has been deleted successfully.",
          icon: "success",
          confirmButtonColor: "#3b82f6",
          timer: 3000,
          timerProgressBar: true,
          showConfirmButton: false,
        });
      } catch (error) {
        console.error("Error deleting option:", error);
        Swal.fire({
          title: "Error",
          text: "Failed to delete option. Please try again.",
          icon: "error",
          confirmButtonColor: "#3b82f6",
        });
      } finally {
        setOptionsLoading(false);
      }
    }
  };

  const handleSaveOption = async () => {
    if (
      !optionForm.label.trim() ||
      !optionForm.points ||
      !optionForm.criteria_id
    ) {
      Swal.fire({
        title: "Validation Error",
        text: "Please fill in all fields.",
        icon: "warning",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    setOptionsLoading(true);
    try {
      const payload = {
        label: optionForm.label.trim(),
        points: parseInt(optionForm.points),
        criteria_id: parseInt(optionForm.criteria_id),
      };

      if (editingOption) {
        await riskSettingsService.options.update(editingOption.id, payload);
        Swal.fire({
          title: "Success!",
          text: "Option updated successfully.",
          icon: "success",
          confirmButtonColor: "#3b82f6",
          timer: 3000,
          timerProgressBar: true,
          showConfirmButton: false,
        });
      } else {
        await riskSettingsService.options.create(payload);
        Swal.fire({
          title: "Success!",
          text: "Option created successfully.",
          icon: "success",
          confirmButtonColor: "#3b82f6",
          timer: 3000,
          timerProgressBar: true,
          showConfirmButton: false,
        });
      }
      setShowOptionsModal(false);
      await loadOptions(selectedCriteriaId || null);
    } catch (error) {
      console.error("Error saving option:", error);
      if (error.errors) {
        const errorMessages = Object.values(error.errors).flat().join("\n");
        Swal.fire({
          title: "Validation Error",
          text: errorMessages,
          icon: "warning",
          confirmButtonColor: "#3b82f6",
        });
      } else {
        Swal.fire({
          title: "Error",
          text: error.message || "Failed to save option. Please try again.",
          icon: "error",
          confirmButtonColor: "#3b82f6",
        });
      }
    } finally {
      setOptionsLoading(false);
    }
  };

  // Filter and paginate criteria
  const filteredAndPaginatedCriteria = useMemo(() => {
    // Filter by search
    const filtered = criteria.filter(
      (item) =>
        item.category.toLowerCase().includes(criteriaSearch.toLowerCase()) ||
        item.id.toString().includes(criteriaSearch)
    );

    // Calculate pagination
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / criteriaPageSize);
    const startIndex = (criteriaCurrentPage - 1) * criteriaPageSize;
    const endIndex = startIndex + criteriaPageSize;
    const paginatedData = filtered.slice(startIndex, endIndex);

    return {
      data: paginatedData,
      totalItems,
      totalPages,
      currentPage: criteriaCurrentPage,
      pageSize: criteriaPageSize,
    };
  }, [criteria, criteriaSearch, criteriaCurrentPage, criteriaPageSize]);

  // Filter and paginate options
  const filteredAndPaginatedOptions = useMemo(() => {
    // Filter by selected criteria and search
    let filtered = selectedCriteriaId
      ? options.filter((o) => o.criteria_id === parseInt(selectedCriteriaId))
      : options;

    // Apply search filter
    filtered = filtered.filter(
      (item) =>
        item.label.toLowerCase().includes(optionsSearch.toLowerCase()) ||
        item.criteria_category
          .toLowerCase()
          .includes(optionsSearch.toLowerCase()) ||
        item.id.toString().includes(optionsSearch) ||
        item.points.toString().includes(optionsSearch)
    );

    // Calculate pagination
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / optionsPageSize);
    const startIndex = (optionsCurrentPage - 1) * optionsPageSize;
    const endIndex = startIndex + optionsPageSize;
    const paginatedData = filtered.slice(startIndex, endIndex);

    return {
      data: paginatedData,
      totalItems,
      totalPages,
      currentPage: optionsCurrentPage,
      pageSize: optionsPageSize,
    };
  }, [
    options,
    selectedCriteriaId,
    optionsSearch,
    optionsCurrentPage,
    optionsPageSize,
  ]);

  // Reset pagination when search changes
  useEffect(() => {
    setCriteriaCurrentPage(1);
  }, [criteriaSearch, criteriaPageSize]);

  useEffect(() => {
    setOptionsCurrentPage(1);
  }, [optionsSearch, optionsPageSize, selectedCriteriaId]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Risk Settings</h1>
          <p className="mt-2 text-gray-600">
            Manage risk assessment criteria and their options
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("criteria")}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "criteria"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Criteria Management
            </button>
            <button
              onClick={() => setActiveTab("options")}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "options"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Options Management
            </button>
            <button
              onClick={() => setActiveTab("thresholds")}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "thresholds"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Risk Level Configuration
            </button>
            <button
              onClick={() => setActiveTab("selection")}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "selection"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Selection Configuration
            </button>
          </nav>
        </div>

        {/* Criteria Tab */}
        {activeTab === "criteria" && (
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Risk Assessment Criteria
              </h2>
              <Button
                onClick={handleCreateCriteria}
                className="flex items-center space-x-2"
                disabled={criteriaLoading}
              >
                <PlusIcon className="w-4 h-4" />
                <span>Add New Criteria</span>
              </Button>
            </div>

            {/* Search and Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search criteria..."
                    value={criteriaSearch}
                    onChange={(e) => setCriteriaSearch(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={criteriaPageSize}
                  onChange={(e) =>
                    setCriteriaPageSize(parseInt(e.target.value))
                  }
                  className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={5}>Show 5</option>
                  <option value={10}>Show 10</option>
                  <option value={20}>Show 20</option>
                  <option value={50}>Show 50</option>
                </select>
              </div>
              <div className="text-sm text-gray-500">
                Showing{" "}
                {(filteredAndPaginatedCriteria.currentPage - 1) *
                  filteredAndPaginatedCriteria.pageSize +
                  1}{" "}
                to{" "}
                {Math.min(
                  filteredAndPaginatedCriteria.currentPage *
                    filteredAndPaginatedCriteria.pageSize,
                  filteredAndPaginatedCriteria.totalItems
                )}{" "}
                of {filteredAndPaginatedCriteria.totalItems} entries
              </div>
            </div>

            {criteriaLoading ? (
              <div className="flex justify-center items-center py-8">
                <LoadingSpinner size="lg" text="Loading criteria..." />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Options Count
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Updated
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAndPaginatedCriteria.data.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {item.options_count || 0} options
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.created_at}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.updated_at}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleEditCriteria(item)}
                            className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                          >
                            <PencilIcon className="w-4 h-4 mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteCriteria(item.id, item.category)
                            }
                            className="text-red-600 hover:text-red-900 inline-flex items-center"
                            disabled={criteriaLoading}
                          >
                            <TrashIcon className="w-4 h-4 mr-1" />
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredAndPaginatedCriteria.data.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    {criteria.length === 0
                      ? "No criteria found. Create your first criteria to get started."
                      : "No criteria match your search criteria."}
                  </div>
                )}

                {/* Pagination */}
                {filteredAndPaginatedCriteria.totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
                    <div className="flex justify-between flex-1 sm:hidden">
                      <button
                        onClick={() =>
                          setCriteriaCurrentPage(
                            Math.max(1, criteriaCurrentPage - 1)
                          )
                        }
                        disabled={criteriaCurrentPage === 1}
                        className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() =>
                          setCriteriaCurrentPage(
                            Math.min(
                              filteredAndPaginatedCriteria.totalPages,
                              criteriaCurrentPage + 1
                            )
                          )
                        }
                        disabled={
                          criteriaCurrentPage ===
                          filteredAndPaginatedCriteria.totalPages
                        }
                        className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Page{" "}
                          <span className="font-medium">
                            {filteredAndPaginatedCriteria.currentPage}
                          </span>{" "}
                          of{" "}
                          <span className="font-medium">
                            {filteredAndPaginatedCriteria.totalPages}
                          </span>
                        </p>
                      </div>
                      <div>
                        <nav
                          className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                          aria-label="Pagination"
                        >
                          <button
                            onClick={() =>
                              setCriteriaCurrentPage(
                                Math.max(1, criteriaCurrentPage - 1)
                              )
                            }
                            disabled={criteriaCurrentPage === 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronLeftIcon
                              className="h-5 w-5"
                              aria-hidden="true"
                            />
                          </button>
                          {Array.from(
                            {
                              length: Math.min(
                                5,
                                filteredAndPaginatedCriteria.totalPages
                              ),
                            },
                            (_, i) => {
                              const pageNum =
                                Math.max(
                                  1,
                                  Math.min(
                                    filteredAndPaginatedCriteria.totalPages - 4,
                                    criteriaCurrentPage - 2
                                  )
                                ) + i;
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() =>
                                    setCriteriaCurrentPage(pageNum)
                                  }
                                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                    pageNum === criteriaCurrentPage
                                      ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                      : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            }
                          )}
                          <button
                            onClick={() =>
                              setCriteriaCurrentPage(
                                Math.min(
                                  filteredAndPaginatedCriteria.totalPages,
                                  criteriaCurrentPage + 1
                                )
                              )
                            }
                            disabled={
                              criteriaCurrentPage ===
                              filteredAndPaginatedCriteria.totalPages
                            }
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronRightIcon
                              className="h-5 w-5"
                              aria-hidden="true"
                            />
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        )}

        {/* Options Tab */}
        {activeTab === "options" && (
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Risk Assessment Options
              </h2>
              <div className="flex items-center space-x-4">
                <select
                  value={selectedCriteriaId}
                  onChange={(e) => setSelectedCriteriaId(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Criteria</option>
                  {criteria.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.category}
                    </option>
                  ))}
                </select>
                <Button
                  onClick={handleCreateOption}
                  className="flex items-center space-x-2"
                  disabled={optionsLoading}
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>Add New Option</span>
                </Button>
              </div>
            </div>

            {/* Search and Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search options..."
                    value={optionsSearch}
                    onChange={(e) => setOptionsSearch(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={optionsPageSize}
                  onChange={(e) => setOptionsPageSize(parseInt(e.target.value))}
                  className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={5}>Show 5</option>
                  <option value={10}>Show 10</option>
                  <option value={20}>Show 20</option>
                  <option value={50}>Show 50</option>
                </select>
              </div>
              <div className="text-sm text-gray-500">
                Showing{" "}
                {(filteredAndPaginatedOptions.currentPage - 1) *
                  filteredAndPaginatedOptions.pageSize +
                  1}{" "}
                to{" "}
                {Math.min(
                  filteredAndPaginatedOptions.currentPage *
                    filteredAndPaginatedOptions.pageSize,
                  filteredAndPaginatedOptions.totalItems
                )}{" "}
                of {filteredAndPaginatedOptions.totalItems} entries
              </div>
            </div>

            {optionsLoading ? (
              <div className="flex justify-center items-center py-8">
                <LoadingSpinner size="lg" text="Loading options..." />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Label
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Points
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Criteria
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAndPaginatedOptions.data.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.label}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {formatPoints(item.points)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.criteria_category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleEditOption(item)}
                            className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                          >
                            <PencilIcon className="w-4 h-4 mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteOption(item.id, item.label)
                            }
                            className="text-red-600 hover:text-red-900 inline-flex items-center"
                            disabled={optionsLoading}
                          >
                            <TrashIcon className="w-4 h-4 mr-1" />
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredAndPaginatedOptions.data.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    {options.length === 0
                      ? "No options found. Create your first option to get started."
                      : `No options found${
                          selectedCriteriaId ? " for selected criteria" : ""
                        } matching your search criteria.`}
                  </div>
                )}

                {/* Pagination */}
                {filteredAndPaginatedOptions.totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
                    <div className="flex justify-between flex-1 sm:hidden">
                      <button
                        onClick={() =>
                          setOptionsCurrentPage(
                            Math.max(1, optionsCurrentPage - 1)
                          )
                        }
                        disabled={optionsCurrentPage === 1}
                        className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() =>
                          setOptionsCurrentPage(
                            Math.min(
                              filteredAndPaginatedOptions.totalPages,
                              optionsCurrentPage + 1
                            )
                          )
                        }
                        disabled={
                          optionsCurrentPage ===
                          filteredAndPaginatedOptions.totalPages
                        }
                        className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Page{" "}
                          <span className="font-medium">
                            {filteredAndPaginatedOptions.currentPage}
                          </span>{" "}
                          of{" "}
                          <span className="font-medium">
                            {filteredAndPaginatedOptions.totalPages}
                          </span>
                        </p>
                      </div>
                      <div>
                        <nav
                          className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                          aria-label="Pagination"
                        >
                          <button
                            onClick={() =>
                              setOptionsCurrentPage(
                                Math.max(1, optionsCurrentPage - 1)
                              )
                            }
                            disabled={optionsCurrentPage === 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronLeftIcon
                              className="h-5 w-5"
                              aria-hidden="true"
                            />
                          </button>
                          {Array.from(
                            {
                              length: Math.min(
                                5,
                                filteredAndPaginatedOptions.totalPages
                              ),
                            },
                            (_, i) => {
                              const pageNum =
                                Math.max(
                                  1,
                                  Math.min(
                                    filteredAndPaginatedOptions.totalPages - 4,
                                    optionsCurrentPage - 2
                                  )
                                ) + i;
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => setOptionsCurrentPage(pageNum)}
                                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                    pageNum === optionsCurrentPage
                                      ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                      : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            }
                          )}
                          <button
                            onClick={() =>
                              setOptionsCurrentPage(
                                Math.min(
                                  filteredAndPaginatedOptions.totalPages,
                                  optionsCurrentPage + 1
                                )
                              )
                            }
                            disabled={
                              optionsCurrentPage ===
                              filteredAndPaginatedOptions.totalPages
                            }
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronRightIcon
                              className="h-5 w-5"
                              aria-hidden="true"
                            />
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        )}

        {/* Risk Level Thresholds Tab */}
        {activeTab === "thresholds" && (
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Risk Level Configuration
              </h2>
              <Button
                onClick={() => {
                  setThresholdForm({
                    low_threshold: riskThresholds.low_threshold,
                    moderate_threshold: riskThresholds.moderate_threshold,
                    high_threshold: riskThresholds.high_threshold,
                  });
                  setShowThresholdModal(true);
                }}
                className="flex items-center space-x-2"
                disabled={thresholdsLoading}
              >
                <PencilIcon className="w-4 h-4" />
                <span>Configure Thresholds</span>
              </Button>
            </div>

            <div className="space-y-6">
              {/* Current Configuration Display */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Current Risk Level Thresholds
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Low Risk */}
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="flex items-center justify-center mb-3">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-green-600"
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
                      </div>
                    </div>
                    <h4 className="text-center font-semibold text-green-800 mb-2">
                      Low Risk
                    </h4>
                    <p className="text-center text-sm text-gray-600 mb-2">
                      Points Range
                    </p>
                    <div className="text-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        Less than {riskThresholds.low_threshold} points
                      </span>
                    </div>
                  </div>

                  {/* Moderate Risk */}
                  <div className="bg-white rounded-lg p-4 border border-yellow-200">
                    <div className="flex items-center justify-center mb-3">
                      <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-yellow-600"
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
                      </div>
                    </div>
                    <h4 className="text-center font-semibold text-yellow-800 mb-2">
                      Moderate Risk
                    </h4>
                    <p className="text-center text-sm text-gray-600 mb-2">
                      Points Range
                    </p>
                    <div className="text-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                        {riskThresholds.low_threshold} to less than{" "}
                        {riskThresholds.moderate_threshold} points
                      </span>
                    </div>
                  </div>

                  {/* High Risk */}
                  <div className="bg-white rounded-lg p-4 border border-red-200">
                    <div className="flex items-center justify-center mb-3">
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-red-600"
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
                    </div>
                    <h4 className="text-center font-semibold text-red-800 mb-2">
                      High Risk
                    </h4>
                    <p className="text-center text-sm text-gray-600 mb-2">
                      Points Range
                    </p>
                    <div className="text-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                        {riskThresholds.moderate_threshold} or more points
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Information Section */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  How Risk Levels Work
                </h3>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <p>
                      <strong>Low Risk:</strong> Customers with less than{" "}
                      {riskThresholds.low_threshold} points are classified as
                      low risk.
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                    <p>
                      <strong>Moderate Risk:</strong> Customers with{" "}
                      {riskThresholds.low_threshold} to less than{" "}
                      {riskThresholds.moderate_threshold} points are classified
                      as moderate risk.
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                    <p>
                      <strong>High Risk:</strong> Customers with{" "}
                      {riskThresholds.moderate_threshold} or more points are
                      classified as high risk.
                    </p>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Changing these thresholds will affect
                    the risk classification of all existing and future customer
                    assessments.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Selection Configuration Tab */}
        {activeTab === "selection" && (
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Selection Type Configuration
              </h2>
              <Button
                onClick={() => {
                  setEditingSelection(null);
                  setSelectionForm({
                    criteria_id: "",
                    selection_type: "single",
                  });
                  setShowSelectionModal(true);
                }}
                className="flex items-center space-x-2"
                disabled={selectionLoading}
              >
                <PlusIcon className="w-4 h-4" />
                <span>Configure Selection Type</span>
              </Button>
            </div>

            <div className="space-y-6">
              {/* Information Section */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Selection Type Options
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Single Selection */}
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center justify-center mb-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-blue-600"
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
                      </div>
                    </div>
                    <h4 className="text-center font-semibold text-blue-800 mb-2">
                      Single Selection
                    </h4>
                    <p className="text-center text-sm text-gray-600 mb-3">
                      Default Mode
                    </p>
                    <div className="text-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Choose One Option
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Users can select only one option per criteria (radio
                      buttons)
                    </p>
                  </div>

                  {/* Multiple Selection */}
                  <div className="bg-white rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center justify-center mb-3">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-purple-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m0-8H9m0 0v8m0-8h6a2 2 0 012 2v6a2 2 0 01-2 2H9"
                          />
                        </svg>
                      </div>
                    </div>
                    <h4 className="text-center font-semibold text-purple-800 mb-2">
                      Multiple Selection
                    </h4>
                    <p className="text-center text-sm text-gray-600 mb-3">
                      Enhanced Mode
                    </p>
                    <div className="text-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        Choose Multiple Options
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Users can select multiple options per criteria
                      (checkboxes)
                    </p>
                  </div>
                </div>
              </div>

              {/* Current Configuration Table */}
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Current Selection Configuration
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Configure how users can select options for each criteria
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Criteria
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Options Count
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Selection Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {criteria.map((item) => {
                        const selectionType =
                          selectionConfig[item.id] || "single";
                        return (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.category}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {item.options_count || 0} options
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  selectionType === "multiple"
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {selectionType === "multiple"
                                  ? "Multiple Selection"
                                  : "Single Selection"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              <button
                                onClick={() => {
                                  setEditingSelection(item);
                                  setSelectionForm({
                                    criteria_id: item.id.toString(),
                                    selection_type: selectionType,
                                  });
                                  setShowSelectionModal(true);
                                }}
                                className="text-purple-600 hover:text-purple-900 inline-flex items-center"
                              >
                                <PencilIcon className="w-4 h-4 mr-1" />
                                Configure
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {criteria.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No criteria found. Create criteria first to configure
                      selection types.
                    </div>
                  )}
                </div>
              </div>

              {/* Information Box */}
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  How Selection Types Work
                </h3>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <p>
                      <strong>Single Selection (Default):</strong> Users can
                      select only one option per criteria. This is the standard
                      behavior for risk assessments where each criteria should
                      have one definitive answer.
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <p>
                      <strong>Multiple Selection:</strong> Users can select
                      multiple options per criteria. Useful for criteria where
                      multiple factors might apply simultaneously (e.g., income
                      sources, business activities).
                    </p>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Changing selection types will affect
                    how users interact with the risk assessment form. Existing
                    assessments will continue to work normally.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Criteria Modal */}
        <AnimatePresence>
          {showCriteriaModal && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Background Overlay */}
              <motion.div
                className="absolute inset-0 bg-black bg-opacity-60"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                onClick={() => setShowCriteriaModal(false)}
              />

              {/* Modal Content */}
              <motion.div
                className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full z-10"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
              >
                {/* Close Button */}
                <button
                  onClick={() => setShowCriteriaModal(false)}
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
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center pr-8">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <svg
                        className="w-4 h-4 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                        ></path>
                      </svg>
                    </div>
                    {editingCriteria ? "Edit Criteria" : "Add New Criteria"}
                  </h3>
                </div>

                {/* Modal Body */}
                <div className="px-6 py-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category Name
                      </label>
                      <input
                        type="text"
                        value={criteriaForm.category}
                        onChange={(e) =>
                          setCriteriaForm({
                            ...criteriaForm,
                            category: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Enter criteria category name"
                        autoFocus
                      />
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                  <div className="flex justify-end space-x-3">
                    <Button
                      variant="secondary"
                      onClick={() => setShowCriteriaModal(false)}
                      className="px-4 py-2"
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleSaveCriteria} className="px-4 py-2">
                      {editingCriteria ? "Update Criteria" : "Create Criteria"}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Options Modal */}
        <AnimatePresence>
          {showOptionsModal && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Background Overlay */}
              <motion.div
                className="absolute inset-0 bg-black bg-opacity-60"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                onClick={() => setShowOptionsModal(false)}
              />

              {/* Modal Content */}
              <motion.div
                className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full z-10"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
              >
                {/* Close Button */}
                <button
                  onClick={() => setShowOptionsModal(false)}
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
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-t-2xl">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center pr-8">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                      <svg
                        className="w-4 h-4 text-indigo-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m0-8H9m0 0v8m0-8h6a2 2 0 012 2v6a2 2 0 01-2 2H9"
                        ></path>
                      </svg>
                    </div>
                    {editingOption ? "Edit Option" : "Add New Option"}
                  </h3>
                </div>

                {/* Modal Body */}
                <div className="px-6 py-6">
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Criteria Category
                      </label>
                      <select
                        value={optionForm.criteria_id}
                        onChange={(e) =>
                          setOptionForm({
                            ...optionForm,
                            criteria_id: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white"
                      >
                        <option value="">Select criteria category</option>
                        {criteria.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.category}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Option Label
                      </label>
                      <input
                        type="text"
                        value={optionForm.label}
                        onChange={(e) =>
                          setOptionForm({
                            ...optionForm,
                            label: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        placeholder="Enter option label"
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Risk Points
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={optionForm.points}
                          onChange={(e) =>
                            setOptionForm({
                              ...optionForm,
                              points: e.target.value,
                            })
                          }
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-16 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                          placeholder="Enter points value"
                          min="1"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <span className="text-gray-400 text-sm">
                            {optionForm.points === "0" || optionForm.points === "1" ? "point" : "points"}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Higher points indicate higher risk
                      </p>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                  <div className="flex justify-end space-x-3">
                    <Button
                      variant="secondary"
                      onClick={() => setShowOptionsModal(false)}
                      className="px-4 py-2"
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleSaveOption} className="px-4 py-2">
                      {editingOption ? "Update Option" : "Create Option"}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Risk Threshold Modal */}
        <AnimatePresence>
          {showThresholdModal && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Background Overlay */}
              <motion.div
                className="absolute inset-0 bg-black bg-opacity-60"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                onClick={() => setShowThresholdModal(false)}
              />

              {/* Modal Content */}
              <motion.div
                className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full z-10"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
              >
                {/* Close Button */}
                <button
                  onClick={() => setShowThresholdModal(false)}
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
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-red-50 rounded-t-2xl">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center pr-8">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                      <svg
                        className="w-4 h-4 text-orange-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        ></path>
                      </svg>
                    </div>
                    Configure Risk Level Thresholds
                  </h3>
                </div>

                {/* Modal Body */}
                <div className="px-6 py-6">
                  <div className="space-y-6">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg
                            className="h-5 w-5 text-yellow-400"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-yellow-700">
                            Changing these thresholds will immediately affect
                            all customer risk classifications.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Low Risk Threshold (minimum points for moderate)
                      </label>
                      <input
                        type="number"
                        value={thresholdForm.low_threshold}
                        onChange={(e) =>
                          setThresholdForm({
                            ...thresholdForm,
                            low_threshold: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                        placeholder="Enter low risk threshold"
                        min="1"
                        autoFocus
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Customers with this many points or more will be
                        classified as moderate risk (instead of low risk).
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Moderate Risk Threshold (minimum points)
                      </label>
                      <input
                        type="number"
                        value={thresholdForm.moderate_threshold}
                        onChange={(e) =>
                          setThresholdForm({
                            ...thresholdForm,
                            moderate_threshold: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                        placeholder="Enter moderate risk threshold"
                        min={thresholdForm.low_threshold + 1}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Customers with this many points or more will be
                        classified as moderate risk (instead of low risk).
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        High Risk Threshold (minimum points)
                      </label>
                      <input
                        type="number"
                        value={thresholdForm.high_threshold}
                        onChange={(e) =>
                          setThresholdForm({
                            ...thresholdForm,
                            high_threshold: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                        placeholder="Enter high risk threshold"
                        min={thresholdForm.moderate_threshold + 1}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Customers with this many points or more will be
                        classified as high risk (instead of moderate risk).
                      </p>
                    </div>

                    {/* Preview */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">
                        Preview Risk Ranges
                      </h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-green-600 font-medium">
                            Low Risk:
                          </span>
                          <span>
                            Less than {thresholdForm.low_threshold} points
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-yellow-600 font-medium">
                            Moderate Risk:
                          </span>
                          <span>
                            {thresholdForm.low_threshold} to less than{" "}
                            {thresholdForm.moderate_threshold} points
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-red-600 font-medium">
                            High Risk:
                          </span>
                          <span>
                            {thresholdForm.moderate_threshold} to less than{" "}
                            {thresholdForm.high_threshold} points
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-red-900 font-medium">
                            Very High Risk:
                          </span>
                          <span>
                            {thresholdForm.high_threshold} or more points
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                  <div className="flex justify-end space-x-3">
                    <Button
                      variant="secondary"
                      onClick={() => setShowThresholdModal(false)}
                      className="px-4 py-2"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        setRiskThresholds({ ...thresholdForm });
                        setShowThresholdModal(false);
                        Swal.fire({
                          title: "Success!",
                          text: "Risk level thresholds updated successfully.",
                          icon: "success",
                          confirmButtonColor: "#3b82f6",
                          timer: 3000,
                          timerProgressBar: true,
                          showConfirmButton: false,
                        });
                      }}
                      className="px-4 py-2"
                      disabled={
                        thresholdForm.low_threshold >=
                          thresholdForm.moderate_threshold ||
                        thresholdForm.moderate_threshold >=
                          thresholdForm.high_threshold ||
                        thresholdForm.low_threshold < 1
                      }
                    >
                      Update Thresholds
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selection Configuration Modal */}
        <AnimatePresence>
          {showSelectionModal && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Background Overlay */}
              <motion.div
                className="absolute inset-0 bg-black bg-opacity-60"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                onClick={() => setShowSelectionModal(false)}
              />

              {/* Modal Content */}
              <motion.div
                className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full z-10"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
              >
                {/* Close Button */}
                <button
                  onClick={() => setShowSelectionModal(false)}
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
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-t-2xl">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center pr-8">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                      <svg
                        className="w-4 h-4 text-purple-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m0-8H9m0 0v8m0-8h6a2 2 0 012 2v6a2 2 0 01-2 2H9"
                        ></path>
                      </svg>
                    </div>
                    {editingSelection
                      ? `Configure ${editingSelection.category}`
                      : "Configure Selection Type"}
                  </h3>
                </div>

                {/* Modal Body */}
                <div className="px-6 py-6">
                  <div className="space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg
                            className="h-5 w-5 text-blue-400"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-blue-700">
                            Choose how users can interact with options for this
                            criteria.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Criteria
                      </label>
                      <select
                        value={selectionForm.criteria_id}
                        onChange={(e) =>
                          setSelectionForm({
                            ...selectionForm,
                            criteria_id: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors bg-white"
                        disabled={editingSelection !== null}
                      >
                        <option value="">Select criteria to configure</option>
                        {criteria.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.category} ({c.options_count || 0} options)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Selection Type
                      </label>
                      <div className="space-y-3">
                        <div className="flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              id="single-selection"
                              name="selection-type"
                              type="radio"
                              value="single"
                              checked={
                                selectionForm.selection_type === "single"
                              }
                              onChange={(e) =>
                                setSelectionForm({
                                  ...selectionForm,
                                  selection_type: e.target.value,
                                })
                              }
                              className="focus:ring-purple-500 h-4 w-4 text-purple-600 border-gray-300"
                            />
                          </div>
                          <div className="ml-3">
                            <label
                              htmlFor="single-selection"
                              className="font-medium text-gray-700"
                            >
                              Single Selection (Default)
                            </label>
                            <p className="text-gray-500 text-sm">
                              Users can choose only one option. Traditional
                              radio button behavior.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              id="multiple-selection"
                              name="selection-type"
                              type="radio"
                              value="multiple"
                              checked={
                                selectionForm.selection_type === "multiple"
                              }
                              onChange={(e) =>
                                setSelectionForm({
                                  ...selectionForm,
                                  selection_type: e.target.value,
                                })
                              }
                              className="focus:ring-purple-500 h-4 w-4 text-purple-600 border-gray-300"
                            />
                          </div>
                          <div className="ml-3">
                            <label
                              htmlFor="multiple-selection"
                              className="font-medium text-gray-700"
                            >
                              Multiple Selection
                            </label>
                            <p className="text-gray-500 text-sm">
                              Users can choose multiple options. Checkbox
                              behavior for complex scenarios.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Preview */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">
                        Preview
                      </h4>
                      <div className="text-sm text-gray-600">
                        {selectionForm.selection_type === "multiple" ? (
                          <div className="space-y-2">
                            <p>
                              <strong>Multiple Selection Mode:</strong>
                            </p>
                            <div className="ml-4 space-y-1">
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  className="mr-2"
                                  disabled
                                />
                                <span>Option 1</span>
                              </div>
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  className="mr-2"
                                  disabled
                                />
                                <span>Option 2</span>
                              </div>
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  className="mr-2"
                                  disabled
                                />
                                <span>Option 3</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p>
                              <strong>Single Selection Mode:</strong>
                            </p>
                            <div className="ml-4 space-y-1">
                              <div className="flex items-center">
                                <input
                                  type="radio"
                                  name="preview"
                                  className="mr-2"
                                  disabled
                                />
                                <span>Option 1</span>
                              </div>
                              <div className="flex items-center">
                                <input
                                  type="radio"
                                  name="preview"
                                  className="mr-2"
                                  disabled
                                />
                                <span>Option 2</span>
                              </div>
                              <div className="flex items-center">
                                <input
                                  type="radio"
                                  name="preview"
                                  className="mr-2"
                                  disabled
                                />
                                <span>Option 3</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                  <div className="flex justify-end space-x-3">
                    <Button
                      variant="secondary"
                      onClick={() => setShowSelectionModal(false)}
                      className="px-4 py-2"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={async () => {
                        if (selectionForm.criteria_id) {
                          const newConfig = {
                            ...selectionConfig,
                            [selectionForm.criteria_id]:
                              selectionForm.selection_type,
                          };

                          // Update local state
                          setSelectionConfig(newConfig);

                          try {
                            // Save to backend
                            await riskSettingsService.selectionConfig.save({
                              config: newConfig,
                            });

                            setShowSelectionModal(false);
                            Swal.fire({
                              title: "Success!",
                              text: "Selection type configured and saved successfully.",
                              icon: "success",
                              confirmButtonColor: "#3b82f6",
                              timer: 3000,
                              timerProgressBar: true,
                              showConfirmButton: false,
                            });
                          } catch (error) {
                            // Revert local state on error
                            console.error("Error saving option:", error);
                            setSelectionConfig(selectionConfig);
                            Swal.fire({
                              title: "Error",
                              text: "Failed to save selection configuration. Please try again.",
                              icon: "error",
                              confirmButtonColor: "#3b82f6",
                            });
                          }
                        }
                      }}
                      className="px-4 py-2"
                      disabled={!selectionForm.criteria_id}
                    >
                      Save Configuration
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
