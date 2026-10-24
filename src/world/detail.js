// Character + monster detail layer (Round 2 rework). Adds anatomy, faces, layered outfits, accessories and secondary
// animation on top of the base builders in models.js, so every humanoid (player, NPCs, party, mage mobs, bosses) benefits.
import * as THREE from 'three';
import { toon, glow, mesh } from './toon.js';

const GC = new Map(); // shared geometry cache (keeps draw-call memory down across dozens of NPCs)
const geo = (k, f) => { if (!GC.has(k)) GC.set(k, f()); return GC.get(k); };
const sph = (r, w = 10, h = 8) => geo(`s${r}|${w}|${h}`, () => new THREE.SphereGeometry(r, w, h));
const cap = (r, l, s = 8) => geo(`c${r}|${l}|${s}`, () => new THREE.CapsuleGeometry(r, l, 3, s));
const box = (x, y, z) => geo(`b${x}|${y}|${z}`, () => new THREE.BoxGeometry(x, y, z));
const cyl = (a, b, h, s = 10, open = false) => geo(`y${a}|${b}|${h}|${s}|${open}`, () => new THREE.CylinderGeometry(a, b, h, s, 1, open));
const cone = (r, h, s = 8) => geo(`k${r}|${h}|${s}`, () => new THREE.ConeGeometry(r, h, s));
const tor = (r, t, a = 6, b = 14, arc = Math.PI * 2) => geo(`t${r}|${t}|${a}|${b}|${arc}`, () => new THREE.TorusGeometry(r, t, a, b, arc));
const shade = (hex, k) => { const c = new THREE.Color(hex); c.multiplyScalar(k); return '#' + c.getHexString(); };
const add = (par, g, m, x = 0, y = 0, z = 0) => { const o = mesh(g, m, x, y, z); par.add(o); return o; };

export const FRAMES = ['slim', 'average', 'broad'];
export const ACCESSORIES = ['none', 'cape', 'hood', 'headband', 'pauldron', 'goggles'];
export const EXTRA_OUTFITS = ['knight', 'ranger', 'scholar'];

/** Articulated hand: palm, four curled fingers and a thumb. Returns { hand, fingers }. */
function buildHand(fore, skinM, side, glove) {
  const old = fore.children.find((c) => c.geometry && c.geometry.type === 'SphereGeometry' && Math.abs(c.position.y + 0.32) < 0.01); if (old) old.visible = false;
  const m = glove || skinM; const hand = new THREE.Group(); hand.position.set(0, -0.31, 0); fore.add(hand);
  const palm = add(hand, box(0.1, 0.1, 0.06), m, 0, -0.03, 0); palm.scale.set(1, 1, 1);
  add(hand, sph(0.052, 8, 6), m, 0, 0.0, 0).scale.set(1, 0.7, 0.62); // heel of the hand rounds the box
  const fingers = [];
  for (let i = 0; i < 4; i++) {
    const f = new THREE.Group(); f.position.set(-0.036 + i * 0.024, -0.08, 0.008); hand.add(f);
    const a = add(f, cap(0.012, 0.035, 5), skinM, 0, -0.022, 0); const b = new THREE.Group(); b.position.y = -0.045; f.add(b); add(b, cap(0.011, 0.028, 5), skinM, 0, -0.016, 0);
    f.userData.tip = b; f.rotation.x = 0.35; b.rotation.x = 0.5; fingers.push(f); if (glove && i === 0) a.material = skinM;
  }
  const th = new THREE.Group(); th.position.set(side * 0.05, -0.03, 0.02); hand.add(th); add(th, cap(0.014, 0.035, 5), skinM, 0, -0.02, 0); th.rotation.set(0.4, 0, side * 0.7);
  return { hand, fingers };
}

