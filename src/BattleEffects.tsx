import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { ShieldIcon, SparkleIcon } from "@phosphor-icons/react";
import { battlePresentation } from "./battlePresentation";
import type { BattleFx } from "./battlePresentation";

// Only new actions animate. Resuming a saved encounter never replays its last hit.
export function useBattleCue(fx: BattleFx | null) {
  const seen = useRef(fx?.sequence ?? 0);
  const [cue, setCue] = useState<BattleFx | null>(null);
  useEffect(() => {
    if (!fx || fx.sequence <= seen.current) return;
    seen.current = fx.sequence;
    setCue(fx);
    const reduced =
      document.documentElement.classList.contains("reduce-motion") ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = setTimeout(
      () => setCue(null),
      reduced ? 180 : battlePresentation(fx).durationMs,
    );
    return () => clearTimeout(timer);
  }, [fx?.sequence]);
  // Present a fresh cue immediately, preventing a reward-screen flash before its effect starts.
  return fx && fx.sequence > seen.current ? fx : cue;
}

export function BattleEffects({ fx }: { fx: BattleFx }) {
  const p = battlePresentation(fx);
  return (
    <div
      className={`battle-fx fx-${p.style} ${fx.critical ? "fx-critical" : ""} ${fx.won ? "fx-victory" : ""}`}
      aria-hidden="true"
    >
      <div className="impact-halo" />
      {fx.damage > 0 && (
        <>
          <svg
            className="strike-trails"
            viewBox="0 0 400 230"
            preserveAspectRatio="none"
          >
            <path className="strike-shadow" d="M55 192 Q155 84 358 42" />
            <path className="strike-edge" d="M55 192 Q155 84 358 42" />
            <path className="strike-second" d="M82 29 Q213 73 334 201" />
          </svg>
          <div className="impact-sparks">
            {Array.from({ length: 10 }, (_, i) => (
              <i
                key={i}
                style={
                  {
                    "--spark-x": `${Math.cos(i * 2.4) * (55 + i * 7)}px`,
                    "--spark-y": `${Math.sin(i * 2.4) * (36 + i * 6)}px`,
                    "--spark-rotate": `${i * 37}deg`,
                    "--spark-delay": `${p.impactMs + i * 9}ms`,
                  } as CSSProperties
                }
              />
            ))}
          </div>
          <div className="hit-number">
            <span>{fx.critical ? "CRITICAL" : "DAMAGE"}</span>
            <strong>−{fx.damage}</strong>
          </div>
        </>
      )}
      {["ward", "restore", "focus"].includes(p.style) && (
        <div className="battle-sigil">
          <i />
          <i />
          {p.style === "ward" ? (
            <ShieldIcon size={70} weight="thin" />
          ) : (
            <SparkleIcon size={70} weight="thin" />
          )}
        </div>
      )}
      {fx.healed > 0 && (
        <div className="restore-number">
          +{fx.healed}
          <small>HEALTH</small>
        </div>
      )}
      {p.style === "focus" && (
        <div className="restore-number">
          +8<small>ENERGY</small>
        </div>
      )}
      {p.style === "ward" && !fx.damage && (
        <span className="guard-caption">
          {fx.incoming === 0 ? "ABSORBED" : "BRACED"}
        </span>
      )}
      {fx.incoming > 0 && (
        <span className="counter-number">−{fx.incoming} HP</span>
      )}
      <span className="battle-cue-label">{p.label}</span>
    </div>
  );
}
