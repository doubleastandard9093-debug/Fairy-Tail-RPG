import * as THREE from 'three';

// Global graphics flags, set once at boot from settings (quality change reloads the page).
export const GFX = { high: false, outlines: false, shadows: false, real: false };
/** Shared wind clock for foliage sway (advanced by the world each frame). */
export const WIND = { value: 0 };

// ---- Realistic mode: PBR materials with world-space procedural detail (no UVs needed) ----
export const NOISE_GLSL = `
float rh(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float vnoise(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(rh(i), rh(i + vec3(1,0,0)), f.x), mix(rh(i + vec3(0,1,0)), rh(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(rh(i + vec3(0,0,1)), rh(i + vec3(1,0,1)), f.x), mix(rh(i + vec3(0,1,1)), rh(i + vec3(1,1,1)), f.x), f.y), f.z); }
float fbm3(vec3 p){ return vnoise(p) * 0.5 + vnoise(p * 2.03) * 0.3 + vnoise(p * 4.11) * 0.2; }`;
/** Adds world-space fbm detail to albedo + roughness, a soft sky rim, and optional wind sway. */
// Procedural surface patterns (Realistic tier): world-space masonry, planks, roof shingles and cobbles.
const PAT = {
  brick: `{ vec2 b = vec2((vWP.x + vWP.z) * 1.7, vWP.y * 3.4); b.x += step(1.0, mod(b.y, 2.0)) * 0.5; vec2 f = fract(b);
    float m = smoothstep(0.02, 0.07, f.x) * smoothstep(0.03, 0.1, f.y) * smoothstep(0.0, 0.05, 1.0 - f.x);
    float tone = 0.86 + 0.24 * rh(vec3(floor(b), 3.0)); diffuseColor.rgb *= mix(0.58, tone, m); patR = (1.0 - m) * 0.2; }`,
  plank: `{ vec3 an = abs(nW); vec2 b = an.y > 0.6 ? vec2(vWP.x * 0.45, vWP.z * 3.2) : vec2((vWP.x + vWP.z) * 3.2, vWP.y * 0.45).yx; b.x += rh(vec3(floor(b.y), 1.0, 2.0)) * 3.0; vec2 f = fract(b);
    float seam = smoothstep(0.0, 0.06, f.y) * smoothstep(0.0, 0.06, 1.0 - f.y) * smoothstep(0.0, 0.012, f.x) * smoothstep(0.0, 0.012, 1.0 - f.x);
    float grain = vnoise(vec3(b.x * 9.0, b.y * 1.5, 0.0)) * 0.5 + vnoise(vec3(b.x * 30.0, b.y * 4.0, 1.0)) * 0.5;
    diffuseColor.rgb *= mix(0.55, 0.82 + 0.3 * grain, seam) * (0.88 + 0.22 * rh(vec3(floor(b), 5.0))); patR = (1.0 - seam) * 0.15; }`,
  tile: `{ vec2 b = vec2((vWP.x + vWP.z) * 2.6, vWP.y * 5.0); b.x += step(1.0, mod(b.y, 2.0)) * 0.5; vec2 f = fract(b);
    float edge = smoothstep(0.0, 0.08, f.x) * smoothstep(0.0, 0.08, 1.0 - f.x);
    diffuseColor.rgb *= (0.62 + 0.42 * f.y) * mix(0.7, 1.0, edge) * (0.85 + 0.3 * rh(vec3(floor(b), 7.0))); patR = -0.1; }`,
  cobble: `{ vec2 b = vWP.xz * 1.4; b.x += step(1.0, mod(b.y, 2.0)) * 0.5; vec2 f = fract(b) - 0.5; float r = max(abs(f.x), abs(f.y));
    float m = 1.0 - smoothstep(0.36, 0.48, r); diffuseColor.rgb *= mix(0.5, 0.8 + 0.35 * rh(vec3(floor(b), 9.0)), m); patR = (1.0 - m) * 0.25; }`,
};
export function addDetail(mat, { scale = 1.6, amt = 0.22, rim = 0.18, wind = 0, pat = null } = {}) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uWind = WIND;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>\nvarying vec3 vWP; uniform float uWind;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        ${wind ? `{ vec3 ip = vec3(0.0);
          #ifdef USE_INSTANCING
            ip = instanceMatrix[3].xyz;
          #endif
          float hgt = max(0.0, position.y); float ph = ip.x * 0.21 + ip.z * 0.17;
          float sw = (sin(uWind * 1.7 + ph) * 0.6 + sin(uWind * 3.1 + ph * 1.9) * 0.25) * ${wind.toFixed(3)} * hgt * hgt;
          transformed.x += sw; transformed.z += sw * 0.6; }` : ''}`)
      .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
        { vec4 wpp = vec4(transformed, 1.0);
          #ifdef USE_INSTANCING
            wpp = instanceMatrix * wpp;
          #endif
          vWP = (modelMatrix * wpp).xyz; }`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>\nvarying vec3 vWP;${NOISE_GLSL}`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        float dn = fbm3(vWP * ${scale.toFixed(3)}); float dn2 = vnoise(vWP * ${(scale * 7.0).toFixed(3)});
        diffuseColor.rgb *= 1.0 - ${amt.toFixed(3)} * 0.5 + ${amt.toFixed(3)} * (dn * 0.75 + dn2 * 0.25);
        float patR = 0.0; vec3 nW = vec3(0.0, 1.0, 0.0);
        #ifndef FLAT_SHADED
        nW = normalize(inverseTransformDirection(normalize(vNormal), viewMatrix));
        #endif
        ${pat && PAT[pat] ? PAT[pat] : ''}`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = clamp(roughnessFactor + (dn - 0.5) * 0.25 + patR, 0.04, 1.0);`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        { vec3 vd = normalize(cameraPosition - vWP); vec3 nw = normalize(inverseTransformDirection(normal, viewMatrix));
          float fr = pow(1.0 - clamp(dot(nw, vd), 0.0, 1.0), 3.0); totalEmissiveRadiance += vec3(0.75, 0.85, 1.0) * fr * ${rim.toFixed(3)} * diffuseColor.rgb; }`);
  };
  mat.customProgramCacheKey = () => `det${scale}|${amt}|${rim}|${wind}|${pat}`;
  return mat;
}

