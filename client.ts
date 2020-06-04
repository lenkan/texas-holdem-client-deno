import { v4 as uuid } from "https://deno.land/std@v0.53.0/uuid/mod.ts";
import { PokerSocket, createSocket } from "./socket.ts";
import {
  TableState,
  reduceState,
  initialState,
  Player,
} from "./table_reducer.ts";
import {
  ActionRequestMessage,
  Action,
  Card,
} from "./protocol.ts";
import { solve, Hand } from "./pokersolver.ts";

export type PokerRoom = "TRAINING" | "FREEPLAY" | "TOURNAMENT";
export { Card, Hand, Action };

export interface Table {
  id: number;
  round: number;
  players: Player[];
  communityCards: Card[];
  smallBlind: number;
  bigBlind: number;
  pot: number;
  dealer: string;
  myCards: Card[];
  myHand: Hand;
  myChips: number;
  myName: string;
  myInvestment: number;
}

export interface PokerClientOptions {
  name: string;
  room?: PokerRoom;
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
  ): Promise<Action> | Action;
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

export class PokerClient {
  #socket: PokerSocket;
  #name: string;
  #room: PokerRoom;
  #tableState: TableState = initialState;

  constructor(
    conn: Deno.Conn,
    options: PokerClientOptions,
  ) {
    this.#socket = createSocket(conn);
    this.#name = options.name;
    this.#room = options.room || "TRAINING";
  }

  #handleActionsRequest = async (
    handler: RequestHandler,
    message: ActionRequestMessage,
  ) => {
    const table = this.table();

    const response = await handler(
      mapActionRequest(message.possibleActions),
      table,
    );

    await this.#socket.write({
      type: "ActionResponse",
      requestId: message.requestId,
      action: response,
    });
  };

  table(): Table {
    const me = this.#tableState.players.find((p) => p.name === this.#name);
    const dealer = this.#tableState.players.find((p) => p.isDealer);
    return {
      bigBlind: this.#tableState.bigBlind,
      communityCards: this.#tableState.communityCards,
      dealer: dealer?.name || "",
      id: this.#tableState.id,
      myCards: this.#tableState.cards,
      myChips: me?.chipCount || 0,
      myInvestment: me?.investment || 0,
      myHand: solve(
        [...this.#tableState.cards, ...this.#tableState.communityCards],
      ),
      myName: this.#name,
      players: this.#tableState.players,
      pot: this.#tableState.pot,
      round: this.#tableState.round,
      smallBlind: this.#tableState.smallBlind,
    };
  }

  async register() {
    const requestId = uuid.generate();
    if (!this.#name) {
      throw new Error(`Invalid name '${this.#name}'`);
    }

    await this.#socket.write({
      type: "RegisterForPlayRequest",
      name: this.#name,
      room: this.#room,
      requestId,
      sessionId: "",
    });

    const response = await this.#socket.read();
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

  async start(handler: RequestHandler): Promise<Table> {
    while (true) {
      const message = await this.#socket.read();
      if (!message) {
        return this.table();
      }

      switch (message.type) {
        case "error":
          // TODO: Probably break out of loop and exit here
          break;
        case "ActionRequest":
          this.#handleActionsRequest(handler, message);
          break;
        case "ServerIsShuttingDownEvent":
        case "RegisterForPlayResponse":
          break;
        default:
          this.#tableState = reduceState(this.#tableState, message);
          break;
      }
    }
  }
}
