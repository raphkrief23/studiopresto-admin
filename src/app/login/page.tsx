"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/dashboard",
      });

      setLoading(false);

      if (result?.error) {
        setError("Email ou mot de passe incorrect");
      } else if (result?.ok) {
        window.location.href = "/dashboard";
      }
    } catch (err) {
      setLoading(false);
      setError("Erreur de connexion");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg px-4">
      <div className="w-full max-w-sm flex flex-col items-center">
        <Logo size="lg" />
        <p className="text-muted text-sm mt-2 mb-10">
          Gestion des sites restaurants
        </p>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div>
            <label className="block text-text text-sm mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              className="w-full px-4 py-3 bg-input-bg border border-border rounded-xl text-text text-sm outline-none focus:border-violet transition-colors duration-200"
              required
            />
          </div>
          <div>
            <label className="block text-text text-sm mb-1.5">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-input-bg border border-border rounded-xl text-text text-sm outline-none focus:border-violet transition-colors duration-200"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-violet hover:bg-violet-hover disabled:opacity-50 text-white font-medium rounded-xl transition-colors duration-200"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
          {error && (
            <p className="text-error text-sm text-center">{error}</p>
          )}
        </form>
      </div>
    </div>
  );
}
