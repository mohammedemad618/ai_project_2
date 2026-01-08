"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { City, Route } from "@/lib/tsp";

type Mode = "view" | "drag" | "start";

type RouteCanvasProps = {
  cities: City[];
  route?: Route;
  startIndex?: number;
  mode?: Mode;
  onMoveCity?: (index: number, x: number, y: number) => void;
  onSelectStart?: (index: number) => void;
  height?: number;
  className?: string;
  showGrid?: boolean;
};

const RouteCanvas = ({
  cities,
  route,
  startIndex = 0,
  mode = "view",
  onMoveCity,
  onSelectStart,
  height = 360,
  className,
  showGrid = true,
}: RouteCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const padding = 18;
  const cursorClass =
    mode === "drag"
      ? "cursor-grab active:cursor-grabbing"
      : mode === "start"
        ? "cursor-crosshair"
        : "cursor-default";

  const points = useMemo(() => {
    if (width === 0) return [];
    const plotWidth = Math.max(1, width - padding * 2);
    const plotHeight = Math.max(1, height - padding * 2);
    return cities.map((city) => ({
      x: padding + city.x * plotWidth,
      y: padding + city.y * plotHeight,
    }));
  }, [cities, height, width]);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const nextWidth = Math.floor(entry.contentRect.width);
        setWidth(nextWidth);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width === 0) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const ratio = window.devicePixelRatio || 1;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    context.clearRect(0, 0, width, height);

    if (showGrid) {
      context.strokeStyle = "rgba(31, 42, 54, 0.06)";
      context.lineWidth = 1;
      const step = 60;
      for (let x = padding; x < width - padding; x += step) {
        context.beginPath();
        context.moveTo(x, padding);
        context.lineTo(x, height - padding);
        context.stroke();
      }
      for (let y = padding; y < height - padding; y += step) {
        context.beginPath();
        context.moveTo(padding, y);
        context.lineTo(width - padding, y);
        context.stroke();
      }
    }

    if (route && route.length > 1) {
      const gradient = context.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#2a4b6b");
      gradient.addColorStop(1, "#2f6d5a");
      context.strokeStyle = gradient;
      context.lineWidth = 2.1;
      context.beginPath();
      route.forEach((index, i) => {
        const point = points[index];
        if (!point) return;
        if (i === 0) context.moveTo(point.x, point.y);
        else context.lineTo(point.x, point.y);
      });
      const first = points[route[0]];
      if (first) {
        context.lineTo(first.x, first.y);
      }
      context.stroke();
    }

    points.forEach((point, index) => {
      const isStart = index === startIndex;
      context.beginPath();
      context.arc(point.x, point.y, isStart ? 6 : 4, 0, Math.PI * 2);
      context.fillStyle = isStart ? "#1f2a36" : "#2a4b6b";
      context.fill();
      if (isStart) {
        context.lineWidth = 2;
        context.strokeStyle = "#a35b2f";
        context.stroke();
      }
    });
  }, [height, points, route, startIndex, showGrid, width]);

  const getNearestIndex = (clientX: number, clientY: number) => {
    if (!canvasRef.current || points.length === 0) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    let closestIndex: number | null = null;
    let closestDistance = Infinity;
    points.forEach((point, index) => {
      const distance = Math.hypot(point.x - x, point.y - y);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });
    if (closestDistance <= 12) return closestIndex;
    return null;
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (mode === "view") return;
    const index = getNearestIndex(event.clientX, event.clientY);
    if (index === null) return;

    if (mode === "start") {
      onSelectStart?.(index);
      return;
    }

    setDragIndex(index);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (dragIndex === null || mode !== "drag") return;
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const plotWidth = Math.max(1, width - padding * 2);
    const plotHeight = Math.max(1, height - padding * 2);
    const x = (event.clientX - rect.left - padding) / plotWidth;
    const y = (event.clientY - rect.top - padding) / plotHeight;
    const nextX = Math.min(0.96, Math.max(0.04, x));
    const nextY = Math.min(0.96, Math.max(0.04, y));
    onMoveCity?.(dragIndex, nextX, nextY);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (dragIndex === null) return;
    setDragIndex(null);
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <div ref={containerRef} className={className}>
      <canvas
        ref={canvasRef}
        height={height}
        className={`h-full w-full rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--panel)] ${cursorClass}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
    </div>
  );
};

export default RouteCanvas;
