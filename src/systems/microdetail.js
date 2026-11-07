// Ported from Aerondel Lite (js/realism.js): Realistic-tier-only surface detail.
// - Object-space triplanar micro-normals from a procedural noise texture (0 bytes download), fading with distance.
// - World-space micro-normals for static world props (stone/bark/wood/ground props).
// - Per-surface roughness/clearcoat tuning (eyes, metal, horn, wet) by mesh/material name.
// Low and High never call any of this: GFX.real gates every entry point, so phones on Low pay nothing.
import * as THREE from 'three';
import { GFX } from '../world/toon.js';

let NOISE = null;
export function microNoise() {
  if (NOISE) return NOISE;
  const N = 128, d = new Uint8Array(N * N * 4); let s = 1337; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const g = new Float32Array(N * N); for (let i = 0; i < g.length; i++) g[i] = r();
  const at = (x, y) => g[((y + N) % N) * N + ((x + N) % N)];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const v = (at(x, y) * 4 + at(x + 1, y) + at(x - 1, y) + at(x, y + 1) + at(x, y - 1)) / 8, i = (y * N + x) * 4;
    d[i] = v * 255; d[i + 1] = at(x * 3, y * 5) * 255; d[i + 2] = at(x * 7, y * 2) * 255; d[i + 3] = 255;
  }
  NOISE = new THREE.DataTexture(d, N, N); NOISE.wrapS = NOISE.wrapT = THREE.RepeatWrapping; NOISE.magFilter = THREE.LinearFilter;
  NOISE.minFilter = THREE.LinearMipmapLinearFilter; NOISE.generateMipmaps = true; NOISE.needsUpdate = true; return NOISE;
}

// surface kinds: [roughness, metalness, clearcoat, ccRough, micro strength, scale(1/m)]
export const KINDS = {
  skin: [0.52, 0, 0.10, 0.55, 0.10, 38], hair: [0.55, 0, 0, 0, 0.20, 70], cloth: [0.82, 0, 0, 0, 0.22, 48],
  leather: [0.58, 0, 0.25, 0.5, 0.28, 30], metal: [0.32, 0.9, 0, 0, 0.10, 60], horn: [0.40, 0, 0.45, 0.25, 0.15, 30],
  eye: [0.10, 0, 1.0, 0.03, 0, 1], wet: [0.30, 0, 0.6, 0.1, 0.05, 40], fur: [0.85, 0, 0, 0, 0.35, 55],
  hide: [0.62, 0, 0.12, 0.6, 0.20, 22], stone: [0.88, 0, 0, 0, 0.5, 4], bark: [0.92, 0, 0, 0, 0.45, 9],
  wood: [0.78, 0, 0.05, 0.6, 0.35, 10], other: [0.85, 0, 0, 0, 0.22, 6],
};
export function surfaceKind(name = '', hint = 'cloth') {
  const n = name.toLowerCase();
  if (/eye|iris|pupil/.test(n)) return 'eye';
  if (/metal|steel|iron|gold|silver|blade|armor|armour/.test(n)) return 'metal';
  if (/horn|tooth|teeth|claw|tusk|nail/.test(n)) return 'horn';
  if (/tongue|mouth|lip/.test(n)) return 'wet';
  if (/belt|strap|leather|boot/.test(n)) return 'leather';
  if (/hair|brow/.test(n)) return 'hair';
  if (/skin|face|head|hand/.test(n)) return 'skin';
  if (/bark|trunk/.test(n)) return 'bark';
  if (/wood|plank|beam/.test(n)) return 'wood';
  if (/rock|stone|cliff|wall/.test(n)) return 'stone';
  return hint;
}

const MICRO_GLSL = (space, near, far) => `#include <normal_fragment_maps>
{
  float md = length(cameraPosition - vMicroW);
  float mk = microK * (1.0 - smoothstep(${near.toFixed(1)}, ${far.toFixed(1)}, md));
  if (mk > 0.003) {
    vec3 p = ${space} * microS;
    vec3 w = pow(abs(normal), vec3(4.0)); w /= (w.x + w.y + w.z + 1e-4);
    vec2 g = (texture2D(tMicro, p.yz).rg - 0.5) * w.x + (texture2D(tMicro, p.xz).rg - 0.5) * w.y + (texture2D(tMicro, p.xy).rg - 0.5) * w.z;
    g += (texture2D(tMicro, p.xy * 3.1 + 0.3).gb - 0.5) * 0.5;
    vec3 t = normalize(cross(normal, vec3(0.0, 1.0, 0.07))), bt = cross(normal, t);
    normal = normalize(normal + (t * g.x + bt * g.y) * mk * 2.0);
  }
}`;

