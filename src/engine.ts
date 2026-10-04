import {
  BIOMES,
  ENEMIES,
  EVENTS,
  ITEMS,
  ORIGINS,
  QUESTS,
  SKILLS,
  itemById,
} from "./data";
import {
  validRewardDate,
  validRewardReceipt,
  validRewardRecord,
  rewardSupplyAvailability,
  type RewardedSupplies,
} from "./adRewards";
import type { AttributeId, BiomeId, OriginId, Slot, Choice } from "./data";
import {
  CACHE_EQUIPMENT_CHANCE,
  ENEMY_EQUIPMENT_CHANCE,
  ENEMY_DRAUGHT_CHANCE,
  guardianRelics,
  fieldLootPool,
  lootWeight,
  encounterGold,
  regionAct,
  draughtPrice,
  restPrice,
  shrinePrice,
  sellValue,
} from "./economy";
import {
  encounterStats,
  enemyMove,
  draughtRecovery,
  itemAct,
  skillLevel,
  SATCHEL_CAPACITY,
} from "./challenge";
export type DungeonNode = {
  id: number;
  row: number;
  col: number;
  kind:
    | "entrance"
    | "fight"
    | "event"
    | "loot"
    | "camp"
    | "boss"
    | "exit"
    | "puzzle"
    | "hazard";
  name: string;
  visited: boolean;
  resolved: boolean;
  enemy: string | null;
  event: string | null;
};
export type Run = {
  biome: BiomeId;
  nodes: DungeonNode[];
  current: number;
  eventId: string | null;
  rooms: number;
  gold: number;
  xp: number;
  bossDefeated: boolean;
  shortcuts?: [number, number][];
  lastOutcome?: {
    title: string;
    text: string;
    kind: "story" | "combat" | "loot" | "rest";
    item?: string;
    items?: string[];
    draughts?: number;
    leftBehind?: string[];
    enemy?: string;
    gold?: number;
    xp?: number;
  } | null;
};
export type Combat = {
  enemyId: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  turn: number;
  poison: number;
  ward: number;
  draughtReadyTurn?: number;
  tacticOffset?: number;
  elite?: boolean;
  log: string[];
};
export type JournalEntry = {
  id: number;
  day: number;
  title: string;
  text: string;
  kind: "story" | "combat" | "loot" | "quest" | "level";
};
export type GameState = {
  version: 1;
  name: string;
  origin: OriginId;
  level: number;
  xp: number;
  hp: number;
  energy: number;
  resolve: number;
  gold: number;
  potions: number;
  rewardedSupplies?: RewardedSupplies;
  attributes: Record<AttributeId, number>;
  statPoints: number;
  skillPoints: number;
  skills: string[];
  inventory: string[];
  equipped: Record<Slot, string | null>;
  accepted: string[];
  completed: string[];
  claimed: string[];
  activeQuest: string | null;
  questProgress: Record<string, number>;
  kills: number;
  explored: number;
  relics: number;
  shrines: number;
  reputation: number;
  bosses: string[];
  day: number;
  run: Run | null;
  combat: Combat | null;
  defeat?: {
    enemy?: string;
    biome?: BiomeId;
    lostGold: number;
    turns: number;
    text: string;
  } | null;
  seed: number;
  journal: JournalEntry[];
  notice: string;
  ending: boolean;
  flags: Record<string, string>;
  counters: Record<string, number>;
  resolvedEvents: string[];
  tutorialDismissed: boolean;
  battleFx: {
    sequence: number;
    action: string;
    enemy: string;
    damage: number;
    incoming: number;
    healed: number;
    critical: boolean;
    won: boolean;
  } | null;
};
export type Action =
  | {
      type:
        | "ACCEPT"
        | "CLAIM"
        | "BUY"
        | "SELL"
        | "EQUIP"
        | "UNEQUIP"
        | "LEARN"
        | "ATTRIBUTE";
      id: string;
    }
  | { type: "ENTER"; biome: BiomeId }
  | { type: "MOVE"; id: number }
  | { type: "EVENT"; choice: number }
  | { type: "COMBAT"; action: string }
  | { type: "DECISION"; id: string; choice: number }
  | { type: "AD_REWARD"; receipt: string; date: string }
  | { type: "DISMISS_GUIDE" | "ACK_OUTCOME" | "ACK_DEFEAT" }
  | { type: "RETURN" | "REST" | "SHRINE" | "POTION" | "CLEAR_NOTICE" };
export function createGame(
  name = "Elara",
  origin: OriginId = "oathkeeper",
  seed = 41713,
): GameState {
  // Mix nearby input seeds before the first draw; saved PRNG state is kept verbatim.
  let mixed = Math.imul(seed ^ (seed >>> 16), 0x21f0aaad);
  mixed = Math.imul(mixed ^ (mixed >>> 15), 0x735a2d97);
  const o = ORIGINS.find((o) => o.id === origin) ?? ORIGINS[0];
  const s: GameState = {
    version: 1,
    name: name.trim().slice(0, 22) || "Elara",
    origin: o.id,
    level: 1,
    xp: 0,
    hp: 1,
    energy: 1,
    resolve: 100,
    gold: 120,
    potions: 3,
    rewardedSupplies: { date: "", claimed: 0, receipts: [] },
    attributes: { might: o.might, will: o.will, agility: o.agility },
    statPoints: 0,
    skillPoints: 2,
    skills: [o.skill],
    inventory: ["rust-sword", "traveler-coat"],
    equipped: { weapon: "rust-sword", armor: "traveler-coat", charm: null },
    accepted: [],
    completed: [],
    claimed: [],
    activeQuest: null,
    questProgress: {},
    kills: 0,
    explored: 0,
    relics: 0,
    shrines: 0,
    reputation: 0,
    bosses: [],
    day: 1,
    run: null,
    combat: null,
    seed: (mixed ^ (mixed >>> 15)) >>> 0,
    defeat: null,
    journal: [],
    notice: "",
    ending: false,
    flags: {},
    counters: {},
    resolvedEvents: [],
    tutorialDismissed: false,
    battleFx: null,
  };
  s.hp = stats(s).maxHp;
  s.energy = stats(s).maxEnergy;
  log(
    s,
    "The lantern oath",
    "You arrived at Vesper's Rest carrying a lantern and a promise. Below the sanctuary, something is waking.",
    "story",
  );
  return s;
}
export const xpRequired = (level: number) =>
  65 + level * 35 + level * level * 2;
