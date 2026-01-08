import type { City, DistanceMatrix, Neighborhood, Route } from "./tsp";
import {
  applyNeighborhood,
  buildDistanceMatrix,
  randomRoute,
  routeDistance,
  routeDistanceMatrix,
  swapNeighbor,
  twoOptNeighbor,
} from "./tsp";

export type Algorithm = "SA" | "HSA";

export type SASettings = {
  initialTemperature: number;
  coolingRate: number;
  iterations: number;
  neighborhood: Neighborhood;
  reheatInterval: number;
  reheatMultiplier: number;
};

export type HSASettings = {
  hms: number;
  hmcr: number;
  par: number;
  iterations: number;
  eliteCount: number;
};

export type ConvergencePoint = {
  iteration: number;
  distance: number;
};

export type RunResult = {
  id: string;
  algorithm: Algorithm;
  bestRoute: Route;
  bestDistance: number;
  runtimeMs: number;
  convergence: ConvergencePoint[];
  settings: SASettings | HSASettings;
  createdAt: string;
};

export type SAState = {
  iteration: number;
  temperature: number;
  currentRoute: Route;
  currentDistance: number;
  bestRoute: Route;
  bestDistance: number;
  iterationsSinceBest: number;
};

export type HSAState = {
  iteration: number;
  memory: Route[];
  memoryDistances: number[];
  bestRoute: Route;
  bestDistance: number;
};

