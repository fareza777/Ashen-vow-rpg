import test from "node:test";
import assert from "node:assert/strict";
import { setImmediate } from "node:timers/promises";
import {
  PurchaseController,
  REMOVE_ADS_PRODUCT,
  type PurchasePort,
  type StoreProduct,
  type StorePurchase,
} from "../src/purchasesController";

const product: StoreProduct = {
  id: REMOVE_ADS_PRODUCT,
  price: "$4.99",
  offerToken: "base-offer",
};
const paid: StorePurchase = {
  productIdentifier: REMOVE_ADS_PRODUCT,
  purchaseState: "1",
  purchaseToken: "play-token",
  isAcknowledged: false,
};
class Port implements PurchasePort {
  calls: string[] = [];
  supported = true;
  product: StoreProduct | null = product;
  owned: StorePurchase[] = [];
  transaction: StorePurchase = paid;
  queryFailure = false;
  ackFailure = false;
  failure: unknown = null;
  waitPurchase: Promise<StorePurchase> | null = null;
  async isSupported() {
    this.calls.push("supported");
    return this.supported;
  }
  async getProduct() {
    this.calls.push("product");
    return this.product;
  }
  async getPurchases() {
    this.calls.push("query");
    if (this.queryFailure) throw new Error("Disconnected");
    return this.owned;
  }
  async purchase(value: StoreProduct) {
    this.calls.push(`buy-${value.id}-${value.offerToken}`);
    if (this.failure) throw this.failure;
    return this.waitPurchase ?? this.transaction;
  }
  async acknowledge(token: string) {
    this.calls.push(`ack-${token}`);
    if (this.ackFailure) throw new Error("Acknowledgement failed");
  }
}
function environment(
  port: Port | null = new Port(),
  cached: string | null = null,
) {
  let value = cached;
  const updates: boolean[] = [];
  const controller = new PurchaseController(
    port,
    {
      read: async () => value,
      write: async (next) => {
        value = next;
      },
    },
    (owned) => updates.push(owned),
  );
  return { controller, port, updates, cache: () => value };
}
const cache = JSON.stringify({
  version: 1,
  product: REMOVE_ADS_PRODUCT,
  owned: true,
});

test("cached Play ownership is restored before ads start and survives offline query errors", async () => {
  const env = environment(new Port(), cache);
  await env.controller.hydrate();
  assert.equal(env.controller.getSnapshot().owned, true);
  assert.deepEqual(env.updates, [true]);
  env.controller.setOnline(false);
  await env.controller.refresh();
  assert.equal(env.controller.getSnapshot().owned, true);
  assert.deepEqual(env.port!.calls, []);
  env.controller.setOnline(true);
  env.port!.queryFailure = true;
  await env.controller.refresh();
  assert.equal(env.controller.getSnapshot().owned, true);
  assert.equal(env.cache(), cache);
});

test("browser, malformed cache, wrong product and an unpaid cache never grant ownership", async () => {
  for (const value of [
    cache,
    "true",
    "{}",
    JSON.stringify({ version: 1, product: "other", owned: true }),
  ]) {
    const web = environment(null, value);
    await web.controller.hydrate();
    assert.equal(web.controller.getSnapshot().owned, false);
    assert.equal(await web.controller.buy(), "unavailable");
  }
  for (const value of [
    "true",
    "{}",
    JSON.stringify({ version: 1, product: REMOVE_ADS_PRODUCT, owned: false }),
  ]) {
    const env = environment(new Port(), value);
    await env.controller.hydrate();
    assert.equal(env.controller.getSnapshot().owned, false);
  }
});

test("a one-time purchase uses store price/offer and is acknowledged before ownership is saved", async () => {
  const env = environment();
  await env.controller.refresh();
  assert.equal(env.controller.getSnapshot().price, "$4.99");
  assert.equal(await env.controller.buy(), "purchased");
  assert.deepEqual(env.port!.calls.slice(-2), [
    "buy-remove_ads-base-offer",
    "ack-play-token",
  ]);
  assert.equal(env.controller.getSnapshot().owned, true);
  assert.equal(JSON.parse(env.cache()!).owned, true);
  assert.equal(await env.controller.buy(), "already-owned");
  env.port!.product = { ...product, price: "Rp79.000" };
  await env.controller.refresh();
  assert.equal(env.controller.getSnapshot().price, "Rp79.000");
});

