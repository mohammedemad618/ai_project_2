"use client";

import { useState } from "react";
import useTspStore from "@/store/tspStore";
import { useShallow } from "zustand/react/shallow";

const PresetManager = () => {
  const [name, setName] = useState("");
  const { presets, savePreset, applyPreset, deletePreset } = useTspStore(
    useShallow((state) => ({
      presets: state.presets,
      savePreset: state.savePreset,
      applyPreset: state.applyPreset,
      deletePreset: state.deletePreset,
    }))
  );

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg">Presets</h3>
          <p className="text-sm text-[color:var(--muted)]">
            Save a named snapshot of both algorithms.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            className="input w-full sm:w-56"
            value={name}
            placeholder="Preset name"
            onChange={(event) => setName(event.target.value)}
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              savePreset(name || "Custom Preset");
              setName("");
            }}
          >
            Save Preset
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {presets.length === 0 ? (
          <p className="text-sm text-[color:var(--muted)]">
            No presets yet. Save your favorite configuration to reuse later.
          </p>
        ) : (
          presets.map((preset) => (
            <div
              key={preset.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--panel-strong)] px-4 py-3 transition hover:shadow"
            >
              <div>
                <p className="text-sm font-semibold">{preset.name}</p>
                <p className="text-xs text-[color:var(--muted)]">
                  {new Date(preset.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => applyPreset(preset.id)}
                >
                  Apply
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => deletePreset(preset.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PresetManager;
