# Ashen Vow Android APK

The installable release is `releases/AshenVow-0.2.9.apk`. It uses the same package and signing key as earlier releases, with version code 11, so it can be installed as an update. Keep the existing app installed to retain its local save.

Download it from the [v0.2.9 GitHub release](https://github.com/fareza777/Ashen-vow-rpg/releases/tag/v0.2.9). APK/AAB binaries are distributed through Releases and are excluded from Git. The AAB is a signed Google Play upload bundle and cannot be installed directly like an APK.

## Install on a phone

1. Copy the APK to your Android phone using USB, a file transfer app, or your preferred storage service.
2. Open the APK in the phone's file manager. If Android asks, allow that file manager to install this APK, then tap Install.
3. Open **Ashen Vow** from the launcher. A fresh journey opens the main menu; choose **Begin a new vow** for character creation, the eight-page cinematic, and tutorial. Existing progress continues from its save.

No PC server, HTTPS hosting, account, or initial asset download is required for the Android version. The game, artwork, fonts, town nature recording and combat sound synthesis are packaged locally. Portrait is requested on the Android activity.

The APK targets Android 16 / API 36 and has a minimum SDK of Android 7 / API 24. Keep Android System WebView updated for modern JavaScript and CSS support. The Android foundation is [Capacitor 8](https://capacitorjs.com/docs/android).

## Save, backup, and Android controls

Game progress and settings are mirrored to Android Preferences and restored before the game opens. The WebView also keeps its local save. Saves belong to the app and are separate from a desktop browser's save.

Settings → **Export save** prepares a JSON file and opens Android's share sheet so you can keep a backup. **Import save** opens the file picker and validates the JSON before replacing progress. Export a backup before uninstalling or clearing app data.

Android Back closes dialogs first, returns to the active expedition or town from other screens, opens the main menu from an expedition or town, and minimizes the app from the main menu. It does not silently discard an expedition. Share uses Android's native share sheet.

The game is not published on Google Play. Its Rate action currently explains that; it can link to the game's own listing when one exists.

## Rebuild

Double-click **Build Android APK.cmd**, or run:

```powershell
npm install
npm run android:apk
```

Requirements: Node.js 22+, Java 21, Android SDK platform 36, build-tools 36.0.0. Set `ANDROID_HOME` if the SDK is outside its usual Windows location. The Gradle wrapper downloads its dependencies on the first build.

The script builds the Android web assets separately from the PWA, synchronizes the native project, assembles a signed release APK, verifies its signature, and writes a SHA-256 checksum beside it.

## Preserve the update key

Keep a private backup of **`.android-signing`**, including both the keystore and `release.properties`. These files are ignored by Git and contain the signing credentials. Future APK updates must use the same key and application ID `com.ashenvow.game`; increase `versionCode` in `android/app/build.gradle` for a new release. Do not publish the signing folder or include it with the APK.

The built release is signed for direct installation. Publishing on Google Play is a separate step and has not been performed.

## Ads and one-time purchase

Version 0.2.9 uses Google demo AdMob IDs for town banners, expedition-break interstitials and optional tavern rewarded ads. Interstitials are eligible after each expedition with at least six explored rooms, including after acknowledging death, with a three-minute fullscreen cooldown. The first dungeon shares the town recording, and battle controls label **Draught** with remaining stock and recovery turns, consistent with item names, narration and the tutorial. Core gameplay, art, sound and saves work without an ad connection. Settings offers **Remove Ads — US$4.99 once** and **Restore Purchases** through Google Play Billing. Ownership is separate from character saves and disables all ad formats. Paid players can claim the same limited daily supplies without a video.

The Google Play product **`remove_ads`** must be created and activated with a US$4.99 base price for package `com.ashenvow.game`. Google Play supplies the final regional price. Until configured, the game reports store unavailability and remains playable. [AdMob and Play Console setup](MONETIZATION.md).

Build both APK and the signed AAB for internal Google Play testing with `npm run android:aab`. This does not upload or publish to Google Play.
