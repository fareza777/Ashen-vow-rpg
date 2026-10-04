import test from "node:test";
import assert from "node:assert/strict";
import { BIOMES, ITEMS, QUESTS, EVENTS, ENEMIES } from "../src/data";
import {
  createGame,
  reduceGame,
  parseSave,
  canMove,
  regionUnlocked,
} from "../src/engine";
import { SKILLS } from "../src/data";
import { choiceAvailable, stats } from "../src/engine";

test("all eight regions have varied regional crossings and no repeated puzzle on one map", () => {
  const s = createGame();
  s.claimed = QUESTS.map((q) => q.id);
  for (const b of BIOMES) {
    const run = reduceGame(s, { type: "ENTER", biome: b.id }).run!;
    assert.ok(EVENTS.some((e) => e.biome === b.id && e.kind === "puzzle"));
    assert.ok(EVENTS.some((e) => e.biome === b.id && e.kind === "hazard"));
    const crossings = run.nodes
      .filter((n) => n.kind === "puzzle" || n.kind === "hazard")
      .map((n) => n.event);
    assert.equal(new Set(crossings).size, crossings.length);
    assert.ok(parseSave(JSON.stringify({ ...s, run })));
  }
});

test("every active skill produces a real battle turn and feedback", () => {
  for (const skill of SKILLS.filter((k) => !k.passive)) {
    let s = reduceGame(createGame(), { type: "ENTER", biome: "catacombs" });
    s = reduceGame(s, { type: "MOVE", id: 1 });
    s.level = 20;
    s.skills = SKILLS.map((k) => k.id);
    s.energy = stats(s).maxEnergy;
    s.hp = Math.floor(stats(s).maxHp / 2);
    s.combat!.hp = 1000;
    s.combat!.maxHp = 1000;
    s.combat!.defense = 0;
    s.combat!.attack = 1;
    const energy = s.energy;
    s = reduceGame(s, { type: "COMBAT", action: skill.id });
    assert.equal(s.combat?.turn, 1, skill.id);
    assert.equal(s.battleFx?.action, skill.id);
    assert.equal(s.energy, energy - skill.cost);
    assert.ok(
      (s.battleFx?.damage ?? 0) > 0 ||
        (s.battleFx?.healed ?? 0) > 0 ||
        (s.combat?.ward ?? 0) > 0,
      skill.id,
    );
  }
});

test("all three endings make distinct lasting decisions", () => {
  const outcomes = [];
  for (const choice of [0, 1, 2]) {
    let s = createGame();
    s.claimed = ["custodian"];
    s.flags.heart = "shared";
    s = reduceGame(s, { type: "ACCEPT", id: "new-sun" });
    s = reduceGame(s, { type: "DECISION", id: "new-sun", choice });
    assert.ok(s.ending);
    outcomes.push(s.flags.ending);
    assert.ok(parseSave(JSON.stringify(s)));
  }
  assert.equal(new Set(outcomes).size, 3);
});

test("crossings cannot spend energy that the keeper does not have", () => {
  const s = createGame();
  s.energy = 0;
  assert.equal(
    choiceAvailable(s, EVENTS.find((e) => e.id === "moth-storm")!.choices[0]),
    false,
  );
  assert.equal(
    choiceAvailable(s, EVENTS.find((e) => e.id === "moth-storm")!.choices[1]),
    true,
  );
});

test("the expanded campaign and every generated equipment tile have valid references", () => {
  assert.equal(BIOMES.length, 8);
  assert.equal(QUESTS.filter((q) => q.type === "Main quest").length, 24);
  assert.ok(QUESTS.filter((q) => q.type === "Side quest").length >= 37);
  for (const slot of ["weapon", "armor", "charm"])
    assert.equal(ITEMS.filter((i) => i.slot === slot).length, 16);
  for (const list of [ITEMS, QUESTS, EVENTS, ENEMIES])
    assert.equal(new Set(list.map((x) => x.id)).size, list.length);
  for (const q of QUESTS) {
    if (q.requires) assert.ok(QUESTS.some((p) => p.id === q.requires));
    if (q.reward) assert.ok(ITEMS.some((i) => i.id === q.reward));
    if (q.objectiveKey?.startsWith("event:"))
      assert.ok(
        EVENTS.some((e) => `event:${e.marker ?? e.id}` === q.objectiveKey),
      );
    if (q.objectiveKey?.startsWith("boss:"))
      assert.ok(
        ENEMIES.some((e) => `boss:${e.id}` === q.objectiveKey && e.boss),
      );
  }
});

