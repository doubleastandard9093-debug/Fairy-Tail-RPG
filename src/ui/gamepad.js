// Xbox / standard gamepad (Bluetooth or USB) via the Gamepad API. Idle cost: a 1 s probe until a pad appears.
const BT = { A: 0, B: 1, X: 2, Y: 3, LB: 4, RB: 5, LT: 6, RT: 7, BACK: 8, START: 9, L3: 10, R3: 11, UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15 };
const SKEY = 'ft-pad';
export const pad = { connected: false, active: false, id: '', sens: 1, invertY: false, dz: 0.18, rumbleOn: true, x: 0, y: 0, ctx: null };
try { const s = JSON.parse(localStorage.getItem(SKEY) || '{}'); for (const k of ['sens', 'invertY', 'dz', 'rumbleOn']) if (k in s) pad[k] = s[k]; } catch (e) {}
export function savePad() { try { localStorage.setItem(SKEY, JSON.stringify({ sens: pad.sens, invertY: pad.invertY, dz: pad.dz, rumbleOn: pad.rumbleOn })); } catch (e) {} }
export const PAD_LEGEND = 'Left stick move · Right stick camera · RT ability 1 (attack) · LT target nearest enemy · A interact / talk / pick dialogue · B cancel (close, untarget) · X ability 2 · Y ability 3 · LB ability 4 · RB ability 5 · D-pad ↑ 6 → 7 ↓ 8 ← Unison Raid · L3 / View world map · R3 salute · Start bag (hold: settings) · in menus: D-pad or left stick move, A select, LB/RB switch tab, B close.';
const pads = () => { try { return Array.from(navigator.getGamepads?.() || []).filter(Boolean); } catch (e) { return []; } };
const vis = (e) => e && e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden' && !e.classList.contains('hidden');
let gp = null, prev = [], loop = false, last = 0, startT = 0;
export function rumble(s = 0.5, w = 0.3, ms = 80) { if (!pad.rumbleOn || !pad.active || !gp) return; try { gp.vibrationActuator?.playEffect?.('dual-rumble', { duration: ms, strongMagnitude: s, weakMagnitude: w })?.catch?.(() => {}); } catch (e) {} }
function nav(root, dir) {
  const els = [...root.querySelectorAll('button:not([disabled]),input,select,[data-act],.opt')].filter(vis); if (!els.length) return;
  const i = els.indexOf(document.activeElement), cur = els[i];
  if (dir === 'ok') { (cur || els.find((e) => e.classList.contains('gold')) || els[0]).click(); return; }
  if (cur && cur.type === 'range' && (dir === 'left' || dir === 'right')) { cur.value = +cur.value + (dir === 'right' ? 5 : -5); cur.dispatchEvent(new Event('input', { bubbles: true })); cur.dispatchEvent(new Event('change', { bubbles: true })); return; }
  if (i < 0) { els[0].focus(); return; }
  const r = cur.getBoundingClientRect(), cx = r.x + r.width / 2, cy = r.y + r.height / 2; let best = null, bd = 1e9;
  for (const e of els) { if (e === cur) continue; const q = e.getBoundingClientRect(), dx = q.x + q.width / 2 - cx, dy = q.y + q.height / 2 - cy;
    if (!(dir === 'up' ? dy < -4 : dir === 'down' ? dy > 4 : dir === 'left' ? dx < -4 : dx > 4)) continue;
    const d = dir === 'up' || dir === 'down' ? Math.abs(dy) + 2 * Math.abs(dx) : Math.abs(dx) + 2 * Math.abs(dy); if (d < bd) { bd = d; best = e; } }
  (best || els[(i + (dir === 'down' || dir === 'right' ? 1 : els.length - 1)) % els.length]).focus(); document.activeElement?.scrollIntoView?.({ block: 'nearest' });
}
// ctx: null before the game starts (title / character creation -> plain menu navigation), then { game, ui, cam }.
export function initGamepad(toast) {
  const setActive = (on) => { if (pad.active === on) return; pad.active = on; document.body.classList.toggle('pad', on); };
  const connect = (g) => { if (pad.connected) return; pad.connected = true; pad.id = g.id; setActive(true); (pad.ctx?.ui?.toast || toast || console.log).call(pad.ctx?.ui, '🎮 Controller connected'); if (!loop) { loop = true; last = performance.now(); requestAnimationFrame(tick); } };
  addEventListener('gamepadconnected', (e) => connect(e.gamepad));
  addEventListener('gamepaddisconnected', () => { if (!pads().length) { pad.connected = false; setActive(false); pad.x = pad.y = 0; } });
  addEventListener('touchstart', () => setActive(false), { passive: true, capture: true });
  setInterval(() => { if (!pad.connected) { const g = pads()[0]; if (g) connect(g); } }, 1000);
  function tick(now) { if (!pad.connected) { loop = false; return; } requestAnimationFrame(tick); const dt = Math.min(0.05, (now - last) / 1000); last = now; poll(dt, now); }
}
function poll(dt, now) {
  gp = pads()[0]; if (!gp) return; const g = gp;
  const cur = g.buttons.map((b) => !!b && (b.pressed || b.value > 0.5)), dn = (i) => cur[i] && !prev[i], up = (i) => !cur[i] && prev[i];
  const dz = (x, y) => { const m = Math.hypot(x, y); if (m < pad.dz) return [0, 0]; const s = Math.min(1, (m - pad.dz) / (1 - pad.dz)) / m; return [x * s, y * s]; };
  const [lx, ly] = dz(g.axes[0] || 0, g.axes[1] || 0), [rx, ry] = dz(g.axes[2] || 0, g.axes[3] || 0);
  if (cur.some(Boolean) || lx || ly || rx || ry) document.body.classList.add('pad'), pad.active = true;
  const C = pad.ctx, ui = C?.ui;
  const menu = !C ? document.body : [ui.el.dialog, ui.el.panel, ui.wm].find(vis) || null;
  if (menu) {
    pad.x = pad.y = 0;
    const sy = Math.abs(ly) > 0.6 ? Math.sign(ly) : 0, sx = Math.abs(lx) > 0.6 ? Math.sign(lx) : 0;
    if ((sx || sy) && now - (pad.st || 0) > 220) { pad.st = now; nav(menu, sy ? (sy > 0 ? 'down' : 'up') : (sx > 0 ? 'right' : 'left')); }
    if (dn(BT.UP)) nav(menu, 'up'); if (dn(BT.DOWN)) nav(menu, 'down'); if (dn(BT.LEFT)) nav(menu, 'left'); if (dn(BT.RIGHT)) nav(menu, 'right');
    if (dn(BT.A)) nav(menu, 'ok');
    if (C && (dn(BT.LB) || dn(BT.RB))) { const tabs = [...menu.querySelectorAll('.tabs .tab')]; const ti = tabs.findIndex((t) => t.classList.contains('on')); if (tabs.length) tabs[(ti + (dn(BT.RB) ? 1 : tabs.length - 1)) % tabs.length].click(); }
    if (C && (dn(BT.B) || dn(BT.START))) { ui.closePanel(); ui.closeDialog(); ui.closeWorldMap(); document.activeElement?.blur?.(); }
    prev = cur; return;
  }
  const { game } = C, cam = game.cam;
  pad.x = lx; pad.y = ly;
  if (rx || ry) { cam.yaw -= rx * Math.abs(rx) * 2.6 * pad.sens * dt; cam.pitch = Math.max(0.12, Math.min(1.3, cam.pitch + ry * Math.abs(ry) * 1.6 * pad.sens * dt * (pad.invertY ? -1 : 1))); }
  const ab = (i) => { game.useAbility(i); rumble(0.25, 0.25, 50); };
  if (g.buttons[BT.RT]?.value > 0.4 && !(prev[BT.RT])) ab(0);
  if (dn(BT.LT)) { const m = game.nearestMob(game.player.pos, 25); if (m) game.setTarget(m); }
  if (dn(BT.A)) { const it = game.nearestInteractable(); if (it) game.interact(it); }
  if (dn(BT.B)) game.setTarget(null);
  if (dn(BT.X)) ab(1); if (dn(BT.Y)) ab(2); if (dn(BT.LB)) ab(3); if (dn(BT.RB)) ab(4);
  if (dn(BT.UP)) ab(5); if (dn(BT.RIGHT)) ab(6); if (dn(BT.DOWN)) ab(7); if (dn(BT.LEFT)) game.magic?.unisonRaid?.();
  if (dn(BT.L3) || dn(BT.BACK)) ui.toggleWorldMap(); if (dn(BT.R3)) game.emote?.('salute');
  if (dn(BT.START)) startT = now; if (cur[BT.START] && startT && now - startT > 500) { ui.openPanel('settings'); startT = 0; } if (up(BT.START) && startT) { ui.togglePanel('bag'); startT = 0; }
  prev = cur;
}
