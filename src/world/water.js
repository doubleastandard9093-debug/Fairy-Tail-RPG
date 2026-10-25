// Unified water system: one shader family for the sea, lakes, rivers and every fountain pool.
// Tiers: Low = 4 analytic waves, depth colour, shore foam, no vertex motion (cheap, no aliasing);
// High = + Gerstner swell, detail noise normals, caustics, crest foam;
// Realistic = + planar reflections (Reflector) blended by fresnel.
import * as THREE from 'three';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import { GFX, toon, addOutlines, shadowAll } from './toon.js';

const COMMON = /* glsl */`
uniform float uT; uniform vec3 uSun; uniform vec3 uSunCol; uniform vec3 uDeep; uniform vec3 uShallow; uniform vec3 uSkyH; uniform vec3 uSkyZ;
float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(h2(i), h2(i+vec2(1,0)), f.x), mix(h2(i+vec2(0,1)), h2(i+vec2(1,1)), f.x), f.y); }
// analytic slope of a sum of directional sine waves: (dir.x, dir.y, wavelength, amplitude)
vec2 waveGrad(vec2 p, float t, float detail){
  vec2 g = vec2(0.0);
  const vec4 WV[8] = vec4[8](vec4(0.96,0.28,22.0,0.16), vec4(-0.37,0.93,13.0,0.09), vec4(0.71,-0.71,8.0,0.05), vec4(-0.98,-0.2,5.0,0.03),
                             vec4(0.2,0.98,3.1,0.016), vec4(0.86,0.5,2.2,0.011), vec4(-0.6,0.8,1.5,0.007), vec4(0.3,-0.95,1.05,0.005));
  for (int i = 0; i < NW; i++) { vec4 w = WV[i]; float k = 6.2832 / w.z; float om = sqrt(9.8 * k); float a = w.w * (i > 3 ? detail : 1.0);
    g += w.xy * (k * a * cos(dot(w.xy, p) * k - om * t)); }
  return g;
}
float caust(vec2 p, float t){ vec2 i = p; float c = 1.0; for (int n = 0; n < 4; n++) { float tt = t * (1.0 - 3.5 / float(n + 1));
    i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x)); c += 1.0 / length(vec2(p.x / (sin(i.x + tt) / 0.005), p.y / (cos(i.y + tt) / 0.005))); }
  c /= 4.0; c = 1.17 - pow(c, 1.4); return clamp(pow(abs(c), 8.0), 0.0, 1.5); }
vec3 skyCol(vec3 r){ return mix(uSkyH, uSkyZ, smoothstep(0.0, 0.6, r.y)); }
`;

