# Fairy Tail RPG: fan-made pitch prototype

> **Fan-made concept demo, not affiliated with or endorsed by Hiro Mashima, Kodansha or the Fairy Tail rights holders.**
> All art in this prototype is hand-made and procedural (cel-shaded stand-ins drawn in code). No official artwork, logos or assets are used.

**Play it:** https://doubleastandard9093-debug.github.io/Fairy-Tail-RPG/ (desktop browsers and iPhone. On iPhone use Share › Add to Home Screen for full-screen play.)

## Concept
You are the newest wizard to join **Fairy Tail**. Pick your magic and where Mirajane stamps your guild mark, then walk into the guild hall in **Magnolia**. Natsu is standing on a table, Gray has lost his shirt, Erza is guarding her cake and Master Makarov is sitting on the bar. From there you take jobs from the request board, gather and forge your own gear, and work up to S-Class jobs, finishing with the story fight against **Lullaby, Demon of Zeref**.

The pitch is a cosy-but-deep online-RPG-style game in the Fairy Tail world, built for browser and mobile first and designed to grow into a full live game. This prototype is single-player. Multiplayer is planned but paused.

## Design pillars: four games, one guild
| Inspiration | What we take | In the prototype |
|---|---|---|
| **Toram Online** | Anime cel-shading, free stat builds, weapon and magic skill trees, telegraphed boss fights | Toon shading and outlines, 5 stats with free points, per-magic ability unlocks by class rank, a boss whose attacks show their area on the ground first |
| **Albion Online** | *Your gear is your build*, T1–T8 gear tiers, tiered gathering and refining | Weapon and armour decide your ability bar. T1–T8 items, tiered ore, wood and fibre nodes, forge and workbench refining |
| **RuneScape 3** | Skills to 99, quests, ability bar with adrenaline, bank | RS-style XP curve to 99, 5 gathering and artisan skills, story quests, 8-slot ability bar with adrenaline ultimates, bank |
| **AdventureQuest 3D** | Charm, humour, class ranks earned by playing | Joke-heavy in-character dialogue, class ranks 1–10 for each weapon and magic |

## Fairy Tail content
- **Magnolia** with the Fairy Tail guild hall, its bar, the request board and guild-mark banners. Also a forge, an inn, Levy's archive (the bank), a magic shop and the fields south of town out to Kardia Cathedral and Clover Canyon.
- **Cast as NPCs:** Master Makarov, Mirajane (tutorial, bar and requests), Natsu, Happy, Lucy, Gray, Erza, Levy (storage), Gajeel (forge) and Wendy (inn and healing). Natsu and Wendy join your party for the boss.
- **Magic:** Fire Dragon Slayer, Ice-Make and Celestial Spirit to start, with Gate keys for Taurus, Aquarius and Leo (Loke). Lightning Dragon (Laxus), Solid Script and Runes (Levy, Freed) and Requip (Erza) are lacrima you buy later. Each magic has four abilities named after canon moves, such as Fire Dragon's Roar, Ice-Make: Lance, Thunder Palace and Heaven's Wheel.
- **Currency:** Jewels. Guild ranks run E › D › C › B › A › **S-Class**, and you climb them with guild points from jobs.
- **Story quests:** *Welcome to Fairy Tail!* (the tutorial), *Erza's Strawberry Cake* and *The Lullaby Incident*.
- **13 request-board jobs:** kill, gather, deliver, escort (walk Plue to the cathedral) and the S-Class boss job.

## Features
- Character creation: name, hair, skin, outfit, the **guild mark's placement and colour**, and your starting magic. The mark shows on your character.
- Title screen, plus a Mirajane-led tutorial that leads into your first job.
- Real-time combat with targeting, projectiles, beams, area attacks, dashes, buffs, summoned spirits and rune traps, plus burn, slow and stun.
- A boss with four telegraphed attacks and a two-member guild party.
- Gathering (mining, woodcutting, foraging), refining and crafting at the forge and workbench, a bank, a shop and a market board.
- Stats, skills up to 99, class ranks, guild ranks, a quest log and a job tracker.
- Saves automatically and with Save now, and you can export or import your save.
- **iPhone ready:** touch joystick, ability buttons, an interact button, portrait and landscape layouts, safe areas and a home-screen web app. **Graphics default to Low.** High adds outlines, soft shadows and antialiasing, and you can switch it in Settings or with `?q=high`.

## Controls
| | Desktop | Touch |
|---|---|---|
| Move | WASD or arrow keys, or click the ground | Left joystick |
| Camera | Drag; Q / R rotate; scroll to zoom | Drag the screen |
| Abilities | 1–8 | Ability buttons |
| Talk, gather, use | E / F or click | Interact button or tap |
| Target | Tab or click a monster | Tap a monster |
| Panels | I bag, G gear, C stats, K skills, J quests, Esc close | Menu buttons |

## Roadmap
1. **Art pass with the rights holders:** swap the stand-ins for licensed character models, the guild mark, music and VO.
2. **More story arcs:** Phantom Lord (guild war), Tower of Heaven, the S-Class trial on Tenrou Island.
3. **Full skill trees** for each magic, Unison Raids between two players, Dragon Force and Requip armour sets.
4. **Multiplayer:** shared Magnolia hub, party jobs, guild-vs-guild events and a player market. Paused in this prototype.
5. **Platforms:** mobile app stores and consoles. The renderer scales from Low (phones) to High.

## Development
```
npm install
npm run dev       # local dev server
npm run build     # production build to dist/
```
Built with Vite and Three.js. GitHub Pages deploys from `.github/workflows` on every push to `main`.
