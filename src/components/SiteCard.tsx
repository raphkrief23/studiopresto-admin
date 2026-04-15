"use client";

import { useRouter } from "next/navigation";
import type { Site } from "@/types";
import { formatDate } from "@/lib/utils";

export default function SiteCard({ site }: { site: Site }) {
  const router = useRouter();
  const initial = site.name.charAt(0).toUpperCase();

  return (
    <button
      onClick={() => router.push(`/sites/${site.slug}`)}
      className="flex flex-col bg-card border border-border rounded-xl overflow-hidden hover:border-border-hover hover:scale-[1.01] transition-all duration-200 cursor-pointer text-left"
    >
      <div className="h-44 bg-[#111] flex items-center justify-center">
        <span className="text-7xl font-semibold text-[#333] select-none">
          {initial}
        </span>
      </div>
      <div className="p-4">
        <h3 className="text-text font-semibold text-base truncate">
          {site.name}
        </h3>
        <p className="text-muted text-xs mt-1 truncate">{site.slug}</p>
        <p className="text-muted text-xs mt-1">
          Modifie {formatDate(site.updatedAt)}
        </p>
      </div>
    </button>
  );
}
