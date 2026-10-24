// Creature rework: layered silhouettes, procedural fur / hide / scale / stone / moss / crystal surface shaders
// (object-space so patterns stick to animated parts), eyes with iris + pupil + glint, richer locomotion,
// telegraphed wind-ups, idle variety, hit-burst VFX and elite variants. Low tier keeps plain toon materials.
import * as THREE from 'three';
import { GFX, NOISE_GLSL, toon, glow, mesh } from './toon.js';

const GC = new Map();
const geo = (k, f) => { if (!GC.has(k)) GC.set(k, f()); return GC.get(k); };
const sph = (r, w = 14, h = 10) => geo(`s${r}|${w}|${h}`, () => new THREE.SphereGeometry(r, w, h));
const cap = (r, l, s = 10) => geo(`c${r}|${l}|${s}`, () => new THREE.CapsuleGeometry(r, l, 4, s));
const cyl = (a, b, h, s = 10) => geo(`y${a}|${b}|${h}|${s}`, () => new THREE.CylinderGeometry(a, b, h, s));
const cone = (r, h, s = 6) => geo(`k${r}|${h}|${s}`, () => new THREE.ConeGeometry(r, h, s));
const box = (x, y, z) => geo(`b${x}|${y}|${z}`, () => new THREE.BoxGeometry(x, y, z));
const tor = (r, t, a, b, arc) => geo(`t${r}|${t}|${a}|${b}|${arc}`, () => new THREE.TorusGeometry(r, t, a, b, arc));
const shade = (hex, k) => { const c = new THREE.Color(hex); c.multiplyScalar(k); return '#' + c.getHexString(); };
const H = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
/** Lumpy boulder: icosphere with hashed radial displacement (cached per seed). */
export function rockGeo(r, seed = 0, det = 1, amt = 0.22) {
  return geo(`r${r}|${seed}|${det}|${amt}`, () => {
    const g = new THREE.IcosahedronGeometry(r, det); const p = g.attributes.position; const v = new THREE.Vector3();
    const seen = new Map();
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const key = `${v.x.toFixed(3)},${v.y.toFixed(3)},${v.z.toFixed(3)}`;
      let k = seen.get(key); if (k == null) { k = 1 + (H(v.x * 3.1 + v.y * 7.3 + v.z * 1.7 + seed) - 0.5) * 2 * amt; seen.set(key, k); }
      v.multiplyScalar(k); if (v.y < -r * 0.6) v.y = -r * 0.6; p.setXYZ(i, v.x, v.y, v.z); }
    g.computeVertexNormals(); return g;
  });
}
const add = (par, g, m, x = 0, y = 0, z = 0) => { const o = mesh(g, m, x, y, z); par.add(o); return o; };
const grp = (par, x = 0, y = 0, z = 0) => { const o = new THREE.Group(); o.position.set(x, y, z); par.add(o); return o; };

