import { v4 as uuid } from "https://deno.land/std@v0.53.0/uuid/mod.ts";
import { connect } from "./io.ts";
import { PokerClient } from "./client.ts";

const socket = await connect({ hostname: "localhost", port: 4711 });
const client = new PokerClient(socket, {
  name: "lenkbot",
  room: "TRAINING",
});

await client.start(async (request, table) => {
  console.dir(table);
  return {
    actionType: "RAISE",
    amount: request.actions.find((x) => x.actionType === "RAISE")?.amount || 0,
  };
});
