import { canMove, neighbors } from "./engine";
import type { DungeonNode, GameState } from "./engine";

// A death is a completed expedition only after the player acknowledges its story.
// Keep its room receipt in the save so resuming that screen still has the count.
export function completedExpedition(
  previous: Pick<GameState, "run" | "defeat">,
  next: Pick<GameState, "run" | "defeat" | "day" | "seed">,
) {
  if ((!previous.run && !previous.defeat) || next.run || next.defeat)
    return null;
  return {
    key: `return-${next.day}-${next.seed}`,
    rooms: previous.run?.rooms ?? previous.defeat?.rooms ?? 0,
  };
}

// Prefer a sentence boundary; every word remains available, including long lore.
export function narrativePages(text: string, target = 46): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const pages: string[] = [];
  while (words.length) {
    const ideal = Math.ceil(words.length / Math.ceil(words.length / target));
    let end = Math.min(ideal, words.length);
    if (end < words.length) {
      for (let i = end; i >= Math.max(1, Math.floor(ideal * 0.75)); i--)
        if (/[.!?][”’"')]*$/.test(words[i - 1])) {
          end = i;
          break;
        }
    }
    pages.push(words.splice(0, end).join(" "));
  }
  return pages.length ? pages : [""];
}

export function reachableRooms(game: GameState): DungeonNode[] {
  if (!game.run) return [];
  const run = game.run;
  const current = run.nodes[run.current];
  const rank = (n: DungeonNode) =>
    n.row > current.row ? 0 : n.row === current.row ? 1 : 2;
  return [...new Set(neighbors(run))]
    .filter((id) => canMove(game, id))
    .map((id) => run.nodes[id])
    .sort(
      (a, b) =>
        rank(a) - rank(b) ||
        Number(a.resolved) - Number(b.resolved) ||
        a.col - b.col,
    );
}

export const roomLabels: Record<DungeonNode["kind"], string> = {
  entrance: "Entrance",
  fight: "Combat",
  event: "Unknown encounter",
  loot: "Forgotten cache",
  camp: "Sheltered fire",
  boss: "Guardian",
  exit: "Return home",
  puzzle: "Sealed passage",
  hazard: "Unstable crossing",
};

export function roomAppearance(node: DungeonNode) {
  const known = node.visited || node.resolved;
  return {
    kind: known ? node.kind : "unknown",
    label: known ? roomLabels[node.kind] : "Unexplored",
    known,
  } as const;
}
