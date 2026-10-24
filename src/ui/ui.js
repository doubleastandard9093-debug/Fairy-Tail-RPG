import * as T from '../data/skilltree.js';
import { SKILL_DEFS, SKILL_CATS, STATIONS as CRAFT_STATIONS, SYNERGIES, SETS, skillLinks, skillBonus, globalSkillFx, setTier } from '../data/skills.js';
import * as THREE from 'three';
import { ITEMS, WEAPON_TYPES, ARMOR_TYPES } from '../data/items.js';
import { TIERS, QUALITIES, ROMAN } from '../data/tiers.js';
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
import { BOSS_ARENA, BOSS_ARENAS } from '../data/mobs.js';
import { PARTY, unisonFor } from '../data/combos.js';
import { RANK_PERKS, MEMBERS, RIVALS } from '../data/guilds.js';
import { PLACES, PLACE, STATIONS, GW, GH, S as MAP_S, ORIGIN, toMap, biomeAt, mapHeight, ROADS, RAILS, FERRY, FERRY_COST, trainCost } from '../world/fiore.js';

const $ = (sel, root = document) => root.querySelector(sel);
const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = (n) => Math.round(n).toLocaleString();
const hash = (s) => { let x = 2166136261; for (const c of s) { x ^= c.charCodeAt(0); x = Math.imul(x, 16777619); } return ((x >>> 0) % 1000) / 1000; };
export const drift = (id) => 0.85 + 0.3 * hash(id + dayStamp());
let PG = null; export const setPriceG = (G) => { PG = G; }; // Bartering perks change prices
const gfx = () => (PG ? globalSkillFx(PG) : { sell: 0, buy: 0, travel: 0 });
export const buyPrice = (id) => Math.max(1, Math.round(ITEMS[id].value * BUY_MARKUP * drift(id) * (1 - gfx().buy)));
export const sellPrice = (id) => Math.max(1, Math.round(ITEMS[id].value * SELL_RATE * drift(id) * (1 + gfx().sell)));
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8'];

