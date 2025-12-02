import React, { useState } from "react";

const criteriaData = [
  {
    label: "Nature of Products/Service",
    options: [
      { label: "Savings", points: 1 },
      { label: "Loan", points: 2 },
    ],
  },
  {
    label: "Purpose of account opening",
    options: [
      { label: "Personal/Salary Saving", points: 1 },
      { label: "Loan proceeds account", points: 1 },
      { label: "Business Operations", points: 3 },
      { label: "Remittance", points: 5 },
      { label: "Multi-purpose", points: 5 },
    ],
  },
  {
    label: "Existense of Suspicious Transaction",
    hasTextInput: true,
    options: [
      { label: "No suspicious behavior or red flags", points: 0 },
      { label: "Minor inconsistencies in declared information", points: 5 },
      { label: "Sudden or unexplained large transactions", points: 5 },
      { label: "Reluctant to provide information/documents", points: 7 },
      { label: "Third-party deposits without clear relation", points: 7 },
      { label: "Use of nominee, shell company", points: 11 },
      { label: "Customer previously reported for STR or involved in adverse media", points: 11 },
    ],
  },
  {
    label: "Other Risk Factors (amount, frequency, duration)",
    options: [
      { label: "Small/infrequent (less than P100k/year)", points: 1 },
      { label: "P100k-P1M/year, regular", points: 3 },
      { label: "Large but explainable (sale of property, loan proceeds, inheritance, business)", points: 1 },
      { label: "High value but inconsistent transactions", points: 5 },
      { label: "Frequent large transactions with limited documentation (no clear business justification for frequent large deposits/withdrawals)", points: 5 },
      { label: "Sudden change in transaction patter (unusual spike in volume)", points: 7 },
      { label: "Long dormant period, then sudden large activity", points: 5 },
    ],
  },
];

// Add unique numeric IDs to each option (starting at 1)
const criteriaDataWithIDs = (() => {
  let optionId = 1;
  return criteriaData.map((criteria) => {
    const optionsWithId = criteria.options.map((opt) => ({
      ...opt,
      id: optionId++,
    }));
    return { ...criteria, options: optionsWithId };
  });
})();

function RiskForm() {
  const [selectedOptions, setSelectedOptions] = useState({}); // {criteriaIndex: optionId}
  const [textInputs, setTextInputs] = useState({}); // {criteriaIndex: text}

  const handleSelect = (criteriaIndex, optionId) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [criteriaIndex]: optionId,
    }));
    // Reset text input if option changed
    setTextInputs((prev) => ({
      ...prev,
      [criteriaIndex]: "",
    }));
  };

  const handleTextChange = (criteriaIndex, e) => {
    setTextInputs((prev) => ({
      ...prev,
      [criteriaIndex]: e.target.value,
    }));
  };

  const handleSubmit = () => {
    const submissionData = criteriaDataWithIDs.map((criteria, i) => {
      const optionId = selectedOptions[i] || null;
      const selectedOption = criteria.options.find((opt) => opt.id === optionId);
      return {
        criteriaLabel: criteria.label,
        optionId,
        optionLabel: selectedOption ? selectedOption.label : null,
        points: selectedOption ? selectedOption.points : 0,
        extraText: criteria.hasTextInput ? textInputs[i] || "" : null,
      };
    });
    console.log("Submission data:", submissionData);

    // TODO: send submissionData to your backend via API (axios.post etc.)
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Risk Profiling Form</h1>

      {criteriaDataWithIDs.map((criteria, i) => (
        <div key={i} className="mb-6">
          <label className="block font-semibold mb-2">{criteria.label}</label>

          <select
            className="w-full border rounded px-3 py-2"
            value={selectedOptions[i] || ""}
            onChange={(e) => handleSelect(i, Number(e.target.value))}
            required
          >
            <option value="" disabled>
              Select an option
            </option>
            {criteria.options.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>

          {criteria.hasTextInput && selectedOptions[i] && (
            <input
              type="text"
              className="w-full border rounded px-3 py-2 mt-2"
              placeholder="Please provide additional info"
              value={textInputs[i] || ""}
              onChange={(e) => handleTextChange(i, e)}
            />
          )}
        </div>
      ))}

      <button
        onClick={handleSubmit}
        className="bg-blue-600 text-white font-semibold px-6 py-3 rounded hover:bg-blue-700 transition"
      >
        Submit
      </button>
    </div>
  );
}

export default RiskForm;
