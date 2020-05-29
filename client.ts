import { v4 as uuid } from "https://deno.land/std@v0.53.0/uuid/mod.ts";
import { PokerSocket } from "./io.ts";
import {
  ActionRequestMessage,
  ActionResponseMessage,
  Action,
  TablePlayer,
  PlayIsStartedEvent,
  Card,
  TableState,
  IncomingMessage,
  RegisterResponseMessage,
} from "./protocol.ts";

function assertUnreachable(x: never) {
  throw new Error(`Unreachable code reached`);
}

export interface PokerClientOptions {
  name: string;
  room: string;
}

export interface ActionRequest {
  actions: Action[];
}

export interface RequestHandler {
  (
    m: ActionRequest,
    table: Table,
  ): Promise<Action>;
}

export interface Table {
  players: TablePlayer[];
  me: TablePlayer;
  dealer: TablePlayer;
  bigBlindPlayer: TablePlayer;
  smallBlindPlayer: TablePlayer;
  communityCards: Card[];
  myCards: Card[];
  tableState: "DEALING" | TableState;
}

function reduce(
  s: Table | null,
  message: Exclude<
    IncomingMessage,
    ActionRequestMessage | RegisterResponseMessage
  >,
): Table | null {
  switch (message.type) {
    case "CommunityHasBeenDealtACardEvent":
      return s && {
        ...s,
        communityCards: [...s.communityCards, message.card],
      };
    case "PlayIsStartedEvent":
      return {
        players: message.players,
        me: message.players.find((p) => p.name === "lenkbot") as TablePlayer,
        dealer: message.players.find((p) =>
          p.name === message.dealer.name
        ) as TablePlayer,
        bigBlindPlayer: message.players.find((p) =>
          p.name === message.bigBlindPlayer.name
        ) as TablePlayer,
        smallBlindPlayer: message.players.find((p) =>
          p.name === message.smallBlindPlayer.name
        ) as TablePlayer,
        communityCards: [],
        myCards: [],
        tableState: "DEALING",
      };
    case "PlayerBetBigBlindEvent":
      return s && {
        ...s,
      };
    case "PlayerBetSmallBlindEvent":
      return s && {
        ...s,
      };
    case "ServerIsShuttingDownEvent":
      return s && {
        ...s,
      };
    case "TableChangedStateEvent":
      return s && {
        ...s,
        tableState: message.state,
      };
    case "YouHaveBeenDealtACardEvent":
      return s && {
        ...s,
        myCards: [...s.myCards, message.card],
      };
    case "YouWonAmountEvent":
      return s && {
        ...s,
      };
    case "ShowDownEvent":
      return s && {
        ...s,
      };
    case "TableIsDoneEvent":
      return s && {
        players: [],
        communityCards: [],
        me: {} as TablePlayer,
        bigBlindPlayer: {} as TablePlayer,
        smallBlindPlayer: {} as TablePlayer,
        dealer: {} as TablePlayer,
        myCards: [],
        tableState: "DEALING",
      };
    case "PlayerCheckedEvent":
    case "PlayerRaisedEvent":
    case "PlayerWentAllInEvent":
    case "PlayerCalledEvent":
    case "PlayerFoldedEvent":
    case "PlayerForcedFoldedEvent":
    case "PlayerQuitEvent":
    case "ServerIsShuttingDownEvent":
      return s;
    default:
      assertUnreachable(message);
      return s;
  }
}

export class PokerClient {
  #socket: PokerSocket;
  #name: string;
  #room: string;
  #table: Table | null = null;

  constructor(socket: PokerSocket, options: PokerClientOptions) {
    this.#socket = socket;
    this.#name = options.name;
    this.#room = options.room;
  }

  #listen = async (handler: RequestHandler) => {
    while (true) {
      const message = await this.#socket.read();
      if (!message) {
        return;
      }

      switch (message.type) {
        case "ActionRequest":
          this.#handleActionRequest(handler, message);
          break;
        case "RegisterForPlayResponse":
          break;
        case "CommunityHasBeenDealtACardEvent":
        case "PlayIsStartedEvent":
        case "PlayerBetBigBlindEvent":
        case "PlayerBetSmallBlindEvent":
        case "ServerIsShuttingDownEvent":
        case "TableChangedStateEvent":
        case "YouHaveBeenDealtACardEvent":
        case "YouWonAmountEvent":
        case "ShowDownEvent":
        case "TableIsDoneEvent":
        case "PlayerForcedFoldedEvent":
        case "PlayerCheckedEvent":
        case "PlayerRaisedEvent":
        case "PlayerWentAllInEvent":
        case "PlayerCalledEvent":
        case "PlayerFoldedEvent":
        case "PlayerQuitEvent":
        case "ServerIsShuttingDownEvent":
          this.#table = reduce(this.#table, message);
          break;
        default:
          assertUnreachable(message);
          break;
      }
    }
  };

  #updateTable = (table: Partial<Table>) => {
    this.#table = {
      ...this.#table,
      ...table,
    } as Table;
  };

  #handleActionRequest = async (
    handler: RequestHandler,
    message: ActionRequestMessage,
  ) => {
    if (!this.#table) {
      throw new Error(`Cannot handle action without table`);
    }
    const response = await handler({
      actions: message.possibleActions,
    }, this.#table);

    await this.#socket.write({
      type: "ActionResponse",
      requestId: message.requestId,
      action: response,
    });
  };

  async start(handler: RequestHandler) {
    const requestId = uuid.generate();

    await this.#socket.write({
      type: "RegisterForPlayRequest",
      name: this.#name,
      room: this.#room,
      requestId,
      sessionId: "",
    });

    const response = await this.#socket.read();
    if (response?.type !== "RegisterForPlayResponse") {
      throw new Error(`Expected response-ok got ${response?.type}`);
    }

    this.#listen(handler).catch((e) => {
      console.error(e);
    });
  }

  close() {
    return this.#socket.close();
  }
}
