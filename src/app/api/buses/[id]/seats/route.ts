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

  const seats = bus.seats
    .map((seat) => ({
      id: seat.id,
      number: seat.number,
      isBooked: seat.isBooked,
    }))
    .sort((left, right) => compareSeatNumbers(left.number, right.number));

  return Response.json({
    bus: {
      id: bus.id,
      name: bus.name,
      pricePerSeat: bus.pricePerSeat,
    },
    seats,
  });
}

function compareSeatNumbers(left: string, right: string) {
  const leftRow = Number.parseInt(left, 10);
  const rightRow = Number.parseInt(right, 10);
  const leftOk = Number.isFinite(leftRow);
  const rightOk = Number.isFinite(rightRow);
  if (leftOk && rightOk && leftRow !== rightRow) return leftRow - rightRow;
  if (leftOk !== rightOk) return leftOk ? -1 : 1;
  const leftLetter = leftOk ? left.slice(String(leftRow).length) : left;
  const rightLetter = rightOk ? right.slice(String(rightRow).length) : right;
  return leftLetter.localeCompare(rightLetter);
}
