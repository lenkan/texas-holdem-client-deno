import {
  Card,
  TableEvent,
  TablePlayer,
} from "./protocol.ts";

function assertUnreachable(x: never): asserts x is never {
  throw new Error(`Unreachable code reached`);
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
        communityCards: [...state.communityCards, event.card],
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
        cards: [...state.cards, event.card],
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
