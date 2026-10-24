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
  edolas({ g, W, R, A, bx, bz, by, y0 }) {
    // Edolas Royal City: a floating sky-island of red stone, upside-down spires and the giant Magnolia lacrima
    const rock = toon('#7a4a3a'), rockD = toon('#4a2a22'), top = toon('#8a6a5a'), spire = toon('#c8a060'), lac = glow('#7ad8ff');
    const slab = mesh(new THREE.BoxGeometry(70, 3, 96), top, -900, y0 - 1.5, 244); g.add(slab);
    const under = mesh(new THREE.ConeGeometry(46, 40, 9), rockD, -900, y0 - 23, 244); under.rotation.x = Math.PI; under.scale.z = 1.3; g.add(under);
    for (let k = 0; k < 9; k++) { const x = -900 + (R() - 0.5) * 140, z = 244 + (R() - 0.5) * 160, y = y0 - 10 + R() * 30; if (Math.abs(x + 900) < 40 && Math.abs(z - 244) < 52) continue;
      const isl = mesh(new THREE.ConeGeometry(4 + R() * 6, 8 + R() * 8, 7), rock, x, y, z); isl.rotation.x = Math.PI; g.add(isl); g.add(mesh(new THREE.CylinderGeometry(4.5, 4.5, 1, 7), top, x, y + 4.5, z)); }
    for (let k = 0; k < 5; k++) { const x = bx + (k - 2) * 7, h = 16 + (k % 2) * 8; g.add(mesh(new THREE.CylinderGeometry(1.6, 2.2, h, 8), spire, x, y0 + h / 2, bz - 4)); g.add(mesh(new THREE.ConeGeometry(2.4, 6, 8), rockD, x, y0 + h + 3, bz - 4)); W.circles.push({ x, z: bz - 4, r: 2.4 }); }
    const crys = mesh(new THREE.OctahedronGeometry(7, 0), lac, bx, y0 + 26, bz - 4); crys.scale.y = 1.8; g.add(crys);
    // railings so the edge reads as an edge
    for (const [x0, z0, x1, z1] of [[-935, 196, -865, 196], [-935, 292, -865, 292], [-935, 196, -935, 292], [-865, 196, -865, 292]]) { const L = Math.hypot(x1 - x0, z1 - z0); const r = mesh(new THREE.BoxGeometry(L, 1, 0.4), rockD, (x0 + x1) / 2, y0 + 0.5, (z0 + z1) / 2); r.rotation.y = -Math.atan2(z1 - z0, x1 - x0); g.add(r); }
  },
  tenrou({ g, W, R, bx, bz, by }) {
    // Tenrou holy ground: First Master Mavis's grave and Grimoire Heart's airship looming offshore
    const stone = toon('#b8b0a0'), hull = toon('#2a1a1a'), red = toon('#8a1a1a'), sail = toon('#3a2a2a'), gl = glow('#ff5a5a');
    g.add(mesh(new THREE.BoxGeometry(2, 3, 0.6), stone, bx, by + 1.5, bz)); g.add(mesh(new THREE.BoxGeometry(3.2, 0.3, 1.6), stone, bx, by + 0.15, bz + 0.6));
    const sx = bx + 40, sz = bz + 10, sy = by + 26;
    const ship = mesh(new THREE.CylinderGeometry(5, 2.5, 34, 10), hull, sx, sy, sz); ship.rotation.z = Math.PI / 2; ship.scale.z = 0.7; g.add(ship);
    g.add(mesh(new THREE.BoxGeometry(22, 5, 7), red, sx, sy + 5, sz));
    for (const dx of [-8, 0, 8]) { g.add(mesh(new THREE.CylinderGeometry(0.4, 0.4, 14, 6), hull, sx + dx, sy + 13, sz)); g.add(mesh(new THREE.BoxGeometry(0.3, 8, 9), sail, sx + dx, sy + 14, sz)); }
    for (let k = 0; k < 6; k++) g.add(mesh(new THREE.SphereGeometry(0.6, 8, 6), gl, sx - 15 + k * 6, sy - 1, sz + 3.4));
    W.circles.push({ x: bx, z: bz, r: 1.5 });
  },
  ogre({ g, W, R, A, bx, bz, by }) {
    // Twilight Ogre's yard: crooked fence, a loud guild shack and a stack of unpaid bills
    const wood = toon('#6a4a2a'), woodD = toon('#4a2a1a'), roof = toon('#8a3a2a'), paper = toon('#f0e8d0');
    const shack = mesh(new THREE.BoxGeometry(14, 7, 9), wood, bx, by + 3.5, bz); g.add(shack); { const rf = mesh(new THREE.ConeGeometry(10, 4, 4), roof, bx, by + 9, bz); rf.rotation.y = Math.PI / 4; g.add(rf); }
    for (let k = 0; k < 7; k++) g.add(mesh(new THREE.BoxGeometry(0.8, 0.05, 1), paper, bx + 4 + R() * 3, by + 0.05 + k * 0.06, bz + 6 + R()));
    W.circles.push({ x: bx, z: bz, r: 8 });
  },
  clock({ g, W, R, bx, bz, by, face }) {
    // Infinity Clock: a giant bronze clock face, hands frozen, with gears half-buried in the ruins
    const bronze = toon('#a8803a', { metal: 0.6 }), dark = toon('#3a3024'), gl = glow('#9affd8');
    const fc = mesh(new THREE.CylinderGeometry(9, 9, 1.2, 40), bronze, bx, by + 10, bz); fc.rotation.x = Math.PI / 2; fc.rotation.z = 0; fc.rotation.y = face; g.add(fc);
    const ring = mesh(new THREE.TorusGeometry(7.8, 0.25, 6, 40), gl, bx, by + 10, bz); ring.rotation.y = face; g.add(ring);
    for (const [L, a] of [[6, 0.6], [4, 2.2]]) { const hnd = mesh(new THREE.BoxGeometry(0.5, L, 0.3), dark, bx, by + 10, bz); hnd.rotation.y = face; hnd.rotateZ(a); hnd.translateY(L / 2); g.add(hnd); }
    for (let k = 0; k < 4; k++) { const gx = bx + (R() - 0.5) * 18, gz = bz + (R() - 0.5) * 8; const gr = mesh(new THREE.TorusGeometry(2 + R() * 1.5, 0.5, 6, 12), bronze, gx, by + 1.2, gz); gr.rotation.x = 1.2 + R() * 0.6; g.add(gr); }
    g.add(mesh(new THREE.BoxGeometry(4, 10, 2), dark, bx, by + 5, bz)); W.circles.push({ x: bx, z: bz, r: 4 });
  },
  eclipse({ g, W, R, bx, bz, by, face }) {
    // The Eclipse Gate: a towering ring-gate of carved stone, half-open, with a dragon's shadow inside
    const st = toon('#c8b888'), dk = toon('#6a5a3a'), gl = glow('#ffe8a0');
    const ring = mesh(new THREE.TorusGeometry(9, 1.3, 10, 40), st, bx, by + 11, bz); ring.rotation.y = face; g.add(ring);
    const inner = mesh(new THREE.CircleGeometry(7.6, 40), gl, bx, by + 11, bz); inner.rotation.y = face; inner.material = inner.material.clone(); inner.material.side = THREE.DoubleSide; inner.material.transparent = true; inner.material.opacity = 0.35; g.add(inner);
    for (const s of [-1, 1]) { const leg = mesh(new THREE.BoxGeometry(3, 4, 3), dk, bx + Math.cos(face) * s * 7, by + 2, bz - Math.sin(face) * s * 7); g.add(leg); W.circles.push({ x: leg.position.x, z: leg.position.z, r: 2 }); }
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; const rn = mesh(new THREE.BoxGeometry(0.6, 0.6, 0.3), gl, bx + Math.cos(face) * Math.cos(a) * 9, by + 11 + Math.sin(a) * 9, bz - Math.sin(face) * Math.cos(a) * 9); rn.rotation.y = face; g.add(rn); }
  },
  sun({ g, W, R, bx, bz, by }) {
    // Sun Village: giant huts and a giant frozen mid-stride in a block of eternal ice
    const ice = toon('#bfe8ff'), wood = toon('#6a4a2a'), skin = toon('#c89070'), thatch = toon('#b89a5a');
    const block = mesh(new THREE.BoxGeometry(7, 14, 6), ice, bx, by + 7, bz); block.material = block.material.clone(); block.material.transparent = true; block.material.opacity = 0.55; g.add(block);
    g.add(mesh(new THREE.CylinderGeometry(1.4, 1.6, 7, 10), skin, bx, by + 6.5, bz)); g.add(mesh(new THREE.SphereGeometry(1.3, 12, 10), skin, bx, by + 11, bz));
    for (const s of [-1, 1]) { const arm = mesh(new THREE.CylinderGeometry(0.5, 0.5, 5, 8), skin, bx + s * 2, by + 7.5, bz); arm.rotation.z = s * 0.5; g.add(arm); }
    W.circles.push({ x: bx, z: bz, r: 4.5 });
    for (let k = 0; k < 3; k++) { const hx = bx + (k - 1) * 14, hz = bz + 10 + (k % 2) * 4; g.add(mesh(new THREE.CylinderGeometry(4, 4.5, 6, 10), wood, hx, by + 3, hz)); g.add(mesh(new THREE.ConeGeometry(5.5, 5, 10), thatch, hx, by + 8.5, hz)); W.circles.push({ x: hx, z: hz, r: 4.6 }); }
  },
  cube({ g, W, R, bx, bz, by }) {
    // Tartaros' Cube: a black fortress-cube hanging in the sky, with thorn vines down to the ground
    const blk = toon('#2a1a2a'), thorn = toon('#3a1a1a'), gl = glow('#ff3a6a');
    const cb = mesh(new THREE.BoxGeometry(16, 16, 16), blk, bx, by + 32, bz); cb.rotation.set(0.3, 0.6, 0.2); g.add(cb);
    const core = mesh(new THREE.OctahedronGeometry(3, 0), gl, bx, by + 22, bz); g.add(core);
    for (let k = 0; k < 7; k++) { const x = bx + (R() - 0.5) * 16, z = bz + (R() - 0.5) * 10; const v = mesh(new THREE.CylinderGeometry(0.25, 0.6, 24, 5), thorn, x, by + 12, z); v.rotation.z = (R() - 0.5) * 0.3; g.add(v); W.circles.push({ x, z, r: 0.8 }); }
  },
  altar({ g, W, R, bx, bz, by }) {
    // Avatar's altar: a stepped stone dais with a ritual brazier and cult banners
    const st = toon('#5a4a3a'), dk = toon('#3a2a1a'), fire = glow('#ff8a3a'), ban = toon('#8a2a1a');
    for (let k = 0; k < 3; k++) g.add(mesh(new THREE.BoxGeometry(14 - k * 4, 1, 10 - k * 3), st, bx, by + 0.5 + k, bz));
    g.add(mesh(new THREE.CylinderGeometry(1.2, 0.8, 1.6, 10), dk, bx, by + 3.8, bz)); const fl = mesh(new THREE.ConeGeometry(1.1, 3, 8), fire, bx, by + 6, bz); g.add(fl);
    W.circles.push({ x: bx, z: bz, r: 6 });
    for (const s of [-1, 1]) { g.add(mesh(new THREE.CylinderGeometry(0.15, 0.15, 8, 6), dk, bx + s * 9, by + 4, bz)); g.add(mesh(new THREE.BoxGeometry(2.4, 4, 0.1), ban, bx + s * 9, by + 5.5, bz + 0.2)); }
  },
  sands({ g, W, R, bx, bz, by }) {
    // Alvarez beachhead: sand dunes, broken masts and an imperial war banner
    const sand = toon('#d8c090'), wood = toon('#5a3a1a'), ban = toon('#2a3a6a'), gold = toon('#d8a83a');
    for (let k = 0; k < 6; k++) { const d = mesh(new THREE.SphereGeometry(4 + R() * 3, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), sand, bx + (R() - 0.5) * 26, by - 0.3, bz + (R() - 0.5) * 12); d.scale.y = 0.4; g.add(d); }
    for (let k = 0; k < 3; k++) { const m = mesh(new THREE.CylinderGeometry(0.3, 0.4, 12, 6), wood, bx + (k - 1) * 8, by + 5, bz); m.rotation.z = (R() - 0.5) * 0.6; g.add(m); W.circles.push({ x: bx + (k - 1) * 8, z: bz, r: 0.6 }); }
    g.add(mesh(new THREE.BoxGeometry(4, 6, 0.1), ban, bx, by + 8, bz + 0.4)); g.add(mesh(new THREE.CircleGeometry(1, 16), gold, bx, by + 8.5, bz + 0.47));
  },
  warfield({ g, W, R, bx, bz, by }) {
    // The east field: an enchanted, cracked battleground with toppled siege towers and red banners
    const wood = toon('#4a3a2a'), ban = toon('#8a1a2a'), gl = glow('#ff5a5a');
    for (let k = 0; k < 2; k++) { const tw = mesh(new THREE.BoxGeometry(4, 12, 4), wood, bx + (k ? 8 : -8), by + 5, bz); tw.rotation.z = k ? 0.35 : -0.25; g.add(tw); W.circles.push({ x: bx + (k ? 8 : -8), z: bz, r: 2.6 }); }
    for (let k = 0; k < 5; k++) { g.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 6, 5), wood, bx + (k - 2) * 4, by + 3, bz - 4)); g.add(mesh(new THREE.BoxGeometry(1.6, 2.4, 0.06), ban, bx + (k - 2) * 4 + 0.8, by + 4.8, bz - 4)); }
    const sig = mesh(new THREE.RingGeometry(5, 5.6, 6), gl, bx, by + 6, bz + 3); sig.material = sig.material.clone(); sig.material.side = THREE.DoubleSide; g.add(sig);
  },
  fairyheart({ g, W, R, bx, bz, by }) {
    // Fairy Heart gate: Lumen Histoire's crystal glowing beneath Magnolia, cracked open to the sky
    const cr = glow('#8a3aff'), st = toon('#2a2a32'), pale = toon('#d8d0e8');
    const c1 = mesh(new THREE.OctahedronGeometry(4, 0), cr, bx, by + 7, bz); c1.scale.y = 1.8; g.add(c1);
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; const sh = mesh(new THREE.BoxGeometry(1.4, 6 + R() * 4, 1.4), st, bx + Math.cos(a) * 6, by + 3, bz + Math.sin(a) * 6); sh.rotation.set((R() - 0.5) * 0.5, a, (R() - 0.5) * 0.5); g.add(sh); W.circles.push({ x: sh.position.x, z: sh.position.z, r: 1 }); }
    const halo = mesh(new THREE.TorusGeometry(6.5, 0.2, 6, 40), pale, bx, by + 0.3, bz); halo.rotation.x = Math.PI / 2; g.add(halo); W.circles.push({ x: bx, z: bz, r: 4 });
  },
  tide({ g, W, R, bx, bz, by }) {
    // Guiltina landing: a wrecked ship, coral spires and a sea-carved dragon idol
    const wood = toon('#5a3a22'), coral = toon('#e07a6a'), st = toon('#4a7a9a'), gl = glow('#7ae0ff');
    const hull = mesh(new THREE.CylinderGeometry(3, 3, 16, 10, 1, false, 0, Math.PI), wood, bx, by + 1.5, bz); hull.rotation.set(0, 0, Math.PI / 2); hull.rotation.z = Math.PI / 2 + 0.2; g.add(hull);
    g.add(mesh(new THREE.CylinderGeometry(0.3, 0.4, 14, 6), wood, bx + 2, by + 7, bz + 1)); W.circles.push({ x: bx, z: bz, r: 7 });
    for (let k = 0; k < 6; k++) { const x = bx + (R() - 0.5) * 30, z = bz + (R() - 0.5) * 14; g.add(mesh(new THREE.ConeGeometry(0.8 + R(), 4 + R() * 4, 6), coral, x, by + 2.5, z)); }
    const idol = mesh(new THREE.ConeGeometry(2.2, 10, 6), st, bx - 10, by + 5, bz - 3); g.add(idol); g.add(mesh(new THREE.OctahedronGeometry(1, 0), gl, bx - 10, by + 10.8, bz - 3)); W.circles.push({ x: bx - 10, z: bz - 3, r: 2.4 });
  },
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

/** Swirling Anima rifts (Edolas chapter): two-way portals. */
export function buildRifts({ zoneGroup, groundAt, rifts }) {
  for (const r of rifts) { const [x, z] = r.at; const y = groundAt(x, z); const g = zoneGroup(x, z, 60);
    const c1 = glow('#ff7aff', 0.7), c2 = glow('#7ad8ff', 0.6);
    for (let i = 0; i < 3; i++) { const t = mesh(new THREE.TorusGeometry(1.6 + i * 0.5, 0.12, 6, 32), i % 2 ? c2 : c1, x, y + 2.2, z); t.rotation.x = 0.2 * i; t.userData.spin = 0.6 + i * 0.4; g.add(t); }
    const d = mesh(new THREE.CircleGeometry(1.5, 24), glow('#2a0a3a', 0.8), x, y + 2.2, z); g.add(d); }
}
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
