import React from "react";

export default function GlobalFilter({ globalFilter, setGlobalFilter }) {
  return (
    <input
      value={globalFilter ?? ""}
      onChange={(e) => setGlobalFilter(e.target.value)}
      placeholder="Global Search..."
      className="border border-gray-300 px-4 py-2 rounded-lg shadow-sm w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
      aria-label="Global search"
    />
  );
}
