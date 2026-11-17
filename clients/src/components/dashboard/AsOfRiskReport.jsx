import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import * as XLSX from "xlsx";
import { FiCalendar, FiDownload, FiRefreshCw, FiSearch } from "react-icons/fi";
import { Card, CardHeader, CardContent } from "../ui";
import api from "../../services/api";

const PERIODS = [
  { key: "daily", short: "Daily", title: "On the date" },
  { key: "monthly", short: "Monthly (MTD)", title: "Month-to-date" },
  { key: "yearly", short: "Yearly (YTD)", title: "Year-to-date" },
  { key: "cumulative", short: "As of (Cut-off)", title: "All profiles up to cut-off" },
];

const LEVELS = [
  { key: "low", label: "Low Risk", value: "LOW RISK", color: "#10B981", text: "text-green-700", bg: "bg-green-50" },
  { key: "moderate", label: "Moderate Risk", value: "MODERATE RISK", color: "#F59E0B", text: "text-amber-700", bg: "bg-amber-50" },
  { key: "high", label: "High Risk", value: "HIGH RISK", color: "#EF4444", text: "text-red-700", bg: "bg-red-50" },
];

const RISK_BADGE = {
  "LOW RISK": "bg-green-100 text-green-800",
  "MODERATE RISK": "bg-amber-100 text-amber-800",
  "HIGH RISK": "bg-red-100 text-red-800",
};

const todayLocal = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const pct = (part, total) => (total > 0 ? ((part / total) * 100).toFixed(1) : "0.0");

/**
 * As-of / cut-off date risk profiling report.
 * Shows daily, month-to-date, year-to-date and cumulative counts per risk level,
 * bank-wide (all branches) or for a single branch, plus the profiles themselves.
 *
 * @param {string} apiPrefix - role route prefix: "admin" | "compliance" | "audit"
 * @param {number|string} sectionNumber - number shown in the section badge
 */
