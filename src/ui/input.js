import * as THREE from 'three';

/** Keyboard, mouse and touch input. Writes movement into game.input and drives the camera. */
export function setupInput(game, ui, canvas) {
  const keys = new Set(); const cam = game.cam; const joy = { x: 0, y: 0, id: null };
  const typing = (e) => e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA');
  addEventListener('keydown', (e) => {
    if (typing(e)) return; const k = e.key.toLowerCase(); keys.add(k);
    if (k >= '1' && k <= '8') game.useAbility(Number(k) - 1);
    else if (k === 'e' || k === 'f') { const it = game.nearestInteractable(); if (!ui.el.dialog.classList.contains('hidden')) { const b = ui.el.dialog.querySelector('.opts .btn'); if (b) b.click(); } else if (it) game.interact(it); }
    else if (k === 'tab') { e.preventDefault(); const m = game.nearestMob(game.player.pos, 25); if (m) game.setTarget(m); }
    else if (k === 'escape') { ui.closePanel(); ui.closeDialog(); ui.closeWorldMap(); game.setTarget(null); }
    else if (k === 'm') ui.toggleWorldMap();
    else if (k === 'u') game.magic.unisonRaid();
    else if (k === 'i' || k === 'b') ui.togglePanel('bag'); else if (k === 'g') ui.togglePanel('gear'); else if (k === 'c') ui.togglePanel('stats'); else if (k === 'k') ui.togglePanel('skills'); else if (k === 't') ui.togglePanel('tree'); else if (k === 'j' || k === 'l') ui.togglePanel('quests');
  });
  addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
  addEventListener('blur', () => keys.clear());

  // Joystick
  const jEl = document.getElementById('joy'), knob = jEl.querySelector('.knob');
  const jMove = (e) => { const r = jEl.getBoundingClientRect(); const R = r.width / 2; let dx = e.clientX - (r.left + R), dy = e.clientY - (r.top + R); const l = Math.hypot(dx, dy); if (l > R) { dx *= R / l; dy *= R / l; } joy.x = dx / R; joy.y = dy / R; knob.style.transform = `translate(${dx}px,${dy}px)`; };
  jEl.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); joy.id = e.pointerId; jEl.setPointerCapture(e.pointerId); jMove(e); });
  jEl.addEventListener('pointermove', (e) => { if (e.pointerId === joy.id) jMove(e); });
  const jEnd = (e) => { if (e.pointerId === joy.id) { joy.id = null; joy.x = joy.y = 0; knob.style.transform = ''; } };
  jEl.addEventListener('pointerup', jEnd); jEl.addEventListener('pointercancel', jEnd);

  // Camera drag / tap / pinch on the canvas
  const ptrs = new Map(); let pinch = null;
  canvas.addEventListener('pointerdown', (e) => { canvas.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, moved: 0, t: performance.now(), btn: e.button }); if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), dist: cam.dist }; } });
  canvas.addEventListener('pointermove', (e) => {
    const p = ptrs.get(e.pointerId); if (!p) return; const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY; p.moved += Math.abs(dx) + Math.abs(dy);
    if (ptrs.size === 2 && pinch) { const [a, b] = [...ptrs.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); cam.dist = Math.max(4, Math.min(24, pinch.dist * pinch.d / Math.max(20, d))); return; }
    if (p.moved > 6) { cam.yaw -= dx * 0.006; cam.pitch = Math.max(0.12, Math.min(1.3, cam.pitch + dy * 0.004)); }
  });
  const ray = new THREE.Raycaster(); const ndc = new THREE.Vector2();
  const endPtr = (e) => {
    const p = ptrs.get(e.pointerId); if (!p) return; ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null;
    if (p.moved > 8 || performance.now() - p.t > 600 || p.btn === 2) return;
    tap(e.clientX, e.clientY);
  };
  canvas.addEventListener('pointerup', endPtr); canvas.addEventListener('pointercancel', (e) => { ptrs.delete(e.pointerId); pinch = null; });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  canvas.addEventListener('wheel', (e) => { e.preventDefault(); cam.dist = Math.max(4, Math.min(24, cam.dist * (1 + Math.sign(e.deltaY) * 0.1))); }, { passive: false });

  function tap(x, y) {
    if (!ui.el.dialog.classList.contains('hidden')) ui.closeDialog();
    ndc.set(x / innerWidth * 2 - 1, -(y / innerHeight) * 2 + 1); ray.setFromCamera(ndc, game.camera);
    const objs = []; const map = new Map();
    for (const it of game.world.interactables) { if (it.kind === 'node' && it.respawn > 0) continue; objs.push(it.obj); map.set(it.obj, it); }
    for (const e of game.entities) if (e.kind === 'mob' && !e.dead) { objs.push(e.obj); map.set(e.obj, e); }
    for (const gm of game.world.terrain.groundMeshes()) objs.push(gm);
    const hits = ray.intersectObjects(objs, true);
    for (const h of hits) {
      let o = h.object; while (o && !map.has(o) && !o.userData.ground) o = o.parent;
      if (!o || o.userData.ground) { if (h.distance < 200) { game.player.moveTo = new THREE.Vector3(h.point.x, 0, h.point.z); game.player.follow = null; ui.clickMarker && ui.clickMarker(h.point); } return; }
      const it = map.get(o);
      if (it.kind === 'mob') { game.setTarget(it); const r = game.attackRange(); if (Math.hypot(it.pos.x - game.player.pos.x, it.pos.z - game.player.pos.z) > r + it.radius) game.player.follow = it; return; }
      game.interact(it); return;
    }
  }

  return function update() {
    let f = 0, s = 0;
    if (keys.has('w') || keys.has('arrowup')) f += 1; if (keys.has('s') || keys.has('arrowdown')) f -= 1;
    if (keys.has('d') || keys.has('arrowright')) s += 1; if (keys.has('a') || keys.has('arrowleft')) s -= 1;
    if (keys.has('q')) cam.yaw += 0.03; if (keys.has('r')) cam.yaw -= 0.03;
    if (joy.id !== null) { f = -joy.y; s = joy.x; const l = Math.hypot(f, s); if (l < 0.15) { f = s = 0; } }
    const fx = Math.sin(cam.yaw), fz = Math.cos(cam.yaw); const rx = -Math.cos(cam.yaw), rz = Math.sin(cam.yaw);
    let ix = fx * f + rx * s, iz = fz * f + rz * s; const l = Math.hypot(ix, iz); if (l > 1) { ix /= l; iz /= l; }
    game.input.x = ix; game.input.z = iz;
  };
}
