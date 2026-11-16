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
  const unavailable = seatIds.filter((id) => {
    const seat = seats.find((item) => item.id === id);
    return !seat || seat.busId !== busId || seat.isBooked;
  });
  if (unavailable.length > 0) {
    return Response.json({ error: "One of those seats is no longer free." }, { status: 409 });
  }

  const bookings = [];
  for (const seatId of seatIds) {
    await db.orm.public.Seat.where((seat) => seat.id.eq(seatId)).update({ isBooked: true });
    const booking = await db.orm.public.Booking.create({
      id: randomUUID(),
      bookingDate: bus.departureAt,
      status: "PENDING",
      userId: session.user.id,
      seatId,
    });
    bookings.push({ id: booking.id, seatId });
  }

  return Response.json({ bookings });
}
