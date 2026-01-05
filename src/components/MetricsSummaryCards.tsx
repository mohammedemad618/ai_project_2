import type { RunResult } from "@/lib/algorithms";
import type { Algorithm } from "@/lib/algorithms";
import { mean, stdDev } from "@/lib/stats";
import MetricCard from "@/components/MetricCard";

const formatDistance = (value?: number) =>
  value === undefined ? "--" : value.toFixed(3);

const formatMs = (value?: number) =>
  value === undefined ? "--" : `${value.toFixed(1)} ms`;

const formatPercent = (value?: number) =>
  value === undefined ? "--" : `${value.toFixed(2)}%`;

const MetricsSummaryCards = ({
  citiesCount,
  saResult,
  hsaResult,
  history,
}: {
  citiesCount: number;
  saResult?: RunResult;
  hsaResult?: RunResult;
  history: Record<Algorithm, RunResult[]>;
}) => {
  const bestResult = [saResult, hsaResult]
    .filter(Boolean)
    .sort((a, b) => (a!.bestDistance > b!.bestDistance ? 1 : -1))[0];

  const improvement =
    saResult && hsaResult
      ? ((Math.max(saResult.bestDistance, hsaResult.bestDistance) -
          Math.min(saResult.bestDistance, hsaResult.bestDistance)) /
          Math.max(saResult.bestDistance, hsaResult.bestDistance)) *
        100
      : undefined;

  const bestAlgorithm = bestResult?.algorithm;
  const stabilityValues = bestAlgorithm ? history[bestAlgorithm] : [];
  const stability = stabilityValues.length
    ? stdDev(stabilityValues.map((run) => run.bestDistance))
    : undefined;
  const runtime = bestResult
    ? mean([bestResult.runtimeMs])
    : undefined;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <MetricCard
        label="Cities"
        value={String(citiesCount)}
        note="Active dataset size"
      />
      <MetricCard
        label="Best Distance"
        value={formatDistance(bestResult?.bestDistance)}
        note={bestAlgorithm ? `Best by ${bestAlgorithm}` : "Run an algorithm"}
        accent="accent"
      />
      <MetricCard
        label="Execution Time"
        value={formatMs(runtime)}
        note="Latest run duration"
        accent="teal"
      />
      <MetricCard
        label="Improvement"
        value={formatPercent(improvement)}
        note="Relative gap between SA and HSA"
      />
      <MetricCard
        label="Stability"
        value={stability === undefined ? "--" : stability.toFixed(4)}
        note="Std dev across runs"
      />
    </div>
  );
};

export default MetricsSummaryCards;
