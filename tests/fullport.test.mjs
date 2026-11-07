import assert from 'node:assert/strict';
import * as THREE from 'three';
import { GFX } from '../src/world/toon.js';
import { smoothGeometry, toPhysical, realifyActor, CREASE } from '../src/systems/microdetail.js';
import { planScenery, MAX, files } from '../src/world/scenery.js';
import fs from 'node:fs';
// smoothing: cube with 60deg crease keeps facets; sphere-ish detail gets smoothed; cached; original untouched
const box = new THREE.BoxGeometry(); const sb = smoothGeometry(box, 60);
assert.notEqual(sb, box); assert.deepEqual([...sb.attributes.normal.array], [...box.attributes.normal.array], 'crease keeps cube faceted');
assert.equal(smoothGeometry(box, 60), sb, 'cached');
const ico = new THREE.IcosahedronGeometry(1, 2), orig = [...ico.attributes.normal.array], si = smoothGeometry(ico, 70);
assert.deepEqual([...ico.attributes.normal.array], orig, 'original untouched');
assert.ok([...si.attributes.normal.array].some((v, i) => Math.abs(v - orig[i]) > 1e-3), 'organic mesh smoothed');
assert.equal(CREASE.stone, 0); assert.equal(CREASE.metal, 0);
// physical parity keeps shader hooks + userData + colour
const m = new THREE.MeshStandardMaterial({ color: '#ff0000', name: 'skin' }); m.onBeforeCompile = () => {}; m.userData.base = 1;
const p = toPhysical(m, 'skin'); assert.ok(p.isMeshPhysicalMaterial); assert.equal(p.onBeforeCompile, m.onBeforeCompile); assert.equal(p.userData.base, 1);
assert.ok(p.sheen > 0); assert.equal(p.color.getHexString(), 'ff0000'); assert.equal(toPhysical(m, 'skin'), p, 'shared material converts once');
assert.ok('PHYSICAL' in p.defines);
// realifyActor: Low no-op; Real converts + smooths organic, keeps stone faceted
GFX.real = false; { const g = new THREE.Group(); const me = new THREE.Mesh(ico, m); g.add(me); realifyActor(g); assert.equal(me.material, m); assert.equal(me.geometry, ico); }
GFX.real = true; { const g = new THREE.Group(); const a = new THREE.Mesh(ico, new THREE.MeshStandardMaterial({ name: 'skin' })), r = new THREE.Mesh(ico, new THREE.MeshStandardMaterial({ name: 'rock' })); g.add(a, r);
  realifyActor(g); assert.ok(a.material.isMeshPhysicalMaterial); assert.ok(a.geometry.userData.smoothed); assert.equal(r.geometry, ico); assert.ok(a.material.userData.micro); }
// scenery placement: bounded, avoids places/roads/blocked/water, deterministic
let s = 1; const rand = () => (s = (s * 16807) % 2147483647) / 2147483647;
const env = { rand, center: [0, 0], waterY: -1.2, groundAt: (x) => (x > 300 ? -5 : 1), blockedAt: (x) => x > 400, placeAt: (x, z) => (Math.hypot(x - 100, z) < 40 ? {} : null), roadDist: (x, z) => Math.abs(z), forestAt: () => 0.6, biomeAt: () => 1 };
const plan = planScenery(env); assert.ok(plan.length > 100 && plan.length <= MAX, 'count ' + plan.length);
for (const o of plan) { assert.ok(o.x <= 300); assert.ok(Math.hypot(o.x - 100, o.z) >= 40); assert.ok(Math.abs(o.z) >= 7); assert.ok(Math.hypot(o.x, o.z) >= 69); }
s = 1; assert.deepEqual(planScenery(env).map((o) => o.file), plan.map((o) => o.file), 'deterministic');
for (const f of files()) assert.ok(fs.existsSync(`public/models/${f}.glb`), 'asset ' + f);
assert.ok(fs.readFileSync('public/models/CREDITS.md', 'utf8').includes('CC0'));
console.log('fullport tests: ok', plan.length, 'planned');