export function stats(s: GameState) {
  const gear = Object.values(s.equipped)
    .filter(Boolean)
    .map((id) => itemById(id!))
    .filter(Boolean);
  const sum = (key: "hp" | "energy" | "attack" | "defense" | "crit") =>
    gear.reduce((v, i) => v + (i[key] ?? 0), 0);
  return {
    maxHp:
      30 +
      s.attributes.might * 2 +
      (s.level - 1) * 3 +
      sum("hp") +
      (s.skills.includes("vigor") ? 12 : 0) +
      (s.skills.includes("guardian") ? 35 : 0),
    // High-tier build choices remain independent of origin.
    maxEnergy:
      12 +
      s.attributes.will * 2 +
      (s.level - 1) * 2 +
      sum("energy") +
      (s.skills.includes("reservoir") ? 10 : 0) +
      (s.skills.includes("deepwell") ? 25 : 0),
    attack: 4 + Math.floor(s.attributes.might * 1.6) + sum("attack"),
    defense:
      Math.floor(s.attributes.agility / 3) +
      sum("defense") +
      (s.skills.includes("ironwill") ? 5 : 0),
    crit: Math.min(
      65,
      5 +
        Math.floor(s.attributes.agility * 0.8) +
        sum("crit") +
        (s.skills.includes("precision") ? 12 : 0) +
        (s.skills.includes("fortune") ? 10 : 0),
    ),
  };
}
function log(
  s: GameState,
  title: string,
  text: string,
  kind: JournalEntry["kind"],
) {
  s.journal.unshift({
    id: (s.journal[0]?.id ?? 0) + 1,
    day: s.day,
    title,
    text,
    kind,
  });
  s.journal = s.journal.slice(0, 400);
}
function rng(s: GameState) {
  s.seed = (Math.imul(1664525, s.seed) + 1013904223) >>> 0;
  return s.seed / 4294967296;
}
function addItem(s: GameState, id: string) {
  if (s.inventory.includes(id)) return false;
  s.inventory.push(id);
  return true;
}
function fieldLoot(s: GameState) {
  const pool = fieldLootPool(s);
  if (!pool.length) return undefined;
  let roll = rng(s) * pool.reduce((sum, i) => sum + lootWeight(i), 0);
  return (
    pool.find((i) => (roll -= lootWeight(i)) < 0)?.id ??
    pool[pool.length - 1].id
  );
}
function gainXp(s: GameState, amount: number) {
  s.xp += amount;
  if (s.run) s.run.xp += amount;
  while (s.xp >= xpRequired(s.level)) {
    s.xp -= xpRequired(s.level);
    s.level++;
    s.statPoints += 2;
    s.skillPoints++;
    s.hp = Math.min(stats(s).maxHp, s.hp + 16);
    s.energy = Math.min(stats(s).maxEnergy, s.energy + 6);
    log(
      s,
      "A stronger flame",
      `You reached level ${s.level}. Gained 2 attribute points and 1 skill point.`,
      "level",
    );
    s.notice = `Level ${s.level}! Your flame grows stronger. New attribute and skill points await.`;
  }
}
function progress(s: GameState, id: string, amount = 1) {
  s.questProgress[id] = (s.questProgress[id] ?? 0) + amount;
  const q = QUESTS.find((q) => q.id === id);
  if (
    q &&
    s.accepted.includes(id) &&
    s.questProgress[id] >= q.goal &&
    !s.completed.includes(id)
  ) {
    s.completed.push(id);
    log(
      s,
      "Quest fulfilled",
      `${q.name}. Return to Vesper's Rest to claim your reward.`,
      "quest",
    );
    s.notice = `Quest complete: ${q.name}. Your reward awaits in town.`;
  }
}
function clamp(s: GameState) {
  const st = stats(s);
  s.hp = Math.min(st.maxHp, Math.max(0, s.hp));
  s.energy = Math.min(st.maxEnergy, Math.max(0, s.energy));
  s.resolve = Math.min(100, Math.max(0, s.resolve));
  s.gold = Math.max(0, s.gold);
}
export const draughtHealing = (s: GameState) =>
  28 + (s.level - 1) * 3 + (s.skills.includes("kindle") ? 18 : 0);
export const availableAct = (s: GameState) =>
  Math.max(...BIOMES.map((b, i) => (regionUnlocked(s, b.id) ? i + 1 : 1)));
