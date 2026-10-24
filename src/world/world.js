import * as THREE from 'three';
import { toon, glow, mesh, addOutlines, shadowAll, GFX, WIND } from './toon.js';
import { buildNode, buildCharacter, buildMob, animateCharacter } from './models.js';
import { NODE_TYPES, NODE_TIERS, NODE_PLACEMENT } from '../data/nodes.js';
import { NPCS, POIS } from '../data/npcs.js';
import { drawGuildMark } from './mark.js';
import { BOSS_ARENA, BOSS_ARENAS } from '../data/mobs.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { createSea, buildFountain } from './water.js';
import { mapHeight, biomeAt, PLACES, PLACE, WORLD, WATER_Y, RAILS_W, ROADS_W, distToLines, toWorld } from './fiore.js';
import { Terrain } from './terrain.js';
import { buildRegions, SITE_FLATS, WOODSEA_CLEARING } from './regions.js';
import { Grass } from './foliage.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export const BOUNDS = WORLD;
export const TOWN = { minX: -42, maxX: 42, minZ: -42, maxZ: 44, gateHalf: 5 };
export const HALL = { minX: -12, maxX: 12, minZ: -34, maxZ: -14, door: 2.6 };
export const CATHEDRAL = { x: 74, z: -14.4, w: 16, d: 10 };

// ---------------------------------------------------------------- height
// Traced Fiore height + detail noise, then local flattening for towns/stations and the carved canyon.
const FLAT = []; // { x, z, r, blend, h, rect }
const CARVE = []; // { a:[x,z], b:[x,z], w, blend, h }
const DECKS = []; // walkable platforms over water / raised floors: { minX,maxX,minZ,maxZ,y }
let flatReady = false;
function initFlat() {
  if (flatReady) return; flatReady = true;
  FLAT.push({ rect: TOWN, r: 0, blend: 30, h: 0 });
  FLAT.push({ x: CATHEDRAL.x, z: CATHEDRAL.z, r: 17, blend: 16, h: 0.3 });
  for (const A of Object.values(BOSS_ARENAS)) {
    FLAT.push({ x: A.x, z: A.z, r: A.r + 1, blend: 5, h: A.h });
    if (A.causeway) { const [gx, gz] = A.gate; for (let k = 0; k <= 8; k++) { const t = k / 8; FLAT.push({ x: gx + (A.x - gx) * t, z: gz + (A.z - gz) * t, r: 4, blend: 3, h: A.h }); } }
  }
  for (const p of PLACES) {
    const base = mapHeight(p.pos[0], p.pos[1]);
    if (p.id === 'hargeon') FLAT.push({ x: p.pos[0], z: p.pos[1], r: 34, blend: 20, h: Math.max(1.4, base) });
    else if (p.id === 'crocus') FLAT.push({ x: p.pos[0], z: p.pos[1], r: 40, blend: 22, h: base });
    else if (p.id === 'oshibana' || p.id === 'clover') FLAT.push({ x: p.pos[0], z: p.pos[1], r: 28, blend: 18, h: base });
    else if (p.id === 'hakobe') FLAT.push({ x: p.pos[0], z: p.pos[1], r: 34, blend: 26, h: base });
    if (p.station && p.id !== 'magnolia' && p.id !== 'oshibana') { const [sx, sz] = p.station.pos; FLAT.push({ x: sx, z: sz, r: 12, blend: 10, h: mapHeight(sx, sz) }); }
  }
  for (const p of PLACES) if (p.flat) FLAT.push({ x: p.pos[0], z: p.pos[1], r: p.flat, blend: 18, h: Math.max(WATER_Y + 1.6, mapHeight(p.pos[0], p.pos[1])) });
  const [sx, sz] = PLACE.magnolia.station.pos; FLAT.push({ x: sx, z: sz, r: 12, blend: 10, h: 0 });
  { const Cc = toWorld(516, 337); FLAT.push({ x: Cc[0], z: Cc[1], r: 50, blend: 18, h: mapHeight(...Cc) }); } // Crocus city plaza + Domus Flau
  // Clover Canyon: a ravine cut through the ridge from Clover Town to the arena
  FLAT.push({ ...WOODSEA_CLEARING, h: Math.max(WATER_Y + 1.6, height(WOODSEA_CLEARING.x, WOODSEA_CLEARING.z)) });
  for (const f of SITE_FLATS) FLAT.push({ ...f, h: Math.max(WATER_Y + 1.6, height(f.x, f.z)) });
  CARVE.push({ a: PLACE.clover.pos, b: [BOSS_ARENA.x, BOSS_ARENA.z], w: 5, blend: 9, h: 3 });
}
function rawHeight(x, z) {
  let h = mapHeight(x, z);
  const land = smooth(-1.5, 2, h), mt = smooth(6, 28, h);
  h += (Math.sin(x * 0.07) * Math.cos(z * 0.06) * 1.1 + Math.sin(x * 0.17 + z * 0.13) * 0.45) * land * (0.6 + mt * 2.5);
  h += mt * (1 - Math.abs(Math.sin(x * 0.045 + Math.cos(z * 0.05) * 1.7))) * 7;
  return h;
}
export function height(x, z) {
  let h = rawHeight(x, z);
  for (const f of FLAT) {
    let d;
    if (f.rect) { const dx = Math.max(f.rect.minX - x, 0, x - f.rect.maxX), dz = Math.max(f.rect.minZ - z, 0, z - f.rect.maxZ); d = Math.hypot(dx, dz); }
    else { const dx = x - f.x, dz = z - f.z; if (Math.abs(dx) > f.r + f.blend || Math.abs(dz) > f.r + f.blend) continue; d = Math.hypot(dx, dz); }
    if (d >= f.r + f.blend) continue;
    const w = 1 - smooth(f.r, f.r + f.blend, d); h = h * (1 - w) + f.h * w;
  }
  for (const c of CARVE) {
    const [x0, z0] = c.a, [x1, z1] = c.b; const vx = x1 - x0, vz = z1 - z0; const t = Math.max(0, Math.min(1, ((x - x0) * vx + (z - z0) * vz) / (vx * vx + vz * vz)));
    const d = Math.hypot(x - x0 - t * vx, z - z0 - t * vz); if (d < c.w + c.blend) h = Math.min(h, c.h + smooth(c.w, c.w + c.blend, d) * Math.max(0, h - c.h));
  }
  return h;
}
const ZORDER = [...PLACES].sort((a, b) => a.r - b.r);
/** Named area at a point; place ids are returned through placeAt. */
export function placeAt(x, z) {
  if (x > TOWN.minX && x < TOWN.maxX && z > TOWN.minZ && z < TOWN.maxZ) return PLACE.magnolia;
  for (const p of ZORDER) if (Math.hypot(x - p.pos[0], z - p.pos[1]) < p.r) return p;
  return null;
}
export function zoneAt(x, z) {
  if (x > HALL.minX && x < HALL.maxX && z > HALL.minZ && z < HALL.maxZ) return 'Fairy Tail Guild Hall';
  if (x > TOWN.minX && x < TOWN.maxX && z > TOWN.minZ && z < TOWN.maxZ) return 'Magnolia';
  const p = placeAt(x, z); if (p) return p.id === 'magnolia' ? 'Magnolia Outskirts' : p.name;
  if (distToLines([RAILS_W[1]], x, z) < 22) return 'Oshibana Rail Line';
  const b = biomeAt(x, z);
  if (b === 7) return 'Border of Seven & Bosco';
  if (height(x, z) < WATER_Y - 0.5) return 'Sea of Fiore';
  if (b === 4 || b === 3) return 'Fiore Highlands';
  return 'Fiore Countryside';
}
/** Ground height at (x,z), accounting for the guild hall floor and piers. */
export function groundAt(x, z) {
  if (x > HALL.minX && x < HALL.maxX && z > HALL.minZ && z < HALL.maxZ + 0.3) return 0.5;
  for (const d of DECKS) {
    if (d.dir) { const rx = x - d.cx, rz = z - d.cz; if (Math.abs(rx * d.dir[0] + rz * d.dir[1]) < d.hl && Math.abs(-rx * d.dir[1] + rz * d.dir[0]) < d.hw) return d.y; }
    else if (x > d.minX && x < d.maxX && z > d.minZ && z < d.maxZ) return d.y;
  }
  return height(x, z);
}
/** True where a walker may not stand (deep water, foreign border, off the map). */
export function blockedAt(x, z) {
  if (x < WORLD.minX || x > WORLD.maxX || z < WORLD.minZ || z > WORLD.maxZ) return true;
  if (biomeAt(x, z) === 7) return true;
  return groundAt(x, z) < WATER_Y - 0.7;
}
/** Walks from (x,z) along dir until the shore; returns the last dry point. */
function findShore(x, z, dx, dz, max = 300) {
  const l = Math.hypot(dx, dz); dx /= l; dz /= l; let lx = x, lz = z;
  for (let s = 0; s < max; s += 1) { const px = x + dx * s, pz = z + dz * s; if (height(px, pz) < WATER_Y - 0.2) return [lx, lz]; lx = px; lz = pz; }
  return [lx, lz];
}

export function textTexture(text, { w = 512, h = 128, bg = '#3a2414', fg = '#ffe2a0', font = 'bold 64px Georgia, serif', border = '#c89040' } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, w, h); x.strokeStyle = border; x.lineWidth = 10; x.strokeRect(5, 5, w - 10, h - 10);
  let size = parseInt(font.match(/(\d+)px/)[1], 10); x.font = font;
  while (x.measureText(text).width > w - 40 && size > 20) { size -= 4; x.font = font.replace(/\d+px/, size + 'px'); }
  x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, w / 2, h / 2 + 4);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function emblemTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  x.fillStyle = '#f2e6c8'; x.fillRect(0, 0, 256, 256); x.strokeStyle = '#c89040'; x.lineWidth = 12; x.strokeRect(6, 6, 244, 244);
  drawGuildMark(x, 128, 116, 190, '#d02030', '#2a0a10');
  x.fillStyle = '#7a1a1a'; x.font = 'bold 28px Georgia, serif'; x.textAlign = 'center'; x.fillText('FAIRY TAIL', 128, 238);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/** Merges every static mesh under `root` into one mesh per material (huge draw-call saving on phones).
 *  Subtrees flagged userData.dyn (animated or clickable) are left alone. */
function bakeStatic(root, skip = new Set()) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const buckets = new Map(); const victims = []; const vset = new Set();
  const walk = (o) => {
    if (o.userData.dyn || skip.has(o)) return;
    if (o.isMesh && !o.isInstancedMesh && !Array.isArray(o.material) && o.geometry.attributes.position) {
      const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
      for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'uv') g.deleteAttribute(k);
      if (!g.attributes.normal) g.computeVertexNormals();
      if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
      g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
      const key = o.material.uuid; if (!buckets.has(key)) buckets.set(key, { mat: o.material, geos: [], cast: o.castShadow, recv: o.receiveShadow, outline: !!o.userData.isOutline }); buckets.get(key).geos.push(g);
      victims.push(o); vset.add(o);
    }
    for (const c of [...o.children]) walk(c);
  };
  for (const c of [...root.children]) walk(c);
  for (const v of victims) { for (const c of [...v.children]) if (!vset.has(c)) { v.parent.add(c); } v.parent && v.parent.remove(v); }
  for (const { mat, geos, cast, recv, outline } of buckets.values()) {
    const merged = mergeGeometries(geos, false); if (!merged) continue;
    const m = new THREE.Mesh(merged, mat); m.castShadow = cast; m.receiveShadow = recv; m.userData.baked = true; if (outline) { m.userData.isOutline = true; m.userData.noOutline = true; m.raycast = () => {}; }
    root.add(m);
  }
}

