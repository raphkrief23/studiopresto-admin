"use client";

import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import Logo from "./Logo";

export default function Navbar({ showBack = false }: { showBack?: boolean }) {
  const { data: session } = useSession();
  const router = useRouter();

  return (
    <nav className="flex items-center justify-between px-6 py-3 border-b border-border bg-bg">
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="text-muted hover:text-text transition-colors duration-200"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <Logo size="sm" />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-muted text-sm hidden sm:block">
          {session?.user?.email}
        </span>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-muted text-sm hover:text-text transition-colors duration-200"
        >
          Deconnexion
        </button>
      </div>
    </nav>
  );
}
