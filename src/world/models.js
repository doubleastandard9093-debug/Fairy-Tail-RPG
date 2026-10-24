import { guildMarkTexture, MARK_SIZES } from './mark.js';
import * as THREE from 'three';
import { toon, glow, mesh, addOutlines, shadowAll, GFX } from './toon.js';
import { CREATURES, buildCreature, animateCreature, dressLizard, animateLizardExtra } from './creatures.js';
import { C2, buildC2, animateC2, dressLullaby, animateLullabyExtra, dressMage, animateMageExtra, dressWizard, animateWizardExtra, dressBossAura, animateBossAura } from './creatures2.js';
import { refineCharacter, animateDetail, refineMob, FRAMES, ACCESSORIES, EXTRA_OUTFITS } from './detail.js';
export { FRAMES, ACCESSORIES };

const G = {
  sph: (r = 1, w = 16, h = 12) => new THREE.SphereGeometry(r, w, h),
  cap: (r, l) => new THREE.CapsuleGeometry(r, l, 4, 10),
  cyl: (a, b, h, s = 10) => new THREE.CylinderGeometry(a, b, h, s),
  box: (x, y, z) => new THREE.BoxGeometry(x, y, z),
  cone: (r, h, s = 8) => new THREE.ConeGeometry(r, h, s),
};
const shade = (hex, k) => { const c = new THREE.Color(hex); c.multiplyScalar(k); return '#' + c.getHexString(); };

