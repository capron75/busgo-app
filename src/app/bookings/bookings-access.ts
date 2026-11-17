export function bookingsForViewer<T extends { userId: string }>(
  viewerId: string | null,
  bookings: T[],
): { kind: "signed-out" } | { kind: "rows"; viewerId: string; bookings: T[] } {
  if (viewerId === null || viewerId.length === 0) {
    return { kind: "signed-out" };
  }
  return {
    kind: "rows",
    viewerId,
    bookings: bookings.filter((booking) => booking.userId === viewerId),
  };
}
