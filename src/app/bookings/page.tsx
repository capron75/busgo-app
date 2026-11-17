import { Suspense, type ReactNode } from "react";
import { connection } from "next/server";
import { db } from "@/prisma/db";

const statuses = ["PENDING", "CONFIRMED", "CANCELLED"] as const;

type BookingStatus = (typeof statuses)[number];

type BookingRow = Awaited<ReturnType<typeof loadBookings>>[number];

type TripCard = {
  key: string;
  busName: string;
  origin: string;
  destination: string;
  bookingDate: Date;
  seatNumbers: string[];
  statuses: BookingStatus[];
  price: number;
  latestCreatedAt: Date;
};

const departureFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

function compareSeatNumbers(left: string, right: string) {
  return left.localeCompare(right, "en", { numeric: true, sensitivity: "base" });
}

function isBookingStatus(value: string): value is BookingStatus {
  return statuses.some((status) => status === value);
}

function statusLabel(status: BookingStatus) {
  switch (status) {
    case "PENDING":
      return "Pending";
    case "CONFIRMED":
      return "Confirmed";
    case "CANCELLED":
      return "Cancelled";
  }
}

function statusBadgeClass(status: BookingStatus) {
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

function groupTrips(bookings: BookingRow[]): TripCard[] {
  const groups = new Map<
    string,
    {
      key: string;
      busName: string;
      origin: string;
      destination: string;
      bookingDate: Date;
      pricePerSeat: number;
      seatNumbers: string[];
      statuses: Set<BookingStatus>;
      latestCreatedAt: Date;
    }
  >();

  for (const booking of bookings) {
    const seat = booking.seat;
    if (seat === null) continue;
    const bus = seat.bus;
    if (bus === null) continue;
    const route = bus.route;
    if (route === null) continue;
    if (!isBookingStatus(booking.status)) continue;

    const key = `${booking.userId}:${bus.id}:${booking.bookingDate.getTime()}`;
    const existing = groups.get(key);
    if (existing) {
      existing.seatNumbers.push(seat.number);
      existing.statuses.add(booking.status);
      if (booking.createdAt.getTime() > existing.latestCreatedAt.getTime()) {
        existing.latestCreatedAt = booking.createdAt;
      }
      continue;
    }

    groups.set(key, {
      key,
      busName: bus.name,
      origin: route.origin,
      destination: route.destination,
      bookingDate: booking.bookingDate,
      pricePerSeat: bus.pricePerSeat,
      seatNumbers: [seat.number],
      statuses: new Set([booking.status]),
      latestCreatedAt: booking.createdAt,
    });
  }

  const trips: TripCard[] = [];
  for (const group of groups.values()) {
    const seatNumbers = [...group.seatNumbers].sort(compareSeatNumbers);
    trips.push({
      key: group.key,
      busName: group.busName,
      origin: group.origin,
      destination: group.destination,
      bookingDate: group.bookingDate,
      seatNumbers,
      statuses: statuses.filter((status) => group.statuses.has(status)),
      price: group.pricePerSeat * seatNumbers.length,
      latestCreatedAt: group.latestCreatedAt,
    });
  }

  trips.sort((left, right) => right.latestCreatedAt.getTime() - left.latestCreatedAt.getTime());
  return trips;
}

async function loadBookings() {
  return db.orm.public.Booking.orderBy((booking) => booking.createdAt.desc())
    .include("seat", (seat) => seat.include("bus", (bus) => bus.include("route")))
    .all();
}

function Notice({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl bg-white p-6 text-sm text-zinc-600 shadow-sm">{children}</p>;
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
  const bookings = await loadBookings();
  const trips = groupTrips(bookings);

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
            <p className="mt-1 text-sm font-semibold text-zinc-800">{trip.seatNumbers.join(", ")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {trip.statuses.map((status) => (
                <span
                  key={status}
                  className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${statusBadgeClass(status)}`}
                >
                  {statusLabel(status)}
                </span>
              ))}
            </div>
          </div>
          <p className="text-2xl font-extrabold text-brand">{trip.price} NOK</p>
        </li>
      ))}
    </ul>
  );
}
