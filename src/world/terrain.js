import * as THREE from 'three';
import { toon, GFX, addWind } from './toon.js';
import { groundMaterial } from './ground.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
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
  seabed: new THREE.Color('#5a8a8a'), mud: new THREE.Color('#5e4a34'), litter: new THREE.Color('#6a5a36'), moss: new THREE.Color('#4f7a2e'), wear: new THREE.Color('#a88a5a'), foreign: new THREE.Color('#7a7068'), stone: new THREE.Color('#b8b0a4'), gravel: new THREE.Color('#9a9088'),
};
// Realistic tier palette ('Magnolia, Rain-Shadow' style guide items 1 and 5); Low/High keep the stylised colours above
let realPal = false;
function applyRealPalette() {
  if (realPal || !GFX.real) return; realPal = true;
  COL.grassA.set('#7e9a4c'); COL.grassB.set('#5e7f3e'); COL.forest.set('#2f4a2c');
  COL.dirt.set('#a8865a'); COL.sand.set('#c8b88a'); COL.rock.set('#5a5650');
}

function fernGeo() {
  // a fan of 7 arching fronds, each a tapered strip with leaflet notches
  const pos = [], idx = [], col = []; const base = new THREE.Color('#2e5a22'), tip = new THREE.Color('#7aa848');
  for (let f = 0; f < 7; f++) { const a = f / 7 * Math.PI * 2 + f * 0.3; const ca = Math.cos(a), sa = Math.sin(a); const b0 = pos.length / 3; const L = 0.7 + (f % 3) * 0.12;
    for (let s = 0; s <= 5; s++) { const t = s / 5; const r = t * L; const y = Math.sin(t * Math.PI * 0.8) * 0.42 * L; const w = 0.11 * Math.sin(Math.PI * Math.min(1, t * 1.15)) + 0.01;
      for (const sd of [-1, 1]) { pos.push(ca * r - sa * w * sd, y, sa * r + ca * w * sd); const c = base.clone().lerp(tip, t); col.push(c.r, c.g, c.b); } }
    for (let s = 0; s < 5; s++) { const k = b0 + s * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
function shroomGeo() {
  const stem = new THREE.CylinderGeometry(0.035, 0.045, 0.16, 5); stem.translate(0, 0.08, 0);
  const cap = new THREE.SphereGeometry(0.09, 7, 4, 0, Math.PI * 2, 0, Math.PI / 2); cap.scale(1, 0.6, 1); cap.translate(0, 0.15, 0);
  const pos = [...stem.attributes.position.array, ...cap.attributes.position.array]; const nrm = [...stem.attributes.normal.array, ...cap.attributes.normal.array];
  const col = []; for (let k = 0; k < stem.attributes.position.count; k++) col.push(0.92, 0.88, 0.78); for (let k = 0; k < cap.attributes.position.count; k++) col.push(1, 1, 1);
  const off = stem.attributes.position.count; const idx = [...stem.index.array, ...[...cap.index.array].map((v) => v + off)];
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); return g;
}

export class Terrain {
  /** opts: height(x,z), keepOut(x,z,pad) -> true where props must not spawn, paint(x,z,c) optional colour override */
  constructor(scene, opts) {
    applyRealPalette();
    this.scene = scene; this.o = opts; this.chunks = new Map(); this.queue = [];
    this.radius = GFX.high ? 5 : 3; this.nearR = 1; this.propR = GFX.high ? 2 : 1;
    this.mat = groundMaterial();
    // shared prop geometry
    const trunk = new THREE.CylinderGeometry(0.22, 0.38, 2.6, 6); trunk.translate(0, 1.3, 0);
    const crown = new THREE.IcosahedronGeometry(1.6, 1); crown.translate(0, 3.5, 0);
    // Tier L #5: PNW conifer silhouettes. Douglas fir = 4 stacked drooping tiers; western red cedar = 5 narrower tiers with a flared, drooping skirt
    const tiers = (n, base, top, h0, h1, seg) => { const g = []; for (let i = 0; i < n; i++) { const t = i / (n - 1), r = base + (top - base) * t, h = (h1 - h0) / n * 1.9;
      const c = new THREE.ConeGeometry(r, h, seg, 1, true); const pa = c.attributes.position; for (let k = 0; k < pa.count; k++) { const y = pa.getY(k); if (y < -h * 0.45) pa.setY(k, y - r * 0.22); }   // droop the bough tips
      c.translate(0, h0 + (h1 - h0) * t + h * 0.5, 0); g.push(c.toNonIndexed()); } const m = mergeGeometries(g, false); m.computeVertexNormals(); return m; };
    const pine = tiers(4, 1.7, 0.55, 2.0, 6.2, 8);
    const cedar = tiers(5, 1.45, 0.45, 1.6, 7.0, 9);
    const rock = new THREE.DodecahedronGeometry(0.9, 0); rock.translate(0, 0.35, 0);
    const grass = new THREE.ConeGeometry(0.07, 0.6, 3); grass.translate(0, 0.3, 0);
    const flower = new THREE.IcosahedronGeometry(0.12, 0); flower.translate(0, 0.16, 0);
    const pebble = new THREE.DodecahedronGeometry(0.14, 0); pebble.translate(0, 0.05, 0);
    const twig = new THREE.CylinderGeometry(0.025, 0.04, 0.9, 4); twig.rotateZ(Math.PI / 2); twig.translate(0, 0.03, 0);
    const leaf = new THREE.CircleGeometry(0.13, 5); leaf.rotateX(-Math.PI / 2); leaf.translate(0, 0.03, 0);
    const fern = fernGeo(); const shroom = shroomGeo();
    const cliff = new THREE.DodecahedronGeometry(1, 1); { const pa = cliff.attributes.position; for (let k = 0; k < pa.count; k++) { const x = pa.getX(k), y = pa.getY(k), z = pa.getZ(k); const f = 1 + 0.18 * Math.sin(x * 5.1 + y * 3.3) * Math.cos(z * 4.7) + (y > 0.6 ? -0.25 : 0); pa.setXYZ(k, x * f, Math.max(-0.6, y) * f, z * f); } cliff.computeVertexNormals(); }
    this.geo = { trunk, crown, pine, cedar, rock, grass, flower, pebble, twig, leaf, fern, shroom, cliff };
    this.mats = { trunk: toon('#6a4a2a'), leaf: GFX.high ? addWind(toon('#ffffff').clone(), 0.0045) : toon('#ffffff'), rock: toon('#ffffff'), grass: GFX.high ? addWind(toon('#ffffff').clone(), 0.35) : toon('#ffffff') };
    if (GFX.real) { this.mats.rock = toon('#ffffff', { rough: 0.9 }); this.mats.leaf.roughness = 0.7; this.mats.grass.roughness = 0.85; this.mats.grass.side = THREE.DoubleSide; }
    this.mats.clut = toon('#ffffff', GFX.real ? { rough: 0.85 } : {}).clone(); this.mats.fern = GFX.high ? addWind(toon('#ffffff', GFX.real ? { rough: 0.8 } : {}).clone(), 0.12) : toon('#ffffff').clone(); this.mats.fern.side = THREE.DoubleSide; this.mats.fern.vertexColors = true; this.mats.shroom = toon('#ffffff').clone(); this.mats.shroom.vertexColors = true;
    this.mats.leafL = toon('#ffffff', GFX.real ? { rough: 0.9 } : {}).clone(); this.mats.leafL.side = THREE.DoubleSide;
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
      for (const [k, c] of this.chunks) { const w = want.get(k); if (w) for (const o of c.objs) if (o.userData.clutter) o.visible = w.ring <= 1; }
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
    const vcount = N * N + 4 * N; const pos = new Float32Array(vcount * 3), col = new Float32Array(vcount * 3); const s0 = new Float32Array(vcount * 4), s1 = new Float32Array(vcount * 4); const w = new Float32Array(8);
    const roads = segsNear(ROADS_W, x0, x0 + CH, z0, z0 + CH, 6), rails = segsNear(RAILS_W, x0, x0 + CH, z0, z0 + CH, 6);
    const c = new THREE.Color();
    for (let b = 0; b < N; b++) for (let a = 0; a < N; a++) {
      const x = x0 + a * st, z = z0 + b * st, y = H(x, z); const v = b * N + a;
      pos.set([x, y, z], v * 3); w.fill(0); this.color(x, z, y, roads, rails, c, w); col.set([c.r, c.g, c.b], v * 3); s0.set(w.subarray(0, 4), v * 4); s1.set(w.subarray(4, 8), v * 4);
    }
    // skirts
    let v = N * N; const edges = [];
    for (let a = 0; a < N; a++) edges.push(a, (N - 1) * N + a); for (let b = 1; b < N - 1; b++) edges.push(b * N, b * N + N - 1);
    const skirtOf = new Map();
    for (const e of [...new Set(edges)]) { pos.set([pos[e * 3], pos[e * 3 + 1] - 4, pos[e * 3 + 2]], v * 3); col.set([col[e * 3], col[e * 3 + 1], col[e * 3 + 2]], v * 3); s0.set(s0.subarray(e * 4, e * 4 + 4), v * 4); s1.set(s1.subarray(e * 4, e * 4 + 4), v * 4); skirtOf.set(e, v); v++; }
    const idx = [];
    for (let b = 0; b < n; b++) for (let a = 0; a < n; a++) { const p = b * N + a; idx.push(p, p + N, p + 1, p + 1, p + N, p + N + 1); }
    const strip = (list) => { for (let q = 0; q < list.length - 1; q++) { const e0 = list[q], e1 = list[q + 1], s0 = skirtOf.get(e0), s1 = skirtOf.get(e1); idx.push(e0, s0, e1, e1, s0, s1, e0, e1, s0, e1, s1, s0); } };
    const top = [], bot = [], lef = [], rig = []; for (let a = 0; a < N; a++) { top.push(a); bot.push((N - 1) * N + a); } for (let b = 0; b < N; b++) { lef.push(b * N); rig.push(b * N + N - 1); }
    strip(top); strip(bot); strip(lef); strip(rig);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos.subarray(0, v * 3), 3)); g.setAttribute('color', new THREE.BufferAttribute(col.subarray(0, v * 3), 3)); g.setIndex(idx); g.computeVertexNormals();
    // slope pass: steep faces become rock (cliffs), moderate forest slopes get moss
    { const nr = g.attributes.normal.array; const tc = new THREE.Color(); for (let q = 0; q < N * N; q++) { const ny = nr[q * 3 + 1]; const sl = 1 - ny; const k = smooth(0.2, 0.42, sl);
        if (k > 0 && s1[q * 4 + 1] < 0.5) { const px = pos[q * 3], pz = pos[q * 3 + 2]; const st = Math.sin(pos[q * 3 + 1] * 2.3 + px * 0.05) * 0.5 + 0.5; tc.copy(st > 0.5 ? COL.rock : COL.rockD);
          c.setRGB(col[q * 3], col[q * 3 + 1], col[q * 3 + 2]).lerp(tc, k * 0.9); col.set([c.r, c.g, c.b], q * 3); s0[q * 4] = Math.max(s0[q * 4], k); s0[q * 4 + 3] *= 1 - k * 0.7; s1[q * 4 + 2] = Math.max(s1[q * 4 + 2], smooth(0.12, 0.25, sl) * (1 - k) * forestAt(px, pz)); } } }
    g.setAttribute('aS0', new THREE.BufferAttribute(s0.subarray(0, v * 4), 4)); g.setAttribute('aS1', new THREE.BufferAttribute(s1.subarray(0, v * 4), 4));
    const m = new THREE.Mesh(g, this.mat); m.receiveShadow = GFX.shadows; m.userData.ground = true; m.userData.own = true; m.matrixAutoUpdate = false; m.updateMatrix();
    return m;
  }
  /** Vertex colour + splat weights w = [rock, dirt, sand, snow, wet, cobble, moss, -]. */
  color(x, z, y, roads, rails, c, w = new Float32Array(8)) {
    const b = biomeAt(x, z); const n = (Math.sin(x * 0.4) * Math.cos(z * 0.37) + Math.sin(x * 0.11 + z * 0.17)) * 0.25 + 0.5;
    const n2 = (Math.sin(x * 0.07 + 1.3) * Math.cos(z * 0.083 - 0.4)) * 0.5 + 0.5;
    c.copy(COL.grassA).lerp(COL.grassB, n);
    const f = forestAt(x, z); if (f > 0.05) { const k = Math.min(1, f); c.lerp(COL.forest, k * 0.7); if (n2 > 0.55) { c.lerp(COL.litter, k * (n2 - 0.55) * 1.6); w[1] = Math.max(w[1], k * (n2 - 0.55) * 1.4); } w[6] = k * 0.5; }
    const mt = smooth(9, 22, y); if (mt > 0) { c.lerp(n > 0.5 ? COL.rock : COL.rockD, mt); w[0] = mt; }
    if (b === 4 || y > 30) { const k = b === 4 ? smooth(14, 22, y) * 0.6 + 0.4 : smooth(30, 38, y); c.lerp(COL.snow, k); w[3] = k; w[0] *= 1 - k; }
    if (b === 7) c.lerp(COL.foreign, 0.6);
    if (y < WATER_Y + 1.4) w[4] = smooth(WATER_Y + 1.4, WATER_Y + 0.3, y);
    if (y < WATER_Y + 0.9) { const k = smooth(WATER_Y + 0.9, WATER_Y + 0.2, y); c.lerp(COL.sand, k); w[2] = k; w[0] *= 1 - k; w[3] *= 1 - k; }
    if (y < WATER_Y - 0.4) { c.copy(COL.seabed); w[2] = 1; }
    // low wet hollows inland turn to mud
    if (b !== 4 && y > WATER_Y + 0.4 && y < 2.2 && n2 < 0.18 && f > 0.15) { const k = smooth(0.18, 0.06, n2); c.lerp(COL.mud, k * 0.8); w[1] = Math.max(w[1], k); w[4] = Math.max(w[4], k * 0.7); }
    if (roads.length) { const d = segDist(roads, x, z); const ej = 3.2 + (n - 0.5) * 1.2; if (d < ej + 0.6) { const k = smooth(ej + 0.6, ej - 1.4, d); c.lerp(COL.dirt, k); if (d < 1.2) c.lerp(COL.wear, smooth(1.2, 0.2, d) * 0.35); w[1] = Math.max(w[1], k); for (const q of [0, 2, 3, 6]) w[q] *= 1 - k; } }
    if (rails.length) { const d = segDist(rails, x, z); if (d < 2.6) { const k = smooth(2.6, 1.4, d); c.lerp(COL.gravel, k); w[1] = Math.max(w[1], k); w[3] *= 1 - k; } }
    if (this.o.paint) this.o.paint(x, z, c, n, w);
  }
  props(i, j) {
    const H = this.o.height; const x0 = i * CH, z0 = j * CH; const out = [];
    const roads = segsNear(ROADS_W, x0, x0 + CH, z0, z0 + CH, 6), rails = segsNear(RAILS_W, x0, x0 + CH, z0, z0 + CH, 6);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), col = new THREE.Color(), up = new THREE.Vector3(0, 1, 0);
    const trees = [], pines = [], rocks = [];
    const step = GFX.real ? 4.3 : 5.2;
    for (let b = 0; b < CH / step; b++) for (let a = 0; a < CH / step; a++) {
      const r0 = hash(i * 64 + a, j * 64 + b, 1), r1 = hash(i * 64 + a, j * 64 + b, 2), r2 = hash(i * 64 + a, j * 64 + b, 3);
      const x = x0 + (a + r0) * step, z = z0 + (b + r1) * step; const y = H(x, z);
      if (y < WATER_Y + 0.6) continue;
      const bio = biomeAt(x, z); if (bio === 7) continue;
      if (this.o.keepOut(x, z, 3)) continue;
      if ((roads.length && segDist(roads, x, z) < 4) || (rails.length && segDist(rails, x, z) < 4)) continue;
      const f = forestAt(x, z) + (this.o.forestBoost ? this.o.forestBoost(x, z) : 0);
      const pTree = y > 30 ? 0 : y > 12 ? 0.18 : 0.06 + f * 0.85;
      if (r2 < pTree) (y > 9 || this.o.pineAt?.(x, z) || (f > 0.3 && hash(i * 64 + a, j * 64 + b, 4) < 0.7) ? pines : trees).push([x, y, z, r0, r1]);
      else if (r2 > 0.965 || (y > 10 && r2 > 0.85)) rocks.push([x, y, z, r0, r1]);
    }
    const inst = (geo, mat, list, fn) => { if (!list.length) return null; const im = new THREE.InstancedMesh(geo, mat, list.length); list.forEach((t, k) => { fn(t, k, im); }); im.castShadow = GFX.shadows; im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; im.computeBoundingSphere(); out.push(im); return im; };
    const place = (t, sc, sy) => { p.set(t[0], t[1] - 0.15, t[2]); q.setFromAxisAngle(up, t[3] * 6.28); s.set(sc, sc * sy, sc); m.compose(p, q, s); };
    inst(this.geo.trunk, this.mats.trunk, [...trees, ...pines], (t, k, im) => { place(t, 0.8 + t[4] * 0.7, 1); im.setMatrixAt(k, m); });
    inst(this.geo.crown, this.mats.leaf, trees, (t, k, im) => { place(t, 0.8 + t[4] * 0.7, 1); im.setMatrixAt(k, m); im.setColorAt(k, col.setHSL(0.25 + t[3] * 0.08, 0.5, 0.3 + t[4] * 0.12)); });
    const cedars = pines.filter((t) => t[1] <= 16 && t[4] > 0.55); const firs = pines.filter((t) => !(t[1] <= 16 && t[4] > 0.55));
    inst(this.geo.cedar, this.mats.leaf, cedars, (t, k, im) => { place(t, 0.75 + t[4] * 0.6, 1.15); im.setMatrixAt(k, m); im.setColorAt(k, col.setHSL(0.30 + t[3] * 0.04, 0.32, 0.2 + t[4] * 0.06)); });
    inst(this.geo.pine, this.mats.leaf, firs, (t, k, im) => { place(t, 0.8 + t[4] * 0.7, 1.1); im.setMatrixAt(k, m); const snowy = t[1] > 16; im.setColorAt(k, snowy ? col.set('#dfe8e4') : col.setHSL(0.36 + t[3] * 0.05, 0.42, 0.24 + t[4] * 0.08)); });
    inst(this.geo.rock, this.mats.rock, rocks, (t, k, im) => { place(t, 0.6 + t[4] * 1.4, 0.7); im.setMatrixAt(k, m); im.setColorAt(k, col.setHSL(0.08, 0.06, 0.45 + t[3] * 0.15)); });
    // ground cover (flowers always; grass on High)
    const nf = GFX.real ? 420 : GFX.high ? 260 : 70; const fl = []; const fc = GFX.real ? ['#8a7ab8', '#8a7ab8', '#e8d27a', '#f0ece0', '#7a8ab8', '#c86a4a'] : ['#ff7ab0', '#ffe060', '#ffffff', '#8ab0ff', '#ff8a5a'];
    for (let k = 0; k < nf; k++) { const x = x0 + hash(i, j, 100 + k) * CH, z = z0 + hash(j, i, 200 + k) * CH; const y = H(x, z); if (y < WATER_Y + 0.5 || y > 14 || this.o.keepOut(x, z, 0.6)) continue; if (roads.length && segDist(roads, x, z) < 2.5) continue; fl.push([x, y, z, hash(i, j, 300 + k), k]); }
    inst(this.geo.flower, this.mats.grass, fl, (t, k, im) => { p.set(t[0], t[1], t[2]); q.identity(); s.setScalar(0.6 + t[3]); m.compose(p, q, s); im.setMatrixAt(k, m); im.setColorAt(k, col.set(fc[t[4] % fc.length])); });
    if (GFX.high) {
      const gl = [];
      for (let k = 0, NG = GFX.real ? 3200 : 1400; k < NG; k++) { const x = x0 + hash(i, j, 1000 + k) * CH, z = z0 + hash(j, i, 3000 + k) * CH; const y = H(x, z); if (y < WATER_Y + 0.5 || y > 16 || this.o.keepOut(x, z, 0.3)) continue; if (roads.length && segDist(roads, x, z) < 2) continue; gl.push([x, y, z, hash(i, j, 5000 + k), hash(j, i, 7000 + k)]); }
      inst(this.geo.grass, this.mats.grass, gl, (t, k, im) => { p.set(t[0], t[1], t[2]); q.setFromEuler(new THREE.Euler((t[3] - 0.5) * 0.4, t[4] * 6, 0)); s.set(1, 0.6 + t[3] * 0.9, 1); m.compose(p, q, s); im.setMatrixAt(k, m); im.setColorAt(k, col.setHSL(0.27 + t[4] * 0.06, 0.55, 0.3 + t[3] * 0.15)); });
    }
    // ---- ground clutter by biome (pebbles everywhere, forest litter, ferns, mushrooms) and cliff formations
    const pb = [], tw = [], lv = [], fe = [], sh = [], cl = []; const Q = GFX.real ? 1 : GFX.high ? 0.65 : 0.22;
    const NC = Math.round(900 * Q);
    for (let k = 0; k < NC; k++) { const x = x0 + hash(i, j, 9000 + k) * CH, z = z0 + hash(j, i, 9500 + k) * CH; const y = H(x, z); if (y < WATER_Y + 0.35) continue;
      const r = hash(i, j, 9900 + k), r2 = hash(j, i, 9950 + k); const bio = biomeAt(x, z); const f = forestAt(x, z); const rd = roads.length ? segDist(roads, x, z) : 99;
      if (this.o.keepOut(x, z, 0.2) && !(rd < 5)) continue;
      const t = [x, y, z, r, r2];
      if (rd > 1.2 && rd < 4.2 && r < 0.5) { pb.push(t); continue; }               // road-edge gravel
      if (rd < 1.2) continue;
      if (f > 0.25 && bio !== 4) { if (r < 0.3) lv.push(t); else if (r < 0.42 && GFX.high) tw.push(t); else if (r < 0.52 && GFX.high) fe.push(t); else if (r < 0.555) sh.push(t); else if (r < 0.62) pb.push(t); }
      else if (y > 8 || bio === 4) { if (r < 0.35) pb.push(t); }
      else if (r < 0.12) pb.push(t); else if (r < 0.15 && GFX.high) tw.push(t);
    }
    // cliffs: sample a coarse grid, put rock formations on steep ground
    for (let b = 0; b < 8; b++) for (let a = 0; a < 8; a++) { const x = x0 + (a + hash(i * 8 + a, j * 8 + b, 41)) * 8, z = z0 + (b + hash(i * 8 + a, j * 8 + b, 42)) * 8; const y = H(x, z); if (y < WATER_Y + 1) continue;
      const gx = H(x + 1.5, z) - H(x - 1.5, z), gz = H(x, z + 1.5) - H(x, z - 1.5); const sl = Math.hypot(gx, gz) / 3; if (sl < 0.62 || hash(i * 8 + a, j * 8 + b, 44) > (GFX.high ? 0.55 : 0.3) || this.o.keepOut(x, z, 2)) continue;
      if ((roads.length && segDist(roads, x, z) < 5) || (rails.length && segDist(rails, x, z) < 5)) continue;
      cl.push([x, y, z, hash(i * 8 + a, j * 8 + b, 43), Math.atan2(gx, gz), Math.min(1.8, sl)]); }
    const clut = (im) => { if (im) { im.castShadow = false; im.userData.clutter = true; im.userData.noOutline = true; } };
    const lay = (t, sc, sy, tilt = 0) => { p.set(t[0], t[1], t[2]); q.setFromEuler(new THREE.Euler(tilt * (t[4] - 0.5), t[3] * 6.28, tilt * (t[3] - 0.5))); s.set(sc, sc * sy, sc); m.compose(p, q, s); };
    clut(inst(this.geo.pebble, this.mats.clut, pb, (t, k, im) => { lay(t, 0.5 + t[4] * 1.3, 0.7, 0.6); im.setMatrixAt(k, m); im.setColorAt(k, col.setHSL(0.08 + t[3] * 0.04, 0.08, 0.42 + t[4] * 0.22)); }));
    clut(inst(this.geo.twig, this.mats.clut, tw, (t, k, im) => { lay(t, 0.6 + t[4] * 0.8, 1, 0.2); im.setMatrixAt(k, m); im.setColorAt(k, col.setHSL(0.07, 0.35, 0.22 + t[4] * 0.1)); }));
    clut(inst(this.geo.leaf, this.mats.leafL, lv, (t, k, im) => { lay(t, 0.7 + t[4] * 0.8, 1, 0.5); im.setMatrixAt(k, m); im.setColorAt(k, col.setHSL(0.03 + t[3] * 0.1, 0.55 + t[4] * 0.2, 0.3 + t[4] * 0.12)); }));
    inst(this.geo.fern, this.mats.fern, fe, (t, k, im) => { lay(t, 0.8 + t[4] * 0.9, 0.9 + t[3] * 0.4); im.setMatrixAt(k, m); im.setColorAt(k, col.setHSL(0.27 + t[3] * 0.05, 0.4, 0.5 + t[4] * 0.2)); });
    clut(inst(this.geo.shroom, this.mats.shroom, sh, (t, k, im) => { lay(t, 0.8 + t[4] * 1.2, 1, 0.15); im.setMatrixAt(k, m); im.setColorAt(k, t[3] > 0.5 ? col.set('#c8442e') : col.set('#c8a070')); }));
    inst(this.geo.cliff, this.mats.rock, cl, (t, k, im) => { const sc = 1.3 + t[3] * 1.5; p.set(t[0], t[1] - 0.5, t[2]); q.setFromEuler(new THREE.Euler((t[3] - 0.5) * 0.3, t[4], 0)); s.set(sc * 1.3, sc * (0.8 + t[5] * 0.6), sc); m.compose(p, q, s); im.setMatrixAt(k, m); im.setColorAt(k, col.setHSL(0.07 + t[3] * 0.03, 0.08, 0.26 + t[3] * 0.1)); });
    for (const o of out) { o.matrixAutoUpdate = false; o.updateMatrix(); }
    return out;
  }
}
