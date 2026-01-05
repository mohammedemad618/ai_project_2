import type {
  Algorithm,
  ConvergencePoint,
  HSASettings,
  SASettings,
  SAState,
  HSAState,
} from "@/lib/algorithms";
import {
  createHSAState,
  createSAState,
  stepHSA,
  stepSA,
} from "@/lib/algorithms";
import type { City, DistanceMatrix, Route } from "@/lib/tsp";
import { buildDistanceMatrix } from "@/lib/tsp";
import type {
  WorkerMessage,
  WorkerOutgoingMessage,
  WorkerProgressPayload,
} from "./types";

// Worker context type
declare const self: Worker;

const ctx = self;

let currentRunId: string | null = null;
let algorithm: Algorithm | null = null;
let cities: City[] = [];
let startIndex = 0;
let settings: SASettings | HSASettings | null = null;
let distanceMatrix: DistanceMatrix | null = null;
let saState: SAState | null = null;
let hsaState: HSAState | null = null;
let running = false;
let paused = false;
let timer: ReturnType<typeof setInterval> | null = null;
let startedAt = 0;
let pausedAt = 0;
let pausedTotal = 0;
let memoryUpdates = 0;
let throttleMs = 80;
let batchSize = 16;
let lastEmit = 0;
let sampleEvery = 1;
let lastSample = 0;
let convergence: ConvergencePoint[] = [];

const now = () =>
  typeof performance !== "undefined" ? performance.now() : Date.now();

const stopTimer = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};

const resetState = () => {
  running = false;
  paused = false;
  cities = [];
  startIndex = 0;
  settings = null;
  distanceMatrix = null;
  saState = null;
  hsaState = null;
  startedAt = 0;
  pausedAt = 0;
  pausedTotal = 0;
  memoryUpdates = 0;
  lastEmit = 0;
  sampleEvery = 1;
  lastSample = 0;
  convergence = [];
};

const sendMessage = (message: WorkerOutgoingMessage) => {
  ctx.postMessage(message);
};

const buildProgressPayload = (
  base: {
    iteration: number;
    iterations: number;
    bestDistance: number;
    bestRoute: Route;
  },
  extras?: {
    temperature?: number;
    memoryUpdates?: number;
    samplePoint?: ConvergencePoint;
  }
): WorkerProgressPayload => ({
  runId: currentRunId ?? "",
  algorithm: algorithm ?? "SA",
  iteration: base.iteration,
  iterations: base.iterations,
  bestDistance: base.bestDistance,
  bestRoute: base.bestRoute,
  runtimeMs: now() - startedAt - pausedTotal,
  temperature: extras?.temperature,
  memoryUpdates: extras?.memoryUpdates,
  samplePoint: extras?.samplePoint,
});

