"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import CityGeneratorPanel from "@/components/CityGeneratorPanel";
import RouteCanvas from "@/components/RouteCanvas";
import useTspStore from "@/store/tspStore";
import { useShallow } from "zustand/react/shallow";

const CitiesPage = () => {
  const [mode, setMode] = useState<"drag" | "start">("drag");
  const {
    cities,
    startIndex,
    updateCity,
    setStartIndex,
    cityCount,
    distribution,
  } = useTspStore(
    useShallow((state) => ({
      cities: state.cities,
      startIndex: state.startIndex,
      updateCity: state.updateCity,
      setStartIndex: state.setStartIndex,
      cityCount: state.cityCount,
      distribution: state.distribution,
    }))
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cities Setup"
        subtitle="Generate, import, and refine the coordinates for your TSP instance."
        kicker="Cities"
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-6">
          <CityGeneratorPanel mode={mode} onModeChange={setMode} />
          <div className="card p-5">
            <h3 className="text-lg">Dataset Summary</h3>
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--panel-strong)] p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                  Cities
                </p>
                <p className="mono text-lg">{cityCount}</p>
              </div>
              <div className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--panel-strong)] p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                  Distribution
                </p>
                <p className="mono text-lg">{distribution}</p>
              </div>
              <div className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--panel-strong)] p-3 sm:col-span-2">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                  Start City
                </p>
                <p className="mono text-lg">{startIndex + 1}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg">Interactive Map</h3>
            <span className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
              {mode === "drag" ? "Drag" : "Pick Start"}
            </span>
          </div>
          <p className="text-sm text-[color:var(--muted)]">
            {mode === "drag"
              ? "Drag cities to reposition them."
              : "Click a city to set the tour origin."}
          </p>
          <div className="mt-4">
            <RouteCanvas
              cities={cities}
              startIndex={startIndex}
              mode={mode}
              onMoveCity={updateCity}
              onSelectStart={setStartIndex}
              height={420}
            />
          </div>
          <div className="mt-3 text-xs text-[color:var(--muted)]">
            Drag mode updates city coordinates immediately. Start mode updates the
            tour origin used by both algorithms.
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitiesPage;
