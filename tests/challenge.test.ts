import test from "node:test";
import assert from "node:assert/strict";
import {
  createGame,
  reduceGame,
  stats,
  parseSave,
  xpRequired,
} from "../src/engine";
import { QUESTS } from "../src/data";
import { bossTrial } from "./challenge-profiles";

function encounter(biome = "catacombs", enemy = "hound", boss = false) {
  let s = createGame();
  s.claimed = QUESTS.filter((q) => q.type === "Main quest").map((q) => q.id);
  s = reduceGame(s, { type: "ENTER", biome: biome as "catacombs" });
  const node = boss
    ? s.run!.nodes.find((n) => n.kind === "boss")!
    : s.run!.nodes[1];
  node.enemy = enemy;
  if (boss)
    s.run!.current = s.run!.nodes.find(
      (n) => n.row === node.row - 1 && n.col === 1,
    )!.id;
  return reduceGame(s, { type: "MOVE", id: node.id });
}

test("starting equipment and a tier-one skill cannot erase a fresh encounter in one lucky strike", () => {
  for (const seed of [1, 41713, 100, 999]) {
    let s = encounter();
    s.skills.push("cleave");
    s.seed = seed;
    s = reduceGame(s, { type: "COMBAT", action: "cleave" });
    assert.ok(s.combat && s.combat.hp > 0, `one-shot at seed ${seed}`);
  }
});
test("the forge does not sell late chapter relics to a new keeper", () => {
  const s = createGame();
  s.gold = 9999;
  for (const id of [
    "sunless-edge",
    "first-light",
    "sovereign-veil",
    "thorn-dagger",
  ]) {
    const bought = reduceGame(s, { type: "BUY", id });
    assert.equal(bought.gold, s.gold, id);
    assert.ok(!bought.inventory.includes(id), id);
  }
});
test("a familiar enemy in a late region remains a threat without scaling to player level", () => {
  const early = encounter("catacombs", "oracle");
  const late = encounter("engine", "oracle");
  assert.ok(late.combat!.maxHp > early.combat!.maxHp * 3);
  assert.ok(late.combat!.attack > early.combat!.attack * 3);
  const veteran = structuredClone(late);
  veteran.level = 30;
  assert.equal(veteran.combat!.attack, late.combat!.attack);
});
test("healing requires recovery turns and buying supplies respects satchel capacity", () => {
  let s = encounter("engine", "custodian");
  s.combat!.attack = 1;
  s.hp = 1;
  s = reduceGame(s, { type: "COMBAT", action: "potion" });
  const once = s;
  s = reduceGame(s, { type: "COMBAT", action: "potion" });
  assert.equal(s.potions, once.potions);
  assert.equal(s.combat!.turn, once.combat!.turn);
  assert.ok(parseSave(JSON.stringify(s)));
  const town = createGame();
  town.gold = 999;
  town.potions = 6;
  assert.equal(reduceGame(town, { type: "BUY", id: "potion" }).potions, 6);
});
test("later levels take materially more experience than the original linear curve", () => {
  assert.ok(xpRequired(15) >= 950);
});
test("battle logs warn before a heavy blow and vary between enemy tactics", () => {
  const a = encounter("catacombs", "hound");
  const b = encounter("catacombs", "oracle");
  a.combat!.hp = b.combat!.hp = 1000;
  a.combat!.maxHp = b.combat!.maxHp = 1000;
  a.hp = b.hp = 1000;
  const aa = reduceGame(reduceGame(a, { type: "COMBAT", action: "guard" }), {
    type: "COMBAT",
    action: "guard",
  });
  const bb = reduceGame(b, { type: "COMBAT", action: "guard" });
  assert.match(aa.combat!.log.join(" "), /prepares|gather|recover|heavy/i);
  assert.notEqual(aa.combat!.log[0], bb.combat!.log[0]);
});

test("a guardian's phase announcement appears once on crossing half health", () => {
  let s = encounter("catacombs", "warden", true);
  s.combat!.hp = s.combat!.maxHp / 2 + 1;
  s.combat!.attack = 1;
  s.combat!.defense = 0;
  s = reduceGame(s, { type: "COMBAT", action: "attack" });
  const announcements = (state: typeof s) => state.combat!.log.filter(line => line.includes("oath breaks")).length;
  assert.equal(announcements(s), 1);
  for (let i = 0; i < 4; i++) s = reduceGame(s, { type: "COMBAT", action: "guard" });
  assert.equal(announcements(s), 1);
});

test("draught history reports actual healing when close to full health", () => {
  let s = encounter();
  s.hp = stats(s).maxHp - 2;
  s = reduceGame(s, { type: "COMBAT", action: "potion" });
  assert.ok(s.combat!.log.includes("Healing draught · restored 2 HP"));
  assert.equal(s.battleFx!.healed, 2);
});

test("legal Steel, Ember and Shadow builds can survive early, middle and final guardians by reading battle warnings", () => {
  for (const region of [0, 3, 7])
    for (const build of ["Steel", "Ember", "Shadow"] as const) {
      const trials = Array.from({ length: 12 }, (_, i) =>
        bossTrial(region, build, 41713 * (i + 1)),
      );
      assert.ok(
        trials.filter((t) => t.won).length >= 10,
        `${build} region ${region + 1} survival`,
      );
      assert.ok(
        trials.every((t) => t.turns >= 5 && t.turns < 60),
        `${build} region ${region + 1} encounter length`,
      );
      assert.ok(
        trials.every((t) => t.guards > 0),
        "heavy blows need tactical turns",
      );
      if (region === 7)
        assert.ok(
          trials.every((t) => t.potions > 0),
          "final guardian spends finite supplies",
        );
      assert.ok(
        trials.every((t) => parseSave(JSON.stringify(t.state))),
        "trial saves remain valid",
      );
    }
});

test("ignoring heavy warnings costs materially more health than reacting, even with a fully prepared late build", () => {
  const smart = Array.from({ length: 12 }, (_, i) =>
    bossTrial(7, "Steel", 41713 * (i + 1)),
  );
  const reckless = Array.from({ length: 12 }, (_, i) =>
    bossTrial(7, "Steel", 41713 * (i + 1), false),
  );
  assert.ok(
    reckless.filter((t) => t.won).length < smart.filter((t) => t.won).length,
  );
  assert.ok(
    reckless.reduce((n, t) => n + t.damage, 0) >
      smart.reduce((n, t) => n + t.damage, 0),
  );
});

test("a level gain restores a small amount of energy rather than refilling the entire late-game reservoir", () => {
  let s = encounter();
  s.level = 12;
  s.xp = xpRequired(12) - 1;
  s.energy = 0;
  s.combat!.hp = 1;
  s = reduceGame(s, { type: "COMBAT", action: "attack" });
  assert.equal(s.level, 13);
  assert.ok(s.energy < stats(s).maxEnergy / 2);
});

test('an older save preserves progress while clamping resources to the rebalanced maxima', () => {
  const s=createGame();s.hp=999;s.energy=999;s.gold=845;s.potions=20;s.skills.push('cleave');
  const loaded=parseSave(JSON.stringify(s))!;
  assert.equal(loaded.hp,stats(loaded).maxHp);
  assert.equal(loaded.energy,stats(loaded).maxEnergy);
  assert.equal(loaded.gold,845);assert.equal(loaded.potions,20);assert.ok(loaded.skills.includes('cleave'));
});
