import { test } from "node:test";
import assert from "node:assert/strict";
import { ITEMS, QUESTS, SKILLS, EVENTS } from "../src/data";
import {
  createGame,
  reduceGame,
  stats,
  availableAct,
  choiceAvailable,
  parseSave,
  neighbors,
} from "../src/engine";
import type { GameState } from "../src/engine";
import { draughtPrice, restPrice } from "../src/economy";
import {
  enemyMove,
  draughtRecovery,
  itemAct,
  skillLevel,
  SATCHEL_CAPACITY,
} from "../src/challenge";

function prepare(s: GameState) {
  for (const side of QUESTS.filter(
    (q) =>
      q.type === "Side quest" &&
      (!q.requires || s.claimed.includes(q.requires)),
  )) {
    if (!s.accepted.includes(side.id))
      s = reduceGame(s, { type: "ACCEPT", id: side.id });
    if (s.completed.includes(side.id) && !s.claimed.includes(side.id))
      s = reduceGame(s, { type: "CLAIM", id: side.id });
  }
  while (s.statPoints) s = reduceGame(s, { type: "ATTRIBUTE", id: "might" });
  for (const id of [
    "cleave",
    "mend",
    "vigor",
    "execution",
    "ironwill",
    "guardian",
    "mists",
  ]) {
    const k = SKILLS.find((k) => k.id === id)!;
    if (
      s.level >= skillLevel(k.tier) &&
      s.skillPoints >= k.tier &&
      !s.skills.includes(id)
    )
      s = reduceGame(s, { type: "LEARN", id });
  }
  const supplies = Math.min(
    SATCHEL_CAPACITY,
    3 + Math.floor(availableAct(s) / 3),
  );
  const reserve =
    Math.max(0, supplies - s.potions) * draughtPrice(s) + restPrice(s);
  for (const slot of ["weapon", "armor", "charm"] as const) {
    const score = (id: string) => {
      const i = ITEMS.find((i) => i.id === id)!;
      return (
        (i.attack ?? 0) * 3 +
        (i.defense ?? 0) * 4 +
        (i.hp ?? 0) * 0.4 +
        (i.crit ?? 0) * 0.2
      );
    };
    const stock = ITEMS.filter(
      (i) =>
        i.slot === slot &&
        i.price >= 50 &&
        itemAct(i) <= availableAct(s) &&
        (s.claimed.includes("bell") || i.rarity !== "Rare") &&
        i.price <= s.gold - reserve,
    ).sort((a, b) => score(b.id) - score(a.id));
    if (stock[0] && !s.inventory.includes(stock[0].id))
      s = reduceGame(s, { type: "BUY", id: stock[0].id });
    const best = s.inventory
      .filter((id) => ITEMS.find((i) => i.id === id)?.slot === slot)
      .sort((a, b) => score(b) - score(a))[0];
    if (best) s = reduceGame(s, { type: "EQUIP", id: best });
  }
  while (s.potions < supplies && s.gold >= draughtPrice(s) + restPrice(s))
    s = reduceGame(s, { type: "BUY", id: "potion" });
  if (s.hp < stats(s).maxHp || s.energy < stats(s).maxEnergy)
    s = reduceGame(s, { type: "REST" });
  return s;
}

