# Ashen Vow monetization — 0.2.9

The Android build includes real native AdMob SDK integration using Google's public demo IDs, plus Google Play Billing for **Remove Ads — US$4.99 once**. Browser/PWA play remains offline-capable; advertising and purchasing controls explain that they require Android. No purchase has been made or simulated in the shipped game.

## Placements and player benefits

| Format | Placement | Limits |
| --- | --- | --- |
| Banner | Top of the town hub, in a reserved 50dp slot | Hidden in menus, dialogs, expeditions, battle, background and offline |
| Interstitial | Returning to town safely, or after acknowledging dungeon death | At least 6 explored rooms; every eligible expedition; at least 3 minutes between fullscreen ads; skipped if not ready |
| Rewarded | Tavern → Wayfarer's supplies, explicitly chosen | One healing draught per completed ad; 2 claims per UTC day; satchel limit 6 |
| Remove Ads | Settings | Permanent one-time purchase for every character; all 3 ad formats removed; the same capped daily supplies can be claimed without a video |

Ads never gate quests, combat, equipment, normal rest or saves. No gold, XP or extra recovery is awarded by a video. Closing early gives no reward; an earned callback saves its unique receipt immediately. Duplicate SDK callbacks cannot duplicate the reward. UTC days use the device clock, with backward-date checks; this is an offline game, not a server-managed economy.

The death story stays visible until **Return to Vesper's Rest** is chosen. Its explored-room count is saved with the defeat receipt, including across restarts; only then can an eligible interstitial appear at the town transition. Death receipts from older versions without a room count remain playable and skip that placement. An unavailable ad never waits to appear later during play.

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

1. Use the app with package **`com.ashenvow.game`** in Play Console. Upload the signed `AshenVow-0.2.9.aab` to the closed testing track.
2. In **Monetize with Play → Products**, create the one-time product with ID **`remove_ads`** and title **Remove Ads**. Suggested description: “An ad-free journey for every character, with daily tavern supplies available without a video.”
3. Configure a **Buy** purchase option with a **US$4.99** US/base price, select regional availability/prices, and activate the product and purchase option. Do not add a rental option or a subscription.
4. Add a Google account under **License testing**, opt it into the internal track and install the game through Google Play on a device signed into that account. Use Google's test payment methods.
5. Check approval, cancellation, decline, pending approval/decline, Restore Purchases, reinstall, new character, offline restart, and refund/revocation. A pending payment must not remove ads. An acknowledged owned product must not be purchased twice.

The UI uses the price and eligible base offer returned by Google Play. Until the product is available, Settings shows the US$4.99 reference price and a retry action; it never pretends to charge or unlock a purchase. For account/store configuration and test payment behavior, see [creating products](https://support.google.com/googleplay/android-developer/answer/1153481) and [Google's billing testing guide](https://developer.android.com/google/play/billing/test).

## Public privacy and app-ads files

The public privacy policy is hosted at **https://fareza777.github.io/Ashen-vow-rpg/privacy-policy.html**. The AdMob seller declaration is at **https://fareza777.github.io/Ashen-vow-rpg/app-ads.txt** and uses publisher ID `pub-6279186647593327`.

## Purchase handling and offline ownership

`@capgo/native-purchases` 8.8.1 integrates Google Play Billing 9.1.0. Purchases use `inapp`, quantity 1 and `isConsumable: false`. The app accepts only `remove_ads`, a nonempty token, and Android `PURCHASED` state (`"1"`). It explicitly acknowledges an unacknowledged purchase before granting ownership. It never consumes Remove Ads. Restore queries current Play ownership independently of product availability; resuming or reconnecting refreshes pending/owned purchases.

Confirmed ownership is cached separately in native Preferences and loaded before advertising starts. Query/network errors retain previously confirmed ownership for offline play; a successful query reporting no ownership clears it. Game JSON exports contain no entitlement or payment token. This prototype does not include server-side purchase verification or real-time developer notifications; refund detection occurs through successful Play ownership refreshes. See [plugin API](https://github.com/Cap-go/capacitor-native-purchases) and [Google purchase processing](https://developer.android.com/google/play/billing/integrate).

## Build and verification

Version **0.2.9** restores **Draught** in the battle action, healing recap, empty-stock message and tutorial. On 5 October 2026, **91 TypeScript tests passed**, including the rendered Draught control, healing, stock, recovery and unavailable states. Production web, signed APK and signed AAB builds passed. All **42 bundled game assets in each artifact** and the existing signing certificate were verified. This text update did not require another native SDK or browser-layout test run.

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

Version **0.2.8**, verified on 5 October 2026: **91 TypeScript tests passed**; production web, signed APK and signed AAB builds passed. Tests cover every-expedition frequency, the six-room threshold, duplicate returns, fullscreen cooldown, death acknowledgement/reload and saved-room validation. Battle potion controls were checked at **360×640 and 390×844**, including actual healing, stock reduction and recovery turns; the page and controls fit without scrolling. The death screen survived browser reload and returned to town only after acknowledgement, with no browser console errors. APK v2 signing and all **42 bundled assets in each Android artifact** were verified; both certificates match earlier releases.

The unchanged native SDK integration was verified for **0.2.7** on the same date: **2 native integration tests passed on an Android 16 / API 36 x86_64 emulator**, including actual Google demo banner, interstitial and rewarded loading. Those SDK tests were not rerun for this gameplay and placement update. No physical phone or real/licensed Play transaction has been tested.

To run only this app's native tests against an Android emulator/device:

```powershell
cd android
.\gradlew.bat :app:connectedDebugAndroidTest --no-daemon
```

Actual Google Play purchase-sheet and license-tester transaction verification require the activated Console product and a Play-enabled test device. They have not been performed by this task.
