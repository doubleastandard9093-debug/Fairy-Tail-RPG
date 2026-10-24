// Toram-style skill trees: one per magic school and weapon type. Skill points come from levelling
// (1 per level, +3 at start). Actives unlock abilities on the bar; passives boost the tree.
// Node: { id, name, icon, kind: 'active'|'passive', ab?, max, req: [[nodeId, rank]], row, col, fx }
import { ABILITIES, WEAPON_ABILITIES } from './abilities.js';
import { SCHOOLS } from './schools.js';
import { charLevelForXp, levelForXp } from '../core/xp.js';
import { PASSIVE_TREES } from './passives.js';
import { SETS, setTier } from './skills.js';
// Active skills have ranks 1-5: each rank past 1 adds +10% damage, -4% cooldown and +8% mana cost, and needs a higher character level.
export const ACTIVE_MAX = 5;
export const RANK_DMG = 0.1, RANK_CDR = 0.04, RANK_COST = 0.08;
export const rankLevel = (n, r) => (n.lvl || 1) + 4 * (r - 1); // character level needed for rank r

const FLAVOR = {
  flame: ['Dragon Lungs', 'Fire Eater', 'Dragon Force'], ice: ['Cold Emotion', 'Maker Stance', 'Ice Devil Mind'], celestial: ['Star Bond', 'Gate Mastery', 'Urano Light'],
  lightning: ['Static Body', 'Thunder Step', 'Raijin Spirit'], rune: ['Steady Hand', 'Quick Script', 'Enchanter'], requip: ['Armory', 'Quick Swap', 'Titania Will'],
  sword1h: ['Blade Mastery', 'Footwork', 'Keen Edge'], sword2h: ['Heavy Arms', 'Momentum', 'Crushing Blows'], bow: ['Hawk Eye', 'Quick Draw', 'Vital Shot'],
  staff: ['Arcane Study', 'Mana Weave', 'Spell Focus'], knuckles: ['Iron Fists', 'Combo Flow', 'Pressure Points'],
};
const TREE_KEYS = [...Object.keys(SCHOOLS), 'sword1h', 'sword2h', 'bow', 'staff', 'knuckles'];
function build(key) {
  const abs = SCHOOLS[key] ? SCHOOLS[key].abilities : WEAPON_ABILITIES[key]; const [m, e, f] = FLAVOR[key];
  const N = [];
  const act = (i, row, col, req) => N.push({ id: `${key}:${abs[i]}`, name: ABILITIES[abs[i]].name, icon: ABILITIES[abs[i]].icon, kind: 'active', ab: abs[i], max: ACTIVE_MAX, req, row, col, free: i === 0, lvl: [1, 2, 4, 7][i] || 1 });
  act(0, 0, 1, []);
  N.push({ id: `${key}:mastery`, name: m, icon: '📈', kind: 'passive', max: 5, req: [[`${key}:${abs[0]}`, 1]], row: 1, col: 0, fx: { dmg: 0.04 }, desc: '+4% damage with this tree per rank' });
  act(1, 1, 2, [[`${key}:${abs[0]}`, 1]]);
  N.push({ id: `${key}:focus`, name: e, icon: '⏱️', kind: 'passive', max: 3, req: [[`${key}:mastery`, 2]], row: 2, col: 0, fx: { cdr: 0.04 }, desc: '-4% cooldowns in this tree per rank' });
  act(2, 2, 2, [[`${key}:${abs[1]}`, 1]]);
  if (abs[3]) act(3, 3, 1, [[`${key}:${abs[2]}`, 1], [`${key}:mastery`, 3]]);
  N.push({ id: `${key}:power`, name: f, icon: SCHOOLS[key] ? '💠' : '❤️', kind: 'passive', max: 3, req: [[`${key}:focus`, 1]], row: 3, col: abs[3] ? 0 : 1,
    fx: SCHOOLS[key] ? { mp: 10 } : { hp: 0.03, crit: 0.01 }, desc: SCHOOLS[key] ? '+10 max mana per rank' : '+3% max health and +1% crit per rank' });
  N.push({ id: `${key}:empower`, name: `Empowered ${ABILITIES[abs[abs.length - 1]].name}`, icon: '✴️', kind: 'passive', max: 3, req: [[`${key}:${abs[abs.length - 1]}`, 1]], row: 4, col: 1, fx: { abDmg: 0.12, ab: abs[abs.length - 1] }, desc: `+12% damage for ${ABILITIES[abs[abs.length - 1]].name} per rank` });
  const adv = SCHOOLS[key] && SCHOOLS[key].advanced;
  if (adv) {
    const last = abs[abs.length - 1];
    N.push({ id: `${key}:${adv[0]}`, name: ABILITIES[adv[0]].name, icon: ABILITIES[adv[0]].icon, kind: 'active', ab: adv[0], max: ACTIVE_MAX, req: [[`${key}:${last}`, 1], [`${key}:mastery`, 3]], row: 5, col: 0, lvl: 10 });
    N.push({ id: `${key}:awaken`, name: 'Awakening', icon: '🌀', kind: 'passive', max: 3, req: [[`${key}:empower`, 1]], row: 5, col: 2, fx: { dmg: 0.05, cdr: 0.03 }, desc: '+5% damage and -3% cooldowns in this tree per rank' });
    N.push({ id: `${key}:${adv[1]}`, name: ABILITIES[adv[1]].name, icon: ABILITIES[adv[1]].icon, kind: 'active', ab: adv[1], max: ACTIVE_MAX, req: [[`${key}:${adv[0]}`, 2], [`${key}:awaken`, 1]], row: 6, col: 1, lvl: 18, ult: true });
  }
  return { key, group: 'active', name: SCHOOLS[key] ? SCHOOLS[key].name : { sword1h: 'Sword', sword2h: 'Greatsword', bow: 'Bow', staff: 'Staff', knuckles: 'Knuckles' }[key], icon: SCHOOLS[key] ? SCHOOLS[key].icon : { sword1h: '🗡️', sword2h: '⚔️', bow: '🏹', staff: '🪄', knuckles: '🥊' }[key], nodes: N };
}
export const TREES = Object.fromEntries(TREE_KEYS.map((k) => [k, build(k)]));
// Albion "Destiny Board"-style Artisan tree: its own points, earned from gathering + crafting levels (1 per 5 total).
TREES.artisan = { key: 'artisan', group: 'passive', name: 'Artisan', icon: '🛠️', points: 'artisan', nodes: [
  { id: 'artisan:eye', name: 'Keen Eye', icon: '🔍', kind: 'passive', max: 5, req: [], row: 0, col: 1, fx: { quality: 0.08 }, desc: 'Better odds of Good to Masterpiece quality when crafting gear, per rank' },
  { id: 'artisan:thrift', name: 'Thrifty Hands', icon: '♻️', kind: 'passive', max: 5, req: [['artisan:eye', 1]], row: 1, col: 0, fx: { refund: 0.05 }, desc: '+5% resource return rate on every craft per rank (Albion style)' },
  { id: 'artisan:yield', name: 'Bountiful Harvest', icon: '🧺', kind: 'passive', max: 5, req: [['artisan:eye', 1]], row: 1, col: 2, fx: { yield: 0.06 }, desc: '+6% chance per rank to gather a bonus resource' },
  { id: 'artisan:swift', name: 'Swift Gatherer', icon: '⚡', kind: 'passive', max: 3, req: [['artisan:yield', 2]], row: 2, col: 2, fx: { gspeed: 0.07 }, desc: '-7% gathering time per rank' },
  { id: 'artisan:refiner', name: 'Master Refiner', icon: '🔥', kind: 'passive', max: 3, req: [['artisan:thrift', 2]], row: 2, col: 0, fx: { refineX: 0.1 }, desc: '+10% chance per rank to refine two pieces at once' },
  { id: 'artisan:master', name: 'Masterwork', icon: '🏆', kind: 'passive', max: 3, req: [['artisan:refiner', 1], ['artisan:eye', 5]], row: 3, col: 1, fx: { quality: 0.15 }, desc: 'Large boost to Excellent and Masterpiece odds per rank' },
] };
for (const n of TREES.artisan.nodes) n.tree = 'artisan';
Object.assign(TREES, PASSIVE_TREES);
export const NODE = {}; for (const t of Object.values(TREES)) for (const n of t.nodes) { n.tree = t.key; NODE[n.id] = n; }

