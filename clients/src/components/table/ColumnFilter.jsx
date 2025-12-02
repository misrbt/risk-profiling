import React from "react";

export default function ColumnFilter({ column }) {
  const value = column.getFilterValue() || "";
  return (
    <input
      value={value}
      onChange={(e) => column.setFilterValue(e.target.value)}
      placeholder="Search..."
      className="border border-gray-300 px-2 py-1 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
      aria-label={`Filter for ${column.id}`}
    />
  );
}
