"use client";

import { useState } from "react";
import useTspStore from "@/store/tspStore";
import PresetManager from "@/components/PresetManager";
import { useShallow } from "zustand/react/shallow";

const SliderField = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  hint?: string;
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">{label}</p>
          {hint ? (
            <p className="text-xs text-[color:var(--muted)]">{hint}</p>
          ) : null}
        </div>
        <span className="mono rounded-md border border-[color:var(--stroke)] bg-[color:var(--panel-strong)] px-2 py-1 text-xs">
          {value}
        </span>
      </div>
      <input
        type="range"
        className="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
};

const AlgorithmTabs = () => {
  const [active, setActive] = useState<"SA" | "HSA">("SA");
  const {
    saSettings,
    hsaSettings,
    updateSASettings,
    updateHSASettings,
    resetSASettings,
    resetHSASettings,
  } = useTspStore(
    useShallow((state) => ({
      saSettings: state.saSettings,
      hsaSettings: state.hsaSettings,
      updateSASettings: state.updateSASettings,
      updateHSASettings: state.updateHSASettings,
      resetSASettings: state.resetSASettings,
      resetHSASettings: state.resetHSASettings,
    }))
  );

  return (
    <div className="space-y-6">
      <div className="card flex flex-wrap gap-2 p-3">
        <button
          type="button"
          className={`btn ${active === "SA" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setActive("SA")}
        >
          Simulated Annealing
        </button>
        <button
          type="button"
          className={`btn ${active === "HSA" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setActive("HSA")}
        >
          Harmony Search
        </button>
      </div>

      {active === "SA" ? (
        <div className="card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="tag">SA</span>
              <h2 className="mt-3 text-lg">SA Settings</h2>
              <p className="text-sm text-[color:var(--muted)]">
                Fine-tune exploration versus exploitation.
              </p>
            </div>
            <button type="button" className="btn" onClick={resetSASettings}>
              Restore Defaults
            </button>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <SliderField
              label="Initial Temperature"
              value={saSettings.initialTemperature}
              min={400}
              max={8000}
              step={50}
              onChange={(value) => updateSASettings({ initialTemperature: value })}
              hint="Higher values explore more aggressively."
            />
            <SliderField
              label="Cooling Rate"
              value={saSettings.coolingRate}
              min={0.93}
              max={0.9995}
              step={0.001}
              onChange={(value) => updateSASettings({ coolingRate: value })}
              hint="Lower values cool faster."
            />
            <SliderField
              label="Iterations"
              value={saSettings.iterations}
              min={1000}
              max={40000}
              step={500}
              onChange={(value) => updateSASettings({ iterations: value })}
            />
            <SliderField
              label="Reheat Interval"
              value={saSettings.reheatInterval}
              min={0}
              max={10000}
              step={250}
              onChange={(value) => updateSASettings({ reheatInterval: value })}
              hint="Reheat if no improvement for N iterations."
            />
            <SliderField
              label="Reheat Multiplier"
              value={saSettings.reheatMultiplier}
              min={1}
              max={2}
              step={0.05}
              onChange={(value) => updateSASettings({ reheatMultiplier: value })}
              hint="Boost temperature when reheating."
            />
            <div className="space-y-2">
              <label className="text-sm font-semibold">Neighborhood</label>
              <select
                className="select w-full"
                value={saSettings.neighborhood}
                onChange={(event) =>
                  updateSASettings({
                    neighborhood: event.target.value as
                      | "swap"
                      | "two-opt"
                      | "insert",
                  })
                }
              >
                <option value="swap">Swap</option>
                <option value="two-opt">2-opt</option>
                <option value="insert">Insert</option>
              </select>
              <p className="text-xs text-[color:var(--muted)]">
                Pick how candidate routes are perturbed.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="tag">HSA</span>
              <h2 className="mt-3 text-lg">HSA Settings</h2>
              <p className="text-sm text-[color:var(--muted)]">
                Balance memory reuse with new improvisations.
              </p>
            </div>
            <button type="button" className="btn" onClick={resetHSASettings}>
              Restore Defaults
            </button>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <SliderField
              label="Harmony Memory Size"
              value={hsaSettings.hms}
              min={8}
              max={80}
              step={1}
              onChange={(value) => updateHSASettings({ hms: value })}
            />
            <SliderField
              label="HMCR"
              value={hsaSettings.hmcr}
              min={0.6}
              max={0.99}
              step={0.01}
              onChange={(value) => updateHSASettings({ hmcr: value })}
              hint="Probability of sampling memory."
            />
            <SliderField
              label="PAR"
              value={hsaSettings.par}
              min={0.05}
              max={0.8}
              step={0.01}
              onChange={(value) => updateHSASettings({ par: value })}
              hint="Chance to adjust a borrowed harmony."
            />
            <SliderField
              label="Iterations"
              value={hsaSettings.iterations}
              min={1000}
              max={40000}
              step={500}
              onChange={(value) => updateHSASettings({ iterations: value })}
            />
            <SliderField
              label="Elite Count"
              value={hsaSettings.eliteCount}
              min={0}
              max={8}
              step={1}
              onChange={(value) => updateHSASettings({ eliteCount: value })}
              hint="Protect top harmonies from replacement."
            />
          </div>
        </div>
      )}

      <PresetManager />
    </div>
  );
};

export default AlgorithmTabs;
