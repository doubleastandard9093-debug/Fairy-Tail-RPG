// Moving magic trains and ferries. Ambient trains shuttle every rail line; boarding a train or ferry
// now rides the real route (Dijkstra over the traced railway graph) instead of a fade-teleport.
import * as THREE from 'three';
import { RAILS_W, WATER_Y } from '../world/fiore.js';
import { addWake } from '../world/water.js';

// ---- rail graph: vertices of every polyline, merged where lines meet ----
const V = []; const E = [];
const vid = (x, z) => { for (let i = 0; i < V.length; i++) if (Math.hypot(V[i][0] - x, V[i][1] - z) < 4) return i; V.push([x, z]); E.push([]); return V.length - 1; };
for (const l of RAILS_W) for (let i = 0; i < l.length - 1; i++) { const a = vid(...l[i]), b = vid(...l[i + 1]); const d = Math.hypot(V[a][0] - V[b][0], V[a][1] - V[b][1]); E[a].push([b, d]); E[b].push([a, d]); }
const nearestV = (x, z) => { let bi = 0, bd = 1e9; V.forEach((v, i) => { const d = Math.hypot(v[0] - x, v[1] - z); if (d < bd) { bd = d; bi = i; } }); return bi; };
export function railPath(from, to) {
  const s = nearestV(...from), t = nearestV(...to); const dist = V.map(() => 1e9), prev = V.map(() => -1), done = new Set(); dist[s] = 0;
  while (done.size < V.length) { let u = -1; for (let i = 0; i < V.length; i++) if (!done.has(i) && (u < 0 || dist[i] < dist[u])) u = i; if (u < 0 || dist[u] >= 1e9) break; done.add(u); if (u === t) break; for (const [v, w] of E[u]) if (dist[u] + w < dist[v]) { dist[v] = dist[u] + w; prev[v] = u; } }
  const out = []; for (let u = t; u >= 0; u = prev[u]) out.unshift(V[u].slice()); return out.length > 1 ? out : [V[s].slice(), V[t].slice()];
}
/** Polyline helper: arc-length table + sample(s) -> {x,z,dir}. */
export function track(pts) {
  const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const len = L[L.length - 1];
  return { len, at(s) { s = Math.max(0, Math.min(len, s)); let i = 1; while (i < L.length - 1 && L[i] < s) i++; const k = (s - L[i - 1]) / Math.max(1e-6, L[i] - L[i - 1]); const a = pts[i - 1], b = pts[i]; return { x: a[0] + (b[0] - a[0]) * k, z: a[1] + (b[1] - a[1]) * k, dir: Math.atan2(b[0] - a[0], b[1] - a[1]) }; } };
}
/** Sea route between two docks: A* over a 4-unit water grid that keeps 5 units off the coast, then string-pulled
 *  (line-of-sight smoothing) and lightly rounded so ferries follow believable lanes instead of a bent straight line. */
