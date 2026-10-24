// Creature rework, part 2: Lullaby (bark + Zeref runes), Taurus (ram), Aquarius (maiden), dark-guild mages,
// story-boss wizards (Jose: shadow phantoms, Jellal: Heavenly Body orbs) with per-phase visuals. Layers over models.js.
import * as THREE from 'three';
import { GFX, toon, glow, mesh } from './toon.js';
import { cmat } from './creatures.js';

const add = (par, g, m, x = 0, y = 0, z = 0) => { const o = mesh(g, m, x, y, z); par.add(o); return o; };
const grp = (par, x = 0, y = 0, z = 0) => { const o = new THREE.Group(); o.position.set(x, y, z); par.add(o); return o; };
const H = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const swapMat = (root, fromHex, to) => { const c = new THREE.Color(fromHex); root.traverse((o) => { if (o.isMesh && o.material && o.material.color && !o.material.transparent && o.material.color.equals(c) && o.material.type !== 'MeshBasicMaterial') o.material = to; }); };
const dbl = (m) => { const x = m.clone(); x.side = THREE.DoubleSide; x.onBeforeCompile = m.onBeforeCompile; if (m.customProgramCacheKey) x.customProgramCacheKey = m.customProgramCacheKey; return x; };
const glowA = (c, o) => { const m = glow(c, o).clone(); m.transparent = true; m.depthWrite = false; m.blending = THREE.AdditiveBlending; return m; };
/** Rune circle texture (shared): concentric rings, glyph ticks and a hexagram, drawn once. */
let RUNE_TEX = null;
function runeTex() {
  if (RUNE_TEX) return RUNE_TEX; const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); x.strokeStyle = '#fff'; x.fillStyle = '#fff'; x.translate(128, 128);
  for (const [r, w] of [[120, 5], [104, 2], [70, 3], [40, 2]]) { x.lineWidth = w; x.beginPath(); x.arc(0, 0, r, 0, Math.PI * 2); x.stroke(); }
  for (let i = 0; i < 36; i++) { const a = (i / 36) * Math.PI * 2; x.save(); x.rotate(a); x.fillRect(-2, -118, 4, i % 3 ? 8 : 14); x.restore(); }
  x.lineWidth = 3; for (const o of [0, Math.PI / 3]) { x.beginPath(); for (let i = 0; i <= 3; i++) { const a = o + (i / 3) * Math.PI * 2; x[i ? 'lineTo' : 'moveTo'](Math.sin(a) * 100, Math.cos(a) * 100); } x.stroke(); }
  x.font = 'bold 18px serif'; x.textAlign = 'center'; const gl = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃ'; for (let i = 0; i < 12; i++) { x.save(); x.rotate((i / 12) * Math.PI * 2); x.fillText(gl[i], 0, -82); x.restore(); }
  RUNE_TEX = new THREE.CanvasTexture(c); RUNE_TEX.colorSpace = THREE.SRGBColorSpace; return RUNE_TEX;
}
export function runeCircle(par, r, color, y = 0.04, op = 0.7) {
  const m = new THREE.MeshBasicMaterial({ map: runeTex(), color, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  const c = mesh(new THREE.PlaneGeometry(r * 2, r * 2), m, 0, y, 0); c.rotation.x = -Math.PI / 2; c.userData.noOutline = true; c.userData.noAO = true; c.castShadow = false; par.add(c); return c;
}

// ------------------------------------------------------------------ Lullaby
export function dressLullaby(g, P) {
  const bark = cmat('#5a3a22', 'bark'), bark2 = cmat('#3e2616', 'bark', { scale: 3 }), bark3 = cmat('#7a5232', 'bark', { scale: 1.6 }), bone = cmat('#d8ccb0', 'bone');
  swapMat(g, '#5a3a22', bark); swapMat(g, '#3e2616', bark2); swapMat(g, '#7a5232', bark3); swapMat(g, '#d8ccb0', bone);
  P.fx = { kind: 'bark', color: '#6a4426', spark: '#8affc0' };
  const d = P.demon; const hipY = 5.2; const moss = cmat('#4a6a2a', 'fur', { scale: 4 }), vine = toon('#2e4a1c');
  // moss shelves + hanging vines on the shoulders / chest, burl knots
  for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2 + 0.3; const m = add(d, new THREE.SphereGeometry(0.42, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), moss, Math.sin(a) * 1.25, hipY + 4.2 + H(i) * 0.9, Math.cos(a) * 1.05); m.scale.set(1.3, 0.35, 1); }
  for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; const v = add(d, new THREE.CylinderGeometry(0.03, 0.015, 1.4 + H(i + 9) * 1.6, 4), vine, Math.sin(a) * 1.35, hipY + 3.4 - H(i) * 0.6, Math.cos(a) * 1.1); v.rotation.z = (H(i + 3) - 0.5) * 0.2; }
  for (let i = 0; i < 6; i++) { const k = add(d, new THREE.SphereGeometry(0.24 + H(i) * 0.15, 8, 6), bark2, Math.sin(i * 2.3) * 1.05, hipY + 0.8 + i * 0.6, Math.cos(i * 2.3) * 0.95); k.scale.z = 0.5; k.lookAt(0, k.position.y, 0); }
  // Zeref sigil burning on the chest + rune circle at the feet that changes with phase
  const sig = runeCircle(d, 0.8, '#8affc0', 0, 0.85); sig.rotation.set(0, 0, 0); sig.position.set(0, hipY + 4.6, 1.3); P.sigil = sig;
  P.floor = runeCircle(g, 5.2, '#8affc0', 0.05, 0.0);
  // drifting curse motes
  P.motes = []; const mm = glowA('#8affc0', 0.85);
  for (let i = 0; i < (GFX.high || GFX.real ? 18 : 8); i++) { const s = add(g, new THREE.OctahedronGeometry(0.09, 0), mm); s.userData.noAO = true; s.userData.k = H(i * 5); P.motes.push(s); }
  P.moteM = mm;
}
export function animateLullabyExtra(p, t) {
  const st = p.st || {}; const ph = st.phase || 1; const demon = (st.transform ?? 0) > 0.35; const sing = st.singing || 0;
  const col = ph >= 3 ? '#ff5a3a' : ph === 2 ? '#ffd23a' : '#8affc0'; p.sigil.material.color.set(col); p.floor.material.color.set(col); p.moteM.color.set(col);
  p.sigil.material.opacity = 0.55 + Math.sin(t * (sing ? 12 : 2)) * 0.3; p.sigil.rotation.z = t * 0.4;
  p.floor.material.opacity = demon ? 0.25 + ph * 0.12 + (sing ? 0.2 : 0) : 0.15; p.floor.rotation.z = -t * 0.2 * ph; p.floor.scale.setScalar(demon ? 1 : 0.35);
  const top = demon ? 9 : 3.5; p.motes.forEach((s, i) => { const k = (s.userData.k + t * (0.08 + ph * 0.04)) % 1; const a = i * 2.4 + t * 0.5; const r = (demon ? 2.2 : 1.2) + k * 1.5;
    s.position.set(Math.sin(a) * r, k * top + 0.3, Math.cos(a) * r); s.scale.setScalar(Math.sin(k * Math.PI) * (sing ? 1.6 : 1)); s.rotation.y = t * 3 + i; });
}

