import * as THREE from 'three';
import { groundAt } from '../world/world.js';
import { ITEMS } from '../data/items.js';
import { derived } from '../core/state.js';
import { COMBOS, COMBO_WINDOW, PARTY, unisonFor } from '../data/combos.js';

/** School-specific spell VFX, combo finishers and Unison Raids. Owned by Game (game.magic). */
const ADD = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide };
export const SCHOOL_COLORS = { flame: ['#ff5a10', '#ffd040'], ice: ['#8fdcff', '#ffffff'], lightning: ['#fff27a', '#ffffff'], celestial: ['#ffe08a', '#a0b8ff'], rune: ['#b070ff', '#ffb0ff'], requip: ['#fff0d0', '#c8ccd8'] };
const PREFIX = { fl_: 'flame', ic_: 'ice', li_: 'lightning', ce_: 'celestial', ru_: 'rune', rq_: 'requip' };
export const schoolOf = (id) => { for (const [p, s] of Object.entries(PREFIX)) if (id && id.startsWith(p)) return s; return null; };

export class MagicFX {
  constructor(game) { this.g = game; this.hist = []; this.unison = 0; this.comboN = 0; this.partyT = 0; }
  get scene() { return this.g.scene; }
  rand() { return this.g.rand(); }
  /** Push a custom fx: upd(k, dt, f) runs each frame with k = age/life. Disposed by the game's fx loop. */
  add(obj, life, upd) { this.scene.add(obj); this.g.fx.push({ m: obj, life, age: 0, kind: 'custom', upd }); return obj; }
  mat(color, opacity = 0.9) { return new THREE.MeshBasicMaterial({ color, opacity, ...ADD }); }
  fadeAll(g, k, base = 0.9) { g.traverse((o) => { if (o.material) o.material.opacity = base * (1 - k); }); }
  gy(p) { return groundAt(p.x, p.z); }