export function walk(s: GameState, target: number) {
  const r = s.run!;
  const paths: number[][] = [[r.current]],
    seen = new Set([r.current]);
  let path: number[] = [];
  while (paths.length) {
    const p = paths.shift()!,
      at = p[p.length - 1];
    if (at === target) {
      path = p;
      break;
    }
    for (const n of neighbors({ ...r, current: at }))
      if (!seen.has(n) && r.nodes[n].kind !== "exit") {
        seen.add(n);
        paths.push([...p, n]);
      }
  }
  assert.ok(path.length, "Destination reachable");
  for (const id of path.slice(1)) {
    s = reduceGame(s, { type: "MOVE", id });
    if (s.run?.eventId) {
      const e = EVENTS.find((e) => e.id === s.run!.eventId)!;
      const choice = e.choices.findIndex((c) => choiceAvailable(s, c));
      assert.ok(choice >= 0);
      s = reduceGame(s, { type: "EVENT", choice });
    }
    for (let turn = 0; s.combat && turn < 180; turn++) {
      const st = stats(s),
        c = s.combat;
      const action =
        enemyMove(c).index === 2
          ? "guard"
          : s.hp < st.maxHp * 0.6 && s.potions && !draughtRecovery(c)
            ? "potion"
            : s.hp < st.maxHp * 0.55 &&
                s.skills.includes("mists") &&
                s.energy >= 9
              ? "mists"
              : enemyMove(c).index === 1 &&
                  s.hp < st.maxHp * 0.6 &&
                  s.skills.includes("mend") &&
                  s.energy >= 6
                ? "mend"
                : c.hp < c.maxHp * 0.3 &&
                    s.skills.includes("execution") &&
                    s.energy >= 8
                  ? "execution"
                  : s.skills.includes("cleave") && s.energy >= 5
                    ? "cleave"
                    : s.energy >= 4
                      ? "power"
                      : enemyMove(c).index === 1
                        ? "focus"
                        : "attack";
      s = reduceGame(s, { type: "COMBAT", action });
    }
    assert.ok(
      s.run,
      `Survives room ${id} in ${r.biome} · level ${s.level} · gear ${Object.values(s.equipped).join(", ")} · ${s.gold} gold · ${s.potions} draughts`,
    );
    assert.equal(s.combat, null, "Battle terminates");
  }
  return s;
}

test("all 24 main quests can be completed through real movement, supplies, builds and decisions", () => {
  let s = createGame();
  for (const q of QUESTS.filter((q) => q.type === "Main quest")) {
    s = prepare(s);
    s = reduceGame(s, { type: "ACCEPT", id: q.id });
    assert.ok(s.accepted.includes(q.id), `Accept ${q.id}`);
    if (q.scene)
      s = reduceGame(s, {
        type: "DECISION",
        id: q.id,
        choice: q.id === "borrowed-heart" ? 0 : q.id === "new-sun" ? 2 : 0,
      });
    else if (!s.completed.includes(q.id)) {
      s = reduceGame(s, { type: "ENTER", biome: q.biome! });
      assert.ok(s.run);
      if (q.objectiveKey?.startsWith("boss:")) {
        // Scout the lower paths, bank completed side vows, then prepare for the guardian.
        const beforeBoss = s.run!.nodes.find((n) => n.kind === "boss")!.row - 1;
        s = walk(
          s,
          s.run!.nodes.find((n) => n.row === beforeBoss && n.col === 1)!.id,
        );
        s = reduceGame(s, { type: "RETURN" });
        s = prepare(s);
        s = reduceGame(s, { type: "ACCEPT", id: q.id });
        s = reduceGame(s, { type: "ENTER", biome: q.biome! });
      }
      const targets =
        q.objectiveKey === "ritual:seals"
          ? s
              .run!.nodes.filter((n) => n.event?.startsWith("seal-"))
              .map((n) => n.id)
          : q.objectiveKey?.startsWith("event:")
            ? [
                s.run!.nodes.find((n) => n.event === q.objectiveKey!.slice(6))!
                  .id,
              ]
            : [s.run!.nodes.find((n) => n.kind === "boss")!.id];
      for (const id of targets) s = walk(s, id);
      s = reduceGame(s, { type: "RETURN" });
    }
    assert.ok(s.completed.includes(q.id), `Objective completed: ${q.id}`);
    s = reduceGame(s, { type: "CLAIM", id: q.id });
    assert.ok(s.claimed.includes(q.id));
    assert.ok(parseSave(JSON.stringify(s)), `Valid save after ${q.id}`);
  }
  assert.equal(s.ending, true);
  assert.equal(s.flags.ending, "shared");
  assert.equal(s.bosses.length, 8);
  assert.ok(s.level >= 15);
});
