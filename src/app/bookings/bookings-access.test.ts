import assert from "node:assert/strict";
import test from "node:test";
import { bookingsForViewer } from "./bookings-access";

const rows = [
  { userId: "ada", seat: "4A" },
  { userId: "bea", seat: "8C" },
];

test("a missing viewer is signed out and sees no rows", () => {
  assert.deepEqual(bookingsForViewer(null, rows), { kind: "signed-out" });
  assert.deepEqual(bookingsForViewer("", rows), { kind: "signed-out" });
});

test("a signed-in viewer only keeps their own rows", () => {
  assert.deepEqual(bookingsForViewer("ada", rows), {
    kind: "rows",
    viewerId: "ada",
    bookings: [{ userId: "ada", seat: "4A" }],
  });
  assert.deepEqual(bookingsForViewer("ada", []), {
    kind: "rows",
    viewerId: "ada",
    bookings: [],
  });
});
