import { v4 as uuid } from "https://deno.land/std@v0.53.0/uuid/mod.ts";
import { PokerSocket } from "./socket.ts";
import { Table, initialize, reduce } from "./table.ts";
import { ActionRequestMessage, Action } from "./protocol.ts";

export type PokerRoom = "TRAINING" | "FREEPLAY" | "TOURNAMENT";

export interface PokerClientOptions {
  name: string;
  room: PokerRoom;
}

export interface ActionRequest {
  actions: Action[];
  callAction?: Action;
  raiseAction?: Action;
  foldAction: Action;
  checkAction?: Action;
  allInAction?: Action;
}

export interface RequestHandler {
  (
    m: ActionRequest,
    table: Table,
  ): Promise<Action>;
}

export async function register(
  socket: PokerSocket,
  options: PokerClientOptions,
) {
  const requestId = uuid.generate();
  if (!options.name) {
    throw new Error(`Invalid name '${options.name}'`);
  }

  await socket.write({
    type: "RegisterForPlayRequest",
    name: options.name,
    room: options.room,
    requestId,
    sessionId: "",
  });

  const response = await socket.read();
  if (!response) {
    throw new Error(`Socket unexpectedly closed`);
  }

  if (response.type === "error") {
    throw new Error(response.message);
  }

  if (response.type !== "RegisterForPlayResponse") {
    throw new Error(
      `Expected 'RegisterForPlayResponse', got ${response.type}`,
    );
  }
}

function mapActionRequest(a: Action[]): ActionRequest {
  return {
    actions: a,
    allInAction: a.find((x) => x.actionType === "ALL_IN"),
    callAction: a.find((x) => x.actionType === "CALL"),
    checkAction: a.find((x) => x.actionType === "CHECK"),
    foldAction: a.find((x) => x.actionType === "FOLD")!,
    raiseAction: a.find((x) => x.actionType === "RAISE"),
  };
}

export async function handleActions(
  socket: PokerSocket,
  handler: RequestHandler,
  options: { name: string },
) {
  let table = initialize(options.name);

  async function handleActionRequest(message: ActionRequestMessage) {
    const response = await handler(
      mapActionRequest(message.possibleActions),
      table,
    );

    await socket.write({
      type: "ActionResponse",
      requestId: message.requestId,
      action: response || { actionType: "FOLD", amount: 0 },
    });
  }

  while (true) {
    const message = await socket.read();
    if (!message) {
      return table;
    }

    switch (message.type) {
      case "error":
        // TODO: Probably break out of loop and exit here
        break;
      case "ActionRequest":
        handleActionRequest(message);
        break;
      case "ServerIsShuttingDownEvent":
      case "RegisterForPlayResponse":
        break;
      default:
        table = reduce(table, message);
        break;
    }
  }

  return table;
}
