import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { headers } from "next/headers";
import { connection } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { bookingsForViewer } from "./bookings-access";
import { IncompleteBookingError, UnrecognizedBookingStatusError, groupTrips } from "./group-trips";

const departureFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

function statusLabel(status: "PENDING" | "CONFIRMED" | "CANCELLED") {
  switch (status) {
    case "PENDING":
      return "Pending";
    case "CONFIRMED":
      return "Confirmed";
    case "CANCELLED":
      return "Cancelled";
  }
}

function statusBadgeClass(status: "PENDING" | "CONFIRMED" | "CANCELLED") {
  switch (status) {
    case "PENDING":
      return "bg-zinc-100 text-zinc-700";
    case "CONFIRMED":
      return "bg-emerald-50 text-emerald-800";
    case "CANCELLED":
      return "bg-zinc-100 text-zinc-400";
  }
}

function formatDeparture(value: Date) {
  return departureFormat.format(value);
}

async function loadBookings(userId: string) {
  return db.orm.public.Booking.where((booking) => booking.userId.eq(userId))
    .orderBy((booking) => booking.createdAt.desc())
    .include("seat", (seat) => seat.include("bus", (bus) => bus.include("route")))
    .all();
}

function Notice({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl bg-white p-6 text-sm text-zinc-600 shadow-sm">{children}</div>;
}

function LoginNotice() {
  return (
    <Notice>
      <p>Log in to see your bookings.</p>
      <Link
        href="/login?next=/bookings"
        className="mt-4 inline-flex h-12 items-center rounded-lg bg-brand px-6 font-bold text-white transition hover:bg-brand-dark"
      >
        Login
      </Link>
    </Notice>
  );
}

export default function BookingsPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <h1 className="text-4xl font-extrabold">Bookings</h1>
      <Suspense fallback={<Notice>Loading bookings…</Notice>}>
        <BookingList />
      </Suspense>
    </main>
  );
}

async function BookingList() {
  await connection();
  const session = await auth.api.getSession({ headers: await headers() });
  const access = bookingsForViewer(session?.user.id ?? null, []);
  if (access.kind === "signed-out") {
    return <LoginNotice />;
  }

  const visible = bookingsForViewer(access.viewerId, await loadBookings(access.viewerId));
  if (visible.kind === "signed-out") {
    return <LoginNotice />;
  }
  const bookings = visible.bookings;
  let trips;
  try {
    trips = groupTrips(bookings);
  } catch (error) {
    if (error instanceof IncompleteBookingError || error instanceof UnrecognizedBookingStatusError) {
      return <Notice>{error.message}</Notice>;
    }
    throw error;
  }

  if (trips.length === 0) {
    return <Notice>There are no bookings yet.</Notice>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {trips.map((trip) => (
        <li
          key={trip.key}
          className="flex flex-wrap items-start justify-between gap-4 rounded-2xl bg-white p-5 shadow-sm"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">{trip.busName}</p>
            <p className="mt-1 text-2xl font-extrabold">
              {trip.origin} → {trip.destination}
            </p>
            <p className="mt-1 text-sm text-zinc-600">{formatDeparture(trip.bookingDate)}</p>
            <p className="mt-3 text-xs font-bold uppercase tracking-wide text-zinc-500">Seats</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {trip.seats.map((seat) => (
                <li key={seat.number} className="flex items-center gap-2 rounded-full bg-zinc-50 py-1 pl-3 pr-1">
                  <span className="text-sm font-semibold text-zinc-800">{seat.number}</span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${statusBadgeClass(seat.status)}`}
                  >
                    {statusLabel(seat.status)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          {trip.price !== null ? <p className="text-2xl font-extrabold text-brand">{trip.price} NOK</p> : null}
        </li>
      ))}
    </ul>
  );
}
