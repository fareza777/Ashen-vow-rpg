import test from "node:test";
import assert from "node:assert/strict";
import { battlePresentation } from "../src/battlePresentation";
import { SKILLS } from "../src/data";
import type { BattleFx } from "../src/battlePresentation";

const effect = (action: string, extra: Partial<BattleFx> = {}): BattleFx => ({
  sequence: 1,
  action,
  enemy: "hollow",
  damage: 10,
  incoming: 4,
  healed: 0,
  critical: false,
  won: false,
  ...extra,
});

test("every learned active skill has a distinct readable effect family", () => {
  for (const skill of SKILLS.filter((s) => !s.passive)) {
    const p = battlePresentation(effect(skill.id));
    assert.notEqual(
      p.style,
      "blade",
      `${skill.name} needs a directed skill effect`,
    );
    assert.ok(p.impactMs < p.counterMs && p.counterMs < p.durationMs, skill.id);
  }
});

test("heavy attacks, recovery, guarding and victories allow the entire feedback sequence", () => {
  assert.equal(battlePresentation(effect("power")).style, "heavy");
  assert.equal(
    battlePresentation(effect("guard", { damage: 0 })).style,
    "ward",
  );
  assert.equal(
    battlePresentation(effect("potion", { damage: 0, healed: 28 })).style,
    "restore",
  );
  assert.equal(
    battlePresentation(effect("focus", { damage: 0 })).style,
    "focus",
  );
  assert.equal(
    battlePresentation(effect("attack", { critical: true })).label,
    "Critical strike",
  );
  assert.ok(
    battlePresentation(effect("attack", { won: true })).durationMs > 1200,
  );
});
