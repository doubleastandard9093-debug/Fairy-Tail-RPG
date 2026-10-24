// Rivers: traced at load by steepest descent over the terrain from spring points, carved into the heightmap
// (with shallow fords where roads cross), and drawn as flowing ribbons (see water.js riverMesh).
import { toWorld, WATER_Y, ROADS_W, RAILS_W, distToLines } from './fiore.js';

// springs in map pixels; w0/w1 = width at source / mouth (world units)
export const SPRINGS = [
  { id: 'hakobe', at: [600, 140], w0: 2.6, w1: 6.5 },
  { id: 'woodsea', at: [770, 238], w0: 2.4, w1: 6 },
  { id: 'oak', at: [640, 238], w0: 2.2, w1: 5.5 },
];
export const RIVERS = [];
const GC = 24; const GRID = new Map(); const key = (i, j) => i * 100003 + j;
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// Route: pick the receiving water (lake or sea) that is close and needs the least climbing to reach,
// then lay a meandering course to it. Steepest descent alone wanders in the flat basins of the map.
function trace(h, x, z) {
  const y0 = h(x, z); let best = null, bc = 1e9;
  for (let r = 40; r <= 720; r += 16) for (let k = 0; k < 48; k++) { const a = k / 48 * Math.PI * 2; const tx = x + Math.sin(a) * r, tz = z + Math.cos(a) * r;
    if (h(tx, tz) > WATER_Y - 0.8) continue; let rise = 0, lo = y0;
    for (let q = 1; q <= 24; q++) { const f = q / 24; const yy = h(x + (tx - x) * f, z + (tz - z) * f); if (yy > lo) rise += yy - lo; else lo = yy; }
    const c = r + rise * 9; if (c < bc) { bc = c; best = [tx, tz]; } }
  if (!best) return { pts: [[x, z]], reached: false };
  const [tx, tz] = best; const L = Math.hypot(tx - x, tz - z); const ux = (tx - x) / L, uz = (tz - z) / L; const amp = Math.min(22, L * 0.07);
  const ph = x * 0.013 + z * 0.007; const pts = []; const N = Math.ceil(L / 3);
  for (let k = 0; k <= N; k++) { const f = k / N; const env = Math.sin(f * Math.PI); const m = (Math.sin(f * 7.3 + ph) * 0.7 + Math.sin(f * 15.1 + ph * 2.3) * 0.3) * amp * env;
    pts.push([x + ux * L * f - uz * m, z + uz * L * f + ux * m]); }
  return { pts, reached: true };
}
function chaikin(p, n) { let o = p; for (let it = 0; it < n; it++) { const r = [o[0]]; for (let k = 0; k < o.length - 1; k++) { const a = o[k], b = o[k + 1]; r.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); } r.push(o[o.length - 1]); o = r; } return o; }

