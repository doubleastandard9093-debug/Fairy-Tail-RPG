// Set pieces for the story-chapter boss arenas (data/mobs.js BOSS_ARENAS entries with `set`).
// Each arena gets a pillar ring with a gap toward its gate, a floor sigil, and a themed backdrop opposite the gate.
import * as THREE from 'three';
import { toon, glow, mesh, addOutlines, shadowAll } from './toon.js';
import { BOSS_ARENAS } from '../data/mobs.js';

export function buildArcSets({ zoneGroup, W, R, sign, groundAt }) {
  for (const A of Object.values(BOSS_ARENAS)) {
    if (!A.set) continue;
    const g = zoneGroup(A.x, A.z, 80); const [gx, gz] = A.gate; const gap = Math.atan2(gz - A.z, gx - A.x); const y0 = A.h;
    const pillarM = toon(A.pillar), gemM = glow(A.gem);
    for (let i = 0; i < 14; i++) {
      const a = i / 14 * Math.PI * 2; if (Math.abs(Math.atan2(Math.sin(a - gap), Math.cos(a - gap))) < 0.45) continue;
      const x = A.x + Math.cos(a) * (A.r + 1), z = A.z + Math.sin(a) * (A.r + 1); const hh = 4.5 + R() * 2.5;
      let p;
      if (A.set === 'icecave') { p = mesh(new THREE.ConeGeometry(1.3, hh * 1.3, 6), pillarM, x, y0 + hh * 0.65, z); }
      else if (A.set === 'ruins') { const broken = R() < 0.4; p = mesh(new THREE.CylinderGeometry(0.75, 0.85, broken ? hh * 0.5 : hh, 10), pillarM, x, y0 + (broken ? hh * 0.25 : hh / 2), z); if (broken) p.rotation.z = (R() - 0.5) * 0.3; }
      else if (A.set === 'nirvana') { p = mesh(new THREE.CylinderGeometry(0.3, 1.1, hh * 1.6, 5), pillarM, x, y0 + hh * 0.8, z); }
      else p = mesh(new THREE.BoxGeometry(1.4, hh, 1.4), pillarM, x, y0 + hh / 2, z);
      p.rotation.y = -a; g.add(p); W.circles.push({ x, z, r: 1.1 });
      if (A.set !== 'ruins') { const cr = mesh(new THREE.OctahedronGeometry(0.45, 0), gemM, x, y0 + (A.set === 'nirvana' ? hh * 1.6 : A.set === 'icecave' ? hh * 1.3 : hh) + 0.7, z); g.add(cr); }
    }
    const sig = mesh(new THREE.RingGeometry(A.r - 3, A.r - 2.5, 64), glow(A.gem), A.x, y0 + 0.06, A.z); sig.rotation.x = -Math.PI / 2; sig.material.transparent = true; sig.material.opacity = 0.45; g.add(sig);
    const bx = A.x - Math.cos(gap) * (A.r + 10), bz = A.z - Math.sin(gap) * (A.r + 10); const by = groundAt(bx, bz); const face = -gap + Math.PI / 2;
    const S = SETS[A.set]; if (S) S({ g, W, R, A, bx, bz, by, gap, face, y0 });
    if (sign) sign(g, gx, gz, A.name.toUpperCase(), -gap - Math.PI / 2);
    addOutlines(g); shadowAll(g);
  }
}

