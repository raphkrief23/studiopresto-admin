"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";

const STEPS = [
  "Recuperation des donnees Google Maps...",
  "Extraction des informations...",
  "Telechargement des photos...",
  "Generation du design...",
  "Deploiement du site...",
];

interface PipelineProgressProps {
  runId: string;
}

export default function PipelineProgress({ runId }: PipelineProgressProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [status, setStatus] = useState<"running" | "completed" | "failed">(
    "running"
  );
  const [slug, setSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "running") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/pipeline/status?runId=${runId}`);
        const data = await res.json();
        setCurrentStep(data.step ?? currentStep);
        setStatus(data.status);
        if (data.slug) setSlug(data.slug);
        if (data.error) setError(data.error);
      } catch {
        // Keep polling
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [runId, status, currentStep]);

  const progress =
    status === "completed"
      ? 100
      : Math.min(((currentStep + 1) / STEPS.length) * 100, 95);

  if (status === "completed") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-bg px-4">
        <div className="w-20 h-20 rounded-full bg-green/20 flex items-center justify-center mb-8">
          <Check className="w-10 h-10 text-green" />
        </div>
        <h1 className="text-2xl font-bold text-text mb-2">
          Site cree avec succes !
        </h1>
        <p className="text-muted mb-8">Le site est maintenant en ligne</p>
        <div className="flex gap-4">
          <button
            onClick={() => router.push(`/sites/${slug}`)}
            className="px-6 py-3 bg-violet hover:bg-violet-hover text-white font-medium rounded-xl transition-colors duration-200"
          >
            Modifier le site
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-6 py-3 border border-border text-muted hover:text-text hover:border-border-hover rounded-xl transition-all duration-200"
          >
            Retour au dashboard
          </button>
        </div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-bg px-4">
        <div className="w-20 h-20 rounded-full bg-error/20 flex items-center justify-center mb-8">
          <X className="w-10 h-10 text-error" />
        </div>
        <h1 className="text-2xl font-bold text-text mb-2">
          Erreur lors de la creation
        </h1>
        <p className="text-muted mb-4 max-w-md text-center text-sm">
          {error || "Une erreur est survenue pendant la pipeline."}
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => router.push("/new")}
            className="px-6 py-3 bg-violet hover:bg-violet-hover text-white font-medium rounded-xl transition-colors duration-200"
          >
            Reessayer
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-6 py-3 border border-border text-muted hover:text-text hover:border-border-hover rounded-xl transition-all duration-200"
          >
            Retour au dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg px-4">
      {/* Spinner */}
      <div className="w-20 h-20 rounded-full border-4 border-border border-t-violet animate-spin mb-10" />

      {/* Steps */}
      <div className="space-y-3 mb-10">
        {STEPS.map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            {i < currentStep ? (
              <Check className="w-4 h-4 text-green shrink-0" />
            ) : i === currentStep ? (
              <Loader2 className="w-4 h-4 text-violet animate-spin shrink-0" />
            ) : (
              <div className="w-4 h-4 shrink-0" />
            )}
            <span
              className={`text-sm ${
                i === currentStep
                  ? "text-text"
                  : i < currentStep
                    ? "text-muted"
                    : "text-muted2"
              }`}
            >
              {step}
            </span>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-md h-2 bg-border rounded-full overflow-hidden">
        <div
          className="h-full bg-violet rounded-full transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
