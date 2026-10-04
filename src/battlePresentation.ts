import type { GameState } from "./engine";

export type BattleFx = NonNullable<GameState["battleFx"]>;
export type BattleStyle =
  "blade" | "heavy" | "ember" | "shadow" | "ward" | "restore" | "focus";

const actionStyles: Record<string, BattleStyle> = {
  attack: "blade",
  power: "heavy",
  cleave: "heavy",
  execution: "heavy",
  earthquake: "heavy",
  ember: "ember",
  nova: "ember",
  furnace: "ember",
  venom: "shadow",
  drain: "shadow",
  eclipse: "shadow",
  step: "shadow",
  shroud: "shadow",
  guard: "ward",
  bulwark: "ward",
  riposte: "ward",
  potion: "restore",
  mend: "restore",
  mists: "restore",
  focus: "focus",
};
const labels: Record<BattleStyle, string> = {
  blade: "Blade strike",
  heavy: "Heavy impact",
  ember: "Ember unleashed",
  shadow: "Through the veil",
  ward: "Guard raised",
  restore: "Flame restored",
  focus: "Energy gathered",
};

export function battlePresentation(fx: BattleFx) {
  const style = actionStyles[fx.action] ?? "blade";
  return {
    style,
    label: fx.critical ? "Critical strike" : labels[style],
    impactMs: style === "heavy" || style === "ember" ? 240 : 150,
    counterMs: 620,
    durationMs: fx.won
      ? 1450
      : style === "heavy" || style === "ember"
        ? 1250
        : 1100,
  };
}
