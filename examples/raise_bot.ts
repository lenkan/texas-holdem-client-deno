import { start } from "../mod.ts";

const result = await start(
  { name: Deno.args[0], room: "TOURNAMENT" },
  async (actions, table) => {
    const { raiseAction, checkAction } = actions;

    console.log(table.myCards); // [{ rank: "ACE", suit: "CLUBS" }]
    console.log(table.myHand); // [{ name: "High Card", rank: 1 }]
    console.log(table.pot); // 1000

    return checkAction || actions.callAction || checkAction;
  },
);

console.log("Finished", JSON.stringify(result, null, 2));
