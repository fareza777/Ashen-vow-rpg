# Version 0.2.6 verification — 4 October 2026

- Full suite: **56 passed, 0 failed**. Recorded playback, duplicate-gesture prevention, mute during loading, region changes, stopping and failure remain covered, alongside combat, campaign, progression and save validation. Log: `.logs/tests-026.log`.
- Town/home now uses **Water Dripping in Cave** by **Sclolex (CC0)**, adapted as an **80.1-second**, **48 kHz stereo** stone-water loop. There are no birds or synthetic town noise layers. Processing, license, hash and signal checks are documented in [AUDIO-026.md](AUDIO-026.md).
- Web build succeeded: `index-Dg-ECK3E.js`, unchanged stylesheet `index-DL-q8r-v.css`, **50 PWA precache entries**. The precache contains `audio/town-stonewater.mp3`; the retired bird asset is absent from both web output and APK.
- Actual production browser test on isolated `localhost:4186`: Settings shows the new description; About shows version 0.2.6 and Sclolex credit. With combat SFX muted, enabling ambience loaded the local recording with HTTP 200 and created exactly one AudioBufferSource and one Gain node. Opening ordinary menus created no additional audio nodes.
- Offline reload loaded the exact final web bundle and retained the isolated audio settings. The new MP3 returned HTTP 200 **from the service worker while network was offline**. One source and one gain were created after decoding. Web Audio realtime data confirmed rendering with currentTime **71.14 seconds** and callback interval **9.996 ms**. Network simulation was restored afterward. Evidence: `.logs/audio-026-proof.json`.
- Android release build succeeded. APK: `releases/AshenVow-0.2.6.apk`, version code **8**, **43,993,224 bytes** (41.96 MiB). SHA-256: `34ce0cd215a53b7843c4eea994235259bfc911090840e0cc96641bc1c5e6724f`. APK Signature Scheme v2 verified. All **40** bundled native web files match `dist-android` byte for byte; the native audio is identical to the new public MP3. No remote server or native service-worker registration is required.
- Signing certificate: `de7bbced2460f69a1562a29ccef6e427a3e26226ca662c6bde8aef291cea6efb`, unchanged from earlier releases. Existing local saves and gameplay rules remain compatible. No physical Android device or listening test on Android hardware was performed.
- Source is prepared for `fareza777/Ashen-vow-rpg`; APK binaries are distributed through GitHub Releases. Generated builds, local logs, machine-specific SDK configuration, and private signing material are excluded from Git.

# Version 0.2.5 verification — 3 October 2026

- Full suite: **56 passed, 0 failed**, including four new audio lifecycle tests. The four tests failed against the previous synthetic town ambience, then passed for recorded playback, repeated gestures, mute during loading, departure during loading, cleanup and unavailable audio. Campaign, combat and save tests remain green. Log: `.logs/tests-025-final.log`.
- Reproduced actual layout bugs before repair: at 360×700 five inventory text blocks exceeded their 79.6px card rows; at 360×584 item stats had `display: none`; the fourth 360×700 side quest extended to y=556.2 over the pager starting at y=530.
- Final production layout checks at **360×584, 360×640, 360×700, 390×780 and 390×844**. Inventory displays **2 / 4 / 4 / 4 / 6** items, with fully contained EQUIPPED labels, wrapping full names and visible stats. Inventory panel scroll height equals its client height at all five sizes. Pager ends 7px above fixed navigation. Document dimensions equal the viewport at every size.
- Side quests display **2 / 2 / 2 / 3 / 4** naturally sized rows at those same sizes. All text stays inside its card and all page controls remain reachable above navigation, verified by actual DOM hit testing and clicks. At 360×584 there is a 1px fractional-height scroll remainder; text and controls remain visible. Region/status filtering, empty state, Next and Previous work in the actual interface.
- At **360×584**, the After the Last Night inspector preserves larger story text (**21px**) and shows **+48 ATK** and **+15 EN** entirely inside the 332px modal, with the comparison and 134-gold sell action accessible. Inventory paging at that size shows the equipped Pale Moth Pendant and its +12% CRIT beside the complete legendary name. No horizontal page overflow.
- Town now plays only the locally bundled **Forest birds - ambient seamless loop** by **Magnesus (CC0)**. Original high-quality MP3: 27.052 seconds, 48kHz stereo, 637,824 bytes. The browser loaded `/audio/town-birds.mp3` with HTTP 200 and created exactly one AudioBufferSource and one Gain node; it created no synthetic town filter layers. Further ordinary menu actions added no playback nodes. Source and license are recorded in `AUDIO-025.md` and credited in About.
- Final production bundle: `index-B0kGNqYM.js`; stylesheet: `index-DL-q8r-v.css`. The PWA precaches **50 entries**, including the MP3. A normal reload adopted the final bundle before offline testing; transient intermediate development caches were not used for final evidence.
- Offline reload loaded the exact final bundle, restored the isolated save (**48 belongings, 845 gold, level 12, HP 141/141**) and showed the repaired inventory. The fresh recording request returned HTTP 200 **from the service worker while network was offline**. The audio graph contained one source, one gain and its destination. Web Audio realtime data confirmed rendering (currentTime 0.2s, callback interval about 9.9ms). This verifies decoding/rendering and cache delivery, not a listening test on Android hardware.
- Final APK: `releases/AshenVow-0.2.5.apk`, version code **7**, **42,707,155 bytes** (40.73 MiB). SHA-256: `ecdf401b55edfc6a8da2e9cb46bcb3e0769d4047635be0edc52d2809de7249fc`. Android release build and APK Signature Scheme v2 verification succeeded. All **40** bundled native web files match `dist-android` byte for byte, including the recording. No remote server URL or native service-worker registration is required.
- The signing certificate remains `de7bbced2460f69a1562a29ccef6e427a3e26226ca662c6bde8aef291cea6efb`, matching earlier updates. Existing game data, equipment, quest progress, economy rules and combat progression are preserved. No physical Android phone was used.
- User-facing preview at `http://localhost:4175/?release=025-current` loaded the final bundle on a normal reload and preserved the existing journey. Its production warning/error log is empty. Network, cache, service-worker and viewport overrides were restored; isolated test tabs and both test servers were closed. The current preview remains running. One earlier development-only HMR reload error was retained in the isolated tab's history; the final production build and interactions passed.

