"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import DashboardCard from "@/components/DashboardCard";
import { LayoutGrid, Plus } from "lucide-react";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [siteCount, setSiteCount] = useState<number | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    fetch("/api/sites")
      .then((r) => r.json())
      .then((data) => setSiteCount(data.length ?? 0))
      .catch(() => setSiteCount(0));
  }, []);

  if (status === "loading") return null;

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-text">Bonjour</h1>
        <p className="text-muted mt-1">
          Que souhaitez-vous faire aujourd&apos;hui ?
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-10">
          <DashboardCard
            icon={
              <LayoutGrid className="w-6 h-6 text-violet" />
            }
            iconBg="rgba(108, 99, 255, 0.15)"
            title="Sites existants"
            subtitle={
              siteCount !== null
                ? `${siteCount} site${siteCount !== 1 ? "s" : ""} en ligne`
                : "Chargement..."
            }
            href="/sites"
          />
          <DashboardCard
            icon={
              <Plus className="w-6 h-6 text-green" />
            }
            iconBg="rgba(52, 211, 153, 0.15)"
            title="Creer un nouveau site"
            subtitle="A partir d'une URL Google Maps"
            href="/new"
          />
        </div>
      </main>
    </div>
  );
}
