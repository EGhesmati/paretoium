"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SessionUser } from "@/lib/auth";

export function AuthNav({ user }: { user: SessionUser | null }) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleLogout() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="text-xs font-semibold px-3.5 py-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--ink-primary)] hover:bg-[var(--bg-recessed)] transition"
      >
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium px-3 py-1.5 rounded-lg bg-[var(--bg-recessed)] text-[var(--ink-primary)] border border-[var(--border-subtle)]">
        {user.name || user.email}
      </span>
      <button
        type="button"
        onClick={handleLogout}
        disabled={signingOut}
        className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-recessed)] transition cursor-pointer"
      >
        {signingOut ? "..." : "Sign out"}
      </button>
    </div>
  );
}
