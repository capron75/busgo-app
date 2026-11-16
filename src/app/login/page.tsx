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
    window.location.assign("/");
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <form
        onSubmit={onSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-2xl bg-white p-8 shadow-sm dark:bg-zinc-950"
      >
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">Log in</h1>
        <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Demo account: demo@busgo.local / Busgo-demo-1
        </p>
        <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
          Email
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            defaultValue="demo@busgo.local"
            className="h-11 rounded-lg border border-zinc-200 px-3 text-black dark:border-zinc-800 dark:bg-black dark:text-zinc-50"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
          Password
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            defaultValue="Busgo-demo-1"
            className="h-11 rounded-lg border border-zinc-200 px-3 text-black dark:border-zinc-800 dark:bg-black dark:text-zinc-50"
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="h-11 rounded-full bg-black text-white disabled:opacity-60 dark:bg-zinc-50 dark:text-black"
        >
          {pending ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}
