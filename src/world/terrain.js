import * as THREE from 'three';
import { toon, GFX } from './toon.js';
import { biomeAt, forestAt, WATER_Y, ROADS_W, RAILS_W } from './fiore.js';

// Streamed terrain: 64 m chunks around the player, two LODs, skirts hide LOD cracks.
// Near chunks also get instanced trees, rocks and (High) grass; far chunks are bare and fogged.
export const CH = 64;
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function hash(i, j, s = 0) { let h = (i * 374761393 + j * 668265263 + s * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function segsNear(lines, minX, maxX, minZ, maxZ, pad) {
  const out = [];
  for (const l of lines) for (let i = 0; i < l.length - 1; i++) {
    const [x0, z0] = l[i], [x1, z1] = l[i + 1];
    if (Math.max(x0, x1) < minX - pad || Math.min(x0, x1) > maxX + pad || Math.max(z0, z1) < minZ - pad || Math.min(z0, z1) > maxZ + pad) continue;
    out.push([x0, z0, x1, z1]);
  }
  return out;
}
function segDist(segs, x, z) {
  let best = 1e9;
  for (const [x0, z0, x1, z1] of segs) { const vx = x1 - x0, vz = z1 - z0; const t = Math.max(0, Math.min(1, ((x - x0) * vx + (z - z0) * vz) / (vx * vx + vz * vz))); const d = Math.hypot(x - x0 - t * vx, z - z0 - t * vz); if (d < best) best = d; }
  return best;
}

const COL = {
  grassA: new THREE.Color('#7cc25a'), grassB: new THREE.Color('#5aa648'), forest: new THREE.Color('#3f7a34'), dirt: new THREE.Color('#d2b276'),
  rock: new THREE.Color('#8a8078'), rockD: new THREE.Color('#6a625c'), snow: new THREE.Color('#f4f8ff'), sand: new THREE.Color('#e8d49a'),
  seabed: new THREE.Color('#5a8a8a'), foreign: new THREE.Color('#7a7068'), stone: new THREE.Color('#b8b0a4'), gravel: new THREE.Color('#9a9088'),
};

export class Terrain {
  /** opts: height(x,z), keepOut(x,z,pad) -> true where props must not spawn, paint(x,z,c) optional colour override */
  constructor(scene, opts) {
    this.scene = scene; this.o = opts; this.chunks = new Map(); this.queue = [];
    this.radius = GFX.high ? 5 : 3; this.nearR = 1; this.propR = GFX.high ? 2 : 1;
    this.mat = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: toon('#fff').gradientMap });
    // shared prop geometry
    const trunk = new THREE.CylinderGeometry(0.22, 0.38, 2.6, 6); trunk.translate(0, 1.3, 0);
    const crown = new THREE.IcosahedronGeometry(1.6, 1); crown.translate(0, 3.5, 0);
    const pine = new THREE.ConeGeometry(1.5, 4.2, 7); pine.translate(0, 3.6, 0);
    const rock = new THREE.DodecahedronGeometry(0.9, 0); rock.translate(0, 0.35, 0);
    const grass = new THREE.ConeGeometry(0.07, 0.6, 3); grass.translate(0, 0.3, 0);
    const flower = new THREE.IcosahedronGeometry(0.12, 0); flower.translate(0, 0.16, 0);
    this.geo = { trunk, crown, pine, rock, grass, flower };
    this.mats = { trunk: toon('#6a4a2a'), leaf: toon('#ffffff'), rock: toon('#ffffff'), grass: toon('#ffffff') };
    this.cx = null; this.cz = null;
  }
  key(i, j) { return i + ',' + j; }
  /** Ground meshes of the near (full-detail) chunks, for click-to-move raycasts. */
  groundMeshes() { const out = []; for (const c of this.chunks.values()) if (c.lod === 0) out.push(c.ground); return out; }
  /** Called every frame. Builds at most `budget` chunks per call. */
  update(px, pz, budget = 2) {
    const ci = Math.floor(px / CH), cj = Math.floor(pz / CH);
    if (ci !== this.cx || cj !== this.cz) {
      this.cx = ci; this.cz = cj;
      const want = new Map();
      for (let j = cj - this.radius; j <= cj + this.radius; j++) for (let i = ci - this.radius; i <= ci + this.radius; i++) {
        const ring = Math.max(Math.abs(i - ci), Math.abs(j - cj)); if (Math.hypot(i - ci, j - cj) > this.radius + 0.5) continue;
        want.set(this.key(i, j), { i, j, lod: ring <= this.nearR ? 0 : 1, props: ring <= this.propR, ring });
      }
      for (const [k, c] of this.chunks) { const w = want.get(k); if (!w) { this.dispose(c); this.chunks.delete(k); } }
      this.queue = [...want.values()].filter((w) => { const c = this.chunks.get(this.key(w.i, w.j)); return !c || c.lod !== w.lod || c.hasProps !== w.props; }).sort((a, b) => a.ring - b.ring);
    }
    let n = 0;
    while (this.queue.length && n < budget) { const w = this.queue.shift(); this.build(w); n++; }
  }
  /** Synchronously build everything in range (initial load / after teleports). */
  flush(px, pz) { this.cx = null; this.update(px, pz, 0); this.update(px, pz, 999); }
  dispose(c) { for (const m of c.objs) { this.scene.remove(m); if (m.geometry && m.userData.own) m.geometry.dispose(); if (m.isInstancedMesh) m.dispose(); } }
  build({ i, j, lod, props }) {
    const k = this.key(i, j); const old = this.chunks.get(k);
    const c = { lod, hasProps: props, objs: [] };
    if (old && old.lod === lod && old.ground) { c.ground = old.ground; c.objs.push(old.ground); for (const m of old.objs) if (m !== old.ground) { this.scene.remove(m); if (m.isInstancedMesh) m.dispose(); } }
    else { if (old) this.dispose(old); c.ground = this.ground(i, j, lod); c.objs.push(c.ground); this.scene.add(c.ground); }
    if (props) for (const m of this.props(i, j)) { c.objs.push(m); this.scene.add(m); }
    this.chunks.set(k, c);
  }
  ground(i, j, lod) {
    const H = this.o.height; const n = lod === 0 ? (GFX.high ? 40 : 28) : (GFX.high ? 12 : 8); const st = CH / n;
    const x0 = i * CH, z0 = j * CH; const N = n + 1;
    const vcount = N * N + 4 * N; const pos = new Float32Array(vcount * 3), col = new Float32Array(vcount * 3);
    const roads = segsNear(ROADS_W, x0, x0 + CH, z0, z0 + CH, 6), rails = segsNear(RAILS_W, x0, x0 + CH, z0, z0 + CH, 6);
    const c = new THREE.Color();
    for (let b = 0; b < N; b++) for (let a = 0; a < N; a++) {
      const x = x0 + a * st, z = z0 + b * st, y = H(x, z); const v = b * N + a;
      pos.set([x, y, z], v * 3); this.color(x, z, y, roads, rails, c); col.set([c.r, c.g, c.b], v * 3);
    }
    // skirts
    let v = N * N; const edges = [];
    for (let a = 0; a < N; a++) edges.push(a, (N - 1) * N + a); for (let b = 1; b < N - 1; b++) edges.push(b * N, b * N + N - 1);
    const skirtOf = new Map();
    for (const e of [...new Set(edges)]) { pos.set([pos[e * 3], pos[e * 3 + 1] - 4, pos[e * 3 + 2]], v * 3); col.set([col[e * 3], col[e * 3 + 1], col[e * 3 + 2]], v * 3); skirtOf.set(e, v); v++; }
    const idx = [];
    for (let b = 0; b < n; b++) for (let a = 0; a < n; a++) { const p = b * N + a; idx.push(p, p + N, p + 1, p + 1, p + N, p + N + 1); }
    const strip = (list) => { for (let q = 0; q < list.length - 1; q++) { const e0 = list[q], e1 = list[q + 1], s0 = skirtOf.get(e0), s1 = skirtOf.get(e1); idx.push(e0, s0, e1, e1, s0, s1, e0, e1, s0, e1, s1, s0); } };
    const top = [], bot = [], lef = [], rig = []; for (let a = 0; a < N; a++) { top.push(a); bot.push((N - 1) * N + a); } for (let b = 0; b < N; b++) { lef.push(b * N); rig.push(b * N + N - 1); }
    strip(top); strip(bot); strip(lef); strip(rig);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos.subarray(0, v * 3), 3)); g.setAttribute('color', new THREE.BufferAttribute(col.subarray(0, v * 3), 3)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, this.mat); m.receiveShadow = GFX.shadows; m.userData.ground = true; m.userData.own = true; m.matrixAutoUpdate = false; m.updateMatrix();
    return m;
  }
  color(x, z, y, roads, rails, c) {
    const b = biomeAt(x, z); const n = (Math.sin(x * 0.4) * Math.cos(z * 0.37) + Math.sin(x * 0.11 + z * 0.17)) * 0.25 + 0.5;
    c.copy(COL.grassA).lerp(COL.grassB, n);
    const f = forestAt(x, z); if (f > 0.05) c.lerp(COL.forest, Math.min(1, f) * 0.7);
    const mt = smooth(9, 22, y); if (mt > 0) c.lerp(n > 0.5 ? COL.rock : COL.rockD, mt);
    if (b === 4 || y > 30) c.lerp(COL.snow, b === 4 ? smooth(14, 22, y) * 0.6 + 0.4 : smooth(30, 38, y));
    if (b === 7) c.lerp(COL.foreign, 0.6);
    if (y < WATER_Y + 0.9) c.lerp(COL.sand, smooth(WATER_Y + 0.9, WATER_Y + 0.2, y));
    if (y < WATER_Y - 0.4) c.copy(COL.seabed);
    if (roads.length) { const d = segDist(roads, x, z); if (d < 3.2) c.lerp(COL.dirt, smooth(3.2, 1.6, d)); }
    if (rails.length) { const d = segDist(rails, x, z); if (d < 2.6) c.lerp(COL.gravel, smooth(2.6, 1.4, d)); }
    if (this.o.paint) this.o.paint(x, z, c, n);
  }
  props(i, j) {
    const H = this.o.height; const x0 = i * CH, z0 = j * CH; const out = [];
    const roads = segsNear(ROADS_W, x0, x0 + CH, z0, z0 + CH, 6), rails = segsNear(RAILS_W, x0, x0 + CH, z0, z0 + CH, 6);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), col = new THREE.Color(), up = new THREE.Vector3(0, 1, 0);
    const trees = [], pines = [], rocks = [];
    const step = 5.2;
    for (let b = 0; b < CH / step; b++) for (let a = 0; a < CH / step; a++) {
      const r0 = hash(i * 64 + a, j * 64 + b, 1), r1 = hash(i * 64 + a, j * 64 + b, 2), r2 = hash(i * 64 + a, j * 64 + b, 3);
      const x = x0 + (a + r0) * step, z = z0 + (b + r1) * step; const y = H(x, z);
      if (y < WATER_Y + 0.6) continue;
      const bio = biomeAt(x, z); if (bio === 7) continue;
      if (this.o.keepOut(x, z, 3)) continue;
      if ((roads.length && segDist(roads, x, z) < 4) || (rails.length && segDist(rails, x, z) < 4)) continue;
      const f = forestAt(x, z) + (this.o.forestBoost ? this.o.forestBoost(x, z) : 0);
      const pTree = y > 30 ? 0 : y > 12 ? 0.18 : 0.06 + f * 0.85;
      if (r2 < pTree) (y > 9 || this.o.pineAt?.(x, z) ? pines : trees).push([x, y, z, r0, r1]);
      else if (r2 > 0.965 || (y > 10 && r2 > 0.85)) rocks.push([x, y, z, r0, r1]);
    }
    const inst = (geo, mat, list, fn) => { if (!list.length) return null; const im = new THREE.InstancedMesh(geo, mat, list.length); list.forEach((t, k) => { fn(t, k, im); }); im.castShadow = GFX.shadows; im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; im.computeBoundingSphere(); out.push(im); return im; };
    const place = (t, sc, sy) => { p.set(t[0], t[1] - 0.15, t[2]); q.setFromAxisAngle(up, t[3] * 6.28); s.set(sc, sc * sy, sc); m.compose(p, q, s); };
    inst(this.geo.trunk, this.mats.trunk, [...trees, ...pines], (t, k, im) => { place(t, 0.8 + t[4] * 0.7, 1); im.setMatrixAt(k, m); });
    inst(this.geo.crown, this.mats.leaf, trees, (t, k, im) => { place(t, 0.8 + t[4] * 0.7, 1); im.setMatrixAt(k, m); im.setColorAt(k, col.setHSL(0.25 + t[3] * 0.08, 0.5, 0.3 + t[4] * 0.12)); });
    inst(this.geo.pine, this.mats.leaf, pines, (t, k, im) => { place(t, 0.8 + t[4] * 0.7, 1.1); im.setMatrixAt(k, m); const snowy = t[1] > 16; im.setColorAt(k, snowy ? col.set('#dfe8e4') : col.setHSL(0.36 + t[3] * 0.05, 0.42, 0.24 + t[4] * 0.08)); });
    inst(this.geo.rock, this.mats.rock, rocks, (t, k, im) => { place(t, 0.6 + t[4] * 1.4, 0.7); im.setMatrixAt(k, m); im.setColorAt(k, col.setHSL(0.08, 0.06, 0.45 + t[3] * 0.15)); });
    // ground cover (flowers always; grass on High)
    const nf = GFX.high ? 260 : 70; const fl = []; const fc = ['#ff7ab0', '#ffe060', '#ffffff', '#8ab0ff', '#ff8a5a'];
    for (let k = 0; k < nf; k++) { const x = x0 + hash(i, j, 100 + k) * CH, z = z0 + hash(j, i, 200 + k) * CH; const y = H(x, z); if (y < WATER_Y + 0.5 || y > 14 || this.o.keepOut(x, z, 0.6)) continue; if (roads.length && segDist(roads, x, z) < 2.5) continue; fl.push([x, y, z, hash(i, j, 300 + k), k]); }
    inst(this.geo.flower, this.mats.grass, fl, (t, k, im) => { p.set(t[0], t[1], t[2]); q.identity(); s.setScalar(0.6 + t[3]); m.compose(p, q, s); im.setMatrixAt(k, m); im.setColorAt(k, col.set(fc[t[4] % 5])); });
    if (GFX.high) {
      const gl = [];
      for (let k = 0; k < 1400; k++) { const x = x0 + hash(i, j, 1000 + k) * CH, z = z0 + hash(j, i, 3000 + k) * CH; const y = H(x, z); if (y < WATER_Y + 0.5 || y > 16 || this.o.keepOut(x, z, 0.3)) continue; if (roads.length && segDist(roads, x, z) < 2) continue; gl.push([x, y, z, hash(i, j, 5000 + k), hash(j, i, 7000 + k)]); }
      inst(this.geo.grass, this.mats.grass, gl, (t, k, im) => { p.set(t[0], t[1], t[2]); q.setFromEuler(new THREE.Euler((t[3] - 0.5) * 0.4, t[4] * 6, 0)); s.set(1, 0.6 + t[3] * 0.9, 1); m.compose(p, q, s); im.setMatrixAt(k, m); im.setColorAt(k, col.setHSL(0.27 + t[4] * 0.06, 0.55, 0.3 + t[3] * 0.15)); });
    }
    for (const o of out) { o.matrixAutoUpdate = false; o.updateMatrix(); }
    return out;
  }
}
