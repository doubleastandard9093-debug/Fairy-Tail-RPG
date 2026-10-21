import * as T from '../data/skilltree.js';
import * as THREE from 'three';
import { ITEMS, WEAPON_TYPES, ARMOR_TYPES } from '../data/items.js';
import { TIERS, ROMAN } from '../data/tiers.js';
import { ABILITIES } from '../data/abilities.js';
import { SCHOOLS, RANK_XP } from '../data/schools.js';
import { JOBS, RANK_ORDER, GUILD_RANKS } from '../data/jobs.js';
import { QUESTS } from '../data/quests.js';
import { NPCS } from '../data/npcs.js';
import { SHOP_LISTINGS, BUY_MARKUP, SELL_RATE } from '../data/shop.js';
import { WEAPON_ABILITIES } from '../data/abilities.js';
import { derived, countItem, addItem, removeItem, skillLevel, totalLevel, guildRank, nextGuildRank, classRank, SKILLS, STAT_INFO, saveGame, saveSettings, SAVE_KEY, migrate, dayStamp, canAdd, freeSlots, INV_SIZE } from '../core/state.js';
import { xpForLevel, levelForXp, progressToNext, charXpForLevel } from '../core/xp.js';
import * as P from '../systems/progress.js';
import { TOWN } from '../world/world.js';
import { BOSS_ARENA } from '../data/mobs.js';
import { PLACES, PLACE, STATIONS, GW, GH, S as MAP_S, ORIGIN, toMap, biomeAt, mapHeight, ROADS, RAILS, FERRY, FERRY_COST, trainCost } from '../world/fiore.js';

const $ = (sel, root = document) => root.querySelector(sel);
const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = (n) => Math.round(n).toLocaleString();
const hash = (s) => { let x = 2166136261; for (const c of s) { x ^= c.charCodeAt(0); x = Math.imul(x, 16777619); } return ((x >>> 0) % 1000) / 1000; };
export const drift = (id) => 0.85 + 0.3 * hash(id + dayStamp());
export const buyPrice = (id) => Math.max(1, Math.round(ITEMS[id].value * BUY_MARKUP * drift(id)));
export const sellPrice = (id) => Math.max(1, Math.round(ITEMS[id].value * SELL_RATE * drift(id)));
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8'];

export function itemDesc(id) {
  const it = ITEMS[id]; if (!it) return '';
  const tier = it.tier ? `<span style="color:${TIERS[it.tier].color}">T${it.tier} ${TIERS[it.tier].name}</span> · ` : '';
  if (it.kind === 'weapon') return `${tier}${WEAPON_TYPES[it.weaponType].name} · Power ×${it.power.toFixed(2)} · Scales with ${WEAPON_TYPES[it.weaponType].stat}<br><span class="muted">Abilities: ${WEAPON_ABILITIES[it.weaponType].map((a) => ABILITIES[a].name).join(', ')}</span>`;
  if (it.kind === 'armor') return `${tier}${ARMOR_TYPES[it.armorType].name} · Defence ${it.def}${it.mp ? ` · +${it.mp} max mana` : ''}<br><span class="muted">Ability: ${ABILITIES[{ cloth: 'ar_meditate', leather: 'ar_roll', plate: 'ar_guard' }[it.armorType]].name}</span>`;
  if (it.kind === 'lacrima') { const s = SCHOOLS[it.school]; return `Attunes you to <b style="color:${s.color}">${s.name}</b>.<br><span class="muted">${s.blurb}</span>`; }
  if (it.kind === 'key') return 'A celestial gate key. Required to summon its spirit.';
  if (it.kind === 'consumable') return `${it.heal ? `Restores ${it.heal} health. ` : ''}${it.mana ? `Restores ${it.mana} mana.` : ''}`;
  if (it.kind === 'quest') return 'Quest item.';
  return `${tier}${it.kind === 'refined' ? 'Refined material' : 'Raw material'} · worth ~${it.value} jewels`;
}
export function abilityDesc(id) {
  const a = ABILITIES[id]; if (!a) return '';
  const parts = [];
  const t = { melee: 'Melee strike', proj: a.pierce ? 'Piercing projectile' : 'Projectile', beam: 'Line attack', aoe_self: 'Burst around you', aoe_target: 'Targeted blast', dash: a.mult ? 'Dash strike' : 'Dodge (brief invulnerability)', buff: 'Self buff', summon: 'Summon spirit ally', trap: 'Rune trap', requip: 'Swap to reserve weapon + strike' }[a.type];
  parts.push(t);
  if (a.mult) parts.push(`${Math.round(a.mult * 100)}% damage`);
  if (a.cost && a.cost.mp) parts.push(`${a.cost.mp} mana`); if (a.cost && a.cost.adr) parts.push(`${a.cost.adr}% adrenaline`); if (a.gain) parts.push(`+${a.gain}% adrenaline`);
  parts.push(`${a.cd}s cooldown`);
  if (a.effect) { if (a.effect.burn) parts.push('burns'); if (a.effect.slow) parts.push('slows'); if (a.effect.stun) parts.push('stuns'); }
  if (a.buff) { const b = a.buff; if (b.shield) parts.push(`${b.shield} shield`); if (b.dr) parts.push(`-${b.dr * 100}% damage taken`); if (b.dmgUp) parts.push(`+${b.dmgUp * 100}% damage`); if (b.mpRegen) parts.push(`+${b.mpRegen} mana/s`); if (b.mpRestore) parts.push(`+${b.mpRestore} mana`); parts.push(`${b.dur}s`); }
  if (a.needs) parts.push(`needs ${ITEMS[a.needs].name}`);
  return parts.join(' · ');
}

// Places whose names are already printed on the parchment map (pins there show an icon only)
const PRINTED = new Set(['magnolia', 'scilliora', 'hargeon', 'crocus', 'hakobe', 'oshibana', 'clover', 'galuna', 'tenrou', 'onibus', 'shirotsume', 'bluepegasus', 'lamiascale']);

