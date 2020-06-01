import { assertEquals } from "./testing.ts";
import { solve } from "./pokersolver.ts";

Deno.test("solve - two pair in 7 cards", () => {
  const hand = solve(["Ad", "As", "Jc", "Th", "2d", "Qs", "Qd"]);
  assertEquals(hand.name, "Two Pair");
  assertEquals(hand.rank, 3);
  assertEquals(hand.description, "Two Pair, A's & Q's");
});

Deno.test("solve - pair in 2 cards", () => {
  const hand = solve(["Ad", "As"]);
  assertEquals(hand.name, "Pair");
  assertEquals(hand.rank, 2);
  assertEquals(hand.description, "Pair, A's");
});

Deno.test("solve - empty list", () => {
  const hand = solve([]);
  assertEquals(hand.name, "Nothing");
  assertEquals(hand.rank, 0);
  assertEquals(hand.description, "Nothing");
});
