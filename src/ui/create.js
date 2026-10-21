import * as THREE from 'three';
import { buildCharacter, animateCharacter, equipVisual, HAIR_STYLES, HAIR_COLORS, SKIN_TONES, OUTFITS, OUTFIT_COLORS } from '../world/models.js';
import { SCHOOLS } from '../data/schools.js';
import { MARK_PLACES, MARK_COLORS, guildMarkDataURL } from '../world/mark.js';

/** Character creation screen. Resolves with { name, look, school }. */
export function characterCreation() {
  return new Promise((resolve) => {
    const L = { hair: 'spiky', hairColor: HAIR_COLORS[0], skin: SKIN_TONES[1], outfit: 'adventurer', outfitColor: OUTFIT_COLORS[0], mark: { place: 'right arm', color: MARK_COLORS[0] } };
    let school = 'flame';
    const root = document.createElement('div'); root.id = 'create';
    root.innerHTML = `<div class="wrap"><div class="pv frame"><canvas></canvas><div class="logo"><img alt="" src="${guildMarkDataURL('#e0303a', 128)}">FAIRY TAIL<small>NEW MEMBER</small></div></div>
      <div class="opts frame"><h2>Join Fairy Tail</h2><div class="muted">Fiore's rowdiest wizard guild is recruiting. Again. Make your wizard, then pick where Mirajane stamps your guild mark.</div>
      <label>Name</label><input type="text" id="cc-name" maxlength="16" value="Rookie" autocomplete="off">
      <label>Hair style</label><div class="chips" id="cc-hair"></div>
      <label>Hair colour</label><div class="chips" id="cc-hairc"></div>
      <label>Skin tone</label><div class="chips" id="cc-skin"></div>
      <label>Outfit</label><div class="chips" id="cc-outfit"></div>
      <label>Outfit colour</label><div class="chips" id="cc-outc"></div>
      <label>Guild mark: placement</label><div class="chips" id="cc-mark"></div>
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
        b.onclick = () => { L[key] = v; el.querySelectorAll('button').forEach((x) => x.classList.remove('on')); b.classList.add('on'); rebuild(); };
        el.appendChild(b);
      }
    };
    chips('#cc-hair', HAIR_STYLES, 'hair'); chips('#cc-hairc', HAIR_COLORS, 'hairColor', true); chips('#cc-skin', SKIN_TONES, 'skin', true); chips('#cc-outfit', OUTFITS, 'outfit'); chips('#cc-outc', OUTFIT_COLORS, 'outfitColor', true);
    const markChips = (id, list, key, swatch) => {
      const el = root.querySelector(id); el.innerHTML = '';
      for (const v of list) {
        const b = document.createElement('button'); b.className = swatch ? 'sw' : 'chip'; if (swatch) b.style.background = v; else b.textContent = v;
        if (L.mark[key] === v) b.classList.add('on');
        b.onclick = () => { L.mark = { ...L.mark, [key]: v }; el.querySelectorAll('button').forEach((x) => x.classList.remove('on')); b.classList.add('on'); rebuild(); };
        el.appendChild(b);
      }
    };
    markChips('#cc-mark', MARK_PLACES, 'place'); markChips('#cc-markc', MARK_COLORS, 'color', true);
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
    const t0 = performance.now();
    const loop = () => {
      if (!alive) return; requestAnimationFrame(loop);
      const w = cv.clientWidth, hh = cv.clientHeight; if (cv.width !== Math.floor(w * renderer.getPixelRatio())) { renderer.setSize(w, hh, false); cam.aspect = w / hh; const wide = cam.aspect > 1.1; cam.fov = wide ? 26 : 32; cam.position.set(0, wide ? 1.15 : 1.35, wide ? 5.2 : 4.6); cam.lookAt(0, wide ? 1.05 : 1.0, 0); cam.updateProjectionMatrix(); }
      const t = (performance.now() - t0) / 1000; if (drag === null) rot += 0.004; char.group.rotation.y = rot;
      animateCharacter(char, { t, move: 0, atk: -1, cast: 0 }); renderer.render(scene, cam);
    };
    loop();
    root.querySelector('#cc-go').onclick = () => {
      const name = root.querySelector('#cc-name').value.trim() || 'Rookie';
      alive = false; renderer.dispose(); renderer.forceContextLoss && renderer.forceContextLoss(); root.remove();
      resolve({ name, look: { ...L, mark: { ...L.mark } }, school });
    };
  });
}
