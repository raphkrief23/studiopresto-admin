import Link from "next/link";

export default function Logo({ size = "sm" }: { size?: "sm" | "lg" }) {
  const textSize = size === "lg" ? "text-3xl" : "text-lg";
  return (
    <Link href="/dashboard" className={`font-mono ${textSize} tracking-tight`}>
      <span className="text-text">studiopresto</span>
      <span className="text-violet">/</span>
      <span className="text-text">admin</span>
    </Link>
  );
}
