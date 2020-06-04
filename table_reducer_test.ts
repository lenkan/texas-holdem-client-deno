import { assertEquals } from "./testing.ts";
import { reduceState as reduce, initialState } from "./table_reducer.ts";
import { TablePlayer } from "./protocol.ts";

function init(players: TablePlayer[]) {
  const [p1, p2] = players;

  const result = reduce(initialState, {
    type: "PlayIsStartedEvent",
    bigBlindAmount: 10,
    smallBlindAmount: 5,
    dealer: p1,
    bigBlindPlayer: p1,
    smallBlindPlayer: p2,
    players: [p1, p2],
    tableId: 123,
  });

  return result;
}

Deno.test("handle start event", () => {
  const p1 = { name: "p1", chipCount: 10 };
  const p2 = { name: "p2", chipCount: 10 };
  const p3 = { name: "p3", chipCount: 10 };
  const p4 = { name: "p4", chipCount: 10 };

  const result = reduce(initialState, {
    type: "PlayIsStartedEvent",
    bigBlindAmount: 10,
    smallBlindAmount: 5,
    dealer: p1,
    bigBlindPlayer: p2,
    smallBlindPlayer: p3,
    players: [p1, p2, p3, p4],
    tableId: 123,
  });

  assertEquals(result.players[0], {
    name: "p1",
    chipCount: 10,
    isDealer: true,
    investment: 0,
    folded: false,
  });

  assertEquals(result.players[1], {
    name: "p2",
    chipCount: 10,
    isDealer: false,
    investment: 0,
    folded: false,
  });

  assertEquals(result.players[2], {
    name: "p3",
    chipCount: 10,
    isDealer: false,
    investment: 0,
    folded: false,
  });

  assertEquals(result.players[3], {
    name: "p4",
    chipCount: 10,
    isDealer: false,
    investment: 0,
    folded: false,
  });
});

Deno.test("handle deal card event", () => {
  const p1 = { name: "p1", chipCount: 10 };
  const p2 = { name: "p2", chipCount: 10 };

  const result = reduce(init([p1, p2]), {
    type: "YouHaveBeenDealtACardEvent",
    card: {
      rank: "ACE",
      suit: "CLUBS",
    },
  });

  assertEquals(result.cards.length, 1);
  assertEquals(result.cards[0], { rank:  14, suit: "c" });
});

Deno.test("handle community card event", () => {
  const p1 = { name: "p1", chipCount: 10 };
  const p2 = { name: "p2", chipCount: 10 };

  const result = reduce(init([p1, p2]), {
    type: "CommunityHasBeenDealtACardEvent",
    card: { rank: "ACE", suit: "CLUBS" },
  });

  assertEquals(result.communityCards.length, 1);
  assertEquals(result.communityCards[0], { rank: 14, suit: "c" });
});

Deno.test("handle player bet big blind event", () => {
  const p1 = { name: "p1", chipCount: 1000 };
  const p2 = { name: "p2", chipCount: 1000 };

  const result = reduce(init([p1, p2]), {
    type: "PlayerBetBigBlindEvent",
    player: { name: p1.name, chipCount: 900 },
    bigBlind: 100,
  });

  assertEquals(result.players[0].name, p1.name);
  assertEquals(result.players[0].chipCount, 900);
  assertEquals(result.players[1].name, p2.name);
  assertEquals(result.players[1].chipCount, 1000);
  assertEquals(result.pot, 100);
});

Deno.test("handle player bet small blind event", () => {
  const p1 = { name: "p1", chipCount: 1000 };
  const p2 = { name: "p2", chipCount: 1000 };

  const result = reduce(init([p1, p2]), {
    type: "PlayerBetSmallBlindEvent",
    player: { name: p2.name, chipCount: 900 },
    smallBlind: 100,
  });

  assertEquals(result.players[0].name, p1.name);
  assertEquals(result.players[0].chipCount, 1000);
  assertEquals(result.players[1].name, p2.name);
  assertEquals(result.players[1].chipCount, 900);
  assertEquals(result.pot, 100);
});

Deno.test("handle player raise", () => {
  const p1 = { name: "p1", chipCount: 1000 };
  const p2 = { name: "p2", chipCount: 1000 };

  const result = reduce(init([p1, p2]), {
    type: "PlayerRaisedEvent",
    player: { name: p2.name, chipCount: 900 },
    raiseBet: 100,
  });

  assertEquals(result.players[0].name, p1.name);
  assertEquals(result.players[0].chipCount, 1000);
  assertEquals(result.players[1].name, p2.name);
  assertEquals(result.players[1].chipCount, 900);
  assertEquals(result.players[1].investment, 100);
  assertEquals(result.pot, 100);
});

