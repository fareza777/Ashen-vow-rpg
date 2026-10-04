import { test } from "node:test";
import assert from "node:assert/strict";
import { EVENTS, QUESTS } from "../src/data";
import {
  createGame,
  reduceGame,
  canMove,
  neighbors,
  parseSave,
} from "../src/engine";
import { narrativePages, reachableRooms } from "../src/dungeonPresentation";

test("paged narration preserves every word across all encounters and campaign decisions", () => {
  const texts = [
    ...EVENTS.map((e) => e.text),
    ...QUESTS.flatMap((q) => (q.scene ? [q.scene.text] : [])),
  ];
  for (const text of texts)
    for (const target of [24, 38, 46]) {
      const pages = narrativePages(text, target);
      assert.equal(pages.join(" "), text.trim().replace(/\s+/g, " "));
      assert.ok(pages.every((p) => p.split(/\s+/).length <= target));
    }
  const long = Array.from({ length: 200 }, (_, i) => `word${i}`).join(" ");
  assert.equal(narrativePages(long).join(" "), long);
  assert.deepEqual(narrativePages(""), [""]);
});

test("thumb navigation retains every legal branch, backtrack and shortcut, respecting encounter and boss locks", () => {
  let game = reduceGame(createGame(), { type: "ENTER", biome: "catacombs" });
  assert.ok(game.run);
  const run = game.run!;
  run.shortcuts = [[4, 16]];
  for (const node of run.nodes) {
    run.current = node.id;
    const expected = [...new Set(neighbors(run))]
      .filter((id) => canMove(game, id))
      .sort((a, b) => a - b);
    const actual = reachableRooms(game)
      .map((n) => n.id)
      .sort((a, b) => a - b);
    assert.deepEqual(actual, expected, `Room ${node.id} exposes every route`);
  }
  run.current = 4;
  assert.ok(
    reachableRooms(game).some((n) => n.id === 16),
    "shortcut remains accessible",
  );
  run.eventId = "pilgrim";
  assert.deepEqual(reachableRooms(game), []);
  run.eventId = null;
  run.current = run.nodes.find((n) => n.kind === "boss")!.id;
  assert.ok(!reachableRooms(game).some((n) => n.kind === "exit"));
  run.bossDefeated = true;
  assert.ok(reachableRooms(game).some((n) => n.kind === "exit"));
});

test("continuing after a reward saves the map view without awarding the loot twice", () => {
  let game = reduceGame(createGame(), { type: "ENTER", biome: "catacombs" });
  game = reduceGame(game, { type: "MOVE", id: 3 });
  assert.equal(game.run?.lastOutcome?.kind, "loot");
  const before = {
    gold: game.gold,
    xp: game.xp,
    inventory: game.inventory,
    rooms: game.run!.rooms,
    current: game.run!.current,
    journal: game.journal,
  };
  game = reduceGame(game, { type: "ACK_OUTCOME" });
  game = parseSave(JSON.stringify(game))!;
  assert.ok(game);
  assert.equal(
    game.run?.lastOutcome,
    null,
    "the acknowledged result does not replay on load",
  );
  assert.deepEqual(
    {
      gold: game.gold,
      xp: game.xp,
      inventory: game.inventory,
      rooms: game.run!.rooms,
      current: game.run!.current,
      journal: game.journal,
    },
    before,
  );
});
