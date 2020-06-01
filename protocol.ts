function assert(cond: boolean): asserts cond {
  if (!cond) {
    throw new TypeError("Assertion failed");
  }
}

const NAMESPACE = "se.cygni.texasholdem.communication.message.";

export interface Action {
  actionType: "FOLD" | "CALL" | "ALL_IN" | "RAISE" | "CHECK";
  amount: number;
}

export type Rank =
  | "ACE"
  | "KING"
  | "QUEEN"
  | "JACK"
  | "TEN"
  | "NINE"
  | "EIGHT"
  | "SEVEN"
  | "SIX"
  | "FIVE"
  | "FOUR"
  | "THREE"
  | "DEUCE";

export type Suit = "HEARTS" | "DIAMONDS" | "SPADES" | "CLUBS";
export type TableState = "PRE_FLOP" | "FLOP" | "TURN" | "RIVER" | "SHOWDOWN";

export interface Card {
  rank: Rank;
  suit: Suit;
}

export interface RegisterRequestMessage {
  type: "RegisterForPlayRequest";
  sessionId: string;
  requestId: string;
  name: string;
  room: string;
}

export interface RegisterResponseMessage {
  type: "RegisterForPlayResponse";
}

export interface ActionRequestMessage {
  type: "ActionRequest";
  sessionId: string | null;
  requestId: string;
  possibleActions: Action[];
}

export interface ActionResponseMessage {
  type: "ActionResponse";
  requestId: string;
  action: Action;
}

export interface TablePlayer {
  name: string;
  chipCount: number;
}

export interface PlayerShowDown {
  player: TablePlayer;
  wonAmount: number;
  hand: PlayerHand;
}

export interface PlayerHand {
  cards: Card[];
  pokerHand: string;
  folded: boolean;
}

export interface PlayIsStartedEvent {
  type: "PlayIsStartedEvent";
  players: TablePlayer[];
  smallBlindAmount: number;
  bigBlindAmount: number;
  dealer: TablePlayer;
  smallBlindPlayer: TablePlayer;
  bigBlindPlayer: TablePlayer;
  tableId: number;
}

export interface CommunityHasBeenDealtACardEvent {
  type: "CommunityHasBeenDealtACardEvent";
  card: Card;
}

export interface PlayerBetBigBlindEvent {
  type: "PlayerBetBigBlindEvent";
  bigBlind: number;
  player: TablePlayer;
}
export interface PlayerBetSmallBlindEvent {
  type: "PlayerBetSmallBlindEvent";
  smallBlind: number;
  player: TablePlayer;
}
export interface PlayerCalledEvent {
  type: "PlayerCalledEvent";
  player: TablePlayer;
  callBet: number;
}

export interface PlayerFoldedEvent {
  type: "PlayerFoldedEvent";
  investmentInPot: number;
  player: TablePlayer;
}

export interface PlayerRaisedEvent {
  type: "PlayerRaisedEvent";
  raiseBet: number;
  player: TablePlayer;
}
export interface PlayerWentAllInEvent {
  type: "PlayerWentAllInEvent";
  allInAmount: number;
  player: TablePlayer;
}

export interface PlayerCheckedEvent {
  type: "PlayerCheckedEvent";
  player: TablePlayer;
}
export interface PlayerForcedFoldedEvent {
  type: "PlayerForcedFoldedEvent";
  player: TablePlayer;
  investmentInPot: number;
}

export interface PlayerQuitEvent {
  type: "PlayerQuitEvent";
  player: TablePlayer;
}
export interface ServerIsShuttingDownEvent {
  type: "ServerIsShuttingDownEvent";
}
export interface ShowDownEvent {
  type: "ShowDownEvent";
  playersShowDown: PlayerShowDown[];
}

export interface TableChangedStateEvent {
  type: "TableChangedStateEvent";
  state: TableState;
}
export interface TableIsDoneEvent {
  type: "TableIsDoneEvent";
  players: TablePlayer[];
}
export interface YouHaveBeenDealtACardEvent {
  type: "YouHaveBeenDealtACardEvent";
  card: Card;
}
export interface YouWonAmountEvent {
  type: "YouWonAmountEvent";
  wonAmount: number;
  yourChipAmount: number;
}

export interface ErrorMessage {
  type: "error";
  code: string;
  message: string;
}

export type TableEvent =
  | PlayIsStartedEvent
  | CommunityHasBeenDealtACardEvent
  | PlayerBetBigBlindEvent
  | PlayerBetSmallBlindEvent
  | PlayerCalledEvent
  | PlayerCheckedEvent
  | PlayerFoldedEvent
  | PlayerForcedFoldedEvent
  | PlayerQuitEvent
  | PlayerRaisedEvent
  | PlayerWentAllInEvent
  | ServerIsShuttingDownEvent
  | ShowDownEvent
  | TableChangedStateEvent
  | TableIsDoneEvent
  | YouHaveBeenDealtACardEvent
  | YouWonAmountEvent;

export type IncomingMessage =
  | RegisterResponseMessage
  | ActionRequestMessage
  | ErrorMessage
  | TableEvent;

export type OutgoingMessage =
  | RegisterRequestMessage
  | ActionResponseMessage;

export function parseMessage(message: string): IncomingMessage {
  const value = JSON.parse(message);
  const { type, version, ...rest } = value;

  assert(typeof type === "string");

  const parts = type.split(".");
  const className = parts.pop();
  const classifier = parts.pop();

  if (classifier === "exception") {
    return {
      type: "error",
      message: rest.message,
      code: className!,
    };
  }

  return {
    ...rest,
    type: className,
  };
}

export function compileMessage(message: OutgoingMessage): string {
  const { type, ...rest } = message;
  switch (message.type) {
    case "ActionResponse":
      return JSON.stringify({
        type: NAMESPACE + "response.ActionResponse",
        ...rest,
      });
    case "RegisterForPlayRequest":
      return JSON.stringify({
        type: NAMESPACE + "request.RegisterForPlayRequest",
        ...rest,
      });
    default:
      throw new Error(`Unknown message ${message!.type}`);
  }
}
