"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint =
        mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload =
        mode === "login" ? { email, password } : { name, email, password };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!response.ok) {
        setError(data.error ?? "Authentication failed");
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Network error while connecting to Neon auth service");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-[var(--bg-ground)] text-[var(--ink-primary)]">
      <div className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="inline-flex items-center"
            aria-label="Paretoium home"
          >
            <BrandLogo />
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-[var(--bg-recessed)] text-[var(--ink-secondary)] border border-[var(--border-subtle)]">
              Neon Auth
            </span>
            <ThemeToggle />
          </div>
        </div>

        <h1 className="text-xl font-bold tracking-tight text-[var(--ink-primary)] mb-1">
          {mode === "login" ? "Sign in to your account" : "Create your account"}
        </h1>
        <p className="text-sm text-[var(--ink-secondary)] mb-6">
          {mode === "login"
            ? "Access your curriculum optimizer and saved progress."
            : "Register a student account stored in Neon PostgreSQL."}
        </p>

        <div
          role="tablist"
          aria-label="Authentication mode"
          className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-[var(--bg-recessed)] border border-[var(--border-subtle)] mb-6"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === "login"}
            onClick={() => {
              setMode("login");
              setError(null);
            }}
            className={`py-2 text-xs font-semibold rounded-md transition cursor-pointer ${
              mode === "login"
                ? "bg-[var(--bg-surface)] text-[var(--ink-primary)] shadow-xs"
                : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "register"}
            onClick={() => {
              setMode("register");
              setError(null);
            }}
            className={`py-2 text-xs font-semibold rounded-md transition cursor-pointer ${
              mode === "register"
                ? "bg-[var(--bg-surface)] text-[var(--ink-primary)] shadow-xs"
                : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
            }`}
          >
            Create account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label
                htmlFor="name"
                className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1.5"
              >
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ada Lovelace"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-ground)] text-sm text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] focus:bg-[var(--bg-surface)] focus:outline-none focus:border-[var(--accent-coral)]"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1.5"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@university.edu"
              className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-ground)] text-sm text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] focus:bg-[var(--bg-surface)] focus:outline-none focus:border-[var(--accent-coral)]"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1.5"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-ground)] text-sm text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] focus:bg-[var(--bg-surface)] focus:outline-none focus:border-[var(--accent-coral)]"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="text-xs font-medium text-[var(--accent-coral-ink)] bg-[var(--accent-coral-soft)] border border-[var(--accent-coral-border)] rounded-lg px-3 py-2"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] text-sm font-semibold hover:bg-[var(--btn-primary-hover)] disabled:opacity-60 transition cursor-pointer"
          >
            {loading
              ? "Connecting..."
              : mode === "login"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-[var(--border-subtle)] text-center">
          <Link
            href="/"
            className="text-xs font-semibold text-[var(--ink-secondary)] hover:text-[var(--accent-coral)] transition"
          >
            ← Back to course graph
          </Link>
        </div>
      </div>
    </main>
  );
}
