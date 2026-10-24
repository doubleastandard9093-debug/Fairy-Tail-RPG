import { setupRealism } from './realism.js';
import * as THREE from 'three';
import { ITEMS, WEAPON_TYPES } from '../data/items.js';
import { ABILITIES, WEAPON_ABILITIES, ARMOR_ABILITY } from '../data/abilities.js';
import { SCHOOLS } from '../data/schools.js';
import { MOBS, ALLIES, SPAWNS, BOSS_ARENA, BOSS_ARENAS, arenaOf } from '../data/mobs.js';
import { NODE_TYPES, NODE_TIERS, NODE_RESPAWN } from '../data/nodes.js';
import { POIS } from '../data/npcs.js';
import { derived, countItem, addItem, skillLevel, classRank, canAdd, saveGame } from '../core/state.js';
import { buildCharacter, buildMob, animateCharacter, animateMob, equipVisual } from '../world/models.js';
import { buildWorld, groundAt, HALL, zoneAt, placeAt, blockedAt, rng } from '../world/world.js';
import { PLACE, trainCost, FERRY_COST } from '../world/fiore.js';
import { Transit, railPath, seaPath as seaPathFor } from './transit.js';
import { glow, GFX } from '../world/toon.js';
import * as P from './progress.js';
import { MagicFX, schoolOf, SCHOOL_COLORS } from './magicfx.js';
import { PARTY } from '../data/combos.js';
import { artisanBonus, abilityLearned, abilityBonus, NODE, passiveFx, abilityRank } from '../data/skilltree.js';

const TMP = new THREE.Vector3();
const ang = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const dist2 = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

