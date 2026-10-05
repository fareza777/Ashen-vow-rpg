import { useRef, useEffect, useState } from "react";
import { NarrativeReader } from "./NarrativeReader";
import { ROMANS } from "./campaign";
import { BattleEffects, useBattleCue } from "./BattleEffects";
import { battlePresentation } from "./battlePresentation";
import type { BattleFx } from "./battlePresentation";
import {
  ArrowRightIcon,
  SwordIcon,
  ShieldIcon,
  LightningIcon,
  FlaskIcon,
  HeartIcon,
  EyeIcon,
  SkullIcon,
  CheckIcon,
  ScrollIcon,
  SparkleIcon,
  FootprintsIcon,
  BackpackIcon,
  HouseLineIcon,
  QuestionIcon,
  ArrowsOutIcon,
} from "@phosphor-icons/react";
import { useGame } from "./context";
import { BIOMES, ENEMIES, EVENTS, QUESTS, SKILLS, itemById } from "./data";
import { canMove, stats, draughtHealing } from "./engine";
import type { Combat } from "./engine";
import { draughtRecovery } from "./challenge";
import { reachableRooms, roomAppearance } from "./dungeonPresentation";
import {
  Art,
  ItemArt,
  Modal,
  Bar,
  Badge,
  Button,
  SectionTitle,
  Gold,
  nodeIcons,
} from "./ui";
import { Expeditions } from "./Town";
function CombatView({
  cue,
  combat: c,
}: {
  cue: BattleFx | null;
  combat: Combat;
}) {
  const { game, act } = useGame();
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const disciplines = SKILLS.filter(
    (k) => game.skills.includes(k.id) && !k.passive,
  );
  const e = ENEMIES.find((e) => e.id === c.enemyId)!;
  const recovery = draughtRecovery(c);
  const enraged = !!e.boss && c.hp < c.maxHp * 0.5;
  const effectCount =
    Number(enraged) + Number(c.ward > 0) + Number(c.poison > 0);
  const choices = [
    { id: "attack", name: "Strike", hint: "+2 energy", icon: SwordIcon },
    {
      id: "power",
      name: "Heavy strike",
      hint: "4 energy",
      icon: LightningIcon,
    },
    { id: "guard", name: "Guard", hint: "75% block", icon: ShieldIcon },
    { id: "focus", name: "Focus", hint: "+8 energy", icon: EyeIcon },
    {
      id: "potion",
      name: `Potion ×${game.potions}`,
      hint: !game.potions
        ? "No potions left"
        : recovery
          ? `Ready in ${recovery} turn${recovery === 1 ? "" : "s"}`
          : game.hp >= stats(game).maxHp
            ? "HP full"
            : `Drink · +${draughtHealing(game)} HP`,
      icon: FlaskIcon,
    },
    {
      id: "flee",
      name: "Retreat",
      hint: e.boss ? "Locked" : "Leave loot",
      icon: FootprintsIcon,
    },
  ];
  return (
    <section
      className={`combat-view ${cue ? "turn-animating" : ""} ${game.hp < stats(game).maxHp * 0.3 ? "health-critical" : ""}`}
      key={e.id}
    >
      <div className="encounter-heading">
        <div className="combat-enemy-heading">
          <span className="eyebrow">
            {c.elite ? "ASHBOUND · " : ""}DEPTH{" "}
            {game.run!.nodes[game.run!.current].row} · TURN{" "}
            {cue ? c.turn : c.turn + 1}
          </span>
          <h2>{e.name}</h2>
        </div>
        <button
          className="battle-log-toggle"
          onClick={() => setDetailsOpen(true)}
        >
          Enemy info{effectCount ? ` · ${effectCount}` : ""}
        </button>
        <button className="battle-log-toggle" onClick={() => setLogOpen(true)}>
          History
        </button>
      </div>
      <div className="enemy-portrait">
        {cue && <BattleEffects key={cue.sequence} fx={cue} />}
        <div
          key={cue?.sequence ?? "still"}
          className={`enemy-visual ${cue?.damage ? `enemy-hit hit-${battlePresentation(cue).style}` : ""} ${cue?.incoming ? "enemy-counter" : ""}`}
        >
          <Art sheet="enemies" index={e.art} label={e.name} />
        </div>
        <div className="enemy-shade" />
      </div>
      <div className="combat-body">
        <Bar
          label={enraged ? "Enemy health · Enraged" : "Enemy health"}
          value={Math.max(0, c.hp)}
          max={c.maxHp}
          color="red"
          icon={<HeartIcon size={15} />}
        />
        <section
          className="battle-live-log"
          aria-label="Battle log"
          aria-live="polite"
          aria-atomic="true"
        >
          <header>
            <span className="eyebrow">BATTLE LOG</span>
            <span>{cue ? "Resolving turn" : "Your move"}</span>
          </header>
          <div>
            {c.log.slice(0, 3).map((line, index) => (
              <p
                key={`${c.turn}:${index}`}
                className={index === 0 ? "latest" : "log-line"}
              >
                {line}
              </p>
            ))}
            <p className="battle-recap">
              {c.turn > 0 && game.battleFx?.enemy === c.enemyId
                ? `${SKILLS.find((k) => k.id === game.battleFx!.action)?.name ?? ({ attack: "Strike", power: "Heavy strike", guard: "Guard", focus: "Focus", potion: "Potion" } as Record<string, string>)[game.battleFx.action]} · ${game.battleFx.damage ? `Dealt ${game.battleFx.damage} · ` : ""}${game.battleFx.healed ? `Healed ${game.battleFx.healed} · ` : ""}Took ${game.battleFx.incoming} damage`
                : null}
            </p>
          </div>
        </section>
        <div className="combat-actions">
          <button
            className="combat-skill-toggle"
            disabled={!!cue}
            onClick={() => setSkillsOpen(true)}
          >
            <SparkleIcon size={18} />
            Skills{" "}
            <span>
              {disciplines.length} learned · {game.energy} energy
            </span>
            <ArrowRightIcon size={16} />
          </button>
          {choices.map((a) => (
            <button
              className={`combat-action ${a.id === "attack" ? "main" : a.id === "potion" ? "potion" : ""}`}
              key={a.id}
              disabled={
                !!cue ||
                (a.id === "power" && game.energy < 4) ||
                (a.id === "potion" &&
                  (!game.potions ||
                    !!recovery ||
                    game.hp >= stats(game).maxHp)) ||
                (a.id === "flee" && !!e.boss)
              }
              onClick={() => act({ type: "COMBAT", action: a.id })}
            >
              <a.icon size={22} weight="light" />
              <div>
                <strong>{a.name}</strong>
                <span>{a.hint}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
      {skillsOpen && (
        <Modal
          title="Your disciplines"
          eyebrow="CHOOSE A BATTLE SKILL"
          onClose={() => setSkillsOpen(false)}
        >
          <div className="event-choices">
            {disciplines.map((k) => (
              <button
                className="event-choice"
                key={k.id}
                disabled={!!cue || game.energy < k.cost}
                onClick={() => {
                  act({ type: "COMBAT", action: k.id });
                  setSkillsOpen(false);
                }}
              >
                <div>
                  <strong>{k.name}</strong>
                  <span>{k.description}</span>
                  <span>
                    {k.cost} energy
                    {game.energy < k.cost ? " · use Focus first" : ""}
                  </span>
                </div>
                <ArrowRightIcon size={18} />
              </button>
            ))}
          </div>
        </Modal>
      )}
      {detailsOpen && (
        <Modal
          title={e.name}
          eyebrow={`${c.elite ? "ASHBOUND · " : ""}${e.title}`}
          onClose={() => setDetailsOpen(false)}
        >
          <p className="story-text">{e.description}</p>
          <div className="enemy-info-stats">
            <span>
              <HeartIcon size={17} /> {c.maxHp} health
            </span>
            <span>
              <SwordIcon size={17} /> {c.attack} attack
            </span>
            <span>
              <ShieldIcon size={17} /> {c.defense} armor
            </span>
          </div>
          <div className="battle-status-details">
            {c.elite && (
              <p>
                <strong>Ashbound foe</strong>Hardened by the deeper passages.
                This enemy has stronger armor and a higher chance to carry
                equipment.
              </p>
            )}
            {enraged && (
              <p>
                <strong>Enraged guardian</strong>This guardian's attacks
                intensify below half health. Read the battle log and guard
                against the heavy blow.
              </p>
            )}
            {c.ward > 0 && (
              <p>
                <strong>{c.ward} ward remaining</strong>Your ward absorbs
                incoming damage before your health is spent.
              </p>
            )}
            {c.poison > 0 && (
              <p>
                <strong>Thornblood · {c.poison} turns</strong>The enemy takes
                poison damage while this effect lasts.
              </p>
            )}
            {!effectCount && (
              <p>
                No active combat effects. The battle log warns you before the
                next attack.
              </p>
            )}
          </div>
        </Modal>
      )}
      {logOpen && (
        <Modal
          title="Battle log"
          eyebrow={`TURN ${c.turn + 1}`}
          onClose={() => setLogOpen(false)}
        >
          <div className="combat-log">
            {c.log.map((l, i) => (
              <p key={i} className={i === 0 ? "latest" : ""}>
                {l}
              </p>
            ))}
          </div>
        </Modal>
      )}
    </section>
  );
}

function EventView() {
  const { game, act } = useGame();
  const event = EVENTS.find((e) => e.id === game.run?.eventId)!;
  return (
    <NarrativeReader
      story={event}
      onConfirm={(choice) => act({ type: "EVENT", choice })}
      onBlocked={() => act({ type: "RETURN" })}
    />
  );
}

function DungeonMap({
  full = false,
  onMove,
}: {
  full?: boolean;
  onMove: (id: number) => void;
}) {
  const { game } = useGame();
  const r = game.run!;
  const canvas = useRef<HTMLDivElement>(null);
  const height = (Math.max(...r.nodes.map((n) => n.row)) + 1) * 70;
  useEffect(() => {
    if (canvas.current)
      canvas.current.scrollTop = Math.max(
        0,
        r.nodes[r.current].row * 70 - canvas.current.clientHeight * 0.48,
      );
  }, [r.current, full]);
  return (
    <section
      className={`map-panel journey-map ${full ? "full-map" : "local-map"}`}
      aria-label={full ? "Full dungeon map" : "Nearby dungeon map"}
    >
      <div className="map-canvas" ref={canvas}>
        <div className="map-board" style={{ height }}>
          <svg
            className="map-connections"
            viewBox={`0 0 300 ${height}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {(r.shortcuts ?? []).map(([a, b]) => (
              <line
                key={`shortcut-${a}-${b}`}
                className="shortcut-line"
                x1={r.nodes[a].col * 100 + 50}
                y1={r.nodes[a].row * 70 + 35}
                x2={r.nodes[b].col * 100 + 50}
                y2={r.nodes[b].row * 70 + 35}
              />
            ))}
            {r.nodes.flatMap((n) =>
              r.nodes
                .filter(
                  (x) =>
                    (x.row === n.row + 1 && Math.abs(x.col - n.col) <= 1) ||
                    (x.row === n.row && x.col === n.col + 1),
                )
                .map((x) => (
                  <line
                    key={`${n.id}-${x.id}`}
                    x1={n.col * 100 + 50}
                    y1={n.row * 70 + 35}
                    x2={x.col * 100 + 50}
                    y2={x.row * 70 + 35}
                    className={n.resolved ? "lit" : ""}
                  />
                )),
            )}
          </svg>
          <div
            className="map-grid"
            style={{ gridTemplateRows: `repeat(${height / 70},70px)` }}
          >
            {r.nodes.map((n) => {
              const visible = roomAppearance(n);
              const Icon = visible.known ? nodeIcons[n.kind] : QuestionIcon,
                here = r.current === n.id,
                active = canMove(game, n.id);
              return (
                <div
                  key={n.id}
                  className="map-cell"
                  style={{ gridColumn: n.col + 1, gridRow: n.row + 1 }}
                >
                  <button
                    className={`map-node ${visible.kind} ${here ? "current" : ""} ${n.resolved ? "resolved" : ""} ${active ? "available" : ""}`}
                    disabled={!active}
                    onClick={() => onMove(n.id)}
                    aria-label={`Room ${n.id}: ${visible.label}${here ? " (current)" : active ? " (available)" : ""}`}
                    title={`${visible.label} · Room ${n.id}`}
                  >
                    {here ? (
                      <FootprintsIcon size={23} />
                    ) : n.resolved ? (
                      <CheckIcon size={22} />
                    ) : (
                      <Icon size={22} />
                    )}
                  </button>
                  <span>
                    {here
                      ? "YOU"
                      : visible.kind === "boss"
                        ? "BOSS"
                        : visible.kind === "exit"
                          ? "EXIT"
                          : `${n.id}`.padStart(2, "0")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function RouteDock({
  onMove,
  onMap,
  onReturn,
  onInfo,
}: {
  onMove: (id: number) => void;
  onMap: () => void;
  onReturn: () => void;
  onInfo: () => void;
}) {
  const { game, go } = useGame();
  const routes = reachableRooms(game);
  const [group, setGroup] = useState(0);
  const groups = Math.max(1, Math.ceil(routes.length / 3));
  const current = game.run!.nodes[game.run!.current];
  return (
    <footer className="route-dock">
      <div className="route-dock-heading">
        <strong>Choose a path</strong>
        <button
          className="text-button"
          disabled={groups === 1}
          onClick={() => setGroup((group + 1) % groups)}
        >
          {groups > 1
            ? `More paths · ${group + 1}/${groups}`
            : `${routes.length} open`}
          <ArrowRightIcon size={16} />
        </button>
      </div>
      <div className="route-options" aria-label="Reachable paths">
        {routes
          .slice((group % groups) * 3, (group % groups) * 3 + 3)
          .map((n) => {
            const visible = roomAppearance(n);
            const Icon = visible.known ? nodeIcons[n.kind] : QuestionIcon;
            return (
              <button
                key={n.id}
                className={`route-option ${visible.kind} ${n.resolved ? "visited" : ""}`}
                onClick={() => onMove(n.id)}
                aria-label={`Explore room ${n.id}: ${visible.label}`}
              >
                <Icon size={22} />
                <strong>{visible.label}</strong>
                <span>
                  {n.row < current.row
                    ? "Backtrack"
                    : n.row === current.row
                      ? "Side path"
                      : n.row > current.row + 1
                        ? "Shortcut"
                        : "Deeper"}{" "}
                  · {n.id.toString().padStart(2, "0")}
                  {n.resolved ? " · visited" : ""}
                </span>
              </button>
            );
          })}
      </div>
      <nav className="expedition-tools" aria-label="Expedition tools">
        <button onClick={onMap}>
          <ArrowsOutIcon size={20} />
          <span>Full map</span>
        </button>
        <button onClick={() => go("inventory")}>
          <BackpackIcon size={20} />
          <span>Pack</span>
        </button>
        <button onClick={onInfo}>
          <ScrollIcon size={20} />
          <span>Quest</span>
        </button>
        <button onClick={onReturn}>
          <HouseLineIcon size={20} />
          <span>Town</span>
        </button>
      </nav>
    </footer>
  );
}

function OutcomeView({ onContinue }: { onContinue: () => void }) {
  const { game } = useGame();
  const outcome = game.run!.lastOutcome!;
  const b = BIOMES.find((b) => b.id === game.run!.biome)!;
  const fallen = outcome.enemy
    ? ENEMIES.find((e) => e.id === outcome.enemy)
    : null;
  const items = outcome.items ?? (outcome.item ? [outcome.item] : []);
  const rewardsFirst = !!fallen || outcome.kind === "loot";
  return (
    <section className={`outcome-screen ${fallen ? "victory-view" : ""}`}>
      <div className={`outcome-art ${fallen ? "victory-art" : ""}`}>
        {items.length ? (
          <ItemArt item={itemById(items[0])} className="reward-item-art" />
        ) : fallen ? (
          <Art
            sheet="enemies"
            index={fallen.art}
            label={fallen.name}
            className="fallen-still"
          />
        ) : (
          <Art index={b.art} />
        )}
        <div className="story-shade" />
        <Badge>
          <CheckIcon size={15} />
          {fallen
            ? fallen.boss
              ? "OATH BROKEN"
              : "BATTLE COMPLETE"
            : outcome.kind === "loot"
              ? "SUPPLIES RECOVERED"
              : outcome.kind === "rest"
                ? "A MOMENT OF WARMTH"
                : "CHOICE RECORDED"}
        </Badge>
      </div>
      <div className="outcome-copy reader-scroll">
        <h2>{outcome.title}</h2>
        {!rewardsFirst && <p className="story-text">{outcome.text}</p>}
        {!!(outcome.gold || outcome.xp) && (
          <div className="reward-currency" aria-label="Rewards received">
            {!!outcome.gold && (
              <span>
                <Gold amount={outcome.gold} /> gold
              </span>
            )}
            {!!outcome.xp && <span>{outcome.xp} XP</span>}
          </div>
        )}
        <div className="reward-receipt">
          {items.map((id) => {
            const item = itemById(id);
            const bonuses = [
              item.attack && `+${item.attack} ATK`,
              item.defense && `+${item.defense} DEF`,
              item.hp && `+${item.hp} HP`,
              item.energy && `+${item.energy} EN`,
              item.crit && `+${item.crit}% CRIT`,
            ]
              .filter(Boolean)
              .join(" · ");
            return (
              <div className="reward-belonging" key={id}>
                <ItemArt item={item} />
                <div>
                  <strong>{item.name} ×1</strong>
                  <span>
                    {item.rarity} · {item.slot}
                  </span>
                  <span>{bonuses}</span>
                </div>
                <CheckIcon size={18} />
              </div>
            );
          })}
          {!!outcome.draughts && (
            <div className="reward-belonging">
              <FlaskIcon size={30} />
              <div>
                <strong>Healing Draught ×{outcome.draughts}</strong>
                <span>Added to your satchel</span>
              </div>
              <CheckIcon size={18} />
            </div>
          )}
          {!items.length &&
            !outcome.draughts &&
            (fallen || outcome.kind === "loot") && (
              <p className="reward-note">No equipment or draughts recovered.</p>
            )}
          {!!outcome.leftBehind?.length && (
            <p className="reward-note">
              Already owned:{" "}
              {outcome.leftBehind.map((id) => itemById(id).name).join(", ")}.
              Left behind.
            </p>
          )}
        </div>
        {rewardsFirst && (
          <p className="story-text reward-flavor">{outcome.text}</p>
        )}
      </div>
      <footer className="reader-footer">
        <Button onClick={onContinue}>
          Continue exploring
          <ArrowRightIcon size={21} />
        </Button>
      </footer>
    </section>
  );
}

function DefeatView() {
  const { game, act } = useGame();
  const defeat = game.defeat!;
  const enemy = ENEMIES.find((e) => e.id === defeat.enemy);
  return (
    <section className="defeat-screen outcome-screen">
      <div className="defeat-art">
        <img
          src="/art/defeat.png"
          alt="A masked keeper rescued from the rain beside a fading lantern"
        />
        <div className="story-shade" />
        <Badge>
          <SkullIcon size={16} /> EXPEDITION LOST
        </Badge>
      </div>
      <div className="outcome-copy reader-scroll">
        <span className="eyebrow">
          {enemy
            ? `FALLEN TO ${enemy.name.toUpperCase()}`
            : "THE HOLLOW TOOK ITS DUE"}
        </span>
        <h2>Your light faltered</h2>
        <div className="defeat-receipt">
          <strong>Lost {defeat.lostGold} gold</strong>
          <span>Equipment, experience and quest progress kept.</span>
          <span>
            Recovered {game.hp} / {stats(game).maxHp} HP · {game.energy} energy
          </span>
        </div>
        <p className="story-text">{defeat.text}</p>
      </div>
      <footer className="reader-footer">
        <Button onClick={() => act({ type: "ACK_DEFEAT" })}>
          <HouseLineIcon size={20} /> Return to Vesper’s Rest
        </Button>
      </footer>
    </section>
  );
}

export function Dungeon() {
  const { game, act, go, open } = useGame();
  const cue = useBattleCue(game.battleFx);
  const previousCombat = useRef<Combat | null>(game.combat);
  if (game.combat) previousCombat.current = game.combat;
  const [panel, setPanel] = useState<"map" | "return" | "info" | null>(null);
  if (game.defeat)
    return (
      <div className="dungeon-session-view mode-defeat">
        <DefeatView />
      </div>
    );
  if (!game.run)
    return (
      <div className="page-enter">
        <SectionTitle
          title="Choose your descent"
          eyebrow="BEYOND THE LANTERNS"
        />
        <p className="story-text descent-intro">
          Choose a quest before entering the dark. Each crossing saves your
          journey.
        </p>
        <Button kind="secondary" onClick={() => go("quests")}>
          Quest journal
          <ArrowRightIcon size={20} />
        </Button>
        <Expeditions />
      </div>
    );
  const run = game.run;
  const b = BIOMES.find((b) => b.id === run.biome)!;
  const quest = QUESTS.find((q) => q.id === game.activeQuest);
  const outcomeKey = run.lastOutcome
    ? `${run.biome}:${run.current}:${run.rooms}:${run.lastOutcome.kind}:${run.lastOutcome.text}`
    : null;
  const showingOutcome = !!run.lastOutcome;
  // Let the last blow finish in the encounter before presenting a static receipt.
  const finishing =
    cue?.won &&
    run.lastOutcome?.enemy === cue.enemy &&
    previousCombat.current?.enemyId === cue.enemy;
  const visibleCombat =
    game.combat ??
    (finishing
      ? {
          ...previousCombat.current!,
          hp: 0,
          turn: previousCombat.current!.turn + 1,
          log: ["The enemy falls. Your rewards are secured."],
        }
      : null);
  const mode = visibleCombat
    ? "combat"
    : run.eventId
      ? "event"
      : showingOutcome
        ? "outcome"
        : "explore";
  const move = (id: number) => {
    setPanel(null);
    act({ type: "MOVE", id });
  };
  return (
    <div className={`dungeon-session-view mode-${mode}`}>
      <header className="dungeon-session-heading">
        <div>
          <span className="eyebrow">
            ACT {ROMANS[BIOMES.indexOf(b)]} · DEPTH {run.nodes[run.current].row}
          </span>
          <h1>{b.name}</h1>
        </div>
        <button
          className="icon-button"
          aria-label="Expedition help"
          onClick={() => open("tutorial")}
        >
          <QuestionIcon size={23} />
        </button>
      </header>
      <div className="dungeon-stage">
        {visibleCombat ? (
          <CombatView
            combat={visibleCombat}
            cue={cue?.enemy === visibleCombat.enemyId ? cue : null}
          />
        ) : run.eventId ? (
          <EventView key={`${run.current}:${run.eventId}`} />
        ) : showingOutcome ? (
          <OutcomeView
            key={outcomeKey}
            onContinue={() => act({ type: "ACK_OUTCOME" })}
          />
        ) : (
          <section className="exploration-screen">
            <div className="exploration-caption">
              <span>
                <FootprintsIcon size={16} />
                {run.rooms} rooms explored
              </span>
              <span>
                <Gold amount={run.gold} />
                <SparkleIcon size={15} />
                {run.xp} XP
              </span>
            </div>
            <DungeonMap onMove={move} />
            <RouteDock
              key={run.current}
              onMove={move}
              onMap={() => setPanel("map")}
              onReturn={() => setPanel("return")}
              onInfo={() => setPanel("info")}
            />
          </section>
        )}
      </div>
      {panel === "map" && (
        <Modal
          title="The path below"
          eyebrow={`${b.name} · Depth ${run.nodes[run.current].row}`}
          onClose={() => setPanel(null)}
          wide
        >
          <DungeonMap full onMove={move} />
          <p className="map-modal-hint">
            Unexplored rooms conceal their contents. Lit rooms are reachable;
            checked rooms have been cleared. Drag to see the deeper paths.
          </p>
        </Modal>
      )}
      {panel === "return" && (
        <Modal
          title="Return to Vesper’s Rest?"
          eyebrow="END THIS EXPEDITION"
          onClose={() => setPanel(null)}
        >
          <p className="story-text">
            Keep the loot and discoveries you have gathered. Your next
            expedition will follow a new map.
          </p>
          <div className="return-actions">
            <Button onClick={() => act({ type: "RETURN" })}>
              <HouseLineIcon size={20} />
              Return to town
            </Button>
            <Button kind="secondary" onClick={() => setPanel(null)}>
              Keep exploring
            </Button>
          </div>
        </Modal>
      )}
      {panel === "info" && (
        <Modal
          title="Your expedition"
          eyebrow="PROGRESS & PREPARATION"
          onClose={() => setPanel(null)}
        >
          <p className="story-text">
            {quest ? `${quest.name}: ${quest.objective}.` : b.description}
          </p>
          <div className="expedition-summary">
            <span>{game.potions} healing draughts</span>
            <span>{run.rooms} rooms explored</span>
            <span>
              {run.gold} gold gathered · {run.xp} XP earned
            </span>
          </div>
          <Button onClick={() => go("quests")}>
            Open quest journal
            <ArrowRightIcon size={20} />
          </Button>
          <Button kind="secondary" onClick={() => go("character")}>
            Character & skills
            <ArrowRightIcon size={20} />
          </Button>
        </Modal>
      )}
    </div>
  );
}