test("new expeditions are deep, connected, and differ across visits", () => {
  let s = reduceGame(createGame(), { type: "ENTER", biome: "catacombs" });
  assert.ok(s.run!.nodes.length >= 33);
  const first = s
    .run!.nodes.map((n) => `${n.kind}:${n.event}:${n.enemy}`)
    .join("|");
  assert.ok(s.run!.nodes.some((n) => n.kind === "puzzle"));
  assert.ok(s.run!.nodes.some((n) => n.kind === "hazard"));
  s = reduceGame(s, { type: "RETURN" });
  s = reduceGame(s, { type: "ENTER", biome: "catacombs" });
  assert.notEqual(
    first,
    s.run!.nodes.map((n) => `${n.kind}:${n.event}:${n.enemy}`).join("|"),
  );
  assert.ok(canMove(s, 1));
  assert.ok(!canMove(s, s.run!.nodes.length - 2));
});

test("an accepted investigation places reachable evidence and records it once", () => {
  let s = createGame();
  s.claimed.push("bell");
  s = reduceGame(s, { type: "ACCEPT", id: "drowned-ledger" });
  s = reduceGame(s, { type: "ENTER", biome: "catacombs" });
  assert.equal(s.run!.nodes[2].event, "ledger");
  s = reduceGame(s, { type: "MOVE", id: 2 });
  s = reduceGame(s, { type: "EVENT", choice: 0 });
  assert.ok(s.completed.includes("drowned-ledger"));
  assert.equal(s.counters["event:ledger"], 1);
  assert.ok(s.run!.lastOutcome?.text.includes("ledger"));
});

test("town decisions persist consequences and cannot be repeated for rewards", () => {
  let s = createGame();
  s.claimed.push("drowned-ledger");
  s = reduceGame(s, { type: "ACCEPT", id: "testimony" });
  s = reduceGame(s, { type: "DECISION", id: "testimony", choice: 0 });
  assert.equal(s.flags.ledger, "public");
  assert.equal(s.reputation, 2);
  s = reduceGame(s, { type: "DECISION", id: "testimony", choice: 0 });
  assert.equal(s.reputation, 2);
  assert.equal(parseSave(JSON.stringify(s))?.flags.ledger, "public");
  assert.ok(
    regionUnlocked(
      reduceGame(s, { type: "CLAIM", id: "testimony" }),
      "thornwild",
    ),
  );
});

test("the third ending requires carrying the shared burden", () => {
  let s = createGame();
  s.claimed.push("custodian");
  s = reduceGame(s, { type: "ACCEPT", id: "new-sun" });
  s = reduceGame(s, { type: "DECISION", id: "new-sun", choice: 2 });
  assert.equal(s.ending, false);
  s.flags.heart = "shared";
  s = reduceGame(s, { type: "DECISION", id: "new-sun", choice: 2 });
  assert.equal(s.flags.ending, "shared");
  assert.equal(s.ending, true);
  assert.ok(s.completed.includes("new-sun"));
});

test("older saves receive expansion fields without losing equipment or progress", () => {
  const old = createGame() as any;
  for (const key of [
    "flags",
    "counters",
    "resolvedEvents",
    "tutorialDismissed",
    "battleFx",
  ])
    delete old[key];
  old.ending = true;
  old.claimed = ["bell"];
  old.bosses = ["warden"];
  const migrated = parseSave(JSON.stringify(old));
  assert.ok(migrated);
  assert.equal(migrated.ending, false);
  assert.equal(migrated.counters["boss:warden"], 1);
  assert.equal(migrated.equipped.weapon, "rust-sword");
});
