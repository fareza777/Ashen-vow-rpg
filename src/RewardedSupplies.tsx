import { useSyncExternalStore } from "react";
import { VideoIcon, FlaskIcon } from "@phosphor-icons/react";
import { ads } from "./admob";
import { usePurchases } from "./RemoveAds";
import {
  rewardDate,
  rewardSupplyAvailability,
  REWARDED_DAILY_LIMIT,
} from "./adRewards";
import { SATCHEL_CAPACITY } from "./challenge";
import type { GameState } from "./engine";
import { Button } from "./ui";

export const useAds = () =>
  useSyncExternalStore(ads.subscribe, ads.getSnapshot, ads.getSnapshot);

export function RewardedSupplies({
  game,
  inform,
  createCredit,
}: {
  game: GameState;
  inform: (text: string) => void;
  createCredit: () => (receipt: string) => void;
}) {
  const state = useAds();
  const { owned } = usePurchases();
  const date = rewardDate();
  const availability = rewardSupplyAvailability(game, date);
  const claimed =
    game.rewardedSupplies?.date === date ? game.rewardedSupplies.claimed : 0;
  const disabled =
    availability !== "available" ||
    state.fullscreen ||
    (!owned &&
      (state.status === "unsupported" ||
        !state.online ||
        state.rewardLoading ||
        state.status === "initializing"));
  const ready = state.status === "ready" && state.rewardReady;
  const text =
    availability === "full"
      ? "Your satchel is full."
      : availability === "daily-limit"
        ? "Today's supplies have been claimed. Refreshes at 00:00 UTC."
        : !owned && state.status === "unsupported"
          ? "Rewarded ads are available in the Android app."
          : !owned && !state.online
            ? "Ads need a connection. You can keep playing offline."
            : `${REWARDED_DAILY_LIMIT - claimed} remaining today · Satchel ${game.potions}/${SATCHEL_CAPACITY}`;
  const watch = async () => {
    if (owned) {
      createCredit()(crypto.randomUUID());
      return;
    }
    if (!ready) {
      await ads.start();
      await ads.preload("reward");
      inform(
        ads.getSnapshot().rewardReady
          ? "An ad is ready. Choose Watch ad to receive a draught."
          : "No ad is available right now. You can keep playing.",
      );
      return;
    }
    const result = await ads.watchReward(createCredit());
    if (result === "cancelled")
      inform("Ad closed early. No draught was claimed.");
    else if (result === "unavailable")
      inform("The ad could not be shown. Your supplies are unchanged.");
  };
  return (
    <section
      className="rewarded-supplies"
      aria-label="Optional rewarded supplies"
    >
      <div className="rewarded-supplies-heading">
        <FlaskIcon size={21} />
        <strong>Wayfarer's supplies</strong>
        <span>{owned ? "AD-FREE" : "OPTIONAL"}</span>
      </div>
      <Button kind="secondary" disabled={disabled} onClick={() => void watch()}>
        {owned ? <FlaskIcon size={21} /> : <VideoIcon size={21} />}
        {owned
          ? "Claim · +1 healing draught"
          : state.rewardLoading || state.status === "initializing"
            ? "Preparing an ad…"
            : ready
              ? "Watch ad · +1 healing draught"
              : "Watch ad · +1 healing draught"}
      </Button>
      <p>{text}</p>
    </section>
  );
}