  // ------------------------------------------------------------ per-school primitives
  embers(p, n = 24, colors = ['#ff6a10', '#ffd040'], spread = 1.5, rise = 5) {
    const g = new THREE.Group(); g.position.set(p.x, this.gy(p) + 0.6, p.z);
    const parts = [];
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(new THREE.TetrahedronGeometry(0.12 + this.rand() * 0.18), this.mat(colors[i % colors.length]));
      m.position.set((this.rand() - 0.5) * spread, this.rand() * 0.6, (this.rand() - 0.5) * spread); g.add(m);
      parts.push({ m, v: new THREE.Vector3((this.rand() - 0.5) * 2, rise * (0.5 + this.rand()), (this.rand() - 0.5) * 2) });
    }
    return this.add(g, 1.1, (k, dt) => { for (const q of parts) { q.m.position.addScaledVector(q.v, dt); q.m.rotation.x += dt * 6; q.m.scale.setScalar(1 - k); } this.fadeAll(g, k); });
  }
  flameJet(p, rot, len, w = 1.2, dragon = false) {
    const g = new THREE.Group(); g.position.set(p.x, p.y + 1.1, p.z); g.rotation.y = rot;
    const n = Math.max(6, Math.round(len * 1.2)); const tongues = [];
    for (let i = 0; i < n; i++) {
      const f = i / n; const c = new THREE.Mesh(new THREE.ConeGeometry(w * (0.4 + f * 0.9), 1.6, 8, 1, true), this.mat(i % 2 ? '#ff7a1a' : '#ffc23a', 0.8));
      c.rotation.x = -Math.PI / 2; c.position.set((this.rand() - 0.5) * w * f, (this.rand() - 0.5) * w * f, f * len); g.add(c); tongues.push({ c, ph: this.rand() * 6 });
    }
    if (dragon) { // a roaring dragon head made of flame at the front of the jet
      const head = new THREE.Group(); head.position.z = len * 0.95;
      const skull = new THREE.Mesh(new THREE.ConeGeometry(w * 1.3, w * 3, 6, 1, true), this.mat('#ff5010', 0.75)); skull.rotation.x = Math.PI / 2; head.add(skull);
      for (const s of [-1, 1]) { const horn = new THREE.Mesh(new THREE.ConeGeometry(0.2, 1.6, 5), this.mat('#ffd040')); horn.position.set(s * w * 0.8, w * 0.9, -w * 0.8); horn.rotation.x = -0.9; head.add(horn);
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), this.mat('#ffffff')); eye.position.set(s * w * 0.55, w * 0.45, 0); head.add(eye); }
      const jaw = new THREE.Mesh(new THREE.ConeGeometry(w * 0.9, w * 2.4, 6, 1, true), this.mat('#ff9a20', 0.7)); jaw.rotation.x = Math.PI / 2 + 0.35; jaw.position.y = -w * 0.6; head.add(jaw);
      g.add(head);
    }
    this.add(g, 0.75, (k) => { for (const t of tongues) { const s = 0.7 + Math.sin(k * 20 + t.ph) * 0.25 + k * 0.6; t.c.scale.set(s, s, s); } this.fadeAll(g, k, 0.85); });
    this.embers(p.clone().addScaledVector(new THREE.Vector3(Math.sin(rot), 0, Math.cos(rot)), len * 0.6), 18);
  }
  flameWings(p, rot) {
    const g = new THREE.Group(); g.position.set(p.x, p.y + 1.2, p.z); g.rotation.y = rot;
    for (const s of [-1, 1]) for (let i = 0; i < 5; i++) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.35, 3.2 - i * 0.35, 6, 1, true), this.mat(i % 2 ? '#ff6a10' : '#ffc040', 0.8)); f.position.set(s * (0.6 + i * 0.45), 0.6 + i * 0.25, -0.2); f.rotation.z = s * (1.0 + i * 0.18); g.add(f); }
    this.add(g, 0.7, (k) => { g.scale.set(0.6 + k * 1.2, 1, 0.6 + k * 1.2); g.rotation.y = rot + k * 0.4; this.fadeAll(g, k); });
  }
  iceSpikes(p, rot, len, ring = false, count = 10) {
    const g = new THREE.Group(); const y = this.gy(p); g.position.set(p.x, y, p.z); const sp = [];
    for (let i = 0; i < count; i++) {
      let x, z; if (ring) { const a = (i / count) * Math.PI * 2; x = Math.sin(a) * len; z = Math.cos(a) * len; } else { const f = (i + 1) / count; x = Math.sin(rot) * len * f + (this.rand() - 0.5); z = Math.cos(rot) * len * f + (this.rand() - 0.5); }
      const h = 1.2 + this.rand() * 1.8; const c = new THREE.Mesh(new THREE.OctahedronGeometry(0.5, 0), new THREE.MeshStandardMaterial({ color: '#bfefff', emissive: '#4ab8ff', emissiveIntensity: 0.6, transparent: true, opacity: 0.85, roughness: 0.1, metalness: 0.2 }));
      c.scale.set(0.6, h, 0.6); c.position.set(x, 0, z); c.rotation.set((this.rand() - 0.5) * 0.5, this.rand() * 3, (this.rand() - 0.5) * 0.5); g.add(c); sp.push({ c, h, d: i * 0.03 });
    }
    this.add(g, 1.4, (k) => { for (const s of sp) { const t = Math.min(1, Math.max(0, (k * 1.4 - s.d) * 4)); s.c.position.y = s.h * 0.5 * t - 0.3; if (k > 0.75) s.c.scale.multiplyScalar(0.93); } g.traverse((o) => { if (o.material && k > 0.7) o.material.opacity = 0.85 * (1 - (k - 0.7) / 0.3); }); });
    this.shards(ring ? p : p.clone().add(new THREE.Vector3(Math.sin(rot) * len, 0, Math.cos(rot) * len)), 14);
  }
  shards(p, n = 14) { return this.embers(p, n, ['#dff6ff', '#8fdcff'], 2, 3); }
  iceHammer(at) {
    const g = new THREE.Group(); const y = this.gy(at); g.position.set(at.x, y + 9, at.z);
    const m = new THREE.MeshStandardMaterial({ color: '#c8f2ff', emissive: '#3aa0ff', emissiveIntensity: 0.5, transparent: true, opacity: 0.9, roughness: 0.05 });
    const head = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.8, 1.8), m); const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 4, 8), m); handle.position.y = 2.6; g.add(head, handle);
    this.add(g, 0.9, (k) => { const t = Math.min(1, k * 2.6); g.position.y = y + 9 - 8.1 * t * t; g.rotation.z = (1 - t) * 0.8; if (k > 0.6) m.opacity = 0.9 * (1 - (k - 0.6) / 0.4); });
    setTimeout(() => { this.iceSpikes(at, 0, 2.4, true, 8); this.g.ui.shake?.(0.25); }, 330);
  }
  bolt(a, b, color = '#fff27a', life = 0.35, segs = 10, jag = 0.9) {
    const pts = []; for (let i = 0; i <= segs; i++) { const f = i / segs; const q = a.clone().lerp(b, f); if (i && i < segs) q.add(new THREE.Vector3((this.rand() - 0.5) * jag, (this.rand() - 0.5) * jag, (this.rand() - 0.5) * jag)); pts.push(q); }
    const g = new THREE.Group();
    for (let i = 0; i < segs; i++) { const s = pts[i], e = pts[i + 1]; const len = s.distanceTo(e); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, len, 4), this.mat(i % 3 ? color : '#ffffff', 1)); c.position.copy(s).lerp(e, 0.5); c.lookAt(e); c.rotateX(Math.PI / 2); g.add(c);
      const h = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, len, 4), this.mat(color, 0.35)); h.position.copy(c.position); h.quaternion.copy(c.quaternion); g.add(h); }
    return this.add(g, life, (k) => { g.visible = Math.sin(k * 60) > -0.5; this.fadeAll(g, k, 1); });
  }
  skyBolts(at, n = 3, r = 1.5, color = '#fff27a') {
    for (let i = 0; i < n; i++) { const x = at.x + (this.rand() - 0.5) * r * 2, z = at.z + (this.rand() - 0.5) * r * 2; const y = groundAt(x, z); this.bolt(new THREE.Vector3(x + (this.rand() - 0.5) * 3, y + 14, z), new THREE.Vector3(x, y, z), color, 0.4, 14, 1.4); }
    this.g.fxRing(at, r + 1, color);
  }
  glyph(p, r, color = '#ffe08a', vertical = false, rot = 0, star = true, life = 1.0, y = 0.08) {
    const g = new THREE.Group(); g.position.set(p.x, (vertical ? p.y + 1.4 : this.gy(p) + y), p.z);
    const inner = new THREE.Group(); if (vertical) inner.rotation.y = rot; else inner.rotation.x = -Math.PI / 2; g.add(inner);
    inner.add(new THREE.Mesh(new THREE.RingGeometry(r * 0.92, r, 48), this.mat(color)));
    inner.add(new THREE.Mesh(new THREE.RingGeometry(r * 0.7, r * 0.74, 48), this.mat(color, 0.7)));
    if (star) { for (let i = 0; i < 5; i++) { const a1 = (i / 5) * Math.PI * 2, a2 = ((i + 2) / 5) * Math.PI * 2; const s = new THREE.Vector3(Math.sin(a1) * r * 0.7, Math.cos(a1) * r * 0.7, 0), e = new THREE.Vector3(Math.sin(a2) * r * 0.7, Math.cos(a2) * r * 0.7, 0);
      const bar = new THREE.Mesh(new THREE.PlaneGeometry(s.distanceTo(e), 0.06 * r), this.mat(color)); bar.position.copy(s).lerp(e, 0.5); bar.rotation.z = Math.atan2(e.y - s.y, e.x - s.x); inner.add(bar); } }
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; const rune = new THREE.Mesh(new THREE.PlaneGeometry(0.12 * r, 0.16 * r), this.mat(color)); rune.position.set(Math.sin(a) * r * 0.83, Math.cos(a) * r * 0.83, 0); rune.rotation.z = -a; inner.add(rune); }
    return this.add(g, life, (k) => { inner.rotation.z += 0.03; g.scale.setScalar(Math.min(1, k * 5)); this.fadeAll(g, Math.max(0, (k - 0.6) / 0.4)); });
  }
  stars(p, n = 18, r = 2.5, color = '#fff6c0') {
    const g = new THREE.Group(); g.position.set(p.x, this.gy(p), p.z); const ss = [];
    const shape = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2, rr = i % 2 ? 0.08 : 0.22; i ? shape.lineTo(Math.sin(a) * rr, Math.cos(a) * rr) : shape.moveTo(0, rr); }
    const geo = new THREE.ShapeGeometry(shape);
    for (let i = 0; i < n; i++) { const m = new THREE.Mesh(geo, this.mat(i % 3 ? color : '#a0b8ff')); m.position.set((this.rand() - 0.5) * r * 2, this.rand() * 1.5, (this.rand() - 0.5) * r * 2); g.add(m); ss.push({ m, v: 1.5 + this.rand() * 3, s: this.rand() * 6 }); }
    return this.add(g, 1.3, (k, dt) => { for (const s of ss) { s.m.position.y += s.v * dt; s.m.rotation.z += dt * 3; s.m.lookAt(this.g.camera.position); } this.fadeAll(g, k); });
  }
  runeScript(p, r = 2.2, color = '#b070ff') {
    const g = new THREE.Group(); g.position.set(p.x, this.gy(p), p.z); const rings = [];
    for (let j = 0; j < 3; j++) { const ring = new THREE.Group(); ring.position.y = 0.4 + j * 0.8; g.add(ring); rings.push(ring);
      for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; const ch = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.32), this.mat(j === 1 ? '#ffb0ff' : color)); ch.position.set(Math.sin(a) * (r - j * 0.25), 0, Math.cos(a) * (r - j * 0.25)); ch.rotation.y = a; ring.add(ch);
        const bar = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.24), this.mat('#ffffff', 0.7)); bar.position.copy(ch.position).multiplyScalar(0.98); bar.rotation.y = a; bar.rotation.z = 0.5; ring.add(bar); } }
    return this.add(g, 1.2, (k) => { rings.forEach((r2, j) => { r2.rotation.y += (j % 2 ? -1 : 1) * 0.05; r2.position.y = 0.4 + j * 0.8 + k * 0.6; }); this.fadeAll(g, Math.max(0, (k - 0.5) / 0.5)); });
  }
  swordRing(p, n = 8, r = 2.2, rain = null) {
    const g = new THREE.Group(); g.position.set(p.x, this.gy(p) + 1.4, p.z); const sw = [];
    for (let i = 0; i < n; i++) { const s = new THREE.Group(); const blade = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.4, 0.04), this.mat('#f4f8ff', 0.95)); blade.position.y = 0.7; const hilt = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 0.08), this.mat('#ffd76a')); s.add(blade, hilt);
      const a = (i / n) * Math.PI * 2; s.position.set(Math.sin(a) * r, 0, Math.cos(a) * r); s.rotation.x = Math.PI; g.add(s); sw.push({ s, a }); }
    const tgt = rain ? new THREE.Vector3(rain.x - p.x, groundAt(rain.x, rain.z) - (this.gy(p) + 1.4), rain.z - p.z) : null;
    return this.add(g, 1.1, (k) => { for (const q of sw) { const a = q.a + k * 5; if (tgt && k > 0.45) { const t = (k - 0.45) / 0.55; q.s.position.lerp(tgt.clone().add(new THREE.Vector3(Math.sin(a) * 0.8, 0, Math.cos(a) * 0.8)), t * 0.5); } else q.s.position.set(Math.sin(a) * r, Math.sin(k * 8 + q.a) * 0.2, Math.cos(a) * r); }
      this.fadeAll(g, Math.max(0, (k - 0.75) / 0.25), 0.95); });
  }
  pillar(p, r, colors, h = 14, life = 1.4) {
    const g = new THREE.Group(); g.position.set(p.x, this.gy(p), p.z);
    colors.forEach((c, i) => { const cyl = new THREE.Mesh(new THREE.CylinderGeometry(r * (0.55 - i * 0.15), r * (0.8 - i * 0.2), h, 24, 1, true), this.mat(c, 0.18 - i * 0.05)); cyl.position.y = h / 2; g.add(cyl); });
    const core = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.12, r * 0.2, h, 10), this.mat('#ffffff', 0.14)); core.position.y = h / 2; g.add(core);
    return this.add(g, life, (k) => { g.rotation.y += 0.08; g.scale.set(0.3 + Math.min(1, k * 4) * 0.9, Math.min(1, k * 3), 0.3 + Math.min(1, k * 4) * 0.9); this.fadeAll(g, Math.max(0, (k - 0.5) / 0.5), 0.2); });
  }
  swirl(p, r, colors) {
    const g = new THREE.Group(); g.position.set(p.x, this.gy(p) + 0.3, p.z); const arms = [];
    for (let i = 0; i < 24; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), this.mat(colors[i % colors.length])); g.add(m); arms.push({ m, a: (i / 24) * Math.PI * 2, rr: r * (0.4 + (i % 3) * 0.25) }); }
    return this.add(g, 1.5, (k) => { for (const q of arms) { const a = q.a + k * 9; const rr = q.rr * (1 - k * 0.6); q.m.position.set(Math.sin(a) * rr, k * 6 + Math.sin(a * 2), Math.cos(a) * rr); } this.fadeAll(g, k); });
  }

  /** Per-cast visual layered on top of the generic fx. */
  cast(id, ab, pl, tgt, fwd) {
    const s = schoolOf(id); if (!s) return; const rot = pl.rot; const at = tgt ? tgt.pos.clone() : pl.pos.clone().addScaledVector(fwd, ab.dist || ab.range || 6);
    const len = ab.length || ab.range || 8; const r = ab.radius || 3;
    if (s === 'flame') {
      if (ab.type === 'beam') this.flameJet(pl.pos, rot, len, (ab.width || 2) * 0.6, true);
      else if (ab.type === 'melee' || ab.type === 'dash') { this.embers(pl.pos.clone().addScaledVector(fwd, 1.2), 22); this.flameJet(pl.pos, rot, 2.4, 0.6); }
      else if (ab.type === 'aoe_self') { this.flameWings(pl.pos, rot); this.embers(pl.pos, 30, undefined, r * 1.4); }
      else this.embers(at, 22, undefined, r);
    } else if (s === 'ice') {
      if (ab.type === 'aoe_target' || ab.id === 'ic_hammer' || id === 'ic_hammer') this.iceHammer(at);
      else if (ab.type === 'aoe_self' || ab.type === 'trap') this.iceSpikes(pl.pos, 0, r, true, 14);
      else this.iceSpikes(pl.pos, rot, Math.min(len, 10), false, 9);
    } else if (s === 'lightning') {
      const top = new THREE.Vector3(pl.pos.x, pl.pos.y + 1.2, pl.pos.z);
      if (ab.type === 'aoe_self' || ab.type === 'trap') { for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; this.bolt(top, new THREE.Vector3(pl.pos.x + Math.sin(a) * r, this.gy(pl.pos) + 0.2, pl.pos.z + Math.cos(a) * r)); } this.skyBolts(pl.pos, 2, r * 0.6); }
      else if (ab.type === 'dash') this.bolt(top.clone().addScaledVector(fwd, -(ab.dist || 6)), top, '#fff27a', 0.4, 12, 1.2);
      else { this.bolt(top, at.clone().setY(at.y + 1), '#fff27a', 0.35, 12, 1); if (ab.type === 'aoe_target') this.skyBolts(at, 4, r); }
    } else if (s === 'celestial') {
      this.glyph(ab.type === 'summon' ? pl.pos.clone().addScaledVector(fwd, 2) : ab.type === 'aoe_target' ? at : pl.pos, ab.type === 'aoe_target' ? r : 1.8, '#ffe08a'); this.stars(ab.type === 'aoe_target' ? at : pl.pos, 16, 2);
    } else if (s === 'rune') {
      this.runeScript(ab.type === 'trap' || ab.type === 'aoe_target' ? at : pl.pos, Math.max(1.6, r * 0.8));
      if (ab.type === 'proj' || ab.type === 'beam') this.glyph(pl.pos, 1.2, '#c080ff', true, rot, false, 0.6);
    } else if (s === 'requip') this.swordRing(pl.pos, ab.type === 'aoe_target' || ab.type === 'proj' ? 10 : 6, 2, ab.type === 'aoe_target' || ab.type === 'proj' ? at : null);
  }
  schoolFinisher(s, at, r, color) {
    const c = SCHOOL_COLORS[s] || [color, '#ffffff'];
    if (s === 'flame') { this.pillar(at, r, c); this.embers(at, 40, c, r * 1.4, 7); }
    else if (s === 'ice') { this.iceSpikes(at, 0, r * 0.8, true, 16); this.iceHammer(at); }
    else if (s === 'lightning') { this.skyBolts(at, 7, r * 0.8); this.pillar(at, r * 0.6, c, 18, 0.8); }
    else if (s === 'celestial') { this.glyph(at, r, '#ffe08a', false, 0, true, 1.6); this.glyph(at, r * 0.6, '#a0b8ff', false, 0, true, 1.6, 2.5); this.stars(at, 34, r); }
    else if (s === 'rune') { this.runeScript(at, r); this.skyBolts(at, 4, r * 0.6, '#d0a0ff'); }
    else if (s === 'requip') { this.swordRing(at.clone().setY(at.y + 4), 14, r * 0.8, at); this.pillar(at, r * 0.5, c, 10, 1); }
    this.g.fxRing(at, r, c[0], true);
  }

  // ------------------------------------------------------------ combos
  onCast(id, ab, base) {
    const g = this.g, t = g.t; this.hist = this.hist.filter((h) => t - h.t < COMBO_WINDOW); this.hist.push({ id, t });
    const s = schoolOf(id); if (!s) return;
    this.comboN = this.hist.length; if (this.comboN >= 2) g.ui.comboText?.(`${this.comboN}× Chain`);
    for (const c of COMBOS) {
      const n = c.seq.length; if (this.hist.length < n) continue;
      if (this.hist.slice(-n).every((h, i) => h.id === c.seq[i])) { this.hist = []; this.finisher(c, base); return c; }
    }
  }
  finisher(c, base) {
    const g = this.g; const tgt = g.validTarget(); const at = tgt ? tgt.pos.clone() : g.player.pos.clone();
    g.ui.toast(`✦ Combo! ${c.name}`); g.ui.log(`Combo finisher: ${c.name}!`, 'ability'); g.ui.comboText?.(c.name, true); g.ui.shake?.(0.35);
    setTimeout(() => {
      this.schoolFinisher(c.school, at, c.radius, c.color);
      const dmg = base * c.mult; for (const m of g.mobsNear(at, c.radius + 0.5)) g.damageMob(m, dmg, c.effect ? { effect: c.effect } : null);
    }, 220);
    g.combos = (g.combos || 0) + 1; g.G.combosDone = (g.G.combosDone || 0) + 1;
  }

  // ------------------------------------------------------------ party & unison
  partner() { const id = this.g.G.party; if (!id) return null; return this.g.entities.find((e) => e.kind === 'ally' && e.party) || null; }
  fill(from, amt) { if (!this.g.G.party) return; this.unison = Math.min(100, this.unison + (from === 'ally' ? 2.5 : 1.5) * (amt || 1)); }
  playerSchool() { const L = this.g.G.equip.lacrima; return (L && ITEMS[L] && ITEMS[L].school) || 'flame'; }
  canUnison() { return this.unison >= 100 && !!this.partner() && !this.g.player.dead; }
  unisonRaid() {
    const g = this.g; const pt = this.partner(); if (!pt) { g.ui.toast('Recruit a party member in the guild hall to use Unison Raids.'); return; }
    if (this.unison < 100) { g.ui.toast(`Unison meter ${Math.floor(this.unison)}% — fight together to fill it.`); return; }
    const tgt = g.validTarget() || g.nearestMob(g.player.pos, 18); if (!tgt) { g.ui.toast('No enemy nearby for a Unison Raid.'); return; }
    g.setTarget(tgt); this.unison = 0;
    const ps = this.playerSchool(), as = PARTY[g.G.party].school; const u = unisonFor(ps, as);
    const at = tgt.pos.clone(); const ca = SCHOOL_COLORS[ps] || ['#ffffff'], cb = SCHOOL_COLORS[as] || ['#ffffff'];
    g.ui.toast(`⚡ ${u.name}!`); g.ui.log(`${pt.tpl.name.replace(' (party)', '')}: "${u.line || 'Together! Unison Raid!'}"`, 'npc'); g.ui.comboText?.(u.name, true, true);
    g.player.cast = 1.0; pt.atk = 0; pt.rot = Math.atan2(at.x - pt.pos.x, at.z - pt.pos.z);
    for (const e of [g.player, pt]) { this.glyph(e.pos, 1.6, e === pt ? cb[0] : ca[0], false, 0, true, 1.2); this.bolt(new THREE.Vector3(e.pos.x, e.pos.y + 1.4, e.pos.z), new THREE.Vector3(at.x, at.y + 2, at.z), e === pt ? cb[0] : ca[0], 0.9, 14, 0.6); }
    this.swirl(at, u.radius, [ca[0], cb[0], ca[1], cb[1]]);
    setTimeout(() => {
      this.pillar(at, u.radius * 0.6, [ca[0], cb[0]], 20, 1.6); this.schoolFinisher(ps, at, u.radius * 0.8, ca[0]); if (as !== ps) this.schoolFinisher(as, at, u.radius * 0.7, cb[0]);
      g.ui.shake?.(0.8); const d = derived(g.G); const dmg = (14 + d.level * 3) * u.mult * (1 + (g.G.stats.INT || 0) * 0.035);
      for (const m of g.mobsNear(at, u.radius + 0.5)) g.damageMob(m, dmg, { effect: { stun: 1.5 } });
    }, 650);
    g.G.unisons = (g.G.unisons || 0) + 1; setTimeout(() => g.emote?.('cheer', 1.6), 1500);
  }
  // In-world cue when a Unison Raid is ready: pulsing rings under you and your partner, joined by a light tether
  unisonCue(pt, dt) {
    const g = this.g; const on = !!pt && !pt.downed && this.unison >= 100 && !g.player.dead;
    if (!this.cue) { const mk = (c) => { const m = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.15, 40), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide })); m.rotation.x = -Math.PI / 2; m.renderOrder = 5; return m; };
      const tether = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1, 6, 1, true), new THREE.MeshBasicMaterial({ color: '#ffe08a', transparent: true, opacity: 0.55, depthWrite: false }));
      const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64; const x = cv.getContext('2d'); x.font = 'bold 40px Georgia, serif'; x.textAlign = 'center'; x.lineWidth = 6; x.strokeStyle = '#3a1a00'; x.strokeText('UNISON!', 128, 46); x.fillStyle = '#ffd84a'; x.fillText('UNISON!', 128, 46);
      const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthTest: false })); label.scale.set(2.4, 0.6, 1);
      this.cue = { a: mk('#ffd84a'), b: mk('#7ad0ff'), tether, label }; for (const o of Object.values(this.cue)) { o.visible = false; g.scene.add(o); } }
    const c = this.cue; for (const o of Object.values(c)) o.visible = on; if (!on) return;
    const k = 1 + Math.sin(g.t * 6) * 0.12; const P = g.player.pos, Q = pt.pos;
    c.a.position.set(P.x, P.y + 0.06, P.z); c.a.scale.setScalar(k); c.b.position.set(Q.x, Q.y + 0.06, Q.z); c.b.scale.setScalar(k);
    const mid = new THREE.Vector3((P.x + Q.x) / 2, (P.y + Q.y) / 2 + 1, (P.z + Q.z) / 2); const L = Math.hypot(P.x - Q.x, P.y - Q.y, P.z - Q.z);
    c.tether.position.copy(mid); c.tether.scale.set(1, Math.max(0.01, L), 1); c.tether.lookAt(Q.x, Q.y + 1, Q.z); c.tether.rotateX(Math.PI / 2); c.tether.material.opacity = 0.35 + Math.sin(g.t * 8) * 0.2;
    c.label.position.set(Q.x, Q.y + 2.9 + Math.sin(g.t * 3) * 0.1, Q.z);
  }
  update(dt) {
    const g = this.g, G = g.G; if (!G.party || !PARTY[G.party]) return;
    const pt = this.partner(); this.unisonCue(pt, dt);
    if (!pt) { this.partyT -= dt; if (this.partyT <= 0 && !g.transit?.ride) { this.partyT = 15; g.summon(PARTY[G.party].ally, 0, 1 + derived(G).level * 0.06, { party: true }); } return; }
    if (pt.pos.distanceTo(g.player.pos) > 40 && !g.transit?.ride) { pt.pos.copy(g.player.pos).add(new THREE.Vector3(1.5, 0, 1.5)); pt.pos.y = groundAt(pt.pos.x, pt.pos.z); }
  }
}
