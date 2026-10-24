// Pure game-progress logic on the save object G. UI feedback goes through `hooks`.
import { ITEMS, itemName } from '../data/items.js';
import { JOBS, RANK_ORDER } from '../data/jobs.js';
import { RANK_PERKS, RIVALS, FAIRY_FAME_BASE, CONTEST_TIME } from '../data/guilds.js';
import { QUESTS } from '../data/quests.js';
import { MOBS } from '../data/mobs.js';
import { NPCS } from '../data/npcs.js';
import { SCHOOLS } from '../data/schools.js';
import { addItem, removeItem, countItem, skillLevel, guildRank, classRank, dayStamp, SKILLS, derived } from '../core/state.js';
import { charLevelForXp } from '../core/xp.js';

export const hooks = { log: () => {}, toast: () => {}, refresh: () => {}, levelUp: () => {}, jobDone: () => {} };
export const JOB_BY_ID = Object.fromEntries(JOBS.map((j) => [j.id, j]));
export const QUEST_BY_ID = Object.fromEntries(QUESTS.map((q) => [q.id, q]));
export const MAX_ACTIVE_JOBS = 3;
export const maxJobs = (G) => (RANK_PERKS[guildRank(G)] || RANK_PERKS.E).jobs;
const today = () => Math.floor(Date.now() / 864e5);
/** Fiore guild standings: your fame vs each rival guild. */
export function guildStandings(G) {
  G.rivals ||= {}; const born = G.bornDay || today(); const days = Math.max(0, today() - born);
  const list = [{ id: 'fairy', name: 'Fairy Tail', icon: '🧚', color: '#e0303a', fame: FAIRY_FAME_BASE + G.gp * 2 + (G.contestWins || 0) * 120 + (G.sclass ? 500 : 0) + Object.values(G.bossKills || {}).reduce((a, b) => a + Math.min(b, 3), 0) * 250, you: true }];
  for (const [id, r] of Object.entries(RIVALS)) { const st = G.rivals[id] || {}; list.push({ id, name: r.name, icon: r.icon, color: r.color, fame: r.fame + r.perDay * days + (st.wins || 0) * 120 - (st.losses || 0) * 60, wins: st.wins || 0, losses: st.losses || 0 }); }
  return list.sort((a, b) => b.fame - a.fame);
}
/** Contested jobs: the rival guild is racing you. Called every frame with dt in seconds. */
export function tickRivals(G, dt) {
  for (const a of [...G.jobs.active]) {
    if (a.left == null) continue; const j = JOB_BY_ID[a.id]; if (!j || !j.rival) continue;
    if (jobReady(G, a)) continue; // finished the objective: the rival can no longer beat you, just hand it in
    const before = a.left; a.left -= dt; const R = RIVALS[j.rival];
    if (before > 60 && a.left <= 60) hooks.toast(`${R.icon} ${R.name} is almost done with "${j.title}"!`);
    if (a.left <= 0) {
      G.jobs.active = G.jobs.active.filter((x) => x !== a); G.rivals ||= {}; const st = (G.rivals[j.rival] ||= {}); st.wins = (st.wins || 0) + 1;
      hooks.toast(`${R.icon} ${R.name} beat you to "${j.title}".`); hooks.log(`${R.name} completed "${j.title}" first. Their fame rises. Natsu is already planning revenge.`, 'warn'); hooks.refresh();
    }
  }
}

