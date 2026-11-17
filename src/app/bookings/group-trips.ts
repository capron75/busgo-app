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

export type TripSeat = {
  number: string;
  status: BookingStatus;
};

export type TripCard = {
  key: string;
  busName: string;
  origin: string;
  destination: string;
  bookingDate: Date;
  seats: TripSeat[];
  price: number | null;
  latestCreatedAt: Date;
};

export class IncompleteBookingError extends Error {
  constructor() {
    super("A booking is missing its seat, bus, or route.");
    this.name = "IncompleteBookingError";
  }
}

export class UnrecognizedBookingStatusError extends Error {
  constructor() {
    super("A booking status is not PENDING, CONFIRMED, or CANCELLED.");
    this.name = "UnrecognizedBookingStatusError";
  }
}

type GroupedSeat = {
  number: string;
  status: BookingStatus;
};

const statusRank: Record<BookingStatus, number> = {
  CANCELLED: 0,
  PENDING: 1,
  CONFIRMED: 2,
};

function rememberSeat(seats: Map<string, GroupedSeat>, seat: { id: string; number: string }, status: BookingStatus) {
  const current = seats.get(seat.id);
  if (current) {
    current.number = seat.number;
    if (statusRank[status] > statusRank[current.status]) {
      current.status = status;
    }
    return;
  }
  seats.set(seat.id, { number: seat.number, status });
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
      seats: Map<string, GroupedSeat>;
      latestCreatedAt: Date;
    }
  >();

  for (const booking of bookings) {
    const seat = booking.seat;
    const bus = seat?.bus ?? null;
    const route = bus?.route ?? null;
    if (seat === null || bus === null || route === null) {
      throw new IncompleteBookingError();
    }
    if (!isBookingStatus(booking.status)) {
      throw new UnrecognizedBookingStatusError();
    }

    const key = `${booking.userId}:${bus.id}:${booking.bookingDate.getTime()}`;
    const existing = groups.get(key);
    if (existing) {
      rememberSeat(existing.seats, seat, booking.status);
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
      seats: new Map([[seat.id, { number: seat.number, status: booking.status }]]),
      latestCreatedAt: booking.createdAt,
    });
  }

  const trips: TripCard[] = [];
  for (const group of groups.values()) {
    const groupedSeats = [...group.seats.values()].sort((left, right) => compareSeatNumbers(left.number, right.number));
    const billableSeats = groupedSeats.filter((seat) => seat.status !== "CANCELLED").length;
    trips.push({
      key: group.key,
      busName: group.busName,
      origin: group.origin,
      destination: group.destination,
      bookingDate: group.bookingDate,
      seats: groupedSeats.map((seat) => ({ number: seat.number, status: seat.status })),
      price: billableSeats === 0 ? null : group.pricePerSeat * billableSeats,
      latestCreatedAt: group.latestCreatedAt,
    });
  }

  trips.sort((left, right) => right.latestCreatedAt.getTime() - left.latestCreatedAt.getTime());
  return trips;
}
