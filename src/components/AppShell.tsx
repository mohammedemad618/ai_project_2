"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useShallow } from "zustand/react/shallow";
import useTspStore from "@/store/tspStore";
import ProjectFooter from "@/components/ProjectFooter";

const navItems = [
  { href: "/", label: "Dashboard", subtitle: "Overview" },
  { href: "/cities", label: "Cities", subtitle: "Dataset" },
  { href: "/algorithms", label: "Algorithms", subtitle: "Settings" },
  { href: "/run", label: "Run", subtitle: "Monitor" },
  { href: "/results", label: "Results", subtitle: "Visualization" },
  { href: "/reports", label: "Reports", subtitle: "Compare" },
];

const formatDistance = (value?: number) => {
  if (!value || Number.isNaN(value)) return "--";
  return value.toFixed(3);
};

const AppShell = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const { cities, lastResults } = useTspStore(
    useShallow((state) => ({
      cities: state.cities,
      lastResults: state.lastResults,
    }))
  );

  const bestDistance = Math.min(
    lastResults.SA?.bestDistance ?? Number.POSITIVE_INFINITY,
    lastResults.HSA?.bestDistance ?? Number.POSITIVE_INFINITY
  );
  const lastRun = [lastResults.SA, lastResults.HSA]
    .filter(Boolean)
    .sort((a, b) =>
      a!.createdAt > b!.createdAt ? -1 : a!.createdAt < b!.createdAt ? 1 : 0
    )[0];
  const readiness = cities.length >= 3 ? "Ready" : "Waiting";

  return (
    <div className="min-h-screen text-[15px]">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-6 py-8 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
          <aside className="surface sticky top-6 hidden h-fit flex-col gap-6 p-5 lg:flex">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="chip">TSP Lab</span>
                <span className="tag">{readiness}</span>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                  Optimization Suite
                </p>
                <h1 className="text-xl">TSP Optimization</h1>
                <p className="text-sm text-[color:var(--muted)]">
                  Simulated Annealing + Harmony Search
                </p>
              </div>
            </div>
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === item.href
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    data-active={active}
                    className={`nav-link group rounded-2xl border px-3 py-2 transition ${
                      active
                        ? "border-transparent bg-white shadow"
                        : "border-[color:var(--stroke)] bg-white/40 hover:bg-white/80"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{item.label}</span>
                      <span className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--muted)]">
                        {item.subtitle}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </nav>
            <div className="rounded-2xl border border-[color:var(--stroke)] bg-white/70 p-4 text-xs text-[color:var(--muted)]">
              <div className="flex items-center justify-between">
                <span>Cities</span>
                <span className="mono text-[color:var(--ink)]">
                  {cities.length}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span>Best distance</span>
                <span className="mono text-[color:var(--ink)]">
                  {formatDistance(
                    Number.isFinite(bestDistance) ? bestDistance : undefined
                  )}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span>Last run</span>
                <span className="mono text-[color:var(--ink)]">
                  {lastRun ? `${lastRun.algorithm}` : "--"}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span>Runtime</span>
                <span className="mono text-[color:var(--ink)]">
                  {lastRun ? `${lastRun.runtimeMs.toFixed(1)} ms` : "--"}
                </span>
              </div>
            </div>
            <ProjectFooter />
          </aside>

          <main className="flex flex-col gap-6">
            <div className="surface flex flex-col gap-3 px-4 py-3 lg:hidden">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                    TSP Optimization
                  </p>
                  <p className="text-sm font-semibold">Interactive Dashboard</p>
                </div>
                <span className="tag">{readiness}</span>
              </div>
              <nav className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
                {navItems.map((item) => {
                  const active =
                    item.href === "/"
                      ? pathname === item.href
                      : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        active
                          ? "bg-[color:var(--ink)] text-white"
                          : "bg-white/70"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AppShell;
