import { buildFountain } from './water.js';
// Round 3 world expansion: Era (Magic Council), Worth Woodsea, and enterable interiors / street props for
// Hargeon, Clover and the Hakobe trail. Pure builders: world.js passes a context with its helpers.
import * as THREE from 'three';
import { toon, glow, mesh, addOutlines, shadowAll, GFX, WIND } from './toon.js';
import { PLACE } from './fiore.js';

const off = (p, dx, dz) => [p[0] + dx, p[1] + dz];
/** Interior sites (world x,z + footprint); world.js flattens the ground under each one. */
export const SITES = {
  council: { at: off(PLACE.era.pos, 0, -6), w: 22, d: 16, h: 6.5, door: '+z' },
  hargeonTavern: { at: off(PLACE.hargeon.pos, 27, -4), w: 11, d: 8, h: 4.6, door: '-x' },
  cloverInn: { at: off(PLACE.clover.pos, 4, 24), w: 11, d: 8, h: 4.6, door: '-z' },
  hakobeLodge: { at: off(PLACE.hakobetrail.pos, -4, 18), w: 10, d: 8, h: 4.4, door: '+x' },
  rangerLodge: { at: off(PLACE.woodsea.pos, 0, 4), w: 10, d: 8, h: 4.4, door: '+z' },
};
export const SITE_FLATS = Object.values(SITES).map((s) => ({ x: s.at[0], z: s.at[1], r: Math.hypot(s.w, s.d) / 2 + 3, blend: 8 }));
export const WOODSEA_CLEARING = { x: PLACE.woodsea.pos[0], z: PLACE.woodsea.pos[1], r: 24, blend: 10 };

const ROT = { '+z': 0, '+x': Math.PI / 2, '-z': Math.PI, '-x': -Math.PI / 2 };

