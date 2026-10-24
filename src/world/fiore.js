// World map data for the Kingdom of Fiore, traced from Aaron's Grok-generated Fiore map
// (public/maps/fiore_parchment.jpg, 1024x687 "map pixels"). The raster public/maps/fiore_data.png
// (512x344, one cell = 2 map px) was produced by tools/trace_fiore.py:
//   R = height:  h = R/4 - 8   (sea -6, lakes -4, lowland ~1-4, Mt. Hakobe peaks ~60)
//   G = biome:   0 sea, 1 grassland, 2 forest, 3 rock/mountain, 4 snow, 5 lake, 7 foreign (Seven/Bosco)
//   B = forest density 0-255
// Distances are compressed: 1 map px = S world units (the map's 100 miles ~ 290 m of game world),
// but every position below is read straight off the map so relative layout stays faithful.
export const S = 1.6;
export const ORIGIN = [697, 420]; // Magnolia Town (Fairy Tail guild) is the world origin
export const GW = 512, GH = 344;
export const WATER_Y = -1.2;
export const toWorld = (mx, my) => [(mx - ORIGIN[0]) * S, (my - ORIGIN[1]) * S];
export const toMap = (x, z) => [x / S + ORIGIN[0], z / S + ORIGIN[1]];
export const WORLD = { minX: (100 - ORIGIN[0]) * S, maxX: (1010 - ORIGIN[0]) * S, minZ: (12 - ORIGIN[1]) * S, maxZ: (680 - ORIGIN[1]) * S };

let H = null, B = null, F = null;
export const mapReady = () => !!H;
/** Loads the traced raster. Call (and await) once before building the world. */
export async function loadFiore(base = import.meta.env.BASE_URL) {
  if (H) return;
  const img = new Image(); img.src = base + 'maps/fiore_data.png';
  await img.decode();
  const c = document.createElement('canvas'); c.width = GW; c.height = GH; const x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(img, 0, 0); const d = x.getImageData(0, 0, GW, GH).data;
  H = new Float32Array(GW * GH); B = new Uint8Array(GW * GH); F = new Uint8Array(GW * GH);
  for (let i = 0; i < GW * GH; i++) { H[i] = d[i * 4] / 4 - 8; B[i] = d[i * 4 + 1]; F[i] = d[i * 4 + 2]; }
}
const cell = (x, z) => { const [mx, my] = toMap(x, z); return [mx / 2 - 0.5, my / 2 - 0.5]; };
const at = (arr, i, j) => arr[Math.min(GH - 1, Math.max(0, j)) * GW + Math.min(GW - 1, Math.max(0, i))];
/** Bilinear traced height (world units, before local flattening/noise). */
export function mapHeight(x, z) {
  if (!H) return 0;
  const [u, v] = cell(x, z); const i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j;
  const a = at(H, i, j), b = at(H, i + 1, j), c = at(H, i, j + 1), d = at(H, i + 1, j + 1);
  return (a * (1 - fu) + b * fu) * (1 - fv) + (c * (1 - fu) + d * fu) * fv - 1.0;
}
export function biomeAt(x, z) { if (!B) return 1; const [u, v] = cell(x, z); return at(B, Math.round(u), Math.round(v)); }
export function forestAt(x, z) {
  if (!F) return 0; const [u, v] = cell(x, z); const i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j;
  return ((at(F, i, j) * (1 - fu) + at(F, i + 1, j) * fu) * (1 - fv) + (at(F, i, j + 1) * (1 - fu) + at(F, i + 1, j + 1) * fu) * fv) / 255;
}

