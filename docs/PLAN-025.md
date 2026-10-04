# Version 0.2.5 repair

Scope: intact inventory labels/stats, non-overlapping quest cards, and recorded natural town ambience. Keep the English UI, portrait navigation, saved progress, combat rules, and existing art.

## Root causes reproduced

- At 360×700, six inventory tiles were forced into 79.6px rows. Five text blocks exceeded their card bounds, clipping EQUIPPED / rarity labels and stats.
- Below 620px height, a legacy rule explicitly hid item stats.
- At 360×700, four side quests required more height than the list reserved. The last card extended to y=556.2 while the pager began at y=530.
- Town ambience used two continuous filtered synthetic noise layers rather than a field recording.

## Changes

- Natural minimum card heights, full wrapping item names, visible stats, bounded internal overflow and responsive inventory pagination: 2 / 4 / 6 items for short / medium / tall screens.
- Quest card intrinsic heights, bounded list scrolling and 2 / 3 / 4 rows as portrait space permits. Filters, page controls and bottom navigation remain outside the list.
- A locally bundled CC0 forest bird recording plays alone in town, with quiet gain and fade transitions. Pending loads cannot play after mute, departure or cleanup, and ordinary gestures cannot stack loops. Loading failures stay quiet.
- PWA precaches the MP3; Android includes the same local asset. Version 0.2.5, version code 7, same signing key.

## Validation

- Recorded failing DOM checks and four failing audio lifecycle tests before the corresponding fixes.
- Inspect the actual interface at 360×584, 360×640, 360×700, 390×780 and 390×844, including long item names, detail stats, quest filters and paging.
- Run the complete test suite and production builds. Check final offline audio delivery and save restore, native bundled file equality, signature and checksum.