export const HAIR_STYLES = ['spiky', 'long', 'ponytail', 'sideponytail', 'bob', 'short', 'twintails'];
export const OUTFITS = ['mage', 'adventurer', 'brawler', ...EXTRA_OUTFITS];
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
  const eyes = [];
  for (const s of [-1, 1]) {
    const eyeG = new THREE.Group(); eyeG.position.set(0, -0.01, 0); head.add(eyeG); eyes.push(eyeG);
    const eye = mesh(G.sph(0.065, 12, 10), dark, s * 0.11, -0.01, 0.255); eye.scale.set(0.8, 1.25, 0.4); eye.position.y = 0; eyeG.add(eye);
    const iris = mesh(G.sph(0.045, 10, 8), toon(L.eyeColor || shade(L.hairColor, 0.8)), s * 0.11, -0.015, 0.272); iris.scale.set(0.8, 1.1, 0.3); eyeG.add(iris);
    const hl = mesh(G.sph(0.018, 6, 6), white, s * 0.11 + 0.015, 0.03, 0.285); eyeG.add(hl);
    const hl2 = mesh(G.sph(0.009, 5, 4), white, s * 0.11 - 0.014, -0.035, 0.285); eyeG.add(hl2);
    const lash = mesh(G.box(0.1, 0.016, 0.02), dark, s * 0.11, 0.07, 0.268); lash.rotation.z = -s * 0.12; eyeG.add(lash);
    const brow = mesh(G.box(0.09, 0.018, 0.02), toon(shade(L.hairColor, 0.6)), s * 0.11, 0.1, 0.27); brow.rotation.z = -s * 0.15; head.add(brow);
    const ear = mesh(G.sph(0.05, 8, 6), skin, s * 0.295, -0.02, 0); ear.scale.set(0.5, 1, 0.8); head.add(ear);
  }
  const mouth = mesh(G.box(0.06, 0.012, 0.01), toon('#a04040'), 0, -0.17, 0.235); head.add(mouth);
  const grin = mesh(new THREE.SphereGeometry(0.045, 10, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), toon('#7a2030'), 0, -0.16, 0.225); grin.scale.set(1.1, 0.7, 0.4); grin.visible = false; head.add(grin);
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
  // Guild mark decal (placement + size picked at character creation)
  let markMesh = null, markYaw = 0;
  if (L.mark) {
    const mm = new THREE.MeshBasicMaterial({ map: guildMarkTexture(L.mark.color), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
    const sz = MARK_SIZES[L.mark.size] || MARK_SIZES.medium;
    const p = mesh(new THREE.PlaneGeometry(sz, sz), mm); p.userData.noOutline = true; p.castShadow = false; markMesh = p;
    const place = L.mark.place || 'right arm'; const sd = place.startsWith('left') ? -1 : 1;
    if (place === 'chest') { p.position.set(0.1, 1.27, 0.2); body.add(p); }
    else if (place === 'stomach') { p.position.set(0, 1.07, 0.195); body.add(p); }
    else if (place === 'back') { p.position.set(0, 1.22, -0.205); p.rotation.y = Math.PI; body.add(p); markYaw = Math.PI; }
    else if (place.endsWith('hand')) { p.scale.setScalar(0.6); p.position.set(sd * 0.07, -0.3, 0); p.rotation.y = sd * Math.PI / 2; (sd < 0 ? armL : armR).userData.fore.add(p); markYaw = -sd * Math.PI / 2; }
    else if (place.endsWith('shoulder')) { p.scale.setScalar(1.35); mm.toneMapped = false; p.position.set(sd * 0.09, -0.03, 0); p.rotation.y = sd * Math.PI / 2; (sd < 0 ? armL : armR).add(p); markYaw = -sd * Math.PI / 2; }
    else if (place.endsWith('thigh')) { p.position.set(sd * 0.07, -0.2, 0.068); p.rotation.y = sd * 0.8; (sd < 0 ? legL : legR).add(p); markYaw = -sd * 0.8; }
    else { const arm = sd < 0 ? armL : armR; p.position.set(sd * 0.079, -0.16, 0); p.rotation.y = sd * Math.PI / 2; arm.add(p); markYaw = -sd * Math.PI / 2; }
  }

  const parts = { body, head, torso, armL, armR, legL, legR, gem, weapon: null, bowHand: null, eyes, mouth, grin, mark: markMesh, markYaw, pose: L.preset || null, seed: Math.random() * 10 };
  if (L.preset || L.build) dressPreset(L, parts, { skin, cloth, cloth2, hair: hairM });
  if (!L.lowDetail) refineCharacter(parts, L, { skin, cloth, cloth2, hair: hairM });
  root.scale.setScalar(L.scale * (L.height || 1));
  addOutlines(root); shadowAll(root, true, false);
  return { group: root, parts };
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
  } else if (style === 'sideponytail') {
    fringe(5, 0.42, 0.16, 0.25, 0.19);
    const tie = mesh(G.sph(0.06, 8, 6), toon('#3a6ae8'), 0.27, 0.16, -0.12); head.add(tie);
    const bowL = mesh(G.box(0.14, 0.08, 0.03), toon('#3a6ae8'), 0.3, 0.2, -0.1); bowL.rotation.z = 0.5; head.add(bowL);
    const tail = mesh(G.cap(0.09, 0.42), m, 0.38, -0.08, -0.16); tail.rotation.z = -0.35; head.add(tail);
    for (const s of [-1, 1]) { const side = mesh(G.cap(0.06, 0.34), m, s * 0.27, -0.22, 0.1); head.add(side); }
    const hang = mesh(G.cap(0.2, 0.3), m, 0, -0.26, -0.15); hang.scale.set(1.25, 1, 0.55); head.add(hang);
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
  const p = char.parts; const t = st.t; const mv = st.move || 0;
  const run = mv > 0.6 ? 1 : mv / 0.6; const fr = 9 + run * 2;
  const sw = Math.sin(t * fr) * 0.75 * mv;
  p.legL.rotation.x = sw; p.legR.rotation.x = -sw;
  p.legL.userData.shin.rotation.x = Math.max(0, -Math.sin(t * fr - 0.6)) * (0.9 + run * 0.4) * mv;
  p.legR.userData.shin.rotation.x = Math.max(0, Math.sin(t * fr - 0.6)) * (0.9 + run * 0.4) * mv;
  p.body.position.y = (p.bodyLift || 0) + Math.abs(Math.cos(t * fr)) * 0.07 * mv + Math.sin(t * 2) * 0.01;
  // breathing + blinking
  const br = Math.sin(t * 2.2 + (p.seed || 0)) * 0.018; p.torso.scale.y = 1 + br; p.head.position.y = 1.66 + br * 0.6;
  if (p.eyes) { const bt = (t + (p.seed || 0)) % 3.7; const bl = bt < 0.12 ? 0.12 : 1; for (const e of p.eyes) e.scale.y = st.dead ? 0.1 : bl; }
  const idle = Math.sin(t * 2.2) * 0.04;
  let aR = -sw * (0.8 + run * 0.5) + idle, aL = sw * (0.8 + run * 0.5) - idle, fR = -0.25 - run * 0.9 * mv, fL = -0.25 - run * 0.9 * mv, zR = 0.08, zL = -0.08;
  const still = mv < 0.1 && !(st.atk >= 0) && !(st.cast > 0) && !st.dead;
  // signature idle poses for the main cast
  if (still && p.pose && !st.emote) {
    const b = Math.sin(t * 3) * 0.05;
    if (p.pose === 'natsu') { aR = aL = -0.85 + b; fR = fL = -1.7; zR = 0.28; zL = -0.28; }
    else if (p.pose === 'erza') { aR = aL = -1.05; fR = fL = -1.85; zR = -0.42; zL = 0.42; }
    else if (p.pose === 'gray') { aR = 0.18; aL = 0.18; fR = fL = -0.5; zR = 0.16; zL = -0.16; }
    else if (p.pose === 'lucy') { aR = 0.15; zR = 0.75; fR = -1.9; }
    else if (p.pose === 'wendy') { aR = aL = -0.55; fR = fL = -1.0; zR = -0.32; zL = 0.32; }
    else if (p.pose === 'gajeel' || p.pose === 'laxus') { aR = aL = -1.0; fR = fL = -1.8; zR = -0.4; zL = 0.4; }
    else if (p.pose === 'levy') { aR = aL = -0.7; fR = fL = -1.4; zR = -0.15; zL = 0.15; }
    else if (p.pose === 'hero') { aR = aL = 0.1 + b * 0.5; fR = fL = -1.55; zR = 0.62; zL = -0.62; } // hands on hips
  }
  if (st.atk >= 0) {
    const k = st.atk; const wind = k < 0.35 ? k / 0.35 : 1 - (k - 0.35) / 0.65;
    aR = -2.4 * wind + (k > 0.35 ? 1.2 * (1 - wind) * 0.5 : 0); fR = -0.6 * wind; zR = 0.3 * wind;
    if (st.kind === 'bow') { aL = -1.55; fL = 0; aR = -1.45; fR = -1.2 * wind; zR = -0.3; zL = 0.15; }
    if (st.kind === 'punch') { aR = -1.6 * wind; fR = -0.1; aL = -0.6; fL = -1.4; }
  }
  if (st.cast > 0) { const c = Math.min(1, st.cast); aR = aL = -1.5 * c; fR = fL = -0.2; zR = 0.3 * c; zL = -0.3 * c; }
  // emotes: 'salute' = the Fairy Tail sign (arm raised, finger to the sky), 'cheer' = both arms up
  if (st.emote === 'salute') { aR = -2.95; zR = -0.12; fR = 0; } else if (st.emote === 'cheer') { const j = Math.sin(t * 10) * 0.15; aR = aL = -2.7 + j; zR = 0.35; zL = -0.35; fR = fL = -0.2; }
  p.armR.rotation.set(aR, 0, zR); p.armL.rotation.set(aL, 0, zL);
  p.armR.userData.fore.rotation.x = fR; p.armL.userData.fore.rotation.x = fL;
  if (p.grin) { const g = !!st.emote || (st.atk >= 0 && p.pose === 'natsu'); p.grin.visible = g; p.mouth.visible = !g; }
  p.head.rotation.y = st.look != null ? st.look : Math.sin(t * 0.7) * 0.08;
  p.head.rotation.x = st.emote === 'salute' ? -0.15 : 0;
  if (st.dead) { p.body.rotation.x = -1.4; p.body.position.y = 0.2; } else p.body.rotation.x = mv * (0.08 + run * 0.12) + (st.cast > 0 ? -0.05 : 0);
  if (p.spring) animateDetail(p, st, mv, sw);
}

// ------------------------------- Mobs -----------------------------------
export function buildMob(model, opt = {}) {
  if (CREATURES.has(model)) { const c = buildCreature(model, opt); if (opt.bossAura) dressBossAura(c.group, c.parts, opt.bossAura); addOutlines(c.group); shadowAll(c.group, true, false); return c; }
  if (C2.has(model)) { const c = buildC2(model, opt, buildCharacter); addOutlines(c.group); shadowAll(c.group, true, false); return c; }
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
  } else if (model === 'vulcan') {
    // Vulcan: hulking ape (white on Mt. Hakobe, mossy brown in the East Forest)
    const b = new THREE.Group(); g.add(b); parts.body = b;
    const fur = toon(opt.fur || '#f2f2f6'), fur2 = toon(shade(opt.fur || '#f2f2f6', 0.8)), face = toon(opt.face || '#d8a0a0');
    const torso = mesh(G.sph(0.62, 14, 12), fur, 0, 1.45, 0); torso.scale.set(1.15, 1.1, 0.9); b.add(torso);
    const belly = mesh(G.sph(0.42, 12, 10), face, 0, 1.3, 0.32); belly.scale.set(1, 1.1, 0.5); b.add(belly);
    for (let i = 0; i < 10; i++) { const a = i * 0.63; const tf = mesh(G.cone(0.1, 0.3, 5), fur2, Math.sin(a) * 0.62, 1.8 + (i % 3) * 0.12, Math.cos(a) * 0.5 - 0.1); tf.rotation.set(-Math.cos(a) * 0.8, 0, Math.sin(a) * 0.8); b.add(tf); }
    const head = new THREE.Group(); head.position.set(0, 2.25, 0.18); b.add(head); parts.head = head;
    head.add(mesh(G.sph(0.34, 12, 10), fur));
    const muz = mesh(G.sph(0.22, 10, 8), face, 0, -0.08, 0.24); muz.scale.set(1.1, 0.8, 0.8); head.add(muz);
    eyes(head, 0.08, 0.3, 0.12, 0.05);
    const tuft = mesh(G.cone(0.14, 0.32, 6), fur2, 0, 0.36, 0); head.add(tuft);
    for (const s of [-1, 1]) { const ear = mesh(G.sph(0.08, 8, 6), face, s * 0.32, 0.02, 0); head.add(ear); }
    parts.arms = [];
    for (const s of [-1, 1]) { const a = new THREE.Group(); a.position.set(s * 0.72, 1.85, 0); b.add(a);
      a.add(mesh(G.cap(0.17, 0.7), fur, 0, -0.45, 0)); a.add(mesh(G.sph(0.2, 10, 8), face, 0, -1.0, 0.05)); a.rotation.z = s * 0.15; parts.arms.push(a); }
    parts.legs = [];
    for (const s of [-1, 1]) { const l = new THREE.Group(); l.position.set(s * 0.3, 0.9, 0); b.add(l); l.add(mesh(G.cap(0.17, 0.45, 0), fur, 0, -0.4, 0)); l.add(mesh(G.box(0.26, 0.12, 0.36), face, 0, -0.84, 0.06)); parts.legs.push(l); }
  } else if (model === 'lizard') {
    // Lizardman: scaly humanoid with a snout, tail and spear
    const c = buildCharacter({ hair: 'short', hairColor: '#2a6a3a', outfit: 'brawler', outfitColor: '#6a4a2a', skin: '#5aa05a', eyeColor: '#f0d020' });
    g.add(c.group); parts.char = c;
    const sk = toon('#4a8a4a'), belly = toon('#c8d890');
    const snout = mesh(G.cone(0.2, 0.45, 8), sk, 0, -0.08, 0.38); snout.rotation.x = Math.PI / 2; c.parts.head.add(snout);
    for (let i = 0; i < 4; i++) c.parts.head.add(mesh(G.cone(0.05, 0.18, 4), toon('#c04a2a'), 0, 0.3 - i * 0.1, -0.2 - i * 0.07));
    const tail = mesh(G.cone(0.16, 1.1, 8), sk, 0, 0.75, -0.55); tail.rotation.x = -1.9; c.parts.body.add(tail); parts.tail = tail;
    const bl = mesh(G.sph(0.17, 10, 8), belly, 0, 1.15, 0.12); bl.scale.set(1, 1.4, 0.6); c.parts.body.add(bl);
    const spear = new THREE.Group(); spear.add(mesh(G.cyl(0.025, 0.025, 1.8, 6), toon('#6a4a2a'), 0, 0.4, 0)); spear.add(mesh(G.cone(0.06, 0.25, 4), toon('#c0c4cc'), 0, 1.4, 0)); c.parts.armR.userData.grip.add(spear); spear.rotation.x = Math.PI / 2;
  } else if (model === 'plue') {
    // Plue (Nikora): little white snowman-dog with a carrot nose
    const b = new THREE.Group(); g.add(b); parts.body = b;
    const wht = toon('#fbfbff'), wh2 = toon('#e8ecf6');
    const belly = mesh(G.sph(0.26, 14, 12), wht, 0, 0.3, 0); belly.scale.set(1, 0.9, 0.9); b.add(belly);
    const head = mesh(G.sph(0.22, 14, 12), wht, 0, 0.66, 0.02); head.scale.set(1.05, 0.95, 0.95); b.add(head); parts.head = head;
    const nose = mesh(G.cone(0.05, 0.22, 8), toon('#ff8a1a'), 0, 0.64, 0.3); nose.rotation.x = Math.PI / 2; b.add(nose);
    for (const s of [-1, 1]) {
      const e = mesh(G.sph(0.03, 8, 6), toon('#141418'), s * 0.08, 0.72, 0.2); b.add(e);
      const ear = mesh(G.cone(0.05, 0.1, 6), wh2, s * 0.15, 0.85, 0); ear.rotation.z = -s * 0.5; b.add(ear);
      const arm = mesh(G.cap(0.04, 0.1), wh2, s * 0.25, 0.34, 0.06); arm.rotation.z = s * 0.8; b.add(arm);
      const ft = mesh(G.sph(0.06, 8, 6), wh2, s * 0.11, 0.05, 0.05); ft.scale.y = 0.6; b.add(ft);
    }
    const tail = mesh(G.cap(0.03, 0.08), wh2, 0, 0.3, -0.26); tail.rotation.x = -0.8; b.add(tail); parts.tail = tail;
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
    if (opt.wings) { // Aera: feathered white wings, each a fan of overlapping feathers
      for (const s of [-1, 1]) { const w = new THREE.Group(); w.position.set(s * 0.12, 0.5, -0.12); b.add(w); parts['wing' + s] = w;
        for (let i = 0; i < 5; i++) { const f = mesh(G.cap(0.035, 0.26 - i * 0.03), toon(i % 2 ? '#f4f4ff' : '#ffffff'), s * (0.12 + i * 0.05), 0.02 - i * 0.035, -0.02 * i); f.rotation.z = s * (1.2 + i * 0.18); f.scale.z = 0.4; w.add(f); } } }
    if (opt.happy) { // white belly and muzzle, big ears, curled tail tip
      const belly = mesh(G.sph(0.19, 12, 10), fur2, 0, 0.27, 0.12); belly.scale.set(0.8, 0.85, 0.6); b.add(belly);
      const tip = mesh(G.sph(0.06, 8, 6), fur2, 0, 0.72, -0.55); b.add(tip);
      const mouth = mesh(G.box(0.06, 0.012, 0.01), toon('#3a1a1a'), 0, 0.42, 0.5); b.add(mouth);
    }
    for (const [x, z] of [[-0.1, 0.18], [0.1, 0.18], [-0.1, -0.18], [0.1, -0.18]]) b.add(mesh(G.cyl(0.045, 0.045, 0.2, 6), fur2, x, 0.1, z));
  } else if (model === 'lullaby') {
    // Lullaby: cursed flute of Zeref (form 1) that becomes a towering wooden demon (form 2).
    const wood = toon('#5a3a22'), wood2 = toon('#3e2616'), bark = toon('#7a5232'), hole = toon('#120806');
    const eyeM = new THREE.MeshBasicMaterial({ color: '#b8ff6a' }); parts.eyeM = eyeM;
    const holeGlow = new THREE.MeshBasicMaterial({ color: '#8affc0', transparent: true, opacity: 0.85, depthWrite: false }); parts.holeGlow = holeGlow;
    // --- flute form: a floating three-eyed skull flute
    const flute = new THREE.Group(); g.add(flute); parts.flute = flute;
    const pipe = mesh(G.cyl(0.16, 0.2, 2.6, 12), wood2, 0, 0, 0); flute.add(pipe);
    for (let i = 0; i < 4; i++) { const hl = mesh(G.cyl(0.06, 0.06, 0.06, 8), hole, 0, -0.8 + i * 0.4, 0.17); hl.rotation.x = Math.PI / 2; flute.add(hl); }
    const skullF = mesh(G.sph(0.42, 14, 10), toon('#d8ccb0'), 0, 1.55, 0); skullF.scale.set(1, 1.1, 0.95); flute.add(skullF);
    for (const [x, y] of [[-0.15, 1.6], [0.15, 1.6], [0, 1.78]]) { const e = mesh(G.sph(0.08, 8, 6), eyeM, x, y, 0.36); e.scale.z = 0.4; flute.add(e); }
    const fluteRing = mesh(new THREE.TorusGeometry(0.9, 0.04, 6, 32), holeGlow, 0, 0, 0); fluteRing.rotation.x = Math.PI / 2; flute.add(fluteRing); parts.fluteRing = fluteRing;
    flute.position.y = 2.2;
    // --- demon form
    const demon = new THREE.Group(); g.add(demon); parts.demon = demon; parts.body = demon;
    const hipY = 5.2;
    const pelvis = mesh(G.sph(1.0, 12, 10), wood, 0, hipY, 0); pelvis.scale.set(1.2, 0.7, 0.9); demon.add(pelvis);
    const trunk = mesh(G.cyl(1.15, 0.85, 4.6, 14), wood, 0, hipY + 2.4, 0); demon.add(trunk); // pipe-like torso
    const chest = mesh(G.sph(1.35, 14, 10), bark, 0, hipY + 4.6, 0.1); chest.scale.set(1.25, 0.9, 0.9); demon.add(chest);
    // bark ridges
    for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; const r = mesh(G.box(0.14, 4.2, 0.18), wood2, Math.sin(a) * 1.04, hipY + 2.4, Math.cos(a) * 1.04); r.rotation.y = a; r.rotation.z = Math.sin(a * 3) * 0.06; demon.add(r); }
    // flute holes down the front and back, each with a ghostly inner glow
    parts.holes = [];
    for (let i = 0; i < 6; i++) for (const s of [1, -1]) {
      const y = hipY + 0.7 + i * 0.7, x = (i % 2 ? 0.25 : -0.25);
      const hl = mesh(G.cyl(0.2, 0.2, 0.12, 12), hole, x, y, s * 1.05); hl.rotation.x = Math.PI / 2; demon.add(hl);
      const gl = mesh(G.cyl(0.12, 0.12, 0.13, 10), holeGlow, x, y, s * 1.06); gl.rotation.x = Math.PI / 2; gl.userData.noOutline = true; demon.add(gl); parts.holes.push(gl);
    }
    // head: long skull-like wooden mask with three glowing eye holes and a gaping mouth
    const head = new THREE.Group(); head.position.set(0, hipY + 6.2, 0.4); demon.add(head); parts.head = head;
    const skull = mesh(G.sph(1.0, 16, 12), bark); skull.scale.set(0.95, 1.25, 0.9); head.add(skull);
    for (const [x, y, r] of [[-0.38, 0.2, 0.22], [0.38, 0.2, 0.22], [0, 0.62, 0.17]]) {
      const sock = mesh(G.sph(r * 1.35, 10, 8), hole, x, y, 0.74); sock.scale.z = 0.4; head.add(sock);
      const e = mesh(G.sph(r * 0.8, 10, 8), eyeM, x, y, 0.82); e.scale.z = 0.4; e.userData.noOutline = true; head.add(e);
    }
    const mouth = mesh(G.sph(0.42, 12, 8), hole, 0, -0.55, 0.62); mouth.scale.set(1.2, 0.6, 0.5); head.add(mouth); parts.mouth = mouth;
    for (let i = 0; i < 5; i++) { const tth = mesh(G.cone(0.07, 0.25, 4), toon('#d8ccb0'), -0.36 + i * 0.18, -0.36, 0.78); tth.rotation.x = Math.PI; head.add(tth); }
    // branch horns
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {
      const br = mesh(G.cone(0.14 - i * 0.03, 1.6 - i * 0.3, 6), wood2, s * (0.55 + i * 0.25), 1.0 + i * 0.25, -0.1 - i * 0.15);
      br.rotation.z = -s * (0.5 + i * 0.25); br.rotation.x = -0.25; head.add(br);
    }
    // long limbs with twig claws (shoulder pivots)
    parts.arms = [];
    for (const s of [-1, 1]) {
      const a = new THREE.Group(); a.position.set(s * 1.7, hipY + 4.9, 0); demon.add(a);
      a.add(mesh(G.sph(0.55, 10, 8), bark));
      const up = mesh(G.cyl(0.38, 0.3, 3.6, 10), wood, 0, -1.8, 0); a.add(up);
      const fore = new THREE.Group(); fore.position.set(0, -3.6, 0); a.add(fore);
      fore.add(mesh(G.sph(0.36, 10, 8), wood2));
      fore.add(mesh(G.cyl(0.3, 0.2, 3.4, 10), wood, 0, -1.7, 0));
      for (let i = 0; i < 4; i++) { const c = mesh(G.cone(0.1, 1.1, 5), wood2, (i - 1.5) * 0.18, -3.8, 0.1); c.rotation.x = Math.PI + (i - 1.5) * 0.15; c.rotation.z = (i - 1.5) * 0.2; fore.add(c); }
      for (let i = 0; i < 2; i++) { const hl = mesh(G.cyl(0.11, 0.11, 0.1, 8), hole, 0, -0.9 - i * 1.0, 0.33); hl.rotation.x = Math.PI / 2; up.add(hl); }
      a.rotation.z = s * 0.25; a.userData.fore = fore; fore.rotation.x = -0.35;
      parts.arms.push(a);
    }
    // long legs ending in root feet
    parts.legs = [];
    for (const s of [-1, 1]) {
      const l = new THREE.Group(); l.position.set(s * 0.85, hipY, 0); demon.add(l);
      l.add(mesh(G.cyl(0.42, 0.32, 2.8, 10), wood, 0, -1.4, 0));
      const shin = new THREE.Group(); shin.position.set(0, -2.8, 0); l.add(shin); shin.add(mesh(G.sph(0.36, 10, 8), wood2));
      shin.add(mesh(G.cyl(0.32, 0.45, 2.3, 10), wood, 0, -1.15, 0));
      for (let i = 0; i < 4; i++) { const rt = mesh(G.cone(0.16, 1.0, 5), wood2, Math.sin(i * 1.6) * 0.4, -2.3, Math.cos(i * 1.6) * 0.4 + 0.2); rt.rotation.x = Math.PI / 2 + Math.cos(i * 1.6) * 0.6; rt.rotation.z = Math.sin(i * 1.6) * 0.8; shin.add(rt); }
      l.userData.shin = shin; parts.legs.push(l);
    }
    demon.visible = false;
  } else if (model === 'wizard') {
    // Story-boss wizards (Jose, Jellal): a full character, a phase aura and a few signature details
    const c = buildCharacter(opt.look || {}); g.add(c.group); parts.char = c;
    const cape = mesh(new THREE.BoxGeometry(0.9, 1.3, 0.06), toon(opt.look?.outfitColor || '#222'), 0, 1.05, -0.26); cape.rotation.x = 0.12; c.group.add(cape); parts.cape = cape;
    if (opt.mustache) { const mu = mesh(new THREE.BoxGeometry(0.26, 0.05, 0.05), toon('#1a1420'), 0, -0.08, 0.3); c.parts.head.add(mu); }
    if (opt.tattoo) { for (const [y, l] of [[0.1, 0.22], [0.02, 0.3], [-0.06, 0.18]]) { const tt = mesh(new THREE.BoxGeometry(0.03, l, 0.02), toon('#c0202a'), -0.12, y, 0.3); tt.rotation.z = 0.2; c.parts.head.add(tt); } }
    if (opt.body === 'jose') {
      // Jose: long purple greatcoat with flared skirt, tall stand-up collar, domed pauldrons and gold buttons
      const coat = toon('#3a2a5a'), trim = toon('#c8a040'), dark = toon('#1a1424');
      const skirt = mesh(new THREE.CylinderGeometry(0.3, 0.52, 0.9, 14, 1, true), coat, 0, 0.42, 0); skirt.material = coat.clone(); skirt.material.side = THREE.DoubleSide; c.group.add(skirt); parts.skirt = skirt;
      { const hem = mesh(new THREE.TorusGeometry(0.5, 0.025, 6, 20), trim, 0, -0.02, 0); hem.rotation.x = Math.PI / 2; c.group.add(hem); }
      const col = mesh(new THREE.CylinderGeometry(0.24, 0.17, 0.3, 12, 1, true, Math.PI * 0.25, Math.PI * 1.5), dark, 0, 1.5, -0.02); col.material = dark.clone(); col.material.side = THREE.DoubleSide; col.rotation.y = Math.PI; c.group.add(col);
      for (const sx of [-1, 1]) { const pd = mesh(new THREE.SphereGeometry(0.17, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), coat, sx * 0.3, 1.33, 0); pd.scale.set(1.2, 0.8, 1); c.group.add(pd); const rg = mesh(new THREE.TorusGeometry(0.17, 0.02, 5, 14), trim, sx * 0.3, 1.33, 0); rg.rotation.x = Math.PI / 2; c.group.add(rg); }
      for (let i = 0; i < 4; i++) c.group.add(mesh(G.sph(0.025, 6, 4), trim, 0, 1.25 - i * 0.14, 0.2));
      cape.scale.set(1.1, 1.25, 1); cape.position.y = 0.95;
    } else if (opt.body === 'jellal') {
      // Jellal: dark long coat, floor-length cape with gold trim, high collar and gold shoulder guards
      const coat = toon('#1e2030'), gold = toon('#d8b050'), cloth = toon('#2a2a44');
      cape.geometry.dispose(); cape.geometry = new THREE.BoxGeometry(1.0, 1.75, 0.05); cape.material = cloth; cape.position.set(0, 0.62, -0.27);
      cape.add(mesh(new THREE.BoxGeometry(1.02, 0.07, 0.06), gold, 0, -0.86, 0)); for (const sx of [-1, 1]) cape.add(mesh(new THREE.BoxGeometry(0.05, 1.75, 0.06), gold, sx * 0.5, 0, 0));
      const tail = mesh(new THREE.CylinderGeometry(0.28, 0.44, 0.75, 12, 1, true, Math.PI * 0.6, Math.PI * 1.8), coat, 0, 0.48, 0); tail.material = coat.clone(); tail.material.side = THREE.DoubleSide; c.group.add(tail);
      const col = mesh(new THREE.CylinderGeometry(0.23, 0.18, 0.26, 12, 1, true, Math.PI * 0.3, Math.PI * 1.4), cloth, 0, 1.48, -0.02); col.material = cloth.clone(); col.material.side = THREE.DoubleSide; col.rotation.y = Math.PI; c.group.add(col);
      for (const sx of [-1, 1]) { const sh = mesh(new THREE.BoxGeometry(0.26, 0.07, 0.3), gold, sx * 0.31, 1.38, 0); sh.rotation.z = -sx * 0.35; c.group.add(sh); }
      c.group.add(mesh(new THREE.BoxGeometry(0.5, 0.06, 0.34), gold, 0, 0.86, 0));
    }
    else if (opt.body === 'laxus') {
      // Laxus: dark greatcoat worn over the shoulders with a thick fur collar, spiked headphones and a lightning scar
      const coat = toon('#2a2a30'), fur = toon('#5a4a3a', { rough: 0.95 }), gold = toon('#d8b050', { metal: 0.6 });
      const sk = mesh(new THREE.CylinderGeometry(0.34, 0.6, 1.25, 14, 1, true, Math.PI * 0.35, Math.PI * 1.3), coat, 0, 0.62, 0); sk.material = coat.clone(); sk.material.side = THREE.DoubleSide; sk.rotation.y = Math.PI; c.group.add(sk); parts.skirt = sk;
      const fc = mesh(new THREE.TorusGeometry(0.3, 0.11, 8, 18), fur, 0, 1.4, -0.02); fc.rotation.x = Math.PI / 2; fc.scale.set(1.1, 1, 0.7); c.group.add(fc);
      for (const sx of [-1, 1]) { const ph = mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.07, 10), gold, sx * 0.3, 0.02, 0); ph.rotation.z = Math.PI / 2; c.parts.head.add(ph); const sp = mesh(G.cone(0.035, 0.22, 4), gold, sx * 0.33, 0.14, 0); sp.rotation.z = -sx * 0.5; c.parts.head.add(sp); }
      for (const [y, rz] of [[0.12, 0.5], [0.04, -0.5], [-0.04, 0.5]]) { const sc = mesh(new THREE.BoxGeometry(0.02, 0.09, 0.01), glow('#ffe24a', 0.7), 0.1, y, 0.31); sc.rotation.z = rz; c.parts.head.add(sc); }
      cape.visible = false;
    } else if (opt.body === 'lyon') {
      // Lyon: long white coat with a flared skirt, slate-blue trim and a tall collar
      const coat = toon('#e8eef6'), trim = toon('#3a4a6a');
      const sk = mesh(new THREE.CylinderGeometry(0.3, 0.55, 1.0, 14, 1, true), coat, 0, 0.48, 0); sk.material = coat.clone(); sk.material.side = THREE.DoubleSide; c.group.add(sk); parts.skirt = sk;
      const hem = mesh(new THREE.TorusGeometry(0.53, 0.025, 6, 20), trim, 0, -0.01, 0); hem.rotation.x = Math.PI / 2; c.group.add(hem);
      const col = mesh(new THREE.CylinderGeometry(0.22, 0.17, 0.28, 12, 1, true, Math.PI * 0.3, Math.PI * 1.4), trim, 0, 1.49, -0.02); col.material = trim.clone(); col.material.side = THREE.DoubleSide; col.rotation.y = Math.PI; c.group.add(col);
      c.group.add(mesh(new THREE.BoxGeometry(0.5, 0.06, 0.34), trim, 0, 0.88, 0)); cape.material = coat; cape.scale.set(1, 1.2, 1);
    } else if (opt.body === 'everlue') {
      // Duke Everlue: round gold-brocade belly, purple cape, ruffled collar and a twirled moustache
      const gold = toon('#c89a3a', { pat: 'brick' }), purple = toon('#6a2a5a');
      const belly = mesh(new THREE.SphereGeometry(0.42, 16, 12), gold, 0, 0.95, 0.05); belly.scale.set(1.05, 1, 0.95); c.group.add(belly);
      for (let i = 0; i < 3; i++) c.group.add(mesh(G.sph(0.03, 6, 4), toon('#f4e8c0', { metal: 0.5 }), 0, 1.15 - i * 0.16, 0.45 - Math.abs(i - 1) * 0.04));
      const ruff = mesh(new THREE.TorusGeometry(0.17, 0.06, 6, 14), toon('#f4f0e8'), 0, 1.42, 0); ruff.rotation.x = Math.PI / 2; c.group.add(ruff);
      cape.material = purple; cape.scale.set(1.15, 1.1, 1);
      for (const sx of [-1, 1]) { const mu = mesh(new THREE.TorusGeometry(0.06, 0.018, 5, 10, Math.PI * 1.3), toon('#1a1420'), sx * 0.09, -0.08, 0.31); mu.rotation.z = sx > 0 ? -0.6 : Math.PI + 0.6; c.parts.head.add(mu); }
    } else if (opt.body === 'brain') {
      // Brain: floor-length white robe, dark green sash, and his skull-topped staff Darkness Ruler
      const robe = toon('#e8e4d8'), sash = toon('#2a3a2a');
      const sk = mesh(new THREE.CylinderGeometry(0.3, 0.6, 1.2, 14, 1, true), robe, 0, 0.55, 0); sk.material = robe.clone(); sk.material.side = THREE.DoubleSide; c.group.add(sk); parts.skirt = sk;
      c.group.add(mesh(new THREE.BoxGeometry(0.52, 0.09, 0.36), sash, 0, 0.9, 0)); cape.material = sash; cape.scale.set(1.1, 1.3, 1); cape.position.y = 0.9;
      const st = mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.0, 6), toon('#3a2a1a'), 0, 0, 0); c.parts.armR.userData.grip.add(st); st.position.y = 0.2;
      const sk2 = mesh(G.sph(0.13, 10, 8), toon('#e8e0c8'), 0, 1.15, 0); st.add(sk2); for (const sx of [-1, 1]) sk2.add(mesh(G.sph(0.03, 5, 4), glow('#5aff8a'), sx * 0.05, 0.02, 0.11));
    } else if (opt.body === 'hades') {
      // Hades: black longcoat with a blood-red lining, a long white beard and an eyepatch
      const coat = toon('#2a1a1a'), red = toon('#6a1a1a');
      const sk = mesh(new THREE.CylinderGeometry(0.32, 0.56, 1.1, 14, 1, true), coat, 0, 0.5, 0); sk.material = coat.clone(); sk.material.side = THREE.DoubleSide; c.group.add(sk); parts.skirt = sk;
      cape.material = red; cape.scale.set(1.15, 1.3, 1); cape.position.y = 0.9;
      const beard = mesh(G.cone(0.16, 0.55, 8), toon('#f0f0f0'), 0, -0.32, 0.18); beard.rotation.x = Math.PI + 0.25; c.parts.head.add(beard);
      const ep = mesh(new THREE.BoxGeometry(0.1, 0.08, 0.02), toon('#111111'), 0.1, 0.06, 0.31); c.parts.head.add(ep);
    }
    if (opt.body === 'sting') {
      // Sting: sleeveless dark vest over a fur-trimmed half cape and the Sabertooth mark on his shoulder
      const vest = toon('#3a3a4a'), fur = toon('#e8e0d0', { rough: 0.95 });
      const cape = mesh(new THREE.CylinderGeometry(0.34, 0.5, 0.9, 14, 1, true, Math.PI * 0.5, Math.PI), vest, 0, 1.0, 0); cape.material = vest.clone(); cape.material.side = THREE.DoubleSide; cape.rotation.y = Math.PI; c.group.add(cape);
      const fc = mesh(new THREE.TorusGeometry(0.28, 0.08, 8, 18), fur, 0, 1.42, -0.02); fc.rotation.x = Math.PI / 2; c.group.add(fc);
    } else if (opt.body === 'byro') {
      // Byro: long scholar's coat, pale headwrap and a floating clock-hand staff
      const coat = toon('#3a4a3a'), cream = toon('#d8d8c8');
      const sk = mesh(new THREE.CylinderGeometry(0.3, 0.55, 1.1, 14, 1, true), coat, 0, 0.5, 0); sk.material = coat.clone(); sk.material.side = THREE.DoubleSide; c.group.add(sk); parts.skirt = sk;
      const wrap = mesh(new THREE.TorusGeometry(0.27, 0.07, 6, 16), cream, 0, 0.12, 0); wrap.rotation.x = Math.PI / 2; c.parts.head.add(wrap);
    } else if (opt.body === 'teebo') {
      // Teebo: a sleeveless brute with a studded belt and a spiked shoulder guard
      const iron = toon('#5a5a62', { metal: 0.5 }), belt = toon('#3a2a1a');
      const b = mesh(new THREE.TorusGeometry(0.34, 0.06, 6, 18), belt, 0, 0.9, 0); b.rotation.x = Math.PI / 2; c.group.add(b);
      const pad = mesh(new THREE.SphereGeometry(0.2, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), iron, -0.36, 1.32, 0); c.group.add(pad);
      for (let k = 0; k < 3; k++) { const sp = mesh(G.cone(0.04, 0.16, 4), iron, -0.36 + (k - 1) * 0.08, 1.48, 0); c.group.add(sp); }
    }
    if (opt.body === 'mard') {
      // Mard Geer: pale high-collared coat and a thorn circlet
      const coat = toon('#2a1a2a'), thorn = toon('#3a1a1a');
      const sk = mesh(new THREE.CylinderGeometry(0.3, 0.6, 1.15, 14, 1, true), coat, 0, 0.5, 0); sk.material = coat.clone(); sk.material.side = THREE.DoubleSide; c.group.add(sk); parts.skirt = sk;
      for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; const sp = mesh(G.cone(0.03, 0.16, 4), thorn, Math.cos(a) * 0.26, 0.28, Math.sin(a) * 0.26); c.parts.head.add(sp); }
    } else if (opt.body === 'zeref') {
      // Zeref: a black robe with a pale toga sash
      const robe = toon('#1a1a1a'), sash = toon('#e8e0d0');
      const sk = mesh(new THREE.CylinderGeometry(0.3, 0.58, 1.15, 14, 1, true), robe, 0, 0.5, 0); sk.material = robe.clone(); sk.material.side = THREE.DoubleSide; c.group.add(sk); parts.skirt = sk;
      const sh = mesh(new THREE.TorusGeometry(0.32, 0.07, 6, 18), sash, 0, 1.15, 0); sh.rotation.set(Math.PI / 2, 0.5, 0); c.group.add(sh);
    } else if (opt.body === 'irene') {
      // Irene: a tall witch's hat and a long scarlet gown
      const gown = toon('#3a2a3a'), hat = toon('#2a1a2a');
      const sk = mesh(new THREE.CylinderGeometry(0.3, 0.62, 1.15, 14, 1, true), gown, 0, 0.5, 0); sk.material = gown.clone(); sk.material.side = THREE.DoubleSide; c.group.add(sk); parts.skirt = sk;
      const br = mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.04, 16), hat, 0, 0.3, 0); c.parts.head.add(br); const tp = mesh(G.cone(0.24, 0.7, 12), hat, 0, 0.66, -0.04); tp.rotation.x = -0.2; c.parts.head.add(tp);
    } else if (opt.body === 'ajeel') {
      // Ajeel: a desert turban and loose sand-coloured robes
      const cl = toon('#e8d8a8'), gold = toon('#d8a83a', { metal: 0.5 });
      const tb = mesh(new THREE.SphereGeometry(0.3, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), cl, 0, 0.12, 0); tb.scale.y = 0.8; c.parts.head.add(tb); c.parts.head.add(mesh(new THREE.SphereGeometry(0.05, 8, 6), gold, 0, 0.2, 0.28));
      const sk = mesh(new THREE.CylinderGeometry(0.34, 0.5, 0.8, 14, 1, true), cl, 0, 0.5, 0); sk.material = cl.clone(); sk.material.side = THREE.DoubleSide; c.group.add(sk);
    } else if (opt.body === 'arlock') {
      // Arlock: a priest's mantle and a tall ritual mitre
      const mant = toon('#3a2a1a'), gold = toon('#c8903a', { metal: 0.5 });
      const sk = mesh(new THREE.CylinderGeometry(0.3, 0.56, 1.1, 14, 1, true), mant, 0, 0.5, 0); sk.material = mant.clone(); sk.material.side = THREE.DoubleSide; c.group.add(sk); parts.skirt = sk;
      const mt = mesh(new THREE.CylinderGeometry(0.12, 0.24, 0.45, 8), gold, 0, 0.42, 0); c.parts.head.add(mt);
    } else if (opt.body === 'rogue') {
      // Future Rogue: a ragged black cloak with a high collar
      const cl = toon('#1e1e28');
      const sk = mesh(new THREE.CylinderGeometry(0.34, 0.66, 1.2, 12, 1, true), cl, 0, 0.5, 0); sk.material = cl.clone(); sk.material.side = THREE.DoubleSide; c.group.add(sk); parts.skirt = sk;
      const col = mesh(new THREE.CylinderGeometry(0.3, 0.24, 0.3, 12, 1, true), cl, 0, 1.5, 0); col.material = sk.material; c.group.add(col);
    }
    const aura = mesh(new THREE.SphereGeometry(1.1, 16, 12), glow(opt.aura || '#ffffff'), 0, 1, 0); aura.material = aura.material.clone(); aura.material.transparent = true; aura.material.opacity = 0.12; aura.material.depthWrite = false; aura.scale.set(1, 1.5, 1); g.add(aura); parts.aura = aura;
  } else if (model === 'mage') {
    // Eisenwald dark-guild mage: hooded, cloaked humanoid with a scythe-staff
    const c = buildCharacter({ hair: 'short', hairColor: '#1a1a22', outfit: 'mage', outfitColor: opt.robe || '#2a2236', skin: '#d8b8a0', eyeColor: '#c02a2a' });
    g.add(c.group); parts.char = c;
    const hood = mesh(new THREE.SphereGeometry(0.36, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.62), toon('#1a1424'), 0, 0.05, -0.03); hood.scale.set(1.05, 1.1, 1.1); c.parts.head.add(hood);
    const st = buildWeapon('staff', 1); c.parts.armR.userData.grip.add(st);
    const blade = mesh(G.cone(0.1, 0.7, 4), toon('#b0b4c0'), 0.25, 1.1, 0); blade.rotation.z = -1.9; st.add(blade);
    const mark = mesh(G.sph(0.05, 6, 4), glow('#9a3aff'), 0.12, 1.25, 0.2); c.group.add(mark);
  }
  refineMob(model, g, parts);
  if (model === 'lizard') dressLizard(g, parts);
  else if (model === 'lullaby') dressLullaby(g, parts);
  else if (model === 'mage') dressMage(g, parts, opt.robe || '#2a2236');
  else if (model === 'wizard') dressWizard(g, parts, opt);
  addOutlines(g); shadowAll(g, true, false);
  return { group: g, parts };
}