test("cancelled, pending, missing tokens and unrelated purchases do not remove ads", async () => {
  for (const transaction of [
    { ...paid, purchaseState: "2" },
    { ...paid, purchaseState: "0" },
    { ...paid, purchaseToken: "" },
    { ...paid, productIdentifier: "gold_pack" },
  ]) {
    const env = environment();
    env.port!.transaction = transaction;
    await env.controller.refresh();
    assert.notEqual(await env.controller.buy(), "purchased");
    assert.equal(env.controller.getSnapshot().owned, false);
    assert.ok(!env.port!.calls.some((c) => c.startsWith("ack-")));
  }
  for (const failure of [
    { code: "USER_CANCELED" },
    new Error("Purchase is pending"),
  ]) {
    const env = environment();
    env.port!.failure = failure;
    await env.controller.refresh();
    assert.equal(
      await env.controller.buy(),
      "code" in failure ? "cancelled" : "pending",
    );
    assert.equal(env.controller.getSnapshot().owned, false);
    assert.equal(env.controller.getSnapshot().busy, null);
  }
});

test("failed acknowledgement leaves ownership locked; restore can finish acknowledgement", async () => {
  const env = environment();
  await env.controller.refresh();
  env.port!.ackFailure = true;
  assert.equal(await env.controller.buy(), "unavailable");
  assert.equal(env.controller.getSnapshot().owned, false);
  env.port!.ackFailure = false;
  env.port!.owned = [paid];
  assert.equal(await env.controller.restore(), "restored");
  assert.equal(env.controller.getSnapshot().owned, true);
});

test("restore queries Play even if the product is unavailable and clears a revoked entitlement", async () => {
  const env = environment();
  env.port!.product = null;
  env.port!.owned = [{ ...paid, isAcknowledged: true }];
  assert.equal(await env.controller.restore(), "restored");
  assert.equal(env.controller.getSnapshot().owned, true);
  assert.ok(!env.port!.calls.some((c) => c.startsWith("ack-")));
  env.port!.owned = [];
  assert.equal(await env.controller.restore(), "none");
  assert.equal(env.controller.getSnapshot().owned, false);
  assert.equal(JSON.parse(env.cache()!).owned, false);
  assert.equal(env.updates.at(-1), false);
});

test("ITEM_ALREADY_OWNED restores and pending payments unlock only after Play confirms completion", async () => {
  const env = environment();
  await env.controller.refresh();
  env.port!.failure = { code: "ITEM_ALREADY_OWNED" };
  env.port!.owned = [paid];
  assert.equal(await env.controller.buy(), "already-owned");
  assert.equal(env.controller.getSnapshot().owned, true);
  const pending = environment();
  pending.port!.owned = [{ ...paid, purchaseState: "2" }];
  await pending.controller.refresh();
  assert.equal(pending.controller.getSnapshot().owned, false);
  pending.port!.owned = [paid];
  await pending.controller.refresh();
  assert.equal(pending.controller.getSnapshot().owned, true);
});

test("rapid taps and foreground refresh cannot start a second purchase or race a query", async () => {
  const env = environment();
  await env.controller.refresh();
  let finish!: (value: StorePurchase) => void;
  env.port!.waitPurchase = new Promise((resolve) => {
    finish = resolve;
  });
  const first = env.controller.buy();
  await setImmediate();
  assert.equal(env.controller.getSnapshot().busy, "purchase");
  assert.equal(await env.controller.buy(), "busy");
  const count = env.port!.calls.length;
  await env.controller.refresh();
  assert.equal(env.port!.calls.length, count);
  finish(paid);
  assert.equal(await first, "purchased");
  assert.equal(env.controller.getSnapshot().busy, null);
});
