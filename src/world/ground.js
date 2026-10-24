// Ground material: per-vertex splat weights (rock, dirt/path, sand, snow | wet, cobble, moss, grass-lush)
// blended by height in the fragment shader, with procedural, non-repeating detail per material, bump
// normals from the blended height field, a light parallax offset (Realistic), wet darkening near water,
// and sun-facing snow sparkle. Low keeps a plain vertex-colour toon material (splat is baked into colour).
import * as THREE from 'three';
import { GFX, NOISE_GLSL, toon } from './toon.js';

const GLSL = /* glsl */`
${NOISE_GLSL}
varying vec3 vGP; varying vec4 vS0; varying vec4 vS1; varying vec3 vGN;
vec2 cell2(vec2 p){ vec2 i = floor(p), f = fract(p); float d1 = 8.0, d2 = 8.0; float id = 0.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { vec2 g = vec2(float(x), float(y)); vec2 o = vec2(rh(vec3(i + g, 1.0)), rh(vec3(i + g, 2.0)));
    vec2 r = g + o * 0.8 + 0.1 - f; float d = dot(r, r); if (d < d1) { d2 = d1; d1 = d; id = rh(vec3(i + g, 3.0)); } else if (d < d2) d2 = d; }
  return vec2(sqrt(d2) - sqrt(d1), id); }
// returns albedo multiplier in rgb, height in a
vec4 gGrass(vec3 p){ float big = vnoise(p * 0.035) * 0.6 + vnoise(p * 0.11) * 0.4; float f = vnoise(vec3(p.x * 7.0, p.z * 7.0, p.y)) * 0.6 + vnoise(p * 19.0) * 0.4;
  vec3 tint = mix(vec3(1.08, 1.04, 0.72), vec3(0.82, 1.0, 0.92), smoothstep(0.3, 0.7, big)); float clover = smoothstep(0.62, 0.8, vnoise(p * 1.3));
  tint = mix(tint, vec3(0.78, 0.95, 0.72), clover * 0.5); return vec4(tint * (0.8 + 0.36 * f), f * 0.5 + clover * 0.2); }
vec4 gDirt(vec3 p){ vec2 c = cell2(p.xz * 3.2); float peb = smoothstep(0.05, 0.22, c.x) * step(0.55, c.y); float g = fbm3(p * 1.7);
  float rut = smoothstep(0.75, 1.0, sin(p.x * 0.9 + p.z * 0.6 + g * 2.0) * 0.5 + 0.5) * 0.18;
  vec3 m = vec3(0.86 + 0.22 * g) * (1.0 - rut); m = mix(m, vec3(1.12, 1.08, 1.02) * (0.85 + 0.3 * c.y), peb * 0.75); return vec4(m, g * 0.4 + peb * 0.6); }
vec4 gRock(vec3 p, vec3 n){ vec3 an = abs(n); vec2 uv = an.x > an.z ? p.zy : p.xy; if (an.y > 0.8) uv = p.xz;
  float g = fbm3(p * 0.9); float strata = sin(p.y * 2.6 + g * 5.0) * 0.5 + 0.5; vec2 c = cell2(uv * 0.9 + g); float crack = 1.0 - smoothstep(0.0, 0.07, c.x);
  float lic = smoothstep(0.66, 0.82, vnoise(p * 2.2));
  vec3 m = vec3(0.74 + 0.34 * strata * (0.7 + 0.3 * c.y)) * (1.0 - crack * 0.45); m = mix(m, vec3(1.05, 1.02, 0.85), lic * 0.35);
  return vec4(m, strata * 0.5 + (1.0 - crack) * 0.5); }
vec4 gSand(vec3 p){ float g = vnoise(p * 0.5); float rip = sin(dot(p.xz, vec2(0.8, 0.6)) * 5.0 + g * 6.0) * 0.5 + 0.5; float gr = rh(floor(p * 40.0));
  return vec4(vec3(0.95 + 0.07 * rip + (gr - 0.5) * 0.08), rip * 0.4); }
vec4 gSnow(vec3 p){ float g = fbm3(p * 0.6); float d = vnoise(p * 4.0); return vec4(vec3(0.93 + 0.07 * g) * mix(vec3(0.94, 0.97, 1.04), vec3(1.0), g), g * 0.6 + d * 0.2); }
vec4 gCobble(vec3 p){ vec2 c = cell2(p.xz * 1.25); float stone = smoothstep(0.03, 0.16, c.x); float dome = smoothstep(0.0, 0.45, c.x);
  float wear = vnoise(p * 3.0); vec3 m = mix(vec3(0.5, 0.48, 0.45), vec3(0.82 + 0.36 * c.y) * (0.92 + 0.12 * wear), stone); return vec4(m, dome); }
`;

