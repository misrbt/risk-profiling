import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL, API_ENDPOINTS } from "./config/constants";

const getRiskColor = (risk) => {
  if (risk === "HIGH RISK") return "text-red-600 font-bold";
  if (risk === "MODERATE RISK") return "text-yellow-600 font-bold";
  return "text-green-600 font-bold";
};

export default function CustomerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Create authenticated axios instance
    const authAxios = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    authAxios
      .get(`${API_ENDPOINTS.CUSTOMERS_INDEX}/${id}`)
      .then((res) => {
        setCustomer(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching customer details", err);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <p className="p-8 text-center">Loading...</p>;

  if (!customer)
    return (
      <p className="p-8 text-center text-red-600">
        Customer not found or error loading data.
      </p>
    );

  return (
    <div className="p-8 max-w-4xl mx-auto bg-white rounded shadow">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 text-blue-600 hover:underline"
        aria-label="Go back"
      >
        &larr; Back
      </button>

      <h1 className="text-3xl font-extrabold mb-4 text-blue-700">
        {customer.name}
      </h1>

      <div className="flex flex-col sm:flex-row justify-around items-center bg-gray-100 p-6 rounded-xl mb-6">
        <div className="text-center">
          <p className="text-sm text-gray-500 font-medium">Total Score</p>
          <p className="text-4xl font-extrabold text-blue-600">
            {customer.totalScore}
          </p>
        </div>
        <div className="w-px h-16 bg-gray-300 hidden sm:block"></div>
        <div className="text-center">
          <p className="text-sm text-gray-500 font-medium">Risk Level</p>
          <p className="text-4xl font-extrabold">
            <span className={getRiskColor(customer.riskLevel)}>
              {customer.riskLevel}
            </span>
          </p>
        </div>
      </div>

      {customer.selections && (
        <>
          <h2 className="text-2xl font-bold mb-4 text-blue-700">Criteria</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customer.selections.map((criteria, i) => (
              <div
                key={i}
                className="bg-white p-5 rounded-xl shadow border border-gray-200 hover:shadow-lg transition"
              >
                <div className="font-bold text-blue-800 text-lg mb-3">
                  {criteria.criteriaCategory}
                </div>
                <ul className="list-none pl-0 text-gray-700 text-sm space-y-2">
                  {criteria.options.map((opt, j) => (
                    <li
                      key={j}
                      className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-md transition hover:bg-gray-100"
                    >
                      <span className="truncate pr-2">{opt.optionLabel}</span>
                      <span className="bg-blue-200 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                        {opt.points} {opt.points === 0 || opt.points === 1 ? 'pt' : 'pts'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
