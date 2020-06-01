import "https://unpkg.com/pokersolver@2.1.3/pokersolver.js";

const Pokersolver = (window as any).Hand;

export interface Hand {
  name: string;
  rank: number;
  description: string;
}

export function solve(cards: string[]): Hand {
  if (cards.length === 0) {
    return { rank: 0, description: "Nothing", name: "Nothing" };
  }

  const result = Pokersolver.solve(cards);

  return {
    name: result.name,
    description: result.descr,
    rank: result.rank,
  };
}
