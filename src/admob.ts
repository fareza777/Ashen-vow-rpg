import { Capacitor } from "@capacitor/core";
import {
  AdMob,
  BannerAdSize,
  BannerAdPosition,
  BannerAdPluginEvents,
  InterstitialAdPluginEvents,
  RewardAdPluginEvents,
  AdmobConsentStatus,
  MaxAdContentRating,
} from "@capacitor-community/admob";
import { AdController, type AdsPort } from "./adsController";

// Official Google demo units. These never generate revenue or serve live campaigns.
// The matching Android application ID is in res/values/strings.xml.
export const AD_CONFIG = {
  testMode: true,
  banner: "ca-app-pub-3940256099942544/6300978111",
  interstitial: "ca-app-pub-3940256099942544/1033173712",
  rewarded: "ca-app-pub-3940256099942544/5224354917",
} as const;
const options = (adId: string) => ({
  adId,
  isTesting: AD_CONFIG.testMode,
  npa: true,
});
const permission = (
  info: Awaited<ReturnType<typeof AdMob.requestConsentInfo>>,
) => ({
  allowed: info.canRequestAds,
  privacyRequired: info.privacyOptionsRequirementStatus === "REQUIRED",
});
const androidPort: AdsPort = {
  async initialize() {
    await AdMob.initialize({
      initializeForTesting: AD_CONFIG.testMode,
      maxAdContentRating: MaxAdContentRating.Teen,
    });
  },
  async consent() {
    let info = await AdMob.requestConsentInfo();
    if (
      info.status === AdmobConsentStatus.REQUIRED &&
      info.isConsentFormAvailable
    )
      info = await AdMob.showConsentForm();
    return permission(info);
  },
  async privacy() {
    await AdMob.showPrivacyOptionsForm();
    return permission(await AdMob.requestConsentInfo());
  },
  async showBanner() {
    await AdMob.showBanner({
      ...options(AD_CONFIG.banner),
      adSize: BannerAdSize.BANNER,
      position: BannerAdPosition.TOP_CENTER,
      margin: 0,
    });
  },
  removeBanner: () => AdMob.removeBanner(),
  async prepare(kind) {
    if (kind === "reward")
      await AdMob.prepareRewardVideoAd({
        ...options(AD_CONFIG.rewarded),
        immersiveMode: true,
      });
    else
      await AdMob.prepareInterstitial({
        ...options(AD_CONFIG.interstitial),
        immersiveMode: true,
      });
  },
  showInterstitial: () =>
    AdMob.showInterstitial({ adId: AD_CONFIG.interstitial }),
  showReward: () => AdMob.showRewardVideoAd({ adId: AD_CONFIG.rewarded }),
  mute: (muted) => AdMob.setApplicationMuted({ muted }),
  on(event, listener) {
    switch (event) {
      case "banner-size":
        return AdMob.addListener(BannerAdPluginEvents.SizeChanged, (size) =>
          listener({ height: size.height }),
        );
      case "banner-fail":
        return AdMob.addListener(BannerAdPluginEvents.FailedToLoad, () =>
          listener(),
        );
      case "interstitial-close":
        return AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () =>
          listener(),
        );
      case "interstitial-fail":
        return AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, () =>
          listener(),
        );
      case "reward-earned":
        return AdMob.addListener(RewardAdPluginEvents.Rewarded, (item) =>
          listener({ amount: item.amount }),
        );
      case "reward-close":
        return AdMob.addListener(RewardAdPluginEvents.Dismissed, () =>
          listener(),
        );
      case "reward-fail":
        return AdMob.addListener(RewardAdPluginEvents.FailedToShow, () =>
          listener(),
        );
    }
  },
};
export const ads = new AdController(
  Capacitor.getPlatform() === "android" ? androidPort : null,
  Date.now,
  AD_CONFIG.testMode,
);