// ------------------------------------------------------------------ Taurus (ram) + Aquarius (maiden): rebuilt
export const C2 = new Set(['ram', 'maiden']);
export function buildC2(model, opt, buildCharacter) {
  const g = new THREE.Group(); const P = {};
  if (model === 'ram') {
    // Taurus: muscular bull-man with a cow-patterned hide, gold nose ring, horned helm-head, belt and a huge labrys
    const b = grp(g); P.body = b; const hide = cmat('#f4eee2', 'hide'), spot = cmat('#2a2220', 'hide'), skin = cmat('#e8c8a8', 'skin'), gold = cmat('#e0a830', 'stone', { bump: 0.3 }), horn = cmat('#f0e6c8', 'bone'), dark = toon('#3a2a20');
    const hip = grp(b, 0, 1.0, 0); P.hip = hip;
    const torso = add(hip, new THREE.SphereGeometry(0.5, 16, 12), hide, 0, 0.55, 0); torso.scale.set(1.15, 1.1, 0.85);
    const pec = add(hip, new THREE.SphereGeometry(0.3, 12, 10), skin, 0, 0.72, 0.22); pec.scale.set(1.45, 0.7, 0.6);
    for (let i = 0; i < 3; i++) add(hip, new THREE.BoxGeometry(0.2, 0.09, 0.08), skin, 0, 0.42 - i * 0.12, 0.38);
    for (const [x, y, z, r] of [[0.3, 0.4, -0.3, 0.16], [-0.25, 0.75, -0.35, 0.2], [0.38, 0.85, 0.05, 0.12]]) { const s = add(hip, new THREE.SphereGeometry(r, 8, 6), spot, x, y, z); s.scale.z = 0.35; s.lookAt(0, y, 0); }
    add(hip, new THREE.CylinderGeometry(0.46, 0.48, 0.14, 16), dark, 0, 0.08, 0); add(hip, new THREE.BoxGeometry(0.22, 0.18, 0.06), gold, 0, 0.08, 0.47);
    const head = grp(hip, 0, 1.25, 0.12); P.head = head;
    const sk = add(head, new THREE.SphereGeometry(0.3, 14, 12), hide); sk.scale.set(1, 1.05, 1.05);
    const muz = add(head, new THREE.SphereGeometry(0.2, 12, 10), skin, 0, -0.1, 0.24); muz.scale.set(1.2, 0.85, 0.9);
    for (const s of [-1, 1]) add(head, new THREE.SphereGeometry(0.035, 6, 4), dark, s * 0.08, -0.08, 0.42);
    const ring = add(head, new THREE.TorusGeometry(0.07, 0.016, 6, 16), gold, 0, -0.18, 0.4); ring.rotation.x = 0.3;
    for (const s of [-1, 1]) { const h = grp(head, s * 0.24, 0.18, 0); for (let i = 0; i < 4; i++) { const seg = add(h, new THREE.CylinderGeometry(0.075 - i * 0.016, 0.085 - i * 0.016, 0.2, 8), horn, s * (0.1 + i * 0.13), i * i * 0.04, 0); seg.rotation.z = -s * (1.25 - i * 0.35); }
      const ear = add(head, new THREE.SphereGeometry(0.09, 8, 6), hide, s * 0.33, 0.02, -0.02); ear.scale.set(1.4, 0.5, 0.8);
      const ey = add(head, new THREE.SphereGeometry(0.045, 8, 6), toon('#1a1010'), s * 0.12, 0.06, 0.26); ey.scale.z = 0.5; add(ey, new THREE.SphereGeometry(0.015, 4, 4), glow('#ffffff'), 0.012, 0.015, 0.035); }
    add(head, new THREE.ConeGeometry(0.1, 0.18, 6), hide, 0, 0.3, 0.05).rotation.x = -0.5; // forelock tuft
    P.arms = []; for (const s of [-1, 1]) { const a = grp(hip, s * 0.62, 0.9, 0); add(a, new THREE.SphereGeometry(0.2, 10, 8), hide); add(a, new THREE.CapsuleGeometry(0.13, 0.4, 4, 8), skin, 0, -0.32, 0);
      const f = grp(a, 0, -0.6, 0); add(f, new THREE.CapsuleGeometry(0.12, 0.35, 4, 8), skin, 0, -0.22, 0); add(f, new THREE.CylinderGeometry(0.13, 0.13, 0.1, 10), gold, 0, -0.18, 0); add(f, new THREE.SphereGeometry(0.11, 8, 6), skin, 0, -0.48, 0); a.userData.f = f; a.rotation.z = s * 0.25; P.arms.push(a); }
    // labrys in the right hand
    const axe = grp(P.arms[1].userData.f, 0, -0.5, 0.05); P.axe = axe; add(axe, new THREE.CylinderGeometry(0.035, 0.035, 1.9, 8), toon('#5a3a22'), 0, 0.35, 0);
    for (const s of [-1, 1]) { const bl = add(axe, new THREE.CylinderGeometry(0.42, 0.42, 0.05, 16, 1, false, 0, Math.PI), gold, s * 0.04, 1.05, 0); bl.rotation.set(0, s > 0 ? 0 : Math.PI, Math.PI / 2); }
    add(axe, new THREE.SphereGeometry(0.08, 8, 6), gold, 0, 1.33, 0);
    P.legs = []; for (const s of [-1, 1]) { const l = grp(hip, s * 0.24, 0, 0); add(l, new THREE.CapsuleGeometry(0.15, 0.35, 4, 8), dark, 0, -0.25, 0); const k = grp(l, 0, -0.5, 0); add(k, new THREE.CapsuleGeometry(0.11, 0.3, 4, 8), hide, 0, -0.2, 0); add(k, new THREE.CylinderGeometry(0.1, 0.13, 0.14, 8), toon('#2a1a12'), 0, -0.45, 0.02); l.userData.k = k; P.legs.push(l); }
    P.fx = { kind: 'wool', color: '#f4eee2', spark: '#ffd860' };
  } else {
    // Aquarius: mermaid spirit with scaled tail + fins, shell top, water urn and swirling water ribbons
    const c = buildCharacter({ hair: 'long', hairColor: '#3ab8f0', outfit: 'adventurer', outfitColor: '#2a8ac0', skin: '#e0f0ff', eyeColor: '#2a6ad0' }); g.add(c.group); P.char = c;
    c.parts.legs?.forEach?.((l) => { l.visible = false; }); if (c.parts.legL) c.parts.legL.visible = false; if (c.parts.legR) c.parts.legR.visible = false;
    const sc = cmat('#2ac0b0', 'scale', { scale: 2.6 }), fin = cmat('#7ae0f0', 'skin'), shell = cmat('#f0c0d0', 'bone'), gold = cmat('#e0b040', 'stone', { bump: 0.3 });
    const tail = grp(c.group, 0, 0.74, 0); P.tail = []; let par = tail;
    add(tail, new THREE.SphereGeometry(0.27, 14, 10), sc, 0, 0.02, 0).scale.set(1, 0.8, 0.85); // hips blend into the tail
    for (let i = 0; i < 7; i++) { const r = 0.22 - i * 0.024; add(par, new THREE.CapsuleGeometry(r, 0.12, 4, 10), sc, 0, -0.1, 0); const n = grp(par, 0, -0.17, 0); P.tail.push(par); par = n; }
    for (const s of [-1, 1]) { const f = add(par, new THREE.ConeGeometry(0.16, 0.42, 4), fin, s * 0.16, -0.1, 0); f.rotation.z = s * 2.3; f.scale.z = 0.2; }
    for (const s of [-1, 1]) { const sh = add(c.parts.body || c.group, new THREE.SphereGeometry(0.075, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), shell, s * 0.08, 1.12, 0.14); sh.rotation.x = Math.PI / 2; }
    const urn = grp(c.group, 0.42, 0.9, 0.15); P.urn = urn; add(urn, new THREE.SphereGeometry(0.16, 12, 10), gold).scale.y = 1.2; add(urn, new THREE.CylinderGeometry(0.07, 0.1, 0.12, 10), gold, 0, 0.2, 0);
    const water = glowA('#7ad8ff', 0.55); P.ribbons = [];
    for (let i = 0; i < 3; i++) { const r = add(g, new THREE.TorusGeometry(0.75 + i * 0.12, 0.03, 4, 40, Math.PI * 1.3), water, 0, 0.5 + i * 0.35, 0); r.rotation.x = Math.PI / 2; r.userData.noAO = true; P.ribbons.push(r); }
    P.drops = []; for (let i = 0; i < 10; i++) { const d = add(g, new THREE.SphereGeometry(0.04, 6, 4), water); d.userData.k = H(i); d.userData.noAO = true; P.drops.push(d); }
    P.ring = runeCircle(g, 0.9, '#7ad8ff', 0.05, 0.6);
    P.fx = { kind: 'water', color: '#7ad8ff', spark: '#d8f8ff' };
  }
  return { group: g, parts: P };
}
export function animateC2(m, model, t, move, atk, animateCharacter) {
  const p = m.parts; const a = atk > 0 ? Math.sin(atk * Math.PI) : 0;
  if (model === 'ram') {
    const ph = t * 9; p.hip.position.y = 1.0 + Math.abs(Math.sin(ph)) * 0.08 * move; p.hip.rotation.x = 0.15 * move - a * 0.3; p.hip.rotation.y = Math.sin(t * 0.7) * 0.08;
    p.legs.forEach((l, i) => { l.rotation.x = Math.sin(ph + i * Math.PI) * 0.6 * move; l.userData.k.rotation.x = Math.max(0, -Math.cos(ph + i * Math.PI)) * 0.7 * move; });
    p.arms.forEach((ar, i) => { ar.rotation.x = Math.sin(ph + i * Math.PI + Math.PI) * 0.4 * move + (i ? -2.4 * a + (m.wind || 0) * -2 : Math.sin(t * 1.3) * 0.08); ar.userData.f.rotation.x = -0.4 - (i ? a * 0.6 : 0); });
    p.head.rotation.x = Math.sin(t * 1.1) * 0.06 + a * 0.3; p.head.rotation.y = Math.sin(t * 0.43) * 0.3 * (1 - move);
  } else {
    animateCharacter(p.char, { t, move: 0, atk: -1, cast: atk > 0 ? 1 : 0.3 }); p.char.group.position.y = 0.35 + Math.sin(t * 2) * 0.1;
    p.tail.forEach((s, i) => { s.rotation.x = Math.sin(t * 3 - i * 0.7) * 0.14 + (i < 2 ? 0.08 : 0.34); s.rotation.z = Math.sin(t * 1.7 - i * 0.5) * 0.08; });
    p.ribbons.forEach((r, i) => { r.rotation.z = t * (0.8 + i * 0.35) * (i % 2 ? -1 : 1); r.scale.setScalar(1 + a * 0.6); }); p.ring.rotation.z = t * 0.5; p.urn.rotation.z = -a * 1.2;
    p.drops.forEach((d, i) => { const k = (d.userData.k + t * 0.4) % 1; const an = i * 0.63 + t; d.position.set(Math.sin(an) * (0.9 + a), 0.2 + k * 1.8, Math.cos(an) * (0.9 + a)); d.scale.setScalar(Math.sin(k * Math.PI)); });
  }
}