// ---------- XP ----------
export function grantSkillXp(G, skill, xp) {
  const before = skillLevel(G, skill);
  G.skills[skill] = Math.min(200000000, (G.skills[skill] || 0) + xp);
  const after = skillLevel(G, skill);
  hooks.log(`+${Math.round(xp)} ${SKILLS[skill].name} XP`, 'xp');
  if (after > before) { hooks.toast(`${SKILLS[skill].icon} ${SKILLS[skill].name} level ${after}!`); hooks.log(`Congratulations! Your ${SKILLS[skill].name} level is now ${after}.`, 'lvl'); hooks.levelUp(); }
}
export function grantCharXp(G, xp) {
  const before = charLevelForXp(G.xp); G.xp += Math.round(xp); const after = charLevelForXp(G.xp);
  if (after > before) {
    const gained = after - before; G.statPoints += 3 * gained;
    const d = derived(G); G.hp = d.maxHp; G.mp = d.maxMp;
    hooks.toast(`⭐ Level ${after}! +${3 * gained} stat points, +${gained} skill point${gained > 1 ? 's' : ''}`); hooks.log(`You reached level ${after}. Spend stat points in Stats and skill points in the Skill Tree.`, 'lvl'); hooks.levelUp();
  }
}
export function grantRankXp(G, key, xp) {
  if (!key) return;
  const before = classRank(G, key); G.ranks[key] = (G.ranks[key] || 0) + xp; const after = classRank(G, key);
  if (after > before) {
    const nm = SCHOOLS[key] ? SCHOOLS[key].name : key;
    hooks.toast(`🏅 ${nm} class rank ${after}!`); hooks.log(`${nm} reached class rank ${after}. New abilities may be unlocked.`, 'lvl'); hooks.levelUp();
  }
}
export function giveItems(G, items, why = '') {
  for (const [id, n] of Object.entries(items || {})) {
    const left = addItem(G, id, n);
    if (left < n) hooks.log(`Received ${n - left}× ${itemName(id)}${why}`, 'loot');
    if (left > 0) { const b = addItem(G, id, left, 'bank'); hooks.log(b === 0 ? `Bag full: ${left}× ${itemName(id)} sent to your bank.` : `Bag and bank full! Lost ${left}× ${itemName(id)}.`, 'warn'); }
  }
}
export function giveReward(G, r, why) {
  if (!r) return;
  if (r.jewels) { G.jewels += r.jewels; hooks.log(`+${r.jewels} jewels`, 'loot'); }
  if (r.gp) {
    const before = guildRank(G); G.gp += r.gp; const after = guildRank(G);
    hooks.log(`+${r.gp} guild points`, 'loot');
    if (after !== before) { hooks.toast(`🛡️ Guild rank ${after}!`); hooks.log(`Mirajane stamps your guild card with a big "${after}". You can now take ${RANK_ORDER[Math.min(5, RANK_ORDER.indexOf(after) + 1)]}-rank jobs.`, 'lvl'); }
  }
  if (r.xp) grantCharXp(G, r.xp);
  if (r.items) giveItems(G, r.items, why);
}

