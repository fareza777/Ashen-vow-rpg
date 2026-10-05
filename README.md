# Ashen Vow: The Hollow Below

An original English dark fantasy RPG about the cost of a perfect morning. All human and humanoid faces are concealed by masks, opaque veils, dark hoods, or enclosed helmets.

**Android game:** [Download AshenVow-0.2.6.apk](https://github.com/fareza777/Ashen-vow-rpg/releases/download/v0.2.6/AshenVow-0.2.6.apk) (also built locally in `releases/`). Copy it to your phone and open it to install. All game content, art, fonts, nature recording, and combat sounds are bundled for immediate offline play. See [Android instructions](docs/ANDROID.md).

## Launch on this PC

Double-click **Play Ashen Vow.cmd**, or use Node.js 22+:

```powershell
npm install
npm run build
npm run preview
```

Open **http://127.0.0.1:4175/**. Development uses `npm run dev` on port 5173. Port 4175 avoids another project's service on 4173.

A fresh journey opens the main menu after the splash. Choose **Begin a new vow**, create a masked character, read the eight-page cinematic at your own pace, and follow the tutorial. Contextual guidance follows the first expedition and can be dismissed. Existing journeys continue from saved progress. Every action saves locally; export/import backups in Settings.

## Core loop and screens

1. Accept a main quest and several personal side quests in the journal.
2. Prepare in Vesper's Rest: buy supplies, trade equipment, rest, learn disciplines, and invest level points.
3. Follow highlighted dungeon rooms. Branches contain encounters, evidence, puzzles, hazards, caches, and refuges; discovered shortcuts connect more distant rooms.
4. Read the battle log. Strike restores energy; heavy strikes and skills spend it. Guard against heavy blows and use healing draughts. The portrait action dock includes a skill selection sheet.
5. Bring evidence home, decide whom to trust, claim rewards, and open the next stage of the story. Some decisions alter later options and the ending.
6. Equip illustrated loot, improve your build, and enter deeper regions. Optional quests tell separate stories about the people living through the Dimming.

Screens: splash, main menu, character creation, cinematic, tutorial, town, forge, tavern, shrine, quest journal, conversations, chronicle, regions, scrolling dungeon map, event choices, combat, skills, loot results, character builds, inventory, bestiary/lore, settings, about, share, and Google Play availability.

## Version 0.2 content

- **8 acts, 24 main quests, 37 side quests, and 3 endings.** Investigations, rescues, rituals, conversations, and guardians advance an authored story with several reversals.
- **8 regions, 8 guardians, 18 enemy profiles, 33–63 nodes per new expedition.** Routes vary across visits; regional puzzles and hazards are not repeated on the same map.
- **59 events and 123 event choices**, plus town decisions. Choices affect trust, resources, equipment, shortcuts, and persistent story flags.
- **48 illustrated equipment items:** 16 weapons, 16 armor pieces, 16 charms; progressive forge stock, trade, rarity, and scalable healing supplies.
- **24 skills** across five tiers in Steel, Ember, and Shadow. Four origins, three attributes, leveling, critical strikes, poison, wards, healing, and guardian phases.
- An **eight-page illustrated cinematic**, splash, onboarding, guided first expedition, grouped future chapters, and clear outcome panels without duplicate story toasts.
- Larger text, stronger contrast, more reading space, reduced motion, thumb-accessible battle controls, and a map that scrolls with the current room.
- Locally bundled town water ambience, regional environments, and layered combat SFX. **No instrumental music or musical drone.** Enable Nature ambience in Settings or with the speaker button; SFX has a separate toggle.

Artwork contains **97 compositions across 14 generated artwork files**, plus icon exports. Every equipment item has its own generated tile. Exact prompts: [original](docs/ART-PROMPTS.json), [expansion](docs/EXPANSION-ART-PROMPTS.json), [chapter conversations and defeat](docs/ART-024.md). Some earlier enemy profiles share a portrait.

## Version 0.2.1 polish

The interface now uses obsidian, bone, weathered brass, and restrained blood-red, with matching menus, modals, equipment cards, map nodes, web launch colors, and Android splash colors. The former olive/green surface colors have been removed.

Battle feedback distinguishes blade hits, heavy impacts, ember skills, shadow skills, wards, healing, and focus. Illustrated enemies recoil, sparks follow the impact, the counterattack follows at 620ms, health bars show a fading damage trail, and victories reveal the defeated enemy before rewards. Buttons briefly lock while the turn plays out; reduced motion suppresses these effects and uses a short 180ms interval. Resuming a save never replays its last attack.

Portrait layouts have been checked at 390 x 844 and 360 x 640. Short screens use a compact illustration and simpler action labels while keeping enemy intent visible above the thumb controls. Remaining supply, equipment, trade, and Settings labels have also been enlarged.

## Offline, saves, and updates

The APK works offline immediately. The web/PWA caches assets after its first complete production visit; a phone-hosted PWA requires HTTPS. Local fonts, artwork, and audio require no remote API. Settings reports when the offline cache is ready.

Android saves/settings are mirrored to native Preferences and restored before rendering. Android's share sheet handles backup exports and game sharing. Older saves keep equipment and progress; new fields allow the story to continue beyond the former third-chapter ending. Active legacy 17-node maps remain supported.

Defeat costs 15% of gold. An illustrated summary shows the losses and recovery; acknowledge it to return to town. The summary persists through reload. Experience, equipment, and learned disciplines remain. Below 25 resolve, damage decreases. Story choices and quest rewards cannot be repeatedly farmed. Keep a private backup of `.android-signing` for future updates, and never share that folder.

The game is not published on Google Play. Rate explains this and never redirects to another game's listing.

## Build and verify

```powershell
npm test
npm run build
npm run android:apk
python scripts/verify-apk.py
```

Android builds require Java 21, SDK platform 36, and build-tools 36.0.0. **Build Android APK.cmd** uses the existing update key, bundles the current game, verifies the APK signature, and writes a checksum.

Tests include all 24 main quests completed through real movement, supplies, builds, eight guardian victories, and the third ending. Additional checks cover all active skills, the other endings, save migration, choices, map restrictions, and rewards. See [verification](docs/VERIFICATION.md). A physical Android device has not yet been used to validate this build.

Engine: `src/engine.ts`. Authored content: `src/data.ts`, `src/campaign.ts`, `src/crossings.ts`. Sound: `src/audio.ts`. Art: `public/art`.

## Version 0.2.4: unknown paths and meaningful supplies

Unvisited rooms show a question mark in both maps and route controls. New vows use a fresh seed; opening room order, camp positions, encounters and enemy opening rhythms vary. Already generated maps persist unchanged when resuming. Each map guarantees a randomly placed puzzle and hazard when regional crossings are available.

Eight new generated chapter scenes illustrate main-quest details and conversations. Enemy illustrations use the full available battlefield height, with named Enemy info and History controls. The final hit completes on the battlefield before a static victory receipt appears. Receipts list actual gold, XP, named equipment, rarity, combat bonuses, and draught quantities; missing and already owned drops are stated explicitly. Defeat has its own generated illustration, exact losses, retained progress, recovery values, and an acknowledgement before town.

Skills scroll inside the Character panel while bottom navigation stays fixed. Inventory rarity labels, long item names and inspection descriptions wrap within their panels. Caches have a 28% equipment chance; ordinary foes have 4%, or 9% for rare ashbound foes. Field loot excludes legendary and quest/guardian rewards. Duplicate rewards grant no extra gold, equipment resale pays 22%, repeat guardians pay a reduced bounty, and supply/rest costs grow with level. Existing currency, gear, progress and surplus supplies are preserved. Banking side-quest rewards and preparing between expeditions is part of the challenge.

## Version 0.2.5: intact cards and natural town sound

Inventory cards now reserve enough height for EQUIPPED, full item names and stats. Short screens retain stats, with 2 / 4 / 6 items per page as height permits. Quest lists keep naturally sized cards inside their own bounds, use 2 / 3 / 4 rows as space permits and leave filters, paging and navigation reachable. The former 700px breakpoint no longer forces cards over the page buttons.

The inventory and quest layout repairs remain in the current release. The earlier town bird recording has been replaced by the stone-water ambience described below.

## Version 0.2.6: stone-water town ambience

Vesper's Rest now plays quiet water drops and long stone echoes. The locally bundled 80.1-second stereo recording has a three-second blended loop seam, gentle filtering, controlled peaks, and a two-second fade-in. No birds, instruments, or synthetic noise bed play in town. Muting, leaving town, and pausing the app retain their existing audio safeguards. See [audio source, CC0 license, and processing notes](docs/AUDIO-026.md).

The sound and layout repairs remain in the current release. Source, generated game artwork, audio, tests, and Android project are in this repository; built APKs are distributed through Releases. The private signing key stays outside Git.

## Version 0.2.7: optional ads and Remove Ads

Android now includes native AdMob banner, interstitial and rewarded ads using **Google test IDs**. The town banner has its own space; fullscreen ads appear only at a safe expedition break. The tavern offers an optional healing draught after a completed rewarded ad, capped at two per UTC day and six carried supplies. Ads never interrupt combat or gate the offline adventure.

Settings includes **Remove Ads — US$4.99 once**, plus **Restore Purchases**, through Google Play Billing. An owned purchase disables every ad format and allows the same daily tavern supplies without a video, including offline. Pending/cancelled payments do not grant ownership; old saves and new characters remain supported. Store-provided local prices replace the US reference price when available.

Download the signed APK and Google Play upload AAB from the [v0.2.9 release](https://github.com/fareza777/Ashen-vow-rpg/releases/tag/v0.2.9). Install the APK over the previous version to keep your journey. The AAB is for Play Console testing/upload, not direct phone installation. **The `remove_ads` product must be activated at US$4.99 in Play Console before store purchases can work.** [Setup, behavior and verification details](docs/MONETIZATION.md).

## Version 0.2.8: expedition breaks and battle potions

Interstitials can now appear after every expedition with at least six explored rooms, whether returning safely or after choosing Return on the death screen. The three-minute fullscreen interval remains; offline, unavailable and removed ads are skipped. Defeat receipts preserve explored rooms across restarts.

The Unhallowed Catacombs use the same locally bundled stone-water recording as Vesper's Rest, without the previous synthetic water layers. The battle **Potion** button shows stock, healing and unavailable reasons in the action grid. Drinking spends one turn and requires two other actions before another potion; battle log, healing effects and tutorial explain the action.

## Version 0.2.9: consistent Draught terminology

The battle action, healing recap, empty-stock message and tutorial use **Draught**, matching the healing item and narrative. The stock display, healing, one-turn cost and two-action recovery are retained.

## Inspiration

The brief references [Grim Quest](https://play.google.com/store/apps/details?id=com.grimdev.grimquest) for genre and structure. Ashen Vow has an original world, story, names, art, and interface and is not affiliated with that game.

## Version 0.2.2: less scrolling

Dungeon exploration, encounters, battles, and results now use separate portrait screens. Choose reachable routes from the bottom dock, including side paths, backtracking and shortcuts. The map follows your position; Full map opens a larger planning view. Long encounters and campaign conversations use paged narration with an explicit decision confirmation. Continue clears the result in the saved journey, so acknowledged loot does not replay after reopening the app.

Town services now fit in a compact hub with a separate region picker. Combat keeps enemy intent, health and actions together; skills, lore and the battle log open on demand. Quest lists, inventory, the full map, and unusually large story text can still scroll inside their own panels.

## Version 0.2.3: compact menus and a harder journey

Character now has Attributes, Skills, and Record tabs. Quests and Chronicle use compact paged lists, with side-quest filters by region and status. Inventory keeps equipped gear visible, shows four or six belongings per page, and opens full art, descriptions, stat comparisons, Equip, and Sell on inspection. English text remains the default.

Combat contains the complete square enemy illustration and a live battle log, with full History available. Short screens use an action recap to keep controls visible.

Encounter difficulty comes from region and depth, without following player level. Enemy rhythms vary, heavy attacks are warned in the log, guardian phases change tactics, and Guard reduces incoming damage by 75%. Draught capacity is six for new purchases; healing requires two intervening combat actions. Existing excess supplies and earned skills remain in older saves. Levels require progressively more XP, skill tiers unlock at levels 1, 4, 7, 10, and 13, chapter equipment gates apply consistently, and a level gain restores six energy rather than a full reservoir.

The automated suite includes the full campaign and 108 legal build trials across early, middle, and final guardians. This is simulation coverage, not a timed human playtest or a physical Android test.
