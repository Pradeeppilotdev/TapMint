import fs from "fs";
import path from "path";

export type PointsAccount = {
  wallet: string;
  points: number;
  claimedPoints: number;
  updatedAt: string;
};

const POINTS_PATH = path.join(process.cwd(), "data", "points.json");

function readAll(): Record<string, PointsAccount> {
  if (!fs.existsSync(POINTS_PATH)) return {};
  return JSON.parse(fs.readFileSync(POINTS_PATH, "utf8")) as Record<string, PointsAccount>;
}

function writeAll(data: Record<string, PointsAccount>) {
  fs.mkdirSync(path.dirname(POINTS_PATH), { recursive: true });
  fs.writeFileSync(POINTS_PATH, JSON.stringify(data, null, 2));
}

export function getPoints(wallet: string) {
  const key = wallet.toLowerCase();
  return readAll()[key] ?? {
    wallet: key,
    points: 0,
    claimedPoints: 0,
    updatedAt: new Date().toISOString(),
  };
}

export function addPoints(wallet: string, delta: number, gameId: string) {
  if (!Number.isFinite(delta) || delta <= 0) {
    throw new Error("delta must be positive");
  }
  if (delta > 10_000) {
    throw new Error("score too high");
  }

  const all = readAll();
  const key = wallet.toLowerCase();
  const current = all[key] ?? {
    wallet: key,
    points: 0,
    claimedPoints: 0,
    updatedAt: new Date().toISOString(),
  };

  current.points += Math.floor(delta);
  current.updatedAt = new Date().toISOString();
  all[key] = current;
  writeAll(all);

  // Append audit log
  const logPath = path.join(process.cwd(), "data", "points-log.jsonl");
  fs.appendFileSync(
    logPath,
    JSON.stringify({
      at: current.updatedAt,
      wallet: key,
      gameId,
      delta: Math.floor(delta),
      total: current.points,
    }) + "\n",
  );

  return current;
}

export function markClaimed(wallet: string, pointsUsed: number) {
  const all = readAll();
  const key = wallet.toLowerCase();
  const current = getPoints(key);
  const available = current.points - current.claimedPoints;
  if (pointsUsed > available) {
    throw new Error("insufficient unclaimed points");
  }
  current.claimedPoints += pointsUsed;
  current.updatedAt = new Date().toISOString();
  all[key] = current;
  writeAll(all);
  return current;
}

/** How many token units (raw 18-decimals as string amount of whole tokens) per point */
export const POINTS_PER_TOKEN = 100;