/** Upgrade a freshly built character. M = { skin, cloth, cloth2, hair }; L = look. */
export function refineCharacter(P, L, M) {
  const { body, head, torso, armL, armR, legL, legR } = P;
  const skinM = M.skin; const dark = toon('#2a2230'); const leather = toon('#5a3a22'), leather2 = toon('#3a2616'), metal = toon('#b8bcc8'), gold = toon('#e8c060');
  const frame = L.frame || 'average'; const fw = { slim: 0.92, average: 1, broad: 1.12 }[frame] || 1;
  // ---- anatomy: shoulders, clavicles, chest, elbows, knees ----
  for (const a of [armL, armR]) {
    const s = a === armL ? -1 : 1; const upM = a.children[0].material;
    const delt = add(a, sph(0.095, 12, 8), upM, s * 0.01, -0.03, 0); delt.scale.set(1.05 * fw, 0.95, 1);
    const elbow = add(a.userData.fore, sph(0.07, 8, 6), a.children[0].material, 0, 0.0, -0.005); elbow.scale.set(0.95, 0.8, 0.95);
    const H = buildHand(a.userData.fore, skinM, s, L.gloves ? toon(L.gloves) : null); a.userData.hand = H;
  }
  const trap = add(body, cyl(0.13, 0.22, 0.1, 12), torso.material, 0, 1.38, -0.01); trap.scale.z = 0.7;
  for (const s of [-1, 1]) { const clav = add(body, cap(0.02, 0.14, 5), torso.material === skinM ? skinM : torso.material, s * 0.12, 1.385, 0.11); clav.rotation.z = s * 1.45; }
  torso.scale.x *= fw; armL.position.x *= fw; armR.position.x *= fw;
  for (const l of [legL, legR]) {
    const knee = add(l.userData.shin, sph(0.085, 8, 6), l.children[0].material, 0, 0.01, 0.015); knee.scale.set(1, 0.85, 1);
    // boots: sole, toe cap, laces / straps, cuff fold
    const sh = l.userData.shin; const boot = sh.children.find((c) => c.geometry && c.geometry.type === 'BoxGeometry' && c.position.y < -0.3);
    if (boot) {
      const bm = boot.material; boot.visible = false;
      const shaft = add(sh, cyl(0.088, 0.078, 0.18, 10), bm, 0, -0.34, 0.01);
      const foot = add(sh, sph(0.085, 10, 8), bm, 0, -0.41, 0.07); foot.scale.set(0.95, 0.62, 1.6);
      add(sh, box(0.16, 0.035, 0.29), leather2, 0, -0.455, 0.05);
      const toe = add(sh, sph(0.06, 8, 6), toon(shade('#' + bm.color.getHexString(), 1.25)), 0, -0.43, 0.17); toe.scale.set(1.15, 0.7, 0.9);
      for (let i = 0; i < 3; i++) add(sh, box(0.1, 0.012, 0.012), toon('#e8dcc0'), 0, -0.3 - i * 0.045, 0.09);
      add(sh, tor(0.09, 0.018, 5, 14), toon(shade('#' + bm.color.getHexString(), 1.3)), 0, -0.25, 0).rotation.x = Math.PI / 2;
      void shaft;
    }
  }
  // ---- face: sclera, pupils, nose, lips, lids, cheeks, chin ----
  if (P.eyes) for (const eg of P.eyes) {
    const iris = eg.children[1]; if (!iris) continue; const x = iris.position.x;
    const scl = add(eg, sph(0.058, 12, 10), toon('#fbf8f4'), x, -0.008, 0.262); scl.scale.set(0.85, 1.12, 0.34); scl.userData.noOutline = true;
    const pup = add(eg, sph(0.022, 8, 6), toon('#120c14'), x, -0.016, 0.285); pup.scale.set(0.8, 1.2, 0.3); pup.userData.noOutline = true;
    const lid = add(eg, sph(0.062, 12, 6, ), toon(shade(L.skin || '#f2d0b0', 0.92)), x, 0.022, 0.258); lid.scale.set(0.95, 0.45, 0.38); lid.userData.noOutline = true; eg.userData.lid = lid;
  }
  const nose = add(head, cone(0.026, 0.07, 6), toon(shade(L.skin || '#f2d0b0', 0.96)), 0, -0.07, 0.285); nose.rotation.x = Math.PI / 2 + 0.35; nose.userData.noOutline = true;
  add(head, sph(0.018, 6, 4), toon(shade(L.skin || '#f2d0b0', 0.9)), 0, -0.095, 0.287).userData.noOutline = true;
  const lip = add(head, box(0.05, 0.01, 0.01), toon('#c87070'), 0, -0.19, 0.228); lip.userData.noOutline = true;
  for (const s of [-1, 1]) { const ck = add(head, sph(0.06, 8, 6), skinM, s * 0.16, -0.06, 0.18); ck.scale.set(1, 0.7, 0.5); }
  const chin = add(head, sph(0.06, 8, 6), skinM, 0, -0.24, 0.13); chin.scale.set(1.2, 0.7, 0.8);
  // ---- layered outfits ----
  const O = L.outfit, cl = M.cloth, cl2 = M.cloth2; const trim = toon(L.trim || '#e8c060');
  if (!L.preset) {
    if (O === 'adventurer') {
      // open jacket over a shirt: lapels, hem, rolled sleeves, belt pouches, knee guards
      for (const s of [-1, 1]) { const lap = add(body, box(0.12, 0.36, 0.03), cl2, s * 0.12, 1.2, 0.2); lap.rotation.z = -s * 0.12; const hem = add(body, box(0.18, 0.16, 0.03), cl, s * 0.13, 0.86, 0.19); hem.rotation.z = s * 0.1; }
      add(body, box(0.16, 0.3, 0.02), toon('#e8e0d0'), 0, 1.18, 0.2);
      for (const a of [armL, armR]) add(a.userData.fore, tor(0.075, 0.02, 5, 12), cl2, 0, -0.02, 0).rotation.x = Math.PI / 2;
      for (const x of [-0.17, 0.2]) { add(body, box(0.09, 0.1, 0.06), leather, x, 0.93, 0.15); add(body, box(0.09, 0.03, 0.065), leather2, x, 0.97, 0.155); }
      for (const l of [legL, legR]) add(l.userData.shin, box(0.12, 0.1, 0.05), leather, 0, 0.0, 0.08);
    } else if (O === 'mage') {
      // long coat with split tails that sway, shoulder mantle, sash and a spellbook
      const tails = [];
      for (const s of [-1, 1]) { const tg = new THREE.Group(); tg.position.set(s * 0.13, 0.68, -0.14); body.add(tg); const t = add(tg, box(0.2, 0.5, 0.03), cl, 0, -0.24, 0); add(tg, box(0.2, 0.03, 0.035), trim, 0, -0.48, 0); tails.push(tg); void t; }
      P.tails = tails;
      const mantle = add(body, cyl(0.2, 0.36, 0.16, 14), cl2, 0, 1.33, 0); mantle.scale.z = 0.8;
      add(body, tor(0.33, 0.018, 4, 18), trim, 0, 1.26, 0).rotation.x = Math.PI / 2;
      const sash = add(body, box(0.06, 0.42, 0.025), trim, 0.02, 1.08, 0.2); sash.rotation.z = 0.5;
      add(body, box(0.14, 0.18, 0.05), toon('#6a2a4a'), -0.25, 0.86, 0.02); add(body, box(0.12, 0.16, 0.052), toon('#f4ecd8'), -0.252, 0.86, 0.02);
    } else if (O === 'brawler') {
      // wrapped forearms, sash belt with tails, shin wraps, collar
      for (const a of [armL, armR]) for (let i = 0; i < 3; i++) add(a.userData.fore, tor(0.07, 0.012, 4, 10), toon('#e8e0d0'), 0, -0.06 - i * 0.05, 0).rotation.x = Math.PI / 2 + (i - 1) * 0.15;
      const st = add(body, box(0.07, 0.3, 0.025), cl2, 0.16, 0.8, 0.17); st.rotation.z = 0.25;
      for (const l of [legL, legR]) for (let i = 0; i < 3; i++) add(l.userData.shin, tor(0.08, 0.012, 4, 10), toon('#e8e0d0'), 0, -0.1 - i * 0.05, 0).rotation.x = Math.PI / 2;
    } else if (O === 'knight') {
      const plate = metal, plate2 = toon('#8a90a0');
      const bp = add(body, sph(0.26, 14, 10), plate, 0, 1.2, 0.05); bp.scale.set(1.02 * fw, 1, 0.82);
      add(body, box(0.03, 0.3, 0.02), trim, 0, 1.2, 0.26);
      for (let i = 0; i < 3; i++) { const fl = add(body, cyl(0.245 - i * 0.005, 0.25, 0.06, 14), plate2, 0, 0.98 - i * 0.055, 0); fl.scale.z = 0.82; }
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; const ts = add(body, box(0.14, 0.2, 0.025), i % 2 ? plate : plate2, Math.sin(a) * 0.27, 0.78, Math.cos(a) * 0.23); ts.rotation.y = a; ts.rotation.x = 0.12; }
      for (const a of [armL, armR]) { const p = add(a, new THREE.SphereGeometry(0.15, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), plate, 0, 0.02, 0); p.scale.set(1.2, 0.9, 1.1); add(a, new THREE.SphereGeometry(0.13, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), plate2, 0, -0.06, 0); add(a.userData.fore, cyl(0.082, 0.074, 0.2, 10), plate, 0, -0.16, 0); }
      for (const l of [legL, legR]) { add(l, cyl(0.105, 0.095, 0.3, 10), plate2, 0, -0.18, 0.01); add(l.userData.shin, cyl(0.09, 0.08, 0.3, 10), plate, 0, -0.17, 0.01); }
    } else if (O === 'ranger') {
      const hood = add(body, new THREE.SphereGeometry(0.3, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), cl2, 0, 1.48, -0.16); hood.rotation.x = -1.3; hood.scale.set(1, 1, 0.6);
      const cloak = new THREE.Group(); cloak.position.set(0, 1.42, -0.17); body.add(cloak); add(cloak, cyl(0.26, 0.42, 0.95, 14, true), toon('#' + cl.color.getHexString(), { side: THREE.DoubleSide }), 0, -0.47, -0.02).scale.z = 0.45; P.cape = cloak;
      const quiver = add(body, cyl(0.07, 0.06, 0.48, 8), leather, 0.12, 1.12, -0.26); quiver.rotation.z = -0.5;
      for (let i = 0; i < 4; i++) { const ar = add(body, cyl(0.008, 0.008, 0.2, 4), toon('#d8c8a0'), 0.24 + i * 0.02, 1.42 + i * 0.01, -0.28); ar.rotation.z = -0.5; add(body, cone(0.02, 0.05, 4), toon('#e0e0e0'), 0.29 + i * 0.02, 1.5 + i * 0.01, -0.28).rotation.z = -0.5; }
      const bracer = toon('#6a4a2a'); for (const a of [armL, armR]) add(a.userData.fore, cyl(0.078, 0.072, 0.16, 8), bracer, 0, -0.15, 0);
    } else if (O === 'scholar') {
      const robe = add(body, cyl(0.25, 0.44, 0.9, 16, true), toon('#' + cl.color.getHexString(), { side: THREE.DoubleSide }), 0, 0.5, 0); robe.scale.z = 0.85;
      add(body, cyl(0.445, 0.445, 0.04, 16), trim, 0, 0.06, 0).scale.z = 0.85;
      for (const s of [-1, 1]) add(body, box(0.05, 0.9, 0.02), trim, s * 0.07, 0.95, 0.205 - (1 - s) * 0.001);
      add(body, cyl(0.24, 0.24, 0.08, 14), cl2, 0, 1.0, 0).scale.z = 0.84;
      for (const a of [armL, armR]) { const sl = add(a.userData.fore, cyl(0.08, 0.14, 0.2, 10, true), toon('#' + cl.color.getHexString(), { side: THREE.DoubleSide }), 0, -0.2, 0); void sl; }
      add(head, new THREE.TorusGeometry(0.09, 0.008, 4, 16), toon('#d0b060'), -0.11, -0.01, 0.3); add(head, new THREE.TorusGeometry(0.09, 0.008, 4, 16), toon('#d0b060'), 0.11, -0.01, 0.3); add(head, box(0.05, 0.008, 0.008), toon('#d0b060'), 0, 0.0, 0.3);
      for (const l of [legL, legR]) l.visible = true;
    }
  }
  // ---- accessories ----
  const A = L.acc || 'none'; const accM = toon(L.accColor || shade(L.outfitColor || '#3a4aa0', 0.7));
  if (A === 'cape' && !P.cape) { const c = new THREE.Group(); c.position.set(0, 1.4, -0.17); body.add(c); add(c, box(0.5 * fw, 1.0, 0.025), accM, 0, -0.5, 0); add(c, box(0.52 * fw, 0.05, 0.03), gold, 0, -1.0, 0); for (const s of [-1, 1]) add(body, sph(0.035, 8, 6), gold, s * 0.17, 1.4, 0.12); P.cape = c; }
  else if (A === 'hood') { const hd = add(head, new THREE.SphereGeometry(0.36, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.6), accM, 0, 0.02, -0.04); hd.scale.set(1.04, 1.08, 1.1); hd.rotation.x = -0.25; }
  else if (A === 'headband') { add(head, tor(0.315, 0.03, 5, 22), accM, 0, 0.1, 0).rotation.x = Math.PI / 2 - 0.1; const kn = add(head, box(0.05, 0.22, 0.02), accM, 0.05, -0.02, -0.32); kn.rotation.z = 0.3; }
  else if (A === 'pauldron') { const p = add(armL, new THREE.SphereGeometry(0.17, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), metal, 0, 0.03, 0); p.scale.set(1.25, 0.9, 1.15); for (let i = 0; i < 3; i++) add(armL, sph(0.02, 5, 4), gold, -0.08 + i * 0.08, 0.1, 0.1); add(body, box(0.05, 0.62, 0.02), leather, 0, 1.15, 0.19).rotation.z = -0.65; }
  else if (A === 'goggles') { const band = add(head, tor(0.31, 0.02, 4, 22), leather2, 0, 0.2, 0); band.rotation.x = Math.PI / 2 - 0.4; for (const s of [-1, 1]) { const l = add(head, cyl(0.06, 0.06, 0.05, 12), metal, s * 0.1, 0.27, 0.22); l.rotation.x = Math.PI / 2 - 0.55; add(head, cyl(0.045, 0.045, 0.052, 12), glow('#8ad8ff', 0.7), s * 0.1, 0.27, 0.225).rotation.x = Math.PI / 2 - 0.55; } }
  P.frame = frame; P.spring = { cape: 0, tails: 0 };
}