const startLoop = () => {
  stopTimer();
  timer = setInterval(() => {
    if (!running || !settings || !distanceMatrix || !algorithm) return;

    if (algorithm === "SA" && saState) {
      const activeSettings = settings as SASettings;
      for (
        let i = 0;
        i < batchSize && saState.iteration < activeSettings.iterations;
        i += 1
      ) {
        stepSA(saState, cities, activeSettings, distanceMatrix);
      }

      let samplePoint: ConvergencePoint | undefined;
      if (saState.iteration - lastSample >= sampleEvery) {
        samplePoint = {
          iteration: saState.iteration,
          distance: saState.bestDistance,
        };
        convergence.push(samplePoint);
        lastSample = saState.iteration;
      }

      const time = now();
      if (time - lastEmit >= throttleMs) {
        lastEmit = time;
        sendMessage({
          type: "progress",
          payload: buildProgressPayload(
            {
              iteration: saState.iteration,
              iterations: activeSettings.iterations,
              bestDistance: saState.bestDistance,
              bestRoute: saState.bestRoute,
            },
            {
              temperature: saState.temperature,
              samplePoint,
            }
          ),
        });
      }

      if (saState.iteration >= activeSettings.iterations) {
        running = false;
        stopTimer();
        const lastPoint = convergence[convergence.length - 1];
        if (
          !lastPoint ||
          lastPoint.iteration !== saState.iteration
        ) {
          convergence.push({
            iteration: saState.iteration,
            distance: saState.bestDistance,
          });
        }
        sendMessage({
          type: "complete",
          payload: {
            ...buildProgressPayload(
              {
                iteration: saState.iteration,
                iterations: activeSettings.iterations,
                bestDistance: saState.bestDistance,
                bestRoute: saState.bestRoute,
              },
              {
                temperature: saState.temperature,
              }
            ),
            convergence,
            settings: activeSettings,
            createdAt: new Date().toISOString(),
          },
        });
      }
    }

    if (algorithm === "HSA" && hsaState) {
      const activeSettings = settings as HSASettings;
      for (
        let i = 0;
        i < batchSize && hsaState.iteration < activeSettings.iterations;
        i += 1
      ) {
        const replaced = stepHSA(
          hsaState,
          cities,
          activeSettings,
          startIndex,
          distanceMatrix
        );
        if (replaced) memoryUpdates += 1;
      }

      let samplePoint: ConvergencePoint | undefined;
      if (hsaState.iteration - lastSample >= sampleEvery) {
        samplePoint = {
          iteration: hsaState.iteration,
          distance: hsaState.bestDistance,
        };
        convergence.push(samplePoint);
        lastSample = hsaState.iteration;
      }

      const time = now();
      if (time - lastEmit >= throttleMs) {
        lastEmit = time;
        sendMessage({
          type: "progress",
          payload: buildProgressPayload(
            {
              iteration: hsaState.iteration,
              iterations: activeSettings.iterations,
              bestDistance: hsaState.bestDistance,
              bestRoute: hsaState.bestRoute,
            },
            {
              memoryUpdates,
              samplePoint,
            }
          ),
        });
      }

      if (hsaState.iteration >= activeSettings.iterations) {
        running = false;
        stopTimer();
        const lastPoint = convergence[convergence.length - 1];
        if (
          !lastPoint ||
          lastPoint.iteration !== hsaState.iteration
        ) {
          convergence.push({
            iteration: hsaState.iteration,
            distance: hsaState.bestDistance,
          });
        }
        sendMessage({
          type: "complete",
          payload: {
            ...buildProgressPayload(
              {
                iteration: hsaState.iteration,
                iterations: activeSettings.iterations,
                bestDistance: hsaState.bestDistance,
                bestRoute: hsaState.bestRoute,
              },
              {
                memoryUpdates,
              }
            ),
            convergence,
            settings: activeSettings,
            createdAt: new Date().toISOString(),
          },
        });
      }
    }
  }, 0);
};

ctx.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const message = event.data;

  if (message.type === "init") {
    stopTimer();
    resetState();
    currentRunId = message.runId;
    algorithm = message.algorithm;
    cities = message.cities;
    startIndex = message.startIndex;
    settings = message.settings;
    throttleMs = message.throttleMs ?? 80;
    batchSize = message.batchSize ?? Math.max(8, Math.floor(cities.length / 4));
    const safeIterations = Number(message.settings.iterations) || 0;
    sampleEvery = Math.max(1, Math.floor(safeIterations / 200));
    distanceMatrix = buildDistanceMatrix(cities);
    startedAt = now();
    pausedTotal = 0;
    lastEmit = 0;
    lastSample = 0;
    convergence = [];

    if (algorithm === "SA") {
      saState = createSAState(
        cities,
        message.settings as SASettings,
        startIndex,
        message.initialRoute,
        distanceMatrix
      );
      if (Number.isFinite(saState.bestDistance)) {
        convergence.push({
          iteration: saState.iteration,
          distance: saState.bestDistance,
        });
      }
    } else {
      hsaState = createHSAState(
        cities,
        message.settings as HSASettings,
        startIndex,
        message.initialRoute,
        distanceMatrix
      );
      if (Number.isFinite(hsaState.bestDistance)) {
        convergence.push({
          iteration: hsaState.iteration,
          distance: hsaState.bestDistance,
        });
      }
    }

    running = true;
    paused = false;
    startLoop();
    return;
  }

  if (!currentRunId || message.runId !== currentRunId) return;

  if (message.type === "pause") {
    if (!running) return;
    running = false;
    paused = true;
    pausedAt = now();
    stopTimer();
    return;
  }

  if (message.type === "resume") {
    if (running || !paused) return;
    if (pausedAt) {
      pausedTotal += now() - pausedAt;
      pausedAt = 0;
    }
    running = true;
    paused = false;
    startLoop();
    return;
  }

  if (message.type === "stop") {
    running = false;
    paused = false;
    stopTimer();
    sendMessage({ type: "stopped", runId: message.runId });
    currentRunId = null;
    resetState();
  }
};

export {};