Screenshots: `screenshots/inventory-v0.2.5.png` and `screenshots/sidequests-v0.2.5.png`. Measurements and browser audio evidence: `.logs/ui-025-proof.json`. Test fixtures were imported only into isolated test origins; user storage was preserved.

---

# Version 0.2.4 verification — 3 October 2026

- Final automated suite: **52 passed, 0 failed**. Includes all 24 main quests, eight guardians, three endings, connected generation, legal preparation using earned rewards, all active skills, old-save migration, lossless narrative pages, hidden-room presentation, reward ownership/drop rules, persistent defeat and single-claim outcomes. Test log: `.logs/tests-024-final.log`.
- **108 legal build trials** passed: Steel, Ember and Shadow against regions 1, 4 and 8, with 12 seeds per combination. Early fights take 5–13 actions and consume 0–2 draughts; middle fights take 10–23 actions and consume 1–4; final fights take 12–31 actions and consume 1–6. Final Steel wins **12/12** with reactive play but **1/12** when heavy warnings are ignored. These simulations establish viability and tactical costs, not a measured human difficulty rating. Metrics: `.logs/challenge-024.json`.
- New games use fresh random seeds. Opening encounters, camp locations, special crossings and enemy rhythm vary, while the generated map persists with the save. Full-map and route-dock checks show `?` / `Unexplored` for all unresolved rooms: 32 unknown nodes in the fixture, with no encounter, boss or exit spoilers in accessible names, titles or styling. Resolved rooms reveal their type.
- Ordinary equipment drops are 4%, elite drops 9%, and caches 28%; draught rolls are separate from equipment awards. Random equipment excludes legendary, quest and guardian rewards. Duplicate belongings do not become free cash. First guardian bounties are reduced; repeats grant 15% of the original gold and 30% of XP. Shop, recovery and resale displays match their actual costs. Existing saved wealth, gear and excess supplies are retained.
- Eight newly generated chapter illustrations appear in main-quest detail, each narrative page and consequence views. A separate generated defeat illustration accompanies the loss screen. Every humanoid face remains concealed. Saved art, exact prompts and tool mode are recorded in `ART-024.md`.
- Actual UI story sequence verified: read every Maren page, select the truth, gain two trust, view the illustrated consequence, claim 68 gold / 90 XP once and unlock Moths. A portal fix makes all modal footers reachable above bottom navigation. At **360×584**, larger story text is 21px, chapter art is 240×120 and the footer ends at y=539.9; narration is complete across its pages.
- Battle illustration uses the full square authored image without cropping: Oracle **220×220 at 360×640**, Custodian **148.6×148.6 at 360×584**, and **349×349 at 390×844**. In the tall fixture, all actions end at y=827 inside the 844px viewport. `Enemy info` replaces the unlabelled lore eye; stats, lore, active effects and elite status are available. The useful Eye Focus combat skill remains distinct.
- The final blow stays in CombatView for its feedback, then transitions to a static receipt. Observed final-hit state: one effects layer and no outcome; completed victory: no effects layer or transient reward box. Rewards appear before flavor narration, with exact gold / XP and item name, quantity, art, rarity, slot and bonuses. Actual receipts verified: 13 gold plus Hollowwood Bow ×1 from a cache, 8 gold / 34 XP plus Hollowwood Bow ×1 from battle, and a Healing Draught ×1 supply award.
- Fatal combat now saves a persistent defeat receipt and blocks other actions until explicit acknowledgement. The tested loss shows 18 gold lost, retained XP / equipment / quest progress, recovery health 25/38 and full energy 20; it survives offline reload. `Return to town` acknowledges once, leaving 102 gold on day 2 instead of silently jumping home or charging again.
- Inventory long names and rarity labels wrap within their tiles. At **360×640** with larger text, the After the Last Night inspector fits: modal width 332px, scroll width 332px, page width 360px, description 21px and correct 134-gold resale. Skills show all eight entries per discipline in an internal scrolling region, without Next / Previous. At **360×640**, the region scrolls 766px within a 244px panel while navigation remains at y=571–640 and the document stays 640px tall.
- Final web bundle: `index-BGBXRVwv.js`; stylesheet: `index-C42x_vud.css`. Final offline checks loaded this exact bundle, accepted Guard and restored turn 6 / HP 245/329 without animation replay or locked controls. Victory persisted after offline reload and the inventory retained three belongings / 128 gold without duplicated rewards. The defeat illustration loaded locally at its full 1536px width and its receipt persisted offline.
- Signed Android APK: `releases/AshenVow-0.2.4.apk`, version code **6**, **42,068,859 bytes** (40.12 MiB). SHA-256: `0b2a4f3484a9ceed8e67f5ef4659188ace2bed7b0c2cdb91cfedfd82c688443d`. APK Signature Scheme v2 verified; certificate remains `de7bbced2460f69a1562a29ccef6e427a3e26226ca662c6bde8aef291cea6efb`, matching previous releases for updates that keep the app's local save.
- All **39** bundled native web files match the final `dist-android` files byte for byte. Portrait orientation, minimum SDK 24, target SDK 36, no remote server URL and no native service-worker registration verified. Local environmental ambience and combat SFX remain available without instrumental music.
- User-facing preview at `http://localhost:4175/?release=024-current` loads the final bundle and v0.2.4 menu on a normal reload. Existing storage was preserved. Browser cache, service-worker and viewport overrides were restored; warning/error log is empty. The isolated test tab and server were closed; the user-facing preview remains running.
- No physical Android phone was used. Installation, device safe areas, hardware audio, Back handling and native lifecycle still need physical-device validation. Browser interactions verify the web UI and offline behavior; simulations verify combat viability.

