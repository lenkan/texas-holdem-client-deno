import { assertEquals } from "./testing.ts";
import { solve } from "./pokersolver.ts";
import { Card } from "./protocol.ts";

Deno.test("solve - two pair in 7 cards", () => {
  const cards: Card[] = [
    { rank: "ACE" as const, suit: "DIAMONDS" as const },
    { rank: "ACE", suit: "SPADES" },
    { rank: "JACK", suit: "CLUBS" },
    { rank: "TEN", suit: "HEARTS" },
    { rank: "DEUCE", suit: "DIAMONDS" },
    { rank: "QUEEN", suit: "SPADES" },
    { rank: "QUEEN", suit: "DIAMONDS" },
  ];
  const hand = solve(cards);

  assertEquals(hand.name, "Two Pair");
  assertEquals(hand.rank, 3);
  assertEquals(hand.description, "Two Pair, A's & Q's");
});

Deno.test("solve - pair in 2 cards", () => {
  const cards: Card[] = [
    { rank: "ACE" as const, suit: "DIAMONDS" as const },
    { rank: "ACE", suit: "SPADES" },
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
