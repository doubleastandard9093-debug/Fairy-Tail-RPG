import * as THREE from 'three';

// Global graphics flags, set once at boot from settings (quality change reloads the page).
export const GFX = { high: false, outlines: false, shadows: false };

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
  const m = new THREE.MeshToonMaterial({ color, gradientMap: opts.soft ? grad4 : grad3, ...stripOpts(opts) });
  cache.set(key, m);
  return m;
}
function stripOpts(o) { const r = { ...o }; delete r.soft; return r; }
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
  obj.traverse((o) => { if (o.isMesh && !o.userData.isOutline) { o.castShadow = cast; o.receiveShadow = receive; } });
  return obj;
}
export function mesh(geo, mat, x = 0, y = 0, z = 0) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); return m; }
