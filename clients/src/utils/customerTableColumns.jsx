import { getRiskColor } from "./riskUtils";
import { Link } from "react-router-dom";
import axios from "axios";
import { API_ENDPOINTS } from "../config/constants";
import { useState, useEffect } from "react";
import { errorAlert, successAlert } from "../utils/sweetAlertConfig";

// Component to handle regular user edit access
const RegularUserEditButton = ({ customer, onRequestEditAccess }) => {
  const [canEdit, setCanEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);

  useEffect(() => {
    const checkEditAccess = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const response = await axios.get(API_ENDPOINTS.CHECK_EDIT_ACCESS(customer.id), {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });

        if (response.data.success) {
          setCanEdit(response.data.can_edit);
          setHasPendingRequest(response.data.has_pending_request);
        }
      } catch (error) {
        console.error("Error checking edit access:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkEditAccess();
  }, [customer.id]);

  if (isLoading) {
    return (
      <div className="inline-flex items-center px-2.5 py-1.5 bg-gray-300 text-gray-600 text-xs font-medium rounded-md">
        <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (canEdit) {
    return (
      <Link
        to={`/customers/${customer.id}/edit`}
        className="inline-flex items-center px-2.5 py-1.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-xs font-medium rounded-md shadow-sm hover:shadow-md transition-all duration-200"
        title="Edit Risk Assessment"
      >
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      </Link>
    );
  }

  if (hasPendingRequest) {
    return (
      <button
        disabled
        className="inline-flex items-center px-2.5 py-1.5 bg-gradient-to-r from-yellow-600 to-orange-600 text-white text-xs font-medium rounded-md shadow-sm opacity-75 cursor-not-allowed"
        title="Request Pending"
      >
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>
    );
  }

  return (
    <button
      onClick={() => onRequestEditAccess(customer)}
      className="inline-flex items-center px-2.5 py-1.5 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white text-xs font-medium rounded-md shadow-sm hover:shadow-md transition-all duration-200"
      title="Request Edit Access"
    >
      <svg
        className="w-3.5 h-3.5"
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
    </button>
  );
};

export const createCustomerColumns = (handleViewDetails, isAdmin = false, canEditRiskAssessments = false, isRegularUser = false, handleRequestEditAccess = null) => [
  {
    accessorKey: "name",
    header: "Customer Name",
    cell: (info) => (
      <div className="font-medium text-slate-900">{info.getValue()}</div>
    ),
  },
  {
    accessorKey: "date_created",
    header: "Date Created",
    cell: (info) => (
      <div className="text-sm">
        <div className="font-medium text-slate-900">{info.getValue()}</div>
        <div className="text-slate-500">
          {info.row.original.time_created}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "totalScore",
    header: "Total Score",
    cell: (info) => (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
        {info.getValue()}
      </span>
    ),
  },
  {
    accessorKey: "riskLevel",
    header: "Risk Level",
    cell: (info) => {
      const risk = info.getValue();
      const colorClass = getRiskColor(risk);
      const bgClass =
        risk === "HIGH RISK"
          ? "bg-red-100"
          : risk === "MODERATE RISK"
          ? "bg-yellow-100"
          : "bg-green-100";
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgClass} ${colorClass}`}
        >
          {risk}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: (info) => (
      <div className="flex items-center space-x-2">
        <button
          onClick={() => handleViewDetails(info.row.original)}
          className="inline-flex items-center px-2.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-medium rounded-md shadow-sm hover:shadow-md transition-all duration-200"
          title="View Details"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        </button>

        {(isAdmin || canEditRiskAssessments) && (
          <Link
            to={isAdmin ? `/admin/customers/${info.row.original.id}/edit` : `/manager/customers/${info.row.original.id}/edit`}
            className="inline-flex items-center px-2.5 py-1.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-xs font-medium rounded-md shadow-sm hover:shadow-md transition-all duration-200"
            title="Edit Risk Assessment"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </Link>
        )}

        {isRegularUser && handleRequestEditAccess && (
          <RegularUserEditButton
            customer={info.row.original}
            onRequestEditAccess={handleRequestEditAccess}
          />
        )}
      </div>
    ),
  },
];