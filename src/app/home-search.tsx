"use client";

import { FormEvent } from "react";

const defaultDate = "2026-11-20";

export function HomeSearch() {
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams({
      fromCity: String(form.get("fromCity") ?? ""),
      toCity: String(form.get("toCity") ?? ""),
      date: String(form.get("date") ?? ""),
    });
    window.location.assign(`/search?${params.toString()}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="animate-rise grid gap-3 rounded-2xl bg-white p-4 shadow-xl sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end"
    >
      <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wide text-zinc-500">
        From
        <input
          name="fromCity"
          required
          defaultValue="Oslo"
          className="h-12 rounded-lg border border-zinc-200 px-3 text-base font-semibold normal-case text-zinc-900 outline-none transition focus:border-brand"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wide text-zinc-500">
        To
        <input
          name="toCity"
          required
          defaultValue="Bergen"
          className="h-12 rounded-lg border border-zinc-200 px-3 text-base font-semibold normal-case text-zinc-900 outline-none transition focus:border-brand"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wide text-zinc-500">
        Date
        <input
          name="date"
          type="date"
          required
          defaultValue={defaultDate}
          className="h-12 rounded-lg border border-zinc-200 px-3 text-base font-semibold text-zinc-900 outline-none transition focus:border-brand"
        />
      </label>
      <button
        type="submit"
        className="h-12 rounded-lg bg-brand px-6 text-base font-bold text-white transition hover:bg-brand-dark"
      >
        Search buses
      </button>
    </form>
  );
}
