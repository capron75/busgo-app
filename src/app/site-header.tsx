"use client";

import { authClient } from "@/lib/auth-client";

export function SiteHeader() {
  const { data: session, isPending } = authClient.useSession();

  return (
    <header className="sticky top-0 z-30 border-b border-black/5 bg-white shadow-sm">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <a href="/" className="text-2xl font-extrabold tracking-tight text-brand">
          bus<span className="text-brand-dark">Go</span>
        </a>
        <nav className="flex items-center gap-3 text-sm font-semibold">
          <a href="/search" className="rounded-full px-3 py-2 text-zinc-700 transition hover:bg-red-50 hover:text-brand">
            Bus tickets
          </a>
          {isPending ? (
            <span className="h-9 w-20 animate-pulse rounded-full bg-zinc-100" />
          ) : session?.user ? (
            <span className="flex items-center gap-2">
              <span className="hidden max-w-40 truncate text-zinc-700 sm:inline">{session.user.name}</span>
              <button
                type="button"
                onClick={() => authClient.signOut().then(() => window.location.assign("/"))}
                className="rounded-full border border-brand px-4 py-2 text-brand transition hover:bg-brand hover:text-white"
              >
                Log out
              </button>
            </span>
          ) : (
            <a
              href="/login"
              className="rounded-full bg-brand px-4 py-2 text-white shadow-sm transition hover:bg-brand-dark"
            >
              Login
            </a>
          )}
        </nav>
      </div>
    </header>
  );
}
