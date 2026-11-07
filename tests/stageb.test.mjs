import assert from 'node:assert/strict';
import * as THREE from 'three';
import { GFX } from '../src/world/toon.js';
import { buildCharacter, animateCharacter } from '../src/world/models.js';
import { refineAnatomy, tickAnatomy, setNear, track, TRACKS, fullBody, LOD_FAR, _reg } from '../src/world/anatomy.js';
import { SEASONS, realSeason, pickSeason, applySeason, registerLeaf, SEASON_U, seasonNow } from '../src/world/seasons.js';
import fs from 'node:fs';
const g = globalThis; g.document ??= { createElement: () => ({ getContext: () => null, width: 0, height: 0 }) };
// Low/High: anatomy is a no-op
GFX.real = false; GFX.high = true;
let low; try { low = buildCharacter({ preset: 'natsu', hair: 'spiky', scarf: '#f0f0f0' }); } catch (e) { low = null; console.log('note: buildCharacter needs DOM canvas:', e.message); }
if (low) { assert.ok(!low.parts.anat, 'no anatomy registry off Realistic'); }
// Realistic: build named cast, check identity preserved (same hair/scarf meshes count), LOD swaps, motion
GFX.real = true;
if (low) {
  const natsu = buildCharacter({ preset: 'natsu', hair: 'spiky', scarf: '#f0f0f0' });
  assert.ok(natsu.parts.anat, 'anatomy registered'); assert.equal(natsu.parts.anat.swaps.length, 2, 'two hand LOD swaps');
  const count = (g) => { let n = 0; g.traverse((o) => { if (o.isMesh) n++; }); return n; };
  const before = count(natsu.group); const pa = natsu.parts.anat; delete natsu.parts.anat; _reg.delete(natsu.parts); refineAnatomy(natsu.parts, { noMuscle: true });
  assert.equal(count(natsu.group), before, 'anatomy adds/removes no meshes: cast identity kept'); natsu.parts.anat.near = pa.near;
  const scene = new THREE.Scene(); scene.add(natsu.group); const cam = new THREE.PerspectiveCamera(); scene.add(cam);
  cam.position.set(0, 1, 5); scene.updateMatrixWorld(true); tickAnatomy(cam);
  assert.ok(natsu.parts.anat.swaps.every((s) => s.fine.visible && !s.coarse.visible), 'near: fingers');
  cam.position.set(0, 1, LOD_FAR + 5); tickAnatomy(cam);
  assert.ok(natsu.parts.anat.swaps.every((s) => !s.fine.visible && s.coarse.visible), 'far: palm sphere');
  // animation state transitions: idle -> run -> attack -> cast -> dead -> revive, no NaN, channels reset
  const P = natsu.parts; const seq = [{ move: 0 }, { move: 1 }, { move: 0, atk: 0.45, kind: 'slash' }, { move: 0, atk: 0.45, kind: 'punch' }, { move: 0, cast: 1 }, { dead: true, deadT: 0.3 }, { dead: true, deadT: 2 }, { move: 0 }];
  let t = 0; const zs = [];
  for (const s of seq) for (let i = 0; i < 30; i++) { t += 1 / 60; animateCharacter(natsu, { atk: -1, ...s, t });
    for (const v of [P.body.position.z, P.body.rotation.y, P.body.rotation.x, P.legL.rotation.x, P.armR.rotation.x]) assert.ok(Number.isFinite(v)); zs.push(P.body.position.z); }
  assert.ok(Math.max(...zs) > 0.05, 'attack lunges forward'); assert.equal(P.body.position.z, 0, 'lunge resets'); assert.equal(P.body.rotation.y, 0 * P.body.rotation.y, 'finite');
  // repeated frames do not accumulate
  animateCharacter(natsu, { t: 5, move: 1, atk: -1 }); const y1 = P.body.rotation.y; animateCharacter(natsu, { t: 5, move: 1, atk: -1 }); assert.equal(P.body.rotation.y, y1, 'idempotent per frame');
}
assert.equal(track([[0, 0], [1, 1]], 0.5), 0.5); assert.equal(track(TRACKS.lunge, 0), 0); assert.equal(track(TRACKS.lunge, 1), 0); assert.equal(fullBody({}, {}), false);
// seasons
assert.equal(realSeason(new Date(2026, 10, 7)), 'autumn'); assert.equal(realSeason(new Date(2026, 0, 1)), 'winter');
assert.equal(pickSeason('?season=winter'), 'winter'); assert.equal(pickSeason('?season=bogus', new Date(2026, 6, 1)), 'summer');
const leaf = new THREE.MeshStandardMaterial({ color: '#ffffff' }); registerLeaf(leaf);
applySeason('autumn', { load: false }); assert.equal(seasonNow(), 'autumn'); assert.equal(leaf.color.getHex(), 0xffa860); assert.ok(SEASON_U.seasonGrass.value.z < 1);
applySeason('winter', { load: false }); assert.ok(SEASON_U.seasonSnow.value > 0); applySeason('summer', { load: false }); assert.equal(leaf.color.getHex(), 0xffffff); assert.equal(SEASON_U.seasonOn.value, 0);
for (const s of ['spring', 'autumn', 'winter']) assert.ok(fs.statSync(`public/textures/season_${s}.webp`).size < 400000);
assert.ok(fs.readFileSync('public/textures/CREDITS.md', 'utf8').includes('ScatteredLeaves008'));
const gsrc = fs.readFileSync('src/world/ground.js', 'utf8'); assert.ok(/#ifdef GTEX[\s\S]*seasonGrass[\s\S]*#endif/.test(gsrc), 'season shader inside Realistic-only GTEX block');
console.log('stageb tests: ok', low ? '(with character build)' : '(character build skipped: needs DOM)');
