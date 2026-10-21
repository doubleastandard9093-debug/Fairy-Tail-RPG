// Mob templates. model = key into world/models.js builders.
// attacks: list of { type: 'melee'|'proj'|'charge'|telegraph shape, ... } chosen by AI.
export const MOBS = {
  puffcap: {
    name: 'Puffcap', level: 2, hp: 70, dmg: 5, speed: 2.4, aggro: 7, range: 1.8, atkCd: 1.6, xp: 30, model: 'puffcap', scale: 1,
    drops: [{ id: 'spore', chance: 0.9, min: 1, max: 2 }, { id: 'tonic_hp', chance: 0.12 }], jewels: [3, 8],
    bark: ['*angry squeak*', 'Puff! Puff!', '*spores menacingly*'],
  },
  boar: {
    name: 'Magnolia Wild Boar', level: 6, hp: 180, dmg: 11, speed: 3.6, aggro: 9, range: 2.2, atkCd: 2.0, xp: 75, model: 'boar', scale: 1,
    charge: { cd: 7, speed: 13, dur: 0.7, dmg: 18 },
    drops: [{ id: 'hide_t1', chance: 0.8, min: 1, max: 2 }, { id: 'hide_t2', chance: 0.35 }], jewels: [8, 16],
    bark: ['SNORT.', '*paws ground dramatically*'],
  },
  wisp: {
    name: 'Dark Guild Wisp', level: 10, hp: 150, dmg: 13, speed: 2.8, aggro: 13, range: 11, atkCd: 2.2, xp: 120, model: 'wisp', scale: 1, ranged: true, float: 1.4,
    drops: [{ id: 'wisp_ember', chance: 0.8 }, { id: 'hide_t3', chance: 0.25 }, { id: 'tea_mp', chance: 0.2 }], jewels: [12, 24],
    bark: ['oooOOOooo', '*flickers sadly*'],
  },
  grumblejaw: {
    name: 'Lullaby, Demon of Zeref', level: 18, hp: 2600, dmg: 18, speed: 2.4, aggro: 16, range: 4.6, atkCd: 2.4, xp: 1500, model: 'lullaby', scale: 1, boss: true, leash: 26, radius: 2.6,
    // Starts as the cursed flute; transforms when you enter the arena. Phases at 60% and 30% HP.
    // Telegraphs: decal fills for `windup` seconds, then hits anyone inside. `phase` = first phase it is used.
    telegraphs: [
      { id: 'song', name: 'Song of Death', shape: 'ring', inner: 4.8, radius: 17, windup: 3.0, dmg: 70, cd: 16, at: 'self', song: true, phase: 1 },
      { id: 'slam', name: 'Limb Slam', shape: 'rect', length: 13, width: 4, windup: 1.5, dmg: 55, cd: 8, at: 'self', slam: true, phase: 1 },
      { id: 'notes', name: 'Cursed Notes', shape: 'circle', radius: 3.4, windup: 1.4, dmg: 40, cd: 9, at: 'targets', count: 3, phase: 1 },
      { id: 'summon', name: 'Magic Circle: Eisenwald Summon', shape: 'circle', radius: 2.4, windup: 2.0, dmg: 0, cd: 22, at: 'summon', count: 2, mob: 'eisen_summon', phase: 2 },
    ],
    phases: [
      { at: 0.6, n: 2, cdMul: 0.8, line: 'The flute holes shriek! Lullaby is getting angry (phase 2).' },
      { at: 0.3, n: 3, cdMul: 0.6, line: 'Lullaby\'s eyes turn red. The Song of Death plays faster (final phase)!' },
    ],
    drops: [{ id: 'tyrant_core', chance: 1 }, { id: 'ore_t3', chance: 1, min: 3, max: 5 }, { id: 'sword2h_t4', chance: 0.25 }, { id: 'stew', chance: 1, min: 2, max: 2 }], jewels: [300, 500],
    bark: ['I SHALL PLAY THE SONG OF DEATH!', 'Why are you not dead? My song is VERY good.', 'Fairy flies! I will devour your souls!'],
  },
  eisen_summon: {
    name: 'Eisenwald Mage (summoned)', level: 12, hp: 160, dmg: 12, speed: 3, aggro: 30, range: 10, atkCd: 2.4, xp: 40, model: 'mage', scale: 1, ranged: true, temp: true,
    drops: [], jewels: [2, 6], bark: ['For Erigor!', 'Lullaby will play for us all!'],
  },
};
// Ally templates (celestial spirits and boss-party guildmates)
export const ALLIES = {
  spirit_ram: { name: 'Taurus', hp: 260, dmg: 14, speed: 5, range: 2.4, atkCd: 1.4, model: 'ram', role: 'tank', taunt: true, lines: ['MOOO! Taurus is here to fight!', 'Mooo-velous teamwork!'] },
  spirit_coral: { name: 'Aquarius', hp: 160, dmg: 9, speed: 5, range: 9, atkCd: 2.0, model: 'maiden', role: 'healer', heal: 18, lines: ['You summoned me during a DATE. You will pay for this.', 'Fine. Healing. Then I am going back to my boyfriend.'] },
  gm_natsu: { name: 'Natsu (party)', hp: 400, dmg: 16, speed: 5, range: 2.4, atkCd: 1.3, model: 'npc', role: 'tank', taunt: true, look: { hair: 'spiky', hairColor: '#ff8aa6', outfit: 'brawler', outfitColor: '#2a2a2a', skin: '#f0c8a0', scarf: '#f4f4ec' }, lines: ['I\'m all fired up! Leave the big ugly flute to me!'] },
  gm_wendy: { name: 'Wendy (party)', hp: 220, dmg: 8, speed: 5, range: 10, atkCd: 2.0, model: 'npc', role: 'healer', heal: 22, look: { hair: 'twintails', hairColor: '#3a68d0', outfit: 'mage', outfitColor: '#f0f0ff', skin: '#fbe2d0', scale: 0.82 }, lines: ['I-I\'ll heal everyone! Sky Dragon\'s healing breath!'] },
};
// Spawn regions in the field. Field runs from z=46 (town gate) to z=200.
export const SPAWNS = [
  { mob: 'puffcap', count: 9, x: [-45, 45], z: [52, 92] },
  { mob: 'boar', count: 7, x: [-55, 55], z: [92, 130] },
  { mob: 'wisp', count: 6, x: [-55, 55], z: [130, 160] },
  { mob: 'grumblejaw', count: 1, at: [0, 182] },
];
export const BOSS_ARENA = { x: 0, z: 182, r: 22 };
