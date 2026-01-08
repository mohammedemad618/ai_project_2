"use client";

import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import RouteCanvas from "@/components/RouteCanvas";
import ConvergenceChart from "@/components/ConvergenceChart";
import MetricsSummaryCards from "@/components/MetricsSummaryCards";
import useTspStore from "@/store/tspStore";
import { useShallow } from "zustand/react/shallow";

const ResultsPage = () => {
  const { cities, startIndex, lastResults, history } = useTspStore(
    useShallow((state) => ({
      cities: state.cities,
      startIndex: state.startIndex,
      lastResults: state.lastResults,
      history: state.history,
    }))
  );

  const saResult = lastResults.SA;
  const hsaResult = lastResults.HSA;
  const bestResult = [saResult, hsaResult]
    .filter(Boolean)
    .sort((a, b) => (a!.bestDistance > b!.bestDistance ? 1 : -1))[0];
  const convergenceSeries = [saResult, hsaResult]
    .filter(Boolean)
    .map((result) => ({
      id: result!.algorithm,
      label: result!.algorithm === "SA" ? "Simulated Annealing" : "Harmony Search",
      color: result!.algorithm === "SA" ? "#2a4b6b" : "#2f6d5a",
      data: result!.convergence,
    }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Results Visualization"
        subtitle="Inspect the optimized routes and convergence behavior for each algorithm."
        kicker="Results"
        actions={
          <Link href="/reports" className="btn btn-primary">
            Compare Runs
          </Link>
        }
      />

      <MetricsSummaryCards
        citiesCount={cities.length}
        saResult={saResult}
        hsaResult={hsaResult}
        history={history}
      />

      <div className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg">Best Performer</h3>
            <p className="text-sm text-[color:var(--muted)]">
              The algorithm with the shortest distance on the latest dataset.
            </p>
          </div>
          <span className="tag">
            {bestResult ? bestResult.algorithm : "No Runs"}
          </span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--panel-strong)] p-3">
            <p className="text-xs uppercase tracking-[0.12em] text-[color:var(--muted)]">
              Best Distance
            </p>
            <p className="mono text-lg">
              {bestResult ? bestResult.bestDistance.toFixed(3) : "--"}
            </p>
          </div>
          <div className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--panel-strong)] p-3">
            <p className="text-xs uppercase tracking-[0.12em] text-[color:var(--muted)]">
              Runtime
            </p>
            <p className="mono text-lg">
              {bestResult ? `${bestResult.runtimeMs.toFixed(1)} ms` : "--"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="tag">SA</span>
              <h3 className="mt-3 text-lg">Simulated Annealing Route</h3>
              <p className="text-sm text-[color:var(--muted)]">
                {saResult
                  ? `Best distance: ${saResult.bestDistance.toFixed(3)}`
                  : "Run SA to see the route."}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <RouteCanvas
              cities={cities}
              route={saResult?.bestRoute}
              startIndex={startIndex}
              height={300}
            />
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="tag">HSA</span>
              <h3 className="mt-3 text-lg">Harmony Search Route</h3>
              <p className="text-sm text-[color:var(--muted)]">
                {hsaResult
                  ? `Best distance: ${hsaResult.bestDistance.toFixed(3)}`
                  : "Run HSA to see the route."}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <RouteCanvas
              cities={cities}
              route={hsaResult?.bestRoute}
              startIndex={startIndex}
              height={300}
            />
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="text-lg">Convergence Comparison</h3>
        <p className="text-sm text-[color:var(--muted)]">
          Overlay both algorithms to compare convergence behavior.
        </p>
        <div className="mt-4">
          {convergenceSeries.length ? (
            <ConvergenceChart series={convergenceSeries} height={300} />
          ) : (
            <div className="rounded-2xl border border-dashed border-[color:var(--stroke)] bg-[color:var(--panel)] p-6 text-sm text-[color:var(--muted)]">
              Run algorithms to generate convergence curves.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
