export type AdReward = { amount: number; type: string };
export type AdEvent =
  | "banner-size"
  | "banner-fail"
  | "interstitial-close"
  | "interstitial-fail"
  | "reward-earned"
  | "reward-close"
  | "reward-fail";
export type AdEventData = { height?: number; amount?: number };
export interface AdsPort {
  on(
    event: AdEvent,
    listener: (data?: AdEventData) => void,
  ): Promise<{ remove(): Promise<void> }>;
  initialize(): Promise<void>;
  consent(): Promise<{ allowed: boolean; privacyRequired: boolean }>;
  privacy(): Promise<{ allowed: boolean; privacyRequired: boolean }>;
  showBanner(): Promise<void>;
  removeBanner(): Promise<void>;
  prepare(kind: "reward" | "interstitial"): Promise<void>;
  showInterstitial(): Promise<void>;
  showReward(): Promise<AdReward>;
  mute(value: boolean): Promise<void>;
}
export type AdState = {
  adsRemoved: boolean;
  status:
    | "unsupported"
    | "idle"
    | "initializing"
    | "ready"
    | "unavailable"
    | "consent-required";
  online: boolean;
  bannerHeight: number;
  fullscreen: boolean;
  rewardReady: boolean;
  rewardLoading: boolean;
  interstitialReady: boolean;
  privacyRequired: boolean;
};
type Placement = {
  screen: string;
  blocked: boolean;
  rewardAllowed: boolean;
  active: boolean;
};
type RewardResult = "earned" | "cancelled" | "unavailable" | "busy";
type Session = {
  kind: "reward" | "interstitial";
  receipt: string;
  earned: boolean;
  grant?: (receipt: string) => void;
  finish?: (result: RewardResult) => void;
};
const AD_INTERVAL_MS = 180_000;

