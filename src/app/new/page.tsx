"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Navbar from "@/components/Navbar";

export default function NewSitePage() {
  const { status } = useSession();
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!url.includes("google.com/maps") && !url.includes("maps.google")) {
      setError("Veuillez entrer une URL Google Maps valide");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors du lancement");
      }

      router.push(`/new/loading?runId=${data.runId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      setLoading(false);
    }
  };

  if (status === "loading") return null;

  return (
    <div className="min-h-screen bg-bg">
      <Navbar showBack />
      <main className="flex flex-col items-center justify-center px-4 py-20">
        <h1 className="text-2xl font-bold text-text mb-2">
          Creer un nouveau site
        </h1>
        <p className="text-muted text-sm mb-8">
          Collez l&apos;URL Google Maps du restaurant
        </p>

        <form onSubmit={handleSubmit} className="w-full max-w-lg space-y-4">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://maps.google.com/..."
            className="w-full px-4 py-3 bg-input-bg border border-border rounded-xl text-text text-sm outline-none focus:border-violet transition-colors duration-200"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-green hover:bg-green-hover disabled:opacity-50 text-bg font-semibold rounded-xl transition-colors duration-200"
          >
            {loading ? "Lancement..." : "Lancer la creation"}
          </button>
          {error && (
            <p className="text-error text-sm text-center">{error}</p>
          )}
        </form>
      </main>
    </div>
  );
}
