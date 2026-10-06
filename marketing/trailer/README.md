# Ashen Vow — editable Remotion trailer

An English 30-second portrait trailer and eight editable Google Play screenshot
compositions. The game footage is captured from Ashen Vow 0.2.9. The icon depicts
a lantern; human characters have concealed faces or are shown from behind.

## Preview and edit

From the folder where you extracted the editable ZIP, open a terminal:

```powershell
cd .\marketing\trailer
npm ci
npm run dev
```

Open the printed local URL. Select **AshenVow-StoreTrailer**. Each substantial
scene has its own timeline under **Trailer-scenes**. Still images are under
**Play-Store-assets**. Edit the text, scene timing, art or footage in `src/`.

The captions are part of the picture and remain readable with muted autoplay.
The soundtrack uses a single ominous bell, metal impacts, paper, air movement
and quiet recorded water ambience. There is no instrumental music or voiceover.

## Export

```powershell
npm run render:video
npm run render:stills
```

The MP4 is saved in `out/AshenVow-StoreTrailer-1080x1920.mp4`. The PNGs are saved
in the adjacent `../play-store` folder. Rendering uses locally bundled artwork,
fonts, gameplay clips and audio. No generation API key is required.

Full reproduction from freshly captured frames additionally requires the parent
game project and Python with NumPy:

```powershell
npm run prepare:assets
python scripts/sound-design.py
npm run render:all
```

Raw recording frames are omitted from the download to keep it compact; the
complete editable project includes the finished source MP4 clips.

## Timeline

| Time | Focus |
| --- | --- |
| 0.0–2.2 s | The bell has your name. Its date is tomorrow. |
| 1.8–6.8 s | Bell Warden combat and real attack animation |
| 6.4–10.4 s | Concealed procedural dungeon routes |
| 10.0–14.0 s | Event choices with different consequences |
| 13.6–17.6 s | Illustrated main-quest dialogue |
| 17.2–20.8 s | Character building and skill disciplines |
| 20.4–23.4 s | Equipment, item lore and stats |
| 23.0–25.8 s | Side quests |
| 25.4–28.6 s | Town hub and the next descent |
| 28.2–30.0 s | Ashen Vow identity and the lantern oath |

Transitions overlap for 0.4 seconds. Gameplay appears at 1.8 seconds and remains
visible for 26.8 seconds, supporting the actual experience throughout the trailer.

## Credits

New lantern, sanctuary and bell illustrations: built-in Imagegen; exact prompts
are in `../ART-PROMPTS.json`. Existing world and equipment artwork belongs to this
original game project. No competitor art or interface is used.

Water ambience: **Water Dripping in Cave.wav**, Sclolex, CC0 1.0,
https://freesound.org/people/Sclolex/sounds/177958/ — the processed, locally bundled
game recording. New sound effects are original generated waveforms. Cinzel and
Manrope fonts use the SIL Open Font License; see `public/fonts` for license files.