/** Secondary animation layered after animateCharacter: torso counter-twist, hip sway, cape/coat-tail spring, fingers, hit flinch, death fall. */
export function animateDetail(p, st, mv, sw) {
  const t = st.t; const dt = 1 / 60;
  if (!st.dead) {
    p.torso.rotation.y = -sw * 0.18; p.head.rotation.z = Math.sin(t * 9 + 1) * 0.02 * mv;
    p.body.rotation.z = Math.sin(t * (9 + mv * 2)) * 0.03 * mv;
  }
  const flinch = st.hit > 0 ? Math.sin(Math.min(1, st.hit) * Math.PI) : 0;
  if (flinch) { p.body.rotation.x -= flinch * 0.32; p.head.rotation.x -= flinch * 0.25; p.armL.rotation.x += flinch * 0.5; p.armR.rotation.x += flinch * 0.5; }
  if (st.dead) { const k = Math.min(1, st.deadT != null ? st.deadT / 0.7 : 1); const e = k * k * (3 - 2 * k); p.body.rotation.x = -1.45 * e; p.body.position.y = (p.bodyLift || 0) + 0.22 * e; p.armL.rotation.z = -0.9 * e; p.armR.rotation.z = 0.9 * e; }
  // springy cape / tails react to speed and bob
  const tgt = 0.15 + mv * 0.85 + (st.atk >= 0 ? 0.3 : 0) + Math.sin(t * 3.1) * 0.04;
  if (p.spring) { p.spring.cape += (tgt - p.spring.cape) * Math.min(1, dt * 8); }
  if (p.cape) { p.cape.rotation.x = p.spring.cape * 0.9; p.cape.rotation.z = Math.sin(t * 2.3) * 0.04; }
  if (p.tails) p.tails.forEach((tg, i) => { tg.rotation.x = p.spring.cape * 0.75 + Math.sin(t * 5 + i) * 0.05 * (0.4 + mv); });
  // fingers: grip harder when attacking / holding, relax at rest
  const grip = st.atk >= 0 || p.weapon ? 1 : 0.35 + Math.sin(t * 1.3) * 0.05;
  for (const a of [p.armL, p.armR]) { const H = a.userData.hand; if (!H) continue; for (const f of H.fingers) { f.rotation.x = 0.3 + grip * 0.9; f.userData.tip.rotation.x = 0.4 + grip * 1.0; } }
  // eyelids: half-close on blink, wide on cast
  if (p.eyes) for (const e of p.eyes) if (e.userData.lid) e.userData.lid.position.y = st.cast > 0 ? 0.04 : 0.022;
}