/** Height-blended splat result. Writes gAlb (multiplier), gH (height), gWet, gSnowK, gRough. */
const BLEND = /* glsl */`
  vec3 gp = vGP; vec3 gn = normalize(vGN);
  #ifdef GPARALLAX
  { vec3 V = normalize(cameraPosition - gp); float h0 = vnoise(gp * 1.25) * 0.5 + vnoise(gp * 3.2) * 0.5; gp.xz -= V.xz / max(V.y, 0.25) * (h0 - 0.5) * 0.06 * (vS1.y + vS0.x * 0.6); }
  #endif
  float wR = vS0.x, wD = vS0.y, wS = vS0.z, wN = vS0.w, wC = vS1.y; float wG = clamp(1.0 - wR - wD - wS - wN - wC, 0.0, 1.0);
  vec4 G = gGrass(gp), D = gDirt(gp), R = gRock(gp, gn), S = gSand(gp), N = gSnow(gp), C = gCobble(gp);
  float hb = 0.25; float mG = wG + G.a * hb, mD = wD + D.a * hb, mR = wR + R.a * hb, mS = wS + S.a * hb, mN = wN + N.a * hb, mC = wC + C.a * hb;
  float mx = max(max(max(mG, mD), max(mR, mS)), max(mN, mC)) - 0.18;
  mG = max(mG - mx, 0.0) * step(0.001, wG); mD = max(mD - mx, 0.0) * step(0.001, wD); mR = max(mR - mx, 0.0) * step(0.001, wR); mS = max(mS - mx, 0.0) * step(0.001, wS); mN = max(mN - mx, 0.0) * step(0.001, wN); mC = max(mC - mx, 0.0) * step(0.001, wC);
  float tot = mG + mD + mR + mS + mN + mC + 1e-4;
  vec3 gAlb = (G.rgb * mG + D.rgb * mD + R.rgb * mR + S.rgb * mS + N.rgb * mN + C.rgb * mC) / tot;
  float gH = (G.a * mG + D.a * mD + R.a * mR + S.a * mS + N.a * mN + C.a * mC) / tot;
  float gBump = (mG * 0.25 + mD * 0.6 + mR * 1.4 + mS * 0.3 + mN * 0.25 + mC * 1.2) / tot;
  float moss = vS1.z * smoothstep(0.35, 0.7, vnoise(gp * 0.8) * 0.7 + gn.y * 0.3);
  gAlb = mix(gAlb, vec3(0.7, 0.92, 0.55) * (0.8 + 0.3 * G.a), moss * 0.7);
  float gWet = clamp(vS1.x, 0.0, 1.0) * (0.75 + 0.25 * vnoise(gp * 0.7));
  float gSnowK = mN / tot;
  float gRough = mix(0.95, 0.55, gWet) - mC / tot * 0.1 - gSnowK * 0.25;
`;

export function groundMaterial() {
  if (!GFX.high) return new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: toon('#fff').gradientMap });
  const mat = GFX.real ? new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0, envMapIntensity: 0.6 })
    : new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: toon('#fff').gradientMap });
  mat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>\nattribute vec4 aS0; attribute vec4 aS1; varying vec3 vGP; varying vec4 vS0; varying vec4 vS1; varying vec3 vGN;`)
      .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>\n vGP = (modelMatrix * vec4(transformed, 1.0)).xyz; vS0 = aS0; vS1 = aS1; vGN = normalize(mat3(modelMatrix) * objectNormal);`);
    let f = sh.fragmentShader.replace('#include <common>', `#include <common>\n${GLSL}`)
      .replace('#include <color_fragment>', `#include <color_fragment>\n${BLEND}\n diffuseColor.rgb *= gAlb; diffuseColor.rgb *= mix(1.0, 0.55, gWet);`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
  { // bump from the blended height field (screen-space derivatives)
    vec3 vp = -vViewPosition; vec3 dpx = dFdx(vp), dpy = dFdy(vp); float H = gH * gBump * 0.35; float hx = dFdx(H), hy = dFdy(H);
    vec3 r1 = cross(dpy, normal), r2 = cross(normal, dpx); float det = dot(dpx, r1); vec3 grad = sign(det) * (hx * r1 + hy * r2);
    normal = normalize(abs(det) * normal - grad * (1.0 - gWet * 0.6)); }`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
  if (gSnowK > 0.05) { vec3 V = normalize(cameraPosition - vGP); vec3 cellp = floor(vGP * 26.0); float r = rh(cellp + floor(V * 7.0));
    float sp = step(0.985, r) * smoothstep(0.5, 1.0, dot(normalize(V + vec3(0.42, 0.84, 0.28)), gn)); totalEmissiveRadiance += vec3(1.0, 0.98, 0.92) * sp * gSnowK * 1.6; }`);
    if (GFX.real) f = f.replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>\n roughnessFactor = gRough;`);
    sh.fragmentShader = f;
  };
  if (GFX.real) mat.defines = { GPARALLAX: 1 };
  mat.customProgramCacheKey = () => 'ground' + (GFX.real ? 'R' : 'H');
  return mat;
}
