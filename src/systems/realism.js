import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

/** Realistic graphics: sky image-based lighting, ground-truth AO, tuned bloom and tone mapping via a composer. */
export function setupRealism(renderer, scene, camera, world) {
  const qs = new URLSearchParams(location.search); const off = (k) => qs.get('rx') && qs.get('rx').includes(k);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.78;
  // IBL from the physical sky (sky only, so the env map is cheap and has no scene objects in it)
  if (world.realSky && !off('e')) {
    const pm = new THREE.PMREMGenerator(renderer); const tmp = new THREE.Scene(); const sk = world.sky.clone(); sk.visible = true; sk.position.set(0, 0, 0); sk.scale.setScalar(0.1); tmp.add(sk);
    const rt = pm.fromScene(tmp, 0.02, 0.1, 200); scene.environment = rt.texture; scene.environmentIntensity = 0.7; pm.dispose();
  }
  const size = renderer.getDrawingBufferSize(new THREE.Vector2());
  const comp = new EffectComposer(renderer, new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: 4 }));
  comp.addPass(new RenderPass(scene, camera));
  const ao = new GTAOPass(scene, camera, size.x, size.y); ao.output = GTAOPass.OUTPUT.Default; ao.blendIntensity = 0.85;
  ao.updateGtaoMaterial({ radius: 0.6, distanceExponent: 1.4, thickness: 1.2, scale: 1.0, samples: 12 }); ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 12 });
  // transparent FX (god rays, mist sprites) must not write into the AO depth/normal prepass
  { const noAO = []; let scanT = 0; const r0 = ao.render.bind(ao);
    ao.render = (...a) => { if (scanT-- <= 0) { scanT = 60; noAO.length = 0; scene.traverse((o) => { if (o.userData.noAO || o.isSprite || o.isPoints || (o.material && o.material.transparent && !o.material.depthWrite)) noAO.push(o); }); }
      const vis = noAO.map((o) => o.visible); noAO.forEach((o) => { o.visible = false; }); r0(...a); noAO.forEach((o, i) => { o.visible = vis[i]; }); }; }
  if (!off('a')) comp.addPass(ao);
  // guard: clamp HDR fireflies and drop NaN/Inf texels so bloom can never smear them across the frame
  comp.addPass(new ShaderPass({ uniforms: { tDiffuse: { value: null } }, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform sampler2D tDiffuse; varying vec2 vUv; void main(){ vec4 c = texture2D(tDiffuse, vUv); if (any(isnan(c)) || any(isinf(c))) c = vec4(0.5, 0.6, 0.7, 1.0); gl_FragColor = clamp(c, vec4(0.0), vec4(1.8)); }' }));
  // half-res bloom, high threshold + small radius: only true highlights (glows, sun glints) bloom; the sky and lit cloth no longer veil the frame (was washing out phone-size views)
  const bloom = new UnrealBloomPass(new THREE.Vector2(size.x / 2, size.y / 2), 0.07, 0.18, 1.45); if (!off('b')) comp.addPass(bloom);
  comp.addPass(new OutputPass());
  // filmic grade (display space): gentle S-curve, split toning (cool shadows / warm highlights), vibrance, vignette
  const grade = new ShaderPass({ uniforms: { tDiffuse: { value: null }, uAspect: { value: size.x / size.y } }, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform float uAspect; varying vec2 vUv;
      void main(){ vec3 c = texture2D(tDiffuse, vUv).rgb; float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
        c = mix(c, c * c * (3.0 - 2.0 * c), 0.3); c = max(c - 0.018, 0.0) / 0.982;
        c += mix(vec3(-0.012, 0.0, 0.022), vec3(0.03, 0.012, -0.02), smoothstep(0.15, 0.85, l));
        float sat = max(c.r, max(c.g, c.b)) - min(c.r, min(c.g, c.b)); c = mix(vec3(l), c, 1.0 + 0.18 * (1.0 - sat));
        vec2 v = (vUv - 0.5) * vec2(uAspect, 1.0); c *= 1.0 - smoothstep(0.45, 1.15, length(v)) * 0.32;
        gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0); }` });
  if (!off('g')) comp.addPass(grade);
  return {
    composer: comp, ao, bloom,
    render: () => (off('p') ? renderer.render(scene, camera) : comp.render()),
    resize: (w, h) => { comp.setSize(w, h); grade.uniforms.uAspect.value = w / h; },
  };
}
