import { Suspense } from "react";
import { connection } from "next/server";
import { db } from "@/prisma/db";

export default function BookingsPage() {
  return (
    <main>
      <h1>Bookings</h1>
      <Suspense fallback={<p>Loading bookings…</p>}>
        <BookingList />
      </Suspense>
    </main>
  );
}

async function BookingList() {
  await connection();
  const bookings = await db.orm.public.Booking.orderBy((b) => b.createdAt.desc()).all();

  if (bookings.length === 0) {
    return <p>There are no bookings yet.</p>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>id</th>
          <th>status</th>
          <th>seatId</th>
          <th>userId</th>
          <th>bookingDate</th>
        </tr>
      </thead>
      <tbody>
        {bookings.map((booking) => (
          <tr key={booking.id}>
            <td>{booking.id}</td>
            <td>{booking.status}</td>
            <td>{booking.seatId}</td>
            <td>{booking.userId}</td>
            <td>{booking.bookingDate.toISOString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
