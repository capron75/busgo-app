"use client";

import { FormEvent, useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
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

function clock(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(value));
}

export default function SearchPage() {
  const { data: session } = authClient.useSession();
  const [buses, setBuses] = useState<BusResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [searched, setSearched] = useState(false);
  const [activeBus, setActiveBus] = useState<BusResult | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [chosenIds, setChosenIds] = useState<string[]>([]);
  const [booking, setBooking] = useState<"idle" | "saving" | "done">("idle");

  async function search(fromCity: string, toCity: string, date: string) {
    setPending(true);
    setError(null);
    setActiveBus(null);
    setSeats([]);
    setChosenIds([]);
    setBooking("idle");
    const params = new URLSearchParams({ fromCity, toCity, date });
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromCity = params.get("fromCity");
    const toCity = params.get("toCity");
    const date = params.get("date");
    if (fromCity && toCity && date) {
      void search(fromCity, toCity, date);
    }
  }, []);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void search(
      String(form.get("fromCity") ?? ""),
      String(form.get("toCity") ?? ""),
      String(form.get("date") ?? ""),
    );
  }

  async function chooseSeats(bus: BusResult) {
    setActiveBus(bus);
    setSeats([]);
    setChosenIds([]);
    setBooking("idle");
    setError(null);
    const response = await fetch(`/api/buses/${bus.id}/seats`);
    const body = (await response.json()) as { seats?: Seat[]; error?: string };
    if (!response.ok) {
      setError(body.error ?? "Could not load seats.");
      return;
    }
    setSeats(body.seats ?? []);
  }

  async function confirmBooking(seatIds = chosenIds) {
    if (!activeBus || seatIds.length === 0) return;
    if (!session?.user) {
      const next = `${window.location.pathname}${window.location.search}`;
      window.location.assign(`/login?next=${encodeURIComponent(next)}`);
      return;
    }
    setBooking("saving");
    setError(null);
    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ busId: activeBus.id, seatIds }),
    });
    const body = (await response.json()) as { error?: string };
    if (!response.ok) {
      setBooking("idle");
      setError(body.error ?? "Booking failed.");
      return;
    }
    setBooking("done");
  }

  const chosenSeats = seats.filter((seat) => chosenIds.includes(seat.id));
  const total = activeBus ? chosenSeats.length * activeBus.pricePerSeat : 0;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <form onSubmit={onSubmit} className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
        <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wide text-zinc-500">
          From
          <input name="fromCity" required defaultValue="Oslo" className="h-12 rounded-lg border border-zinc-200 px-3 font-semibold outline-none focus:border-brand" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wide text-zinc-500">
          To
          <input name="toCity" required defaultValue="Bergen" className="h-12 rounded-lg border border-zinc-200 px-3 font-semibold outline-none focus:border-brand" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wide text-zinc-500">
          Date
          <input name="date" type="date" required defaultValue={defaultDate} className="h-12 rounded-lg border border-zinc-200 px-3 font-semibold outline-none focus:border-brand" />
        </label>
        <button type="submit" disabled={pending} className="h-12 rounded-lg bg-brand px-6 font-bold text-white transition hover:bg-brand-dark disabled:opacity-60">
          {pending ? "Searching..." : "Search"}
        </button>
      </form>

      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-brand-dark">{error}</p> : null}
      {searched && buses.length === 0 && !error ? (
        <p className="rounded-2xl bg-white p-6 text-sm text-zinc-600">No buses match that search.</p>
      ) : null}

      <ul className="flex flex-col gap-3">
        {buses.map((bus, index) => (
          <li
            key={bus.id}
            className="animate-rise flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">{bus.name}</p>
              <p className="mt-1 text-2xl font-extrabold">{clock(bus.departureAt)}</p>
              <p className="text-sm text-zinc-600">
                {bus.origin} → {bus.destination}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-extrabold text-brand">{bus.pricePerSeat} NOK</p>
              <button
                type="button"
                onClick={() => chooseSeats(bus)}
                className="mt-2 rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-dark"
              >
                View seats
              </button>
            </div>
          </li>
        ))}
      </ul>

      {activeBus && seats.length > 0 ? (
        <section className="animate-rise grid gap-6 rounded-2xl bg-white p-5 shadow-sm lg:grid-cols-[minmax(0,1fr)_280px]">
          <div>
            <h2 className="text-xl font-extrabold">Select seats · {activeBus.name}</h2>
            <p className="mb-4 text-sm text-zinc-500">
              {activeBus.origin} → {activeBus.destination} · {clock(activeBus.departureAt)}
            </p>
            <SeatMap
              seats={seats}
              pricePerSeat={activeBus.pricePerSeat}
              onChange={(seatIds) => {
                setChosenIds(seatIds);
                setBooking("idle");
              }}
              onProceed={(seatIds) => {
                setChosenIds(seatIds);
                void confirmBooking(seatIds);
              }}
            />
          </div>
          <aside className="h-fit rounded-2xl border border-red-100 bg-red-50 p-4">
            <h3 className="font-bold">Your trip</h3>
            <p className="mt-2 text-sm text-zinc-600">
              {chosenSeats.length > 0 ? chosenSeats.map((seat) => seat.number).join(", ") : "No seats yet"}
            </p>
            <p className="mt-3 text-3xl font-extrabold text-brand">{total} NOK</p>
            {booking === "done" ? (
              <p className="mt-4 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-emerald-700">
                Seats held. Show this booking at boarding.
              </p>
            ) : (
              <button
                type="button"
                disabled={chosenIds.length === 0 || booking === "saving"}
                onClick={() => void confirmBooking()}
                className="mt-4 h-12 w-full rounded-lg bg-brand font-bold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-zinc-300"
              >
                {booking === "saving" ? "Booking..." : session?.user ? "Proceed to book" : "Login to proceed"}
              </button>
            )}
          </aside>
        </section>
      ) : null}
    </main>
  );
}
