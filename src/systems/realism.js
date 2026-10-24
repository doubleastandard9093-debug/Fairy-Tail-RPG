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
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.7;
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
  if (!off('a')) comp.addPass(ao);
  // guard: clamp HDR fireflies and drop NaN/Inf texels so bloom can never smear them across the frame
  comp.addPass(new ShaderPass({ uniforms: { tDiffuse: { value: null } }, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform sampler2D tDiffuse; varying vec2 vUv; void main(){ vec4 c = texture2D(tDiffuse, vUv); if (any(isnan(c)) || any(isinf(c))) c = vec4(0.5, 0.6, 0.7, 1.0); gl_FragColor = clamp(c, vec4(0.0), vec4(3.0)); }' }));
  const bloom = new UnrealBloomPass(new THREE.Vector2(size.x, size.y), 0.12, 0.35, 1.25); if (!off('b')) comp.addPass(bloom);
  comp.addPass(new OutputPass());
  return {
    composer: comp, ao, bloom,
    render: () => (off('p') ? renderer.render(scene, camera) : comp.render()),
    resize: (w, h) => { comp.setSize(w, h); },
  };
}
