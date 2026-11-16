import Link from "next/link";
import { Suspense } from "react";

type ConfirmSearch = {
  seats?: string | string[];
  total?: string | string[];
  bus?: string | string[];
  from?: string | string[];
  to?: string | string[];
};

function first(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim() ?? "";
}

function ConfirmFrame({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 py-10">
      <section className="animate-rise rounded-2xl bg-white p-8 shadow-sm">{children}</section>
    </main>
  );
}

export default function BookingConfirmPage({
  searchParams,
}: {
  searchParams: Promise<ConfirmSearch>;
}) {
  return (
    <Suspense
      fallback={
        <ConfirmFrame>
          <p className="text-sm text-zinc-600">Loading confirmation…</p>
        </ConfirmFrame>
      }
    >
      <Confirmation searchParams={searchParams} />
    </Suspense>
  );
}

async function Confirmation({ searchParams }: { searchParams: Promise<ConfirmSearch> }) {
  const params = await searchParams;
  const seatNumbers = first(params.seats)
    .split(",")
    .map((seat) => seat.trim())
    .filter(Boolean);
  const totalRaw = first(params.total);
  const total = Number(totalRaw);
  const bus = first(params.bus);
  const from = first(params.from);
  const to = first(params.to);
  const route = from && to ? `${from} → ${to}` : from || to;
  const confirmed = seatNumbers.length > 0 && totalRaw !== "" && Number.isFinite(total);

  if (!confirmed) {
    return (
      <ConfirmFrame>
        <h1 className="text-2xl font-extrabold">No booking to confirm</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600">There is no booking to confirm.</p>
        <Link
          href="/"
          className="mt-6 inline-flex h-12 items-center rounded-lg bg-brand px-6 font-bold text-white transition hover:bg-brand-dark"
        >
          Home
        </Link>
      </ConfirmFrame>
    );
  }

  return (
    <ConfirmFrame>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">Booking confirmed</p>
      <h1 className="mt-2 text-3xl font-extrabold">{bus || "Your trip"}</h1>
      {route ? <p className="mt-1 text-sm text-zinc-600">{route}</p> : null}

      <div className="mt-6">
        <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">Seats</p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {seatNumbers.map((seat) => (
            <li
              key={seat}
              className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-bold text-brand-dark"
            >
              {seat}
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-6 text-xs font-bold uppercase tracking-wide text-zinc-500">Total</p>
      <p className="mt-1 text-4xl font-extrabold text-brand">{total} NOK</p>
      <p className="mt-3 text-sm text-zinc-600">Show this booking at boarding.</p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/search"
          className="inline-flex h-12 items-center rounded-lg bg-brand px-6 font-bold text-white transition hover:bg-brand-dark"
        >
          Search again
        </Link>
        <Link
          href="/bookings"
          className="inline-flex h-12 items-center rounded-lg border border-zinc-200 px-6 font-bold text-zinc-800 transition hover:border-brand hover:text-brand"
        >
          My bookings
        </Link>
      </div>
    </ConfirmFrame>
  );
}
