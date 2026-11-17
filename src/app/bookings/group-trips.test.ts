import assert from "node:assert/strict";
import test from "node:test";
import { IncompleteBookingError, UnrecognizedBookingStatusError, groupTrips, type TripBooking } from "./group-trips";

function booking(overrides: Partial<TripBooking> & Pick<TripBooking, "userId" | "status" | "createdAt">): TripBooking {
  return {
    userId: overrides.userId,
    status: overrides.status,
    bookingDate: overrides.bookingDate ?? new Date("2026-11-20T08:00:00.000Z"),
    createdAt: overrides.createdAt,
    seat: overrides.seat === undefined ? seat() : overrides.seat,
  };
}

function seat(overrides?: {
  id?: string;
  number?: string;
  busId?: string;
  name?: string;
  pricePerSeat?: number;
  origin?: string;
  destination?: string;
  route?: null;
  bus?: null;
}) {
  if (overrides?.bus === null) {
    return { id: overrides.id ?? "seat-1", number: overrides.number ?? "1A", bus: null };
  }
  const busId = overrides?.busId ?? "bus-1";
  return {
    id: overrides?.id ?? "seat-1",
    number: overrides?.number ?? "1A",
    bus: {
      id: busId,
      name: overrides?.name ?? "Express 7",
      pricePerSeat: overrides?.pricePerSeat ?? 499,
      route:
        overrides?.route === null
          ? null
          : {
              origin: overrides?.origin ?? "Oslo",
              destination: overrides?.destination ?? "Bergen",
            },
    },
  };
}

test("groups one purchase and sorts seat numbers naturally", () => {
  const trips = groupTrips([
    booking({
      userId: "ada",
      status: "PENDING",
      createdAt: new Date("2026-11-16T15:04:00.000Z"),
      seat: seat({ id: "s10", number: "10A" }),
    }),
    booking({
      userId: "ada",
      status: "PENDING",
      createdAt: new Date("2026-11-16T15:04:01.000Z"),
      seat: seat({ id: "s2", number: "2A" }),
    }),
    booking({
      userId: "ada",
      status: "CANCELLED",
      createdAt: new Date("2026-11-16T15:04:02.000Z"),
      seat: seat({ id: "s1", number: "1B" }),
    }),
  ]);

  assert.equal(trips.length, 1);
  assert.deepEqual(trips[0]?.seats, [
    { number: "1B", status: "CANCELLED" },
    { number: "2A", status: "PENDING" },
    { number: "10A", status: "PENDING" },
  ]);
  assert.equal(trips[0]?.price, 499 * 2);
  assert.equal(trips[0]?.origin, "Oslo");
  assert.equal(trips[0]?.destination, "Bergen");
});

test("keeps separate purchases on different users, buses, or departures", () => {
  const departure = new Date("2026-11-20T08:00:00.000Z");
  const later = new Date("2026-11-20T16:30:00.000Z");
  const trips = groupTrips([
    booking({
      userId: "ada",
      status: "CONFIRMED",
      bookingDate: departure,
      createdAt: new Date("2026-11-01T10:00:00.000Z"),
      seat: seat({ id: "a", number: "3A" }),
    }),
    booking({
      userId: "bea",
      status: "PENDING",
      bookingDate: departure,
      createdAt: new Date("2026-11-02T10:00:00.000Z"),
      seat: seat({ id: "b", number: "4A" }),
    }),
    booking({
      userId: "ada",
      status: "PENDING",
      bookingDate: later,
      createdAt: new Date("2026-11-03T10:00:00.000Z"),
      seat: seat({ id: "c", number: "5A", busId: "bus-2", name: "Coastal 2", pricePerSeat: 649 }),
    }),
  ]);

  assert.equal(trips.length, 3);
  assert.deepEqual(
    trips.map((trip) => trip.busName),
    ["Coastal 2", "Express 7", "Express 7"],
  );
});

test("counts a repeated billable seat once and leaves a cancelled-only seat out of the fare", () => {
  const trips = groupTrips([
    booking({
      userId: "ada",
      status: "PENDING",
      createdAt: new Date("2026-11-16T15:04:00.000Z"),
      seat: seat({ id: "same", number: "12" }),
    }),
    booking({
      userId: "ada",
      status: "CANCELLED",
      createdAt: new Date("2026-11-16T15:05:00.000Z"),
      seat: seat({ id: "same", number: "12" }),
    }),
    booking({
      userId: "ada",
      status: "CANCELLED",
      createdAt: new Date("2026-11-16T15:06:00.000Z"),
      seat: seat({ id: "other", number: "13", pricePerSeat: 400 }),
    }),
  ]);

  assert.equal(trips.length, 1);
  assert.deepEqual(trips[0]?.seats, [
    { number: "12", status: "PENDING" },
    { number: "13", status: "CANCELLED" },
  ]);
  assert.equal(trips[0]?.price, 499);
});

test("a later cancellation is seen first and the pending row keeps the seat billable", () => {
  const trips = groupTrips([
    booking({
      userId: "ada",
      status: "CANCELLED",
      createdAt: new Date("2026-11-16T15:05:00.000Z"),
      seat: seat({ id: "same", number: "12" }),
    }),
    booking({
      userId: "ada",
      status: "PENDING",
      createdAt: new Date("2026-11-16T15:04:00.000Z"),
      seat: seat({ id: "same", number: "12" }),
    }),
  ]);

  assert.equal(trips.length, 1);
  assert.deepEqual(trips[0]?.seats, [{ number: "12", status: "PENDING" }]);
  assert.equal(trips[0]?.price, 499);
});

test("hides the fare when every seat is cancelled", () => {
  const trips = groupTrips([
    booking({
      userId: "ada",
      status: "CANCELLED",
      createdAt: new Date("2026-11-16T15:04:00.000Z"),
      seat: seat({ id: "only", number: "7A" }),
    }),
  ]);

  assert.equal(trips.length, 1);
  assert.deepEqual(trips[0]?.seats, [{ number: "7A", status: "CANCELLED" }]);
  assert.equal(trips[0]?.price, null);
});

test("an empty booking list stays empty", () => {
  assert.deepEqual(groupTrips([]), []);
});

test("a missing seat, bus, or route is a failed load", () => {
  assert.throws(() => groupTrips([booking({ userId: "ada", status: "PENDING", createdAt: new Date(), seat: null })]), IncompleteBookingError);
  assert.throws(
    () =>
      groupTrips([
        booking({
          userId: "ada",
          status: "PENDING",
          createdAt: new Date(),
          seat: seat({ bus: null }),
        }),
      ]),
    IncompleteBookingError,
  );
  assert.throws(
    () =>
      groupTrips([
        booking({
          userId: "ada",
          status: "PENDING",
          createdAt: new Date(),
          seat: seat({ route: null }),
        }),
      ]),
    IncompleteBookingError,
  );
});

test("an unrecognized status is a failed load", () => {
  assert.throws(
    () => groupTrips([booking({ userId: "ada", status: "HELD", createdAt: new Date() })]),
    UnrecognizedBookingStatusError,
  );
});
