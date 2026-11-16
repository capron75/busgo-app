import { db } from "@/prisma/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const bus = await db.orm.public.Bus.where((row) => row.id.eq(id))
    .include("seats", (seats) => seats.orderBy((seat) => seat.number.asc()))
    .first();

  if (!bus) {
    return Response.json({ error: "Bus not found." }, { status: 404 });
  }

  return Response.json({
    bus: {
      id: bus.id,
      name: bus.name,
      pricePerSeat: bus.pricePerSeat,
    },
    seats: bus.seats.map((seat) => ({
      id: seat.id,
      number: seat.number,
      isBooked: seat.isBooked,
    })),
  });
}
