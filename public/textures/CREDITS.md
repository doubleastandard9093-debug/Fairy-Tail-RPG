# Texture credits

All photo textures here are CC0 1.0 (public domain) from ambientCG (https://ambientcg.com). No attribution required; credited anyway.

| File | Channel | Source set |
|---|---|---|
| detail_ground.webp | R | [Moss002](https://ambientcg.com/view?id=Moss002) (grass) |
| detail_ground.webp | G | [Gravel022](https://ambientcg.com/view?id=Gravel022) (dirt/paths) |
| detail_ground.webp | B | [PavingStones070](https://ambientcg.com/view?id=PavingStones070) (cobbles) |
| detail_ground.webp | A | [Rock035](https://ambientcg.com/view?id=Rock035) (rock, triplanar) |

Colour maps reduced to zero-mean luminance at 1024x1024; the palette colour comes from the shader. Realistic graphics only.

`detail_ground_n0/n1.webp` hold the NormalGL maps of the same four sets (RG per set: n0 = grass, gravel; n1 = cobbles, rock).
`detail_ground_r.webp` holds their Roughness maps, mean-normalised (128 = the shader's roughness), one set per channel.

## Seasonal grass detail (from Aerondel Lite, Realistic only)

`season_spring.webp`, `season_autumn.webp` and `season_winter.webp` are copied from Aerondel Lite at 512x512. Only their R (grass) channel is sampled. It replaces the Moss002 grass detail outside summer; the other channels are ignored.

| File | Channel R source (CC0, ambientCG) |
|---|---|
| season_spring.webp | [Grass004](https://ambientcg.com/view?id=Grass004) |
| season_autumn.webp | [ScatteredLeaves008](https://ambientcg.com/view?id=ScatteredLeaves008) |
| season_winter.webp | [Snow010A](https://ambientcg.com/view?id=Snow010A) |
