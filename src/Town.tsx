import { useState } from "react";
import {
  HammerIcon,
  CampfireIcon,
  ChurchIcon,
  ArrowRightIcon,
  LockKeyIcon,
  CheckCircleIcon,
  ScrollIcon,
  CompassIcon,
  ArrowUpRightIcon,
  SparkleIcon,
  BackpackIcon,
  UserCircleIcon,
  QuestionIcon,
} from "@phosphor-icons/react";
import { ROMANS } from "./campaign";
import { useGame } from "./context";
import { BIOMES, QUESTS } from "./data";
import { regionUnlocked } from "./engine";
import { Art, Button, SectionTitle, Badge, Gold, Arrow, Modal } from "./ui";

export function Expeditions() {
  const { game, act, go } = useGame();
  return (
    <section className="expeditions">
      <SectionTitle title="Beyond the lanterns" eyebrow="THE HOLLOW AWAITS">
        <span className="muted tiny">8 regions to discover</span>
      </SectionTitle>
      <div className="region-grid">
        {BIOMES.map((b, i) => {
          const unlocked = regionUnlocked(game, b.id);
          return (
            <button
              key={b.id}
              className={`region-card ${unlocked ? "" : "locked"}`}
              onClick={() => {
                if (unlocked) {
                  act({ type: "ENTER", biome: b.id });
                  go("dungeon");
                }
              }}
              disabled={!unlocked || !!game.run}
            >
              <Art index={b.art} />
              <div className="region-shade" />
              <div className="region-top">
                <span className="tiny">CHAPTER {ROMANS[i]}</span>
                {unlocked ? (
                  <Badge>Lv. {b.level}+</Badge>
                ) : (
                  <LockKeyIcon size={17} />
                )}
              </div>
              <div className="region-bottom">
                <h3>{b.name}</h3>
                <span>
                  {unlocked
                    ? b.subtitle
                    : `Complete ${QUESTS.find((q) => q.id === b.unlock)?.name}`}
                </span>
                {unlocked && <ArrowUpRightIcon size={20} />}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function Town() {
  const { game, go, open } = useGame();
  const [panel, setPanel] = useState<"expeditions" | "chronicle" | null>(null);
  const current = QUESTS.find((q) => q.id === game.activeQuest);
  const next = QUESTS.find(
    (q) =>
      q.type === "Main quest" &&
      !game.claimed.includes(q.id) &&
      (!q.requires || game.claimed.includes(q.requires)),
  );
  const quest = current ?? next;
  return (
    <div className="town-scene">
      <section className="town-panorama">
        <img
          src="/art/town.png"
          alt="Lantern-lit streets of Vesper's Rest beneath the ruined sanctuary"
        />
        <div className="hero-shade" />
        <div className="town-scene-copy">
          <span className="eyebrow">
            DAY {game.day} · LEVEL {game.level} · {game.gold} GOLD
          </span>
          <h1>Vesper’s Rest</h1>
          <p>
            {game.flags.heart === "shared"
              ? "Your lantern no longer carries the night alone."
              : game.flags.ledger === "public"
                ? "No one is missing in silence."
                : "A little warmth before the dark."}
          </p>
        </div>
      </section>
      <button className="town-quest-shortcut" onClick={() => go("quests")}>
        <ScrollIcon size={24} />
        <div>
          <span>{current ? "TRACKED QUEST" : "YOUR NEXT CHAPTER"}</span>
          <strong>{quest?.name ?? "A dawn of your making"}</strong>
        </div>
        <ArrowRightIcon size={20} />
      </button>
      <nav className="town-quick-services" aria-label="Town services">
        <button onClick={() => go("shop")}>
          <HammerIcon size={25} />
          <div>
            <strong>Forge</strong>
            <span>Trade & equipment</span>
          </div>
        </button>
        <button onClick={() => open("tavern")}>
          <CampfireIcon size={25} />
          <div>
            <strong>Tavern</strong>
            <span>Rest & recover</span>
          </div>
        </button>
        <button onClick={() => open("shrine")}>
          <ChurchIcon size={25} />
          <div>
            <strong>Shrine</strong>
            <span>Renew resolve</span>
          </div>
        </button>
        <button onClick={() => go("character")}>
          <UserCircleIcon size={25} />
          <div>
            <strong>Character</strong>
            <span>Attributes & skills</span>
          </div>
        </button>
        <button onClick={() => go("inventory")}>
          <BackpackIcon size={25} />
          <div>
            <strong>Inventory</strong>
            <span>Equip & compare</span>
          </div>
        </button>
        <button onClick={() => go("quests")}>
          <ScrollIcon size={25} />
          <div>
            <strong>Quests</strong>
            <span>Promises & rewards</span>
          </div>
        </button>
      </nav>
      <Button onClick={() => setPanel("expeditions")}>
        <CompassIcon size={22} />
        Explore the hollow
        <ArrowRightIcon size={20} />
      </Button>
      <footer className="town-scene-footer">
        <button onClick={() => setPanel("chronicle")}>
          <SparkleIcon size={18} />
          Chronicle
        </button>
        <button onClick={() => open("tutorial")}>
          <QuestionIcon size={18} />
          How to play
        </button>
        <span>
          <CheckCircleIcon size={15} />
          Saved locally
        </span>
      </footer>
      {panel === "expeditions" && (
        <Modal
          title="Choose your descent"
          eyebrow="BEYOND THE LANTERNS"
          onClose={() => setPanel(null)}
          wide
        >
          <Expeditions />
        </Modal>
      )}
      {panel === "chronicle" && (
        <Modal
          title="The chronicle"
          eyebrow="YOUR RECENT JOURNEY"
          onClose={() => setPanel(null)}
        >
          <div className="chronicle-panel">
            {game.journal.slice(0, 8).map((j) => (
              <article key={j.id}>
                <div>
                  <span className="eyebrow">DAY {j.day}</span>
                  <h4>{j.title}</h4>
                  <p>{j.text}</p>
                </div>
              </article>
            ))}
          </div>
          <Button kind="secondary" onClick={() => go("codex")}>
            Visit the archive
            <ArrowRightIcon size={20} />
          </Button>
        </Modal>
      )}
    </div>
  );
}
