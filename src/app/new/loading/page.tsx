"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import PipelineProgress from "@/components/PipelineProgress";

function LoadingContent() {
  const searchParams = useSearchParams();
  const runId = searchParams.get("runId");

  if (!runId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg">
        <p className="text-muted">Aucun pipeline en cours</p>
      </div>
    );
  }

  return <PipelineProgress runId={runId} />;
}

export default function LoadingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-bg">
          <div className="w-16 h-16 rounded-full border-4 border-border border-t-violet animate-spin" />
        </div>
      }
    >
      <LoadingContent />
    </Suspense>
  );
}
