# Town stone-water ambience — version 0.2.6

Vesper's Rest uses a quiet water-drip recording with cavern echoes. It replaces the version 0.2.5 bird recording and the older synthetic town noise. No musical tones, instruments, voices, birds, or synthetic noise bed have been added. Combat SFX and regional environments remain separate.

- Asset: `public/audio/town-stonewater.mp3`.
- Source: **Water Dripping in Cave.wav**, by **Sclolex**, published 12 February 2013 on [Freesound](https://freesound.org/people/Sclolex/sounds/177958/). The author describes it as an effected water-drip recording for cave or dungeon ambience.
- License: [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/), allowing modification and redistribution, including commercial use. About credits the author.
- Source file: [official high-quality MP3 preview](https://cdn.freesound.org/previews/177/177958_985466-hq.mp3), downloaded 4 October 2026. Original preview: 89.820 seconds, 48 kHz stereo.
- Processing: 100 Hz high-pass and 6.5 kHz low-pass; gentle compression (threshold 0.018, ratio 3, attack 4 ms, release 220 ms, knee 4); trim to 0.9–84 seconds; blend the first and last three seconds with a raised-cosine crossfade; normalize the PCM peak to 0.78; encode at 192 kbps MP3 without inherited metadata. The crossfade overlaps existing recorded water and adds no new layer.
- Final file: **80.100 seconds**, stereo **48 kHz**, **1,923,884 bytes**.
- SHA-256: `9712d83240f75fbbc68482c044034f4417e74f51f281cc2ace0893c57b813df9`.
- Decoded checks: peak **0.75724**, RMS **−39.26 dBFS**, no nonfinite samples. The loop boundary changes by at most **0.001944** (0.000622 at playback gain). Playback gain **0.32** limits the maximum peak below **0.243**, with a two-second fade-in. Existing mute/region transitions fade the outgoing recording.

Runtime fetches the bundled local asset, never Freesound. Android packages it for first-launch offline use; the PWA precaches it for offline revisits. Exactly one recorded source plays in town. Repeated gestures do not stack loops. Async completion is ignored after mute, departure, or stop. A failed recording stays quiet rather than introducing a noise fallback.

Measurements and browser rendering checks do not replace listening on an Android phone. The bundled asset can also be previewed directly before enabling Nature ambience in Settings.