export function animateMob(m, model, t, move, atk) {
  const p = m.parts;
  if (CREATURES.has(model)) { animateCreature(m, model, t, move, atk); if (p.bossAura) animateBossAura(p, t); return; }
  if (C2.has(model)) { animateC2(m, model, t, move, atk, animateCharacter); return; }
  if (model === 'puffcap') { p.body.position.y = Math.abs(Math.sin(t * (move ? 10 : 3))) * (move ? 0.25 : 0.05); p.body.scale.y = 1 - Math.abs(Math.sin(t * 10)) * 0.08 * move; p.body.rotation.x = atk > 0 ? Math.sin(atk * Math.PI) * 0.6 : 0; }
  else if (model === 'boar') { p.legs.forEach((l, i) => { l.rotation.x = Math.sin(t * 14 + (i % 2 ? 0 : Math.PI) + (i > 1 ? Math.PI : 0)) * 0.6 * move; }); p.head.rotation.x = atk > 0 ? -Math.sin(atk * Math.PI) * 0.5 : Math.sin(t * 2) * 0.05; }
  else if (model === 'wisp') { p.body.position.y = Math.sin(t * 2.5) * 0.2; p.trail.forEach((s, i) => { s.position.x = Math.sin(t * 4 - i) * 0.12; }); p.body.scale.setScalar(1 + (atk > 0 ? Math.sin(atk * Math.PI) * 0.3 : 0)); }
  else if (model === 'golem') {
    p.arms.forEach((a, i) => { a.rotation.x = Math.sin(t * 3 + i * Math.PI) * 0.35 * move - (atk > 0 ? Math.sin(atk * Math.PI) * 2.2 : 0); });
    p.body.position.y = Math.abs(Math.sin(t * 3)) * 0.15 * move; p.jaw.position.y = -0.45 - Math.max(0, Math.sin(t * 1.3)) * 0.12;
  } else if (model === 'ram') { p.body.position.y = Math.abs(Math.sin(t * 8)) * 0.15 * move; p.body.rotation.x = atk > 0 ? Math.sin(atk * Math.PI) * 0.4 : 0; }
  else if (model === 'maiden') { animateCharacter(p.char, { t, move: 0, atk: -1, cast: atk > 0 ? 1 : 0.3 }); p.char.group.position.y = 0.3 + Math.sin(t * 2) * 0.1; p.ring.rotation.z = t; }
  else if (model === 'lullaby') { animateLullaby(p, t, move, atk); animateLullabyExtra(p, t); }
  else if (model === 'wizard') { const e = p.st || {}; const st = { phase: e.phase, trans: e.transition > 0, dashing: e.bossCharge && e.bossCharge.go }; animateCharacter(p.char, { t, move, atk: atk > 0 ? atk : -1, kind: 'slash', cast: e.castLock > 0 || st.trans ? 1 : atk > 0 ? 0.8 : 0.15 });
    const ph = st.phase || 1; p.aura.material.opacity = (st.trans ? 0.45 : 0.08 + ph * 0.07) + Math.sin(t * 6) * 0.03; p.aura.scale.setScalar(1 + ph * 0.18 + (st.trans ? Math.sin(t * 20) * 0.1 : 0)); p.aura.scale.y *= 1.5; p.cape.rotation.x = 0.12 + move * 0.5 + Math.sin(t * 3) * 0.05;
    if (st.dashing) p.char.group.rotation.x = 0.5; else p.char.group.rotation.x = 0; animateWizardExtra(p, t); }
  else if (model === 'mage') { animateCharacter(p.char, { t, move, atk: atk > 0 ? atk : -1, kind: 'slash', cast: atk > 0 || m.wind > 0 ? 0.8 : 0 }); animateMageExtra(m, t, atk); }
  else if (model === 'vulcan') { p.legs.forEach((l, i) => { l.rotation.x = Math.sin(t * 8 + i * Math.PI) * 0.5 * move; }); p.arms.forEach((a, i) => { a.rotation.x = Math.sin(t * 8 + i * Math.PI + Math.PI) * 0.5 * move - (atk > 0 ? Math.sin(atk * Math.PI) * 2.2 : 0); }); p.body.position.y = Math.abs(Math.sin(t * 8)) * 0.08 * move; p.head.rotation.z = Math.sin(t * 1.5) * 0.08; }
  else if (model === 'lizard') { animateCharacter(p.char, { t, move, atk: atk > 0 ? atk : -1, kind: 'slash', cast: 0 }); p.tail.rotation.z = Math.sin(t * 3) * 0.3; animateLizardExtra(p, t, move, atk, m.wind); }
  else if (model === 'plue') { p.body.position.x = Math.sin(t * 40) * 0.012; p.body.position.y = Math.abs(Math.sin(t * 8)) * 0.05 * move; p.body.rotation.z = Math.sin(t * 33) * 0.04; p.tail.rotation.z = Math.sin(t * 20) * 0.3; }
  else if (model === 'cat') { p.body.position.y = Math.abs(Math.sin(t * 10)) * 0.05 * move; p.tail.rotation.z = Math.sin(t * 3) * 0.4; }
}

