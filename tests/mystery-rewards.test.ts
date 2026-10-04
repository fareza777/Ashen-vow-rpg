import test from "node:test";
import assert from "node:assert/strict";
import {
  createGame,
  reduceGame,
  parseSave,
  stats,
  type GameState,
} from "../src/engine";
import { ITEMS, QUESTS, ENEMIES } from "../src/data";
import { roomAppearance } from "../src/dungeonPresentation";

function room(kind: "fight" | "loot" | "boss" = "fight", seed = 41713) {
  let s = createGame();
  s = reduceGame(s, { type: "ENTER", biome: "catacombs" });
  s.seed = seed;
  const node = s.run!.nodes[1];
  node.kind = kind;
  node.enemy = kind === "boss" ? "warden" : "hound";
  node.event = null;
  return s;
}
function win(s: GameState) {
  s = reduceGame(s, { type: "MOVE", id: 1 });
  s.combat!.hp = 1;
  return reduceGame(s, { type: "COMBAT", action: "attack" });
}

test("unvisited rooms reveal no encounter kind in either route or map presentation", () => {
  const s = room();
  for (const kind of [
    "fight",
    "loot",
    "event",
    "boss",
    "exit",
    "camp",
    "hazard",
    "puzzle",
  ] as const) {
    const n = { ...s.run!.nodes[1], kind };
    const appearance = roomAppearance(n);
    assert.equal(appearance.kind, "unknown", kind);
    assert.equal(appearance.label, "Unexplored", kind);
    const known = roomAppearance({ ...n, visited: true });
    assert.equal(known.kind, kind);
  }
});

test("different new-vow seeds produce different opening crossings and preserve their generated map on reload", () => {
  const layouts = new Set<string>();
  for (let seed = 101; seed <= 116; seed++) {
    let s = createGame("Trial", "oathkeeper", seed);
    s = reduceGame(s, { type: "ENTER", biome: "catacombs" });
    layouts.add(
      s
        .run!.nodes.slice(1, 4)
        .map((n) => n.kind)
        .join(","),
    );
    assert.deepEqual(parseSave(JSON.stringify(s))!.run!.nodes, s.run!.nodes);
  }
  assert.ok(
    layouts.size >= 3,
    "opening order should not be a fixed combat/event/cache row",
  );
});

test("caches contain modest gold and occasional region-appropriate equipment, never guaranteed relics", () => {
  let equipment = 0;
  for (let seed = 1; seed <= 300; seed++) {
    const s = reduceGame(room("loot", seed * 41713), { type: "MOVE", id: 1 });
    const o = s.run!.lastOutcome!;
    assert.ok(
      (o.gold ?? 0) <= 20,
      "a single first-region cache should not fund a forge upgrade",
    );
    const ids = o.items ?? (o.item ? [o.item] : []);
    equipment += Number(ids.length > 0);
    assert.ok(
      ids.every((id) => ITEMS.find((i) => i.id === id)!.rarity !== "Legendary"),
    );
  }
  assert.ok(
    equipment >= 40 && equipment <= 120,
    `${equipment}/300 caches held equipment`,
  );
});

test("normal victories report every draught in their saved reward receipt", () => {
  let drops = 0;
  for (let seed = 1; seed <= 250; seed++) {
    const before = room("fight", seed * 41713);
    before.potions = 0;
    const s = win(before);
    assert.equal(s.run!.lastOutcome!.draughts ?? 0, s.potions);
    assert.ok((s.run!.lastOutcome!.gold ?? 0) <= 12);
    drops += Number(s.potions > 0);
    assert.ok(parseSave(JSON.stringify(s)));
  }
  assert.ok(drops >= 5 && drops <= 35, `${drops}/250 draught drops`);
});

test("duplicate quest equipment does not silently mint extra gold", () => {
  let s = createGame();
  const q = QUESTS.find((q) => q.id === "bell")!;
  s.accepted.push(q.id);
  s.completed.push(q.id);
  s.inventory.push(q.reward!);
  const before = s.gold;
  s = reduceGame(s, { type: "CLAIM", id: q.id });
  assert.equal(s.gold - before, q.gold);
});

test("repeat guardians do not regenerate their unique relic or full first-clear bounty", () => {
  const first = win(room("boss"));
  const revisit = room("boss");
  revisit.bosses.push("warden");
  const again = win(revisit);
  assert.ok(again.run!.lastOutcome!.gold! < first.run!.lastOutcome!.gold!);
  assert.equal(
    again.run!.lastOutcome!.items?.length ??
      Number(!!again.run!.lastOutcome!.item),
    0,
  );
  assert.ok(!again.inventory.includes("bellplate"));
});

test("a fatal battle leaves a persistent defeat acknowledgement with exact losses", () => {
  let s = reduceGame(room(), { type: "MOVE", id: 1 });
  s.hp = 1;
  s.combat!.attack = 999;
  const before = s.gold;
  s = reduceGame(s, { type: "COMBAT", action: "guard" });
  const defeat = s.defeat;
  assert.ok(defeat, "must not silently disappear into the town screen");
  assert.equal(defeat.enemy, "hound");
  assert.equal(defeat.lostGold, before - s.gold);
  assert.equal(s.run, null);
  const loaded = parseSave(JSON.stringify(s))!;
  assert.deepEqual(loaded.defeat, defeat);
  const acknowledged = reduceGame(loaded, { type: "ACK_DEFEAT" });
  assert.equal(acknowledged.defeat, null);
  assert.equal(acknowledged.gold, s.gold);
  assert.equal(acknowledged.hp, Math.ceil(stats(s).maxHp * 0.65));
});

test("encounters vary their opening rhythm but keep the next heavy move announced", () => {
  const openings = new Set<string>();
  for (let seed = 1; seed <= 24; seed++) {
    const s = reduceGame(room("fight", seed * 41713), { type: "MOVE", id: 1 });
    openings.add(s.combat!.log[0]);
    assert.ok(ENEMIES.some((e) => e.id === s.combat!.enemyId));
  }
  assert.ok(openings.size >= 3);
});

test("corrupted reward receipts and defeat summaries are rejected, while older saves still load", () => {
  const s = win(room());
  const invalid = [
    { items: ["missing-item"] },
    { items: "oathblade" },
    { draughts: -1 },
    { draughts: 1.5 },
    { gold: -9 },
    { enemy: "missing-enemy" },
  ];
  for (const receipt of invalid) {
    const changed = structuredClone(s);
    Object.assign(changed.run!.lastOutcome!, receipt);
    assert.equal(parseSave(JSON.stringify(changed)), null);
  }
  const legacy = structuredClone(s);
  delete legacy.defeat;
  delete legacy.run!.lastOutcome!.items;
  delete legacy.run!.lastOutcome!.draughts;
  assert.ok(parseSave(JSON.stringify(legacy)));
  const fallen = reduceGame({ ...room(), hp: 1 }, { type: "MOVE", id: 1 });
  fallen.combat!.attack = 999;
  const defeated = reduceGame(fallen, { type: "COMBAT", action: "guard" });
  defeated.defeat!.lostGold = -1;
  assert.equal(parseSave(JSON.stringify(defeated)), null);
});
