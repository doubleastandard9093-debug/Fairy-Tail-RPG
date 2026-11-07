// Seasons ported from Aerondel Lite (js/seasons.js), Realistic only. Fiore follows the real-world (northern) season,
// or ?season=spring|summer|autumn|winter. Look-only: no save data, no gameplay. Low/High never load this.
// Cost: 3 uniforms + at most one 512² CC0 WebP (grass channel R only is sampled), ~60-170 KB.
import * as THREE from 'three';
export const SEASONS = {
  spring: { grass: [1.0, 1.1, 0.96], leaf: 0xeefbe2, snow: 0 },
  summer: { grass: [1, 1, 1], leaf: 0xffffff, snow: 0 },
  autumn: { grass: [1.16, 0.94, 0.62], leaf: 0xffa860, snow: 0 },
  winter: { grass: [0.84, 0.9, 0.96], leaf: 0xc4d0d6, snow: 0.55 },
};
export function realSeason(d = new Date()) { const m = d.getMonth(); return m >= 2 && m <= 4 ? 'spring' : m >= 5 && m <= 7 ? 'summer' : m >= 8 && m <= 10 ? 'autumn' : 'winter'; }
export function pickSeason(search = '', d) { const q = new URLSearchParams(search).get('season'); return SEASONS[q] ? q : realSeason(d); }
export const SEASON_U = { seasonGrass: { value: new THREE.Vector3(1, 1, 1) }, seasonSnow: { value: 0 }, tSeason: { value: null }, seasonOn: { value: 0 } };
const leafMats = new Set(); let current = 'summer';
export function registerLeaf(m) { if (!m || leafMats.has(m)) return; m.userData.leafBase = m.color.clone(); leafMats.add(m); tintLeaf(m); }
function tintLeaf(m) { m.color.copy(m.userData.leafBase).multiply(new THREE.Color(SEASONS[current].leaf)); }
export function applySeason(id, { base = '', load = true } = {}) {
  const S = SEASONS[id] || SEASONS.summer; current = SEASONS[id] ? id : 'summer';
  SEASON_U.seasonGrass.value.set(...S.grass); SEASON_U.seasonSnow.value = S.snow;
  for (const m of leafMats) tintLeaf(m);
  SEASON_U.seasonOn.value = 0;
  if (load && current !== 'summer') {
    const t = new THREE.TextureLoader().load(`${base}textures/season_${current}.webp`, () => { if (SEASON_U.tSeason.value === t) SEASON_U.seasonOn.value = 1; }, undefined, () => { SEASON_U.seasonOn.value = 0; });
    t.wrapS = t.wrapT = THREE.RepeatWrapping; SEASON_U.tSeason.value = t;
  }
  return current;
}
export const seasonNow = () => current;