export function itemDesc(id) {
  const it = ITEMS[id]; if (!it) return '';
  const qq = it.q ? QUALITIES[it.q - 1] : null;
  const tier = (it.tier ? `<span style="color:${TIERS[it.tier].color}">T${it.tier} ${TIERS[it.tier].name}</span> · ` : '') + (qq && qq.q > 1 ? `<span style="color:${qq.color}">${qq.name}</span> · ` : '');
  if (it.kind === 'weapon') return `${tier}${WEAPON_TYPES[it.weaponType].name} · Power ×${it.power.toFixed(2)} · Scales with ${WEAPON_TYPES[it.weaponType].stat}<br><span class="muted">Abilities: ${WEAPON_ABILITIES[it.weaponType].map((a) => ABILITIES[a].name).join(', ')}</span>`;
  if (it.kind === 'armor') return `${tier}${it.requip ? '<b style="color:#ffd27a">Requip</b> ' : ''}${ARMOR_TYPES[it.armorType].name} · Defence ${it.def}${it.mp ? ` · +${it.mp} max mana` : ''}${it.fx ? ` · ${Object.entries(it.fx).map(([k, v]) => ({ dmgUp: `+${Math.round(v * 100)}% damage`, dr: `-${Math.round(v * 100)}% damage taken`, mpRegen: `+${v} mana/s` }[k])).join(', ')}` : ''}<br><span class="muted">Ability: ${ABILITIES[{ cloth: 'ar_meditate', leather: 'ar_roll', plate: 'ar_guard' }[it.armorType]].name}</span>`;
  if (it.kind === 'lacrima') { const s = SCHOOLS[it.school]; return `Attunes you to <b style="color:${s.color}">${s.name}</b>.<br><span class="muted">${s.blurb}</span>`; }
  if (it.kind === 'key') return 'A celestial gate key. Required to summon its spirit.';
  const bfx = (b) => Object.entries(b).filter(([k]) => k !== 'name' && k !== 'dur').map(([k, v]) => ({ dmgUp: `+${Math.round(v * 100)}% damage`, dr: `-${Math.round(v * 100)}% damage taken`, regen: `+${v} HP/s regen`, mpRegen: `+${v} mana/s`, gspeed: `-${Math.round(v * 100)}% gathering time`, allyUp: `+${Math.round(v * 100)}% summon power` }[k] || k)).join(', ');
  if (it.kind === 'consumable') { const pot = PG ? P.potencyOf(PG, it) : 1; return `${it.heal ? `Restores ${Math.round(it.heal * pot)} health. ` : ''}${it.mana ? `Restores ${Math.round(it.mana * pot)} mana. ` : ''}${it.buff ? `<br>${esc(it.buff.name)} (${Math.round(it.buff.dur / 60)} min): ${bfx(it.buff)}` : ''}${it.skill ? `<br><span class="muted">Made with ${SKILL_DEFS[it.skill].icon} ${SKILL_DEFS[it.skill].name}${pot > 1 ? ` · your potency +${Math.round((pot - 1) * 100)}%` : ''}</span>` : ''}`; }
  if (it.kind === 'tome') return `Study to gain ~${it.teachXp} ${SKILL_DEFS[it.teach].icon} ${SKILL_DEFS[it.teach].name} XP (more with Solid Script perks). Written with Solid Script.`;
  if (it.kind === 'food') return `${esc(it.desc || '')} Bond +${it.bond} Exceed XP.`;
  if (it.resType === 'fish') return `${tier}Fresh fish · Cook it, brew with it, or feed Happy (+${12 * it.tier * it.tier} Exceed XP).`;
  if (it.kind === 'quest') return 'Quest item.';
  return `${tier}${it.kind === 'refined' ? 'Refined material' : 'Raw material'} · worth ~${it.value} jewels`;
}
const PERKS_TXT = (ps) => ps.map((p) => `Lv${p.lv} ${p.desc}${p.on ? ' ✓' : ''}`).join('; ');
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
        <div id="orbs"><div class="orb hp"><div class="fill"></div><div class="v"></div></div><div class="orb mp"><div class="fill"></div><div class="v"></div></div><div class="orb adr"><div class="fill"></div><div class="v"></div></div><div class="orb uni hidden" title="Unison Raid (U)"><div class="fill"></div><div class="v"></div></div></div><div id="combo"></div>
        <div id="buffs"></div>
        <div id="mapwrap"><canvas id="minimap" width="344" height="344"></canvas><div id="compass">N</div><div id="zone"></div></div>
        <div id="target" class="frame hidden"><div class="nm"></div><div class="bar"><i></i></div><div class="fx"></div></div>
        <div id="boss" class="frame hidden"><div class="nm"></div><div class="bar"><i></i></div><div class="cast"></div></div>
        <div id="chat"></div>
        <div id="abar"></div>
        <div id="menu"></div>
        <button id="interact" class="hidden"></button>
        <div id="partyf" class="frame hidden"><div class="pnm"></div><div class="bar"><i></i></div><div class="ubar"><i></i></div><div class="pst"></div></div>
        <button id="emoteb" title="Fairy Tail sign (H)">☝️</button>
        <div id="gather" class="frame hidden"><div class="gn"></div><div class="bar"><i></i></div></div>
        <div id="joy"><div class="knob"></div></div>
        <div id="toasts"></div>
      </div>
      <div id="floaters"></div><div id="vignette"></div>
      <div id="panel" class="frame hidden"><header><div class="title"></div><button class="x" aria-label="Close">✕</button></header><div class="tabs"></div><div class="body"></div></div>
      <div id="dialog" class="frame hidden"><div class="who"></div><div class="txt"></div><div class="opts"></div><div class="more"></div></div>`);
    $('#emoteb').onclick = () => this.game && this.game.emote('salute');
    this.el = { partyf: $('#partyf'), hud: $('#hud'), plate: $('#plate'), orbs: $('#orbs'), chat: $('#chat'), abar: $('#abar'), menu: $('#menu'), interact: $('#interact'), gather: $('#gather'), toasts: $('#toasts'), floaters: $('#floaters'), vig: $('#vignette'), panel: $('#panel'), dialog: $('#dialog'), target: $('#target'), boss: $('#boss'), map: $('#minimap'), zone: $('#zone'), buffs: $('#buffs') };
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
  comboText(txt, big = false, uni = false) {
    const el = document.getElementById('combo'); if (!el) return; el.textContent = txt; el.className = (big ? 'big' : '') + (uni ? ' uni' : ''); void el.offsetWidth; el.classList.add('show');
    clearTimeout(this.comboT); this.comboT = setTimeout(() => el.classList.remove('show'), big ? 2200 : 900);
  }
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
    if (G.jewels !== this.lastJw) { const up = this.lastJw !== undefined && G.jewels > this.lastJw; this.lastJw = G.jewels; this.renderPlate(); if (up) { const j = this.el.plate.querySelector('.jw'); j && j.classList.remove('pop'); void (j && j.offsetWidth); j && j.classList.add('pop'); } }
    { const pf = this.el.partyf, pt = g.magic && g.magic.partner(); pf.classList.toggle('hidden', !pt);
      if (pt) { pf.querySelector('.pnm').textContent = pt.tpl.name.replace(' (party)', ''); pf.querySelector('.bar i').style.width = (pt.hp / pt.maxHp * 100) + '%'; const u = g.magic.unison; pf.querySelector('.ubar i').style.width = u + '%';
        pf.classList.toggle('ready', u >= 100); pf.classList.toggle('down', !!pt.downed); pf.querySelector('.pst').textContent = pt.downed ? `💫 Down — revive! (${Math.ceil(pt.downT)}s)` : u >= 100 ? '⚡ UNISON READY (U)' : `Unison ${Math.floor(u)}%`; } }
    if (this.dirty) { this.dirty = false; this.renderPlate(); this.renderAbilities(); if (this.panel) this.renderPanel(); this.renderMenuDots(); }
    // orbs
    const orb = (el, v, max, label) => { el.querySelector('.fill').style.height = Math.max(0, Math.min(100, v / max * 100)) + '%'; el.querySelector('.v').innerHTML = `${Math.max(0, Math.ceil(v))}<small>${label}</small>`; };
    const [oh, om, oa] = this.el.orbs.children; orb(oh, G.hp, d.maxHp, 'HP'); orb(om, G.mp, d.maxMp, 'MP'); orb(oa, G.adr, 100, '%');
    const ou = this.el.orbs.children[3]; if (ou) { const on = !!G.party; ou.classList.toggle('hidden', !on); if (on) { const u = g.magic.unison; ou.querySelector('.fill').style.height = u + '%'; ou.querySelector('.v').innerHTML = u >= 100 ? 'U<small>RAID!</small>' : `${Math.floor(u)}<small>UNISON</small>`; ou.classList.toggle('ready', u >= 100); if (!ou.onclick) ou.onclick = () => g.magic.unisonRaid(); } }
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
    if (it) { const verb = it.kind === 'npc' ? 'Talk to' : it.kind === 'rail' ? 'Board the train at' : it.kind === 'ferry' ? 'Board the' : it.kind === 'revive' ? 'Revive' : it.kind === 'node' ? { ore: 'Mine', wood: 'Chop', fibre: 'Pick' }[it.type] : 'Use'; const label = `<span class="key">E</span>${verb} ${esc(it.name.split(' (')[0])}`; if (ib.innerHTML !== label) ib.innerHTML = label; ib.classList.remove('hidden'); }
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
    for (const A of Object.values(BOSS_ARENAS)) { x.fillStyle = A.floor; x.beginPath(); x.arc(toX(A.x), toY(A.z), A.r / cell, 0, 7); x.fill(); }
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
  rideBar(kind, dest) {
    let b = document.getElementById('ridebar'); if (!b) { b = document.createElement('div'); b.id = 'ridebar'; b.style.cssText = 'position:fixed;left:50%;top:70px;transform:translateX(-50%);z-index:40;background:rgba(30,18,40,.88);border:1px solid #c8a040;border-radius:12px;padding:8px 14px;color:#ffe8c0;font-weight:700;display:flex;gap:12px;align-items:center'; document.body.appendChild(b); }
    if (!kind) { b.style.display = 'none'; return; }
    const p = PLACE[dest]; b.innerHTML = `<span>${kind === 'boat' ? '⛵ Sailing to ' + esc(p.name) : '🚂 Riding to ' + esc(p.station.label)}</span><button class="btn small gold" id="ride-skip">Skip ⏩</button>`; b.style.display = 'flex';
    b.querySelector('#ride-skip').onclick = () => this.game.transit.skip();
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
      for (const d of FERRY[atPort]) s += `<button class="btn wm-go" data-travel="${d}" data-kind="boat">Sail to ${esc(PLACE[d].name)} <small>${Math.round(FERRY_COST * (1 - gfx().travel))} J</small></button>`;
    } else {
      s += `<div class="wm-h">🚂 Magic Train</div>`;
      if (!atStation) s += `<div class="muted">Walk to a station platform (or any town with a 🚂) to ride.</div>`;
      for (const id of STATIONS) {
        const p = PLACE[id]; const known = G.discovered[id]; if (id === g.placeId) continue;
        const cost = Math.round(trainCost(g.placeId || 'magnolia', id) * (1 - gfx().travel));
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
  tab0(name) { if (name === 'tree') return this.treeTab0(); if (name === 'craft') return this.popts.station || 'forge'; if (name === 'skills') return 'list'; return { shop: 'buy', quests: 'story', board: 'E' }[name] || null; }
  closePanel() { this.panel = null; this.el.panel.classList.add('hidden'); if (this.game) saveGame(this.game.G); }
  renderPanel() {
    const fn = this['p_' + this.panel]; if (!fn) return; if (this.game) setPriceG(this.game.G);
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
      if (it.kind === 'tome') acts.push(['use', 'Study']);
      if (it.kind === 'food' || it.resType === 'fish') acts.push(['feed', 'Feed Happy 🐱']);
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
        <div class="acts"><button class="btn small gold" data-act="learn" data-arg="${sel.id}" ${why ? 'disabled' : ''}>${why ? esc(why) : r ? `Rank up (1 ${sel.tree === 'artisan' ? 'AP' : 'SP'})` : `Learn (1 ${sel.tree === 'artisan' ? 'AP' : 'SP'})`}</button></div></div>`;
    }
    const cost = G.respecs ? 50 * derived(G).level : 0;
    const art = tr.key === 'artisan';
    return { title: `🌳 Skill Tree <span class="muted">${art ? `${T.pointsFree(G, true)} artisan points` : `${T.pointsFree(G)} skill points`}</span>`, tabs, html: `
      <div class="muted" style="margin-bottom:6px">${art ? 'Artisan points: 1 per 5 total gathering + crafting levels (Albion Destiny Board style). They never mix with combat skill points and survive respecs.' : '+1 skill point per level (Toram style). Actives go on your ability bar when the matching weapon or lacrima is equipped.'}</div>
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
    const G = this.game.G; const sel = this.skillSel && SKILLS[this.skillSel] ? this.skillSel : null;
    const pct = (v) => `${Math.round(v * 100)}%`;
    const bonusChips = (k) => { const b = skillBonus(G, k); return [['xp', '+', 'XP'], ['yield', '+', 'bonus'], ['speed', '-', 'time'], ['save', '+', 'saved'], ['quality', '+', 'quality'], ['potency', '+', 'potency']].filter(([f]) => b[f] > 0.0001).map(([f, sg, l]) => `<span class="chip">${sg}${pct(b[f])} ${l}</span>`).join(''); };
    const tabs = [['list', '⛏️ Skills'], ['web', '🔗 Synergy Web'], ['sets', '🏅 Skill Sets']];
    const detail = (k) => {
      const d = SKILL_DEFS[k], L = skillLevel(G, k), ln = skillLinks(G, k);
      const st = d.station; const recs = P.RECIPES.filter((r) => r.skill === k).sort((a, b) => a.level - b.level);
      const unlocks = recs.filter((r) => r.level > L).slice(0, 5).map((r) => `<span class="chip lock">Lv ${r.level}: ${ITEMS[Object.keys(r.out)[0]].icon} ${esc(ITEMS[Object.keys(r.out)[0]].name)}</span>`).join('') || '<span class="muted">All recipes unlocked.</span>';
      const li = (on, txt) => `<div class="syn ${on ? 'on' : ''}">${on ? '✅' : '🔒'} ${txt}</div>`;
      return `<div class="iteminfo skilldetail"><div class="nm">${d.icon} ${esc(d.name)} <span class="muted">Level ${L} · ${SKILL_CATS[d.cat]}</span></div><div class="ds">${esc(d.desc)}</div>
        ${st ? `<div class="ds">Station: ${CRAFT_STATIONS[st].icon} ${CRAFT_STATIONS[st].name} (Magnolia workshop, south-west of the guild)</div>` : ''}
        <div class="ds">Active bonuses: ${bonusChips(k) || '<span class="muted">none yet</span>'}</div>
        <div class="sec">Milestone perks</div>${ln.perks.map((p) => li(p.on, `Lv ${p.lv} · ${esc(p.desc)}`)).join('') || '<div class="muted">—</div>'}
        <div class="sec">Boosted by</div>${ln.incoming.map((x) => li(x.on, `${SKILLS[x.from].icon} ${SKILLS[x.from].name} ${x.lv} → ${esc(x.desc)}`)).join('') || '<div class="muted">—</div>'}
        <div class="sec">Boosts</div>${ln.outgoing.map((x) => li(x.on, `Lv ${x.lv} → ${SKILLS[x.to] ? SKILLS[x.to].icon + ' ' + SKILLS[x.to].name : 'all ' + x.to}: ${esc(x.desc)}`)).join('') || '<div class="muted">—</div>'}
        <div class="sec">Skill sets</div>${ln.sets.map((x) => `<div class="syn ${x.tier ? 'on' : ''}">${x.icon} ${esc(x.name)} · tier ${x.tier}/3 · ${x.skills.map((m) => SKILLS[m].icon).join('')}</div>`).join('') || '<div class="muted">—</div>'}
        ${recs.length ? `<div class="sec">Next unlocks</div><div>${unlocks}</div>` : ''}
        ${k === 'exceed' ? `<div class="acts" style="margin-top:6px"><button class="btn small gold" data-act="feedHappy">🐟 Feed Happy (best food in bag)</button> <span class="muted">Bonded ${G.bond || 0} times</span></div>` : ''}</div>`;
    };
    let html = '';
    if (this.tab === 'web') {
      const keys = Object.keys(SKILLS); const n = keys.length; const W = 360, C = 180, Rr = 140; const pos = {};
      keys.forEach((k, i) => { const a = -Math.PI / 2 + (i / n) * Math.PI * 2; pos[k] = [C + Math.cos(a) * Rr, C + Math.sin(a) * Rr]; });
      const catCol = { gathering: '#7ad07a', production: '#e0a060', arcane: '#a08aff', support: '#60c8e8' };
      let lines = '';
      for (const sy of SYNERGIES) {
        const tos = SKILLS[sy.to] ? [sy.to] : keys.filter((k) => SKILL_DEFS[k].cat === sy.to);
        const on = skillLevel(G, sy.from) >= sy.lv; const hi = sel && (sy.from === sel || tos.includes(sel));
        for (const t of tos) { const [x1, y1] = pos[sy.from], [x2, y2] = pos[t]; const mx = (x1 + x2) / 2 + (C - (x1 + x2) / 2) * 0.35, my = (y1 + y2) / 2 + (C - (y1 + y2) / 2) * 0.35;
          lines += `<path d="M${x1},${y1} Q${mx},${my} ${x2},${y2}" fill="none" stroke="${on ? '#ffd27a' : '#6a6a80'}" stroke-width="${hi ? 2.6 : tos.length > 1 ? 0.8 : 1.4}" ${on ? '' : 'stroke-dasharray="4 3"'} opacity="${sel && !hi ? 0.15 : 0.9}" marker-end="url(#arw${on ? 1 : 0})"><title>${esc(SKILLS[sy.from].name)} ${sy.lv} → ${esc(sy.desc)}</title></path>`; }
      }
      const nodes = keys.map((k) => { const [x, y] = pos[k]; const L = skillLevel(G, k); return `<g class="wnode" data-act="ssel" data-arg="${k}" style="cursor:pointer"><title>${esc(SKILL_DEFS[k].name)} ${L} — ${esc(SKILL_DEFS[k].desc)}</title><circle cx="${x}" cy="${y}" r="${k === sel ? 19 : 16}" fill="#1a1830" stroke="${catCol[SKILL_DEFS[k].cat]}" stroke-width="${k === sel ? 3.5 : 2}"/><text x="${x}" y="${y + 5}" text-anchor="middle" font-size="15">${SKILL_DEFS[k].icon}</text><text x="${x}" y="${y + 29}" text-anchor="middle" font-size="9" fill="#e8e0ff">${esc(SKILL_DEFS[k].name.split(' ')[0])} ${L}</text></g>`; }).join('');
      html = `<div class="muted">Every gold line is an active synergy (levelling the source skill boosts the target). Dashed lines are still locked. Tap a skill to highlight its links.</div>
        <svg viewBox="0 0 ${W} ${W + 10}" class="synweb" style="width:100%;max-width:520px;display:block;margin:6px auto"><defs>${[0, 1].map((o) => `<marker id="arw${o}" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="${o ? '#ffd27a' : '#6a6a80'}"/></marker>`).join('')}</defs>${lines}${nodes}</svg>
        <div class="legend muted">${Object.entries(SKILL_CATS).map(([c, l]) => `<span style="color:${catCol[c]}">● ${l}</span>`).join(' · ')}</div>${sel ? detail(sel) : ''}`;
    } else if (this.tab === 'sets') {
      html = '<div class="muted">Raise every skill in a set to 10 / 25 / 40 to unlock its tiers. Tiers stack.</div>' + SETS.map((st) => { const t = setTier(G, st); const lo = Math.min(...st.skills.map((k) => skillLevel(G, k))); const nx = st.tiers[t];
        return `<div class="row setcard ${t ? 'on' : ''}"><div class="ic">${st.icon}</div><div class="grow"><div class="nm">${esc(st.name)} <span style="float:right">Tier ${t}/3</span></div><div class="ds">${st.skills.map((k) => `<span class="chip" data-act="ssel" data-arg="${k}" title="${esc(SKILL_DEFS[k].name)}">${SKILL_DEFS[k].icon} ${skillLevel(G, k)}</span>`).join('')}</div><div class="bar xp"><i style="width:${nx ? Math.min(100, (lo / nx) * 100) : 100}%"></i></div><div class="ds">${esc(st.desc)}${nx ? ` · next tier when all reach ${nx}` : ' · maxed!'}</div></div></div>`; }).join('') + (sel ? detail(sel) : '');
    } else {
      for (const [c, label] of Object.entries(SKILL_CATS)) {
        html += `<div class="sec">${label}</div>`;
        html += Object.entries(SKILLS).filter(([, d]) => d.cat === c).map(([k, d]) => { const l = skillLevel(G, k); const ln = skillLinks(G, k); const act = ln.incoming.filter((x) => x.on).length + ln.perks.filter((x) => x.on).length;
          const tip = `${d.name}: ${d.desc} | Perks: ${(PERKS_TXT(ln.perks))} | Synergies in: ${ln.incoming.length}, out: ${ln.outgoing.length}`;
          return `<div class="row skrow${k === sel ? ' on' : ''}" data-act="ssel" data-arg="${k}" title="${esc(tip)}" style="cursor:pointer"><div class="ic">${d.icon}</div><div class="grow"><div class="nm">${esc(d.name)} <span style="float:right">${l}/99</span></div><div class="bar xp"><i style="width:${progressToNext(G.skills[k] || 0) * 100}%"></i></div><div class="ds">${fmt(G.skills[k] || 0)} XP${l < 99 ? ` · ${fmt(xpForLevel(l + 1) - (G.skills[k] || 0))} to ${l + 1}` : ''} · 🔗 ${act} active ${bonusChips(k)}</div></div></div>${k === sel ? detail(k) : ''}`; }).join('');
      }
      html += `<div class="muted" style="margin-top:8px">Tap a skill for perks, synergies and unlocks. Gathering tiers: T1 at 1, T2 at 10, T3 at 20, T4 at 30, T5 at 40. Crafting stations are in Magnolia (Forge pavilion + Arcane Workshop).</div>`;
    }
    return { title: `⛏️ Skills <span class="muted">Total ${totalLevel(G)} · ${SYNERGIES.filter((x) => skillLevel(G, x.from) >= x.lv).length}/${SYNERGIES.length} synergies</span>`, tabs, html };
  }

  p_quests() {
    const G = this.game.G; const nx = nextGuildRank(G); const cur = GUILD_RANKS.find((r) => r.r === guildRank(G));
    const head = `<div class="row"><div class="rk ${guildRank(G)}">${guildRank(G)}</div><div class="grow"><div class="nm">Guild rank ${guildRank(G)} · ${G.qp} quest points</div><div class="bar gp"><i style="width:${nx ? (G.gp - cur.gp) / (nx.gp - cur.gp) * 100 : 100}%"></i></div><div class="ds">${G.gp} guild points${nx ? ` · ${nx.gp - G.gp} to rank ${nx.r}` : ' · max rank!'}</div></div></div>`;
    let html = head;
    if (this.tab === 'story') html += QUESTS.map((q) => { const s = P.questStatus(G, q.id); return `<div class="row"><div class="ic">${s === 'done' ? '✅' : s === 'active' ? '📜' : '❔'}</div><div class="grow"><div class="nm">${esc(q.name)} <span class="muted">${q.qp} QP</span></div><div class="ds">${s === 'new' ? `Start: talk to ${esc(NPCS[q.start].name.split(' (')[0])}` : s === 'done' ? 'Completed' : esc(P.stageText(G, q.id))}</div></div></div>`; }).join('');
    else html += G.jobs.active.length ? G.jobs.active.map((a) => { const j = P.JOB_BY_ID[a.id]; const r = P.jobReady(G, a); return `<div class="row"><div class="rk ${j.rank}">${j.rank}</div><div class="grow"><div class="nm">${esc(j.title)}</div><div class="ds">${esc(P.jobProgressText(G, a))}${r ? ' — <b style="color:#7aff9a">ready! Hand in to Mirajane</b>' : ''}</div></div><button class="btn small" data-act="abandon" data-arg="${a.id}">Abandon</button></div>`; }).join('') : '<div class="muted">No active jobs. Visit the request board in the Fairy Tail guild hall.</div>';
    return { title: '📜 Quests & Jobs', tabs: [['story', 'Story quests'], ['jobs', `Jobs (${G.jobs.active.length}/${P.maxJobs(G)})`]], html };
  }
  p_board() {
    const G = this.game.G; const my = guildRank(G);
    const tabs = [...RANK_ORDER].map((r) => [r, `${r === 'S' ? 'S-Class' : r} (${JOBS.filter((j) => j.rank === r).length})`]); tabs.push(['guild', '🛡️ Guild']);
    const title = `📋 Request Board <span class="muted">Your rank <span class="rankbadge">${my}</span>${G.sclass ? ' <span class="rankbadge s">S-Class</span>' : ''} · jobs ${G.jobs.active.length}/${P.maxJobs(G)}</span>`;
    if (this.tab === 'guild') return { title, tabs, html: this.guildCard() };
    const list = JOBS.filter((j) => j.rank === this.tab);
    const rows = list.map((j) => {
      const st = P.jobState(G, j.id); const why = P.canTakeJob(G, j); const rw = j.reward;
      const rewards = [`💎${rw.jewels}`, `+${rw.gp} GP`, `${rw.xp} XP`, ...Object.entries(rw.items || {}).map(([id, n]) => `${n}× ${ITEMS[id].name}`)].join(' · ');
      const R = j.rival && RIVALS[j.rival];
      const timer = st.active && st.active.left != null && !st.ready ? ` · <b style="color:#ffb080">${R.icon} ${Math.floor(st.active.left / 60)}:${String(Math.floor(st.active.left % 60)).padStart(2, '0')} left</b>` : '';
      const btn = st.active ? (st.ready ? `<button class="btn small gold" data-act="turnin" data-arg="${j.id}">Hand in</button>` : `<span class="muted">${esc(P.jobProgressText(G, st.active))}${timer}</span>`)
        : st.doneToday ? '<span class="muted">Done today</span>' : `<button class="btn small" data-act="take" data-arg="${j.id}" ${why ? 'disabled' : ''} title="${esc(why || '')}">Take</button>`;
      const tag = j.sclass ? '<span class="tag s">S-CLASS</span>' : j.trial ? '<span class="tag trial">TRIAL</span>' : R ? `<span class="tag rv" style="background:${R.color}">${R.icon} vs ${esc(R.name)}</span>` : '';
      return `<div class="row${j.sclass ? ' srow' : ''}"><div class="rk ${j.rank}">${j.rank}</div><div class="grow"><div class="nm">${tag}${esc(j.title)} <span class="muted">${j.type}${j.daily ? ' · daily' : ''}</span></div><div class="ds">"${esc(j.desc)}" — ${esc(j.client)}</div><div class="reward">${rewards}</div>${why && !st.active && !st.doneToday ? `<div class="ds" style="color:#ff9a8a">${esc(why)}</div>` : ''}</div>${btn}</div>`;
    }).join('') || '<div class="muted">No requests at this rank.</div>';
    const ready = G.jobs.active.filter((a) => P.jobReady(G, a));
    const quick = ready.length ? `<div class="row" style="border-color:#7aff9a"><div class="ic">✅</div><div class="grow"><div class="nm">Ready to hand in</div><div class="ds">${ready.map((a) => esc(P.JOB_BY_ID[a.id].title)).join(', ')}</div></div><button class="btn small gold" data-act="turninAll">Hand in all</button></div>` : '';
    const sInfo = this.tab === 'S' ? `<div class="row srow"><div class="ic">⭐</div><div class="grow"><div class="nm">The S-Class board (second floor)</div><div class="ds">${G.sclass ? 'You are an S-Class wizard. Mirajane hands you the key to the upstairs board with a smile that is only slightly terrifying.' : 'Only S-Class wizards may take these. Reach guild rank A, then take the S-Class Promotion Trial (A tab) on Tenrou Island.'}</div></div></div>` : '';
    const rvInfo = this.tab !== 'S' && list.some((j) => j.rival) ? '<div class="muted" style="margin:4px 0">Contested jobs: a rival guild takes the same request. Finish the objective within 10 minutes of play or they claim it, and their fame grows.</div>' : '';
    return { title, tabs, html: quick + sInfo + rvInfo + rows };
  }
  guildCard() {
    const G = this.game.G; const my = guildRank(G); const perk = RANK_PERKS[my]; const nx = nextGuildRank(G);
    const ranks = [...RANK_ORDER].map((r) => `<div class="rkstep${r === my ? ' on' : ''}${RANK_ORDER.indexOf(r) < RANK_ORDER.indexOf(my) ? ' done' : ''}"><div class="rk ${r}">${r}</div><div class="ds">${esc(RANK_PERKS[r].perk)}</div></div>`).join('');
    const me = { name: `${G.name} (you)`, rank: G.sclass ? 'S' : my, gp: G.gp, note: perk.title, you: true };
    const board = [...MEMBERS, me].sort((a, b) => b.gp - a.gp).map((m, i) => `<div class="row lb${m.you ? ' you' : ''}"><div class="ic">${i + 1}</div><div class="rk ${m.rank}">${m.rank}</div><div class="grow"><div class="nm">${esc(m.name)}</div><div class="ds">${esc(m.note)}</div></div><div class="muted">${m.gp} GP</div></div>`).join('');
    const stand = P.guildStandings(G);
    const top = stand[0].fame;
    const rivals = stand.map((r, i) => `<div class="row lb${r.you ? ' you' : ''}"><div class="ic">${i + 1}</div><div class="ic">${r.icon}</div><div class="grow"><div class="nm" style="color:${r.color === '#4a3a6a' ? '#b8a0ff' : r.color}">${esc(r.name)}</div><div class="bar"><i style="width:${(r.fame / top) * 100}%;background:${r.color}"></i></div><div class="ds">${r.you ? `Contests won: ${G.contestWins || 0}` : `${esc(RIVALS[r.id].blurb)} · contests: you ${r.losses}–${r.wins} them`}</div></div><div class="muted">${r.fame} fame</div></div>`).join('');
    return `<div class="sec">Guild card</div><div class="row guildcard"><div class="rk ${G.sclass ? 'S' : my}">${G.sclass ? 'S' : my}</div><div class="grow"><div class="nm">${esc(G.name)} · ${G.sclass ? 'S-Class Wizard' : esc(perk.title)}</div><div class="ds">${G.gp} guild points${nx ? ` · ${nx.gp - G.gp} to rank ${nx.r}` : ''} · ${G.jobs.completed} jobs done · carry ${P.maxJobs(G)} at once</div></div></div>
      <div class="sec">Ranks</div><div class="rksteps">${ranks}</div>
      <div class="sec">Fairy Tail member standings</div>${board}
      <div class="sec">Fiore guild standings (rivalries)</div>${rivals}`;
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
    const G = this.game.G; const station = CRAFT_STATIONS[this.tab] ? this.tab : (this.popts.station || 'forge');
    const list = P.RECIPES.filter((r) => r.station === station);
    const groups = {}; for (const r of list) (groups[r.group] ||= []).push(r);
    const SD = CRAFT_STATIONS[station]; const sk = SKILL_DEFS[SD.skill];
    let html = station !== 'forge' && station !== 'workbench' ? `<div class="muted">${sk.icon} ${esc(sk.desc)} Trains ${esc(sk.name)}. <span class="chip">${Object.entries(skillBonus(G, SD.skill)).filter(([, v]) => v > 0).map(([k2, v]) => `${k2} +${Math.round(v * 100)}%`).join(' · ') || 'no bonuses yet'}</span></div>` : `<div class="muted">${station === 'forge' ? 'Refine ore into bars and smith weapons and plate. Trains Smithing.' : 'Refine wood, fibre and hide; craft bows, staves, knuckles, robes and jackets. Trains Crafting.'}</div><div class="muted">Refining T2+ also needs one refined piece of the tier below. Gear rolls a quality (Normal → Masterpiece): out-level the recipe and train the 🛠️ Artisan tree for better odds. T4–T5 gear binds Lacrima Shards.</div>`;
    for (const [gname, rs] of Object.entries(groups)) {
      html += `<div class="sec">${gname}</div>`;
      html += rs.map((r) => {
        const [outId] = Object.keys(r.out); const it = ITEMS[outId]; const why = P.recipeBlock(G, r);
        const ins = Object.entries(r.in).map(([id, n]) => { const have = countItem(G, id); return `<span style="color:${have >= n ? '#b0f0a0' : '#ff9a8a'}">${ITEMS[id].icon} ${have}/${n} ${esc(ITEMS[id].name)}</span>`; }).join(' · ');
        const lvOk = skillLevel(G, r.skill) >= r.level;
        return `<div class="row"><div class="ic">${it.icon}</div><div class="grow"><div class="nm">${esc(it.name)}${r.out[outId] > 1 ? ` ×${r.out[outId]}` : ''} <span class="muted" style="color:${lvOk ? '' : '#ff9a8a'}">${SKILLS[r.skill].name} ${r.level} · ${Math.round(r.xp)} XP</span></div><div class="ds">${ins}</div></div><button class="btn small gold" data-act="craft" data-arg="${r.id}" ${why ? 'disabled' : ''} title="${esc(why || '')}">Make</button><button class="btn small" data-act="craftAll" data-arg="${r.id}" ${why ? 'disabled' : ''}>All</button></div>`;
      }).join('');
    }
    return { title: `${SD.icon} ${SD.name}`, tabs: Object.entries(CRAFT_STATIONS).map(([k2, v]) => [k2, `${v.icon} ${v.name.split(' ')[0]}`]), html };
  }
  p_settings() {
    const g = this.game, S = g.S, G = g.G;
    return { title: '⚙️ Settings', html: `
      <div class="row"><div class="grow"><div class="nm">Graphics quality</div><div class="ds">Low is the default and runs well on phones. High adds cel outlines, shadows, dense grass and wind. Realistic swaps to PBR materials, a physical sky, reflective water with shore foam, soft shadows, ambient occlusion and bloom (needs a strong GPU; reloads).</div></div><div class="seg"><button data-act="quality" data-arg="low" class="${S.quality === 'low' ? 'on' : ''}">Low</button><button data-act="quality" data-arg="high" class="${S.quality === 'high' ? 'on' : ''}">High</button><button data-act="quality" data-arg="real" class="${S.quality === 'real' ? 'on' : ''}">Realistic</button></div></div>
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
      case 'use': { const msg = P.useItem(G, s.id, g); if (msg) { this.log(msg, 'info'); this.sfx('ui'); } if (!G.inv[idx]) this.sel = null; break; }
      case 'feed': { const msg = P.feedExceed(G, s.id); if (msg) this.log(msg, 'info'); if (!G.inv[idx]) this.sel = null; break; }
      case 'drop': { this.log(`You drop ${s.qty > 1 ? s.qty + '× ' : ''}${ITEMS[s.id].name}.`, 'info'); G.inv[idx] = null; this.sel = null; break; }
      case 'deposit': case 'depositAll': { const n = a === 'depositAll' ? s.qty : 1; if (addItem(G, s.id, n, 'bank') < n) removeItem(G, s.id, n); else this.toast('Bank full!'); if (!G.inv[idx]) this.sel = null; break; }
      case 'withdraw': case 'withdrawAll': { const n = a === 'withdrawAll' ? s.qty : 1; const left = addItem(G, s.id, n); if (left < n) removeItem(G, s.id, n - left, 'bank'); else this.toast('Bag full!'); if (!G.bank[idx]) this.sel = null; break; }
      case 'depositBag': case 'depositRes': {
        for (let i = 0; i < G.inv.length; i++) { const x = G.inv[i]; if (!x) continue; const k = ITEMS[x.id].kind; if (a === 'depositRes' && !(k === 'resource' || k === 'refined')) continue; if (k === 'quest' || k === 'key') continue; if (addItem(G, x.id, x.qty, 'bank') === 0) G.inv[i] = null; }
        this.sel = null; this.log('Levy stores your items. The owl judges you silently.', 'npc'); break;
      }
      case 'sell': case 'sellAll': { const n = a === 'sellAll' ? s.qty : 1; const p = sellPrice(s.id) * n; removeItem(G, s.id, n); G.jewels += p; P.onTrade(G, p, true); this.log(`Sold ${n}× ${ITEMS[s.id].name} for ${p} jewels.`, 'loot'); if (!G.inv[idx]) this.sel = null; break; }
      case 'buy': { const p = buyPrice(arg); if (G.jewels < p) { this.toast('Not enough jewels.'); break; } if (!canAdd(G, arg)) { this.toast('Bag full!'); break; } G.jewels -= p; addItem(G, arg, 1); P.onTrade(G, p, false); this.log(`Bought ${ITEMS[arg].name} for ${p} jewels.`, 'loot'); P.questEvent(G, { type: 'item' }); break; }
      case 'ssel': this.skillSel = this.skillSel === arg && this.tab === 'list' ? null : arg; break;
      case 'feedHappy': { const f = P.bestExceedFood(G); if (!f) { this.toast('No fish or Exceed treats in your bag. Fish or cook some!'); break; } this.log(P.feedExceed(G, f.id), 'info'); break; }
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
    if (PARTY[npcId]) {
      const nm = NPCS[npcId].name;
      if (G.party === npcId) svc.push({ label: `👋 Part ways with ${nm}`, svc: () => { this.game.setParty(null); this.log(`${nm} heads back to the guild.`, 'npc'); } });
      else { const u = unisonFor(this.game.magic.playerSchool(), PARTY[npcId].school); svc.push({ label: `🤝 Ask ${nm} to join your party (${u.name.replace('Unison Raid: ', '')})`, svc: () => { this.game.setParty(npcId); this.toast(`${nm} joined your party! Fight together to charge Unison Raids (U).`); } }); }
    }
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
