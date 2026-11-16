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

function seatNumber(index: number) {
  const row = Math.floor(index / 4) + 1;
  const letter = "ABCD"[index % 4];
  return `${row}${letter}`;
}

async function main() {
  const existing = await db.orm.public.Route.where((route) => route.origin.eq("Oslo")).first();
  if (existing) {
    console.log("Bus seed already present.");
    await db.close();
    return;
  }

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
    const busId = randomUUID();
    await db.orm.public.Bus.create({
      id: busId,
      name: bus.name,
      departureAt: new Date(`${day}T${bus.time}`),
      pricePerSeat: bus.pricePerSeat,
      routeId: routeIds.get(`${bus.origin}->${bus.destination}`)!,
    });

    for (let index = 0; index < 12; index += 1) {
      await db.orm.public.Seat.create({
        id: randomUUID(),
        number: seatNumber(index),
        isBooked: index < 2,
        busId,
      });
    }
  }

  console.log(`Seeded buses for ${day}.`);
  await db.close();
}

main().catch(async (error: unknown) => {
  console.error(error);
  await db.close();
  process.exitCode = 1;
});