// ---------------------------------------------------------------- monsters
/** Extra sculpted detail per monster model. */
export function refineMob(model, g, parts) {
  const b = parts.body; if (!b) return;
  if (model === 'boar') {
    const fur = toon('#5a321c'), hoof = toon('#1e140c'), pink = toon('#c87a72');
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI - Math.PI / 2; const tf = add(b, cone(0.09, 0.22, 4), fur, Math.sin(a) * 0.35, 0.98 + Math.cos(a) * 0.12, 0.55); tf.rotation.set(-0.6, 0, -Math.sin(a) * 0.8); }
    if (parts.head) { for (const s of [-1, 1]) add(parts.head, sph(0.035, 6, 4), toon('#3a1a14'), s * 0.06, -0.08, 0.49).userData.noOutline = true; const brow = add(parts.head, box(0.36, 0.06, 0.1), fur, 0, 0.18, 0.28); brow.rotation.x = 0.3; }
    for (const l of parts.legs || []) { for (const s of [-1, 1]) add(l, box(0.07, 0.08, 0.12), hoof, s * 0.04, -0.54, 0.02); add(l, sph(0.1, 8, 6), fur, 0, -0.05, 0); }
    const tail = new THREE.Group(); tail.position.set(0, 0.95, -0.78); b.add(tail); add(tail, tor(0.06, 0.02, 4, 10, Math.PI * 1.5), pink); parts.tailC = tail;
    add(b, sph(0.4, 12, 8), toon('#8a5a3a'), 0, 0.55, 0.1).scale.set(0.95, 0.5, 1.1);
  } else if (model === 'puffcap') {
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; const gl = add(b, box(0.01, 0.03, 0.2), toon('#e8c8b0'), Math.sin(a) * 0.25, 0.48, Math.cos(a) * 0.25); gl.rotation.y = a; }
    parts.arms = [];
    for (const s of [-1, 1]) { const a = new THREE.Group(); a.position.set(s * 0.22, 0.3, 0.04); b.add(a); add(a, cap(0.04, 0.12, 5), toon('#f4ecd8'), 0, -0.08, 0); a.rotation.z = s * 0.6; parts.arms.push(a); }
    add(b, box(0.08, 0.02, 0.02), toon('#5a2020'), 0, 0.27, 0.22).userData.noOutline = true;
    for (let i = 0; i < 5; i++) { const sp = add(b, sph(0.04, 6, 4), toon('#ffffff'), Math.sin(i * 2.3) * 0.38, 0.62, Math.cos(i * 2.3) * 0.38); sp.scale.y = 0.4; }
  } else if (model === 'wisp') {
    parts.orbit = []; for (let i = 0; i < 6; i++) { const o = add(b, sph(0.05, 6, 4), glow(i % 2 ? '#c8b8ff' : '#ffffff', 0.9)); parts.orbit.push(o); }
    const halo = add(b, tor(0.62, 0.015, 4, 32), glow('#a090ff', 0.5)); halo.rotation.x = Math.PI / 2; parts.halo = halo;
  } else if (model === 'golem') {
    const lava = glow('#ff7a20'), moss = toon('#4a7a2a'), crys = toon('#9ad0ff', { emissive: '#3a6aa0' });
    for (let i = 0; i < 7; i++) { const r = add(b, box(0.06, 0.5 + (i % 3) * 0.2, 0.05), lava, -1 + i * 0.33, 2.6 + (i % 2) * 0.6, 1.2 - Math.abs(i - 3) * 0.12); r.rotation.z = (i - 3) * 0.25; r.userData.noOutline = true; }
    for (let i = 0; i < 9; i++) { const a = i * 0.7; const ms = add(b, new THREE.DodecahedronGeometry(0.25 + (i % 3) * 0.08, 0), moss, Math.sin(a) * 1.3, 3.6 + Math.cos(a * 1.7) * 0.4, Math.cos(a) * 0.9); ms.scale.y = 0.45; }
    for (let i = 0; i < 4; i++) { const c = add(b, cone(0.18, 0.7, 5), crys, (i % 2 ? 1 : -1) * (1.6 + (i > 1 ? 0.3 : 0)), 3.9 + (i > 1 ? 0.3 : 0), -0.2); c.rotation.z = (i % 2 ? -1 : 1) * 0.6; }
    for (const a of parts.arms || []) for (let i = 0; i < 3; i++) add(a, new THREE.DodecahedronGeometry(0.22, 0), toon('#4a443e'), (i - 1) * 0.3, -2.9, 0.5);
  } else if (model === 'vulcan') {
    for (let i = 0; i < 12; i++) { const tf = add(b, cone(0.1, 0.3, 4), toon('#f4f4f4'), Math.sin(i) * 0.5, 1.6 + (i % 4) * 0.25, -0.35 - (i % 3) * 0.05); tf.rotation.x = -0.8; }
  } else if (model === 'ram') {
    for (let i = 0; i < 8; i++) { const a = i * 0.8; add(b, sph(0.16, 8, 6), toon('#fffaf0'), Math.sin(a) * 0.5, 1.45 + Math.cos(a * 1.3) * 0.15, Math.cos(a) * 0.42); }
  }
}

