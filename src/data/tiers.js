// Albion-style gear tiers. T1-T3 are craftable in this slice; T4-T8 exist as data
// (market board sells T4/T5) so the economy can grow without code changes.
export const TIERS = [
  null,
  { t: 1, name: 'Fledgling', color: '#b8b0a0', power: 1.0 },
  { t: 2, name: 'Apprentice', color: '#7fc46a', power: 1.25 },
  { t: 3, name: 'Journeyman', color: '#5aa7e8', power: 1.55 },
  { t: 4, name: 'Adept', color: '#b77cf0', power: 1.9 },
  { t: 5, name: 'Expert', color: '#f0c050', power: 2.3 },
  { t: 6, name: 'Master', color: '#f08a3c', power: 2.75 },
  { t: 7, name: 'Grandmaster', color: '#e8504a', power: 3.25 },
  { t: 8, name: 'Mythic', color: '#ff6ad5', power: 3.8 },
];
export const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

// Albion-style item quality. A crafted piece rolls a quality; q1 keeps the plain id (old saves stay valid).
export const QUALITIES = [
  { q: 1, sfx: '', pre: '', name: 'Normal', color: '#d8d0c0', mult: 1.0 },
  { q: 2, sfx: '_q2', pre: 'Good ', name: 'Good', color: '#8fd87a', mult: 1.07 },
  { q: 3, sfx: '_q3', pre: 'Outstanding ', name: 'Outstanding', color: '#6ab4ff', mult: 1.15 },
  { q: 4, sfx: '_q4', pre: 'Excellent ', name: 'Excellent', color: '#c58cff', mult: 1.25 },
  { q: 5, sfx: '_q5', pre: 'Masterpiece ', name: 'Masterpiece', color: '#ffcf4a', mult: 1.4 },
];
/** Quality odds for a craft: base weights shift up with skill surplus and Artisan passives. */
export function rollQuality(surplus, bonus, rnd = Math.random) {
  const s = Math.max(0, Math.min(1, surplus / 20)) + bonus; // 0..~1.5
  const w = [Math.max(0.15, 0.7 - 0.45 * s), 0.2 + 0.1 * s, 0.07 + 0.14 * s, 0.025 + 0.08 * s, 0.005 + 0.04 * s];
  let r = rnd() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < 5; i++) { r -= w[i]; if (r <= 0) return i + 1; }
  return 1;
}