// ---------- Jobs (request board) ----------
export function jobState(G, id) {
  const a = G.jobs.active.find((x) => x.id === id);
  if (a) return { active: a, ready: jobReady(G, a) };
  const job = JOB_BY_ID[id];
  if (job.daily && G.jobs.done[id] === dayStamp()) return { doneToday: true };
  return {};
}
export function canTakeJob(G, job) {
  const my = RANK_ORDER.indexOf(guildRank(G)), need = RANK_ORDER.indexOf(job.rank);
  if (job.sclass && !G.sclass) return 'S-Class wizards only. Pass the S-Class Promotion Trial first (guild rank A).';
  if (job.trial && G.sclass) return 'You are already an S-Class wizard.';
  if (job.trial && my < RANK_ORDER.indexOf('A')) return 'Master Makarov only nominates rank A wizards for the Trial.';
  if (need > my + 1) return `Requires guild rank ${RANK_ORDER[need - 1]} or higher.`;
  if (G.jobs.active.some((a) => a.id === job.id)) return 'Already taken.';
  if (G.jobs.active.length >= maxJobs(G)) return `You can carry ${maxJobs(G)} jobs at once at rank ${guildRank(G)}.`;
  if (job.daily && G.jobs.done[job.id] === dayStamp()) return 'Done for today. Come back tomorrow!';
  return null;
}
export function takeJob(G, id) {
  const job = JOB_BY_ID[id]; const why = canTakeJob(G, job); if (why) { hooks.toast(why); return false; }
  const a = { id, prog: 0 }; if (job.rival) { a.left = CONTEST_TIME; const R = RIVALS[job.rival]; hooks.toast(`${R.icon} Contested! ${R.name} took this job too. Beat them to it.`); }
  G.jobs.active.push(a);
  hooks.log(`Job taken: ${job.title} (${job.rank}).`, 'quest'); hooks.refresh(); return true;
}
export function abandonJob(G, id) { G.jobs.active = G.jobs.active.filter((a) => a.id !== id); hooks.refresh(); }
export function jobReady(G, a) {
  const job = JOB_BY_ID[a.id];
  if (job.type === 'deliver') return countItem(G, job.item) >= job.n;
  if (job.type === 'escort') return a.prog >= 1;
  return a.prog >= job.n;
}
export function jobProgressText(G, a) {
  const job = JOB_BY_ID[a.id];
  if (job.type === 'deliver') return `${Math.min(job.n, countItem(G, job.item))}/${job.n} ${itemName(job.item)}`;
  if (job.type === 'escort') return a.prog >= 1 ? 'Plue arrived!' : 'Escort Plue to the Kardia Cathedral';
  if (job.type === 'gather') return `${Math.min(a.prog, job.n)}/${job.n} ${itemName(job.item)}`;
  return `${Math.min(a.prog, job.n)}/${job.n} ${MOBS[job.mob].name}`;
}
export function turnInJob(G, id) {
  const a = G.jobs.active.find((x) => x.id === id); if (!a || !jobReady(G, a)) return false;
  const job = JOB_BY_ID[id];
  if (job.type === 'deliver') removeItem(G, job.item, job.n);
  G.jobs.active = G.jobs.active.filter((x) => x !== a);
  G.jobs.done[id] = dayStamp(); G.jobs.completed++;
  hooks.log(`Job complete: ${job.title}! *stamp*`, 'quest');
  giveReward(G, job.reward, ' (job reward)');
  if (job.rival && a.left > 0) { G.rivals ||= {}; const st = (G.rivals[job.rival] ||= {}); st.losses = (st.losses || 0) + 1; G.contestWins = (G.contestWins || 0) + 1; const R = RIVALS[job.rival]; hooks.toast(`🏆 You beat ${R.name}! Fairy Tail's fame rises.`); hooks.log(`Contest won against ${R.name} with ${Math.ceil(a.left)}s to spare.`, 'lvl'); }
  if (job.trial && !G.sclass) { G.sclass = true; hooks.toast('⭐ You passed the S-Class Promotion Trial!'); hooks.log('Master Makarov: "From today, you are an S-Class wizard of Fairy Tail. Upstairs is yours. Try not to break it."', 'lvl'); }
  questEvent(G, { type: 'job' });
  hooks.jobDone(job); hooks.refresh(); return true;
}

