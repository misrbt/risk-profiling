import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { authService } from "./services/authService";
import { API_BASE_URL } from "./config/constants";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Logo from "./assets/rbt-logo.png.png";

// Column Filter Component
function ColumnFilter({ column }) {
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

// Global Filter Component
function GlobalFilter({ globalFilter, setGlobalFilter }) {
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

// Risk Color Helper
const getRiskColor = (risk) => {
  if (risk === "HIGH RISK") return "text-red-600 font-bold";
  if (risk === "MODERATE RISK") return "text-yellow-600 font-bold";
  return "text-green-600 font-bold";
};

// Main Component
export default function CustomerList() {
  const [customers, setCustomers] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

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

    authAxios
      .get("/customers-list") // Laravel API endpoint
      .then((res) => setCustomers(res.data))
      .catch((err) => console.error("Error fetching customers", err));
  }, []);

  const handleViewDetails = (customer) => {
    setSelectedCustomer(customer);
    setShowDetailsModal(true);
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: (info) => info.getValue(),
        filterFn: "includesString",
      },
      {
        accessorKey: "totalScore",
        header: "Total Score",
        cell: (info) => info.getValue(),
        enableColumnFilter: false,
      },
      {
        accessorKey: "riskLevel",
        header: "Risk Level",
        cell: (info) => (
          <span className={getRiskColor(info.getValue())}>
            {info.getValue()}
          </span>
        ),
        enableColumnFilter: false,
      },
      {
        id: "actions",
        header: "Actions",
        enableColumnFilter: false,
        cell: (info) => (
          <button
            onClick={() => handleViewDetails(info.row.original)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm transition"
          >
            View Details
          </button>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: customers,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    filterFns: {
      includesString: (row, columnId, filterValue) => {
        const value = row.getValue(columnId);
        return String(value).toLowerCase().includes(filterValue.toLowerCase());
      },
    },
  });

  // --- Export functions for the main table (existing) ---
  const exportCSV = () => {
    const dataToExport = customers.map((c) => ({
      Name: c.name,
      "Total Score": c.totalScore,
      "Risk Level": c.riskLevel,
      Categories: c.selections?.map((s) => s.criteriaCategory).join(" | "),
      "Sub-Categories": c.selections
        ?.flatMap((s) =>
          s.options.map(
            (o) => `${s.criteriaCategory}: ${o.optionLabel} (${o.points} ${o.points === 0 || o.points === 1 ? 'pt' : 'pts'})`
          )
        )
        .join(" | "),
    }));
    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "customers.csv";
    a.click();
  };

  const exportExcel = () => {
    const dataToExport = customers.map((c) => ({
      Name: c.name,
      "Total Score": c.totalScore,
      "Risk Level": c.riskLevel,
      Categories: c.selections?.map((s) => s.criteriaCategory).join(", "),
      "Sub-Categories": c.selections
        ?.flatMap((s) =>
          s.options.map(
            (o) => `${s.criteriaCategory}: ${o.optionLabel} (${o.points} ${o.points === 0 || o.points === 1 ? 'pt' : 'pts'})`
          )
        )
        .join(" | "),
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Customers");
    XLSX.writeFile(wb, "customers.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Customer List", 14, 10);
    const tableColumn = [
      "Name",
      "Total Score",
      "Risk Level",
      "Category",
      "Sub-Category",
    ];
    const tableRows = customers.map((c) => [
      c.name,
      c.totalScore,
      c.riskLevel,
      c.selections?.map((s) => s.criteriaCategory).join("\n") || "",
      c.selections
        ?.flatMap((s) =>
          s.options.map(
            (o) => `${s.criteriaCategory}: ${o.optionLabel} (${o.points} ${o.points === 0 || o.points === 1 ? 'pt' : 'pts'})`
          )
        )
        .join("\n") || "",
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      styles: { cellWidth: "wrap", fontSize: 9 },
      columnStyles: {
        3: { cellWidth: 40 }, // Category column width
        4: { cellWidth: 60 }, // Sub-Category column width
      },
      headStyles: { fillColor: [30, 144, 255] },
    });

    doc.save("customers.pdf");
  };

  // --- Export and Print functions for the MODAL ---

  const exportModalDataToCSV = () => {
    if (!selectedCustomer) return;
    const dataToExport = selectedCustomer.selections.flatMap((criteria) =>
      criteria.options.map((opt) => ({
        Name: selectedCustomer.name,
        Criteria: criteria.criteriaCategory,
        "Sub-Criteria": opt.optionLabel,
        Points: opt.points,
        "Total Score": selectedCustomer.totalScore,
        "Risk Level": selectedCustomer.riskLevel,
      }))
    );
    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedCustomer.name}_details.csv`;
    a.click();
  };

  const exportModalDataToExcel = () => {
    if (!selectedCustomer) return;
    const dataToExport = selectedCustomer.selections.flatMap((criteria) =>
      criteria.options.map((opt) => ({
        Name: selectedCustomer.name,
        Criteria: criteria.criteriaCategory,
        "Sub-Criteria": opt.optionLabel,
        Points: opt.points,
        "Total Score": selectedCustomer.totalScore,
        "Risk Level": selectedCustomer.riskLevel,
      }))
    );
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Details");
    XLSX.writeFile(wb, `${selectedCustomer.name}_details.xlsx`);
  };

  const exportModalDataToPDF = (customer) => {
    // Check for a valid customer object at the start
    if (!customer || !customer.selections || customer.selections.length === 0) {
      console.error(
        "PDF export failed: No valid customer data or selections found."
      );
      return;
    }

    const doc = new jsPDF();
    doc.text(`Customer Assessment for: ${customer.name}`, 14, 20);

    const tableColumn = ["Criteria", "Sub-Criteria", "Points"];
    const tableRows = customer.selections.flatMap((criteria) =>
      criteria.options.map((opt, j) => [
        j === 0 ? criteria.criteriaCategory : "",
        opt.optionLabel,
        `${opt.points} ${opt.points === 0 || opt.points === 1 ? 'pt' : 'pts'}`,
      ])
    );

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      styles: { fontSize: 9, cellPadding: 2, overflow: "linebreak" },
      headStyles: { fillColor: [30, 144, 255] },
    });

    const finalY = doc.autoTable.previous.finalY;

    doc.setFontSize(12);
    doc.text(`Total Score: ${customer.totalScore} ${customer.totalScore === 0 || customer.totalScore === 1 ? 'pt' : 'pts'}`, 14, finalY + 10);
    doc.text(`Risk Level: ${customer.riskLevel}`, 14, finalY + 16);

    doc.save(`${customer.name}_details.pdf`);
  };

  const handlePrint = () => {
    if (!selectedCustomer) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return; // Handle cases where pop-ups are blocked

    const getRiskColorClass = (risk) => {
      if (risk === "HIGH RISK") return "risk-high";
      if (risk === "MODERATE RISK") return "risk-moderate";
      return "risk-low";
    };
    const currentDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const printHtml = `
    <html>
  <head>

<style>
  .logo {
      width: 80px; /* Adjust as needed */
      height: auto;
      margin-bottom: 10px; /* Add some space below the logo */
      display: block; /* Ensures the image is on its own line */
      margin-left: auto;
      margin-right: auto;
        }

  @page {
    size: A4;
    margin: 1cm;
    /* These rules are the key to removing headers/footers in most browsers */
    @top-left { content: none; }
    @top-center { content: none; }
    @top-right { content: none; }
    @bottom-left { content: none; }
    @bottom-center { content: none; }
    @bottom-right { content: none; }
  }

  /*
   * Fallback for some older browsers and a more direct
   * approach to try and override the browser's default.
   */
  @page {
    margin-top: 0;
    margin-bottom: 0;
  }
  @page :left {
    margin-left: 0;
    margin-right: 0;
  }
  @page :right {
    margin-left: 0;
    margin-right: 0;
  }
  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    margin: 2rem;
    color: #333;
    line-height: 1.6;
  }
  .container {
    width: 1000px;
    margin: 0 auto;
    padding: 2rem;
    border: 1px solid #ddd;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  header h5 {
    text-align: center;
    margin-bottom: 2rem;
    font-weight:normal;
    font-size:20px
  }
  h1 {
    color: #1e40af;
    font-size: 28px;
    margin: 0;
  }
  h4 {
    text-align: left;
    margin: 1rem 0 0.5rem;
    color: black;
    font-size: 20px;
    padding-bottom: 0.5rem;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 2rem;
    background-color: #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    overflow: hidden; /* Ensures rounded corners on the table */
  }
  th, td {
    border: 1px solid #464646;
    padding: 12px 16px;
    text-align: left;
    font-size: 14px;
  }
  thead th {
    background-color: #fbfcff; /* Reverted to professional blue */
    color: #121212; /* Set font color to white for contrast */
    font-weight: bold; /* Set font weight to bold */
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  tbody tr {
    color: #000000; /* Set all tbody text to black */
    text-align:center;
  }
  tbody tr:nth-child(even) {
    background-color: #f9fafb;
  }
  tbody td:first-child {
    font-weight: 500;
    color: #1e40af;
  }
  tfoot {
    font-weight: bold;
    background-color: #eef2ff; /* Light blue footer background */
  }
  tfoot td {
     border: 1px solid #464646;
    font-size: 16px;
    color: black;
  }


  .risk-high { color: #dc2626; font-weight: bold; }
  .risk-moderate { color: #ca8a04; font-weight: bold; }
  .risk-low { color: #16a34a; font-weight: bold; }
  @media print {
    body {
      margin: 0;
      font-size: 12pt;
    }
    .container {
      box-shadow: none;
      border: none;
      border-radius: 0;
      padding: 0;
    }
    table {
      box-shadow: none;
    }

  }
header {
  /* Use a flexbox on the main header for overall centering */
  display: flex;
  justify-content: center; /* Horizontally centers the flex-container inside */
  align-items: center; /* Vertically centers the flex-container inside */
}



.logo {
  /* Remove auto margins, as flexbox handles alignment */
  margin: 0;
  width: 60px; /* Keep your desired logo size */
  height: auto;
}

.header-text {
  /* Remove text alignment from the text block itself */
  text-align: left;
}

.header-text h5 {
  /* Remove default margins for h5 to prevent extra spacing */
  margin: 0;
}

</style>
  </head>
  <body style = "padding-top:50px;">
    <div class="container">
        
      <header>
        <div>
          <img style = "margin:0 auto;" src="${Logo}" alt="RBT Bank Logo" class="logo" />
          <div class="header-text">
            <h5>RBT BANK INC., A Rural Bank</h5>
            <h5>Talisayan, Misamis Oriental, Philippines</h5>
            <h5 style="margin-top: 5px; font-size:16px;">${currentDate}</h5>
             <br> <br>
            <h1 style="text-align: center; color:black; margin-top:25px;">CLIENT RISK PROFILE</h1>
          </div>
        </div>

      </header>
      <div> 
        <h4 style="text-align: left; padding:0;margin-bottom:3px; line-height: 1.6;">Name: ${
          selectedCustomer.name
        }</h4>
        <h5 style="text-align: left; padding:0; margin:0; font-size:16px">Date Assessed: ${
          selectedCustomer.created_at
        }</h5>
      </div>


      <table>
        <thead>
          <tr>
            <th>Criteria</th>
            <th>Sub-Criteria</th>
            <th>Points</th>
          </tr>
        </thead>
        <tbody>
          ${selectedCustomer.selections
            .map((criteria) =>
              criteria.options
                .map(
                  (opt, j) => `
                    <tr>
                      ${
                        j === 0
                          ? `<td style = "color:black; font-weight:normal;" rowspan="${criteria.options.length}">${criteria.criteriaCategory}</td>`
                          : ""
                      }
                      <td>${opt.optionLabel}</td>
                      <td style = "text-align:center">${opt.points} ${opt.points === 0 || opt.points === 1 ? 'pt' : 'pts'}</td>
                    </tr>
                  `
                )
                .join("")
            )
            .join("")}
        </tbody>
        <tfoot>
          <tr>
            <td  colspan="2">Total Score</td>
            <td style = "text-align:center;">${selectedCustomer.totalScore} ${selectedCustomer.totalScore === 0 || selectedCustomer.totalScore === 1 ? 'pt' : 'pts'}</td>
          </tr>
          <tr style = "font-size:10px;">
            <td colspan="2">Risk Level</td>
            <td class="${getRiskColorClass(selectedCustomer.riskLevel)}">${
      selectedCustomer.riskLevel
    }</td>
          </tr>
        </tfoot>
      </table>
    </div>
  </body>
</html>
    `;

    printWindow.document.write(printHtml);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen flex flex-col">
      <h1 className="text-3xl font-extrabold mb-6 text-center text-blue-700 tracking-wide drop-shadow-sm">
        Customer List
      </h1>

      {/* Global Search & Export */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <GlobalFilter
          globalFilter={globalFilter}
          setGlobalFilter={setGlobalFilter}
        />
        <div className="flex flex-wrap justify-center md:justify-end gap-2 sm:gap-3 w-full md:w-auto">
          <button
            onClick={exportCSV}
            className="bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 md:px-5 py-2 rounded-lg shadow-md text-xs sm:text-sm transition duration-300 flex-1 sm:flex-initial min-w-0"
            aria-label="Export as CSV"
          >
            <span className="hidden sm:inline">Export </span>CSV
          </button>
          <button
            onClick={exportExcel}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 md:px-5 py-2 rounded-lg shadow-md text-xs sm:text-sm transition duration-300 flex-1 sm:flex-initial min-w-0"
            aria-label="Export as Excel"
          >
            <span className="hidden sm:inline">Export </span>Excel
          </button>
          <button
            onClick={exportPDF}
            className="bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 md:px-5 py-2 rounded-lg shadow-md text-xs sm:text-sm transition duration-300 flex-1 sm:flex-initial min-w-0"
            aria-label="Export as PDF"
          >
            <span className="hidden sm:inline">Export </span>PDF
          </button>
        </div>
      </div>

      {/* Table */}
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

      {/* Details Modal */}
      {showDetailsModal && selectedCustomer && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-2 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-6xl w-full h-[95vh] sm:h-auto sm:max-h-[90vh] flex flex-col relative">
            <button
              onClick={() => setShowDetailsModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
              aria-label="Close modal"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
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

            {/* Modal Header - Fixed */}
            <div className="flex-shrink-0 p-4 sm:p-6 md:p-8 lg:p-10 pb-2 sm:pb-4">
              <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold mb-2 text-blue-700 pr-8">
                Name: {selectedCustomer.name}
              </h2>

              {/* Export buttons inside the modal */}
              <div className="flex flex-wrap justify-center sm:justify-end gap-1 sm:gap-2 md:gap-3 my-2 sm:my-4">
                <button
                  onClick={exportModalDataToCSV}
                  className="bg-green-600 hover:bg-green-700 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-md sm:rounded-lg shadow-md text-xs sm:text-sm transition duration-300 flex-1 sm:flex-initial min-w-[60px] sm:min-w-0"
                >
                  <span className="hidden sm:inline">Export </span>CSV
                </button>
                <button
                  onClick={exportModalDataToExcel}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-md sm:rounded-lg shadow-md text-xs sm:text-sm transition duration-300 flex-1 sm:flex-initial min-w-[60px] sm:min-w-0"
                >
                  <span className="hidden sm:inline">Export </span>Excel
                </button>
                <button
                  // Pass the selectedCustomer object directly
                  onClick={() => exportModalDataToPDF(selectedCustomer)}
                  className="bg-red-600 hover:bg-red-700 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-md sm:rounded-lg shadow-md text-xs sm:text-sm transition duration-300 flex-1 sm:flex-initial min-w-[60px] sm:min-w-0"
                >
                  <span className="hidden sm:inline">Export </span>PDF
                </button>
                <button
                  onClick={handlePrint}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-md sm:rounded-lg shadow-md text-xs sm:text-sm transition duration-300 flex-1 sm:flex-initial min-w-[60px] sm:min-w-0"
                >
                  Print
                </button>
              </div>
            </div>

            {/* Modal Content - Scrollable */}
            {selectedCustomer.selections && (
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 lg:px-10 pb-4 sm:pb-6 md:pb-8 lg:pb-10">
                <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold mb-3 sm:mb-4 text-blue-700 text-center">
                  Customer Risk Profiling
                </h3>
                <div className="overflow-x-auto rounded-lg shadow-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-blue-600 text-white">
                      <tr>
                        <th className="px-2 sm:px-3 md:px-6 py-2 sm:py-3 text-left text-xs font-medium uppercase tracking-wider w-1/3">
                          Criteria
                        </th>
                        <th className="px-2 sm:px-3 md:px-6 py-2 sm:py-3 text-left text-xs font-medium uppercase tracking-wider w-1/2">
                          Sub-Criteria
                        </th>
                        <th className="px-2 sm:px-3 md:px-6 py-2 sm:py-3 text-left text-xs font-medium uppercase tracking-wider w-1/6">
                          Points
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedCustomer.selections.map((criteria, i) =>
                        criteria.options.map((opt, j) => (
                          <tr key={`${i}-${j}`} className="hover:bg-gray-50">
                            {j === 0 && (
                              <td
                                rowSpan={criteria.options.length}
                                className="px-2 sm:px-3 md:px-6 py-2 sm:py-3 md:py-4 text-xs sm:text-sm font-medium text-gray-900 border-r border-gray-200 align-top w-1/3"
                              >
                                <div className="break-words">
                                  {criteria.criteriaCategory}
                                </div>
                              </td>
                            )}
                            <td className="px-2 sm:px-3 md:px-6 py-2 sm:py-3 md:py-4 text-xs sm:text-sm text-gray-500 w-1/2">
                              <div className="break-words">
                                {opt.optionLabel}
                              </div>
                            </td>
                            <td className="px-2 sm:px-3 md:px-6 py-2 sm:py-3 md:py-4 text-xs sm:text-sm text-gray-500 w-1/6">
                              <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap">
                                {opt.points} {opt.points === 0 || opt.points === 1 ? 'pt' : 'pts'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot className="bg-gray-500 text-white">
                      <tr>
                        <td
                          colSpan={2}
                          className="px-2 sm:px-3 md:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-bold uppercase"
                        >
                          Total Score
                        </td>
                        <td className="px-2 sm:px-3 md:px-6 py-2 sm:py-3 text-xs sm:text-sm font-bold">
                          <span className="bg-white text-gray-900 px-1.5 sm:px-2 py-1 rounded font-bold">
                            {selectedCustomer.totalScore} {selectedCustomer.totalScore === 0 || selectedCustomer.totalScore === 1 ? 'pt' : 'pts'}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td
                          colSpan={2}
                          className="px-2 sm:px-3 md:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-bold uppercase"
                        >
                          Risk Level
                        </td>
                        <td className="px-2 sm:px-3 md:px-6 py-2 sm:py-3 text-xs sm:text-sm font-bold">
                          <span
                            className={`px-1.5 sm:px-2 py-1 rounded font-bold ${getRiskColor(
                              selectedCustomer.riskLevel
                            )}`}
                          >
                            {selectedCustomer.riskLevel}
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
