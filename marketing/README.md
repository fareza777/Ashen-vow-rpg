# Ashen Vow — English Play Store kit

Designed against the actual Ashen Vow 0.2.9 game and its original lore. The
creative centers on a lantern that remembers, a drowned bell, and a name dated
tomorrow. The icon contains no people; all other human figures have concealed
faces or are viewed from behind.

## Upload-ready files

| Asset | File | Format |
| --- | --- | --- |
| App icon | `play-store/app-icon-512.png` | 512 × 512 RGBA PNG, under 1024 KB |
| Feature graphic / banner | `play-store/feature-graphic-1024x500.png` | 1024 × 500 RGB PNG |
| Eight phone screenshots | `play-store/screenshots/01.png` through `08.png` | 1080 × 1920 RGB PNG |
| Store preview video | `trailer/out/AshenVow-StoreTrailer-1080x1920.mp4` | 30 s, 1080 × 1920, 30 fps, H.264/AAC |
| Editable trailer and stills | `trailer/` | Remotion 4.0.533 project with local source assets |

Use the numbered screenshot order: combat, event choices, dungeon map, story,
skills, equipment, side quests, town. Headlines occupy less than 20% of each
image. Every screenshot includes actual game UI, captured from a separate local
demo session. No current player save was modified. This kit does not change the
installed game's Android launcher icon; it supplies the new store icon artwork.

In the original workspace, run `node marketing/serve.mjs` and open
`http://127.0.0.1:4192/` to browse the assets and play the MP4. The store upload ZIP
contains the final assets and the editable-project ZIP contains the source.
Extract either archive to get a `marketing/` folder. The upload kit includes the
video; the editable kit includes the source clips and can export the video again.

## Play Console

Under **Store presence → Main store listing**, upload the app icon, feature
graphic and eight phone screenshots. Put the 30-second MP4 on YouTube as public
or unlisted, allow embedding and disable monetization, then use its video URL in
Play Console. The preview-video field accepts a YouTube URL, not a local MP4.

Official requirements checked 6 October 2026:
https://support.google.com/googleplay/android-developer/answer/9866151?hl=en

## English copy and accessibility text

| Screenshot | Headline | Alt text |
| --- | --- | --- |
| 01 | Every turn has a cost. | A turn-based battle against the armored Bell Warden with health, battle log and combat actions. |
| 02 | The dark offers a choice. | Three dungeon event choices offer trust, knowledge or gold at the cost of trust. |
| 03 | No descent is the same. | A generated dungeon map conceals unexplored rooms with question marks. |
| 04 | Your name. Tomorrow's date. | Illustrated dialogue reveals a secret beneath Vesper's Rest. Both characters' faces are concealed. |
| 05 | Forge your own oath. | Character skills are organized into Steel, Ember and Shadow disciplines. |
| 06 | Relics with a past. | Inventory shows illustrated weapons, armor and charms with equipment stats. |
| 07 | More than one story. | Side quests can be filtered by region and status in the quest journal. |
| 08 | Return. Rebuild. Descend. | Vesper's Rest offers the forge, tavern, shrine, character building and the next expedition. |

Suggested short description (76 characters):

> A dark fantasy RPG of dangerous descents, branching choices and ancient vows

## Review

The creative shows features present in the game: 24 main quests, 37 side quests,
three endings, eight regions, 24 skills and 48 illustrated equipment items.
No ratings, awards, download counts, prices or release claims are invented.
Generated illustration prompts are in `ART-PROMPTS.json`; audio and font credits
are in the trailer README. Final file measurements and SHA-256 hashes are recorded
in `ASSET-MANIFEST.json`.