// ----------------------------- Gathering nodes ----------------------------
const ORE_COL = [null, '#e08a4a', '#9a8a7a', '#a8e0ff', '#5ae0a0', '#ff6ad5'];
export function buildNode(type, tier) {
  const g = new THREE.Group();
  if (type === 'ore') {
    const r = mesh(new THREE.DodecahedronGeometry(0.9, 0), toon('#8a8478'), 0, 0.55, 0); r.scale.set(1.3, 0.85, 1.1); g.add(r);
    const r2 = mesh(new THREE.DodecahedronGeometry(0.55, 0), toon('#7a7468'), 0.8, 0.35, 0.3); g.add(r2);
    const om = tier >= 3 ? glow(ORE_COL[tier]) : toon(ORE_COL[tier]);
    for (let i = 0; i < 7; i++) { const a = i * 0.9; const f = mesh(new THREE.OctahedronGeometry(0.16, 0), om, Math.sin(a) * 0.85, 0.5 + (i % 3) * 0.2, Math.cos(a) * 0.75); f.rotation.set(a, a * 2, 0); g.add(f); }
  } else if (type === 'wood') {
    const trunkC = ['', '#f0ece0', '#6a4a2a', '#4a3a5a', '#2a2228', '#c89a5a'][tier];
    const leafC = ['', '#9ad060', '#3a8a3a', '#9a8ae0', '#2a5a4a', '#ffb0d8'][tier];
    const trunk = mesh(G.cyl(0.25, 0.38, 3.2, 8), toon(trunkC), 0, 1.6, 0); g.add(trunk);
    if (tier === 1) for (let i = 0; i < 4; i++) { const s = mesh(G.box(0.27, 0.05, 0.05), toon('#2a2a2a'), 0, 0.6 + i * 0.6, 0.2); s.rotation.y = i; g.add(s); }
    const leaf = tier >= 3 ? toon(leafC, { emissive: ['', '', '', '#3a2a7a', '#0a3a2a', '#7a2a5a'][tier] }) : toon(leafC);
    const crowns = tier === 2 ? [[0, 3.8, 0, 1.6], [0.9, 3.3, 0.3, 1.1], [-0.8, 3.4, -0.3, 1.1]] : [[0, 3.4, 0, 1.2], [0, 4.3, 0, 0.9], [0.5, 3.0, 0.4, 0.8]];
    for (const [x, y, z, r] of crowns) { const c = mesh(new THREE.IcosahedronGeometry(r, 1), leaf, x, y, z); g.add(c); }
    if (tier >= 3) for (let i = 0; i < 5; i++) { const v = mesh(G.cyl(0.04, 0.02, 1.6, 4), leaf, Math.sin(i * 1.3) * 1.1, 2.6, Math.cos(i * 1.3) * 1.1); g.add(v); }
  } else if (type === 'fish') {
    const wc = ['', '#4aa0d8', '#3a8ac8', '#2a6ab0', '#4a5ac8', '#7a6ae8'][tier];
    const pool = mesh(G.cyl(1.25, 1.35, 0.12, 18), tier >= 4 ? glow(wc) : toon(wc), 0, 0.08, 0); g.add(pool);
    const rim = mesh(new THREE.TorusGeometry(1.3, 0.14, 6, 18), toon('#8a8478'), 0, 0.12, 0); rim.rotation.x = Math.PI / 2; g.add(rim);
    for (let i = 0; i < 3; i++) { const r = mesh(new THREE.TorusGeometry(0.3 + i * 0.28, 0.03, 4, 16), toon('#e8f6ff'), 0.2, 0.16, -0.1); r.rotation.x = Math.PI / 2; r.userData.ripple = i; g.add(r); }
    const post = mesh(G.cyl(0.06, 0.06, 1.6, 6), toon('#6a4a2a'), 1.2, 0.8, 0.6); post.rotation.z = -0.5; g.add(post);
    const fish = mesh(G.sph(0.18, 8, 6), toon(['', '#c0c8d0', '#a0b870', '#5a7a9a', '#d0d8ff', '#ffe07a'][tier]), -0.3, 0.2, 0.3); fish.scale.set(1.8, 0.6, 0.7); g.add(fish);
  } else {
    const leafC = ['', '#5a9a4a', '#4a7a5a', '#7aa0a0', '#3a6a6a', '#6a5a9a'][tier];
    const tuftC = ['', '#ffffff', '#7a9aff', '#f0e8ff', '#e8f4ff', '#ffe07a'][tier];
    for (let i = 0; i < 6; i++) { const a = i * 1.05; const b = mesh(G.sph(0.35, 10, 8), toon(leafC), Math.sin(a) * 0.4, 0.35, Math.cos(a) * 0.4); b.scale.y = 0.8; g.add(b); }
    const tm = tier >= 3 ? glow(tuftC) : toon(tuftC);
    for (let i = 0; i < 8; i++) { const a = i * 0.8; g.add(mesh(G.sph(0.12, 8, 6), tm, Math.sin(a) * 0.45, 0.62 + (i % 2) * 0.12, Math.cos(a) * 0.45)); }
  }
  addOutlines(g); shadowAll(g, true, false);
  return g;
}