const VERT = /* glsl */`
uniform float uT; uniform sampler2D uDepth; uniform vec4 uO; uniform float uSwell; uniform mat4 textureMatrix;
varying vec3 vW; varying vec4 vR; varying float vCrest;
#include <fog_pars_vertex>
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.0); vCrest = 0.0;
  #ifdef GERSTNER
  { vec2 uv = (wp.xz - uO.xy) / uO.zw; float d = texture2D(uDepth, uv).r * 255.0 / 64.0 - 1.0; float att = smoothstep(0.2, 3.5, d) * uSwell;
    const vec4 GW[4] = vec4[4](vec4(0.96,0.28,22.0,0.16), vec4(-0.37,0.93,13.0,0.09), vec4(0.71,-0.71,8.0,0.05), vec4(-0.98,-0.2,5.0,0.03));
    vec3 o = vec3(0.0);
    for (int i = 0; i < 4; i++) { vec4 w = GW[i]; float k = 6.2832 / w.z; float om = sqrt(9.8 * k); float ph = dot(w.xy, wp.xz) * k - om * uT; float a = w.w * att;
      o.xz -= w.xy * (0.55 * a * cos(ph)); o.y += a * sin(ph); }
    wp.xyz += o; vCrest = o.y; }
  #endif
  vW = wp.xyz; vR = textureMatrix * vec4(position, 1.0);
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const FRAG = /* glsl */`
${'%COMMON%'}
uniform sampler2D uDepth; uniform vec4 uO; uniform sampler2D tDiffuse; uniform vec3 color; uniform float uPoolD; uniform vec4 uPool; uniform vec4 uRip; uniform float uAlpha; uniform float uFresMax;
varying vec3 vW; varying vec4 vR; varying float vCrest;
#include <fog_pars_fragment>
void main(){
  float dist = length(cameraPosition - vW);
  float detail = exp(-dist / 70.0);            // fade fine ripples with distance: no shimmering/aliasing on phones
  #ifdef POOL
    float d = uPoolD; vec2 rel = vW.xz - uPool.xy; float r = length(rel);
  #else
    vec2 uv = (vW.xz - uO.xy) / uO.zw; float d = texture2D(uDepth, uv).r * 255.0 / 64.0 - 1.0;
  #endif
  vec2 g = waveGrad(vW.xz, uT, detail);
  #ifdef POOL
    g *= 0.18;                                   // still pool: only a breath of the open-water swell
    { float dr = r - uRip.z; float ring = cos(dr * 11.0 - uT * 8.0) * exp(-abs(dr) * 1.8) * 0.22 * uRip.w; g += (r > 0.001 ? rel / r : vec2(0.0)) * ring;
      float dr2 = r - uRip.z * 0.55; g += (r > 0.001 ? rel / r : vec2(0.0)) * cos(dr2 * 17.0 - uT * 11.0) * exp(-abs(dr2) * 3.0) * 0.06 * uRip.w; }
  #endif
  #ifdef DETAILN
  { vec2 q = vW.xz * 0.9 + vec2(uT * 0.25, uT * 0.17); float e = 0.15; float n0 = n2(q), nx = n2(q + vec2(e, 0.0)), nz = n2(q + vec2(0.0, e));
    vec2 q2 = vW.xz * 2.7 - vec2(uT * 0.4, -uT * 0.3); float m0 = n2(q2), mx = n2(q2 + vec2(e, 0.0)), mz = n2(q2 + vec2(0.0, e));
    g += (vec2(nx - n0, nz - n0) * 0.35 + vec2(mx - m0, mz - m0) * 0.2) / e * detail * 0.35; }
  #endif
  vec3 N = normalize(vec3(-g.x, 1.0, -g.y)); vec3 V = normalize(cameraPosition - vW); vec3 L = normalize(uSun);
  float fres = (0.02 + 0.98 * pow(1.0 - max(dot(N, V), 0.0), 5.0)) * uFresMax;
  vec3 R = reflect(-V, N); vec3 refl = skyCol(R);
  #ifdef REFLECT
  { vec4 ru = vR; ru.xy += N.xz * 2.4 * ru.w * 0.06; vec3 rc = texture2DProj(tDiffuse, ru).rgb; refl = mix(refl, rc, 0.85); }
  #endif
  // body colour by depth (Beer-Lambert-ish), with forward scattering toward the sun on wave faces
  float dc = max(d, 0.0); vec3 body = mix(uShallow, uDeep, 1.0 - exp(-dc * 0.32));
  body += vec3(0.05, 0.16, 0.13) * pow(max(dot(V, -L) * 0.5 + 0.5, 0.0), 3.0) * clamp(vCrest * 4.0 + 0.4, 0.0, 1.0);
  #ifdef CAUSTICS
    body += vec3(0.75, 0.9, 0.85) * caust(vW.xz * 0.55 + g * 0.6, uT * 0.55) * exp(-dc * 1.1) * 0.55 * max(L.y, 0.0);
  #endif
  vec3 col = mix(body, refl, fres);
  // sun glints: a tight mirror hotspot + a broad sheen
  vec3 H = normalize(L + V); float sp = pow(max(dot(N, H), 0.0), 700.0) * 7.0 + pow(max(dot(N, H), 0.0), 70.0) * 0.25;
  col += uSunCol * sp;
  // foam: breaking shore bands, wave crests, and (pools) impact rings + rim
  float fn = n2(vW.xz * 1.3 + uT * 0.3) * 0.6 + n2(vW.xz * 4.1 - uT * 0.6) * 0.4;
  float foam = 0.0;
  #ifdef POOL
    foam = smoothstep(0.62, 0.95, fn) * exp(-abs(r - uRip.z) * 2.6) * uRip.w * 0.9 + smoothstep(0.55, 1.0, fn) * smoothstep(uPool.z - 0.25, uPool.z, r) * 0.6;
  #else
    foam = smoothstep(0.55, 0.0, d) * (0.55 + fn * 0.5) + smoothstep(0.55, 0.95, sin(d * 9.0 - uT * 1.6 + fn * 3.0) * 0.5 + 0.5) * smoothstep(2.2, 0.4, d) * 0.45 * fn;
    foam += smoothstep(0.1, 0.2, vCrest) * smoothstep(0.55, 0.9, fn) * 0.6;
  #endif
  foam = clamp(foam, 0.0, 0.9);
  col = mix(col, vec3(0.93, 0.97, 1.0), foam);
  // transparency: see the bed in the shallows, opaque in the deep; soft zero-alpha at the waterline (smooth, no stair-stepping)
  float a = mix(0.45 + 0.55 * (1.0 - exp(-dc * 0.9)), 1.0, fres);
  #ifndef POOL
    a *= smoothstep(-0.02, 0.28, d);
  #endif
  a = clamp(max(a, foam) * uAlpha, 0.0, 1.0); if (a < 0.004) discard;
  gl_FragColor = vec4(col, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}`;

function defines(pool) {
  const d = { NW: GFX.high ? 8 : 4 };
  if (GFX.high) { d.DETAILN = 1; d.CAUSTICS = 1; }
  if (!pool && GFX.high) d.GERSTNER = 1;
  if (!pool && GFX.real) d.REFLECT = 1;
  if (pool) { d.POOL = 1; d.CAUSTICS = 1; }
  return d;
}
function baseUniforms(sunDir) {
  return { uT: { value: 0 }, uSun: { value: sunDir.clone() }, uSunCol: { value: new THREE.Color('#fff2d8') }, uDeep: { value: new THREE.Color(GFX.real ? '#0f2e3c' : GFX.high ? '#0b3a58' : '#0d3f6e') }, uShallow: { value: new THREE.Color(GFX.real ? '#2e6470' : GFX.high ? '#3fa6b8' : '#2b93b4') },
    uSkyH: { value: new THREE.Color('#b8d8f0') }, uSkyZ: { value: new THREE.Color(GFX.real ? '#6a8aa8' : '#4a86c8') }, uDepth: { value: null }, uO: { value: new THREE.Vector4(0, 0, 1, 1) }, uSwell: { value: 1 },
    tDiffuse: { value: null }, color: { value: new THREE.Color('#ffffff') }, textureMatrix: { value: new THREE.Matrix4() }, uPoolD: { value: 0.5 }, uPool: { value: new THREE.Vector4() }, uRip: { value: new THREE.Vector4() }, uAlpha: { value: 1 }, uFresMax: { value: GFX.real ? 1.0 : GFX.high ? 0.8 : 0.5 } };
}
function shader(pool, sunDir) {
  return { uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, baseUniforms(sunDir)]), vertexShader: VERT, fragmentShader: FRAG.replace('%COMMON%', COMMON), defines: defines(pool) };
}
function finish(mat, pool) {
  mat.transparent = true; mat.fog = true; mat.depthWrite = !pool; mat.defines = { ...(mat.defines || {}), ...defines(pool) }; mat.extensions = mat.extensions || {}; mat.needsUpdate = true; return mat;
}

/** Bake terrain depth below the waterline into a texture (metres, packed (d+1)*64). Shared by sea shading and foam. */
export function bakeDepth(height, WORLD, WATER_Y) {
  const RES = GFX.high ? 2.0 : 3.0; const ex = 200;
  const w = Math.min(1024, Math.ceil((WORLD.maxX - WORLD.minX + ex) / RES)), h = Math.min(1024, Math.ceil((WORLD.maxZ - WORLD.minZ + ex) / RES));
  const ox = WORLD.minX - ex / 2, oz = WORLD.minZ - ex / 2, sx = (WORLD.maxX - WORLD.minX + ex) / w, sz = (WORLD.maxZ - WORLD.minZ + ex) / h;
  const data = new Uint8Array(w * h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const d = WATER_Y - height(ox + (i + 0.5) * sx, oz + (j + 0.5) * sz); data[j * w + i] = Math.max(0, Math.min(255, (d + 1) * 64)); }
  const tex = new THREE.DataTexture(data, w, h, THREE.RedFormat); tex.magFilter = tex.minFilter = THREE.LinearFilter; tex.needsUpdate = true;
  return { tex, o: new THREE.Vector4(ox, oz, w * sx, h * sz) };
}

/** World sea/lakes/rivers: a single surface at WATER_Y following the player. */
export function createSea({ scene, W, height, WORLD, WATER_Y }) {
  const dep = bakeDepth(height, WORLD, WATER_Y); const sunDir = W.sunDir || new THREE.Vector3(0.4, 0.8, 0.3).normalize();
  const segs = GFX.real ? 320 : GFX.high ? 240 : 1;
  const geo = new THREE.PlaneGeometry(1400, 1400, segs, segs);
  let water;
  const noRefl = (new URLSearchParams(location.search).get('rx') || '').includes('w');
  if (GFX.real && !noRefl) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    water = new Reflector(geo, { textureWidth: Math.min(1024, Math.round(window.innerWidth * dpr * 0.5)), textureHeight: Math.min(1024, Math.round(window.innerHeight * dpr * 0.5)), clipBias: 0.02, multisample: 0, shader: shader(false, sunDir) });
    finish(water.material, false);
  } else {
    const sh = shader(false, sunDir); const mat = new THREE.ShaderMaterial(sh); finish(mat, false);
    if (mat.defines.REFLECT) delete mat.defines.REFLECT;
    water = new THREE.Mesh(geo, mat);
  }
  const u = water.material.uniforms; u.uDepth.value = dep.tex; u.uO.value.copy(dep.o);
  water.rotation.x = -Math.PI / 2; water.position.y = WATER_Y; water.userData.noOutline = true; water.renderOrder = 1; water.frustumCulled = false;
  scene.add(water);
  W.anim.push((t) => { u.uT.value = t; });
  W.waterDepth = dep; return water;
}

// ---------------------------------------------------------------- fountains
function lathe(pts, mat, seg = 40) { const m = new THREE.Mesh(new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg), mat); m.castShadow = m.receiveShadow = true; return m; }

function poolSurface(parent, { r, y, depth, rip, ripR, sunDir, anim, world }) {
  const sh = shader(true, sunDir); const mat = finish(new THREE.ShaderMaterial(sh), true);
  const m = new THREE.Mesh(new THREE.CircleGeometry(r, 48), mat); m.rotation.x = -Math.PI / 2; m.position.y = y; m.userData.noOutline = true; m.userData.dyn = true; m.renderOrder = 2; parent.add(m);
  const u = mat.uniforms; u.uPoolD.value = depth; u.uShallow.value.set(GFX.real ? '#2e6470' : '#2a88a8'); u.uDeep.value.set(GFX.real ? '#0f2e3c' : '#124a66');
  anim.push((t) => { u.uT.value = t; if (!u._set) { const p = new THREE.Vector3(), sc = new THREE.Vector3(); m.getWorldPosition(p); m.getWorldScale(sc); u.uPool.value.set(p.x, p.z, r * sc.x, 0); u.uRip.value.set(0, 0, ripR * sc.x, rip); u._set = true; } });
  void world; return m;
}

// falling water: a lathed curtain following a ballistic arc, with scrolling streaks
const SHEET_FRAG = /* glsl */`uniform float uT; uniform float uAlpha; varying vec2 vUv; varying vec3 vN; varying vec3 vW;
float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(h2(i), h2(i+vec2(1,0)), f.x), mix(h2(i+vec2(0,1)), h2(i+vec2(1,1)), f.x), f.y); }
void main(){ float s = n2(vec2(vUv.x * 90.0, vUv.y * 5.0 - uT * 5.0)) * 0.65 + n2(vec2(vUv.x * 230.0, vUv.y * 11.0 - uT * 8.0)) * 0.35;
  vec3 V = normalize(cameraPosition - vW); float fr = pow(1.0 - abs(dot(normalize(vN), V)), 2.0);
  float breakup = smoothstep(0.55, 1.0, vUv.y) * smoothstep(0.35, 0.75, n2(vec2(vUv.x * 40.0, vUv.y * 3.0 - uT * 4.0)));
  float a = (0.22 + 0.55 * smoothstep(0.35, 0.85, s) + fr * 0.3) * smoothstep(0.0, 0.08, vUv.y) * (1.0 - breakup) * uAlpha;
  vec3 c = mix(vec3(0.42, 0.66, 0.78), vec3(0.86, 0.91, 0.95), smoothstep(0.4, 0.9, s) * 0.8 + fr * 0.3);
  gl_FragColor = vec4(c, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
const SHEET_VERT = /* glsl */`varying vec2 vUv; varying vec3 vN; varying vec3 vW; void main(){ vUv = uv; vN = normalMatrix * normal; vN = mat3(modelMatrix) * normal; vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
function sheet(parent, { r0, y0, vr, y1, anim, alpha = 1 }) {
  // r(t) = r0 + vr t; y(t) = y0 - 4.9 t^2, until y1
  const T = Math.sqrt(Math.max(0.01, (y0 - y1) / 4.9)); const pts = []; const n = 14;
  for (let i = 0; i <= n; i++) { const t = T * i / n; pts.push(new THREE.Vector2(r0 + vr * t, y0 - 4.9 * t * t)); }
  const geo = new THREE.LatheGeometry(pts, 64); // LatheGeometry uv: x around, y along the profile
  const mat = new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uAlpha: { value: alpha } }, vertexShader: SHEET_VERT, fragmentShader: SHEET_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide });
  const m = new THREE.Mesh(geo, mat); m.userData.noOutline = true; m.userData.dyn = true; m.renderOrder = 3; parent.add(m);
  anim.push((t) => { mat.uniforms.uT.value = t; }); return { m, rImpact: r0 + vr * T };
}

// droplets / spray: GPU-animated ballistic points (no CPU work per frame)
const DROP_VERT = /* glsl */`attribute vec4 aS; uniform float uT; uniform vec4 uA; uniform vec4 uB; uniform float uH; varying float vA;
void main(){ // uA: r0, y0, vr, vy   uB: life, floorY, size, spread
  float life = fract(uT / uB.x + aS.y); float t = life * uB.x; float ang = aS.x;
  float vr = uA.z * (0.75 + aS.z * 0.5) + (aS.w - 0.5) * uB.w; float vy = uA.w * (0.7 + aS.w * 0.6);
  float r = uA.x + vr * t; float y = uA.y + vy * t - 4.9 * t * t;
  vec3 p = vec3(cos(ang) * r, y, sin(ang) * r); vA = (y < uB.y ? 0.0 : 1.0) * smoothstep(0.0, 0.08, life) * (1.0 - life * 0.6);
  vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv;
  gl_PointSize = max(1.5, uB.z * projectionMatrix[1][1] * uH * 0.5 / -mv.z) * step(0.001, vA);
}`;
const DROP_FRAG = /* glsl */`varying float vA; void main(){ vec2 c = gl_PointCoord - 0.5; float d = dot(c, c); if (d > 0.25) discard; float a = smoothstep(0.25, 0.05, d) * vA * 0.85; gl_FragColor = vec4(0.84, 0.9, 0.95, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
function drops(parent, { n, r0, y0, vr, vy, life, floorY, size, spread = 0.2, anim }) {
  n = Math.round(n * (GFX.high ? 1 : 0.45)); const g = new THREE.BufferGeometry(); const a = new Float32Array(n * 4); let sd = 11 + n;
  const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < n; i++) { a[i * 4] = rnd() * 6.2832; a[i * 4 + 1] = rnd(); a[i * 4 + 2] = rnd(); a[i * 4 + 3] = rnd(); }
  g.setAttribute('aS', new THREE.BufferAttribute(a, 4)); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3)); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, y0, 0), 6);
  const mat = new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uA: { value: new THREE.Vector4(r0, y0, vr, vy) }, uB: { value: new THREE.Vector4(life, floorY, size, spread) }, uH: { value: 800 } },
    vertexShader: DROP_VERT, fragmentShader: DROP_FRAG, transparent: true, depthWrite: false });
  const p = new THREE.Points(g, mat); p.userData.dyn = true; p.userData.noAO = true; p.renderOrder = 4; parent.add(p);
  const v2 = new THREE.Vector2(); p.onBeforeRender = (r) => { r.getDrawingBufferSize(v2); mat.uniforms.uH.value = v2.y; };
  anim.push((t) => { mat.uniforms.uT.value = t; }); return p;
}
let mistTex = null;
function mist(parent, { r, y, n, anim }) {
  if (!GFX.high) return;
  if (!mistTex) { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const gr = x.createRadialGradient(32, 32, 1, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,0.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); mistTex = new THREE.CanvasTexture(c); }
  const sm = new THREE.SpriteMaterial({ map: mistTex, color: '#eef6ff', transparent: true, opacity: 0.08, depthWrite: false });
  for (let i = 0; i < n; i++) { const a = i / n * 6.2832; const s = new THREE.Sprite(sm); s.position.set(Math.cos(a) * r, y + 0.25, Math.sin(a) * r); s.scale.set(1.3, 0.8, 1); s.userData.dyn = true; s.userData.noAO = true; parent.add(s);
    const ph = i * 1.7; anim.push((t) => { s.position.y = y + 0.25 + Math.sin(t * 0.9 + ph) * 0.08; s.material.opacity = 0.06 + Math.sin(t * 0.6 + ph) * 0.02; }); }
}