// ---------- Quests ----------
export function qs(G, id) { return G.quests[id] || null; }
export function questStatus(G, id) { const s = qs(G, id); const q = QUEST_BY_ID[id]; if (!s) return 'new'; return s.stage >= q.stages.length ? 'done' : 'active'; }
export function startQuest(G, id) { if (G.quests[id]) return; G.quests[id] = { stage: 0, prog: 0 }; hooks.log(`Quest started: ${QUEST_BY_ID[id].name}`, 'quest'); primeStage(G, id); hooks.refresh(); }
function primeStage(G, id) {
  // item objectives may already be satisfied by the bag
  const q = QUEST_BY_ID[id], s = G.quests[id]; const st = q.stages[s.stage]; if (!st) return;
  if (st.obj.type === 'item') s.prog = Math.min(st.obj.n, countItem(G, st.obj.id));
  if (st.obj.type === 'job') s.prog = 0;
  maybeAutoAdvance(G, id);
}
export function stageReady(G, id) {
  const q = QUEST_BY_ID[id], s = G.quests[id]; if (!s) return false; const st = q.stages[s.stage]; if (!st) return false;
  if (st.obj.type === 'talk') return true;
  if (st.obj.type === 'item') return countItem(G, st.obj.id) >= st.obj.n;
  return s.prog >= st.obj.n;
}
export function stageText(G, id) {
  const q = QUEST_BY_ID[id], s = G.quests[id]; if (!s) return ''; const st = q.stages[s.stage]; if (!st) return 'Complete!';
  const o = st.obj; let p = '';
  if (o.type === 'kill' || o.type === 'craft' || o.type === 'job') p = ` (${Math.min(s.prog, o.n)}/${o.n})`;
  if (o.type === 'item') p = ` (${Math.min(countItem(G, o.id), o.n)}/${o.n})`;
  const ready = stageReady(G, id) && st.turnIn ? ` — return to ${NPCS[st.turnIn].name.split(' (')[0]}` : '';
  return st.desc + p + ready;
}
function maybeAutoAdvance(G, id) {
  const q = QUEST_BY_ID[id], s = G.quests[id]; const st = q.stages[s.stage];
  if (st && !st.turnIn && st.obj.type !== 'talk' && stageReady(G, id)) advance(G, id);
}
export function advance(G, id) {
  const q = QUEST_BY_ID[id], s = G.quests[id]; const st = q.stages[s.stage];
  if (st.obj.type === 'item' && st.obj.take) removeItem(G, st.obj.id, st.obj.n);
  s.stage++; s.prog = 0;
  if (s.stage >= q.stages.length) {
    G.qp += q.qp; hooks.toast(`📜 Quest complete: ${q.name}`); hooks.log(`Quest complete: ${q.name}! +${q.qp} quest points.`, 'quest');
    giveReward(G, q.reward, ' (quest reward)');
  } else { hooks.log(`Quest updated: ${q.stages[s.stage].desc}`, 'quest'); primeStage(G, id); }
  hooks.refresh();
  return st.done || null;
}
/** Feeds an event to every active quest. ev: {type:'kill',mob}|{type:'item'}|{type:'craft',id,n}|{type:'job'} */
export function questEvent(G, ev) {
  for (const q of QUESTS) {
    const s = G.quests[q.id]; if (!s || s.stage >= q.stages.length) continue;
    const o = q.stages[s.stage].obj;
    if (ev.type === 'kill' && o.type === 'kill' && o.mob === ev.mob) s.prog++;
    else if (ev.type === 'craft' && o.type === 'craft' && o.id === ev.id) s.prog += ev.n || 1;
    else if (ev.type === 'job' && o.type === 'job') s.prog++;
    else if (ev.type === 'item' && o.type === 'item') s.prog = countItem(G, o.id);
    else continue;
    if (stageReady(G, q.id) && q.stages[s.stage].turnIn) hooks.log(`Quest objective done. ${stageText(G, q.id)}`, 'quest');
    maybeAutoAdvance(G, q.id);
  }
  hooks.refresh();
}
export function onKill(G, mobId) {
  G.kills[mobId] = (G.kills[mobId] || 0) + 1;
  for (const a of G.jobs.active) { const j = JOB_BY_ID[a.id]; if ((j.type === 'kill' || j.type === 'boss') && j.mob === mobId) { a.prog++; if (a.prog === j.n) hooks.log(`Job ready to hand in: ${j.title}. Report to Mirajane.`, 'quest'); } }
  questEvent(G, { type: 'kill', mob: mobId });
}
export function onGather(G, itemId, n) {
  for (const a of G.jobs.active) { const j = JOB_BY_ID[a.id]; if (j.type === 'gather' && j.item === itemId) { a.prog += n; if (a.prog >= j.n && a.prog - n < j.n) hooks.log(`Job ready to hand in: ${j.title}. Report to Mirajane.`, 'quest'); } }
  questEvent(G, { type: 'item' });
}
export function onCraft(G, itemId, n) { G.crafted[itemId] = (G.crafted[itemId] || 0) + n; questEvent(G, { type: 'craft', id: itemId, n }); }
/** Quest drop table for a mob given current quest stages. */
export function questDropsFor(G, mobId) {
  const out = [];
  for (const q of QUESTS) { const d = q.questDrops && q.questDrops[mobId]; const s = G.quests[q.id]; if (d && s && s.stage === d.stage && countItem(G, d.item) < 1) out.push(d); }
  return out;
}
/** Dialogue for an NPC given quest state. Returns {lines, options:[{label, action}]} */
export function npcDialogue(G, npcId) {
  const lines = []; const options = [];
  for (const q of QUESTS) {
    const s = G.quests[q.id];
    if (!s && q.start === npcId && (!q.requires || questStatus(G, q.requires) === 'done')) { options.push({ label: `📜 ${q.name}`, quest: q.id, kind: 'start' }); continue; }
    if (!s || s.stage >= q.stages.length) continue;
    const st = q.stages[s.stage];
    if (st.obj.type === 'talk' && st.obj.npc === npcId) options.push({ label: `📜 ${q.name}`, quest: q.id, kind: 'advance' });
    else if (st.turnIn === npcId && stageReady(G, q.id)) options.push({ label: `✅ ${q.name}: report`, quest: q.id, kind: 'advance' });
    else if ((st.turnIn === npcId || q.start === npcId) && !stageReady(G, q.id)) lines.push([npcId, `About "${q.name}": ${st.desc}`]);
  }
  const n = NPCS[npcId];
  if (!lines.length) lines.push([npcId, n.talk[Math.floor(Math.random() * n.talk.length)]]);
  return { lines, options };
}
export function isMagicAbilityKey(id) { return Object.values(SCHOOLS).some((s) => s.abilities.includes(id)); }
export { ITEMS };

