import { guildMarkTexture } from './mark.js';
import * as THREE from 'three';
import { toon, glow, mesh, addOutlines, shadowAll, GFX } from './toon.js';

const G = {
  sph: (r = 1, w = 16, h = 12) => new THREE.SphereGeometry(r, w, h),
  cap: (r, l) => new THREE.CapsuleGeometry(r, l, 4, 10),
  cyl: (a, b, h, s = 10) => new THREE.CylinderGeometry(a, b, h, s),
  box: (x, y, z) => new THREE.BoxGeometry(x, y, z),
  cone: (r, h, s = 8) => new THREE.ConeGeometry(r, h, s),
};
const shade = (hex, k) => { const c = new THREE.Color(hex); c.multiplyScalar(k); return '#' + c.getHexString(); };

export const HAIR_STYLES = ['spiky', 'long', 'ponytail', 'bob', 'short', 'twintails'];
export const OUTFITS = ['mage', 'adventurer', 'brawler'];
export const HAIR_COLORS = ['#ff5a2a', '#ffd23f', '#3a2a22', '#f2f2f8', '#6a8cff', '#ff7ac0', '#38c08a', '#9a50ff', '#202028'];
export const SKIN_TONES = ['#f8dcc4', '#efc39e', '#d9a275', '#b07a52', '#7a4e32'];
export const OUTFIT_COLORS = ['#3a4aa0', '#b0302a', '#2a7a4a', '#f0f0f6', '#2a2a34', '#d09020', '#8a3ab0', '#2a9ab0'];

