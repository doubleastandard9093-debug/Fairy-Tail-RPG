import * as THREE from 'three';
import { buildCharacter, animateCharacter, equipVisual, HAIR_STYLES, HAIR_COLORS, SKIN_TONES, OUTFITS, OUTFIT_COLORS, FRAMES, ACCESSORIES } from '../world/models.js';
const EYE_COLORS = ['#3a2a1a', '#2a6ad0', '#2a9a5a', '#c03030', '#9a50ff', '#d0a020', '#606070'];
const HEIGHTS = ['short', 'average', 'tall']; const HMAP = { short: 0.94, average: 1, tall: 1.06 };
import { SCHOOLS } from '../data/schools.js';
import { MARK_PLACES, MARK_COLORS, MARK_HINTS, MARK_SIZES, guildMarkDataURL } from '../world/mark.js';

/** Character creation screen. Resolves with { name, look, school }. */
export function characterCreation() {
  return new Promise((resolve) => {
    const L = { hair: 'spiky', hairColor: HAIR_COLORS[0], skin: SKIN_TONES[1], outfit: 'adventurer', outfitColor: OUTFIT_COLORS[0], frame: 'average', acc: 'none', eyeColor: EYE_COLORS[0], heightName: 'average', height: 1, mark: { place: 'right arm', color: MARK_COLORS[0], size: 'medium' } };
    let school = 'flame';
    const root = document.createElement('div'); root.id = 'create';
    root.innerHTML = `<div class="wrap"><div class="pv frame"><canvas></canvas><div class="pvbar" id="cc-pose"></div><div class="stamp" id="cc-stamp"></div><div class="logo"><img alt="" src="${guildMarkDataURL('#e0303a', 128)}">FAIRY TAIL<small>NEW MEMBER</small></div></div>
      <div class="opts frame"><h2>Join Fairy Tail</h2><div class="muted">Fiore's rowdiest wizard guild is recruiting. Again. Make your wizard, then pick where Mirajane stamps your guild mark.</div>
      <label>Name</label><input type="text" id="cc-name" maxlength="16" value="Rookie" autocomplete="off">
      <label>Hair style</label><div class="chips" id="cc-hair"></div>
      <label>Hair colour</label><div class="chips" id="cc-hairc"></div>
      <label>Skin tone</label><div class="chips" id="cc-skin"></div>
      <label>Outfit</label><div class="chips" id="cc-outfit"></div>
      <label>Outfit colour</label><div class="chips" id="cc-outc"></div>
      <label>Eye colour</label><div class="chips" id="cc-eye"></div>
      <label>Build</label><div class="chips" id="cc-frame"></div>
      <label>Height</label><div class="chips" id="cc-height"></div>
      <label>Accessory</label><div class="chips" id="cc-acc"></div>
      <label>Guild mark: placement</label><div class="chips" id="cc-mark"></div>
      <div class="muted" id="cc-markhint"></div>
      <label>Guild mark: size</label><div class="chips" id="cc-marks"></div>
      <label>Guild mark: colour</label><div class="chips" id="cc-markc"></div>
      <label>Starting magic</label><div class="schools" id="cc-school"></div>
      <div class="muted" style="margin-top:6px">Lightning (Laxus), Solid Script (Levy) and Requip (Erza) can be bought later at the Magic Shop. Swap magic any time by attuning a different lacrima.</div>
      <button class="btn gold go" id="cc-go">Begin your adventure ▸</button></div></div>`;
    document.body.appendChild(root);
    const cv = root.querySelector('canvas');
    const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }); renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    const scene = new THREE.Scene(); const cam = new THREE.PerspectiveCamera(32, 1, 0.1, 50); cam.position.set(0, 1.35, 4.6); cam.lookAt(0, 1.0, 0);
    scene.add(new THREE.HemisphereLight('#fff0ff', '#402040', 1.6)); const dl = new THREE.DirectionalLight('#fff4e0', 2.4); dl.position.set(2, 4, 3); scene.add(dl);
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.0, 0.18, 32), new THREE.MeshToonMaterial({ color: '#5a2e4a' })); ped.position.y = -0.09; scene.add(ped);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.95, 1.05, 48), new THREE.MeshBasicMaterial({ color: '#e8c36a', side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.01; scene.add(ring);
    let char = null; let rot = 0.4; let alive = true;
    const rebuild = () => {
      if (char) scene.remove(char.group);
      char = buildCharacter(L); scene.add(char.group);
      const w = { flame: 'knuckles', ice: 'sword1h', celestial: 'staff' }[school]; equipVisual(char, w, 1, SCHOOLS[school].color);
      ring.material.color.set(SCHOOLS[school].color);
    };
    const chips = (id, list, key, swatch) => {
      const el = root.querySelector(id); el.innerHTML = '';
      for (const v of list) {
        const b = document.createElement('button'); b.className = swatch ? 'sw' : 'chip'; if (swatch) b.style.background = v; else b.textContent = v;
        if (L[key] === v) b.classList.add('on');
        b.onclick = () => { L[key] = v; if (key === 'heightName') L.height = HMAP[v]; el.querySelectorAll('button').forEach((x) => x.classList.remove('on')); b.classList.add('on'); rebuild(); };
        el.appendChild(b);
      }
    };
    chips('#cc-hair', HAIR_STYLES, 'hair'); chips('#cc-hairc', HAIR_COLORS, 'hairColor', true); chips('#cc-skin', SKIN_TONES, 'skin', true); chips('#cc-outfit', OUTFITS, 'outfit'); chips('#cc-outc', OUTFIT_COLORS, 'outfitColor', true); chips('#cc-eye', EYE_COLORS, 'eyeColor', true); chips('#cc-frame', FRAMES, 'frame'); chips('#cc-acc', ACCESSORIES, 'acc'); chips('#cc-height', HEIGHTS, 'heightName');
    const markChips = (id, list, key, swatch) => {
      const el = root.querySelector(id); el.innerHTML = '';
      for (const v of list) {
        const b = document.createElement('button'); b.className = swatch ? 'sw' : 'chip'; if (swatch) b.style.background = v; else b.textContent = v;
        if (L.mark[key] === v) b.classList.add('on');
        if (key === 'place' && MARK_HINTS[v]) b.title = MARK_HINTS[v];
        b.onclick = () => { L.mark = { ...L.mark, [key]: v }; el.querySelectorAll('button').forEach((x) => x.classList.remove('on')); b.classList.add('on'); rebuild(); stamp(); };
        el.appendChild(b);
      }
    };
    markChips('#cc-mark', MARK_PLACES, 'place'); markChips('#cc-marks', Object.keys(MARK_SIZES), 'size'); markChips('#cc-markc', MARK_COLORS, 'color', true);
    const hintEl = root.querySelector('#cc-markhint'); const stampEl = root.querySelector('#cc-stamp');
    const setHint = () => { const h = MARK_HINTS[L.mark.place]; hintEl.textContent = h ? `✦ ${L.mark.place[0].toUpperCase() + L.mark.place.slice(1)}, ${h}.` : ''; };
    // Mirajane's stamp: spin the mark to face the camera, zoom in, flash
    let focus = 0; const stamp = () => { setHint(); focus = 2.2; stampEl.classList.remove('go'); void stampEl.offsetWidth; stampEl.classList.add('go'); };
    setHint();
    let pose = 'idle'; const pEl = root.querySelector('#cc-pose');
    for (const [k, lbl] of [['idle', 'Idle'], ['run', 'Run'], ['cast', 'Cast'], ['salute', 'Fairy Tail sign']]) { const b = document.createElement('button'); b.className = 'chip' + (k === pose ? ' on' : ''); b.textContent = lbl; b.onclick = () => { pose = k; pEl.querySelectorAll('button').forEach((x) => x.classList.remove('on')); b.classList.add('on'); }; pEl.appendChild(b); }
    const sEl = root.querySelector('#cc-school');
    for (const [k, s] of Object.entries(SCHOOLS)) {
      if (!s.starter) continue;
      const b = document.createElement('button'); b.className = 'school' + (k === school ? ' on' : ''); b.dataset.school = k;
      b.innerHTML = `<div class="i">${s.icon}</div><div class="n" style="color:${s.color}">${s.name}</div><div class="b">${s.blurb}</div>`;
      b.onclick = () => { school = k; sEl.querySelectorAll('.school').forEach((x) => x.classList.remove('on')); b.classList.add('on'); rebuild(); };
      sEl.appendChild(b);
    }
    rebuild();
    let drag = null; cv.addEventListener('pointerdown', (e) => { drag = e.clientX; }); addEventListener('pointerup', () => { drag = null; }); cv.addEventListener('pointermove', (e) => { if (drag !== null) { rot += (e.clientX - drag) * 0.01; drag = e.clientX; } });
    const t0 = performance.now(); const base = { y: 1.35, z: 4.6, ly: 1.0 };
    const loop = () => {
      if (!alive) return; requestAnimationFrame(loop);
      const w = cv.clientWidth, hh = cv.clientHeight; if (cv.width !== Math.floor(w * renderer.getPixelRatio())) { renderer.setSize(w, hh, false); cam.aspect = w / hh; const wide = cam.aspect > 1.1; cam.fov = wide ? 26 : 32; base.y = wide ? 1.15 : 1.35; base.z = wide ? 5.2 : 4.6; base.ly = wide ? 1.05 : 1.0; cam.position.set(0, base.y, base.z); cam.lookAt(0, base.ly, 0); cam.updateProjectionMatrix(); }
      const t = (performance.now() - t0) / 1000; const dt = 1 / 60;
      if (focus > 0 && char.parts.mark) {
        focus -= dt; const want = char.parts.markYaw || 0; let d = ((want - rot) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI; rot += d * 0.12;
        const mp = new THREE.Vector3(); char.parts.mark.getWorldPosition(mp); const k = Math.min(1, focus * 2) * 0.55;
        cam.position.lerp(new THREE.Vector3(mp.x * 0.6, mp.y + 0.05, base.z * (1 - k) + 1.4 * k), 0.12); cam.lookAt(mp.x * 0.6, mp.y * k + base.ly * (1 - k), 0);
      } else { if (drag === null) rot += 0.004; cam.position.lerp(new THREE.Vector3(0, base.y, base.z), 0.08); cam.lookAt(0, base.ly, 0); }
      char.group.rotation.y = rot;
      animateCharacter(char, { t, move: pose === 'run' ? 1 : 0, atk: -1, cast: pose === 'cast' ? 1 : 0, emote: pose === 'salute' && focus <= 0 ? 'salute' : null }); renderer.render(scene, cam);
    };
    loop();
    root.querySelector('#cc-go').onclick = () => {
      const name = root.querySelector('#cc-name').value.trim() || 'Rookie';
      alive = false; renderer.dispose(); renderer.forceContextLoss && renderer.forceContextLoss(); root.remove();
      resolve({ name, look: { ...L, mark: { ...L.mark } }, school });
    };
  });
}