Screenshots: `screenshots/mystery-map-v0.2.4.png`, `screenshots/chapter-dialog-v0.2.4.png`, `screenshots/battle-v0.2.4.png`, `screenshots/victory-loot-v0.2.4.png`, `screenshots/cache-loot-v0.2.4.png`, `screenshots/defeat-v0.2.4.png`, `screenshots/inventory-v0.2.4.png`, `screenshots/skills-v0.2.4.png`. Portrait and combat images use isolated layout fixtures; no player progress was overwritten.

---

# Version 0.2.3 verification — 3 October 2026

- Final `npm test`: **43 passed, 0 failed**. Coverage includes the full 24-main-quest campaign, all eight guardians, all active skills, three endings, lossless narration, connected routes, single-claim rewards, progression gates, supply recovery turns and legacy-save migration. New log checks caught and corrected repeated boss phase announcements and overstated draught healing.
- Balance coverage: **108 legal build simulations** (Steel, Ember and Shadow; early, middle and final guardians; 12 seeds per combination), all successful with reactive play. Early encounters take 5–9 actions and final encounters 15–27. Final builds spend finite healing supplies; ignoring heavy warnings costs more health and lowers final Steel survival. This establishes tactical costs and campaign viability, not a measured human difficulty rating.
- Web production and signed Android release builds succeeded. Final application asset: `index-D8DAOQj2.js`; stylesheet: `index-DDO4SYYU.css`.
- APK: `releases/AshenVow-0.2.3.apk`, version code **5**, **36,312,191 bytes** (34.63 MiB). SHA-256: `790dbe5cf9b5f39665e04f6c3b8dde15b48dff687c9b48469da5b1d460583a9b`.
- APK Signature Scheme v2 verified. Certificate remains `de7bbced2460f69a1562a29ccef6e427a3e26226ca662c6bde8aef291cea6efb`, matching previous releases for in-place updates. All **37** bundled native web files match the final built assets; portrait orientation, minimum SDK 24, target SDK 36, no remote server requirement, and no native service-worker registration verified.
- Character now separates Attributes, Skills and Record; skills are paged by discipline. Quests separate Main story, Side quests, Completed and Chronicle, with side-quest region/status filters. Inventory keeps three equipped slots and supplies visible above paged illustrated items. Full descriptions, comparisons and actions open in detail dialogs.
- Browser portrait checks: **390×844**, **360×640** and **360×584**. The three redesigned menus and battle have no document-level vertical or horizontal overflow. At 390×844, inventory pager ends at y=768 above navigation starting at y=775. At 360×584, the inventory/skills pager ends at y=508 above navigation starting at y=515. At 360×640, Record grid ends at y=507.22, safely above navigation starting at y=571.
- Battle uses contained square illustration tiles instead of cropping them to the portrait area. At 360×584 the full authored tile is 70×70, and all battle actions end at y=573 within the panel ending at y=576. The live Battle log replaces the standalone intent card; History exposes up to 32 lines. Warnings remain available as useful log entries.
- Real UI checks: increase Might (13→14, attribute points 8→7), learn Ember Lance (skill points 10→9), compare and equip After the Last Night, side-quest region/status filters and empty state, paged results, two-page Maren conversation, select/confirm consequence, gain town trust, claim chapter reward and reveal the next-act quest. Fixture imports used isolated test origins; user save storage was not cleared.
- Final asset `index-D8DAOQj2.js` played offline against the enraged Custodian: Guard, Draught, Guard, then reload restored turn 7, HP 50/154, energy 78/78, resolve 93, enemy HP 652/1450 and the disabled `Ready in 1 action` draught. No animation replay or control lock remained after reload.
- Old excess draught stock is retained; new purchases and random supplies respect the six-draught capacity. Old saved HP/energy clamp to new maxima while equipment, skills, currency and quest progress remain intact. Enemy strength is tied to region/depth rather than player level, so advancement still improves the character.
- Final user-facing preview loaded the final asset and v0.2.3 menu at `http://localhost:4175/?release=023-current`. Network, cache, service-worker bypass and viewport overrides were reset. Test tab and test-only preview servers were closed; the user-facing preview server remains available. Browser warning/error log was empty.
- No physical Android hardware was used. Native installation, device safe areas, hardware audio and native lifecycle/persistence still need device validation. Browser fixtures demonstrate layout and interaction; the legal simulations demonstrate combat viability.

