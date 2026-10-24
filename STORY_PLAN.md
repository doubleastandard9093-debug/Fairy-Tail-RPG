# Fairy Tail RPG — Story Plan

Fan-made pitch prototype, not affiliated with Hiro Mashima, Kodansha or the anime studios. All dialogue is original paraphrase; no official art.

Arcs are data in `src/data/story.js` (`ARCS`, `registerArc()` for post-anime arcs). Chapter N opens when chapter N-1's last quest is done (or any of its quests was already started, for old saves). Gated places block train/ferry travel only.

| # | Season | Arc | Lv | Zones | Main quests | Bosses | Gates | Status |
|---|---|---|---|---|---|---|---|---|
| 1 | Season 1 | Fairy Tail | 1–6 | magnolia, hargeon | q_welcome, q_bora | — | — | live |
| 2 | Season 1 | Macao | 5–10 | hakobetrail, hakobe | q_macao | macao_vulcan | — | live |
| 3 | Season 1 | Daybreak | 8–13 | shirotsume | q_daybreak | everlue | — | live |
| 4 | Season 1 | Lullaby | 10–16 | oshibana, clover, canyon | q_lullaby | grumblejaw | — | live |
| 5 | Season 1 | Galuna Island | 14–20 | galuna | q_galuna | lyon | galuna | live |
| 6 | Season 1 | Phantom Lord | 20–28 | oak | q_phantom | jose | oak | live |
| 7 | Season 1 | Loke | 22–28 | magnolia, kardia | q_loke | — | — | live |
| 8 | Season 1 | Tower of Heaven | 26–34 | akane | q_tower | jellal | akane | live |
| 9 | Season 2 | Battle of Fairy Tail | 30–38 | magnolia, kardia | q_bof | laxus | — | live |
| 10 | Season 2 | Oración Seis | 34–42 | woodsea | q_oracion | brain | — | live |
| 11 | Season 2 | Edolas | 40–48 | magnolia, edolas | q_edolas | faust | — | live |
| 12 | Season 3 | Tenrou Island | 46–55 | tenrou | q_tenrou | hades | — | live |
| 13 | Season 4 | X791 | 55–58 | magnolia | q_x791 | teebo | — | live |
| 14 | Season 4 | Key of the Starry Sky | 56–60 | magnolia | q_keys | byro | — | live |
| 15 | Season 5 | Grand Magic Games | 58–66 | crocus, domusflau | q_gmg | sting | — | live |
| 16 | Season 5 | Eclipse / Dragon King Festival | 64–70 | crocus | q_eclipse | future_rogue | — | live |
| 17 | Season 6 | Sun Village | 66–70 | hakobe | q_sun | frost_colossus | — | live |
| 18 | Season 6 | Tartaros | 68–78 | era | q_tartaros | mard_geer | — | live |
| 19 | Season 7 | Avatar | 76–80 | woodsea | q_avatar | arlock | — | live |
| 20 | Season 7 | Alvarez I: The Western Front | 80–86 | hargeon | q_alvarez1 | ajeel | — | live |
| 21 | Season 7 | Alvarez II: Scarlet Despair | 86–92 | magnolia | q_alvarez2 | irene | — | live |
| 22 | Season 7 | Alvarez III: The Black Wizard | 92–99 | magnolia | q_alvarez3 | zeref | — | live |
| 23 | Post-anime | The Hundred Years Quest | 100–112 | guiltina | q_hundred | mercphobia | — | live |
| 24 | Post-anime | The Hundred Years Quest II: Moon and Wood | 112–120 |  | — | — | — | planned |

All canon anime arcs (1–22) are live. Arc 23 is a loose, original continuation of the post-anime Hundred Years Quest (Mercphobia, the Water Dragon God, at the Guiltina landing past Akane). Arc 24 is a planned hook: four Dragon Gods remain, and a moon dragon called Selene is teased.

## Adding more
- Add quests to `src/data/quests_story.js` (boss at stage index 2 so guildmate helpers join), then call `registerArc()` or edit `ARCS` with status 'live'.
- Bosses go in `MOBS`/`SPAWNS`/`BOSS_ARENAS` in `src/data/mobs.js`; set pieces in `src/world/arcsets.js`.
