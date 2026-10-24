import * as TREE_API from './data/skilltree.js';
import * as THREE from 'three';
import './ui/style.css';
import { GFX } from './world/toon.js';
import { loadGame, newGame, saveGame, loadSettings } from './core/state.js';
import { Game } from './systems/game.js';
import { UI } from './ui/ui.js';
import { setupInput } from './ui/input.js';
import { characterCreation } from './ui/create.js';
import { titleScreen } from './ui/title.js';
import * as P from './systems/progress.js';
import { SCHOOLS } from './data/schools.js';
import { Audio } from './core/audio.js';
import { loadFiore } from './world/fiore.js';
import { derived } from './core/state.js';
import { TREES } from './data/skilltree.js';
import { MOBS, BOSS_ARENAS } from './data/mobs.js';
import { PLACE } from './world/fiore.js';

const S = loadSettings();
const qs = new URLSearchParams(location.search);
if (qs.get('q')) S.quality = ['high', 'real'].includes(qs.get('q')) ? qs.get('q') : 'low';
GFX.real = S.quality === 'real'; GFX.high = S.quality === 'high' || GFX.real; GFX.outlines = S.quality === 'high'; GFX.shadows = GFX.high;

function layout() {
  const touchAuto = (navigator.maxTouchPoints > 0 || 'ontouchstart' in window) && matchMedia('(pointer: coarse)').matches;
  const touch = qs.has('touch') ? qs.get('touch') !== '0' : S.touch === 'on' ? true : S.touch === 'off' ? false : touchAuto;
  const b = document.body.classList; b.toggle('touch', touch); b.toggle('desktop', !touch);
  const portrait = innerHeight > innerWidth; b.toggle('portrait', portrait); b.toggle('landscape', !portrait);
}
layout(); addEventListener('resize', layout);

const audio = new Audio(S); window.__audio = audio;
const unlock = () => audio.unlock();
for (const ev of ['pointerdown', 'touchend', 'keydown', 'click']) addEventListener(ev, unlock, { capture: true, passive: true });
addEventListener('click', (e) => { if (e.target.closest && e.target.closest('button')) audio.sfx('ui'); }, { capture: true });
audio.play('hall');
const loading = document.createElement('div'); loading.id = 'loading'; loading.textContent = 'Opening the guild doors…'; document.body.appendChild(loading);

async function boot() {
  await loadFiore();
  let G = loadGame();
  loading.remove();
  const choice = qs.has('skiptitle') ? (G ? 'continue' : 'new') : await titleScreen(!!G);
  if (choice === 'new') G = null;
  if (!G) {
    const opts = await characterCreation();
    G = newGame(opts); saveGame(G);
    G._fresh = true;
  }
  const canvas = document.createElement('canvas'); canvas.id = 'game'; document.body.prepend(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: GFX.high, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, GFX.real ? 1.5 : GFX.high ? 2.5 : 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  if (GFX.shadows) { renderer.shadowMap.enabled = true; renderer.shadowMap.type = GFX.real ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap; }
  const ui = new UI(); ui.audio = audio;
  Object.assign(P.hooks, { log: (m, c) => ui.log(m, c), toast: (m) => ui.toast(m), refresh: () => ui.refresh(), levelUp: () => { ui.refresh(); audio.sfx('level'); }, jobDone: () => {}, story: (lines) => ui.playLines(lines) });
  const game = new Game(renderer, G, S, ui);
  ui.attach(game);
  const inputUpdate = setupInput(game, ui, canvas);
  const resize = () => { renderer.setSize(innerWidth, innerHeight); game.post?.resize(innerWidth * renderer.getPixelRatio(), innerHeight * renderer.getPixelRatio()); game.camera.aspect = innerWidth / innerHeight; game.camera.updateProjectionMatrix(); };
  resize(); addEventListener('resize', resize);
  if (G.jobs.active.some((a) => a.id === 'j_cat' && a.prog < 1)) game.startEscort();
  const fresh = G._fresh; delete G._fresh;
  ui.log('Welcome to Magnolia, home of the Fairy Tail guild! Press M (or tap the minimap) for the map of Fiore.', 'lvl');
  if (fresh) {
    ui.log(`Your guild mark glows. You wield ${SCHOOLS[G.school].name} magic. Your gear decides your abilities: check the Equipment panel.`, 'info');
    ui.log('Tutorial: talk to Mirajane at the bar.', 'quest');
    setTimeout(() => { if (!ui.dlg) ui.openDialogue('mirajane'); }, 900);
  }
  addEventListener('visibilitychange', () => { if (document.hidden && !game.noSave) saveGame(G); });
  addEventListener('pagehide', () => { if (!game.noSave) saveGame(G); });
  let last = performance.now();
  const frame = (now) => {
    requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    inputUpdate(); game.update(dt); ui.update(dt); game.render();
    audio.play(ui.bossEnt ? 'boss' : game.zone === 'Fairy Tail Guild Hall' || game.zone === 'Magnolia' ? 'hall' : 'field');
  };
  requestAnimationFrame(frame);
  window.__ew = { game, G, ui, P, S, THREE, D: { derived, TREES, MOBS }, T: TREE_API, PLACE, BOSS_ARENAS };
}
boot().catch((e) => { console.error(e); const d = document.createElement('div'); d.id = 'loading'; d.textContent = 'Something exploded (not the guild this time): ' + e.message; document.body.appendChild(d); });
