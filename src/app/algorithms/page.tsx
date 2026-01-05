"use client";

import PageHeader from "@/components/PageHeader";
import AlgorithmTabs from "@/components/AlgorithmTabs";
import useTspStore from "@/store/tspStore";
import { useShallow } from "zustand/react/shallow";

const AlgorithmsPage = () => {
  const { saSettings, hsaSettings } = useTspStore(
    useShallow((state) => ({
      saSettings: state.saSettings,
      hsaSettings: state.hsaSettings,
    }))
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Algorithm Settings"
        subtitle="Tune SA and HSA parameters, then save presets for repeated experiments."
        kicker="Algorithms"
      />

      <div className="card p-5">
        <h3 className="text-lg">Current Snapshot</h3>
        <p className="text-sm text-[color:var(--muted)]">
          A quick glance at the active configuration for each algorithm.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-[color:var(--stroke)] bg-white/70 p-4">
            <span className="tag">SA</span>
            <h4 className="mt-3 text-sm font-semibold">Simulated Annealing</h4>
            <div className="mt-2 space-y-1 text-xs text-[color:var(--muted)]">
              <p>Temp: {saSettings.initialTemperature}</p>
              <p>Cooling: {saSettings.coolingRate}</p>
              <p>Iterations: {saSettings.iterations}</p>
              <p>Neighborhood: {saSettings.neighborhood}</p>
              <p>Reheat: {saSettings.reheatInterval}</p>
              <p>Multiplier: {saSettings.reheatMultiplier}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-[color:var(--stroke)] bg-white/70 p-4">
            <span className="tag">HSA</span>
            <h4 className="mt-3 text-sm font-semibold">Harmony Search</h4>
            <div className="mt-2 space-y-1 text-xs text-[color:var(--muted)]">
              <p>HMS: {hsaSettings.hms}</p>
              <p>HMCR: {hsaSettings.hmcr}</p>
              <p>PAR: {hsaSettings.par}</p>
              <p>Iterations: {hsaSettings.iterations}</p>
              <p>Elite: {hsaSettings.eliteCount}</p>
            </div>
          </div>
        </div>
      </div>

      <AlgorithmTabs />
    </div>
  );
};

export default AlgorithmsPage;
