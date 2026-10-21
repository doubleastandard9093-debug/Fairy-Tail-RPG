import { ITEMS } from '../data/items.js';
import { SCHOOLS, rankForXp } from '../data/schools.js';
import { GUILD_RANKS } from '../data/jobs.js';
import { charLevelForXp, levelForXp } from './xp.js';
import { globalBonus, migrateTree } from '../data/skilltree.js';

export const SAVE_KEY = 'ftrpg_save_v1';
export const SETTINGS_KEY = 'ftrpg_settings_v1';
export const INV_SIZE = 28;
export const BANK_SIZE = 96;
export const SKILLS = {
  mining: { name: 'Mining', icon: '⛏️' },
  woodcutting: { name: 'Woodcutting', icon: '🪓' },
  foraging: { name: 'Foraging', icon: '🌿' },
  smithing: { name: 'Smithing', icon: '🔨' },
  crafting: { name: 'Crafting', icon: '🧶' },
};
export const STAT_INFO = {
  STR: 'Melee weapon damage',
  INT: 'Magic damage and max mana',
  AGI: 'Move speed, knuckles damage, cooldowns',
  DEX: 'Bow damage and critical chance',
  VIT: 'Max health',
};

export function newGame(opts) {
  const school = SCHOOLS[opts.school] ? opts.school : 'flame';
  const G = {
    v: 1, name: (opts.name || 'Wizard').slice(0, 16), look: { ...opts.look }, school,
    pos: [0, -22.5], rot: Math.PI,
    hp: 1, mp: 1, adr: 0,
    xp: 0, statPoints: 5, stats: { STR: 1, INT: 1, AGI: 1, DEX: 1, VIT: 1 },
    skills: Object.fromEntries(Object.keys(SKILLS).map((k) => [k, 0])),
    ranks: {}, jewels: 100, gp: 0, qp: 0,
    inv: new Array(INV_SIZE).fill(null), bank: new Array(BANK_SIZE).fill(null),
    equip: { weapon: null, weapon2: null, armor: null, lacrima: SCHOOLS[school].lacrima },
    quests: {}, jobs: { active: [], done: {}, completed: 0 }, kills: {}, crafted: {},
    playTime: 0, day: dayStamp(), tree: {}, respecs: 0,
  };
  const start = { flame: ['knuckles_t1', 'jacket_t1'], ice: ['sword1h_t1', 'robe_t1'], celestial: ['staff_t1', 'robe_t1'] }[school] || ['sword1h_t1', 'jacket_t1'];
  G.equip.weapon = start[0]; G.equip.armor = start[1];
  // Everyone gets a sword and a bow to try the other weapon styles.
  for (const id of ['sword1h_t1', 'bow_t1']) if (id !== G.equip.weapon) addItem(G, id, 1);
  addItem(G, 'tonic_hp', 5); addItem(G, 'tea_mp', 3);
  for (const k of SCHOOLS[school].startItems || []) addItem(G, k, 1);
  const d = derived(G); G.hp = d.maxHp; G.mp = d.maxMp;
  return G;
}

export function dayStamp() { const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); }

export function derived(G) {
  const level = charLevelForXp(G.xp);
  const armor = G.equip.armor ? ITEMS[G.equip.armor] : null;
  const s = G.stats; const tb = globalBonus(G);
  return {
    level,
    maxHp: Math.round((120 + 12 * (level - 1) + s.VIT * 9) * (1 + tb.hp)),
    maxMp: Math.round(60 + 5 * (level - 1) + s.INT * 4 + (armor ? armor.mp : 0) + tb.mp),
    def: armor ? armor.def : 0,
    speed: 6.2 * (1 + s.AGI * 0.006),
    cdr: Math.min(0.3, s.AGI * 0.004),
    crit: Math.min(0.5, 0.05 + s.DEX * 0.004 + tb.crit),
  };
}
export function skillLevel(G, k) { return levelForXp(G.skills[k] || 0); }
export function totalLevel(G) { return Object.keys(SKILLS).reduce((a, k) => a + skillLevel(G, k), 0); }
export function guildRank(G) { let r = GUILD_RANKS[0]; for (const g of GUILD_RANKS) if (G.gp >= g.gp) r = g; return r.r; }
export function nextGuildRank(G) { return GUILD_RANKS.find((g) => g.gp > G.gp) || null; }
export function classRank(G, key) { return rankForXp(G.ranks[key] || 0); }

// ---------- Inventory ----------
export function countItem(G, id, where = 'inv') { return G[where].reduce((a, s) => a + (s && s.id === id ? s.qty : 0), 0); }
export function freeSlots(G, where = 'inv') { return G[where].filter((s) => !s).length; }
export function canAdd(G, id, qty = 1, where = 'inv') {
  const it = ITEMS[id]; if (!it) return false;
  if (it.stack && G[where].some((s) => s && s.id === id)) return true;
  return freeSlots(G, where) >= (it.stack ? 1 : qty);
}
/** Adds items; returns the quantity that did NOT fit. Stackables use one slot per id. */
export function addItem(G, id, qty = 1, where = 'inv') {
  const it = ITEMS[id]; if (!it || qty <= 0) return qty;
  const arr = G[where];
  if (it.stack) {
    const s = arr.find((x) => x && x.id === id);
    if (s) { s.qty += qty; return 0; }
    const i = arr.indexOf(null); if (i < 0) return qty;
    arr[i] = { id, qty }; return 0;
  }
  while (qty > 0) { const i = arr.indexOf(null); if (i < 0) break; arr[i] = { id, qty: 1 }; qty--; }
  return qty;
}
export function removeItem(G, id, qty = 1, where = 'inv') {
  if (countItem(G, id, where) < qty) return false;
  const arr = G[where];
  for (let i = 0; i < arr.length && qty > 0; i++) {
    const s = arr[i]; if (!s || s.id !== id) continue;
    const take = Math.min(s.qty, qty); s.qty -= take; qty -= take;
    if (s.qty <= 0) arr[i] = null;
  }
  return true;
}
export function hasAll(G, req) { return Object.entries(req).every(([id, n]) => countItem(G, id) >= n); }

// ---------- Save / load ----------
export function saveGame(G) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(G)); return true; } catch { return false; } }
export function loadGame() {
  try { const raw = localStorage.getItem(SAVE_KEY); return raw ? migrate(JSON.parse(raw)) : null; } catch { return null; }
}
export function migrate(G) {
  if (!G || typeof G !== 'object' || !G.v || !Array.isArray(G.inv)) throw new Error('Not an Fairy Tail save');
  if (!G.tree) migrateTree(G, classRank);
  const base = newGame({ name: G.name, look: G.look || {}, school: G.school });
  for (const k of Object.keys(base)) if (G[k] === undefined) G[k] = base[k];
  while (G.inv.length < INV_SIZE) G.inv.push(null);
  while (G.bank.length < BANK_SIZE) G.bank.push(null);
  G.inv = G.inv.map((s) => (s && ITEMS[s.id] ? s : null));
  G.bank = G.bank.map((s) => (s && ITEMS[s.id] ? s : null));
  return G;
}
export function loadSettings() {
  const def = { quality: 'low', mute: false, vol: 0.7, musicVol: 0.5, sfxVol: 0.8, shake: true, touch: 'auto' };
  try { return { ...def, ...(JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}) }; } catch { return def; }
}
export function saveSettings(S) { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(S)); } catch { /* ignore */ } }
