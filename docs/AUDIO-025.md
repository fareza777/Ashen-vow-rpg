# Town nature recording — version 0.2.5

Town uses a real forest field recording instead of the earlier synthetic noise layers. No music, instruments, voices or tonal drone is added to it. Combat SFX and other regional environments remain separate.

- Asset: `public/audio/town-birds.mp3`.
- Source: **Forest birds - ambient seamless loop**, recorded by **Magnesus**, published 17 February 2024 on [Freesound](https://freesound.org/people/Magnesus/sounds/723913/).
- License: [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/). The author permits reuse and redistribution, including commercial use. Credit is also present in About.
- File: [official high-quality MP3 preview](https://cdn.freesound.org/previews/723/723913_2008500-hq.mp3), used without trimming or processing. Freesound describes the authored original as a seamless loop of birds in a Polish forest.
- Downloaded 3 October 2026. Length **27.052 seconds**, stereo **48 kHz**, **637,824 bytes**.
- SHA-256: `9aebcb869cf37040c4588fc05d72bed197951aaa1beacb6874b379c69e379dbb`.
- Decoded signal check: peak 0.8478, RMS −22.73 dBFS, no nonfinite samples. Playback gain 0.22 gives a maximum peak below 0.187, with a two-second fade-in and fade-out on ambience changes.

The file is included in Android and in the PWA offline precache. Runtime reads `/audio/town-birds.mp3` locally; it does not contact Freesound. A failed asset load stays silent rather than falling back to the former town noise. Async requests are guarded against muting, changing region and stopping playback. Automated lifecycle tests exercise these transitions, repeated gestures and failed loading.