const now = () =>
  typeof performance !== "undefined" ? performance.now() : Date.now();

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `run-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
};

export const createSAState = (
  cities: City[],
  settings: SASettings,
  startIndex: number,
  initialRoute?: Route,
  distanceMatrix?: DistanceMatrix
): SAState => {
  const route = initialRoute ?? randomRoute(cities.length, startIndex);
  const distance = distanceForRoute(route, cities, distanceMatrix);
  return {
    iteration: 0,
    temperature: settings.initialTemperature,
    currentRoute: route,
    currentDistance: distance,
    bestRoute: [...route],
    bestDistance: distance,
    iterationsSinceBest: 0,
  };
};

export const stepSA = (
  state: SAState,
  cities: City[],
  settings: SASettings,
  distanceMatrix?: DistanceMatrix
) => {
  const candidate = applyNeighborhood(state.currentRoute, settings.neighborhood);
  const candidateDistance = distanceForRoute(candidate, cities, distanceMatrix);
  const delta = candidateDistance - state.currentDistance;
  const accept =
    delta < 0 || Math.random() < Math.exp(-delta / state.temperature);

  if (accept) {
    state.currentRoute = candidate;
    state.currentDistance = candidateDistance;
  }

  if (state.currentDistance < state.bestDistance) {
    state.bestDistance = state.currentDistance;
    state.bestRoute = [...state.currentRoute];
    state.iterationsSinceBest = 0;
  } else {
    state.iterationsSinceBest += 1;
  }

  state.temperature = Math.max(state.temperature * settings.coolingRate, 0.0001);
  if (
    settings.reheatInterval > 0 &&
    state.iterationsSinceBest >= settings.reheatInterval
  ) {
    const multiplier = Math.max(1, settings.reheatMultiplier);
    state.temperature = Math.max(
      state.temperature,
      settings.initialTemperature * multiplier
    );
    state.iterationsSinceBest = 0;
  }
  state.iteration += 1;
};

export const createHSAState = (
  cities: City[],
  settings: HSASettings,
  startIndex: number,
  initialRoute?: Route,
  distanceMatrix?: DistanceMatrix
): HSAState => {
  const memory: Route[] = [];
  const memorySize = Number.isFinite(settings.hms)
    ? Math.max(1, Math.floor(settings.hms))
    : 1;
  if (initialRoute) {
    memory.push(initialRoute);
  }
  while (memory.length < memorySize) {
    memory.push(randomRoute(cities.length, startIndex));
  }

  const memoryDistances = memory.map((route) =>
    distanceForRoute(route, cities, distanceMatrix)
  );
  let bestIndex = 0;
  for (let i = 1; i < memoryDistances.length; i += 1) {
    if (memoryDistances[i] < memoryDistances[bestIndex]) {
      bestIndex = i;
    }
  }

  return {
    iteration: 0,
    memory,
    memoryDistances,
    bestRoute: [...memory[bestIndex]],
    bestDistance: memoryDistances[bestIndex],
  };
};

const pitchAdjust = (route: Route) => {
  const operator = Math.random() < 0.5 ? "swap" : "two-opt";
  if (operator === "swap") return swapNeighbor(route);
  return twoOptNeighbor(route);
};

const distanceForRoute = (
  route: Route,
  cities: City[],
  matrix?: DistanceMatrix
) => {
  if (matrix) return routeDistanceMatrix(route, matrix);
  return routeDistance(route, cities);
};

const clampEliteCount = (eliteCount: number, length: number) => {
  if (!Number.isFinite(eliteCount) || length <= 1) return 0;
  return Math.min(Math.max(Math.floor(eliteCount), 0), length - 1);
};

const findWorstIndex = (distances: number[]) => {
  let worstIndex = 0;
  for (let i = 1; i < distances.length; i += 1) {
    if (distances[i] > distances[worstIndex]) {
      worstIndex = i;
    }
  }
  return worstIndex;
};

const pickReplaceIndex = (distances: number[], eliteCount: number) => {
  if (distances.length <= 1) return 0;
  const safeElite = clampEliteCount(eliteCount, distances.length);
  if (safeElite <= 0) return findWorstIndex(distances);

  const sorted = distances
    .map((value, index) => ({ value, index }))
    .sort((a, b) => a.value - b.value);
  const candidates = sorted.slice(safeElite).map((entry) => entry.index);
  return candidates[Math.floor(Math.random() * candidates.length)];
};

export const stepHSA = (
  state: HSAState,
  cities: City[],
  settings: HSASettings,
  startIndex: number,
  distanceMatrix?: DistanceMatrix
) => {
  let replaced = false;
  let candidate: Route;
  if (Math.random() < settings.hmcr) {
    const memoryIndex = Math.floor(Math.random() * state.memory.length);
    candidate = [...state.memory[memoryIndex]];
    if (Math.random() < settings.par) {
      candidate = pitchAdjust(candidate);
    }
  } else {
    candidate = randomRoute(cities.length, startIndex);
  }

  const candidateDistance = distanceForRoute(
    candidate,
    cities,
    distanceMatrix
  );
  const replaceIndex = pickReplaceIndex(
    state.memoryDistances,
    settings.eliteCount
  );

  if (candidateDistance < state.memoryDistances[replaceIndex]) {
    state.memory[replaceIndex] = candidate;
    state.memoryDistances[replaceIndex] = candidateDistance;
    replaced = true;
  }

  if (candidateDistance < state.bestDistance) {
    state.bestDistance = candidateDistance;
    state.bestRoute = [...candidate];
  }

  state.iteration += 1;
  return replaced;
};

export const runSA = (
  cities: City[],
  settings: SASettings,
  startIndex: number,
  initialRoute?: Route,
  distanceMatrix?: DistanceMatrix
): RunResult => {
  const matrix = distanceMatrix ?? buildDistanceMatrix(cities);
  const state = createSAState(
    cities,
    settings,
    startIndex,
    initialRoute,
    matrix
  );
  const convergence: ConvergencePoint[] = [];
  const sampleEvery = Math.max(1, Math.floor(settings.iterations / 160));
  const started = now();

  while (state.iteration < settings.iterations) {
    stepSA(state, cities, settings, matrix);
    if (state.iteration % sampleEvery === 0) {
      convergence.push({
        iteration: state.iteration,
        distance: state.bestDistance,
      });
    }
  }

  const runtimeMs = now() - started;
  return {
    id: createId(),
    algorithm: "SA",
    bestRoute: state.bestRoute,
    bestDistance: state.bestDistance,
    runtimeMs,
    convergence,
    settings: { ...settings },
    createdAt: new Date().toISOString(),
  };
};

export const runHSA = (
  cities: City[],
  settings: HSASettings,
  startIndex: number,
  initialRoute?: Route,
  distanceMatrix?: DistanceMatrix
): RunResult => {
  const matrix = distanceMatrix ?? buildDistanceMatrix(cities);
  const state = createHSAState(
    cities,
    settings,
    startIndex,
    initialRoute,
    matrix
  );
  const convergence: ConvergencePoint[] = [];
  const sampleEvery = Math.max(1, Math.floor(settings.iterations / 160));
  const started = now();

  while (state.iteration < settings.iterations) {
    stepHSA(state, cities, settings, startIndex, matrix);
    if (state.iteration % sampleEvery === 0) {
      convergence.push({
        iteration: state.iteration,
        distance: state.bestDistance,
      });
    }
  }

  const runtimeMs = now() - started;
  return {
    id: createId(),
    algorithm: "HSA",
    bestRoute: state.bestRoute,
    bestDistance: state.bestDistance,
    runtimeMs,
    convergence,
    settings: { ...settings },
    createdAt: new Date().toISOString(),
  };
};