export class UI {
  constructor() {
    this.game = null; this.panel = null; this.dirty = true; this.shakeAmt = 0; this.floaters = []; this.sel = null;
    document.body.insertAdjacentHTML('beforeend', `
      <div id="hud" class="hidden">
        <div id="plate" class="frame"><div class="crest">🔥</div><div><div class="nm"></div><div class="sub"></div></div></div>
        <div id="orbs"><div class="orb hp"><div class="fill"></div><div class="v"></div></div><div class="orb mp"><div class="fill"></div><div class="v"></div></div><div class="orb adr"><div class="fill"></div><div class="v"></div></div></div>
        <div id="buffs"></div>
        <div id="mapwrap"><canvas id="minimap" width="344" height="344"></canvas><div id="compass">N</div><div id="zone"></div></div>
        <div id="target" class="frame hidden"><div class="nm"></div><div class="bar"><i></i></div><div class="fx"></div></div>
        <div id="boss" class="frame hidden"><div class="nm"></div><div class="bar"><i></i></div><div class="cast"></div></div>
        <div id="chat"></div>
        <div id="abar"></div>
        <div id="menu"></div>
        <button id="interact" class="hidden"></button>
        <div id="gather" class="frame hidden"><div class="gn"></div><div class="bar"><i></i></div></div>
        <div id="joy"><div class="knob"></div></div>
        <div id="toasts"></div>
      </div>
      <div id="floaters"></div><div id="vignette"></div>
      <div id="panel" class="frame hidden"><header><div class="title"></div><button class="x" aria-label="Close">✕</button></header><div class="tabs"></div><div class="body"></div></div>
      <div id="dialog" class="frame hidden"><div class="who"></div><div class="txt"></div><div class="opts"></div><div class="more"></div></div>`);
    this.el = { hud: $('#hud'), plate: $('#plate'), orbs: $('#orbs'), chat: $('#chat'), abar: $('#abar'), menu: $('#menu'), interact: $('#interact'), gather: $('#gather'), toasts: $('#toasts'), floaters: $('#floaters'), vig: $('#vignette'), panel: $('#panel'), dialog: $('#dialog'), target: $('#target'), boss: $('#boss'), map: $('#minimap'), zone: $('#zone'), buffs: $('#buffs') };
    this.el.panel.querySelector('.x').onclick = () => this.closePanel();
    this.el.chat.onclick = () => this.el.chat.classList.toggle('collapsed');
    const menu = [['worldmap', '🗺️', 'World Map (M)'], ['bag', '🎒', 'Bag (I)'], ['gear', '🛡️', 'Equipment (G)'], ['stats', '⭐', 'Stats (C)'], ['skills', '⛏️', 'Skills (K)'], ['quests', '📜', 'Quests & Jobs (J)'], ['tree', '🌳', 'Skill Tree (T)'], ['settings', '⚙️', 'Settings']];
    for (const [id, ic, tip] of menu) { const b = h('button', 'mb', ic); b.title = tip; b.dataset.p = id; b.onclick = () => (id === 'worldmap' ? this.toggleWorldMap() : this.togglePanel(id)); this.el.menu.appendChild(b); }
    this.el.map.onclick = () => this.toggleWorldMap();
    this.el.interact.onclick = () => { const it = this.game && this.game.nearestInteractable(); if (it) this.game.interact(it); };
    for (let i = 0; i < 8; i++) {
      const b = h('button', 'ab'); b.dataset.slot = i; b.innerHTML = `<span class="ic"></span><span class="k">${KEYS[i]}</span><span class="c"></span><div class="cd"></div><div class="cdt"></div>`;
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); this.game && this.game.useAbility(i); });
      this.el.abar.appendChild(b);
    }
    this.buildMapBase();
  }
  attach(game) { this.game = game; this.el.hud.classList.remove('hidden'); this.refresh(); this.renderAbilities(); }

  // ---------------------------------------------------------------- feedback
  log(msg, cls = 'info') {
    const l = h('div', 'l ' + cls); l.textContent = msg; this.el.chat.appendChild(l);
    while (this.el.chat.children.length > 40) this.el.chat.firstChild.remove();
  }
  toast(msg) { const t = h('div', 'toast'); t.textContent = msg; this.el.toasts.appendChild(t); setTimeout(() => t.remove(), 2600); while (this.el.toasts.children.length > 3) this.el.toasts.firstChild.remove(); }
  floatText(pos, yOff, text, cls) {
    const e = h('div', 'ft ' + cls); e.textContent = text; this.el.floaters.appendChild(e);
    this.floaters.push({ e, p: new THREE.Vector3(pos.x + (Math.random() - 0.5) * 0.6, (pos.y || 0) + yOff, pos.z), age: 0 });
    if (this.floaters.length > 40) { const f = this.floaters.shift(); f.e.remove(); }
  }
  hurtFlash() { const v = this.el.vig; v.classList.add('hit'); clearTimeout(this._hf); this._hf = setTimeout(() => v.classList.remove('hit'), 120); }
  shake(a) { if (this.game && this.game.S.shake === false) return; this.shakeAmt = Math.max(this.shakeAmt, a); }
  sfx(n) { this.audio?.sfx(n); }
  abilityFired(slot) { const b = this.el.abar.children[slot]; b.classList.remove('fired'); void b.offsetWidth; b.classList.add('fired'); }
  setTarget(m) { this.target = m; this.el.target.classList.toggle('hidden', !m || (m.tpl && m.tpl.boss)); if (m) this.el.target.querySelector('.nm').textContent = `${m.tpl.name} · Lv ${m.tpl.level}`; }
  boss(m) { if (m === this.bossEnt) return; this.bossEnt = m; this.el.boss.classList.toggle('hidden', !m); if (m) this.bossPhase(m); }
  bossPhase(m) { this.el.boss.querySelector('.nm').textContent = `☠ ${m.tpl.name} · Lv ${m.tpl.level}${m.phase ? ` · Phase ${m.phase}/3` : ''}`; }
  bossCast(name, t) { this.bossCastName = name; this.bossCastUntil = performance.now() + t * 1000; }
  gatherBar(p, name) {
    const g = this.el.gather; if (p === null) { if (!g.classList.contains('hidden')) g.classList.add('hidden'); return; }
    g.classList.remove('hidden'); g.querySelector('.gn').textContent = `Gathering: ${name}`; g.querySelector('i').style.width = Math.min(100, p * 100) + '%';
  }
  refresh() { this.dirty = true; }

  // ---------------------------------------------------------------- per-frame
  update(dt) {
    const g = this.game; if (!g) return; const G = g.G, d = derived(G), pl = g.player;
    if (this.dirty) { this.dirty = false; this.renderPlate(); this.renderAbilities(); if (this.panel) this.renderPanel(); this.renderMenuDots(); }
    // orbs
    const orb = (el, v, max, label) => { el.querySelector('.fill').style.height = Math.max(0, Math.min(100, v / max * 100)) + '%'; el.querySelector('.v').innerHTML = `${Math.max(0, Math.ceil(v))}<small>${label}</small>`; };
    const [oh, om, oa] = this.el.orbs.children; orb(oh, G.hp, d.maxHp, 'HP'); orb(om, G.mp, d.maxMp, 'MP'); orb(oa, G.adr, 100, '%');
    this.el.vig.classList.toggle('low', G.hp / d.maxHp < 0.3 && !pl.dead);
    // abilities
    const lo = g.loadout();
    for (let i = 0; i < 8; i++) {
      const b = this.el.abar.children[i]; const id = lo[i]; if (!id) continue; const a = ABILITIES[id];
      const cd = pl.cds[id] || 0, full = a.cd * (1 - d.cdr);
      b.querySelector('.cd').style.setProperty('--p', cd > 0 ? cd / full : 0);
      b.querySelector('.cdt').textContent = cd > 0.05 ? (cd < 10 ? cd.toFixed(1) : Math.ceil(cd)) : '';
      const c = a.cost || {}; const nores = (c.mp && G.mp < c.mp) || (c.adr && G.adr < c.adr) || (a.needs && countItem(G, a.needs) < 1);
      b.classList.toggle('nores', !!nores); b.classList.toggle('ready-adr', !!(c.adr && G.adr >= c.adr && cd <= 0));
    }
    // buffs
    const bk = pl.buffs.map((b) => b.icon + Math.ceil(b.until - g.t)).join();
    if (bk !== this._bk) { this._bk = bk; this.el.buffs.innerHTML = pl.buffs.map((b) => `<div class="buff" title="${esc(b.name)}">${b.icon}<i>${Math.ceil(b.until - g.t)}</i></div>`).join(''); }
    // interact prompt
    const it = this.el.dialog.classList.contains('hidden') && !this.panel && !pl.gathering ? g.nearestInteractable() : null;
    const ib = this.el.interact;
    if (it) { const verb = it.kind === 'npc' ? 'Talk to' : it.kind === 'rail' ? 'Board the train at' : it.kind === 'ferry' ? 'Board the' : it.kind === 'node' ? { ore: 'Mine', wood: 'Chop', fibre: 'Pick' }[it.type] : 'Use'; const label = `<span class="key">E</span>${verb} ${esc(it.name.split(' (')[0])}`; if (ib.innerHTML !== label) ib.innerHTML = label; ib.classList.remove('hidden'); }
    else ib.classList.add('hidden');
    // target / boss
    if (this.target && !this.target.dead) { this.el.target.querySelector('i').style.width = (this.target.hp / this.target.maxHp * 100) + '%'; const fx = []; if (this.target.burn) fx.push('🔥 burning'); if (this.target.slow) fx.push('❄️ slowed'); if (this.target.stun > 0) fx.push('💫 stunned'); this.el.target.querySelector('.fx').textContent = fx.join('  ') || `${fmt(this.target.hp)} / ${fmt(this.target.maxHp)}`; }
    if (this.bossEnt) { this.el.boss.querySelector('i').style.width = (this.bossEnt.hp / this.bossEnt.maxHp * 100) + '%'; this.el.boss.querySelector('.cast').textContent = performance.now() < (this.bossCastUntil || 0) ? `⚠ ${this.bossCastName}!` : `${fmt(this.bossEnt.hp)} / ${fmt(this.bossEnt.maxHp)}`; }
    // floaters
    const cam = g.camera; const W = innerWidth, H = innerHeight; const v = new THREE.Vector3();
    for (const f of [...this.floaters]) {
      f.age += dt; v.copy(f.p); v.y += f.age * 1.4; v.project(cam);
      if (f.age > 1.1 || v.z > 1) { f.e.remove(); this.floaters.splice(this.floaters.indexOf(f), 1); continue; }
      f.e.style.left = ((v.x + 1) / 2 * W) + 'px'; f.e.style.top = ((1 - v.y) / 2 * H) + 'px'; f.e.style.opacity = String(Math.min(1, 2.2 - f.age * 2));
    }
    this.shakeAmt = Math.max(0, this.shakeAmt - dt * 1.5);
    this.mapT = (this.mapT || 0) + dt; if (this.mapT > 0.1) { this.mapT = 0; this.drawMap(); }
    if (this.el.zone.textContent !== g.zone) this.el.zone.textContent = g.zone || '';
  }
  renderPlate() {
    const g = this.game, G = g.G, d = derived(G); const lac = G.equip.lacrima ? ITEMS[G.equip.lacrima] : null;
    this.el.plate.querySelector('.crest').textContent = lac ? SCHOOLS[lac.school].icon : '✦';
    this.el.plate.querySelector('.nm').textContent = G.name;
    this.el.plate.querySelector('.sub').innerHTML = `Lv ${d.level} <span class="rankbadge" title="Guild rank">${guildRank(G)}</span><span class="jwrap"><span class="jw">💎 ${fmt(G.jewels)}</span></span>`;
  }
  renderMenuDots() {
    const G = this.game.G; const b = this.el.menu.querySelector('[data-p=stats]');
    { const tb = this.el.menu.querySelector('[data-p=tree]'); const fp = T.pointsFree(G); let td = tb.querySelector('.dot'); if (fp > 0) { if (!td) { td = h('span', 'dot'); tb.appendChild(td); } td.textContent = fp > 9 ? '9+' : fp; } else if (td) td.remove(); }
    let dot = b.querySelector('.dot'); if (G.statPoints > 0) { if (!dot) { dot = h('span', 'dot'); b.appendChild(dot); } dot.textContent = G.statPoints > 9 ? '9+' : G.statPoints; } else if (dot) dot.remove();
    const q = this.el.menu.querySelector('[data-p=quests]'); let qd = q.querySelector('.dot'); const ready = G.jobs.active.filter((a) => P.jobReady(G, a)).length;
    if (ready) { if (!qd) { qd = h('span', 'dot'); q.appendChild(qd); } qd.textContent = ready; } else if (qd) qd.remove();
  }
  renderAbilities() {
    const g = this.game; if (!g) return; const lo = g.loadout();
    lo.forEach((id, i) => {
      const b = this.el.abar.children[i]; const a = id ? ABILITIES[id] : null;
      b.querySelector('.ic').textContent = a ? a.icon : '';
      const c = a && a.cost ? (a.cost.adr ? `${a.cost.adr}%` : a.cost.mp ? a.cost.mp : '') : '';
      const ce = b.querySelector('.c'); ce.textContent = c; ce.className = 'c ' + (a && a.cost ? (a.cost.adr ? 'adr' : 'mp') : '');
      b.title = a ? `${a.name} — ${abilityDesc(id)}` : 'Empty';
      b.classList.toggle('mag', i >= 3 && i <= 6); b.classList.toggle('arm', i === 7);
      const locked = id && g.abilityLocked(id); b.classList.toggle('locked', !!locked); if (locked) b.dataset.lock = 'Learn';
      b.style.visibility = a ? 'visible' : 'hidden';
    });
  }

  // ---------------------------------------------------------------- minimap
  buildMapBase() {
    // One pixel per traced cell (2 map px = 3.2 m): biome colours with hill shading, roads, railway, towns.
    const c = document.createElement('canvas'); c.width = GW; c.height = GH; const x = c.getContext('2d'); this.mapBase = c;
    const cell = 2 * MAP_S; this.mapS = 1 / cell;
    const toX = (wx) => wx / cell + ORIGIN[0] / 2, toY = (wz) => wz / cell + ORIGIN[1] / 2;
    const img = x.createImageData(GW, GH); const pal = { 0: [46, 104, 170], 1: [110, 170, 80], 2: [58, 118, 54], 3: [140, 124, 106], 4: [236, 240, 248], 5: [70, 140, 210], 7: [120, 100, 110] };
    for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) {
      const wx = (i - ORIGIN[0] / 2 + 0.5) * cell, wz = (j - ORIGIN[1] / 2 + 0.5) * cell; const b = biomeAt(wx, wz); const h = mapHeight(wx, wz), hw = mapHeight(wx - cell, wz - cell);
      const sh = b === 0 || b === 5 ? 1 : Math.max(0.65, Math.min(1.3, 1 + (h - hw) * 0.08)); const col = pal[b] || pal[1]; const k = (j * GW + i) * 4;
      img.data[k] = col[0] * sh; img.data[k + 1] = col[1] * sh; img.data[k + 2] = col[2] * sh; img.data[k + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    x.lineCap = 'round'; x.lineJoin = 'round';
    x.strokeStyle = '#e0c890'; x.lineWidth = 1.4; for (const l of ROADS) { x.beginPath(); l.forEach(([mx, my], k) => (k ? x.lineTo(mx / 2, my / 2) : x.moveTo(mx / 2, my / 2))); x.stroke(); }
    x.strokeStyle = '#3a3040'; x.lineWidth = 1.2; x.setLineDash([2, 1.5]); for (const l of RAILS) { x.beginPath(); l.forEach(([mx, my], k) => (k ? x.lineTo(mx / 2, my / 2) : x.moveTo(mx / 2, my / 2))); x.stroke(); } x.setLineDash([]);
    x.fillStyle = '#c8b898'; x.fillRect(toX(TOWN.minX), toY(TOWN.minZ), (TOWN.maxX - TOWN.minX) / cell, (TOWN.maxZ - TOWN.minZ) / cell);
    x.fillStyle = '#8a7a6a'; x.beginPath(); x.arc(toX(BOSS_ARENA.x), toY(BOSS_ARENA.z), BOSS_ARENA.r / cell, 0, 7); x.fill();
    this._mapRectsDrawn = false; this.mapCtx = x; this.mapToX = toX; this.mapToY = toY;
  }
  drawMap() {
    const g = this.game; const cv = this.el.map; const x = cv.getContext('2d'); const W = cv.width; const S = this.mapS;
    if (!this._mapRectsDrawn) { this._mapRectsDrawn = true; for (const r of g.world.map.rects) { this.mapCtx.fillStyle = r.color; this.mapCtx.fillRect(this.mapToX(r.x - r.w / 2), this.mapToY(r.z - r.d / 2), Math.max(1, r.w * S), Math.max(1, r.d * S)); } }
    const pl = g.player.pos; const scale = 3.4 * (W / 344) / S * 0.5; // canvas px per base px (~1.7 canvas px per metre)
    x.save(); x.clearRect(0, 0, W, W); x.beginPath(); x.arc(W / 2, W / 2, W / 2, 0, 7); x.clip();
    x.fillStyle = '#20301c'; x.fillRect(0, 0, W, W);
    x.translate(W / 2, W / 2); x.rotate(g.cam.yaw + Math.PI); x.scale(-scale, scale);
    x.drawImage(this.mapBase, -this.mapToX(pl.x), -this.mapToY(pl.z));
    const near = (wx, wz) => Math.abs(wx - pl.x) < 110 && Math.abs(wz - pl.z) < 110; const dot = (wx, wz, r, col, ring) => { if (!near(wx, wz)) return; r = r * 1.7 / scale; x.fillStyle = col; x.beginPath(); x.arc(this.mapToX(wx) - this.mapToX(pl.x), this.mapToY(wz) - this.mapToY(pl.z), r, 0, 7); x.fill(); if (ring) { x.strokeStyle = ring; x.lineWidth = 1.5 / scale; x.stroke(); } };
    for (const n of g.world.nodes) if (n.respawn <= 0) dot(n.x, n.z, 3, { ore: '#d0c0b0', wood: '#2a6a1a', fibre: '#ffffff' }[n.type]);
    for (const it of g.world.interactables) if (it.kind === 'npc') dot(it.x, it.z, 3.4, '#ffe060', '#000');
    for (const e of g.entities) { if (e.dead) continue; if (e.kind === 'mob') dot(e.pos.x, e.pos.z, e.tpl.boss ? 7 : 3, e.tpl.boss ? '#ff2a2a' : '#ff5a4a', '#000'); else dot(e.pos.x, e.pos.z, 3.4, e.kind === 'escort' ? '#ffa040' : '#5aff7a', '#000'); }
    for (const it of g.world.interactables) if (it.kind === 'rail' || it.kind === 'ferry') dot(it.x, it.z, 4.4, it.kind === 'rail' ? '#7ad8ff' : '#ffffff', '#000');
    x.restore();
    // player arrow (camera-up)
    x.save(); x.translate(W / 2, W / 2); x.rotate(-(g.player.rot - g.cam.yaw)); x.fillStyle = '#fff'; x.strokeStyle = '#000'; x.lineWidth = 2; x.beginPath(); x.moveTo(0, -11); x.lineTo(8, 9); x.lineTo(0, 4); x.lineTo(-8, 9); x.closePath(); x.fill(); x.stroke(); x.restore();
    const c = $('#compass'); const a = -(g.cam.yaw + Math.PI) ; c.style.transform = `translate(-50%,0) translate(${Math.sin(a) * 0}px,0)`;
  }

  // ---------------------------------------------------------------- panels
  // ---------------------------------------------------------------- arrival banner, fades, world map
  arrive(place, first) {
    let b = document.getElementById('arrive'); if (!b) { b = document.createElement('div'); b.id = 'arrive'; document.body.appendChild(b); }
    b.innerHTML = `<div class="an">${esc(place.name)}</div><div class="as">${esc(place.banner || (place.minor ? 'A town of Fiore' : ''))}${first ? ' · <b>Discovered!</b>' : ''}</div>`;
    b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
    if (first) this.audio?.sfx('level');
  }
  fade(text, mid) {
    let f = document.getElementById('fade'); if (!f) { f = document.createElement('div'); f.id = 'fade'; document.body.appendChild(f); }
    f.textContent = text; f.classList.add('on'); this.closeWorldMap(); this.closePanel();
    setTimeout(() => { mid(); setTimeout(() => f.classList.remove('on'), 500); }, 900);
  }
  questMarkers() {
    const G = this.game.G; const out = [];
    const JZ = { j_puff: 'eastforest', j_boar: 'kardia', j_cat: 'kardia', j_wisp: 'oshibana', j_lullaby: 'canyon' };
    for (const a of G.jobs.active) { const j = JOBS.find((x) => x.id === a.id); const z = j && (j.zone || JZ[j.id]); if (z) out.push({ place: z, label: j.title }); }
    const q = G.quests;
    if (q.q_cake && q.q_cake.stage < 2) out.push({ place: 'eastforest', label: "Erza's Strawberry Cake" });
    if (q.q_lullaby && q.q_lullaby.stage === 2) out.push({ place: 'oshibana', label: 'The Lullaby Incident' });
    if (q.q_lullaby && q.q_lullaby.stage === 3) out.push({ place: 'canyon', label: 'The Lullaby Incident' });
    return out;
  }
  toggleWorldMap(opts) { if (this.wm && !this.wm.classList.contains('hidden')) this.closeWorldMap(); else this.openWorldMap(opts); }
  closeWorldMap() { if (this.wm) this.wm.classList.add('hidden'); this.wmOpts = null; }
  openWorldMap(opts = {}) {
    this.closePanel(); this.closeDialog(); this.wmOpts = opts;
    if (!this.wm) {
      const w = document.createElement('div'); w.id = 'worldmap'; w.className = 'hidden';
      w.innerHTML = `<div class="wm-frame"><header><div class="title">Kingdom of Fiore</div><button class="x" aria-label="Close">✕</button></header><div class="wm-body"><div class="wm-mapbox"><img class="wm-img" alt="Fiore map" src="${import.meta.env.BASE_URL}maps/fiore_parchment.jpg"><div class="wm-layer"></div></div><div class="wm-side"></div></div></div>`;
      document.body.appendChild(w); this.wm = w; w.querySelector('.x').onclick = () => this.closeWorldMap();
      w.addEventListener('click', (e) => { const b = e.target.closest('[data-travel]'); if (b) { e.stopPropagation(); this.game.travel(b.dataset.travel, b.dataset.kind); } });
    }
    this.wm.classList.remove('hidden'); this.renderWorldMap();
  }
  renderWorldMap() {
    const g = this.game, G = g.G; const layer = this.wm.querySelector('.wm-layer'); const side = this.wm.querySelector('.wm-side');
    const here = g.placeId && PLACE[g.placeId]; const atStation = here && here.station && (!this.wmOpts.mode || this.wmOpts.mode === 'train');
    const atPort = this.wmOpts.mode === 'boat' ? this.wmOpts.from : null;
    const pct = ([mx, my]) => `left:${mx / 1024 * 100}%;top:${my / 687 * 100}%`;
    let html = '';
    const marks = this.questMarkers(); const marked = new Set(marks.map((m) => m.place));
    for (const p of PLACES) {
      const known = G.discovered[p.id]; const printed = PRINTED.has(p.id); const cls = ['wm-pin', p.station ? 'st' : '', p.minor ? 'minor' : '', known ? 'known' : 'unknown', g.placeId === p.id ? 'here' : ''].join(' ');
      const label = g.placeId === p.id ? `<span>${esc(p.name)}</span>` : printed ? '' : `<span>${known ? esc(p.name) : '???'}</span>`;
      html += `<div class="${cls}" style="${pct(p.m)}" title="${esc(p.name)}"><i>${p.station ? '🚂' : p.island ? '🏝️' : p.id === 'hakobe' ? '🏔️' : p.minor ? '' : '●'}</i>${label}${marked.has(p.id) ? '<b class="qm">!</b>' : ''}</div>`;
    }
    const [mx, my] = toMap(g.player.pos.x, g.player.pos.z);
    html += `<div class="wm-me" style="${pct([mx, my])};transform:translate(-50%,-50%) rotate(${-g.player.rot + Math.PI}rad)">➤</div>`;
    layer.innerHTML = html;
    let s = `<div class="wm-where">📍 ${esc(g.zone || '')}</div>`;
    if (atPort && FERRY[atPort]) {
      s += `<div class="wm-h">⛵ Ferry from ${esc(PLACE[atPort].name)}</div>`;
      for (const d of FERRY[atPort]) s += `<button class="btn wm-go" data-travel="${d}" data-kind="boat">Sail to ${esc(PLACE[d].name)} <small>${FERRY_COST} J</small></button>`;
    } else {
      s += `<div class="wm-h">🚂 Magic Train</div>`;
      if (!atStation) s += `<div class="muted">Walk to a station platform (or any town with a 🚂) to ride.</div>`;
      for (const id of STATIONS) {
        const p = PLACE[id]; const known = G.discovered[id]; if (id === g.placeId) continue;
        const cost = trainCost(g.placeId || 'magnolia', id);
        s += known ? `<button class="btn wm-go" ${atStation ? '' : 'disabled'} data-travel="${id}" data-kind="train">${esc(p.station.label)} <small>${cost} J</small></button>` : `<div class="muted">??? (undiscovered)</div>`;
      }
      s += `<div class="muted small">Boats to Galuna and Tenrou leave from the Hargeon Port pier.</div>`;
    }
    if (marks.length) s += `<div class="wm-h">❗ Objectives</div>` + marks.map((m) => `<div class="small">${esc(m.label)}: <b>${esc(PLACE[m.place].name)}</b></div>`).join('');
    s += `<div class="muted small">Jewels: ${G.jewels.toLocaleString()}</div>`;
    side.innerHTML = s;
  }
  togglePanel(name) { if (this.panel === name) this.closePanel(); else this.openPanel(name); }
  openPanel(name, opts = {}) { this.closeDialog(); this.panel = name; this.popts = opts; this.sel = null; this.tab = opts.tab || this.tab0(name); this.el.panel.classList.remove('hidden'); this.renderPanel(); }
  tab0(name) { if (name === 'tree') return this.treeTab0(); return { shop: 'buy', quests: 'story', board: 'E' }[name] || null; }
  closePanel() { this.panel = null; this.el.panel.classList.add('hidden'); if (this.game) saveGame(this.game.G); }
  renderPanel() {
    const fn = this['p_' + this.panel]; if (!fn) return;
    const body = this.el.panel.querySelector('.body'); const st = body.scrollTop;
    const tabs = this.el.panel.querySelector('.tabs'); tabs.innerHTML = '';
    const { title, html, tabs: tl, bind } = fn.call(this);
    this.el.panel.querySelector('.title').innerHTML = title;
    if (tl) for (const [k, label] of tl) { const b = h('button', 'tab' + (this.tab === k ? ' on' : ''), label); b.onclick = () => { this.tab = k; this.sel = null; this.renderPanel(); }; tabs.appendChild(b); }
    tabs.classList.toggle('hidden', !tl);
    body.innerHTML = html; body.scrollTop = st;
    body.querySelectorAll('input[data-vol]').forEach((r) => { r.oninput = () => { const S = this.game.S; S[r.dataset.vol] = r.value / 100; this.audio?.applyVolume(); }; r.onchange = () => { saveSettings(this.game.S); this.sfx('ui'); }; });
    body.querySelectorAll('[data-act]').forEach((b) => { b.onclick = (e) => { e.stopPropagation(); this.act(b.dataset.act, b.dataset.arg, b.dataset.arg2); }; });
    if (bind) bind(body);
  }
  slotHTML(s, i, where, extra = '') {
    if (!s) return `<button class="slot" data-act="sel" data-arg="${where}" data-arg2="${i}"></button>`;
    const it = ITEMS[s.id]; const G = this.game.G; const eq = Object.values(G.equip).includes(s.id) && where === 'inv' ? '' : '';
    const sel = this.sel && this.sel.where === where && this.sel.i === i ? ' sel' : '';
    return `<button class="slot${sel}${eq}" data-act="sel" data-arg="${where}" data-arg2="${i}" title="${esc(it.name)}">${it.icon}${s.qty > 1 ? `<span class="q">${s.qty > 9999 ? Math.floor(s.qty / 1000) + 'k' : s.qty}</span>` : ''}${it.tier ? `<span class="t" style="background:${TIERS[it.tier].color}">${ROMAN[it.tier]}</span>` : ''}${extra}</button>`;
  }
  itemActions(where, i) {
    const G = this.game.G; const s = G[where][i]; if (!s) return ''; const it = ITEMS[s.id]; const acts = [];
    const mode = this.panel;
    if (mode === 'bank') acts.push(where === 'inv' ? ['deposit', 'Deposit'] : ['withdraw', 'Withdraw']);
    if (mode === 'bank' && it.stack && s.qty > 1) acts.push([where === 'inv' ? 'depositAll' : 'withdrawAll', where === 'inv' ? 'Deposit all' : 'Withdraw all']);
    if (mode === 'shop' && where === 'inv' && it.kind !== 'quest') { acts.push(['sell', `Sell 1 (💎${sellPrice(s.id)})`]); if (s.qty > 1) acts.push(['sellAll', `Sell all (💎${sellPrice(s.id) * s.qty})`]); }
    if (where === 'inv' && mode !== 'bank' && mode !== 'shop') {
      if (it.kind === 'weapon') { acts.push(['equip', 'Equip']); acts.push(['reserve', 'Set as Reserve']); }
      if (it.kind === 'armor') acts.push(['equip', 'Equip']);
      if (it.kind === 'lacrima') acts.push(['equip', 'Attune']);
      if (it.kind === 'consumable') acts.push(['use', 'Use']);
      if (it.kind !== 'quest') acts.push(['drop', 'Drop']);
    }
    return `<div class="iteminfo"><div class="nm">${it.icon} ${esc(it.name)}${s.qty > 1 ? ` ×${s.qty}` : ''}</div><div class="muted">${itemDesc(s.id)}</div><div class="acts">${acts.map(([a, l]) => `<button class="btn small${a === 'equip' ? ' gold' : ''}" data-act="${a}" data-arg="${where}" data-arg2="${i}">${l}</button>`).join('')}</div></div>`;
  }
  invGrid(where = 'inv') { const G = this.game.G; return `<div class="grid">${G[where].map((s, i) => this.slotHTML(s, i, where)).join('')}</div>`; }

  p_bag() {
    const G = this.game.G;
    return { title: `🎒 Bag <span class="muted">${INV_SIZE - freeSlots(G)}/${INV_SIZE} · 💎 ${fmt(G.jewels)}</span>`, html: this.invGrid() + (this.sel ? this.itemActions(this.sel.where, this.sel.i) : '<div class="muted" style="margin-top:8px">Tap an item for options. Stackable items share one slot.</div>') };
  }
  p_gear() {
    const g = this.game, G = g.G, d = derived(G);
    const slot = (k, label) => { const id = G.equip[k]; const it = id ? ITEMS[id] : null; return `<div class="row"><div class="ic">${it ? it.icon : '◻️'}</div><div class="grow"><div class="ds">${label}</div><div class="nm">${it ? esc(it.name) : '<span class="muted">Empty</span>'}</div>${it ? `<div class="ds">${itemDesc(id)}</div>` : ''}</div>${it ? `<button class="btn small" data-act="unequip" data-arg="${k}">Unequip</button>` : ''}</div>`; };
    const lo = g.loadout();
    const abl = lo.map((id, i) => id ? `<div class="row"><div class="ic">${ABILITIES[id].icon}</div><div class="grow"><div class="nm">${KEYS[i]}. ${esc(ABILITIES[id].name)}${g.abilityLocked(id) ? ' <span class="muted">(learn in Skill Tree)</span>' : ''}</div><div class="ds">${abilityDesc(id)}</div></div></div>` : '').join('');
    return { title: '🛡️ Equipment', html: `<div class="muted">You are what you wear: your weapon gives abilities 1–3, your lacrima's magic school gives 4–7 and your armour gives 8.</div>
      ${slot('weapon', 'Weapon')}${slot('weapon2', 'Reserve weapon (for Requip)')}${slot('armor', 'Armour')}${slot('lacrima', 'Lacrima (magic school)')}
      <div class="sec">Combat stats</div><div class="kv"><span>Max health</span><span>${d.maxHp}</span><span>Max mana</span><span>${d.maxMp}</span><span>Defence</span><span>${d.def}</span><span>Crit chance</span><span>${Math.round(d.crit * 100)}%</span><span>Cooldown reduction</span><span>${Math.round(d.cdr * 100)}%</span><span>Move speed</span><span>${d.speed.toFixed(1)}</span></div>
      <div class="sec">Ability bar</div>${abl}` };
  }
  treeTab0() { const G = this.game.G; const lac = G.equip.lacrima ? ITEMS[G.equip.lacrima].school : null; return lac || G.school; }
  p_tree() {
    const G = this.game.G; const tr = T.TREES[this.tab] || T.TREES[G.school];
    const tabs = Object.values(T.TREES).map((t) => [t.key, `${t.icon} ${t.name.split(' (')[0]}`]);
    const W = 3, rows = Math.max(...tr.nodes.map((n) => n.row)) + 1;
    const pos = (n) => [(n.col + 0.5) / W * 100, n.row * 92 + 46];
    const lines = tr.nodes.flatMap((n) => n.req.map(([r]) => { const a = pos(T.NODE[r]), b = pos(n); const ok = T.rankOf(G, r) > 0; return `<line x1="${a[0]}%" y1="${a[1]}" x2="${b[0]}%" y2="${b[1]}" stroke="${ok ? '#ffd76a' : '#6a5a7a'}" stroke-width="3" ${ok ? '' : 'stroke-dasharray="6 5"'}/>`; })).join('');
    const nodes = tr.nodes.map((n) => {
      const r = T.rankOf(G, n.id), why = T.canLearn(G, n.id); const [x, y] = pos(n);
      const cls = r >= n.max ? 'max' : r > 0 ? 'have' : why && why.startsWith('Needs') ? 'lock' : 'open';
      return `<button class="tnode ${n.kind} ${cls}${this.treeSel === n.id ? ' sel' : ''}" style="left:${x}%;top:${y}px" data-act="tsel" data-arg="${n.id}" title="${esc(n.name)}"><span class="ti">${n.icon}</span><span class="tr">${r}/${n.max}</span><span class="tn">${esc(n.name.replace(/^Open, Gate of the |^Requip: |^Ice-Make: /, ''))}</span></button>`;
    }).join('');
    const sel = T.NODE[this.treeSel] && T.NODE[this.treeSel].tree === tr.key ? T.NODE[this.treeSel] : null;
    let info = '<div class="muted">Tap a skill to see what it does. Gold lines are unlocked paths; dashed lines still need their prerequisite.</div>';
    if (sel) {
      const r = T.rankOf(G, sel.id), why = T.canLearn(G, sel.id);
      const req = sel.req.length ? sel.req.map(([q, k]) => `<span style="color:${T.rankOf(G, q) >= k ? '#7aff9a' : '#ff9a8a'}">${esc(T.NODE[q].name)}${T.NODE[q].max > 1 ? ' ' + k : ''}</span>`).join(', ') : 'none';
      info = `<div class="iteminfo"><div class="nm">${sel.icon} ${esc(sel.name)} <span class="muted">${sel.kind === 'active' ? 'Active skill' : 'Passive'} · rank ${r}/${sel.max}</span></div>
        <div class="ds">${sel.kind === 'active' ? abilityDesc(sel.ab) : esc(sel.desc)}</div><div class="ds">Requires: ${req}${sel.free ? ' · starter skill (free)' : ''}</div>
        <div class="acts"><button class="btn small gold" data-act="learn" data-arg="${sel.id}" ${why ? 'disabled' : ''}>${why ? esc(why) : r ? 'Rank up (1 SP)' : 'Learn (1 SP)'}</button></div></div>`;
    }
    const cost = G.respecs ? 50 * derived(G).level : 0;
    return { title: `🌳 Skill Tree <span class="muted">${T.pointsFree(G)} skill points</span>`, tabs, html: `
      <div class="muted" style="margin-bottom:6px">+1 skill point per level (Toram style). Actives go on your ability bar when the matching weapon or lacrima is equipped.</div>
      <div class="tree" style="height:${rows * 92}px"><svg width="100%" height="${rows * 92}">${lines}</svg>${nodes}</div>${info}
      <div style="margin-top:8px"><button class="btn small" data-act="respec">♻️ Respec${cost ? ` (💎${cost})` : ' (free once)'}</button></div>` };
  }
  p_stats() {
    const G = this.game.G, d = derived(G); const lvl = d.level; const a = charXpForLevel(lvl), b = charXpForLevel(lvl + 1);
    const rows = Object.keys(G.stats).map((k) => `<div class="statrow"><b>${k}</b><span class="muted">${STAT_INFO[k]}</span><span style="text-align:right;font-weight:800">${G.stats[k]}</span><button class="btn small gold" data-act="stat" data-arg="${k}" ${G.statPoints ? '' : 'disabled'}>+1</button></div>`).join('');
    const ranks = [...Object.entries(SCHOOLS).map(([k, s]) => [k, `${s.icon} ${s.name}`]), ...Object.entries(WEAPON_TYPES).map(([k, w]) => [k, `${w.icon} ${w.name}`])]
      .map(([k, n]) => { const r = classRank(G, k), x = G.ranks[k] || 0; const p = r >= 10 ? 1 : (x - RANK_XP[r]) / (RANK_XP[r + 1] - RANK_XP[r]); return `<div class="row"><div class="grow"><div class="nm">${n} <span class="muted">Rank ${r}</span></div><div class="bar gp"><i style="width:${p * 100}%"></i></div></div></div>`; }).join('');
    return { title: '⭐ Stats', html: `<div class="kv"><span>Level</span><span>${lvl}</span><span>Experience</span><span>${fmt(G.xp)} / ${fmt(b)}</span></div><div class="bar xp"><i style="width:${(G.xp - a) / (b - a) * 100}%"></i></div>
      <div class="sec">Stat points: <span style="color:#fff">${G.statPoints}</span> <span class="muted">(+3 per level, spend freely like Toram)</span></div>${rows}
      <div class="sec">Class ranks <span class="muted">(rank up by using a school or weapon; each rank adds +12% school power)</span></div>${ranks}` };
  }
  p_skills() {
    const G = this.game.G;
    const rows = Object.entries(SKILLS).map(([k, s]) => { const l = skillLevel(G, k); return `<div class="row"><div class="ic">${s.icon}</div><div class="grow"><div class="nm">${s.name} <span style="float:right">${l}/99</span></div><div class="bar xp"><i style="width:${progressToNext(G.skills[k]) * 100}%"></i></div><div class="ds">${fmt(G.skills[k])} XP${l < 99 ? ` · ${fmt(xpForLevel(l + 1) - G.skills[k])} to level ${l + 1}` : ''}</div></div></div>`; }).join('');
    return { title: `⛏️ Skills <span class="muted">Total ${totalLevel(G)}</span>`, html: rows + `<div class="muted" style="margin-top:8px">Gathering tiers: T1 at level 1, T2 at 10, T3 at 20. Refine at the forge and workbench in Magnolia.</div>` };
  }
  p_quests() {
    const G = this.game.G; const nx = nextGuildRank(G); const cur = GUILD_RANKS.find((r) => r.r === guildRank(G));
    const head = `<div class="row"><div class="rk ${guildRank(G)}">${guildRank(G)}</div><div class="grow"><div class="nm">Guild rank ${guildRank(G)} · ${G.qp} quest points</div><div class="bar gp"><i style="width:${nx ? (G.gp - cur.gp) / (nx.gp - cur.gp) * 100 : 100}%"></i></div><div class="ds">${G.gp} guild points${nx ? ` · ${nx.gp - G.gp} to rank ${nx.r}` : ' · max rank!'}</div></div></div>`;
    let html = head;
    if (this.tab === 'story') html += QUESTS.map((q) => { const s = P.questStatus(G, q.id); return `<div class="row"><div class="ic">${s === 'done' ? '✅' : s === 'active' ? '📜' : '❔'}</div><div class="grow"><div class="nm">${esc(q.name)} <span class="muted">${q.qp} QP</span></div><div class="ds">${s === 'new' ? `Start: talk to ${esc(NPCS[q.start].name.split(' (')[0])}` : s === 'done' ? 'Completed' : esc(P.stageText(G, q.id))}</div></div></div>`; }).join('');
    else html += G.jobs.active.length ? G.jobs.active.map((a) => { const j = P.JOB_BY_ID[a.id]; const r = P.jobReady(G, a); return `<div class="row"><div class="rk ${j.rank}">${j.rank}</div><div class="grow"><div class="nm">${esc(j.title)}</div><div class="ds">${esc(P.jobProgressText(G, a))}${r ? ' — <b style="color:#7aff9a">ready! Hand in to Mirajane</b>' : ''}</div></div><button class="btn small" data-act="abandon" data-arg="${a.id}">Abandon</button></div>`; }).join('') : '<div class="muted">No active jobs. Visit the request board in the Fairy Tail guild hall.</div>';
    return { title: '📜 Quests & Jobs', tabs: [['story', 'Story quests'], ['jobs', `Jobs (${G.jobs.active.length}/${P.MAX_ACTIVE_JOBS})`]], html };
  }
  p_board() {
    const G = this.game.G; const my = guildRank(G);
    const list = JOBS.filter((j) => j.rank === this.tab);
    const rows = list.map((j) => {
      const st = P.jobState(G, j.id); const why = P.canTakeJob(G, j); const rw = j.reward;
      const rewards = [`💎${rw.jewels}`, `+${rw.gp} GP`, `${rw.xp} XP`, ...Object.entries(rw.items || {}).map(([id, n]) => `${n}× ${ITEMS[id].name}`)].join(' · ');
      const btn = st.active ? (st.ready ? `<button class="btn small gold" data-act="turnin" data-arg="${j.id}">Hand in</button>` : `<span class="muted">${esc(P.jobProgressText(G, st.active))}</span>`)
        : st.doneToday ? '<span class="muted">Done today</span>' : `<button class="btn small" data-act="take" data-arg="${j.id}" ${why ? 'disabled' : ''} title="${esc(why || '')}">Take</button>`;
      return `<div class="row"><div class="rk ${j.rank}">${j.rank}</div><div class="grow"><div class="nm">${esc(j.title)} <span class="muted">${j.type}${j.daily ? ' · daily' : ''}</span></div><div class="ds">"${esc(j.desc)}" — ${esc(j.client)}</div><div class="reward">${rewards}</div>${why && !st.active && !st.doneToday ? `<div class="ds" style="color:#ff9a8a">${esc(why)}</div>` : ''}</div>${btn}</div>`;
    }).join('') || '<div class="muted">No requests at this rank.</div>';
    const ready = G.jobs.active.filter((a) => P.jobReady(G, a));
    const quick = ready.length ? `<div class="row" style="border-color:#7aff9a"><div class="ic">✅</div><div class="grow"><div class="nm">Ready to hand in</div><div class="ds">${ready.map((a) => esc(P.JOB_BY_ID[a.id].title)).join(', ')}</div></div><button class="btn small gold" data-act="turninAll">Hand in all</button></div>` : '';
    return { title: `📋 Request Board <span class="muted">Your rank <span class="rankbadge">${my}</span> · jobs ${G.jobs.active.length}/${P.MAX_ACTIVE_JOBS}</span>`, tabs: [...RANK_ORDER].map((r) => [r, `${r === 'S' ? 'S-Class' : r} (${JOBS.filter((j) => j.rank === r).length})`]), html: quick + rows };
  }
  p_bank() {
    const G = this.game.G; const used = G.bank.filter(Boolean).length;
    return { title: `🏦 Bank <span class="muted">${used}/${G.bank.length}</span>`, html: `<div class="acts" style="display:flex;gap:6px;margin-bottom:8px"><button class="btn small gold" data-act="depositBag">Deposit bag</button><button class="btn small" data-act="depositRes">Deposit materials</button></div><div class="sec">Bank</div>${this.invGrid('bank')}<div class="sec">Bag</div>${this.invGrid('inv')}${this.sel ? this.itemActions(this.sel.where, this.sel.i) : ''}` };
  }
  p_shop() {
    const G = this.game.G;
    let html;
    if (this.tab === 'buy') html = SHOP_LISTINGS.map((l) => { const it = ITEMS[l.id]; const p = buyPrice(l.id); const dr = drift(l.id); return `<div class="row"><div class="ic">${it.icon}</div><div class="grow"><div class="nm">${esc(it.name)}${it.tier ? ` <span style="color:${TIERS[it.tier].color}">T${it.tier}</span>` : ''}</div><div class="ds">Seller: ${esc(l.seller)} · <span style="color:${dr > 1 ? '#ff9a8a' : '#7aff9a'}">${dr > 1 ? '▲' : '▼'} ${Math.round(Math.abs(dr - 1) * 100)}% today</span></div><div class="ds">${itemDesc(l.id)}</div></div><button class="btn small gold" data-act="buy" data-arg="${l.id}" ${G.jewels < p ? 'disabled' : ''}>💎${fmt(p)}</button></div>`; }).join('');
    else html = this.invGrid() + (this.sel ? this.itemActions(this.sel.where, this.sel.i) : '<div class="muted" style="margin-top:8px">Tap an item to sell it. Prices drift daily.</div>');
    return { title: `🛒 Market Board <span class="muted">💎 ${fmt(G.jewels)}</span>`, tabs: [['buy', 'Buy'], ['sell', 'Sell']], html };
  }
  p_craft() {
    const G = this.game.G; const station = this.popts.station;
    const list = P.RECIPES.filter((r) => r.station === station);
    const groups = {}; for (const r of list) (groups[r.group] ||= []).push(r);
    let html = `<div class="muted">${station === 'forge' ? 'Refine ore into bars and smith weapons and plate. Trains Smithing.' : 'Refine wood, fibre and hide; craft bows, staves, knuckles, robes and jackets. Trains Crafting.'}</div>`;
    for (const [gname, rs] of Object.entries(groups)) {
      html += `<div class="sec">${gname}</div>`;
      html += rs.map((r) => {
        const [outId] = Object.keys(r.out); const it = ITEMS[outId]; const why = P.recipeBlock(G, r);
        const ins = Object.entries(r.in).map(([id, n]) => { const have = countItem(G, id); return `<span style="color:${have >= n ? '#b0f0a0' : '#ff9a8a'}">${ITEMS[id].icon} ${have}/${n} ${esc(ITEMS[id].name)}</span>`; }).join(' · ');
        const lvOk = skillLevel(G, r.skill) >= r.level;
        return `<div class="row"><div class="ic">${it.icon}</div><div class="grow"><div class="nm">${esc(it.name)}${r.out[outId] > 1 ? ` ×${r.out[outId]}` : ''} <span class="muted" style="color:${lvOk ? '' : '#ff9a8a'}">${SKILLS[r.skill].name} ${r.level} · ${Math.round(r.xp)} XP</span></div><div class="ds">${ins}</div></div><button class="btn small gold" data-act="craft" data-arg="${r.id}" ${why ? 'disabled' : ''} title="${esc(why || '')}">Make</button><button class="btn small" data-act="craftAll" data-arg="${r.id}" ${why ? 'disabled' : ''}>All</button></div>`;
      }).join('');
    }
    return { title: station === 'forge' ? '🔥 Forge & Anvil' : '🪚 Workbench', tabs: [['forge', 'Forge'], ['workbench', 'Workbench']].map(([k, l]) => [k, l]), html, bind: () => { this.el.panel.querySelectorAll('.tab').forEach((t, i) => { t.classList.toggle('on', ['forge', 'workbench'][i] === station); t.onclick = () => { this.popts.station = ['forge', 'workbench'][i]; this.renderPanel(); }; }); } };
  }
  p_settings() {
    const g = this.game, S = g.S, G = g.G;
    return { title: '⚙️ Settings', html: `
      <div class="row"><div class="grow"><div class="nm">Graphics quality</div><div class="ds">Low is the default and runs well on phones. High adds outlines, shadows, dense grass and sharper rendering (reloads).</div></div><div class="seg"><button data-act="quality" data-arg="low" class="${S.quality === 'low' ? 'on' : ''}">Low</button><button data-act="quality" data-arg="high" class="${S.quality === 'high' ? 'on' : ''}">High</button></div></div>
      <div class="row"><div class="grow"><div class="nm">Sound</div><div class="ds">${this.audio && this.audio.unlocked ? 'Music and effects are synthesised live in your browser.' : 'Tap anywhere to start audio (iPhone needs one tap).'}</div></div><div class="seg"><button data-act="mute" data-arg="0" class="${!S.mute ? 'on' : ''}">On</button><button data-act="mute" data-arg="1" class="${S.mute ? 'on' : ''}">Mute</button></div></div>
      ${[['vol', 'Master volume', 0.7], ['musicVol', 'Music', 0.5], ['sfxVol', 'Effects', 0.8]].map(([k, l, d]) => `<div class="row"><div class="grow"><div class="nm">${l}</div></div><input type="range" min="0" max="100" value="${Math.round((S[k] ?? d) * 100)}" data-vol="${k}" style="width:46%"></div>`).join('')}
      <div class="row"><div class="grow"><div class="nm">Auto-attack</div><div class="ds">Uses ability 1 automatically on your target when in range.</div></div><div class="seg"><button data-act="auto" data-arg="1" class="${g.autoAttack ? 'on' : ''}">On</button><button data-act="auto" data-arg="0" class="${!g.autoAttack ? 'on' : ''}">Off</button></div></div>
      <div class="row"><div class="grow"><div class="nm">Screen shake</div></div><div class="seg"><button data-act="shake" data-arg="1" class="${S.shake !== false ? 'on' : ''}">On</button><button data-act="shake" data-arg="0" class="${S.shake === false ? 'on' : ''}">Off</button></div></div>
      <div class="row"><div class="grow"><div class="nm">Controls</div><div class="ds">Auto picks touch or keyboard for your device.</div></div><div class="seg">${['auto', 'on', 'off'].map((v) => `<button data-act="touch" data-arg="${v}" class="${S.touch === v ? 'on' : ''}">${{ auto: 'Auto', on: 'Touch', off: 'Keys' }[v]}</button>`).join('')}</div></div>
      <div class="sec">Save</div>
      <div class="muted">The game autosaves to this device every 15 seconds and when you close a panel. Played ${Math.floor(G.playTime / 60)} min.</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin:8px 0"><button class="btn gold" data-act="save">💾 Save now</button><button class="btn" data-act="export">⬇️ Export save</button><button class="btn" data-act="importFile">⬆️ Import file</button><button class="btn" data-act="importText">📋 Import from text</button></div>
      <textarea id="savetext" placeholder="Exported save appears here (copy it somewhere safe), or paste a save to import."></textarea>
      <input type="file" id="savefile" accept=".json,application/json" class="hidden">
      <div class="sec">Danger zone</div><button class="btn" data-act="newchar">🗑️ Delete character and start over</button>
      <div class="sec">Controls</div><div class="muted">Keyboard: WASD move · drag mouse to turn camera · wheel zoom · click to move/attack/use · 1–8 abilities · E interact · Tab target · I bag · G gear · C stats · K skills · J quests · Esc close.<br>Touch: left stick moves · drag the world to turn · pinch to zoom · tap things to target or use them.</div>
      <div class="muted" style="margin-top:8px">Fairy Tail RPG v0.1 · single-player (online play is paused) · fan-made pitch prototype, not affiliated with Hiro Mashima, Kodansha or the Fairy Tail rights holders.</div>`,
      bind: (body) => { const f = body.querySelector('#savefile'); f.onchange = async () => { const file = f.files[0]; if (file) this.importSave(await file.text()); }; } };
  }
  importSave(txt) {
    try { const G = migrate(JSON.parse(txt)); localStorage.setItem(SAVE_KEY, JSON.stringify(G)); this.toast('Save imported! Reloading...'); this.game.noSave = true; setTimeout(() => location.reload(), 600); }
    catch (e) { this.toast('That is not a valid Fairy Tail save.'); }
  }

  act(a, arg, arg2) {
    const g = this.game, G = g.G; const idx = arg2 !== undefined ? Number(arg2) : null;
    const s = arg && idx !== null && G[arg] ? G[arg][idx] : null;
    switch (a) {
      case 'sel': this.sel = G[arg][idx] ? { where: arg, i: idx } : null; break;
      case 'equip': {
        const it = ITEMS[s.id]; const slot = it.kind === 'weapon' ? 'weapon' : it.kind === 'armor' ? 'armor' : 'lacrima';
        const old = G.equip[slot]; G.inv[idx] = null; if (old) addItem(G, old, 1); G.equip[slot] = s.id; this.sel = null;
        g.refreshGear(); this.log(`Equipped ${it.name}.`, 'info');
        if (slot === 'lacrima') this.toast(`${SCHOOLS[it.school].icon} Attuned to ${SCHOOLS[it.school].name}!`);
        break;
      }
      case 'reserve': { const old = G.equip.weapon2; G.inv[idx] = null; if (old) addItem(G, old, 1); G.equip.weapon2 = s.id; this.sel = null; this.log(`${ITEMS[s.id].name} set as your Requip reserve.`, 'info'); break; }
      case 'unequip': { const id = G.equip[arg]; if (!canAdd(G, id)) { this.toast('Bag full!'); break; } addItem(G, id, 1); G.equip[arg] = null; g.refreshGear(); break; }
      case 'use': { const it = ITEMS[s.id]; const d = derived(G); if (it.heal) G.hp = Math.min(d.maxHp, G.hp + it.heal); if (it.mana) G.mp = Math.min(d.maxMp, G.mp + it.mana); removeItem(G, s.id, 1); this.log(`You use the ${it.name}. ${it.id === 'stew' ? 'It is suspiciously good.' : 'Refreshing!'}`, 'info'); if (!G.inv[idx]) this.sel = null; break; }
      case 'drop': { this.log(`You drop ${s.qty > 1 ? s.qty + '× ' : ''}${ITEMS[s.id].name}.`, 'info'); G.inv[idx] = null; this.sel = null; break; }
      case 'deposit': case 'depositAll': { const n = a === 'depositAll' ? s.qty : 1; if (addItem(G, s.id, n, 'bank') < n) removeItem(G, s.id, n); else this.toast('Bank full!'); if (!G.inv[idx]) this.sel = null; break; }
      case 'withdraw': case 'withdrawAll': { const n = a === 'withdrawAll' ? s.qty : 1; const left = addItem(G, s.id, n); if (left < n) removeItem(G, s.id, n - left, 'bank'); else this.toast('Bag full!'); if (!G.bank[idx]) this.sel = null; break; }
      case 'depositBag': case 'depositRes': {
        for (let i = 0; i < G.inv.length; i++) { const x = G.inv[i]; if (!x) continue; const k = ITEMS[x.id].kind; if (a === 'depositRes' && !(k === 'resource' || k === 'refined')) continue; if (k === 'quest' || k === 'key') continue; if (addItem(G, x.id, x.qty, 'bank') === 0) G.inv[i] = null; }
        this.sel = null; this.log('Levy stores your items. The owl judges you silently.', 'npc'); break;
      }
      case 'sell': case 'sellAll': { const n = a === 'sellAll' ? s.qty : 1; const p = sellPrice(s.id) * n; removeItem(G, s.id, n); G.jewels += p; this.log(`Sold ${n}× ${ITEMS[s.id].name} for ${p} jewels.`, 'loot'); if (!G.inv[idx]) this.sel = null; break; }
      case 'buy': { const p = buyPrice(arg); if (G.jewels < p) { this.toast('Not enough jewels.'); break; } if (!canAdd(G, arg)) { this.toast('Bag full!'); break; } G.jewels -= p; addItem(G, arg, 1); this.log(`Bought ${ITEMS[arg].name} for ${p} jewels.`, 'loot'); P.questEvent(G, { type: 'item' }); break; }
      case 'craft': P.craft(G, P.RECIPES.find((r) => r.id === arg)); break;
      case 'craftAll': { const r = P.RECIPES.find((x) => x.id === arg); let n = 0; while (!P.recipeBlock(G, r) && n < 50) { P.craft(G, r); n++; } break; }
      case 'learn': if (T.learn(G, arg)) { this.log(`Learned ${T.NODE[arg].name} (rank ${T.rankOf(G, arg)}).`, 'lvl'); this.sfx('level'); } else this.toast(T.canLearn(G, arg)); this.treeSel = arg; break;
      case 'tsel': this.treeSel = arg; break;
      case 'respec': { const cost = G.respecs ? 50 * derived(G).level : 0; if (G.jewels < cost) { this.toast('Not enough jewels.'); break; } if (!confirm(`Reset all skill points${cost ? ` for ${cost} jewels` : ' (first reset is free)'}?`)) break; G.jewels -= cost; G.respecs = (G.respecs || 0) + 1; T.respec(G); this.log('Your skill points were refunded.', 'info'); break; }
      case 'stat': if (G.statPoints > 0) { G.statPoints--; G.stats[arg]++; } break;
      case 'take': if (P.takeJob(G, arg) && arg === 'j_cat') g.startEscort(); break;
      case 'turnin': P.turnInJob(G, arg); break;
      case 'turninAll': for (const x of [...G.jobs.active]) if (P.jobReady(G, x)) P.turnInJob(G, x.id); break;
      case 'abandon': P.abandonJob(G, arg); break;
      case 'quality': g.S.quality = arg; saveSettings(g.S); saveGame(G); location.reload(); return;
      case 'mute': g.S.mute = arg === '1'; saveSettings(g.S); this.audio?.unlock(); this.audio?.applyVolume(); break;
      case 'auto': g.autoAttack = arg === '1'; g.S.autoAttack = g.autoAttack; saveSettings(g.S); break;
      case 'shake': g.S.shake = arg === '1'; saveSettings(g.S); break;
      case 'touch': g.S.touch = arg; saveSettings(g.S); window.dispatchEvent(new Event('resize')); break;
      case 'save': saveGame(G); this.toast('💾 Saved!'); break;
      case 'export': {
        saveGame(G); const txt = JSON.stringify(G); const ta = $('#savetext'); ta.value = txt;
        const blob = new Blob([txt], { type: 'application/json' }); const url = URL.createObjectURL(blob); const link = h('a'); link.href = url; link.download = `fairytail-rpg-${G.name.replace(/\W+/g, '_')}.json`; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
        try { navigator.clipboard && navigator.clipboard.writeText(txt).catch(() => {}); } catch { /* ignore */ }
        this.toast('Save exported (file + text box).'); return;
      }
      case 'importFile': $('#savefile').click(); return;
      case 'importText': this.importSave($('#savetext').value); return;
      case 'newchar': if (confirm('Delete this character and start over? Export first if you want to keep it.')) { g.noSave = true; localStorage.removeItem(SAVE_KEY); location.reload(); } return;
    }
    this.game.refreshGear && 0; this.refresh(); this.renderPanel();
  }

  // ---------------------------------------------------------------- interactions & dialogue
  openInteract(it) {
    if (it.kind === 'npc') return this.openDialogue(it.npc);
    if (it.kind === 'board') return this.openPanel('board');
    if (it.kind === 'station') return this.openPanel('craft', { station: it.station });
    if (it.kind === 'shop') return this.openPanel('shop');
    if (it.kind === 'rail') return this.openWorldMap({ mode: 'train', from: it.place });
    if (it.kind === 'ferry') return this.openWorldMap({ mode: 'boat', from: it.place });
  }
  closeDialog() { this.el.dialog.classList.add('hidden'); this.dlg = null; }
  openDialogue(npcId) {
    if (npcId === 'erza' && this.game) this.game.requipNpc('erza');
    this.closePanel(); const G = this.game.G;
    const { lines, options } = P.npcDialogue(G, npcId);
    const role = NPCS[npcId].role; const svc = [];
    if (role === 'board') svc.push({ label: '📋 Open the request board', svc: () => this.openPanel('board') });
    if (role === 'bank') svc.push({ label: '🏦 Open my bank', svc: () => this.openPanel('bank') });
    if (role === 'shop') svc.push({ label: '🛒 Browse the market board', svc: () => this.openPanel('shop') });
    if (role === 'forge') { svc.push({ label: '🔥 Use the forge', svc: () => this.openPanel('craft', { station: 'forge' }) }); svc.push({ label: '🪚 Use the workbench', svc: () => this.openPanel('craft', { station: 'workbench' }) }); }
    if (role === 'inn') { svc.push({ label: '🛏️ Rest (10 jewels): full health & mana', svc: () => this.innRest() }); svc.push({ label: '🍲 Buy stew (30 jewels)', svc: () => this.innStew() }); }
    this.dlg = { npcId, queue: [...lines], options: [...options, ...svc] };
    this.el.dialog.classList.remove('hidden'); this.stepDialogue();
  }
  stepDialogue() {
    const D = this.dlg; if (!D) return; const el = this.el.dialog; const opts = el.querySelector('.opts'); opts.innerHTML = '';
    const line = D.queue.shift();
    if (line) { const [who, txt] = line; el.querySelector('.who').textContent = NPCS[who] ? NPCS[who].name : who; el.querySelector('.txt').textContent = txt; }
    if (D.queue.length) { el.querySelector('.more').textContent = 'Tap to continue ▸'; const b = h('button', 'btn', 'Continue ▸'); b.onclick = () => this.stepDialogue(); opts.appendChild(b); el.onclick = (e) => { if (e.target === el || e.target.classList.contains('txt')) this.stepDialogue(); }; return; }
    el.onclick = null; el.querySelector('.more').textContent = '';
    const list = D.pending || D.options;
    for (const o of list) {
      const b = h('button', 'btn' + (o.quest ? ' gold' : ''), esc(o.label));
      b.onclick = () => this.chooseOption(o); opts.appendChild(b);
    }
    const bye = h('button', 'btn', D.pending ? 'Maybe later' : 'Goodbye'); bye.onclick = () => { if (D.pending) { D.pending = null; this.stepDialogue(); } else this.closeDialog(); }; opts.appendChild(bye);
  }
  chooseOption(o) {
    const G = this.game.G; const D = this.dlg;
    if (o.svc) { this.closeDialog(); o.svc(); return; }
    if (o.kind === 'start') { const q = P.QUEST_BY_ID[o.quest]; D.queue = [...q.intro]; D.pending = [{ label: '✅ Accept quest', accept: o.quest }]; this.stepDialogue(); return; }
    if (o.accept) { P.startQuest(G, o.accept); D.pending = null; this.reopen(); return; }
    if (o.kind === 'advance') { const done = P.advance(G, o.quest); this.reopen(done); return; }
  }
  reopen(lines) {
    const id = this.dlg.npcId; const fresh = P.npcDialogue(this.game.G, id);
    this.openDialogue(id);
    if (lines && lines.length) { this.dlg.queue = [...lines]; this.stepDialogue(); }
  }
  innRest() { const G = this.game.G; if (G.jewels < 10) { this.toast('Not enough jewels.'); return; } G.jewels -= 10; const d = derived(G); G.hp = d.maxHp; G.mp = d.maxMp; this.log('You nap in a lumpy bed. Fully rested! Someone was singing in room 3.', 'npc'); this.toast('🛏️ Fully rested'); this.refresh(); }
  innStew() { const G = this.game.G; if (G.jewels < 30) { this.toast('Not enough jewels.'); return; } if (!canAdd(G, 'stew')) { this.toast('Bag full!'); return; } G.jewels -= 30; addItem(G, 'stew', 1); this.log('Wendy hands you a steaming bowl. "Do not ask what is in it."', 'npc'); this.refresh(); }
}
