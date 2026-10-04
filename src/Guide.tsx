import { useGame } from "./context";
import { Button } from "./ui";
import type { Screen } from "./context";
import { FlameIcon, XIcon } from "@phosphor-icons/react";

export function Guide() {
  const { game, go, act, screen } = useGame();
  if (game.tutorialDismissed) return null;
  if (
    game.run &&
    game.run.rooms > 0 &&
    !game.completed.includes("bell") &&
    (!game.run.eventId || game.resolvedEvents.length > 0)
  )
    return null;
  let title = "Make your first promise",
    text =
      "Open the quest journal and accept For Whom the Bell Tolls. Side quests can be carried together.",
    target: Screen = "quests",
    label = "Open quests",
    step = 1;
  if (game.accepted.length) {
    title = "Prepare your lantern";
    text =
      "Use your two starting skill points in Character. Then visit the forge for a better weapon and pack healing draughts.";
    target = "character";
    label = "Choose a skill";
    step = 2;
  }
  if (game.accepted.length && game.skills.length > 1) {
    title = "Take the first crossing";
    text =
      "Enter the Drowned Catacombs. Unexplored rooms hide their contents. Bank side-quest rewards and improve your gear before facing the guardian.";
    target = "dungeon";
    label = "Choose a region";
    step = 3;
  }
  if (game.run) {
    title = "Follow the highlighted paths";
    text =
      "The map follows your position. Choose a path below it, or tap a lit room. Full map opens your route; Town lets you return between encounters.";
    step = 4;
    target = "dungeon";
    label = "Continue exploring";
  }
  if (game.run?.eventId) {
    title = "An answer has a cost";
    text =
      "Read each choice and its effect. Your decision is saved immediately and some consequences return in later chapters.";
    step = 5;
  }
  if (game.combat) {
    title = "Follow the battle log";
    text =
      "Strike restores energy. The log warns before heavy blows. Guard them; heal during recovery openings. Enemy rhythms differ, and draughts need two actions to recover.";
    step = 5;
  }
  if (game.completed.includes("bell")) {
    title = "Bring the answer home";
    text =
      "Return to town, claim your quest reward, and equip your new armor. Invest level points before following the next clue.";
    step = 6;
    target = "quests";
    label = "Claim your reward";
  }
  if (game.claimed.includes("bell"))
    return (
      <div className="guide-banner">
        <FlameIcon size={25} />
        <div>
          <strong>You know the way below.</strong>
          <p>
            Follow the next investigation, take personal quests, and build your
            own discipline. Every action saves your journey.
          </p>
        </div>
        <Button kind="secondary" onClick={() => act({ type: "DISMISS_GUIDE" })}>
          Continue your story
        </Button>
      </div>
    );
  return (
    <aside className="guide-banner" aria-label="Guided first expedition">
      <FlameIcon size={25} />
      <div>
        <span className="eyebrow">FIRST EXPEDITION · {step} / 6</span>
        <strong>{title}</strong>
        <p>{text}</p>
      </div>
      {screen !== target && !game.run && (
        <Button kind="secondary" onClick={() => go(target)}>
          {label}
        </Button>
      )}
      <button
        className="guide-close icon-button"
        aria-label="Dismiss guided tips"
        onClick={() => act({ type: "DISMISS_GUIDE" })}
      >
        <XIcon size={18} />
      </button>
    </aside>
  );
}