// Chain a micro-normal patch onto a material, keeping any existing onBeforeCompile (toon detail, wind, sheen...).
export function addMicro(mat, strength, scale, world = false) {
  if (!mat || mat.userData.micro || !strength || !mat.isMeshStandardMaterial) return false;
  const U = { tMicro: { value: microNoise() }, microK: { value: strength }, microS: { value: scale } };
  mat.userData.micro = U;
  const prev = mat.onBeforeCompile, prevKey = mat.customProgramCacheKey ? mat.customProgramCacheKey.bind(mat) : () => '';
  mat.onBeforeCompile = (sh, r) => {
    if (prev) prev.call(mat, sh, r);
    Object.assign(sh.uniforms, U);
    if (!sh.fragmentShader.includes('#include <normal_fragment_maps>')) return;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vMicroP; varying vec3 vMicroW;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvMicroP = position;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvMicroW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vMicroP; varying vec3 vMicroW; uniform sampler2D tMicro; uniform float microK; uniform float microS;')
      .replace('#include <normal_fragment_maps>', world ? MICRO_GLSL('vMicroW', 18, 45) : MICRO_GLSL('vMicroP', 10, 28));
  };
  mat.customProgramCacheKey = () => prevKey() + (world ? '|wmicro' : '|micro');
  mat.needsUpdate = true;
  return true;
}

// --- Aerondel smoothGeometry: crease-aware smooth normals on a cached clone (originals untouched for Low/High) ---
const smoothCache = new WeakMap();
export function smoothGeometry(geo, creaseDeg = 60) {
  if (!geo || !geo.attributes.position || !geo.attributes.normal) return geo;
  const ck = smoothCache.get(geo); if (ck && ck[creaseDeg]) return ck[creaseDeg];
  const g = geo.clone(), pos = g.attributes.position, n = pos.count, idx = g.index ? g.index.array : null, tri = idx ? idx.length / 3 : n / 3;
  const fn = new Float32Array(tri * 3), vf = Array.from({ length: n }, () => []);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (let t = 0; t < tri; t++) {
    const i0 = idx ? idx[t * 3] : t * 3, i1 = idx ? idx[t * 3 + 1] : t * 3 + 1, i2 = idx ? idx[t * 3 + 2] : t * 3 + 2;
    a.fromBufferAttribute(pos, i0); b.fromBufferAttribute(pos, i1); c.fromBufferAttribute(pos, i2); c.sub(b); a.sub(b); c.cross(a);
    fn[t * 3] = c.x; fn[t * 3 + 1] = c.y; fn[t * 3 + 2] = c.z; vf[i0].push(t); vf[i1].push(t); vf[i2].push(t);
  }
  const groups = new Map();
  for (let i = 0; i < n; i++) { const k = `${Math.round(pos.getX(i) * 1e4)},${Math.round(pos.getY(i) * 1e4)},${Math.round(pos.getZ(i) * 1e4)}`; let l = groups.get(k); if (!l) groups.set(k, l = []); l.push(i); }
  const cos = Math.cos(creaseDeg * Math.PI / 180), out = new Float32Array(n * 3), own = new THREE.Vector3(), sm = new THREE.Vector3(), f = new THREE.Vector3();
  for (const l of groups.values()) {
    const faces = []; for (const i of l) for (const t of vf[i]) faces.push(t);
    for (const i of l) {
      own.set(0, 0, 0); for (const t of vf[i]) { own.x += fn[t * 3]; own.y += fn[t * 3 + 1]; own.z += fn[t * 3 + 2]; }
      if (own.lengthSq() < 1e-20) { own.fromBufferAttribute(geo.attributes.normal, i); } own.normalize(); sm.set(0, 0, 0);
      for (const t of faces) { f.set(fn[t * 3], fn[t * 3 + 1], fn[t * 3 + 2]); const L = f.length(); if (L > 0 && f.dot(own) / L >= cos) sm.add(f); }
      if (sm.lengthSq() < 1e-20) sm.copy(own); sm.normalize(); out[i * 3] = sm.x; out[i * 3 + 1] = sm.y; out[i * 3 + 2] = sm.z;
    }
  }
  g.setAttribute('normal', new THREE.BufferAttribute(out, 3)); g.userData.smoothed = creaseDeg;
  smoothCache.set(geo, { ...(ck || {}), [creaseDeg]: g }); return g;
}
// Kinds that keep their crisp facets (stylised rocks, armour plates, horn ridges).
export const CREASE = { skin: 70, hair: 55, cloth: 60, fur: 75, hide: 60, leather: 50, wet: 70, eye: 80, metal: 0, horn: 0, stone: 0, bark: 0, wood: 0, other: 0 };