export function buildRegions(C) {
  const { W, zoneGroup, station, sign, yAt, R, addBox, building, decks } = C;
  const M = {
    timber: toon('#4a3020', { pat: 'plank' }), plank: toon('#9a6a40', { pat: 'plank' }), floor: toon('#8a5a36', { pat: 'plank' }),
    plaster: toon('#efe2c6'), stone: toon('#a49c90', { pat: 'brick' }), marble: toon('#eeeae2'), cobble: toon('#9a948a', { pat: 'cobble' }),
    tileR: toon('#b04a34', { pat: 'tile' }), tileB: toon('#3a5a8a', { pat: 'tile' }), tileS: toon('#5a6470', { pat: 'tile' }), thatch: toon('#a08a50', { pat: 'tile' }),
    gold: toon('#d8b040', { metal: 0.8, rough: 0.35 }), iron: toon('#4a4a52', { metal: 0.7, rough: 0.5 }), glass: toon('#b8d4e4', { emissive: '#3a5060', rough: 0.1 }),
    cloth: (c) => toon(c, { side: THREE.DoubleSide }), fire: glow('#ff9a3a'), lamp: glow('#ffd890'),
  };
  const lights = [];
  const box = (p, w, h, d, m, x, y, z, ry = 0) => { const o = mesh(new THREE.BoxGeometry(w, h, d), m, x, y, z); o.rotation.y = ry; p.add(o); return o; };
  const cyl = (p, a, b, h, m, x, y, z, s = 10) => { const o = mesh(new THREE.CylinderGeometry(a, b, h, s), m, x, y, z); p.add(o); return o; };
  const worldOf = (g, lx, lz) => { const v = new THREE.Vector3(lx, 0, lz).applyAxisAngle(new THREE.Vector3(0, 1, 0), g.rotation.y); return [g.position.x + v.x, g.position.z + v.z]; };
  const solidLocal = (g, lx, lz, w, d) => { const [cx, cz] = worldOf(g, lx, lz); const sw = Math.abs(Math.round(Math.sin(g.rotation.y))) ? d : w, sd = sw === w ? d : w; addBox(cx - sw / 2, cx + sw / 2, cz - sd / 2, cz + sd / 2, 'bld'); };
  const circLocal = (g, lx, lz, r) => { const [x, z] = worldOf(g, lx, lz); W.circles.push({ x, z, r }); };

  // ------------------------------------------------------------- furniture kit (local coords)
  const F = {
    table(g, x, z, w = 1.8, d = 1, ry = 0) { const t = new THREE.Group(); t.position.set(x, 0, z); t.rotation.y = ry; g.add(t); box(t, w, 0.1, d, M.plank, 0, 0.82, 0); for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(t, 0.1, 0.8, 0.1, M.timber, sx * (w / 2 - 0.12), 0.4, sz * (d / 2 - 0.12)); return t; },
    chair(g, x, z, ry = 0) { const c = new THREE.Group(); c.position.set(x, 0, z); c.rotation.y = ry; g.add(c); box(c, 0.5, 0.07, 0.5, M.plank, 0, 0.48, 0); box(c, 0.5, 0.6, 0.06, M.timber, 0, 0.8, -0.22); for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(c, 0.06, 0.48, 0.06, M.timber, sx * 0.2, 0.24, sz * 0.2); },
    bench(g, x, z, l = 2.4, ry = 0) { const b = new THREE.Group(); b.position.set(x, 0, z); b.rotation.y = ry; g.add(b); box(b, l, 0.08, 0.42, M.plank, 0, 0.46, 0); for (const s of [-1, 1]) box(b, 0.08, 0.46, 0.38, M.timber, s * (l / 2 - 0.2), 0.23, 0); },
    shelf(g, x, z, ry = 0, w = 2) { const s = new THREE.Group(); s.position.set(x, 0, z); s.rotation.y = ry; g.add(s); box(s, w, 2.4, 0.08, M.timber, 0, 1.2, -0.22); for (const sx of [-1, 1]) box(s, 0.08, 2.4, 0.5, M.timber, sx * w / 2, 1.2, 0);
      const cols = ['#8a2a2a', '#2a4a8a', '#3a6a3a', '#8a6a2a', '#5a2a6a', '#c8b890'];
      for (let k = 0; k < 4; k++) { box(s, w, 0.06, 0.48, M.plank, 0, 0.3 + k * 0.6, 0); let bx = -w / 2 + 0.12; while (bx < w / 2 - 0.15) { const bw = 0.06 + R() * 0.07, bh = 0.3 + R() * 0.18; box(s, bw, bh, 0.3, toon(cols[(R() * cols.length) | 0]), bx + bw / 2, 0.33 + k * 0.6 + bh / 2, 0.02); bx += bw + 0.01 + (R() < 0.1 ? 0.2 : 0); } } },
    barrel(g, x, z, y = 0) { const b = cyl(g, 0.36, 0.36, 0.95, M.plank, x, y + 0.47, z, 12); b.scale.set(1, 1, 1); for (const yy of [0.15, 0.8]) cyl(g, 0.375, 0.375, 0.06, M.iron, x, y + yy, z, 12); cyl(g, 0.3, 0.3, 0.02, M.timber, x, y + 0.96, z, 12); },
    crate(g, x, z, s = 0.8, y = 0, ry = 0) { box(g, s, s, s, M.plank, x, y + s / 2, z, ry); for (const k of [-1, 1]) box(g, s + 0.02, 0.08, s + 0.02, M.timber, x, y + s / 2 + k * s * 0.4, z, ry); },
    bed(g, x, z, ry = 0, quilt = '#8a3a3a') { const b = new THREE.Group(); b.position.set(x, 0, z); b.rotation.y = ry; g.add(b); box(b, 1.2, 0.4, 2.1, M.timber, 0, 0.3, 0); box(b, 1.1, 0.16, 2, toon('#f0ead8'), 0, 0.58, 0); box(b, 1.14, 0.08, 1.4, toon(quilt), 0, 0.68, 0.3); box(b, 0.8, 0.14, 0.38, toon('#ffffff'), 0, 0.72, -0.72); box(b, 1.2, 1, 0.1, M.timber, 0, 0.6, -1.05); },
    hearth(g, x, z, ry = 0) { const h = new THREE.Group(); h.position.set(x, 0, z); h.rotation.y = ry; g.add(h); box(h, 2.2, 1.6, 0.8, M.stone, 0, 0.8, 0); box(h, 1.2, 0.9, 0.3, toon('#1a1410'), 0, 0.6, 0.3); box(h, 2.5, 0.16, 1, M.timber, 0, 1.66, 0.05); box(h, 1.1, 3.2, 0.7, M.stone, 0, 3.2, -0.05);
      const f = mesh(new THREE.ConeGeometry(0.32, 0.65, 8), M.fire, 0, 0.5, 0.35); f.userData.dyn = true; h.add(f); const f2 = mesh(new THREE.ConeGeometry(0.2, 0.45, 7), glow('#ffe07a'), 0.15, 0.42, 0.42); f2.userData.dyn = true; h.add(f2);
      W.anim.push((t) => { f.scale.set(1 + Math.sin(t * 13) * 0.08, 1 + Math.sin(t * 9 + 1) * 0.18, 1); f2.scale.y = 1 + Math.sin(t * 15) * 0.22; });
      for (let i = 0; i < 3; i++) { const l = mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.8, 6), M.timber, -0.2 + i * 0.2, 0.2, 0.32); l.rotation.z = Math.PI / 2 + (i - 1) * 0.4; h.add(l); } return h; },
    counter(g, x, z, l = 4, ry = 0) { const c = new THREE.Group(); c.position.set(x, 0, z); c.rotation.y = ry; g.add(c); box(c, l, 1.05, 0.7, M.timber, 0, 0.52, 0); box(c, l + 0.1, 0.08, 0.8, M.plank, 0, 1.08, 0); for (let i = 0; i < 4; i++) { const m = cyl(c, 0.08, 0.07, 0.18, toon('#d8d0c0'), -l / 2 + 0.5 + i * 0.4, 1.21, 0, 8); void m; } return c; },
    rug(g, x, z, w, d, col) { const r = mesh(new THREE.PlaneGeometry(w, d), toon(col), x, 0.03, z); r.rotation.x = -Math.PI / 2; g.add(r); const b = mesh(new THREE.PlaneGeometry(w - 0.3, d - 0.3), toon('#e8d8a8'), x, 0.035, z); b.rotation.x = -Math.PI / 2; b.scale.set(1, 1, 1); g.add(b); const c = mesh(new THREE.PlaneGeometry(w - 0.5, d - 0.5), toon(col), x, 0.04, z); c.rotation.x = -Math.PI / 2; g.add(c); },
    lantern(g, x, y, z) { box(g, 0.24, 0.32, 0.24, M.iron, x, y, z); const l = mesh(new THREE.SphereGeometry(0.1, 8, 6), M.lamp, x, y, z); g.add(l); W.lanterns.push(l); },
    candle(g, x, y, z) { cyl(g, 0.04, 0.04, 0.18, toon('#f4ecd8'), x, y + 0.09, z, 6); const f = mesh(new THREE.SphereGeometry(0.035, 6, 4), glow('#ffd070'), x, y + 0.22, z); f.scale.y = 1.6; g.add(f); },
    plant(g, x, z) { cyl(g, 0.22, 0.16, 0.4, toon('#a0583a'), x, 0.2, z, 10); for (let i = 0; i < 5; i++) { const l = mesh(new THREE.SphereGeometry(0.2, 7, 5), toon('#4a8a3a'), x + (R() - 0.5) * 0.25, 0.55 + R() * 0.3, z + (R() - 0.5) * 0.25); l.scale.set(1, 0.7, 1); g.add(l); } },
    mug(g, x, y, z) { cyl(g, 0.06, 0.055, 0.14, M.plank, x, y + 0.07, z, 8); },
  };

  // ------------------------------------------------------------- enterable building
  // Lower walls are static (baked); upper walls, beams and roof form a cutaway that hides while you are inside.
  W.cutaways = W.cutaways || [];
  const hall = ({ parent, site, wall = M.plaster, lower = M.stone, roof = M.tileR, trim = M.timber, sign: label, furnish, gable = true, pitch = 0.62, light = '#ffc88a' }) => {
    const [x, z] = site.at; const { w, d, h } = site; const y = yAt(x, z); const t = 0.3, low = 1.5, gw = 2.6;
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ROT[site.door]; parent.add(g);
    const cut = new THREE.Group(); cut.userData.dyn = true; g.add(cut);
    // foundation + plank floor (walkable deck)
    box(g, w + 0.5, 0.45, d + 0.5, M.stone, 0, 0.12, 0); box(g, w - 0.2, 0.12, d - 0.2, M.floor, 0, 0.4, 0);
    box(g, gw + 0.6, 0.25, 1.1, M.stone, 0, 0.1, d / 2 + 0.7); // door step
    const segs = [[0, -d / 2, w, t], [-w / 2, 0, t, d], [w / 2, 0, t, d], [-(gw / 2 + (w - gw) / 4), d / 2, (w - gw) / 2, t], [gw / 2 + (w - gw) / 4, d / 2, (w - gw) / 2, t]];
    for (const [cx, cz, sw, sd] of segs) {
      box(g, sw, low, sd, lower, cx, 0.45 + low / 2, cz); box(cut, sw, h - low, sd, wall, cx, 0.45 + low + (h - low) / 2, cz);
      solidLocal(g, cx, cz, sw + 0.1, sd + 0.1);
    }
    box(cut, gw + 0.4, 0.5, t + 0.1, trim, 0, 0.45 + 2.7, d / 2); box(cut, gw + 0.2, h - 3.2, t, wall, 0, 0.45 + 3 + (h - 3.2) / 2, d / 2);
    for (const s of [-1, 1]) box(g, 0.25, 2.8, 0.42, trim, s * (gw / 2 + 0.1), 0.45 + 1.4, d / 2);
    // timber framing: corner posts, mid posts, a beam line at the floor-plate height
    for (const [px, pz] of [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]]) box(cut, 0.36, h, 0.36, trim, px, 0.45 + h / 2, pz);
    for (let k = 1; k < Math.round(w / 3); k++) { const px = -w / 2 + k * w / Math.round(w / 3); if (Math.abs(px) < gw / 2 + 0.3) continue; for (const pz of [-d / 2, d / 2]) box(cut, 0.22, h - low, 0.36, trim, px, 0.45 + low + (h - low) / 2, pz); }
    for (const pz of [-d / 2, d / 2]) box(cut, w + 0.1, 0.24, 0.38, trim, 0, 0.45 + low + 0.12, pz);
    for (const px of [-w / 2, w / 2]) box(cut, 0.38, 0.24, d + 0.1, trim, px, 0.45 + low + 0.12, 0);
    // windows with shutters, sills and warm glass, on both long walls and the gable ends
    const win = (wx, wz, faceX) => { const o = new THREE.Group(); o.position.set(wx, 0.45 + low + 1.2, wz); if (faceX) o.rotation.y = Math.PI / 2; cut.add(o);
      box(o, 1.2, 1.2, t + 0.12, trim, 0, 0, 0); box(o, 0.95, 0.95, t + 0.16, M.glass, 0, 0, 0); box(o, 0.06, 0.95, t + 0.2, trim, 0, 0, 0); box(o, 0.95, 0.06, t + 0.2, trim, 0, 0, 0);
      box(o, 1.4, 0.1, t + 0.4, M.stone, 0, -0.65, 0); for (const s of [-1, 1]) { const sh = box(o, 0.5, 1.2, 0.05, toon('#3a5a3a'), s * 0.9, 0, (t / 2 + 0.1) * 1); sh.rotation.y = s * 0.25; } };
    for (let k = 0; k < Math.max(1, Math.round(w / 4.5)); k++) { const wx = -w / 2 + (k + 0.5) * w / Math.max(1, Math.round(w / 4.5)); win(wx, -d / 2, false); if (Math.abs(wx) > gw / 2 + 0.9) win(wx, d / 2, false); }
    for (const s of [-1, 1]) win(s * w / 2, 0, true);
    // roof: two shingled slabs + gable triangles + ridge + chimney, with interior tie beams
    const rh = (d / 2 + 0.6) * Math.tan(pitch), top = 0.45 + h;
    if (gable) {
      for (const s of [-1, 1]) { const sl = box(cut, w + 1.2, 0.22, (d / 2 + 0.8) / Math.cos(pitch), roof, 0, top + rh / 2, s * (d / 4 + 0.2)); sl.rotation.x = s * pitch; }
      const tri = new THREE.Shape(); tri.moveTo(-d / 2, 0); tri.lineTo(d / 2, 0); tri.lineTo(0, rh * 0.98); tri.lineTo(-d / 2, 0);
      for (const s of [-1, 1]) { const gm = mesh(new THREE.ExtrudeGeometry(tri, { depth: 0.25, bevelEnabled: false }), wall, s * (w / 2) - 0.125 * (s < 0 ? -1 : 1) * 0 - 0.125, top, 0); gm.rotation.y = Math.PI / 2; cut.add(gm);
        box(cut, 0.2, 0.2, d / Math.cos(pitch) * 0.5, trim, s * (w / 2 + 0.15), top + rh / 2, -d / 4).rotation.x = -pitch; box(cut, 0.2, 0.2, d / Math.cos(pitch) * 0.5, trim, s * (w / 2 + 0.15), top + rh / 2, d / 4).rotation.x = pitch; }
      box(cut, w + 1.3, 0.3, 0.3, trim, 0, top + rh + 0.05, 0);
      for (let k = 0; k < Math.round(w / 2.5); k++) box(cut, 0.22, 0.26, d, trim, -w / 2 + (k + 0.5) * w / Math.round(w / 2.5), top - 0.2, 0);
      box(cut, 0.9, 2.4, 0.9, M.stone, w * 0.3, top + rh, -d * 0.18); box(cut, 1.05, 0.18, 1.05, M.stone, w * 0.3, top + rh + 1.2, -d * 0.18);
    }
    if (label) { const st = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.8), new THREE.MeshBasicMaterial({ map: C.textTexture(label), fog: true })); st.position.set(0, 0.45 + 3.5, d / 2 + 0.24); cut.add(st);
      const hang = new THREE.Group(); hang.position.set(gw / 2 + 1, 0.45 + 2.9, d / 2 + 0.6); g.add(hang); box(hang, 0.08, 0.08, 1.1, M.iron, 0, 0.3, -0.4); const pl = box(hang, 0.06, 0.6, 0.8, M.plank, 0, -0.05, 0); void pl; }
    F.lantern(g, -gw / 2 - 0.5, 0.45 + 2.4, d / 2 + 0.35); F.lantern(g, gw / 2 + 0.5, 0.45 + 2.4, d / 2 + 0.35);
    // interior
    const inside = new THREE.Group(); inside.position.y = 0.46; g.add(inside); furnish && furnish(inside, g, w, d, h);
    // floor deck and roof cutaway
    { const sw = Math.abs(Math.round(Math.sin(g.rotation.y))) ? d : w, sd = sw === w ? d : w;
      decks.push({ minX: x - sw / 2 + 0.1, maxX: x + sw / 2 - 0.1, minZ: z - sd / 2 + 0.1, maxZ: z + sd / 2 - 0.1, y: y + 0.46 });
      W.cutaways.push({ g: cut, minX: x - sw / 2, maxX: x + sw / 2, minZ: z - sd / 2, maxZ: z + sd / 2 }); }
    if (GFX.high) { const pl = new THREE.PointLight(light, GFX.real ? 7 : 4, Math.max(w, d) * 1.1, 1.6); const [lx, lz] = worldOf(g, 0, 0); pl.position.set(lx, y + h - 0.8, lz); lights.push(pl); C.scene.add(pl); }
    addOutlines(g); shadowAll(g, true, true); return g;
  };

  // ------------------------------------------------------------- street props (world coords)
  const P = {
    lamppost(g, x, z) { const y = yAt(x, z); cyl(g, 0.09, 0.13, 3.6, M.iron, x, y + 1.8, z, 8); cyl(g, 0.22, 0.26, 0.3, M.iron, x, y + 0.15, z, 8); box(g, 0.6, 0.06, 0.06, M.iron, x + 0.25, y + 3.5, z);
      const cage = box(g, 0.32, 0.42, 0.32, M.iron, x + 0.5, y + 3.2, z); void cage; const l = mesh(new THREE.SphereGeometry(0.14, 8, 6), M.lamp, x + 0.5, y + 3.2, z); g.add(l); W.lanterns.push(l); cyl(g, 0.01, 0.24, 0.2, M.iron, x + 0.5, y + 3.5, z, 4); W.circles.push({ x, z, r: 0.3 }); },
    stall(g, x, z, ry, col, goods = 'fruit') { const s = new THREE.Group(); s.position.set(x, yAt(x, z), z); s.rotation.y = ry; g.add(s);
      box(s, 2.6, 0.9, 1.2, M.plank, 0, 0.45, 0); for (const sx of [-1.2, 1.2]) for (const sz of [-0.55, 0.55]) box(s, 0.1, 2.4, 0.1, M.timber, sx, 1.2, sz);
      for (let i = 0; i < 6; i++) { const a = box(s, 0.46, 0.05, 1.5, toon(i % 2 ? '#f4ecd8' : col, { side: THREE.DoubleSide }), -1.15 + i * 0.46, 2.45, 0.1); a.rotation.x = 0.25; }
      const gc = goods === 'fish' ? ['#9ab0c0', '#c0c8d0', '#7a9ab0'] : goods === 'cloth' ? ['#c83a3a', '#3a6ad0', '#e8c040'] : goods === 'lacrima' ? ['#7ad8ff', '#ff7ad8', '#a0ff7a'] : ['#e04030', '#f0a030', '#80c040'];
      for (let i = 0; i < 14; i++) { const gx = -1.1 + (i % 7) * 0.36, gz = -0.3 + Math.floor(i / 7) * 0.5; const o = goods === 'lacrima' ? mesh(new THREE.OctahedronGeometry(0.12, 0), glow(gc[i % 3]), gx, 1.05, gz) : goods === 'fish' ? mesh(new THREE.CapsuleGeometry(0.07, 0.3, 2, 6), toon(gc[i % 3]), gx, 0.98, gz) : mesh(new THREE.SphereGeometry(0.11, 8, 6), toon(gc[i % 3]), gx, 1.0, gz); if (goods === 'fish') o.rotation.z = Math.PI / 2; s.add(o); }
      for (const sx of [-1.6, 1.7]) { F.crate(s, sx, 0.2, 0.6, 0, R()); } W.circles.push({ x, z, r: 1.5 }); },
    barrels(g, x, z, n = 3) { const y = yAt(x, z); for (let i = 0; i < n; i++) F.barrel(g, x + (i % 2) * 0.8 - 0.4, z + Math.floor(i / 2) * 0.8, y); W.circles.push({ x, z: z + 0.4, r: 1 }); },
    crates(g, x, z, n = 4) { const y = yAt(x, z); for (let i = 0; i < n; i++) F.crate(g, x + (i % 2) * 0.9, z + (Math.floor(i / 2) % 2) * 0.9, 0.85, y + (i >= 4 ? 0.85 : 0), R() * 0.3); W.circles.push({ x: x + 0.45, z: z + 0.45, r: 1.1 }); },
    cart(g, x, z, ry) { const c = new THREE.Group(); c.position.set(x, yAt(x, z), z); c.rotation.y = ry; g.add(c); box(c, 1.6, 0.5, 2.6, M.plank, 0, 0.9, 0); for (const sx of [-0.9, 0.9]) { const wh = mesh(new THREE.TorusGeometry(0.5, 0.07, 6, 16), M.timber, sx, 0.55, -0.3); wh.rotation.y = Math.PI / 2; c.add(wh); for (let k = 0; k < 4; k++) { const sp = box(c, 0.04, 0.95, 0.04, M.timber, sx, 0.55, -0.3); sp.rotation.x = k * Math.PI / 4; } }
      for (const sx of [-0.3, 0.3]) { const sh = box(c, 0.07, 0.07, 2, M.timber, sx, 0.8, 2.1); sh.rotation.x = 0.15; } F.crate(c, 0.2, -0.4, 0.6, 1.15); F.barrel(c, -0.35, 0.6, 1.15); W.circles.push({ x, z, r: 1.6 }); },
    fence(g, pts) { for (let i = 0; i < pts.length - 1; i++) { const [x0, z0] = pts[i], [x1, z1] = pts[i + 1]; const L = Math.hypot(x1 - x0, z1 - z0), n = Math.ceil(L / 2); for (let k = 0; k <= n; k++) { const x = x0 + (x1 - x0) * k / n, z = z0 + (z1 - z0) * k / n; box(g, 0.14, 1.1, 0.14, M.timber, x, yAt(x, z) + 0.55, z); }
      const a = Math.atan2(x1 - x0, z1 - z0); for (const hy of [0.45, 0.9]) { const r = box(g, 0.07, 0.1, L, M.plank, (x0 + x1) / 2, yAt((x0 + x1) / 2, (z0 + z1) / 2) + hy, (z0 + z1) / 2); r.rotation.y = a; } } },
    well(g, x, z) { const y = yAt(x, z); cyl(g, 1, 1.05, 0.9, M.stone, x, y + 0.45, z, 14); cyl(g, 0.85, 0.85, 0.05, glow('#2a5a7a'), x, y + 0.6, z, 14); for (const s of [-0.9, 0.9]) box(g, 0.14, 2.2, 0.14, M.timber, x + s, y + 1.4, z); const r = box(g, 2.4, 0.2, 1.4, M.tileR, x, y + 2.6, z); r.rotation.x = 0; cyl(g, 0.08, 0.08, 1.8, M.timber, x, y + 1.9, z, 6).rotation.z = Math.PI / 2; W.circles.push({ x, z, r: 1.2 }); },
    flowers(g, x, z, w = 2) { const y = yAt(x, z); box(g, w, 0.35, 0.6, M.stone, x, y + 0.17, z); const cols = ['#e84a6a', '#f4d040', '#ffffff', '#a060e0', '#f08a30']; for (let i = 0; i < w * 6; i++) { const f = mesh(new THREE.SphereGeometry(0.07, 6, 4), toon(cols[i % 5]), x - w / 2 + 0.1 + R() * (w - 0.2), y + 0.45 + R() * 0.12, z + (R() - 0.5) * 0.45); g.add(f); } },
    paving(g, x, z, w, d, ry = 0) { (W.noGrass ||= []).push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 }); const p = mesh(new THREE.BoxGeometry(w, 0.12, d), M.cobble, x, yAt(x, z) + 0.04, z); p.rotation.y = ry; p.receiveShadow = true; g.add(p); },
  };

  // ============================================================== ERA: the Magic Council
  { const E = PLACE.era.pos; const g = zoneGroup(E[0], E[1], 60); const S = SITES.council; const y = yAt(...S.at);
    P.paving(g, E[0], E[1] + 10, 34, 18); P.paving(g, E[0], E[1] + 24, 8, 14);
    hall({ parent: g, site: S, wall: M.marble, lower: M.marble, roof: M.tileB, trim: toon('#c8c0b0'), sign: 'MAGIC COUNCIL · ERA', pitch: 0.42, light: '#e0e8ff', furnish: (o, gg, w, d) => {
      // council chamber: raised dais, nine seats in an arc, emblem disc, long carpet, archive shelves
      F.rug(o, 0, 1.5, 2.6, d - 3, '#3a3a8a'); box(o, 12, 0.35, 3.2, M.marble, 0, 0.17, -d / 2 + 2); box(o, 12.4, 0.12, 3.4, toon('#c8a040'), 0, 0.36, -d / 2 + 2);
      for (let i = 0; i < 9; i++) { const a = (i - 4) * 0.16; const cx = Math.sin(a) * 7, cz = -d / 2 + 6.6 - Math.cos(a) * 5.2; const ch = new THREE.Group(); ch.position.set(cx, 0.4, cz); ch.rotation.y = -a; o.add(ch); box(ch, 0.9, 0.12, 0.8, toon('#5a2a6a'), 0, 0.55, 0); box(ch, 0.9, i === 4 ? 2.2 : 1.6, 0.14, toon('#3a1a4a'), 0, i === 4 ? 1.6 : 1.3, -0.36); box(ch, 0.95, 0.1, 0.18, M.gold, 0, i === 4 ? 2.75 : 2.15, -0.36); }
      box(o, 9, 0.9, 0.8, M.timber, 0, 0.45, -d / 2 + 4.8);
      const em = mesh(new THREE.CircleGeometry(1.5, 32), glow('#9ab8ff', 0.9), 0, 3.8, -d / 2 + 0.2); o.add(em); const er = mesh(new THREE.TorusGeometry(1.6, 0.1, 6, 32), M.gold, 0, 3.8, -d / 2 + 0.22); o.add(er);
      for (const s of [-1, 1]) { F.shelf(o, s * (w / 2 - 0.5), 1, s * -Math.PI / 2, 3); F.shelf(o, s * (w / 2 - 0.5), 4.5, s * -Math.PI / 2, 2.4); for (const cz of [-2, 2.5]) { cyl(o, 0.35, 0.4, 5.6, M.marble, s * 3.4, 2.8, cz, 14); } }
      for (const s of [-1, 1]) F.bench(o, s * 3.4, 5.6, 3, 0); F.plant(o, -2, d / 2 - 1); F.plant(o, 2, d / 2 - 1);
      for (const s of [-1, 1]) { const b = mesh(new THREE.PlaneGeometry(1.1, 3), M.cloth('#2a3a8a'), s * 5.5, 3.6, -d / 2 + 0.2); o.add(b); }
      circLocal(gg, 0, -d / 2 + 4.8, 1.2); for (const s of [-1, 1]) for (const cz of [-2, 2.5]) circLocal(gg, s * 3.4, cz, 0.5);
    } });
    // exterior grandeur: colonnade portico, twin domed towers, central dome and bell spire
    const front = S.at[1] + S.d / 2; box(g, 14, 0.5, 3.6, M.marble, S.at[0], y + 0.25, front + 2);
    const up = new THREE.Group(); up.userData.dyn = true; g.add(up); W.cutaways.push({ g: up, minX: S.at[0] - S.w / 2, maxX: S.at[0] + S.w / 2, minZ: S.at[1] - S.d / 2, maxZ: front + 5 }); (W.noGrass ||= []).push({ minX: S.at[0] - 8, maxX: S.at[0] + 8, minZ: front, maxZ: front + 5 });
    box(up, 15, 0.9, 4, M.marble, S.at[0], y + 7.2, front + 2.1);
    const ped = new THREE.Shape(); ped.moveTo(-7.5, 0); ped.lineTo(7.5, 0); ped.lineTo(0, 2.4); ped.lineTo(-7.5, 0); const pm = mesh(new THREE.ExtrudeGeometry(ped, { depth: 0.6, bevelEnabled: false }), M.marble, S.at[0], y + 7.65, front + 3.6); up.add(pm);
    for (let i = 0; i < 6; i++) { const cx = S.at[0] - 6 + i * 2.4; if (Math.abs(cx - S.at[0]) < 1.6) continue; cyl(g, 0.38, 0.45, 6.4, M.marble, cx, y + 3.7, front + 3.4, 16); box(g, 1, 0.3, 1, M.marble, cx, y + 0.6, front + 3.4); box(up, 1, 0.3, 1, M.marble, cx, y + 6.9, front + 3.4); W.circles.push({ x: cx, z: front + 3.4, r: 0.55 }); }
    for (const s of [-1, 1]) { const tx = S.at[0] + s * (S.w / 2 + 2), tz = S.at[1] - 2; cyl(g, 2.3, 2.5, 12, M.marble, tx, y + 6, tz, 16); cyl(g, 2.5, 2.5, 0.5, M.gold, tx, y + 12.2, tz, 16); const dm = mesh(new THREE.SphereGeometry(2.4, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), M.tileB, tx, y + 12.4, tz); g.add(dm); cyl(g, 0.05, 0.15, 2.2, M.gold, tx, y + 15.8, tz, 6); for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; box(g, 0.5, 1.4, 0.2, M.glass, tx + Math.cos(a) * 2.38, y + 9, tz + Math.sin(a) * 2.38, -a + Math.PI / 2); } W.circles.push({ x: tx, z: tz, r: 2.6 }); }
    const dome = mesh(new THREE.SphereGeometry(4.2, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), M.tileB, S.at[0], y + 9.2, S.at[1] - 3); up.add(dome); cyl(up, 4.3, 4.3, 1.6, M.marble, S.at[0], y + 8.6, S.at[1] - 3, 24);
    cyl(up, 0.7, 0.9, 3, M.marble, S.at[0], y + 14.6, S.at[1] - 3, 10); const orb = mesh(new THREE.SphereGeometry(0.5, 12, 8), glow('#bcd0ff'), S.at[0], y + 16.6, S.at[1] - 3); up.add(orb);
    // plaza: fountain with council statue, lamp posts, flowerbeds, town houses on the flanks
    { const fx = E[0], fz = E[1] + 16; const fy = yAt(fx, fz); buildFountain(g, { x: fx, y: fy, z: fz, scale: 0.85, W, stone: '#e4e0d8', trim: '#f2efe8', accent: '#9ab4e8' }); W.circles.push({ x: fx, z: fz, r: 3.5 }); }
    for (const s of [-1, 1]) { for (const dz of [4, 12, 20]) P.lamppost(g, E[0] + s * 9, E[1] + dz); P.flowers(g, E[0] + s * 5, E[1] + 22, 3); }
    for (const [dx, dz, door, rc] of [[-20, 8, '+x', C.roofB], [-20, 20, '+x', C.roofR], [20, 8, '-x', C.roofG], [20, 20, '-x', C.roofB], [-12, 30, '+z', C.roofP], [12, 30, '-z', C.roofR]]) building({ x: E[0] + dx, z: E[1] + dz, w: 7, d: 6, h: 4.2, roof: rc, door: door === '-z' ? '+z' : door, parent: g, y: yAt(E[0] + dx, E[1] + dz) });
    for (const s of [-1, 1]) { const b = mesh(new THREE.PlaneGeometry(1.2, 3.4), M.cloth('#2a3a8a'), S.at[0] + s * 4.2, y + 5.6, front + 3.75); up.add(b); }
    station(g, PLACE.era); sign(g, E[0] + 6, E[1] + 34, 'ERA · MAGIC COUNCIL ↑', 0); addOutlines(g); shadowAll(g, true, true); }

  // ============================================================== WORTH WOODSEA
  { const Wd = PLACE.woodsea.pos; const g = zoneGroup(Wd[0], Wd[1], 90);
    hall({ parent: g, site: SITES.rangerLodge, wall: M.plank, lower: M.stone, roof: M.thatch, sign: 'WOODSEA RANGER LODGE', furnish: (o, gg, w, d) => {
      F.hearth(o, 0, -d / 2 + 0.6); F.rug(o, 0, -0.5, 3.2, 2.2, '#6a3a2a'); F.table(o, 2.6, 1.5, 1.8, 1); for (const s of [-1, 1]) F.chair(o, 2.6 + s * 0.6, 2.3, Math.PI);
      F.bed(o, -w / 2 + 1, 1.6, 0, '#3a6a3a'); F.shelf(o, w / 2 - 0.4, -1.8, -Math.PI / 2, 2); F.barrel(o, -w / 2 + 0.7, -d / 2 + 0.8); F.crate(o, w / 2 - 0.8, d / 2 - 0.9, 0.7);
      for (let i = 0; i < 3; i++) { const p = mesh(new THREE.TorusGeometry(0.3, 0.04, 6, 14, Math.PI), M.timber, -2 + i * 0.8, 2.6, -d / 2 + 0.25); o.add(p); } F.candle(o, 2.6, 0.88, 1.5); F.mug(o, 2.2, 0.88, 1.3);
      const map = mesh(new THREE.PlaneGeometry(1.6, 1.1), toon('#d8c8a0'), -2.6, 2.2, -d / 2 + 0.2); o.add(map); circLocal(gg, 0, -d / 2 + 0.6, 1.2); circLocal(gg, 2.6, 1.5, 1);
    } });
    // ancient giants: buttressed trunks, root flares, layered crowns; god-ray shafts and ground mist
    const bark = toon('#5a4030'), bark2 = toon('#4a3424'), leaf = toon('#2f6a2a'), leaf2 = toon('#3f7f32'), moss = toon('#5a7a2a');
    const giants = []; for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2 + R() * 0.3, r = 30 + R() * 32; giants.push([Wd[0] + Math.cos(a) * r, Wd[1] + Math.sin(a) * r, 0.8 + R() * 0.6]); }
    for (const [x, z, s] of giants) { const y = yAt(x, z) - 0.3; const tr = new THREE.Group(); tr.position.set(x, y, z); tr.scale.setScalar(s); g.add(tr);
      cyl(tr, 1.3, 2.2, 18, bark, 0, 9, 0, 9); for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; const rt = mesh(new THREE.ConeGeometry(0.9, 4, 5), bark2, Math.cos(a) * 2, 1.2, Math.sin(a) * 2); rt.rotation.z = Math.cos(a) * 1.1; rt.rotation.x = -Math.sin(a) * 1.1; tr.add(rt); }
      const mp = mesh(new THREE.SphereGeometry(1.4, 8, 6), moss, 0.9, 3, 1); mp.scale.set(0.8, 1.5, 0.5); tr.add(mp);
      for (let k = 0; k < 6; k++) { const ly = 15 + k * 1.8; const c = mesh(new THREE.IcosahedronGeometry(5.5 - k * 0.6, 1), k % 2 ? leaf : leaf2, (R() - 0.5) * 3, ly, (R() - 0.5) * 3); c.scale.y = 0.55; tr.add(c); }
      for (let k = 0; k < 3; k++) { const a = R() * 6.28; const br = mesh(new THREE.CylinderGeometry(0.25, 0.5, 6, 6), bark, Math.cos(a) * 2.4, 12 + k * 2, Math.sin(a) * 2.4); br.rotation.z = Math.cos(a) * 0.9; br.rotation.x = -Math.sin(a) * 0.9; tr.add(br); }
      W.circles.push({ x, z, r: 2.4 * s }); }
    // camp: fire ring, log seats, tents, lantern line, signage
    { const cx = Wd[0] + 8, cz = Wd[1] + 14, y = yAt(cx, cz); for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2; const st = mesh(new THREE.DodecahedronGeometry(0.28, 0), M.stone, cx + Math.cos(a) * 0.9, y + 0.15, cz + Math.sin(a) * 0.9); g.add(st); }
      const f = mesh(new THREE.ConeGeometry(0.5, 1.1, 8), M.fire, cx, y + 0.5, cz); f.userData.dyn = true; g.add(f); W.anim.push((t) => { f.scale.set(1 + Math.sin(t * 11) * 0.1, 1 + Math.sin(t * 7) * 0.2, 1); });
      for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2 + 0.4; const lg = mesh(new THREE.CylinderGeometry(0.28, 0.3, 2, 8), bark, cx + Math.cos(a) * 2.4, y + 0.3, cz + Math.sin(a) * 2.4); lg.rotation.z = Math.PI / 2; lg.rotation.y = -a + Math.PI / 2; g.add(lg); }
      for (const [tx, tz, col] of [[-7, 2, '#c8a060'], [-4, 9, '#8a6a3a'], [7, 0, '#7a8a5a']]) { const tg = new THREE.Group(); tg.position.set(cx + tx, yAt(cx + tx, cz + tz), cz + tz); tg.rotation.y = R() * 3; g.add(tg); const tent = mesh(new THREE.ConeGeometry(1.8, 2.2, 4, 1, true), M.cloth(col), 0, 1.1, 0); tent.rotation.y = Math.PI / 4; tg.add(tent); W.circles.push({ x: cx + tx, z: cz + tz, r: 1.6 }); }
      W.circles.push({ x: cx, z: cz, r: 1.1 }); P.crates(g, cx - 3, cz - 5, 3); P.barrels(g, cx + 3, cz - 5, 3); }
    for (const dz of [16, 28, 40]) P.lamppost(g, Wd[0] - 3, Wd[1] + dz);
    // god rays: tall additive shafts that slowly breathe (all tiers, cheap)
    const rayM = new THREE.MeshBasicMaterial({ color: '#fff4c8', transparent: true, opacity: 0.08, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: true });
    for (let i = 0; i < 9; i++) { const x = Wd[0] + (R() - 0.5) * 60, z = Wd[1] + (R() - 0.5) * 60; const ry = mesh(new THREE.CylinderGeometry(0.6, 3.2, 30, 10, 1, true), rayM, x, yAt(x, z) + 14, z); ry.rotation.z = 0.35; ry.rotation.y = 0.6; ry.userData.dyn = true; ry.userData.noOutline = true; ry.renderOrder = 3; g.add(ry); }
    W.anim.push((t) => { rayM.opacity = 0.06 + Math.sin(t * 0.4) * 0.025; });
    // ground mist: soft camera-facing sprites
    { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const gr = x.createRadialGradient(32, 32, 2, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
      const tex = new THREE.CanvasTexture(c); const sm = new THREE.SpriteMaterial({ map: tex, color: '#dfe8e0', transparent: true, opacity: 0.35, depthWrite: false, fog: true });
      for (let i = 0; i < (GFX.high ? 40 : 16); i++) { const a = R() * 6.28, r = 8 + R() * 55; const x2 = Wd[0] + Math.cos(a) * r, z2 = Wd[1] + Math.sin(a) * r; const s = new THREE.Sprite(sm); s.position.set(x2, yAt(x2, z2) + 0.8, z2); s.scale.set(14, 3.5, 1); s.userData.dyn = true; g.add(s); const ph = R() * 6; W.anim.push((t) => { s.position.y = yAt(x2, z2) + 0.8 + Math.sin(t * 0.3 + ph) * 0.3; }); } }
    station(g, PLACE.woodsea); sign(g, Wd[0] - 5, Wd[1] + 46, 'WORTH WOODSEA · Ranger Lodge ↑', 0); addOutlines(g); shadowAll(g, true, true); g.traverse((o) => { if (o.material === rayM || o.isSprite || o.material === leaf || o.material === leaf2) { o.castShadow = false; o.receiveShadow = false; } }); }

  // ============================================================== HARGEON: market street + harbour tavern
  { const Hp = PLACE.hargeon.pos; const g = zoneGroup(Hp[0], Hp[1], 60);
    hall({ parent: g, site: SITES.hargeonTavern, wall: M.plaster, roof: M.tileR, sign: 'THE SALTY KRAKEN', furnish: (o, gg, w, d) => {
      F.counter(o, -w / 2 + 3, -d / 2 + 1.4, 4.5); F.shelf(o, -w / 2 + 3, -d / 2 + 0.4, 0, 3.6); for (let i = 0; i < 3; i++) F.barrel(o, w / 2 - 0.7, -d / 2 + 0.7 + i * 0.85);
      for (const [tx, tz] of [[1.6, 0.6], [1.6, 2.6], [-2.4, 2.2]]) { F.table(o, tx, tz, 1.4, 1); F.chair(o, tx - 0.9, tz, Math.PI / 2); F.chair(o, tx + 0.9, tz, -Math.PI / 2); F.mug(o, tx, 0.88, tz); F.candle(o, tx + 0.3, 0.88, tz); circLocal(gg, tx, tz, 0.9); }
      F.hearth(o, w / 2 - 0.6, 1.8, -Math.PI / 2); const anchor = mesh(new THREE.TorusGeometry(0.5, 0.08, 6, 16, Math.PI), M.iron, 0, 2.6, -d / 2 + 0.2); anchor.rotation.z = Math.PI; o.add(anchor); F.rug(o, 0, 1.5, 3, 2, '#3a4a7a');
      for (let i = 0; i < 4; i++) { const hl = mesh(new THREE.TorusGeometry(0.35, 0.05, 6, 16), M.plank, -3 + i * 1.6, 2.6, d / 2 - 0.2); o.add(hl); } circLocal(gg, -w / 2 + 3, -d / 2 + 1.4, 1.4);
    } });
    // market street between the shops
    P.paving(g, Hp[0], Hp[1] - 2, 10, 28);
    P.stall(g, Hp[0] - 5, Hp[1] + 2, Math.PI / 2, '#3a6ad0', 'fish'); P.stall(g, Hp[0] + 5, Hp[1] - 2, -Math.PI / 2, '#c83a3a', 'fruit'); P.stall(g, Hp[0] - 5, Hp[1] - 8, Math.PI / 2, '#8a3ac0', 'lacrima'); P.stall(g, Hp[0] + 5, Hp[1] + 8, -Math.PI / 2, '#e8a030', 'cloth');
    for (const dz of [-14, -4, 6]) { P.lamppost(g, Hp[0] - 3.6, Hp[1] + dz); P.lamppost(g, Hp[0] + 3.6, Hp[1] + dz + 4); }
    P.cart(g, Hp[0] + 9, Hp[1] + 14, 0.4); P.barrels(g, Hp[0] + 22, Hp[1] + 4); P.crates(g, Hp[0] - 10, Hp[1] + 16, 6); P.well(g, Hp[0] + 9, Hp[1] - 18);
    addOutlines(g); }

  // ============================================================== CLOVER: the Four Leaves inn + town square
  { const Cl = PLACE.clover.pos; const g = zoneGroup(Cl[0], Cl[1], 45);
    hall({ parent: g, site: SITES.cloverInn, wall: M.plaster, roof: M.tileS, sign: 'FOUR LEAVES INN', furnish: (o, gg, w, d) => {
      F.counter(o, 3.2, -d / 2 + 1.3, 3); F.shelf(o, 3.2, -d / 2 + 0.4, 0, 3); for (const bx of [-3.6, -1.6]) { F.bed(o, bx, -d / 2 + 1.4, 0, bx < -2 ? '#3a5a8a' : '#8a5a3a'); } F.table(o, 0.5, 1.8, 1.6, 1); F.chair(o, -0.4, 1.8, Math.PI / 2); F.chair(o, 1.4, 1.8, -Math.PI / 2);
      F.plant(o, -w / 2 + 0.6, d / 2 - 0.7); F.plant(o, w / 2 - 0.6, d / 2 - 0.7); F.rug(o, 0.5, 1.8, 3, 2.4, '#5a7a3a'); F.candle(o, 0.5, 0.88, 1.8); F.lantern(o, 3.2, 1.45, -d / 2 + 1.3); circLocal(gg, 0.5, 1.8, 1); circLocal(gg, 3.2, -d / 2 + 1.3, 1.3);
    } });
    P.well(g, Cl[0] + 2, Cl[1] + 4); P.paving(g, Cl[0] + 1, Cl[1] + 4, 16, 14);
    for (const [dx, dz] of [[-6, -3], [8, -3], [-6, 11], [8, 11]]) P.lamppost(g, Cl[0] + dx, Cl[1] + dz);
    P.flowers(g, Cl[0] - 4, Cl[1] - 6, 3); P.flowers(g, Cl[0] + 6, Cl[1] - 6, 3); P.stall(g, Cl[0] + 10, Cl[1] + 6, -Math.PI / 2, '#3a8a5a', 'fruit'); P.cart(g, Cl[0] - 10, Cl[1] + 12, 1.2);
    P.fence(g, [[Cl[0] - 22, Cl[1] + 22], [Cl[0] - 8, Cl[1] + 30]]); addOutlines(g); }

  // ============================================================== HAKOBE TRAIL: mountain lodge
  { const T = PLACE.hakobetrail.pos; const g = zoneGroup(T[0], T[1], 40);
    hall({ parent: g, site: SITES.hakobeLodge, wall: M.plank, lower: M.stone, roof: toon('#e8eef4', { pat: 'tile' }), sign: 'HAKOBE WAYSTATION', light: '#ffb070', furnish: (o, gg, w, d) => {
      F.hearth(o, -w / 2 + 0.6, 0, Math.PI / 2); F.rug(o, -1.6, 0, 2.6, 2.6, '#8a2a2a'); F.bench(o, -1.4, 1.6, 2.2, 0); F.bench(o, -1.4, -1.6, 2.2, Math.PI);
      F.bed(o, w / 2 - 1, -d / 2 + 1.3, 0, '#5a3a8a'); F.shelf(o, 1.2, -d / 2 + 0.4, 0, 2); F.table(o, 2.4, 1.6, 1.4, 1); F.chair(o, 2.4, 2.4, Math.PI); F.mug(o, 2.4, 0.88, 1.5);
      for (let i = 0; i < 2; i++) { const sk = box(o, 0.12, 1.7, 0.04, M.plank, w / 2 - 0.3, 1.1, 1.8 + i * 0.3); sk.rotation.x = 0.1; } F.barrel(o, w / 2 - 0.6, d / 2 - 0.7); circLocal(gg, -w / 2 + 0.6, 0, 1.2); circLocal(gg, 2.4, 1.6, 0.9);
    } });
    // snow on the roof edge and icicles; woodpile; snow drifts
    { const S = SITES.hakobeLodge; const y = yAt(...S.at); const ice = toon('#d8ecff', { rough: 0.15 });
      for (let i = 0; i < 14; i++) { const ix = S.at[0] + 6 + (R() - 0.5) * 0, iz = S.at[1] - S.w / 2 + 0.6 + i * (S.w - 1.2) / 13; const ic = mesh(new THREE.ConeGeometry(0.06, 0.4 + R() * 0.5, 5), ice, ix - 1.4, y + 4.65, iz); ic.rotation.x = Math.PI; g.add(ic); }
      for (let i = 0; i < 10; i++) { const x = S.at[0] + (R() - 0.5) * 22, z = S.at[1] + (R() - 0.5) * 22; if (Math.abs(x - S.at[0]) < 7 && Math.abs(z - S.at[1]) < 7) continue; const dft = mesh(new THREE.SphereGeometry(1.2 + R(), 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), toon('#f4f8fc'), x, yAt(x, z) - 0.1, z); dft.scale.y = 0.35; g.add(dft); }
      for (let k = 0; k < 9; k++) { const lg = mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.4, 7), M.timber, S.at[0] - 2 + (k % 3) * 0.34, y + 0.2 + Math.floor(k / 3) * 0.32, S.at[1] - S.d / 2 - 1.2); lg.rotation.z = Math.PI / 2; g.add(lg); } }
    P.fence(g, [[T[0] - 10, T[1] + 28], [T[0] + 6, T[1] + 30]]); P.lamppost(g, T[0] + 2, T[1] + 10); addOutlines(g); }

  // registered for LOD: interior lights fade out when far
  W.interiorLights = lights;
  return { hall, F, P, M };
}