export function seaPath(a, b, isLand) {
  const C = 4, pad = 120; const x0 = Math.min(a[0], b[0]) - pad, z0 = Math.min(a[1], b[1]) - pad; const nx = Math.ceil((Math.max(a[0], b[0]) + pad - x0) / C), nz = Math.ceil((Math.max(a[1], b[1]) + pad - z0) / C);
  const wet = new Uint8Array(nx * nz); for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const x = x0 + i * C, z = z0 + j * C; wet[j * nx + i] = isLand(x, z) ? 0 : 1; }
  // coastal clearance: cells within ~5 units of land cost more (and are never preferred)
  const cost = new Float32Array(nx * nz); for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { if (!wet[j * nx + i]) continue; let near = 0; for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const ii = i + di, jj = j + dj; if (ii >= 0 && jj >= 0 && ii < nx && jj < nz && !wet[jj * nx + ii]) near = 1; } cost[j * nx + i] = near ? 6 : 1; }
  const cellOf = (p) => [Math.max(0, Math.min(nx - 1, Math.round((p[0] - x0) / C))), Math.max(0, Math.min(nz - 1, Math.round((p[1] - z0) / C)))];
  const nearestWet = (c) => { for (let r = 0; r < 12; r++) for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) { const i = c[0] + di, j = c[1] + dj; if (i >= 0 && j >= 0 && i < nx && j < nz && wet[j * nx + i]) return [i, j]; } return c; };
  const S = nearestWet(cellOf(a)), T = nearestWet(cellOf(b)); const si = S[1] * nx + S[0], ti = T[1] * nx + T[0];
  const g = new Float32Array(nx * nz).fill(1e9), prev = new Int32Array(nx * nz).fill(-1), closed = new Uint8Array(nx * nz); g[si] = 0;
  const open = [[Math.hypot(S[0] - T[0], S[1] - T[1]), si]]; const push = (f, k) => { open.push([f, k]); let c = open.length - 1; while (c > 0) { const p = (c - 1) >> 1; if (open[p][0] <= open[c][0]) break; [open[p], open[c]] = [open[c], open[p]]; c = p; } };
  const pop = () => { const top = open[0], last = open.pop(); if (open.length) { open[0] = last; let c = 0; for (;;) { const l = 2 * c + 1, r = l + 1; let m = c; if (l < open.length && open[l][0] < open[m][0]) m = l; if (r < open.length && open[r][0] < open[m][0]) m = r; if (m === c) break; [open[m], open[c]] = [open[c], open[m]]; c = m; } } return top; };
  let found = false;
  while (open.length) { const [, k] = pop(); if (closed[k]) continue; closed[k] = 1; if (k === ti) { found = true; break; } const i = k % nx, j = (k / nx) | 0;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { if (!di && !dj) continue; const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= nx || jj >= nz) continue; const kk = jj * nx + ii; if (!wet[kk] || closed[kk]) continue;
      const ng = g[k] + Math.hypot(di, dj) * cost[kk]; if (ng < g[kk]) { g[kk] = ng; prev[kk] = k; push(ng + Math.hypot(ii - T[0], jj - T[1]), kk); } } }
  if (!found) return [a, b];
  const cells = []; for (let k = ti; k >= 0; k = prev[k]) cells.unshift([x0 + (k % nx) * C, z0 + ((k / nx) | 0) * C]);
  const clear = (p, q) => { const n = Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1]) / 2); for (let s = 0; s <= n; s++) { const t = s / n; const x = p[0] + (q[0] - p[0]) * t, z = p[1] + (q[1] - p[1]) * t; if (isLand(x, z) || isLand(x + 4, z) || isLand(x - 4, z) || isLand(x, z + 4) || isLand(x, z - 4)) return false; } return true; };
  const pts = [a]; let cur = a, idx = 0;
  while (idx < cells.length - 1) { let best = idx + 1; for (let k = cells.length - 1; k > idx + 1; k--) if (clear(cur, cells[k])) { best = k; break; } cur = cells[best]; pts.push(cur); idx = best; }
  pts.push(b);
  // round the corners (Chaikin, 2 passes) for a sailing curve
  let out = pts; for (let it = 0; it < 2; it++) { const n = [out[0]]; for (let k = 0; k < out.length - 1; k++) { const p = out[k], q = out[k + 1]; n.push([p[0] * 0.75 + q[0] * 0.25, p[1] * 0.75 + q[1] * 0.25], [p[0] * 0.25 + q[0] * 0.75, p[1] * 0.25 + q[1] * 0.75]); } n.push(out[out.length - 1]); out = n; }
  return out;
}