Screenshots: `screenshots/character-v0.2.3.png`, `screenshots/quests-v0.2.3.png`, `screenshots/inventory-v0.2.3.png`, `screenshots/battle-v0.2.3.png`. Battle screenshot uses an isolated layout fixture, including preserved legacy supplies.

---

# Version 0.2.2 verification — 3 October 2026

- Final `npm test`: 31 passed, 0 failed. Includes the full 24-quest campaign, all eight guardians, three endings, save migration, every active skill, complete route navigation and lossless paged narration. Result acknowledgement survives save reload without awarding loot twice.
- Web production build and signed Android release build succeeded. Latest application asset: `index-PMbSzhJf.js`; stylesheet: `index-BflI0-Mt.css`.
- APK: `releases/AshenVow-0.2.2.apk`, version code 4, 36,307,435 bytes (34.63 MiB). SHA-256: `ca2c534a53645fd808e9c1a54f5f0b4126de734b9b8d1ee5bebbb28feb23fe07`.
- APK Signature Scheme v2 verified. Certificate matches 0.2.1 exactly: `de7bbced2460f69a1562a29ccef6e427a3e26226ca662c6bde8aef291cea6efb`. All 37 native web files match the built assets byte for byte; no remote server or native service-worker registration.
- Browser UI checks at 390×844, 360×640 and 360×584. Exploration and combat document dimensions match the viewport without page scrolling or horizontal overflow. At 360×584, enraged boss actions end at y=567 inside the combat panel ending at y=576. Enemy intent remains above the actions.
- Deep-map fixture: depth 16 automatically centers the player inside the local map (scroll offset 907, player bounds y=402–450 within map y=186–629). Route pages expose deeper rooms, side paths, backtracks and shortcuts. Full map can be opened independently and closed with Escape.
- Exercised real UI actions: paged pilgrim event, selected and confirmed choice, loot result, Continue, Guard, Sundering Strike victory, inventory equip, return-to-town confirmation/cancel, chapter conversation, decision, chapter reward claim and next-act unlock. Larger story text is 21px; all three event choices and confirmation fit at 360×640.
- Final town at 360×640: main content scroll height equals its client height (553px). Footer buttons end at y=564 above navigation beginning at y=571.
- Offline PWA reloaded the final asset, restored the enraged Custodian encounter and accepted Guard offline. HP changed from 189 to 157; a second offline reload restored turn 4, HP 157, energy 78 and resolve 96, with enabled actions and no animation replay. Network, cache, service-worker bypass and viewport overrides were restored after testing. Test tab closed.
- Physical Android hardware, actual native safe areas and hardware audio have not been tested. Offline browser checks do not replace physical-device testing. Quest lists, inventory, the optional full map and oversized story text may scroll inside their own panels.