/**
 * Tiered stone fountain: moulded basin, pedestal, two bowls, finial jet; each bowl spills a curtain into the one below,
 * with droplets, splash rings, foam and mist. `scale` resizes the whole piece. Returns the group (outer radius 3.8*scale).
 */
export function buildFountain(parent, { x, y = 0, z, scale = 1, W, stone = '#c4bcae', trim = '#ddd5c6', accent = '#e2b850', sunDir }) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(scale); parent.add(g); const anim = W.anim; sunDir = sunDir || W.sunDir || new THREE.Vector3(0.4, 0.8, 0.3).normalize();
  const S = toon(stone), Tm = toon(trim), A = toon(accent), Fl = toon('#8a8274');
  const stat = new THREE.Group(); g.add(stat);
  // basin: plinth step, moulded outer wall, wide lip, inner wall and floor
  stat.add(lathe([[0, 0.02], [4.15, 0.02], [4.15, 0.14], [3.95, 0.16]], Tm, 56));
  stat.add(lathe([[3.95, 0.16], [3.78, 0.22], [3.7, 0.36], [3.72, 0.62], [3.82, 0.72], [3.86, 0.86], [3.84, 0.92], [3.24, 0.94], [3.2, 0.86], [3.18, 0.2]], S, 56));
  stat.add(lathe([[3.2, 0.18], [0, 0.18]], Fl, 48));
  // pedestal with mouldings
  stat.add(lathe([[0, 0.18], [0.95, 0.18], [0.95, 0.32], [0.78, 0.4], [0.6, 0.5], [0.52, 0.9], [0.5, 1.5], [0.58, 1.7], [0.75, 1.82], [0.0, 1.84]], S, 32));
  // middle bowl (outer underside curve, lip, inner)
  stat.add(lathe([[0.2, 1.8], [0.9, 1.84], [1.4, 1.98], [1.66, 2.16], [1.72, 2.3], [1.62, 2.34], [1.5, 2.24], [1.0, 2.1], [0, 2.08]], Tm, 48));
  // upper column + bowl
  stat.add(lathe([[0, 2.08], [0.36, 2.1], [0.3, 2.3], [0.24, 2.7], [0.3, 2.95], [0.0, 2.98]], S, 24));
  stat.add(lathe([[0.1, 2.95], [0.5, 2.98], [0.8, 3.12], [0.9, 3.24], [0.84, 3.28], [0.72, 3.2], [0, 3.16]], Tm, 40));
  // finial: fluted stem and a gilded orb from which the jet rises
  stat.add(lathe([[0, 3.16], [0.16, 3.18], [0.1, 3.5], [0.14, 3.6], [0, 3.62]], S, 16));
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.17, 20, 14), A); orb.position.y = 3.74; orb.castShadow = true; stat.add(orb);
  for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + Math.PI / 4; const sp = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), A); sp.position.set(Math.cos(a) * 3.5, 0.98, Math.sin(a) * 3.5); stat.add(sp); }
  addOutlines(stat); shadowAll(stat, true, true);
  // water surfaces (each safely below its rim: no z-fighting)
  const fx = new THREE.Group(); fx.userData.dyn = true; g.add(fx);
  poolSurface(fx, { r: 3.19, y: 0.78, depth: 0.6, rip: 1, ripR: 2.02 * 1, sunDir, anim });
  poolSurface(fx, { r: 1.52, y: 2.22, depth: 0.12, rip: 0.8, ripR: 0.98, sunDir, anim });
  poolSurface(fx, { r: 0.74, y: 3.21, depth: 0.05, rip: 0.7, ripR: 0.0, sunDir, anim });
  // curtains spilling over the lips
  const c1 = sheet(fx, { r0: 1.72, y0: 2.3, vr: 0.55, y1: 0.78, anim });
  sheet(fx, { r0: 0.9, y0: 3.26, vr: 0.32, y1: 2.22, anim, alpha: 0.85 });
  // central jet: a narrow rising column, then droplets falling back into the top bowl
  { const pts = []; for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push(new THREE.Vector2(0.035 + 0.03 * Math.sin(t * Math.PI), 3.86 + t * 0.75)); }
    const mat = new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uAlpha: { value: 0.9 } }, vertexShader: SHEET_VERT, fragmentShader: SHEET_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    const jet = new THREE.Mesh(new THREE.LatheGeometry(pts, 12), mat); jet.userData.noOutline = true; jet.renderOrder = 3; fx.add(jet); anim.push((t) => { mat.uniforms.uT.value = -t * 1.4; jet.scale.y = 1 + Math.sin(t * 3.1) * 0.04; }); }
  drops(fx, { n: 160, r0: 0.03, y0: 4.55, vr: 0.55, vy: 0.9, life: 0.85, floorY: 3.2, size: 0.05, spread: 0.3, anim });
  drops(fx, { n: 260, r0: 1.72, y0: 2.28, vr: 0.6, vy: 0.15, life: 0.6, floorY: 0.78, size: 0.045, spread: 0.25, anim });
  drops(fx, { n: 220, r0: c1.rImpact, y0: 0.8, vr: 0.0, vy: 1.6, life: 0.42, floorY: 0.77, size: 0.04, spread: 1.4, anim });
  drops(fx, { n: 80, r0: 0.95, y0: 2.24, vr: 0.0, vy: 1.0, life: 0.35, floorY: 2.21, size: 0.035, spread: 1.0, anim });
  mist(fx, { r: c1.rImpact, y: 0.8, n: 10, anim });
  return g;
}

