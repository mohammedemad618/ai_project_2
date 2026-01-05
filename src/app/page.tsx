"use client";

import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import MetricCard from "@/components/MetricCard";
import RouteCanvas from "@/components/RouteCanvas";
import ConvergenceChart from "@/components/ConvergenceChart";
import useTspStore from "@/store/tspStore";
import { useShallow } from "zustand/react/shallow";

const DashboardPage = () => {
  const { cities, distribution, lastResults, startIndex } = useTspStore(
    useShallow((state) => ({
      cities: state.cities,
      distribution: state.distribution,
      lastResults: state.lastResults,
      startIndex: state.startIndex,
    }))
  );

  const results = [lastResults.SA, lastResults.HSA].filter(Boolean);
  const bestResult = results
    .slice()
    .sort((a, b) => (a!.bestDistance > b!.bestDistance ? 1 : -1))[0];
  const latestResult = results
    .slice()
    .sort((a, b) =>
      a!.createdAt > b!.createdAt ? -1 : a!.createdAt < b!.createdAt ? 1 : 0
    )[0];

  const convergenceSeries = results.map((result) => ({
    id: result!.algorithm,
    label:
      result!.algorithm === "SA" ? "Simulated Annealing" : "Harmony Search",
    color: result!.algorithm === "SA" ? "#2f6bff" : "#2a8f7c",
    data: result!.convergence,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="TSP Optimization Dashboard"
        subtitle="Project 2 | TC6544 - Advanced Artificial Intelligence | Run SA and HSA side-by-side with full control over datasets, parameters, and reports."
        kicker="Project 2"
        actions={
          <>
            <Link href="/cities" className="btn btn-primary">
              Generate Cities
            </Link>
            <Link href="/run" className="btn btn-accent">
              Run Algorithms
            </Link>
            <Link href="/reports" className="btn btn-ghost">
              Export Reports
            </Link>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Cities"
          value={`${cities.length}`}
          note={`Distribution: ${distribution}`}
        />
        <MetricCard
          label="Best Distance"
          value={bestResult ? bestResult.bestDistance.toFixed(3) : "--"}
          note={bestResult ? `Best by ${bestResult.algorithm}` : "Run an algorithm"}
          accent="accent"
        />
        <MetricCard
          label="Latest Runtime"
          value={latestResult ? `${latestResult.runtimeMs.toFixed(1)} ms` : "--"}
          note={latestResult ? `Latest: ${latestResult.algorithm}` : "No runs yet"}
          accent="teal"
        />
        <MetricCard
          label="Iterations"
          value={latestResult ? `${latestResult.settings.iterations}` : "--"}
          note="Last configuration"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg">Latest Route</h2>
            <span className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
              Dataset preview
            </span>
          </div>
          <div className="mt-4">
            <RouteCanvas
              cities={cities}
              route={bestResult?.bestRoute}
              startIndex={startIndex}
              height={280}
            />
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-lg">Convergence Snapshot</h2>
          <p className="text-sm text-[color:var(--muted)]">
            Recent optimization performance.
          </p>
          <div className="mt-4">
            {convergenceSeries.length ? (
              <ConvergenceChart series={convergenceSeries} height={260} />
            ) : (
              <div className="rounded-2xl border border-dashed border-[color:var(--stroke)] bg-white/60 p-6 text-sm text-[color:var(--muted)]">
                Run SA or HSA to see convergence curves.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card-strong card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg">Workflow Checklist</h2>
            <p className="text-sm text-[color:var(--muted)]">
              Follow the sequence below for a structured experiment.
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Link href="/cities" className="card border-0 bg-white/70 p-4">
            <span className="tag">Step 1</span>
            <h3 className="mt-3 text-base font-semibold">Generate Cities</h3>
            <p className="mt-2 text-xs text-[color:var(--muted)]">
              Build a random or clustered dataset, then choose a start city.
            </p>
          </Link>
          <Link href="/algorithms" className="card border-0 bg-white/70 p-4">
            <span className="tag">Step 2</span>
            <h3 className="mt-3 text-base font-semibold">Tune Algorithms</h3>
            <p className="mt-2 text-xs text-[color:var(--muted)]">
              Adjust SA and HSA parameters and save presets.
            </p>
          </Link>
          <Link href="/run" className="card border-0 bg-white/70 p-4">
            <span className="tag">Step 3</span>
            <h3 className="mt-3 text-base font-semibold">Run & Monitor</h3>
            <p className="mt-2 text-xs text-[color:var(--muted)]">
              Launch algorithms and observe live convergence.
            </p>
          </Link>
          <Link href="/results" className="card border-0 bg-white/70 p-4">
            <span className="tag">Step 4</span>
            <h3 className="mt-3 text-base font-semibold">Analyze Results</h3>
            <p className="mt-2 text-xs text-[color:var(--muted)]">
              Compare routes and export summary reports.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