Screenshots: `screenshots/exploration-v0.2.2.png`, `screenshots/deep-map-v0.2.2.png`, `screenshots/battle-v0.2.2.png`, `screenshots/town-v0.2.2.png`.

---

# Version 0.2.1 polish verification

Verified on 2 October 2026. The previous version's report is retained below.

- Final tests: **28 passed, 0 failed**. Includes all 24 main quests, legacy-save migration, all active skill effects, distinct presentation families, feedback timing, and three endings.
- Final production web build and signed Android release build passed. Android version code **3**, package **com.ashenvow.game**, minimum SDK 24, target SDK 36. The update uses the same certificate as versions 0.1.0 and 0.2.0.
- Obsidian, bone, brass, and restrained blood-red replace olive/green UI surfaces. Browser launch color and native splash colors match. Town, menu, inventory, Settings, skill sheet, combat, and victory panels were inspected through the interface.
- Portrait layout checked at **390 x 844** and **360 x 640**, without horizontal overflow. At 360 x 640, heavy enemy intent ends at y=375.19 and the action dock starts at y=384, leaving the full intent readable. Narrow action labels retain readable 12-13px text; inventory supply and trade buttons now use 14px.
- Blade attack, heavy skill, heavy strike, guard, healing, incoming damage, and victory effects were exercised in the browser. Effects include illustrated enemy recoil, drawn sword arcs, sparks, damage numbers, ward/healing sigils, a delayed counterattack, health trails, and reward reveals. New controls lock during a turn's feedback. Effect labels were moved above the enemy title.
- Reduce motion was enabled through Settings and tested in combat: effects were hidden and the controls returned after the short interval. The setting was restored afterward. Resuming saved combat showed no replayed effects and no locked controls.
- The **final** offline PWA loaded `index-6XldieCi.js` and `index-CmmrNhgU.css`. It restored turn 4 against Drowned Oracle, HP 8/30, and energy 19/20. An offline Strike won the encounter, granted 18 gold and 34 XP, and displayed the new victory view. Another offline reload preserved those rewards.
- Network, service-worker bypass, cache, and viewport testing overrides were restored. Browser warning/error log was empty.
- All **37** bundled web files matched the APK entries by SHA-256. There is no remote server URL or service worker registration in the native bundle. The release checksum matched.
- APK: `releases/AshenVow-0.2.1.apk`, **36,302,723 bytes** (34.62 MiB), valid APK Signature Scheme v2.
- SHA-256: `047ac561ce83089518e515c32bcb551fb5fa6afc9cd324ac74c1103ec082cdb3`.

Captured previews: `screenshots/portrait-battle-v0.2.1.jpg`, `screenshots/battle-guard-v0.2.1.jpg`, `screenshots/battle-impact-v0.2.1.jpg`, and `screenshots/inventory-v0.2.1.jpg`.

No physical Android phone was used. Native installation, device audio quality, hardware Back, native persistence, and actual share sheets still require device validation. Audio remains local environmental ambience and noise-based SFX, with no instrumental music.

---

# Version 0.2.0 verification

Verified on 2 October 2026 in the local production preview at http://127.0.0.1:4175/ and http://localhost:4175/.

## Automated checks