/** Generic monster state layer: idle breathing, hit flinch + flash scale, death topple/sink. Runs after animateMob. */
export function animateMobState(m, t, dt) {
  const o = m.obj; const p = m.model.parts || {}; const b = p.body;
  if (b && !m.model.char) { const br = 1 + Math.sin(t * 2.4 + (m.pos.x || 0)) * 0.025; b.scale.y = (b.userData.sy || (b.userData.sy = b.scale.y)) * br; }
  if (p.orbit) p.orbit.forEach((s, i) => { const a = t * 2 + i * 1.05; s.position.set(Math.sin(a) * 0.7, Math.sin(a * 1.7) * 0.25, Math.cos(a) * 0.7); });
  if (p.halo) p.halo.rotation.z = t * 0.8;
  if (p.tailC) p.tailC.rotation.z = Math.sin(t * 12) * 0.4;
  if (p.arms && m.tpl && m.tpl.model === 'puffcap') p.arms.forEach((a, i) => { a.rotation.x = Math.sin(t * 8 + i * Math.PI) * 0.5 * (m.moving || 0) - (m.atk > 0 ? Math.sin(m.atk * Math.PI) * 1.4 : 0); });
  const hk = m.hitT != null ? (t - m.hitT) / 0.28 : 2;
  if (hk < 1 && !m.dying) { const f = Math.sin(hk * Math.PI); o.rotation.x = -f * 0.22; o.scale.set(1 + f * 0.08, 1 - f * 0.1, 1 + f * 0.08); }
  else if (!m.dying) { o.rotation.x = 0; o.scale.setScalar(1); }
  if (m.dying) { const k = Math.min(1, m.dying.k); const e = k * k; o.rotation.z = e * 1.35 * m.dying.side; o.rotation.x = -e * 0.4; o.position.y -= e * 0.5 * (m.radius || 0.7); const s = k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1; o.scale.setScalar(Math.max(0.01, s)); }
}
