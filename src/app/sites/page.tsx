"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import SiteCard from "@/components/SiteCard";
import type { Site } from "@/types";
import { Plus, Loader2 } from "lucide-react";
import { slugToName } from "@/lib/utils";

export default function SitesPage() {
  const { status } = useSession();
  const router = useRouter();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    fetch("/api/sites")
      .then((r) => r.json())
      .then((data) => {
        setSites(
          data.map((s: Site) => ({
            ...s,
            name: slugToName(s.slug),
          }))
        );
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (status === "loading") return null;

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Navbar showBack />
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-text">Sites existants</h1>
          <button
            onClick={() => router.push("/new")}
            className="flex items-center gap-2 px-4 py-2 bg-violet hover:bg-violet-hover text-white text-sm font-medium rounded-lg transition-colors duration-200"
          >
            <Plus className="w-4 h-4" />
            Nouveau site
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-violet animate-spin" />
          </div>
        ) : sites.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted">Aucun site trouve</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {sites.map((site) => (
              <SiteCard
                key={site.slug}
                site={site}
                onDeleted={() => setSites((prev) => prev.filter((s) => s.slug !== site.slug))}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
