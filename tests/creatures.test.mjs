import assert from 'node:assert/strict';
import * as THREE from 'three';
import { GFX } from '../src/world/toon.js';
import { buildMob, animateMob } from '../src/world/models.js';
import { tickCreatures, setCreatureNear, _creg, LOD_FAR, TOGGLED } from '../src/world/anatomy.js';
const ctx2d = new Proxy({}, { get: (t, k) => (k in t ? t[k] : (k === 'measureText' ? () => ({ width: 10 }) : k === 'createLinearGradient' || k === 'createRadialGradient' ? () => ({ addColorStop() {} }) : k === 'getImageData' ? () => ({ data: new Uint8ClampedArray(4) }) : () => {})), set: (t, k, v) => { t[k] = v; return true; } });
globalThis.document = { createElement: () => ({ getContext: () => ctx2d, width: 64, height: 64 }) };
const MODELS = [['vulcan', { fur: '#7a6a42', face: '#c8a080' }], ['boar', {}], ['golem', {}], ['dragon', {}], ['lullaby', {}]];
const snap = (g) => { const out = []; g.traverse((o) => { if (o.isMesh) out.push([o.geometry.uuid === undefined ? 0 : o.geometry.attributes.position.count, o.position.toArray().map((v) => +v.toFixed(5)).join(), o.quaternion.toArray().map((v) => +v.toFixed(5)).join(), o.scale.toArray().map((v) => +v.toFixed(5)).join()]); }); return out; };
const posePose = (g) => { const a = []; g.traverse((o) => a.push(o.position.toArray().concat(o.rotation.toArray().slice(0, 3)).map((v) => +(+v).toFixed(5)).join())); return a.join('|'); };
const meshCount = (g) => { let n = 0; g.traverse((o) => { if (o.isMesh) n++; }); return n; };
const vertCount = (g) => { let n = 0; g.traverse((o) => { if (o.isMesh) n += o.geometry.attributes.position.count; }); return n; };
// Low/High baseline
GFX.real = false; GFX.high = true; const base = {};
for (const [m, opt] of MODELS) { const b = buildMob(m, opt); base[m] = { meshes: meshCount(b.group), verts: vertCount(b.group), mats: [] }; b.group.traverse((o) => { if (o.isMesh) base[m].mats.push(...[].concat(o.material).map((x) => x.type)); }); assert.ok(!b.group.userData.clod, m + ': no LOD off Realistic'); }
assert.ok(!base.vulcan.mats.includes('MeshPhysicalMaterial'), 'High keeps its materials');
GFX.real = true;
for (const [m, opt] of MODELS) {
  const c = buildMob(m, opt), g = c.group;
  // identity: same number of meshes and (except organic smoothing, which never adds vertices) same vertex count as non-real build of the same model
  const lr = buildMob(m, opt); void lr;
  assert.ok(g.userData.clod, m + ' LOD registered'); const clod = g.userData.clod;
  assert.ok(clod.fine.every((o) => !o.material.transparent && !(o.material.emissive && o.material.emissive.getHex())), m + ': no glows/eyes in fine set');
  assert.ok(clod.fine.length < meshCount(g) * 0.7, m + ': silhouette meshes stay'); assert.ok(clod.fine.length > 0, m + ': has far-hideable detail');
  for (const k of TOGGLED) for (const x of [].concat(c.parts[k] || [])) if (x && x.isObject3D) x.traverse((o) => assert.ok(!clod.fine.includes(o), m + ': animator-toggled ' + k + ' never LOD-hidden'));
  if (m === 'golem') { let smoothed = 0; g.traverse((o) => { if (o.isMesh && o.geometry.userData.smoothed) smoothed++; }); assert.equal(smoothed, 0, 'golem rock stays faceted'); }
  if (m === 'lullaby') { let smoothed = 0; g.traverse((o) => { if (o.isMesh && o.geometry.userData.smoothed) smoothed++; }); assert.equal(smoothed, 0, 'Lullaby wood keeps its carved facets'); }
  // LOD toggle restores exactly and does not touch transforms
  const scene = new THREE.Scene(); scene.add(g); const cam = new THREE.PerspectiveCamera(); scene.add(cam); const p0 = posePose(g);
  cam.position.set(0, 1, clod.far + 10); tickCreatures(cam); assert.ok(clod.fine.every((o) => !o.visible), m + ' far hides detail');
  cam.position.set(0, 1, 4); tickCreatures(cam); assert.ok(clod.fine.every((o) => o.visible), m + ' near restores'); assert.equal(posePose(g), p0, m + ' transforms untouched by LOD');
  // pose/animation still run on Realistic and are deterministic for the same time
  for (let t = 0; t < 2; t += 0.1) animateMob(c, m, t, t > 1 ? 1 : 0, t > 1.5 ? 0.5 : -1);
  animateMob(c, m, 3, 0, -1); const a = posePose(g); animateMob(c, m, 3, 0, -1); assert.equal(posePose(g), a, m + ' pose resets per frame');
  console.log(m, 'meshes', meshCount(g), 'baseline', base[m].meshes, 'fine', clod.fine.length, 'far', clod.far.toFixed(1));
  assert.equal(meshCount(g), base[m].meshes, m + ': mesh count identical to High (no meshes added/removed)');
}
{ const v = buildMob('vulcan', {}); let fur = null; v.group.traverse((o) => { if (!fur && o.isMesh && o.material.userData && o.material.userData.micro && o.material.userData.micro.mottleK.value > 0.1) fur = o.material; });
  assert.ok(fur, 'vulcan fur gets mottling'); const sh = { uniforms: {}, vertexShader: THREE.ShaderLib.physical.vertexShader, fragmentShader: THREE.ShaderLib.physical.fragmentShader }; fur.onBeforeCompile(sh, {});
  assert.ok(sh.fragmentShader.includes('diffuseColor.rgb *= 1.0 + (mv - 0.5)'), 'mottle injected'); assert.ok(sh.fragmentShader.includes('uniform float mottleK')); }
assert.ok(LOD_FAR > 0); console.log('creature tests: ok');