/** Anime-style humanoid. Faces +Z. Returns { group, parts }. */
export function buildCharacter(look = {}) {
  const L = { hair: 'spiky', hairColor: '#ff5a2a', skin: '#f2d0b0', outfit: 'adventurer', outfitColor: '#3a4aa0', scale: 1, ...look };
  const root = new THREE.Group();
  const body = new THREE.Group(); root.add(body);
  const skin = toon(L.skin), cloth = toon(L.outfitColor), cloth2 = toon(shade(L.outfitColor, 0.55)), hairM = toon(L.hairColor);
  const dark = toon('#2a2230'), white = glow('#ffffff');
  const pants = toon(L.outfit === 'mage' ? shade(L.outfitColor, 0.4) : '#3a3448');

  // Torso + hips
  const torso = mesh(G.cap(0.24, 0.32), cloth, 0, 1.16, 0); torso.scale.set(1, 1, 0.78); body.add(torso);
  const hips = mesh(G.cap(0.22, 0.08), pants, 0, 0.9, 0); hips.scale.set(1.05, 1, 0.8); body.add(hips);
  const belt = mesh(G.cyl(0.235, 0.235, 0.07, 14), toon('#5a3a22'), 0, 0.98, 0); belt.scale.z = 0.8; body.add(belt);
  const buckle = mesh(G.box(0.08, 0.06, 0.03), toon('#e8c060'), 0, 0.98, 0.19); body.add(buckle);
  const neck = mesh(G.cyl(0.07, 0.08, 0.12), skin, 0, 1.43, 0); body.add(neck);

  // Outfit details
  if (L.outfit === 'mage') {
    const coat = mesh(G.cyl(0.26, 0.42, 0.62, 14, 1), cloth, 0, 0.66, 0); coat.scale.z = 0.85; body.add(coat);
    const collar = mesh(G.cyl(0.16, 0.24, 0.12, 12), cloth2, 0, 1.4, 0); body.add(collar);
    const trim = mesh(G.cyl(0.425, 0.425, 0.04, 14), toon('#e8c060'), 0, 0.36, 0); trim.scale.z = 0.85; body.add(trim);
  } else if (L.outfit === 'adventurer') {
    const tunic = mesh(G.cyl(0.25, 0.3, 0.26, 12), cloth, 0, 0.82, 0); tunic.scale.z = 0.82; body.add(tunic);
    const scarf = mesh(new THREE.TorusGeometry(0.13, 0.05, 6, 12), toon('#e8e0c0'), 0, 1.4, 0); scarf.rotation.x = Math.PI / 2; body.add(scarf);
    const tail = mesh(G.box(0.1, 0.34, 0.03), toon('#e8e0c0'), 0.08, 1.24, -0.2); tail.rotation.z = 0.3; body.add(tail);
    const strap = mesh(G.box(0.06, 0.62, 0.42), toon('#6a4a2a'), 0, 1.15, 0); strap.rotation.z = 0.7; strap.scale.z = 1; body.add(strap);
  } else {
    const vestL = mesh(G.box(0.16, 0.42, 0.04), cloth2, -0.11, 1.15, 0.18); body.add(vestL);
    const vestR = mesh(G.box(0.16, 0.42, 0.04), cloth2, 0.11, 1.15, 0.18); body.add(vestR);
    const abs = mesh(G.box(0.12, 0.3, 0.02), skin, 0, 1.12, 0.185); body.add(abs);
  }

  // Head (big anime proportions)
  const head = new THREE.Group(); head.position.set(0, 1.66, 0); body.add(head);
  const skull = mesh(G.sph(0.3, 20, 16), skin); skull.scale.set(1, 1.05, 0.98); head.add(skull);
  const jaw = mesh(G.sph(0.2, 14, 10), skin, 0, -0.14, 0.06); jaw.scale.set(1.05, 0.8, 0.95); head.add(jaw);
  for (const s of [-1, 1]) {
    const eye = mesh(G.sph(0.065, 12, 10), dark, s * 0.11, -0.01, 0.255); eye.scale.set(0.8, 1.25, 0.4); head.add(eye);
    const iris = mesh(G.sph(0.045, 10, 8), toon(L.eyeColor || shade(L.hairColor, 0.8)), s * 0.11, -0.025, 0.272); iris.scale.set(0.8, 1.1, 0.3); head.add(iris);
    const hl = mesh(G.sph(0.018, 6, 6), white, s * 0.11 + 0.015, 0.02, 0.285); head.add(hl);
    const brow = mesh(G.box(0.09, 0.018, 0.02), toon(shade(L.hairColor, 0.6)), s * 0.11, 0.1, 0.27); brow.rotation.z = -s * 0.15; head.add(brow);
    const ear = mesh(G.sph(0.05, 8, 6), skin, s * 0.295, -0.02, 0); ear.scale.set(0.5, 1, 0.8); head.add(ear);
  }
  const mouth = mesh(G.box(0.06, 0.012, 0.01), toon('#a04040'), 0, -0.17, 0.235); head.add(mouth);
  const blush = toon('#ff9a9a', { transparent: true, opacity: 0.5 });
  for (const s of [-1, 1]) { const b = mesh(G.sph(0.035, 8, 6), blush, s * 0.17, -0.1, 0.215); b.scale.set(1, 0.5, 0.3); b.userData.noOutline = true; head.add(b); }
  buildHair(head, L.hair, hairM);

  // Limbs with pivots at shoulder/hip
  const mkArm = (s) => {
    const a = new THREE.Group(); a.position.set(s * 0.32, 1.36, 0);
    const up = mesh(G.cap(0.075, 0.24), L.outfit === 'brawler' ? skin : cloth, 0, -0.18, 0); a.add(up);
    const fore = new THREE.Group(); fore.position.set(0, -0.36, 0); a.add(fore);
    const lo = mesh(G.cap(0.066, 0.22), skin, 0, -0.14, 0); fore.add(lo);
    if (L.outfit === 'brawler') { const wrap = mesh(G.cyl(0.075, 0.075, 0.12, 8), toon('#e8e0d0'), 0, -0.2, 0); fore.add(wrap); }
    else { const cuff = mesh(G.cyl(0.08, 0.085, 0.08, 8), cloth2, 0, -0.08, 0); fore.add(cuff); }
    const hand = mesh(G.sph(0.075, 10, 8), skin, 0, -0.32, 0); hand.scale.set(0.9, 1, 0.75); fore.add(hand);
    const grip = new THREE.Group(); grip.position.set(0, -0.34, 0.02); fore.add(grip);
    a.userData = { fore, grip };
    body.add(a); return a;
  };
  const mkLeg = (s) => {
    const l = new THREE.Group(); l.position.set(s * 0.12, 0.86, 0);
    const th = mesh(G.cap(0.095, 0.26), pants, 0, -0.2, 0); l.add(th);
    const shin = new THREE.Group(); shin.position.set(0, -0.4, 0); l.add(shin);
    const sh = mesh(G.cap(0.08, 0.24), pants, 0, -0.16, 0); shin.add(sh);
    const boot = mesh(G.box(0.15, 0.13, 0.26), toon('#4a3020'), 0, -0.38, 0.04); shin.add(boot);
    const bootTop = mesh(G.cyl(0.095, 0.09, 0.14, 8), toon('#5a3a26'), 0, -0.28, 0); shin.add(bootTop);
    l.userData = { shin };
    body.add(l); return l;
  };
  const armL = mkArm(-1), armR = mkArm(1), legL = mkLeg(-1), legR = mkLeg(1);
  // Lacrima gem on the belt (coloured by school at runtime)
  const gem = mesh(G.sph(0.05, 8, 6), glow('#ffffff'), 0.2, 0.98, 0.12); body.add(gem);
  // Scale-pattern scarf (Dragon Slayer style)
  if (L.scarf) {
    const sm = toon(L.scarf); const sc = mesh(new THREE.TorusGeometry(0.15, 0.065, 8, 16), sm, 0, 1.41, 0); sc.rotation.x = Math.PI / 2; body.add(sc);
    for (const [x, r] of [[0.06, 0.25], [-0.04, -0.2]]) { const t = mesh(G.box(0.11, 0.42, 0.035), sm, x, 1.2, -0.21); t.rotation.z = r; body.add(t); }
  }
  // Guild mark decal
  if (L.mark) {
    const mm = new THREE.MeshBasicMaterial({ map: guildMarkTexture(L.mark.color), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
    const p = mesh(new THREE.PlaneGeometry(0.17, 0.17), mm); p.userData.noOutline = true; p.castShadow = false;
    const place = L.mark.place || 'right arm';
    if (place === 'chest') { p.position.set(0.1, 1.27, 0.2); body.add(p); }
    else if (place === 'right hand') { p.scale.setScalar(0.6); p.position.set(0.07, -0.3, 0); p.rotation.y = Math.PI / 2; armR.userData.fore.add(p); }
    else { const s = place === 'left arm' ? -1 : 1; const arm = s < 0 ? armL : armR; p.position.set(s * 0.079, -0.14, 0); p.rotation.y = s * Math.PI / 2; arm.add(p); }
  }

  root.scale.setScalar(L.scale);
  addOutlines(root); shadowAll(root, true, false);
  return { group: root, parts: { body, head, torso, armL, armR, legL, legR, gem, weapon: null, bowHand: null } };
}

function buildHair(head, style, m) {
  const cap = mesh(new THREE.SphereGeometry(0.325, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.58), m, 0, 0.03, -0.015); cap.scale.set(1.04, 1.06, 1.05); head.add(cap);
  // Back of the head is always covered (no bald spot from behind)
  const back = mesh(G.sph(0.31, 16, 12), m, 0, -0.02, -0.07); back.scale.set(1.02, 1.0, 0.92); head.add(back);
  const fringe = (n, w, y, z, len) => {
    for (let i = 0; i < n; i++) {
      const t = (i / (n - 1) - 0.5) * w;
      const c = mesh(G.cone(0.07, len, 6), m, t, y, z); c.rotation.x = Math.PI * 0.85; c.rotation.z = -t * 0.9; head.add(c);
    }
  };
  if (style === 'spiky') {
    fringe(5, 0.42, 0.16, 0.24, 0.22);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      const c = mesh(G.cone(0.1, 0.38, 6), m, Math.sin(a) * 0.2, 0.2 + Math.cos(a) * 0.04, Math.cos(a) * 0.2 - 0.06);
      c.rotation.set(-Math.cos(a) * 0.9 - 0.3, 0, Math.sin(a) * 0.9); head.add(c);
    }
  } else if (style === 'long') {
    fringe(6, 0.46, 0.15, 0.25, 0.2);
    const hang = mesh(G.cap(0.24, 0.5), m, 0, -0.38, -0.12); hang.scale.set(1.25, 1, 0.55); head.add(hang);
    for (const s of [-1, 1]) { const side = mesh(G.cap(0.07, 0.42), m, s * 0.27, -0.25, 0.1); head.add(side); }
  } else if (style === 'ponytail') {
    fringe(4, 0.38, 0.17, 0.25, 0.18);
    const tie = mesh(G.sph(0.06, 8, 6), toon('#e83a5a'), 0, 0.12, -0.32); head.add(tie);
    const tail = mesh(G.cap(0.1, 0.5), m, 0, -0.18, -0.44); tail.rotation.x = 0.35; head.add(tail);
  } else if (style === 'bob') {
    fringe(6, 0.46, 0.15, 0.25, 0.17);
    const bob = mesh(G.sph(0.36, 18, 12), m, 0, -0.06, -0.04); bob.scale.set(1.08, 0.82, 1); head.add(bob);
  } else if (style === 'twintails') {
    fringe(5, 0.42, 0.16, 0.25, 0.18);
    for (const s of [-1, 1]) { const t = mesh(G.cap(0.09, 0.55), m, s * 0.36, -0.28, -0.08); t.rotation.z = s * 0.25; head.add(t); }
  } else if (style === 'beard') {
    const beard = mesh(G.sph(0.24, 14, 10), m, 0, -0.2, 0.12); beard.scale.set(1.05, 1.15, 0.8); head.add(beard);
    const stache = mesh(G.cap(0.04, 0.2), m, 0, -0.12, 0.27); stache.rotation.z = Math.PI / 2; head.add(stache);
  } else {
    fringe(5, 0.4, 0.17, 0.25, 0.14);
  }
}

/** Weapon meshes held in the right hand (bow in left). */
export function buildWeapon(type, tier = 1) {
  const g = new THREE.Group();
  const metal = toon(['#c0c0c8', '#c88a50', '#b8bcc8', '#bfe4ff', '#d0a0ff', '#ffd060', '#ff9a50', '#ff6060', '#ff80e0'][tier] || '#c0c0c8');
  const wood = toon('#7a5030'), gold = toon('#e8c060');
  if (type === 'sword1h' || type === 'sword2h') {
    const big = type === 'sword2h' ? 1.5 : 1;
    const blade = mesh(G.box(0.07 * big, 0.8 * big, 0.025), metal, 0, 0.5 * big, 0); g.add(blade);
    const tip = mesh(G.cone(0.05 * big, 0.14, 4), metal, 0, 0.97 * big, 0); tip.rotation.y = Math.PI / 4; tip.scale.z = 0.35; g.add(tip);
    const guard = mesh(G.box(0.28 * big, 0.05, 0.07), gold, 0, 0.08, 0); g.add(guard);
    const hilt = mesh(G.cyl(0.025, 0.025, 0.2 * big, 6), toon('#4a2a1a'), 0, -0.04, 0); g.add(hilt);
    g.rotation.x = Math.PI / 2;
  } else if (type === 'staff') {
    const shaft = mesh(G.cyl(0.03, 0.035, 1.6, 6), wood, 0, 0.3, 0); g.add(shaft);
    const orb = mesh(G.sph(0.09, 12, 10), glow('#c0a0ff'), 0, 1.14, 0); g.add(orb);
    const claw = mesh(new THREE.TorusGeometry(0.1, 0.02, 6, 10), gold, 0, 1.12, 0); g.add(claw);
  } else if (type === 'bow') {
    const arc = mesh(new THREE.TorusGeometry(0.55, 0.025, 6, 20, Math.PI * 0.9), wood); arc.rotation.z = Math.PI / 2 + Math.PI * 0.05; g.add(arc);
    const str = mesh(G.cyl(0.004, 0.004, 1.06, 3), glow('#f0f0e0'), -0.1, 0, 0); g.add(str);
    g.rotation.y = Math.PI / 2;
  } else if (type === 'knuckles') {
    const k = mesh(G.box(0.14, 0.08, 0.1), metal, 0, -0.02, 0.05); g.add(k);
    for (let i = 0; i < 3; i++) { const s = mesh(G.cone(0.02, 0.06, 4), metal, -0.04 + i * 0.04, -0.02, 0.12); s.rotation.x = Math.PI / 2; g.add(s); }
  }
  addOutlines(g);
  return g;
}

/** Sets weapon visuals on a character. */
export function equipVisual(char, weaponType, tier, schoolColor) {
  const p = char.parts;
  for (const k of ['weapon', 'bowHand']) if (p[k]) { p[k].parent.remove(p[k]); p[k] = null; }
  if (weaponType) {
    const w = buildWeapon(weaponType, tier);
    if (weaponType === 'bow') { p.armL.userData.grip.add(w); p.bowHand = w; }
    else if (weaponType === 'knuckles') { const w2 = buildWeapon(weaponType, tier); p.armL.userData.grip.add(w2); p.bowHand = w2; p.armR.userData.grip.add(w); p.weapon = w; }
    else { p.armR.userData.grip.add(w); p.weapon = w; }
  }
  if (schoolColor) p.gem.material = glow(schoolColor);
}

/** Procedural animation. st: { move (0..1), t, atk (0..1 swing progress or -1), cast, dead } */
export function animateCharacter(char, st) {
  const p = char.parts; const t = st.t;
  const sw = Math.sin(t * 9) * 0.75 * st.move;
  p.legL.rotation.x = sw; p.legR.rotation.x = -sw;
  p.legL.userData.shin.rotation.x = Math.max(0, -Math.sin(t * 9 - 0.6)) * 0.9 * st.move;
  p.legR.userData.shin.rotation.x = Math.max(0, Math.sin(t * 9 - 0.6)) * 0.9 * st.move;
  p.body.position.y = Math.abs(Math.cos(t * 9)) * 0.06 * st.move + Math.sin(t * 2) * 0.01;
  const idle = Math.sin(t * 2.2) * 0.04;
  let aR = -sw * 0.8 + idle, aL = sw * 0.8 - idle, fR = -0.25, fL = -0.25, zR = 0.08, zL = -0.08;
  if (st.atk >= 0) {
    const k = st.atk; const wind = k < 0.35 ? k / 0.35 : 1 - (k - 0.35) / 0.65;
    aR = -2.4 * wind + (k > 0.35 ? 1.2 * (1 - wind) * 0.5 : 0); fR = -0.6 * wind; zR = 0.3 * wind;
    if (st.kind === 'bow') { aL = -1.55; fL = 0; aR = -1.45; fR = -1.2 * wind; zR = -0.3; zL = 0.15; }
    if (st.kind === 'punch') { aR = -1.6 * wind; fR = -0.1; aL = -0.6; fL = -1.4; }
  }
  if (st.cast > 0) { const c = Math.min(1, st.cast); aR = aL = -1.5 * c; fR = fL = -0.2; zR = 0.3 * c; zL = -0.3 * c; }
  p.armR.rotation.set(aR, 0, zR); p.armL.rotation.set(aL, 0, zL);
  p.armR.userData.fore.rotation.x = fR; p.armL.userData.fore.rotation.x = fL;
  p.head.rotation.y = Math.sin(t * 0.7) * 0.08;
  if (st.dead) { p.body.rotation.x = -1.4; p.body.position.y = 0.2; } else p.body.rotation.x = st.move * 0.08;
}

// ------------------------------- Mobs -----------------------------------
export function buildMob(model, opt = {}) {
  const g = new THREE.Group(); const parts = {};
  const eyes = (parent, y, z, sx = 0.1, r = 0.05) => {
    for (const s of [-1, 1]) {
      const e = mesh(G.sph(r, 8, 6), toon('#1a1020'), s * sx, y, z); e.scale.z = 0.5; parent.add(e);
      const h = mesh(G.sph(r * 0.35, 6, 4), glow('#ffffff'), s * sx + r * 0.3, y + r * 0.3, z + r * 0.4); parent.add(h);
    }
  };
  if (model === 'puffcap') {
    const b = new THREE.Group(); g.add(b); parts.body = b;
    const stem = mesh(G.cyl(0.22, 0.28, 0.5, 12), toon('#f4ecd8'), 0, 0.3, 0); b.add(stem);
    const cap = mesh(new THREE.SphereGeometry(0.48, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), toon('#e8402a'), 0, 0.5, 0); cap.scale.y = 0.75; b.add(cap);
    const under = mesh(G.cyl(0.47, 0.47, 0.04, 18), toon('#f8d8c0'), 0, 0.5, 0); b.add(under);
    for (let i = 0; i < 6; i++) { const a = i * 1.1; const d = mesh(G.sph(0.07, 8, 6), toon('#ffffff'), Math.sin(a) * 0.3, 0.72 + (i % 2) * 0.04, Math.cos(a) * 0.3); d.scale.y = 0.4; b.add(d); }
    eyes(b, 0.36, 0.21, 0.09, 0.05);
    for (const s of [-1, 1]) { const f = mesh(G.sph(0.09, 8, 6), toon('#d8c8a8'), s * 0.13, 0.05, 0.05); f.scale.set(1, 0.6, 1.4); b.add(f); }
  } else if (model === 'boar') {
    const b = new THREE.Group(); g.add(b); parts.body = b;
    const torso = mesh(G.sph(0.6, 16, 12), toon('#7a4a2a'), 0, 0.75, 0); torso.scale.set(0.9, 0.8, 1.35); b.add(torso);
    const head = new THREE.Group(); head.position.set(0, 0.78, 0.78); b.add(head); parts.head = head;
    const hd = mesh(G.sph(0.38, 14, 10), toon('#6a3c22')); hd.scale.set(0.9, 0.85, 1.1); head.add(hd);
    const snout = mesh(G.cyl(0.16, 0.18, 0.2, 10), toon('#d89a8a'), 0, -0.08, 0.38); snout.rotation.x = Math.PI / 2; head.add(snout);
    for (const s of [-1, 1]) {
      const tusk = mesh(G.cone(0.04, 0.26, 6), toon('#fff4e0'), s * 0.18, -0.12, 0.34); tusk.rotation.x = -0.6; head.add(tusk);
      const ear = mesh(G.cone(0.1, 0.2, 4), toon('#5a321c'), s * 0.22, 0.28, -0.05); ear.rotation.z = -s * 0.5; head.add(ear);
    }
    eyes(head, 0.1, 0.3, 0.15, 0.045);
    for (let i = 0; i < 6; i++) { const sp = mesh(G.cone(0.07, 0.28, 4), toon('#3a2010'), 0, 1.2 - i * 0.03, 0.45 - i * 0.18); sp.rotation.x = -0.4; b.add(sp); }
    parts.legs = [];
    for (const [x, z] of [[-0.3, 0.45], [0.3, 0.45], [-0.3, -0.45], [0.3, -0.45]]) {
      const l = new THREE.Group(); l.position.set(x, 0.55, z); b.add(l);
      l.add(mesh(G.cyl(0.1, 0.08, 0.5, 8), toon('#5a321c'), 0, -0.25, 0)); l.add(mesh(G.cyl(0.09, 0.1, 0.1, 8), toon('#2a1a10'), 0, -0.5, 0));
      parts.legs.push(l);
    }
  } else if (model === 'wisp') {
    const b = new THREE.Group(); g.add(b); parts.body = b;
    const core = mesh(G.sph(0.32, 16, 12), glow('#8a7aff'), 0, 0, 0); b.add(core);
    const shell = mesh(G.sph(0.5, 16, 12), glow('#5a4ae0', 0.35), 0, 0, 0); b.add(shell);
    const flame = mesh(G.cone(0.32, 0.8, 10), glow('#a090ff', 0.6), 0, 0.5, -0.05); b.add(flame);
    for (const s of [-1, 1]) { const e = mesh(G.sph(0.07, 8, 6), glow('#ffffff'), s * 0.12, 0.05, 0.3); e.scale.y = 1.4; b.add(e); }
    parts.trail = [];
    for (let i = 0; i < 4; i++) { const t = mesh(G.sph(0.12 - i * 0.02, 8, 6), glow('#7a6af0', 0.6 - i * 0.12), 0, -0.2 - i * 0.1, -0.35 - i * 0.25); b.add(t); parts.trail.push(t); }
  } else if (model === 'golem') {
    const b = new THREE.Group(); g.add(b); parts.body = b;
    const rock = toon('#7a7068'), rock2 = toon('#5a524c'), moss = toon('#5a8a3a'), lava = glow('#ff7a20');
    const torso = mesh(new THREE.DodecahedronGeometry(1.4, 0), rock, 0, 3.0, 0); torso.scale.set(1.2, 1.05, 0.95); b.add(torso);
    const belly = mesh(new THREE.DodecahedronGeometry(1.0, 0), rock2, 0, 2.1, 0.3); b.add(belly);
    const crack = mesh(G.box(0.2, 1.1, 0.1), lava, 0.2, 3.0, 1.25); crack.rotation.z = 0.3; b.add(crack);
    const mossTop = mesh(new THREE.DodecahedronGeometry(0.9, 0), moss, 0, 4.1, -0.2); mossTop.scale.set(1.4, 0.4, 1.1); b.add(mossTop);
    const head = new THREE.Group(); head.position.set(0, 4.2, 0.8); b.add(head); parts.head = head;
    head.add(mesh(new THREE.DodecahedronGeometry(0.7, 0), rock2));
    for (const s of [-1, 1]) { const e = mesh(G.sph(0.14, 8, 6), lava, s * 0.28, 0.05, 0.55); e.scale.set(1.3, 0.6, 0.5); head.add(e); }
    const jaw = mesh(G.box(0.9, 0.25, 0.5), rock, 0, -0.45, 0.3); head.add(jaw); parts.jaw = jaw;
    parts.arms = [];
    for (const s of [-1, 1]) {
      const a = new THREE.Group(); a.position.set(s * 1.7, 3.6, 0); b.add(a);
      a.add(mesh(new THREE.DodecahedronGeometry(0.6, 0), rock, 0, -0.5, 0));
      a.add(mesh(new THREE.DodecahedronGeometry(0.5, 0), rock2, 0, -1.4, 0.1));
      a.add(mesh(new THREE.DodecahedronGeometry(0.75, 0), rock, 0, -2.3, 0.15));
      parts.arms.push(a);
    }
    for (const s of [-1, 1]) { const l = mesh(new THREE.DodecahedronGeometry(0.7, 0), rock2, s * 0.8, 0.8, 0); l.scale.y = 1.4; b.add(l); }
    for (let i = 0; i < 5; i++) { const c = mesh(G.cone(0.25, 0.8, 5), toon('#9ad0ff', { emissive: '#3a6aa0' }), -1 + i * 0.5, 4.0 + (i % 2) * 0.2, -0.7); c.rotation.x = -0.4; b.add(c); }
  } else if (model === 'ram') {
    const b = new THREE.Group(); g.add(b); parts.body = b;
    const wool = toon('#fff6dc'), gold = toon('#e8b040');
    for (let i = 0; i < 9; i++) { const a = i * 0.7; b.add(mesh(G.sph(0.35, 10, 8), wool, Math.sin(a) * 0.35, 1.2 + Math.cos(a * 1.3) * 0.25, Math.cos(a) * 0.3)); }
    const head = mesh(G.sph(0.28, 12, 10), toon('#f2d8b0'), 0, 1.75, 0.3); b.add(head);
    for (const s of [-1, 1]) { const h = mesh(new THREE.TorusGeometry(0.18, 0.07, 6, 12, Math.PI * 1.5), gold, s * 0.28, 1.85, 0.25); h.rotation.y = s * Math.PI / 2; b.add(h); }
    eyes(b, 1.78, 0.55, 0.1, 0.05);
    for (const s of [-1, 1]) { const l = mesh(G.cap(0.1, 0.5), toon('#f2d8b0'), s * 0.22, 0.45, 0); b.add(l); const arm = mesh(G.cap(0.09, 0.4), toon('#f2d8b0'), s * 0.55, 1.15, 0.1); arm.rotation.z = s * 0.4; b.add(arm); }
    const axe = mesh(G.box(0.5, 0.35, 0.05), gold, 0.75, 1.3, 0.4); b.add(axe);
  } else if (model === 'maiden') {
    const c = buildCharacter({ hair: 'long', hairColor: '#3ab8f0', outfit: 'mage', outfitColor: '#2a8ac0', skin: '#e0f0ff' });
    g.add(c.group); parts.char = c;
    const ring = mesh(new THREE.TorusGeometry(0.7, 0.05, 6, 24), glow('#7ad8ff', 0.7), 0, 0.2, 0); ring.rotation.x = Math.PI / 2; g.add(ring); parts.ring = ring;
  } else if (model === 'cat') {
    const b = new THREE.Group(); g.add(b); parts.body = b;
    const fur = toon(opt.fur || '#f0a050'), fur2 = toon(opt.belly || '#fff0e0');
    const torso = mesh(G.sph(0.25, 12, 10), fur, 0, 0.3, 0); torso.scale.set(0.8, 0.75, 1.3); b.add(torso);
    const head = mesh(G.sph(0.2, 12, 10), fur, 0, 0.52, 0.3); b.add(head);
    const muzz = mesh(G.sph(0.09, 8, 6), fur2, 0, 0.47, 0.47); muzz.scale.z = 0.6; b.add(muzz);
    for (const s of [-1, 1]) { const ear = mesh(G.cone(0.07, 0.14, 4), fur, s * 0.11, 0.7, 0.28); b.add(ear); }
    eyes(b, 0.55, 0.47, 0.08, 0.035);
    const tail = mesh(G.cap(0.04, 0.4), fur, 0, 0.5, -0.38); tail.rotation.x = -0.6; b.add(tail); parts.tail = tail;
    if (opt.hat !== false) { const hat = mesh(G.cyl(0.1, 0.1, 0.18, 10), toon('#2a2a30'), 0, 0.78, 0.3); b.add(hat);
      const brim = mesh(G.cyl(0.16, 0.16, 0.02, 12), toon('#2a2a30'), 0, 0.69, 0.3); b.add(brim); }
    if (opt.nose) { const n = mesh(G.cone(0.04, 0.12, 6), toon(opt.nose), 0, 0.5, 0.52); n.rotation.x = Math.PI / 2; b.add(n); }
    if (opt.bag) { const bag = mesh(G.box(0.22, 0.2, 0.12), toon(opt.bag), 0, 0.36, -0.24); b.add(bag); const st = mesh(G.box(0.04, 0.04, 0.5), toon(opt.bag), 0, 0.48, 0); st.rotation.z = 0.7; b.add(st); }
    if (opt.wings) { for (const s of [-1, 1]) { const w = mesh(G.box(0.36, 0.02, 0.2), toon('#ffffff'), s * 0.28, 0.48, -0.08); w.rotation.z = s * 0.5; b.add(w); parts['wing' + s] = w; } }
    for (const [x, z] of [[-0.1, 0.18], [0.1, 0.18], [-0.1, -0.18], [0.1, -0.18]]) b.add(mesh(G.cyl(0.045, 0.045, 0.2, 6), fur2, x, 0.1, z));
  }
  addOutlines(g); shadowAll(g, true, false);
  return { group: g, parts };
}

export function animateMob(m, model, t, move, atk) {
  const p = m.parts;
  if (model === 'puffcap') { p.body.position.y = Math.abs(Math.sin(t * (move ? 10 : 3))) * (move ? 0.25 : 0.05); p.body.scale.y = 1 - Math.abs(Math.sin(t * 10)) * 0.08 * move; p.body.rotation.x = atk > 0 ? Math.sin(atk * Math.PI) * 0.6 : 0; }
  else if (model === 'boar') { p.legs.forEach((l, i) => { l.rotation.x = Math.sin(t * 14 + (i % 2 ? 0 : Math.PI) + (i > 1 ? Math.PI : 0)) * 0.6 * move; }); p.head.rotation.x = atk > 0 ? -Math.sin(atk * Math.PI) * 0.5 : Math.sin(t * 2) * 0.05; }
  else if (model === 'wisp') { p.body.position.y = Math.sin(t * 2.5) * 0.2; p.trail.forEach((s, i) => { s.position.x = Math.sin(t * 4 - i) * 0.12; }); p.body.scale.setScalar(1 + (atk > 0 ? Math.sin(atk * Math.PI) * 0.3 : 0)); }
  else if (model === 'golem') {
    p.arms.forEach((a, i) => { a.rotation.x = Math.sin(t * 3 + i * Math.PI) * 0.35 * move - (atk > 0 ? Math.sin(atk * Math.PI) * 2.2 : 0); });
    p.body.position.y = Math.abs(Math.sin(t * 3)) * 0.15 * move; p.jaw.position.y = -0.45 - Math.max(0, Math.sin(t * 1.3)) * 0.12;
  } else if (model === 'ram') { p.body.position.y = Math.abs(Math.sin(t * 8)) * 0.15 * move; p.body.rotation.x = atk > 0 ? Math.sin(atk * Math.PI) * 0.4 : 0; }
  else if (model === 'maiden') { animateCharacter(p.char, { t, move: 0, atk: -1, cast: atk > 0 ? 1 : 0.3 }); p.char.group.position.y = 0.3 + Math.sin(t * 2) * 0.1; p.ring.rotation.z = t; }
  else if (model === 'cat') { p.body.position.y = Math.abs(Math.sin(t * 10)) * 0.05 * move; p.tail.rotation.z = Math.sin(t * 3) * 0.4; }
}

// ----------------------------- Gathering nodes ----------------------------
const ORE_COL = [null, '#e08a4a', '#9a8a7a', '#a8e0ff'];
export function buildNode(type, tier) {
  const g = new THREE.Group();
  if (type === 'ore') {
    const r = mesh(new THREE.DodecahedronGeometry(0.9, 0), toon('#8a8478'), 0, 0.55, 0); r.scale.set(1.3, 0.85, 1.1); g.add(r);
    const r2 = mesh(new THREE.DodecahedronGeometry(0.55, 0), toon('#7a7468'), 0.8, 0.35, 0.3); g.add(r2);
    const om = tier === 3 ? glow(ORE_COL[3]) : toon(ORE_COL[tier]);
    for (let i = 0; i < 7; i++) { const a = i * 0.9; const f = mesh(new THREE.OctahedronGeometry(0.16, 0), om, Math.sin(a) * 0.85, 0.5 + (i % 3) * 0.2, Math.cos(a) * 0.75); f.rotation.set(a, a * 2, 0); g.add(f); }
  } else if (type === 'wood') {
    const trunkC = ['', '#f0ece0', '#6a4a2a', '#4a3a5a'][tier];
    const leafC = ['', '#9ad060', '#3a8a3a', '#9a8ae0'][tier];
    const trunk = mesh(G.cyl(0.25, 0.38, 3.2, 8), toon(trunkC), 0, 1.6, 0); g.add(trunk);
    if (tier === 1) for (let i = 0; i < 4; i++) { const s = mesh(G.box(0.27, 0.05, 0.05), toon('#2a2a2a'), 0, 0.6 + i * 0.6, 0.2); s.rotation.y = i; g.add(s); }
    const leaf = tier === 3 ? toon(leafC, { emissive: '#3a2a7a' }) : toon(leafC);
    const crowns = tier === 2 ? [[0, 3.8, 0, 1.6], [0.9, 3.3, 0.3, 1.1], [-0.8, 3.4, -0.3, 1.1]] : [[0, 3.4, 0, 1.2], [0, 4.3, 0, 0.9], [0.5, 3.0, 0.4, 0.8]];
    for (const [x, y, z, r] of crowns) { const c = mesh(new THREE.IcosahedronGeometry(r, 1), leaf, x, y, z); g.add(c); }
    if (tier === 3) for (let i = 0; i < 5; i++) { const v = mesh(G.cyl(0.04, 0.02, 1.6, 4), leaf, Math.sin(i * 1.3) * 1.1, 2.6, Math.cos(i * 1.3) * 1.1); g.add(v); }
  } else {
    const leafC = ['', '#5a9a4a', '#4a7a5a', '#7aa0a0'][tier];
    const tuftC = ['', '#ffffff', '#7a9aff', '#f0e8ff'][tier];
    for (let i = 0; i < 6; i++) { const a = i * 1.05; const b = mesh(G.sph(0.35, 10, 8), toon(leafC), Math.sin(a) * 0.4, 0.35, Math.cos(a) * 0.4); b.scale.y = 0.8; g.add(b); }
    const tm = tier === 3 ? glow(tuftC) : toon(tuftC);
    for (let i = 0; i < 8; i++) { const a = i * 0.8; g.add(mesh(G.sph(0.12, 8, 6), tm, Math.sin(a) * 0.45, 0.62 + (i % 2) * 0.12, Math.cos(a) * 0.45)); }
  }
  addOutlines(g); shadowAll(g, true, false);
  return g;
}
