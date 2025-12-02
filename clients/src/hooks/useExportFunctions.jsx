// src/hooks/useExportFunctions.jsx
import Papa from "papaparse";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const useExportFunctions = (customers) => {
  const exportCSV = () => {
    const dataToExport = customers.map((c) => ({
      Name: c.name,
      "Total Score": c.totalScore,
      "Risk Level": c.riskLevel,
      Categories: c.selections?.map((s) => s.criteriaCategory).join(" | "),
      "Sub-Categories":
        c.selections
          ?.flatMap((s) =>
            s.options.map(
              (o) => `${s.criteriaCategory}: ${o.optionLabel} (${o.points} pts)`
            )
          )
          .join(" | ") || "",
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
      "Sub-Categories":
        c.selections
          ?.flatMap((s) =>
            s.options.map(
              (o) => `${s.criteriaCategory}: ${o.optionLabel} (${o.points} pts)`
            )
          )
          .join(" | ") || "",
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
            (o) => `${s.criteriaCategory}: ${o.optionLabel} (${o.points} pts)`
          )
        )
        .join("\n") || "",
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      styles: { cellWidth: "wrap", fontSize: 9 },
      columnStyles: { 3: { cellWidth: 40 }, 4: { cellWidth: 60 } },
      headStyles: { fillColor: [30, 144, 255] },
    });

    doc.save("customers.pdf");
  };

  const exportModalDataToCSV = (customer) => {
    if (!customer) return;
    const dataToExport = customer.selections.flatMap((criteria) =>
      criteria.options.map((opt) => ({
        Name: customer.name,
        Criteria: criteria.criteriaCategory,
        "Sub-Criteria": opt.optionLabel,
        Points: opt.points,
        "Total Score": customer.totalScore,
        "Risk Level": customer.riskLevel,
      }))
    );
    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${customer.name}_details.csv`;
    a.click();
  };

  const exportModalDataToExcel = (customer) => {
    if (!customer) return;
    const dataToExport = customer.selections.flatMap((criteria) =>
      criteria.options.map((opt) => ({
        Name: customer.name,
        Criteria: criteria.criteriaCategory,
        "Sub-Criteria": opt.optionLabel,
        Points: opt.points,
        "Total Score": customer.totalScore,
        "Risk Level": customer.riskLevel,
      }))
    );
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Details");
    XLSX.writeFile(wb, `${customer.name}_details.xlsx`);
  };

  const exportModalDataToPDF = (customer) => {
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
        `${opt.points} pts`,
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
    doc.text(`Total Score: ${customer.totalScore} pts`, 14, finalY + 10);
    doc.text(`Risk Level: ${customer.riskLevel}`, 14, finalY + 16);

    doc.save(`${customer.name}_details.pdf`);
  };

  return {
    exportCSV,
    exportExcel,
    exportPDF,
    exportModalDataToCSV,
    exportModalDataToExcel,
    exportModalDataToPDF,
  };
};
