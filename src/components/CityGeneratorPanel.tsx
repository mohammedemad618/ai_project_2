"use client";

import { useRef, useState } from "react";
import useTspStore from "@/store/tspStore";
import { parseCitiesFromCSV, parseCitiesFromJSON } from "@/lib/tsp";
import type { Distribution } from "@/lib/tsp";
import { useShallow } from "zustand/react/shallow";

const distributions: Array<{ id: Distribution; label: string }> = [
  { id: "random", label: "Random" },
  { id: "clustered", label: "Clustered" },
];

type CityGeneratorPanelProps = {
  mode: "drag" | "start";
  onModeChange: (mode: "drag" | "start") => void;
};

const CityGeneratorPanel = ({
  mode,
  onModeChange,
}: CityGeneratorPanelProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const {
    cityCount,
    distribution,
    setCityCount,
    setDistribution,
    generateCities,
    setCities,
  } = useTspStore(
    useShallow((state) => ({
      cityCount: state.cityCount,
      distribution: state.distribution,
      setCityCount: state.setCityCount,
      setDistribution: state.setDistribution,
      generateCities: state.generateCities,
      setCities: state.setCities,
    }))
  );

  const [importError, setImportError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    const text = await file.text();
    let parsed = [];
    try {
      if (file.name.toLowerCase().endsWith(".json")) {
        parsed = parseCitiesFromJSON(text);
      } else {
        parsed = parseCitiesFromCSV(text);
      }
    } catch {
      setImportError("Could not parse file. Use CSV or JSON coordinates.");
      return;
    }

    if (parsed.length < 3) {
      setImportError("Not enough valid city coordinates found.");
      return;
    }

    setImportError(null);
    setCities(parsed);
  };

  return (
    <div className="card flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-lg">Cities Setup</h2>
          <p className="text-sm text-[color:var(--muted)]">
            Generate a dataset or import coordinates to start exploring routes.
          </p>
        </div>
        <span className="tag">{mode === "drag" ? "Edit" : "Start"}</span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold">City count</label>
          <span className="mono text-sm">{cityCount}</span>
        </div>
        <input
          type="range"
          min={80}
          max={600}
          step={1}
          value={cityCount}
          onChange={(event) => setCityCount(Number(event.target.value))}
          className="range"
        />
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold">Distribution</p>
        <div className="flex flex-wrap gap-2">
          {distributions.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`btn ${
                distribution === item.id ? "btn-primary" : "btn-ghost"
              }`}
              onClick={() => setDistribution(item.id)}
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => fileInputRef.current?.click()}
          >
            Import File
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.json"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFile(file);
            }}
            className="hidden"
          />
        </div>
        {importError ? (
          <p className="text-xs text-[color:var(--accent)]">{importError}</p>
        ) : null}
        <p className="text-xs text-[color:var(--muted)]">
          Import format: CSV (x,y) or JSON array of points.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-accent"
          onClick={() => generateCities(cityCount, distribution)}
        >
          Generate Cities
        </button>
        <button
          type="button"
          className={`btn ${mode === "drag" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => onModeChange("drag")}
        >
          Drag Mode
        </button>
        <button
          type="button"
          className={`btn ${mode === "start" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => onModeChange("start")}
        >
          Select Start
        </button>
      </div>

      <div className="divider" />

      <div className="text-xs text-[color:var(--muted)]">
        Tip: drag points to refine the dataset, or switch to Select Start and tap
        a city to define the tour origin.
      </div>
    </div>
  );
};

export default CityGeneratorPanel;
