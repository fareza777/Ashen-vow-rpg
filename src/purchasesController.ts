export const REMOVE_ADS_PRODUCT = "remove_ads";
export const REMOVE_ADS_REFERENCE_PRICE = "US$4.99";
export type StoreProduct = { id: string; price: string; offerToken?: string };
export type StorePurchase = {
  productIdentifier: string;
  purchaseState?: string;
  purchaseToken?: string;
  isAcknowledged?: boolean;
};
export interface PurchasePort {
  isSupported(): Promise<boolean>;
  getProduct(): Promise<StoreProduct | null>;
  getPurchases(): Promise<StorePurchase[]>;
  purchase(product: StoreProduct): Promise<StorePurchase>;
  acknowledge(token: string): Promise<void>;
}
type CachePort = {
  read(): Promise<string | null>;
  write(value: string): Promise<void>;
};
export type PurchaseState = {
  status: "unsupported" | "idle" | "ready" | "unavailable";
  hydrated: boolean;
  checked: boolean;
  owned: boolean;
  online: boolean;
  price: string;
  busy: "refresh" | "purchase" | "restore" | null;
};
type BuyResult =
  | "purchased"
  | "already-owned"
  | "cancelled"
  | "pending"
  | "unavailable"
  | "busy";
type RestoreResult = "restored" | "none" | "unavailable" | "busy";
function purchased(value: StorePurchase) {
  return (
    value.productIdentifier === REMOVE_ADS_PRODUCT &&
    value.purchaseState === "1" &&
    typeof value.purchaseToken === "string" &&
    value.purchaseToken.length > 0
  );
}
function errorKind(error: unknown) {
  if (!error || typeof error !== "object") return "";
  const value = error as { code?: unknown; message?: unknown };
  return `${value.code ?? ""} ${value.message ?? ""}`.toUpperCase();
}

/** Ownership comes from Play Billing. Save exports and new characters never carry it. */
export class PurchaseController {
  private state: PurchaseState;
  private observers = new Set<() => void>();
  private hydration: Promise<void> | null = null;
  private product: StoreProduct | null = null;
  constructor(
    private port: PurchasePort | null,
    private cache: CachePort,
    private ownershipChanged: (owned: boolean) => void,
  ) {
    this.state = {
      status: port ? "idle" : "unsupported",
      hydrated: false,
      checked: !port,
      owned: false,
      online: true,
      price: REMOVE_ADS_REFERENCE_PRICE,
      busy: null,
    };
  }
  getSnapshot = () => this.state;
  subscribe = (fn: () => void) => {
    this.observers.add(fn);
    return () => {
      this.observers.delete(fn);
    };
  };
  private update(patch: Partial<PurchaseState>) {
    if (
      Object.entries(patch).every(
        ([key, value]) => this.state[key as keyof PurchaseState] === value,
      )
    )
      return;
    this.state = { ...this.state, ...patch };
    this.observers.forEach((fn) => fn());
  }
  hydrate(): Promise<void> {
    if (this.hydration) return this.hydration;
    this.hydration = (async () => {
      let owned = false;
      if (this.port) {
        try {
          const value = JSON.parse((await this.cache.read()) ?? "null");
          owned =
            value?.version === 1 &&
            value?.product === REMOVE_ADS_PRODUCT &&
            value?.owned === true;
        } catch {
          /* A damaged cache must never manufacture a purchase. */
        }
      }
      this.ownershipChanged(owned);
      this.update({ owned, hydrated: true });
    })();
    return this.hydration;
  }
  setOnline(online: boolean) {
    this.update({ online });
  }
  private async setOwned(owned: boolean) {
    // Suppress advertising immediately; persistence is independent of a game save.
    this.ownershipChanged(owned);
    this.update({ owned });
    await this.cache
      .write(JSON.stringify({ version: 1, product: REMOVE_ADS_PRODUCT, owned }))
      .catch(() => {});
  }
  private async acknowledge(value: StorePurchase) {
    if (!value.isAcknowledged)
      await this.port!.acknowledge(value.purchaseToken!);
  }
  private async queryOwnership() {
    const transactions = await this.port!.getPurchases();
    const purchase = transactions.find(purchased);
    if (purchase) await this.acknowledge(purchase);
    await this.setOwned(!!purchase);
    return !!purchase;
  }
  private async loadProduct() {
    try {
      const value = await this.port!.getProduct();
      this.product =
        value?.id === REMOVE_ADS_PRODUCT && value.price.trim() ? value : null;
    } catch {
      this.product = null;
    }
    this.update({
      status: this.product ? "ready" : "unavailable",
      price: this.product?.price ?? REMOVE_ADS_REFERENCE_PRICE,
    });
  }
  async refresh(): Promise<void> {
    await this.hydrate();
    if (this.state.busy) return;
    if (!this.port || !this.state.online) {
      this.update({ checked: true });
      return;
    }
    this.update({ busy: "refresh" });
    try {
      if (!(await this.port.isSupported()))
        throw new Error("Billing unavailable");
      // Query first: restoring ownership must work even if the product is hidden.
      // A failed query preserves the last confirmed offline entitlement.
      try {
        await this.queryOwnership();
      } catch {
        /* Retain cached ownership. */
      }
      await this.loadProduct();
    } catch {
      this.update({ status: "unavailable" });
    } finally {
      this.update({ checked: true, busy: null });
    }
  }
  async buy(): Promise<BuyResult> {
    await this.hydrate();
    if (this.state.busy) return "busy";
    if (this.state.owned) return "already-owned";
    if (
      !this.port ||
      !this.state.online ||
      !this.product ||
      this.state.status !== "ready"
    )
      return "unavailable";
    this.update({ busy: "purchase" });
    try {
      const transaction = await this.port.purchase(this.product);
      if (!purchased(transaction)) {
        return transaction.productIdentifier === REMOVE_ADS_PRODUCT &&
          ["0", "2"].includes(transaction.purchaseState ?? "")
          ? "pending"
          : "unavailable";
      }
      await this.acknowledge(transaction);
      await this.setOwned(true);
      return "purchased";
    } catch (error) {
      const kind = errorKind(error);
      if (kind.includes("ITEM_ALREADY_OWNED")) {
        try {
          return (await this.queryOwnership())
            ? "already-owned"
            : "unavailable";
        } catch {
          return "unavailable";
        }
      }
      if (kind.includes("CANCEL")) return "cancelled";
      if (kind.includes("PENDING")) return "pending";
      return "unavailable";
    } finally {
      this.update({ busy: null });
    }
  }
  async restore(): Promise<RestoreResult> {
    await this.hydrate();
    if (this.state.busy) return "busy";
    if (!this.port || !this.state.online) return "unavailable";
    this.update({ busy: "restore" });
    try {
      if (!(await this.port.isSupported())) return "unavailable";
      return (await this.queryOwnership()) ? "restored" : "none";
    } catch {
      return "unavailable";
    } finally {
      this.update({ busy: null, checked: true });
    }
  }
}
