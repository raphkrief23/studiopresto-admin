"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Site } from "@/types";
import { formatDate } from "@/lib/utils";
import { Trash2, Loader2 } from "lucide-react";

interface SiteCardProps {
  site: Site;
  onDeleted?: () => void;
}

export default function SiteCard({ site, onDeleted }: SiteCardProps) {
  const router = useRouter();
  const initial = site.name.charAt(0).toUpperCase();
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/sites/${site.slug}/delete`, {
        method: "DELETE",
      });
      if (res.ok) {
        onDeleted?.();
      }
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="relative group">
      <button
        onClick={() => router.push(`/sites/${site.slug}`)}
        className="flex flex-col bg-card border border-border rounded-xl overflow-hidden hover:border-border-hover hover:scale-[1.01] transition-all duration-200 cursor-pointer text-left w-full"
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

      {/* Delete button */}
      {!showConfirm && (
        <button
          onClick={handleDelete}
          className="absolute top-3 right-3 p-2 bg-bg/80 border border-border rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:border-error hover:text-error text-muted"
          title="Supprimer le site"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}

      {/* Confirmation overlay */}
      {showConfirm && (
        <div
          className="absolute inset-0 bg-bg/90 rounded-xl flex flex-col items-center justify-center gap-3 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-text text-sm font-medium text-center px-4">
            Supprimer {site.name} ?
          </p>
          <p className="text-muted text-xs text-center px-4">
            GitHub + Vercel seront supprimes
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 bg-error hover:bg-error/80 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors duration-200"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Supprimer"
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowConfirm(false);
              }}
              className="px-4 py-2 border border-border text-muted text-xs rounded-lg hover:text-text hover:border-border-hover transition-colors duration-200"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
