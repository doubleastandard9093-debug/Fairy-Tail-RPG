// Realistic-only Fiore wilderness dressing with Aerondel Lite's CC0 Kenney models (public/models, see CREDITS.md).
// Bounded: <= MAX instances, wilderness only (never inside Magnolia, named places/landmarks, roads, rails, water),
// shared geometry/materials per file, crease-safe smoothing + world micro detail via microdetail.js.
// Low/High never import-run this (GFX.real gate in game.js); a failed fetch just leaves the procedural world.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { smoothGeometry, realifyWorld } from '../systems/microdetail.js';

export const MAX = 360;
export const KINDS = {
  broadleaf: { v: ['nature/broadleaf_a', 'nature/broadleaf_b', 'nature/broadleaf_c', 'nature/broadleaf_d'], h: [5.5, 8.5], crease: 80 },
  pine: { v: ['nature/pine_a', 'nature/pine_b', 'nature/pine_c', 'nature/pine_d'], h: [6, 10], crease: 55 },
  bush: { v: ['nature/bush_a', 'nature/bush_b', 'nature/bush_c'], h: [0.8, 1.4], crease: 80 },
  rock: { v: ['nature/rock_a', 'nature/rock_b', 'nature/rock_c', 'nature/rock_d'], h: [0.8, 2.4], crease: 0 },
};
const ALL_FILES = Object.values(KINDS).flatMap((k) => k.v);
export const files = () => ALL_FILES.slice();

// Pure placement (testable without WebGL). env: { rand, groundAt, blockedAt, placeAt, roadDist, forestAt, biomeAt, waterY, center }
export function planScenery(env, max = MAX) {
  const out = [], { rand } = env; let tries = 0;
  while (out.length < max && tries++ < max * 30) {
    const a = rand() * Math.PI * 2, r = 70 + Math.sqrt(rand()) * 430, x = env.center[0] + Math.cos(a) * r, z = env.center[1] + Math.sin(a) * r;
    if (env.blockedAt(x, z) || env.placeAt(x, z) || env.roadDist(x, z) < 7) continue;
    const y = env.groundAt(x, z); if (y < env.waterY + 0.4) continue;
    if (out.some((o) => Math.abs(o.x - x) < 3 && Math.abs(o.z - z) < 3)) continue;
    const f = env.forestAt(x, z), b = env.biomeAt(x, z), hi = b === 3 || b === 4;
    const roll = rand();
    const kind = roll < f * 0.8 ? (hi || rand() < 0.35 ? 'pine' : 'broadleaf') : roll < 0.55 ? 'bush' : hi || roll < 0.8 ? 'rock' : null;
    if (!kind) continue;
    const K = KINDS[kind]; out.push({ kind, file: K.v[Math.floor(rand() * K.v.length)], x, y, z, h: K.h[0] + rand() * (K.h[1] - K.h[0]), rot: rand() * Math.PI * 2 });
  }
  return out;
}

export async function addScenery(scene, env, base) {
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder), cache = new Map(), plan = planScenery(env);
  const load = (f) => { if (!cache.has(f)) cache.set(f, loader.loadAsync(`${base}models/${f}.glb`).then((g) => prep(g.scene, f)).catch((e) => { console.warn('[scenery]', f, e?.message); return null; })); return cache.get(f); };
  const root = new THREE.Group(); root.name = 'kenney-scenery'; scene.add(root); let placed = 0;
  await Promise.all([...new Set(plan.map((p) => p.file))].map(load));
  for (const p of plan) {
    const src = await load(p.file); if (!src) continue;
    const o = src.obj.clone(); o.scale.setScalar(p.h / src.h); o.position.set(p.x, p.y - 0.05, p.z); o.rotation.y = p.rot; o.matrixAutoUpdate = false; o.updateMatrix();
    root.add(o); placed++;
  }
  realifyWorld(root);
  return { planned: plan.length, placed, files: cache.size, root };
}

function prep(obj, file) {
  const kind = Object.keys(KINDS).find((k) => KINDS[k].v.includes(file)), crease = KINDS[kind].crease;
  obj.traverse((o) => {
    if (!o.isMesh) return; o.castShadow = kind !== 'bush'; o.receiveShadow = kind !== 'bush';
    if (crease && o.geometry) o.geometry = smoothGeometry(o.geometry, crease);
    for (const m of [].concat(o.material)) { if (/leaf|leafs/i.test(m.name || '')) m.name = 'leaf'; else if (/wood|bark|trunk/i.test(m.name || '')) m.name = 'bark ' + m.name; else if (kind === 'rock') m.name = 'stone ' + (m.name || ''); }
  });
  const bb = new THREE.Box3().setFromObject(obj); return { obj, h: Math.max(0.1, bb.max.y - bb.min.y) };
}
