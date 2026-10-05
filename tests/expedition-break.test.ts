import test from "node:test";
import assert from "node:assert/strict";
import { createGame, reduceGame, parseSave } from "../src/engine";
import { completedExpedition } from "../src/dungeonPresentation";

function expedition(rooms: number) {
  const game = reduceGame(createGame(), { type: "ENTER", biome: "catacombs" });
  game.run!.rooms = rooms;
  const node = game.run!.nodes[1];
  node.kind = "fight";
  node.enemy = "hound";
  node.event = null;
  return game;
}

test("a safe return keeps the explored room count for the ad placement", () => {
  const exploring = expedition(6);
  const returned = reduceGame(exploring, { type: "RETURN" });
  assert.deepEqual(completedExpedition(exploring, returned), {
    key: `return-${returned.day}-${returned.seed}`,
    rooms: 6,
  });
});

test("death waits for acknowledgement and preserves the expedition length across reload", () => {
  let battle = reduceGame(expedition(7), { type: "MOVE", id: 1 });
  battle.hp = 1;
  battle.combat!.attack = 999;
  const fallen = reduceGame(battle, { type: "COMBAT", action: "guard" });
  assert.equal(fallen.defeat!.rooms, 8);
  assert.equal(
    completedExpedition(battle, fallen),
    null,
    "no ad over the defeat story",
  );
  const loaded = parseSave(JSON.stringify(fallen))!;
  assert.equal(loaded.defeat!.rooms, 8);
  const returned = reduceGame(loaded, { type: "ACK_DEFEAT" });
  assert.deepEqual(completedExpedition(loaded, returned), {
    key: `return-${returned.day}-${returned.seed}`,
    rooms: 8,
  });
  assert.equal(
    completedExpedition(returned, returned),
    null,
    "town navigation is not an expedition",
  );
});

test("short and legacy defeat records cannot manufacture explored rooms", () => {
  const short = expedition(2);
  assert.equal(
    completedExpedition(short, reduceGame(short, { type: "RETURN" }))?.rooms,
    2,
  );
  const legacy = createGame();
  legacy.defeat = { lostGold: 0, turns: 1, text: "The lantern faded." };
  const loaded = parseSave(JSON.stringify(legacy))!;
  assert.ok(loaded);
  assert.equal(
    completedExpedition(loaded, reduceGame(loaded, { type: "ACK_DEFEAT" }))
      ?.rooms,
    0,
  );
});

test("invalid saved defeat room counts are rejected", () => {
  const game = createGame();
  for (const rooms of [-1, 1.5, "6", null]) {
    game.defeat = {
      lostGold: 0,
      turns: 1,
      text: "The lantern faded.",
      rooms,
    } as any;
    assert.equal(parseSave(JSON.stringify(game)), null, String(rooms));
  }
});
