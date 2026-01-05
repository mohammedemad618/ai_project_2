import type { Algorithm, ConvergencePoint, HSASettings, SASettings } from "@/lib/algorithms";
import type { City, Route } from "@/lib/tsp";

export type WorkerInitMessage = {
  type: "init";
  runId: string;
  algorithm: Algorithm;
  cities: City[];
  startIndex: number;
  settings: SASettings | HSASettings;
  initialRoute?: Route;
  throttleMs?: number;
  batchSize?: number;
};

export type WorkerControlMessage =
  | { type: "pause"; runId: string }
  | { type: "resume"; runId: string }
  | { type: "stop"; runId: string };

export type WorkerMessage = WorkerInitMessage | WorkerControlMessage;

export type WorkerProgressPayload = {
  runId: string;
  algorithm: Algorithm;
  iteration: number;
  iterations: number;
  bestDistance: number;
  bestRoute: Route;
  runtimeMs: number;
  temperature?: number;
  memoryUpdates?: number;
  samplePoint?: ConvergencePoint;
};

export type WorkerProgressMessage = {
  type: "progress";
  payload: WorkerProgressPayload;
};

export type WorkerCompleteMessage = {
  type: "complete";
  payload: WorkerProgressPayload & {
    convergence: ConvergencePoint[];
    settings: SASettings | HSASettings;
    createdAt: string;
  };
};

export type WorkerStoppedMessage = {
  type: "stopped";
  runId: string;
};

export type WorkerOutgoingMessage =
  | WorkerProgressMessage
  | WorkerCompleteMessage
  | WorkerStoppedMessage;
