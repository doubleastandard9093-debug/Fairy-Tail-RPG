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
| 11 | Season 2 | Edolas | 40–48 |  | — | — | — | planned |
| 12 | Season 3 | Tenrou Island | 46–55 | tenrou | — | — | — | planned |
| 13 | Season 4 | X791 | 55–58 |  | — | — | — | planned |
| 14 | Season 4 | Key of the Starry Sky | 56–60 |  | — | — | — | planned |
| 15 | Season 5 | Grand Magic Games | 58–66 | crocus, domusflau | — | — | — | planned |
| 16 | Season 5 | Eclipse / Dragon King Festival | 64–70 | crocus | — | — | — | planned |
| 17 | Season 6 | Sun Village | 66–70 |  | — | — | — | planned |
| 18 | Season 6 | Tartaros | 68–78 |  | — | — | — | planned |
| 19 | Season 7 | Avatar | 76–80 |  | — | — | — | planned |
| 20 | Season 7 | Alvarez Empire | 80–99 |  | — | — | — | planned |
| 21 | Post-anime | The Hundred-Year Road | 90–120 |  | — | — | — | planned |

## Remaining batches
- Batch 2: Edolas (Edo-Magnolia via Anima, Faust/Dorma Anim), Tenrou (S-Class trial, Grimoire Heart, Hades — WSTYLE 'hades' ready), X791.
- Batch 3: Key of the Starry Sky, Grand Magic Games (Domus Flau already in Crocus), Eclipse/dragons.
- Batch 4: Sun Village, Tartaros, Avatar, Alvarez Empire.
- Post-anime: 100 Years Quest (`p_hundred`) and community arcs via `registerArc()`.

