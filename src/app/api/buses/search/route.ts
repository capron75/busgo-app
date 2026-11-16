import { db } from "@/prisma/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fromCity = searchParams.get("fromCity")?.trim() ?? "";
  const toCity = searchParams.get("toCity")?.trim() ?? "";
  const date = searchParams.get("date")?.trim() ?? "";

  if (!fromCity || !toCity || !date) {
    return Response.json(
      { error: "fromCity, toCity, and date are required." },
      { status: 400 },
    );
  }

  const start = new Date(`${date}T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  if (Number.isNaN(start.getTime())) {
    return Response.json({ error: "date must be YYYY-MM-DD." }, { status: 400 });
  }

  const routes = await db.orm.public.Route.where((route) => route.origin.ilike(fromCity))
    .where((route) => route.destination.ilike(toCity))
    .all();
  if (routes.length === 0) {
    return Response.json({ buses: [] });
  }

  const buses = await db.orm.public.Bus.where((bus) => bus.routeId.in(routes.map((route) => route.id)))
    .where((bus) => bus.departureAt.gte(start))
    .where((bus) => bus.departureAt.lt(end))
    .orderBy((bus) => bus.departureAt.asc())
    .include("route")
    .all();

  return Response.json({
    buses: buses.map((bus) => ({
      id: bus.id,
      name: bus.name,
      departureAt: bus.departureAt,
      pricePerSeat: bus.pricePerSeat,
      origin: bus.route.origin,
      destination: bus.route.destination,
    })),
  });
}
