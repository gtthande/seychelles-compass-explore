## Offline Fallback Tiles

Place PNG tiles used when the online tile source is unavailable:

- `blank.png` — 256x256 light-gray placeholder used as the universal fallback
- `seychelles-z4.png` — optional preview tile focused on Seychelles at zoom 4
- `seychelles-z6.png` — optional preview tile focused on Seychelles at zoom 6

Notes:
- These files are optional. If they are missing, the Vite proxy serves a generated SVG gray tile.
- You can export tiles using MapTiler, QGIS, or any tile generator.
- Recommended size: 256x256 PNG, optimized for small footprint.


