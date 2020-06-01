import { start } from "https://raw.githubusercontent.com/lenkan/texas-holdem-client-deno/v0.1.0/mod.ts";

const playerName = Deno.args[0];

const result = await start(
  { name: playerName, room: "TRAINING" },
  async (actions, table) => {
    const { raiseAction, callAction, checkAction } = actions;

    console.log(table.myCards); // [{ rank: "ACE", suit: "CLUBS" }]
    console.log(table.myHand); // [{ name: "High Card", rank: 1 }]
    console.log(table.pot); // 1000

    return checkAction || callAction;
  },
);

// Result is the state of the table after the final showdown.
console.log("Finished", JSON.stringify(result, null, 2));
