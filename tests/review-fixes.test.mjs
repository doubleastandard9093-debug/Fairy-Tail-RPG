// Regression tests for review findings 2 (surface metadata) and 3 (instanced world positions).
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { GFX } from '../src/world/toon.js';
globalThis.document ??= { createElement: () => ({ getContext: () => new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => ({ addColorStop() {}, width: 1, data: new Uint8ClampedArray(4) })), set: (t, k, v) => { t[k] = v; return true; } }), width: 64, height: 64 }) };
GFX.real = true; GFX.high = true;   // set before any material is built (fresh process: no boot-lifetime toon cache)
const { buildCharacter, buildMob } = await import('../src/world/models.js');
const { realifyWorld, KINDS, kindOf } = await import('../src/systems/microdetail.js');
const micro = (m) => m.userData.micro && [+m.userData.micro.microK.value.toFixed(3), +m.userData.micro.microS.value.toFixed(3)];
// 2) explicit surface metadata wins over (empty) names
const c = buildCharacter({ hair: 'spiky', skin: '#f2d0b0', outfit: 'adventurer' });
const skull = c.parts.head.children.find((o) => o.isMesh);
assert.equal(kindOf(skull.material, skull, 'cloth'), 'skin', 'skull is skin');
const unit = skull.material.userData.micro.microS.value / KINDS.skin[5];
assert.deepEqual(micro(skull.material), [KINDS.skin[4], +(KINDS.skin[5] * unit).toFixed(3)], 'skull tuned as skin, not cloth');
const iris = c.parts.eyes[0].children[1]; assert.equal(kindOf(iris.material, iris, 'cloth'), 'eye', 'iris is eye');
assert.equal(iris.material.roughness, KINDS.eye[0], 'eye tuned glossy');
const vul = buildMob('vulcan', {}); let furOK = false; vul.group.traverse((o) => { if (o.isMesh && o.material.userData.surface === 'fur' && kindOf(o.material, o, 'cloth') === 'fur') furOK = true; });
assert.ok(furOK, 'creature cmat fur metadata survives realify');
const gol = buildMob('golem', {}); let stone = 0; gol.group.traverse((o) => { if (o.isMesh && kindOf(o.material, o, 'fur') === 'stone') stone++; }); assert.ok(stone > 0, 'golem cmat stone metadata');
// 3) instanced world meshes: world position includes instanceMatrix
const im = new THREE.InstancedMesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial({ name: 'rock' }), 2); const g = new THREE.Group(); g.add(im);
assert.equal(realifyWorld(g), 1);
const sh = { uniforms: {}, vertexShader: THREE.ShaderLib.standard.vertexShader, fragmentShader: THREE.ShaderLib.standard.fragmentShader };
im.material.onBeforeCompile(sh, {});
assert.match(sh.vertexShader, /#ifdef USE_INSTANCING\s*\n?\s*\w+ = instanceMatrix \* \w+;\s*\n?\s*#endif[\s\S]*vMicroW = \(modelMatrix \* \w+\)\.xyz/, 'vMicroW applies instanceMatrix before modelMatrix');
console.log('review-fixes tests: ok');
