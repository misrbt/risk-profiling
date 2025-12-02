// src/components/CustomerList/utils/getRiskColor.js
export default function getRiskColor(risk) {
  if (risk === "HIGH RISK") return "text-red-600 font-bold";
  if (risk === "MODERATE RISK") return "text-yellow-600 font-bold";
  return "text-green-600 font-bold";
}
