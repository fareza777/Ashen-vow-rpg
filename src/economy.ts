import { BIOMES, ITEMS, QUESTS, type Enemy, type Item } from "./data";
import type { GameState } from "./engine";
import { itemAct } from "./challenge";

export const CACHE_EQUIPMENT_CHANCE = 0.28;
export const ENEMY_EQUIPMENT_CHANCE = 0.04;
export const ENEMY_DRAUGHT_CHANCE = 0.07;
export const guardianRelics: Record<string, string> = {
  warden: "bellplate",
  sovereign: "moth-charm",
  heart: "sunless-edge",
  admiral: "diver-cuirass",
  librarian: "cinder-plate",
  regent: "eclipse-scythe",
  leviathan: "abyss-shell",
  custodian: "dawn-plate",
};
export const draughtPrice = (s: GameState) =>
  18 + Math.floor((s.level - 1) * 0.7);
export const restPrice = (s: GameState) => 12 + Math.ceil((s.level - 1) * 1.5);
export const shrinePrice = (s: GameState) =>
  8 + Math.floor((s.level - 1) * 0.8);
export const sellValue = (i: Item) => Math.max(1, Math.floor(i.price * 0.22));
export const regionAct = (s: GameState) =>
  Math.max(1, BIOMES.findIndex((b) => b.id === s.run?.biome) + 1);
export function fieldLootPool(s: GameState) {
  const act = regionAct(s);
  const reserved = new Set([
    ...Object.values(guardianRelics),
    ...QUESTS.map((q) => q.reward).filter(Boolean),
  ]);
  return ITEMS.filter(
    (i) =>
      i.price > 40 &&
      i.rarity !== "Legendary" &&
      itemAct(i) <= act &&
      itemAct(i) >= Math.max(1, act - 1) &&
      !reserved.has(i.id) &&
      !s.inventory.includes(i.id),
  );
}
export const lootWeight = (i: Item) =>
  i.rarity === "Common" ? 10 : i.rarity === "Uncommon" ? 6 : 1;
export function encounterGold(
  s: GameState,
  e: Enemy,
  roll: number,
  firstClear = true,
) {
  if (e.boss)
    return Math.max(6, Math.floor(e.gold * (firstClear ? 0.65 : 0.15)));
  return 3 + regionAct(s) + Math.floor(roll * (4 + regionAct(s)));
}
