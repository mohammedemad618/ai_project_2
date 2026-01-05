"use client";

import useTspStore from "@/store/tspStore";
import { useShallow } from "zustand/react/shallow";
import { buildSummaryReport, downloadFile, runsToCSV } from "@/lib/export";

const ExportButtons = () => {
  const {
    cities,
    saSettings,
    hsaSettings,
    history,
    lastResults,
  } = useTspStore(
    useShallow((state) => ({
      cities: state.cities,
      saSettings: state.saSettings,
      hsaSettings: state.hsaSettings,
      history: state.history,
      lastResults: state.lastResults,
    }))
  );

  const handleCSV = () => {
    const runs = [...history.SA, ...history.HSA];
    const csv = runsToCSV(runs);
    downloadFile(`tsp-runs-${Date.now()}.csv`, csv, "text/csv");
  };

  const handleJSON = () => {
    const payload = {
      generatedAt: new Date().toISOString(),
      cities,
      settings: {
        sa: saSettings,
        hsa: hsaSettings,
      },
      latestResults: lastResults,
      history,
    };
    downloadFile(
      `tsp-results-${Date.now()}.json`,
      JSON.stringify(payload, null, 2),
      "application/json"
    );
  };

  const handleSummary = () => {
    const report = buildSummaryReport({
      cities,
      saRuns: history.SA,
      hsaRuns: history.HSA,
    });
    downloadFile(`tsp-summary-${Date.now()}.txt`, report, "text/plain");
  };

  return (
    <div className="card flex flex-col gap-4 p-5">
      <div>
        <h3 className="text-lg">Export Center</h3>
        <p className="text-sm text-[color:var(--muted)]">
          Download raw runs or a formatted summary for reporting.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary" onClick={handleCSV}>
          Export CSV
        </button>
        <button type="button" className="btn btn-ghost" onClick={handleJSON}>
          Export JSON
        </button>
        <button type="button" className="btn btn-ghost" onClick={handleSummary}>
          Download Summary
        </button>
      </div>
    </div>
  );
};

export default ExportButtons;
