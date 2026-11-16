"use client";

import { useState } from "react";

export type Seat = {
  id: string;
  number: string;
  isBooked: boolean;
};

export function SeatMap({
  seats,
  pricePerSeat,
  onChange,
  onProceed,
}: {
  seats: Seat[];
  pricePerSeat: number;
  onChange: (seatIds: string[]) => void;
  onProceed: (seatIds: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const total = selected.length * pricePerSeat;
  const selectedSeats = seats.filter((seat) => selected.includes(seat.id));

  function toggle(seat: Seat) {
    if (seat.isBooked) return;
    const next = selected.includes(seat.id)
      ? selected.filter((id) => id !== seat.id)
      : [...selected, seat.id];
    setSelected(next);
    onChange(next);
  }

  const rows = seatRows(seats);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4 text-xs font-semibold text-zinc-600">
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 rounded border border-zinc-300 bg-white" /> Available
        </span>
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 rounded bg-brand" /> Selected
        </span>
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 rounded bg-zinc-300" /> Booked
        </span>
        <span>{seats.length} seats</span>
      </div>
      <div className="mx-auto w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-4 shadow-inner">
        <div className="mb-4 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-zinc-400">
          <span>Front</span>
          <span className="rounded-full border border-zinc-200 px-3 py-1">Driver</span>
        </div>
        <div className="flex max-h-[32rem] flex-col gap-2 overflow-y-auto pr-1">
          {rows.map((row) =>
            row.bench ? (
              <div key={row.row} className="grid grid-cols-5 gap-2">
                {row.seats.map((seat) => (
                  <SeatControl
                    key={seat.id}
                    seat={seat}
                    selected={selected.includes(seat.id)}
                    onToggle={toggle}
                  />
                ))}
              </div>
            ) : (
              <div key={row.row} className="grid grid-cols-[1fr_1fr_12px_1fr_1fr] gap-2">
                {row.left.map((seat) => (
                  <SeatControl
                    key={seat.id}
                    seat={seat}
                    selected={selected.includes(seat.id)}
                    onToggle={toggle}
                  />
                ))}
                <span />
                {row.right.map((seat) => (
                  <SeatControl
                    key={seat.id}
                    seat={seat}
                    selected={selected.includes(seat.id)}
                    onToggle={toggle}
                  />
                ))}
              </div>
            ),
          )}
        </div>
        <p className="mt-4 text-center text-xs font-bold uppercase tracking-wide text-zinc-400">Back</p>
      </div>
      {selected.length > 0 ? (
        <div className="animate-slide-up sticky bottom-3 flex items-center justify-between gap-4 rounded-2xl bg-zinc-900 px-4 py-3 text-white shadow-2xl">
          <div>
            <p className="text-xs uppercase tracking-wide text-white/70">
              {selectedSeats.map((seat) => seat.number).join(", ")}
            </p>
            <p className="text-lg font-extrabold">{total} NOK</p>
          </div>
          <button
            type="button"
            onClick={() => onProceed(selected)}
            className="rounded-lg bg-brand px-5 py-3 text-sm font-bold transition hover:bg-brand-dark"
          >
            Proceed
          </button>
        </div>
      ) : (
        <p className="text-sm text-zinc-500">Select a seat to see the total and proceed.</p>
      )}
    </div>
  );
}

function SeatControl({
  seat,
  selected,
  onToggle,
}: {
  seat: Seat;
  selected: boolean;
  onToggle: (seat: Seat) => void;
}) {
  return (
    <button
      type="button"
      disabled={seat.isBooked}
      aria-pressed={selected}
      onClick={() => onToggle(seat)}
      className={
        seat.isBooked
          ? "h-10 rounded-lg bg-zinc-300 text-xs font-semibold text-zinc-500 disabled:cursor-not-allowed"
          : selected
            ? "animate-pop h-10 rounded-lg bg-brand text-xs font-bold text-white shadow-md"
            : "h-10 rounded-lg border border-zinc-300 bg-white text-xs font-semibold text-zinc-800 transition hover:-translate-y-0.5 hover:border-brand"
      }
    >
      {seat.number}
    </button>
  );
}

function seatRows(seats: Seat[]) {
  const byRow = new Map<number, Seat[]>();
  for (const seat of seats) {
    const row = Number.parseInt(seat.number, 10);
    const key = Number.isFinite(row) ? row : 0;
    const list = byRow.get(key);
    if (list) list.push(seat);
    else byRow.set(key, [seat]);
  }

  return [...byRow.entries()]
    .sort((left, right) => left[0] - right[0])
    .map(([row, rowSeats]) => {
      const ordered = [...rowSeats].sort((left, right) => left.number.localeCompare(right.number));
      const bench = ordered.length === 5;
      return {
        row,
        seats: ordered,
        bench,
        left: ordered.filter((seat) => sideOf(seat) === "left"),
        right: ordered.filter((seat) => sideOf(seat) === "right"),
      };
    });
}

function sideOf(seat: Seat) {
  const letter = seat.number.replace(/^\d+/, "");
  return letter === "A" || letter === "B" ? "left" : "right";
}
