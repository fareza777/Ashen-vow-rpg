import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { GameContext } from "../src/context";
import { Dungeon } from "../src/Dungeon";
import { createGame, reduceGame, stats, type GameState } from "../src/engine";

function encounter() {
  let game = reduceGame(createGame(), { type: "ENTER", biome: "catacombs" });
  game.run!.nodes[1].kind = "fight";
  game.run!.nodes[1].enemy = "hound";
  game = reduceGame(game, { type: "MOVE", id: 1 });
  game.hp = 1;
  game.combat!.attack = 1;
  return game;
}
function potionButton(game: GameState) {
  const html = renderToStaticMarkup(
    createElement(
      GameContext.Provider,
      {
        value: { game, act() {}, go() {}, open() {}, screen: "dungeon" },
      },
      createElement(Dungeon),
    ),
  );
  const button = [...html.matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/g)]
    .map((match) => match[0])
    .find((button) => /<strong>Draught ×\d+<\/strong>/.test(button));
  assert.ok(button, "battle must show an explicit Draught button with stock");
  return button;
}

test("the battle potion is visible, consumes one turn, heals and shows recovery before another drink", () => {
  const game = encounter();
  assert.match(potionButton(game), /Draught ×3/);
  assert.doesNotMatch(potionButton(game), /disabled=/);
  const drank = reduceGame(game, { type: "COMBAT", action: "potion" });
  assert.equal(drank.potions, 2);
  assert.equal(drank.combat!.turn, game.combat!.turn + 1);
  assert.ok(drank.hp > game.hp);
  assert.ok(drank.battleFx!.healed > 0);
  assert.match(potionButton(drank), /Draught ×2/);
  assert.match(potionButton(drank), /Ready in 2 turns/);
  assert.match(potionButton(drank), /disabled=/);
  const spam = reduceGame(drank, { type: "COMBAT", action: "potion" });
  assert.equal(spam.potions, 2);
  assert.equal(spam.combat!.turn, drank.combat!.turn);
  const recovered = reduceGame(
    reduceGame(drank, { type: "COMBAT", action: "guard" }),
    { type: "COMBAT", action: "guard" },
  );
  assert.doesNotMatch(potionButton(recovered), /disabled=/);
});

test("empty stock and full health give a clear reason instead of consuming a potion", () => {
  const empty = encounter();
  empty.potions = 0;
  assert.match(potionButton(empty), /No draughts left/);
  assert.match(potionButton(empty), /disabled=/);
  assert.equal(
    reduceGame(empty, { type: "COMBAT", action: "potion" }).combat!.turn,
    empty.combat!.turn,
  );
  const full = encounter();
  full.hp = stats(full).maxHp;
  assert.match(potionButton(full), /HP full/);
  assert.match(potionButton(full), /disabled=/);
  assert.equal(
    reduceGame(full, { type: "COMBAT", action: "potion" }).potions,
    3,
  );
});
