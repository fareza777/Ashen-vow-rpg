# Ashen Vow monetization — 0.2.7

The Android build includes real native AdMob SDK integration using Google's public demo IDs, plus Google Play Billing for **Remove Ads — US$4.99 once**. Browser/PWA play remains offline-capable; advertising and purchasing controls explain that they require Android. No purchase has been made or simulated in the shipped game.

## Placements and player benefits

| Format | Placement | Limits |
| --- | --- | --- |
| Banner | Top of the town hub, in a reserved 50dp slot | Hidden in menus, dialogs, expeditions, battle, background and offline |
| Interstitial | Returning safely to town after an expedition | At least 6 explored rooms; every second eligible return; at least 3 minutes between fullscreen ads; skipped if not ready |
| Rewarded | Tavern → Wayfarer's supplies, explicitly chosen | One healing draught per completed ad; 2 claims per UTC day; satchel limit 6 |
| Remove Ads | Settings | Permanent one-time purchase for every character; all 3 ad formats removed; the same capped daily supplies can be claimed without a video |

Ads never gate quests, combat, equipment, normal rest or saves. No gold, XP or extra recovery is awarded by a video. Closing early gives no reward; an earned callback saves its unique receipt immediately. Duplicate SDK callbacks cannot duplicate the reward. UTC days use the device clock, with backward-date checks; this is an offline game, not a server-managed economy.

Fullscreen ads and the purchase sheet suspend game audio. Dismissal restores the previous audio settings. New games and save imports do not change purchase ownership.

## Google test identifiers

| Identifier | Value |
| --- | --- |
| Android application | `ca-app-pub-3940256099942544~3347511713` |
| Fixed banner | `ca-app-pub-3940256099942544/6300978111` |
| Interstitial | `ca-app-pub-3940256099942544/1033173712` |
| Rewarded | `ca-app-pub-3940256099942544/5224354917` |

These are the [official Android demo units](https://developers.google.com/admob/android/test-ads); they generate no revenue. Configuration lives in `src/admob.ts` and `android/app/src/main/res/values/strings.xml`. The build pins `@capacitor-community/admob` 8.1.0, Google Mobile Ads 25.4.0, and UMP 4.0.0.

Before serving live campaigns, replace the app ID and all three units with this game's own AdMob identifiers, set `AD_CONFIG.testMode` to `false`, configure the AdMob privacy message, and retain test-device mode during development. Production mode runs UMP before initializing/loading ads, checks permission to request ads, and exposes Advertising privacy choices in Settings when required. Google's demo mode skips the publisher-specific UMP setup. See [SDK setup](https://developers.google.com/admob/android/quick-start) and [privacy integration](https://developers.google.com/admob/android/privacy).

## Activate Remove Ads in Google Play Console

The product is **`remove_ads`**, a one-time, non-consumable purchase. It is not a subscription. A price cannot be activated by hardcoding it in an APK: Google Play supplies the purchasable product, localized price, and payment sheet.

1. Use the app with package **`com.ashenvow.game`** in Play Console. Upload the signed `AshenVow-0.2.7.aab` to an internal testing track; this task does not publish it to Google Play.
2. In **Monetize with Play → Products**, create the one-time product with ID **`remove_ads`** and title **Remove Ads**. Suggested description: “An ad-free journey for every character, with daily tavern supplies available without a video.”
3. Configure a **Buy** purchase option with a **US$4.99** US/base price, select regional availability/prices, and activate the product and purchase option. Do not add a rental option or a subscription.
4. Add a Google account under **License testing**, opt it into the internal track and install the game through Google Play on a device signed into that account. Use Google's test payment methods.
5. Check approval, cancellation, decline, pending approval/decline, Restore Purchases, reinstall, new character, offline restart, and refund/revocation. A pending payment must not remove ads. An acknowledged owned product must not be purchased twice.

The UI uses the price and eligible base offer returned by Google Play. Until the product is available, Settings shows the US$4.99 reference price and a retry action; it never pretends to charge or unlock a purchase. For account/store configuration and test payment behavior, see [creating products](https://support.google.com/googleplay/android-developer/answer/1153481) and [Google's billing testing guide](https://developer.android.com/google/play/billing/test).

## Purchase handling and offline ownership

`@capgo/native-purchases` 8.8.1 integrates Google Play Billing 9.1.0. Purchases use `inapp`, quantity 1 and `isConsumable: false`. The app accepts only `remove_ads`, a nonempty token, and Android `PURCHASED` state (`"1"`). It explicitly acknowledges an unacknowledged purchase before granting ownership. It never consumes Remove Ads. Restore queries current Play ownership independently of product availability; resuming or reconnecting refreshes pending/owned purchases.

Confirmed ownership is cached separately in native Preferences and loaded before advertising starts. Query/network errors retain previously confirmed ownership for offline play; a successful query reporting no ownership clears it. Game JSON exports contain no entitlement or payment token. This prototype does not include server-side purchase verification or real-time developer notifications; refund detection occurs through successful Play ownership refreshes. See [plugin API](https://github.com/Cap-go/capacitor-native-purchases) and [Google purchase processing](https://developer.android.com/google/play/billing/integrate).

## Build and verification

```powershell
npm test
npm run build
npm run android:apk
# APK plus signed Google Play upload bundle:
npm run android:aab
python -X utf8 scripts/verify-apk.py
```

The same private update key signs both artifacts. Keep `.android-signing` private. APK/AAB binaries are excluded from Git and distributed in GitHub Releases alongside checksums.

The controller/reward tests cover idempotent grants, daily/capacity limits, old saves, skipped ads, offline behavior, cooldowns, late callbacks, privacy changes, paid suppression, pending/cancelled purchases, acknowledgement, restore/revocation, price localization, and concurrent taps. Native test source is `android/app/src/androidTest/java/com/ashenvow/game/MonetizationIntegrationTest.java`; it checks plugin registration, bundled assets and real loading of all three Google demo formats. It performs no payment.

Verified on 5 October 2026: **83 TypeScript tests passed**; production web build passed; the **2 native integration tests passed on an Android 16 / API 36 x86_64 emulator**, including live Google demo banner, interstitial and rewarded loading. Settings was checked at 390×844 and 360×640; the tavern and onboarding were checked at 360×640. APK v2 signing and all bundled game assets were verified. The certificate matches earlier releases. No physical phone or real/licensed Play transaction has been tested.

To run only this app's native tests against an Android emulator/device:

```powershell
cd android
.\gradlew.bat :app:connectedDebugAndroidTest --no-daemon
```

Actual Google Play purchase-sheet and license-tester transaction verification require the activated Console product and a Play-enabled test device. They have not been performed by this task.