export function buildWorld(scene) {
  initFlat();
  const W = { boxes: [], circles: [], interactables: [], nodes: [], lanterns: [], anim: [], hallRoof: null, map: { rects: [] }, groups: [], docks: {} };
  const R = rng(1337);
  const addBox = (minX, maxX, minZ, maxZ, tag) => W.boxes.push({ minX, maxX, minZ, maxZ, tag });
  const solid = (obj, cx, cz, w, d, tag) => { addBox(cx - w / 2, cx + w / 2, cz - d / 2, cz + d / 2, tag); return obj; };

  // ---------------- Sky & lights ----------------
  const skyGeo = new THREE.SphereGeometry(600, 24, 12);
  const sky = new THREE.Mesh(skyGeo, new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color('#5a8ae8') }, mid: { value: new THREE.Color('#bfe0ff') }, bot: { value: new THREE.Color('#ffe8d0') } },
    vertexShader: 'varying vec3 vp; void main(){ vp = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 top, mid, bot; varying vec3 vp; void main(){ float h = normalize(vp).y; vec3 c = h > 0.0 ? mix(mid, top, pow(h, 0.6)) : mix(mid, bot, min(1.0, -h * 4.0)); gl_FragColor = vec4(c, 1.0); }',
  }));
  sky.renderOrder = -1; scene.add(sky); W.sky = sky;
  if (GFX.real) { // physically based sky (Rayleigh/Mie) instead of the gradient dome; also drives the image-based lighting
    sky.visible = false; const rs = new Sky(); rs.scale.setScalar(850); const u = rs.material.uniforms;
    u.turbidity.value = 4.5; u.rayleigh.value = 1.6; u.mieCoefficient.value = 0.004; u.mieDirectionalG.value = 0.82;
    W.sunDir = new THREE.Vector3(30, 60, 20).normalize(); u.sunPosition.value.copy(W.sunDir); rs.material.fog = false;
    rs.material.fragmentShader = rs.material.fragmentShader.replace('gl_FragColor = vec4( texColor, 1.0 );', 'gl_FragColor = vec4( texColor * 0.3, 1.0 );'); scene.add(rs); W.realSky = rs;
  }
  const FOGC = GFX.real ? '#b4c8dc' : '#cfe4f4'; scene.fog = new THREE.Fog(FOGC, GFX.real ? 110 : GFX.high ? 110 : 70, GFX.real ? 620 : GFX.high ? 330 : 205);
  W.fogBase = { near: scene.fog.near, far: scene.fog.far, color: new THREE.Color(FOGC), snow: new THREE.Color('#e4ecf4') };
  const hemi = new THREE.HemisphereLight('#dff0ff', '#6a8a4a', GFX.real ? 0.45 : 1.3); scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff2dc', GFX.real ? 3.0 : 2.2); sun.position.set(30, 60, 20); scene.add(sun); scene.add(sun.target);
  if (GFX.shadows) {
    sun.castShadow = true; sun.shadow.mapSize.set(GFX.real ? 4096 : 2048, GFX.real ? 4096 : 2048);
    const sr = GFX.real ? 60 : 45; Object.assign(sun.shadow.camera, { left: -sr, right: sr, top: sr, bottom: -sr, near: 1, far: 180 });
    if (GFX.real) { sun.shadow.radius = 4; sun.shadow.blurSamples = 16; }
    sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.04;
  }
  W.sun = sun;

  // ---------------- Streamed terrain + sea ----------------
  const inTownPad = (x, z, pad) => x > TOWN.minX - pad && x < TOWN.maxX + pad && z > TOWN.minZ - pad && z < TOWN.maxZ + pad;
  W.keepOut = (x, z, pad) => {
    if (inTownPad(x, z, pad + 2)) return true;
    for (const f of FLAT) if (!f.rect && f.r < 40 && Math.hypot(x - f.x, z - f.z) < f.r * 0.85 + pad) return true;
    for (const A of Object.values(BOSS_ARENAS)) { if (Math.hypot(x - A.x, z - A.z) < A.r + 4) return true;
      if (A.gate) { const [gx, gz] = A.gate; const vx = gx - A.x, vz = gz - A.z, L = Math.hypot(vx, vz); const ux = vx / L, uz = vz / L; const f = (x - A.x) * ux + (z - A.z) * uz; const sd = Math.abs((x - A.x) * uz - (z - A.z) * ux);
        if (f > 0 && f < A.r + 75 && sd < 12 + pad) return true; } } // keep the approach lane clear of trees
    for (const b of W.boxes) if (x > b.minX - pad && x < b.maxX + pad && z > b.minZ - pad && z < b.maxZ + pad) return true;
    for (const c of W.circles) if (c.r > 1.5 && Math.hypot(x - c.x, z - c.z) < c.r + pad) return true;
    return false;
  };
  const ARENA_LIST = Object.values(BOSS_ARENAS).map((A) => ({ ...A, col: new THREE.Color(A.floor) }));
  const eastForest = PLACE.eastforest.pos;
  W.terrain = new Terrain(scene, {
    height, keepOut: (x, z, pad) => W.keepOut(x, z, pad),
    forestBoost: (x, z) => { const d = Math.hypot(x - eastForest[0], z - eastForest[1]); return d < 95 ? (1 - d / 95) * 0.5 : 0; },
    pineAt: (x, z) => z < -380,
    paint: (x, z, c, n) => {
      if (inTownPad(x, z, 0)) { const plaza = Math.hypot(x, z - 2) < 13; const road = Math.abs(x) < 3 && z > -14; const lanes = (Math.abs(z + 2) < 2.5 && Math.abs(x) < 24) || (Math.abs(z - 20) < 2.5 && Math.abs(x) < 24) || (Math.abs(x) < 3 && z < -34) || (z > -13 && z < -5 && x < -24) || (z > -19 && z < -9 && x > 24);
        if (plaza || road || lanes) c.set('#b8b0a4').multiplyScalar(0.9 + n * 0.15); }
      for (const A of ARENA_LIST) { const da = Math.hypot(x - A.x, z - A.z); if (da < A.r) c.lerp(A.col, smooth(A.r, A.r - 6, da)); }
    },
  });
  {
    const water = createSea({ scene, W, height, WORLD, WATER_Y }); W.water = water;
    W.anim.push((t) => { WIND.value = t; });
  }
  // ---------------- Town ----------------
  const wood = toon('#8a5a34'), woodD = toon('#5a3a22'), plaster = toon('#f2e6cc'), stoneM = toon('#a8a098'), roofR = toon('#c0503a'), roofB = toon('#3a5aa0'), roofG = toon('#4a8a5a'), roofP = toon('#8a4aa0');
  const building = ({ x, z, w, d, h, roof, door, sign, wall = plaster, parent = scene, y = 0 }) => {
    const g = new THREE.Group(); g.position.set(x, y, z);
    g.add(mesh(new THREE.BoxGeometry(w, h, d), wall, 0, h / 2, 0));
    g.add(mesh(new THREE.BoxGeometry(w + 0.3, 0.6, d + 0.3), stoneM, 0, 0.3, 0));
    for (const [px, pz] of [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]]) g.add(mesh(new THREE.BoxGeometry(0.4, h, 0.4), woodD, px, h / 2, pz));
    g.add(mesh(new THREE.BoxGeometry(w + 0.2, 0.3, d + 0.2), woodD, 0, h, 0));
    const r = mesh(new THREE.ConeGeometry(Math.hypot(w, d) / 2 + 0.6, h * 0.7, 4), roof, 0, h + h * 0.35, 0); r.rotation.y = Math.PI / 4; r.scale.set(w / Math.max(w, d), 1, d / Math.max(w, d)); g.add(r);
    const chim = mesh(new THREE.BoxGeometry(0.8, 2, 0.8), stoneM, w * 0.25, h + 1.6, -d * 0.15); g.add(chim);
    // door + windows on the door side
    const dirs = { '+x': [1, 0], '-x': [-1, 0], '+z': [0, 1], '-z': [0, -1] }; const [dx, dz] = dirs[door];
    const face = (ox, oy, ww, hh, mat, depth = 0.12) => {
      const m = mesh(new THREE.BoxGeometry(dx ? depth : ww, hh, dz ? depth : ww), mat, dx * (w / 2 + 0.05) + (dz ? ox : 0), oy, dz * (d / 2 + 0.05) + (dx ? ox : 0)); g.add(m); return m;
    };
    face(0, 1.3, 1.8, 2.6, woodD); face(0, 1.3, 1.5, 2.3, wood);
    const winM = toon('#ffe8a0', { emissive: '#7a5a20' });
    for (const o of [-1, 1]) { face(o * (Math.max(w, d) * 0.3), 2.6, 1.2, 1.1, woodD); face(o * (Math.max(w, d) * 0.3), 2.6, 0.9, 0.8, winM, 0.16); }
    if (sign) {
      const st = mesh(new THREE.PlaneGeometry(3.2, 0.8), new THREE.MeshBasicMaterial({ map: textTexture(sign), fog: true }), 0, h - 0.6, 0);
      st.position.set(dx * (w / 2 + 0.2), h - 0.7, dz * (d / 2 + 0.2)); st.rotation.y = Math.atan2(dx, dz); g.add(st);
    }
    addOutlines(g); shadowAll(g, true, true); parent.add(g);
    solid(null, x, z, w + 0.3, d + 0.3, 'bld');
    W.map.rects.push({ x, z, w, d, color: '#b89870' });
    return g;
  };
  building({ x: -22, z: -2, w: 10, d: 8, h: 4.5, roof: roofB, door: '+x', sign: 'BANK' });
  building({ x: 22, z: -2, w: 10, d: 8, h: 4.5, roof: roofG, door: '-x', sign: 'MARKET' });
  building({ x: 22, z: 20, w: 10, d: 9, h: 5, roof: roofR, door: '-x', sign: 'INN' });
  // houses for filler
  for (const [x, z, r] of [[-30, 32, roofP], [30, 34, roofB], [-32, -28, roofR], [32, -28, roofG], [-34, 10, roofR], [34, 8, roofP]]) building({ x, z, w: 7, d: 6, h: 3.8, roof: r, door: x < 0 ? '+x' : '-x' });

  // Guild hall (walk-in interior)
  {
    const H = HALL, h = 6.2, t = 0.6; const g = new THREE.Group(); scene.add(g);
    const wallM = toon('#e8d8b8'), beam = woodD;
    const wall = (cx, cz, w, d) => { const m = mesh(new THREE.BoxGeometry(w, h, d), wallM, cx, h / 2, cz); g.add(m); solid(null, cx, cz, w, d, 'hall'); return m; };
    const midX = (H.minX + H.maxX) / 2;
    wall(midX, H.minZ + t / 2, H.maxX - H.minX, t);
    wall(H.minX + t / 2, (H.minZ + H.maxZ) / 2, t, H.maxZ - H.minZ);
    wall(H.maxX - t / 2, (H.minZ + H.maxZ) / 2, t, H.maxZ - H.minZ);
    const segW = (H.maxX - H.minX) / 2 - H.door;
    wall(H.minX + segW / 2, H.maxZ - t / 2, segW, t); wall(H.maxX - segW / 2, H.maxZ - t / 2, segW, t);
    const lintel = mesh(new THREE.BoxGeometry(H.door * 2 + 0.4, 1.6, t + 0.1), wallM, 0, h - 0.8, H.maxZ - t / 2); g.add(lintel);
    for (const x of [-H.door, H.door]) g.add(mesh(new THREE.BoxGeometry(0.5, h, 0.8), beam, x, h / 2, H.maxZ - t / 2));
    for (let x = H.minX; x <= H.maxX; x += 4) g.add(mesh(new THREE.BoxGeometry(0.35, h, 0.7), beam, x, h / 2, H.maxZ - t / 2));
    g.add(mesh(new THREE.BoxGeometry(H.maxX - H.minX + 0.6, 0.4, 0.75), beam, 0, h - 0.1, H.maxZ - t / 2));
    g.add(mesh(new THREE.BoxGeometry(H.maxX - H.minX + 1, 0.7, H.maxZ - H.minZ + 1), stoneM, 0, 0.1, (H.minZ + H.maxZ) / 2));
    const floor = mesh(new THREE.BoxGeometry(H.maxX - H.minX - 1, 0.1, H.maxZ - H.minZ - 1), toon('#a87a4a'), 0, 0.46, (H.minZ + H.maxZ) / 2); floor.userData.ground = true; g.add(floor);
    for (let i = 0; i < 11; i++) g.add(mesh(new THREE.BoxGeometry(H.maxX - H.minX - 1, 0.02, 0.06), toon('#7a5432'), 0, 0.52, H.minZ + 1 + i * 1.8));
    // Banner with emblem over the door
    const emb = mesh(new THREE.PlaneGeometry(3, 3), new THREE.MeshBasicMaterial({ map: emblemTexture(), fog: true }), 0, h + 1.6, H.maxZ + 0.05); g.add(emb);
    const sign = mesh(new THREE.PlaneGeometry(6, 1.2), new THREE.MeshBasicMaterial({ map: textTexture('FAIRY TAIL', { font: 'bold 56px Georgia, serif' }), fog: true }), 0, h - 0.6, H.maxZ + 0.08); g.add(sign);
    // Roof (hidden when you're inside)
    const roof = new THREE.Group(); g.add(roof);
    const span = (H.maxX - H.minX) / 2 + 1.2, len = H.maxZ - H.minZ + 1.6, pitch = 0.62;
    for (const s of [-1, 1]) { const p = mesh(new THREE.BoxGeometry(span / Math.cos(pitch), 0.4, len), roofR, s * span / 2, h + Math.tan(pitch) * span / 2, (H.minZ + H.maxZ) / 2); p.rotation.z = -s * pitch; roof.add(p); }
    const gable = new THREE.Shape(); gable.moveTo(-span + 0.6, 0); gable.lineTo(span - 0.6, 0); gable.lineTo(0, Math.tan(pitch) * (span - 0.6)); gable.lineTo(-span + 0.6, 0);
    for (const z of [H.minZ + 0.3, H.maxZ - 0.3]) { const gm = mesh(new THREE.ShapeGeometry(gable), wallM, 0, h, z); gm.material = toon('#e8d8b8', { side: THREE.DoubleSide }); roof.add(gm); }
    const tower = mesh(new THREE.BoxGeometry(3, 4, 3), wallM, 0, h + 5, H.minZ + 4); roof.add(tower);
    const spire = mesh(new THREE.ConeGeometry(2.6, 4, 4), roofR, 0, h + 9, H.minZ + 4); spire.rotation.y = Math.PI / 4; roof.add(spire);
    const flag = mesh(new THREE.PlaneGeometry(1.6, 1), toon('#c0302a', { side: THREE.DoubleSide }), 0.8, h + 11.4, H.minZ + 4); roof.add(flag); flag.userData.dyn = true; W.anim.push((t) => { flag.rotation.y = Math.sin(t * 3) * 0.3; });
    W.hallRoof = roof; roof.userData.dyn = true;
    // Interior: request board, bar, tables, fireplace, chandeliers
    const board = new THREE.Group(); board.position.set(H.minX + 0.75, 0.5, -26); board.rotation.y = Math.PI / 2; g.add(board);
    board.add(mesh(new THREE.BoxGeometry(5, 3, 0.2), woodD, 0, 2.1, 0)); board.add(mesh(new THREE.BoxGeometry(4.5, 2.5, 0.22), toon('#c89a5a'), 0, 2.1, 0));
    const paperC = ['#fff8e0', '#ffe8e0', '#e8f0ff', '#f0ffe8'];
    for (let i = 0; i < 12; i++) { const p = mesh(new THREE.BoxGeometry(0.7, 0.55, 0.05), toon(paperC[i % 4]), -1.8 + (i % 6) * 0.72, 1.55 + Math.floor(i / 6) * 0.9 + (i % 2) * 0.1, 0.13); p.rotation.z = (R() - 0.5) * 0.25; board.add(p); }
    const boardTitle = mesh(new THREE.PlaneGeometry(3.4, 0.6), new THREE.MeshBasicMaterial({ map: textTexture('REQUEST BOARD', { font: 'bold 52px Georgia, serif' }) }), 0, 3.85, 0.12); board.add(boardTitle);
    solid(null, H.minX + 0.9, -26, 1.0, 5, 'board');
    W.interactables.push({ kind: 'board', name: 'Request Board', x: H.minX + 1.6, z: -26, r: 3.4, obj: board });
    // bar counter
    const bar = mesh(new THREE.BoxGeometry(8, 1.0, 1.2), wood, 6, 0.95, -27.2); g.add(bar); g.add(mesh(new THREE.BoxGeometry(8.3, 0.15, 1.4), woodD, 6, 1.5, -27.2)); solid(null, 6, -27.2, 8, 1.2, 'bar');
    for (let i = 0; i < 5; i++) g.add(mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.35, 8), toon(['#c03030', '#3060c0', '#30a050', '#e0b030', '#a040c0'][i]), 3 + i * 1.4, 1.75, -27.2));
    g.add(mesh(new THREE.BoxGeometry(8, 3, 0.4), woodD, 6, 2.2, -33.3)); for (let i = 0; i < 3; i++) g.add(mesh(new THREE.BoxGeometry(7.6, 0.1, 0.6), wood, 6, 1.4 + i, -33));
    // tables
    for (const [x, z] of [[-4, -19.5], [4, -19.5], [-5, -31]]) {
      const tbl = new THREE.Group(); tbl.position.set(x, 0.5, z); g.add(tbl);
      tbl.add(mesh(new THREE.BoxGeometry(3.6, 0.15, 1.6), wood, 0, 1, 0));
      for (const [lx, lz] of [[-1.6, -0.6], [1.6, -0.6], [-1.6, 0.6], [1.6, 0.6]]) tbl.add(mesh(new THREE.BoxGeometry(0.15, 1, 0.15), woodD, lx, 0.5, lz));
      for (const s of [-1, 1]) tbl.add(mesh(new THREE.BoxGeometry(3.4, 0.12, 0.5), woodD, 0, 0.55, s * 1.2));
      tbl.add(mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.25, 8), toon('#e8c060'), -0.8, 1.2, 0.2)); tbl.add(mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.06, 12), toon('#f0f0f0'), 0.6, 1.1, -0.1));
      solid(null, x, z, 3.6, 3, 'table');
    }
    // fireplace
    const fp = new THREE.Group(); fp.position.set(-4.5, 0.5, H.minZ + 0.9); g.add(fp);
    fp.add(mesh(new THREE.BoxGeometry(4, 3.4, 1.2), stoneM, 0, 1.7, 0)); fp.add(mesh(new THREE.BoxGeometry(2.4, 1.6, 0.4), toon('#1a1010'), 0, 0.9, 0.45));
    const fire = mesh(new THREE.ConeGeometry(0.6, 1.2, 8), glow('#ff8a2a'), 0, 0.7, 0.55); fp.add(fire); fire.userData.dyn = true; W.anim.push((t) => { fire.scale.set(1 + Math.sin(t * 13) * 0.1, 1 + Math.sin(t * 9) * 0.2, 1); });
    solid(null, -4.5, H.minZ + 0.9, 4, 1.4, 'fire');
    // banners on side walls
    for (const s of [-1, 1]) for (const z of [-30, -20]) { const b = mesh(new THREE.PlaneGeometry(1.4, 2.6), new THREE.MeshBasicMaterial({ map: emblemTexture(), side: THREE.DoubleSide }), s * (H.maxX - 0.7), 3.6, z); b.rotation.y = -s * Math.PI / 2; if (!(s < 0 && z === -20 && false)) g.add(b); }
    // chandeliers
    for (const z of [-20, -29]) {
      const ch = new THREE.Group(); ch.position.set(0, 5.2, z); g.add(ch);
      ch.add(mesh(new THREE.TorusGeometry(1.2, 0.08, 6, 16), woodD)); ch.children[0].rotation.x = Math.PI / 2;
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; ch.add(mesh(new THREE.SphereGeometry(0.12, 8, 6), glow('#ffd080'), Math.cos(a) * 1.2, 0.15, Math.sin(a) * 1.2)); }
      if (GFX.high) { const pl = new THREE.PointLight('#ffc070', 18, 14, 1.6); pl.position.set(0, 4.6, z); scene.add(pl); }
    }
    addOutlines(g); shadowAll(g, true, true);
    W.map.rects.push({ x: 0, z: (H.minZ + H.maxZ) / 2, w: H.maxX - H.minX, d: H.maxZ - H.minZ, color: '#c86a4a', hall: true });
  }

  // Forge pavilion
  {
    const g = new THREE.Group(); g.position.set(-20, 0, 20); scene.add(g);
    for (const [x, z] of [[-5, -4], [5, -4], [-5, 4], [5, 4]]) { g.add(mesh(new THREE.BoxGeometry(0.5, 4.2, 0.5), woodD, x, 2.1, z)); solid(null, -20 + x, 20 + z, 0.6, 0.6, 'post'); }
    const roof = mesh(new THREE.ConeGeometry(8.2, 2.6, 4), toon('#5a4a42'), 0, 5.4, 0); roof.rotation.y = Math.PI / 4; roof.scale.z = 0.8; g.add(roof);
    g.add(mesh(new THREE.BoxGeometry(10.6, 0.25, 8.6), stoneM, 0, 0.1, 0));
    const forge = new THREE.Group(); forge.position.set(-2.5, 0, -2); g.add(forge);
    forge.add(mesh(new THREE.BoxGeometry(2.6, 1.4, 2), toon('#8a4a3a'), 0, 0.7, 0));
    const coals = mesh(new THREE.BoxGeometry(2, 0.2, 1.4), glow('#ff6a1a'), 0, 1.45, 0); forge.add(coals); W.anim.push((t) => { coals.material.color.setHSL(0.06, 1, 0.5 + Math.sin(t * 5) * 0.08); });
    forge.add(mesh(new THREE.CylinderGeometry(0.4, 0.6, 3.5, 8), toon('#6a3a2a'), 0, 3, -0.6));
    solid(null, -22.5, 18, 2.6, 2, 'forge');
    W.interactables.push({ kind: 'station', station: 'forge', name: 'Forge', x: -22.5, z: 19.8, r: 3.2, obj: forge });
    const anvil = new THREE.Group(); anvil.position.set(1, 0, -1.5); g.add(anvil);
    anvil.add(mesh(new THREE.BoxGeometry(0.6, 0.7, 0.6), woodD, 0, 0.35, 0)); anvil.add(mesh(new THREE.BoxGeometry(1.2, 0.35, 0.5), toon('#4a4a52'), 0, 0.88, 0));
    const horn = mesh(new THREE.ConeGeometry(0.18, 0.5, 6), toon('#4a4a52'), 0.8, 0.88, 0); horn.rotation.z = -Math.PI / 2; anvil.add(horn);
    solid(null, -19, 18.5, 1.4, 0.8, 'anvil');
    W.interactables.push({ kind: 'station', station: 'forge', name: 'Anvil', x: -19, z: 19.8, r: 2.8, obj: anvil });
    const bench = new THREE.Group(); bench.position.set(0, 0, 3.2); g.add(bench);
    bench.add(mesh(new THREE.BoxGeometry(4, 0.2, 1.4), wood, 0, 1.1, 0));
    for (const [x, z] of [[-1.8, -0.5], [1.8, -0.5], [-1.8, 0.5], [1.8, 0.5]]) bench.add(mesh(new THREE.BoxGeometry(0.18, 1.1, 0.18), woodD, x, 0.55, z));
    bench.add(mesh(new THREE.BoxGeometry(0.8, 0.3, 0.5), toon('#e8e0d0'), -1, 1.35, 0)); bench.add(mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.6, 10), wood, 1, 1.5, 0));
    solid(null, -20, 23.2, 4, 1.4, 'bench');
    W.interactables.push({ kind: 'station', station: 'workbench', name: 'Workbench', x: -20, z: 21.7, r: 3, obj: bench });
    const sign = mesh(new THREE.PlaneGeometry(3.2, 0.8), new THREE.MeshBasicMaterial({ map: textTexture('FORGE'), side: THREE.DoubleSide }), 5.3, 3.4, 0); sign.rotation.y = Math.PI / 2; g.add(sign);
    addOutlines(g); shadowAll(g, true, true);
    W.map.rects.push({ x: -20, z: 20, w: 10, d: 8, color: '#8a6a5a' });
  }
  // Arcane Workshop pavilion (life skills: Cooking, Alchemy, Lacrima, Script, Runes, Stars, Requip)
  {
    const G0 = { cyl: (a, b, h, n = 8) => new THREE.CylinderGeometry(a, b, h, n), sph: (r, w, hh) => new THREE.SphereGeometry(r, w, hh) };
    const WX = -17, WZ = 33; const g = new THREE.Group(); g.position.set(WX, 0, WZ); scene.add(g);
    for (const [x, z] of [[-6, -3.6], [6, -3.6], [-6, 3.6], [6, 3.6]]) { g.add(mesh(new THREE.BoxGeometry(0.45, 4, 0.45), woodD, x, 2, z)); solid(null, WX + x, WZ + z, 0.5, 0.5, 'post'); }
    const roof = mesh(new THREE.ConeGeometry(9, 2.4, 4), toon('#4a3a6a'), 0, 5.1, 0); roof.rotation.y = Math.PI / 4; roof.scale.z = 0.62; g.add(roof);
    g.add(mesh(new THREE.BoxGeometry(12.6, 0.22, 7.8), stoneM, 0, 0.1, 0));
    const st = (station, name, x, z, build, solidW = 0) => { const o = new THREE.Group(); o.position.set(x, 0, z); g.add(o); build(o); if (solidW) solid(null, WX + x, WZ + z, solidW, 1, station); W.interactables.push({ kind: 'station', station, name, x: WX + x, z: WZ + z + (z < 0 ? 1.4 : 0), r: 2.4, obj: o }); return o; };
    const table = (o, top) => { o.add(mesh(new THREE.BoxGeometry(2, 0.16, 1), wood, 0, 1, 0)); for (const [x, z] of [[-0.85, -0.4], [0.85, -0.4], [-0.85, 0.4], [0.85, 0.4]]) o.add(mesh(new THREE.BoxGeometry(0.12, 1, 0.12), woodD, x, 0.5, z)); if (top) top(o); };
    st('kitchen', 'Guild Kitchen', -4.5, -2.2, (o) => { o.add(mesh(new THREE.BoxGeometry(1.6, 0.9, 1), stoneM, 0, 0.45, 0)); const pot = mesh(G0.cyl(0.45, 0.38, 0.5, 12), toon('#3a3a42'), 0, 1.15, 0); o.add(pot); const soup = mesh(G0.cyl(0.4, 0.4, 0.05, 12), glow('#e8a040'), 0, 1.38, 0); o.add(soup); const fire = mesh(new THREE.BoxGeometry(1, 0.1, 0.6), glow('#ff6a1a'), 0, 0.92, 0); o.add(fire); W.anim.push((t) => { fire.material.color.setHSL(0.06, 1, 0.5 + Math.sin(t * 6) * 0.08); }); }, 1.6);
    st('alchemy', 'Alchemy Table', -1.5, -2.2, (o) => table(o, (o2) => { [['#7aff9a', -0.6], ['#7aa8ff', -0.2], ['#ff7a9a', 0.25], ['#ffe07a', 0.6]].forEach(([c, x]) => { o2.add(mesh(G0.sph(0.16, 8, 6), glow(c), x, 1.3, 0)); o2.add(mesh(G0.cyl(0.04, 0.05, 0.22, 6), toon('#e8e8f0'), x, 1.5, 0)); }); }), 2);
    st('lacrima', 'Lacrima Bench', 1.5, -2.2, (o) => table(o, (o2) => { const c = mesh(new THREE.OctahedronGeometry(0.35, 0), glow('#7ad8ff'), 0, 1.55, 0); c.scale.y = 1.6; o2.add(c); W.anim.push((t) => { c.rotation.y = t; c.position.y = 1.55 + Math.sin(t * 2) * 0.06; }); o2.add(mesh(G0.cyl(0.3, 0.36, 0.14, 8), toon('#6a6a78'), 0, 1.14, 0)); }), 2);
    st('scriptdesk', 'Script Desk', 4.5, -2.2, (o) => table(o, (o2) => { o2.add(mesh(new THREE.BoxGeometry(0.7, 0.12, 0.5), toon('#8a3a3a'), -0.4, 1.14, 0)); o2.add(mesh(new THREE.BoxGeometry(0.6, 0.02, 0.45), toon('#f4ecd8'), 0.4, 1.1, 0)); const quill = mesh(G0.cyl(0.02, 0.01, 0.6, 4), toon('#ffffff'), 0.55, 1.35, 0.1); quill.rotation.z = -0.6; o2.add(quill); const letter = mesh(new THREE.TorusGeometry(0.14, 0.03, 4, 12), glow('#ffd27a'), 0.1, 1.7, 0); W.anim.push((t) => { letter.position.y = 1.7 + Math.sin(t * 1.7) * 0.1; letter.rotation.y = t * 1.3; }); o2.add(letter); }), 2);
    const ring = (o, col, n) => { const r = mesh(new THREE.TorusGeometry(1.1, 0.05, 4, 32), glow(col), 0, 0.26, 0); r.rotation.x = Math.PI / 2; o.add(r); const r2 = mesh(new THREE.TorusGeometry(0.7, 0.04, 4, n), glow(col), 0, 0.26, 0); r2.rotation.x = Math.PI / 2; o.add(r2); W.anim.push((t) => { r2.rotation.z = t * 0.8; }); };
    st('runecircle', 'Rune Circle', -3, 2, (o) => { ring(o, '#c060ff', 5); for (let i = 0; i < 5; i++) { const a = i * 1.2566; const s2 = mesh(new THREE.BoxGeometry(0.12, 0.5, 0.12), glow('#c060ff'), Math.cos(a) * 1.1, 0.5, Math.sin(a) * 1.1); o.add(s2); } });
    st('starcircle', 'Star Circle', 0.2, 2, (o) => { ring(o, '#ffe07a', 12); const star = mesh(new THREE.OctahedronGeometry(0.22, 0), glow('#fff2b0'), 0, 1.4, 0); o.add(star); W.anim.push((t) => { star.rotation.y = t * 2; }); });
    st('requip', 'Requip Altar', 3.6, 2, (o) => { o.add(mesh(new THREE.BoxGeometry(1.2, 0.8, 0.8), stoneM, 0, 0.4, 0)); const arm = mesh(new THREE.BoxGeometry(0.7, 0.9, 0.35), toon('#c8ccd8', { emissive: '#30343a' }), 0, 1.3, 0); o.add(arm); o.add(mesh(G0.sph(0.18, 8, 6), toon('#c8ccd8'), 0, 1.9, 0)); const sw = mesh(new THREE.BoxGeometry(0.08, 1.2, 0.03), glow('#ffd27a'), 0.55, 1.4, 0); sw.rotation.z = 0.3; o.add(sw); }, 1.2);
    const sign = mesh(new THREE.PlaneGeometry(4.6, 0.8), new THREE.MeshBasicMaterial({ map: textTexture('ARCANE WORKSHOP'), side: THREE.DoubleSide }), 0, 3.6, 3.7); g.add(sign);
    addOutlines(g); shadowAll(g, true, true);
    W.map.rects.push({ x: WX, z: WZ, w: 12, d: 7, color: '#6a5a8a' });
  }
  // Market board next to the market
  {
    const b = new THREE.Group(); b.position.set(15.4, 0, 3.2); b.rotation.y = -Math.PI / 2; scene.add(b);
    b.add(mesh(new THREE.BoxGeometry(2.6, 1.8, 0.15), woodD, 0, 1.9, 0)); b.add(mesh(new THREE.BoxGeometry(0.2, 2.8, 0.2), woodD, -1.2, 1.4, 0)); b.add(mesh(new THREE.BoxGeometry(0.2, 2.8, 0.2), woodD, 1.2, 1.4, 0));
    for (let i = 0; i < 6; i++) b.add(mesh(new THREE.BoxGeometry(0.6, 0.45, 0.04), toon(['#fff8e0', '#e8f0ff'][i % 2]), -0.8 + (i % 3) * 0.8, 1.6 + Math.floor(i / 3) * 0.6, -0.1));
    addOutlines(b); shadowAll(b); solid(null, 15.4, 3.2, 0.6, 2.8, 'mboard');
    W.interactables.push({ kind: 'shop', name: 'Market Board', x: 14.6, z: 3.2, r: 3, obj: b });
  }
  // Fountain (tiered stone, animated water: see water.js)
  buildFountain(scene, { x: 0, y: 0, z: 2, scale: 0.92, W }); W.circles.push({ x: 0, z: 2, r: 3.8 });
  // Fence + gate
  {
    const g = new THREE.Group(); scene.add(g); const T = TOWN;
    const run = (x0, z0, x1, z1) => {
      const len = Math.hypot(x1 - x0, z1 - z0), n = Math.ceil(len / 3);
      for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, z = z0 + (z1 - z0) * i / n; g.add(mesh(new THREE.BoxGeometry(0.35, 1.8, 0.35), woodD, x, 0.9, z)); }
      const rail = mesh(new THREE.BoxGeometry(Math.abs(x1 - x0) || 0.15, 0.15, Math.abs(z1 - z0) || 0.15), wood, (x0 + x1) / 2, 1.3, (z0 + z1) / 2); g.add(rail);
      const rail2 = rail.clone(); rail2.position.y = 0.7; g.add(rail2);
      addBox(Math.min(x0, x1) - 0.3, Math.max(x0, x1) + 0.3, Math.min(z0, z1) - 0.3, Math.max(z0, z1) + 0.3, 'fence');
    };
    // gates on all four sides: north (Lake Scilliora / Mt. Hakobe), west (station, Crocus), east (Kardia, East Forest), south (Hargeon)
    run(T.minX, T.minZ, -T.gateHalf, T.minZ); run(T.gateHalf, T.minZ, T.maxX, T.minZ);
    run(T.minX, T.minZ, T.minX, -13); run(T.minX, -5, T.minX, T.maxZ);
    run(T.maxX, T.minZ, T.maxX, -19); run(T.maxX, -9, T.maxX, T.maxZ);
    for (const [x, z, ry] of [[0, T.minZ, 0], [T.minX, -9, Math.PI / 2], [T.maxX, -14, Math.PI / 2]]) {
      const gg = new THREE.Group(); gg.position.set(x, 0, z); gg.rotation.y = ry; g.add(gg);
      for (const s of [-1, 1]) { gg.add(mesh(new THREE.BoxGeometry(1, 5, 1), stoneM, s * 4.6, 2.5, 0)); gg.add(mesh(new THREE.ConeGeometry(0.9, 1.4, 4), roofR, s * 4.6, 5.7, 0)); }
      gg.add(mesh(new THREE.BoxGeometry(10.2, 0.7, 0.7), woodD, 0, 4.6, 0));
      const s2 = mesh(new THREE.PlaneGeometry(4.4, 0.9), new THREE.MeshBasicMaterial({ map: textTexture('MAGNOLIA'), side: THREE.DoubleSide }), 0, 3.8, 0.4); gg.add(s2);
    }
    run(T.minX, T.maxZ, -T.gateHalf, T.maxZ); run(T.gateHalf, T.maxZ, T.maxX, T.maxZ);
    for (const s of [-1, 1]) { g.add(mesh(new THREE.BoxGeometry(1, 6, 1), stoneM, s * T.gateHalf, 3, T.maxZ)); g.add(mesh(new THREE.ConeGeometry(0.9, 1.4, 4), roofR, s * T.gateHalf, 6.7, T.maxZ)); }
    g.add(mesh(new THREE.BoxGeometry(T.gateHalf * 2 + 1, 0.8, 0.8), woodD, 0, 5.4, T.maxZ));
    const gs = mesh(new THREE.PlaneGeometry(5, 1), new THREE.MeshBasicMaterial({ map: textTexture('MAGNOLIA'), side: THREE.DoubleSide }), 0, 4.6, T.maxZ + 0.45); g.add(gs);
    addOutlines(g); shadowAll(g, true, false);
  }
  // Lantern posts (Magnolia!)
  {
    const spots = [[-4, -8], [4, -8], [-14, 8], [14, 8], [-4, 30], [4, 30], [-8, 40], [8, 40], [-12, -2], [12, -2], [-12, 20], [12, 20]];
    for (const l of ROADS_W.slice(0, 3)) { let acc = 0; for (let i = 0; i < l.length - 1 && acc < 140; i++) { const [x0, z0] = l[i], [x1, z1] = l[i + 1]; const len = Math.hypot(x1 - x0, z1 - z0); for (let s = 8; s < len && acc < 140; s += 16) { const t = s / len; const x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t; acc = Math.hypot(x, z); if (inTownPad(x, z, 4)) continue; const nx = -(z1 - z0) / len * 3.4, nz = (x1 - x0) / len * 3.4; spots.push([x + nx, z + nz]); } } }
    for (const [x, z] of spots) {
      const g = new THREE.Group(); g.position.set(x, groundAt(x, z), z); scene.add(g);
      g.add(mesh(new THREE.CylinderGeometry(0.1, 0.14, 3.2, 6), toon('#2a2a30'), 0, 1.6, 0));
      g.add(mesh(new THREE.BoxGeometry(0.9, 0.08, 0.08), toon('#2a2a30'), 0.35, 3.1, 0));
      const l = mesh(new THREE.BoxGeometry(0.36, 0.5, 0.36), glow('#ffd27a'), 0.7, 2.8, 0); g.add(l); W.lanterns.push(l);
      g.add(mesh(new THREE.ConeGeometry(0.32, 0.25, 4), toon('#2a2a30'), 0.7, 3.15, 0));
      addOutlines(g); W.circles.push({ x, z, r: 0.35 });
    }
  }
  // Town flowers (the streamed terrain keeps props out of the town itself)
  {
    const fg = new THREE.IcosahedronGeometry(0.12, 0); fg.translate(0, 0.15, 0); const N = GFX.high ? 700 : 220;
    const fl = new THREE.InstancedMesh(fg, toon('#ffffff'), N); const fc = ['#ff7ab0', '#ffe060', '#ffffff', '#8ab0ff', '#ff8a5a'];
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), col = new THREE.Color(); let f = 0;
    for (let i = 0; i < N * 3 && f < N; i++) {
      const x = TOWN.minX + 1 + R() * (TOWN.maxX - TOWN.minX - 2), z = TOWN.minZ + 1 + R() * (TOWN.maxZ - TOWN.minZ - 2);
      if (x > HALL.minX - 1 && x < HALL.maxX + 1 && z > HALL.minZ - 1 && z < HALL.maxZ + 1) continue;
      if (W.boxes.some((b) => x > b.minX - 0.5 && x < b.maxX + 0.5 && z > b.minZ - 0.5 && z < b.maxZ + 0.5)) continue;
      if (Math.abs(x) < 3 || Math.hypot(x, z - 2) < 13 || Math.abs(z + 2) < 2.5 || Math.abs(z - 20) < 2.5) continue;
      p.set(x, 0, z); s.setScalar(0.6 + R()); q.identity(); m.compose(p, q, s); fl.setMatrixAt(f, m); fl.setColorAt(f, col.set(fc[f % 5])); f++;
    }
    fl.count = f; scene.add(fl);
  }

  // ---------------- Fiore: zones beyond Magnolia ----------------
  const zoneGroup = (x, z, r) => { const g = new THREE.Group(); scene.add(g); W.groups.push({ g, x, z, r }); return g; };
  const sign = (parent, x, z, text, rot = 0, h = 2.4) => {
    const g = new THREE.Group(); g.position.set(x, groundAt(x, z), z); g.rotation.y = rot; parent.add(g);
    g.add(mesh(new THREE.CylinderGeometry(0.12, 0.15, h + 0.6, 6), woodD, 0, (h + 0.6) / 2, 0));
    const b = mesh(new THREE.PlaneGeometry(3.4, 0.8), new THREE.MeshBasicMaterial({ map: textTexture(text, { font: 'bold 54px Georgia, serif' }), side: THREE.DoubleSide, fog: true }), 0, h, 0.13); g.add(b);
    g.add(mesh(new THREE.BoxGeometry(3.5, 0.9, 0.12), woodD, 0, h, 0.04));
    addOutlines(g); W.circles.push({ x, z, r: 0.3 }); return g;
  };
  const yAt = (x, z) => height(x, z);
  const hut = (parent, x, z, rot, w = 4, d = 4, col = '#9a7a52', roofC = '#7a5a3a') => {
    const g = new THREE.Group(); const y = yAt(x, z); g.position.set(x, y, z); g.rotation.y = rot; parent.add(g);
    g.add(mesh(new THREE.BoxGeometry(w, 2.6, d), toon(col), 0, 1.3, 0));
    const r = mesh(new THREE.ConeGeometry(Math.hypot(w, d) / 2 + 0.5, 2.2, 4), toon(roofC), 0, 3.7, 0); r.rotation.y = Math.PI / 4; g.add(r);
    g.add(mesh(new THREE.BoxGeometry(1, 1.8, 0.1), woodD, 0, 0.9, d / 2 + 0.03));
    addOutlines(g); shadowAll(g, true, true); W.circles.push({ x, z, r: Math.max(w, d) * 0.62 }); return g;
  };
  const boat = (parent, x, z, rot, size = 1, sail = '#f4ecd8', hull = '#7a4a2a') => {
    const g = new THREE.Group(); g.position.set(x, WATER_Y - 0.1, z); g.rotation.y = rot; g.scale.setScalar(size); parent.add(g);
    const hb = mesh(new THREE.BoxGeometry(2.4, 1, 7), toon(hull), 0, 0.4, 0); g.add(hb);
    const bow = mesh(new THREE.ConeGeometry(1.2, 2.4, 4), toon(hull), 0, 0.4, 4.6); bow.rotation.x = Math.PI / 2; bow.rotation.y = Math.PI / 4; bow.scale.set(1, 1, 0.55); g.add(bow);
    g.add(mesh(new THREE.BoxGeometry(2.2, 0.1, 6.6), toon('#c8a070'), 0, 0.92, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.1, 0.12, 6, 6), woodD, 0, 3.8, 0.4));
    const sl = mesh(new THREE.PlaneGeometry(3, 3.6), toon(sail, { side: THREE.DoubleSide }), 0, 4.2, 0.45); sl.rotation.y = Math.PI / 2; g.add(sl);
    g.userData.dyn = true; addOutlines(g); const ph = R() * 6; W.anim.push((t) => { if (!g.parent) return false; if (g.userData.riding) return; g.position.y = WATER_Y - 0.1 + Math.sin(t * 1.3 + ph) * 0.08; g.rotation.z = Math.sin(t * 0.9 + ph) * 0.03; });
    return g;
  };
  const pier = (parent, place, from, dir, len = 16) => {
    { // pick the nearest shoreline within +-90 degrees of the requested heading
      const a0 = Math.atan2(dir[0], dir[1]); let best = null;
      for (const da of [0, 0.5, -0.5, 1, -1, 1.5, -1.5]) { const dx0 = Math.sin(a0 + da), dz0 = Math.cos(a0 + da); const [qx, qz] = findShore(from[0], from[1], dx0, dz0); const dd = Math.hypot(qx - from[0], qz - from[1]) * (1 + Math.abs(da) * 0.15); if (!best || dd < best.d) best = { d: dd, dir: [dx0, dz0] }; }
      dir = best.dir;
    }
    const [sx, sz] = findShore(from[0], from[1], dir[0], dir[1]); const l = Math.hypot(dir[0], dir[1]); const dx = dir[0] / l, dz = dir[1] / l;
    const ex = sx + dx * len, ez = sz + dz * len; const y = Math.max(WATER_Y + 0.7, yAt(sx, sz) + 0.1);
    const g = new THREE.Group(); parent.add(g);
    const cx = (sx + ex) / 2 - dx * 1.5, cz = (sz + ez) / 2 - dz * 1.5; const deck = mesh(new THREE.BoxGeometry(3.2, 0.3, len + 3), toon('#9a7048'), cx, y - 0.15, cz); deck.rotation.y = Math.atan2(dx, dz); g.add(deck);
    for (let s = 0; s <= len; s += 4) for (const o of [-1.5, 1.5]) g.add(mesh(new THREE.CylinderGeometry(0.15, 0.15, 3, 6), woodD, sx + dx * s - dz * o, y - 1.4, sz + dz * s + dx * o));
    DECKS.push({ cx, cz, dir: [dx, dz], hl: (len + 3) / 2, hw: 1.6, y });
    W.docks[place] = { x: ex - dx * 2, z: ez - dz * 2, rot: Math.atan2(-dx, -dz), boat: [ex + dx * 3, ez + dz * 3, Math.atan2(dx, dz)] };
    const fb = boat(g, ex + dx * 1 - dz * 3.4, ez + dz * 1 + dx * 3.4, Math.atan2(dx, dz), 1.15, '#f4f0e0', '#5a3a22');
    const it = { kind: 'ferry', place, name: place === 'hargeon' ? 'Hargeon Ferry' : 'Ferry to Hargeon', x: ex - dx * 1.5, z: ez - dz * 1.5, r: 4.2, obj: fb };
    W.interactables.push(it); addOutlines(g); return g;
  };
  const train = (parent, x, z, rot, cars = 2) => {
    const g = new THREE.Group(); g.position.set(x, yAt(x, z) + 0.2, z); g.rotation.y = rot; parent.add(g);
    const body = toon('#2a3a5a'), trim = toon('#c8a040'), dark = toon('#1a1a22');
    g.add(mesh(new THREE.BoxGeometry(2.6, 1.0, 7), dark, 0, 0.9, 0));
    const boiler = mesh(new THREE.CylinderGeometry(1.1, 1.1, 5, 14), body, 0, 2.2, 1); boiler.rotation.x = Math.PI / 2; g.add(boiler);
    g.add(mesh(new THREE.BoxGeometry(2.6, 2.8, 2.6), body, 0, 2.6, -2.2)); g.add(mesh(new THREE.BoxGeometry(2.9, 0.25, 3), trim, 0, 4.1, -2.2));
    g.add(mesh(new THREE.CylinderGeometry(0.35, 0.5, 1.6, 8), dark, 0, 3.6, 2.6));
    const lac = mesh(new THREE.SphereGeometry(0.45, 10, 8), glow('#7ad8ff'), 0, 2.2, 3.6); g.add(lac);
    for (let c = 1; c <= cars; c++) { const cz = -2.2 - c * 7.4; g.add(mesh(new THREE.BoxGeometry(2.7, 2.8, 6.6), toon(c % 2 ? '#7a2a2a' : '#2a5a3a'), 0, 2.2, cz)); g.add(mesh(new THREE.BoxGeometry(2.9, 0.25, 6.8), trim, 0, 3.7, cz)); for (let w = -2; w <= 2; w++) for (const sx of [-1.36, 1.36]) g.add(mesh(new THREE.BoxGeometry(0.05, 0.8, 0.9), glow('#ffe8a0'), sx, 2.6, cz + w * 1.25)); }
    for (let k = 0; k < 4 + cars * 2; k++) for (const sx of [-1.2, 1.2]) { const wh = mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.25, 12), dark, sx, 0.55, 2.6 - k * 2.7); wh.rotation.z = Math.PI / 2; g.add(wh); }
    addOutlines(g); shadowAll(g, true, false); return g;
  };
  const railDir = (x, z) => { let best = 1e9, dir = 0; for (const l of RAILS_W) for (let i = 0; i < l.length - 1; i++) { const [x0, z0] = l[i], [x1, z1] = l[i + 1]; const vx = x1 - x0, vz = z1 - z0; const t = Math.max(0, Math.min(1, ((x - x0) * vx + (z - z0) * vz) / (vx * vx + vz * vz))); const d = Math.hypot(x - x0 - t * vx, z - z0 - t * vz); if (d < best) { best = d; dir = Math.atan2(vx, vz); } } return dir; };
  const station = (parent, place) => {
    const [x, z] = place.station.pos; const rot = railDir(x, z); const y = yAt(x, z);
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = rot; parent.add(g);
    g.add(mesh(new THREE.BoxGeometry(5, 0.7, 16), toon('#b8b0a4'), 3.6, 0.35, 0));
    for (const s of [-6, 0, 6]) { g.add(mesh(new THREE.CylinderGeometry(0.15, 0.15, 3.4, 6), woodD, 5.4, 2.4, s)); }
    const canopy = mesh(new THREE.BoxGeometry(3.4, 0.25, 15), toon('#7a2a2a'), 4.4, 4.1, 0); canopy.rotation.z = 0.12; g.add(canopy);
    const sg = mesh(new THREE.PlaneGeometry(4.4, 0.9), new THREE.MeshBasicMaterial({ map: textTexture(place.station.label.toUpperCase(), { font: 'bold 50px Georgia, serif' }), side: THREE.DoubleSide, fog: true }), 5.6, 3.2, 0); sg.rotation.y = Math.PI / 2; g.add(sg);
    const tk = new THREE.Group(); tk.position.set(4.6, 0.7, -5); g.add(tk); tk.add(mesh(new THREE.BoxGeometry(1.4, 1.2, 0.8), toon('#5a3a22'), 0, 0.6, 0)); tk.add(mesh(new THREE.SphereGeometry(0.25, 8, 6), glow('#7ad8ff'), 0, 1.45, 0));
    addOutlines(g); shadowAll(g, true, true);
    const wx = x + Math.cos(rot) * 3.6, wz = z - Math.sin(rot) * 3.6; // platform centre in world space
    const along = Math.abs(Math.sin(rot)) > Math.abs(Math.cos(rot));
    DECKS.push(along ? { minX: wx - 8, maxX: wx + 8, minZ: wz - 2.5, maxZ: wz + 2.5, y: y + 0.7 } : { minX: wx - 2.5, maxX: wx + 2.5, minZ: wz - 8, maxZ: wz + 8, y: y + 0.7 });
    const tx = x + Math.cos(rot) * 4.6 + Math.sin(rot) * -5, tz = z - Math.sin(rot) * 4.6 + Math.cos(rot) * -5;
    const it = { kind: 'rail', place: place.id, name: place.station.label, x: tx, z: tz, r: 4.2, obj: tk }; W.interactables.push(it);
    return g;
  };
  W.makeTrain = train; W.makeBoat = boat; W.yAt = yAt;
  // Railway track (instanced sleepers + rails)
  {
    const pts = []; for (const l of RAILS_W) for (let i = 0; i < l.length - 1; i++) { const [x0, z0] = l[i], [x1, z1] = l[i + 1]; const len = Math.hypot(x1 - x0, z1 - z0); for (let s = 0; s < len; s += 1.6) pts.push([x0 + (x1 - x0) * s / len, z0 + (z1 - z0) * s / len, Math.atan2(x1 - x0, z1 - z0)]); }
    const sl = new THREE.InstancedMesh(new THREE.BoxGeometry(2.6, 0.16, 0.5), toon('#5a4030'), pts.length);
    const rl = new THREE.InstancedMesh(new THREE.BoxGeometry(0.14, 0.16, 1.7), toon('#8a8a96'), pts.length * 2);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s1 = new THREE.Vector3(1, 1, 1), up = new THREE.Vector3(0, 1, 0);
    pts.forEach(([x, z, r], k) => { const y = height(x, z) + 0.12; q.setFromAxisAngle(up, r); p.set(x, y, z); m.compose(p, q, s1); sl.setMatrixAt(k, m);
      for (const o of [-0.75, 0.75]) { p.set(x + Math.cos(r) * o, y + 0.14, z - Math.sin(r) * o); m.compose(p, q, s1); rl.setMatrixAt(k * 2 + (o > 0 ? 1 : 0), m); } });
    sl.computeBoundingSphere(); rl.computeBoundingSphere(); scene.add(sl, rl); W.rails = [sl, rl];
  }
  // Magnolia: station, Kardia Cathedral, Lake Scilliora
  {
    const g = zoneGroup(20, -10, 90);
    station(g, PLACE.magnolia); { const [sx, sz] = PLACE.magnolia.station.pos, r = railDir(sx, sz); train(g, sx + Math.sin(r) * 16, sz + Math.cos(r) * 16, r, 2); }
    sign(g, -47, -16, 'Station ← · Crocus', Math.PI / 2); sign(g, 6, -47, 'Lake Scilliora ↑ Mt. Hakobe', 0); sign(g, 47, -21, 'Kardia · East Forest →', -Math.PI / 2); sign(g, 7, 48, 'Hargeon Port ↓', Math.PI);
    // Kardia Cathedral (door faces the town, west)
    const C = CATHEDRAL; const c = new THREE.Group(); c.position.set(C.x, 0.3, C.z); g.add(c);
    const wallC = toon('#eee4d0'), roofC = toon('#4a5a7a'), trimC = toon('#c8b890');
    c.add(mesh(new THREE.BoxGeometry(C.w, 9, C.d), wallC, 0, 4.5, 0));
    for (const s of [-1, 1]) { const rp = mesh(new THREE.BoxGeometry(C.w + 1, 0.4, C.d / 2 / Math.cos(0.7) + 0.6), roofC, 0, 9 + Math.tan(0.7) * C.d / 4, s * C.d / 4); rp.rotation.x = s * 0.7; c.add(rp); }
    for (const s of [-1, 1]) { const tw = new THREE.Group(); tw.position.set(-C.w / 2 + 1.6, 0, s * 3.4); c.add(tw); tw.add(mesh(new THREE.BoxGeometry(3.2, 15, 3.2), wallC, 0, 7.5, 0)); tw.add(mesh(new THREE.BoxGeometry(3.5, 0.4, 3.5), trimC, 0, 15, 0)); const sp = mesh(new THREE.ConeGeometry(2.4, 6, 4), roofC, 0, 18, 0); sp.rotation.y = Math.PI / 4; tw.add(sp); tw.add(mesh(new THREE.BoxGeometry(0.15, 1.8, 1.2), toon('#2a2a3a'), -1.62, 12, 0)); }
    const rose = mesh(new THREE.CircleGeometry(1.8, 16), glow('#8ab8ff'), -C.w / 2 - 0.05, 6.4, 0); rose.rotation.y = -Math.PI / 2; c.add(rose);
    c.add(mesh(new THREE.BoxGeometry(0.2, 4, 2.6), toon('#5a3a22'), -C.w / 2 - 0.05, 2, 0));
    for (let i = 0; i < 3; i++) c.add(mesh(new THREE.BoxGeometry(1.2, 0.25, 6 - i), trimC, -C.w / 2 - 1.8 + i * 0.5, 0.12 + i * 0.25 - 0.3, 0));
    for (const o of [-3, 3]) for (const zz of [-1, 1]) c.add(mesh(new THREE.BoxGeometry(0.2, 3.6, 1), glow('#a8c8ff'), -C.w / 2 + 5 + o + 3, 5, zz * (C.d / 2 + 0.05)));
    const crest = mesh(new THREE.TorusGeometry(0.8, 0.12, 6, 16), toon('#d8b040'), -C.w / 2 + 1.6, 22.4, 3.4); c.add(crest);
    addOutlines(c); shadowAll(c, true, true); solid(null, C.x, C.z, C.w, C.d, 'cathedral'); W.circles.push({ x: C.x - C.w / 2 + 1.6, z: C.z - 3.4, r: 2.2 }, { x: C.x - C.w / 2 + 1.6, z: C.z + 3.4, r: 2.2 });
    W.map.rects.push({ x: C.x, z: C.z, w: C.w, d: C.d, color: '#e0d8c8' });
    sign(g, C.x - C.w / 2 - 6, C.z + 5, 'KARDIA CATHEDRAL', -Math.PI / 2);
    // Lake Scilliora shore: jetty and rowboats
    const L = PLACE.scilliora.pos; const lg = zoneGroup(L[0], L[1] + 60, 40);
    const [jx, jz] = findShore(L[0], L[1] + 90, 0, -1, 120);
    hut(lg, jx + 8, jz + 6, 0.3, 5, 4, '#e8dcc0', '#3a6a9a'); sign(lg, jx - 5, jz + 4, 'LAKE SCILLIORA', 0);
    for (let i = 0; i < 3; i++) boat(lg, jx - 4 + i * 4, jz - 6 - i, 0.4 * i, 0.5, '#ffffff', '#3a5a8a');
  }
  // East Forest: Forest Vulcan camp
  { const E = PLACE.eastforest.pos; const g = zoneGroup(E[0], E[1], 70);
    for (let i = 0; i < 3; i++) { const a = i * 2.1; hut(g, E[0] + Math.cos(a) * 10, E[1] + Math.sin(a) * 10, a, 3.4, 3.4, '#7a6a42', '#5a4a2a'); }
    const fire = mesh(new THREE.ConeGeometry(0.7, 1.4, 8), glow('#ff8a2a'), E[0], yAt(E[0], E[1]) + 0.7, E[1]); fire.userData.dyn = true; g.add(fire); W.anim.push((t) => { fire.scale.y = 1 + Math.sin(t * 9) * 0.2; });
    sign(g, E[0] - 60, E[1] + 40, 'EAST FOREST', -0.9); }
  // Hargeon Port
  { const Hp = PLACE.hargeon.pos; const g = zoneGroup(Hp[0], Hp[1], 60); const y = yAt(Hp[0], Hp[1]);
    const roofs = [roofR, roofB, roofG, roofP, roofR, roofB];
    const spots = [[-14, -10, '+x', 'MAGIC SHOP'], [14, -12, '-x', 'TAVERN'], [-16, 8, '+x', null], [16, 6, '-x', 'HARBOUR MASTER'], [0, -22, '+z', null], [-24, -2, '+x', null]];
    spots.forEach(([dx, dz, door, s], i) => building({ x: Hp[0] + dx, z: Hp[1] + dz, w: 8, d: 7, h: 4.2, roof: roofs[i], door, sign: s, parent: g, y }));
    station(g, PLACE.hargeon); sign(g, Hp[0] + 6, Hp[1] - 30, 'HARGEON PORT', 0.6);
    pier(g, 'hargeon', [Hp[0], Hp[1]], [0, 1], 18);
    const d = W.docks.hargeon; for (let i = 0; i < 4; i++) boat(g, d.x + (i - 1.5) * 9 + 4, d.z + 10 + (i % 2) * 5, 0.2 * i, 0.9 + (i % 2) * 0.4, ['#f4ecd8', '#e86a4a', '#f4ecd8', '#4a7ad0'][i]);
    for (let i = 0; i < 6; i++) { const cx = Hp[0] - 6 + (i % 3) * 1.4, cz = Hp[1] + 14 + Math.floor(i / 3) * 1.4; g.add(mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), toon('#a8804a'), cx, yAt(cx, cz) + 0.6, cz)); }
    W.circles.push({ x: Hp[0] - 4.6, z: Hp[1] + 14.7, r: 2.4 });
    addOutlines(g); }
  // Mt. Hakobe: trailhead carriage stop, mountain hut and the Vulcan cave
  { const T = PLACE.hakobetrail.pos; const g = zoneGroup(T[0], T[1], 30); station(g, PLACE.hakobetrail); sign(g, T[0] - 8, T[1] - 14, 'MT. HAKOBE ↑', 0.5); hut(g, T[0] - 14, T[1] + 6, 0.4, 5, 4, '#9a7a52', '#5a3a2a');
    const Hk = PLACE.hakobe.pos; const h2 = zoneGroup(Hk[0], Hk[1], 50); hut(h2, Hk[0] + 18, Hk[1] + 14, -0.5, 4.5, 4, '#7a6048', '#e8eef4'); sign(h2, Hk[0] + 12, Hk[1] + 26, 'MT. HAKOBE SNOWFIELD', 0.4);
    const cave = mesh(new THREE.SphereGeometry(6, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), toon('#8a8a96'), Hk[0] - 22, yAt(Hk[0] - 22, Hk[1] - 20) - 0.5, Hk[1] - 20); cave.scale.set(1.4, 1, 1); h2.add(cave);
    const mouth = mesh(new THREE.CircleGeometry(2.8, 14, 0, Math.PI), toon('#14141c'), Hk[0] - 22, yAt(Hk[0] - 22, Hk[1] - 20) - 0.4, Hk[1] - 14.2); h2.add(mouth);
    W.circles.push({ x: Hk[0] - 22, z: Hk[1] - 20, r: 7.5 }); addOutlines(h2); }
  // Crocus outskirts: east gate, walls and the skyline of the Flower Capital
  { const Cc = toWorld(516, 337); const g = zoneGroup(Cc[0], Cc[1], 120); const R0 = 46; const y0 = yAt(...PLACE.crocus.pos);
    const wallM = toon('#e8dcc8'), roofC = toon('#d05a8a'), roofC2 = toon('#7a5ac0');
    const gateA = Math.atan2(PLACE.crocus.pos[1] - Cc[1], PLACE.crocus.pos[0] - Cc[0]);
    for (let a = 0; a < Math.PI * 2; a += 0.11) { if (Math.abs(Math.atan2(Math.sin(a - gateA), Math.cos(a - gateA))) < 0.09) continue; const x = Cc[0] + Math.cos(a) * R0, z = Cc[1] + Math.sin(a) * R0; const w = mesh(new THREE.BoxGeometry(5.4, 7, 2), wallM, x, yAt(x, z) + 3, z); w.rotation.y = -a + Math.PI / 2; g.add(w); W.circles.push({ x, z, r: 2.8 }); }
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) { const x = Cc[0] + Math.cos(a + 0.2) * R0, z = Cc[1] + Math.sin(a + 0.2) * R0; g.add(mesh(new THREE.CylinderGeometry(2.4, 2.6, 11, 8), wallM, x, yAt(x, z) + 5, z)); g.add(mesh(new THREE.ConeGeometry(3, 4, 8), roofC, x, yAt(x, z) + 12.5, z)); }
    const gx = Cc[0] + Math.cos(gateA) * R0, gz = Cc[1] + Math.sin(gateA) * R0; const gate = new THREE.Group(); gate.position.set(gx, yAt(gx, gz), gz); gate.rotation.y = -gateA + Math.PI / 2; g.add(gate);
    for (const s of [-1, 1]) { gate.add(mesh(new THREE.CylinderGeometry(2.2, 2.4, 13, 8), wallM, s * 5, 6.5, 0)); gate.add(mesh(new THREE.ConeGeometry(2.8, 4, 8), roofC, s * 5, 15, 0)); }
    gate.add(mesh(new THREE.BoxGeometry(8, 3, 2.4), wallM, 0, 9.5, 0)); gate.add(mesh(new THREE.BoxGeometry(6, 8, 0.5), toon('#7a4a2a'), 0, 4, 0.2));
    const banner = mesh(new THREE.PlaneGeometry(5, 1.1), new THREE.MeshBasicMaterial({ map: textTexture('CROCUS', { bg: '#5a2a5a', fg: '#ffe8f4' }), side: THREE.DoubleSide, fog: true }), 0, 9.6, 1.25); gate.add(banner);
    W.circles.push({ x: gx, z: gz, r: 4.6 });
    const skyline = [[0, 0, 7, 30, roofC2], [-14, -10, 3, 20, roofC], [12, -12, 3, 22, roofC], [16, 14, 3, 18, roofC], [0, -24, 3, 15, roofC], [-26, -4, 2.6, 13, roofC2], [26, 0, 2.6, 14, roofC2], [6, 20, 3, 12, roofC]];
    for (const [dx, dz, r, hh, rc] of skyline) { const x = Cc[0] + dx, z = Cc[1] + dz, yb = yAt(x, z); g.add(mesh(new THREE.CylinderGeometry(r, r * 1.08, hh, 10), wallM, x, yb + hh / 2, z)); g.add(mesh(new THREE.ConeGeometry(r * 1.25, r * 2, 10), rc, x, yb + hh + r, z)); }
    const pal = mesh(new THREE.BoxGeometry(22, 12, 14), wallM, Cc[0], yAt(...Cc) + 6, Cc[1]); g.add(pal); g.add(mesh(new THREE.SphereGeometry(6, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), toon('#8ad0c0'), Cc[0], yAt(...Cc) + 12, Cc[1]));
    // Domus Flau: the Grand Magic Games arena. Tiered stone bowl, four gates, guild-colour banners, lacrima vision screens.
    { const D = PLACE.domusflau.pos; const dy = yAt(...D); const dg = new THREE.Group(); dg.position.set(D[0], dy, D[1]); g.add(dg); const Ri = 10, Ro = 15, gates = 4;
      const stone = toon('#d8ccb4'), seat = toon('#b8a890'), trimG = toon('#c8a040');
      for (let k = 0; k < 5; k++) { const r0 = Ri + k * 1.2; const ring = mesh(new THREE.CylinderGeometry(r0 + 1.2, r0 + 1.2, 1.5 + k * 1.5, 40, 1, true), k % 2 ? seat : stone, 0, (1.5 + k * 1.5) / 2, 0); ring.material.side = THREE.DoubleSide; dg.add(ring);
        const top = mesh(new THREE.RingGeometry(r0, r0 + 1.2, 40), k % 2 ? stone : seat, 0, 1.5 + k * 1.5, 0); top.rotation.x = -Math.PI / 2; top.material.side = THREE.DoubleSide; dg.add(top); }
      const outer = mesh(new THREE.CylinderGeometry(Ro, Ro + 0.4, 10, 40, 1, true), stone, 0, 5, 0); outer.material.side = THREE.DoubleSide; dg.add(outer);
      for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2; dg.add(mesh(new THREE.BoxGeometry(1.2, 11, 1.2), toon('#efe4cc'), Math.cos(a) * (Ro + 0.5), 5.5, Math.sin(a) * (Ro + 0.5))); }
      { const tr = mesh(new THREE.TorusGeometry(Ro + 0.5, 0.35, 6, 48), trimG, 0, 10.6, 0); tr.rotation.x = Math.PI / 2; dg.add(tr); }
      const floor = mesh(new THREE.CircleGeometry(Ri, 40), toon('#c8b48a'), 0, 0.06, 0); floor.rotation.x = -Math.PI / 2; dg.add(floor);
      const ringL = mesh(new THREE.RingGeometry(Ri * 0.55, Ri * 0.6, 40), glow('#ffd76a', 0.7), 0, 0.09, 0); ringL.rotation.x = -Math.PI / 2; dg.add(ringL);
      const cols = ['#c83a3a', '#3a6ad0', '#e8c040', '#3aa060', '#a040c0', '#e8e8f0', '#e07a2a', '#2a2a3a'];
      for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2 + 0.1; const f = mesh(new THREE.PlaneGeometry(1.4, 2.6), toon(cols[i % 8], { side: THREE.DoubleSide }), Math.cos(a) * (Ro + 1.4), 12.4, Math.sin(a) * (Ro + 1.4)); f.rotation.y = -a + Math.PI / 2; dg.add(f); dg.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 4, 4), woodD, Math.cos(a) * (Ro + 1.4), 12, Math.sin(a) * (Ro + 1.4))); }
      for (let i = 0; i < gates; i++) { const a = i / gates * Math.PI * 2; const gx = Math.cos(a) * Ro, gz = Math.sin(a) * Ro; const ga = mesh(new THREE.BoxGeometry(4, 6, 3), toon('#7a4a2a'), gx, 3, gz); ga.rotation.y = -a; dg.add(ga); const arch = mesh(new THREE.TorusGeometry(2.4, 0.5, 6, 12, Math.PI), stone, gx * 1.02, 6, gz * 1.02); arch.rotation.y = -a + Math.PI / 2; dg.add(arch); }
      for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + Math.PI / 4; const sc = mesh(new THREE.PlaneGeometry(6, 3.4), glow('#7ad8ff', 0.55), Math.cos(a) * (Ri - 1), 9.5, Math.sin(a) * (Ri - 1)); sc.rotation.y = -a - Math.PI / 2; sc.material.side = THREE.DoubleSide; dg.add(sc); }
      const crowd = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.22, 0.4, 2, 6), new THREE.MeshLambertMaterial(), 360); const mm = new THREE.Matrix4(), cc = new THREE.Color();
      for (let i = 0; i < 360; i++) { const k = Math.floor(i / 72), a = (i % 72) / 72 * Math.PI * 2 + k * 0.3; const r0 = Ri + k * 1.2 + 0.6; mm.makeTranslation(Math.cos(a) * r0, 1.5 + k * 1.5 + 0.4, Math.sin(a) * r0); crowd.setMatrixAt(i, mm); crowd.setColorAt(i, cc.set(cols[i % 8]).offsetHSL(0, -0.2, (i % 3) * 0.08)); }
      crowd.userData.dyn = true; dg.add(crowd); W.anim.push((t) => { crowd.position.y = Math.abs(Math.sin(t * 6)) * 0.12; });
      const tb = mesh(new THREE.PlaneGeometry(8, 1.4), new THREE.MeshBasicMaterial({ map: textTexture('DOMUS FLAU', { bg: '#5a2a5a', fg: '#ffe8a0' }), side: THREE.DoubleSide, fog: true }), Math.cos(0) * (Ro + 0.2), 8.2, 0); tb.rotation.y = Math.PI / 2; dg.add(tb);
      for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2; if (Math.abs(Math.atan2(Math.sin(a * gates / 1), Math.cos(a * gates))) < 0.6) continue; W.circles.push({ x: D[0] + Math.cos(a) * (Ri + 3), z: D[1] + Math.sin(a) * (Ri + 3), r: 3.2 }); }
      W.arena = { x: D[0], z: D[1], r: Ri }; }
    sign(g, PLACE.crocus.pos[0] + 6, PLACE.crocus.pos[1] - 6, 'CROCUS · Gates open for the Grand Magic Games', -Math.PI / 2);
    station(g, PLACE.crocus); addOutlines(g); }
  // Oshibana Station (a big junction station on the Oshibana Line)
  { const O = PLACE.oshibana; const g = zoneGroup(O.pos[0], O.pos[1], 45); const rot = railDir(...O.station.pos); const y = yAt(...O.pos);
    station(g, O);
    const sx = O.pos[0] + Math.cos(rot) * 14, sz = O.pos[1] - Math.sin(rot) * 14;
    building({ x: sx, z: sz, w: 12, d: 10, h: 6, roof: roofR, door: '+z', sign: 'OSHIBANA STATION', parent: g, y });
    const clock = mesh(new THREE.BoxGeometry(2.6, 5, 2.6), toon('#e8dcc0'), sx, y + 8.5, sz); g.add(clock); g.add(mesh(new THREE.CircleGeometry(0.9, 16), toon('#ffffff'), sx, y + 9.5, sz + 1.32));
    train(g, O.station.pos[0] - Math.sin(rot) * 14, O.station.pos[1] - Math.cos(rot) * 14, rot + Math.PI, 3);
    for (let i = 0; i < 3; i++) { const bx = O.pos[0] - 14 + i * 6, bz = O.pos[1] + 16; hut(g, bx, bz, 0, 4, 4, '#d8c8a8', '#6a3a5a'); }
    sign(g, O.pos[0] - 20, O.pos[1] - 6, 'Onibus ↑ · Clover ↘', 0.8); addOutlines(g); }
  // Clover Town and the Guild Masters' meeting hall
  { const Cl = PLACE.clover.pos; const g = zoneGroup(Cl[0], Cl[1], 40); const y = yAt(...Cl);
    building({ x: Cl[0] - 4, z: Cl[1] - 16, w: 14, d: 10, h: 6, roof: roofP, door: '+z', sign: "GUILD MASTERS' HALL", parent: g, y });
    for (const [dx, dz, rc] of [[-18, 4, roofG], [-16, 16, roofR], [8, 14, roofB], [16, -6, roofG]]) building({ x: Cl[0] + dx, z: Cl[1] + dz, w: 7, d: 6, h: 3.8, roof: rc, door: dx < 0 ? '+x' : '-x', parent: g, y });
    station(g, PLACE.clover); sign(g, Cl[0] + 10, Cl[1] + 4, 'CLOVER CANYON →', -Math.PI / 2);
    addOutlines(g); }
  // Arena pillars (Clover Canyon) - the gap faces Clover Town
  { const g = zoneGroup(BOSS_ARENA.x, BOSS_ARENA.z, 30); const gap = Math.atan2(PLACE.clover.pos[1] - BOSS_ARENA.z, PLACE.clover.pos[0] - BOSS_ARENA.x);
    for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; if (Math.abs(Math.atan2(Math.sin(a - gap), Math.cos(a - gap))) < 0.42) continue; const x = BOSS_ARENA.x + Math.cos(a) * (BOSS_ARENA.r + 1), z = BOSS_ARENA.z + Math.sin(a) * (BOSS_ARENA.r + 1);
      const p = mesh(new THREE.CylinderGeometry(0.9, 1.3, 5 + R() * 4, 6), toon('#7a7068'), x, height(x, z) + 2.5, z); p.rotation.z = (R() - 0.5) * 0.2; g.add(p);
      const cr = mesh(new THREE.OctahedronGeometry(0.5, 0), glow('#ff8a3a'), x, height(x, z) + 6.8, z); g.add(cr); W.circles.push({ x, z, r: 1.2 }); }
    addOutlines(g); shadowAll(g); }
  // Story-boss arenas: Phantom Lord's guild (Oak Town) and the Tower of Heaven (off Akane Beach)
  for (const key of ['phantom', 'heaven']) {
    const A = BOSS_ARENAS[key]; const g = zoneGroup(A.x, A.z, 70); const [gx, gz] = A.gate; const gap = Math.atan2(gz - A.z, gx - A.x);
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; if (Math.abs(Math.atan2(Math.sin(a - gap), Math.cos(a - gap))) < 0.4) continue; const x = A.x + Math.cos(a) * (A.r + 1), z = A.z + Math.sin(a) * (A.r + 1);
      const hh = key === 'heaven' ? 7 : 6 + R() * 3; const p = mesh(new THREE.BoxGeometry(1.6, hh, 1.6), toon(A.pillar), x, A.h + hh / 2, z); p.rotation.y = -a; g.add(p);
      const cr = mesh(new THREE.OctahedronGeometry(0.55, 0), glow(A.gem), x, A.h + hh + 0.8, z); g.add(cr); W.circles.push({ x, z, r: 1.2 }); }
    // floor sigil
    const sig = mesh(new THREE.RingGeometry(A.r - 3, A.r - 2.4, 64), glow(A.gem), A.x, A.h + 0.06, A.z); sig.rotation.x = -Math.PI / 2; sig.material.transparent = true; sig.material.opacity = 0.5; g.add(sig);
    const bx = A.x - Math.cos(gap) * (A.r + 16), bz = A.z - Math.sin(gap) * (A.r + 16); const by = A.h;
    station(g, PLACE[key === 'phantom' ? 'oak' : 'akane']);
    if (key === 'phantom') {
      // Phantom Lord's fortress guild hall: a dark keep with six towers (it can walk; it chooses not to today)
      const wallM = toon('#3a3448'), roofM = toon('#24202e');
      const keep = mesh(new THREE.BoxGeometry(22, 14, 14), wallM, bx, by + 7, bz); keep.rotation.y = -gap + Math.PI / 2; g.add(keep);
      for (let k = 0; k < 6; k++) { const a = -gap + Math.PI / 2 + (k - 2.5) * 0.5; const tx = bx + Math.sin(a) * 13, tz = bz + Math.cos(a) * 13 * 0.6;
        const tw = mesh(new THREE.CylinderGeometry(1.8, 2.2, 20, 8), wallM, tx, by + 10, tz); g.add(tw);
        const cap = mesh(new THREE.ConeGeometry(2.6, 5, 8), roofM, tx, by + 22.5, tz); g.add(cap);
        const fl = mesh(new THREE.BoxGeometry(0.1, 1.6, 2.2), toon('#6a3a9a'), tx, by + 26, tz + 1.1); g.add(fl); W.circles.push({ x: tx, z: tz, r: 2.4 }); }
      const cannon = mesh(new THREE.CylinderGeometry(1.1, 1.5, 12, 10), toon('#2a2a30'), bx + Math.cos(gap) * 7, by + 12, bz + Math.sin(gap) * 7); cannon.rotation.z = Math.PI / 2; cannon.rotation.y = -gap; g.add(cannon);
      const muzzle = mesh(new THREE.SphereGeometry(0.9, 10, 8), glow('#9a5aff'), bx + Math.cos(gap) * 13, by + 12, bz + Math.sin(gap) * 13); g.add(muzzle);
      W.circles.push({ x: bx, z: bz, r: 11 });
      sign(g, gx, gz, 'PHANTOM LORD - KEEP OUT', -gap - Math.PI / 2);
    } else {
      // The Tower of Heaven: tiered black-stone tower, an Etherion-charged lacrima crystal at the top
      const stone = toon('#3e3e4c'), trim = toon('#6a6a7a'); let y = by, r0 = 13;
      for (let k = 0; k < 9; k++) { const hh = 9 - k * 0.4, r1 = r0 * 0.86; const t = mesh(new THREE.CylinderGeometry(r1, r0, hh, 12), k % 2 ? trim : stone, bx, y + hh / 2, bz); g.add(t); y += hh; r0 = r1; }
      const spire = mesh(new THREE.ConeGeometry(r0, 10, 12), stone, bx, y + 5, bz); g.add(spire);
      const crys = mesh(new THREE.OctahedronGeometry(4, 0), glow('#ffe08a'), bx, y + 14, bz); crys.scale.y = 1.8; g.add(crys); W.anim.push((t) => { crys.rotation.y = t * 0.6; crys.position.y = y + 14 + Math.sin(t * 1.3) * 0.6; });
      W.circles.push({ x: bx, z: bz, r: 13 });
      sign(g, gx, gz, 'TOWER OF HEAVEN', -gap - Math.PI / 2);
    }
    addOutlines(g); shadowAll(g);
  }
  // Sorcerer Weekly ranking boards: live guild fame in Magnolia's plaza and outside each rival guild hall
  W.fameBoards = [];
  const fameBoard = (x, z, rot, focus) => {
    const g = zoneGroup(x, z, 20); const y = yAt(x, z);
    for (const o of [-1.7, 1.7]) g.add(mesh(new THREE.CylinderGeometry(0.12, 0.14, 3.6, 6), woodD, x + Math.cos(rot) * o, y + 1.8, z - Math.sin(rot) * o));
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 384; const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    const bd = mesh(new THREE.PlaneGeometry(3.6, 2.7), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, fog: true }), x, y + 2.3, z); bd.rotation.y = rot; g.add(bd);
    const back = mesh(new THREE.BoxGeometry(3.8, 2.9, 0.1), woodD, x - Math.sin(rot) * 0.07, y + 2.3, z - Math.cos(rot) * 0.07); back.rotation.y = rot; g.add(back);
    W.circles.push({ x, z, r: 1 }); W.fameBoards.push({ cv, tex, focus });
  };
  W.setFame = (rows) => {
    for (const b of W.fameBoards) { const x = b.cv.getContext('2d'); x.fillStyle = '#f2e6c8'; x.fillRect(0, 0, 512, 384); x.strokeStyle = '#7a5a2a'; x.lineWidth = 10; x.strokeRect(5, 5, 502, 374);
      x.fillStyle = '#3a2414'; x.font = 'bold 34px Georgia, serif'; x.textAlign = 'center'; x.fillText('SORCERER WEEKLY', 256, 50); x.font = 'italic 20px Georgia, serif'; x.fillText('Strongest Guild in Fiore — this week', 256, 78);
      const max = Math.max(...rows.map((r) => r.fame)); x.textAlign = 'left';
      rows.slice(0, 6).forEach((r, i) => { const yy = 112 + i * 44; const me = r.id === b.focus; x.fillStyle = me ? '#ffe08a' : 'transparent'; x.fillRect(16, yy - 28, 480, 38);
        x.fillStyle = '#3a2414'; x.font = (me ? 'bold ' : '') + '24px Georgia, serif'; x.fillText(`${i + 1}. ${r.name}`, 28, yy); x.fillStyle = r.color || '#7a2a2a'; x.fillRect(270, yy - 18, 150 * r.fame / max, 18);
        x.fillStyle = '#3a2414'; x.font = '18px Georgia, serif'; x.fillText(Math.round(r.fame).toLocaleString(), 428, yy); });
      b.tex.needsUpdate = true; }
  };
  fameBoard(11, 9, -2.14, 'fairy');
  for (const [pid, key] of [['bluepegasus', 'pegasus'], ['lamiascale', 'lamia'], ['oak', 'phantom']]) { const P0 = PLACE[pid].pos; fameBoard(P0[0] + 6, P0[1] + 8, 0.3, key); }
  // Galuna Island: landing village and the Moon temple
  { const Gp = PLACE.galuna.pos; const g = zoneGroup(Gp[0], Gp[1], 110); const Hp = PLACE.hargeon.pos;
    pier(g, 'galuna', Gp, [Hp[0] - Gp[0], Hp[1] - Gp[1]], 14); const d = W.docks.galuna;
    const back = [Gp[0] - d.x, Gp[1] - d.z]; const bl = Math.hypot(...back); const bx = back[0] / bl, bz = back[1] / bl;
    for (let i = 0; i < 5; i++) { const s = 14 + (i % 2) * 7, o = (i - 2) * 7; hut(g, d.x + bx * s - bz * o, d.z + bz * s + bx * o, i, 3.6, 3.6, '#b89060', '#8a6a3a'); }
    sign(g, d.x + bx * 8 + bz * 4, d.z + bz * 8 - bx * 4, 'GALUNA VILLAGE', Math.atan2(-bx, -bz));
    const tx = Gp[0], tz = Gp[1], ty = yAt(tx, tz); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; g.add(mesh(new THREE.CylinderGeometry(0.8, 1, 8, 8), toon('#a8a090'), tx + Math.cos(a) * 9, ty + 3.5, tz + Math.sin(a) * 9)); W.circles.push({ x: tx + Math.cos(a) * 9, z: tz + Math.sin(a) * 9, r: 1.1 }); }
    { const ice = mesh(new THREE.IcosahedronGeometry(4.2, 1), new THREE.MeshPhongMaterial({ color: '#bfe8ff', transparent: true, opacity: 0.55, shininess: 90, emissive: '#204060' }), tx, ty + 4, tz); ice.scale.set(1, 1.5, 1); g.add(ice);
      const dem = new THREE.Group(); dem.position.set(tx, ty + 2, tz); g.add(dem); const dm = toon('#3a2a3a');
      dem.add(mesh(new THREE.BoxGeometry(2.2, 2.8, 1.4), dm, 0, 2.6, 0)); dem.add(mesh(new THREE.SphereGeometry(0.9, 10, 8), dm, 0, 4.6, 0)); for (const s of [-1, 1]) { dem.add(mesh(new THREE.ConeGeometry(0.25, 1.4, 6), toon('#e8e0c8'), s * 0.6, 5.6, 0)); dem.add(mesh(new THREE.BoxGeometry(0.7, 2.6, 0.7), dm, s * 1.6, 2.6, 0.2)); dem.add(mesh(new THREE.BoxGeometry(0.8, 2, 0.8), dm, s * 0.6, 0.6, 0)); }
      const beam = mesh(new THREE.CylinderGeometry(1.4, 2.8, 40, 16, 1, true), glow('#c8b0ff', 0.28), tx, ty + 20, tz); beam.material.side = THREE.DoubleSide; beam.userData.dyn = true; g.add(beam); W.anim.push((t) => { beam.material.opacity = 0.18 + Math.sin(t * 1.7) * 0.08; });
      W.circles.push({ x: tx, z: tz, r: 4.6 }); sign(g, tx + 11, tz + 3, 'MOON DRIP TEMPLE · Deliora sleeps in Iced Shell', 0); }
    for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; const px = d.x + bx * 17 + Math.cos(a) * 15, pz = d.z + bz * 17 + Math.sin(a) * 15; if (Math.abs(a - Math.atan2(-bz, -bx)) < 0.4) continue; g.add(mesh(new THREE.CylinderGeometry(0.25, 0.3, 3.4, 5), woodD, px, yAt(px, pz) + 1.5, pz)); }
    const moon = mesh(new THREE.TorusGeometry(3, 0.5, 8, 24, Math.PI * 1.3), glow('#b8a0ff'), tx, ty + 13, tz); moon.userData.dyn = true; g.add(moon); W.anim.push((t) => { moon.rotation.y = t * 0.3; });
    addOutlines(g); }
  // Tenrou Island: the great Tenrou tree
  { const Tp = PLACE.tenrou.pos; const g = zoneGroup(Tp[0], Tp[1], 120); const Hp = PLACE.hargeon.pos;
    pier(g, 'tenrou', Tp, [Hp[0] - Tp[0], Hp[1] - Tp[1]], 12);
    const ty = yAt(...Tp); g.add(mesh(new THREE.CylinderGeometry(4, 7, 70, 12), toon('#6a4a2a'), Tp[0], ty + 35, Tp[1])); W.circles.push({ x: Tp[0], z: Tp[1], r: 7 });
    for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; const r = 16 + (i % 3) * 5; const cr = mesh(new THREE.IcosahedronGeometry(12 + (i % 2) * 4, 1), toon('#4a8a3a'), Tp[0] + Math.cos(a) * r, ty + 62 + (i % 3) * 6, Tp[1] + Math.sin(a) * r); g.add(cr); }
    g.add(mesh(new THREE.IcosahedronGeometry(18, 1), toon('#5a9a44'), Tp[0], ty + 82, Tp[1]));
    const d = W.docks.tenrou; sign(g, d.x + (Tp[0] - d.x) * 0.15, d.z + (Tp[1] - d.z) * 0.15, 'TENROU ISLAND', 0);
    addOutlines(g); }
  // Minor places: sign + a couple of houses
  for (const p of PLACES.filter((q) => q.minor)) { const g = zoneGroup(p.pos[0], p.pos[1], 20); const y = yAt(...p.pos);
    if (p.id === 'bluepegasus' || p.id === 'lamiascale') building({ x: p.pos[0], z: p.pos[1], w: 11, d: 9, h: 5.5, roof: p.id === 'bluepegasus' ? roofB : roofG, door: '+z', sign: p.id === 'bluepegasus' ? 'BLUE PEGASUS' : 'LAMIA SCALE', parent: g, y });
    else { hut(g, p.pos[0] - 6, p.pos[1], 0, 5, 4, '#e8dcc0', '#a04a3a'); hut(g, p.pos[0] + 6, p.pos[1] + 2, 0.3, 5, 4, '#e8dcc0', '#3a5aa0'); }
    sign(g, p.pos[0], p.pos[1] + 9, p.name.toUpperCase(), 0); }
  // Arrival signposts for the big open zones
  for (const id of ['scilliora', 'hakobe', 'canyon']) { const p = PLACE[id]; const dx = -p.pos[0], dz = -p.pos[1], l = Math.hypot(dx, dz) || 1; const x = p.pos[0] + dx / l * p.r * 0.8, z = p.pos[1] + dz / l * p.r * 0.8; if (!blockedAt(x, z) && id !== 'scilliora') sign(scene, x, z, p.name.toUpperCase(), Math.atan2(dx, dz)); }

  // ---------------- Gathering nodes ----------------
  for (const pl of NODE_PLACEMENT) {
    const [cx, cz] = pl.at || PLACE[pl.place].pos;
    for (let i = 0; i < pl.n; i++) {
      let x, z, tries = 0;
      do { const a = R() * Math.PI * 2, r = (pl.min || 6) + R() * (pl.spread - (pl.min || 6)); x = cx + Math.cos(a) * r; z = cz + Math.sin(a) * r; tries++; }
      while ((blockedAt(x, z) || height(x, z) < WATER_Y + 0.6 || W.keepOut(x, z, 2) || distToLines(ROADS_W, x, z) < 4 || W.nodes.some((n) => Math.hypot(n.x - x, n.z - z) < 5)) && tries < 80);
      const obj = buildNode(pl.type, pl.tier); obj.position.set(x, height(x, z), z); obj.rotation.y = R() * 6; scene.add(obj);
      const node = { kind: 'node', type: pl.type, tier: pl.tier, name: NODE_TYPES[pl.type].names[pl.tier - 1], x, z, r: pl.type === 'wood' ? 2.6 : 2.4, obj, uses: NODE_TIERS[pl.tier].uses, respawn: 0 };
      W.nodes.push(node); W.interactables.push(node);
      W.circles.push({ x, z, r: pl.type === 'wood' ? 0.6 : pl.type === 'ore' ? 1.1 : 0.7, node });
    }
  }

  // ---------------- Round 3 regions: Era, Worth Woodsea, interiors + props ----------------
  buildRegions({ W, scene, zoneGroup, station, sign, yAt, R, addBox, building, decks: DECKS, textTexture, roofR, roofB, roofG, roofP });
  const TOWNFLAT = FLAT.filter((f) => !f.rect && f.r >= 26 && f.r <= 45).map((f) => ({ x: f.x, z: f.z, r: f.r * 0.95 }));
  if (GFX.high) { let near = [];
    W.grass = new Grass(scene, { height: groundAt, count: GFX.real ? 22000 : 9000, radius: GFX.real ? 46 : 34,
      prepare: (cx, cz, r) => { const pad = 1.2; near = [...W.boxes, ...(W.noGrass || []), ...DECKS.filter((d) => !d.dir)].filter((b) => b.maxX > cx - r - pad && b.minX < cx + r + pad && b.maxZ > cz - r - pad && b.minZ < cz + r + pad)
        .concat(W.circles.filter((c) => c.r > 0.9 && Math.abs(c.x - cx) < r + c.r && Math.abs(c.z - cz) < r + c.r).map((c) => ({ minX: c.x - c.r * 0.8, maxX: c.x + c.r * 0.8, minZ: c.z - c.r * 0.8, maxZ: c.z + c.r * 0.8 }))); },
      accept: (x, z) => { const b = biomeAt(x, z); if (b !== 1 && b !== 2) return 0; const h = height(x, z); if (h < WATER_Y + 0.5 || h > 16) return 0; if (inTownPad(x, z, -2)) return 0; for (const f of TOWNFLAT) if (Math.hypot(x - f.x, z - f.z) < f.r) return 0; if (distToLines(ROADS_W, x, z) < 2.2 || distToLines(RAILS_W, x, z) < 2) return 0;
        for (const b2 of near) if (x > b2.minX - 0.6 && x < b2.maxX + 0.6 && z > b2.minZ - 0.6 && z < b2.maxZ + 0.6) return 0; return b === 2 ? 0.7 : 1; } }); }

  // ---------------- Bake static geometry ----------------
  for (const it of W.interactables) if (it.obj) it.obj.userData.dyn = true;
  for (const z of W.groups) bakeStatic(z.g);
  {
    const keep = new Set([W.sky, W.water, W.realSky, W.foam, ...W.groups.map((z) => z.g), ...(W.rails || [])]);
    const town = new THREE.Group(); const movers = scene.children.filter((o) => !keep.has(o) && !o.isLight && (o.isMesh || o.isGroup) && !o.userData.dyn);
    for (const o of movers) town.add(o); scene.add(town); bakeStatic(town);
  }

  // ---------------- Town NPCs ----------------
  W.npcs = {};
  for (const [id, n] of Object.entries(NPCS)) {
    const c = n.model ? buildMob(n.model, n.model === 'cat' ? { fur: n.fur, hat: false, bag: '#3aa05a', wings: true, happy: n.happy, belly: '#ffffff' } : {}) : buildCharacter(n.look); const [x, z] = n.pos;
    if (n.model) c.parts.head = c.parts.body;
    c.group.position.set(x, n.y ?? (z > HALL.minZ && z < HALL.maxZ && Math.abs(x) < HALL.maxX ? 0.5 : groundAt(x, z)), z);
    const f = n.face || [0, 6]; c.group.lookAt(f[0], c.group.position.y, f[1]);
    scene.add(c.group);
    const it = { kind: 'npc', npc: id, name: n.name, x, z, r: 3.6, obj: c.group, char: c };
    W.npcs[id] = it; W.interactables.push(it); W.circles.push({ x, z, r: 0.5 });
  }

  // ---------------- Snow on Mt. Hakobe ----------------
  {
    const N = GFX.high ? 1600 : 600; const pg = new THREE.BufferGeometry(); const pp = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) pp.set([(R() - 0.5) * 60, R() * 30, (R() - 0.5) * 60], i * 3);
    pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
    const snow = new THREE.Points(pg, new THREE.PointsMaterial({ color: '#ffffff', size: 0.22, transparent: true, opacity: 0.9, depthWrite: false }));
    snow.visible = false; snow.frustumCulled = false; scene.add(snow); W.snow = snow;
  }

  W.update = (t, playerPos) => {
    if (W.anim.length) W.anim = W.anim.filter((f) => f(t) !== false);
    W.terrain.update(playerPos.x, playerPos.z, 2);
    if (W.grass) W.grass.update(playerPos.x, playerPos.z);
    for (const c of W.cutaways || []) c.g.visible = !(playerPos.x > c.minX && playerPos.x < c.maxX && playerPos.z > c.minZ && playerPos.z < c.maxZ);
    for (const l of W.interiorLights || []) { const d = Math.hypot(playerPos.x - l.position.x, playerPos.z - l.position.z); l.userData.base ??= l.intensity; l.intensity = d < 70 ? l.userData.base * Math.min(1, (70 - d) / 20) : 0; }
    const vis = scene.fog.far + 30; for (const z of W.groups) z.g.visible = Math.hypot(playerPos.x - z.x, playerPos.z - z.z) < z.r + vis;
    W.water.position.set(Math.round(playerPos.x / 50) * 50, WATER_Y, Math.round(playerPos.z / 50) * 50);
    for (const id in W.npcs) { const it = W.npcs[id]; const d = Math.hypot(playerPos.x - it.x, playerPos.z - it.z); if (d > 120) continue; if (it.char.parts.wing1) { const b = it.char.parts.body; b.position.y = Math.sin(t * 3) * 0.12; it.char.parts.wing1.rotation.z = 0.5 + Math.sin(t * 18) * 0.5; it.char.parts['wing-1'].rotation.z = -0.5 - Math.sin(t * 18) * 0.5; } else if (it.npc === 'plue') { const b = it.char.parts.body; b.position.x = Math.sin(t * 40) * 0.012; b.rotation.z = Math.sin(t * 33) * 0.04; } else if (it.char.parts.armL && d < 60) animateCharacter(it.char, { t: t + it.x, move: 0, atk: -1, cast: 0, look: d < 6 ? Math.max(-0.6, Math.min(0.6, Math.sin(t * 0.7 + it.x) * 0.3)) : 0 }); else it.char.parts.head.rotation.y = 0; }
    if (GFX.shadows) { W.sun.position.set(playerPos.x + 30, playerPos.y + 60, playerPos.z + 20); W.sun.target.position.set(playerPos.x, playerPos.y, playerPos.z); }
    W.sky.position.set(playerPos.x, playerPos.y, playerPos.z); if (W.realSky) W.realSky.position.set(playerPos.x, 0, playerPos.z); if (W.foam) W.foam.position.set(Math.round(playerPos.x / 50) * 50, WATER_Y + 0.03, Math.round(playerPos.z / 50) * 50);
    // snowfall + whiter fog in the snowfield
    const snowy = playerPos.z < -400 && biomeAt(playerPos.x, playerPos.z) !== 0 && (height(playerPos.x, playerPos.z) > 14 || Math.hypot(playerPos.x - PLACE.hakobe.pos[0], playerPos.z - PLACE.hakobe.pos[1]) < 140);
    W.snow.visible = snowy;
    if (snowy) { W.snow.position.set(playerPos.x, playerPos.y - 4, playerPos.z); const a = W.snow.geometry.attributes.position; for (let i = 0; i < a.count; i++) { let y = a.getY(i) - 0.06; if (y < 0) y += 30; a.setY(i, y); a.setX(i, a.getX(i) + Math.sin(t + i) * 0.01); } a.needsUpdate = true; }
    const fog = scene.fog; const k = snowy ? 0.55 : 1; fog.near += (W.fogBase.near * k - fog.near) * 0.05; fog.far += (W.fogBase.far * (snowy ? 0.7 : 1) - fog.far) * 0.05; fog.color.lerp(snowy ? W.fogBase.snow : W.fogBase.color, 0.05);
  };
  W.flush = (x, z) => W.terrain.flush(x, z);
  return W;
}

