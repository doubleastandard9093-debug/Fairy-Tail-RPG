// Mob templates. model = key into world/models.js builders.
// attacks: list of { type: 'melee'|'proj'|'charge'|telegraph shape, ... } chosen by AI.
export const MOBS = {
  puffcap: {
    name: 'Puffcap', level: 2, hp: 70, dmg: 5, speed: 2.4, aggro: 7, range: 1.8, atkCd: 1.6, xp: 30, model: 'puffcap', scale: 1,
    drops: [{ id: 'spore', chance: 0.9, min: 1, max: 2 }, { id: 'tonic_hp', chance: 0.12 }], jewels: [3, 8],
    bark: ['*angry squeak*', 'Puff! Puff!', '*spores menacingly*'],
  },
  boar: {
    name: 'Bristleboar', level: 6, hp: 180, dmg: 11, speed: 3.6, aggro: 9, range: 2.2, atkCd: 2.0, xp: 75, model: 'boar', scale: 1,
    charge: { cd: 7, speed: 13, dur: 0.7, dmg: 18 },
    drops: [{ id: 'hide_t1', chance: 0.8, min: 1, max: 2 }, { id: 'hide_t2', chance: 0.35 }], jewels: [8, 16],
    bark: ['SNORT.', '*paws ground dramatically*'],
  },
  wisp: {
    name: 'Gloom Wisp', level: 10, hp: 150, dmg: 13, speed: 2.8, aggro: 13, range: 11, atkCd: 2.2, xp: 120, model: 'wisp', scale: 1, ranged: true, float: 1.4,
    drops: [{ id: 'wisp_ember', chance: 0.8 }, { id: 'hide_t3', chance: 0.25 }, { id: 'tea_mp', chance: 0.2 }], jewels: [12, 24],
    bark: ['oooOOOooo', '*flickers sadly*'],
  },
  grumblejaw: {
    name: 'Grumblejaw the Rock Tyrant', level: 18, hp: 2600, dmg: 18, speed: 2.6, aggro: 16, range: 3.6, atkCd: 2.4, xp: 1500, model: 'golem', scale: 1, boss: true, leash: 26,
    // Telegraphed attacks: shape decal fills for `windup` seconds, then deals dmg to anyone inside.
    telegraphs: [
      { id: 'slam', name: 'Grumble Slam', shape: 'circle', radius: 7, windup: 1.6, dmg: 55, cd: 9, at: 'self' },
      { id: 'charge', name: 'Boulder Barge', shape: 'rect', length: 18, width: 4.5, windup: 1.4, dmg: 50, cd: 12, at: 'self', moves: true },
      { id: 'ring', name: 'Shard Ring', shape: 'ring', inner: 5, radius: 12, windup: 1.8, dmg: 45, cd: 14, at: 'self' },
      { id: 'rocks', name: 'Rockfall', shape: 'circle', radius: 3.5, windup: 1.3, dmg: 40, cd: 8, at: 'targets', count: 3 },
    ],
    drops: [{ id: 'tyrant_core', chance: 1 }, { id: 'ore_t3', chance: 1, min: 3, max: 5 }, { id: 'sword2h_t4', chance: 0.25 }, { id: 'stew', chance: 1, min: 2, max: 2 }], jewels: [300, 500],
    bark: ['GRUMBLE.', 'You woke me up. On a WEEKDAY.', 'Rocks fall. You... die? Maybe.'],
  },
};
// Ally templates (celestial spirits and boss-party guildmates)
export const ALLIES = {
  spirit_ram: { name: 'Brass Ram', hp: 260, dmg: 14, speed: 5, range: 2.4, atkCd: 1.4, model: 'ram', role: 'tank', taunt: true, lines: ['BAAA-TTLE TIME!', 'My horns are polished for this!'] },
  spirit_coral: { name: 'Coral Maiden', hp: 160, dmg: 9, speed: 5, range: 9, atkCd: 2.0, model: 'maiden', role: 'healer', heal: 18, lines: ['Ugh, you called me during my bath.', 'Fine. Healing. You owe me.'] },
  brakka: { name: 'Brakka (guildmate)', hp: 400, dmg: 16, speed: 5, range: 2.4, atkCd: 1.3, model: 'npc', role: 'tank', taunt: true, look: { hair: 'spiky', hairColor: '#e04020', outfit: 'brawler', outfitColor: '#3a3a48', skin: '#c58a5c' }, lines: ['Party up! I call dibs on its face!'] },
  pip: { name: 'Pip (guildmate)', hp: 220, dmg: 8, speed: 5, range: 10, atkCd: 2.0, model: 'npc', role: 'healer', heal: 22, look: { hair: 'bob', hairColor: '#7ad8a0', outfit: 'mage', outfitColor: '#f0f0ff', skin: '#f2d0b0' }, lines: ['I brought snacks AND healing!'] },
};
// Spawn regions in the field. Field runs from z=46 (town gate) to z=200.
export const SPAWNS = [
  { mob: 'puffcap', count: 9, x: [-45, 45], z: [52, 92] },
  { mob: 'boar', count: 7, x: [-55, 55], z: [92, 130] },
  { mob: 'wisp', count: 6, x: [-55, 55], z: [130, 160] },
  { mob: 'grumblejaw', count: 1, at: [0, 182] },
];
export const BOSS_ARENA = { x: 0, z: 182, r: 22 };
