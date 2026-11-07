import assert from 'node:assert/strict';
import * as THREE from 'three';
import { GFX } from '../src/world/toon.js';
import { realifyActor, realifyWorld, surfaceKind, addMicro } from '../src/systems/microdetail.js';
const mk = (name, M = THREE.MeshStandardMaterial) => { const m = new THREE.Mesh(new THREE.BoxGeometry(), new M({ name })); return m; };
// Low/High: no-op
GFX.real = false; { const g = new THREE.Group(); g.add(mk('skin')); assert.equal(realifyActor(g), 0); assert.equal(realifyWorld(g), 0); assert.ok(!g.children[0].material.userData.micro); }
// Realistic: patches, idempotent, chains prior onBeforeCompile
GFX.real = true;
{ const g = new THREE.Group(); const a = mk('skin'); let prev = 0; a.material.onBeforeCompile = () => { prev++; }; g.add(a, mk('eye', THREE.MeshPhysicalMaterial));
  assert.equal(realifyActor(g), 1); assert.equal(realifyActor(g), 0);
  const sh = { uniforms: {}, vertexShader: THREE.ShaderLib.standard.vertexShader, fragmentShader: THREE.ShaderLib.standard.fragmentShader };
  a.material.onBeforeCompile(sh); assert.equal(prev, 1); assert.ok(sh.fragmentShader.includes('microK')); assert.ok(sh.uniforms.tMicro);
  assert.ok(g.children[1].material.clearcoat > 0.9); }
{ const g = new THREE.Group(); const t = mk('stone'); t.material.transparent = true; const d = mk('rock'); d.userData.dyn = true; g.add(mk('rock wall'), t, d); assert.equal(realifyWorld(g), 1); }
assert.equal(surfaceKind('Iris_L'), 'eye'); assert.equal(surfaceKind('foo', 'fur'), 'fur');
assert.equal(addMicro(new THREE.MeshBasicMaterial(), 1, 1), false);
console.log('microdetail tests: ok');