const SCHOOL_POSE = { flame: 'natsu', ice: 'gray', celestial: 'lucy', requip: 'erza', lightning: 'laxus', rune: 'levy' };
export class Game {
  constructor(renderer, G, S, ui) {
    this.renderer = renderer; this.G = G; this.S = S; this.ui = ui;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 900);
    this.cam = { yaw: Math.PI, pitch: 0.55, dist: 11, tx: 0, ty: 0, tz: 0 };
    this.world = buildWorld(this.scene);
    if (GFX.real) this.post = setupRealism(renderer, this.scene, this.camera, this.world);
    this.transit = new Transit(this); this.magic = new MagicFX(this);
    this.t = 0; this.entities = []; this.projectiles = []; this.teles = []; this.traps = []; this.fx = [];
    this.input = { x: 0, z: 0 }; this.autoAttack = S.autoAttack !== false;
    this.rand = rng(Date.now() & 0xffff);
    this.spawnPlayer();
    this.world.flush(this.player.pos.x, this.player.pos.z);
    this.spawnMobs();
    this.saveT = 0;
  }

  // ------------------------------------------------------------------ player
  spawnPlayer() {
    const G = this.G;
    if (this.player) this.scene.remove(this.player.char.group);
    const char = buildCharacter(G.look);
    this.scene.add(char.group);
    this.player = { char, pos: new THREE.Vector3(G.pos[0], 0, G.pos[1]), rot: G.rot, moveTo: null, follow: null, target: null, gathering: null,
      atk: -1, atkKind: 'slash', cast: 0, buffs: [], cds: {}, iframes: 0, dead: 0, dash: null, combatT: 0, moving: 0 };
    this.player.pos.y = groundAt(this.player.pos.x, this.player.pos.z);
    this.refreshGear();
  }
  refreshGear() {
    const G = this.G; const w = G.equip.weapon ? ITEMS[G.equip.weapon] : null; const lac = G.equip.lacrima ? ITEMS[G.equip.lacrima] : null;
    equipVisual(this.player.char, w ? w.weaponType : null, w ? w.tier : 1, lac ? SCHOOLS[lac.school].color : '#ffffff');
    const d = derived(G); G.hp = Math.min(G.hp, d.maxHp); G.mp = Math.min(G.mp, d.maxMp);
  }
  /** The 8 abilities on the bar, decided by what you wear: weapon (1-3), lacrima school (4-7), armor (8). */
  loadout() {
    const G = this.G; const w = G.equip.weapon ? ITEMS[G.equip.weapon].weaponType : 'none';
    const a = G.equip.armor ? ITEMS[G.equip.armor].armorType : null; const sch = G.equip.lacrima ? ITEMS[G.equip.lacrima].school : null;
    const list = [...WEAPON_ABILITIES[w]]; while (list.length < 3) list.push(null);
    const sa = sch ? this.schoolBar(sch) : [];
    for (let i = 0; i < 4; i++) list.push(sa[i] || null);
    list.push(a ? ARMOR_ABILITY[a] : null);
    return list;
  }
  /** The 4 school slots: player-chosen (Skill Tree → Slot) or the school's first four. */
  schoolBar(sch) {
    const S = SCHOOLS[sch]; const all = [...S.abilities, ...(S.advanced || [])]; const hb = this.G.hotbar && this.G.hotbar[sch];
    if (hb && hb.length === 4 && hb.every((x) => !x || all.includes(x))) return hb; return S.abilities.slice(0, 4);
  }
  setSchoolSlot(sch, slot, id) {
    const G = this.G; G.hotbar ||= {}; const bar = [...this.schoolBar(sch)]; const old = bar.indexOf(id); if (old >= 0) bar[old] = bar[slot]; bar[slot] = id; G.hotbar[sch] = bar; this.ui.renderAbilities?.();
  }
  abilitySource(id) {
    for (const [k, s] of Object.entries(SCHOOLS)) if (s.abilities.includes(id) || (s.advanced || []).includes(id)) return { kind: 'school', key: k };
    for (const [k, l] of Object.entries(WEAPON_ABILITIES)) if (l.includes(id)) return { kind: 'weapon', key: k };
    return { kind: 'armor', key: null };
  }
  abilityLocked(id) {
    const ab = ABILITIES[id]; if (!ab) return false;
    return !abilityLearned(this.G, id);
  }
  buff(k) {
    let v = 0; for (const b of this.player.buffs) if (b[k]) v += b[k];
    const ar = this.G.equip.armor && ITEMS[this.G.equip.armor]; if (ar && ar.fx && ar.fx[k]) v += ar.fx[k]; // Requip armor effects
    const gf = P.globalSkillFx(this.G); if (gf[k]) v += gf[k];
    const pf = passiveFx(this.G); if (pf[k] && k !== 'dmgUp') v += pf[k]; // passive trees (dr, regen, mpRegen, allyUp, gspeed, yield) // skill perks and set bonuses (allyUp, dmgUp, regen)
    return v;
  }

  useAbility(slot) {
    const id = this.loadout()[slot]; if (!id) return;
    const ab = ABILITIES[id]; const G = this.G; const pl = this.player; const d = derived(G);
    if (pl.dead) return;
    if (this.abilityLocked(id)) { if (!(this.lockToastT > this.t)) { this.lockToastT = this.t + 3; this.ui.toast(`Learn ${ab.name} in the Skill Tree (T) first.`); } return; }
    if ((pl.cds[id] || 0) > 0) return;
    const tb0 = abilityBonus(G, id, this.abilitySource(id).key);
    const cost = ab.cost ? { ...ab.cost } : {}; if (cost.mp) cost.mp = Math.round(cost.mp * (1 + tb0.cost));
    if (cost.mp && G.mp < cost.mp) { this.ui.toast('Not enough mana!'); return; }
    if (cost.adr && G.adr < cost.adr) { this.ui.toast(`Needs ${cost.adr}% adrenaline.`); return; }
    if (ab.needs && countItem(G, ab.needs) < 1) { this.ui.toast(`You need the ${ITEMS[ab.needs].name}.`); return; }
    if (ab.type === 'requip' && !G.equip.weapon2) { this.ui.toast('No reserve weapon! Equip one as Reserve in your bag.'); return; }
    G.mp -= cost.mp || 0; G.adr -= cost.adr || 0; G.adr = Math.min(100, G.adr + (ab.gain || 0));
    const src = this.abilitySource(id); const tb = abilityBonus(G, id, src.key);
    pl.cds[id] = ab.cd * (1 - d.cdr) * (1 - Math.min(0.4, tb.cdr));
    pl.gathering = null; pl.combatT = 6;
    P.grantRankXp(G, src.key === 'none' ? 'knuckles' : src.key, 2);
    let tgt = this.validTarget();
    if (!tgt && ab.type !== 'buff' && ab.type !== 'summon') { tgt = this.nearestMob(pl.pos, 16, true); if (tgt) this.setTarget(tgt); }
    if (tgt && ab.type !== 'buff' && ab.type !== 'dash') pl.rot = Math.atan2(tgt.pos.x - pl.pos.x, tgt.pos.z - pl.pos.z);
    const wItem = G.equip.weapon ? ITEMS[G.equip.weapon] : null;
    const power = src.kind === 'weapon' ? (wItem ? wItem.power : 0.8) : src.kind === 'school' ? 1 + 0.12 * (classRank(G, src.key) - 1) + (wItem ? (wItem.power - 1) * 0.5 : 0) : 1;
    const base = (14 + d.level * 3) * power * (ab.mult || 0) * (1 + (G.stats[ab.stat] || 0) * 0.035) * (1 + this.buff('dmgUp')) * (1 + tb.dmg) * (1 + (passiveFx(G).dmg || 0));
    const fwd = new THREE.Vector3(Math.sin(pl.rot), 0, Math.cos(pl.rot));
    const color = ab.color || '#ffffff';
    const wt = wItem ? wItem.weaponType : 'knuckles';
    this.ui.sfx(src.kind === 'school' ? 'spell' : 'swing');
    if (src.kind === 'school') pl.cast = 0.6; else { pl.atk = 0; pl.atkKind = wt === 'bow' ? 'bow' : wt === 'knuckles' ? 'punch' : 'slash'; }
    if (id.startsWith('fl_fist') || id.startsWith('kn_')) { pl.atk = 0; pl.atkKind = 'punch'; pl.cast = 0; }
    const hit = (m, mult = 1) => this.damageMob(m, base * mult, ab);
    switch (ab.type) {
      case 'melee': {
        for (const m of this.mobsNear(pl.pos, ab.range + 0.8)) {
          const a = Math.atan2(m.pos.x - pl.pos.x, m.pos.z - pl.pos.z);
          if (Math.abs(ang(a - pl.rot)) < ab.arc / 2 + 0.25 || dist2(m.pos, pl.pos) < 1.2 + m.radius) hit(m);
        }
        this.fxArc(pl.pos, pl.rot, ab.range, ab.arc, color); break;
      }
      case 'proj': this.fireProj(pl.pos, tgt, fwd, ab, base, 'player', color); break;
      case 'beam': {
        for (const m of this.mobsNear(pl.pos, ab.length + 2)) if (this.inRect(m.pos, pl.pos, pl.rot, ab.length, ab.width + m.radius)) hit(m);
        this.fxBeam(pl.pos, pl.rot, ab.length, ab.width, color); break;
      }
      case 'aoe_self': { for (const m of this.mobsNear(pl.pos, ab.radius + 0.5)) hit(m); this.fxRing(pl.pos, ab.radius, color); break; }
      case 'aoe_target': {
        const at = tgt && dist2(tgt.pos, pl.pos) < ab.dist * 1.8 ? tgt.pos.clone() : pl.pos.clone().addScaledVector(fwd, ab.dist);
        at.y = groundAt(at.x, at.z);
        this.addTele({ shape: 'circle', x: at.x, z: at.z, radius: ab.radius, windup: ab.delay, friendly: true, color, onHit: () => { for (const m of this.mobsNear(at, ab.radius + 0.5)) hit(m); this.fxRing(at, ab.radius, color, true); } });
        break;
      }
      case 'dash': {
        const dir = ab.id === 'ar_roll' && this.input.x === 0 && this.input.z === 0 ? fwd.clone().negate() : (tgt && ab.mult ? TMP.set(tgt.pos.x - pl.pos.x, 0, tgt.pos.z - pl.pos.z).normalize().clone() : fwd.clone());
        if (this.input.x || this.input.z) dir.set(this.input.x, 0, this.input.z).normalize();
        pl.rot = Math.atan2(dir.x, dir.z);
        pl.dash = { dir, left: ab.dist, speed: ab.dist / 0.22, hitSet: new Set(), ab, base, width: ab.width };
        pl.iframes = ab.iframes || 0.25; this.fxRing(pl.pos, 1.2, color); break;
      }
      case 'buff': {
        const b = { ...ab.buff, until: this.t + ab.buff.dur, name: ab.name, icon: ab.icon };
        if (b.mpRestore) { G.mp = Math.min(d.maxMp, G.mp + b.mpRestore); }
        pl.buffs = pl.buffs.filter((x) => x.name !== ab.name); pl.buffs.push(b);
        if (b.shield) b.shieldLeft = b.shield * (1 + G.stats.INT * 0.02);
        this.fxRing(pl.pos, 1.8, color); this.ui.log(`${ab.name}!`, 'ability'); break;
      }
      case 'summon': this.summon(ab.ally, ab.dur, 1 + this.buff('allyUp') + G.stats.INT * 0.03 + (classRank(G, 'celestial') - 1) * 0.1); break;
      case 'trap': {
        const at = pl.pos.clone().addScaledVector(fwd, ab.dist); this.addTrap(at, ab, base, color); break;
      }
      case 'requip': {
        const a = G.equip.weapon; G.equip.weapon = G.equip.weapon2; G.equip.weapon2 = a; this.refreshGear();
        for (const m of this.mobsNear(pl.pos, ab.radius + 0.5)) hit(m);
        this.fxRing(pl.pos, ab.radius, color); this.ui.log(`Requip! Now wielding ${ITEMS[G.equip.weapon].name}.`, 'ability'); this.ui.refresh(); break;
      }
    }
    this.magic.cast(id, { ...ab, id }, pl, tgt, fwd); this.rankFx(tb.rank, ab, pl, tgt, fwd, color); this.magic.onCast(id, ab, (14 + d.level * 3) * power * (1 + (G.stats.INT || 0) * 0.035) * (1 + this.buff('dmgUp')));
    this.ui.abilityFired(slot);
  }
  /** Party: one guildmate follows you everywhere (saved in G.party). */
  setParty(npcId) {
    const old = this.entities.find((e) => e.kind === 'ally' && e.party); if (old) { this.fxBurst(old.pos, '#fff0b0', 12); this.removeEntity(old); }
    this.G.party = npcId || null; this.magic.unison = 0; this.magic.partyT = 0;
    if (npcId) this.summon(PARTY[npcId].ally, 0, 1 + derived(this.G).level * 0.06, { party: true });
    this.ui.refresh(); saveGame?.(this.G);
  }
  emote(kind = 'salute', dur = 2.2) { const pl = this.player; if (pl.dead) return; pl.emote = { kind, until: this.t + dur, face: true }; if (kind === 'salute') this.ui.log('You raise the Fairy Tail sign. Somewhere, Laxus pretends not to notice.', 'npc'); }
  validTarget() { const t = this.player.target; return t && !t.dead && t.kind === 'mob' ? t : null; }
  setTarget(m) { this.player.target = m; this.ui.setTarget(m); }

  // ------------------------------------------------------------------ mobs
  spawnMobs() {
    const R = this.rand;
    for (const sp of SPAWNS) for (let i = 0; i < (sp.count || 1); i++) {
      let x, z, tries = 0;
      do { if (sp.at) { [x, z] = sp.at; break; } const a = R() * Math.PI * 2, r = Math.sqrt(R()) * sp.r; x = sp.c[0] + Math.cos(a) * r; z = sp.c[1] + Math.sin(a) * r; tries++; }
      while ((blockedAt(x, z) || this.world.keepOut(x, z, 1)) && tries < 40);
      this.makeMob(sp.mob, x, z);
    }
  }
  makeMob(id, x, z) {
    const tpl = MOBS[id]; const m = buildMob(tpl.model, tpl.opt || {}); if (tpl.scale && tpl.scale !== 1) m.group.scale.setScalar(tpl.scale);
    const e = { kind: 'mob', id, tpl, obj: m.group, model: m, pos: new THREE.Vector3(x, groundAt(x, z), z), home: new THREE.Vector3(x, 0, z), rot: this.rand() * 6,
      hp: tpl.hp, maxHp: tpl.hp, aggro: false, atkCd: 1, atk: -1, stun: 0, slow: 0, slowT: 0, burn: null, dead: false, respawn: 0, wander: null, radius: tpl.radius || (tpl.boss ? 2.2 : 0.7), temp: !!tpl.temp,
      teleCds: {}, castLock: 0, chargeCd: 3, charge: null, bark: 4 + this.rand() * 10 };
    if (tpl.boss) { e.phase = 1; e.transition = 0; m.parts.st = e; }
    if (tpl.model === 'lullaby') { e.form = 'flute'; e.phase = 1; e.transform = 0; e.slam = -1; e.singing = 0; m.parts.st = e; }
    m.group.userData.entity = e; m.group.traverse((o) => { o.userData.entity = e; });
    this.scene.add(m.group); this.entities.push(e); return e;
  }
  mobsNear(p, r) { return this.entities.filter((e) => e.kind === 'mob' && !e.dead && dist2(e.pos, p) < r + e.radius); }
  nearestMob(p, r, front = false) {
    let best = null, bd = 1e9;
    for (const e of this.entities) {
      if (e.kind !== 'mob' || e.dead) continue; let d = dist2(e.pos, p); if (d > r) continue;
      if (front) { const a = Math.atan2(e.pos.x - p.x, e.pos.z - p.z); d += Math.abs(ang(a - this.player.rot)) * 3; }
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }
  /** Extra visual layers for ranked-up actives: rank 3+ adds a glyph and sparks, rank 5 a light pillar; ultimates always flare. */
  rankFx(rank, ab, pl, tgt, fwd, color) {
    if (!rank || rank < 3 && ab.tier !== 'ult') return;
    const at = ab.type === 'aoe_target' || ab.type === 'proj' ? (tgt ? tgt.pos.clone() : pl.pos.clone().addScaledVector(fwd, ab.dist || 6)) : pl.pos.clone();
    this.magic.glyph(pl.pos, 1.4 + rank * 0.15, color, false, 0, rank >= 4, 0.9); this.fxBurst(at, color, 6 + rank * 3);
    if (rank >= 5 || ab.tier === 'ult') { this.magic.pillar(at, (ab.radius || 2.5) * 0.6, [color, '#ffffff'], 10 + rank * 2, 0.9); this.ui.shake?.(0.2 + (ab.tier === 'ult' ? 0.25 : 0)); }
  }
  /** On-hit passive procs (Arcana / Life Bond trees). */
  procs(m, dmg, ab) {
    const pf = passiveFx(this.G); const G = this.G; const d = derived(G);
    if (pf.lifesteal) G.hp = Math.min(d.maxHp, G.hp + dmg * pf.lifesteal);
    if (m.dead || m.hp <= 0) return;
    if (pf.burnProc && this.rand() < pf.burnProc) { m.burn = { dps: (4 + d.level * 0.6) * (1 + G.stats.INT * 0.03), until: this.t + 4, tick: 1 }; this.magic.embers(m.pos, 10); this.ui.floatText(m.pos, 2.6, 'Ignite!', 'crit'); }
    if (pf.stunProc && this.rand() < pf.stunProc) { m.stun = Math.max(m.stun, m.tpl.boss ? 0.3 : 1.0); this.ui.floatText(m.pos, 2.6, 'Stun!', 'crit'); }
    if (pf.chainProc && this.rand() < pf.chainProc) {
      const n = this.entities.find((e) => e.kind === 'mob' && !e.dead && e !== m && dist2(e.pos, m.pos) < 7);
      if (n) { this.magic.bolt(new THREE.Vector3(m.pos.x, m.pos.y + 1, m.pos.z), new THREE.Vector3(n.pos.x, n.pos.y + 1, n.pos.z), '#fff27a', 0.3, 8, 0.6); this.damageMob(n, dmg * 0.4, null, 'proc'); }
    }
  }
  damageMob(m, amt, ab, from = 'player') {
    if (m.dead) return;
    if (m.form === 'flute') { if (from === 'player') this.ui.floatText(m.pos, 3, 'Immune', 'heal'); return; }
    if (m.transition > 0 || this.shielded(m)) { if (from === 'player') this.ui.floatText(m.pos, m.tpl.boss ? 6 : 3, m.transition > 0 ? 'Immune' : 'Shielded', 'heal'); return; }
    const d = derived(this.G); const crit = from === 'player' && this.rand() < d.crit; const pf = passiveFx(this.G);
    if ((from === 'player' || from === 'proc') && pf.execute && m.hp / m.maxHp < 0.3) amt *= 1 + pf.execute;
    let dmg = Math.max(1, Math.round(amt * (0.9 + this.rand() * 0.2) * (crit ? 1.6 + (pf.critDmg || 0) : 1)));
    m.hp -= dmg; m.aggro = true; if (from === 'player' || from === 'ally') this.magic.fill(from); if (from !== 'dot') this.ui.sfx('hit'); if (from === 'player') this.player.combatT = 6;
    this.ui.floatText(m.pos, m.tpl.boss ? 9 : 1.8, (crit ? '✦' : '') + dmg, crit ? 'crit' : from === 'ally' ? 'ally' : 'dmg');
    const ef = ab && ab.effect;
    if (ef) {
      if (ef.burn) m.burn = { dps: ef.burn.dps * (1 + this.G.stats.INT * 0.03), until: this.t + ef.burn.dur, tick: 1 };
      if (ef.slow) { m.slow = ef.slow.pct; m.slowT = ef.slow.dur; }
      if (ef.stun && !m.tpl.boss) m.stun = Math.max(m.stun, ef.stun);
      else if (ef.stun && m.tpl.boss) m.stun = Math.max(m.stun, ef.stun * 0.25);
    }
    if (m.tpl.phases && m.hp > 0) this.bossPhaseCheck(m);
    if (from === 'player') this.procs(m, dmg, ab);
    if (m.hp <= 0 && !m.dead) this.killMob(m);
  }
  bossPhaseCheck(m) {
    for (const ph of m.tpl.phases) if (m.phase < ph.n && m.hp / m.maxHp <= ph.at) {
      m.phase = ph.n; m.transition = ph.trans || 0; m.castLock = 0; m.bossCharge = null; if (ph.trans) this.ui.bossCast('Phase ' + ph.n, ph.trans);
      this.teles = this.teles.filter((t) => { if (t.owner === m) { this.scene.remove(t.group); return false; } return true; });
      if (ph.heal) m.hp = Math.min(m.maxHp, m.hp + m.maxHp * ph.heal);
      if (ph.shield) { m.shieldMobs = []; for (let i = 0; i < ph.shield.count; i++) { const a = i / ph.shield.count * Math.PI * 2; const e = this.makeMob(ph.shield.mob, m.pos.x + Math.sin(a) * 6, m.pos.z + Math.cos(a) * 6); e.aggro = true; e.shieldFor = m; m.shieldMobs.push(e); this.fxBurst(e.pos, '#9a5aff', 18); } }
      this.ui.toast('☠ ' + ph.line); this.ui.log(ph.line, 'warn'); this.ui.shake(0.6);
      this.fxRing(m.pos, 8, ph.n >= 3 ? '#ff4a2a' : '#ffd23a', true); this.ui.bossPhase?.(m);
      for (const k in m.teleCds) m.teleCds[k] = Math.min(m.teleCds[k], 1.5);
    }
  }
  shielded(m) { if (!m.shieldMobs) return false; const alive = m.shieldMobs.some((x) => !x.dead && this.entities.includes(x)); if (!alive) { m.shieldMobs = null; this.ui.toast(`💥 The shield breaks! ${m.tpl.short || m.tpl.name} is exposed!`); this.ui.log(`The shield around ${m.tpl.short || m.tpl.name} shatters.`, 'warn'); this.fxRing(m.pos, 6, '#ffffff', true); } return alive; }
  clearSummons() { for (const e of [...this.entities]) if (e.temp) this.removeEntity(e); }
  resetBoss(m) { if (m.tpl.model === 'lullaby') m.form = 'flute'; m.phase = 1; m.transition = 0; m.shieldMobs = null; m.bossCharge = null; m.hp = m.maxHp; if (m.tpl.model !== 'lullaby') this.ui.bossPhase?.(m); m.transform = 0; m.transforming = 0; m.slam = -1; m.singing = 0; m.castLock = 0; this.clearSummons(); }
  killMob(m) {
    const G = this.G; m.dead = true; m.hp = 0; m.respawn = m.tpl.boss ? 120 : 22; m.obj.visible = false; m.charge = null; m.castLock = 0;
    this.teles = this.teles.filter((t) => { if (t.owner === m) { this.scene.remove(t.group); return false; } return true; });
    this.fxBurst(m.pos, m.tpl.boss ? '#ffb060' : '#ffffff', m.tpl.boss ? 40 : 14);
    const wItem = G.equip.weapon ? ITEMS[G.equip.weapon] : null; const lac = G.equip.lacrima ? ITEMS[G.equip.lacrima] : null;
    { const pf = passiveFx(G); const d = derived(G); if (pf.mpOnKill) G.mp = Math.min(d.maxMp, G.mp + pf.mpOnKill); if (pf.hpOnKill) G.hp = Math.min(d.maxHp, G.hp + pf.hpOnKill); }
    P.grantCharXp(G, m.tpl.xp); P.grantRankXp(G, wItem ? wItem.weaponType : 'knuckles', 4); if (lac) P.grantRankXp(G, lac.school, 6);
    const j = m.tpl.jewels; const jw = Math.round(j[0] + this.rand() * (j[1] - j[0])); G.jewels += jw;
    const loot = { };
    for (const dr of m.tpl.drops) if (this.rand() < dr.chance) loot[dr.id] = (loot[dr.id] || 0) + (dr.min ? dr.min + Math.floor(this.rand() * (dr.max - dr.min + 1)) : 1);
    for (const qd of P.questDropsFor(G, m.id)) if (this.rand() < qd.chance) loot[qd.item] = 1;
    this.ui.log(`${m.tpl.name} defeated! +${m.tpl.xp} XP, +${jw} jewels.`, 'kill');
    P.giveItems(G, loot);
    P.onKill(G, m.id);
    if (this.player.target === m) this.setTarget(null);
    if (m.temp) { this.removeEntity(m); this.ui.refresh(); return; }
    if (m.tpl.boss) { this.clearSummons(); G.bossKills = G.bossKills || {}; G.bossKills[m.id] = (G.bossKills[m.id] || 0) + 1; this.ui.toast(m.tpl.defeat || `🏆 ${m.tpl.name} defeated!`); this.emote?.('cheer', 2.5); this.ui.boss(null); for (const e of this.entities) if (e.kind === 'ally' && e.guildmate) e.until = this.t + 6; }
    this.ui.refresh();
  }
  respawnMob(m) {
    m.dead = false; m.hp = m.maxHp; m.pos.copy(m.home); m.pos.y = groundAt(m.home.x, m.home.z); m.obj.visible = true; m.aggro = false; m.burn = null; m.stun = 0; m.teleCds = {}; if (m.tpl.boss) this.resetBoss(m);
  }

  // ------------------------------------------------------------------ allies & escort
  summon(allyId, dur, mult = 1, opts = {}) {
    const tpl = ALLIES[allyId];
    const old = this.entities.find((e) => e.kind === 'ally' && e.id === allyId); if (old) this.removeEntity(old);
    let built;
    if (tpl.model === 'npc') { const c = buildCharacter(tpl.look); built = { group: c.group, parts: {}, char: c }; if (tpl.weapon) equipVisual(c, tpl.weapon, 4); }
    else built = buildMob(tpl.model);
    const side = this.rand() < 0.5 ? -1 : 1;
    const p = this.player.pos.clone().add(new THREE.Vector3(Math.cos(this.player.rot) * 2 * side, 0, -Math.sin(this.player.rot) * 2 * side));
    const e = { kind: 'ally', id: allyId, tpl, obj: built.group, model: built, pos: p, rot: this.player.rot, hp: tpl.hp * mult, maxHp: tpl.hp * mult, mult, atkCd: 0.5, atk: -1, until: dur ? this.t + dur : Infinity, healCd: 1, radius: 0.6, party: !!opts.party, guildmate: !!opts.guildmate };
    this.scene.add(built.group); this.entities.push(e);
    if (tpl.requip) this.requipFx(built.char, p);
    this.fxRing(p, 1.6, '#ffe8a0'); this.fxBurst(p, '#fff0b0', 18);
    this.ui.log(`${tpl.name}: "${tpl.lines[Math.floor(this.rand() * tpl.lines.length)]}"`, 'npc');
    return e;
  }
  /** Erza's Requip: a column of light, then the armour materialises piece by piece. */
  requipFx(char, pos) {
    const p = char.parts; const bits = [p.armor, ...(p.armorBits || [])].filter(Boolean);
    const add = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide };
    const g = new THREE.Group(); g.position.set(pos.x, (pos.y || groundAt(pos.x, pos.z)), pos.z);
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 6, 20, 1, true), new THREE.MeshBasicMaterial({ color: '#fff2c0', opacity: 0.8, ...add })); col.position.y = 3; g.add(col);
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 6, 12, 1, true), new THREE.MeshBasicMaterial({ color: '#ffffff', opacity: 0.9, ...add })); core.position.y = 3; g.add(core);
    for (let i = 0; i < 3; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.04, 6, 32), new THREE.MeshBasicMaterial({ color: '#ffd76a', opacity: 0.9, ...add })); r.rotation.x = Math.PI / 2; r.position.y = 0.4 + i * 0.8; g.add(r); }
    this.scene.add(g);
    this.fx.push({ m: g, mats: g.children.map((c) => c.material), life: 1.4, age: 0, kind: 'requip' });
    (this.requips ||= []).push({ bits, t: 0 }); for (const b of bits) b.scale.setScalar(0.01);
    this.fxBurst(pos, '#fff0b0', 30); this.ui.sfx?.('requip');
  }
  requipNpc(id) {
    const it = this.world.npcs[id]; if (!it || it.requipped) return; it.requipped = true;
    this.requipFx(it.char, { x: it.x, y: it.obj.position.y, z: it.z });
  }
  removeEntity(e) { this.scene.remove(e.obj); this.entities = this.entities.filter((x) => x !== e); }
  startEscort() {
    if (this.entities.some((e) => e.kind === 'escort')) return;
    const m = buildMob('plue'); const p = this.player.pos.clone().add(new THREE.Vector3(1.5, 0, 0));
    const e = { kind: 'escort', id: 'cat', modelName: 'plue', obj: m.group, model: m, pos: p, rot: 0, radius: 0.4, warnT: 0 };
    this.scene.add(m.group); this.entities.push(e);
    this.ui.log('Plue: "Puun puun!" (He shivers, then follows you. Slowly. Adorably.)', 'npc');
  }

  // ------------------------------------------------------------------ projectiles, telegraphs, traps, fx
  fireProj(from, tgt, fwd, ab, dmg, faction, color, opts = {}) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(opts.size || 0.22, 8, 6), glow(color)); const p = from.clone(); p.y += opts.y || 1.3;
    m.position.copy(p); this.scene.add(m);
    const trail = new THREE.Mesh(new THREE.ConeGeometry(opts.size || 0.18, 1.0, 6), glow(color, 0.5)); trail.rotation.x = -Math.PI / 2; m.add(trail); trail.position.z = -0.5;
    const dir = tgt ? new THREE.Vector3(tgt.pos.x - p.x, (tgt.pos.y + (tgt.tpl && tgt.tpl.boss ? 3 : 0.8)) - p.y, tgt.pos.z - p.z).normalize() : fwd.clone();
    m.lookAt(p.clone().add(dir));
    this.projectiles.push({ mesh: m, pos: p, dir, speed: ab.speed || 24, life: 1.2, pierce: ab.pierce, hits: new Set(), dmg, ab, faction, homing: faction !== 'mob' && !ab.pierce ? tgt : null });
  }
  addTele(t) {
    const g = new THREE.Group(); g.position.set(t.x, groundAt(t.x, t.z) + 0.08, t.z); if (t.rot !== undefined) g.rotation.y = t.rot;
    const col = t.friendly ? (t.color || '#80c0ff') : '#ff3a2a';
    const mat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide });
    const fmat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.45, depthWrite: false, side: THREE.DoubleSide });
    let geo, fgeo;
    if (t.shape === 'circle') { geo = new THREE.CircleGeometry(t.radius, 40); fgeo = geo; }
    else if (t.shape === 'ring') { geo = new THREE.RingGeometry(t.inner, t.radius, 48); fgeo = geo; }
    else { geo = new THREE.PlaneGeometry(t.width, t.length); geo.translate(0, t.length / 2, 0); fgeo = geo; }
    const a = new THREE.Mesh(geo, mat); a.rotation.x = -Math.PI / 2; g.add(a);
    const f = new THREE.Mesh(fgeo, fmat); f.rotation.x = -Math.PI / 2; f.position.y = 0.02; f.scale.setScalar(0.01); g.add(f);
    const edgeGeo = t.shape === 'rect' ? new THREE.EdgesGeometry(geo) : new THREE.EdgesGeometry(new THREE.RingGeometry(t.radius - 0.08, t.radius, 48));
    const edge = new THREE.LineSegments(edgeGeo, new THREE.LineBasicMaterial({ color: col })); edge.rotation.x = -Math.PI / 2; g.add(edge);
    if (t.song) { // charge-up rings that contract toward the boss as the song builds
      t.rings = [];
      for (let i = 0; i < 4; i++) { const r = new THREE.Mesh(new THREE.RingGeometry(0.92, 1, 64), new THREE.MeshBasicMaterial({ color: '#8affc0', transparent: true, opacity: 0.7, depthWrite: false, side: THREE.DoubleSide })); r.rotation.x = -Math.PI / 2; r.position.y = 0.05 + i * 0.01; g.add(r); t.rings.push(r); }
    }
    if (t.magic) { // rotating magic circle with a hexagram
      const mm = new THREE.MeshBasicMaterial({ color: t.color, transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide });
      const glyph = new THREE.Group(); glyph.rotation.x = -Math.PI / 2; glyph.position.y = 0.06; g.add(glyph);
      for (const off of [0, Math.PI]) { const tri = new THREE.Mesh(new THREE.RingGeometry(t.radius * 0.72, t.radius * 0.8, 3, 1, off), mm); glyph.add(tri); }
      glyph.add(new THREE.Mesh(new THREE.RingGeometry(t.radius * 0.84, t.radius * 0.9, 40), mm)); t.glyph = glyph;
    }
    this.scene.add(g); t.group = g; t.fill = f; t.age = 0; this.teles.push(t); return t;
  }
  addTrap(at, ab, dmg, color) {
    const g = new THREE.Group(); g.position.set(at.x, groundAt(at.x, at.z) + 0.06, at.z);
    const ring = new THREE.Mesh(new THREE.RingGeometry(ab.radius * 0.8, ab.radius, 6), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false })); ring.rotation.x = -Math.PI / 2; g.add(ring);
    const glyph = new THREE.Mesh(new THREE.RingGeometry(ab.radius * 0.3, ab.radius * 0.4, 3), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false })); glyph.rotation.x = -Math.PI / 2; g.add(glyph);
    this.scene.add(g); this.traps.push({ g, ring: glyph, pos: at.clone(), ab, dmg, until: this.t + ab.dur, armed: this.t + 0.4 });
  }
  fxRing(p, r, color, big = false) {
    const m = new THREE.Mesh(new THREE.RingGeometry(r * 0.85, r, 40), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.set(p.x, groundAt(p.x, p.z) + 0.15, p.z); m.scale.setScalar(0.3); this.scene.add(m);
    this.fx.push({ m, life: big ? 0.5 : 0.35, age: 0, kind: 'ring' });
    if (big) this.fxBurst(p, color, 16);
  }
  fxArc(p, rot, r, arc, color) {
    const m = new THREE.Mesh(new THREE.RingGeometry(r * 0.35, r, 24, 1, -arc / 2, arc), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.rotation.z = rot - Math.PI / 2 + 0; m.position.set(p.x, p.y + 1.0, p.z);
    m.rotation.order = 'YXZ'; m.rotation.set(-Math.PI / 2, 0, 0); const holder = new THREE.Group(); holder.position.copy(m.position); m.position.set(0, 0, 0); holder.add(m); holder.rotation.y = rot; m.rotation.z = Math.PI / 2;
    this.scene.add(holder); this.fx.push({ m: holder, mat: m.material, life: 0.22, age: 0, kind: 'fade' });
  }
  fxBeam(p, rot, len, w, color) {
    const g = new THREE.Group(); g.position.set(p.x, p.y + 1.1, p.z); g.rotation.y = rot;
    const add = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending };
    const m = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.3, w * 0.55, len, 14, 1, true), new THREE.MeshBasicMaterial({ color, opacity: 0.75, side: THREE.DoubleSide, ...add }));
    m.rotation.x = Math.PI / 2; m.position.z = len / 2; g.add(m);
    const halo = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.45, w * 0.8, len * 1.05, 14, 1, true), new THREE.MeshBasicMaterial({ color, opacity: 0.3, side: THREE.DoubleSide, ...add }));
    halo.rotation.x = Math.PI / 2; halo.position.z = len / 2; g.add(halo);
    const core = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.08, w * 0.16, len, 8), new THREE.MeshBasicMaterial({ color: '#fff6d0', opacity: 0.7, ...add })); core.rotation.x = Math.PI / 2; core.position.z = len / 2; g.add(core);
    const mouth = new THREE.Mesh(new THREE.SphereGeometry(w * 0.3, 14, 10), new THREE.MeshBasicMaterial({ color, opacity: 0.45, ...add })); mouth.position.z = 0.9; g.add(mouth);
    for (let i = 0; i < 3; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(w * (0.5 + i * 0.12), 0.06, 6, 24), new THREE.MeshBasicMaterial({ color, opacity: 0.8, ...add })); r.position.z = len * (0.2 + i * 0.3); g.add(r); }
    this.scene.add(g); this.fx.push({ m: g, mats: [m.material, halo.material, core.material, mouth.material, ...g.children.slice(4).map((c) => c.material)], life: 0.6, age: 0, kind: 'beam' });
    for (let i = 1; i <= 3; i++) { const q = new THREE.Vector3(p.x + Math.sin(rot) * len * i / 3, p.y, p.z + Math.cos(rot) * len * i / 3); this.fxBurst(q, color, 10); }
  }
  fxBurst(p, color, n = 12) {
    const geo = new THREE.BufferGeometry(); const arr = new Float32Array(n * 3); const vel = [];
    for (let i = 0; i < n; i++) { arr.set([p.x, p.y + 1, p.z], i * 3); vel.push(new THREE.Vector3((this.rand() - 0.5) * 6, this.rand() * 6 + 1, (this.rand() - 0.5) * 6)); }
    geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color, size: 0.35, transparent: true, opacity: 1, depthWrite: false }));
    this.scene.add(pts); this.fx.push({ m: pts, vel, life: 0.7, age: 0, kind: 'burst' });
  }
  inRect(p, o, rot, len, w) {
    const dx = p.x - o.x, dz = p.z - o.z; const f = dx * Math.sin(rot) + dz * Math.cos(rot); const s = dx * Math.cos(rot) - dz * Math.sin(rot);
    return f > -0.5 && f < len && Math.abs(s) < w / 2;
  }
  inTele(t, p, pad = 0.4) {
    const d = Math.hypot(p.x - t.x, p.z - t.z);
    if (t.shape === 'circle') return d < t.radius + pad;
    if (t.shape === 'ring') return d > t.inner - pad && d < t.radius + pad;
    return this.inRect(p, { x: t.x, z: t.z }, t.rot, t.length, t.width + pad * 2);
  }

  // ------------------------------------------------------------------ damage to player / allies
  hurt(target, amt, srcName, src = null) {
    if (target === 'player') {
      const pl = this.player, G = this.G; if (pl.dead) return;
      const pfx = passiveFx(G);
      if (pl.iframes > 0 || (pfx.dodge && this.rand() < pfx.dodge)) { this.ui.floatText(pl.pos, 2.2, 'Dodge!', 'heal'); return; }
      const d = derived(G);
      let dmg = amt * (1 - d.def / (d.def + 40)) * (1 - Math.min(0.8, this.buff('dr')));
      for (const b of pl.buffs) if (b.shieldLeft > 0) { const ab = Math.min(b.shieldLeft, dmg); b.shieldLeft -= ab; dmg -= ab; }
      dmg = Math.round(dmg); pl.combatT = 6;
      if (dmg <= 0) { this.ui.floatText(pl.pos, 2.2, 'Blocked', 'heal'); return; }
      if (pfx.thorns && src && src.kind === 'mob' && !src.dead) { const th = Math.max(1, Math.round(dmg * pfx.thorns)); src.hp -= th; this.ui.floatText(src.pos, 2, '↩' + th, 'dmg'); if (src.hp <= 0) this.killMob(src); }
      G.hp -= dmg; this.ui.sfx('hurt'); this.ui.floatText(pl.pos, 2.2, '-' + dmg, 'hurt'); this.ui.hurtFlash();
      G.adr = Math.min(100, G.adr + 2);
      if (G.hp <= 0) this.playerDie(srcName);
    } else {
      target.hp -= amt; this.ui.floatText(target.pos, 2, '-' + Math.round(amt), 'hurtAlly');
      if (target.hp <= 0) {
        if ((target.party || target.guildmate) && !target.downed) { target.hp = 0; target.downed = true; target.downT = 30; target.atk = -1; target.moving = 0;
          this.ui.log(`${target.tpl.name.replace(' (party)', '')} is down! Stand next to them and press E (or tap Revive) to help them up.`, 'warn'); this.ui.toast(`💫 ${target.tpl.name.replace(' (party)', '')} is down — revive them!`);
          target.reviveIt = { kind: 'revive', ally: target, name: target.tpl.name.replace(' (party)', ''), x: target.pos.x, z: target.pos.z, r: 2.6 }; this.world.interactables.push(target.reviveIt); }
        else if (!target.downed) { this.ui.log(`${target.tpl.name} retreats, exhausted.`, 'npc'); this.fxBurst(target.pos, '#ffe0a0', 14); this.removeEntity(target); }
      }
    }
  }
  playerDie(src) {
    const pl = this.player; pl.dead = 3; this.G.hp = 0; pl.gathering = null; pl.dash = null; this.setTarget(null);
    this.ui.log(`You were knocked out by ${src}!`, 'warn'); this.ui.toast('💫 Knocked out!');
  }
  playerRespawn() {
    const G = this.G, pl = this.player; const d = derived(G);
    G.hp = d.maxHp; G.mp = d.maxMp; G.adr = 0; pl.dead = 0; pl.pos.set(0, 0, 9); pl.buffs = [];
    for (const e of [...this.entities]) if (e.kind === 'ally') this.removeEntity(e);
    for (const e of this.entities) if (e.kind === 'mob' && e.aggro) { e.aggro = false; e.hp = e.maxHp; if (e.tpl && e.tpl.boss) this.resetBoss(e); }
    this.ui.boss(null);
    this.ui.log('Mirajane has Elfman carry you back to the fountain. "Again? I am starting a punch card for you."', 'npc');
  }

  // ------------------------------------------------------------------ movement & collision
  collide(p, r = 0.45) {
    for (const b of this.world.boxes) {
      if (p.x < b.minX - 2 || p.x > b.maxX + 2 || p.z < b.minZ - 2 || p.z > b.maxZ + 2) continue;
      const cx = Math.max(b.minX, Math.min(p.x, b.maxX)), cz = Math.max(b.minZ, Math.min(p.z, b.maxZ));
      const dx = p.x - cx, dz = p.z - cz, d = Math.hypot(dx, dz);
      if (d < r) {
        if (d > 1e-5) { p.x = cx + dx / d * r; p.z = cz + dz / d * r; }
        else { // centre inside the box: leave by the nearest face
          const o = [p.x - b.minX, b.maxX - p.x, p.z - b.minZ, b.maxZ - p.z]; const i = o.indexOf(Math.min(...o));
          if (i === 0) p.x = b.minX - r; else if (i === 1) p.x = b.maxX + r; else if (i === 2) p.z = b.minZ - r; else p.z = b.maxZ + r;
        }
      }
    }
    for (const c of this.world.circles) {
      if (c.node && c.node.respawn > 0) continue;
      if (Math.abs(p.x - c.x) > c.r + 2 || Math.abs(p.z - c.z) > c.r + 2) continue;
      const dx = p.x - c.x, dz = p.z - c.z, d = Math.hypot(dx, dz), m = c.r + r;
      if (d < m && d > 1e-5) { p.x = c.x + dx / d * m; p.z = c.z + dz / d * m; }
    }
  }
  /** Moves in small sub-steps so a lag spike can never tunnel through a wall. */
  moveBy(p, dx, dz, r) {
    const len = Math.hypot(dx, dz); const n = Math.max(1, Math.ceil(len / 0.2));
    for (let i = 0; i < n; i++) {
      const ox = p.x, oz = p.z; p.x += dx / n; p.z += dz / n; this.collide(p, r);
      if (blockedAt(p.x, p.z)) { // sea / border: slide along the shore, else stay put
        const nx = p.x, nz = p.z; p.x = nx; p.z = oz; if (blockedAt(p.x, p.z)) { p.x = ox; p.z = nz; if (blockedAt(p.x, p.z)) { p.x = ox; p.z = oz; } }
      }
    }
  }

  // ------------------------------------------------------------------ interaction
  interactables() { return this.world.interactables; }
  nearestInteractable() {
    const p = this.player.pos; let best = null, bd = 1e9;
    for (const it of this.world.interactables) {
      if (it.kind === 'node' && it.respawn > 0) continue;
      const d = Math.hypot(p.x - it.x, p.z - it.z); if (d < it.r && d < bd) { bd = d; best = it; }
    }
    return best;
  }
  interact(it) {
    const pl = this.player; if (!it || pl.dead) return;
    const d = Math.hypot(pl.pos.x - it.x, pl.pos.z - it.z);
    if (d > it.r) { pl.follow = it; pl.moveTo = null; return; }
    pl.follow = null; pl.moveTo = null; pl.rot = Math.atan2(it.x - pl.pos.x, it.z - pl.pos.z);
    if (it.kind === 'node') return this.startGather(it);
    if (it.kind === 'revive') { pl.reviving = { ally: it.ally, t: 0, need: 2 }; this.ui.bossCast?.('Reviving ' + it.name, 2); this.ui.log(`You help ${it.name} up...`, 'info'); return; }
    this.ui.openInteract(it);
  }
  startGather(node) {
    const G = this.G; const nt = NODE_TYPES[node.type]; const tier = NODE_TIERS[node.tier];
    if (node.respawn > 0) { this.ui.toast('That one is depleted. It will grow back soon.'); return; }
    const lvl = skillLevel(G, nt.skill);
    if (lvl < tier.level) { this.ui.toast(`You need ${nt.skill[0].toUpperCase() + nt.skill.slice(1)} level ${tier.level} (T${node.tier}).`); return; }
    if (!canAdd(G, `${node.type}_t${node.tier}`)) { this.ui.toast('Your bag is full!'); return; }
    const sb = P.skillBonus(G, nt.skill); const dur = Math.max(0.6, tier.time * (1 - Math.min(0.5, (lvl - tier.level) * 0.02)) * (1 - artisanBonus(G).gspeed) * (1 - sb.speed) * (1 - Math.min(0.4, this.buff('gspeed'))));
    this.player.gathering = { node, t: 0, dur };
  }
  finishGather() {
    const G = this.G, pl = this.player, g = pl.gathering; const node = g.node; const nt = NODE_TYPES[node.type]; const tier = NODE_TIERS[node.tier];
    const id = `${node.type}_t${node.tier}`;
    const n = this.rand() < 0.1 + skillLevel(G, nt.skill) * 0.004 + artisanBonus(G).yield + P.skillBonus(G, nt.skill).yield ? 2 : 1;
    const left = addItem(G, id, n); const got = n - left;
    if (got > 0) {
      this.ui.log(`You ${nt.verb.toLowerCase()} ${got}× ${ITEMS[id].name}.`, 'loot');
      P.grantSkillXp(G, nt.skill, tier.xp * got); P.onGather(G, id, got);
      this.ui.floatText(node.obj.position, 2.6, `+${got} ${ITEMS[id].icon}`, 'loot');
      this.fxBurst(new THREE.Vector3(node.x, node.obj.position.y, node.z), node.type === 'ore' ? '#d0c0a0' : node.type === 'wood' ? '#a0e070' : '#ffffff', 8);
    }
    node.uses--;
    if (node.uses <= 0) { node.respawn = NODE_RESPAWN; node.obj.scale.setScalar(0.35); this.ui.log(`The ${node.name} is depleted.`, 'info'); pl.gathering = null; }
    else if (!canAdd(G, id)) { this.ui.toast('Your bag is full!'); pl.gathering = null; }
    else { g.t = 0; }
    this.ui.refresh();
  }

  // ------------------------------------------------------------------ main update
  update(dt) {
    dt = Math.min(dt, 0.1); this.t += dt; const G = this.G, pl = this.player, d = derived(G);
    G.playTime += dt;
    // timers
    for (const k in pl.cds) pl.cds[k] = Math.max(0, pl.cds[k] - dt);
    pl.buffs = pl.buffs.filter((b) => b.until > this.t);
    pl.iframes = Math.max(0, pl.iframes - dt); pl.combatT = Math.max(0, pl.combatT - dt);
    if (pl.dead) { pl.dead -= dt; if (pl.dead <= 0) this.playerRespawn(); }
    // regen
    if (!pl.dead) {
      const ooc = pl.combatT <= 0;
      G.hp = Math.min(d.maxHp, G.hp + dt * ((ooc ? d.maxHp * 0.04 * (1 + this.buff('regen') * 0.1) : d.maxHp * 0.004) + this.buff('regen')));
      G.mp = Math.min(d.maxMp, G.mp + dt * (2 + d.maxMp * 0.01 + this.buff('mpRegen')));
      if (ooc) G.adr = Math.max(0, G.adr - dt * 4);
    }
    // movement
    let mx = this.transit.ride ? 0 : this.input.x, mz = this.transit.ride ? 0 : this.input.z; const moving = (mx || mz) && !pl.dead;
    if (this.transit.ride) { pl.moveTo = null; pl.follow = null; }
    if (moving) { pl.moveTo = null; pl.follow = null; pl.gathering = null; }
    const fol = pl.follow;
    if (fol && !pl.dead) {
      const tp = fol.pos || { x: fol.x, z: fol.z };
      const reach = fol.kind === 'mob' ? this.attackRange() : fol.r - 0.4;
      const dd = Math.hypot(tp.x - pl.pos.x, tp.z - pl.pos.z);
      if (fol.kind === 'mob' && fol.dead) pl.follow = null;
      else if (dd <= reach) { pl.follow = null; if (fol.kind !== 'mob') this.interact(fol); }
      else { mx = (tp.x - pl.pos.x) / dd; mz = (tp.z - pl.pos.z) / dd; }
    } else if (pl.moveTo && !pl.dead) {
      const dx = pl.moveTo.x - pl.pos.x, dz = pl.moveTo.z - pl.pos.z, dd = Math.hypot(dx, dz);
      if (dd < 0.3) pl.moveTo = null; else { mx = dx / dd; mz = dz / dd; }
    }
    let mv = 0;
    if (pl.dash) {
      const step = Math.min(pl.dash.left, pl.dash.speed * dt); pl.dash.left -= step;
      this.moveBy(pl.pos, pl.dash.dir.x * step, pl.dash.dir.z * step, 0.45);
      if (pl.dash.ab.mult) for (const m of this.mobsNear(pl.pos, pl.dash.width + 0.5)) if (!pl.dash.hitSet.has(m)) { pl.dash.hitSet.add(m); this.damageMob(m, pl.dash.base, pl.dash.ab); }
      if (pl.dash.left <= 0) pl.dash = null; mv = 1;
    } else if ((mx || mz) && !pl.dead) {
      const len = Math.hypot(mx, mz); const sp = d.speed * Math.min(1, len) * (pl.combatT > 0 ? 0.9 : 1);
      this.moveBy(pl.pos, mx / len * sp * dt, mz / len * sp * dt, 0.45);
      const tr = Math.atan2(mx, mz); pl.rot += ang(tr - pl.rot) * Math.min(1, dt * 14); mv = Math.min(1, len);
    }
    pl.moving = mv;
    if (!this.transit.ride) pl.pos.y += (groundAt(pl.pos.x, pl.pos.z) - pl.pos.y) * Math.min(1, dt * 20);
    // auto attack
    const tgt = this.validTarget();
    if (tgt && this.autoAttack && !pl.dead && !pl.gathering) {
      const dd = dist2(tgt.pos, pl.pos);
      if (dd > 40) this.setTarget(null);
      else if (dd <= this.attackRange() + tgt.radius && tgt.aggro !== undefined) { const basic = this.loadout()[0]; if (basic && !(pl.cds[basic] > 0) && (tgt.aggro || pl.combatT > 0 || pl.follow === tgt || true)) this.useAbility(0); }
    } else if (pl.target && pl.target.dead) this.setTarget(null);
    // gathering
    if (pl.gathering && !pl.dead) {
      const g = pl.gathering; g.t += dt; pl.rot = Math.atan2(g.node.x - pl.pos.x, g.node.z - pl.pos.z);
      if (Math.floor(g.t / 0.55) !== Math.floor((g.t - dt) / 0.55)) { pl.atk = 0; pl.atkKind = g.node.type === 'fibre' ? 'punch' : 'slash'; }
      if (g.t >= g.dur) this.finishGather();
    }
    this.ui.gatherBar(pl.gathering ? pl.gathering.t / pl.gathering.dur : null, pl.gathering ? pl.gathering.node.name : '');
    // animation
    if (pl.atk >= 0) { pl.atk += dt * 3.2; if (pl.atk >= 1) pl.atk = -1; }
    pl.cast = Math.max(0, pl.cast - dt);
    const g = pl.char.group; g.position.copy(pl.pos); g.rotation.y = pl.rot;
    if (pl.emote && pl.emote.face && this.t < pl.emote.until && mv < 0.1) pl.rot += ang(this.cam.yaw + Math.PI - pl.rot) * Math.min(1, dt * 10);
    { const L = G.equip.lacrima ? ITEMS[G.equip.lacrima] : null; pl.char.parts.pose = (L && SCHOOL_POSE[L.school]) || 'hero'; }
    animateCharacter(pl.char, { t: this.t, move: mv, atk: pl.atk, kind: pl.atkKind, cast: pl.cast > 0 ? Math.min(1, pl.cast * 3) : 0, dead: !!pl.dead, emote: pl.emote && this.t < pl.emote.until && mv < 0.1 ? pl.emote.kind : null });
    if (pl.iframes > 0 && pl.dash) g.rotation.x = 0; // roll is implied by the dash burst
    // world systems
    this.updateEntities(dt); this.updateProjectiles(dt); this.updateTeles(dt); this.updateTraps(dt); this.updateFx(dt); this.magic.update(dt); P.tickRivals(this.G, dt); this.fameT = (this.fameT || 0) - dt; if (this.fameT <= 0 && this.world.setFame) { this.fameT = 3; const rows = P.guildStandings(G); const key = rows.map((r) => r.id + Math.round(r.fame)).join(); if (key !== this.fameKey) { this.fameKey = key; this.world.setFame(rows); } }
    for (const n of this.world.nodes) if (n.respawn > 0) { n.respawn -= dt; if (n.respawn <= 0) { n.respawn = 0; n.uses = NODE_TIERS[n.tier].uses; n.obj.scale.setScalar(1); } }
    // boss party: guildmates join on the boss's S-rank job or its quest stage (one arena at a time)
    let boss = null, bd = 1e9;
    for (const e of this.entities) if (e.tpl && e.tpl.boss && !e.dead) { const A = arenaOf(e.tpl); const dd = Math.hypot(pl.pos.x - A.x, pl.pos.z - A.z); if (dd < bd) { bd = dd; boss = e; } }
    const arena = boss ? arenaOf(boss.tpl) : BOSS_ARENA; const inArena = boss && bd < arena.r + 6;
    const pty = boss && boss.tpl.party;
    const wantsParty = pty && (G.jobs.active.some((a) => pty.jobs.includes(a.id)) || (pty.quest && G.quests[pty.quest[0]] && G.quests[pty.quest[0]].stage === pty.quest[1]));
    if (inArena && wantsParty && !this.entities.some((e) => e.guildmate)) {
      for (const id of pty.ids) this.summon(id, 0, 0.6 + d.level * 0.03, { guildmate: true });
      this.ui.toast(pty.line);
    }
    for (const e of [...this.entities]) if (e.guildmate && (!inArena && Object.values(BOSS_ARENAS).every((A) => dist2(e.pos, A) > A.r + 30))) this.removeEntity(e);
    this.ui.boss(boss && !boss.dead && boss.aggro ? boss : null);
    // camera + world
    this.updateCamera(dt);
    this.transit.update(dt);
    this.world.update(this.t, pl.pos);
    const inside = pl.pos.x > HALL.minX && pl.pos.x < HALL.maxX && pl.pos.z > HALL.minZ && pl.pos.z < HALL.maxZ;
    this.world.hallRoof.visible = !inside;
    // persistence
    G.pos = [pl.pos.x, pl.pos.z]; G.rot = pl.rot;
    this.saveT += dt; if (this.saveT > 15) { this.saveT = 0; saveGame(G); }
    this.zone = zoneAt(pl.pos.x, pl.pos.z);
    const place = placeAt(pl.pos.x, pl.pos.z); const pid = place ? place.id : null;
    if (pid !== this.placeId) { this.placeId = pid; if (place) { const first = !G.discovered[pid]; G.discovered[pid] = true; this.ui.arrive(place, first); if (first && place.station) this.ui.log(`Discovered ${place.station.label}: fast travel unlocked on the World Map (M).`, 'lvl'); } }
  }
  // ------------------------------------------------------------------ travel
  /** Teleport with a fade. kind: 'train' | 'boat' | 'debug' */
  travel(dest, kind = 'train') {
    const G = this.G, pl = this.player; const p = PLACE[dest]; if (!p || pl.dead || this.travelling) return false;
    let cost = 0, tx, tz, rot = pl.rot;
    if (kind === 'train') { cost = trainCost(this.placeId || 'magnolia', dest); [tx, tz] = p.station.pos; const st = this.world.interactables.find((i) => i.kind === 'rail' && i.place === dest); if (st) { tx = st.x; tz = st.z; } }
    else if (kind === 'boat') { cost = FERRY_COST; const d = this.world.docks[dest]; tx = d.x; tz = d.z; rot = d.rot; }
    else [tx, tz] = p.pos;
    cost = Math.round(cost * (1 - P.globalSkillFx(G).travel)); // Exceed Bonding: Happy carries you part of the way
    if (this.entities.some((e) => e.kind === 'mob' && e.aggro && !e.dead)) { this.ui.toast('You can\'t travel in the middle of a fight!'); return false; }
    if (G.jewels < cost) { this.ui.toast(`Not enough Jewels (${cost} J needed).`); return false; }
    G.jewels -= cost; this.travelling = true;
    const arrive = () => {
      pl.pos.set(tx, 0, tz); pl.pos.y = groundAt(tx, tz); pl.rot = rot; pl.moveTo = null; pl.follow = null; pl.gathering = null; this.setTarget(null);
      this.cam.yaw = rot; this.cam.tx = tx; this.cam.tz = tz; this.cam.ty = pl.pos.y + 1.4;
      for (const e of this.entities) if (e.kind === 'escort' || e.kind === 'ally') { e.pos.set(tx + 1.5, groundAt(tx + 1.5, tz), tz); }
      this.world.flush(tx, tz); this.travelling = false;
      if (cost) this.ui.log(`Paid ${cost} Jewels for the ${kind === 'boat' ? 'ferry' : 'train'}. ${kind === 'train' && G.look && dest !== 'magnolia' ? '(Natsu would have thrown up twice by now.)' : ''}`, 'info');
      saveGame(G); this.ui.refresh();
    };
    if (kind === 'train' || kind === 'boat') { // ride the real route
      const from = this.placeId || 'magnolia'; let path;
      if (kind === 'train') path = railPath(PLACE[from].station ? PLACE[from].station.pos : [pl.pos.x, pl.pos.z], p.station.pos);
      else { const A = this.ui.wmOpts && this.ui.wmOpts.from ? this.world.docks[this.ui.wmOpts.from] : null; const B = this.world.docks[dest]; const land = (x, z) => this.world.yAt(x, z) > -1.6; path = seaPathFor(A ? A.boat.slice(0, 2) : [pl.pos.x, pl.pos.z], B.boat.slice(0, 2), land); }
      this.ui.log(kind === 'boat' ? `⛵ All aboard for ${p.name}! (Press Skip to arrive now.)` : `🚂 All aboard the magic train to ${p.station.label}! (Press Skip to arrive now.)`, 'info');
      this.ui.closeWorldMap(); this.ui.closePanel(); this.setTarget(null); this.transit.start(kind, path, dest, () => this.ui.fade(kind === 'boat' ? `⛵ Docking at ${p.name}…` : `🚂 Arriving at ${p.station.label}…`, arrive));
      return true;
    }
    this.ui.fade(`✨ ${p.name}`, arrive);
    return true;
  }
  attackRange() {
    const w = this.G.equip.weapon ? ITEMS[this.G.equip.weapon] : null; const r = w ? WEAPON_TYPES[w.weaponType].range : 2;
    return r;
  }

  updateEntities(dt) {
    const pl = this.player, G = this.G;
    for (const e of [...this.entities]) {
      if (e.kind === 'mob') {
        const far = !e.aggro && Math.abs(e.pos.x - pl.pos.x) + Math.abs(e.pos.z - pl.pos.z) > 170;
        if (far) { e.obj.visible = false; if (e.dead) this.updateMob(e, dt); continue; }
        if (!e.dead) e.obj.visible = true;
        this.updateMob(e, dt);
      }
      else if (e.kind === 'ally') this.updateAlly(e, dt);
      else if (e.kind === 'escort') this.updateEscort(e, dt);
      if (!this.entities.includes(e)) continue;
      if (!e.dead) {
        e.obj.position.set(e.pos.x, e.pos.y + (e.tpl && e.tpl.float ? e.tpl.float : 0), e.pos.z); e.obj.rotation.y = e.rot;
        if (e.atk >= 0) { e.atk += dt * 2.5; if (e.atk >= 1) e.atk = -1; }
        if (e.model.char) animateCharacter(e.model.char, { dead: !!e.downed, t: this.t + e.pos.x, move: e.moving || 0, atk: e.atk, kind: e.tpl.role === 'healer' ? 'slash' : 'punch', cast: e.tpl.role === 'healer' && e.atk >= 0 ? 1 : 0 });
        else animateMob(e.model, e.tpl ? e.tpl.model : (e.modelName || 'cat'), this.t + e.pos.x, e.moving || 0, e.atk);
      }
    }
  }
  allyTargets() { return [{ ref: 'player', pos: this.player.pos, dead: this.player.dead }, ...this.entities.filter((e) => e.kind === 'ally' && !e.downed).map((e) => ({ ref: e, pos: e.pos, taunt: e.tpl.taunt }))]; }
  updateMob(m, dt) {
    const pl = this.player, tpl = m.tpl;
    if (m.dead) { m.respawn -= dt; if (m.respawn <= 0) this.respawnMob(m); return; }
    if (m.burn) { if (this.t > m.burn.until) m.burn = null; else { m.burn.tick -= dt; if (m.burn.tick <= 0) { m.burn.tick = 1; this.damageMob(m, m.burn.dps, null, 'dot'); if (m.dead) return; } } }
    if (m.slowT > 0) { m.slowT -= dt; if (m.slowT <= 0) m.slow = 0; }
    m.moving = 0;
    if (m.stun > 0) { m.stun -= dt; return; }
    let homeD = dist2(m.pos, m.home);
    if (m.aggro && (pl.dead || dist2(pl.pos, m.pos) > 90)) { m.aggro = false; m.hp = m.maxHp; m.burn = null; if (tpl.boss) this.resetBoss(m); }
    const pd = pl.dead ? 1e9 : dist2(pl.pos, m.pos);
    if (!m.aggro) {
      const canSee = tpl.boss ? Math.hypot(pl.pos.x - arenaOf(tpl).x, pl.pos.z - arenaOf(tpl).z) < arenaOf(tpl).r : pd < tpl.aggro;
      if (canSee && !pl.dead) { m.aggro = true; if (tpl.bark) this.ui.log(`${tpl.name}: "${tpl.bark[Math.floor(this.rand() * tpl.bark.length)]}"`, 'npc'); }
      else {
        // wander
        if (!m.wander || this.rand() < dt * 0.15) m.wander = m.home.clone().add(new THREE.Vector3((this.rand() - 0.5) * 8, 0, (this.rand() - 0.5) * 8));
        const dx = m.wander.x - m.pos.x, dz = m.wander.z - m.pos.z, dd = Math.hypot(dx, dz);
        if (dd > 0.5) { const s = tpl.speed * 0.35 * dt; this.moveBy(m.pos, dx / dd * s, dz / dd * s, m.radius); m.rot += ang(Math.atan2(dx, dz) - m.rot) * Math.min(1, dt * 5); m.moving = 0.5; }
        if (m.hp < m.maxHp) m.hp = Math.min(m.maxHp, m.hp + m.maxHp * 0.1 * dt);
        m.pos.y = groundAt(m.pos.x, m.pos.z); return;
      }
    }
    if (tpl.boss && tpl.arena && !pl.dead) { // bosses stay inside their arena and only reset when you actually leave it
      const A = arenaOf(tpl); const ad = Math.hypot(m.pos.x - A.x, m.pos.z - A.z); if (ad > A.r - 2) { const k = (A.r - 2) / ad; m.pos.x = A.x + (m.pos.x - A.x) * k; m.pos.z = A.z + (m.pos.z - A.z) * k; }
      if (Math.hypot(pl.pos.x - A.x, pl.pos.z - A.z) < A.r + 10) homeD = 0; }
    if (homeD > (tpl.leash || 32) || pl.dead) { if (m.temp) { this.removeEntity(m); return; } m.aggro = false; m.hp = m.maxHp; m.wander = m.home.clone(); m.castLock = 0; if (tpl.boss) this.resetBoss(m); return; }
    // choose a victim: taunting ally near the mob, else player
    let victim = { ref: 'player', pos: pl.pos };
    let best = pd;
    for (const a of this.entities) if (a.kind === 'ally' && a.tpl.taunt && !a.downed) { const ad = dist2(a.pos, m.pos); if (ad < best + 3) { best = ad; victim = { ref: a, pos: a.pos }; } }
    const vd = dist2(victim.pos, m.pos);
    // boss telegraphs
    if (tpl.telegraphs) { if (this.bossThink(m, dt, victim)) { m.pos.y = groundAt(m.pos.x, m.pos.z); return; } }
    // boar charge
    if (tpl.charge) {
      m.chargeCd -= dt;
      if (m.charge) {
        m.charge.t -= dt;
        if (m.charge.windup > 0) { m.charge.windup -= dt; }
        else {
          const s = tpl.charge.speed * dt; this.moveBy(m.pos, Math.sin(m.charge.rot) * s, Math.cos(m.charge.rot) * s, m.radius); m.moving = 1;
          if (!m.charge.hit && !pl.dead && dist2(pl.pos, m.pos) < 1.6) { m.charge.hit = true; this.hurt('player', tpl.charge.dmg, tpl.name, m); }
          if (m.charge.t <= 0) m.charge = null;
        }
        m.pos.y = groundAt(m.pos.x, m.pos.z); return;
      }
      if (m.chargeCd <= 0 && vd > 4 && vd < 11 && victim.ref === 'player') {
        m.chargeCd = tpl.charge.cd; const rot = Math.atan2(victim.pos.x - m.pos.x, victim.pos.z - m.pos.z); m.rot = rot;
        m.charge = { rot, windup: 0.75, t: 0.75 + tpl.charge.dur, hit: false };
        this.addTele({ shape: 'rect', x: m.pos.x, z: m.pos.z, rot, length: tpl.charge.speed * tpl.charge.dur, width: 1.8, windup: 0.75, owner: m, dmg: 0, visualOnly: true });
        return;
      }
    }
    // chase / attack
    const want = tpl.ranged ? tpl.range * 0.75 : tpl.range * 0.85 + (victim.ref === 'player' ? 0 : 0.3);
    const rot = Math.atan2(victim.pos.x - m.pos.x, victim.pos.z - m.pos.z); m.rot += ang(rot - m.rot) * Math.min(1, dt * 8);
    if (vd > want) { const s = tpl.speed * (1 - m.slow) * dt; this.moveBy(m.pos, Math.sin(rot) * s, Math.cos(rot) * s, m.radius); m.moving = 1; }
    else if (tpl.ranged && vd < want * 0.5) { const s = tpl.speed * 0.6 * dt; this.moveBy(m.pos, -Math.sin(rot) * s, -Math.cos(rot) * s, m.radius); m.moving = 0.6; }
    m.atkCd -= dt;
    if (m.atkCd <= 0 && vd <= tpl.range + 0.5) {
      m.atkCd = tpl.atkCd * (1 + m.slow); m.atk = 0;
      if (tpl.ranged) this.fireProj(m.pos, victim.ref === 'player' ? { pos: pl.pos } : victim.ref, null, { speed: 16 }, tpl.dmg, 'mob', tpl.projColor || '#9a7aff', { y: tpl.float || 1, size: 0.3 });
      else this.hurt(victim.ref, tpl.dmg * (0.85 + this.rand() * 0.3), tpl.name, m);
    }
    m.pos.y = groundAt(m.pos.x, m.pos.z);
  }
  bossThink(m, dt, victim) {
    const tpl = m.tpl;
    if (m.slam >= 1) { m.slam += dt * 2; if (m.slam > 1.7) m.slam = -1; }
    if (m.transition > 0) { m.transition -= dt; m.moving = 0; if (m.transition <= 0) { this.ui.shake(0.5); this.fxRing(m.pos, 9, tpl.projColor || '#ffd23a', true); } return true; }
    if (m.shieldMobs) this.shielded(m);
    if (m.form === 'flute') {
      // Transformation: the flute rises, plays, and the wooden demon grows out of it.
      if (!m.transforming) { m.transforming = 3.6; this.ui.log('🎵 The cursed flute floats up and begins to play... Lullaby awakens!', 'warn'); this.ui.bossCast('Awakening', 3.6); this.ui.toast('🎵 Lullaby is transforming!'); }
      m.transforming -= dt; m.transform = Math.min(1, 1 - m.transforming / 3.6); m.singing = 1;
      if (m.transforming <= 0) { m.form = 'demon'; m.transform = 1; m.singing = 0; this.ui.shake(0.8); this.fxRing(m.pos, 10, '#8affc0', true); this.ui.log(`${tpl.name}: "${tpl.bark[0]}"`, 'npc'); }
      return true;
    }
    for (const t of tpl.telegraphs) m.teleCds[t.id] = (m.teleCds[t.id] ?? t.cd * 0.4) - dt;
    if (m.castLock > 0) {
      m.castLock -= dt; m.atk = m.castLock < 0.4 && !m.castT.slam ? 0.5 : -1;
      if (m.castT.slam) m.slam = Math.min(0.999, 1 - m.castLock / m.castT.windup); if (m.castLock <= 0 && m.castT.slam) m.slam = 1;
      if (m.bossCharge && m.castLock <= 0) { m.bossCharge.go = true; }
      return true;
    }
    if (m.bossCharge && m.bossCharge.go) {
      const c = m.bossCharge; const s = 22 * dt; c.left -= s; this.moveBy(m.pos, Math.sin(c.rot) * s, Math.cos(c.rot) * s, m.radius); m.moving = 1;
      if (c.left <= 0) m.bossCharge = null; return true;
    }
    const ph = tpl.phases ? [...tpl.phases].reverse().find((p) => m.phase >= p.n) : null; const cdMul = ph ? ph.cdMul : 1;
    const ready = tpl.telegraphs.filter((t) => m.teleCds[t.id] <= 0 && (t.phase || 1) <= (m.phase || 1));
    if (ready.length && dist2(victim.pos, m.pos) < 20) {
      const t = ready[Math.floor(this.rand() * ready.length)]; m.teleCds[t.id] = t.cd * cdMul; m.castT = t;
      const rot = Math.atan2(victim.pos.x - m.pos.x, victim.pos.z - m.pos.z); m.rot = rot;
      this.ui.log(`⚠️ ${tpl.short || tpl.name} prepares ${t.name}!`, 'warn'); this.ui.sfx?.('warn'); this.ui.bossCast(t.name, t.windup);
      if (t.song) m.singing = 1;
      if (t.at === 'summon') {
        for (let i = 0; i < t.count; i++) { const a = rot + (i ? 1.3 : -1.3); const x = m.pos.x + Math.sin(a) * 5, z = m.pos.z + Math.cos(a) * 5;
          this.addTele({ shape: 'circle', x, z, radius: t.radius, windup: t.windup, friendly: true, color: '#9a3aff', magic: true, owner: m, onHit: () => { if (m.dead) return; const e = this.makeMob(t.mob, x, z); e.aggro = true; this.fxBurst(e.pos, '#b070ff', 20); } }); }
      } else if (t.at === 'targets') {
        const victims = this.allyTargets().filter((v) => !v.dead).slice(0, t.count);
        for (const v of victims) this.addTele({ shape: 'circle', x: v.pos.x, z: v.pos.z, radius: t.radius, windup: t.windup, dmg: t.dmg, owner: m, name: t.name });
      } else if (t.at === 'victim') {
        this.addTele({ shape: 'circle', x: victim.pos.x, z: victim.pos.z, radius: t.radius, windup: t.windup, dmg: t.dmg, owner: m, name: t.name });
      } else if (t.shape === 'rect') {
        if (t.dash) m.bossCharge = { rot, left: t.length - 2, go: false };
        this.addTele({ shape: 'rect', x: m.pos.x, z: m.pos.z, rot, length: t.length, width: t.width, windup: t.windup, dmg: t.dmg, owner: m, name: t.name });
      } else this.addTele({ shape: t.shape, x: m.pos.x, z: m.pos.z, radius: t.radius, inner: t.inner, windup: t.windup, dmg: t.dmg, owner: m, name: t.name, song: t.song });
      if (t.song && tpl.model === 'lullaby') { this.ui.toast('🎵 Song of Death! Get close to Lullaby to escape the sound!'); }
      m.castLock = t.windup; return true;
    }
    return false;
  }
  reviveAlly(a) {
    a.downed = false; a.hp = a.maxHp * 0.5; this.world.interactables = this.world.interactables.filter((i) => i !== a.reviveIt); a.reviveIt = null;
    this.fxRing(a.pos, 1.8, '#7affb0', true); this.fxBurst(a.pos, '#c0ffd8', 18); this.ui.toast(`✨ ${a.tpl.name.replace(' (party)', '')} is back on their feet!`); this.ui.sfx?.('level');
  }
  updateAlly(a, dt) {
    const pl = this.player; const tpl = a.tpl;
    if (a.downed) {
      a.moving = 0; a.downT -= dt; if (a.reviveIt) { a.reviveIt.x = a.pos.x; a.reviveIt.z = a.pos.z; }
      const r = pl.reviving; if (r && r.ally === a) { if (dist2(pl.pos, a.pos) > 3 || pl.dead) { pl.reviving = null; this.ui.log('Revive interrupted.', 'warn'); } else { r.t += dt; pl.cast = 0.4; if (r.t >= r.need) { pl.reviving = null; this.reviveAlly(a); } } }
      if (a.downed && a.downT <= 0) { this.world.interactables = this.world.interactables.filter((i) => i !== a.reviveIt); this.ui.log(`${tpl.name} is carried back to the guild to recover.`, 'npc'); this.removeEntity(a); }
      return;
    }
    if (this.t > a.until) { this.fxBurst(a.pos, '#fff0b0', 12); this.ui.log(`${tpl.name} returns to the spirit world.`, 'npc'); this.removeEntity(a); return; }
    a.moving = 0;
    let foe = this.validTarget();
    if (!foe || dist2(foe.pos, pl.pos) > 20) foe = this.entities.find((e) => e.kind === 'mob' && !e.dead && e.aggro && dist2(e.pos, pl.pos) < 18) || null;
    if (tpl.role === 'healer') {
      a.healCd -= dt;
      const hurtList = [{ ref: 'player', frac: this.G.hp / derived(this.G).maxHp, pos: pl.pos }, ...this.entities.filter((e) => e.kind === 'ally' && !e.downed).map((e) => ({ ref: e, frac: e.hp / e.maxHp, pos: e.pos }))];
      const low = hurtList.filter((h) => !(h.ref === 'player' && pl.dead)).sort((x, y) => x.frac - y.frac)[0];
      if (a.healCd <= 0 && low && low.frac < 0.85) {
        a.healCd = 3.2; a.atk = 0; const amt = tpl.heal * a.mult * (1 + derived(this.G).level * 0.08);
        if (low.ref === 'player') { this.G.hp = Math.min(derived(this.G).maxHp, this.G.hp + amt); this.ui.floatText(pl.pos, 2.4, '+' + Math.round(amt), 'heal'); }
        else { low.ref.hp = Math.min(low.ref.maxHp, low.ref.hp + amt); this.ui.floatText(low.ref.pos, 2.2, '+' + Math.round(amt), 'heal'); }
        this.fxRing(low.pos, 1.3, '#7affb0');
      }
    }
    if (foe) {
      const d = dist2(foe.pos, a.pos); const rot = Math.atan2(foe.pos.x - a.pos.x, foe.pos.z - a.pos.z); a.rot += ang(rot - a.rot) * Math.min(1, dt * 8);
      if (d > tpl.range * 0.9 + foe.radius) { const s = tpl.speed * dt; this.moveBy(a.pos, Math.sin(rot) * s, Math.cos(rot) * s, a.radius); a.moving = 1; }
      a.atkCd -= dt;
      if (a.atkCd <= 0 && d <= tpl.range + foe.radius + 0.4) {
        a.atkCd = tpl.atkCd; a.atk = 0; const dmg = tpl.dmg * a.mult * (1 + derived(this.G).level * 0.1);
        if (tpl.range > 4) this.fireProj(a.pos, foe, null, { speed: 22 }, dmg, 'ally', tpl.school ? SCHOOL_COLORS[tpl.school][0] : tpl.model === 'maiden' ? '#7ad8ff' : '#a0ffd0', { y: 1.4 });
        else this.damageMob(foe, dmg, null, 'ally');
      }
    } else {
      const d = dist2(pl.pos, a.pos);
      if (d > 3) { const rot = Math.atan2(pl.pos.x - a.pos.x, pl.pos.z - a.pos.z); a.rot = rot; const s = Math.min(tpl.speed * (d > 8 ? 1.6 : 1) * dt, d - 2.5); this.moveBy(a.pos, Math.sin(rot) * s, Math.cos(rot) * s, a.radius); a.moving = 1; }
    }
    a.pos.y = groundAt(a.pos.x, a.pos.z);
  }
  updateEscort(c, dt) {
    const pl = this.player; const job = this.G.jobs.active.find((x) => x.id === 'j_cat');
    if (!job || job.prog >= 1) { this.removeEntity(c); return; }
    const [sx, sz] = POIS.shrine.pos; const dShrine = Math.hypot(c.pos.x - sx, c.pos.z - sz);
    if (dShrine < 5.5) {
      job.prog = 1; this.fxBurst(c.pos, '#9af0ff', 24);
      this.ui.log('Plue made it to the cathedral steps and is eating a lollipop. Mission accomplished. Report to Mirajane!', 'quest'); this.ui.toast('🐈 Escort complete!');
      this.removeEntity(c); this.ui.refresh(); return;
    }
    const d = dist2(pl.pos, c.pos); c.moving = 0;
    if (d > 14) { c.warnT -= dt; if (c.warnT <= 0) { c.warnT = 8; this.ui.log('Plue sits down, shivers and refuses to move until you come back.', 'npc'); } }
    else if (d > 2.2) { const rot = Math.atan2(pl.pos.x - c.pos.x, pl.pos.z - c.pos.z); c.rot = rot; const s = Math.min(4.6 * dt, d - 2); this.moveBy(c.pos, Math.sin(rot) * s, Math.cos(rot) * s, 0.4); c.moving = 1; }
    c.pos.y = groundAt(c.pos.x, c.pos.z);
  }
  updateProjectiles(dt) {
    for (const p of [...this.projectiles]) {
      p.life -= dt;
      if (p.homing && !p.homing.dead && p.homing.pos) { const h = p.homing; const to = new THREE.Vector3(h.pos.x - p.pos.x, (h.pos.y + (h.tpl && h.tpl.boss ? 3 : 0.9)) - p.pos.y, h.pos.z - p.pos.z).normalize(); p.dir.lerp(to, Math.min(1, dt * 10)).normalize(); }
      p.pos.addScaledVector(p.dir, p.speed * dt); p.mesh.position.copy(p.pos); p.mesh.lookAt(p.pos.clone().add(p.dir));
      let done = p.life <= 0;
      if (p.faction === 'mob') {
        const pl = this.player;
        if (!pl.dead && Math.hypot(pl.pos.x - p.pos.x, pl.pos.z - p.pos.z) < 0.8 && Math.abs(pl.pos.y + 1 - p.pos.y) < 1.6) { this.hurt('player', p.dmg, p.src || 'dark magic'); done = true; }
        for (const a of this.entities) if (!done && a.kind === 'ally' && !a.downed && dist2(a.pos, p.pos) < 0.8) { this.hurt(a, p.dmg, 'dark magic'); done = true; }
      } else {
        for (const m of this.entities) {
          if (m.kind !== 'mob' || m.dead || p.hits.has(m)) continue;
          if (dist2(m.pos, p.pos) < m.radius + 0.5 && p.pos.y > m.pos.y - 0.5 && p.pos.y < m.pos.y + (m.tpl.boss ? 6 : 2.5)) {
            p.hits.add(m); this.damageMob(m, p.dmg, p.ab, p.faction); this.fxBurst(p.pos.clone().setY(p.pos.y - 1), p.ab.color || '#a0ffd0', 6);
            if (!p.pierce) { done = true; break; }
          }
        }
      }
      if (p.pos.y < groundAt(p.pos.x, p.pos.z) - 0.2) done = true;
      if (done) { this.scene.remove(p.mesh); p.mesh.geometry.dispose(); this.projectiles.splice(this.projectiles.indexOf(p), 1); }
    }
  }
  updateTeles(dt) {
    for (const t of [...this.teles]) {
      t.age += dt; const k = Math.min(1, t.age / t.windup); t.fill.scale.setScalar(Math.max(0.01, k));
      if (t.shape === 'rect') { t.fill.scale.set(1, Math.max(0.01, k), 1); }
      if (t.rings) t.rings.forEach((r, i) => { const f = ((t.age * 0.9 + i / 4) % 1); const rad = t.radius - (t.radius - t.inner) * f; r.scale.setScalar(rad); r.material.opacity = 0.25 + 0.6 * f * (0.5 + k / 2); });
      if (t.glyph) { t.glyph.rotation.z += dt * 2.5; t.glyph.scale.setScalar(0.5 + k * 0.6); }
      if (t.age >= t.windup) {
        if (t.onHit) t.onHit();
        else if (!t.visualOnly) {
          const pl = this.player;
          if (!pl.dead && this.inTele(t, pl.pos)) this.hurt('player', t.dmg, `Lullaby's ${t.name}`);
          for (const a of [...this.entities]) if (a.kind === 'ally' && this.inTele(t, a.pos)) this.hurt(a, t.dmg * 0.6, t.name);
          this.fxBurst(new THREE.Vector3(t.x, groundAt(t.x, t.z), t.z), '#ff8a4a', 18); this.ui.shake(0.35);
        }
        if (t.song && t.owner) { t.owner.singing = 0; this.ui.shake(0.7); }
        this.scene.remove(t.group); this.teles.splice(this.teles.indexOf(t), 1);
      }
    }
  }
  updateTraps(dt) {
    for (const tr of [...this.traps]) {
      tr.ring.rotation.z += dt * 2;
      let fire = false;
      if (this.t > tr.armed) for (const m of this.entities) if (m.kind === 'mob' && !m.dead && dist2(m.pos, tr.pos) < tr.ab.radius) { fire = true; break; }
      if (fire) { for (const m of this.mobsNear(tr.pos, tr.ab.radius + 0.5)) this.damageMob(m, tr.dmg, tr.ab); this.fxRing(tr.pos, tr.ab.radius, tr.ab.color, true); }
      if (fire || this.t > tr.until) { this.scene.remove(tr.g); this.traps.splice(this.traps.indexOf(tr), 1); }
    }
  }
  updateFx(dt) {
    if (this.requips) for (const r of [...this.requips]) { r.t += dt; const k = Math.min(1, Math.max(0, (r.t - 0.35) / 0.7)); r.bits.forEach((b, i) => b.scale.setScalar(Math.max(0.01, Math.min(1, k * 1.6 - i * 0.04)))); if (r.t > 1.2) { r.bits.forEach((b) => b.scale.setScalar(1)); this.requips.splice(this.requips.indexOf(r), 1); } }
    for (const f of [...this.fx]) {
      f.age += dt; const k = f.age / f.life;
      if (f.kind === 'ring') { f.m.scale.setScalar(0.3 + k * 0.9); f.m.material.opacity = 0.9 * (1 - k); }
      else if (f.kind === 'fade') { f.mat.opacity = 0.8 * (1 - k); f.m.scale.setScalar(0.8 + k * 0.4); }
      else if (f.kind === 'custom') f.upd(k, dt, f);
      else if (f.kind === 'beam') { for (const m of f.mats) m.opacity = (1 - k) * 0.85; f.m.scale.set(1 + k * 0.5, 1 + k * 0.5, 1); }
      else if (f.kind === 'requip') { for (const m of f.mats) m.opacity = Math.max(0, 1 - k) * 0.85; f.m.children.forEach((c, i) => { if (i > 1) c.position.y = (0.4 + (i - 2) * 0.8 + k * 4) % 6; }); f.m.scale.set(1 - k * 0.5, 1, 1 - k * 0.5); }
      else if (f.kind === 'burst') {
        const a = f.m.geometry.attributes.position;
        for (let i = 0; i < f.vel.length; i++) { f.vel[i].y -= 12 * dt; a.setXYZ(i, a.getX(i) + f.vel[i].x * dt, a.getY(i) + f.vel[i].y * dt, a.getZ(i) + f.vel[i].z * dt); }
        a.needsUpdate = true; f.m.material.opacity = 1 - k;
      }
      if (k >= 1) { this.scene.remove(f.m); f.m.traverse?.((o) => { if (o.geometry) o.geometry.dispose(); if (o.material && o.material.dispose && f.kind !== 'ring') o.material.dispose(); }); if (f.kind === 'ring') { f.m.geometry.dispose(); f.m.material.dispose(); } this.fx.splice(this.fx.indexOf(f), 1); }
    }
  }
  updateCamera(dt) {
    const c = this.cam, pl = this.player;
    const inside = pl.pos.x > HALL.minX && pl.pos.x < HALL.maxX && pl.pos.z > HALL.minZ && pl.pos.z < HALL.maxZ;
    const dist = inside ? Math.min(c.dist, 7.5) : c.dist; const pitch = inside ? Math.max(c.pitch, 0.42) : c.pitch;
    const k = Math.min(1, dt * 10);
    c.tx += (pl.pos.x - c.tx) * k; c.ty += (pl.pos.y + 1.4 - c.ty) * k; c.tz += (pl.pos.z - c.tz) * k;
    const shake = this.ui.shakeAmt ? (this.rand() - 0.5) * this.ui.shakeAmt : 0;
    const cx = c.tx - Math.sin(c.yaw) * Math.cos(pitch) * dist, cz = c.tz - Math.cos(c.yaw) * Math.cos(pitch) * dist;
    let cy = c.ty + Math.sin(pitch) * dist; cy = Math.max(cy, groundAt(cx, cz) + 0.6);
    this.camera.position.set(cx + shake, cy + shake, cz);
    this.camera.lookAt(c.tx, c.ty, c.tz);
  }
  render() { if (this.post) this.post.render(); else this.renderer.render(this.scene, this.camera); }
}
