"use client";

import { FormEvent, useState } from "react";
import { SeatMap, type Seat } from "./seat-map";

type BusResult = {
  id: string;
  name: string;
  departureAt: string;
  pricePerSeat: number;
  origin: string;
  destination: string;
};

const defaultDate = "2026-11-20";

export default function SearchPage() {
  const [buses, setBuses] = useState<BusResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [searched, setSearched] = useState(false);
  const [activeBus, setActiveBus] = useState<BusResult | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams({
      fromCity: String(form.get("fromCity") ?? ""),
      toCity: String(form.get("toCity") ?? ""),
      date: String(form.get("date") ?? ""),
    });
    setPending(true);
    setError(null);
    setActiveBus(null);
    setSeats([]);
    const response = await fetch(`/api/buses/search?${params.toString()}`);
    const body = (await response.json()) as { buses?: BusResult[]; error?: string };
    setPending(false);
    setSearched(true);
    if (!response.ok) {
      setBuses([]);
      setError(body.error ?? "Search failed.");
      return;
    }
    setBuses(body.buses ?? []);
  }

  async function chooseSeats(bus: BusResult) {
    setActiveBus(bus);
    setSeats([]);
    setError(null);
    const response = await fetch(`/api/buses/${bus.id}/seats`);
    const body = (await response.json()) as { seats?: Seat[]; error?: string };
    if (!response.ok) {
      setError(body.error ?? "Could not load seats.");
      return;
    }
    setSeats(body.seats ?? []);
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-black dark:text-zinc-50">Find a bus</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Try Oslo to Bergen on {defaultDate}.
        </p>
      </div>
      <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-4">
        <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
          From
          <input
            name="fromCity"
            required
            defaultValue="Oslo"
            className="h-11 rounded-lg border border-zinc-200 px-3 text-black dark:border-zinc-800 dark:bg-black dark:text-zinc-50"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
          To
          <input
            name="toCity"
            required
            defaultValue="Bergen"
            className="h-11 rounded-lg border border-zinc-200 px-3 text-black dark:border-zinc-800 dark:bg-black dark:text-zinc-50"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
          Date
          <input
            name="date"
            type="date"
            required
            defaultValue={defaultDate}
            className="h-11 rounded-lg border border-zinc-200 px-3 text-black dark:border-zinc-800 dark:bg-black dark:text-zinc-50"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="h-11 self-end rounded-full bg-black text-white disabled:opacity-60 dark:bg-zinc-50 dark:text-black"
        >
          {pending ? "Searching..." : "Search"}
        </button>
      </form>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {searched && buses.length === 0 && !error ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">No buses match that search.</p>
      ) : null}
      <ul className="flex flex-col gap-3">
        {buses.map((bus) => (
          <li
            key={bus.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <div>
              <p className="font-medium text-black dark:text-zinc-50">
                {bus.name} · {bus.origin} to {bus.destination}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {new Date(bus.departureAt).toLocaleString()} · {bus.pricePerSeat} NOK per seat
              </p>
            </div>
            <button
              type="button"
              onClick={() => chooseSeats(bus)}
              className="h-10 rounded-full border border-zinc-300 px-4 text-sm dark:border-zinc-700"
            >
              Choose seats
            </button>
          </li>
        ))}
      </ul>
      {activeBus && seats.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-black dark:text-zinc-50">
            Seats on {activeBus.name}
          </h2>
          <SeatMap seats={seats} pricePerSeat={activeBus.pricePerSeat} />
        </section>
      ) : null}
    </main>
  );
}
