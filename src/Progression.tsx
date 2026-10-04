import { NarrativeReader } from "./NarrativeReader";
import { useEffect, useState, type ReactNode } from "react";
import { itemAct, skillLevel, SATCHEL_CAPACITY } from "./challenge";
import { draughtPrice, sellValue } from "./economy";
import {
  ScrollIcon,
  CheckCircleIcon,
  LockKeyIcon,
  SparkleIcon,
  ArrowRightIcon,
  SwordIcon,
  ShieldIcon,
  CrosshairIcon,
  PlusIcon,
  FireIcon,
  MoonIcon,
  HeartIcon,
  LightningIcon,
  CoinsIcon,
  FlaskIcon,
  BookOpenIcon,
} from "@phosphor-icons/react";
import { useGame } from "./context";
import {
  BIOMES,
  ITEMS,
  QUESTS,
  SKILLS,
  ORIGINS,
  LORE,
  ENEMIES,
  itemById,
} from "./data";
import type { Item } from "./data";
import { stats, xpRequired, availableAct, draughtHealing } from "./engine";
import {
  Art,
  ItemArt,
  Modal,
  Bar,
  Button,
  SectionTitle,
  Badge,
  Gold,
  itemIcons,
  skillIcons,
  EmptyState,
} from "./ui";