const SETS = {
  icecave({ g, W, R, bx, bz, by, gap }) {
    // The Vulcans' den: a frozen cave mouth flanked by icicle spires
    const ice = toon('#d8ecf8'), deep = toon('#1a2a3a'), blue = glow('#8acaff');
    const mound = mesh(new THREE.SphereGeometry(12, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), ice, bx, by - 1, bz); mound.scale.y = 0.9; g.add(mound);
    const mouth = mesh(new THREE.CircleGeometry(5, 16, 0, Math.PI), deep, bx + Math.cos(gap) * 11.2, by - 0.5, bz + Math.sin(gap) * 11.2); mouth.rotation.y = -gap + Math.PI / 2; g.add(mouth);
    for (let k = 0; k < 9; k++) { const a = gap + Math.PI + (k - 4) * 0.28; const r = 14 + R() * 4; const h = 6 + R() * 7; const s = mesh(new THREE.ConeGeometry(1.4 + R(), h, 6), k % 3 ? ice : blue, bx + Math.cos(a) * r * 0.6, by + h / 2 - 1, bz + Math.sin(a) * r * 0.6); g.add(s); }
    W.circles.push({ x: bx, z: bz, r: 11 });
  },
  mansion({ g, W, bx, bz, by, face }) {
    // Duke Everlue's gaudy pink-and-gold mansion
    const wall = toon('#e8b0c8'), gold = toon('#e0b040'), roof = toon('#8a2a4a'), win = glow('#ffe8a0');
    const body = mesh(new THREE.BoxGeometry(24, 10, 10), wall, bx, by + 5, bz); body.rotation.y = face; g.add(body);
    const r = mesh(new THREE.CylinderGeometry(0.01, 9, 5, 4), roof, bx, by + 12.5, bz); r.rotation.y = face + Math.PI / 4; r.scale.set(1.9, 1, 0.8); g.add(r);
    for (const s of [-1, 1]) { const tx = bx + Math.cos(face) * 13 * s, tz = bz - Math.sin(face) * 13 * s;
      g.add(mesh(new THREE.CylinderGeometry(2.4, 2.6, 15, 10), wall, tx, by + 7.5, tz)); g.add(mesh(new THREE.ConeGeometry(3, 5, 10), roof, tx, by + 17.5, tz)); g.add(mesh(new THREE.SphereGeometry(0.6, 8, 6), gold, tx, by + 20.5, tz)); W.circles.push({ x: tx, z: tz, r: 2.8 }); }
    for (let k = -3; k <= 3; k++) { const wx = bx + Math.cos(face) * k * 3.2, wz = bz - Math.sin(face) * k * 3.2; const w = mesh(new THREE.BoxGeometry(1.4, 2, 10.2), win, wx, by + 6.5, wz); w.rotation.y = face; g.add(w); }
    const statue = mesh(new THREE.CylinderGeometry(0.9, 1.2, 3.2, 8), gold, bx + Math.sin(face) * 9, by + 1.6, bz + Math.cos(face) * 9); g.add(statue);
    W.circles.push({ x: bx, z: bz, r: 10 });
  },
  ruins({ g, W, R, A, bx, bz, by, y0 }) {
    // Galuna's moon temple: broken stone, the moon-lens skylight, and Deliora sealed in ice at the far side
    const stone = toon('#8a8478'), moss = toon('#5a6a48'), ice = toon('#b8dcf0'), core = glow('#6a8aff'), moon = glow('#c89aff');
    const base = mesh(new THREE.BoxGeometry(18, 3, 14), stone, bx, by + 1.5, bz); g.add(base);
    for (let k = 0; k < 6; k++) { const c = mesh(new THREE.CylinderGeometry(0.9, 1, 7 - R() * 3, 10), k % 2 ? stone : moss, bx - 7 + k * 2.8, by + 5, bz + (k % 2 ? 5 : -5)); g.add(c); }
    const block = mesh(new THREE.BoxGeometry(7, 9, 6), ice, bx, by + 7.5, bz); block.material.transparent = true; block.material.opacity = 0.75; g.add(block);
    const demon = mesh(new THREE.SphereGeometry(2.4, 10, 8), core, bx, by + 7.5, bz); demon.scale.set(1, 1.5, 0.8); g.add(demon);
    const lens = mesh(new THREE.TorusGeometry(3.5, 0.35, 8, 24), moon, A.x, y0 + 14, A.z); lens.rotation.x = Math.PI / 2; g.add(lens);
    W.circles.push({ x: bx, z: bz, r: 9 });
  },
  storm({ g, W, R, A, bx, bz, by }) {
    // Behind Kardia Cathedral: the lightning-rod spires that held the Thunder Palace lacrima
    const iron = toon('#4a4a58'), bolt = glow('#ffe24a');
    for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; const x = bx + Math.cos(a) * 6, z = bz + Math.sin(a) * 6; const h = 12 + R() * 6;
      g.add(mesh(new THREE.CylinderGeometry(0.25, 0.7, h, 6), iron, x, by + h / 2, z)); g.add(mesh(new THREE.SphereGeometry(0.9, 10, 8), bolt, x, by + h + 0.8, z)); W.circles.push({ x, z, r: 1 }); }
    const disc = mesh(new THREE.CylinderGeometry(4, 4.4, 0.6, 24), iron, bx, by + 0.3, bz); g.add(disc);
    const orb = mesh(new THREE.IcosahedronGeometry(1.8, 1), bolt, bx, by + 4, bz); g.add(orb); W.circles.push({ x: bx, z: bz, r: 4.5 });
  },
  nirvana({ g, W, R, bx, bz, by }) {
    // Nirvana rising out of the Worth Woodsea: black spires wrapped in a sickly light
    const dark = toon('#1a1a22'), vein = glow('#7aff9a'), stone = toon('#3a3a44');
    for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2; const r = 3 + (k % 2) * 4; const h = 14 + R() * 14; const x = bx + Math.cos(a) * r, z = bz + Math.sin(a) * r;
      g.add(mesh(new THREE.CylinderGeometry(0.2, 1.8, h, 6), dark, x, by + h / 2, z)); g.add(mesh(new THREE.TorusGeometry(1.2, 0.12, 6, 14), vein, x, by + h * 0.55, z)); W.circles.push({ x, z, r: 1.8 }); }
    const central = mesh(new THREE.CylinderGeometry(0.4, 2.8, 34, 8), stone, bx, by + 17, bz); g.add(central);
    const crown = mesh(new THREE.OctahedronGeometry(1.8, 0), vein, bx, by + 35, bz); g.add(crown); W.circles.push({ x: bx, z: bz, r: 3.2 });
  },
};

/** Karen Lilica's grave on the hill east of Magnolia (Loke chapter). */
export function buildKarenGrave({ zoneGroup, W, groundAt }) {
  const x = 58, z = 18, y = groundAt(x, z); const g = zoneGroup(x, z, 40);
  const stone = toon('#9a9aa4'), dark = toon('#6a6a74'), star = glow('#ffd86a');
  const st = mesh(new THREE.BoxGeometry(1.4, 1.8, 0.35), stone, x, y + 0.9, z); g.add(st);
  const top = mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.35, 16, 1, false, 0, Math.PI), stone, x, y + 1.8, z); top.rotation.x = Math.PI / 2; top.rotation.z = Math.PI / 2; g.add(top);
  g.add(mesh(new THREE.BoxGeometry(2, 0.2, 1.2), dark, x, y + 0.1, z + 0.5));
  const s = mesh(new THREE.OctahedronGeometry(0.22, 0), star, x, y + 1.25, z + 0.2); g.add(s);
  const fl = ['#ff7aa0', '#fff07a', '#ffffff', '#9ab8ff'];
  for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; g.add(mesh(new THREE.SphereGeometry(0.12, 6, 4), toon(fl[k % 4]), x + Math.cos(a) * 1.1, y + 0.15, z + 0.9 + Math.sin(a) * 0.5)); }
  W.circles.push({ x, z, r: 1 }); addOutlines(g); shadowAll(g);
}
