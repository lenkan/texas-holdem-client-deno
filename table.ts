import {
  Card,
  TableEvent,
  Suit,
  Rank,
  TablePlayer,
} from "./protocol.ts";
import { solve, Hand } from "./pokersolver.ts";

function assertUnreachable(x: never): asserts x is never {
  throw new Error(`Unreachable code reached`);
}

export interface Player {
  name: string;
  isDealer: boolean;
  chipCount: number;
  folded: boolean;

  /**
   * The current investment in the pot.
   */
  investment: number;
}

interface TableState {
  id: number;
  round: number;
  players: Player[];
  communityCards: Card[];

  /**
   * Name of the player that is currently the dealer.
   * 
   * @example
   * const amIDealer = table.dealer === table.myName;
   */
  dealer: string;

  smallBlind: number;
  bigBlind: number;
  pot: number;
  myCards: Card[];
  myName: string;
}

export interface Table extends TableState {
  myChips: number;
  myHand: Hand;
  myInvestment: number;
}

export function mapSuit(suit: Suit): string {
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

export function mapRank(rank: Rank): string {
  switch (rank) {
    case "ACE":
      return "A";
    case "KING":
      return "K";
    case "QUEEN":
      return "Q";
    case "JACK":
      return "J";
    case "TEN":
      return "T";
    case "NINE":
      return "9";
    case "EIGHT":
      return "8";
    case "SEVEN":
      return "7";
    case "SIX":
      return "6";
    case "FIVE":
      return "5";
    case "FOUR":
      return "4";
    case "THREE":
      return "3";
    case "DEUCE":
      return "2";
    default:
      throw new Error(`Invalid rank ${rank!}`);
  }
}

export function mapCard(card: Card) {
  return `${mapRank(card.rank)}${mapSuit(card.suit)}`;
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

function derivedState(s: TableState): Table {
  const me = s.players.find((p) => p.name === s.myName)!;
  return {
    ...s,
    myHand: solve([...s.myCards, ...s.communityCards].map(mapCard)),
    myChips: me?.chipCount || 0,
    myInvestment: me?.investment || 0,
  };
}

function reduceState(
  s: TableState,
  event: TableEvent,
): TableState {
  switch (event.type) {
    case "CommunityHasBeenDealtACardEvent":
      return {
        ...s,
        communityCards: [...s.communityCards, event.card],
      };
    case "PlayIsStartedEvent":
      return {
        ...s,
        round: s.round + 1,
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
        myCards: [],
        myName: s.myName,
        dealer: event.dealer.name,
      };
    case "ServerIsShuttingDownEvent":
      return {
        ...s,
      };
    case "TableChangedStateEvent":
      return {
        ...s,
      };
    case "YouHaveBeenDealtACardEvent":
      return {
        ...s,
        myCards: [...s.myCards, event.card],
      };
    case "YouWonAmountEvent":
      return {
        ...s,
      };
    case "ShowDownEvent":
      return {
        ...s,
        players: s.players.map<Player>((player) => {
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
        ...s,
        pot: 0,
        communityCards: [],
        myCards: [],
        bigBlind: 0,
        smallBlind: 0,
        dealer: "",
      };
    case "PlayerBetBigBlindEvent":
      return {
        ...s,
        pot: s.pot + event.bigBlind,
        players: s.players.map(
          mapPlayerInvestment(event.player, event.bigBlind),
        ),
      };
    case "PlayerBetSmallBlindEvent":
      return {
        ...s,
        pot: s.pot + event.smallBlind,
        players: s.players.map(
          mapPlayerInvestment(event.player, event.smallBlind),
        ),
      };
    case "PlayerRaisedEvent":
      return {
        ...s,
        pot: s.pot + event.raiseBet,
        players: s.players.map(
          mapPlayerInvestment(event.player, event.raiseBet),
        ),
      };
    case "PlayerCalledEvent":
      return {
        ...s,
        pot: s.pot + event.callBet,
        players: s.players.map(
          mapPlayerInvestment(event.player, event.callBet),
        ),
      };
    case "PlayerWentAllInEvent":
      return {
        ...s,
        pot: s.pot + event.allInAmount,
        players: s.players.map(
          mapPlayerInvestment(event.player, event.allInAmount),
        ),
      };
    case "PlayerFoldedEvent":
    case "PlayerForcedFoldedEvent":
      return {
        ...s,
        players: s.players.map(
          mapPlayerFold(event.player, event.investmentInPot),
        ),
      };
    case "PlayerCheckedEvent":
      return s;
    case "PlayerQuitEvent":
      return s;
    case "ServerIsShuttingDownEvent":
      return s;
    default:
      assertUnreachable(event);
      return s;
  }
}

export function reduce(
  s: Table,
  event: TableEvent,
): Table {
  return derivedState(reduceState(s, event));
}

export function initialize(myName: string): Table {
  return derivedState({
    id: 0,
    round: -1,
    players: [],
    communityCards: [],
    myName,
    dealer: "",
    myCards: [],
    bigBlind: 0,
    smallBlind: 0,
    pot: 0,
  });
}
