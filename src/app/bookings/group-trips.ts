const statuses = ["PENDING", "CONFIRMED", "CANCELLED"] as const;

export type BookingStatus = (typeof statuses)[number];

export type TripBooking = {
  userId: string;
  status: string;
  bookingDate: Date;
  createdAt: Date;
  seat: {
    id: string;
    number: string;
    bus: {
      id: string;
      name: string;
      pricePerSeat: number;
      route: {
        origin: string;
        destination: string;
      } | null;
    } | null;
  } | null;
};

export type TripCard = {
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

export class IncompleteBookingError extends Error {
  constructor() {
    super("A booking is missing its seat, bus, or route.");
    this.name = "IncompleteBookingError";
  }
}

function compareSeatNumbers(left: string, right: string) {
  return left.localeCompare(right, "en", { numeric: true, sensitivity: "base" });
}

function isBookingStatus(value: string): value is BookingStatus {
  return statuses.some((status) => status === value);
}

export function groupTrips(bookings: TripBooking[]): TripCard[] {
  const groups = new Map<
    string,
    {
      key: string;
      busName: string;
      origin: string;
      destination: string;
      bookingDate: Date;
      pricePerSeat: number;
      seats: Map<string, string>;
      statuses: Set<BookingStatus>;
      latestCreatedAt: Date;
    }
  >();

  for (const booking of bookings) {
    const seat = booking.seat;
    const bus = seat?.bus ?? null;
    const route = bus?.route ?? null;
    if (seat === null || bus === null || route === null || !isBookingStatus(booking.status)) {
      throw new IncompleteBookingError();
    }

    const key = `${booking.userId}:${bus.id}:${booking.bookingDate.getTime()}`;
    const existing = groups.get(key);
    if (existing) {
      existing.seats.set(seat.id, seat.number);
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
      seats: new Map([[seat.id, seat.number]]),
      statuses: new Set([booking.status]),
      latestCreatedAt: booking.createdAt,
    });
  }

  const trips: TripCard[] = [];
  for (const group of groups.values()) {
    const seatNumbers = [...group.seats.values()].sort(compareSeatNumbers);
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
