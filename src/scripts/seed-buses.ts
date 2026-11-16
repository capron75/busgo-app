import { randomUUID } from "node:crypto";
import { db } from "../prisma/db";

const day = "2026-11-20";

const routes = [
  { origin: "Oslo", destination: "Bergen" },
  { origin: "Bergen", destination: "Oslo" },
  { origin: "Oslo", destination: "Trondheim" },
];

const buses = [
  { name: "Express 7", origin: "Oslo", destination: "Bergen", time: "08:00:00.000Z", pricePerSeat: 499 },
  { name: "Coastal 2", origin: "Oslo", destination: "Bergen", time: "16:30:00.000Z", pricePerSeat: 649 },
  { name: "Return 4", origin: "Bergen", destination: "Oslo", time: "12:00:00.000Z", pricePerSeat: 549 },
  { name: "North 9", origin: "Oslo", destination: "Trondheim", time: "09:15:00.000Z", pricePerSeat: 399 },
];

const PAIR = ["A", "B", "C", "D"] as const;
const BACK_BENCH = ["A", "B", "C", "D", "E"] as const;

/** 49 seats, the usual Swedish coach: rows 1–11 are 2+2, row 12 is a five-seat bench. */
function coachSeatNumbers() {
  const numbers: string[] = [];
  for (let row = 1; row <= 11; row += 1) {
    for (const letter of PAIR) numbers.push(`${row}${letter}`);
  }
  for (const letter of BACK_BENCH) numbers.push(`12${letter}`);
  return numbers;
}

async function ensureCoachSeats(busId: string) {
  const existing = await db.orm.public.Seat.where((seat) => seat.busId.eq(busId)).all();
  const have = new Set(existing.map((seat) => seat.number));
  const fresh = existing.length === 0;
  let added = 0;

  for (const number of coachSeatNumbers()) {
    if (have.has(number)) continue;
    await db.orm.public.Seat.create({
      id: randomUUID(),
      number,
      isBooked: fresh && (number === "1A" || number === "1B"),
      busId,
    });
    added += 1;
  }

  return added;
}

async function main() {
  const existing = await db.orm.public.Route.where((route) => route.origin.eq("Oslo")).first();

  if (!existing) {
    const routeIds = new Map<string, string>();
    for (const route of routes) {
      const id = randomUUID();
      routeIds.set(`${route.origin}->${route.destination}`, id);
      await db.orm.public.Route.create({
        id,
        origin: route.origin,
        destination: route.destination,
      });
    }

    for (const bus of buses) {
      const routeId = routeIds.get(`${bus.origin}->${bus.destination}`);
      if (!routeId) {
        throw new Error(`Missing route ${bus.origin} -> ${bus.destination}.`);
      }
      await db.orm.public.Bus.create({
        id: randomUUID(),
        name: bus.name,
        departureAt: new Date(`${day}T${bus.time}`),
        pricePerSeat: bus.pricePerSeat,
        routeId,
      });
    }
  }

  const saved = await db.orm.public.Bus.all();
  let added = 0;
  for (const bus of saved) {
    added += await ensureCoachSeats(bus.id);
  }

  console.log(`Coach layout ready for ${day}. Added ${added} seats across ${saved.length} buses.`);
  await db.close();
}

main().catch(async (error: unknown) => {
  console.error(error);
  await db.close();
  process.exitCode = 1;
});
