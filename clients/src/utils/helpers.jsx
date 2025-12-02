export const getRiskColorClass = (risk) => {
  if (risk === "HIGH RISK") return "text-red-600 font-bold";
  if (risk === "MODERATE RISK") return "text-yellow-600 font-bold";
  return "text-green-600 font-bold";
};

export const riskCellRenderer = (risk) => {
  const cls = getRiskColorClass(risk);
  return <span className={cls}>{risk}</span>;
};

export const formatDate = (value) => {
  if (!value) return "";
  try {
    const d = new Date(value);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return String(value);
  }
};
