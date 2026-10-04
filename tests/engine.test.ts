import { test } from "node:test";
import assert from "node:assert/strict";
import { enemyMove, draughtRecovery } from "../src/challenge";
import {
  createGame,
  reduceGame,
  stats,
  parseSave,
  regionUnlocked,
  draughtHealing,
} from "../src/engine";

test("rescuing someone before accepting their side quest still fulfills the vow", () => {
  let s = createGame();
  s = reduceGame(s, { type: "ENTER", biome: "catacombs" });
  s = reduceGame(s, { type: "MOVE", id: 2 });
  s = reduceGame(s, { type: "EVENT", choice: 0 });
  s = reduceGame(s, { type: "RETURN" });
  s = reduceGame(s, { type: "ACCEPT", id: "pilgrim" });
  assert.ok(s.completed.includes("pilgrim"));
});

test("a quest can be accepted and starts a traversable dungeon", () => {
  let s = createGame();
  s = reduceGame(s, { type: "ACCEPT", id: "bell" });
  s = reduceGame(s, { type: "ENTER", biome: "catacombs" });
  assert.equal(s.activeQuest, "bell");
  assert.ok(s.run?.nodes.length >= 15);
  assert.equal(s.run.current, 0);
});
test("locked regions cannot be entered before progression", () => {
  const s = createGame();
  assert.equal(reduceGame(s, { type: "ENTER", biome: "spire" }).run, null);
});
test("combat consumes energy, enemy responds and victory grants experience", () => {
  let s = createGame();
  s = reduceGame(s, { type: "ACCEPT", id: "bell" });
  s = reduceGame(s, { type: "ENTER", biome: "catacombs" });
  s = reduceGame(s, { type: "MOVE", id: 1 });
  assert.ok(s.combat);
  const before = s.energy;
  s = reduceGame(s, { type: "COMBAT", action: "power" });
  assert.ok(s.energy < before);
  for (let i = 0; i < 30 && s.combat; i++)
    s = reduceGame(s, { type: "COMBAT", action: "attack" });
  assert.equal(s.combat, null);
  assert.ok(s.xp > 0 || s.level > 1);
  assert.ok(s.kills > 0);
});
test("a meaningful event choice changes reputation and records its consequence", () => {
  let s = createGame();
  s = reduceGame(s, { type: "ENTER", biome: "catacombs" });
  s = reduceGame(s, { type: "MOVE", id: 2 });
  s = reduceGame(s, { type: "EVENT", choice: 0 });
  assert.ok(s.reputation > 0);
  assert.ok(s.journal.length > 1);
});
test("equipment purchases deduct gold and equipping changes combat stats", () => {
  let s = createGame();
  const before = stats(s).attack;
  s = reduceGame(s, { type: "BUY", id: "oathblade" });
  assert.ok(s.gold < 120);
  s = reduceGame(s, { type: "EQUIP", id: "oathblade" });
  assert.ok(stats(s).attack > before);
});
test("an expedition completes the quest, rewards are claimed once and region unlocks", () => {
  let s = createGame();
  s = reduceGame(s, { type: "ACCEPT", id: "bell" });
  s = reduceGame(s, { type: "ENTER", biome: "catacombs" });
  const boss = s.run!.nodes.find((n) => n.kind === "boss")!;
  s.run!.current = s.run!.nodes.find(
    (n) => n.row === boss.row - 1 && n.col === 1,
  )!.id;
  s.hp = stats(s).maxHp;
  s.potions = 20;
  s = reduceGame(s, { type: "MOVE", id: boss.id });
  for (let i = 0; i < 100 && s.combat; i++)
    s = reduceGame(s, {
      type: "COMBAT",
      action:
        enemyMove(s.combat!).index === 2
          ? "guard"
          : s.hp < 30 && s.potions && !draughtRecovery(s.combat!)
            ? "potion"
            : s.energy >= 4
              ? "power"
              : "attack",
    });
  assert.ok(s.completed.includes("bell"));
  s = reduceGame(s, { type: "RETURN" });
  s = reduceGame(s, { type: "CLAIM", id: "bell" });
  const gold = s.gold;
  s = reduceGame(s, { type: "CLAIM", id: "bell" });
  assert.equal(s.gold, gold);
  assert.equal(
    regionUnlocked(s, "thornwild"),
    false,
    "Evidence and testimony are still required",
  );
  s = reduceGame(s, { type: "ACCEPT", id: "drowned-ledger" });
  s = reduceGame(s, { type: "ENTER", biome: "catacombs" });
  s = reduceGame(s, { type: "MOVE", id: 2 });
  s = reduceGame(s, { type: "EVENT", choice: 0 });
  s = reduceGame(s, { type: "RETURN" });
  s = reduceGame(s, { type: "CLAIM", id: "drowned-ledger" });
  s = reduceGame(s, { type: "ACCEPT", id: "testimony" });
  s = reduceGame(s, { type: "DECISION", id: "testimony", choice: 0 });
  s = reduceGame(s, { type: "CLAIM", id: "testimony" });
  assert.ok(regionUnlocked(s, "thornwild"));
});
test("level rewards allow permanent attribute investment", () => {
  let s = createGame();
  s.statPoints = 2;
  const before = s.attributes.might;
  s = reduceGame(s, { type: "ATTRIBUTE", id: "might" });
  assert.equal(s.statPoints, 1);
  assert.equal(s.attributes.might, before + 1);
});
test("local saves round-trip active encounters and reject corrupted saves", () => {
  let s = createGame();
  s = reduceGame(s, { type: "ENTER", biome: "catacombs" });
  s = reduceGame(s, { type: "MOVE", id: 1 });
  const loaded = parseSave(JSON.stringify(s));
  assert.deepEqual(loaded, s);
  assert.equal(parseSave("{broken"), null);
  assert.equal(parseSave('{"version":1}'), null);
});

