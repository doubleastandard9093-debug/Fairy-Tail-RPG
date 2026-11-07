// Review finding 1: anatomy/creature LOD registries must not retain removed or preview characters.
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { GFX } from '../src/world/toon.js';
globalThis.document ??= { createElement: () => ({ getContext: () => new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => ({ addColorStop() {}, width: 1, data: new Uint8ClampedArray(4) })), set: (t, k, v) => { t[k] = v; return true; } }), width: 64, height: 64 }) };
GFX.real = true; GFX.high = true;
const { buildCharacter, buildMob } = await import('../src/world/models.js');
const A = await import('../src/world/anatomy.js');
const cam = new THREE.PerspectiveCamera(); cam.position.set(0, 1, 5);
const game = new THREE.Scene(), preview = new THREE.Scene();
// character creator: repeated rebuilds in a preview scene (create.js removes the old group each time)
let ch = null; for (let i = 0; i < 5; i++) { if (ch) preview.remove(ch.group); ch = buildCharacter({ hair: 'spiky' }); preview.add(ch.group); }
assert.equal(A._reg.size, 1, 'only the live preview character is registered');
// game tick on the game scene drops anything not in that scene (the discarded preview)
A.tickAnatomy(cam, game); assert.equal(A._reg.size, 0, 'preview character dropped once the game scene ticks');
assert.ok(ch.parts.anat.swaps.every((s) => s.fine.visible && !s.coarse.visible), 'dropped character left at full detail');
// entity wrapper removed from scene (game.removeEntity removes e.obj, not the char group)
const npc = buildCharacter({ hair: 'bob' }); const obj = new THREE.Group(); obj.add(npc.group); game.add(obj);
const sum = buildCharacter({ hair: 'short' }); game.add(sum.group);
A.tickAnatomy(cam, game); assert.equal(A._reg.size, 2);
game.remove(obj); A.tickAnatomy(cam, game); assert.equal(A._reg.size, 1, 'detached wrapper dropped on tick');
game.remove(sum.group); assert.equal(A._reg.size, 0, 'direct removal unregisters immediately');
game.add(sum.group); assert.equal(A._reg.size, 1, 're-adding re-registers');
A.releaseCharacter(sum.parts); assert.equal(A._reg.size, 0, 'explicit release'); game.remove(sum.group); game.add(sum.group); assert.equal(A._reg.size, 0, 'released stays released');
// far then removed: detail restored so a reused model never comes back stuck at low detail
const far = buildCharacter({ hair: 'long' }); game.add(far.group); far.group.position.set(0, 0, -200); game.updateMatrixWorld(true); A.tickAnatomy(cam, game);
assert.ok(far.parts.anat.swaps.every((s) => !s.fine.visible)); game.remove(far.group); assert.ok(far.parts.anat.swaps.every((s) => s.fine.visible && !s.coarse.visible), 'restored on removal');
// creatures: same lifecycle
const v = buildMob('vulcan', {}); const vo = new THREE.Group(); vo.add(v.group); game.add(vo); A.tickCreatures(cam, game); assert.ok(A._creg.has(v.group));
const stale = buildMob('boar', {}); preview.add(stale.group); A.tickCreatures(cam, game); assert.ok(!A._creg.has(stale.group), 'creature not in game scene dropped');
game.remove(vo); A.tickCreatures(cam, game); assert.ok(!A._creg.has(v.group), 'removed creature dropped'); assert.ok(v.group.userData.clod.fine.every((o) => o.visible));
console.log('registry tests: ok');
