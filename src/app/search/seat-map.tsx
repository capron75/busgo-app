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
}: {
  seats: Seat[];
  pricePerSeat: number;
}) {
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(seat: Seat) {
    if (seat.isBooked) return;
    setSelected((current) =>
      current.includes(seat.id)
        ? current.filter((id) => id !== seat.id)
        : [...current, seat.id],
    );
  }

  const total = selected.length * pricePerSeat;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-4 gap-2">
        {seats.map((seat) => {
          const isSelected = selected.includes(seat.id);
          return (
            <button
              key={seat.id}
              type="button"
              disabled={seat.isBooked}
              aria-pressed={isSelected}
              onClick={() => toggle(seat)}
              className={
                seat.isBooked
                  ? "h-12 rounded-lg bg-zinc-300 text-zinc-500 line-through disabled:cursor-not-allowed dark:bg-zinc-700 dark:text-zinc-400"
                  : isSelected
                    ? "h-12 rounded-lg bg-black text-white dark:bg-zinc-50 dark:text-black"
                    : "h-12 rounded-lg border border-zinc-300 bg-white text-black dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              }
            >
              {seat.number}
            </button>
          );
        })}
      </div>
      <p className="text-sm text-zinc-700 dark:text-zinc-300">
        {selected.length} seat{selected.length === 1 ? "" : "s"} selected · {total} NOK
      </p>
    </div>
  );
}
