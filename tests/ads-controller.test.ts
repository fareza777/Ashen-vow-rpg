import test from "node:test";
import assert from "node:assert/strict";
import { setImmediate } from "node:timers/promises";
import {
  AdController,
  type AdsPort,
  type AdEvent,
  type AdEventData,
  type AdReward,
} from "../src/adsController";

class Port implements AdsPort {
  calls: string[] = [];
  listeners = new Map<AdEvent, (data?: AdEventData) => void>();
  consentAllowed = true;
  failLoad = false;
  failShow = false;
  rewardCompletion!: (value: AdReward) => void;
  async on(event: AdEvent, fn: (data?: AdEventData) => void) {
    this.listeners.set(event, fn);
    return {
      remove: async () => {
        this.listeners.delete(event);
      },
    };
  }
  emit(event: AdEvent, data?: AdEventData) {
    this.listeners.get(event)?.(data);
  }
  async initialize() {
    this.calls.push("initialize");
  }
  async consent() {
    this.calls.push("consent");
    return { allowed: this.consentAllowed, privacyRequired: true };
  }
  async privacy() {
    this.calls.push("privacy");
    return { allowed: this.consentAllowed, privacyRequired: true };
  }
  async showBanner() {
    this.calls.push("banner");
    this.emit("banner-size", { height: 50 });
  }
  async removeBanner() {
    this.calls.push("remove-banner");
  }
  async prepare(kind: "reward" | "interstitial") {
    this.calls.push(`prepare-${kind}`);
    if (this.failLoad) throw new Error("No fill");
  }
  async showInterstitial() {
    this.calls.push("interstitial");
    if (this.failShow) throw new Error("Not ready");
  }
  showReward() {
    this.calls.push("reward");
    if (this.failShow) return Promise.reject(new Error("Not ready"));
    return new Promise<AdReward>((done) => {
      this.rewardCompletion = done;
    });
  }
  async mute(muted: boolean) {
    this.calls.push(`mute-${muted}`);
  }
}
const town = {
  screen: "town",
  blocked: false,
  rewardAllowed: true,
  active: true,
};
const flush = async () => {
  await setImmediate();
  await setImmediate();
};

test("restored Remove Ads makes no SDK requests and blocks every placement", async () => {
  const port = new Port();
  const ads = new AdController(port);
  ads.setAdFree(true);
  ads.setPlacement(town);
  await ads.start();
  await ads.preload("reward");
  ads.queueExpeditionBreak("paid-return", 40);
  ads.setPlacement(town);
  assert.equal(
    await ads.watchReward(() => assert.fail("No paid ad")),
    "unavailable",
  );
  await flush();
  assert.deepEqual(port.calls, []);
  assert.equal(ads.getSnapshot().adsRemoved, true);
  assert.equal(ads.getSnapshot().bannerHeight, 0);
});

test("buying Remove Ads clears the banner and stale SDK callbacks cannot restore it", async () => {
  const port = new Port();
  const ads = new AdController(port);
  ads.setPlacement(town);
  await ads.start();
  await flush();
  ads.setAdFree(true);
  await flush();
  assert.equal(port.calls.at(-1), "remove-banner");
  const count = port.calls.length;
  port.emit("banner-size", { height: 50 });
  ads.setOnline(false);
  ads.setOnline(true);
  ads.setForeground(false);
  ads.setForeground(true);
  ads.setPlacement(town);
  await ads.start();
  await flush();
  assert.equal(port.calls.length, count);
  assert.equal(ads.getSnapshot().bannerHeight, 0);
  assert.equal(ads.getSnapshot().rewardReady, false);
  assert.equal(ads.getSnapshot().interstitialReady, false);
});

test("an in-flight preload cannot make paid users eligible for ads", async () => {
  const port = new Port();
  const ads = new AdController(port);
  const complete: (() => void)[] = [];
  port.prepare = () => new Promise<void>((resolve) => complete.push(resolve));
  const boot = ads.start();
  await flush();
  ads.setAdFree(true);
  complete.forEach((resolve) => resolve());
  await boot;
  assert.equal(ads.getSnapshot().rewardReady, false);
  assert.equal(ads.getSnapshot().interstitialReady, false);
});

