"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import ComparisonTable from "@/components/ComparisonTable";
import ExportButtons from "@/components/ExportButtons";
import useTspStore from "@/store/tspStore";
import { runHSA, runSA } from "@/lib/algorithms";
import type { Algorithm } from "@/lib/algorithms";
import { useShallow } from "zustand/react/shallow";
import { buildDistanceMatrix } from "@/lib/tsp";

const ReportsPage = () => {
  const {
    cities,
    startIndex,
    saSettings,
    hsaSettings,
    history,
    addRunResult,
    clearHistory,
  } = useTspStore(
    useShallow((state) => ({
      cities: state.cities,
      startIndex: state.startIndex,
      saSettings: state.saSettings,
      hsaSettings: state.hsaSettings,
      history: state.history,
      addRunResult: state.addRunResult,
      clearHistory: state.clearHistory,
    }))
  );

  const [mode, setMode] = useState<Algorithm | "Both">("Both");
  const [runs, setRuns] = useState(10);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  const runBatch = async () => {
    if (!cities.length) return;
    setIsRunning(true);
    setProgress(0);
    const totalRuns = mode === "Both" ? runs * 2 : runs;
    let completed = 0;
    const matrix = buildDistanceMatrix(cities);

    for (let i = 0; i < runs; i += 1) {
      if (mode !== "HSA") {
        const result = runSA(cities, saSettings, startIndex, undefined, matrix);
        addRunResult(result);
        completed += 1;
        setProgress(completed / totalRuns);
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
      if (mode !== "SA") {
        const result = runHSA(cities, hsaSettings, startIndex, undefined, matrix);
        addRunResult(result);
        completed += 1;
        setProgress(completed / totalRuns);
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    setIsRunning(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Comparison & Reports"
        subtitle="Run multiple experiments and export clean datasets for research analysis."
        kicker="Reports"
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="card p-5">
          <h3 className="text-lg">Batch Runs</h3>
          <p className="text-sm text-[color:var(--muted)]">
            Execute several runs to estimate mean and stability.
          </p>
          <div className="mt-4 grid gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-sm font-semibold">Algorithm</label>
              <select
                className="select"
                value={mode}
                onChange={(event) =>
                  setMode(event.target.value as Algorithm | "Both")
                }
              >
                <option value="Both">Both</option>
                <option value="SA">Simulated Annealing</option>
                <option value="HSA">Harmony Search</option>
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-sm font-semibold">Runs</label>
              <select
                className="select"
                value={runs}
                onChange={(event) => setRuns(Number(event.target.value))}
              >
                <option value={10}>10</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-primary"
                disabled={isRunning}
                onClick={runBatch}
              >
                {isRunning ? "Running..." : "Run Batch"}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={clearHistory}
              >
                Clear History
              </button>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <p className="text-xs text-[color:var(--muted)]">
              {Math.round(progress * 100)}% complete
            </p>
            <div className="rounded-2xl border border-[color:var(--stroke)] bg-white/70 p-3 text-xs text-[color:var(--muted)]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>Dataset: {cities.length} cities</span>
                <span>Start city: {startIndex + 1}</span>
              </div>
            </div>
          </div>
        </div>

        <ExportButtons />
      </div>

      <ComparisonTable history={history} />
    </div>
  );
};

export default ReportsPage;
