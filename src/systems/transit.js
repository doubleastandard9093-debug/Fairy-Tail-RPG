// Moving magic trains and ferries. Ambient trains shuttle every rail line; boarding a train or ferry
// now rides the real route (Dijkstra over the traced railway graph) instead of a fade-teleport.
import * as THREE from 'three';
import { RAILS_W, WATER_Y } from '../world/fiore.js';

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
/** Sea route between two docks: straight line bent out to sea through waypoints that stay off land. */
export function seaPath(a, b, isLand) {
  const pts = [a]; const n = 24; let last = a;
  for (let i = 1; i < n; i++) { const k = i / n; let x = a[0] + (b[0] - a[0]) * k, z = a[1] + (b[1] - a[1]) * k;
    if (isLand(x, z)) { const nx = -(b[1] - a[1]), nz = b[0] - a[0], l = Math.hypot(nx, nz); for (let o = 6; o < 160; o += 6) { let hit = false; for (const sg of [1, -1]) { const qx = x + nx / l * o * sg, qz = z + nz / l * o * sg; if (!isLand(qx, qz)) { x = qx; z = qz; hit = true; break; } } if (hit) break; } }
    if (Math.hypot(x - last[0], z - last[1]) > 3) { pts.push([x, z]); last = [x, z]; } }
  pts.push(b); return pts;
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
      const obj = W.makeBoat(game.scene, A.boat[0], A.boat[1], 0, 1.3, sail); this.boats.push({ tr, obj, s: Math.random() * tr.len, v: 9, dirn: 1, wait: 0 });
    }
    this.ride = null;
  }
  place(o, p, y, flip) { o.position.set(p.x, y, p.z); o.rotation.y = p.dir + (flip ? Math.PI : 0); }
  update(dt) {
    const W = this.g.world;
    for (const t of [...this.trains, ...this.boats]) {
      if (t.wait > 0) { t.wait -= dt; continue; }
      t.s += t.v * t.dirn * dt; if (t.s > t.tr.len || t.s < 0) { t.dirn *= -1; t.s = Math.max(0, Math.min(t.tr.len, t.s)); t.wait = 4; }
      const p = t.tr.at(t.s); const boat = this.boats.includes(t);
      this.place(t.obj, p, boat ? WATER_Y - 0.1 + Math.sin(this.g.t * 1.3) * 0.08 : W.yAt(p.x, p.z) + 0.2, t.dirn < 0);
    }
    const r = this.ride; if (!r) return;
    r.s += r.v * dt * Math.min(1, 0.25 + r.s / 25) ; // ease in
    const p = r.tr.at(r.s); const yb = r.kind === 'boat' ? WATER_Y - 0.1 : W.yAt(p.x, p.z) + 0.2;
    this.place(r.obj, p, yb, false);
    const pl = this.g.player; const off = r.kind === 'boat' ? [0, 1.05, -1.5] : [0, 3.95, -9.6]; // deck / roof of the first carriage
    pl.pos.set(p.x + Math.sin(p.dir) * off[2], yb + off[1], p.z + Math.cos(p.dir) * off[2]); pl.rot = p.dir; pl.moving = 0;
    if (r.s >= r.tr.len) this.end();
  }
  start(kind, path, dest, onEnd) {
    const W = this.g.world; const tr = track(path);
    const obj = kind === 'boat' ? W.makeBoat(this.g.scene, path[0][0], path[0][1], 0, 1.4, '#f4f0e0', '#5a3a22') : W.makeTrain(this.g.scene, path[0][0], path[0][1], 0, 2);
    this.ride = { kind, tr, obj, s: 0, v: kind === 'boat' ? 16 : 30, dest, onEnd };
    this.g.ui.rideBar?.(kind, dest);
  }
  skip() { if (this.ride) this.ride.s = this.ride.tr.len; }
  end() { const r = this.ride; this.ride = null; this.g.scene.remove(r.obj); this.g.ui.rideBar?.(null); r.onEnd && r.onEnd(); }
}
