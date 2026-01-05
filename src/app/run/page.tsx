"use client";

import PageHeader from "@/components/PageHeader";
import RunController from "@/components/RunController";

const RunPage = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Run & Monitor"
        subtitle="Execute SA, HSA, or both while tracking live progress metrics."
        kicker="Run"
      />
      <RunController />
    </div>
  );
};

export default RunPage;
