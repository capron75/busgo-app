"use client";

import { FormEvent, useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    const result = await authClient.signIn.email({
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    });
    setPending(false);
    if (result.error) {
      setError(result.error.message ?? "Sign in failed.");
      return;
    }
    const next = new URLSearchParams(window.location.search).get("next");
    window.location.assign(next?.startsWith("/") ? next : "/");
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <form onSubmit={onSubmit} className="animate-rise flex w-full max-w-sm flex-col gap-4 rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-extrabold text-brand">Login</h1>
        <p className="text-sm leading-6 text-zinc-500">Demo account: demo@busgo.local / Busgo-demo-1</p>
        <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wide text-zinc-500">
          Email
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            defaultValue="demo@busgo.local"
            className="h-12 rounded-lg border border-zinc-200 px-3 text-base font-semibold normal-case text-zinc-900 outline-none focus:border-brand"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wide text-zinc-500">
          Password
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            defaultValue="Busgo-demo-1"
            className="h-12 rounded-lg border border-zinc-200 px-3 text-base font-semibold text-zinc-900 outline-none focus:border-brand"
          />
        </label>
        {error ? <p className="text-sm text-brand-dark">{error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="h-12 rounded-lg bg-brand font-bold text-white transition hover:bg-brand-dark disabled:opacity-60"
        >
          {pending ? "Signing in..." : "Login"}
        </button>
      </form>
    </main>
  );
}
