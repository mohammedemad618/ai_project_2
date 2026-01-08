import type { ReactNode } from "react";

const MetricCard = ({
  label,
  value,
  note,
  accent,
  icon,
}: {
  label: string;
  value: string;
  note?: string;
  accent?: "primary" | "accent" | "teal";
  icon?: ReactNode;
}) => {
  const accentClass =
    accent === "accent"
      ? "text-[color:var(--accent)]"
      : accent === "teal"
        ? "text-[color:var(--accent-2)]"
        : "text-[color:var(--ink)]";
  const accentBorder =
    accent === "accent"
      ? "var(--accent)"
      : accent === "teal"
        ? "var(--accent-2)"
        : "var(--stroke-strong)";

  return (
    <div
      className="card reveal flex flex-col gap-2 border-l-2 p-4"
      style={{ borderLeftColor: accentBorder }}
    >
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.12em] text-[color:var(--muted)]">
        <span>{label}</span>
        {icon ? <span>{icon}</span> : null}
      </div>
      <div className={`text-2xl font-semibold ${accentClass}`}>{value}</div>
      {note ? (
        <p className="text-xs text-[color:var(--muted)]">{note}</p>
      ) : null}
    </div>
  );
};

export default MetricCard;
