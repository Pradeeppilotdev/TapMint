export type GameDef = {
  id: string;
  title: string;
  tokenName: string;
  tokenSymbol: string;
  description: string;
  website: string;
  /** Initial buy in MON for market creation (testnet) */
  initialBuyMon: number;
  accent: string;
};

/** TapMint games → meme tokens (testnet markets). */
export const GAMES: GameDef[] = [
  {
    id: "flap",
    title: "Pocket Flap",
    tokenName: "FlapCoin",
    tokenSymbol: "FLAP",
    description: "Meme token for Pocket Flap — tap, fly, earn points on TapMint.",
    website: "https://nad.fun",
    initialBuyMon: 2,
    accent: "#6E54FF",
  },
  {
    id: "mole",
    title: "Mole Patrol",
    tokenName: "MoleCoin",
    tokenSymbol: "MOLE",
    description: "Meme token for Mole Patrol — whack moles, climb the leaderboard.",
    website: "https://nad.fun",
    initialBuyMon: 2,
    accent: "#3dcf8e",
  },
  {
    id: "snake",
    title: "Mint Condition",
    tokenName: "SnekCoin",
    tokenSymbol: "SNEK",
    description: "Meme token for Mint Condition (Snake) — grow long, mint glory.",
    website: "https://nad.fun",
    initialBuyMon: 3,
    accent: "#f5a524",
  },
  {
    id: "memory",
    title: "Double Take",
    tokenName: "MemoCoin",
    tokenSymbol: "MEMO",
    description: "Meme token for Double Take — match pairs, collect rewards.",
    website: "https://nad.fun",
    initialBuyMon: 2,
    accent: "#ff6b9d",
  },
];

export function getGame(id: string) {
  return GAMES.find((g) => g.id === id);
}