// ---------- Crafting ----------
import { RECIPES } from '../data/recipes.js';
import { QUALITIES, rollQuality } from '../data/tiers.js';
import { artisanBonus } from '../data/skilltree.js';
import { hasAll, canAdd as _canAdd } from '../core/state.js';
export function recipeBlock(G, r) {
  if (skillLevel(G, r.skill) < r.level) return `Needs ${SKILLS[r.skill].name} ${r.level}`;
  if (!hasAll(G, r.in)) return 'Missing materials';
  const [outId] = Object.keys(r.out); if (!_canAdd(G, outId, r.out[outId])) return 'Bag full';
  return null;
}
export function craft(G, r) {
  const why = recipeBlock(G, r); if (why) { hooks.toast(why); return false; }
  const ab = artisanBonus(G); let saved = 0;
  for (const [id, n] of Object.entries(r.in)) { let use = n; for (let i = 0; i < n; i++) if (id !== 'lacrima_shard' && Math.random() < Math.min(0.4, 0.08 + ab.refund)) { use--; saved++; } removeItem(G, id, use); }
  for (const [id0, n0] of Object.entries(r.out)) {
    let id = id0, n = n0;
    if (r.gear) { const q = rollQuality(skillLevel(G, r.skill) - r.level, ab.quality); id = id0 + QUALITIES[q - 1].sfx; if (q >= 3) hooks.toast(`✨ ${QUALITIES[q - 1].name} quality!`); }
    else if (r.group === 'Refine' && Math.random() < ab.refineX) n++;
    addItem(G, id, n); hooks.log(`You make ${n}× ${itemName(id)}.${saved ? ` (${saved} material${saved > 1 ? 's' : ''} saved)` : ''}`, 'loot'); onCraft(G, id0, n);
  }
  grantSkillXp(G, r.skill, r.xp);
  questEvent(G, { type: 'item' });
  return true;
}
export { RECIPES };
