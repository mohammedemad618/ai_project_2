export type City = {
  id: string;
  x: number;
  y: number;
};

export type Route = number[];

export type Distribution = "random" | "clustered";

export type Neighborhood = "swap" | "two-opt" | "insert";

export const defaultSASettings = {
  initialTemperature: 1500,
  coolingRate: 0.988,
  iterations: 12000,
  neighborhood: "two-opt" as Neighborhood,
  reheatInterval: 2000,
  reheatMultiplier: 1.15,
};

export const defaultHSASettings = {
  hms: 24,
  hmcr: 0.93,
  par: 0.32,
  iterations: 10000,
  eliteCount: 2,
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const randomNormal = () => {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
};

const shuffle = <T,>(items: T[]) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export const generateCities = (count: number, distribution: Distribution): City[] => {
  const cities: City[] = [];
  if (distribution === "clustered") {
    const clusters = 3;
    const centers = Array.from({ length: clusters }, (_, index) => ({
      id: `center-${index}`,
      x: 0.15 + Math.random() * 0.7,
      y: 0.15 + Math.random() * 0.7,
    }));

    for (let i = 0; i < count; i += 1) {
      const center = centers[i % clusters];
      const spread = 0.08 + Math.random() * 0.05;
      const x = clamp(center.x + randomNormal() * spread, 0.04, 0.96);
      const y = clamp(center.y + randomNormal() * spread, 0.04, 0.96);
      cities.push({ id: `c${i + 1}`, x, y });
    }
  } else {
    for (let i = 0; i < count; i += 1) {
      cities.push({
        id: `c${i + 1}`,
        x: 0.05 + Math.random() * 0.9,
        y: 0.05 + Math.random() * 0.9,
      });
    }
  }

  return cities;
};

export const normalizeCities = (
  rawCities: Array<{ id?: string; x: number; y: number }>
): City[] => {
  if (rawCities.length === 0) return [];

  const xs = rawCities.map((city) => city.x);
  const ys = rawCities.map((city) => city.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  return rawCities.map((city, index) => {
    const normalizedX = (city.x - minX) / rangeX;
    const normalizedY = (city.y - minY) / rangeY;
    const x = 0.06 + normalizedX * 0.88;
    const y = 0.06 + normalizedY * 0.88;
    return {
      id: city.id ?? `c${index + 1}`,
      x: clamp(x, 0.04, 0.96),
      y: clamp(y, 0.04, 0.96),
    };
  });
};

export const parseCitiesFromCSV = (text: string) => {
  const rows = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(/[;,\t,]/).map((value) => value.trim()));

  const cities: Array<{ x: number; y: number }> = [];
  for (const row of rows) {
    const x = Number(row[0]);
    const y = Number(row[1]);
    if (Number.isFinite(x) && Number.isFinite(y)) {
      cities.push({ x, y });
    }
  }

  return normalizeCities(cities);
};

export const parseCitiesFromJSON = (text: string) => {
  const raw = JSON.parse(text);
  if (!Array.isArray(raw)) return [];
  const cities: Array<{ id?: string; x: number; y: number }> = [];

  for (const entry of raw) {
    if (Array.isArray(entry) && entry.length >= 2) {
      const x = Number(entry[0]);
      const y = Number(entry[1]);
      if (Number.isFinite(x) && Number.isFinite(y)) {
        cities.push({ x, y });
      }
    }

    if (entry && typeof entry === "object") {
      const candidate = entry as { id?: string; x?: number; y?: number };
      if (Number.isFinite(candidate.x) && Number.isFinite(candidate.y)) {
        cities.push({ id: candidate.id, x: candidate.x!, y: candidate.y! });
      }
    }
  }

  return normalizeCities(cities);
};

export const distance = (a: City, b: City) =>
  Math.hypot(a.x - b.x, a.y - b.y);

export type DistanceMatrix = number[][];

export const buildDistanceMatrix = (cities: City[]): DistanceMatrix => {
  const size = cities.length;
  const matrix: DistanceMatrix = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => 0)
  );

  for (let i = 0; i < size; i += 1) {
    for (let j = i + 1; j < size; j += 1) {
      const dist = distance(cities[i], cities[j]);
      matrix[i][j] = dist;
      matrix[j][i] = dist;
    }
  }

  return matrix;
};

export const routeDistance = (route: Route, cities: City[]) => {
  if (route.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < route.length; i += 1) {
    const current = cities[route[i]];
    const next = cities[route[(i + 1) % route.length]];
    total += distance(current, next);
  }
  return total;
};

export const routeDistanceMatrix = (route: Route, matrix: DistanceMatrix) => {
  if (route.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < route.length; i += 1) {
    const current = route[i];
    const next = route[(i + 1) % route.length];
    total += matrix[current][next];
  }
  return total;
};

export const randomRoute = (cityCount: number, startIndex: number) => {
  const indices = Array.from({ length: cityCount }, (_, index) => index).filter(
    (index) => index !== startIndex
  );
  const shuffled = shuffle(indices);
  return [startIndex, ...shuffled];
};

const pickIndex = (max: number) => 1 + Math.floor(Math.random() * (max - 1));

export const swapNeighbor = (route: Route) => {
  const next = [...route];
  const i = pickIndex(route.length);
  let j = pickIndex(route.length);
  while (j === i) {
    j = pickIndex(route.length);
  }
  [next[i], next[j]] = [next[j], next[i]];
  return next;
};

export const twoOptNeighbor = (route: Route) => {
  const next = [...route];
  const i = pickIndex(route.length - 1);
  const j = i + 1 + Math.floor(Math.random() * (route.length - i - 1));
  const slice = next.slice(i, j + 1).reverse();
  next.splice(i, slice.length, ...slice);
  return next;
};

export const insertNeighbor = (route: Route) => {
  const next = [...route];
  const from = pickIndex(route.length);
  let to = pickIndex(route.length);
  while (to === from) {
    to = pickIndex(route.length);
  }
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
};

export const applyNeighborhood = (route: Route, operator: Neighborhood) => {
  switch (operator) {
    case "swap":
      return swapNeighbor(route);
    case "insert":
      return insertNeighbor(route);
    case "two-opt":
    default:
      return twoOptNeighbor(route);
  }
};