// ---------------------------------------------------------------- rivers
const RIVER_VERT = /* glsl */`attribute vec4 aFlow; attribute vec3 aR; varying vec3 vW; varying vec4 vF; varying vec3 vRv;
#include <fog_pars_vertex>
void main(){ vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; vF = aFlow; vRv = aR; vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`;
const RIVER_FRAG = /* glsl */`
${'%COMMON%'}
uniform float uFresMax;
varying vec3 vW; varying vec4 vF; varying vec3 vRv; // vF: flow dir xz * speed, across u (-1..1), along s ; vRv: rock foam, mouth fade, depth
#include <fog_pars_fragment>
vec2 ngrad(vec2 p){ float e = 0.12; float a = n2(p), b = n2(p + vec2(e, 0.0)), c = n2(p + vec2(0.0, e)); return vec2(b - a, c - a) / e; }
void main(){
  vec2 fl = vF.xy; float sp = length(fl); vec2 fd = sp > 0.001 ? fl / sp : vec2(0.0, 1.0); float u = vF.z;
  float dist = length(cameraPosition - vW); float detail = exp(-dist / 60.0);
  // flow-map advection: two phases of noise dragged along the current, cross-faded so it never stretches
  float ph0 = fract(uT * 0.35), ph1 = fract(uT * 0.35 + 0.5); float wb = abs(1.0 - 2.0 * ph0);
  vec2 p = vW.xz * 0.8;
  vec2 g0 = ngrad(p - fl * ph0 * 1.6) * 0.6 + ngrad(p * 2.3 - fl * ph0 * 3.0 + 7.1) * 0.4;
  vec2 g1 = ngrad(p - fl * ph1 * 1.6 + 3.7) * 0.6 + ngrad(p * 2.3 - fl * ph1 * 3.0 + 1.3) * 0.4;
  vec2 g = mix(g0, g1, 1.0 - wb) * (0.12 + sp * 0.06) * (0.35 + 0.65 * detail);
  vec3 N = normalize(vec3(-g.x, 1.0, -g.y)); vec3 V = normalize(cameraPosition - vW); vec3 L = normalize(uSun);
  float fres = (0.02 + 0.98 * pow(1.0 - max(dot(N, V), 0.0), 5.0)) * uFresMax;
  float d = vRv.z * (1.0 - u * u);
  vec3 body = mix(uShallow, uDeep, 1.0 - exp(-d * 0.9));
  #ifdef CAUSTICS
    body += vec3(0.7, 0.85, 0.8) * caust(vW.xz * 0.7 - fl * uT * 0.2, uT * 0.6) * exp(-d * 1.5) * 0.4;
  #endif
  vec3 col = mix(body, skyCol(reflect(-V, N)), fres);
  vec3 H = normalize(L + V); col += uSunCol * (pow(max(dot(N, H), 0.0), 600.0) * 5.0 + pow(max(dot(N, H), 0.0), 60.0) * 0.2);
  // foam: banks, rapids (streaks stretched along the current), rocks
  vec2 q = vec2(dot(vW.xz, vec2(-fd.y, fd.x)) * 3.0, dot(vW.xz, fd) * 0.5 - uT * sp * 0.8);
  float st = n2(q) * 0.6 + n2(q * vec2(2.7, 2.0) + 4.0) * 0.4;
  float bank = smoothstep(0.72, 1.0, abs(u)) * smoothstep(0.35, 0.8, n2(vW.xz * 1.6 - fl * uT * 0.3));
  float rap = smoothstep(2.3, 3.9, sp) * smoothstep(0.64, 0.9, st) * 0.75;
  float rock = vRv.x * smoothstep(0.3, 0.7, n2(vW.xz * 3.0 - fl * uT * 0.6));
  float foam = clamp(bank * 0.7 + rap + rock, 0.0, 0.85);
  col = mix(col, vec3(0.93, 0.97, 1.0), foam);
  float a = mix(0.5 + 0.5 * (1.0 - exp(-d * 1.4)), 1.0, fres); a = max(a, foam);
  a *= smoothstep(1.06, 0.9, abs(u)) * vRv.y;
  if (a < 0.004) discard;
  gl_FragColor = vec4(col, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}`;
