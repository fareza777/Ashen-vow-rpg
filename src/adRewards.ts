import type { GameState } from "./engine";
import { SATCHEL_CAPACITY } from "./challenge";

export const REWARDED_DAILY_LIMIT = 2;
export type RewardedSupplies = {
  date: string;
  claimed: number;
  receipts: string[];
};
export const rewardDate = (now = Date.now()) =>
  new Date(now).toISOString().slice(0, 10);
export function validRewardDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const date = new Date(`${value}T00:00:00Z`);
  return (
    Number.isFinite(date.getTime()) && rewardDate(date.getTime()) === value
  );
}
export const validRewardReceipt = (value: unknown): value is string =>
  typeof value === "string" && /^[a-zA-Z0-9-]{12,64}$/.test(value);
export function validRewardRecord(value: unknown): value is RewardedSupplies {
  if (!value || typeof value !== "object") return false;
  const r = value as RewardedSupplies;
  return (
    Number.isInteger(r.claimed) &&
    r.claimed >= 0 &&
    r.claimed <= REWARDED_DAILY_LIMIT &&
    Array.isArray(r.receipts) &&
    r.receipts.length <= 128 &&
    r.receipts.length >= r.claimed &&
    r.receipts.every(validRewardReceipt) &&
    new Set(r.receipts).size === r.receipts.length &&
    (validRewardDate(r.date) ||
      (r.date === "" && r.claimed === 0 && r.receipts.length === 0))
  );
}
export function rewardSupplyAvailability(game: GameState, date = rewardDate()) {
  if (game.run || game.combat || game.defeat) return "expedition" as const;
  if (game.potions >= SATCHEL_CAPACITY) return "full" as const;
  const record = game.rewardedSupplies;
  if (
    record &&
    (record.date > date ||
      (record.date === date && record.claimed >= REWARDED_DAILY_LIMIT))
  )
    return "daily-limit" as const;
  return "available" as const;
}