function animateLullaby(p, t, move, atk) {
  const st = p.st || {};
  const tr = st.transform ?? (st.form === 'demon' ? 1 : 0);
  // flute form floats and spins; during transform it rises and the demon grows out of it
  p.flute.visible = tr < 0.75; p.demon.visible = tr > 0.35;
  p.flute.position.y = 2.2 + Math.sin(t * 2) * 0.25 + tr * 6; p.flute.rotation.y = t * (0.6 + tr * 6);
  p.fluteRing.scale.setScalar(1 + Math.sin(t * 4) * 0.15 + tr * 3);
  const g = Math.min(1, Math.max(0, (tr - 0.35) / 0.65)); p.demon.scale.setScalar(Math.max(0.05, g));
  const phase = st.phase || 1;
  p.eyeM.color.set(phase >= 3 ? '#ff3a2a' : phase === 2 ? '#ffd23a' : '#b8ff6a');
  const singing = st.singing || 0;
  p.holeGlow.opacity = 0.5 + 0.4 * Math.sin(t * (singing ? 14 : 3)) * (singing ? 1 : 0.5);
  p.holeGlow.color.set(phase >= 3 ? '#ff7a6a' : '#8affc0');
  p.holes.forEach((h, i) => { h.scale.setScalar(1 + (singing ? Math.sin(t * 12 + i) * 0.4 : 0)); });
  p.mouth.scale.y = 0.6 + (singing ? 0.5 + Math.sin(t * 20) * 0.15 : Math.max(0, Math.sin(t * 1.2)) * 0.2);
  p.head.rotation.x = singing ? -0.35 : Math.sin(t * 0.8) * 0.05; p.head.rotation.z = Math.sin(t * 0.6) * 0.06;
  // slam: right arm lifts during windup (st.slam 0..1) then crashes down
  const sl = st.slam ?? -1;
  p.arms.forEach((a, i) => {
    const s = i ? 1 : -1;
    let rx = Math.sin(t * 1.4 + i * Math.PI) * 0.12 + Math.sin(t * 3 + i * Math.PI) * 0.3 * move;
    if (sl >= 0) rx = sl < 1 ? -2.6 * sl : -2.6 + Math.min(1, (sl - 1) * 6) * 3.4;
    if (singing) rx = -1.2 + Math.sin(t * 6 + i) * 0.15;
    if (atk > 0 && sl < 0 && !singing) rx -= Math.sin(atk * Math.PI) * 1.6;
    a.rotation.x = rx; a.rotation.z = s * (0.25 + (singing ? 0.6 : 0));
  });
  p.legs.forEach((l, i) => { l.rotation.x = Math.sin(t * 3 + i * Math.PI) * 0.35 * move; l.userData.shin.rotation.x = Math.max(0, Math.sin(t * 3 + i * Math.PI - 0.5)) * 0.4 * move; });
  p.demon.position.y = Math.abs(Math.sin(t * 3)) * 0.2 * move;
  p.demon.rotation.x = phase >= 3 ? 0.12 : 0;
}