/** Ribbon mesh for one traced river (from rivers.js). Returns { mesh, rocks:[[x,y,z,s]] }. */
export function riverMesh(R, { W, sunDir }) {
  const P = R.pts; const A = 9; const pos = [], flow = [], rr = [], idx = [];
  let sd = 97; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  const rocks = [];
  for (let k = 2; k < P.length - 6; k += 3) { const p = P[k]; if (p.speed > 2.0 && rnd() < 0.55) { const o = (rnd() - 0.5) * p.w * 1.1; const nx = P[k + 1].z - p.z, nz = -(P[k + 1].x - p.x), l = Math.hypot(nx, nz) || 1; rocks.push([p.x + nx / l * o, p.y, p.z + nz / l * o, 0.35 + rnd() * 0.5]); } }
  for (let k = 0; k < P.length; k++) {
    const p = P[k], q = P[Math.min(P.length - 1, k + 1)], o = P[Math.max(0, k - 1)];
    let tx = q.x - o.x, tz = q.z - o.z; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl; const nx = -tz, nz = tx;
    const mouth = R.reached ? Math.min(1, (P.length - 1 - k) / 8) : Math.min(1, (P.length - 1 - k) / 4); const src = Math.min(1, k / 3);
    for (let a = 0; a < A; a++) { const u = (a / (A - 1)) * 2 - 1; const x = p.x + nx * u * p.w * 1.08, z = p.z + nz * u * p.w * 1.08;
      pos.push(x, p.y + 0.04, z); flow.push(tx * p.speed, tz * p.speed, u, p.s);
      let rf = 0; for (const r of rocks) { const dd = Math.hypot(r[0] - x, r[2] - z); if (dd < r[3] * 3.2) rf = Math.max(rf, 1 - dd / (r[3] * 3.2)); }
      rr.push(rf, mouth * src, p.depth); }
  }
  for (let k = 0; k < P.length - 1; k++) for (let a = 0; a < A - 1; a++) { const i0 = k * A + a, i1 = i0 + 1, i2 = i0 + A, i3 = i2 + 1; idx.push(i0, i2, i1, i1, i2, i3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aFlow', new THREE.Float32BufferAttribute(flow, 4)); g.setAttribute('aR', new THREE.Float32BufferAttribute(rr, 3)); g.setIndex(idx); g.computeBoundingSphere();
  const u = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, baseUniforms(sunDir || W.sunDir || new THREE.Vector3(30, 60, 20).normalize()), { uFresMax: { value: fresMax() } }]);
  u.uShallow.value.set(GFX.real ? '#2e6470' : '#3a9aa8'); u.uDeep.value.set(GFX.real ? '#0f2e3c' : '#1d5a6a');
  const mat = new THREE.ShaderMaterial({ uniforms: u, vertexShader: RIVER_VERT, fragmentShader: RIVER_FRAG.replace('%COMMON%', COMMON), defines: { NW: 4, ...(GFX.high ? { CAUSTICS: 1 } : {}) }, transparent: true, depthWrite: false, fog: true, side: THREE.DoubleSide });
  const m = new THREE.Mesh(g, mat); m.userData.noOutline = true; m.renderOrder = 2;
  W.anim.push((t) => { u.uT.value = t; });
  return { mesh: m, rocks };
}
export function fresMax() { return GFX.real ? 1.0 : GFX.high ? 0.8 : 0.5; }

