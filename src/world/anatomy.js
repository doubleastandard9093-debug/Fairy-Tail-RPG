// Fairy Tail already has the articulated layer (detail.js refineCharacter: deltoids, clavicles, elbows, 5-finger
// hands, knees, faces, boots) on every tier. What Aerondel adds on top, and this module ports, is:
//   1. muscle-shaped limbs (front/back taper of upper arm, forearm, thigh and calf; Realistic only), and
//   2. Aerondel's distance LOD: beyond LOD_FAR the ~12-mesh finger hands swap back to the single palm sphere,
//      cutting ~22 draw calls per far character while near characters keep full anatomy.
import * as THREE from 'three';
import { GFX } from './toon.js';

export const LOD_FAR = 22;
const REG = new Set();
const firstMesh = (g) => g.children.find((c) => c.isMesh);

/** Realistic-only anatomy upgrade on a buildCharacter() result. Returns the number of LOD swaps registered. */
export function refineAnatomy(parts, opts = {}) {
  if (!GFX.real || !parts || !parts.armL || parts.anat) return 0;
  const swaps = [];
  for (const arm of [parts.armL, parts.armR]) {
    const fore = arm.userData.fore, H = arm.userData.hand; if (!fore) continue;
    const up = firstMesh(arm), lo = firstMesh(fore);
    if (up && !opts.noMuscle) up.scale.set(up.scale.x * 1.05, up.scale.y, up.scale.z * 0.93);
    if (lo && !opts.noMuscle) lo.scale.set(lo.scale.x * 1.04, lo.scale.y, lo.scale.z * 0.9);
    const palm = fore.children.find((c) => c.isMesh && c.geometry && c.geometry.type === 'SphereGeometry' && Math.abs(c.position.y + 0.32) < 0.01);
    if (H && H.hand && palm) swaps.push({ fine: H.hand, coarse: palm });
  }
  for (const leg of [parts.legL, parts.legR]) {
    const th = firstMesh(leg), sh = leg.userData.shin && firstMesh(leg.userData.shin);
    if (th && !opts.noMuscle) th.scale.set(th.scale.x * 1.03, th.scale.y, th.scale.z * 0.95);
    if (sh && !opts.noMuscle) sh.scale.set(sh.scale.x, sh.scale.y, sh.scale.z * 1.07);
  }
  parts.anat = { swaps, near: true, released: false };
  const root = parts.body.parent || parts.body;   // buildCharacter root group: lifecycle follows it
  parts.anat.root = root;
  root.addEventListener('added', () => { if (!parts.anat.released) REG.add(parts); });
  root.addEventListener('removed', () => dropChar(parts));
  if (root.parent) REG.add(parts);
  return swaps.length;
}
function topOf(o) { while (o.parent) o = o.parent; return o; }
function dropChar(p) { REG.delete(p); setNear(p, true); }
/** Explicit disposal (e.g. preview teardown): never re-registers even if the model is re-added. */
export function releaseCharacter(p) { if (!p || !p.anat) return; p.anat.released = true; dropChar(p); }
export function setNear(p, on) { if (on === p.anat.near) return; p.anat.near = on; for (const s of p.anat.swaps) { s.fine.visible = on; s.coarse.visible = !on; } }
const _v = new THREE.Vector3();
/** Distance LOD, once per frame. Returns how many characters are at full detail. */
export function tickAnatomy(camera, scene = null) {
  if (!REG.size) return 0; let near = 0;
  for (const p of REG) {
    const top = topOf(p.anat.root); if (scene ? top !== scene : !top.isScene) { dropChar(p); continue; }
    const on = p.body.getWorldPosition(_v).distanceTo(camera.position) < LOD_FAR; if (on) near++; setNear(p, on);
  }
  return near;
}
export const anatomyCount = () => REG.size;
export const _reg = REG;