/** Plan all rivers against the un-carved height function h(x,z). */
export function planRivers(h) {
  RIVERS.length = 0; GRID.clear();
  for (const S of SPRINGS) {
    const [sx, sz] = toWorld(...S.at); const tr = trace(h, sx, sz); if (tr.pts.length < 20) continue;
    let pts = chaikin(tr.pts.filter((_, i) => i % 2 === 0 || i === tr.pts.length - 1), 2);
    // extend a little into the receiving water so the mouth blends
    if (tr.reached) { const a = pts[pts.length - 2], b = pts[pts.length - 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; for (let k = 1; k <= 4; k++) pts.push([b[0] + (b[0] - a[0]) / l * 3 * k, b[1] + (b[1] - a[1]) / l * 3 * k]); }
    // water surface: monotonic non-increasing, a bit below the banks, never below sea level
    const n = pts.length; const ys = new Array(n); let run = 1e9; let s = 0; const dist = [0];
    for (let k = 1; k < n; k++) { s += Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]); dist.push(s); }
    for (let k = 0; k < n; k++) { const g = h(pts[k][0], pts[k][1]) - 0.55; run = Math.min(run, g); ys[k] = Math.max(WATER_Y, run); }
    for (let it = 0; it < 6; it++) for (let k = 1; k < n - 1; k++) ys[k] = Math.min(ys[k - 1], (ys[k - 1] + ys[k] * 2 + ys[k + 1]) / 4);
    const L = dist[n - 1];
    const P = pts.map((p, k) => { const t = dist[k] / L; const w = S.w0 + (S.w1 - S.w0) * Math.pow(t, 0.8);
      const slope = k < n - 1 ? (ys[k] - ys[k + 1]) / Math.max(0.1, dist[k + 1] - dist[k]) : 0;
      const ford = Math.min(distToLines(ROADS_W, p[0], p[1]), distToLines(RAILS_W, p[0], p[1])) < w + 4;
      return { x: p[0], z: p[1], y: ys[k], w, s: dist[k], slope, ford, depth: ford ? 0.3 : 0.9 + w * 0.12 }; });
    // flow speed from slope: calm reaches ~1 m/s, rapids up to ~4
    for (const p of P) p.speed = 0.9 + Math.min(3.2, p.slope * 26);
    for (let it = 0; it < 4; it++) for (let k = 1; k < n - 1; k++) P[k].speed = (P[k - 1].speed + P[k].speed * 2 + P[k + 1].speed) / 4;
    const R = { id: S.id, pts: P, len: L, reached: tr.reached, rocks: [] }; RIVERS.push(R);
    for (let k = 0; k < n - 1; k++) { const a = P[k], b = P[k + 1]; const pad = Math.max(a.w, b.w) * 2 + 4;
      const i0 = Math.floor((Math.min(a.x, b.x) - pad) / GC), i1 = Math.floor((Math.max(a.x, b.x) + pad) / GC), j0 = Math.floor((Math.min(a.z, b.z) - pad) / GC), j1 = Math.floor((Math.max(a.z, b.z) + pad) / GC);
      for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const kk = key(i, j); if (!GRID.has(kk)) GRID.set(kk, []); GRID.get(kk).push([a, b]); } }
  }
  return RIVERS;
}

/** Lower the ground into a channel: parabolic bed under the water, natural banks sloping back up. */
export function riverCarve(h, x, z) {
  const list = GRID.get(key(Math.floor(x / GC), Math.floor(z / GC))); if (!list) return h;
  for (const [a, b] of list) {
    const vx = b.x - a.x, vz = b.z - a.z; const t = Math.max(0, Math.min(1, ((x - a.x) * vx + (z - a.z) * vz) / (vx * vx + vz * vz)));
    const d = Math.hypot(x - a.x - t * vx, z - a.z - t * vz); const w = a.w + (b.w - a.w) * t; if (d > w * 2 + 4) continue;
    const ys = a.y + (b.y - a.y) * t, dep = a.depth + (b.depth - a.depth) * t;
    const tgt = d < w ? ys - dep * (1 - (d / w) * (d / w)) + 0.05 : ys + 0.05 + (d - w) * 0.55;
    if (tgt < h) { const k = smooth(w * 2 + 4, w * 1.2, d); h = tgt * k + h * (1 - k); }
  }
  return h;
}
/** Distance to the nearest river centreline (for wet ground, grass exclusion, props). Returns [d, w] or null. */
export function riverNear(x, z) {
  const list = GRID.get(key(Math.floor(x / GC), Math.floor(z / GC))); if (!list) return null; let best = null;
  for (const [a, b] of list) { const vx = b.x - a.x, vz = b.z - a.z; const t = Math.max(0, Math.min(1, ((x - a.x) * vx + (z - a.z) * vz) / (vx * vx + vz * vz)));
    const d = Math.hypot(x - a.x - t * vx, z - a.z - t * vz); const w = a.w + (b.w - a.w) * t; if (!best || d - w < best[0] - best[1]) best = [d, w, a.y + (b.y - a.y) * t]; }
  return best;
}
