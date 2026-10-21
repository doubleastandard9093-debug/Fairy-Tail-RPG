import * as THREE from 'three';
import { toon, glow, mesh, addOutlines, shadowAll, GFX } from './toon.js';
import { buildNode, buildCharacter, buildMob } from './models.js';
import { NODE_TYPES, NODE_TIERS, NODE_BANDS } from '../data/nodes.js';
import { NPCS, POIS } from '../data/npcs.js';
import { drawGuildMark } from './mark.js';
import { BOSS_ARENA } from '../data/mobs.js';

export function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export const BOUNDS = { minX: -66, maxX: 66, minZ: -44, maxZ: 199 };
export const TOWN = { minX: -42, maxX: 42, minZ: -42, maxZ: 44, gateHalf: 5 };
export const HALL = { minX: -12, maxX: 12, minZ: -34, maxZ: -14, door: 2.6 };
export const POND = { x: -40, z: 114, r: 9 };
export function roadX(z) { return z < 44 ? 0 : Math.sin((z - 44) * 0.035) * 12; }
export function height(x, z) {
  const k = smooth(40, 62, z);
  let h = Math.sin(x * 0.06) * Math.cos(z * 0.05) * 1.6 + Math.sin(x * 0.13 + z * 0.09) * 0.6 + Math.sin(z * 0.021 + 1) * 1.1 + 1.1;
  const dr = Math.abs(x - roadX(z)); h *= 0.35 + 0.65 * smooth(2, 9, dr);
  const da = Math.hypot(x - BOSS_ARENA.x, z - BOSS_ARENA.z); h = h * smooth(BOSS_ARENA.r - 2, BOSS_ARENA.r + 8, da) - 0.3 * (1 - smooth(BOSS_ARENA.r - 4, BOSS_ARENA.r, da));
  const dp = Math.hypot(x - POND.x, z - POND.z); h -= (1 - smooth(POND.r - 3, POND.r + 2, dp)) * 1.2;
  h *= k;
  h += Math.max(0, Math.abs(x) - 56) * 0.7 + Math.max(0, z - 190) * 0.8;
  return h;
}
export function zoneAt(x, z) {
  if (x > HALL.minX && x < HALL.maxX && z > HALL.minZ && z < HALL.maxZ) return 'Fairy Tail Guild Hall';
  if (z < 44) return 'Magnolia';
  if (z < 92) return 'East Forest';
  if (z < 132) return 'Mt. Hakobe Foothills';
  if (z < 166) return 'Oshibana Rail Line';
  return "Clover Canyon";
}