// ---------------- full-body motion (Aerondel keyframe style: pose = f(normalised time)) ----------------
const lerp = (a, b, k) => a + (b - a) * k, ss = (k) => k * k * (3 - 2 * k);
/** Sample a keyframe track [[t, value], ...] (t ascending, 0..1) with smoothstep easing. */
export function track(keys, t) {
  if (t <= keys[0][0]) return keys[0][1]; for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) { const [t0, v0] = keys[i - 1], [t1, v1] = keys[i]; return lerp(v0, v1, ss((t - t0) / (t1 - t0))); }
  return keys[keys.length - 1][1];
}
export const TRACKS = {
  // melee swing: weight shifts back on wind-up, lunges through the hit, recovers
  lunge: [[0, 0], [0.3, -0.06], [0.45, 0.14], [0.75, 0.08], [1, 0]],
  twist: [[0, 0], [0.3, 0.32], [0.5, -0.38], [1, 0]],
  kneeA: [[0, 0], [0.35, 0.25], [0.55, 0.45], [1, 0]],
  // casting: plant the feet, sink, chest up
  castSink: [[0, 0], [0.4, -0.06], [1, -0.05]],
};
/** Additive full-body layer, applied AFTER animateCharacter (which resets the same channels every frame). */
export function fullBody(p, st) {
  if (!p.anat) return false;
  if (st.dead) { p.body.rotation.y = 0; p.body.position.z = 0; return false; }
  const mv = st.move || 0, t = st.t || 0;
  // gait: pelvis yaw + head stabilise (Aerondel run cycle; FT already has hip roll and torso counter-twist)
  const fr = 9 + Math.min(1, mv / 0.6) * 2, ph = Math.sin(t * fr);
  p.body.rotation.y = ph * 0.07 * mv; p.head.rotation.y -= ph * 0.06 * mv;
  if (st.atk >= 0) {
    const k = Math.min(1, Math.max(0, st.atk)), punch = st.kind === 'punch';
    p.body.position.z = track(TRACKS.lunge, k) * (punch ? 1.3 : 1);
    p.body.rotation.y += track(TRACKS.twist, k) * (st.kind === 'bow' ? 0.3 : 1);
    const kb = track(TRACKS.kneeA, k); p.legL.rotation.x -= kb * 0.6; p.legL.userData.shin.rotation.x += kb; p.legR.rotation.x += kb * 0.35;
    p.body.position.y -= kb * 0.05;
  } else p.body.position.z = 0;
  if (st.cast > 0) { const c = Math.min(1, st.cast); p.body.position.y += track(TRACKS.castSink, c); for (const l of [p.legL, p.legR]) { l.rotation.x -= 0.25 * c; l.userData.shin.rotation.x += 0.45 * c; } p.head.rotation.x -= 0.08 * c; }
  return true;
}

// ---------------- creature detail LOD (Aerondel: detailed rig near, cheap body far) ----------------
// Non-humanoids keep their own anatomy (FT's builders already sculpt vulcan pecs/shoulder mass, boar hump, golem rock
// plates, dragon wings, Lullaby's flute body). Far away we only hide *small* decorative meshes (tufts, moss, hooves,
// teeth, laces) whose size is < DETAIL_FRAC of the creature's height; silhouette, eyes (emissive/glow) and every
// animated group stay. Range scales with size so big bosses keep detail farther out.
export const DETAIL_FRAC = 0.045;
// parts keys whose objects the animators show/hide at runtime (creatures.js, creatures2.js)
export const TOGGLED = ['wisps', 'orbs', 'bolts', 'tendrils', 'tail', 'legs', 'legL', 'legR', 'aura', 'elite', 'orbit', 'halo'];
const CREG = new Set();
export function refineCreatureLOD(group, parts = {}) {
  if (!GFX.real || !group || group.userData.clod) return 0;
  group.updateMatrixWorld(true);
  // anything the animators address through parts (wisps, orbs, bolts, tails, legs...) may toggle its own visibility: never LOD it
  const owned = new Set(); for (const v of TOGGLED.map((k) => (parts || {})[k])) for (const x of [].concat(v)) if (x && x.isObject3D && x !== group && x !== parts.body) owned.add(x);
  const isOwned = (o) => { for (let a = o; a && a !== group; a = a.parent) if (owned.has(a)) return true; return false; };
  const bb = new THREE.Box3().setFromObject(group), H = Math.max(0.2, bb.max.y - bb.min.y), fine = [], s = new THREE.Vector3(), sph = new THREE.Sphere();
  group.traverse((o) => {
    if (!o.isMesh || !o.geometry || !o.visible) return; const m = [].concat(o.material)[0];
    if (!m || m.transparent || m.isMeshBasicMaterial || (m.emissive && m.emissive.getHex() !== 0) || o.userData.noOutline || isOwned(o)) return;   // eyes/glows/decals/animator-owned parts stay
    if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); o.getWorldScale(s);
    sph.copy(o.geometry.boundingSphere); if (sph.radius * Math.max(s.x, s.y, s.z) < DETAIL_FRAC * H) fine.push(o);
  });
  group.userData.clod = { fine, near: true, far: LOD_FAR * Math.max(1, H / 2), H, released: false };
  group.addEventListener('added', () => { if (!group.userData.clod.released) CREG.add(group); });
  group.addEventListener('removed', () => dropCreature(group));
  if (group.parent) CREG.add(group);
  return fine.length;
}
function dropCreature(g) { CREG.delete(g); setCreatureNear(g, true); }
export function releaseCreature(g) { if (!g || !g.userData.clod) return; g.userData.clod.released = true; dropCreature(g); }
export function setCreatureNear(g, on) { const c = g.userData.clod; if (!c || c.near === on) return; c.near = on; for (const o of c.fine) o.visible = on; }
export function tickCreatures(camera, scene = null) {
  let near = 0;
  for (const g of CREG) {
    const top = topOf(g); if (scene ? top !== scene : !top.isScene) { dropCreature(g); continue; }
    const on = g.getWorldPosition(_v).distanceTo(camera.position) < g.userData.clod.far; if (on) near++; setCreatureNear(g, on);
  }
  return near;
}
export const _creg = CREG;