// ------------------------- Canon character presets -------------------------
function bare(a, b, m) { for (const l of [a, b]) if (l) { l.children[0].material = m; l.userData.shin.children[0].material = m; } }
// Each preset adds signature costume pieces on top of the base body, plus body variation.
function dressPreset(L, P, M) {
  const { body, head, torso, armL, armR, legL, legR } = P;
  const add = (par, geo, mat, x = 0, y = 0, z = 0) => { const m = mesh(geo, mat, x, y, z); par.add(m); return m; };
  const silver = toon('#d8dce6'), silver2 = toon('#9aa2b4'), gold = toon('#e8c060'), metal = toon('#a8acb8');
  const pr = L.preset;
  if (pr === 'natsu') {
    // scaled white scarf: overlapping scale tiles on wrap and tails
    const sm = toon('#f4f4ec'), sc = toon('#d8d8cc');
    for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; const t = add(body, G.box(0.07, 0.05, 0.02), sc, Math.sin(a) * 0.2, 1.43 + (i % 2) * 0.03, Math.cos(a) * 0.2); t.rotation.y = a; t.rotation.z = 0.785; }
    for (const [x, r] of [[0.06, 0.25], [-0.04, -0.2]]) for (let k = 0; k < 4; k++) { const t = add(body, G.box(0.07, 0.06, 0.02), sc, x + Math.sin(r) * (0.1 - k * 0.09), 1.36 - k * 0.09, -0.235); t.rotation.z = 0.785; }
    // open black vest with gold trim, white wrap trousers
    for (const s of [-1, 1]) { const tr = add(body, G.box(0.02, 0.44, 0.02), gold, s * 0.04, 1.15, 0.205); tr.rotation.z = s * 0.06; }
    const sash = add(body, G.cyl(0.24, 0.24, 0.09, 14), toon('#e8e0c0'), 0, 0.98, 0); sash.scale.z = 0.82;
    const sashT = add(body, G.box(0.08, 0.26, 0.03), toon('#e8e0c0'), 0.14, 0.82, 0.18); sashT.rotation.z = 0.2;
    for (const l of [legL, legR]) { l.children[0].material = toon('#ece6d4'); l.userData.shin.children[0].material = toon('#ece6d4'); }
    // one sleeve on the left arm (Natsu's half-coat look), right arm bare with wrap
    armL.children[0].material = toon('#2a2a2a');
  } else if (pr === 'gray') {
    torso.material = M.skin; // shirtless
    for (const c of body.children) if (c !== torso && c.geometry && c.geometry.type === 'BoxGeometry' && c.position.y > 1.0 && c.position.y < 1.3 && c.position.z > 0.15) c.visible = false;
    // pecs / abs definition
    for (const s of [-1, 1]) { const pc = add(body, G.sph(0.11, 10, 8), M.skin, s * 0.1, 1.27, 0.15); pc.scale.set(1.1, 0.6, 0.5); }
    for (let i = 0; i < 3; i++) for (const s of [-1, 1]) { const ab = add(body, G.box(0.07, 0.05, 0.02), toon(shade(L.skin, 0.88)), s * 0.045, 1.13 - i * 0.07, 0.19); }
    // cross necklace
    const chain = add(body, new THREE.TorusGeometry(0.12, 0.008, 4, 20), metal, 0, 1.38, 0.05); chain.rotation.x = 1.2;
    add(body, G.box(0.03, 0.12, 0.015), silver, 0, 1.24, 0.2); add(body, G.box(0.08, 0.025, 0.015), silver, 0, 1.27, 0.2);
    for (const a of [armL, armR]) a.children[1].material = M.skin;
    for (const l of [legL, legR]) l.children[0].material = toon('#2a2c3a');
    const chainB = add(body, G.cyl(0.005, 0.005, 0.25, 4), metal, 0.2, 0.86, 0.12); chainB.rotation.z = 1.2;
  } else if (pr === 'lucy') {
    // white-and-blue top, blue skirt, whip coiled on belt, key pouch with golden keys
    const skirt = add(body, G.cyl(0.25, 0.34, 0.26, 14, 1, true), toon('#2a5ad0'), 0, 0.82, 0); skirt.scale.z = 0.85; skirt.material = toon('#2a5ad0', { side: THREE.DoubleSide });
    const top = add(body, G.box(0.36, 0.08, 0.3), toon('#f4f4fa'), 0, 1.3, 0.02);
    const whip = add(body, new THREE.TorusGeometry(0.1, 0.022, 6, 18), glow('#ffb6e0'), -0.25, 0.95, 0.04); whip.rotation.y = Math.PI / 2;
    const whip2 = add(body, new THREE.TorusGeometry(0.08, 0.02, 6, 18), glow('#ffd6f0'), -0.26, 0.95, 0.04); whip2.rotation.y = Math.PI / 2 + 0.3;
    const pouch = add(body, G.box(0.12, 0.13, 0.08), toon('#8a5a2a'), 0.24, 0.92, 0.06);
    for (let i = 0; i < 4; i++) { const k = add(body, G.box(0.018, 0.1, 0.01), gold, 0.2 + i * 0.026, 0.84, 0.11); k.rotation.z = (i - 1.5) * 0.15; add(body, G.sph(0.016, 6, 4), gold, 0.2 + i * 0.026, 0.9, 0.11); }
    bare(legL, legR, M.skin);
  } else if (pr === 'erza') {
    // Heart Kreuz armour: grouped so Requip can make it materialise
    const ar = new THREE.Group(); body.add(ar); P.armor = ar;
    const bp = add(ar, G.sph(0.27, 16, 12), silver, 0, 1.22, 0.04); bp.scale.set(1.02, 0.95, 0.85);
    add(ar, G.box(0.03, 0.34, 0.02), toon('#c03040'), 0, 1.2, 0.27); add(ar, G.box(0.16, 0.03, 0.02), toon('#c03040'), 0, 1.27, 0.27); // cross emblem
    const plate = add(ar, G.cyl(0.25, 0.24, 0.14, 14), silver2, 0, 1.0, 0); plate.scale.z = 0.82;
    // armoured skirt: overlapping plates around a blue skirt
    const blue = add(ar, G.cyl(0.24, 0.36, 0.3, 16, 1, true), toon('#2a4ab8', { side: THREE.DoubleSide }), 0, 0.8, 0); blue.scale.z = 0.86;
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + 0.2; const pl = add(ar, G.box(0.15, 0.22, 0.03), silver, Math.sin(a) * 0.3, 0.86, Math.cos(a) * 0.26); pl.rotation.y = a; pl.rotation.x = 0.25 * Math.cos(0); pl.rotation.order = 'YXZ'; pl.rotation.x = -0.3; }
    for (const a of [armL, armR]) {
      const s = a === armL ? -1 : 1;
      const pa = mesh(new THREE.SphereGeometry(0.15, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), silver, 0, 0.02, 0); pa.scale.set(1.15, 0.9, 1.1); a.add(pa); ar.userData[`p${s}`] = pa;
      const pa2 = mesh(new THREE.SphereGeometry(0.13, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), silver2, s * 0.02, -0.06, 0); a.add(pa2);
      const gt = mesh(G.cyl(0.085, 0.075, 0.2, 10), silver, 0, -0.16, 0); a.userData.fore.add(gt);
      const gh = mesh(G.box(0.12, 0.06, 0.1), silver2, 0, -0.3, 0); a.userData.fore.add(gh);
      a.children[0].material = toon('#2a2a34');
      (P.armorBits ||= []).push(pa, pa2, gt, gh);
    }
    for (const l of [legL, legR]) { bare(l, null, M.skin); const gr = mesh(G.cyl(0.095, 0.085, 0.32, 10), silver, 0, -0.18, 0.01); l.userData.shin.add(gr); P.armorBits.push(gr); }
  } else if (pr === 'makarov') {
    // jester hat with two drooping horns and bells, short white coat
    const hm = toon('#3a68c8'), hm2 = toon('#e8c060');
    const band = add(head, G.cyl(0.32, 0.33, 0.1, 16), hm2, 0, 0.17, 0);
    const dome = add(head, new THREE.SphereGeometry(0.32, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), hm, 0, 0.2, 0);
    for (const s of [-1, 1]) {
      const horn = add(head, G.cone(0.13, 0.6, 8), hm, s * 0.32, 0.45, -0.05); horn.rotation.z = -s * 1.1;
      add(head, G.sph(0.06, 8, 6), hm2, s * 0.6, 0.6, -0.05);
    }
    const coat = add(body, G.cyl(0.27, 0.36, 0.56, 14, 1, true), toon('#f4f0e4', { side: THREE.DoubleSide }), 0, 0.92, 0); coat.scale.z = 0.86;
    const fur = add(body, new THREE.TorusGeometry(0.2, 0.05, 6, 14), toon('#e0d8c8'), 0, 1.4, 0); fur.rotation.x = Math.PI / 2;
  } else if (pr === 'mirajane') {
    // long maroon dress to the ankles, with her bangs tied up in a little topknot
    const dress = add(body, G.cyl(0.25, 0.42, 0.88, 16, 1, true), toon('#9a1e40', { side: THREE.DoubleSide }), 0, 0.5, 0); dress.scale.z = 0.86;
    const bodice = add(body, G.box(0.36, 0.06, 0.3), toon('#f4e8ee'), 0, 1.33, 0.02);
    add(body, G.box(0.04, 0.3, 0.02), toon('#f4e8ee'), 0, 1.15, 0.2);
    const knot = add(head, G.cap(0.06, 0.12), M.hair, 0, 0.36, 0.2); knot.rotation.x = -0.6;
    const tie = add(head, G.box(0.12, 0.04, 0.04), toon('#c02a4a'), 0, 0.33, 0.22);
    bare(legL, legR, M.skin);
  } else if (pr === 'levy') {
    const hb = add(head, new THREE.TorusGeometry(0.31, 0.035, 6, 24), toon('#f0a030'), 0, 0.12, 0.02); hb.rotation.x = Math.PI / 2 - 0.35;
    const bow = add(head, G.box(0.16, 0.06, 0.04), toon('#f0a030'), 0.12, 0.3, 0.18); bow.rotation.z = 0.4;
    const dress = add(body, G.cyl(0.25, 0.34, 0.34, 14, 1, true), toon('#f0a030', { side: THREE.DoubleSide }), 0, 0.82, 0); dress.scale.z = 0.86;
    bare(legL, legR, M.skin);
  } else if (pr === 'gajeel') {
    // studs: brows, nose, ears, arms; long spiky black mane
    for (const [x, y, z] of [[-0.11, 0.14, 0.27], [0.11, 0.14, 0.27], [-0.16, 0.13, 0.25], [0.16, 0.13, 0.25], [0, -0.06, 0.3], [-0.03, -0.04, 0.3], [0.03, -0.04, 0.3], [-0.3, -0.04, 0.03], [0.3, -0.04, 0.03], [0, -0.26, 0.2]])
      add(head, G.sph(0.018, 6, 4), metal, x, y, z);
    for (let i = 0; i < 9; i++) { const a = (i / 8 - 0.5) * 2.4; const sp = add(head, G.cone(0.09, 0.75, 6), M.hair, Math.sin(a) * 0.24, -0.25 - Math.abs(Math.cos(a)) * 0.05, -0.2 - Math.cos(a) * 0.1); sp.rotation.x = Math.PI - 0.3; sp.rotation.z = a * 0.25; }
    for (const a of [armL, armR]) for (let i = 0; i < 3; i++) a.add(mesh(G.sph(0.02, 6, 4), metal, 0, -0.08 - i * 0.08, 0.075));
    const tunic = add(body, G.cyl(0.25, 0.32, 0.3, 12), toon('#2a2a30'), 0, 0.84, 0); tunic.scale.z = 0.82;
  } else if (pr === 'wendy') {
    for (const s of [-1, 1]) add(head, G.sph(0.05, 8, 6), toon('#f04070'), s * 0.33, -0.06, -0.06);
    const dress = add(body, G.cyl(0.25, 0.36, 0.4, 14, 1, true), toon('#e8e8ff', { side: THREE.DoubleSide }), 0, 0.78, 0); dress.scale.z = 0.86;
    const trim = add(body, G.cyl(0.365, 0.365, 0.04, 14), toon('#3a8ad0'), 0, 0.59, 0); trim.scale.z = 0.86;
    bare(legL, legR, M.skin);
  } else if (pr === 'elfman') {
    // "A real MAN!": massive frame, dark suit jacket over open shirt, scar over the right eye
    const suit = toon('#2a3050'); torso.material = suit;
    for (const s of [-1, 1]) { const lap = add(body, G.box(0.14, 0.4, 0.03), toon('#1e2238'), s * 0.13, 1.2, 0.2); lap.rotation.z = -s * 0.15; }
    add(body, G.box(0.14, 0.3, 0.02), toon('#e8e8f0'), 0, 1.2, 0.205);
    for (const a of [armL, armR]) { a.children[0].material = suit; a.userData.fore.children[0].material = M.skin; }
    const scar = add(head, G.box(0.016, 0.16, 0.01), toon('#a05050'), 0.12, 0.02, 0.29); scar.rotation.z = 0.3; scar.userData.noOutline = true;
    for (const l of [legL, legR]) l.children[0].material = toon('#2a2a3a');
  } else if (pr === 'cana') {
    // card mage: bandeau top, capri trousers, a belt of cards and her ever-present barrel
    torso.material = M.skin; add(body, G.box(0.42, 0.12, 0.3), toon('#3a68c8'), 0, 1.26, 0.02);
    for (const l of [legL, legR]) l.children[0].material = toon('#6a4a30');
    for (let i = 0; i < 5; i++) { const c = add(body, G.box(0.06, 0.09, 0.005), toon(i % 2 ? '#f4f0e0' : '#c83040'), -0.12 + i * 0.06, 0.95, 0.205); c.rotation.z = (i - 2) * 0.1; }
    const barrel = add(body, G.cyl(0.16, 0.16, 0.36, 12), toon('#8a5a2a'), 0.42, 0.75, 0.05); for (const y of [0.62, 0.88]) add(body, G.cyl(0.165, 0.165, 0.03, 12), toon('#4a4a4a'), 0.42, y, 0.05); void barrel;
    for (const a of [armL, armR]) a.children[0].material = M.skin;
  } else if (pr === 'juvia') {
    // rain woman: long blue coat, fur-trimmed Cossack hat, teru teru bozu charm
    const coat = add(body, G.cyl(0.26, 0.42, 0.85, 16, 1, true), toon('#2a3a7a', { side: THREE.DoubleSide }), 0, 0.55, 0); coat.scale.z = 0.86;
    add(body, G.cyl(0.43, 0.43, 0.04, 16), toon('#e8c060'), 0, 0.13, 0).scale.z = 0.86;
    const hat = add(head, G.cyl(0.27, 0.3, 0.2, 16), toon('#2a3a7a'), 0, 0.3, -0.02); hat.rotation.x = -0.15;
    add(head, new THREE.TorusGeometry(0.29, 0.05, 6, 18), toon('#f0f0f6'), 0, 0.22, -0.01).rotation.x = Math.PI / 2 - 0.15;
    const doll = add(body, G.sph(0.06, 8, 6), toon('#f4f4fa'), -0.22, 0.92, 0.12); add(body, G.cone(0.07, 0.1, 8), toon('#f4f4fa'), -0.22, 0.85, 0.12); void doll;
    for (const a of [armL, armR]) a.children[0].material = toon('#2a3a7a');
  }
  // body variation (width, leg length, head size)
  const B = L.build; if (B) {
    if (B.w) { torso.scale.x *= B.w; armL.position.x *= B.w; armR.position.x *= B.w; }
    if (B.arm) { armL.scale.set(B.arm, 1, B.arm); armR.scale.set(B.arm, 1, B.arm); }
    if (B.leg) { legL.scale.y = legR.scale.y = B.leg; body.position.y = 0; P.bodyLift = (B.leg - 1) * 0.86; }
    if (B.head) head.scale.setScalar(B.head);
  }
}