function textTexture(text, { w = 512, h = 128, bg = '#3a2414', fg = '#ffe2a0', font = 'bold 64px Georgia, serif', border = '#c89040' } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, w, h); x.strokeStyle = border; x.lineWidth = 10; x.strokeRect(5, 5, w - 10, h - 10);
  x.fillStyle = fg; x.font = font; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, w / 2, h / 2 + 4);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function emblemTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  x.fillStyle = '#f2e6c8'; x.fillRect(0, 0, 256, 256); x.strokeStyle = '#c89040'; x.lineWidth = 12; x.strokeRect(6, 6, 244, 244);
  drawGuildMark(x, 128, 116, 190, '#d02030', '#2a0a10');
  x.fillStyle = '#7a1a1a'; x.font = 'bold 28px Georgia, serif'; x.textAlign = 'center'; x.fillText('FAIRY TAIL', 128, 238);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function buildWorld(scene) {
  const W = { boxes: [], circles: [], interactables: [], nodes: [], lanterns: [], anim: [], hallRoof: null, map: { rects: [] } };
  const R = rng(1337);
  const addBox = (minX, maxX, minZ, maxZ, tag) => W.boxes.push({ minX, maxX, minZ, maxZ, tag });
  const solid = (obj, cx, cz, w, d, tag) => { addBox(cx - w / 2, cx + w / 2, cz - d / 2, cz + d / 2, tag); return obj; };

  // ---------------- Sky & lights ----------------
  const skyGeo = new THREE.SphereGeometry(400, 24, 12);
  const sky = new THREE.Mesh(skyGeo, new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color('#5a8ae8') }, mid: { value: new THREE.Color('#bfe0ff') }, bot: { value: new THREE.Color('#ffe8d0') } },
    vertexShader: 'varying vec3 vp; void main(){ vp = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 top, mid, bot; varying vec3 vp; void main(){ float h = normalize(vp).y; vec3 c = h > 0.0 ? mix(mid, top, pow(h, 0.6)) : mix(mid, bot, min(1.0, -h * 4.0)); gl_FragColor = vec4(c, 1.0); }',
  }));
  sky.renderOrder = -1; scene.add(sky); W.sky = sky;
  scene.fog = new THREE.Fog('#cfe4f4', GFX.high ? 90 : 60, GFX.high ? 260 : 170);
  const hemi = new THREE.HemisphereLight('#dff0ff', '#6a8a4a', 1.3); scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff2dc', 2.2); sun.position.set(30, 60, 20); scene.add(sun); scene.add(sun.target);
  if (GFX.shadows) {
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 1, far: 160 });
    sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.04;
  }
  W.sun = sun;

  // ---------------- Terrain ----------------
  const tw = 150, td = 260, tz = 77;
  const seg = GFX.high ? [150, 260] : [90, 156];
  const tg = new THREE.PlaneGeometry(tw, td, seg[0], seg[1]); tg.rotateX(-Math.PI / 2); tg.translate(0, 0, tz);
  const pos = tg.attributes.position; const cols = new Float32Array(pos.count * 3); const c = new THREE.Color();
  const grassA = new THREE.Color('#7cc25a'), grassB = new THREE.Color('#5aa648'), dirt = new THREE.Color('#d8b878'), stone = new THREE.Color('#b8b0a4'), dark = new THREE.Color('#4a7a3a'), ash = new THREE.Color('#8a7a6a');
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i); const y = height(x, z); pos.setY(i, y);
    const n = (Math.sin(x * 0.4) * Math.cos(z * 0.37) + Math.sin(x * 0.11 + z * 0.17)) * 0.25 + 0.5;
    c.copy(grassA).lerp(grassB, n);
    if (z > 130) c.lerp(dark, smooth(130, 165, z) * 0.6);
    const dr = Math.abs(x - roadX(z));
    if (z > 40 && dr < 3) c.lerp(dirt, smooth(3, 1.5, dr));
    const inTown = x > TOWN.minX && x < TOWN.maxX && z > TOWN.minZ && z < TOWN.maxZ;
    if (inTown) {
      const plaza = Math.hypot(x, z - 2) < 13; const road = Math.abs(x) < 3 && z > -14; const lanes = (Math.abs(z + 2) < 2.5 && Math.abs(x) < 24) || (Math.abs(z - 20) < 2.5 && Math.abs(x) < 24);
      if (plaza || road || lanes) c.copy(stone).multiplyScalar(0.9 + n * 0.15);
    }
    const da = Math.hypot(x - BOSS_ARENA.x, z - BOSS_ARENA.z); if (da < BOSS_ARENA.r) c.lerp(ash, smooth(BOSS_ARENA.r, BOSS_ARENA.r - 6, da));
    if (Math.hypot(x - POND.x, z - POND.z) < POND.r + 1.5) c.lerp(dirt, 0.5);
    cols.set([c.r, c.g, c.b], i * 3);
  }
  tg.setAttribute('color', new THREE.BufferAttribute(cols, 3)); tg.computeVertexNormals();
  const terrain = new THREE.Mesh(tg, new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: toon('#fff').gradientMap }));
  terrain.receiveShadow = GFX.shadows; terrain.userData.ground = true; scene.add(terrain); W.terrain = terrain;
  // Outer hills ring for a "world edge" silhouette
  const hillM = toon('#6aa050');
  for (let i = 0; i < 26; i++) {
    const side = i % 2 ? 1 : -1; const z = -40 + (i >> 1) * 19;
    const h = mesh(new THREE.SphereGeometry(18 + R() * 8, 12, 8), hillM, side * (88 + R() * 8), -6, z); h.scale.y = 0.6 + R() * 0.3; scene.add(h);
  }
  // Mountains beyond the arena
  for (let i = 0; i < 7; i++) { const m = mesh(new THREE.ConeGeometry(30 + R() * 12, 50 + R() * 25, 7), toon('#8a90a8'), -80 + i * 27, 10, 235 + R() * 12); scene.add(m); const cap = mesh(new THREE.ConeGeometry(10, 14, 7), toon('#f4f6ff'), m.position.x, m.position.y + m.geometry.parameters.height / 2 - 6, m.position.z); scene.add(cap); }

  // ---------------- Town ----------------
  const wood = toon('#8a5a34'), woodD = toon('#5a3a22'), plaster = toon('#f2e6cc'), stoneM = toon('#a8a098'), roofR = toon('#c0503a'), roofB = toon('#3a5aa0'), roofG = toon('#4a8a5a'), roofP = toon('#8a4aa0');
  const building = ({ x, z, w, d, h, roof, door, sign, wall = plaster }) => {
    const g = new THREE.Group(); g.position.set(x, 0, z);
    g.add(mesh(new THREE.BoxGeometry(w, h, d), wall, 0, h / 2, 0));
    g.add(mesh(new THREE.BoxGeometry(w + 0.3, 0.6, d + 0.3), stoneM, 0, 0.3, 0));
    for (const [px, pz] of [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]]) g.add(mesh(new THREE.BoxGeometry(0.4, h, 0.4), woodD, px, h / 2, pz));
    g.add(mesh(new THREE.BoxGeometry(w + 0.2, 0.3, d + 0.2), woodD, 0, h, 0));
    const r = mesh(new THREE.ConeGeometry(Math.hypot(w, d) / 2 + 0.6, h * 0.7, 4), roof, 0, h + h * 0.35, 0); r.rotation.y = Math.PI / 4; r.scale.set(w / Math.max(w, d), 1, d / Math.max(w, d)); g.add(r);
    const chim = mesh(new THREE.BoxGeometry(0.8, 2, 0.8), stoneM, w * 0.25, h + 1.6, -d * 0.15); g.add(chim);
    // door + windows on the door side
    const dirs = { '+x': [1, 0], '-x': [-1, 0], '+z': [0, 1], '-z': [0, -1] }; const [dx, dz] = dirs[door];
    const face = (ox, oy, ww, hh, mat, depth = 0.12) => {
      const m = mesh(new THREE.BoxGeometry(dx ? depth : ww, hh, dz ? depth : ww), mat, dx * (w / 2 + 0.05) + (dz ? ox : 0), oy, dz * (d / 2 + 0.05) + (dx ? ox : 0)); g.add(m); return m;
    };
    face(0, 1.3, 1.8, 2.6, woodD); face(0, 1.3, 1.5, 2.3, wood);
    const winM = toon('#ffe8a0', { emissive: '#7a5a20' });
    for (const o of [-1, 1]) { face(o * (Math.max(w, d) * 0.3), 2.6, 1.2, 1.1, woodD); face(o * (Math.max(w, d) * 0.3), 2.6, 0.9, 0.8, winM, 0.16); }
    if (sign) {
      const st = mesh(new THREE.PlaneGeometry(3.2, 0.8), new THREE.MeshBasicMaterial({ map: textTexture(sign), fog: true }), 0, h - 0.6, 0);
      st.position.set(dx * (w / 2 + 0.2), h - 0.7, dz * (d / 2 + 0.2)); st.rotation.y = Math.atan2(dx, dz); g.add(st);
    }
    addOutlines(g); shadowAll(g, true, true); scene.add(g);
    solid(null, x, z, w + 0.3, d + 0.3, 'bld');
    W.map.rects.push({ x, z, w, d, color: '#b89870' });
    return g;
  };
  building({ x: -22, z: -2, w: 10, d: 8, h: 4.5, roof: roofB, door: '+x', sign: 'BANK' });
  building({ x: 22, z: -2, w: 10, d: 8, h: 4.5, roof: roofG, door: '-x', sign: 'MARKET' });
  building({ x: 22, z: 20, w: 10, d: 9, h: 5, roof: roofR, door: '-x', sign: 'INN' });
  // houses for filler
  for (const [x, z, r] of [[-30, 32, roofP], [30, 34, roofB], [-32, -28, roofR], [32, -28, roofG], [-34, 10, roofR], [34, 8, roofP]]) building({ x, z, w: 7, d: 6, h: 3.8, roof: r, door: x < 0 ? '+x' : '-x' });

  // Guild hall (walk-in interior)
  {
    const H = HALL, h = 6.2, t = 0.6; const g = new THREE.Group(); scene.add(g);
    const wallM = toon('#e8d8b8'), beam = woodD;
    const wall = (cx, cz, w, d) => { const m = mesh(new THREE.BoxGeometry(w, h, d), wallM, cx, h / 2, cz); g.add(m); solid(null, cx, cz, w, d, 'hall'); return m; };
    const midX = (H.minX + H.maxX) / 2;
    wall(midX, H.minZ + t / 2, H.maxX - H.minX, t);
    wall(H.minX + t / 2, (H.minZ + H.maxZ) / 2, t, H.maxZ - H.minZ);
    wall(H.maxX - t / 2, (H.minZ + H.maxZ) / 2, t, H.maxZ - H.minZ);
    const segW = (H.maxX - H.minX) / 2 - H.door;
    wall(H.minX + segW / 2, H.maxZ - t / 2, segW, t); wall(H.maxX - segW / 2, H.maxZ - t / 2, segW, t);
    const lintel = mesh(new THREE.BoxGeometry(H.door * 2 + 0.4, 1.6, t + 0.1), wallM, 0, h - 0.8, H.maxZ - t / 2); g.add(lintel);
    for (const x of [-H.door, H.door]) g.add(mesh(new THREE.BoxGeometry(0.5, h, 0.8), beam, x, h / 2, H.maxZ - t / 2));
    for (let x = H.minX; x <= H.maxX; x += 4) g.add(mesh(new THREE.BoxGeometry(0.35, h, 0.7), beam, x, h / 2, H.maxZ - t / 2));
    g.add(mesh(new THREE.BoxGeometry(H.maxX - H.minX + 0.6, 0.4, 0.75), beam, 0, h - 0.1, H.maxZ - t / 2));
    g.add(mesh(new THREE.BoxGeometry(H.maxX - H.minX + 1, 0.7, H.maxZ - H.minZ + 1), stoneM, 0, 0.1, (H.minZ + H.maxZ) / 2));
    const floor = mesh(new THREE.BoxGeometry(H.maxX - H.minX - 1, 0.1, H.maxZ - H.minZ - 1), toon('#a87a4a'), 0, 0.46, (H.minZ + H.maxZ) / 2); floor.userData.ground = true; g.add(floor);
    for (let i = 0; i < 11; i++) g.add(mesh(new THREE.BoxGeometry(H.maxX - H.minX - 1, 0.02, 0.06), toon('#7a5432'), 0, 0.52, H.minZ + 1 + i * 1.8));
    // Banner with emblem over the door
    const emb = mesh(new THREE.PlaneGeometry(3, 3), new THREE.MeshBasicMaterial({ map: emblemTexture(), fog: true }), 0, h + 1.6, H.maxZ + 0.05); g.add(emb);
    const sign = mesh(new THREE.PlaneGeometry(6, 1.2), new THREE.MeshBasicMaterial({ map: textTexture('FAIRY TAIL', { font: 'bold 56px Georgia, serif' }), fog: true }), 0, h - 0.6, H.maxZ + 0.08); g.add(sign);
    // Roof (hidden when you're inside)
    const roof = new THREE.Group(); g.add(roof);
    const span = (H.maxX - H.minX) / 2 + 1.2, len = H.maxZ - H.minZ + 1.6, pitch = 0.62;
    for (const s of [-1, 1]) { const p = mesh(new THREE.BoxGeometry(span / Math.cos(pitch), 0.4, len), roofR, s * span / 2, h + Math.tan(pitch) * span / 2, (H.minZ + H.maxZ) / 2); p.rotation.z = -s * pitch; roof.add(p); }
    const gable = new THREE.Shape(); gable.moveTo(-span + 0.6, 0); gable.lineTo(span - 0.6, 0); gable.lineTo(0, Math.tan(pitch) * (span - 0.6)); gable.lineTo(-span + 0.6, 0);
    for (const z of [H.minZ + 0.3, H.maxZ - 0.3]) { const gm = mesh(new THREE.ShapeGeometry(gable), wallM, 0, h, z); gm.material = toon('#e8d8b8', { side: THREE.DoubleSide }); roof.add(gm); }
    const tower = mesh(new THREE.BoxGeometry(3, 4, 3), wallM, 0, h + 5, H.minZ + 4); roof.add(tower);
    const spire = mesh(new THREE.ConeGeometry(2.6, 4, 4), roofR, 0, h + 9, H.minZ + 4); spire.rotation.y = Math.PI / 4; roof.add(spire);
    const flag = mesh(new THREE.PlaneGeometry(1.6, 1), toon('#c0302a', { side: THREE.DoubleSide }), 0.8, h + 11.4, H.minZ + 4); roof.add(flag); W.anim.push((t) => { flag.rotation.y = Math.sin(t * 3) * 0.3; });
    W.hallRoof = roof;
    // Interior: request board, bar, tables, fireplace, chandeliers
    const board = new THREE.Group(); board.position.set(H.minX + 0.75, 0.5, -26); board.rotation.y = Math.PI / 2; g.add(board);
    board.add(mesh(new THREE.BoxGeometry(5, 3, 0.2), woodD, 0, 2.1, 0)); board.add(mesh(new THREE.BoxGeometry(4.5, 2.5, 0.22), toon('#c89a5a'), 0, 2.1, 0));
    const paperC = ['#fff8e0', '#ffe8e0', '#e8f0ff', '#f0ffe8'];
    for (let i = 0; i < 12; i++) { const p = mesh(new THREE.BoxGeometry(0.7, 0.55, 0.05), toon(paperC[i % 4]), -1.8 + (i % 6) * 0.72, 1.55 + Math.floor(i / 6) * 0.9 + (i % 2) * 0.1, 0.13); p.rotation.z = (R() - 0.5) * 0.25; board.add(p); }
    const boardTitle = mesh(new THREE.PlaneGeometry(3.4, 0.6), new THREE.MeshBasicMaterial({ map: textTexture('REQUEST BOARD', { font: 'bold 52px Georgia, serif' }) }), 0, 3.85, 0.12); board.add(boardTitle);
    solid(null, H.minX + 0.9, -26, 1.0, 5, 'board');
    W.interactables.push({ kind: 'board', name: 'Request Board', x: H.minX + 1.6, z: -26, r: 3.4, obj: board });
    // bar counter
    const bar = mesh(new THREE.BoxGeometry(8, 1.0, 1.2), wood, 6, 0.95, -27.2); g.add(bar); g.add(mesh(new THREE.BoxGeometry(8.3, 0.15, 1.4), woodD, 6, 1.5, -27.2)); solid(null, 6, -27.2, 8, 1.2, 'bar');
    for (let i = 0; i < 5; i++) g.add(mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.35, 8), toon(['#c03030', '#3060c0', '#30a050', '#e0b030', '#a040c0'][i]), 3 + i * 1.4, 1.75, -27.2));
    g.add(mesh(new THREE.BoxGeometry(8, 3, 0.4), woodD, 6, 2.2, -33.3)); for (let i = 0; i < 3; i++) g.add(mesh(new THREE.BoxGeometry(7.6, 0.1, 0.6), wood, 6, 1.4 + i, -33));
    // tables
    for (const [x, z] of [[-4, -19.5], [4, -19.5], [-5, -31]]) {
      const tbl = new THREE.Group(); tbl.position.set(x, 0.5, z); g.add(tbl);
      tbl.add(mesh(new THREE.BoxGeometry(3.6, 0.15, 1.6), wood, 0, 1, 0));
      for (const [lx, lz] of [[-1.6, -0.6], [1.6, -0.6], [-1.6, 0.6], [1.6, 0.6]]) tbl.add(mesh(new THREE.BoxGeometry(0.15, 1, 0.15), woodD, lx, 0.5, lz));
      for (const s of [-1, 1]) tbl.add(mesh(new THREE.BoxGeometry(3.4, 0.12, 0.5), woodD, 0, 0.55, s * 1.2));
      tbl.add(mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.25, 8), toon('#e8c060'), -0.8, 1.2, 0.2)); tbl.add(mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.06, 12), toon('#f0f0f0'), 0.6, 1.1, -0.1));
      solid(null, x, z, 3.6, 3, 'table');
    }
    // fireplace
    const fp = new THREE.Group(); fp.position.set(-4.5, 0.5, H.minZ + 0.9); g.add(fp);
    fp.add(mesh(new THREE.BoxGeometry(4, 3.4, 1.2), stoneM, 0, 1.7, 0)); fp.add(mesh(new THREE.BoxGeometry(2.4, 1.6, 0.4), toon('#1a1010'), 0, 0.9, 0.45));
    const fire = mesh(new THREE.ConeGeometry(0.6, 1.2, 8), glow('#ff8a2a'), 0, 0.7, 0.55); fp.add(fire); W.anim.push((t) => { fire.scale.set(1 + Math.sin(t * 13) * 0.1, 1 + Math.sin(t * 9) * 0.2, 1); });
    solid(null, -4.5, H.minZ + 0.9, 4, 1.4, 'fire');
    // banners on side walls
    for (const s of [-1, 1]) for (const z of [-30, -20]) { const b = mesh(new THREE.PlaneGeometry(1.4, 2.6), new THREE.MeshBasicMaterial({ map: emblemTexture(), side: THREE.DoubleSide }), s * (H.maxX - 0.7), 3.6, z); b.rotation.y = -s * Math.PI / 2; if (!(s < 0 && z === -20 && false)) g.add(b); }
    // chandeliers
    for (const z of [-20, -29]) {
      const ch = new THREE.Group(); ch.position.set(0, 5.2, z); g.add(ch);
      ch.add(mesh(new THREE.TorusGeometry(1.2, 0.08, 6, 16), woodD)); ch.children[0].rotation.x = Math.PI / 2;
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; ch.add(mesh(new THREE.SphereGeometry(0.12, 8, 6), glow('#ffd080'), Math.cos(a) * 1.2, 0.15, Math.sin(a) * 1.2)); }
      if (GFX.high) { const pl = new THREE.PointLight('#ffc070', 18, 14, 1.6); pl.position.set(0, 4.6, z); scene.add(pl); }
    }
    addOutlines(g); shadowAll(g, true, true);
    W.map.rects.push({ x: 0, z: (H.minZ + H.maxZ) / 2, w: H.maxX - H.minX, d: H.maxZ - H.minZ, color: '#c86a4a', hall: true });
  }

  // Forge pavilion
  {
    const g = new THREE.Group(); g.position.set(-20, 0, 20); scene.add(g);
    for (const [x, z] of [[-5, -4], [5, -4], [-5, 4], [5, 4]]) { g.add(mesh(new THREE.BoxGeometry(0.5, 4.2, 0.5), woodD, x, 2.1, z)); solid(null, -20 + x, 20 + z, 0.6, 0.6, 'post'); }
    const roof = mesh(new THREE.ConeGeometry(8.2, 2.6, 4), toon('#5a4a42'), 0, 5.4, 0); roof.rotation.y = Math.PI / 4; roof.scale.z = 0.8; g.add(roof);
    g.add(mesh(new THREE.BoxGeometry(10.6, 0.25, 8.6), stoneM, 0, 0.1, 0));
    const forge = new THREE.Group(); forge.position.set(-2.5, 0, -2); g.add(forge);
    forge.add(mesh(new THREE.BoxGeometry(2.6, 1.4, 2), toon('#8a4a3a'), 0, 0.7, 0));
    const coals = mesh(new THREE.BoxGeometry(2, 0.2, 1.4), glow('#ff6a1a'), 0, 1.45, 0); forge.add(coals); W.anim.push((t) => { coals.material.color.setHSL(0.06, 1, 0.5 + Math.sin(t * 5) * 0.08); });
    forge.add(mesh(new THREE.CylinderGeometry(0.4, 0.6, 3.5, 8), toon('#6a3a2a'), 0, 3, -0.6));
    solid(null, -22.5, 18, 2.6, 2, 'forge');
    W.interactables.push({ kind: 'station', station: 'forge', name: 'Forge', x: -22.5, z: 19.8, r: 3.2, obj: forge });
    const anvil = new THREE.Group(); anvil.position.set(1, 0, -1.5); g.add(anvil);
    anvil.add(mesh(new THREE.BoxGeometry(0.6, 0.7, 0.6), woodD, 0, 0.35, 0)); anvil.add(mesh(new THREE.BoxGeometry(1.2, 0.35, 0.5), toon('#4a4a52'), 0, 0.88, 0));
    const horn = mesh(new THREE.ConeGeometry(0.18, 0.5, 6), toon('#4a4a52'), 0.8, 0.88, 0); horn.rotation.z = -Math.PI / 2; anvil.add(horn);
    solid(null, -19, 18.5, 1.4, 0.8, 'anvil');
    W.interactables.push({ kind: 'station', station: 'forge', name: 'Anvil', x: -19, z: 19.8, r: 2.8, obj: anvil });
    const bench = new THREE.Group(); bench.position.set(0, 0, 3.2); g.add(bench);
    bench.add(mesh(new THREE.BoxGeometry(4, 0.2, 1.4), wood, 0, 1.1, 0));
    for (const [x, z] of [[-1.8, -0.5], [1.8, -0.5], [-1.8, 0.5], [1.8, 0.5]]) bench.add(mesh(new THREE.BoxGeometry(0.18, 1.1, 0.18), woodD, x, 0.55, z));
    bench.add(mesh(new THREE.BoxGeometry(0.8, 0.3, 0.5), toon('#e8e0d0'), -1, 1.35, 0)); bench.add(mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.6, 10), wood, 1, 1.5, 0));
    solid(null, -20, 23.2, 4, 1.4, 'bench');
    W.interactables.push({ kind: 'station', station: 'workbench', name: 'Workbench', x: -20, z: 21.7, r: 3, obj: bench });
    const sign = mesh(new THREE.PlaneGeometry(3.2, 0.8), new THREE.MeshBasicMaterial({ map: textTexture('FORGE'), side: THREE.DoubleSide }), 5.3, 3.4, 0); sign.rotation.y = Math.PI / 2; g.add(sign);
    addOutlines(g); shadowAll(g, true, true);
    W.map.rects.push({ x: -20, z: 20, w: 10, d: 8, color: '#8a6a5a' });
  }
  // Market board next to the market
  {
    const b = new THREE.Group(); b.position.set(15.4, 0, 3.2); b.rotation.y = -Math.PI / 2; scene.add(b);
    b.add(mesh(new THREE.BoxGeometry(2.6, 1.8, 0.15), woodD, 0, 1.9, 0)); b.add(mesh(new THREE.BoxGeometry(0.2, 2.8, 0.2), woodD, -1.2, 1.4, 0)); b.add(mesh(new THREE.BoxGeometry(0.2, 2.8, 0.2), woodD, 1.2, 1.4, 0));
    for (let i = 0; i < 6; i++) b.add(mesh(new THREE.BoxGeometry(0.6, 0.45, 0.04), toon(['#fff8e0', '#e8f0ff'][i % 2]), -0.8 + (i % 3) * 0.8, 1.6 + Math.floor(i / 3) * 0.6, -0.1));
    addOutlines(b); shadowAll(b); solid(null, 15.4, 3.2, 0.6, 2.8, 'mboard');
    W.interactables.push({ kind: 'shop', name: 'Market Board', x: 14.6, z: 3.2, r: 3, obj: b });
  }
  // Fountain
  {
    const g = new THREE.Group(); g.position.set(0, 0, 2); scene.add(g);
    g.add(mesh(new THREE.CylinderGeometry(3.4, 3.6, 0.8, 20), stoneM, 0, 0.4, 0));
    const water = mesh(new THREE.CylinderGeometry(3.0, 3.0, 0.1, 20), toon('#5ab8f0', { emissive: '#1a4a7a' }), 0, 0.75, 0); g.add(water);
    g.add(mesh(new THREE.CylinderGeometry(0.4, 0.6, 2.2, 10), stoneM, 0, 1.6, 0));
    const top = mesh(new THREE.SphereGeometry(0.5, 12, 8), toon('#e8c060'), 0, 2.9, 0); g.add(top);
    const spray = mesh(new THREE.ConeGeometry(0.9, 1.4, 12, 1, true), glow('#bfe8ff', 0.45), 0, 2.4, 0); spray.rotation.x = Math.PI; g.add(spray);
    W.anim.push((t) => { spray.scale.set(1 + Math.sin(t * 6) * 0.05, 1 + Math.sin(t * 4) * 0.08, 1); top.rotation.y = t; });
    addOutlines(g); shadowAll(g, true, true);
    W.circles.push({ x: 0, z: 2, r: 3.6 });
  }
  // Fence + gate
  {
    const g = new THREE.Group(); scene.add(g); const T = TOWN;
    const run = (x0, z0, x1, z1) => {
      const len = Math.hypot(x1 - x0, z1 - z0), n = Math.ceil(len / 3);
      for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, z = z0 + (z1 - z0) * i / n; g.add(mesh(new THREE.BoxGeometry(0.35, 1.8, 0.35), woodD, x, 0.9, z)); }
      const rail = mesh(new THREE.BoxGeometry(Math.abs(x1 - x0) || 0.15, 0.15, Math.abs(z1 - z0) || 0.15), wood, (x0 + x1) / 2, 1.3, (z0 + z1) / 2); g.add(rail);
      const rail2 = rail.clone(); rail2.position.y = 0.7; g.add(rail2);
      addBox(Math.min(x0, x1) - 0.3, Math.max(x0, x1) + 0.3, Math.min(z0, z1) - 0.3, Math.max(z0, z1) + 0.3, 'fence');
    };
    run(T.minX, T.minZ, T.maxX, T.minZ); run(T.minX, T.minZ, T.minX, T.maxZ); run(T.maxX, T.minZ, T.maxX, T.maxZ);
    run(T.minX, T.maxZ, -T.gateHalf, T.maxZ); run(T.gateHalf, T.maxZ, T.maxX, T.maxZ);
    for (const s of [-1, 1]) { g.add(mesh(new THREE.BoxGeometry(1, 6, 1), stoneM, s * T.gateHalf, 3, T.maxZ)); g.add(mesh(new THREE.ConeGeometry(0.9, 1.4, 4), roofR, s * T.gateHalf, 6.7, T.maxZ)); }
    g.add(mesh(new THREE.BoxGeometry(T.gateHalf * 2 + 1, 0.8, 0.8), woodD, 0, 5.4, T.maxZ));
    const gs = mesh(new THREE.PlaneGeometry(5, 1), new THREE.MeshBasicMaterial({ map: textTexture('MAGNOLIA'), side: THREE.DoubleSide }), 0, 4.6, T.maxZ + 0.45); g.add(gs);
    addOutlines(g); shadowAll(g, true, false);
  }
  // Lantern posts (Magnolia!)
  {
    const spots = [[-4, -8], [4, -8], [-14, 8], [14, 8], [-4, 30], [4, 30], [-8, 40], [8, 40], [-12, -2], [12, -2], [-12, 20], [12, 20]];
    for (let z = 52; z < 175; z += 14) spots.push([roadX(z) + 3.2, z]);
    for (const [x, z] of spots) {
      const g = new THREE.Group(); g.position.set(x, height(x, z), z); scene.add(g);
      g.add(mesh(new THREE.CylinderGeometry(0.1, 0.14, 3.2, 6), toon('#2a2a30'), 0, 1.6, 0));
      g.add(mesh(new THREE.BoxGeometry(0.9, 0.08, 0.08), toon('#2a2a30'), 0.35, 3.1, 0));
      const l = mesh(new THREE.BoxGeometry(0.36, 0.5, 0.36), glow('#ffd27a'), 0.7, 2.8, 0); g.add(l); W.lanterns.push(l);
      g.add(mesh(new THREE.ConeGeometry(0.32, 0.25, 4), toon('#2a2a30'), 0.7, 3.15, 0));
      addOutlines(g); W.circles.push({ x, z, r: 0.35 });
    }
  }

  // ---------------- Field POIs ----------------
  // Pond
  { const w = mesh(new THREE.CircleGeometry(POND.r, 28), toon('#4aa8e0', { emissive: '#103a5a', transparent: true, opacity: 0.85 }), POND.x, -0.35, POND.z); w.rotation.x = -Math.PI / 2; w.userData.noOutline = true; scene.add(w); W.circles.push({ x: POND.x, z: POND.z, r: POND.r - 1.2 });
    for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; const lp = mesh(new THREE.CircleGeometry(0.6, 10), toon('#5ac05a'), POND.x + Math.cos(a) * 5, -0.3, POND.z + Math.sin(a) * 4); lp.rotation.x = -Math.PI / 2; scene.add(lp); }
    W.map.pond = POND; }
  // Kardia Cathedral (escort destination)
  { const [sx, sz] = POIS.shrine.pos; const g = new THREE.Group(); g.position.set(sx, height(sx, sz), sz); scene.add(g);
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; const s = mesh(new THREE.BoxGeometry(0.8, 2.6 + (i % 2), 0.8), stoneM, Math.cos(a) * 4, 1.3, Math.sin(a) * 4); g.add(s); W.circles.push({ x: sx + Math.cos(a) * 4, z: sz + Math.sin(a) * 4, r: 0.6 }); }
    const cr = mesh(new THREE.OctahedronGeometry(0.8, 0), glow('#9af0ff'), 0, 2.4, 0); g.add(cr); W.anim.push((t) => { cr.rotation.y = t; cr.position.y = 2.4 + Math.sin(t * 2) * 0.2; });
    g.add(mesh(new THREE.CylinderGeometry(1.4, 1.6, 0.6, 8), stoneM, 0, 0.3, 0)); addOutlines(g); shadowAll(g); }
  // Arena pillars
  { const g = new THREE.Group(); scene.add(g);
    for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; if (Math.abs(a - Math.PI * 1.5) < 0.4) continue; const x = BOSS_ARENA.x + Math.cos(a) * (BOSS_ARENA.r + 1), z = BOSS_ARENA.z + Math.sin(a) * (BOSS_ARENA.r + 1);
      const p = mesh(new THREE.CylinderGeometry(0.9, 1.3, 5 + R() * 4, 6), toon('#7a7068'), x, height(x, z) + 2.5, z); p.rotation.z = (R() - 0.5) * 0.2; g.add(p);
      const cr = mesh(new THREE.OctahedronGeometry(0.5, 0), glow('#ff8a3a'), x, height(x, z) + 6.8, z); g.add(cr); W.circles.push({ x, z, r: 1.2 }); }
    addOutlines(g); shadowAll(g); }

  // ---------------- Gathering nodes ----------------
  const placed = [];
  const okSpot = (x, z, r) => Math.abs(x - roadX(z)) > 5 && Math.hypot(x - POND.x, z - POND.z) > POND.r + 3 && Math.hypot(x - POIS.shrine.pos[0], z - POIS.shrine.pos[1]) > 7 && Math.hypot(x - BOSS_ARENA.x, z - BOSS_ARENA.z) > BOSS_ARENA.r + 4 && placed.every(([px, pz]) => Math.hypot(px - x, pz - z) > r);
  for (const band of NODE_BANDS) for (const type of Object.keys(NODE_TYPES)) for (let i = 0; i < band.perType; i++) {
    let x, z, tries = 0;
    do { x = -50 + R() * 100; z = band.z[0] + 3 + R() * (band.z[1] - band.z[0] - 6); tries++; } while (!okSpot(x, z, 6) && tries < 60);
    placed.push([x, z]);
    const obj = buildNode(type, band.tier); obj.position.set(x, height(x, z), z); obj.rotation.y = R() * 6; scene.add(obj);
    const node = { kind: 'node', type, tier: band.tier, name: NODE_TYPES[type].names[band.tier - 1], x, z, r: type === 'wood' ? 2.6 : 2.4, obj, uses: NODE_TIERS[band.tier].uses, respawn: 0 };
    W.nodes.push(node); W.interactables.push(node);
    W.circles.push({ x, z, r: type === 'wood' ? 0.6 : type === 'ore' ? 1.1 : 0.7, node });
  }
  // A few T1 nodes just outside the gate so new players can gather quickly
  for (const [type, x, z] of [['ore', -12, 52], ['wood', 12, 54], ['fibre', -9, 60]]) {
    const obj = buildNode(type, 1); obj.position.set(x, height(x, z), z); scene.add(obj);
    const node = { kind: 'node', type, tier: 1, name: NODE_TYPES[type].names[0], x, z, r: 2.6, obj, uses: NODE_TIERS[1].uses, respawn: 0 };
    W.nodes.push(node); W.interactables.push(node); W.circles.push({ x, z, r: type === 'ore' ? 1.1 : 0.6, node });
  }

  // ---------------- Decor (instanced) ----------------
  const decoTrees = GFX.high ? 420 : 140, flowers = GFX.high ? 2200 : 500;
  {
    const trunkG = new THREE.CylinderGeometry(0.22, 0.35, 2.6, 6); trunkG.translate(0, 1.3, 0);
    const crownG = new THREE.IcosahedronGeometry(1.5, 1); crownG.translate(0, 3.4, 0);
    const trunks = new THREE.InstancedMesh(trunkG, toon('#6a4a2a'), decoTrees), crowns = new THREE.InstancedMesh(crownG, toon('#ffffff'), decoTrees);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), col = new THREE.Color();
    let n = 0;
    for (let i = 0; i < decoTrees * 4 && n < decoTrees; i++) {
      const x = -70 + R() * 140, z = -44 + R() * 246;
      const inTown = x > TOWN.minX - 3 && x < TOWN.maxX + 3 && z > TOWN.minZ - 3 && z < TOWN.maxZ + 3;
      const edge = Math.abs(x) > 48 || z > 186 || z < -38;
      if (inTown && !(Math.abs(x) > 40 || z < -40)) continue;
      if (!edge && R() > 0.25) continue;
      if (!okSpot(x, z, 3.5)) continue;
      if (z > 44 && Math.abs(x) < 48) W.circles.push({ x, z, r: 0.5 });
      placed.push([x, z]);
      const sc = 0.8 + R() * 0.7; p.set(x, height(x, z) - 0.1, z); q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), R() * 6); s.set(sc, sc * (0.9 + R() * 0.3), sc);
      m.compose(p, q, s); trunks.setMatrixAt(n, m); crowns.setMatrixAt(n, m);
      col.setHSL(0.26 + R() * 0.08 - (z > 130 ? 0.04 : 0), 0.5, 0.32 + R() * 0.12); crowns.setColorAt(n, col); n++;
    }
    trunks.count = crowns.count = n; trunks.castShadow = crowns.castShadow = GFX.shadows; scene.add(trunks, crowns);
    // flowers & tufts
    const fg = new THREE.IcosahedronGeometry(0.12, 0); fg.translate(0, 0.15, 0);
    const fl = new THREE.InstancedMesh(fg, toon('#ffffff'), flowers); const fc = ['#ff7ab0', '#ffe060', '#ffffff', '#8ab0ff', '#ff8a5a'];
    let f = 0;
    for (let i = 0; i < flowers; i++) {
      const x = -60 + R() * 120, z = -40 + R() * 230;
      if (x > HALL.minX - 1 && x < HALL.maxX + 1 && z > HALL.minZ - 1 && z < HALL.maxZ + 1) continue;
      if (W.boxes.some((b) => x > b.minX - 0.5 && x < b.maxX + 0.5 && z > b.minZ - 0.5 && z < b.maxZ + 0.5)) continue;
      if (Math.abs(x - roadX(z)) < 3 || Math.hypot(x, z - 2) < 13) continue;
      p.set(x, height(x, z), z); s.setScalar(0.6 + R()); q.identity(); m.compose(p, q, s); fl.setMatrixAt(f, m); fl.setColorAt(f, col.set(fc[f % 5])); f++;
    }
    fl.count = f; scene.add(fl);
    if (GFX.high) {
      const gg = new THREE.ConeGeometry(0.06, 0.55, 3); gg.translate(0, 0.27, 0);
      const N = 14000; const grass = new THREE.InstancedMesh(gg, toon('#ffffff'), N); let k = 0;
      for (let i = 0; i < N; i++) {
        const x = -62 + R() * 124, z = 44 + R() * 150;
        if (Math.abs(x - roadX(z)) < 2.5 || Math.hypot(x - BOSS_ARENA.x, z - BOSS_ARENA.z) < BOSS_ARENA.r - 2 || Math.hypot(x - POND.x, z - POND.z) < POND.r) continue;
        p.set(x, height(x, z), z); q.setFromEuler(new THREE.Euler((R() - 0.5) * 0.4, R() * 6, (R() - 0.5) * 0.4)); s.set(1, 0.6 + R() * 0.9, 1); m.compose(p, q, s);
        grass.setMatrixAt(k, m); grass.setColorAt(k, col.setHSL(0.27 + R() * 0.06, 0.55, 0.3 + R() * 0.15)); k++;
      }
      grass.count = k; scene.add(grass);
    }
  }

  // ---------------- Town NPCs ----------------
  W.npcs = {};
  for (const [id, n] of Object.entries(NPCS)) {
    const c = n.model ? buildMob(n.model, n.model === 'cat' ? { fur: n.fur, hat: false, bag: '#3aa05a', wings: true, happy: n.happy, belly: '#ffffff' } : {}) : buildCharacter(n.look); const [x, z] = n.pos;
    if (n.model) c.parts.head = c.parts.body;
    c.group.position.set(x, n.y ?? (z > HALL.minZ && z < HALL.maxZ && Math.abs(x) < HALL.maxX ? 0.5 : 0), z);
    const f = n.face || [0, 6]; c.group.lookAt(f[0], c.group.position.y, f[1]);
    scene.add(c.group);
    const it = { kind: 'npc', npc: id, name: n.name, x, z, r: 3.6, obj: c.group, char: c };
    W.npcs[id] = it; W.interactables.push(it); W.circles.push({ x, z, r: 0.5 });
  }
  W.update = (t, playerPos) => {
    for (const f of W.anim) f(t);
    for (const id in W.npcs) { const it = W.npcs[id]; const d = Math.hypot(playerPos.x - it.x, playerPos.z - it.z); if (it.char.parts.wing1) { const b = it.char.parts.body; b.position.y = Math.sin(t * 3) * 0.12; it.char.parts.wing1.rotation.z = 0.5 + Math.sin(t * 18) * 0.5; it.char.parts['wing-1'].rotation.z = -0.5 - Math.sin(t * 18) * 0.5; } else if (it.npc === 'plue') { const b = it.char.parts.body; b.position.x = Math.sin(t * 40) * 0.012; b.rotation.z = Math.sin(t * 33) * 0.04; } else it.char.parts.head.rotation.y = d < 6 ? Math.max(-0.6, Math.min(0.6, Math.sin(t * 0.7 + it.x) * 0.3)) : 0; }
    if (GFX.shadows) { W.sun.position.set(playerPos.x + 30, 60, playerPos.z + 20); W.sun.target.position.set(playerPos.x, 0, playerPos.z); }
    W.sky.position.set(playerPos.x, 0, playerPos.z);
  };
  return W;
}

/** Ground height at (x,z), accounting for the guild hall floor. */
export function groundAt(x, z) {
  if (x > HALL.minX && x < HALL.maxX && z > HALL.minZ && z < HALL.maxZ + 0.3) return 0.5;
  return height(x, z);
}