Deno.test("handle player raise", () => {
  const p1 = { name: "p1", chipCount: 1000 };
  const p2 = { name: "p2", chipCount: 1000 };

  const result = reduce(init([p1, p2]), {
    type: "PlayerRaisedEvent",
    player: { name: p2.name, chipCount: 900 },
    raiseBet: 100,
  });

  assertEquals(result.players[0].name, p1.name);
  assertEquals(result.players[0].chipCount, 1000);
  assertEquals(result.players[1].name, p2.name);
  assertEquals(result.players[1].chipCount, 900);
  assertEquals(result.players[1].investment, 100);
  assertEquals(result.pot, 100);
});

Deno.test("handle player call", () => {
  const p1 = { name: "p1", chipCount: 1000 };
  const p2 = { name: "p2", chipCount: 1000 };

  const result = reduce(init([p1, p2]), {
    type: "PlayerCalledEvent",
    player: { name: p2.name, chipCount: 900 },
    callBet: 100,
  });

  assertEquals(result.players[0].name, p1.name);
  assertEquals(result.players[0].chipCount, 1000);
  assertEquals(result.players[1].name, p2.name);
  assertEquals(result.players[1].chipCount, 900);
  assertEquals(result.players[1].investment, 100);
  assertEquals(result.pot, 100);
});

Deno.test("handle player all in", () => {
  const p1 = { name: "p1", chipCount: 1000 };
  const p2 = { name: "p2", chipCount: 1000 };

  const result = reduce(init([p1, p2]), {
    type: "PlayerWentAllInEvent",
    player: { name: p2.name, chipCount: 0 },
    allInAmount: 1000,
  });

  assertEquals(result.players[0].name, p1.name);
  assertEquals(result.players[0].chipCount, 1000);
  assertEquals(result.players[1].name, p2.name);
  assertEquals(result.players[1].chipCount, 0);
  assertEquals(result.players[1].investment, 1000);
  assertEquals(result.pot, 1000);
});

Deno.test("handle player fold", () => {
  const p1 = { name: "p1", chipCount: 1000 };
  const p2 = { name: "p2", chipCount: 1000 };

  const result = reduce(init([p1, p2]), {
    type: "PlayerFoldedEvent",
    player: { name: p2.name, chipCount: 1000 },
    investmentInPot: 400,
  });

  assertEquals(result.players[0].name, p1.name);
  assertEquals(result.players[0].chipCount, 1000);
  assertEquals(result.players[0].folded, false);
  assertEquals(result.players[0].investment, 0);
  assertEquals(result.players[1].name, p2.name);
  assertEquals(result.players[1].chipCount, 1000);
  assertEquals(result.players[1].investment, 400);
  assertEquals(result.players[1].folded, true);
});

Deno.test("handle player force fold", () => {
  const p1 = { name: "p1", chipCount: 1000 };
  const p2 = { name: "p2", chipCount: 1000 };

  const result = reduce(init([p1, p2]), {
    type: "PlayerForcedFoldedEvent",
    player: { name: p2.name, chipCount: 1000 },
    investmentInPot: 400,
  });

  assertEquals(result.players[0].name, p1.name);
  assertEquals(result.players[0].chipCount, 1000);
  assertEquals(result.players[0].folded, false);
  assertEquals(result.players[0].investment, 0);
  assertEquals(result.players[1].name, p2.name);
  assertEquals(result.players[1].chipCount, 1000);
  assertEquals(result.players[1].investment, 400);
  assertEquals(result.players[1].folded, true);
});

Deno.test("handle player checked", () => {
  const p1 = { name: "p1", chipCount: 1000 };
  const p2 = { name: "p2", chipCount: 1000 };

  const result = reduce(init([p1, p2]), {
    type: "PlayerCheckedEvent",
    player: p1,
  });

  assertEquals(result.players[0].name, p1.name);
  assertEquals(result.players[0].chipCount, 1000);
  assertEquals(result.players[0].folded, false);
  assertEquals(result.players[0].investment, 0);
  assertEquals(result.players[1].name, p2.name);
  assertEquals(result.players[1].chipCount, 1000);
  assertEquals(result.players[1].investment, 0);
  assertEquals(result.players[1].folded, false);
});

Deno.test("handle showdown event", () => {
  const p1 = { name: "p1", chipCount: 1000 };
  const p2 = { name: "p2", chipCount: 1000 };

  const result = reduce(init([p1, p2]), {
    type: "ShowDownEvent",
    playersShowDown: [
      {
        hand: { cards: [], folded: false, pokerHand: "" },
        player: { chipCount: 0, name: p1.name },
        wonAmount: 100,
      },
    ],
  });

  assertEquals(result.players[0].name, p1.name);
  assertEquals(result.players[0].chipCount, 1000);
  assertEquals(result.players[0].folded, false);
  assertEquals(result.players[0].investment, 0);
  assertEquals(result.players[1].name, p2.name);
  assertEquals(result.players[1].chipCount, 1000);
  assertEquals(result.players[1].investment, 0);
  assertEquals(result.players[1].folded, false);
});