// ------------------------------------------------------------------ surface shaders
const SURF = {
  // long strands combed along local +y with clumping, tip lightening and a soft fuzz sheen
  fur: `float cl = vnoise(cp * 5.0); float st = vnoise(vec3(cp.x * 46.0, cp.y * 7.0 + cl * 2.0, cp.z * 46.0)); float st2 = vnoise(vec3(cp.x * 90.0, cp.y * 14.0, cp.z * 90.0));
    float aa = 1.0 - smoothstep(0.25, 0.9, length(fwidth(cp)) * 30.0); float fh = mix(0.5, st * 0.75 + st2 * 0.25, aa * 0.85 + 0.15); cAlb = vec3(0.8 + 0.28 * fh) * mix(0.92, 1.06, cl); cH = fh * (0.4 + 0.6 * aa); cRough = 0.95; cSheen = 0.32;`,
  // coarse bristle hide with darker mottled patches
  hide: `float sp = smoothstep(0.45, 0.75, fbm3(cp * 3.0)); float br = vnoise(vec3(cp.x * 60.0, cp.y * 12.0, cp.z * 60.0));
    cAlb = vec3(0.78 + 0.34 * br) * mix(1.0, 0.72, sp); cH = br * 0.7; cRough = 0.9; cSheen = 0.16;`,
  // overlapping scales: offset rows of cells, dark seams, domed + slightly glossy
  scale: `vec2 su = vec2(atan(cp.x, cp.z) * 3.2, cp.y * 9.0); su.x += step(1.0, mod(floor(su.y), 2.0)) * 0.5; vec2 f = fract(su) - vec2(0.5, 0.0);
    float d = length(vec2(f.x * 1.1, f.y * 0.8)); float seam = smoothstep(0.42, 0.55, d); float tone = rh(vec3(floor(su), 4.0));
    cAlb = vec3(0.86 + 0.24 * tone) * mix(1.0, 0.55, seam) * (0.9 + 0.2 * (1.0 - f.y)); cH = (1.0 - seam) * (1.0 - f.y * 0.6); cRough = 0.45; cSheen = 0.12;`,
  // weathered stone: strata, voronoi-ish cracks, lichen + moss on up-facing surfaces
  stone: `float g = fbm3(cp * 1.6); float strata = sin(cp.y * 9.0 + g * 6.0) * 0.5 + 0.5; float cr = smoothstep(0.08, 0.0, abs(vnoise(cp * 3.4) - 0.5));
    float up = clamp(nW.y, 0.0, 1.0); float mo = smoothstep(0.35, 0.75, up + (vnoise(cp * 4.5) - 0.5) * 0.9) * MOSSK;
    cAlb = vec3(0.72 + 0.36 * strata * (0.7 + 0.3 * g)) * (1.0 - cr * 0.5); cAlb = mix(cAlb, vec3(0.42, 0.62, 0.26) / max(diffuseColor.rgb, vec3(0.05)) * (0.8 + 0.4 * vnoise(cp * 12.0)), mo);
    cH = strata * 0.4 + (1.0 - cr) * 0.6 + mo * 0.4; cRough = 0.92; cSheen = 0.05;`,
  // crystal: internal facets, strong fresnel, bright glints
  crystal: `float fa = vnoise(cp * 7.0); float fac = step(0.5, fract(dot(cp, vec3(4.1, 2.7, 3.3)) + fa)); cAlb = vec3(0.8 + 0.35 * fac); cH = fac * 0.3; cRough = 0.12; cSheen = 0.0; cGlow = 0.35 + 0.25 * fac;`,
  // soft skin / leather with fine pores and mottling
  skin: `float mt = fbm3(cp * 6.0); float po = vnoise(cp * 70.0); cAlb = vec3(0.9 + 0.16 * mt - po * 0.06); cH = po * 0.3; cRough = 0.7; cSheen = 0.06;`,
  // spectral: drifting bands; emissive only (MeshBasic not used so we can light it)
  bark: `float g = fbm3(cp * vec3(3.0, 0.6, 3.0)); float fur = smoothstep(0.35, 0.0, abs(fract(atan(cp.x, cp.z) * 2.6 + g * 1.4) - 0.5)); float kn = smoothstep(0.78, 0.9, vnoise(cp * 2.2));
    cAlb = vec3(0.82 + 0.3 * g) * (1.0 - fur * 0.45) * (1.0 - kn * 0.3); cH = (1.0 - fur) * 0.7 + g * 0.3 - kn * 0.4; cRough = 0.9; cSheen = 0.03;`,
  cloth: `float wv = sin(cp.x * 140.0) * sin(cp.y * 140.0) * 0.5 + 0.5; float aa = 1.0 - smoothstep(0.2, 0.8, length(fwidth(cp)) * 60.0); float fo = fbm3(cp * 2.5);
    cAlb = vec3(0.9 + 0.12 * fo - wv * 0.06 * aa); cH = wv * 0.15 * aa + fo * 0.2; cRough = 0.85; cSheen = 0.22;`,
  bone: `float g = fbm3(cp * 5.0); float pit = smoothstep(0.7, 0.85, vnoise(cp * 22.0)); cAlb = vec3(0.92 + 0.12 * g) * (1.0 - pit * 0.35); cH = g * 0.5 - pit * 0.5; cRough = 0.6; cSheen = 0.05;`,
};
const MCACHE = new Map();
/** Material for creature surfaces. kind: fur | hide | scale | stone | moss | crystal | skin | bone. */
export function cmat(color, kind = 'fur', o = {}) {
  if (!GFX.high && !GFX.real) return toon(color, o.emissive ? { emissive: o.emissive } : {});
  const key = color + kind + JSON.stringify(o) + (GFX.real ? 'R' : 'T');
  if (MCACHE.has(key)) return MCACHE.get(key);
  const k = kind === 'moss' ? 'stone' : kind; const sc = o.scale || (k === 'stone' ? 1.0 : 2.2);
  const m = GFX.real ? new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0, envMapIntensity: 0.9, emissive: o.emissive || '#000000' })
    : new THREE.MeshToonMaterial({ color, emissive: o.emissive || '#000000', gradientMap: toon('#ffffff').gradientMap });
  const bump = (o.bump ?? (k === 'fur' ? (GFX.real ? 0.45 : 0.8) : k === 'scale' ? 1.3 : k === 'stone' ? 1.6 : 0.6)) * (GFX.real ? 1 : 0.6);
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vCP;').replace('#include <begin_vertex>', `#include <begin_vertex>\nvCP = position;`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>\nvarying vec3 vCP;\n${NOISE_GLSL}\n#define MOSSK ${kind === 'moss' ? '1.0' : '0.0'}`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        vec3 cp = vCP * ${sc.toFixed(3)}; vec3 nW = normalize(inverseTransformDirection(normalize(vNormal), viewMatrix));
        vec3 cAlb = vec3(1.0); float cH = 0.0, cRough = 0.8, cSheen = 0.0, cGlow = 0.0;
        ${SURF[k] || SURF.skin}
        diffuseColor.rgb *= cAlb;`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        { vec3 dpx = dFdx(-vViewPosition), dpy = dFdy(-vViewPosition); float hx = dFdx(cH), hy = dFdy(cH);
          vec3 r1 = cross(dpy, normal), r2 = cross(normal, dpx); float det = dot(dpx, r1);
          vec3 gr = sign(det) * (hx * r1 + hy * r2); normal = normalize(abs(det) * normal - gr * ${bump.toFixed(3)}); }`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        { vec3 vd = normalize(vViewPosition); float fr = pow(1.0 - clamp(abs(dot(normal, vd)), 0.0, 1.0), 2.5);
          totalEmissiveRadiance += diffuseColor.rgb * (fr * cSheen + cGlow * ${(o.glowK ?? 0).toFixed(3)}) + vec3(0.8, 0.9, 1.0) * fr * ${k === 'crystal' ? '0.5' : '0.0'}; }`);
    if (GFX.real) sh.fragmentShader = sh.fragmentShader.replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = cRough;');
  };
  m.customProgramCacheKey = () => `cm|${kind}|${sc}|${bump}|${o.glowK || 0}|${GFX.real}`;
  MCACHE.set(key, m); return m;
}

/** Eye with sclera, coloured iris, pupil (round or slit) and a specular glint. */
function eye(par, x, y, z, r, iris = '#c88a2a', o = {}) {
  const e = grp(par, x, y, z); e.rotation.y = o.yaw || 0;
  if (o.glow) { add(e, sph(r, 10, 8), glow(iris)).scale.z = 0.55; add(e, sph(r * 1.7, 10, 8), glow(iris, 0.25)).scale.z = 0.4; return e; }
  add(e, sph(r, 12, 10), toon(o.sclera || '#f4ecdc')).scale.z = 0.7;
  const ir = add(e, sph(r * 0.62, 12, 8), toon(iris, { emissive: shade(iris, 0.25) }), 0, 0, r * 0.5); ir.scale.z = 0.35; ir.userData.noOutline = true;
  const pu = add(e, sph(r * 0.32, 8, 6), toon('#0a0608'), 0, 0, r * 0.62); pu.scale.set(o.slit ? 0.32 : 1, o.slit ? 1.5 : 1, 0.3); pu.userData.noOutline = true;
  const gl = add(e, sph(r * 0.16, 6, 4), glow('#ffffff'), r * 0.25, r * 0.28, r * 0.7); gl.userData.noOutline = true;
  if (o.lid) { const lid = add(e, sph(r * 1.08, 10, 6, ), toon(o.lid)); lid.scale.set(1, 0.45, 0.8); lid.position.set(0, r * 0.55, 0); lid.rotation.x = -0.2; e.userData.lid = lid; }
  return e;
}
/** Ring of tufts around a parent; tufts point outward + along `tilt`. */
function tufts(par, m, n, r, y, z0, len, spread = Math.PI * 2, a0 = 0, tilt = 0.9, seed = 0) {
  for (let i = 0; i < n; i++) { const a = a0 + (i / n) * spread + (H(i + seed) - 0.5) * 0.4; const l = len * (0.75 + H(i * 3 + seed) * 0.5);
    const t = add(par, cone(len * 0.32, l, 5), m, Math.sin(a) * r, y + (H(i * 7 + seed) - 0.5) * len * 0.5, z0 + Math.cos(a) * r);
    t.rotation.set(Math.cos(a) * tilt, 0, -Math.sin(a) * tilt); }
}

// ------------------------------------------------------------------ builders
export const CREATURES = new Set(['vulcan', 'boar', 'golem', 'wisp']);

export function buildCreature(model, opt = {}) {
  const g = new THREE.Group(); const P = { kind: model }; g.userData.seed = Math.random() * 100;
  if (model === 'vulcan') buildVulcan(g, P, opt); else if (model === 'boar') buildBoar(g, P, opt);
  else if (model === 'golem') buildGolem(g, P, opt); else if (model === 'wisp') buildWisp(g, P, opt);
  P.seed = g.userData.seed; return { group: g, parts: P };
}

function buildVulcan(g, P, opt) {
  const fc = opt.fur || '#f2f2f6'; const fur = cmat(fc, 'fur'), fur2 = cmat(shade(fc, 0.78), 'fur'), fur3 = cmat(shade(fc, 1.08), 'fur');
  const face = cmat(opt.face || '#d8a0a0', 'skin'), dark = toon(shade(opt.face || '#d8a0a0', 0.45)), nail = toon('#3a3030'), tooth = cmat('#f6efe0', 'bone');
  P.fx = { kind: 'fur', color: fc };
  const b = grp(g, 0, 0, 0); P.body = b; const hip = grp(b, 0, 1.0, 0); P.hip = hip;
  const ch = grp(hip, 0, 0.2, 0.05); P.chest = ch;
  // torso: barrel chest, hunched shoulder mass, pot belly with a bare chest plate
  add(ch, sph(0.66, 18, 14), fur, 0, 0.55, -0.05).scale.set(1.2, 1.05, 0.95);
  for (const s of [-1, 1]) add(ch, sph(0.36, 14, 10), fur3, s * 0.55, 0.95, -0.12).scale.set(1, 0.85, 1);
  add(ch, sph(0.5, 16, 12), fur2, 0, 0.98, -0.35).scale.set(1.25, 0.7, 0.9);
  const plate = add(ch, sph(0.44, 16, 12), face, 0, 0.5, 0.36); plate.scale.set(1.05, 1.15, 0.42);
  for (const s of [-1, 1]) add(ch, sph(0.2, 10, 8), face, s * 0.2, 0.78, 0.44).scale.set(1.1, 0.7, 0.4); // pecs
  add(hip, sph(0.52, 16, 12), fur2, 0, 0.0, -0.02).scale.set(1.15, 0.8, 0.95);
  tufts(ch, fur3, 14, 0.6, 1.2, -0.25, 0.34, Math.PI * 1.2, Math.PI * 0.4, 1.1, 1); // shoulder mane
  tufts(ch, fur2, 10, 0.5, 0.35, -0.3, 0.26, Math.PI * 0.9, Math.PI * 0.55, 1.3, 7); // back fur
  tufts(hip, fur, 8, 0.5, -0.2, 0, 0.24, Math.PI * 2, 0, 1.6, 3); // hip skirt
  // head: heavy brow, muzzle with nostrils, hinged jaw with fangs, ears, crest
  const head = grp(ch, 0, 1.22, 0.3); P.head = head;
  add(head, sph(0.33, 16, 12), fur).scale.set(1.05, 0.95, 1);
  const brow = add(head, sph(0.3, 14, 8), fur2, 0, 0.12, 0.14); brow.scale.set(1.15, 0.35, 0.7);
  const muz = add(head, sph(0.22, 14, 10), face, 0, -0.06, 0.25); muz.scale.set(1.15, 0.78, 0.85);
  for (const s of [-1, 1]) add(head, sph(0.035, 6, 4), dark, s * 0.06, 0.0, 0.45).userData.noOutline = true;
  const jaw = grp(head, 0, -0.14, 0.12); P.jaw = jaw;
  add(jaw, sph(0.19, 12, 8), face, 0, -0.05, 0.12).scale.set(1.15, 0.5, 0.9);
  add(jaw, box(0.22, 0.02, 0.12), toon('#6a2a30'), 0, 0.0, 0.16).userData.noOutline = true;
  for (const s of [-1, 1]) { const f = add(jaw, cone(0.03, 0.11, 5), tooth, s * 0.1, 0.06, 0.24); f.userData.noOutline = true;
    const uf = add(head, cone(0.025, 0.09, 5), tooth, s * 0.08, -0.13, 0.36); uf.rotation.x = Math.PI; uf.userData.noOutline = true; }
  P.eyes = [eye(head, -0.12, 0.05, 0.27, 0.055, opt.eye || '#c8202a', { lid: shade(fc, 0.8) }), eye(head, 0.12, 0.05, 0.27, 0.055, opt.eye || '#c8202a', { lid: shade(fc, 0.8) })];
  for (const s of [-1, 1]) { const ear = add(head, sph(0.09, 10, 8), face, s * 0.33, 0.02, -0.02); ear.scale.set(0.5, 1, 0.8); }
  const crest = grp(head, 0, 0.3, -0.02); P.crest = crest;
  for (let i = 0; i < 5; i++) { const c = add(crest, cone(0.07, 0.34 - Math.abs(i - 2) * 0.05, 5), fur3, 0, 0.08, 0.12 - i * 0.08); c.rotation.x = -0.35 - i * 0.18; }
  // arms: shoulder → elbow → hand with knuckles; long, ape-like
  P.arms = [];
  for (const s of [-1, 1]) {
    const sh = grp(ch, s * 0.78, 0.98, 0); sh.rotation.z = s * 0.18;
    add(sh, sph(0.24, 12, 10), fur3, 0, -0.02, 0);
    add(sh, cap(0.17, 0.42), fur, 0, -0.32, 0);
    const el = grp(sh, 0, -0.62, 0); el.rotation.x = -0.25;
    add(el, cap(0.16, 0.42), fur2, 0, -0.28, 0);
    tufts(el, fur3, 7, 0.15, -0.12, 0, 0.2, Math.PI * 2, 0, 1.9, s * 5);
    const hand = grp(el, 0, -0.62, 0.04);
    add(hand, sph(0.17, 12, 10), face).scale.set(1.1, 0.75, 1.1);
    for (let i = 0; i < 4; i++) { const f = add(hand, cap(0.045, 0.08, 6), face, -0.1 + i * 0.066, -0.1, 0.1); f.rotation.x = 0.6; add(hand, sph(0.026, 6, 4), nail, -0.1 + i * 0.066, -0.16, 0.16).userData.noOutline = true; }
    add(hand, cap(0.045, 0.06, 6), face, -s * 0.15, -0.03, 0.06).rotation.z = s * 0.8;
    P.arms.push({ sh, el, hand, s });
  }
  P.legs = [];
  for (const s of [-1, 1]) {
    const hp = grp(hip, s * 0.3, -0.05, 0); add(hp, cap(0.2, 0.3), fur2, 0, -0.22, 0.02);
    const kn = grp(hp, 0, -0.48, 0.04); add(kn, cap(0.15, 0.26), fur, 0, -0.2, -0.02);
    const ft = add(kn, box(0.24, 0.1, 0.4), face, 0, -0.43, 0.08); ft.userData.noOutline = false;
    for (let i = 0; i < 3; i++) add(kn, sph(0.05, 6, 4), face, -0.07 + i * 0.07, -0.44, 0.3);
    P.legs.push({ hp, kn, s });
  }
}

function buildBoar(g, P, opt) {
  const fc = opt.fur || '#6a3e22'; const hide = cmat(fc, 'hide'), hide2 = cmat(shade(fc, 0.72), 'hide'), mane = cmat(shade(fc, 0.45), 'fur', { scale: 3 }),
    belly = cmat(shade(fc, 1.3), 'hide'), snoutM = cmat('#c88a80', 'skin'), hoof = toon('#1e140c'), tusk = cmat('#fff2dc', 'bone'), dark = toon('#2a1010');
  P.fx = { kind: 'fur', color: fc };
  const b = grp(g, 0, 0, 0); P.body = b; const tr = grp(b, 0, 0.78, 0); P.torso = tr;
  add(tr, sph(0.6, 18, 14), hide, 0, 0, -0.05).scale.set(0.92, 0.82, 1.32);
  add(tr, sph(0.5, 16, 12), hide2, 0, 0.12, 0.42).scale.set(1.02, 1.05, 0.9); // shoulder hump
  add(tr, sph(0.44, 14, 10), hide, 0, 0, -0.55).scale.set(0.95, 0.85, 0.8); // haunch
  add(tr, sph(0.42, 14, 10), belly, 0, -0.25, 0.05).scale.set(0.85, 0.5, 1.15);
  for (let i = 0; i < 11; i++) { const z = 0.62 - i * 0.13; const h = 0.5 - Math.abs(i - 3) * 0.035; for (const s of [-1, 0, 1]) {
    const sp = add(tr, cone(0.06, 0.3 * (s ? 0.7 : 1) * (1 - i * 0.04), 4), mane, s * 0.09, h, z); sp.rotation.set(-0.55, 0, -s * 0.4); } }
  const head = grp(tr, 0, 0.02, 0.78); P.head = head;
  add(head, sph(0.36, 16, 12), hide2).scale.set(0.92, 0.88, 1.15);
  const sn = add(head, cyl(0.15, 0.2, 0.26, 12), hide, 0, -0.08, 0.34); sn.rotation.x = Math.PI / 2;
  const disc = add(head, cyl(0.155, 0.155, 0.04, 14), snoutM, 0, -0.08, 0.48); disc.rotation.x = Math.PI / 2;
  for (const s of [-1, 1]) add(head, sph(0.035, 6, 4), dark, s * 0.055, -0.08, 0.5).userData.noOutline = true;
  const jaw = grp(head, 0, -0.2, 0.12); P.jaw = jaw; add(jaw, sph(0.18, 12, 8), hide, 0, 0, 0.14).scale.set(0.9, 0.45, 1.2);
  for (const s of [-1, 1]) {
    const t = add(head, tor(0.14, 0.032, 6, 10, Math.PI * 0.7), tusk, s * 0.16, -0.12, 0.34); t.rotation.set(0, Math.PI / 2, Math.PI * 0.6); t.scale.x = s;
    const ear = grp(head, s * 0.22, 0.26, -0.08); const em = add(ear, cone(0.1, 0.24, 5), hide2, 0, 0.1, 0); em.scale.z = 0.4; ear.rotation.set(-0.3, 0, -s * 0.6); (P.ears ||= []).push(ear);
  }
  P.eyes = [eye(head, -0.17, 0.1, 0.26, 0.045, '#6a2a10', { yaw: -0.5, lid: shade(fc, 0.6) }), eye(head, 0.17, 0.1, 0.26, 0.045, '#6a2a10', { yaw: 0.5, lid: shade(fc, 0.6) })];
  const brow = add(head, box(0.42, 0.07, 0.12), mane, 0, 0.2, 0.22); brow.rotation.x = 0.4;
  tufts(head, mane, 6, 0.12, 0.3, -0.12, 0.2, Math.PI, -Math.PI / 2, 0.6, 2);
  P.legs = [];
  for (const [x, z, fr] of [[-0.3, 0.42, 1], [0.3, 0.42, 1], [-0.3, -0.5, 0], [0.3, -0.5, 0]]) {
    const up = grp(tr, x, -0.12, z); add(up, sph(0.17, 10, 8), fr ? hide2 : hide, 0, 0, 0).scale.set(0.9, 1.3, 1.1);
    add(up, cyl(0.12, 0.085, 0.32, 8), hide, 0, -0.22, 0);
    const lo = grp(up, 0, -0.38, 0); add(lo, cyl(0.08, 0.07, 0.24, 8), hide2, 0, -0.1, 0);
    for (const s of [-1, 1]) add(lo, box(0.06, 0.09, 0.12), hoof, s * 0.04, -0.25, 0.02);
    P.legs.push({ up, lo, fr });
  }
  const tail = grp(tr, 0, 0.15, -0.88); P.tail = tail; add(tail, tor(0.06, 0.02, 4, 10, Math.PI * 1.5), snoutM); add(tail, cone(0.04, 0.12, 4), mane, 0.06, -0.06, 0);
}

function buildGolem(g, P, opt) {
  const st = cmat(opt.stone || '#7a7068', 'moss'), st2 = cmat(shade(opt.stone || '#7a7068', 0.72), 'stone'), mossM = cmat('#4a7a2a', 'fur', { scale: 3.5 });
  const rune = glow(opt.rune || '#7affc0'), crys = cmat('#9ad0ff', 'crystal', { emissive: '#2a5a90', glowK: 1 }), vine = toon('#3a5a22');
  P.fx = { kind: 'stone', color: opt.stone || '#7a7068', spark: opt.rune || '#7affc0' }; P.runes = [];
  const b = grp(g, 0, 0, 0); P.body = b; const tr = grp(b, 0, 2.2, 0); P.torso = tr;
  add(tr, rockGeo(1.35, 1, 1, 0.16), st, 0, 0.8, 0).scale.set(1.25, 1.0, 0.95);
  add(tr, rockGeo(0.95, 2, 1, 0.18), st2, 0, -0.1, 0.25).scale.set(1.05, 0.9, 0.9);
  for (const s of [-1, 1]) add(tr, rockGeo(0.75, 3 + s, 1, 0.2), st, s * 1.25, 1.45, -0.1);
  // rune seams: thin glowing strips on the chest + a core gem
  for (let i = 0; i < 6; i++) { const r = add(tr, box(0.06, 0.42 + (i % 3) * 0.18, 0.04), rune, -0.75 + i * 0.3, 0.55 + (i % 2) * 0.35, 1.18 - Math.abs(i - 2.5) * 0.08); r.rotation.z = (i - 2.5) * 0.28; r.userData.noOutline = true; P.runes.push(r); }
  const core = add(tr, new THREE.OctahedronGeometry(0.26, 0), crys, 0, 0.75, 1.25); P.core = core;
  // mossy mantle with hanging vines and ferns
  const mant = add(tr, rockGeo(1.1, 9, 1, 0.25), mossM, 0, 1.85, -0.25); mant.scale.set(1.45, 0.38, 1.15);
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; const l = 0.5 + H(i) * 0.7; const v = add(tr, cyl(0.025, 0.012, l, 4), vine, Math.sin(a) * 1.45, 1.75 - l / 2, Math.cos(a) * 1.05 - 0.2); v.userData.noOutline = true; }
  for (let i = 0; i < 7; i++) { const a = i * 0.9; const f = add(tr, cone(0.12, 0.5, 4), mossM, Math.sin(a) * 0.9, 2.15, Math.cos(a) * 0.7 - 0.3); f.rotation.set(Math.cos(a) * 0.5, 0, -Math.sin(a) * 0.5); }
  P.crystals = [];
  for (let i = 0; i < 6; i++) { const s = i % 2 ? 1 : -1; const c = add(tr, new THREE.OctahedronGeometry(0.4 + H(i) * 0.22, 0), crys, s * (0.45 + i * 0.17), 2.3 + H(i + 4) * 0.35, -0.8 - H(i + 2) * 0.3); c.scale.y = 2.6; c.rotation.set(-0.5, 0, -s * 0.5); P.crystals.push(c); }
  const head = grp(tr, 0, 2.05, 0.95); P.head = head;
  add(head, rockGeo(0.62, 5, 1, 0.14), st2).scale.set(1.15, 0.9, 1);
  const brow = add(head, rockGeo(0.5, 6, 0, 0.1), st, 0, 0.32, 0.2); brow.scale.set(1.5, 0.45, 0.9);
  P.eyes = [eye(head, -0.25, 0.08, 0.5, 0.11, opt.rune || '#7affc0', { glow: true }), eye(head, 0.25, 0.08, 0.5, 0.11, opt.rune || '#7affc0', { glow: true })];
  const jaw = grp(head, 0, -0.38, 0.15); P.jaw = jaw; add(jaw, rockGeo(0.45, 7, 0, 0.12), st, 0, -0.05, 0.15).scale.set(1.3, 0.5, 0.9);
  P.arms = [];
  for (const s of [-1, 1]) {
    const sh = grp(tr, s * 1.75, 1.35, 0); add(sh, rockGeo(0.62, 10 + s, 1, 0.2), st, 0, 0, 0);
    add(sh, rockGeo(0.48, 12 + s, 1, 0.2), st2, 0, -0.85, 0.05);
    const el = grp(sh, 0, -1.35, 0.05); add(el, rockGeo(0.5, 14 + s, 1, 0.2), st2, 0, -0.35, 0.05);
    const fist = add(el, rockGeo(0.72, 16 + s, 1, 0.18), st, 0, -1.0, 0.12); fist.scale.set(1, 0.9, 1.05);
    for (let i = 0; i < 3; i++) add(el, rockGeo(0.2, 20 + i, 0, 0.15), st2, (i - 1) * 0.32, -1.25, 0.6);
    const r = add(el, box(0.05, 0.5, 0.04), rune, 0, -0.4, 0.5); r.userData.noOutline = true; P.runes.push(r);
    P.arms.push({ sh, el, s });
  }
  P.legs = [];
  for (const s of [-1, 1]) { const hp = grp(b, s * 0.8, 1.55, 0); add(hp, rockGeo(0.55, 30 + s, 1, 0.18), st2, 0, -0.35, 0).scale.y = 1.2;
    const kn = grp(hp, 0, -0.95, 0); add(kn, rockGeo(0.6, 33 + s, 1, 0.16), st, 0, -0.3, 0.05).scale.set(1.05, 0.9, 1.25); P.legs.push({ hp, kn, s }); }
}

function buildWisp(g, P, opt) {
  const c1 = opt.color || '#8a7aff'; P.fx = { kind: 'spirit', color: c1 };
  const b = grp(g, 0, 1.1, 0); P.body = b;
  add(b, sph(0.3, 16, 12), glow('#e8e0ff'));
  P.shells = [add(b, sph(0.46, 18, 14), glow(c1, 0.35)), add(b, sph(0.62, 18, 14), glow(shade(c1, 0.7), 0.16))];
  const mask = grp(b, 0, 0.05, 0.42); P.mask = mask; const bone = cmat('#ece6da', 'bone');
  add(mask, sph(0.24, 16, 12), bone).scale.set(0.95, 1.15, 0.45);
  for (const s of [-1, 1]) { add(mask, sph(0.06, 8, 6), toon('#140a1e'), s * 0.09, 0.05, 0.08).scale.set(1.2, 0.8, 0.5); add(mask, sph(0.032, 6, 4), glow('#ffe86a'), s * 0.09, 0.05, 0.11); }
  const crk = add(mask, box(0.012, 0.16, 0.01), toon('#3a3040'), 0.05, 0.15, 0.1); crk.rotation.z = 0.4; crk.userData.noOutline = true;
  add(mask, box(0.12, 0.018, 0.01), toon('#140a1e'), 0, -0.12, 0.1).userData.noOutline = true;
  const hood = add(b, cone(0.5, 1.0, 12), glow(shade(c1, 0.45), 0.55), 0, 0.35, -0.05); hood.rotation.x = -0.15; P.hood = hood;
  P.tend = [];
  for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; const chain = [];
    let par = grp(b, Math.sin(a) * 0.3, -0.25, Math.cos(a) * 0.3 - 0.1);
    for (let i = 0; i < 5; i++) { const s = add(par, sph(0.11 - i * 0.017, 8, 6), glow(i % 2 ? c1 : shade(c1, 1.25), 0.7 - i * 0.11)); s.position.y = i ? -0.17 : 0; const n = grp(s, 0, 0, 0); chain.push(s); par = n; }
    P.tend.push(chain); }
  P.orbit = []; for (let i = 0; i < 8; i++) P.orbit.push(add(b, sph(0.045, 6, 4), glow(i % 2 ? '#c8b8ff' : '#ffffff', 0.9)));
  const halo = add(b, tor(0.7, 0.014, 4, 40, Math.PI * 2), glow(c1, 0.5)); halo.rotation.x = Math.PI / 2; P.halo = halo;
}

/** Lizardman dress-up on top of the humanoid build: scale skin, crest frill, jaw with teeth, slit eyes, segmented tail, back spines. */
export function dressLizard(g, parts, M) {
  const c = parts.char; const skinHex = '#5aa05a'; const old = toon(skinHex); const sc = cmat(skinHex, 'scale');
  if (sc !== old) c.group.traverse((o) => { if (o.isMesh && o.material === old) o.material = sc; });
  const sk = cmat('#4a8a4a', 'scale'), belly = cmat('#c8d890', 'scale', { scale: 1.5 }), frill = cmat('#c04a2a', 'skin'), tooth = cmat('#f2ecd8', 'bone');
  P_fx(parts, 'scale', '#4a8a4a');
  const head = c.parts.head; const body = c.parts.body;
  const jaw = grp(head, 0, -0.18, 0.3); parts.jaw = jaw; add(jaw, cone(0.15, 0.36, 8), sk, 0, 0, 0.08).rotation.x = Math.PI / 2;
  for (let i = 0; i < 4; i++) for (const s of [-1, 1]) { const t = add(jaw, cone(0.015, 0.05, 4), tooth, s * (0.08 - i * 0.015), 0.04, 0.0 + i * 0.07); t.userData.noOutline = true; }
  for (const s of [-1, 1]) {
    const fr = grp(head, s * 0.2, 0.05, -0.05); for (let i = 0; i < 3; i++) { const f = add(fr, cone(0.06, 0.32, 4), frill, s * 0.06, 0.05 - i * 0.1, -0.04); f.rotation.z = -s * (1.2 + i * 0.2); f.scale.z = 0.3; } (parts.frills ||= []).push(fr); }
  for (let i = 0; i < 6; i++) { const sp = add(body, cone(0.045, 0.16 - i * 0.012, 4), frill, 0, 1.45 - i * 0.12, -0.22 + i * 0.01); sp.rotation.x = -0.9; }
  if (parts.tail) parts.tail.visible = false;
  const segs = []; let par = grp(body, 0, 0.8, -0.2); par.rotation.x = -1.95;
  for (let i = 0; i < 5; i++) { const r = 0.15 - i * 0.025; add(par, cap(r, 0.18, 8), i % 2 ? sk : cmat('#4a8a4a', 'scale', { scale: 2.6 }), 0, 0.14, 0); if (i < 4) add(par, cone(0.03, 0.1, 4), frill, 0, 0.14, -r); const n = grp(par, 0, 0.27, 0); segs.push(par); par = n; }
  parts.tailSegs = segs; add(body, sph(0.17, 12, 10), belly, 0, 1.15, 0.13).scale.set(1, 1.4, 0.6);
}
function P_fx(parts, kind, color) { parts.fx = { kind, color }; }

// ------------------------------------------------------------------ animation
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = (x) => x * x * (3 - 2 * x);
/** Attack envelope: wind (0..1 telegraph before the hit), atk (0..1 after the hit lands). Returns {up, strike}. */
function swing(wind, atk) { const up = wind > 0 ? ease(cl(wind)) : atk >= 0 ? 1 - ease(cl(atk / 0.18)) : 0; const strike = atk >= 0 ? Math.sin(cl(atk / 0.25) * Math.PI * 0.5) * (1 - ease(cl((atk - 0.35) / 0.65))) : 0; return { up, strike }; }
/** Per-mob idle event clock: returns 0..1 progress inside an event window, else -1. */
function idleEv(seed, t, period, len) { const k = (t + seed * 7.3) % period; return k < len ? k / len : -1; }

export function animateCreature(m, model, t, move, atk) {
  const p = m.parts; const sd = p.seed || 0; const wind = m.wind || 0; const { up, strike } = swing(wind, atk);
  const idle = move < 0.1 && up === 0 && strike === 0;
  const look = Math.sin(t * 0.37 + sd) * 0.5 + Math.sin(t * 0.91 + sd * 2) * 0.25;
  if (p.eyes) { const bl = ((t + sd) % 4.3) < 0.12 ? 0.1 : 1; for (const e of p.eyes) if (e.userData.lid) e.userData.lid.position.y = e.children[0].geometry.parameters.radius * (0.55 - (1 - bl) * 0.6); }
  if (model === 'vulcan') {
    const ph = t * 7.5; const lean = 0.28 * move + up * -0.25 + strike * 0.45;
    p.hip.position.y = 1.0 + Math.abs(Math.sin(ph)) * 0.09 * move - strike * 0.12; p.hip.rotation.x = lean; p.hip.rotation.z = Math.sin(ph) * 0.06 * move;
    p.chest.rotation.y = Math.sin(ph) * 0.15 * move;
    p.legs.forEach((l, i) => { const q = Math.sin(ph + i * Math.PI); l.hp.rotation.x = q * 0.65 * move - lean * 0.8 + strike * 0.3; l.kn.rotation.x = Math.max(0, -Math.cos(ph + i * Math.PI)) * 0.9 * move + lean * 0.3; });
    let beat = idle ? idleEv(sd, t, 9, 1.6) : -1;
    p.arms.forEach((a, i) => { const q = Math.sin(ph + i * Math.PI + Math.PI);
      let sx = q * 0.75 * move, ex = -0.25 - Math.max(0, q) * 0.5 * move;
      sx += -2.7 * up + 1.2 * strike; ex += -0.6 * up + 0.2 * strike; let sz = a.s * (0.18 + up * 0.35);
      if (beat >= 0) { const k = Math.sin(beat * Math.PI * 6 + i * Math.PI); sx = -1.1 - Math.max(0, k) * 0.4; ex = -1.6; sz = -a.s * 0.25; }
      else if (idle) { sx += Math.sin(t * 1.3 + i + sd) * 0.06; }
      a.sh.rotation.set(sx, 0, sz); a.el.rotation.x = ex; });
    p.head.rotation.set(-up * 0.35 + strike * 0.2 + (beat >= 0 ? -0.3 : 0), idle ? look : 0, Math.sin(t * 1.5) * 0.05);
    p.jaw.rotation.x = Math.max(up, beat >= 0 ? 1 : 0) * 0.55 + Math.max(0, Math.sin(t * 0.8 + sd)) * 0.05;
    p.crest.rotation.x = -up * 0.4 + Math.sin(t * 9) * 0.03 * move;
  } else if (model === 'boar') {
    const ph = t * (move > 0.5 ? 13 : 8);
    p.legs.forEach((l, i) => { const off = l.fr ? 0 : Math.PI * 0.85; const q = Math.sin(ph + off + (i % 2) * 0.4); l.up.rotation.x = q * 0.7 * move + (l.fr ? 0 : up * 0.45); l.lo.rotation.x = Math.max(0, Math.cos(ph + off)) * (l.fr ? -0.8 : 0.8) * move - (l.fr ? 0 : up * 0.6); });
    let paw = idle ? idleEv(sd, t, 6.5, 1.2) : -1; let sniff = idle ? idleEv(sd + 3, t, 5, 1.8) : -1;
    if (paw >= 0) { const L = p.legs[0]; L.up.rotation.x = -0.4 + Math.sin(paw * Math.PI * 4) * 0.5; L.lo.rotation.x = -0.5; }
    p.torso.position.y = 0.78 + Math.abs(Math.sin(ph)) * 0.07 * move - up * 0.12; p.torso.rotation.x = Math.sin(ph * 2) * 0.05 * move + up * 0.18 - strike * 0.12;
    p.head.rotation.x = (sniff >= 0 ? 0.35 + Math.sin(sniff * Math.PI * 8) * 0.05 : 0) + up * 0.45 - strike * 0.9 + Math.sin(t * 2) * 0.03;
    p.head.rotation.y = idle && sniff < 0 ? look * 0.6 : 0; p.jaw.rotation.x = strike * 0.35;
    p.ears.forEach((e, i) => { const fl = ((t * 1.3 + sd + i * 2.1) % 3.1) < 0.15 ? 0.5 : 0; e.rotation.x = -0.3 - move * 0.6 - up * 0.5 + fl; });
    p.tail.rotation.z = Math.sin(t * (move ? 16 : 6)) * 0.5;
  } else if (model === 'golem') {
    const ph = t * 3.2; p.body.position.y = Math.abs(Math.sin(ph)) * 0.12 * move - strike * 0.25; p.torso.rotation.z = Math.sin(ph) * 0.07 * move + (idle ? Math.sin(t * 0.6 + sd) * 0.03 : 0);
    p.torso.rotation.x = 0.1 * move - up * 0.28 + strike * 0.45; p.torso.rotation.y = Math.sin(ph) * 0.08 * move;
    p.legs.forEach((l, i) => { const q = Math.sin(ph + i * Math.PI); l.hp.rotation.x = q * 0.4 * move - strike * 0.2; l.kn.rotation.x = Math.max(0, -q) * 0.5 * move + strike * 0.25; });
    p.arms.forEach((a, i) => { const q = Math.sin(ph + i * Math.PI + Math.PI); a.sh.rotation.set(q * 0.4 * move - 2.6 * up + 1.9 * strike, 0, a.s * (0.08 + up * 0.25 - strike * 0.15)); a.el.rotation.x = -0.15 - up * 0.7 + strike * 0.1; });
    p.head.rotation.set(-up * 0.3 + strike * 0.25, idle ? look * 0.5 : 0, 0); p.jaw.rotation.x = up * 0.4 + Math.max(0, Math.sin(t * 1.1 + sd)) * 0.08;
    const pulse = 0.6 + 0.4 * Math.sin(t * 2.2 + sd) + up * 0.8; p.runes.forEach((r, i) => { r.material.opacity = 1; r.scale.x = 0.8 + pulse * 0.4 + Math.sin(t * 5 + i) * 0.1; });
    for (const e of p.eyes) e.scale.setScalar(0.85 + pulse * 0.2); p.core.rotation.y = t * 0.8; p.core.scale.setScalar(1 + up * 0.4 + Math.sin(t * 3) * 0.05);
  } else if (model === 'wisp') {
    p.body.position.y = 1.1 + Math.sin(t * 2.3 + sd) * 0.18; p.body.rotation.y = Math.sin(t * 0.7) * 0.3; p.body.rotation.x = up * -0.3 + strike * 0.5;
    const sc = 1 + up * 0.25 + strike * 0.2; p.shells.forEach((s, i) => s.scale.setScalar(sc * (1 + Math.sin(t * (4 + i * 2.7) + sd) * 0.05)));
    p.mask.position.z = 0.42 + strike * 0.35 - up * 0.08; p.mask.rotation.z = Math.sin(t * 1.3) * 0.1; p.hood.scale.set(1 + up * 0.3, 1 + Math.sin(t * 3) * 0.06, 1);
    p.tend.forEach((ch, k) => ch.forEach((s, i) => { s.rotation.x = Math.sin(t * 3 - i * 0.8 + k) * 0.35 + move * 0.5 * (i ? 1 : 0); s.rotation.z = Math.sin(t * 2.3 - i * 0.6 + k * 1.7) * 0.3 + up * 0.4 * (k % 2 ? 1 : -1); }));
    p.orbit.forEach((s, i) => { const a = t * (2 + up * 4) + i * 0.785; const r = 0.75 + up * 0.25; s.position.set(Math.sin(a) * r, Math.sin(a * 1.7 + i) * 0.3, Math.cos(a) * r); });
    p.halo.rotation.z = t * 0.8; p.halo.scale.setScalar(1 + up * 0.3);
  }
}
/** Extra lizard motion layered on animateCharacter. */
export function animateLizardExtra(p, t, move, atk, wind) {
  if (p.tailSegs) p.tailSegs.forEach((s, i) => { s.rotation.z = Math.sin(t * (move ? 7 : 2.4) - i * 0.7) * (0.12 + i * 0.05) * (move ? 1.4 : 1); if (i) s.rotation.x = 0.12 + Math.sin(t * 2 - i) * 0.04; });
  if (p.jaw) p.jaw.rotation.x = (wind || 0) * 0.45 + (atk > 0 ? Math.sin(atk * Math.PI) * 0.3 : 0);
  if (p.frills) p.frills.forEach((f, i) => { f.rotation.y = (i ? -1 : 1) * ((wind || 0) * 0.6 + Math.sin(t * 3) * 0.05); });
}

// ------------------------------------------------------------------ hit VFX + elites
const FX_GEO = { chip: () => geo('fxchip', () => new THREE.TetrahedronGeometry(0.08, 0)), tuft: () => geo('fxtuft', () => new THREE.ConeGeometry(0.04, 0.14, 4)), spark: () => geo('fxspark', () => new THREE.OctahedronGeometry(0.05, 0)),
  splinter: () => geo('fxspl', () => new THREE.BoxGeometry(0.03, 0.2, 0.03)), drop: () => geo('fxdrop', () => new THREE.SphereGeometry(0.055, 6, 4)), flake: () => geo('fxflk', () => new THREE.CircleGeometry(0.07, 6)),
  rune: () => geo('fxrune', () => new THREE.TorusGeometry(0.07, 0.015, 3, 6)), puff: () => geo('fxpuff', () => new THREE.IcosahedronGeometry(0.09, 0)) };
// per creature: debris shape, how much glows, gravity, speed, ring style
const FX_KIND = {
  fur: { g: 'tuft', glow: 0, grav: 6, sp: 2.5 }, wool: { g: 'puff', glow: 0, grav: 2.5, sp: 2 }, stone: { g: 'chip', glow: 0.34, grav: 12, sp: 3.5 },
  scale: { g: 'flake', glow: 0.2, grav: 9, sp: 3 }, spirit: { g: 'spark', glow: 1, grav: -1.5, sp: 2 }, bark: { g: 'splinter', glow: 0.25, grav: 11, sp: 3.5 },
  magic: { g: 'rune', glow: 1, grav: 0, sp: 2.2 }, water: { g: 'drop', glow: 0.3, grav: 10, sp: 3 }, shadow: { g: 'puff', glow: 1, grav: -2, sp: 1.6 }, heaven: { g: 'spark', glow: 1, grav: -0.5, sp: 4 },
};
/** Burst of debris on hit, shaped per creature (fur tufts, stone chips + rune sparks, scale flakes, bark splinters, runes, droplets, shadow motes). Pooled per mob. */
export function hitBurst(m) {
  const o = m.obj; const par = o.parent; if (!par) return; const fx = (m.model.parts && m.model.parts.fx) || { kind: 'spark', color: '#ffffff' }; const K = FX_KIND[fx.kind] || FX_KIND.magic;
  let pool = m._fx; if (!pool) {
    pool = m._fx = { g: new THREE.Group(), items: [], t: 9, K }; pool.g.userData.dyn = true; const n = (GFX.high || GFX.real ? 14 : 7) + (m.tpl && m.tpl.boss ? 8 : 0);
    for (let i = 0; i < n; i++) { const spark = K.glow >= 1 || (i / n) < K.glow; const gk = spark && K.glow < 1 ? 'spark' : K.g;
      const col = spark ? (fx.spark || fx.color) : fx.color;
      const mm = mesh(FX_GEO[gk](), spark ? glow(col, 0.95) : toon(col)); if (gk === 'flake') mm.material.side = THREE.DoubleSide; mm.userData.v = new THREE.Vector3(); mm.userData.noAO = true; pool.g.add(mm); pool.items.push(mm); }
    const ring = mesh(tor(0.5, 0.03, 4, 24, Math.PI * 2), glow(fx.spark || fx.color || '#ffffff', 0.7)); ring.rotation.x = Math.PI / 2; pool.ring = ring; pool.g.add(ring);
  }
  if (pool.g.parent !== par) par.add(pool.g);
  const h = (m.radius || 0.7) * 1.4 * (o.scale.y || 1); pool.g.position.set(o.position.x, o.position.y + h, o.position.z); pool.g.visible = true; pool.t = 0;
  pool.items.forEach((it) => { const a = Math.random() * Math.PI * 2, e = Math.random() * 0.9 + 0.2; it.position.set(0, 0, 0); it.userData.v.set(Math.cos(a) * Math.cos(e), Math.sin(e) + 0.3, Math.sin(a) * Math.cos(e)).multiplyScalar(K.sp * (0.8 + Math.random())); it.rotation.set(a, e, 0); it.scale.setScalar(1); });
  pool.ring.scale.setScalar(0.3); pool.ring.rotation.z = Math.random() * 6;
}
export function stepBurst(m, dt) {
  const pool = m._fx; if (!pool || pool.t > 0.6) return; pool.t += dt; const k = pool.t / 0.6;
  const G = (pool.K || FX_KIND.magic).grav; pool.items.forEach((it) => { it.userData.v.y -= G * dt; it.userData.v.multiplyScalar(G <= 0 ? 0.96 : 1); it.position.addScaledVector(it.userData.v, dt); it.rotation.x += dt * 9; it.scale.setScalar(Math.max(0.01, 1 - k)); });
  pool.ring.scale.setScalar(0.3 + k * 2.2 * (m.radius || 0.7)); pool.ring.material.opacity = 0.7 * (1 - k);
  if (pool.t > 0.6) pool.g.visible = false;
}
/** Elite marker: crown of glowing shards over the head, ground sigil ring and brighter eyes. */
export function dressElite(m) {
  const g = m.group; const col = '#ffb020'; const ring = mesh(tor(1, 0.04, 4, 40, Math.PI * 2), glow(col, 0.6), 0, 0.06, 0); ring.rotation.x = Math.PI / 2;
  const box3 = new THREE.Box3().setFromObject(g); const top = box3.max.y; ring.scale.setScalar(Math.max(0.9, Math.max(box3.max.x - box3.min.x, box3.max.z - box3.min.z) * 0.6)); g.add(ring);
  const crown = new THREE.Group(); crown.position.y = top + 0.25; g.add(crown);
  for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; const s = mesh(new THREE.OctahedronGeometry(0.09, 0), glow(i % 2 ? '#fff0a0' : col, 0.95), Math.sin(a) * 0.3, 0, Math.cos(a) * 0.3); s.scale.y = 2; crown.add(s); }
  m.parts.elite = { ring, crown };
}
export function animateElite(p, t) { const e = p.elite; if (!e) return; e.crown.rotation.y = t * 1.6; e.crown.position.y += Math.sin(t * 2.5) * 0.002; e.ring.rotation.z = t * 0.5; e.ring.material.opacity = 0.4 + Math.sin(t * 3) * 0.2; }
