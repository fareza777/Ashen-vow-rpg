import { soundscape } from "./audio";
import { INTRO_PAGES } from "./campaign";
import { Guide } from "./Guide";
import { useState, useEffect, useRef, useCallback } from "react";
import type { CSSProperties } from "react";
import { ads } from "./admob";
import { useAds, RewardedSupplies } from "./RewardedSupplies";
import { rewardDate } from "./adRewards";
import { purchases } from "./purchases";
import { RemoveAds, usePurchases } from "./RemoveAds";
import { App as NativeApp } from "@capacitor/app";
import {
  isNativeApp,
  saveLocalValue,
  shareNativeSave,
  shareNativeGame,
} from "./native";
import {
  CastleTurretIcon,
  CompassIcon,
  ScrollIcon,
  UserCircleIcon,
  BackpackIcon,
  BookOpenIcon,
  GearSixIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  SpeakerHighIcon,
  SpeakerSlashIcon,
  HeartIcon,
  LightningIcon,
  FlameIcon,
  CoinsIcon,
  CheckCircleIcon,
  DotsThreeIcon,
  ShareNetworkIcon,
  StarIcon,
  InfoIcon,
  DownloadSimpleIcon,
  UploadSimpleIcon,
  XIcon,
  MapTrifoldIcon,
  SwordIcon,
  ShieldIcon,
  SparkleIcon,
  CampfireIcon,
  ChurchIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { GameContext } from "./context";
import type { Screen, Dialog } from "./context";
import {
  createGame,
  reduceGame,
  parseSave,
  SAVE_KEY,
  stats,
  xpRequired,
} from "./engine";
import type { GameState, Action } from "./engine";
import { restPrice, shrinePrice } from "./economy";
import { ORIGINS } from "./data";
import type { OriginId } from "./data";
import { Town } from "./Town";
import { Dungeon } from "./Dungeon";
import { Quests, Character, Inventory, Shop, Codex } from "./Progression";
import { Art, Bar, Badge, Button, Modal, OrnamentalDivider, Gold } from "./ui";

type Settings = {
  music: boolean;
  sfx: boolean;
  reducedMotion: boolean;
  largeText: boolean;
};
const defaultSettings: Settings = {
  music: false,
  sfx: true,
  reducedMotion: false,
  largeText: false,
};
function loadSettings(): Settings {
  try {
    return {
      ...defaultSettings,
      ...JSON.parse(localStorage.getItem("ashen-vow-settings") ?? "{}"),
    };
  } catch {
    return defaultSettings;
  }
}
function freshSeed() {
  return crypto.getRandomValues(new Uint32Array(1))[0];
}
function loadGame(): GameState {
  try {
    return (
      parseSave(localStorage.getItem(SAVE_KEY) ?? "") ??
      createGame(undefined, undefined, freshSeed())
    );
  } catch {
    return createGame(undefined, undefined, Date.now() >>> 0);
  }
}
const navigation = [
  { screen: "town" as Screen, label: "Town hub", icon: CastleTurretIcon },
  { screen: "dungeon" as Screen, label: "Explore", icon: CompassIcon },
  { screen: "quests" as Screen, label: "Quest journal", icon: ScrollIcon },
  { screen: "character" as Screen, label: "Character", icon: UserCircleIcon },
  { screen: "inventory" as Screen, label: "Inventory", icon: BackpackIcon },
  { screen: "codex" as Screen, label: "The archive", icon: BookOpenIcon },
];
const pageNames: Record<Screen, string> = {
  town: "Town hub",
  dungeon: "The hollow",
  quests: "Quest journal",
  character: "Character",
  inventory: "Inventory",
  codex: "The archive",
  shop: "The forge",
  menu: "Main menu",
};

export default function App() {
  const [game, setGame] = useState(loadGame);
  const [screen, setScreen] = useState<Screen>(() =>
    game.run || game.defeat
      ? "dungeon"
      : game.explored || game.accepted.length
        ? "town"
        : "menu",
  );
  const [dialog, setDialog] = useState<Dialog>(null);
  const [settings, setSettings] = useState(loadSettings);
  const adState = useAds();
  const purchaseState = usePurchases();
  const [foreground, setForeground] = useState(true);
  const [adOverlay, setAdOverlay] = useState(false);
  const currentGame = useRef(game);
  currentGame.current = game;
  const saveGeneration = useRef(0);
  const [splash, setSplash] = useState(true);
  const [intro, setIntro] = useState(false);
  const [toast, setToast] = useState("");
  const [saveError, setSaveError] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [readyOffline, setReadyOffline] = useState(
    isNativeApp || !!navigator.serviceWorker?.controller,
  );
  const importRef = useRef<HTMLInputElement>(null);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const inform = useCallback((text: string) => {
    setToast(text);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 6500);
  }, []);
  const act = useCallback((a: Action) => {
    setGame((s) => reduceGame(s, a));
  }, []);
  const go = (next: Screen) => {
    if (game.defeat && next !== "menu" && next !== "dungeon") {
      setScreen("dungeon");
      return;
    }
    if ((next === "town" || next === "shop") && game.run) {
      inform(
        "Your expedition is still in progress. Return to town from the dungeon map.",
      );
      setScreen("dungeon");
      return;
    }
    setScreen(next);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  useEffect(() => {
    const t = setTimeout(() => setSplash(false), 1350);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    const check = () =>
      setAdOverlay(!!document.querySelector('[role="dialog"]'));
    const observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true });
    check();
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    ads.setPlacement({
      screen,
      blocked:
        splash ||
        intro ||
        !!dialog ||
        !!document.querySelector('[role="dialog"]') ||
        !!game.run ||
        !!game.defeat,
      rewardAllowed:
        screen === "town" &&
        dialog === "tavern" &&
        !splash &&
        !intro &&
        !game.run &&
        !game.defeat,
      active:
        foreground &&
        !splash &&
        purchaseState.checked &&
        purchaseState.busy !== "purchase",
    });
  }, [
    screen,
    splash,
    intro,
    dialog,
    adOverlay,
    foreground,
    !!game.run,
    !!game.defeat,
    purchaseState.checked,
    purchaseState.busy,
  ]);
  useEffect(() => {
    ads.setOnline(online);
    purchases.setOnline(online);
  }, [online]);
  useEffect(() => {
    if (!splash) void purchases.refresh();
  }, [splash, online]);
  useEffect(() => {
    if (!splash && purchaseState.checked) void ads.start();
  }, [splash, purchaseState.checked]);
  useEffect(() => {
    soundscape.interrupt(
      adState.fullscreen || purchaseState.busy === "purchase" || !foreground,
    );
  }, [adState.fullscreen, foreground, purchaseState.busy]);
  useEffect(() => {
    ads.setMuted(!settings.music && !settings.sfx);
  }, [settings.music, settings.sfx]);
  useEffect(() => {
    if (!isNativeApp) return;
    const listener = NativeApp.addListener("appStateChange", ({ isActive }) => {
      ads.setForeground(isActive);
      setForeground(isActive);
      if (isActive) void purchases.refresh();
    });
    return () => {
      void listener.then((handle) => handle.remove()).catch(() => {});
    };
  }, []);
  useEffect(() => {
    let current = true;
    void saveLocalValue(SAVE_KEY, JSON.stringify(game))
      .then(() => {
        if (current) setSaveError(false);
      })
      .catch(() => {
        if (current) setSaveError(true);
      });
    if (game.notice && !game.run) inform(game.notice);
    else setToast("");
    return () => {
      current = false;
    };
  }, [game, inform]);
  const hadExpedition = useRef(!!(game.run || game.defeat));
  const previousRun = useRef(game.run);
  useEffect(() => {
    if (
      hadExpedition.current &&
      !game.run &&
      !game.defeat &&
      screen === "dungeon"
    ) {
      if (previousRun.current)
        ads.queueExpeditionBreak(
          `return-${game.day}-${game.seed}`,
          previousRun.current.rooms,
        );
      setScreen("town");
      window.scrollTo({ top: 0, behavior: "instant" });
    }
    hadExpedition.current = !!(game.run || game.defeat);
    previousRun.current = game.run;
  }, [game.run, game.defeat, screen]);
  useEffect(() => {
    if ((game.combat?.enemyId || game.run?.eventId) && window.innerWidth < 768)
      window.scrollTo({ top: 0, behavior: "instant" });
  }, [game.combat?.enemyId, game.run?.eventId]);
  useEffect(() => {
    void saveLocalValue("ashen-vow-settings", JSON.stringify(settings)).catch(
      () => {},
    );
    document.documentElement.classList.toggle(
      "reduce-motion",
      settings.reducedMotion,
    );
    document.documentElement.classList.toggle("large-text", settings.largeText);
  }, [settings]);
  useEffect(() => {
    if (!isNativeApp) return;
    let cancelled = false;
    const listener = NativeApp.addListener("backButton", () => {
      if (
        ads.getSnapshot().fullscreen ||
        purchases.getSnapshot().busy === "purchase"
      )
        return;
      const backEvent = new Event("ashen-back", { cancelable: true });
      window.dispatchEvent(backEvent);
      if (backEvent.defaultPrevented) return;
      if (dialog) setDialog(null);
      else if (intro) {
        setIntro(false);
        setDialog("tutorial");
      } else if (screen === "menu") void NativeApp.minimizeApp();
      else if (
        screen === "town" ||
        (screen === "dungeon" && (game.run || game.defeat))
      )
        setScreen("menu");
      else {
        setScreen(game.run || game.defeat ? "dungeon" : "town");
        window.scrollTo({ top: 0, behavior: "instant" });
      }
    });
    void listener.then((handle) => {
      if (cancelled) void handle.remove();
    });
    return () => {
      cancelled = true;
      void listener.then((handle) => handle.remove());
    };
  }, [dialog, intro, screen, !!game.run, !!game.defeat]);
  useEffect(() => {
    const handler = () => setOnline(navigator.onLine);
    const ready = () => setReadyOffline(true);
    window.addEventListener("online", handler);
    window.addEventListener("offline", handler);
    navigator.serviceWorker?.addEventListener("controllerchange", ready);
    return () => {
      window.removeEventListener("online", handler);
      window.removeEventListener("offline", handler);
      navigator.serviceWorker?.removeEventListener("controllerchange", ready);
    };
  }, []);
  useEffect(() => {
    if (!dialog && !intro) return;
    const previous = document.activeElement as HTMLElement;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !intro) setDialog(null);
      if (e.key === "Tab") {
        const m = document.querySelector('[role="dialog"]');
        const nodes = Array.from(
          m?.querySelectorAll<HTMLElement>(
            "button:not(:disabled),input,select,a[href]",
          ) ?? [],
        );
        if (!nodes.length) return;
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    const t = setTimeout(
      () =>
        document.querySelector<HTMLElement>('[role="dialog"] button')?.focus(),
      50,
    );
    return () => {
      document.removeEventListener("keydown", key);
      clearTimeout(t);
      previous?.focus();
    };
  }, [dialog, intro]);
  const region = game.run?.biome ?? "town";
  const lastFx = useRef(game.battleFx?.sequence ?? 0);
  useEffect(() => {
    soundscape.configure(settings.music, settings.sfx, region);
  }, [settings.music, settings.sfx, region]);
  useEffect(() => {
    const fx = game.battleFx;
    if (fx && fx.sequence > lastFx.current) soundscape.battle(fx);
    lastFx.current = fx?.sequence ?? 0;
  }, [game.battleFx]);
  useEffect(() => {
    const handler = () => soundscape.visibility();
    document.addEventListener("visibilitychange", handler);
    return () => {
      document.removeEventListener("visibilitychange", handler);
      soundscape.stop();
    };
  }, []);
  function clickSound() {
    soundscape.gesture(settings.music, settings.sfx, region);
    if (settings.sfx) soundscape.click();
  }
  function toggleMusic() {
    soundscape.unlock();
    setSettings((s) => ({ ...s, music: !s.music }));
  }
  const exportSave = async () => {
    const fileName = `ashen-vow-${game.name.toLowerCase().replace(/[^a-z0-9_-]/g, "-")}-day-${game.day}.json`;
    if (isNativeApp) {
      try {
        await shareNativeSave(fileName, JSON.stringify(game, null, 2));
        inform(
          "Your backup is ready. Keep the JSON file to restore your journey.",
        );
      } catch {
        inform(
          "Backup sharing closed. Your journey remains saved on this device.",
        );
      }
      return;
    }
    const blob = new Blob([JSON.stringify(game, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    inform(
      "Your journey has been exported. Keep this file to restore it on another device.",
    );
  };
  const importSave = async (file?: File) => {
    if (!file) return;
    if (file.size > 1500000) {
      inform("That file is too large to be a journey save.");
      return;
    }
    const loaded = parseSave(await file.text());
    if (!loaded) {
      inform("This save could not be read. Your current journey is safe.");
      return;
    }
    setGame(loaded);
    saveGeneration.current++;
    setScreen(loaded.run || loaded.defeat ? "dungeon" : "town");
    setDialog(null);
    inform(`Welcome back, ${loaded.name}. Your journey has been restored.`);
  };
  const share = async () => {
    const text =
      "Ashen Vow: The Hollow Below — carry a light, keep a promise. An original dark fantasy RPG.";
    try {
      if (isNativeApp) await shareNativeGame(text);
      else if (navigator.share)
        await navigator.share({ title: "Ashen Vow", text });
      else {
        await navigator.clipboard.writeText(text);
        inform(
          "A message about Ashen Vow has been copied. Share it with a fellow traveller.",
        );
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") inform(text);
    }
  };
  const close = () => setDialog(null);
  const createRewardCredit = () => {
    const generation = saveGeneration.current;
    return (receipt: string) => {
      if (generation !== saveGeneration.current) return;
      const next = reduceGame(currentGame.current, {
        type: "AD_REWARD",
        receipt,
        date: rewardDate(),
      });
      currentGame.current = next;
      setGame(next);
      // Persist the earned callback immediately, while the native ad may still be open.
      void saveLocalValue(SAVE_KEY, JSON.stringify(next)).catch(() =>
        setSaveError(true),
      );
    };
  };
  const st = stats(game);
  const o = ORIGINS.find((o) => o.id === game.origin)!;
  return (
    <GameContext.Provider value={{ game, act, go, open: setDialog, screen }}>
      <div
        className={`app ${screen === "dungeon" && (game.run || game.defeat) ? "journey-session" : ""} ${screen === "town" ? "journey-town" : ""} ${["character", "quests", "inventory"].includes(screen) ? "folio-session" : ""}`}
        style={
          { "--ad-banner-height": `${adState.bannerHeight}px` } as CSSProperties
        }
        data-ad-banner={adState.bannerHeight > 0 ? "active" : "none"}
        data-ad-fullscreen={adState.fullscreen}
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest("button")) clickSound();
        }}
      >
        {screen === "menu" ? (
          <MainMenu game={game} go={go} open={setDialog} share={share} />
        ) : (
          <>
            <aside className="sidebar">
              <button
                className="brand"
                onClick={() => go("menu")}
                aria-label="Open main menu"
              >
                <img src="/art/icon.png" alt="" />
                <div>
                  <strong>ASHEN VOW</strong>
                  <span>THE HOLLOW BELOW</span>
                </div>
              </button>
              <OrnamentalDivider />
              <span className="nav-label">YOUR JOURNEY</span>
              <nav>
                {navigation.map((n) => (
                  <button
                    key={n.screen}
                    onClick={() => go(n.screen)}
                    className={screen === n.screen ? "active" : ""}
                  >
                    <n.icon
                      size={21}
                      weight={screen === n.screen ? "regular" : "light"}
                    />
                    <span>{n.label}</span>
                    {n.screen === "quests" &&
                      game.completed.length > game.claimed.length && (
                        <i className="nav-count">
                          {game.completed.length - game.claimed.length}
                        </i>
                      )}
                    {n.screen === "character" && game.skillPoints > 0 && (
                      <span className="nav-spark" />
                    )}
                  </button>
                ))}
              </nav>
              <div className="sidebar-bottom">
                <div className="sidebar-quote">
                  <img src="/art/icon.png" alt="" />
                  <p>
                    Let the dark remember
                    <br />
                    you carried a light.
                  </p>
                </div>
                <button
                  className="sidebar-setting"
                  onClick={() => setDialog("settings")}
                >
                  <GearSixIcon size={20} weight="light" />
                  Settings
                  <ArrowRightIcon size={14} />
                </button>
                <button className="player-card" onClick={() => go("character")}>
                  <Art sheet="characters" index={o.art} />
                  <div>
                    <strong>{game.name}</strong>
                    <span>
                      Level {game.level} · {o.name}
                    </span>
                    <div className="bar-track">
                      <i
                        style={{
                          width: `${(game.xp / xpRequired(game.level)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <DotsThreeIcon size={18} />
                </button>
              </div>
            </aside>
            <div className="workspace">
              <header className="topbar">
                <div className="breadcrumb">
                  <span>YOUR JOURNEY</span>
                  <span>/</span>
                  <strong>{pageNames[screen]}</strong>
                </div>
                <div className="topbar-actions">
                  <span className={`save-status ${saveError ? "error" : ""}`}>
                    <span className="live-dot" />
                    {saveError
                      ? "Save unavailable"
                      : online
                        ? "Journey saved"
                        : "Offline · saved"}
                  </span>
                  <button
                    className="icon-button"
                    onClick={toggleMusic}
                    aria-label={
                      settings.music ? "Mute ambience" : "Enable ambience"
                    }
                    title="Ambient sound"
                  >
                    {settings.music ? (
                      <SpeakerHighIcon size={19} weight="light" />
                    ) : (
                      <SpeakerSlashIcon size={19} weight="light" />
                    )}
                  </button>
                  <button
                    className="icon-button mobile-menu"
                    onClick={() => go("menu")}
                    aria-label="Open main menu"
                  >
                    <DotsThreeIcon size={23} />
                  </button>
                </div>
              </header>
              <div className="status-strip">
                <Bar
                  label="Health"
                  value={game.hp}
                  max={st.maxHp}
                  color="red"
                  icon={<HeartIcon size={15} />}
                />
                <Bar
                  label="Energy"
                  value={game.energy}
                  max={st.maxEnergy}
                  color="blue"
                  icon={<LightningIcon size={15} />}
                />
                <Bar
                  label="Resolve"
                  value={game.resolve}
                  max={100}
                  color="gold"
                  icon={<FlameIcon size={15} />}
                />
                <div className="currency">
                  <CoinsIcon size={22} weight="light" />
                  <div>
                    <span>GOLD</span>
                    <strong>{game.gold.toLocaleString()}</strong>
                  </div>
                </div>
                <div className="level-status">
                  <span>LEVEL</span>
                  <strong>{game.level.toString().padStart(2, "0")}</strong>
                  <span>{o.name}</span>
                </div>
              </div>
              <main className="main-content">
                {!game.combat &&
                  screen !== "town" &&
                  !["character", "quests", "inventory"].includes(screen) &&
                  !(screen === "dungeon" && (game.run || game.defeat)) && (
                    <Guide />
                  )}
                {screen === "town" ? (
                  <Town />
                ) : screen === "dungeon" ? (
                  <Dungeon />
                ) : screen === "quests" ? (
                  <Quests />
                ) : screen === "character" ? (
                  <Character />
                ) : screen === "inventory" ? (
                  <Inventory />
                ) : screen === "shop" ? (
                  <Shop />
                ) : (
                  <Codex />
                )}
                <footer className="app-footer">
                  <span>
                    ASHEN VOW <i>·</i> THE HOLLOW BELOW
                  </span>
                  <span>A light worth carrying.</span>
                </footer>
              </main>
            </div>
            <nav className="mobile-nav" aria-label="Main navigation">
              {navigation.slice(0, 5).map((n) => (
                <button
                  key={n.screen}
                  className={screen === n.screen ? "active" : ""}
                  onClick={() => go(n.screen)}
                >
                  <n.icon size={23} weight="light" />
                  <span>
                    {n.screen === "town"
                      ? "Town"
                      : n.screen === "dungeon"
                        ? "Explore"
                        : n.screen === "quests"
                          ? "Quests"
                          : n.label}
                  </span>
                </button>
              ))}
            </nav>
          </>
        )}
        {toast && (
          <div className="toast" role="status">
            <SparkleIcon size={19} />
            <span>{toast}</span>
            <button
              aria-label="Dismiss notification"
              onClick={() => setToast("")}
            >
              <XIcon size={16} />
            </button>
          </div>
        )}
        {dialog === "tutorial" && (
          <Tutorial
            onClose={close}
            onFinish={() => {
              close();
              go("quests");
            }}
          />
        )}
        {dialog === "newgame" && (
          <NewGame
            onClose={close}
            onStart={(name, origin) => {
              saveGeneration.current++;
              setGame(createGame(name, origin, freshSeed()));
              setScreen("town");
              setDialog(null);
              setIntro(true);
            }}
          />
        )}
        {dialog === "settings" && (
          <Modal
            title="Make yourself at home"
            eyebrow="SETTINGS"
            onClose={close}
          >
            <p className="muted">A journey at your own pace.</p>
            <div className="settings-list">
              <Setting
                label="Nature ambience"
                text="Quiet water drops and stone echoes in town; wind and water in the wilds. No instrumental music."
                checked={settings.music}
                onChange={toggleMusic}
              />
              <Setting
                label="Sound effects"
                text="Blade impacts, armor, healing, and battle feedback"
                checked={settings.sfx}
                onChange={() => setSettings((s) => ({ ...s, sfx: !s.sfx }))}
              />
              <Setting
                label="Reduce motion"
                text="Quiet transitions and still artwork"
                checked={settings.reducedMotion}
                onChange={() =>
                  setSettings((s) => ({
                    ...s,
                    reducedMotion: !s.reducedMotion,
                  }))
                }
              />
              <Setting
                label="Larger story text"
                text="More comfortable reading"
                checked={settings.largeText}
                onChange={() =>
                  setSettings((s) => ({ ...s, largeText: !s.largeText }))
                }
              />
            </div>
            <div className="settings-language">
              <span>Language</span>
              <strong>English</strong>
            </div>
            <RemoveAds inform={inform} />
            {adState.privacyRequired && (
              <Button
                kind="secondary"
                disabled={!online || adState.fullscreen}
                onClick={() => void ads.privacyChoices()}
              >
                <GearSixIcon size={18} />
                Advertising privacy choices
              </Button>
            )}
            <div className="save-settings">
              <h3>Your journey, kept safe</h3>
              <p>
                {isNativeApp
                  ? "Saved automatically on this device after every action. Export a backup before uninstalling the app or clearing its data."
                  : "Saved automatically on this browser after every action. Export a backup before clearing browser data."}
              </p>
              <div>
                <Button kind="secondary" onClick={exportSave}>
                  <DownloadSimpleIcon size={17} />
                  Export save
                </Button>
                <Button
                  kind="secondary"
                  onClick={() => importRef.current?.click()}
                >
                  <UploadSimpleIcon size={17} />
                  Import save
                </Button>
              </div>
              <span className="tiny muted">
                Importing a valid file replaces your current journey.
              </span>
              <p className="offline-setting">
                <CheckCircleIcon size={15} />
                {readyOffline
                  ? "Ready to play offline on this device."
                  : "Offline play is enabled in the production build after its first complete load."}
              </p>
            </div>
            <Button kind="ghost" onClick={() => setDialog("tutorial")}>
              Revisit the tutorial
              <ArrowRightIcon size={17} />
            </Button>
          </Modal>
        )}
        {dialog === "about" && (
          <Modal
            title="Every vow has a price."
            eyebrow="ABOUT ASHEN VOW"
            onClose={close}
          >
            <img
              className="about-icon"
              src="/art/icon.png"
              alt="Ashen Vow lantern emblem"
            />
            <p className="story-text">
              An original dark fantasy RPG about what we choose to carry when
              the light begins to fade.
            </p>
            <p className="muted">
              Explore eight connected regions, discover branching stories, and
              shape your own discipline. All characters, lore, world names,
              interface, and generated illustrations belong to this original
              prototype.
            </p>
            <div className="about-details">
              <span>
                Version<strong>0.2.7 · Playable prototype</strong>
              </span>
              <span>
                World<strong>The Northern Reaches</strong>
              </span>
              <span>
                Your data<strong>Local to this device</strong>
              </span>
            </div>
            <p className="tiny muted">
              Inspired by the text adventure and turn-based dungeon crawler
              genre. Original artwork created with image generation. No account.
              Android offers optional rewarded supplies and a one-time Remove
              Ads purchase; the journey remains playable offline.
            </p>
            <p className="tiny muted">
              Town ambience: water drops and cavern echoes by Sclolex, adapted
              under CC0.
            </p>
            <Button
              kind="secondary"
              onClick={() => {
                close();
                go("codex");
              }}
            >
              Read the archive
              <ArrowRightIcon size={17} />
            </Button>
          </Modal>
        )}
        {dialog === "rate" && (
          <Modal
            title="The next chapter awaits"
            eyebrow="GOOGLE PLAY"
            onClose={close}
          >
            <StarIcon className="dialog-symbol" size={42} weight="thin" />
            <p className="story-text">
              Ashen Vow is currently a playable prototype and has not been
              published on Google Play.
            </p>
            <p className="muted">
              The rating link will become available when the game has its own
              store listing. For now, you can share the journey with a friend.
            </p>
            <Button onClick={() => void share()}>
              <ShareNetworkIcon size={18} />
              Share Ashen Vow
            </Button>
          </Modal>
        )}
        {dialog === "tavern" && (
          <Modal
            title="The Lantern & Thorn"
            eyebrow="A LITTLE WARMTH"
            onClose={close}
          >
            <div className="dialog-landscape">
              <img src="/art/town.png" alt="Warm lanterns in Vesper's Rest" />
            </div>
            <p className="story-text">
              “Sit by the fire. The dark can wait until morning.”
            </p>
            <p className="muted">
              A meal and a room restore all health and energy, renew 25 resolve,
              and begin a new day.
            </p>
            <Button
              disabled={game.gold < restPrice(game) || !!game.run}
              onClick={() => {
                act({ type: "REST" });
                close();
              }}
            >
              <CampfireIcon size={18} />
              Rest for the night
              <Gold amount={restPrice(game)} />
            </Button>
            <RewardedSupplies
              game={game}
              inform={inform}
              createCredit={createRewardCredit}
            />
          </Modal>
        )}
        {dialog === "shrine" && (
          <Modal
            title="Shrine of the Ember"
            eyebrow="A PROMISE REMEMBERED"
            onClose={close}
          >
            <div className="dialog-landscape">
              <Art index={3} />
            </div>
            <p className="story-text">
              When nothing remains, let us remain kind.
            </p>
            <p className="muted">
              Light a candle for the missing. Restore 35 resolve. Below 25
              resolve, the weight of the dark reduces your damage.
            </p>
            <Button
              disabled={
                game.gold < shrinePrice(game) ||
                game.resolve === 100 ||
                !!game.run
              }
              onClick={() => {
                act({ type: "SHRINE" });
                close();
              }}
            >
              <ChurchIcon size={18} />
              Light a candle
              <Gold amount={shrinePrice(game)} />
            </Button>
          </Modal>
        )}
        <input
          type="file"
          accept="application/json,.json"
          ref={importRef}
          className="hidden"
          onChange={(e) => {
            void importSave(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        {intro && (
          <Intro
            onFinish={() => {
              setIntro(false);
              setDialog("tutorial");
            }}
          />
        )}
        {splash && (
          <div className="splash">
            <img src="/art/icon.png" alt="Ashen Vow" />
            <h1>ASHEN VOW</h1>
            <span>THE HOLLOW BELOW</span>
            <OrnamentalDivider />
            <p>Every night leaves room for a dawn.</p>
            <div className="splash-progress">
              <i />
            </div>
          </div>
        )}
      </div>
    </GameContext.Provider>
  );
}

function MainMenu({
  game,
  go,
  open,
  share,
}: {
  game: GameState;
  go: (s: Screen) => void;
  open: (d: Dialog) => void;
  share: () => Promise<void>;
}) {
  const fresh =
    !game.explored && !game.accepted.length && game.inventory.length === 2;
  return (
    <div className="main-menu">
      <img
        className="menu-background"
        src="/art/cover.png"
        alt="A lantern keeper on the bridge to the Hollow Spire"
      />
      <div className="menu-vignette" />
      <div className="menu-content">
        <img className="menu-emblem" src="/art/icon.png" alt="" />
        <span className="eyebrow">AN ORIGINAL DARK FANTASY ADVENTURE</span>
        <h1>
          ASHEN
          <br />
          <span>VOW</span>
        </h1>
        <div className="menu-subtitle">
          <span />
          THE HOLLOW BELOW
          <span />
        </div>
        <p>Let the dark remember you carried a light.</p>
        <div className="menu-buttons">
          {!fresh && (
            <>
              <Button
                onClick={() => go(game.run || game.defeat ? "dungeon" : "town")}
              >
                Continue your journey
                <ArrowRightIcon size={18} />
              </Button>
              <span className="menu-save">
                {game.name} · Level {game.level} · Day {game.day}
              </span>
            </>
          )}
          <Button
            kind={fresh ? "primary" : "secondary"}
            onClick={() => open("newgame")}
          >
            Begin a new vow
          </Button>
        </div>
        <div className="menu-links">
          <button onClick={() => open("settings")}>
            <GearSixIcon size={18} />
            Settings
          </button>
          <button onClick={() => open("about")}>
            <InfoIcon size={18} />
            About
          </button>
          <button onClick={() => void share()}>
            <ShareNetworkIcon size={18} />
            Share
          </button>
          <button onClick={() => open("rate")}>
            <StarIcon size={18} />
            Rate
          </button>
        </div>
        <span className="menu-version">
          v0.2.7 · YOUR STORY IS SAVED LOCALLY
        </span>
      </div>
    </div>
  );
}

function NewGame({
  onClose,
  onStart,
}: {
  onClose: () => void;
  onStart: (name: string, origin: OriginId) => void;
}) {
  const [name, setName] = useState("Elara");
  const [origin, setOrigin] = useState<OriginId>("oathkeeper");
  const o = ORIGINS.find((o) => o.id === origin)!;
  return (
    <Modal
      title="Who carries the lantern?"
      eyebrow="BEGIN A NEW VOW"
      onClose={onClose}
      wide
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onStart(name, origin);
        }}
      >
        <label className="name-label" htmlFor="character-name">
          YOUR NAME
        </label>
        <input
          id="character-name"
          className="name-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={22}
          placeholder="A name the dark will remember"
          required
        />
        <span className="name-label">CHOOSE YOUR ORIGIN</span>
        <div className="origin-grid">
          {ORIGINS.map((o) => (
            <button
              type="button"
              key={o.id}
              className={`origin-option ${origin === o.id ? "selected" : ""}`}
              onClick={() => setOrigin(o.id)}
            >
              <Art
                sheet="characters"
                index={o.art}
                label={`Masked ${o.name}`}
              />
              <div>
                <h3>{o.name}</h3>
                <span>{o.epithet}</span>
              </div>
              {origin === o.id && <CheckCircleIcon size={21} />}
            </button>
          ))}
        </div>
        <div className="origin-description">
          <p>{o.description}</p>
          <span>
            Might {o.might} <i>·</i> Will {o.will} <i>·</i> Agility {o.agility}
          </span>
        </div>
        <p className="tiny muted">
          Beginning a new vow replaces the current journey. Export your save in
          Settings to keep a backup.
        </p>
        <Button type="submit" className="full-width">
          Take the lantern oath
          <ArrowRightIcon size={18} />
        </Button>
      </form>
    </Modal>
  );
}

function Intro({ onFinish }: { onFinish: () => void }) {
  const [step, setStep] = useState(0);
  const lines = INTRO_PAGES;
  return (
    <div
      className="cinematic"
      role="dialog"
      aria-modal="true"
      aria-label="Cinematic introduction"
    >
      <Art
        key={`art-${step}`}
        sheet="story-pages"
        index={lines[step].art}
        className="cinematic-background"
        label="The world during the Long Dimming"
      />
      <div className="cinematic-shade" />
      <button className="skip-intro" onClick={onFinish}>
        Skip introduction
        <ArrowRightIcon size={16} />
      </button>
      <div className="cinematic-copy" key={step}>
        <span className="eyebrow">{lines[step].eyebrow}</span>
        <h1>{lines[step].title}</h1>
        <OrnamentalDivider />
        <p>{lines[step].text}</p>
      </div>
      <div className="cinematic-controls">
        <div>
          <span className="cinematic-page">
            {step + 1} / {lines.length}
          </span>
          {lines.map((_, i) => (
            <span key={i} className={step === i ? "active" : ""} />
          ))}
        </div>
        <button
          className="text-button"
          disabled={!step}
          onClick={() => setStep(step - 1)}
        >
          <ArrowLeftIcon size={17} />
          Back
        </button>
        <Button
          kind="secondary"
          onClick={() =>
            step < lines.length - 1 ? setStep(step + 1) : onFinish()
          }
        >
          {step === lines.length - 1 ? "Carry the light" : "Continue"}
          <ArrowRightIcon size={18} />
        </Button>
      </div>
    </div>
  );
}

function Tutorial({
  onClose,
  onFinish,
}: {
  onClose: () => void;
  onFinish: () => void;
}) {
  const [step, setStep] = useState(0);
  const slides = [
    {
      icon: ScrollIcon,
      title: "Your first promise",
      text: "You are a lantern keeper. Start with For Whom the Bell Tolls in the quest journal. Keep several side quests at once; discoveries count even before you accept them.",
      tip: "Guided tips will follow your first expedition. You can dismiss them at any time.",
    },
    {
      icon: MapTrifoldIcon,
      title: "Choose the path below",
      text: "Enter a region from Explore or the town hub. Choose a path below the map, or tap a lit room. Full map opens the whole route; Town ends the expedition. Encounters, battle and rewards each have their own screen.",
      tip: "Take detours. A refuge or cache can change your chances.",
    },
    {
      icon: SwordIcon,
      title: "Read the enemy",
      text: "Every action takes a turn. Read the battle log: it warns before heavy blows and recovery openings. Guard heavy blows; heal or Focus during recovery. Draughts require two other actions before drinking again. Each enemy has its own rhythm.",
      tip: "You can retreat from ordinary enemies. Guardians bar your escape.",
    },
    {
      icon: SparkleIcon,
      title: "Come back stronger",
      text: "Return to town and claim quest rewards. Spend gold at the forge, equip your loot, and invest level rewards in attributes and skills. Rest at the tavern before your next descent.",
      tip: "Your story saves after every action. All art and sounds work offline. Export a backup in Settings.",
    },
  ];
  const slide = slides[step];
  return (
    <Modal
      title={slide.title}
      eyebrow={`THE LANTERN KEEPER\'S GUIDE · ${step + 1} / 4`}
      onClose={onClose}
    >
      <div className="tutorial-art">
        <slide.icon size={66} weight="thin" />
      </div>
      <p className="story-text">{slide.text}</p>
      <div className="tutorial-tip">
        <FlameIcon size={18} />
        {slide.tip}
      </div>
      <div className="tutorial-controls">
        <button
          className="text-button"
          disabled={!step}
          onClick={() => setStep(step - 1)}
        >
          <ArrowLeftIcon size={15} />
          Back
        </button>
        <div className="step-dots">
          {slides.map((_, i) => (
            <span key={i} className={i === step ? "active" : ""} />
          ))}
        </div>
        <Button onClick={() => (step === 3 ? onFinish() : setStep(step + 1))}>
          {step === 3 ? "Find your first quest" : "Continue"}
          <ArrowRightIcon size={17} />
        </Button>
      </div>
    </Modal>
  );
}
function Setting({
  label,
  text,
  checked,
  onChange,
}: {
  label: string;
  text: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="setting-row">
      <div>
        <strong>{label}</strong>
        <span>{text}</span>
      </div>
      <button
        className={`toggle ${checked ? "on" : ""}`}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onChange}
      >
        <i />
      </button>
    </div>
  );
}