// ------------------------------------------------------------------ Dark-guild mages
export function dressMage(g, P, robe) {
  const c = P.char; const cloth = cmat(robe, 'cloth'); swapMat(c.group, robe, cloth); swapMat(c.group, '#1a1424', cmat('#1a1424', 'cloth'));
  const hd = c.parts.head; // shadowed face + glowing eyes under the hood, tattered cloak tails, skull pauldron, staff gem
  const shadowM = toon('#08060c'); const sh = add(hd, new THREE.SphereGeometry(0.2, 10, 8), shadowM, 0, 0.0, 0.17); sh.scale.set(1.05, 0.9, 0.35);
  for (const s of [-1, 1]) { const e = add(hd, new THREE.SphereGeometry(0.03, 6, 4), glow('#ff3a4a'), s * 0.07, 0.02, 0.24); e.scale.z = 0.4; e.userData.noOutline = true; }
  const body = c.parts.body || c.group; P.tails = []; const cloakM = dbl(cloth);
  for (let i = 0; i < 5; i++) { const tl = grp(body, (i - 2) * 0.12, 0.85, -0.2); const st = add(tl, new THREE.PlaneGeometry(0.13, 0.75 + H(i) * 0.25), cloakM, 0, -0.38, 0); tl.userData.ph = i; P.tails.push(tl); st.userData.noOutline = true; }
  const sk = add(body, new THREE.SphereGeometry(0.09, 8, 6), cmat('#e0d8c0', 'bone'), -0.26, 1.38, 0); sk.scale.set(1, 0.9, 1.1);
  const gem = new THREE.Group(); (c.parts.armR?.userData?.grip || c.group).add(gem); gem.position.set(0, 1.3, 0); add(gem, new THREE.OctahedronGeometry(0.07, 0), glow('#b04aff')); P.gem = gem;
  P.cast = runeCircle(g, 0.8, '#b04aff', 0.05, 0); P.fx = { kind: 'magic', color: robe, spark: '#c87aff' };
}
export function animateMageExtra(m, t, atk) {
  const p = m.parts; if (!p.tails) return; const a = atk > 0 ? atk : 0; const cast = Math.max(m.wind || 0, a > 0 ? 1 - a : 0);
  p.tails.forEach((tl) => { tl.rotation.x = 0.15 + Math.sin(t * 3 + tl.userData.ph) * 0.12 + (m.moving || 0) * 0.5; });
  p.gem.rotation.y = t * 3; p.gem.scale.setScalar(1 + cast * 0.8); p.cast.material.opacity = cast * 0.8; p.cast.rotation.z = t * 2;
}