// ---------------------------------------------------------------- boat wakes
const WAKE_FRAG = /* glsl */`uniform float uT; uniform float uK; varying vec2 vUv; varying vec3 vW;
float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(h2(i), h2(i+vec2(1,0)), f.x), mix(h2(i+vec2(0,1)), h2(i+vec2(1,1)), f.x), f.y); }
void main(){ // local: x across (-1..1 → ±W), y back from the bow (0..1 → L)
  float x = (vUv.x - 0.5) * 2.0 * 7.0; float z = vUv.y * 26.0 - 3.0; // metres; bow at z=0, stern ~3.4
  float n = n2(vW.xz * 1.7 + uT * 0.4) * 0.6 + n2(vW.xz * 4.3 - uT * 0.7) * 0.4;
  float arm = abs(abs(x) - max(z, 0.0) * 0.36 - 0.6); // Kelvin wake: ~19.5 degree arms
  float v = smoothstep(0.9, 0.0, arm) * smoothstep(-0.5, 1.5, z) * exp(-max(z, 0.0) / 13.0);
  float chop = smoothstep(0.5, 0.0, abs(sin(arm * 3.0 - z * 0.3 + uT * 2.0))) * smoothstep(2.5, 0.0, arm) * exp(-max(z, 0.0) / 9.0) * 0.5;
  float trail = smoothstep(1.4 + z * 0.06, 0.0, abs(x)) * smoothstep(2.0, 4.0, z) * exp(-(z - 3.0) / 10.0);
  float bow = smoothstep(1.8, 0.0, length(vec2(x * 0.8, z + 0.2))) * 0.9 + smoothstep(1.2, 0.0, abs(abs(x) - 0.9 - max(z, 0.0) * 0.1)) * smoothstep(3.5, 0.0, z) * smoothstep(-0.4, 0.4, z) * 0.7;
  float a = clamp((v * 0.8 + chop + trail * 0.7) * smoothstep(0.3, 0.75, n) + bow * smoothstep(0.2, 0.6, n), 0.0, 0.9) * uK;
  a *= smoothstep(1.0, 0.55, abs(vUv.x - 0.5) * 2.0) * smoothstep(0.0, 0.04, vUv.y) * smoothstep(1.0, 0.8, vUv.y);
  if (a < 0.004) discard;
  gl_FragColor = vec4(0.94, 0.97, 1.0, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
/** V-wake + bow foam that rides with a boat group (boat forward = +z). Set wake.uniforms.uK (0..1) by speed. */
export function addWake(boat, W, scale = 1) {
  const geo = new THREE.PlaneGeometry(14 / scale, 26 / scale); geo.rotateX(-Math.PI / 2); geo.translate(0, 0, (-26 / 2 + 3) / scale);
  const mat = new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uK: { value: 0 } }, vertexShader: SHEET_VERT, fragmentShader: WAKE_FRAG, transparent: true, depthWrite: false });
  const m = new THREE.Mesh(geo, mat); m.position.y = 0.16 / scale; m.userData.noOutline = true; m.userData.noAO = true; m.renderOrder = 3; m.visible = false; m.frustumCulled = false; boat.add(m);
  W.anim.push((t) => { mat.uniforms.uT.value = t; m.visible = mat.uniforms.uK.value > 0.01; });
  boat.userData.wake = mat.uniforms; return m;
}
