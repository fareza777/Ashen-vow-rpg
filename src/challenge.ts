import type { Combat, GameState } from "./engine";
import { BIOMES, ENEMIES, type Item } from "./data";

export const SATCHEL_CAPACITY = 6;
export const skillLevel = (tier: number) => 1 + (tier - 1) * 3;
export const itemAct = (i: Item) =>
  i.act ??
  (
    {
      "oracle-staff": 2,
      bellplate: 2,
      "moth-charm": 2,
      "thorn-dagger": 2,
      "bark-mail": 2,
      "sunless-edge": 3,
      "first-light": 3,
      "sovereign-veil": 3,
    } as Record<string, number>
  )[i.id] ??
  1;

// Region and depth set the challenge. Gaining a level never raises enemy stats.
export function encounterStats(s: GameState, id: string) {
  const e = ENEMIES.find((e) => e.id === id)!;
  const region = Math.max(
    0,
    BIOMES.findIndex((b) => b.id === s.run?.biome),
  );
  const depth = s.run?.nodes[s.run.current].row ?? 1;
  const deep = 1 + Math.min(0.12, Math.max(0, depth - 1) * 0.007);
  const hp = e.boss
    ? [160, 260, 380, 600, 740, 940, 1150, 1450][region]
    : Math.max(e.hp, [42, 68, 98, 138, 180, 224, 268, 315][region]);
  const attack = Math.max(e.attack, [7, 11, 15, 21, 27, 33, 40, 48][region]);
  return {
    hp: Math.round(hp * (e.boss ? 1 : deep)),
    attack: Math.round(attack * (e.boss ? 1.08 : deep)),
    defense: Math.max(e.defense, [1, 3, 5, 7, 10, 13, 16, 19][region]),
  };
}

export function enemyMove(c: Combat) {
  const e = ENEMIES.find((e) => e.id === c.enemyId)!;
  const phase = e.boss && c.hp < c.maxHp * 0.5;
  const fast = ["hound", "stalker", "salt-marauder", "glass-watcher"].includes(
    e.id,
  );
  const caster = ["oracle", "elder", "sea-oracle", "cinder-moth"].includes(
    e.id,
  );
  const pattern = e.boss
    ? phase
      ? [0, 2, 1, 2]
      : [0, 1, 2, 0, 0, 2]
    : fast
      ? [0, 0, 2, 1]
      : caster
        ? [1, 2, 0, 1, 2]
        : [0, 1, 2];
  const index = pattern[(c.turn + (c.tacticOffset ?? 0)) % pattern.length];
  const region = Math.max(
    0,
    BIOMES.findIndex((b) => b.boss === e.id),
  );
  return {
    index,
    label: e.intent[index],
    multiplier:
      [1, 0.45, e.boss ? 1.9 + region * 0.1 : 1.75][index] * (phase ? 1.2 : 1),
    warning:
      index === 2
        ? `Heavy blow approaching · ${e.intent[index]}. Guard or raise a ward.`
        : index === 1
          ? `The enemy gathers strength · recovery opening. Heal or Focus.`
          : `${e.intent[index]} is coming · the enemy closes in.`,
  };
}
export const draughtRecovery = (c: Combat) =>
  Math.max(0, (c.draughtReadyTurn ?? 0) - c.turn);
