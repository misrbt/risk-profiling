// Builds the printable HTML for a single customer's assessment
export const generatePrintHtml = (customer, logoSrc) => {
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const bodyRows = (customer.selections || [])
    .map((criteria) =>
      criteria.options
        .map(
          (opt, j) => `
          <tr>
            ${
              j === 0
                ? `<td style="color:black; font-weight:normal;" rowspan="${criteria.options.length}">${criteria.criteriaCategory}</td>`
                : ""
            }
            <td>${opt.optionLabel}</td>
            <td style="text-align:center">${opt.points}</td>
          </tr>`
        )
        .join("")
    )
    .join("");

  const riskClass = (risk) => {
    if (risk === "HIGH RISK") return "risk-high";
    if (risk === "MODERATE RISK") return "risk-moderate";
    return "risk-low";
  };

  return `
<html>
<head>
  <meta charset="utf-8" />
  <title>Client Risk Profile</title>
  <style>
    .logo { width: 80px; height: auto; margin-bottom: 10px; display: block; margin-left: auto; margin-right: auto; }
    @page { size: letter; margin: 1cm; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 1rem; color: #333; line-height: 1.6; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: white; }
    .container { width: 90%; max-width: 800px; margin: 0 auto; padding: 1.5rem; border: 2px solid #333; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); background: white; }
    header h5 { text-align: center; margin-bottom: 2rem; font-weight: normal; font-size: 20px; }
    h1 { color: #111; font-size: 28px; margin: 0; }
    h4 { text-align: left; margin: 1rem 0 0.5rem; color: black; font-size: 20px; padding-bottom: 0.5rem; }
    table { width: 100%; border-collapse: collapse; margin-top: 2rem; background-color: #fff; border-radius: 8px; overflow: hidden; }
    th, td { border: 1px solid #464646; padding: 12px 16px; text-align: left; font-size: 14px; }
    thead th { background-color: #fbfcff; color: #121212; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; }
    tbody tr { color: #000; text-align: center; }
    tbody tr:nth-child(even) { background-color: #f9fafb; }
    tbody td:first-child { font-weight: 500; color: #111827; }
    tfoot { font-weight: bold; background-color: #eef2ff; }
    tfoot td { border: 1px solid #464646; font-size: 16px; color: black; }
    .risk-high { color: #dc2626; font-weight: bold; }
    .risk-moderate { color: #ca8a04; font-weight: bold; }
    .risk-low { color: #16a34a; font-weight: bold; }
    header { display: flex; justify-content: center; align-items: center; }
    .header-text { text-align: center; }
    .header-text h5 { margin: 0; }
    @media print {
      body { margin: 0 !important; padding: 1cm !important; font-size: 10pt; display: block !important; min-height: auto !important; }
      .container { width: 100% !important; max-width: none !important; margin: 0 !important; padding: 1rem !important; box-shadow: none !important; border: 2px solid #000 !important; border-radius: 0 !important; }
      table { box-shadow: none !important; }
      h1 { font-size: 20pt !important; }
      h4 { font-size: 14pt !important; }
      th, td { padding: 6px 8px !important; font-size: 9pt !important; }
      tfoot td { font-size: 10pt !important; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div>
        <img style="margin:0 auto;" src="${logoSrc}" alt="RBT Bank Logo" class="logo" />
        <div class="header-text">
          <h5>RBT BANK INC., A Rural Bank</h5>
          <h5>Talisayan, Misamis Oriental, Philippines</h5>
          <h5 style="margin-top: 5px; font-size:16px;">${currentDate}</h5>
          <br><br>
          <h1 style="text-align: center; color:black; margin-top:25px;">CLIENT RISK PROFILE</h1>
        </div>
      </div>
    </header>

    <div>
      <h4 style="text-align: left; padding:0;margin-bottom:3px; line-height: 1.6;">Name: ${
        customer.name
      }</h4>
      <h5 style="text-align: left; padding:0; margin:0; font-size:16px">Date Assessed: ${
        customer.created_at ?? ""
      }</h5>
    </div>

    <table>
      <thead>
        <tr><th>Criteria</th><th>Sub-Criteria</th><th>Points</th></tr>
      </thead>
      <tbody>
        ${bodyRows}
      </tbody>
      <tfoot>
        <tr><td colspan="2">Total Score</td><td style="text-align:center;">${
          customer.totalScore
        }</td></tr>
        <tr style="font-size:10px;">
          <td colspan="2">Risk Level</td>
          <td class="${riskClass(customer.riskLevel)}">${
    customer.riskLevel
  }</td>
        </tr>
      </tfoot>
    </table>
  </div>
</body>
</html>
`;
};
