import type { Algorithm, RunResult } from "@/lib/algorithms";
import { max, mean, min, stdDev } from "@/lib/stats";

const formatDistance = (value: number) => value.toFixed(3);

const summaryRow = (runs: RunResult[]) => {
  if (runs.length === 0) {
    return {
      avg: "--",
      best: "--",
      worst: "--",
      std: "--",
      runtime: "--",
    };
  }
  const distances = runs.map((run) => run.bestDistance);
  const runtimes = runs.map((run) => run.runtimeMs);
  return {
    avg: formatDistance(mean(distances)),
    best: formatDistance(min(distances)),
    worst: formatDistance(max(distances)),
    std: formatDistance(stdDev(distances)),
    runtime: `${mean(runtimes).toFixed(1)} ms`,
  };
};

const ComparisonTable = ({
  history,
}: {
  history: Record<Algorithm, RunResult[]>;
}) => {
  const sa = summaryRow(history.SA ?? []);
  const hsa = summaryRow(history.HSA ?? []);

  return (
    <div className="card overflow-x-auto">
      <table className="min-w-[600px] w-full text-left text-sm">
        <thead className="bg-[color:var(--panel-strong)] text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
          <tr>
            <th className="px-4 py-3">Algorithm</th>
            <th className="px-4 py-3">Average</th>
            <th className="px-4 py-3">Best</th>
            <th className="px-4 py-3">Worst</th>
            <th className="px-4 py-3">Std Dev</th>
            <th className="px-4 py-3">Runtime</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[color:var(--stroke)]">
          <tr className="transition hover:bg-white/70">
            <td className="px-4 py-3 font-semibold">Simulated Annealing</td>
            <td className="px-4 py-3 mono">{sa.avg}</td>
            <td className="px-4 py-3 mono">{sa.best}</td>
            <td className="px-4 py-3 mono">{sa.worst}</td>
            <td className="px-4 py-3 mono">{sa.std}</td>
            <td className="px-4 py-3 mono">{sa.runtime}</td>
          </tr>
          <tr className="transition hover:bg-white/70">
            <td className="px-4 py-3 font-semibold">Harmony Search</td>
            <td className="px-4 py-3 mono">{hsa.avg}</td>
            <td className="px-4 py-3 mono">{hsa.best}</td>
            <td className="px-4 py-3 mono">{hsa.worst}</td>
            <td className="px-4 py-3 mono">{hsa.std}</td>
            <td className="px-4 py-3 mono">{hsa.runtime}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default ComparisonTable;