test("damaged encounter or journal data is rejected before it can crash a saved journey", () => {
  let s = createGame();
  s = reduceGame(s, { type: "ENTER", biome: "catacombs" });
  const malformed = structuredClone(s);
  malformed.run!.eventId = "missing-event";
  assert.equal(parseSave(JSON.stringify(malformed)), null);
  const damaged = structuredClone(s);
  damaged.journal[0].text = {} as string;
  assert.equal(parseSave(JSON.stringify(damaged)), null);
  const badNode = structuredClone(s);
  badNode.run!.nodes[2].kind = "unknown" as "fight";
  assert.equal(parseSave(JSON.stringify(badNode)), null);
});
test("unaffordable and already owned purchases cannot remove gold", () => {
  let s = createGame();
  s = reduceGame(s, { type: "BUY", id: "sunless-edge" });
  assert.equal(s.gold, 120);
  s = reduceGame(s, { type: "BUY", id: "oathblade" });
  const gold = s.gold;
  s = reduceGame(s, { type: "BUY", id: "oathblade" });
  assert.equal(s.gold, gold);
});
test("moving to a disconnected room cannot bypass exploration", () => {
  let s = createGame();
  s = reduceGame(s, { type: "ENTER", biome: "catacombs" });
  s = reduceGame(s, { type: "MOVE", id: 13 });
  assert.equal(s.run!.current, 0);
  assert.equal(s.combat, null);
});
test("zero energy does not permit a free heavy strike or enemy turn", () => {
  let s = createGame();
  s = reduceGame(s, { type: "ENTER", biome: "catacombs" });
  s = reduceGame(s, { type: "MOVE", id: 1 });
  s.energy = 0;
  const hp = s.combat!.hp;
  s = reduceGame(s, { type: "COMBAT", action: "power" });
  assert.equal(s.combat!.hp, hp);
  assert.equal(s.combat!.turn, 0);
});
test("retreat from a guardian is blocked and healing draughts stay finite", () => {
  let s = createGame();
  s = reduceGame(s, { type: "ENTER", biome: "catacombs" });
  const boss = s.run!.nodes.find((n) => n.kind === "boss")!;
  s.run!.current = s.run!.nodes.find(
    (n) => n.row === boss.row - 1 && n.col === 1,
  )!.id;
  s = reduceGame(s, { type: "MOVE", id: boss.id });
  const hp = s.hp;
  s = reduceGame(s, { type: "COMBAT", action: "flee" });
  assert.ok(s.combat);
  assert.equal(s.hp, hp);
  s.potions = 0;
  s = reduceGame(s, { type: "COMBAT", action: "potion" });
  assert.equal(s.potions, 0);
  assert.equal(s.hp, hp);
});
test("healing scales with progression and high-tier builds change real stats", () => {
  let s = createGame();
  s.level = 13;
  s.skillPoints = 15;
  const before = stats(s);
  for (const id of ["guardian", "ironwill", "kindle"])
    s = reduceGame(s, { type: "LEARN", id });
  assert.equal(stats(s).maxHp, before.maxHp + 35);
  assert.equal(stats(s).defense, before.defense + 5);
  assert.equal(draughtHealing(s), 82);
  s.hp = 1;
  s = reduceGame(s, { type: "POTION" });
  assert.equal(s.hp, 83);
  assert.equal(s.potions, 2);
});
