import Image from "next/image";

const ProjectFooter = () => {
  return (
    <div className="mt-6 space-y-4 rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--panel-strong)] p-4 text-xs">
      {/* Logos */}
      <div className="flex items-center justify-center gap-4">
        <div className="relative h-14 w-auto flex-shrink-0">
          <Image
            src="/UKM.png"
            alt="Universiti Kebangsaan Malaysia"
            width={100}
            height={56}
            className="h-full w-auto object-contain"
            priority
            unoptimized
          />
        </div>
        <div className="relative h-14 w-auto flex-shrink-0">
          <Image
            src="/ftsm.jpg"
            alt="FTSM"
            width={100}
            height={56}
            className="h-full w-auto object-contain"
            priority
            unoptimized
          />
        </div>
      </div>

      {/* Professor - Moved to top with bold styling */}
      <div className="border-t border-[color:var(--stroke-strong)] pb-3 pt-3">
        <p className="mb-2 text-[13px] font-bold uppercase tracking-[0.12em] text-[color:var(--ink)]">
          Submitted to:
        </p>
        <p className="text-[16px] font-bold text-[color:var(--ink)] leading-tight">
          Prof. Salwani Abdullah
        </p>
      </div>

      {/* Project Info */}
      <div className="space-y-2 border-t border-[color:var(--stroke)] pt-3">
        <div className="text-center">
          <p className="text-[15px] font-semibold text-[color:var(--ink)]">
            Project 2
          </p>
          <p className="text-[12px] uppercase tracking-[0.12em] text-[color:var(--muted)]">
            TC6544 - Advanced Artificial Intelligence
          </p>
        </div>

        {/* Students */}
        <div className="space-y-1.5 pt-2">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[color:var(--muted)]">
            Students:
          </p>
          <div className="space-y-1 text-[13px] leading-relaxed text-[color:var(--ink-soft)]">
            <p>Abdullah Hayder Al-Obaidi (P166455)</p>
            <p>Muna Saleh Sagban (P161649)</p>
            <p>Mohmmed Imad Salim (P161076)</p>
            <p>Salwa Fraish Said AL Siyabi (P165619)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectFooter;

