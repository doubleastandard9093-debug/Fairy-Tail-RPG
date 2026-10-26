// Dense grass field streamed around the player (High / Realistic tiers). Blades live on a jittered world
// grid hashed per cell, so rebuilding around a new centre never shuffles the blades you are looking at.
import * as THREE from 'three';
import { addWind, GFX } from './toon.js';

const hash = (i, j, k) => { let h = (i * 374761393 + j * 668265263 + k * 1442695041) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

function bladeGeo() {
  // three crossed, slightly bent blades per instance; vertex colour from dark root to sunlit tip
  const pos = [], col = [], idx = []; const root = new THREE.Color('#2f4a2c'), tip = new THREE.Color('#7e9a4c');   // style-guide grass (old bright tip removed)
  for (let b = 0; b < 3; b++) {
    const a = b / 3 * Math.PI + (b * 0.37), ca = Math.cos(a), sa = Math.sin(a); const ox = (b - 1) * 0.06, oz = ((b * 7) % 3 - 1) * 0.05; const base = pos.length / 3;
    const segs = 4; for (let s = 0; s <= segs; s++) { const t = s / segs; const w = 0.045 * (1 - t * 0.92); const bend = t * t * 0.18; const y = t * 0.46;
      for (const side of [-1, 1]) { pos.push(ox + ca * w * side + sa * bend, y, oz + sa * w * side - ca * bend); const c = root.clone().lerp(tip, Math.pow(t, 0.8)); col.push(c.r, c.g, c.b); } }
    for (let s = 0; s < segs; s++) { const k = base + s * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
  // point normals up so blades shade like the ground they grow from
  const n = g.attributes.normal; for (let i = 0; i < n.count; i++) n.setXYZ(i, n.getX(i) * 0.3, 1, n.getZ(i) * 0.3); n.needsUpdate = true; return g;
}

const vn = (x, z) => { const i = Math.floor(x), j = Math.floor(z); let fx = x - i, fz = z - j; fx = fx * fx * (3 - 2 * fx); fz = fz * fz * (3 - 2 * fz);
  const a = hash(i, j, 91), b = hash(i + 1, j, 91), c = hash(i, j + 1, 91), d = hash(i + 1, j + 1, 91); return a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz; };
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export class Grass {
  constructor(scene, { height, accept, prepare, count = 12000, radius = 40 }) {
    this.height = height; this.accept = accept; this.prepare = prepare; this.radius = radius; this.cap = count;
    this.cell = Math.sqrt(Math.PI * radius * radius / count);
    const mat = GFX.real ? new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, side: THREE.DoubleSide, envMapIntensity: 0.6 }) : new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
    addWind(mat, 0.9);
    this.mesh = new THREE.InstancedMesh(bladeGeo(), mat, count); this.mesh.count = 0; this.mesh.frustumCulled = false; this.mesh.receiveShadow = !!GFX.shadows; this.mesh.userData.noOutline = true; this.mesh.userData.dyn = true;
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
    scene.add(this.mesh); this.cx = 1e9; this.cz = 1e9;
  }
  update(x, z) {
    if (Math.hypot(x - this.cx, z - this.cz) < this.radius * 0.22) return;
    this.cx = x; this.cz = z; if (this.prepare) this.prepare(x, z, this.radius); const C = this.cell, R = this.radius; const m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), col = new THREE.Color();
    const i0 = Math.floor((x - R) / C), i1 = Math.ceil((x + R) / C), j0 = Math.floor((z - R) / C), j1 = Math.ceil((z + R) / C); let n = 0;
    for (let j = j0; j <= j1 && n < this.cap; j++) for (let i = i0; i <= i1 && n < this.cap; i++) {
      const px = (i + hash(i, j, 1)) * C, pz = (j + hash(i, j, 2)) * C; const d = Math.hypot(px - x, pz - z); if (d > R) continue;
      let k = this.accept(px, pz); if (!k) continue;
      // clumps: dense tufts and thinner gaps, so the field reads as natural growth rather than a carpet
      const clump = vn(px * 0.21, pz * 0.21) * 0.65 + vn(px * 0.9, pz * 0.9) * 0.35; k *= 0.35 + 0.85 * sm(0.22, 0.68, clump); if (hash(i, j, 3) > k) continue;
      // thin out toward the rim so the field edge dissolves instead of ending in a hard circle
      const edge = d / R; if (edge > 0.7 && hash(i, j, 4) < (edge - 0.7) / 0.3) continue;
      const sc = (0.55 + hash(i, j, 5) * 0.6) * (0.75 + clump * 0.6); q.setFromAxisAngle(up, hash(i, j, 6) * Math.PI * 2); p.set(px, this.height(px, pz) - 0.02, pz); s.set(sc, sc * (0.8 + hash(i, j, 7) * 0.7), sc); m.compose(p, q, s); this.mesh.setMatrixAt(n, m);
      { const dry = sm(0.55, 0.85, vn(px * 0.035 + 7, pz * 0.035)), lush = sm(0.5, 0.8, clump); col.setHSL(0.245 + hash(i, j, 8) * 0.05 - dry * 0.07 + lush * 0.02, 0.42 + dry * 0.12, 0.4 + hash(i, j, 9) * 0.18 + dry * 0.1 - lush * 0.06); } this.mesh.setColorAt(n, col); n++;
    }
    this.mesh.count = n; this.mesh.instanceMatrix.needsUpdate = true; this.mesh.instanceColor.needsUpdate = true;
  }
}
