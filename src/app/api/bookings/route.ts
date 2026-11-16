import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return Response.json({ error: "Log in before booking." }, { status: 401 });
  }

  const body = (await request.json()) as { busId?: string; seatIds?: string[] };
  const busId = body.busId ?? "";
  const seatIds = body.seatIds ?? [];
  if (!busId || seatIds.length === 0) {
    return Response.json({ error: "Choose at least one seat." }, { status: 400 });
  }

  const bus = await db.orm.public.Bus.first({ id: busId });
  if (!bus) {
    return Response.json({ error: "Bus not found." }, { status: 404 });
  }

  const seats = await db.orm.public.Seat.where((seat) => seat.id.in(seatIds)).all();
  const seatsById = new Map(seats.map((seat) => [seat.id, seat]));
  const seen = new Set<string>();
  const unavailable = seatIds.some((id) => {
    if (seen.has(id)) return true;
    seen.add(id);
    const seat = seatsById.get(id);
    return !seat || seat.busId !== busId || seat.isBooked;
  });
  if (unavailable) {
    return Response.json({ error: "One of those seats is no longer free." }, { status: 409 });
  }

  const userId = session.user.id;
  const bookings = await db.transaction(async (tx) => {
    const created: { id: string; seatId: string; seatNumber: string }[] = [];
    for (const seatId of seatIds) {
      const seat = seatsById.get(seatId);
      if (!seat) {
        throw new Error("Seat is no longer free.");
      }
      await tx.orm.public.Seat.where((row) => row.id.eq(seatId)).update({ isBooked: true });
      const booking = await tx.orm.public.Booking.create({
        id: randomUUID(),
        bookingDate: bus.departureAt,
        status: "PENDING",
        userId,
        seatId,
      });
      created.push({ id: booking.id, seatId, seatNumber: seat.number });
    }
    return created;
  });

  return Response.json({
    bookings,
    total: seatIds.length * bus.pricePerSeat,
  });
}
