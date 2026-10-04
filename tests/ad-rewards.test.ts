import test from "node:test";
import assert from "node:assert/strict";
import { createGame, parseSave, reduceGame } from "../src/engine";
import { rewardDate, rewardSupplyAvailability } from "../src/adRewards";

const today = "2026-10-05";
const claim = (receipt: string, date = today) => ({
  type: "AD_REWARD" as const,
  receipt,
  date,
});

test("a rewarded completion grants one draught without gold, XP, or recovery", () => {
  const original = createGame();
  const result = reduceGame(original, claim("reward-session-0001"));
  assert.equal(result.potions, original.potions + 1);
  for (const key of ["gold", "xp", "hp", "energy", "resolve"] as const)
    assert.equal(result[key], original[key]);
  assert.equal(
    original.potions,
    3,
    "the reducer must not mutate the previous save",
  );
});

test("reward receipts are idempotent and the daily limit survives save reload", () => {
  let game = reduceGame(createGame(), claim("reward-session-0001"));
  game = reduceGame(game, claim("reward-session-0001"));
  assert.equal(game.potions, 4);
  game = parseSave(JSON.stringify(game))!;
  game = reduceGame(game, claim("reward-session-0002"));
  game = reduceGame(game, claim("reward-session-0003"));
  assert.equal(game.potions, 5);
  assert.equal(rewardSupplyAvailability(game, today), "daily-limit");
  game = reduceGame(game, claim("reward-session-0001", "2026-10-06"));
  assert.equal(
    game.potions,
    5,
    "a previously used receipt cannot be replayed next day",
  );
  game = reduceGame(game, claim("reward-session-0004", "2026-10-06"));
  assert.equal(game.potions, 6);
});

test("rewarded supplies respect capacity, expeditions, and defeat", () => {
  const original = createGame();
  const full = { ...original, potions: 6 };
  assert.equal(rewardSupplyAvailability(full, today), "full");
  assert.equal(reduceGame(full, claim("reward-session-0001")).potions, 6);
  const exploring = reduceGame(original, { type: "ENTER", biome: "catacombs" });
  assert.ok(exploring.run);
  assert.equal(
    reduceGame(exploring, claim("reward-session-0001")).potions,
    original.potions,
  );
  const fallen = {
    ...original,
    defeat: { lostGold: 0, turns: 1, text: "The lantern went dark." },
  };
  assert.equal(
    reduceGame(fallen, claim("reward-session-0001")).potions,
    original.potions,
  );
});

test("invalid dates, receipts, and backward dates cannot reset the reward limit", () => {
  let game = reduceGame(createGame(), claim("reward-session-0001"));
  for (const action of [
    claim("bad"),
    claim("reward-session-0002", "2026-02-30"),
    claim("reward-session-0002", "2026-10-04"),
  ]) {
    game = reduceGame(game, action);
    assert.equal(game.potions, 4);
  }
  assert.equal(rewardDate(Date.UTC(2026, 9, 5, 23, 59)), today);
});

test("older saves migrate and malformed rewarded records are rejected", () => {
  const legacy = createGame();
  delete legacy.rewardedSupplies;
  assert.ok(parseSave(JSON.stringify(legacy)));
  for (const record of [
    { date: today, claimed: -1, receipts: [] },
    { date: today, claimed: 3, receipts: [] },
    { date: "2026-02-30", claimed: 1, receipts: ["reward-session-0001"] },
    {
      date: today,
      claimed: 1,
      receipts: ["reward-session-0001", "reward-session-0001"],
    },
    { date: today, claimed: 1, receipts: "invalid" },
  ])
    assert.equal(
      parseSave(JSON.stringify({ ...legacy, rewardedSupplies: record })),
      null,
    );
});