export class Transit {
  constructor(game) {
    this.g = game; const W = game.world; this.trains = []; this.boats = [];
    // one ambient train per line, ping-ponging; plus ferries looping Hargeon <-> islands
    RAILS_W.forEach((l, i) => { const tr = track(l); const obj = W.makeTrain(game.scene, 0, 0, 0, 2 + (i % 2)); obj.userData.dyn = true; this.trains.push({ tr, obj, s: (i * 0.37 % 1) * tr.len, v: 13 + i * 1.5, dirn: 1, wait: 0 }); });
    const land = (x, z) => W.yAt(x, z) > WATER_Y - 0.4;
    for (const [a, b, sail] of [['hargeon', 'galuna', '#f4ecd8'], ['hargeon', 'tenrou', '#e86a4a'], ['galuna', 'tenrou', '#4a7ad0']]) {
      const A = W.docks[a], B = W.docks[b]; if (!A || !B) continue;
      const pts = seaPath(A.boat.slice(0, 2), B.boat.slice(0, 2), land); const tr = track(pts);
      const obj = W.makeBoat(game.scene, A.boat[0], A.boat[1], 0, 1.3, sail); addWake(obj, W, 1.3); this.boats.push({ tr, obj, s: Math.random() * tr.len, v: 9, dirn: 1, wait: 0 });
    }
    this.ride = null;
  }
  place(o, p, y, flip) { o.position.set(p.x, y, p.z); o.rotation.y = p.dir + (flip ? Math.PI : 0); }
  update(dt) {
    const W = this.g.world;
    for (const t of [...this.trains, ...this.boats]) {
      if (t.obj.userData.wake) { const u = t.obj.userData.wake.uK; u.value += ((t.wait > 0 ? 0 : 1) - u.value) * Math.min(1, dt * 0.8); }
      if (t.wait > 0) { t.wait -= dt; continue; }
      t.s += t.v * t.dirn * dt; if (t.s > t.tr.len || t.s < 0) { t.dirn *= -1; t.s = Math.max(0, Math.min(t.tr.len, t.s)); t.wait = 4; }
      const p = t.tr.at(t.s); const boat = this.boats.includes(t);
      this.place(t.obj, p, boat ? WATER_Y - 0.1 + Math.sin(this.g.t * 1.3) * 0.08 : W.yAt(p.x, p.z) + 0.2, t.dirn < 0);
    }
    const r = this.ride; if (!r) return;
    r.s += r.v * dt * Math.min(1, 0.25 + r.s / 25) ; // ease in
    if (r.obj.userData.wake) r.obj.userData.wake.uK.value = Math.min(1, r.s / 20);
    const p = r.tr.at(r.s); const yb = r.kind === 'boat' ? WATER_Y - 0.1 : W.yAt(p.x, p.z) + 0.2;
    this.place(r.obj, p, yb, false);
    const pl = this.g.player; const off = r.kind === 'boat' ? [0, 1.05, -1.5] : [0, 3.95, -9.6]; // deck / roof of the first carriage
    pl.pos.set(p.x + Math.sin(p.dir) * off[2], yb + off[1], p.z + Math.cos(p.dir) * off[2]); pl.rot = p.dir; pl.moving = 0;
    if (r.s >= r.tr.len) this.end();
  }
  start(kind, path, dest, onEnd) {
    const W = this.g.world; const tr = track(path);
    const obj = kind === 'boat' ? W.makeBoat(this.g.scene, path[0][0], path[0][1], 0, 1.4, '#f4f0e0', '#5a3a22') : W.makeTrain(this.g.scene, path[0][0], path[0][1], 0, 2);
    obj.userData.riding = true; if (kind === 'boat') addWake(obj, W, 1.4);
    // the moored ferries at both piers step aside while you sail, so the ride boat never overlaps them
    const hidden = kind === 'boat' ? W.interactables.filter((i) => i.kind === 'ferry' && i.obj && (Math.hypot(i.x - path[0][0], i.z - path[0][1]) < 30 || Math.hypot(i.x - path[path.length - 1][0], i.z - path[path.length - 1][1]) < 30)) : [];
    for (const i of hidden) i.obj.visible = false;
    this.ride = { kind, tr, obj, s: 0, v: kind === 'boat' ? 16 : 30, dest, onEnd, hidden };
    this.g.ui.rideBar?.(kind, dest);
  }
  skip() { if (this.ride) this.ride.s = this.ride.tr.len; }
  end() { const r = this.ride; this.ride = null; this.g.scene.remove(r.obj); for (const i of r.hidden || []) i.obj.visible = true; this.g.ui.rideBar?.(null); r.onEnd && r.onEnd(); }
}