// --- Aerondel richMaterial parity: MeshPhysicalMaterial with per-surface sheen/clearcoat ---
const SHEEN = { skin: [0.35, 0.45], fur: [1.0, 0.35], hair: [0.8, 0.25], cloth: [0.7, 0.6], leather: [0.15, 0.6], hide: [0.1, 0.55] };
const SKIN_SHEEN = new THREE.Color(0xff9a80), WHITE = new THREE.Color(1, 1, 1);
export function toPhysical(m, kind) {
  if (!m || !m.isMeshStandardMaterial || m.isMeshPhysicalMaterial || m.userData.micro) return m;
  if (m.userData.phys) return m.userData.phys;
  const p = new THREE.MeshPhysicalMaterial();
  THREE.MeshStandardMaterial.prototype.copy.call(p, m);
  p.defines = { ...(m.defines || {}), STANDARD: '', PHYSICAL: '' };
  p.onBeforeCompile = m.onBeforeCompile; if (m.customProgramCacheKey !== THREE.Material.prototype.customProgramCacheKey) p.customProgramCacheKey = m.customProgramCacheKey;
  p.userData = { ...m.userData };
  const sh = SHEEN[kind]; if (sh && !(p.sheen > 0)) { p.sheen = sh[0]; p.sheenRoughness = sh[1]; p.sheenColor.copy(kind === 'skin' ? SKIN_SHEEN : WHITE).lerp(p.color, kind === 'skin' ? 0.3 : 0.6); }
  p.specularIntensity = kind === 'fur' || kind === 'cloth' ? 0.35 : 0.5;
  m.userData.phys = p; return p;
}

function tune(mat, kind) {
  const [r, me, cc, ccr] = KINDS[kind];
  if (mat.userData.tuned) return; mat.userData.tuned = kind;
  if (kind === 'eye' || kind === 'metal' || kind === 'horn' || kind === 'wet') { mat.roughness = r; mat.metalness = me; }
  if (mat.isMeshPhysicalMaterial && cc > 0 && !mat.clearcoat) { mat.clearcoat = cc; mat.clearcoatRoughness = ccr; }
}

// Characters, NPCs, monsters, creatures (object-space detail, scaled to the object's real height).
export function realifyActor(obj, hint = 'cloth', height = 1.75) {
  if (!GFX.real || !obj) return 0;
  const bb = new THREE.Box3().setFromObject(obj), ext = Math.max(1e-3, bb.max.y - bb.min.y);
  const unit = height > 0 ? 1 : 1 / ext; let n = 0;
  obj.traverse((o) => {
    if (!o.isMesh || o.userData.noMicro || o.isInstancedMesh) return;
    const first = [].concat(o.material)[0]; if (!first || first.transparent) return;
    const kind0 = surfaceKind(first.name || o.name, hint);
    if (CREASE[kind0] && o.geometry && !o.isSkinnedMesh && !o.geometry.userData.smoothed && !o.userData.faceted) o.geometry = smoothGeometry(o.geometry, CREASE[kind0]);
    const up = (m) => {
      const kind = surfaceKind(m.name || o.name, hint), p = toPhysical(m, kind); tune(p, kind);
      const [, , , , k, s] = KINDS[kind]; if (addMicro(p, k, s * unit)) n++; return p;
    };
    o.material = Array.isArray(o.material) ? o.material.map(up) : up(o.material);
  });
  return n;
}

// Static world: one pass after the world is built (materials are shared, so cost is per material, not per prop).
export function realifyWorld(root) {
  if (!GFX.real || !root) return 0; let n = 0;
  root.traverse((o) => {
    if (!o.isMesh || o.userData.dyn || o.isInstancedMesh && o.count > 4000) return;
    for (const m of [].concat(o.material)) {
      if (!m || m.transparent || m.userData.micro || m.userData.noMicro) continue;
      const kind = surfaceKind(m.name || o.name, 'other'); if (!['stone', 'bark', 'wood', 'other', 'metal'].includes(kind)) continue;
      tune(m, kind); const [, , , , k, s] = KINDS[kind];
      if (addMicro(m, k * 0.8, s, true)) n++;
    }
  });
  return n;
}
