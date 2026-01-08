import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Algorithm, HSASettings, RunResult, SASettings } from "@/lib/algorithms";
import {
  defaultHSASettings,
  defaultSASettings,
  generateCities,
  MIN_CITY_COUNT,
} from "@/lib/tsp";
import type { City, Distribution } from "@/lib/tsp";

export type Preset = {
  id: string;
  name: string;
  saSettings: SASettings;
  hsaSettings: HSASettings;
  createdAt: string;
};

export type TspStore = {
  cities: City[];
  cityCount: number;
  distribution: Distribution;
  startIndex: number;
  saSettings: SASettings;
  hsaSettings: HSASettings;
  presets: Preset[];
  lastResults: Partial<Record<Algorithm, RunResult>>;
  history: Record<Algorithm, RunResult[]>;
  setCityCount: (count: number) => void;
  setDistribution: (distribution: Distribution) => void;
  generateCities: (count?: number, distribution?: Distribution) => void;
  setCities: (cities: City[]) => void;
  updateCity: (index: number, x: number, y: number) => void;
  setStartIndex: (index: number) => void;
  updateSASettings: (settings: Partial<SASettings>) => void;
  updateHSASettings: (settings: Partial<HSASettings>) => void;
  resetSASettings: () => void;
  resetHSASettings: () => void;
  savePreset: (name: string) => void;
  applyPreset: (id: string) => void;
  deletePreset: (id: string) => void;
  addRunResult: (result: RunResult) => void;
  clearHistory: () => void;
};

const createPresetId = () =>
  `preset-${Date.now()}-${Math.floor(Math.random() * 1e5)}`;

const clampCityCount = (count: number) => Math.max(MIN_CITY_COUNT, count);

const initialCount = 150;
const initialDistribution: Distribution = "clustered";
const initialCities = generateCities(initialCount, initialDistribution);

const useTspStore = create<TspStore>()(
  persist(
    (set, get) => ({
      cities: initialCities,
      cityCount: initialCount,
      distribution: initialDistribution,
      startIndex: 0,
      saSettings: { ...defaultSASettings },
      hsaSettings: { ...defaultHSASettings },
      presets: [],
      lastResults: {},
      history: { SA: [], HSA: [] },
      setCityCount: (count) => set({ cityCount: clampCityCount(count) }),
      setDistribution: (distribution) => set({ distribution }),
      generateCities: (count, distribution) => {
        const nextCount = clampCityCount(count ?? get().cityCount);
        const nextDistribution = distribution ?? get().distribution;
        set({
          cities: generateCities(nextCount, nextDistribution),
          cityCount: nextCount,
          distribution: nextDistribution,
          startIndex: 0,
        });
      },
      setCities: (cities) => {
        if (cities.length < MIN_CITY_COUNT) return;
        set({ cities, cityCount: cities.length, startIndex: 0 });
      },
      updateCity: (index, x, y) =>
        set((state) => ({
          cities: state.cities.map((city, i) =>
            i === index ? { ...city, x, y } : city
          ),
        })),
      setStartIndex: (index) => set({ startIndex: index }),
      updateSASettings: (settings) =>
        set((state) => ({ saSettings: { ...state.saSettings, ...settings } })),
      updateHSASettings: (settings) =>
        set((state) => ({ hsaSettings: { ...state.hsaSettings, ...settings } })),
      resetSASettings: () => set({ saSettings: { ...defaultSASettings } }),
      resetHSASettings: () => set({ hsaSettings: { ...defaultHSASettings } }),
      savePreset: (name) => {
        const preset: Preset = {
          id: createPresetId(),
          name: name.trim() || "Preset",
          saSettings: { ...get().saSettings },
          hsaSettings: { ...get().hsaSettings },
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ presets: [preset, ...state.presets] }));
      },
      applyPreset: (id) => {
        const preset = get().presets.find((item) => item.id === id);
        if (!preset) return;
        set({
          saSettings: { ...preset.saSettings },
          hsaSettings: { ...preset.hsaSettings },
        });
      },
      deletePreset: (id) =>
        set((state) => ({
          presets: state.presets.filter((item) => item.id !== id),
        })),
      addRunResult: (result) =>
        set((state) => ({
          lastResults: { ...state.lastResults, [result.algorithm]: result },
          history: {
            ...state.history,
            [result.algorithm]: [
              result,
              ...state.history[result.algorithm],
            ],
          },
        })),
      clearHistory: () => set({ history: { SA: [], HSA: [] } }),
    }),
    {
      name: "tsp-optimizer-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        saSettings: state.saSettings,
        hsaSettings: state.hsaSettings,
        presets: state.presets,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<TspStore>;
        return {
          ...currentState,
          ...persisted,
          saSettings: { ...currentState.saSettings, ...persisted.saSettings },
          hsaSettings: { ...currentState.hsaSettings, ...persisted.hsaSettings },
        };
      },
    }
  )
);

export default useTspStore;
