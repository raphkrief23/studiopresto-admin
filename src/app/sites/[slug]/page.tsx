"use client";

import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import Logo from "@/components/Logo";
import SiteEditor from "@/components/SiteEditor";
import { slugToName } from "@/lib/utils";

export default function SiteEditorPage() {
  const { slug } = useParams<{ slug: string }>();
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  if (status === "loading" || !slug) return null;

  const siteName = slugToName(slug);
  const siteUrl = `https://${slug}.agencepresto.com`;

  return (
    <div className="h-screen flex flex-col bg-bg">
      {/* Compact navbar */}
      <nav className="flex items-center gap-3 px-4 py-2.5 border-b border-border shrink-0">
        <button
          onClick={() => router.push("/sites")}
          className="text-muted hover:text-text transition-colors duration-200"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-text font-medium text-sm">{siteName}</span>
      </nav>

      {/* Editor */}
      <SiteEditor slug={slug} siteName={siteName} siteUrl={siteUrl} />
    </div>
  );
}