- `npm test`: 26 passed, 0 failed in the final check.
- The campaign test completes all 24 main quests through connected movement, ordinary purchases, healing supplies, learned skills, attribute investment, eight guardian victories, ritual seals, and the shared-burden ending. Save data is validated throughout.
- Additional tests cover all active skills and their costs/feedback, three distinct endings, side quest progress before acceptance, persistent decisions, single-claim rewards, quest evidence, connected and varying maps, regional crossings, energy restrictions, corrupted saves, and migration from older saves.
- Content/reference checks cover 8 regions, 24 main quests, 37 side quests, 48 equipment items, 59 events, 123 event choices, 18 enemy profiles, 8 guardians, and 24 skills.
- `npm run build`: TypeScript and production build passed. PWA precaches 45 entries, including local art and fonts. The final web bundle is `index-Ch8aXyCB.js`.
- `npm run android:apk`: release build succeeded with the same final JavaScript/CSS and no service worker registration in Android.

## Interface and offline checks

- A fresh journey opens the main menu after the splash. New Game offers four concealed-face origins, eight illustrated cinematic pages with manual navigation, and four tutorial steps followed by contextual first-expedition guidance.
- Main quest acceptance, exploration, combat, inventory, learned-skill selection, Settings, and About were exercised through the interface. Sundering Strike produced damage feedback, consumed five energy, and allowed an enemy response.
- Portrait viewport: 390 x 844. Document width: 384 pixels; no horizontal overflow. The final battle controls run from y=550.25 to y=775. The enemy intent card ends above the controls, so the buttons do not obscure it.
- Enlarged story/event copy, choices, health labels, equipment cards, and chapter labels were inspected. Battle labels are at least 12px; choices use 16px; cinematic body uses 18px. The inventory uses full-width cards on narrow screens.
- The final production bundle was loaded offline from the PWA cache. Active combat restored turn 2, enemy HP 4/30, player HP 38/42, and energy 15/20.
- A Strike defeated the Drowned Oracle offline, granting 18 gold and 34 XP. Another offline reload preserved the defeated encounter and the expedition rewards.
- Settings reported that the offline cache was ready. Offline, cache-bypass, and temporary viewport test overrides were restored afterward. Warning/error log was empty at the end of browser testing.
- Nature ambience and SFX settings are independent. Audio is synthesized locally from layered/filtered noise; no instrumental music, oscillator melody, or musical drone is used. Hardware listening quality was not separately assessed.

## Artwork and previews

- Twelve generated artwork files contain 88 compositions, plus app icon exports. Every one of the 48 equipment items has a generated tile. New story, region, enemy, and equipment atlases were inspected visually. Human/humanoid faces are concealed.
- `screenshots/portrait-battle-v0.2.jpg`: final enlarged portrait battle controls and masked enemy.
- `screenshots/cinematic-v0.2.jpg`: illustrated cinematic page with enlarged readable narration and manual page controls.
- Exact expansion art prompts are in `EXPANSION-ART-PROMPTS.json`.

## APK verification

- Release: `releases/AshenVow-0.2.0.apk`, 36,297,139 bytes (34.62 MiB).
- Package: `com.ashenvow.game`; version code 2; version name 0.2.0; minimum SDK 24 (Android 7); target SDK 36.
- APK manifest confirms portrait orientation and cleartext traffic disabled.
- APK Signature Scheme v2 is valid. The public signing-certificate SHA-256 matches version 0.1.0, allowing an update without changing the package identity.
- `python scripts/verify-apk.py` compared every one of the 37 files in `dist-android` with its APK entry using SHA-256. All matched, including art, fonts, HTML, JavaScript, and CSS.
- The APK contains no remote server URL and bundles all assets for immediate offline play. Android App, Preferences, Filesystem, and Share plugins are included.
- The release checksum sidecar matches the APK. Full metadata is in `releases/APK-INFO.json`.
- APK SHA-256: `8836a481ca3dae56b226d2c0659e9ec537cfefecec19d8fd52ff23d0fa0e8e94`.

## Practical limits

This is an expanded, playable prototype. The APK has not been installed or tested on a physical Android phone. Native rendering, hardware Back, native Preferences persistence, actual share sheets, and device audio still need physical-device validation. Save serialization and migration are covered by engine tests; browser offline save recovery was verified directly.

There is no published Play Store listing. Rate explains this in-game. Some earlier enemy profiles share a portrait. A phone-hosted PWA requires HTTPS for installation/offline caching; the APK requires no hosting.