test("ownership restored during consent prevents SDK initialization", async () => {
  const port = new Port();
  let complete!: (value: {
    allowed: boolean;
    privacyRequired: boolean;
  }) => void;
  port.consent = () =>
    new Promise((resolve) => {
      complete = resolve;
    });
  const ads = new AdController(port, Date.now, false);
  const boot = ads.start();
  await flush();
  ads.setAdFree(true);
  complete({ allowed: true, privacyRequired: false });
  await boot;
  assert.ok(!port.calls.includes("initialize"));
  assert.equal(ads.getSnapshot().fullscreen, false);
});

test("browser and offline startup never call the native ad SDK", async () => {
  const web = new AdController(null);
  await web.start();
  assert.equal(web.getSnapshot().status, "unsupported");
  assert.equal(
    await web.watchReward(() => assert.fail("No browser reward")),
    "unavailable",
  );
  const port = new Port();
  const ads = new AdController(port);
  ads.setOnline(false);
  await ads.start();
  assert.deepEqual(port.calls, []);
  assert.equal(
    await ads.watchReward(() => assert.fail("No offline reward")),
    "unavailable",
  );
});

test("startup is deduplicated and a banner reserves space only in an unobstructed town", async () => {
  const port = new Port();
  const ads = new AdController(port);
  ads.setPlacement(town);
  await Promise.all([ads.start(), ads.start()]);
  await flush();
  assert.equal(port.calls.filter((c) => c === "initialize").length, 1);
  assert.equal(port.calls.filter((c) => c === "banner").length, 1);
  assert.equal(ads.getSnapshot().bannerHeight, 50);
  ads.setPlacement({ ...town, blocked: true });
  await flush();
  assert.equal(ads.getSnapshot().bannerHeight, 0);
  port.emit("banner-size", { height: 50 });
  assert.equal(
    ads.getSnapshot().bannerHeight,
    0,
    "late SDK callbacks must not cover a dialog",
  );
  for (const screen of [
    "menu",
    "dungeon",
    "inventory",
    "quests",
    "character",
  ]) {
    ads.setPlacement({ ...town, screen });
    await flush();
    assert.equal(ads.getSnapshot().bannerHeight, 0);
  }
});

test("live consent refusal prevents SDK initialization and ad loading", async () => {
  const port = new Port();
  port.consentAllowed = false;
  const ads = new AdController(port, Date.now, false);
  ads.setPlacement(town);
  await ads.start();
  assert.deepEqual(port.calls, ["consent"]);
  assert.equal(ads.getSnapshot().status, "consent-required");
  assert.equal(
    await ads.watchReward(() => assert.fail("No unconsented reward")),
    "unavailable",
  );
});

test("each expedition of at least six rooms can show one interstitial after the three-minute interval", async () => {
  let now = 0;
  const port = new Port();
  const ads = new AdController(port, () => now);
  ads.setPlacement(town);
  await ads.start();
  await flush();
  now = 180001;
  ads.queueExpeditionBreak("short", 5);
  ads.setPlacement(town);
  await flush();
  assert.ok(!port.calls.includes("interstitial"));
  ads.queueExpeditionBreak("first", 6);
  ads.setPlacement(town);
  await flush();
  assert.equal(port.calls.filter((c) => c === "interstitial").length, 1);
  assert.equal(ads.getSnapshot().fullscreen, true);
  assert.ok(
    port.calls.lastIndexOf("remove-banner") <
      port.calls.lastIndexOf("interstitial"),
  );
  port.emit("interstitial-close");
  await flush();
  now += 180001;
  ads.queueExpeditionBreak("first", 6);
  ads.setPlacement(town);
  await flush();
  assert.equal(
    port.calls.filter((c) => c === "interstitial").length,
    1,
    "the same return cannot count twice",
  );
  ads.queueExpeditionBreak("second", 8);
  ads.setPlacement(town);
  await flush();
  assert.equal(port.calls.filter((c) => c === "interstitial").length, 2);
  port.emit("interstitial-close");
  await flush();
  ads.queueExpeditionBreak("third", 9);
  ads.setPlacement(town);
  ads.queueExpeditionBreak("fourth", 9);
  ads.setPlacement(town);
  await flush();
  assert.equal(port.calls.filter((c) => c === "interstitial").length, 2);
  now += 180001;
  ads.queueExpeditionBreak("fifth", 9);
  ads.setPlacement(town);
  await flush();
  assert.equal(port.calls.filter((c) => c === "interstitial").length, 3);
  port.emit("interstitial-close");
});