export const rankOf = (G, id) => (G.tree && G.tree[id]) || (NODE[id] && NODE[id].free ? 1 : 0);
const poolOf = (id) => { const n = NODE[id]; return (n && TREES[n.tree].points) || 'sp'; };
export { poolOf };
export function artisanEarned(G) { let t = 0; for (const x of Object.values(G.skills || {})) t += levelForXp(x); return Math.floor(t / 5); }
/** Passive Points: 1 + 1 per 2 character levels + 1 per Skill Set tier + 1 per 20 total life-skill levels. */
export function ppEarned(G) { let life = 0; for (const x of Object.values(G.skills || {})) life += levelForXp(x); let st = 0; for (const s of SETS) st += setTier(G, s); return 1 + Math.floor(charLevelForXp(G.xp) / 2) + st + Math.floor(life / 20) + (G.bonusPp || 0); }
const POOL_NAME = { sp: 'skill points', artisan: 'artisan points', pp: 'passive points' }; export const POOL_SHORT = { sp: 'SP', artisan: 'AP', pp: 'PP' };
export { POOL_NAME };
const norm = (p) => (p === true ? 'artisan' : p === false || p == null ? 'sp' : p);
export function pointsEarned(G, pool = 'sp') { pool = norm(pool); return pool === 'artisan' ? artisanEarned(G) : pool === 'pp' ? ppEarned(G) : 3 + (charLevelForXp(G.xp) - 1) + (G.bonusSp || 0); }
export function pointsSpent(G, pool = 'sp') { pool = norm(pool); let s = 0; for (const [id, r] of Object.entries(G.tree || {})) if (NODE[id] && poolOf(id) === pool) s += r - (NODE[id].free ? 1 : 0); return s; }
export function pointsFree(G, pool = 'sp') { return pointsEarned(G, pool) - pointsSpent(G, pool); }
export function artisanBonus(G) { const b = { quality: 0, refund: 0, yield: 0, gspeed: 0, refineX: 0 }; for (const n of TREES.artisan.nodes) { const r = rankOf(G, n.id); if (r) for (const [k, v] of Object.entries(n.fx)) b[k] += v * r; } return b; }
export function canLearn(G, id) {
  const n = NODE[id]; if (!n) return 'Unknown skill';
  const r = rankOf(G, id); if (r >= n.max) return 'Maxed';
  const pool = poolOf(id); if (pointsFree(G, pool) < 1) return `No ${POOL_NAME[pool]}`;
  for (const [q, k] of n.req) if (rankOf(G, q) < k) return `Needs ${NODE[q].name}${NODE[q].max > 1 ? ' ' + k : ''}`;
  const lv = charLevelForXp(G.xp);
  if (n.kind === 'active' && lv < rankLevel(n, r + 1)) return `Needs level ${rankLevel(n, r + 1)}`;
  if (n.reqLvl && lv < n.reqLvl) return `Needs level ${n.reqLvl}`;
  if (n.reqSkill && levelForXp(G.skills[n.reqSkill[0]] || 0) < n.reqSkill[1]) return `Needs ${n.reqSkill[0]} ${n.reqSkill[1]}`;
  if (n.reqSet) { const st = SETS.find((x) => x.id === n.reqSet[0]); if (setTier(G, st) < n.reqSet[1]) return `Needs ${st.name} set tier ${n.reqSet[1]}`; }
  return null;
}
export function learn(G, id) { if (canLearn(G, id)) return false; G.tree ||= {}; G.tree[id] = rankOf(G, id) + 1; return true; }
/** Rank of the active-skill node that holds this ability (highest across trees). */
export function abilityRank(G, abId) { let r = 0; for (const t of Object.values(TREES)) for (const n of t.nodes) if (n.ab === abId) r = Math.max(r, rankOf(G, n.id)); return r || 1; }
/** Aggregate passive effects from every passive tree (plus life-skill scaling). Cached per tree/skills state. */
let _pc = { k: null, v: null };
export function passiveFx(G) {
  const key = JSON.stringify(G.tree || {}) + '|' + Object.values(G.skills || {}).join(',');
  if (_pc.k === key && _pc.G === G) return _pc.v;
  const fx = {};
  for (const t of Object.values(PASSIVE_TREES)) for (const n of t.nodes) {
    const r = rankOf(G, n.id); if (!r) continue;
    for (const [k, v] of Object.entries(n.fx || {})) fx[k] = (fx[k] || 0) + v * r;
    if (n.per) { const lv = levelForXp(G.skills[n.per.skill] || 0); for (const [k, v] of Object.entries(n.per.fx)) fx[k] = (fx[k] || 0) + v * r * lv; }
  }
  _pc = { k: key, v: fx, G }; return fx;
}
export function respec(G) { for (const k of Object.keys(G.tree || {})) if (poolOf(k) !== 'artisan') delete G.tree[k]; }
/** Is this ability learned in any tree that holds it? (Weapon "none" uses knuckles.) */
export function abilityLearned(G, abId) {
  let found = false;
  for (const t of Object.values(TREES)) for (const n of t.nodes) if (n.ab === abId) { found = true; if (rankOf(G, n.id) > 0) return true; }
  return !found;
}
/** Combined passive bonuses for an ability from its tree. */
export function abilityBonus(G, abId, treeKey) {
  const rk = abilityRank(G, abId); const b = { dmg: RANK_DMG * (rk - 1), cdr: RANK_CDR * (rk - 1), cost: RANK_COST * (rk - 1), rank: rk }; const t = TREES[treeKey]; if (!t) return b;
  for (const n of t.nodes) { const r = rankOf(G, n.id); if (!r || !n.fx) continue; if (n.fx.dmg) b.dmg += n.fx.dmg * r; if (n.fx.cdr) b.cdr += n.fx.cdr * r; if (n.fx.abDmg && n.fx.ab === abId) b.dmg += n.fx.abDmg * r; }
  return b;
}
export function globalBonus(G) {
  const b = { hp: 0, mp: 0, crit: 0 };
  for (const [id, r] of Object.entries(G.tree || {})) { const n = NODE[id]; if (!n || !n.fx || TREES[n.tree].group === 'passive') continue; if (n.fx.hp) b.hp += n.fx.hp * r; if (n.fx.mp) b.mp += n.fx.mp * r; if (n.fx.crit) b.crit += n.fx.crit * r; }
  return b;
}
/** Old saves: keep abilities the class rank had already unlocked, with bonus points covering them. */
export function migrateTree(G, classRank) {
  if (G.tree) return; G.tree = {};
  for (const t of Object.values(TREES)) for (const n of t.nodes) if (n.ab && !n.free && (!ABILITIES[n.ab].rank || (classRank(G, t.key) >= ABILITIES[n.ab].rank && (G.ranks[t.key] || 0) > 0))) { G.tree[n.id] = 1; G.bonusSp = (G.bonusSp || 0) + 1; }
}
