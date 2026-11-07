// Quality isolation in FRESH processes (no boot-lifetime toon/cmat caches shared between tiers).
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
const probe = (q) => JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', `
  globalThis.document = { createElement: () => ({ getContext: () => new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => ({ addColorStop() {}, width: 1, data: new Uint8ClampedArray(4) })), set: (t, k, v) => { t[k] = v; return true; } }), width: 64, height: 64 }) };
  const { GFX } = await import('./src/world/toon.js'); GFX.real = ${q === 'real'}; GFX.high = ${q !== 'low'};
  const { buildCharacter, buildMob } = await import('./src/world/models.js');
  const out = { phys: 0, micro: 0, smoothed: 0, anat: 0, clod: 0, meshes: 0 };
  const scan = (g) => g.traverse((o) => { if (!o.isMesh) return; out.meshes++; for (const m of [].concat(o.material)) { if (m.isMeshPhysicalMaterial && m.userData.micro) out.phys++; if (m.userData.micro) out.micro++; } if (o.geometry.userData.smoothed) out.smoothed++; });
  const c = buildCharacter({ preset: 'natsu', hair: 'spiky' }); scan(c.group); if (c.parts.anat) out.anat++;
  for (const m of ['vulcan', 'boar', 'golem', 'dragon', 'lullaby']) { const b = buildMob(m, {}); scan(b.group); if (b.group.userData.clod) out.clod++; }
  console.log(JSON.stringify(out));`], { cwd: process.cwd() }).toString().trim().split('\n').pop());
const low = probe('low'), high = probe('high'), real = probe('real');
for (const [n, r] of [['low', low], ['high', high]]) { assert.equal(r.micro, 0, n + ': no micro detail'); assert.equal(r.smoothed, 0, n + ': no smoothing'); assert.equal(r.anat, 0, n + ': no anatomy LOD'); assert.equal(r.clod, 0, n + ': no creature LOD'); }
assert.ok(real.micro > 0 && real.phys > 0 && real.smoothed > 0 && real.anat === 1 && real.clod === 5, 'real: all features on');
// note: FT's pre-existing Realistic hair/face layer adds a few meshes vs High; this port's own no-new-mesh guarantees are in stageb/creatures tests.
console.log('quality-fresh tests: ok', JSON.stringify({ low, high, real }));
