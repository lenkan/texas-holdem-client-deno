import { assertEquals } from "./testing.ts";
import { solve } from "./pokersolver.ts";
import { Card } from "./table_reducer.ts";

Deno.test("solve - two pair in 7 cards", () => {
  const cards: Card[] = [
    { rank: 14, suit: "d" },
    { rank: 14, suit: "s" },
    { rank: 11, suit: "c" },
    { rank: 10, suit: "h" },
    { rank: 2, suit: "d" },
    { rank: 12, suit: "s" },
    { rank: 12, suit: "d" },
  ];
  const hand = solve(cards);

  assertEquals(hand.name, "Two Pair");
  assertEquals(hand.rank, 3);
  assertEquals(hand.description, "Two Pair, A's & Q's");
});

Deno.test("solve - pair in 2 cards", () => {
  const cards: Card[] = [
    { rank: 14, suit: "d" },
    { rank: 14, suit: "s" },
  ];
  const hand = solve(cards);
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
