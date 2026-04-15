"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

interface DashboardCardProps {
  icon: ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  href: string;
}

export default function DashboardCard({
  icon,
  iconBg,
  title,
  subtitle,
  href,
}: DashboardCardProps) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(href)}
      className="flex flex-col items-start gap-4 p-8 bg-card border border-border rounded-2xl hover:border-border-hover transition-all duration-200 cursor-pointer text-left w-full"
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
        style={{ background: iconBg }}
      >
        {icon}
      </div>
      <div>
        <h3 className="text-text font-semibold text-lg">{title}</h3>
        <p className="text-muted text-sm mt-1">{subtitle}</p>
      </div>
    </button>
  );
}