// ------------------------------------------------------------------ Story bosses: Jose + Jellal
export function dressWizard(g, P, opt) {
  const c = P.char; const S = WSTYLE[opt.body] || WSTYLE.jellal; const jose = S.style === 'shadow'; const col = opt.aura || S.tints[0];
  // cloth surfaces on coats / capes
  const kinds = S.cloth;
  for (const k of kinds) { const cm = cmat(k, 'cloth'); g.traverse((o) => { if (o.isMesh && o.material && o.material.color && o.material.type !== 'MeshBasicMaterial' && o.material.color.equals(new THREE.Color(k))) { const side = o.material.side; o.material = side === THREE.DoubleSide ? dbl(cm) : cm; } }); }
  if (P.aura) P.aura.visible = false; // replaced by layered aura below
  P.fx = { kind: S.fx, color: S.fxc, spark: S.spark };
  P.floor = runeCircle(g, 2.2, col, 0.05, 0.6); P.floor2 = runeCircle(g, 1.4, col, 0.07, 0.4);
  const shell = add(g, new THREE.SphereGeometry(1.15, 20, 14), glowA(col, 0.08), 0, 1.1, 0); shell.scale.set(1, 1.45, 1); shell.userData.noAO = true; shell.userData.noOutline = true; P.shell = shell;
  P.orbs = []; P.wisps = [];
  if (jose) {
    // Shade phantoms: hooded ghost silhouettes orbiting, shadow tendrils rising from the floor
    const gm = glowA(S.wisp[0], 0.45), dm = toon('#120a1c');
    for (let i = 0; i < 6; i++) { const w = grp(g); const hood = add(w, new THREE.ConeGeometry(0.22, 0.7, 8, 1, true), gm, 0, 0, 0); hood.material = gm; add(w, new THREE.SphereGeometry(0.12, 8, 6), dm, 0, 0.12, 0.04);
      for (const s of [-1, 1]) add(w, new THREE.SphereGeometry(0.025, 4, 4), glow(S.wisp[1]), s * 0.05, 0.14, 0.15); w.userData.k = i; w.traverse((o) => { o.userData.noAO = true; o.userData.noOutline = true; }); P.wisps.push(w); }
    P.tendrils = []; for (let i = 0; i < 8; i++) { const td = add(g, new THREE.ConeGeometry(0.09, 1.6, 5), glowA(S.wisp[2], 0.6), 0, 0, 0); td.userData.k = H(i * 3); td.userData.noAO = true; td.userData.noOutline = true; P.tendrils.push(td); }
  } else if (S.style === 'storm') {
    // Lightning Dragon Slayer: crackling ball-lightning orbs and jagged bolts arcing from them to the body
    for (let i = 0; i < 6; i++) { const o = grp(g); add(o, new THREE.IcosahedronGeometry(0.09, 0), glow('#ffffff')); add(o, new THREE.SphereGeometry(0.24, 10, 8), glowA('#ffe24a', 0.35)); o.traverse((q) => { q.userData.noAO = true; q.userData.noOutline = true; }); P.orbs.push(o); }
    P.bolts = []; const bm = glowA('#fff4a0', 0.9);
    for (let i = 0; i < 6; i++) { const b = grp(g); for (let j = 0; j < 4; j++) { const sgm = add(b, new THREE.BoxGeometry(0.035, 0.4, 0.035), bm); sgm.userData.noAO = true; sgm.userData.noOutline = true; } P.bolts.push(b); }
  } else if (S.style === 'frost') {
    // Ice-Make: orbiting crystal shards and a frost ring that creeps outward
    const im = toon('#cfeaff', { emissive: '#4a8ac0', rough: 0.1 }), ig = glowA('#9adcff', 0.3);
    for (let i = 0; i < 8; i++) { const o = grp(g); const sh = add(o, new THREE.OctahedronGeometry(0.16, 0), im); sh.scale.set(0.6, 2.2, 0.6); add(o, new THREE.SphereGeometry(0.2, 8, 6), ig); o.traverse((q) => { q.userData.noAO = true; q.userData.noOutline = true; }); P.orbs.push(o); }
    P.frost = []; for (let i = 0; i < 10; i++) { const sp = add(g, new THREE.ConeGeometry(0.12, 0.9, 5), im, 0, 0, 0); sp.userData.k = H(i * 5); sp.userData.noOutline = true; P.frost.push(sp); }
  } else if (S.style === 'dive') {
    // Diver magic: the ground ripples like water around him, with dirt clods flung up
    P.ripples = []; for (let i = 0; i < 3; i++) { const r = add(g, new THREE.RingGeometry(0.8, 0.95, 40), glowA(S.tints[0], 0.5), 0, 0.05, 0); r.rotation.x = -Math.PI / 2; r.userData.k = i / 3; r.userData.noAO = true; r.userData.noOutline = true; P.ripples.push(r); }
    const dm = toon('#6a5030'); for (let i = 0; i < 6; i++) { const o = grp(g); add(o, new THREE.DodecahedronGeometry(0.12, 0), dm); o.traverse((q) => { q.userData.noOutline = true; }); P.orbs.push(o); }
  } else {
    // Heavenly Body magic: seven star orbs (Grand Chariot), a gold halo and starlight motes
    for (let i = 0; i < 7; i++) { const o = grp(g); add(o, new THREE.SphereGeometry(0.1, 10, 8), glow('#fff6d0')); add(o, new THREE.SphereGeometry(0.22, 10, 8), glowA('#ffd86a', 0.3)); o.traverse((q) => { q.userData.noAO = true; q.userData.noOutline = true; }); P.orbs.push(o); }
    const halo = add(g, new THREE.TorusGeometry(0.42, 0.018, 4, 40), glowA('#ffe08a', 0.8), 0, 2.15, -0.2); halo.userData.noAO = true; P.halo2 = halo;
    // Jellal tattoo glow (red) over the right eye made emissive
    if (opt.body === 'jellal') { const hd = c.parts.head; for (const [y, l] of [[0.1, 0.22], [0.02, 0.3]]) { const tt = add(hd, new THREE.BoxGeometry(0.035, l, 0.01), glow('#ff3a3a', 0.6), -0.12, y, 0.31); tt.rotation.z = 0.2; tt.userData.noOutline = true; } }
  }
  P.motes = []; const mm = glowA(col, 0.8); for (let i = 0; i < (GFX.high || GFX.real ? 16 : 8); i++) { const s = add(g, new THREE.OctahedronGeometry(0.045, 0), mm); s.userData.k = H(i * 7); s.userData.noAO = true; P.motes.push(s); }
  P.moteM = mm; P.col = new THREE.Color(col); P.jose = jose; P.style = S.style; P.tints = S.tints;
}
// Story-boss looks. style: shadow (orbiting shades + tendrils) | heaven (star orbs + halo) | storm (ball lightning + bolts)
// | frost (ice shards + floor spikes) | dive (ground ripples + clods). tints = phase 1..3 aura colour. New bosses are data only.
export const WSTYLE = {
  jose: { style: 'shadow', cloth: ['#3a2a5a', '#1a1424'], tints: ['#7a3aff', '#b03aff', '#ff3a6a'], wisp: ['#6a3aaa', '#e0b0ff', '#2a0a4a'], fx: 'shadow', fxc: '#3a1a5a', spark: '#b07aff' },
  jellal: { style: 'heaven', cloth: ['#1e2030', '#2a2a44'], tints: ['#ffd86a', '#ffb03a', '#ff5a3a'], fx: 'heaven', fxc: '#ffe08a', spark: '#ffffff' },
  everlue: { style: 'dive', cloth: ['#c89a3a', '#6a2a5a'], tints: ['#c8a060', '#e0b040', '#ff7a3a'], fx: 'magic', fxc: '#c8a060', spark: '#fff0a0' },
  lyon: { style: 'frost', cloth: ['#e8eef6', '#3a4a6a'], tints: ['#9adcff', '#6ab8ff', '#e0f4ff'], fx: 'heaven', fxc: '#bfe8ff', spark: '#ffffff' },
  laxus: { style: 'storm', cloth: ['#2a2a30', '#5a4a3a'], tints: ['#ffe24a', '#fff4a0', '#ffffff'], fx: 'heaven', fxc: '#ffe24a', spark: '#ffffff' },
  brain: { style: 'shadow', cloth: ['#e8e4d8', '#2a3a2a'], tints: ['#5aff8a', '#3ad06a', '#1a5a2a'], wisp: ['#2a8a4a', '#aaffc0', '#0a2a12'], fx: 'shadow', fxc: '#1a4a2a', spark: '#8aff9a' },
  hades: { style: 'shadow', cloth: ['#2a1a1a', '#6a1a1a'], tints: ['#ff3a3a', '#c01a3a', '#5a0a1a'], wisp: ['#8a1a2a', '#ffb0b0', '#2a0606'], fx: 'shadow', fxc: '#3a0a0a', spark: '#ff8a8a' },
};
export function animateWizardExtra(p, t) {
  if (!p.floor) return; const st = p.st || {}; const ph = Math.min(3, st.phase || 1); const tr = (st.transition || 0) > 0; const k = (ph - 1) / 2;
  const col = p.tints[ph - 1]; [p.floor.material, p.floor2.material, p.shell.material, p.moteM].forEach((m) => m.color.set(col));
  p.floor.rotation.z = t * (0.3 + k * 0.6); p.floor2.rotation.z = -t * (0.6 + k); p.floor.scale.setScalar(1 + k * 0.5 + (tr ? Math.sin(t * 18) * 0.08 : 0)); p.floor.material.opacity = 0.35 + k * 0.35 + (tr ? 0.3 : 0);
  p.shell.material.opacity = (tr ? 0.1 : 0.03 + k * 0.05) + Math.sin(t * 5) * 0.02; p.shell.scale.set(1 + k * 0.25, 1.45 + k * 0.3, 1 + k * 0.25);
  const nOn = p.jose ? 2 + ph * 1.4 : 3 + ph * 1.5;
  p.wisps.forEach((w, i) => { w.visible = i < nOn; const a = t * (0.9 + k * 0.6) + (i / 6) * Math.PI * 2; const r = 1.4 + k * 0.5 + Math.sin(t * 1.3 + i) * 0.15; w.position.set(Math.sin(a) * r, 1.2 + Math.sin(t * 2 + i) * 0.3, Math.cos(a) * r); w.rotation.y = a + Math.PI / 2; });
  (p.tendrils || []).forEach((td, i) => { const q = (td.userData.k + t * (0.35 + k * 0.3)) % 1; const a = i * 0.8 + td.userData.k * 6; const r = 0.7 + q * (1.2 + k); td.position.set(Math.sin(a) * r, q * 0.9, Math.cos(a) * r); td.scale.set(1, Math.sin(q * Math.PI) * (0.6 + k * 0.8), 1); td.visible = ph >= 2 || i < 4; });
  p.orbs.forEach((o, i) => { o.visible = i < nOn; const a = t * (0.7 + k * 0.5) + (i / 7) * Math.PI * 2; o.position.set(Math.sin(a) * (1.5 + k * 0.4), 2.1 + Math.sin(a * 2 + t) * 0.25, Math.cos(a) * (1.5 + k * 0.4)); o.scale.setScalar(1 + (tr ? Math.sin(t * 20 + i) * 0.3 : 0)); });
  if (p.bolts) p.bolts.forEach((b, i) => { const o = p.orbs[i]; b.visible = o.visible && ((t * 9 + i * 1.7) % 1) < 0.35 + k * 0.4; if (!b.visible) return; const ex = o.position.x, ey = o.position.y, ez = o.position.z; const n = b.children.length;
    b.children.forEach((sg, j) => { const f0 = j / n, f1 = (j + 1) / n; const j0 = j ? (H(i * 9 + j + Math.floor(t * 12)) - 0.5) * 0.5 : 0, j1 = (H(i * 9 + j + 1 + Math.floor(t * 12)) - 0.5) * 0.5;
      const ax = ex * f0 + j0, ay = 1.2 + (ey - 1.2) * f0 + j1 * 0.5, az = ez * f0 - j0, bx = ex * f1 + j1, by = 1.2 + (ey - 1.2) * f1, bz = ez * f1 - j1; sg.position.set((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2);
      const L = Math.hypot(bx - ax, by - ay, bz - az); sg.scale.set(1, L / 0.4, 1); sg.lookAt(sg.position.x + (bx - ax), sg.position.y + (by - ay), sg.position.z + (bz - az)); sg.rotateX(Math.PI / 2); }); });
  if (p.frost) p.frost.forEach((sp, i) => { const q = (sp.userData.k + t * 0.25) % 1; const a = i * 0.63 + sp.userData.k * 3; const r = 1 + q * (1.6 + k * 1.5); sp.position.set(Math.sin(a) * r, 0.2, Math.cos(a) * r); sp.scale.setScalar(Math.sin(q * Math.PI) * (0.7 + k)); sp.rotation.z = Math.sin(a) * 0.3; });
  if (p.ripples) p.ripples.forEach((r) => { const q = (r.userData.k + t * (0.5 + k * 0.4)) % 1; r.scale.setScalar(0.6 + q * (3 + k * 2)); r.material.opacity = (1 - q) * 0.55; r.material.color.set(col); });
  if (p.style === 'frost' || p.style === 'dive') p.orbs.forEach((o, i) => { o.rotation.y = t * 2; o.rotation.x = t; if (p.style === 'dive') o.position.y = 0.15 + Math.abs(Math.sin(t * 2.2 + i * 1.3)) * (0.8 + k); });
  if (p.halo2) { p.halo2.rotation.z = t; p.halo2.scale.setScalar(1 + k * 0.3); p.halo2.material.color.set(col); }
  p.motes.forEach((s, i) => { const q = (s.userData.k + t * (0.15 + k * 0.15)) % 1; const a = i * 2.4 + t * 0.3; s.position.set(Math.sin(a) * (0.6 + q), q * 3, Math.cos(a) * (0.6 + q)); s.scale.setScalar(Math.sin(q * Math.PI) * (1 + k)); });
}

/** Phase aura for creature-model bosses (e.g. the possessed Hakobe Vulcan): rune floor, rising motes and a heat shell that intensify per phase. */
export function dressBossAura(g, P, tints) {
  P.bossAura = { tints, floor: runeCircle(g, 2.6, tints[0], 0.05, 0.5) };
  const sh = add(g, new THREE.SphereGeometry(1.5, 18, 12), glowA(tints[0], 0.06), 0, 1.4, 0); sh.scale.set(1, 1.3, 1); sh.userData.noAO = true; sh.userData.noOutline = true; P.bossAura.shell = sh;
  const mm = glowA(tints[0], 0.8); P.bossAura.mm = mm; P.bossAura.motes = [];
  for (let i = 0; i < (GFX.high || GFX.real ? 18 : 9); i++) { const s = add(g, new THREE.OctahedronGeometry(0.06, 0), mm); s.userData.k = H(i * 11); s.userData.noAO = true; s.userData.noOutline = true; P.bossAura.motes.push(s); }
}
export function animateBossAura(p, t) {
  const A = p.bossAura; const st = p.st || {}; const ph = Math.min(3, st.phase || 1); const k = (ph - 1) / 2; const tr = (st.transition || 0) > 0; const col = A.tints[ph - 1];
  for (const m of [A.floor.material, A.shell.material, A.mm]) m.color.set(col);
  A.floor.rotation.z = t * (0.3 + k); A.floor.scale.setScalar(1 + k * 0.4 + (tr ? Math.sin(t * 18) * 0.1 : 0)); A.floor.material.opacity = 0.25 + k * 0.4 + (tr ? 0.3 : 0);
  A.shell.material.opacity = (tr ? 0.12 : 0.02 + k * 0.06) + Math.sin(t * 4) * 0.015;
  A.motes.forEach((s, i) => { const q = (s.userData.k + t * (0.2 + k * 0.2)) % 1; const a = i * 2.1 + t * 0.4; s.position.set(Math.sin(a) * (0.9 + q), q * 3.4, Math.cos(a) * (0.9 + q)); s.scale.setScalar(Math.sin(q * Math.PI) * (1 + k)); });
}