export default function AsOfRiskReport({ apiPrefix = "admin", sectionNumber = 4 }) {
  const [asOf, setAsOf] = useState(todayLocal());
  const [branchId, setBranchId] = useState("all");
  const [profilesScope, setProfilesScope] = useState("daily");
  const [branchPeriod, setBranchPeriod] = useState("cumulative");
  const [riskFilter, setRiskFilter] = useState("");
  const [search, setSearch] = useState("");
  const [branchOptions, setBranchOptions] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/${apiPrefix}/dashboard/as-of`, {
        params: { as_of: asOf, branch_id: branchId, profiles_scope: profilesScope },
      });
      setReport(data);
      if (branchId === "all" && Array.isArray(data.branches)) {
        setBranchOptions(
          data.branches
            .filter((b) => b.branch_id !== null)
            .map((b) => ({ id: b.branch_id, name: b.branch_name, brak: b.brak }))
        );
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load as-of report");
    } finally {
      setLoading(false);
    }
  }, [apiPrefix, asOf, branchId, profilesScope]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const selectedBranchName = useMemo(() => {
    if (branchId === "all") return "Bank-wide (All Branches)";
    return branchOptions.find((b) => String(b.id) === String(branchId))?.name || "Selected Branch";
  }, [branchId, branchOptions]);

  const filteredProfiles = useMemo(() => {
    if (!report?.profiles) return [];
    const q = search.trim().toLowerCase();
    return report.profiles.filter(
      (p) =>
        (!riskFilter || p.riskLevel === riskFilter) &&
        (!q ||
          p.name?.toLowerCase().includes(q) ||
          p.branch_name?.toLowerCase().includes(q) ||
          p.created_by?.toLowerCase().includes(q))
    );
  }, [report, riskFilter, search]);

  const branchRows = report?.branches || [];
  const branchTotals = report?.summary?.[branchPeriod] || { low: 0, moderate: 0, high: 0, total: 0 };

  const exportExcel = () => {
    if (!report) return;
    const wb = XLSX.utils.book_new();

    const summarySheet = [
      ["Risk Profiling Report"],
      ["As of", report.as_of_label],
      ["Coverage", selectedBranchName],
      [],
      ["Period", "Range", "Low Risk", "Moderate Risk", "High Risk", "Total"],
      ...PERIODS.map((p) => {
        const s = report.summary[p.key];
        const per = report.periods[p.key];
        return [p.short, per.from ? `${per.from} to ${per.to}` : `Up to ${per.to}`, s.low, s.moderate, s.high, s.total];
      }),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summarySheet), "Summary");

    const branchSheet = [
      [
        "Code", "Branch",
        ...PERIODS.flatMap((p) => [`${p.short} Low`, `${p.short} Moderate`, `${p.short} High`, `${p.short} Total`]),
      ],
      ...branchRows.map((b) => [
        b.brcode, b.branch_name,
        ...PERIODS.flatMap((p) => [b[p.key].low, b[p.key].moderate, b[p.key].high, b[p.key].total]),
      ]),
      [
        "", "TOTAL",
        ...PERIODS.flatMap((p) => {
          const s = report.summary[p.key];
          return [s.low, s.moderate, s.high, s.total];
        }),
      ],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(branchSheet), "By Branch");

    const monthlySheet = [
      ["Month", "Low Risk", "Moderate Risk", "High Risk", "Total"],
      ...report.monthly_breakdown.map((m) => [m.period, m.low, m.moderate, m.high, m.total]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(monthlySheet), "Monthly");

    const profileSheet = [
      ["Client Name", "Risk Level", "Score", "Branch", "Assessed By", "Date", "Time"],
      ...filteredProfiles.map((p) => [p.name, p.riskLevel, p.totalScore, p.branch_name, p.created_by || "", p.date_created, p.time_created]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(profileSheet), "Profiles");

    const branchTag = branchId === "all" ? "BankWide" : selectedBranchName.replace(/\s+/g, "");
    XLSX.writeFile(wb, `RiskProfiling_AsOf_${report.as_of}_${branchTag}.xlsx`);
  };

  return (
    <div className="mb-8">
      {/* Section header */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-3">
          <div className="w-6 h-6 bg-indigo-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">{sectionNumber}</span>
          </div>
          As-of Date Risk Profiling Report
        </h2>
        <p className="text-slate-600 text-sm mb-3">
          Pick a cut-off date to see how many risk profiles were done on that day, month-to-date,
          year-to-date and in total up to that date, by risk level, bank-wide or by branch.
        </p>
        <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent mb-3"></div>
      </div>

      <Card className="w-full max-w-none">
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-end gap-4 justify-between">
            <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
              <label className="flex flex-col text-xs font-medium text-slate-600 gap-1">
                As of / Cut-off Date
                <div className="relative">
                  <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    value={asOf}
                    max={todayLocal()}
                    onChange={(e) => e.target.value && setAsOf(e.target.value)}
                    className="pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </label>
              <label className="flex flex-col text-xs font-medium text-slate-600 gap-1">
                Branch
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 min-w-[220px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">Bank-wide (All Branches)</option>
                  {branchOptions.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={() => setAsOf(todayLocal())}
                  className="px-3 py-2 text-sm border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={fetchReport}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                  title="Refresh"
                >
                  <FiRefreshCw className={loading ? "animate-spin" : ""} />
                  Refresh
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={exportExcel}
              disabled={!report || loading}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              <FiDownload /> Export Excel
            </button>
          </div>
          {report && (
            <p className="text-sm text-slate-500 mt-3">
              Showing <span className="font-semibold text-slate-800">{selectedBranchName}</span> as of{" "}
              <span className="font-semibold text-slate-800">{report.as_of_label}</span>
            </p>
          )}
        </CardHeader>

        <CardContent>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 mb-4 text-sm">
              {error}
            </div>
          )}

          {loading && !report ? (
            <div className="py-12 text-center text-slate-500 text-sm">Loading report...</div>
          ) : report ? (
            <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
              {/* Period summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                {PERIODS.map((p) => {
                  const s = report.summary[p.key];
                  return (
                    <div key={p.key} className="border border-slate-200 rounded-xl p-4">
                      <div className="flex items-baseline justify-between mb-1">
                        <p className="text-sm font-semibold text-slate-700">{p.short}</p>
                        <p className="text-xs text-slate-400">{p.title}</p>
                      </div>
                      <p className="text-xs text-slate-500 mb-3">{report.periods[p.key].label}</p>
                      <p className="text-3xl font-bold text-slate-800 mb-3">{s.total.toLocaleString()}</p>
                      <div className="space-y-1.5">
                        {LEVELS.map((l) => (
                          <div key={l.key} className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2 text-slate-600">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.color }} />
                              {l.label}
                            </span>
                            <span className="font-semibold text-slate-800 tabular-nums">
                              {s[l.key].toLocaleString()}
                              <span className="text-xs text-slate-400 font-normal ml-1">({pct(s[l.key], s.total)}%)</span>
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="flex h-1.5 rounded-full overflow-hidden bg-slate-100 mt-3">
                        {LEVELS.map((l) => (
                          <div key={l.key} style={{ width: `${pct(s[l.key], s.total)}%`, backgroundColor: l.color }} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Monthly breakdown chart */}
              <div className="mb-8">
                <h3 className="text-base font-semibold text-slate-800 mb-1">
                  Monthly Breakdown — {report.as_of.slice(0, 4)}
                </h3>
                <p className="text-xs text-slate-500 mb-3">
                  Profiles per month from January up to the cut-off date
                </p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={report.monthly_breakdown} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      {LEVELS.map((l, i) => (
                        <Bar
                          key={l.key}
                          dataKey={l.key}
                          stackId="a"
                          fill={l.color}
                          name={l.label}
                          radius={i === LEVELS.length - 1 ? [2, 2, 0, 0] : [0, 0, 0, 0]}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Branch breakdown */}
              <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-800">By Branch</h3>
                    <p className="text-xs text-slate-500">{report.periods[branchPeriod].label}</p>
                  </div>
                  <div className="inline-flex rounded-lg border border-slate-300 overflow-hidden text-sm">
                    {PERIODS.map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => setBranchPeriod(p.key)}
                        className={`px-3 py-1.5 ${
                          branchPeriod === p.key ? "bg-indigo-600 text-white" : "bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {p.short}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="text-left px-4 py-2 font-semibold">Branch</th>
                        {LEVELS.map((l) => (
                          <th key={l.key} className="text-right px-4 py-2 font-semibold">{l.label}</th>
                        ))}
                        <th className="text-right px-4 py-2 font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {branchRows.map((b) => {
                        const s = b[branchPeriod];
                        return (
                          <tr key={b.branch_id ?? "unassigned"} className="hover:bg-slate-50">
                            <td className="px-4 py-2 text-slate-800">
                              {b.branch_name}
                              <span className="text-xs text-slate-400 ml-2">{b.brak}</span>
                            </td>
                            {LEVELS.map((l) => (
                              <td key={l.key} className={`px-4 py-2 text-right tabular-nums ${s[l.key] ? l.text : "text-slate-300"}`}>
                                {s[l.key].toLocaleString()}
                              </td>
                            ))}
                            <td className="px-4 py-2 text-right font-semibold tabular-nums text-slate-800">
                              {s.total.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-100 font-semibold text-slate-800">
                      <tr>
                        <td className="px-4 py-2">{branchId === "all" ? "Bank-wide Total" : "Total"}</td>
                        {LEVELS.map((l) => (
                          <td key={l.key} className="px-4 py-2 text-right tabular-nums">{branchTotals[l.key].toLocaleString()}</td>
                        ))}
                        <td className="px-4 py-2 text-right tabular-nums">{branchTotals.total.toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Profiles list */}
              <div>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-800">Risk Profiles</h3>
                    <p className="text-xs text-slate-500">
                      {report.periods[profilesScope].label} — {report.profiles_total.toLocaleString()} profile(s)
                      {report.profiles_truncated && ` (showing latest ${report.profiles.length.toLocaleString()})`}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={profilesScope}
                      onChange={(e) => setProfilesScope(e.target.value)}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    >
                      {PERIODS.map((p) => (
                        <option key={p.key} value={p.key}>{p.short}</option>
                      ))}
                    </select>
                    <select
                      value={riskFilter}
                      onChange={(e) => setRiskFilter(e.target.value)}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    >
                      <option value="">All Risk Levels</option>
                      {LEVELS.map((l) => (
                        <option key={l.key} value={l.value}>{l.label}</option>
                      ))}
                    </select>
                    <div className="relative">
                      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search client, branch, user"
                        className="pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm w-full sm:w-64"
                      />
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-[480px] overflow-y-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600 sticky top-0">
                      <tr>
                        <th className="text-left px-4 py-2 font-semibold">Client Name</th>
                        <th className="text-left px-4 py-2 font-semibold">Risk Level</th>
                        <th className="text-right px-4 py-2 font-semibold">Score</th>
                        <th className="text-left px-4 py-2 font-semibold">Branch</th>
                        <th className="text-left px-4 py-2 font-semibold">Assessed By</th>
                        <th className="text-left px-4 py-2 font-semibold">Date / Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredProfiles.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                            No risk profiles found for this period.
                          </td>
                        </tr>
                      ) : (
                        filteredProfiles.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="px-4 py-2 text-slate-800 font-medium">{p.name}</td>
                            <td className="px-4 py-2">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${RISK_BADGE[p.riskLevel] || "bg-slate-100 text-slate-700"}`}>
                                {p.riskLevel}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-right tabular-nums">{p.totalScore}</td>
                            <td className="px-4 py-2 text-slate-700">{p.branch_name}</td>
                            <td className="px-4 py-2 text-slate-700">{p.created_by || "—"}</td>
                            <td className="px-4 py-2 text-slate-600 whitespace-nowrap">
                              {p.date_created} <span className="text-slate-400">{p.time_created}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
