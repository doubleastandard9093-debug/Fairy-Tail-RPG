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
