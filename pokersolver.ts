import "https://unpkg.com/pokersolver@2.1.3/pokersolver.js";
import { Suit, Card } from "./table_reducer.ts";

const Pokersolver = (window as any).Hand;

export interface Hand {
  name: string;
  rank: number;
  description: string;
}

function mapRank(rank: number): string {
  switch (rank) {
    case 14:
      return "A";
    case 13:
      return "K";
    case 12:
      return "Q";
    case 11:
      return "J";
    case 10:
      return "T";
    case 9:
      return "9";
    case 8:
      return "8";
    case 7:
      return "7";
    case 6:
      return "6";
    case 5:
      return "5";
    case 4:
      return "4";
    case 3:
      return "3";
    case 2:
      return "2";
    default:
      throw new Error(`Invalid rank ${rank!}`);
  }
}

function mapCard(card: Card) {
  return `${mapRank(card.rank)}${card.suit}`;
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
