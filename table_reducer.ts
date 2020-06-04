import {
  Card as ProtocolCard,
  Suit as ProtocolSuit,
  Rank as ProtocolRank,
  TableEvent,
  TablePlayer,
} from "./protocol.ts";

function assertUnreachable(x: never): asserts x is never {
  throw new Error(`Unreachable code reached`);
}

function mapSuit(suit: ProtocolSuit): Suit {
  switch (suit) {
    case "CLUBS":
      return "c";
    case "DIAMONDS":
      return "d";
    case "HEARTS":
      return "h";
    case "SPADES":
      return "s";
    default:
      throw new Error(`Invalid suit ${suit!}`);
  }
}

function mapRank(rank: ProtocolRank): number {
  switch (rank) {
    case "ACE":
      return 14;
    case "KING":
      return 13;
    case "QUEEN":
      return 12;
    case "JACK":
      return 11;
    case "TEN":
      return 10;
    case "NINE":
      return 9;
    case "EIGHT":
      return 8;
    case "SEVEN":
      return 7;
    case "SIX":
      return 6;
    case "FIVE":
      return 5;
    case "FOUR":
      return 4;
    case "THREE":
      return 3;
    case "DEUCE":
      return 2;
    default:
      throw new Error(`Invalid rank ${rank!}`);
  }
}

export type Suit  = "h" | "d" | "s" | "c"

export interface Card {
  rank: number;
  suit: "h" | "d" | "s" | "c"
}

export interface Player {
  name: string;
  isDealer: boolean;
  chipCount: number;
  folded: boolean;
  investment: number;
}

export interface TableState {
  id: number;
  round: number;
  players: Player[];
  communityCards: Card[];
  cards: Card[];
  smallBlind: number;
  bigBlind: number;
  pot: number;
}

function mapPlayerInvestment(p: TablePlayer, amount: number) {
  return (player: Player): Player => {
    return p.name === player.name
      ? {
        ...player,
        chipCount: p.chipCount,
        investment: player.investment + amount,
      }
      : player;
  };
}

function mapPlayerFold(p: TablePlayer, investment: number) {
  return (player: Player): Player => {
    return p.name === player.name
      ? {
        ...player,
        chipCount: p.chipCount,
        folded: true,
        investment,
      }
      : player;
  };
}

function mapCard(card: ProtocolCard): Card {
  return {
    rank: mapRank(card.rank),
    suit: mapSuit(card.suit)
  }
}

export const initialState: TableState = {
  id: 0,
  round: -1,
  players: [],
  communityCards: [],
  cards: [],
  bigBlind: 0,
  smallBlind: 0,
  pot: 0,
};

export function reduceState(
  state: TableState,
  event: TableEvent,
): TableState {
  switch (event.type) {
    case "CommunityHasBeenDealtACardEvent":
      return {
        ...state,
        communityCards: [...state.communityCards, mapCard(event.card)],
      };
    case "PlayIsStartedEvent":
      return {
        ...state,
        round: state.round + 1,
        id: event.tableId,
        players: event.players.map<Player>((p) => {
          return {
            isDealer: event.dealer.name === p.name,
            name: p.name,
            chipCount: p.chipCount,
            investment: 0,
            folded: false,
          };
        }),
        pot: 0,
        communityCards: [],
        cards: [],
      };
    case "ServerIsShuttingDownEvent":
      return {
        ...state,
      };
    case "TableChangedStateEvent":
      return {
        ...state,
      };
    case "YouHaveBeenDealtACardEvent":
      return {
        ...state,
        cards: [...state.cards, mapCard(event.card)],
      };
    case "YouWonAmountEvent":
      return state;
    case "ShowDownEvent":
      return {
        ...state,
        players: state.players.map<Player>((player) => {
          const showdown = event.playersShowDown.find((p) =>
            p.player.name === player.name
          );

          return {
            ...player,
            chipCount: showdown?.player.chipCount || player.chipCount,
            investment: 0,
          };
        }),
        pot: 0,
      };
    case "TableIsDoneEvent":
      return {
        ...state,
        pot: 0,
        communityCards: [],
        cards: [],
        bigBlind: 0,
        smallBlind: 0,
      };
    case "PlayerBetBigBlindEvent":
      return {
        ...state,
        pot: state.pot + event.bigBlind,
        players: state.players.map(
          mapPlayerInvestment(event.player, event.bigBlind),
        ),
      };
    case "PlayerBetSmallBlindEvent":
      return {
        ...state,
        pot: state.pot + event.smallBlind,
        players: state.players.map(
          mapPlayerInvestment(event.player, event.smallBlind),
        ),
      };
    case "PlayerRaisedEvent":
      return {
        ...state,
        pot: state.pot + event.raiseBet,
        players: state.players.map(
          mapPlayerInvestment(event.player, event.raiseBet),
        ),
      };
    case "PlayerCalledEvent":
      return {
        ...state,
        pot: state.pot + event.callBet,
        players: state.players.map(
          mapPlayerInvestment(event.player, event.callBet),
        ),
      };
    case "PlayerWentAllInEvent":
      return {
        ...state,
        pot: state.pot + event.allInAmount,
        players: state.players.map(
          mapPlayerInvestment(event.player, event.allInAmount),
        ),
      };
    case "PlayerFoldedEvent":
    case "PlayerForcedFoldedEvent":
      return {
        ...state,
        players: state.players.map(
          mapPlayerFold(event.player, event.investmentInPot),
        ),
      };
    case "PlayerCheckedEvent":
      return state;
    case "PlayerQuitEvent":
      return state;
    case "ServerIsShuttingDownEvent":
      return state;
    default:
      assertUnreachable(event);
      return state;
  }
}
