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
      </div>
      <div className="mx-auto w-full max-w-sm rounded-3xl border border-zinc-200 bg-white p-4 shadow-inner">
        <div className="mb-4 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-zinc-400">
          <span>Front</span>
          <span className="rounded-full border border-zinc-200 px-3 py-1">Driver</span>
        </div>
        <div className="grid grid-cols-[1fr_1fr_16px_1fr_1fr] gap-2">
          {seats.map((seat, index) => {
            const isSelected = selected.includes(seat.id);
            const aisle = index % 4 === 2 ? <span key={`${seat.id}-aisle`} /> : null;
            return (
              <span key={seat.id} className="contents">
                {aisle}
                <button
                  type="button"
                  disabled={seat.isBooked}
                  aria-pressed={isSelected}
                  onClick={() => toggle(seat)}
                  className={
                    seat.isBooked
                      ? "h-12 rounded-lg bg-zinc-300 text-sm font-semibold text-zinc-500 disabled:cursor-not-allowed"
                      : isSelected
                        ? "animate-pop h-12 rounded-lg bg-brand text-sm font-bold text-white shadow-md"
                        : "h-12 rounded-lg border border-zinc-300 bg-white text-sm font-semibold text-zinc-800 transition hover:-translate-y-0.5 hover:border-brand"
                  }
                >
                  {seat.number}
                </button>
              </span>
            );
          })}
        </div>
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