test("an unready, offline, or blocked interstitial opportunity is skipped", async () => {
  let now = 0;
  const port = new Port();
  port.failLoad = true;
  const ads = new AdController(port, () => now);
  await ads.start();
  now = 180001;
  ads.queueExpeditionBreak("first", 8);
  ads.queueExpeditionBreak("second", 8);
  ads.setPlacement(town);
  await flush();
  assert.ok(!port.calls.includes("interstitial"));
  port.failLoad = false;
  await ads.preload("interstitial");
  await flush();
  assert.ok(
    !port.calls.includes("interstitial"),
    "loading later must not interrupt play",
  );
  ads.queueExpeditionBreak("third", 8);
  ads.setPlacement({ ...town, blocked: true });
  await flush();
  ads.setPlacement(town);
  await flush();
  assert.ok(!port.calls.includes("interstitial"));
  ads.setOnline(false);
  ads.queueExpeditionBreak("fourth", 8);
  ads.setPlacement(town);
  await flush();
  assert.ok(!port.calls.includes("interstitial"));
});

test("reward event and resolved SDK promise credit once and wait for dismissal", async () => {
  const port = new Port();
  const ads = new AdController(port);
  ads.setPlacement(town);
  await ads.start();
  await flush();
  const receipts: string[] = [];
  const result = ads.watchReward((receipt) => receipts.push(receipt));
  await flush();
  port.emit("reward-earned", { amount: 1 });
  port.emit("reward-earned", { amount: 1 });
  port.rewardCompletion({ amount: 1, type: "coins" });
  await flush();
  assert.equal(receipts.length, 1);
  assert.equal(
    ads.getSnapshot().fullscreen,
    true,
    "earning does not dismiss the native ad",
  );
  port.emit("reward-close");
  assert.equal(await result, "earned");
  assert.equal(ads.getSnapshot().fullscreen, false);
});

test("closing a rewarded ad with an unresolved SDK promise restores play without reward", async () => {
  const port = new Port();
  const ads = new AdController(port);
  ads.setPlacement(town);
  await ads.start();
  const result = ads.watchReward(() => assert.fail("Skipped ad must not earn"));
  await flush();
  port.emit("reward-close");
  assert.equal(await result, "cancelled");
  assert.equal(ads.getSnapshot().fullscreen, false);
  port.emit("reward-earned", { amount: 1 });
  await flush();
});

test("double taps, failed showing, and invalid reward payloads cannot grant supplies", async () => {
  const port = new Port();
  const ads = new AdController(port);
  ads.setPlacement(town);
  await ads.start();
  const first = ads.watchReward(() =>
    assert.fail("Invalid payload must not earn"),
  );
  assert.equal(await ads.watchReward(() => assert.fail("Double tap")), "busy");
  await flush();
  for (const amount of [0, -1, NaN, Infinity])
    port.emit("reward-earned", { amount });
  port.emit("reward-fail");
  assert.equal(await first, "unavailable");
  await flush();
  port.failShow = true;
  assert.equal(
    await ads.watchReward(() => assert.fail("Failed ad must not earn")),
    "unavailable",
  );
  assert.equal(ads.getSnapshot().fullscreen, false);
});

test("changing denied privacy choices can initialize once and enable ads", async () => {
  const port = new Port();
  port.consentAllowed = false;
  const ads = new AdController(port, Date.now, false);
  ads.setPlacement(town);
  await ads.start();
  port.consentAllowed = true;
  await ads.privacyChoices();
  await flush();
  assert.equal(port.calls.filter((c) => c === "initialize").length, 1);
  assert.equal(ads.getSnapshot().rewardReady, true);
  port.consentAllowed = false;
  await ads.privacyChoices();
  await flush();
  assert.equal(ads.getSnapshot().status, "consent-required");
  assert.equal(ads.getSnapshot().bannerHeight, 0);
  assert.equal(ads.getSnapshot().rewardReady, false);
});
