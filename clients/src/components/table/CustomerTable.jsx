import React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import ColumnFilter from "./ColumnFilter";
import { riskCellRenderer } from "../../utils/helpers";

export default function CustomerTable({
  columns,
  data,
  globalFilter,
  setGlobalFilter,
}) {
  const table = useReactTable({
    data,
    columns: columns.map((col) =>
      col.accessorKey === "riskLevel"
        ? {
            ...col,
            cell: (info) => riskCellRenderer(info.getValue()),
          }
        : col
    ),
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    filterFns: {
      includesString: (row, columnId, filterValue) => {
        const value = row.getValue(columnId);
        return String(value ?? "")
          .toLowerCase()
          .includes(String(filterValue ?? "").toLowerCase());
      },
    },
  });

  return (
    <>
      <div className="overflow-x-auto rounded-lg shadow-md border border-gray-300 bg-white">
        <table className="w-full border-collapse">
          <thead className="bg-blue-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="border-b border-gray-300 px-5 py-3 text-left text-sm font-semibold text-gray-700 select-none"
                  >
                    <div
                      className={`flex items-center justify-between cursor-pointer ${
                        header.column.getCanSort() ? "hover:text-blue-600" : ""
                      }`}
                      onClick={header.column.getToggleSortingHandler()}
                      role={header.column.getCanSort() ? "button" : undefined}
                      tabIndex={header.column.getCanSort() ? 0 : undefined}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && header.column.getCanSort()) {
                          header.column.toggleSorting();
                        }
                      }}
                      aria-sort={
                        header.column.getIsSorted()
                          ? header.column.getIsSorted() === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {{
                        asc: <span aria-hidden="true"> 🔼</span>,
                        desc: <span aria-hidden="true"> 🔽</span>,
                      }[header.column.getIsSorted()] ?? null}
                    </div>
                    {header.column.getCanFilter() ? (
                      <div className="mt-1">
                        <ColumnFilter column={header.column} />
                      </div>
                    ) : null}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-center p-6 text-gray-500 italic"
                >
                  No customers found.
                </td>
              </tr>
            )}
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-blue-50 transition-colors duration-150"
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="border-b border-gray-200 px-5 py-3 align-top text-sm"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col md:flex-row justify-between items-center mt-6 space-y-3 md:space-y-0">
        <div className="flex space-x-2 items-center">
          <button
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-100 transition"
            aria-label="First Page"
          >
            {"<<"}
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-100 transition"
            aria-label="Previous Page"
          >
            {"<"}
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-100 transition"
            aria-label="Next Page"
          >
            {">"}
          </button>
          <button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-100 transition"
            aria-label="Last Page"
          >
            {">>"}
          </button>
          <span className="ml-3 text-sm">
            Page{" "}
            <strong>
              {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </strong>
          </span>
        </div>
        <div>
          <label
            htmlFor="pageSize"
            className="mr-2 text-sm font-medium text-gray-700"
          >
            Show
          </label>
          <select
            id="pageSize"
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
            aria-label="Select page size"
          >
            {[5, 10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>
    </>
  );
}
