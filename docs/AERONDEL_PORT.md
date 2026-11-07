# Aerondel Lite → Fairy Tail RPG graphics port (Realistic tier only)

Low and High are unaffected; tests assert this. Applies to PRs #1, #3 and #4, stacked in that order.

| Aerondel feature | Fairy Tail status |
|---|---|
| Triplanar micro-normals (characters, world) | Ported (`systems/microdetail.js`) |
| Per-surface physical materials (sheen, clearcoat) | Ported (`toPhysical`). Each shared material is converted once, and its shader hooks are kept |
| Crease-aware smooth normals | Ported. Crease angle is set per surface; stone, metal, horn and wood keep their facets (golem rock, Lullaby's carved wood) |
| Vertex-painted fur/hide/scale/stone patterns | Ported as object-space albedo mottling (`MOTTLE`). No geometry changes |
| Kenney CC0 nature models | Ported: 360 bounded wilderness placements. Autumn trees appear in autumn. Palms, cactus, dead trees and props are kept but unused (see `public/models/CREDITS.md`) |
| Seasons (grass detail, tint, snow, leaf tint) | Ported (`world/seasons.js`). Look only, nothing saved |
| Photo terrain detail and cobble | Already in Fairy Tail (ambientCG Moss/Gravel/PavingStones/Rock) |
| Planar water reflection | Already in Fairy Tail (Reflector, Realistic) |
| PMREM sky lighting, AO, bloom, colour grade, fog | Already in Fairy Tail (more complete than Aerondel's) |
| Humanoid jointed anatomy (fingers, elbows, knees, faces) | Already in Fairy Tail (`detail.js`) on every tier |
| Muscle-shaped limbs | Ported for humanoids (`anatomy.js refineAnatomy`) |
| Humanoid distance LOD | Ported: past 22 m, finger hands swap to the palm sphere |
| Creature anatomy | Already sculpted in Fairy Tail's builders (vulcan pecs and shoulder mass, boar hump, golem plates, dragon wings, Lullaby's flute body); no humanoid anatomy is forced onto them |
| Creature near/far detail LOD | Ported (`refineCreatureLOD`). Beyond about 22 m × height/2, small decorative meshes are hidden. The silhouette, eyes, glows, and parts the animators show or hide stay visible |
| Keyframed full-body motion | Ported as an additive keyframe-track layer (attack lunge, twist, knee drive; cast crouch; gait pelvis yaw) |

## Not ported, because it doesn't apply
- **Agility-obstacle animation** (`agilityAnim.js`): Fairy Tail has no agility courses, and adding them would be new gameplay.
- **Rigged GLB humanoids and Kenney Mini Characters folk**: these would replace the Fairy Tail cast's own builders and identity. Fairy Tail's cast and NPCs keep their procedural builds.
- **Per-spawn size and tint variety for creatures**: in Fairy Tail, mob size drives gameplay radius and hitboxes, so changing it isn't purely visual.
