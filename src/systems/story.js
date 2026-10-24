// Story progression over data/story.js: which chapters are open, done or planned; reach objectives;
// chapter-open / chapter-close cutscenes; travel gates. Pure logic plus two UI hooks (scene, toast).
import { ARCS, ARC_BY_ID, gateFor } from '../data/story.js';
import { QUEST_BY_ID, questStatus, questEvent } from './progress.js';
import { PLACE } from '../world/fiore.js';
import { MOBS } from '../data/mobs.js';

const live = () => ARCS.filter((a) => a.status === 'live' && a.quests.length);
export function arcDone(G, id) { const a = ARC_BY_ID[id]; if (!a || a.status !== 'live' || !a.quests.length) return false; return questStatus(G, a.quests[a.quests.length - 1]) === 'done'; }
/** An arc is open when it is the first one, the previous live arc is done, or you already started any of its quests (old saves). */
export function arcOpen(G, id) {
  const a = ARC_BY_ID[id]; if (!a || a.status !== 'live') return false; const L = live(); const i = L.indexOf(a); if (i <= 0) return true;
  if (arcDone(G, L[i - 1].id)) return true; return [...a.quests, ...(a.side || [])].some((q) => QUEST_BY_ID[q] && questStatus(G, q) !== 'new');
}
export function arcState(G, id) { const a = ARC_BY_ID[id]; if (a.status !== 'live') return 'planned'; return arcDone(G, id) ? 'done' : arcOpen(G, id) ? 'open' : 'locked'; }
export function currentArc(G) { return live().find((a) => !arcDone(G, a.id)) || null; }
export function arcProgress(G, id) { const a = ARC_BY_ID[id]; const n = a.quests.length; if (!n) return 0; let k = 0; for (const q of a.quests) { const s = questStatus(G, q); if (s === 'done') k += 1; else if (s === 'active') { const qq = QUEST_BY_ID[q]; k += (G.quests[q].stage / qq.stages.length); } } return k / n; }
/** Arc that owns a mob (boss list) — used to keep chapter bosses out of the world until the chapter opens. */
export function arcOfMob(mobId) { const a = ARCS.find((x) => (x.bosses || []).includes(mobId)); return a ? a.id : null; }
export function travelBlock(G, placeId) { const a = gateFor(placeId); if (!a || a.status !== 'live' || arcOpen(G, a.id)) return null; return a; }
/** Resolve a reach objective to world x,z. */
export function reachPoint(o) { if (o.place) { const p = PLACE[o.place].pos; return [p[0] + (o.dx || 0), p[1] + (o.dz || 0)]; } return [o.x, o.z]; }
/** Called a few times a second by the game. Fires reach objectives and chapter scenes. */
export function tickStory(G, x, z, ui) {
  G.story ||= { seen: {}, closed: {} };
  for (const q of Object.values(QUEST_BY_ID)) {
    const s = G.quests[q.id]; if (!s || s.stage >= q.stages.length) continue; const o = q.stages[s.stage].obj; if (o.type !== 'reach') continue;
    const [rx, rz] = reachPoint(o); if (Math.hypot(x - rx, z - rz) < o.r) { s.prog = 1; questEvent(G, { type: 'reach', id: q.id }); }
  }
  if (ui.sceneBusy && ui.sceneBusy()) return;
  for (const a of live()) {
    if (arcDone(G, a.id) && !G.story.closed[a.id]) { G.story.closed[a.id] = 1; G.story.seen[a.id] = 1; if (a.scene && a.scene.close) ui.scene(a, 'close'); return; }
    if (arcOpen(G, a.id) && !arcDone(G, a.id) && !G.story.seen[a.id]) { G.story.seen[a.id] = 1; if (a.scene && a.scene.open) ui.scene(a, 'open'); return; }
  }
}
/** First-run: mark chapters already finished in an old save as seen, so you are not shown a backlog of scenes. */
export function primeStory(G) {
  if (G.story) return; G.story = { seen: {}, closed: {} };
  for (const a of live()) if (arcDone(G, a.id)) { G.story.seen[a.id] = 1; G.story.closed[a.id] = 1; }
}
export { ARCS, ARC_BY_ID, MOBS };
