import "https://unpkg.com/pokersolver@2.1.3/pokersolver.js";
import { Suit, Rank, Card } from "./protocol.ts";

const Pokersolver = (window as any).Hand;

export interface Hand {
  name: string;
  rank: number;
  description: string;
}

function mapSuit(suit: Suit): string {
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

function mapRank(rank: Rank): string {
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

function mapCard(card: Card) {
  return `${mapRank(card.rank)}${mapSuit(card.suit)}`;
}

export function solve(cards: Card[]): Hand {
  if (cards.length === 0) {
    return { rank: 0, description: "Nothing", name: "Nothing" };
  }

  const result = Pokersolver.solve(cards.map(mapCard));

  return {
    name: result.name,
    description: result.descr,
    rank: result.rank,
  };
}
