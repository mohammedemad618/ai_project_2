import type { RunResult } from "./algorithms";
import type { City } from "./tsp";
import { mean, max, min, stdDev } from "./stats";

export const downloadFile = (
  filename: string,
  content: string,
  type = "text/plain"
) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export const runsToCSV = (runs: RunResult[]) => {
  const header = [
    "id",
    "algorithm",
    "bestDistance",
    "runtimeMs",
    "iterations",
    "createdAt",
  ];
  const rows = runs.map((run) => {
    const iterations =
      "iterations" in run.settings ? run.settings.iterations : 0;
    return [
      run.id,
      run.algorithm,
      run.bestDistance.toFixed(6),
      run.runtimeMs.toFixed(2),
      String(iterations),
      run.createdAt,
    ];
  });

  return [header, ...rows].map((row) => row.join(",")).join("\n");
};

const formatDistance = (value: number) => value.toFixed(4);

const buildAlgoSection = (label: string, runs: RunResult[]) => {
  if (runs.length === 0) {
    return `${label}: no runs available`;
  }
  const distances = runs.map((run) => run.bestDistance);
  const runtimes = runs.map((run) => run.runtimeMs);
  return [
    `${label}:`,
    `  runs: ${runs.length}`,
    `  best: ${formatDistance(min(distances))}`,
    `  worst: ${formatDistance(max(distances))}`,
    `  mean: ${formatDistance(mean(distances))}`,
    `  std: ${formatDistance(stdDev(distances))}`,
    `  avg runtime (ms): ${mean(runtimes).toFixed(2)}`,
  ].join("\n");
};

export const buildSummaryReport = (options: {
  cities: City[];
  saRuns: RunResult[];
  hsaRuns: RunResult[];
}) => {
  const { cities, saRuns, hsaRuns } = options;
  return [
    "TSP Optimization Summary Report",
    "=================================",
    `Cities: ${cities.length}`,
    "",
    buildAlgoSection("Simulated Annealing", saRuns),
    "",
    buildAlgoSection("Harmony Search", hsaRuns),
  ].join("\n");
};
