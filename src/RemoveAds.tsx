import { useSyncExternalStore } from "react";
import {
  ShieldCheckIcon,
  ArrowCounterClockwiseIcon,
  CheckCircleIcon,
} from "@phosphor-icons/react";
import { purchases } from "./purchases";
import { Button } from "./ui";

export const usePurchases = () =>
  useSyncExternalStore(
    purchases.subscribe,
    purchases.getSnapshot,
    purchases.getSnapshot,
  );

export function RemoveAds({ inform }: { inform: (text: string) => void }) {
  const state = usePurchases();
  const supported = state.status !== "unsupported";
  const disabled = !!state.busy || !state.online || !supported;
  const buy = async () => {
    if (state.status !== "ready") {
      await purchases.refresh();
      if (purchases.getSnapshot().owned)
        inform("Remove Ads restored. Your journey is ad-free.");
      else
        inform(
          purchases.getSnapshot().status === "ready"
            ? "Google Play is ready. Choose Remove ads to continue."
            : "Google Play could not load this purchase. You can keep playing.",
        );
      return;
    }
    const result = await purchases.buy();
    if (result === "purchased" || result === "already-owned")
      inform("Remove Ads is active. Thank you for supporting Ashen Vow.");
    else if (result === "cancelled")
      inform("Purchase cancelled. You can keep playing.");
    else if (result === "pending")
      inform(
        "Payment is pending. Remove Ads activates when Google Play confirms payment.",
      );
    else if (result === "unavailable")
      inform(
        "Purchase could not be completed. Try Restore Purchases if Google Play already confirmed payment.",
      );
  };
  const restore = async () => {
    const result = await purchases.restore();
    if (result === "restored")
      inform("Remove Ads restored. All your characters can play ad-free.");
    else if (result === "none")
      inform(
        "No completed Remove Ads purchase was found on this Google Play account.",
      );
    else if (result === "unavailable")
      inform(
        "Could not reach Google Play. Any previously restored purchase remains active.",
      );
  };
  return (
    <section className="remove-ads" aria-label="Remove Ads purchase">
      <div className="remove-ads-heading">
        <ShieldCheckIcon size={23} />
        <h3>Remove Ads</h3>
        <span>{state.owned ? "OWNED" : state.price}</span>
      </div>
      <p>
        {state.owned
          ? "Your journey is ad-free, including offline. Claim daily supplies at the tavern without watching a video."
          : "No banners, interstitials or rewarded ads. Daily tavern supplies without a video. One payment, every character."}
      </p>
      {!state.owned ? (
        <Button kind="secondary" disabled={disabled} onClick={() => void buy()}>
          <ShieldCheckIcon size={19} />
          {state.busy === "purchase"
            ? "Waiting for Google Play…"
            : state.busy
              ? "Checking Google Play…"
              : !supported
                ? "Available in Android app"
                : state.status === "ready"
                  ? `Remove ads · ${state.price}`
                  : "Check Google Play"}
        </Button>
      ) : (
        <div className="ad-free-owned">
          <CheckCircleIcon size={19} />
          Ad-free journey active
        </div>
      )}
      <Button kind="ghost" disabled={disabled} onClick={() => void restore()}>
        <ArrowCounterClockwiseIcon size={18} />
        {state.busy === "restore" ? "Restoring…" : "Restore Purchases"}
      </Button>
      <small>
        {!supported
          ? "One-time purchase. No subscription."
          : !state.online
            ? "Reconnect to Google Play to buy or restore."
            : state.owned
              ? "Linked to your Google Play account."
              : "One-time purchase. Google Play shows the final price in your currency."}
      </small>
    </section>
  );
}