/** Native SDK orchestration. No game action waits for an advertisement to load. */
export class AdController {
  private state: AdState;
  private observers = new Set<() => void>();
  private placement: Placement = {
    screen: "menu",
    blocked: true,
    rewardAllowed: false,
    active: true,
  };
  private foreground = true;
  private boot: Promise<void> | null = null;
  private listening = false;
  private initialized = false;
  private bannerRequested = false;
  private bannerRetryAt = 0;
  private bannerWork: Promise<void> = Promise.resolve();
  private loads: Partial<Record<"reward" | "interstitial", Promise<void>>> = {};
  private session: Session | null = null;
  private returns = 0;
  private returnsAtLastAd = 0;
  private seenReturns = new Set<string>();
  private pendingBreak: { expires: number } | null = null;
  private lastFullscreen: number;
  private muted = false;
  constructor(
    private port: AdsPort | null,
    private now = Date.now,
    private testMode = true,
  ) {
    this.lastFullscreen = now();
    this.state = {
      adsRemoved: false,
      status: port ? "idle" : "unsupported",
      online: true,
      bannerHeight: 0,
      fullscreen: false,
      rewardReady: false,
      rewardLoading: false,
      interstitialReady: false,
      privacyRequired: false,
    };
  }
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => {
    this.observers.add(listener);
    return () => {
      this.observers.delete(listener);
    };
  };
  private update(patch: Partial<AdState>) {
    if (
      Object.entries(patch).every(
        ([key, value]) => this.state[key as keyof AdState] === value,
      )
    )
      return;
    this.state = { ...this.state, ...patch };
    this.observers.forEach((fn) => fn());
  }
  private async listen() {
    if (this.listening || !this.port) return;
    this.listening = true;
    try {
      await this.port.on("banner-size", (data) => {
        if (
          this.canBanner() &&
          this.bannerRequested &&
          Number.isFinite(data?.height)
        )
          this.update({
            bannerHeight: Math.max(0, Math.min(100, data!.height!)),
          });
      });
      await this.port.on("banner-fail", () => {
        this.bannerRetryAt = this.now() + 30_000;
        this.update({ bannerHeight: 0 });
        void this.bannerWork.then(async () => {
          if (this.bannerRequested) {
            this.bannerRequested = false;
            await this.port!.removeBanner().catch(() => {});
          }
        });
      });
      await this.port.on("reward-earned", (data) => {
        if (this.session?.kind === "reward")
          this.earn(this.session, data?.amount);
      });
      await this.port.on("reward-close", () => {
        if (this.session?.kind === "reward") this.finish();
      });
      await this.port.on("reward-fail", () => {
        if (this.session?.kind === "reward") this.finish("unavailable");
      });
      await this.port.on("interstitial-close", () => {
        if (this.session?.kind === "interstitial") this.finish();
      });
      await this.port.on("interstitial-fail", () => {
        if (this.session?.kind === "interstitial") this.finish("unavailable");
      });
    } catch {
      this.listening = false;
      throw new Error("Ad listeners unavailable");
    }
  }
  start(): Promise<void> {
    if (
      !this.port ||
      this.state.adsRemoved ||
      !this.state.online ||
      !this.foreground ||
      !this.placement.active
    )
      return Promise.resolve();
    if (this.boot) return this.boot;
    if (this.state.status === "ready" && this.initialized)
      return Promise.resolve();
    this.update({ status: "initializing" });
    this.boot = (async () => {
      try {
        // Google's demo units need no publisher account or configured UMP message.
        // Real units always obtain UMP permission before SDK initialization/loading.
        if (!this.testMode) {
          this.update({ fullscreen: true });
          const consent = await this.port!.consent();
          this.update({
            privacyRequired: consent.privacyRequired,
            fullscreen: false,
          });
          if (!consent.allowed) {
            this.update({ status: "consent-required" });
            return;
          }
        }
        if (this.state.adsRemoved) return;
        await this.listen();
        if (this.state.adsRemoved) return;
        if (!this.initialized) {
          await this.port!.initialize();
          this.initialized = true;
        }
        await this.port!.mute(this.muted).catch(() => {});
        this.update({ status: "ready" });
        void this.syncBanner();
        await Promise.all([
          this.preload("reward"),
          this.preload("interstitial"),
        ]);
      } catch {
        this.update({
          status: "unavailable",
          fullscreen: false,
          bannerHeight: 0,
        });
      }
    })().finally(() => {
      this.boot = null;
    });
    return this.boot;
  }
  setOnline(online: boolean) {
    const wasOnline = this.state.online;
    this.update({
      online,
      ...(!online ? { rewardReady: false, interstitialReady: false } : {}),
    });
    if (!online) this.pendingBreak = null;
    void this.syncBanner();
    if (online && !wasOnline && this.port) {
      void this.start().then(() => {
        void this.preload("reward");
        void this.preload("interstitial");
      });
    }
  }
  setAdFree(owned: boolean) {
    const changed = this.state.adsRemoved !== owned;
    this.update({
      adsRemoved: owned,
      ...(owned
        ? {
            bannerHeight: 0,
            rewardReady: false,
            interstitialReady: false,
            rewardLoading: false,
          }
        : {}),
    });
    if (owned) this.pendingBreak = null;
    void this.syncBanner();
    if (changed && !owned)
      void this.start().then(() => {
        void this.preload("reward");
        void this.preload("interstitial");
      });
  }
  setForeground(active: boolean) {
    this.foreground = active;
    void this.syncBanner();
  }
  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.initialized) void this.port?.mute(muted).catch(() => {});
  }
  setPlacement(placement: Placement) {
    this.placement = placement;
    if (this.pendingBreak && placement.screen !== "dungeon") {
      const opportunity = this.pendingBreak;
      this.pendingBreak = null;
      if (
        placement.screen === "town" &&
        !placement.blocked &&
        placement.active &&
        opportunity.expires >= this.now() &&
        this.canFullscreen() &&
        this.state.interstitialReady
      )
        void this.presentInterstitial();
    }
    void this.syncBanner();
  }
  private canFullscreen() {
    return (
      this.state.status === "ready" &&
      !this.state.adsRemoved &&
      this.state.online &&
      this.foreground &&
      this.placement.active &&
      !this.session &&
      !this.state.fullscreen
    );
  }
  private canBanner() {
    return (
      this.canFullscreen() &&
      this.placement.screen === "town" &&
      !this.placement.blocked
    );
  }
  private syncBanner() {
    if (!this.canBanner()) this.update({ bannerHeight: 0 });
    this.bannerWork = this.bannerWork
      .catch(() => {})
      .then(async () => {
        if (!this.port) return;
        if (
          this.canBanner() &&
          !this.bannerRequested &&
          this.now() >= this.bannerRetryAt
        ) {
          this.bannerRequested = true;
          this.update({ bannerHeight: 50 });
          try {
            await this.port.showBanner();
          } catch {
            this.bannerRequested = false;
            this.bannerRetryAt = this.now() + 30_000;
            this.update({ bannerHeight: 0 });
          }
        } else if (!this.canBanner() && this.bannerRequested) {
          this.bannerRequested = false;
          this.update({ bannerHeight: 0 });
          await this.port.removeBanner().catch(() => {});
        }
      });
    return this.bannerWork;
  }
  preload(kind: "reward" | "interstitial"): Promise<void> {
    if (this.loads[kind]) return this.loads[kind]!;
    if (
      !this.port ||
      this.state.adsRemoved ||
      this.state.status !== "ready" ||
      !this.state.online ||
      this.session
    )
      return Promise.resolve();
    if (
      kind === "reward" ? this.state.rewardReady : this.state.interstitialReady
    )
      return Promise.resolve();
    if (kind === "reward") this.update({ rewardLoading: true });
    const readyKey = kind === "reward" ? "rewardReady" : "interstitialReady";
    this.loads[kind] = this.port
      .prepare(kind)
      .then(() => {
        this.update({
          [readyKey]: this.state.online && !this.state.adsRemoved,
        });
      })
      .catch(() => {
        this.update({ [readyKey]: false });
      })
      .finally(() => {
        delete this.loads[kind];
        if (kind === "reward") this.update({ rewardLoading: false });
      });
    return this.loads[kind]!;
  }
  queueExpeditionBreak(key: string, rooms: number) {
    if (this.state.adsRemoved || rooms < 6 || this.seenReturns.has(key)) return;
    this.seenReturns.add(key);
    if (this.seenReturns.size > 64)
      this.seenReturns.delete(this.seenReturns.values().next().value!);
    this.returns++;
    if (
      this.returns - this.returnsAtLastAd >= 2 &&
      this.now() - this.lastFullscreen >= AD_INTERVAL_MS &&
      this.canFullscreen() &&
      this.state.interstitialReady
    )
      this.pendingBreak = { expires: this.now() + 5000 };
  }
  private async presentInterstitial() {
    if (!this.canFullscreen() || !this.state.interstitialReady) return;
    const session: Session = {
      kind: "interstitial",
      receipt: "",
      earned: false,
    };
    this.session = session;
    this.lastFullscreen = this.now();
    this.returnsAtLastAd = this.returns;
    this.update({ fullscreen: true, interstitialReady: false });
    await this.syncBanner();
    try {
      if (
        !this.state.online ||
        this.state.adsRemoved ||
        !this.foreground ||
        !this.placement.active ||
        this.placement.screen !== "town" ||
        this.placement.blocked
      ) {
        this.finish("unavailable");
        return;
      }
      await this.port!.showInterstitial();
    } catch {
      if (this.session === session) this.finish("unavailable");
    }
  }
  watchReward(grant: (receipt: string) => void): Promise<RewardResult> {
    if (this.session || this.state.fullscreen) return Promise.resolve("busy");
    if (
      !this.canFullscreen() ||
      !this.state.rewardReady ||
      !this.placement.rewardAllowed
    )
      return Promise.resolve("unavailable");
    return new Promise((resolve) => {
      const session: Session = {
        kind: "reward",
        receipt: crypto.randomUUID(),
        earned: false,
        grant,
        finish: resolve,
      };
      this.session = session;
      this.lastFullscreen = this.now();
      this.pendingBreak = null;
      this.update({ fullscreen: true, rewardReady: false });
      void this.syncBanner().then(() => {
        if (
          !this.state.online ||
          this.state.adsRemoved ||
          !this.foreground ||
          !this.placement.active ||
          !this.placement.rewardAllowed
        ) {
          this.finish("unavailable");
          return;
        }
        // Some SDK versions never settle this promise when the viewer skips.
        // Dismissal/failure events restore play; only an earned callback grants.
        void this.port!.showReward()
          .then((reward) => this.earn(session, reward.amount))
          .catch(() => {
            if (this.session === session) this.finish("unavailable");
          });
      });
    });
  }
  private earn(session: Session, amount?: number) {
    if (
      this.session !== session ||
      session.earned ||
      !Number.isFinite(amount) ||
      amount! <= 0
    )
      return;
    session.earned = true;
    session.grant?.(session.receipt);
  }
  private finish(result?: RewardResult) {
    const session = this.session;
    if (!session) return;
    this.session = null;
    this.update({ fullscreen: false });
    session.finish?.(result ?? (session.earned ? "earned" : "cancelled"));
    void this.syncBanner();
    void this.preload(session.kind);
  }
  async privacyChoices() {
    if (!this.port || this.testMode || this.state.fullscreen) return;
    this.update({
      fullscreen: true,
      rewardReady: false,
      interstitialReady: false,
    });
    await this.syncBanner();
    try {
      const consent = await this.port.privacy();
      this.update({
        privacyRequired: consent.privacyRequired,
        status: consent.allowed ? "ready" : "consent-required",
      });
    } catch {
      this.update({ status: "consent-required" });
    } finally {
      this.update({ fullscreen: false });
      void this.syncBanner();
    }
    if (this.state.status === "ready") {
      await this.start();
      await Promise.all([this.preload("reward"), this.preload("interstitial")]);
    }
  }
}
