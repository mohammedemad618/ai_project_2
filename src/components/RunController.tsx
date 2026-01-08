"use client";

import { useEffect, useRef, useState } from "react";
import type {
  Algorithm,
  ConvergencePoint,
  HSASettings,
  RunResult,
  SASettings,
} from "@/lib/algorithms";
import { MIN_CITY_COUNT, randomRoute } from "@/lib/tsp";
import RouteCanvas from "@/components/RouteCanvas";
import ConvergenceChart from "@/components/ConvergenceChart";
import useTspStore from "@/store/tspStore";
import { useShallow } from "zustand/react/shallow";
import type { WorkerOutgoingMessage, WorkerProgressPayload } from "@/workers/types";

const createRunId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `run-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
};

type LiveStatus = {
  algorithm: Algorithm;
  running: boolean;
  paused: boolean;
  iteration: number;
  iterations: number;
  bestDistance: number;
  bestRoute: number[];
  convergence: ConvergencePoint[];
  runtimeMs: number;
  temperature?: number;
  memoryUpdates?: number;
};

const formatDistance = (value?: number) => {
  if (!Number.isFinite(value)) return "--";
  return value!.toFixed(3);
};

const createWorker = () =>
  new Worker(new URL("../workers/tspWorker.ts", import.meta.url), {
    type: "module",
  });

const RunController = () => {
  const {
    cities,
    startIndex,
    saSettings,
    hsaSettings,
    addRunResult,
  } = useTspStore(
    useShallow((state) => ({
      cities: state.cities,
      startIndex: state.startIndex,
      saSettings: state.saSettings,
      hsaSettings: state.hsaSettings,
      addRunResult: state.addRunResult,
    }))
  );

  const [sharedInitial, setSharedInitial] = useState(true);
  const [syncIterations, setSyncIterations] = useState(true);
  const [speedTarget, setSpeedTarget] = useState(1200);
  const [saStatus, setSaStatus] = useState<LiveStatus | null>(null);
  const [hsaStatus, setHsaStatus] = useState<LiveStatus | null>(null);

  const saWorkerRef = useRef<Worker | null>(null);
  const hsaWorkerRef = useRef<Worker | null>(null);
  const saRunIdRef = useRef<string | null>(null);
  const hsaRunIdRef = useRef<string | null>(null);
  const saConvergenceRef = useRef<ConvergencePoint[]>([]);
  const hsaConvergenceRef = useRef<ConvergencePoint[]>([]);
  const saLastLiveIterationRef = useRef(0);
  const hsaLastLiveIterationRef = useRef(0);
  const saLastLiveTimeRef = useRef(0);
  const hsaLastLiveTimeRef = useRef(0);

  const canRun = cities.length >= MIN_CITY_COUNT;

  useEffect(() => {
    saWorkerRef.current = createWorker();
    hsaWorkerRef.current = createWorker();

    const pushLivePoint = (
      algorithm: Algorithm,
      payload: WorkerProgressPayload
    ) => {
      const convergenceRef =
        algorithm === "SA" ? saConvergenceRef : hsaConvergenceRef;
      const lastIterationRef =
        algorithm === "SA" ? saLastLiveIterationRef : hsaLastLiveIterationRef;
      const lastTimeRef =
        algorithm === "SA" ? saLastLiveTimeRef : hsaLastLiveTimeRef;
      const stride = Math.max(1, Math.floor(payload.iterations / 900));
      const now =
        typeof performance !== "undefined" ? performance.now() : Date.now();
      const minInterval = 220;

      if (payload.samplePoint) {
        convergenceRef.current = [
          ...convergenceRef.current,
          payload.samplePoint,
        ];
        lastIterationRef.current = payload.samplePoint.iteration;
        lastTimeRef.current = now;
        return;
      }

      if (payload.iteration === 0) return;
      const iterationDelta = payload.iteration - lastIterationRef.current;
      if (iterationDelta <= 0) return;
      if (
        iterationDelta >= stride ||
        now - lastTimeRef.current >= minInterval
      ) {
        convergenceRef.current = [
          ...convergenceRef.current,
          { iteration: payload.iteration, distance: payload.bestDistance },
        ];
        lastIterationRef.current = payload.iteration;
        lastTimeRef.current = now;
      }
    };

    const handleWorkerMessage = (algorithm: Algorithm) =>
      (event: MessageEvent<WorkerOutgoingMessage>) => {
        const message = event.data;
        const runId = algorithm === "SA" ? saRunIdRef.current : hsaRunIdRef.current;
        if (!runId) return;

        if (message.type === "progress" && message.payload.runId === runId) {
          const payload = message.payload;
          pushLivePoint(algorithm, payload);
          const convergenceRef =
            algorithm === "SA" ? saConvergenceRef : hsaConvergenceRef;

          const updateStatus: LiveStatus = {
            algorithm,
            running: true,
            paused: false,
            iteration: payload.iteration,
            iterations: payload.iterations,
            bestDistance: payload.bestDistance,
            bestRoute: payload.bestRoute,
            convergence: convergenceRef.current,
            runtimeMs: payload.runtimeMs,
            temperature: payload.temperature,
            memoryUpdates: payload.memoryUpdates,
          };

          if (algorithm === "SA") {
            setSaStatus(updateStatus);
          } else {
            setHsaStatus(updateStatus);
          }
        }

        if (message.type === "complete" && message.payload.runId === runId) {
          const payload = message.payload;
          const convergenceRef =
            algorithm === "SA" ? saConvergenceRef : hsaConvergenceRef;
          const finalConvergence =
            payload.convergence.length > 0 &&
            payload.convergence.length >= convergenceRef.current.length
              ? payload.convergence
              : convergenceRef.current;
          convergenceRef.current = finalConvergence;
          const result: RunResult = {
            id: payload.runId,
            algorithm,
            bestRoute: payload.bestRoute,
            bestDistance: payload.bestDistance,
            runtimeMs: payload.runtimeMs,
            convergence: finalConvergence,
            settings: payload.settings,
            createdAt: payload.createdAt,
          };
          addRunResult(result);

          const updateStatus: LiveStatus = {
            algorithm,
            running: false,
            paused: false,
            iteration: payload.iteration,
            iterations: payload.iterations,
            bestDistance: payload.bestDistance,
            bestRoute: payload.bestRoute,
            convergence: finalConvergence,
            runtimeMs: payload.runtimeMs,
            temperature: payload.temperature,
            memoryUpdates: payload.memoryUpdates,
          };

          if (algorithm === "SA") {
            setSaStatus(updateStatus);
          } else {
            setHsaStatus(updateStatus);
          }
        }

        if (message.type === "stopped" && message.runId === runId) {
          if (algorithm === "SA") {
            setSaStatus((prev) =>
              prev ? { ...prev, running: false, paused: false } : prev
            );
          } else {
            setHsaStatus((prev) =>
              prev ? { ...prev, running: false, paused: false } : prev
            );
          }
        }
      };

    const saWorker = saWorkerRef.current;
    const hsaWorker = hsaWorkerRef.current;
    if (saWorker) saWorker.onmessage = handleWorkerMessage("SA");
    if (hsaWorker) hsaWorker.onmessage = handleWorkerMessage("HSA");

    return () => {
      saWorkerRef.current?.terminate();
      hsaWorkerRef.current?.terminate();
      saWorkerRef.current = null;
      hsaWorkerRef.current = null;
    };
  }, [addRunResult]);

  const baseThrottleMs = 60;
  const batchPreview = Math.max(
    1,
    Math.round((speedTarget * baseThrottleMs) / 1000)
  );

  const statValue = (value?: string) => value ?? "--";
  const rateFor = (status?: LiveStatus | null) => {
    if (!status || !Number.isFinite(status.runtimeMs)) return 0;
    const seconds = Math.max(0.001, status.runtimeMs / 1000);
    return Math.max(0, status.iteration / seconds);
  };
  const etaFor = (status?: LiveStatus | null) => {
    if (!status) return "--";
    const remaining = Math.max(0, status.iterations - status.iteration);
    const rate = rateFor(status);
    if (rate === 0) return "--";
    const seconds = remaining / rate;
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    return `${(seconds / 60).toFixed(1)}m`;
  };
  const speedFor = (status?: LiveStatus | null) => {
    const rate = rateFor(status);
    if (rate === 0) return "--";
    return `${Math.round(rate)} it/s`;
  };

  const startRun = (
    algorithm: Algorithm,
    settings: SASettings | HSASettings,
    initialRoute?: number[]
  ) => {
    if (!canRun) return;
    const runId = createRunId();
    const throttleMs = baseThrottleMs;
    const batchSize = batchPreview;
    const seedRoute = initialRoute ?? randomRoute(cities.length, startIndex);

    if (algorithm === "SA") {
      saRunIdRef.current = runId;
      saConvergenceRef.current = [];
      saLastLiveIterationRef.current = 0;
      saLastLiveTimeRef.current = 0;
      setSaStatus({
        algorithm,
        running: true,
        paused: false,
        iteration: 0,
        iterations: settings.iterations,
        bestDistance: Number.NaN,
        bestRoute: seedRoute,
        convergence: [],
        runtimeMs: 0,
        temperature: (settings as SASettings).initialTemperature,
      });
      saWorkerRef.current?.postMessage({
        type: "init",
        runId,
        algorithm,
        cities,
        startIndex,
        settings,
        initialRoute: seedRoute,
        throttleMs,
        batchSize,
      });
    } else {
      hsaRunIdRef.current = runId;
      hsaConvergenceRef.current = [];
      hsaLastLiveIterationRef.current = 0;
      hsaLastLiveTimeRef.current = 0;
      setHsaStatus({
        algorithm,
        running: true,
        paused: false,
        iteration: 0,
        iterations: settings.iterations,
        bestDistance: Number.NaN,
        bestRoute: seedRoute,
        convergence: [],
        runtimeMs: 0,
        memoryUpdates: 0,
      });
      hsaWorkerRef.current?.postMessage({
        type: "init",
        runId,
        algorithm,
        cities,
        startIndex,
        settings,
        initialRoute: seedRoute,
        throttleMs,
        batchSize,
      });
    }
  };

  const runSA = (initialRoute?: number[], iterationsOverride?: number) => {
    const settings: SASettings = {
      ...saSettings,
      iterations: iterationsOverride ?? saSettings.iterations,
    };
    startRun("SA", settings, initialRoute);
  };

  const runHSA = (initialRoute?: number[], iterationsOverride?: number) => {
    const settings: HSASettings = {
      ...hsaSettings,
      iterations: iterationsOverride ?? hsaSettings.iterations,
    };
    startRun("HSA", settings, initialRoute);
  };

  const runBoth = () => {
    if (!canRun) return;
    const sharedRoute = sharedInitial
      ? randomRoute(cities.length, startIndex)
      : undefined;
    const sharedIterations = syncIterations
      ? Math.min(saSettings.iterations, hsaSettings.iterations)
      : undefined;
    runSA(sharedRoute, sharedIterations);
    runHSA(sharedRoute, sharedIterations);
  };

  const pauseRun = (algorithm: Algorithm) => {
    const runId = algorithm === "SA" ? saRunIdRef.current : hsaRunIdRef.current;
    if (!runId) return;
    if (algorithm === "SA") {
      saWorkerRef.current?.postMessage({ type: "pause", runId });
      setSaStatus((prev) =>
        prev ? { ...prev, running: false, paused: true } : prev
      );
    } else {
      hsaWorkerRef.current?.postMessage({ type: "pause", runId });
      setHsaStatus((prev) =>
        prev ? { ...prev, running: false, paused: true } : prev
      );
    }
  };

  const resumeRun = (algorithm: Algorithm) => {
    const runId = algorithm === "SA" ? saRunIdRef.current : hsaRunIdRef.current;
    if (!runId) return;
    if (algorithm === "SA") {
      saWorkerRef.current?.postMessage({ type: "resume", runId });
      setSaStatus((prev) =>
        prev ? { ...prev, running: true, paused: false } : prev
      );
    } else {
      hsaWorkerRef.current?.postMessage({ type: "resume", runId });
      setHsaStatus((prev) =>
        prev ? { ...prev, running: true, paused: false } : prev
      );
    }
  };

  const stopRun = (algorithm: Algorithm) => {
    const runId = algorithm === "SA" ? saRunIdRef.current : hsaRunIdRef.current;
    if (!runId) return;
    if (algorithm === "SA") {
      saWorkerRef.current?.postMessage({ type: "stop", runId });
      setSaStatus((prev) =>
        prev ? { ...prev, running: false, paused: false } : prev
      );
    } else {
      hsaWorkerRef.current?.postMessage({ type: "stop", runId });
      setHsaStatus((prev) =>
        prev ? { ...prev, running: false, paused: false } : prev
      );
    }
  };

  const series: Array<{
    id: string;
    label: string;
    color: string;
    data: ConvergencePoint[];
  }> = [];

  const buildSeries = (
    status: LiveStatus | null,
    id: string,
    label: string,
    color: string
  ) => {
    if (!status) return;
    const base = status.convergence ?? [];
    const lastPoint = base[base.length - 1];
    const canAppend =
      Number.isFinite(status.bestDistance) &&
      Number.isFinite(status.iteration);
    const shouldAppend =
      canAppend && (!lastPoint || lastPoint.iteration < status.iteration);
    const data = shouldAppend
      ? [...base, { iteration: status.iteration, distance: status.bestDistance }]
      : base;
    if (!data.length) return;
    series.push({ id, label, color, data });
  };

  buildSeries(saStatus, "SA", "Simulated Annealing", "#2a4b6b");
  buildSeries(hsaStatus, "HSA", "Harmony Search", "#2f6d5a");

  const statusLabel = (status?: LiveStatus | null) => {
    if (!status) return "Idle";
    if (status.running) return "Running";
    if (status.paused) return "Paused";
    return "Completed";
  };

  const statusTone = (status?: LiveStatus | null) => {
    if (!status) return "bg-[color:var(--panel-strong)]";
    if (status.running) return "bg-[color:var(--accent-3)]";
    if (status.paused) return "bg-[color:var(--panel-strong)]";
    return "bg-[color:var(--panel-strong)]";
  };

  const saProgress = saStatus
    ? Math.min(100, (saStatus.iteration / saStatus.iterations) * 100)
    : 0;
  const hsaProgress = hsaStatus
    ? Math.min(100, (hsaStatus.iteration / hsaStatus.iterations) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="card flex flex-col gap-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Run Control
            </h2>
            <p className="text-sm text-[color:var(--muted)]">
              Launch algorithms and watch convergence in real time.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-primary"
              disabled={!canRun}
              onClick={() => runSA()}
            >
              Run SA
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!canRun}
              onClick={() => runHSA()}
            >
              Run HSA
            </button>
            <button
              type="button"
              className="btn btn-accent"
              disabled={!canRun}
              onClick={runBoth}
            >
              Run Both
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-[color:var(--muted)]">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={sharedInitial}
              onChange={(event) => setSharedInitial(event.target.checked)}
            />
            Use shared initial route
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={syncIterations}
              onChange={(event) => setSyncIterations(event.target.checked)}
            />
            Lock iterations to smaller value
          </label>
        </div>
        <div className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--panel-strong)] p-3 text-xs text-[color:var(--muted)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                Target Speed
              </p>
              <p className="text-sm font-semibold text-[color:var(--ink)]">
                {speedTarget} it/s
              </p>
            </div>
            <span className="mono">
              {baseThrottleMs}ms / batch {batchPreview}
            </span>
          </div>
          <input
            type="range"
            min={50}
            max={8000}
            step={50}
            value={speedTarget}
            onChange={(event) => setSpeedTarget(Number(event.target.value))}
            className="range mt-3"
          />
          <p className="mt-2 text-xs">
            Target iterations per second. Actual speed depends on dataset size.
          </p>
        </div>
        <div className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--panel-strong)] p-3 text-xs text-[color:var(--muted)]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>Dataset: {cities.length} cities</span>
            <span>Start city: {startIndex + 1}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold tracking-tight">
              Simulated Annealing
            </h3>
            <div className="flex gap-2">
              {saStatus?.running ? (
                <button
                  type="button"
                  className="btn"
                  onClick={() => pauseRun("SA")}
                >
                  Pause
                </button>
              ) : null}
              {saStatus?.paused ? (
                <button
                  type="button"
                  className="btn"
                  onClick={() => resumeRun("SA")}
                >
                  Resume
                </button>
              ) : null}
              {saStatus ? (
                <button
                  type="button"
                  className="btn"
                  onClick={() => stopRun("SA")}
                >
                  Stop
                </button>
              ) : null}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-[color:var(--muted)]">
            <span className={`tag ${statusTone(saStatus)}`}>
              {statusLabel(saStatus)}
            </span>
            <span className="mono">
              {saStatus ? `${saStatus.runtimeMs.toFixed(1)} ms` : "--"}
            </span>
          </div>
          <div className="mt-3 progress-track">
            <div
              className="progress-fill"
              style={{ width: `${saProgress}%` }}
            />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-5">
            <div className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--panel-strong)] p-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted)]">
                Iteration
              </p>
              <p className="mono text-base">
                {saStatus ? `${saStatus.iteration}/${saStatus.iterations}` : "--"}
              </p>
            </div>
            <div className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--panel-strong)] p-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted)]">
                Best Distance
              </p>
              <p className="mono text-base">
                {statValue(saStatus ? formatDistance(saStatus.bestDistance) : "--")}
              </p>
            </div>
            <div className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--panel-strong)] p-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted)]">
                Temperature
              </p>
              <p className="mono text-base">
                {Number.isFinite(saStatus?.temperature)
                  ? saStatus?.temperature?.toFixed(2)
                  : "--"}
              </p>
            </div>
            <div className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--panel-strong)] p-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted)]">
                Speed
              </p>
              <p className="mono text-base">{speedFor(saStatus)}</p>
            </div>
            <div className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--panel-strong)] p-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted)]">
                ETA
              </p>
              <p className="mono text-base">{etaFor(saStatus)}</p>
            </div>
          </div>

          <div className="mt-4">
            <RouteCanvas
              cities={cities}
              route={saStatus?.bestRoute}
              startIndex={startIndex}
              height={240}
            />
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold tracking-tight">
              Harmony Search
            </h3>
            <div className="flex gap-2">
              {hsaStatus?.running ? (
                <button
                  type="button"
                  className="btn"
                  onClick={() => pauseRun("HSA")}
                >
                  Pause
                </button>
              ) : null}
              {hsaStatus?.paused ? (
                <button
                  type="button"
                  className="btn"
                  onClick={() => resumeRun("HSA")}
                >
                  Resume
                </button>
              ) : null}
              {hsaStatus ? (
                <button
                  type="button"
                  className="btn"
                  onClick={() => stopRun("HSA")}
                >
                  Stop
                </button>
              ) : null}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-[color:var(--muted)]">
            <span className={`tag ${statusTone(hsaStatus)}`}>
              {statusLabel(hsaStatus)}
            </span>
            <span className="mono">
              {hsaStatus ? `${hsaStatus.runtimeMs.toFixed(1)} ms` : "--"}
            </span>
          </div>
          <div className="mt-3 progress-track">
            <div
              className="progress-fill"
              style={{ width: `${hsaProgress}%` }}
            />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-5">
            <div className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--panel-strong)] p-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted)]">
                Iteration
              </p>
              <p className="mono text-base">
                {hsaStatus ? `${hsaStatus.iteration}/${hsaStatus.iterations}` : "--"}
              </p>
            </div>
            <div className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--panel-strong)] p-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted)]">
                Best Distance
              </p>
              <p className="mono text-base">
                {hsaStatus ? formatDistance(hsaStatus.bestDistance) : "--"}
              </p>
            </div>
            <div className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--panel-strong)] p-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted)]">
                Memory Updates
              </p>
              <p className="mono text-base">
                {hsaStatus?.memoryUpdates ?? "--"}
              </p>
            </div>
            <div className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--panel-strong)] p-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted)]">
                Speed
              </p>
              <p className="mono text-base">{speedFor(hsaStatus)}</p>
            </div>
            <div className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--panel-strong)] p-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted)]">
                ETA
              </p>
              <p className="mono text-base">{etaFor(hsaStatus)}</p>
            </div>
          </div>

          <div className="mt-4">
            <RouteCanvas
              cities={cities}
              route={hsaStatus?.bestRoute}
              startIndex={startIndex}
              height={240}
            />
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="text-lg">Convergence</h3>
        <p className="text-sm text-[color:var(--muted)]">
          Best distance across iterations for the active run.
        </p>
        {series.length ? (
          <div className="mt-4">
            <ConvergenceChart series={series} height={260} />
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-[color:var(--stroke)] bg-[color:var(--panel)] p-6 text-sm text-[color:var(--muted)]">
            Run an algorithm to visualize convergence.
          </div>
        )}
      </div>
    </div>
  );
};

export default RunController;