function record(s: GameState, key: string, amount = 1) {
  s.counters[key] = (s.counters[key] ?? 0) + amount;
  for (const q of QUESTS.filter(
    (q) =>
      q.objectiveKey === key &&
      s.accepted.includes(q.id) &&
      !s.completed.includes(q.id),
  ))
    progress(
      s,
      q.id,
      Math.max(0, s.counters[key] - (s.questProgress[q.id] ?? 0)),
    );
}
export function choiceAvailable(s: GameState, c: Choice) {
  return (
    s.energy >= Math.max(0, -(c.energy ?? 0)) &&
    s.gold >= Math.max(c.requiresGold ?? 0, -(c.gold ?? 0)) &&
    (!c.requiresAttribute ||
      s.attributes[c.requiresAttribute.id] >= c.requiresAttribute.value) &&
    (!c.requiresFlag || s.flags[c.requiresFlag.key] === c.requiresFlag.value) &&
    s.reputation >= (c.requiresReputation ?? 0)
  );
}
export function choiceRequirement(s: GameState, c: Choice) {
  if (s.energy < Math.max(0, -(c.energy ?? 0)))
    return `Need ${-(c.energy ?? 0)} energy`;
  if (s.gold < Math.max(c.requiresGold ?? 0, -(c.gold ?? 0)))
    return `Need ${Math.max(c.requiresGold ?? 0, -(c.gold ?? 0))} gold`;
  if (
    c.requiresAttribute &&
    s.attributes[c.requiresAttribute.id] < c.requiresAttribute.value
  )
    return `Need ${c.requiresAttribute.id} ${c.requiresAttribute.value}`;
  if (c.requiresFlag && s.flags[c.requiresFlag.key] !== c.requiresFlag.value)
    return "Requires carrying the shared heart";
  if (s.reputation < (c.requiresReputation ?? 0))
    return `Need ${c.requiresReputation} town trust`;
  return "";
}
function applyChoice(s: GameState, c: Choice) {
  s.gold += c.gold ?? 0;
  if (s.run && (c.gold ?? 0) > 0) s.run.gold += c.gold!;
  s.hp += c.hp ?? 0;
  s.energy += c.energy ?? 0;
  s.resolve += c.resolve ?? 0;
  s.reputation += c.reputation ?? 0;
  if (c.flag) s.flags[c.flag.key] = c.flag.value;
  if (c.item) addItem(s, c.item);
  if (c.quest) {
    if (c.quest === "relics") s.relics++;
    if (c.quest === "shrine") s.shrines++;
    progress(s, c.quest);
  }
  if (c.shortcut && s.run) {
    const from = s.run.nodes[s.run.current];
    const to = s.run.nodes.find(
      (n) => n.row === from.row + 3 && n.col === from.col,
    );
    if (to) s.run.shortcuts!.push([from.id, to.id]);
  }
}
export function regionUnlocked(s: GameState, id: BiomeId) {
  const b = BIOMES.find((b) => b.id === id);
  return !!b && (!b.unlock || s.claimed.includes(b.unlock));
}
export function neighbors(run: Run): number[] {
  const n = run.nodes[run.current];
  return run.nodes
    .filter(
      (x) =>
        x.id !== n.id &&
        ((Math.abs(x.row - n.row) === 1 && Math.abs(x.col - n.col) <= 1) ||
          (x.row === n.row && Math.abs(x.col - n.col) === 1)),
    )
    .map((x) => x.id)
    .concat(
      (run.shortcuts ?? []).flatMap(([a, b]) =>
        a === n.id ? [b] : b === n.id ? [a] : [],
      ),
    );
}
export function canMove(s: GameState, id: number) {
  return (
    !!s.run &&
    !s.combat &&
    !s.run.eventId &&
    neighbors(s.run).includes(id) &&
    (s.run.nodes[id]?.kind !== "exit" || s.run.bossDefeated)
  );
}
function generateDungeon(s: GameState, biome: BiomeId): DungeonNode[] {
  const index = BIOMES.findIndex((x) => x.id === biome),
    b = BIOMES[index];
  const depth = [10, 11, 12, 14, 15, 16, 18, 20][index];
  const enemies = [
    ["revenant", "hound", "oracle"],
    ["stalker", "hound", "elder"],
    ["veteran", "oracle", "elder"],
    ["salt-marauder", "oracle"],
    ["cinder-moth", "veteran"],
    ["glass-watcher", "cinder-moth"],
    ["sea-oracle", "glass-watcher"],
    ["sea-oracle", "glass-watcher", "cinder-moth"],
  ][index];
  const reusable = [
    "well",
    "altar",
    "door",
    "flood-gate",
    "cipher-lock",
    "mirror-path",
    "root-surge",
  ];
  const common = EVENTS.filter((e) => !e.biome || e.biome === biome).filter(
    (e) =>
      e.kind || reusable.includes(e.id) || !s.resolvedEvents.includes(e.id),
  );
  const hazards = common
    .filter(
      (e) => e.kind === "hazard" || ["flood-gate", "root-surge"].includes(e.id),
    )
    .map((e) => e.id);
  const puzzles = common
    .filter(
      (e) =>
        e.kind === "puzzle" || ["cipher-lock", "mirror-path"].includes(e.id),
    )
    .map((e) => e.id);
  const take = (pool: string[]) =>
    pool.splice(Math.floor(rng(s) * pool.length), 1)[0] ?? null;
  const pending = QUESTS.filter(
    (q) =>
      q.biome === biome &&
      s.accepted.includes(q.id) &&
      !s.completed.includes(q.id),
  );
  const required = pending.flatMap((q) =>
    q.objectiveKey?.startsWith("event:")
      ? [q.objectiveKey.slice(6)]
      : q.objectiveKey === "ritual:seals"
        ? ["seal-witness", "seal-mercy", "seal-change"].filter(
            (id) => !s.resolvedEvents.includes(id),
          )
        : [],
  );
  const pool = common
    .filter(
      (e) =>
        !e.kind &&
        !reusable.slice(3).includes(e.id) &&
        !e.id.startsWith("seal-") &&
        !QUESTS.some(
          (q) =>
            q.type === "Main quest" &&
            q.objectiveKey === `event:${e.id}` &&
            !pending.includes(q),
        ),
    )
    .map((e) => e.id);
  const nodes: DungeonNode[] = [
    {
      id: 0,
      row: 0,
      col: 1,
      kind: "entrance",
      name: "The descent",
      visited: true,
      resolved: true,
      enemy: null,
      event: null,
    },
  ];
  const names = {
    fight: "A presence in the dark",
    event: "A life worth remembering",
    loot: "A forgotten cache",
    camp: "A sheltered fire",
    puzzle: "A sealed passage",
    hazard: "An unstable crossing",
  };
  const opening: ("fight" | "event" | "loot")[] = ["fight", "event", "loot"];
  for (let i = opening.length - 1; i > 0; i--) {
    const j = Math.floor(rng(s) * (i + 1));
    [opening[i], opening[j]] = [opening[j], opening[i]];
  }
  const camps = new Map<number, number>();
  for (let block = 0; block < Math.floor(depth / 4); block++)
    camps.set(3 + block * 4 + Math.floor(rng(s) * 2), Math.floor(rng(s) * 3));
  for (let row = 1; row <= depth; row++)
    for (let col = 0; col < 3; col++) {
      const roll = rng(s);
      let kind: "fight" | "event" | "loot" | "camp" | "puzzle" | "hazard" =
        roll < 0.36
          ? "fight"
          : roll < 0.62
            ? "event"
            : roll < 0.78
              ? "loot"
              : roll < 0.87
                ? "puzzle"
                : "hazard";
      if (camps.get(row) === col) kind = "camp";
      if (row === 1) kind = opening[col];
      let event =
        kind === "event"
          ? take(pool)
          : kind === "puzzle"
            ? take(puzzles)
            : kind === "hazard"
              ? take(hazards)
              : null;
      if (["event", "puzzle", "hazard"].includes(kind) && !event)
        kind = roll < 0.5 ? "fight" : "loot";
      if (
        row === 1 &&
        kind === "event" &&
        biome === "catacombs" &&
        !required.length &&
        !s.resolvedEvents.includes("pilgrim")
      )
        event = "pilgrim";
      const critical = required[Math.floor((row - 1) / 3)];
      if (col === 1 && (row - 1) % 3 === 0 && critical) {
        kind = "event";
        event = critical;
      }
      if (event && kind === "event") {
        const at = pool.indexOf(event);
        if (at >= 0) pool.splice(at, 1);
      }
      nodes.push({
        id: nodes.length,
        row,
        col,
        kind,
        name: names[kind],
        visited: false,
        resolved: false,
        enemy:
          kind === "fight"
            ? enemies[Math.floor(rng(s) * enemies.length)]
            : null,
        event,
      });
    }
  // Guarantee one of each crossing in a random spare room, without fixing its location.
  for (const kind of ["puzzle", "hazard"] as const) {
    if (nodes.some((n) => n.kind === kind)) continue;
    const used = new Set(nodes.map((n) => n.event));
    const events = common.filter((e) => e.kind === kind && !used.has(e.id));
    const spare = nodes.filter(
      (n) => n.row > 1 && ["fight", "loot"].includes(n.kind),
    );
    if (!events.length || !spare.length) continue;
    const node = spare[Math.floor(rng(s) * spare.length)];
    node.kind = kind;
    node.name = names[kind];
    node.enemy = null;
    node.event = events[Math.floor(rng(s) * events.length)].id;
  }
  nodes.push({
    id: nodes.length,
    row: depth + 1,
    col: 1,
    kind: "boss",
    name: "The guardian's chamber",
    visited: false,
    resolved: false,
    enemy: b.boss,
    event: null,
  });
  nodes.push({
    id: nodes.length,
    row: depth + 2,
    col: 1,
    kind: "exit",
    name: "The way home",
    visited: false,
    resolved: false,
    enemy: null,
    event: null,
  });
  return nodes;
}
function startCombat(s: GameState, id: string) {
  const e = ENEMIES.find((x) => x.id === id)!;
  const scaled = encounterStats(s, id);
  const depth = s.run?.nodes[s.run.current].row ?? 1;
  const elite =
    !e.boss &&
    depth >= 4 &&
    rng(s) < Math.min(0.18, 0.06 + regionAct(s) * 0.015);
  s.combat = {
    enemyId: id,
    hp: Math.round(scaled.hp * (elite ? 1.18 : 1)),
    maxHp: Math.round(scaled.hp * (elite ? 1.18 : 1)),
    attack: Math.round(scaled.attack * (elite ? 1.12 : 1)),
    defense: scaled.defense + (elite ? 2 : 0),
    turn: 0,
    poison: 0,
    ward: 0,
    draughtReadyTurn: 0,
    tacticOffset: Math.floor(rng(s) * 65536) % 12,
    elite,
    log: [
      `${elite ? "An ashbound " : ""}${e.name} emerges from the dark. Your turn.`,
    ],
  };
  s.combat.log.unshift(enemyMove(s.combat).warning);
}
function victory(s: GameState) {
  const c = s.combat!,
    e = ENEMIES.find((x) => x.id === c.enemyId)!;
  const firstClear = !s.bosses.includes(e.id);
  const gold = encounterGold(s, e, rng(s), firstClear) + (c.elite ? 2 : 0);
  const xp = Math.round(
    e.xp * (e.boss && !firstClear ? 0.3 : c.elite ? 1.2 : 1),
  );
  const items: string[] = [],
    leftBehind: string[] = [];
  let draughts = 0;
  s.combat = null;
  s.kills++;
  s.gold += gold;
  if (s.run) {
    s.run.gold += gold;
    s.run.nodes[s.run.current].resolved = true;
  }
  gainXp(s, xp);
  progress(s, "hollows");
  s.energy += 3;
  record(s, "kills");
  if (e.boss) {
    s.run!.bossDefeated = true;
    if (firstClear) s.bosses.push(e.id);
    record(s, `boss:${e.id}`);
    if (firstClear && guardianRelics[e.id]) {
      const relic = guardianRelics[e.id];
      (addItem(s, relic) ? items : leftBehind).push(relic);
    }
  } else {
    const equipmentChance = c.elite ? 0.09 : ENEMY_EQUIPMENT_CHANCE;
    const roll = rng(s);
    if (roll < equipmentChance) {
      const item = fieldLoot(s);
      if (item && addItem(s, item)) items.push(item);
    } else if (
      roll < equipmentChance + ENEMY_DRAUGHT_CHANCE &&
      s.potions < SATCHEL_CAPACITY
    ) {
      s.potions++;
      draughts = 1;
    }
  }
  if (s.run)
    s.run.lastOutcome = {
      title: e.boss ? "Guardian defeated" : "Victory",
      text: e.boss
        ? firstClear
          ? "The oath binding this chamber breaks. The way home is open; your next chapter waits in Vesper’s Rest."
          : "The echo falls silent again. Its unique relic was recovered on an earlier expedition."
        : `${e.name} falls. For a moment, the dark is still. You search what remains before moving on.`,
      kind: "combat",
      enemy: e.id,
      items,
      leftBehind,
      draughts,
      gold,
      xp,
    };
  const spoils = `${gold} gold · ${xp} XP${items.length ? " · " + items.map((id) => itemById(id).name).join(", ") : ""}${draughts ? " · Healing Draught ×1" : ""}`;
  log(
    s,
    e.boss ? "A darkness silenced" : "A battle survived",
    `Defeated ${e.name}. Recovered ${spoils}.`,
    "combat",
  );
  s.notice = `${e.name} defeated. ${spoils}`;
}
function defeat(s: GameState) {
  const loss = Math.floor(s.gold * 0.15);
  const enemy = s.combat?.enemyId;
  const name = ENEMIES.find((e) => e.id === enemy)?.name;
  s.defeat = {
    enemy,
    biome: s.run?.biome,
    lostGold: loss,
    turns: s.combat?.turn ?? 0,
    text: name
      ? `You fell to ${name}. A keeper followed your lantern’s last ember and carried you back to Vesper’s Rest.`
      : "The crossing overwhelmed you. A keeper followed the last ember of your lantern and carried you back to the gates of Vesper’s Rest.",
  };
  s.gold -= loss;
  s.run = null;
  s.combat = null;
  s.hp = Math.ceil(stats(s).maxHp * 0.65);
  s.energy = stats(s).maxEnergy;
  s.resolve = 50;
  s.day++;
  s.notice = "";
  log(
    s,
    "The flame endures",
    `${s.defeat.text} Lost ${loss} gold. Equipment, experience and vows remain with you.`,
    "story",
  );
}
function fight(s: GameState, action: string) {
  const c = s.combat;
  if (!c) return;
  const st = stats(s);
  const move = enemyMove(c);
  const wasEnraged =
    !!ENEMIES.find((e) => e.id === c.enemyId)?.boss && c.hp < c.maxHp * 0.5;
  const beforeHp = s.hp;
  let critical = false;
  let damage = 0,
    guard = false,
    detail = "";
  const skill = SKILLS.find((k) => k.id === action);
  if (skill) {
    if (!s.skills.includes(action) || skill.passive || s.energy < skill.cost)
      return;
    s.energy -= skill.cost;
    detail = skill.name;
    switch (action) {
      case "ember":
        damage = 12 + s.attributes.will * 2;
        break;
      case "nova":
        damage = 28 + s.attributes.will * 3;
        break;
      case "cleave":
        damage = Math.round(st.attack * 1.5) - Math.floor(c.defense / 2);
        break;
      case "execution":
        damage =
          Math.round(st.attack * 1.55 * (c.hp / c.maxHp < 0.3 ? 2 : 1)) -
          c.defense;
        break;
      case "venom":
        damage = st.attack - c.defense;
        c.poison = 3;
        break;
      case "drain":
        damage = 10 + s.attributes.agility * 2;
        s.hp += Math.floor(damage / 2);
        break;
      case "eclipse":
        damage = st.attack * 2 - c.defense;
        c.ward += 12;
        break;
      case "bulwark":
        c.ward += 18;
        detail += " · 18 ward";
        break;
      case "riposte":
        damage = Math.round(st.attack * 1.3) - c.defense;
        c.ward += 15;
        guard = true;
        break;
      case "earthquake":
        damage = Math.round(st.attack * 2.4) - Math.floor(c.defense / 2);
        break;
      case "mists":
        s.hp += 30 + s.attributes.will * 3;
        c.ward += 8;
        break;
      case "furnace":
        damage = 44 + s.attributes.will * 4;
        break;
      case "step":
        damage = Math.round(st.attack * 1.5) - c.defense;
        c.ward += 12;
        break;
      case "shroud":
        damage = st.attack + 6 - c.defense;
        c.poison = 4;
        c.ward += 15;
        break;
      case "mend": {
        const heal = 16 + s.attributes.will;
        s.hp += heal;
        detail += ` · restored ${heal} HP`;
        break;
      }
    }
  } else {
    switch (action) {
      case "attack":
        damage = st.attack - c.defense;
        s.energy += 2;
        detail = "Your blade strikes";
        break;
      case "power":
        if (s.energy < 4) return;
        s.energy -= 4;
        damage = Math.round(st.attack * 1.6) - c.defense;
        detail = "Heavy strike";
        break;
      case "guard":
        guard = true;
        s.energy += 3;
        detail = "You brace against the dark";
        break;
      case "focus":
        s.energy += 8;
        detail = "You gather 8 energy";
        break;
      case "potion":
        if (s.potions < 1 || draughtRecovery(c) || s.hp >= st.maxHp) return;
        s.potions--;
        c.draughtReadyTurn = c.turn + 3;
        s.hp += draughtHealing(s);
        detail = `Healing draught · restored ${Math.min(draughtHealing(s), st.maxHp - beforeHp)} HP`;
        break;
      case "flee":
        if (ENEMIES.find((e) => e.id === c.enemyId)?.boss) {
          s.notice = "The guardian bars your escape. You must face it.";
          return;
        }
        s.hp -= Math.max(2, c.attack - st.defense);
        s.combat = null;
        s.run!.nodes[s.run!.current].resolved = true;
        s.resolve -= 6;
        s.notice = "You escaped, leaving the spoils behind.";
        if (s.hp <= 0) defeat(s);
        return;
      default:
        return;
    }
  }
  if (damage > 0) {
    damage = Math.max(1, Math.round(damage * (s.resolve < 25 ? 0.85 : 1)));
    if (rng(s) * 100 < st.crit) {
      critical = true;
      damage = Math.round(damage * 1.4);
      detail += " · critical";
    }
    c.hp -= damage;
    detail += ` · ${damage} damage`;
  }
  const healed = Math.max(0, Math.min(st.maxHp, s.hp) - beforeHp);
  s.hp = Math.min(st.maxHp, s.hp);
  s.battleFx = {
    sequence: (s.battleFx?.sequence ?? 0) + 1,
    action,
    enemy: c.enemyId,
    damage,
    incoming: 0,
    healed,
    critical,
    won: false,
  };
  c.log.unshift(detail);
  if (c.hp <= 0) {
    s.battleFx.won = true;
    victory(s);
    return;
  }
  if (c.poison > 0) {
    c.poison--;
    const poison = 5 + Math.floor(s.attributes.agility * 0.65);
    c.hp -= poison;
    c.log.unshift(`Thornblood deals ${poison} poison damage.`);
    if (c.hp <= 0) {
      s.battleFx.won = true;
      victory(s);
      return;
    }
  }
  const e = ENEMIES.find((e) => e.id === c.enemyId)!;
  const phase = e.boss && c.hp < c.maxHp * 0.5;
  let incoming = Math.max(
    1,
    Math.round(c.attack * move.multiplier) -
      Math.floor(st.defense * (move.index === 2 ? 0.65 : 1)),
  );
  if (guard) incoming = Math.ceil(incoming / 4);
  const absorbed = Math.min(c.ward, incoming);
  c.ward -= absorbed;
  incoming -= absorbed;
  s.hp -= incoming;
  s.battleFx.incoming = incoming;
  if (move.index === 2) s.resolve -= 3;
  if (c.enemyId === "sea-oracle" && move.index === 1) {
    c.hp = Math.min(c.maxHp, c.hp + 12);
    c.log.unshift("The tide oracle draws 12 health from the water.");
  }
  if (c.enemyId === "salt-marauder" && move.index === 0) {
    s.energy -= 3;
    c.log.unshift("The hook catches your pack · 3 energy lost.");
  }
  if (c.enemyId === "cinder-moth" && move.index === 2 && !guard) {
    s.hp -= 4;
    s.battleFx.incoming += 4;
    c.log.unshift("Burning wings leave 4 ember damage.");
  }
  if (phase && !wasEnraged)
    c.log.unshift("The guardian's oath breaks · its attacks grow stronger.");
  c.log.unshift(
    `${move.label} · ${incoming} damage${absorbed ? ` · ${absorbed} absorbed` : ""}`,
  );
  c.turn++;
  c.log.unshift(enemyMove(c).warning);
  c.log = c.log.slice(0, 32);
  if (s.hp <= 0) defeat(s);
}
export function reduceGame(state: GameState, a: Action): GameState {
  if (state.defeat && a.type !== "ACK_DEFEAT" && a.type !== "CLEAR_NOTICE")
    return state;
  const s: GameState = structuredClone(state);
  s.notice = "";
  switch (a.type) {
    case "ACCEPT": {
      if (s.run) break;
      const q = QUESTS.find((q) => q.id === a.id);
      if (
        !q ||
        s.claimed.includes(q.id) ||
        (q.requires && !s.claimed.includes(q.requires))
      )
        break;
      if (!s.accepted.includes(q.id)) {
        s.accepted.push(q.id);
        log(s, "A promise made", `${q.name}: ${q.objective}.`, "quest");
      }
      s.activeQuest = q.id;
      const amounts: Record<string, number> = {
        hollows: s.kills,
        explorer: s.explored,
        relics: s.relics,
        shrine: s.shrines,
      };
      if (a.id in amounts)
        progress(
          s,
          a.id,
          Math.max(0, amounts[a.id] - (s.questProgress[a.id] ?? 0)),
        );
      if (q.objectiveKey)
        progress(
          s,
          q.id,
          Math.max(
            0,
            (s.counters[q.objectiveKey] ?? 0) - (s.questProgress[q.id] ?? 0),
          ),
        );
      progress(s, q.id, 0);
      s.notice = `Quest tracked: ${q.name}`;
      break;
    }
    case "CLAIM": {
      if (s.run || !s.completed.includes(a.id) || s.claimed.includes(a.id))
        break;
      const q = QUESTS.find((q) => q.id === a.id)!;
      s.claimed.push(a.id);
      s.gold += q.gold;
      gainXp(s, q.xp);
      if (q.reward) addItem(s, q.reward);
      if (s.activeQuest === a.id) s.activeQuest = null;
      log(
        s,
        "A vow fulfilled",
        `${q.name}. Reward: ${q.gold} gold, ${q.xp} XP${q.reward ? `, ${itemById(q.reward).name}` : ""}.`,
        "quest",
      );
      s.notice = `Rewards claimed: ${q.gold} gold · ${q.xp} XP${q.reward ? " · " + itemById(q.reward).name : ""}`;
      break;
    }
    case "ENTER": {
      if (s.run || !regionUnlocked(s, a.biome)) break;
      const b = BIOMES.find((b) => b.id === a.biome)!;
      s.run = {
        biome: a.biome,
        nodes: generateDungeon(s, a.biome),
        current: 0,
        eventId: null,
        rooms: 0,
        gold: 0,
        xp: 0,
        bossDefeated: false,
        shortcuts: [],
        lastOutcome: null,
      };
      log(s, "Into the hollow", `You descended into ${b.name}.`, "story");
      break;
    }
    case "MOVE": {
      if (!canMove(s, a.id)) break;
      const r = s.run!,
        n = r.nodes[a.id];
      r.current = n.id;
      r.lastOutcome = null;
      if (n.resolved) break;
      n.visited = true;
      r.rooms++;
      s.explored++;
      progress(s, "explorer");
      record(s, `rooms:${r.biome}`);
      s.resolve -= s.skills.includes("steady") ? 0 : 1;
      if (n.kind === "fight" || n.kind === "boss") startCombat(s, n.enemy!);
      else if (["event", "puzzle", "hazard"].includes(n.kind)) {
        if (
          n.event &&
          s.resolvedEvents.includes(n.event) &&
          !EVENTS.find((e) => e.id === n.event)?.kind &&
          ![
            "well",
            "altar",
            "door",
            "flood-gate",
            "cipher-lock",
            "mirror-path",
            "root-surge",
          ].includes(n.event)
        ) {
          n.resolved = true;
          r.lastOutcome = {
            title: "An old crossing",
            text: "The person you helped has moved on. A fresh lantern marks the safe passage they left for you.",
            kind: "story",
          };
        } else r.eventId = n.event!;
      } else if (n.kind === "loot") {
        const act = regionAct(s);
        const gold = 4 + act * 2 + Math.floor(rng(s) * (9 + act));
        s.gold += gold;
        r.gold += gold;
        s.relics++;
        progress(s, "relics");
        const loot = rng(s) < CACHE_EQUIPMENT_CHANCE ? fieldLoot(s) : undefined;
        if (loot) addItem(s, loot);
        n.resolved = true;
        log(
          s,
          "Forgotten belongings",
          `Recovered ${gold} gold${loot ? " and " + itemById(loot).name : ". No usable equipment remained"}.`,
          "loot",
        );
        r.lastOutcome = {
          title: "Cache searched",
          text: loot
            ? "The damp spared this sealed bundle. You recover the belongings tucked inside."
            : "The cloth has rotted and the metal crumbles in your hands. A few coins are all that can be carried onward.",
          kind: "loot",
          items: loot ? [loot] : [],
          gold,
        };
        s.notice = `Recovered ${gold} gold${loot ? " · " + itemById(loot).name : ""}`;
      } else if (n.kind === "camp") {
        const healed = Math.min(stats(s).maxHp - s.hp, 15 + s.level);
        s.hp += healed;
        const restoredEnergy = Math.min(stats(s).maxEnergy - s.energy, 8);
        const restoredResolve = Math.min(100 - s.resolve, 8);
        s.energy += restoredEnergy;
        s.resolve += restoredResolve;
        s.shrines++;
        progress(s, "shrine");
        n.resolved = true;
        s.notice = `Restored ${healed} HP, ${restoredEnergy} energy, and ${restoredResolve} resolve.`;
        r.lastOutcome = {
          title: "A sheltered fire",
          text: s.notice,
          kind: "rest",
        };
        log(s, "A moment of warmth", s.notice, "story");
      } else if (n.kind === "exit") {
        s.run = null;
        s.day++;
        s.notice = "You returned to Vesper's Rest. Your quest rewards await.";
        log(s, "Home, for now", s.notice, "story");
      }
      break;
    }
    case "EVENT": {
      const r = s.run,
        e = EVENTS.find((e) => e.id === r?.eventId);
      const c = e?.choices[a.choice];
      if (!r || !e || !c || !choiceAvailable(s, c)) break;
      applyChoice(s, c);
      if (!s.resolvedEvents.includes(e.id)) {
        s.resolvedEvents.push(e.id);
        record(s, `event:${e.marker ?? e.id}`);
        if ((c.marker ?? e.marker)?.startsWith("seal:"))
          record(s, "ritual:seals");
      }
      r.lastOutcome = {
        title: e.name,
        text: c.outcome,
        kind: "story",
        items: c.item && !state.inventory.includes(c.item) ? [c.item] : [],
        leftBehind: c.item && state.inventory.includes(c.item) ? [c.item] : [],
        gold: c.gold && c.gold > 0 ? c.gold : undefined,
      };
      r.nodes[r.current].resolved = true;
      r.eventId = null;
      s.notice = "Your choice is recorded.";
      log(s, e.name, c.outcome, "story");
      break;
    }
    case "DECISION": {
      const q = QUESTS.find((q) => q.id === a.id),
        c = q?.scene?.choices[a.choice];
      if (
        s.run ||
        !q ||
        !c ||
        !s.accepted.includes(q.id) ||
        s.completed.includes(q.id) ||
        (q.requires && !s.claimed.includes(q.requires)) ||
        !choiceAvailable(s, c)
      )
        break;
      applyChoice(s, c);
      progress(s, q.id);
      log(s, q.name, c.outcome, "story");
      if (q.id === "new-sun") s.ending = true;
      s.notice = "Your decision is recorded. Claim the chapter reward.";
      break;
    }
    case "DISMISS_GUIDE":
      s.tutorialDismissed = true;
      break;
    case "ACK_OUTCOME":
      if (s.run) s.run.lastOutcome = null;
      break;
    case "ACK_DEFEAT":
      s.defeat = null;
      break;
    case "COMBAT":
      fight(s, a.action);
      break;
    case "RETURN": {
      if (!s.run || s.combat) break;
      log(
        s,
        "Home, for now",
        `Returned with ${s.run.gold} gold and ${s.run.xp} XP from ${s.run.rooms} rooms.`,
        "story",
      );
      s.run = null;
      s.day++;
      s.notice =
        "You returned safely. Rest, improve your gear, and keep your vow.";
      break;
    }
    case "AD_REWARD": {
      if (
        !validRewardDate(a.date) ||
        !validRewardReceipt(a.receipt) ||
        rewardSupplyAvailability(s, a.date) !== "available" ||
        s.rewardedSupplies?.receipts.includes(a.receipt)
      )
        break;
      const previous = s.rewardedSupplies;
      s.rewardedSupplies = {
        date: a.date,
        claimed: (previous?.date === a.date ? previous.claimed : 0) + 1,
        receipts: [...(previous?.receipts ?? []).slice(-127), a.receipt],
      };
      s.potions++;
      s.notice =
        "Received 1 healing draught. Your wayfarer's supplies are saved.";
      log(s, "Wayfarer's supplies", s.notice, "loot");
      break;
    }
    case "BUY": {
      if (s.run) break;
      if (a.id === "potion" || a.id === "potion-five") {
        const count = a.id === "potion-five" ? 5 : 1;
        if (
          s.gold < draughtPrice(s) * count ||
          s.potions + count > SATCHEL_CAPACITY
        )
          break;
        s.gold -= draughtPrice(s) * count;
        s.potions += count;
        s.notice = `${count} healing draughts purchased. Each restores ${draughtHealing(s)} HP.`;
        break;
      }
      const i = ITEMS.find((i) => i.id === a.id);
      if (
        !i ||
        itemAct(i) > availableAct(s) ||
        s.gold < i.price ||
        s.inventory.includes(i.id)
      )
        break;
      s.gold -= i.price;
      s.inventory.push(i.id);
      s.notice = `Purchased ${i.name}. Equip it in your inventory.`;
      log(s, "A better chance", s.notice, "loot");
      break;
    }
    case "SELL": {
      if (
        s.run ||
        Object.values(s.equipped).includes(a.id) ||
        !s.inventory.includes(a.id)
      )
        break;
      const i = ITEMS.find((i) => i.id === a.id);
      if (!i) break;
      s.inventory = s.inventory.filter((id) => id !== i.id);
      s.gold += sellValue(i);
      s.notice = `Sold ${i.name} for ${sellValue(i)} gold.`;
      break;
    }
    case "EQUIP": {
      if (s.combat || !s.inventory.includes(a.id)) break;
      const i = ITEMS.find((i) => i.id === a.id);
      if (!i) break;
      s.equipped[i.slot] = i.id;
      s.notice = `Equipped ${i.name}.`;
      break;
    }
    case "UNEQUIP": {
      if (s.combat || !["weapon", "armor", "charm"].includes(a.id)) break;
      s.equipped[a.id as Slot] = null;
      break;
    }
    case "LEARN": {
      if (s.combat) break;
      const k = SKILLS.find((k) => k.id === a.id);
      if (
        !k ||
        s.skillPoints < k.tier ||
        s.skills.includes(k.id) ||
        s.level < skillLevel(k.tier)
      )
        break;
      s.skillPoints -= k.tier;
      s.skills.push(k.id);
      s.notice = `Learned ${k.name}.`;
      log(s, "A new discipline", s.notice, "level");
      break;
    }
    case "ATTRIBUTE": {
      if (
        s.combat ||
        s.statPoints < 1 ||
        !["might", "will", "agility"].includes(a.id)
      )
        break;
      s.statPoints--;
      s.attributes[a.id as AttributeId]++;
      s.notice = `${a.id[0].toUpperCase() + a.id.slice(1)} increased.`;
      break;
    }
    case "REST": {
      if (s.run || s.gold < restPrice(s)) break;
      s.gold -= restPrice(s);
      s.hp = stats(s).maxHp;
      s.energy = stats(s).maxEnergy;
      s.resolve += 25;
      s.day++;
      s.notice =
        "A warm meal. A dreamless sleep. Health and energy restored, +25 resolve.";
      log(s, "The Lantern & Thorn", s.notice, "story");
      break;
    }
    case "SHRINE": {
      if (s.run || s.gold < shrinePrice(s)) break;
      s.gold -= shrinePrice(s);
      s.resolve += 35;
      s.notice = "Your resolve is renewed. +35 resolve.";
      log(s, "A candle for tomorrow", s.notice, "story");
      break;
    }
    case "POTION": {
      if (s.combat || s.potions < 1 || s.hp >= stats(s).maxHp) break;
      s.potions--;
      s.hp += draughtHealing(s);
      s.notice = `Restored ${draughtHealing(s)} HP.`;
      break;
    }
    case "CLEAR_NOTICE":
      s.notice = "";
      break;
  }
  if (s.hp <= 0) defeat(s);
  clamp(s);
  return s;
}
export const SAVE_KEY = "ashen-vow-save-v1";
export function parseSave(raw: string): GameState | null {
  try {
    const s = JSON.parse(raw) as GameState;
    if (
      !s ||
      s.version !== 1 ||
      typeof s.name !== "string" ||
      !ORIGINS.some((o) => o.id === s.origin)
    )
      return null;
    const nums = [
      "level",
      "xp",
      "hp",
      "energy",
      "resolve",
      "gold",
      "potions",
      "statPoints",
      "skillPoints",
      "kills",
      "explored",
      "relics",
      "shrines",
      "reputation",
      "day",
      "seed",
    ] as const;
    if (
      nums.some((k) => !Number.isFinite(s[k])) ||
      s.level < 1 ||
      s.gold < 0 ||
      s.potions < 0 ||
      !s.attributes ||
      ["might", "will", "agility"].some(
        (k) => !Number.isFinite(s.attributes[k as AttributeId]),
      )
    )
      return null;
    if (
      !s.equipped ||
      Object.values(s.equipped).some(
        (id) => id !== null && !ITEMS.some((i) => i.id === id),
      )
    )
      return null;
    if (
      !s.questProgress ||
      !Array.isArray(s.inventory) ||
      s.inventory.some((id) => !ITEMS.some((i) => i.id === id)) ||
      !Array.isArray(s.skills) ||
      s.skills.some((id) => !SKILLS.some((k) => k.id === id))
    )
      return null;
    if (
      ["accepted", "completed", "claimed", "bosses", "journal"].some(
        (k) => !Array.isArray(s[k as keyof GameState]),
      )
    )
      return null;
    if (
      s.run &&
      (!BIOMES.some((b) => b.id === s.run!.biome) ||
        !Array.isArray(s.run.nodes) ||
        s.run.nodes.length < 17 ||
        s.run.nodes.length > 75 ||
        !s.run.nodes[s.run.current] ||
        s.run.nodes.some((n, i) => n.id !== i))
    )
      return null;
    if (
      s.combat &&
      (!s.run ||
        !ENEMIES.some((e) => e.id === s.combat!.enemyId) ||
        !Array.isArray(s.combat.log) ||
        !Number.isFinite(s.combat.hp))
    )
      return null;
    if (
      typeof s.notice !== "string" ||
      typeof s.ending !== "boolean" ||
      (s.activeQuest !== null && !QUESTS.some((q) => q.id === s.activeQuest))
    )
      return null;
    if (
      ["accepted", "completed", "claimed"].some((k) =>
        (s[k as "accepted"] as string[]).some(
          (id) => !QUESTS.some((q) => q.id === id),
        ),
      )
    )
      return null;
    if (
      s.bosses.some((id) => !ENEMIES.some((e) => e.id === id && e.boss)) ||
      Object.values(s.questProgress).some((v) => !Number.isFinite(v) || v < 0)
    )
      return null;
    if (
      s.journal.some(
        (j) =>
          !j ||
          typeof j.title !== "string" ||
          typeof j.text !== "string" ||
          !Number.isFinite(j.id) ||
          !Number.isFinite(j.day) ||
          !["story", "combat", "loot", "quest", "level"].includes(j.kind),
      )
    )
      return null;
    if (["weapon", "armor", "charm"].some((slot) => !(slot in s.equipped)))
      return null;
    if (s.run) {
      const r = s.run;
      if (r.eventId !== null && !EVENTS.some((e) => e.id === r.eventId))
        return null;
      if (
        !Number.isInteger(r.current) ||
        typeof r.bossDefeated !== "boolean" ||
        [r.rooms, r.gold, r.xp].some((v) => !Number.isFinite(v) || v < 0)
      )
        return null;
      if (
        r.nodes.some(
          (n) =>
            !n ||
            ![
              "entrance",
              "fight",
              "event",
              "loot",
              "camp",
              "boss",
              "exit",
              "puzzle",
              "hazard",
            ].includes(n.kind) ||
            typeof n.name !== "string" ||
            typeof n.visited !== "boolean" ||
            typeof n.resolved !== "boolean" ||
            !Number.isInteger(n.row) ||
            !Number.isInteger(n.col) ||
            n.row < 0 ||
            n.row > 26 ||
            n.col < 0 ||
            n.col > 2 ||
            (n.enemy !== null && !ENEMIES.some((e) => e.id === n.enemy)) ||
            (n.event !== null && !EVENTS.some((e) => e.id === n.event)),
        )
      )
        return null;
    }
    if (s.combat) {
      const c = s.combat;
      if (
        [c.hp, c.maxHp, c.attack, c.defense, c.turn, c.poison, c.ward].some(
          (v) => !Number.isFinite(v) || v < 0,
        ) ||
        c.maxHp < 1 ||
        (c.tacticOffset !== undefined &&
          (!Number.isInteger(c.tacticOffset) ||
            c.tacticOffset < 0 ||
            c.tacticOffset > 11)) ||
        (c.elite !== undefined && typeof c.elite !== "boolean") ||
        (c.draughtReadyTurn !== undefined &&
          (!Number.isInteger(c.draughtReadyTurn) || c.draughtReadyTurn < 0)) ||
        c.log.some((l) => typeof l !== "string")
      )
        return null;
    }
    const legacy = !s.counters;
    s.defeat ??= null;
    s.rewardedSupplies ??= { date: "", claimed: 0, receipts: [] };
    if (!validRewardRecord(s.rewardedSupplies)) return null;
    if (
      s.defeat &&
      (!Number.isInteger(s.defeat.lostGold) ||
        s.defeat.lostGold < 0 ||
        !Number.isInteger(s.defeat.turns) ||
        s.defeat.turns < 0 ||
        typeof s.defeat.text !== "string" ||
        s.run ||
        s.combat ||
        (s.defeat.enemy !== undefined &&
          !ENEMIES.some((e) => e.id === s.defeat!.enemy)) ||
        (s.defeat.biome !== undefined &&
          !BIOMES.some((b) => b.id === s.defeat!.biome)))
    )
      return null;
    s.flags ??= {};
    s.counters ??= {};
    s.resolvedEvents ??= [];
    s.tutorialDismissed ??= true;
    s.battleFx ??= null;
    if (
      typeof s.flags !== "object" ||
      Array.isArray(s.flags) ||
      Object.values(s.flags).some((v) => typeof v !== "string") ||
      typeof s.counters !== "object" ||
      Array.isArray(s.counters) ||
      Object.values(s.counters).some((v) => !Number.isFinite(v) || v < 0) ||
      !Array.isArray(s.resolvedEvents) ||
      s.resolvedEvents.some((id) => !EVENTS.some((e) => e.id === id)) ||
      typeof s.tutorialDismissed !== "boolean"
    )
      return null;
    if (legacy) {
      for (const id of s.bosses) s.counters[`boss:${id}`] = 1;
      if ((s.questProgress.pilgrim ?? 0) > 0) {
        s.counters["event:pilgrim"] = 1;
        s.resolvedEvents.push("pilgrim");
      }
      s.ending = s.completed.includes("new-sun");
    }
    if (s.run) {
      s.run.shortcuts ??= [];
      s.run.lastOutcome ??= null;
      if (
        !Array.isArray(s.run.shortcuts) ||
        s.run.shortcuts.some(
          (pair) =>
            !Array.isArray(pair) ||
            pair.length !== 2 ||
            pair.some((id) => !Number.isInteger(id) || !s.run!.nodes[id]),
        )
      )
        return null;
      if (
        s.run.lastOutcome &&
        (typeof s.run.lastOutcome.title !== "string" ||
          typeof s.run.lastOutcome.text !== "string" ||
          !["story", "combat", "loot", "rest"].includes(
            s.run.lastOutcome.kind,
          ) ||
          (s.run.lastOutcome.item &&
            !ITEMS.some((i) => i.id === s.run!.lastOutcome!.item)) ||
          (s.run.lastOutcome.enemy !== undefined &&
            !ENEMIES.some((e) => e.id === s.run!.lastOutcome!.enemy)) ||
          [s.run.lastOutcome.gold, s.run.lastOutcome.xp].some(
            (value) =>
              value !== undefined && (!Number.isFinite(value) || value < 0),
          ) ||
          [s.run.lastOutcome.items, s.run.lastOutcome.leftBehind].some(
            (ids) =>
              ids !== undefined &&
              (!Array.isArray(ids) ||
                ids.some((id) => !ITEMS.some((i) => i.id === id))),
          ) ||
          (s.run.lastOutcome.draughts !== undefined &&
            (!Number.isInteger(s.run.lastOutcome.draughts) ||
              s.run.lastOutcome.draughts < 0)))
      )
        return null;
    }
    if (
      s.battleFx &&
      ([
        s.battleFx.sequence,
        s.battleFx.damage,
        s.battleFx.incoming,
        s.battleFx.healed,
      ].some((v) => !Number.isFinite(v) || v < 0) ||
        typeof s.battleFx.action !== "string" ||
        !ENEMIES.some((e) => e.id === s.battleFx!.enemy))
    )
      return null;
    clamp(s);
    return s;
  } catch {
    return null;
  }
}
