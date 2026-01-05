import type { ReactNode } from "react";

const PageHeader = ({
  title,
  subtitle,
  actions,
  kicker,
}: {
  title: string;
  subtitle: string;
  actions?: ReactNode;
  kicker?: string;
}) => {
  return (
    <header className="surface reveal relative overflow-hidden px-6 py-6">
      <div
        className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full opacity-40"
        style={{
          background:
            "radial-gradient(circle, rgba(47, 107, 255, 0.35), transparent 70%)",
        }}
      />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip">{kicker ?? "TSP"}</span>
            <span className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
              Optimization Dashboard
            </span>
          </div>
          <div>
            <h1 className="text-2xl">{title}</h1>
            <p className="text-balance text-sm text-[color:var(--muted)]">
              {subtitle}
            </p>
          </div>
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </header>
  );
};

export default PageHeader;
