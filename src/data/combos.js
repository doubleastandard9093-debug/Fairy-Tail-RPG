// Magic combos: cast `seq` in order within COMBO_WINDOW seconds to trigger a finisher at your target.
// Unison Raids: two mages combine their magic. Keyed by the two schools (sorted, joined with '+').
export const COMBO_WINDOW = 4;
export const COMBOS = [
  { id: 'cb_lotus', seq: ['fl_fist', 'fl_bellow'], name: 'Crimson Lotus: Exploding Flame Blade', mult: 3.2, radius: 4.5, school: 'flame', color: '#ff5a10' },
  { id: 'cb_brilliant', seq: ['fl_bellow', 'fl_wing'], name: "Fire Dragon's Brilliant Flame", mult: 4.2, radius: 5.5, school: 'flame', color: '#ffb030' },
  { id: 'cb_geyser', seq: ['ic_floor', 'ic_lance'], name: 'Ice-Make: Geyser', mult: 3.0, radius: 4, school: 'ice', color: '#a8e8ff', effect: { stun: 1.2 } },
  { id: 'cb_cannon', seq: ['ic_lance', 'ic_hammer'], name: 'Ice-Make: Cannon', mult: 4.0, radius: 4.5, school: 'ice', color: '#8fdcff' },
  { id: 'cb_halberd', seq: ['li_spark', 'li_lance'], name: "Lightning Dragon's Heavenly Halberd", mult: 3.4, radius: 3.5, school: 'lightning', color: '#fff27a', effect: { stun: 0.8 } },
  { id: 'cb_thunder', seq: ['li_step', 'li_cage'], name: 'Raging Bolt: Thunder Ring', mult: 4.2, radius: 6, school: 'lightning', color: '#f8ff8a' },
  { id: 'cb_urano', seq: ['ce_star', 'ce_bond'], name: 'Urano Metria', mult: 4.6, radius: 6.5, school: 'celestial', color: '#fff0a0' },
  { id: 'cb_script', seq: ['ru_blast', 'ru_script'], name: 'Solid Script: Thunder', mult: 3.8, radius: 5, school: 'rune', color: '#d0a0ff' },
  { id: 'cb_circle', seq: ['rq_swap', 'rq_lances'], name: 'Requip: Circle Sword', mult: 3.0, radius: 4.5, school: 'requip', color: '#fff0d0' },
  { id: 'cb_pentagram', seq: ['rq_lances', 'rq_storm'], name: 'Pentagram Sword', mult: 4.4, radius: 5, school: 'requip', color: '#fff8e0' },
];
// Party members who can join you (talk to them in the guild hall).
export const PARTY = {
  natsu: { ally: 'pt_natsu', school: 'flame' }, gray: { ally: 'pt_gray', school: 'ice' },
  lucy: { ally: 'pt_lucy', school: 'celestial' }, erza: { ally: 'pt_erza', school: 'requip' },
};
export const UNISON_GENERIC = { name: 'Unison Raid', mult: 6, radius: 7 };
export const UNISONS = {
  'flame+ice': { name: 'Unison Raid: Frozen Inferno', mult: 7, radius: 7.5, line: 'Fire and ice, together. Don\'t you dare melt my construct, flame-brain!' },
  'celestial+flame': { name: 'Unison Raid: Regulus Flare', mult: 6.5, radius: 7, line: 'Loke, lend us the Lion\'s light!' },
  'flame+requip': { name: 'Unison Raid: Flame Empress Blade', mult: 7, radius: 7, line: 'Requip: Flame Empress Armour! Burn with me!' },
  'celestial+ice': { name: 'Unison Raid: Aquarius Ice Tide', mult: 6.5, radius: 8, line: 'Open, Gate of the Water Bearer... and freeze!' },
  'ice+requip': { name: 'Unison Raid: Frozen Blumenblatt', mult: 7, radius: 7, line: 'Ice blades and steel blades. Heaven\'s Wheel!' },
  'celestial+requip': { name: 'Unison Raid: Heaven\'s Star Wheel', mult: 6.5, radius: 7, line: 'Star Dress and Heaven\'s Wheel, together!' },
  'flame+lightning': { name: 'Unison Raid: Lightning Flame Dragon Roar', mult: 7.5, radius: 7, line: 'Lightning Flame Dragon Mode! ROAAAR!' },
  'flame+flame': { name: 'Unison Raid: Twin Fire Dragon Roar', mult: 7, radius: 7, line: 'Two Fire Dragon Slayers? I\'m all fired up!' },
  'ice+ice': { name: 'Unison Raid: Ice-Make Twin Cannon', mult: 6.5, radius: 7, line: 'Ice-Make, together: twin cannon!' },
  'flame+rune': { name: 'Unison Raid: Solid Script Inferno', mult: 6.5, radius: 7, line: 'Write it, I\'ll burn it!' },
  'ice+lightning': { name: 'Unison Raid: Thunder Glacier', mult: 6.5, radius: 7 },
  'lightning+requip': { name: 'Unison Raid: Lightning Empress Lance', mult: 7, radius: 7, line: 'Lightning Empress Armour! Strike!' },
  'ice+rune': { name: 'Unison Raid: Frost Script', mult: 6.5, radius: 7 },
  'celestial+lightning': { name: 'Unison Raid: Starfall Thunder', mult: 6.5, radius: 7 },
  'celestial+rune': { name: 'Unison Raid: Star Script', mult: 6.5, radius: 7 },
  'requip+rune': { name: 'Unison Raid: Runic Blade Dance', mult: 6.5, radius: 7 },
  'celestial+celestial': { name: 'Unison Raid: Gemini Star Burst', mult: 6.5, radius: 7 },
  'requip+requip': { name: 'Unison Raid: Thousand Blades', mult: 7, radius: 7 },
};
export const unisonFor = (a, b) => UNISONS[[a, b].sort().join('+')] || UNISON_GENERIC;