let grad3, grad4;
function gradient(steps) {
  const data = new Uint8Array(steps * 4);
  for (let i = 0; i < steps; i++) {
    const v = Math.round(Math.pow((i + 0.6) / steps, 0.8) * 255);
    data.set([v, v, v, 255], i * 4);
  }
  const t = new THREE.DataTexture(data, steps, 1, THREE.RGBAFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true;
  return t;
}
const cache = new Map();
/** Cel-shaded material, cached per colour/options. */
export function toon(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (cache.has(key)) return cache.get(key);
  grad3 ||= gradient(3); grad4 ||= gradient(4);
  const m = GFX.real ? realMat(color, opts) : new THREE.MeshToonMaterial({ color, gradientMap: opts.soft ? grad4 : grad3, ...stripOpts(opts) });
  cache.set(key, m);
  return m;
}
function stripOpts(o) { const r = { ...o }; delete r.soft; delete r.pat; delete r.rough; delete r.metal; return r; }
/** PBR stand-in for toon(): roughness guessed from colour (dark metals/stone glossier), detail noise on top. */
function realMat(color, opts) {
  const c = new THREE.Color(color); const hsl = {}; c.getHSL(hsl);
  const metal = opts.metal ?? (hsl.s < 0.12 && hsl.l > 0.45 && hsl.l < 0.75 ? 0.35 : 0);
  const m = new THREE.MeshStandardMaterial({ color, roughness: opts.rough ?? (metal ? 0.45 : 0.82), metalness: metal, envMapIntensity: 0.9, ...stripOpts(opts) });
  return addDetail(m, { scale: 2.2, amt: 0.16, rim: 0.22, pat: opts.pat || null });
}
export function glow(color, opacity = 1) {
  const key = 'glow' + color + opacity;
  if (cache.has(key)) return cache.get(key);
  const m = new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, depthWrite: opacity >= 1, fog: true });
  cache.set(key, m);
  return m;
}

// Inverted-hull outline: a back-face copy pushed out along normals. High quality only.
let outlineMat;
function getOutlineMat() {
  if (outlineMat) return outlineMat;
  outlineMat = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uColor: { value: new THREE.Color('#1a1020') }, uThick: { value: 0.0032 } }]),
    vertexShader: `
      uniform float uThick;
      #include <common>
      #include <fog_pars_vertex>
      void main(){
        // constant on-screen width: push along the view-space normal, scaled by depth
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vec3 n = normalize(normalMatrix * normal);
        mvPosition.xyz += n * uThick * clamp(-mvPosition.z, 1.0, 60.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: `
      uniform vec3 uColor;
      #include <common>
      #include <fog_pars_fragment>
      void main(){
        gl_FragColor = vec4(uColor, 1.0);
        #include <fog_fragment>
      }`,
    side: THREE.BackSide, fog: true,
  });
  return outlineMat;
}
/** Adds outline hulls to every mesh under obj (skips glow/transparent and flagged meshes). */
export function addOutlines(obj, thick = 1) {
  if (!GFX.outlines) return obj;
  const meshes = [];
  obj.traverse((o) => { if (o.isMesh && !o.userData.noOutline && !o.material.transparent && !(o.material.isMeshBasicMaterial)) meshes.push(o); });
  for (const m of meshes) {
    const mat = thick === 1 ? getOutlineMat() : getOutlineMat().clone();
    if (thick !== 1) mat.uniforms.uThick.value = 0.0032 * thick;
    const o = new THREE.Mesh(m.geometry, mat);
    o.userData.noOutline = true; o.userData.isOutline = true; o.raycast = () => {};
    o.castShadow = false; o.receiveShadow = false;
    m.add(o);
  }
  return obj;
}
export function shadowAll(obj, cast = true, receive = false) {
  if (!GFX.shadows) return obj;
  obj.traverse((o) => { if (o.isMesh && !o.userData.isOutline && !(o.material && o.material.transparent && !o.material.depthWrite)) { o.castShadow = cast; o.receiveShadow = receive; } });
  return obj;
}
export function mesh(geo, mat, x = 0, y = 0, z = 0) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); return m; }
/** Vertex wind sway for instanced foliage (any lit material). Taller vertices sway more. */
export function addWind(mat, k = 0.1) {
  const prev = mat.onBeforeCompile;
  if (GFX.real) return addDetail(mat, { scale: 1.1, amt: 0.25, rim: 0.12, wind: k });
  mat.onBeforeCompile = (sh, r) => {
    prev && prev.call(mat, sh, r); sh.uniforms.uWind = WIND;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uWind;').replace('#include <begin_vertex>', `#include <begin_vertex>
      { vec3 ip = vec3(0.0);
        #ifdef USE_INSTANCING
          ip = instanceMatrix[3].xyz;
        #endif
        float hgt = max(0.0, position.y); float ph = ip.x * 0.21 + ip.z * 0.17;
        float sw = (sin(uWind * 1.7 + ph) * 0.6 + sin(uWind * 3.1 + ph * 1.9) * 0.25) * ${k.toFixed(3)} * hgt * hgt;
        transformed.x += sw; transformed.z += sw * 0.6; }`);
  };
  mat.customProgramCacheKey = () => 'wind' + k;
  return mat;
}