function usePage(length: number, size: number) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(length / size));
  const current = Math.min(page, pages - 1);
  return { page: current, pages, setPage, start: current * size };
}
function useViewportHeight() {
  const [height, setHeight] = useState(() => window.innerHeight);
  useEffect(() => {
    const resize = () => setHeight(window.innerHeight);
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);
  return height;
}
function useRowCount() {
  const height = useViewportHeight();
  return height < 750 ? 2 : height < 820 ? 3 : 4;
}
function PageNav({
  page,
  pages,
  setPage,
}: {
  page: number;
  pages: number;
  setPage: (p: number) => void;
}) {
  return (
    <nav className="folio-pager" aria-label="List pages">
      <button
        aria-label="Previous page"
        disabled={!page}
        onClick={() => setPage(page - 1)}
      >
        ← Previous
      </button>
      <span>
        {page + 1} / {pages}
      </span>
      <button
        aria-label="Next page"
        disabled={page >= pages - 1}
        onClick={() => setPage(page + 1)}
      >
        Next →
      </button>
    </nav>
  );
}
function Folio({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: ReactNode;
}) {
  const { open } = useGame();
  return (
    <div className="folio page-enter">
      <header className="folio-heading">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
        </div>
        <button
          className="folio-help"
          onClick={() => open("tutorial")}
          aria-label="Open game guide"
        >
          ?
        </button>
      </header>
      {children}
    </div>
  );
}
export function Quests() {
  const { game, act, go } = useGame();
  const [tab, setTab] = useState("Main story");
  const [detail, setDetail] = useState<string | null>(null);
  const [scene, setScene] = useState<string | null>(null);
  const [journal, setJournal] = useState<number | null>(null);
  const [outline, setOutline] = useState(false);
  const [questRegion, setQuestRegion] = useState("all");
  const [questState, setQuestState] = useState("all");
  const rows = useRowCount();
  const list = QUESTS.filter((q) =>
    tab === "Completed"
      ? game.claimed.includes(q.id)
      : q.type === (tab === "Main story" ? "Main quest" : "Side quest") &&
        !game.claimed.includes(q.id) &&
        (!q.requires || game.claimed.includes(q.requires)),
  )
    .filter(
      (q) =>
        tab !== "Side quests" ||
        ((questRegion === "all" || !q.biome || q.biome === questRegion) &&
          (questState === "all" ||
            (questState === "ready" && game.completed.includes(q.id)) ||
            (questState === "active" &&
              game.accepted.includes(q.id) &&
              !game.completed.includes(q.id)) ||
            (questState === "available" && !game.accepted.includes(q.id)))),
    )
    .sort(
      (a, b) =>
        Number(game.completed.includes(b.id)) -
          Number(game.completed.includes(a.id)) ||
        Number(game.activeQuest === b.id) - Number(game.activeQuest === a.id) ||
        Number(game.accepted.includes(b.id)) -
          Number(game.accepted.includes(a.id)),
    );
  const pager = usePage(
    tab === "Chronicle" ? game.journal.length : list.length,
    rows,
  );
  const q = QUESTS.find((q) => q.id === detail);
  const chapter = QUESTS.find((q) => q.id === scene);
  const j = game.journal.find((j) => j.id === journal);
  const status = (id: string) =>
    game.claimed.includes(id)
      ? "Fulfilled"
      : game.completed.includes(id)
        ? "Reward ready"
        : game.activeQuest === id
          ? "Tracked"
          : game.accepted.includes(id)
            ? "In progress"
            : "Available";
  const tracked = QUESTS.find(
    (q) => q.id === game.activeQuest && !game.claimed.includes(q.id),
  );
  return (
    <Folio
      title="Quest journal"
      eyebrow={`${game.claimed.length} VOWS FULFILLED · ${game.reputation} TOWN TRUST`}
    >
      <div
        className="tabs folio-tabs"
        role="tablist"
        aria-label="Quest sections"
      >
        {["Main story", "Side quests", "Completed", "Chronicle"].map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            className={tab === t ? "active" : ""}
            onClick={() => {
              setTab(t);
              pager.setPage(0);
            }}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Side quests" ? (
        <div className="quest-filters">
          <label>
            Region
            <select
              aria-label="Quest region"
              value={questRegion}
              onChange={(e) => {
                setQuestRegion(e.target.value);
                pager.setPage(0);
              }}
            >
              <option value="all">All regions</option>
              {BIOMES.map((b) => (
                <option value={b.id} key={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select
              aria-label="Quest status"
              value={questState}
              onChange={(e) => {
                setQuestState(e.target.value);
                pager.setPage(0);
              }}
            >
              <option value="all">All vows</option>
              <option value="active">In progress</option>
              <option value="ready">Reward ready</option>
              <option value="available">Available</option>
            </select>
          </label>
        </div>
      ) : (
        <button
          className="tracked-vow"
          onClick={() => (tracked ? setDetail(tracked.id) : go("dungeon"))}
        >
          <ScrollIcon size={22} />
          <div>
            <span className="eyebrow">
              {tracked ? "YOUR CURRENT VOW" : "THE HOLLOW AWAITS"}
            </span>
            <strong>
              {tracked?.name ?? "Choose a promise. Prepare. Descend."}
            </strong>
            <span>
              {tracked?.objective ??
                "Open a quest below to see its story and rewards."}
            </span>
          </div>
          <ArrowRightIcon size={18} />
        </button>
      )}
      <div className="folio-list quest-folio-list">
        {tab === "Chronicle"
          ? game.journal.slice(pager.start, pager.start + rows).map((j) => (
              <button
                className="folio-row"
                key={j.id}
                onClick={() => setJournal(j.id)}
              >
                <BookOpenIcon size={24} />
                <div>
                  <span className="eyebrow">
                    DAY {j.day} · {j.kind}
                  </span>
                  <strong>{j.title}</strong>
                  <span>Read this entry</span>
                </div>
                <ArrowRightIcon size={18} />
              </button>
            ))
          : list.slice(pager.start, pager.start + rows).map((q) => (
              <button
                className={`folio-row ${game.activeQuest === q.id ? "selected" : ""}`}
                key={q.id}
                onClick={() => setDetail(q.id)}
              >
                {game.completed.includes(q.id) ? (
                  <CheckCircleIcon size={25} />
                ) : (
                  <ScrollIcon size={25} />
                )}
                <div>
                  <span className="eyebrow">{status(q.id)}</span>
                  <strong>{q.name}</strong>
                  <span>
                    {q.scene
                      ? "Conversation · Vesper’s Rest"
                      : (BIOMES.find((b) => b.id === q.biome)?.name ??
                        "Any region")}
                    {game.accepted.includes(q.id) &&
                    !game.claimed.includes(q.id)
                      ? ` · ${Math.min(q.goal, game.questProgress[q.id] ?? 0)}/${q.goal}`
                      : ""}
                  </span>
                </div>
                <ArrowRightIcon size={18} />
              </button>
            ))}
        {tab !== "Chronicle" && !list.length && (
          <EmptyState
            title={
              tab === "Side quests"
                ? "No matching vows"
                : "The next promise is waiting"
            }
          >
            {tab === "Side quests"
              ? "Choose another region or status to find more vows."
              : "Continue the main story to reveal more vows."}
          </EmptyState>
        )}
      </div>
      <PageNav {...pager} />
      <div className="folio-bottom">
        <button onClick={() => setOutline(true)}>
          <LockKeyIcon size={16} /> Eight-act outline
        </button>
        <button onClick={() => go("dungeon")}>
          {game.run ? "Return to expedition" : "Choose a descent"}{" "}
          <ArrowRightIcon size={16} />
        </button>
      </div>
      {q && (
        <Modal
          title={q.name}
          eyebrow={`${q.chapter} · ${status(q.id)}`}
          onClose={() => setDetail(null)}
        >
          {q.type === "Main quest" && (
            <Art
              className="quest-chapter-art"
              sheet="chapter-scenes"
              index={Math.max(
                0,
                BIOMES.findIndex((b) => b.id === q.biome),
              )}
              label={q.name}
            />
          )}
          <p className="story-text">{q.description}</p>
          <div className="folio-objective">
            <strong>{q.objective}</strong>
            <span>
              {Math.min(q.goal, game.questProgress[q.id] ?? 0)} / {q.goal}·{" "}
              {q.scene
                ? "Vesper’s Rest"
                : (BIOMES.find((b) => b.id === q.biome)?.name ?? "Any region")}
            </span>
          </div>
          <div className="quest-rewards">
            <Gold amount={q.gold} />
            <span>{q.xp} XP</span>
            {q.reward && (
              <span className="item-reward">
                <ItemArt item={itemById(q.reward)} />
                {itemById(q.reward).name}
              </span>
            )}
          </div>
          {game.run && (
            <p className="inline-note">
              Return to town to accept vows or claim rewards.
            </p>
          )}
          {!game.claimed.includes(q.id) && (
            <Button
              disabled={!!game.run}
              onClick={() => {
                if (game.completed.includes(q.id)) {
                  act({ type: "CLAIM", id: q.id });
                  setDetail(null);
                } else {
                  act({ type: "ACCEPT", id: q.id });
                  setDetail(null);
                  if (q.scene) setScene(q.id);
                  else if (game.accepted.includes(q.id)) go("dungeon");
                }
              }}
            >
              {game.completed.includes(q.id)
                ? "Claim reward"
                : q.scene
                  ? "Read & decide"
                  : game.accepted.includes(q.id)
                    ? "Track & explore region"
                    : "Accept & track quest"}{" "}
              <ArrowRightIcon size={18} />
            </Button>
          )}
        </Modal>
      )}
      {j && (
        <Modal
          title={j.title}
          eyebrow={`DAY ${j.day} · ${j.kind}`}
          onClose={() => setJournal(null)}
        >
          <p className="story-text">{j.text}</p>
        </Modal>
      )}
      {outline && (
        <Modal
          title="The eight vows"
          eyebrow="CAMPAIGN OUTLINE"
          onClose={() => setOutline(false)}
        >
          {[
            ...new Set(
              QUESTS.filter((q) => q.type === "Main quest").map(
                (q) => q.chapter,
              ),
            ),
          ].map((ch) => (
            <div className="outline-entry" key={ch}>
              <ScrollIcon size={20} />
              <strong>{ch}</strong>
              <span>
                {
                  QUESTS.filter(
                    (q) =>
                      q.chapter === ch &&
                      q.type === "Main quest" &&
                      game.claimed.includes(q.id),
                  ).length
                }{" "}
                / 3 fulfilled
              </span>
            </div>
          ))}
        </Modal>
      )}
      {chapter?.scene && (
        <Modal
          title={chapter.name}
          eyebrow={chapter.chapter}
          onClose={() => setScene(null)}
        >
          {game.completed.includes(chapter.id) ? (
            <>
              <Art
                className="quest-chapter-art"
                sheet="chapter-scenes"
                index={Math.max(
                  0,
                  BIOMES.findIndex((b) => b.id === chapter.biome),
                )}
                label={chapter.name}
              />
              <p className="story-text">
                {game.journal.find((j) => j.title === chapter.name)?.text}
              </p>
              <Button
                disabled={!!game.run}
                onClick={() => {
                  act({ type: "CLAIM", id: chapter.id });
                  setScene(null);
                }}
              >
                Claim chapter reward
              </Button>
            </>
          ) : (
            <NarrativeReader
              key={chapter.id}
              embedded
              story={{
                name: chapter.name,
                eyebrow: chapter.chapter ?? "",
                text: chapter.scene.text,
                art: Math.max(
                  0,
                  BIOMES.findIndex((b) => b.id === chapter.biome),
                ),
                artSheet: "chapter-scenes",
                choices: chapter.scene.choices,
              }}
              onConfirm={(choice) =>
                act({ type: "DECISION", id: chapter.id, choice })
              }
            />
          )}
        </Modal>
      )}
    </Folio>
  );
}

export function Character() {
  const { game, act } = useGame();
  const [tab, setTab] = useState("Attributes");
  const [tree, setTree] = useState("Steel");
  const [detail, setDetail] = useState<string | null>(null);
  const o = ORIGINS.find((o) => o.id === game.origin)!;
  const st = stats(game);
  const skills = SKILLS.filter((k) => k.tree === tree);
  const skill = SKILLS.find((k) => k.id === detail);
  return (
    <Folio
      title="Character"
      eyebrow={`${game.statPoints} ATTRIBUTE POINTS · ${game.skillPoints} SKILL POINTS`}
    >
      <section className="folio-character">
        <Art sheet="characters" index={o.art} label={`Masked ${o.name}`} />
        <div>
          <span className="eyebrow">
            LEVEL {game.level} · {o.name}
          </span>
          <h2>
            {game.name}
            <small className="folio-xp">
              {game.xp} / {xpRequired(game.level)} XP
            </small>
          </h2>
          <Bar
            label="Experience"
            value={game.xp}
            max={xpRequired(game.level)}
          />
        </div>
      </section>
      <div
        className="tabs folio-tabs"
        role="tablist"
        aria-label="Character sections"
      >
        {["Attributes", "Skills", "Record"].map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            className={tab === t ? "active" : ""}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Attributes" ? (
        <div className="folio-list attributes-folio">
          <div className="folio-stats">
            <span>
              <SwordIcon size={18} />
              <b>{st.attack}</b> ATK
            </span>
            <span>
              <ShieldIcon size={18} />
              <b>{st.defense}</b> DEF
            </span>
            <span>
              <CrosshairIcon size={18} />
              <b>{st.crit}%</b> CRIT
            </span>
          </div>
          {(
            [
              {
                id: "might",
                name: "Might",
                hint: "Damage & maximum health",
                icon: SwordIcon,
              },
              {
                id: "will",
                name: "Will",
                hint: "Spell power & energy",
                icon: FireIcon,
              },
              {
                id: "agility",
                name: "Agility",
                hint: "Critical · armor · poison",
                icon: MoonIcon,
              },
            ] as const
          ).map((a) => (
            <div className="folio-attribute" key={a.id}>
              <a.icon size={24} />
              <div>
                <strong>{a.name}</strong>
                <span>{a.hint}</span>
              </div>
              <b>{game.attributes[a.id]}</b>
              <button
                aria-label={`Increase ${a.name}`}
                disabled={!game.statPoints || !!game.combat}
                onClick={() => act({ type: "ATTRIBUTE", id: a.id })}
              >
                <PlusIcon size={20} />
              </button>
            </div>
          ))}
          <p className="folio-note">
            Each level grants 2 attribute points and 1 skill point. Choose a
            skill path in Skills.
          </p>
        </div>
      ) : tab === "Skills" ? (
        <>
          <div
            className="tabs discipline-tabs"
            role="tablist"
            aria-label="Skill disciplines"
          >
            {["Steel", "Ember", "Shadow"].map((t) => (
              <button
                role="tab"
                aria-selected={tree === t}
                className={tree === t ? "active" : ""}
                key={t}
                onClick={() => {
                  setTree(t);
                }}
              >
                {t}
              </button>
            ))}
          </div>
          <div
            className="folio-list skill-scroll"
            key={tree}
            role="region"
            aria-label={`${tree} skills`}
            tabIndex={0}
          >
            {skills.map((k) => {
              const Icon = skillIcons[k.icon];
              const known = game.skills.includes(k.id);
              return (
                <button
                  className={`folio-row ${known ? "selected" : ""}`}
                  key={k.id}
                  onClick={() => setDetail(k.id)}
                >
                  <Icon size={25} />
                  <div>
                    <span className="eyebrow">
                      TIER {k.tier} ·{" "}
                      {k.passive ? "PASSIVE" : `${k.cost} ENERGY`}
                    </span>
                    <strong>{k.name}</strong>
                    <span>
                      {known
                        ? "Learned"
                        : `Level ${skillLevel(k.tier)} · ${k.tier} skill point${k.tier > 1 ? "s" : ""}`}
                    </span>
                  </div>
                  {known ? (
                    <CheckCircleIcon size={20} />
                  ) : (
                    <ArrowRightIcon size={18} />
                  )}
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <div className="folio-list record-folio">
          <p className="story-text">{o.epithet}</p>
          <div className="record-grid">
            <span>
              <b>{game.kills}</b>Foes overcome
            </span>
            <span>
              <b>{game.explored}</b>Rooms explored
            </span>
            <span>
              <b>{game.claimed.length}</b>Vows fulfilled
            </span>
            <span>
              <b>{game.reputation}</b>Town trust
            </span>
          </div>
          <p className="folio-note">
            Every origin can learn every discipline. Skills and attribute
            choices are permanent.
          </p>
        </div>
      )}
      {skill && (
        <Modal
          title={skill.name}
          eyebrow={`${skill.tree} · TIER ${skill.tier}`}
          onClose={() => setDetail(null)}
        >
          <p className="story-text">{skill.description}</p>
          <p>
            {skill.passive
              ? "Permanent passive effect"
              : `${skill.cost} energy per use`}{" "}
            · Requires level {skillLevel(skill.tier)} and {skill.tier} skill
            points.
          </p>
          <Button
            disabled={
              game.skills.includes(skill.id) ||
              game.level < skillLevel(skill.tier) ||
              game.skillPoints < skill.tier ||
              !!game.combat
            }
            onClick={() => act({ type: "LEARN", id: skill.id })}
          >
            {game.skills.includes(skill.id) ? "Learned" : "Learn skill"}
          </Button>
        </Modal>
      )}
    </Folio>
  );
}

function ItemStats({ item }: { item: Item }) {
  return (
    <div className="item-stats">
      {item.attack && (
        <span>
          <SwordIcon size={14} />+{item.attack} ATK
        </span>
      )}
      {item.defense && (
        <span>
          <ShieldIcon size={14} />+{item.defense} DEF
        </span>
      )}
      {item.hp && (
        <span>
          <HeartIcon size={14} />+{item.hp} HP
        </span>
      )}
      {item.energy && (
        <span>
          <LightningIcon size={14} />+{item.energy} EN
        </span>
      )}
      {item.crit && (
        <span>
          <CrosshairIcon size={14} />+{item.crit}% CRIT
        </span>
      )}
    </div>
  );
}
export function Inventory() {
  const { game, act } = useGame();
  const [filter, setFilter] = useState("All");
  const [detail, setDetail] = useState<string | null>(null);
  const items = game.inventory
    .map(itemById)
    .filter((i) => filter === "All" || i.slot === filter.toLowerCase())
    .sort(
      (a, b) =>
        Number(Object.values(game.equipped).includes(b.id)) -
          Number(Object.values(game.equipped).includes(a.id)) ||
        b.price - a.price,
    );
  const height = useViewportHeight();
  const pageSize = height < 620 ? 2 : height < 820 ? 4 : 6;
  const pager = usePage(items.length, pageSize);
  const item = detail ? itemById(detail) : null;
  const equipped = item && game.equipped[item.slot] === item.id;
  const current =
    item && game.equipped[item.slot]
      ? itemById(game.equipped[item.slot]!)
      : null;
  const st = stats(game);
  return (
    <Folio
      title="Inventory"
      eyebrow={`${game.inventory.length} BELONGINGS · ${game.gold} GOLD`}
    >
      <div className="folio-equipped">
        {(["weapon", "armor", "charm"] as const).map((slot) => {
          const i = game.equipped[slot] ? itemById(game.equipped[slot]!) : null;
          return (
            <button
              key={slot}
              disabled={!i}
              aria-label={`Inspect equipped ${slot}${i ? `: ${i.name}` : ""}`}
              onClick={() => i && setDetail(i.id)}
            >
              {i ? <ItemArt item={i} /> : <SparkleIcon size={22} />}
              <div>
                <span className="eyebrow">{slot}</span>
                <strong>{i?.name ?? "Empty slot"}</strong>
              </div>
            </button>
          );
        })}
      </div>
      <div className="folio-supply">
        <FlaskIcon size={23} />
        <div>
          <strong>
            Draughts · {game.potions}
            {game.potions <= SATCHEL_CAPACITY
              ? ` / ${SATCHEL_CAPACITY}`
              : " carried"}
          </strong>
          <span>Restore {draughtHealing(game)} HP</span>
        </div>
        <button
          disabled={!game.potions || !!game.combat || game.hp >= st.maxHp}
          onClick={() => act({ type: "POTION" })}
        >
          Drink
        </button>
      </div>
      <div
        className="tabs folio-tabs"
        role="tablist"
        aria-label="Inventory categories"
      >
        {["All", "Weapon", "Armor", "Charm"].map((f) => (
          <button
            role="tab"
            aria-selected={filter === f}
            className={filter === f ? "active" : ""}
            key={f}
            onClick={() => {
              setFilter(f);
              pager.setPage(0);
            }}
          >
            {f === "All" || f === "Armor" ? f : f + "s"}
          </button>
        ))}
      </div>
      <div
        className={`folio-list folio-pack ${pageSize === 4 ? "short-pack" : ""}`}
      >
        {items.slice(pager.start, pager.start + pageSize).map((i) => (
          <button
            className={`pack-tile rarity-${i.rarity.toLowerCase()}`}
            key={i.id}
            onClick={() => setDetail(i.id)}
          >
            <ItemArt item={i} />
            <div className="pack-copy">
              <span className="eyebrow">
                {Object.values(game.equipped).includes(i.id)
                  ? "EQUIPPED"
                  : i.rarity}
              </span>
              <strong>{i.name}</strong>
              <span>
                {i.slot === "weapon"
                  ? `+${i.attack ?? 0} ATK`
                  : i.slot === "armor"
                    ? `+${i.defense ?? 0} DEF`
                    : i.crit
                      ? `+${i.crit}% CRIT`
                      : i.hp
                        ? `+${i.hp} HP`
                        : `+${i.energy ?? 0} ENERGY`}
              </span>
            </div>
          </button>
        ))}
        {!items.length && (
          <p className="folio-note">No belongings in this category.</p>
        )}
      </div>
      <PageNav {...pager} />
      {item && (
        <Modal
          title={item.name}
          eyebrow={`${item.rarity} · ${item.slot}`}
          onClose={() => setDetail(null)}
        >
          <div className="item-inspect">
            <ItemArt item={item} />
            <p className="story-text">{item.description}</p>
          </div>
          <ItemStats item={item} />
          {!equipped && (
            <div className="item-compare">
              <strong>Compared with {current?.name ?? "an empty slot"}</strong>
              {(["attack", "defense", "hp", "energy", "crit"] as const)
                .filter((k) => (item[k] ?? 0) !== (current?.[k] ?? 0))
                .map((k) => {
                  const delta = (item[k] ?? 0) - (current?.[k] ?? 0);
                  return (
                    <span key={k} className={delta > 0 ? "better" : "worse"}>
                      {k.toUpperCase()} {delta > 0 ? "+" : ""}
                      {delta}
                    </span>
                  );
                })}
              {current &&
                (["attack", "defense", "hp", "energy", "crit"] as const).every(
                  (k) => (item[k] ?? 0) === (current[k] ?? 0),
                ) && <span>Same combat stats</span>}
            </div>
          )}
          <div className="item-inspect-actions">
            <Button
              disabled={!!equipped || !!game.combat}
              onClick={() => act({ type: "EQUIP", id: item.id })}
            >
              {equipped ? "Equipped" : "Equip item"}
            </Button>
            <Button
              kind="secondary"
              disabled={!!equipped || !!game.run}
              onClick={() => {
                act({ type: "SELL", id: item.id });
                setDetail(null);
              }}
            >
              Sell · {sellValue(item)} gold
            </Button>
          </div>
          {game.run && (
            <p className="folio-note">
              Sell belongings after returning to town.
            </p>
          )}
        </Modal>
      )}
    </Folio>
  );
}

export function Shop() {
  const { game, act, go } = useGame();
  const [filter, setFilter] = useState("All");
  const stock = ITEMS.filter(
    (i) =>
      i.price >= 50 &&
      itemAct(i) <= availableAct(game) &&
      (game.claimed.includes("bell") || i.rarity !== "Rare"),
  ).filter((i) => filter === "All" || i.slot === filter.toLowerCase());
  return (
    <div className="page-enter">
      <SectionTitle
        title="The Ironbound Forge"
        eyebrow="A SHARPER EDGE. A FIGHTING CHANCE."
      >
        <Gold amount={game.gold} />
      </SectionTitle>
      <div className="shop-story">
        <AnvilIllustration />
        <div>
          <p>
            “The dark doesn’t care how brave you are. Give it a reason to care
            how well you’re armed.”
          </p>
          <span>— TORREN, THE FORGE KEEPER</span>
        </div>
        <Button kind="secondary" onClick={() => go("inventory")}>
          Your equipment
          <ArrowRightIcon size={17} />
        </Button>
      </div>
      <div className="supply-row">
        <div className="supply-icon">
          <FlaskIcon size={27} weight="light" />
        </div>
        <div>
          <h3>Healing draught</h3>
          <p>
            Restores {draughtHealing(game)} HP · {game.potions}
            {game.potions <= SATCHEL_CAPACITY
              ? ` / ${SATCHEL_CAPACITY}`
              : " carried"}{" "}
            in your satchel
          </p>
        </div>
        <Button
          kind="secondary"
          disabled={
            game.gold < draughtPrice(game) ||
            !!game.run ||
            game.potions >= SATCHEL_CAPACITY
          }
          onClick={() => act({ type: "BUY", id: "potion" })}
        >
          Buy one
          <Gold amount={draughtPrice(game)} />
        </Button>
      </div>
      <Button
        className="bulk-supplies"
        kind="secondary"
        disabled={
          game.gold < draughtPrice(game) * 5 ||
          !!game.run ||
          game.potions + 5 > SATCHEL_CAPACITY
        }
        onClick={() => act({ type: "BUY", id: "potion-five" })}
      >
        Pack five draughts <Gold amount={draughtPrice(game) * 5} />
      </Button>
      <div className="tabs">
        {["All", "Weapon", "Armor", "Charm"].map((f) => (
          <button
            className={filter === f ? "active" : ""}
            key={f}
            onClick={() => setFilter(f)}
          >
            {f === "All" ? "All wares" : f === "Armor" ? f : f + "s"}
          </button>
        ))}
      </div>
      <div className="inventory-grid">
        {stock.map((i) => {
          const owned = game.inventory.includes(i.id);
          return (
            <article
              key={i.id}
              className={`item-card rarity-${i.rarity.toLowerCase()}`}
            >
              <div className="item-top">
                <div className="item-emblem">
                  <ItemArt item={i} />
                </div>
                <Badge>{i.rarity}</Badge>
              </div>
              <h3>{i.name}</h3>
              <p>{i.description}</p>
              <ItemStats item={i} />
              <div className="item-actions">
                <Gold amount={i.price} />
                <Button
                  kind="secondary"
                  disabled={owned || game.gold < i.price || !!game.run}
                  onClick={() => act({ type: "BUY", id: i.id })}
                >
                  {owned ? "Owned" : "Purchase"}
                </Button>
              </div>
            </article>
          );
        })}
      </div>
      <p className="inline-note">
        New equipment arrives as you open regions. Each piece has its own
        history.
      </p>
    </div>
  );
}
function AnvilIllustration() {
  return (
    <div className="shop-emblem">
      <SwordIcon size={42} weight="thin" />
      <FireIcon size={24} weight="thin" />
    </div>
  );
}

export function Codex() {
  const { game } = useGame();
  const [tab, setTab] = useState("Lore");
  return (
    <div className="page-enter">
      <SectionTitle title="What the dark remembers" eyebrow="THE ARCHIVE" />
      <div className="tabs">
        {["Lore", "Bestiary"].map((t) => (
          <button
            key={t}
            className={tab === t ? "active" : ""}
            onClick={() => setTab(t)}
          >
            {t === "Lore" ? (
              <BookOpenIcon size={16} />
            ) : (
              <SwordIcon size={16} />
            )}{" "}
            {t}
          </button>
        ))}
      </div>
      {tab === "Lore" ? (
        <div className="lore-grid">
          {LORE.filter(
            (l) => !l.requires || game.claimed.includes(l.requires),
          ).map((l, i) => (
            <article className="lore-card" key={l.id}>
              <Art index={i % 4} />
              <div>
                <span className="eyebrow">FRAGMENT 0{i + 1}</span>
                <h3>{l.title}</h3>
                <p>{l.text}</p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="bestiary-grid">
          {ENEMIES.map((e) => (
            <article className="bestiary-card" key={e.id}>
              <Art sheet="enemies" index={e.art} label={e.name} />
              <div>
                <Badge className={e.boss ? "danger" : ""}>
                  {e.boss ? "Guardian" : "Creature"}
                </Badge>
                <h3>{e.name}</h3>
                <p>{e.description}</p>
                <div className="item-stats">
                  <span>
                    <HeartIcon size={14} />
                    {e.hp}
                  </span>
                  <span>
                    <SwordIcon size={14} />
                    {e.attack}
                  </span>
                  <span>
                    <ShieldIcon size={14} />
                    {e.defense}
                  </span>
                </div>
                {game.bosses.includes(e.id) && (
                  <span className="equipped-label">
                    <CheckCircleIcon size={13} />
                    Overcome
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