// ------------------------------------------------------------------ places (map px -> world)
// kind: zone (named area, arrival banner) | minor (map label + signpost only)
// station: magic-train stop (fast travel once discovered). port: boat dock.
const P = (id, name, m, r, extra = {}) => ({ id, name, m, pos: toWorld(m[0], m[1]), r, ...extra });
export const PLACES = [
  { ...P('magnolia', 'Magnolia Town', [697, 420], 62), station: { at: [-56, -9], label: 'Magnolia Station' }, banner: 'Home of the Fairy Tail Guild' },
  { ...P('kardia', 'Kardia Cathedral', [737, 411], 16), banner: 'Magnolia\'s great cathedral' },
  P('scilliora', 'Lake Scilliora', [676, 312], 70, { banner: 'Clear water north of Magnolia' }),
  P('eastforest', 'East Forest', [790, 372], 95, { banner: 'Forest Vulcan territory' }),
  { ...P('hargeon', 'Hargeon Port', [607, 503], 80), station: { off: [16, -24], label: 'Hargeon Station' }, port: true, banner: 'Fiore\'s great trading port' },
  { ...P('crocus', 'Crocus Outskirts', [538, 340], 60), station: { at: toWorld(552, 356), label: 'Crocus East Station' }, banner: 'The Flower Capital of Fiore' },
  P('domusflau', 'Domus Flau', [501, 347], 18, { banner: 'Arena of the Grand Magic Games' }),
  { ...P('hakobe', 'Mt. Hakobe', [568, 98], 120), banner: 'Eternal snow. Vulcans. Bring a coat.' },
  { ...P('hakobetrail', 'Hakobe Trailhead', [612, 165], 34), station: { off: [10, 8], label: 'Hakobe Carriage Stop' }, banner: 'The road to Mt. Hakobe' },
  { ...P('oshibana', 'Oshibana Station', [395, 252], 52), station: { off: [0, 0], label: 'Oshibana Station' }, banner: 'Junction of the western lines' },
  { ...P('clover', 'Clover Town', [440, 359], 40), station: { off: [-14, -10], label: 'Clover Station' }, banner: 'Where the guild masters meet' },
  P('canyon', 'Clover Canyon', [470, 382], 34, { banner: 'The ravine below Clover' }),
  { ...P('galuna', 'Galuna Island', [290, 480], 150), island: true, banner: 'The Cursed Island (S-Class territory)' },
  { ...P('tenrou', 'Tenrou Island', [474, 566], 110), island: true, banner: 'Holy ground of the Fairy Tail guild' },
  P('onibus', 'Onibus', [442, 215], 28, { minor: true }),
  P('shirotsume', 'Shirotsume', [422, 168], 28, { minor: true }),
  P('bluepegasus', 'Blue Pegasus (Guild)', [364, 204], 26, { minor: true }),
  P('lamiascale', 'Lamia Scale (Guild)', [322, 300], 26, { minor: true }),
];
export const PLACE = Object.fromEntries(PLACES.map((p) => [p.id, p]));
for (const p of PLACES) if (p.station) p.station.pos = p.station.at ? p.station.at : [p.pos[0] + p.station.off[0], p.pos[1] + p.station.off[1]];
export const STATIONS = PLACES.filter((p) => p.station).map((p) => p.id);

// Roads and the railway, traced from the map's dashed/double lines (map px).
export const ROADS = [
  [[697, 420], [668, 452], [632, 480], [607, 503]], // Magnolia - Hargeon
  [[697, 420], [690, 380], [680, 345], [676, 330]], // Magnolia - Lake Scilliora
  [[697, 420], [740, 412], [790, 372], [820, 340]], // Magnolia - Kardia - East Forest
  [[690, 380], [655, 300], [630, 225], [612, 165], [590, 125], [572, 100]], // Hakobe road
  [[697, 420], [640, 395], [585, 360], [538, 340]], // Magnolia - Crocus
  [[538, 340], [490, 350], [440, 359]], // Crocus - Clover
  [[440, 359], [470, 382]], // Clover - Canyon
  [[538, 340], [480, 300], [430, 270], [395, 252]], // Crocus - Oshibana
  [[395, 252], [442, 215], [422, 168]], // Oshibana - Onibus - Shirotsume
  [[395, 252], [364, 204]], [[395, 252], [345, 285], [322, 300]],
];
export const RAILS = [
  [[662, 414], [630, 396], [590, 372], [552, 356]], // Magnolia - Crocus East
  [[552, 356], [500, 312], [450, 280], [395, 252]], // Crocus - Oshibana (the Oshibana Line)
  [[552, 356], [500, 366], [431, 352]], // Crocus - Clover
  [[662, 414], [645, 450], [617, 488]], // Magnolia - Hargeon
];
// Railway in world units
export const RAILS_W = RAILS.map((l) => l.map(([a, b]) => toWorld(a, b)));
export const ROADS_W = ROADS.map((l) => l.map(([a, b]) => toWorld(a, b)));
/** Distance from (x,z) to a set of world polylines. */
export function distToLines(lines, x, z) {
  let best = 1e9;
  for (const l of lines) for (let i = 0; i < l.length - 1; i++) {
    const [x0, z0] = l[i], [x1, z1] = l[i + 1]; const vx = x1 - x0, vz = z1 - z0;
    const t = Math.max(0, Math.min(1, ((x - x0) * vx + (z - z0) * vz) / (vx * vx + vz * vz)));
    const d = Math.hypot(x - x0 - t * vx, z - z0 - t * vz); if (d < best) best = d;
  }
  return best;
}
// Boat routes from Hargeon docks (dock points are found on the shoreline at build time)
export const FERRY = { hargeon: ['galuna', 'tenrou'], galuna: ['hargeon'], tenrou: ['hargeon'] };
export const FERRY_COST = 120;
export function trainCost(a, b) { const A = PLACE[a].pos, Bp = PLACE[b].pos; return Math.max(20, Math.round(Math.hypot(A[0] - Bp[0], A[1] - Bp[1]) / 8)); }
