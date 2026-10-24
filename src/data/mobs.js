// Mob templates. model = key into world/models.js builders.
// attacks: list of { type: 'melee'|'proj'|'charge'|telegraph shape, ... } chosen by AI.
export const MOBS = {
  puffcap: {
    name: 'Forest Vulcan', level: 2, hp: 70, dmg: 5, speed: 2.4, aggro: 7, range: 1.8, atkCd: 1.6, xp: 30, model: 'vulcan', opt: { fur: '#7a6a42', face: '#c8a080' }, scale: 0.8,
    drops: [{ id: 'spore', chance: 0.9, min: 1, max: 2 }, { id: 'tonic_hp', chance: 0.12 }], jewels: [3, 8],
    bark: ['Ooh ooh! Shiny wizard!', '*beats chest*', 'Woman? WOMAN?! ...No? Then FIGHT!'],
  },
  boar: {
    name: 'Wild Boar', level: 6, hp: 180, dmg: 11, speed: 3.6, aggro: 9, range: 2.2, atkCd: 2.0, xp: 75, model: 'boar', scale: 1,
    charge: { cd: 7, speed: 13, dur: 0.7, dmg: 18 },
    drops: [{ id: 'hide_t1', chance: 0.8, min: 1, max: 2 }, { id: 'hide_t2', chance: 0.35 }], jewels: [8, 16],
    bark: ['SNORT.', '*paws ground dramatically*'],
  },
  wisp: {
    name: 'Eisenwald Mage', level: 10, hp: 150, dmg: 13, speed: 2.8, aggro: 13, range: 11, atkCd: 2.2, xp: 120, model: 'mage', scale: 1, ranged: true,
    drops: [{ id: 'wisp_ember', chance: 0.8 }, { id: 'hide_t3', chance: 0.25 }, { id: 'tea_mp', chance: 0.2 }], jewels: [12, 24],
    bark: ['Eisenwald will not be stopped by flies!', 'For Erigor, the Reaper!'],
  },
  hakobe_vulcan: {
    name: 'Vulcan', level: 8, hp: 240, dmg: 14, speed: 3.2, aggro: 10, range: 2.2, atkCd: 1.8, xp: 110, model: 'vulcan', opt: { fur: '#f2f2f6', face: '#e8b0b0' }, scale: 1.15,
    drops: [{ id: 'spore', chance: 0.9, min: 2, max: 3 }, { id: 'hide_t2', chance: 0.4 }], jewels: [10, 20],
    bark: ['WOMAN! ...Oh. Wizard. FIGHT!', '*Mt. Hakobe howling*'],
  },
  lizardman: {
    name: 'Lizardman', level: 12, hp: 220, dmg: 16, speed: 3.4, aggro: 11, range: 2.6, atkCd: 1.7, xp: 150, model: 'lizard', scale: 1,
    drops: [{ id: 'hide_t3', chance: 0.5 }, { id: 'tonic_hp', chance: 0.2 }], jewels: [14, 26],
    bark: ['Hssss! The rail line is ours!', '*tail thwack*'],
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
  bora_thug: {
    name: "Bora's Smuggler", level: 5, hp: 140, dmg: 9, speed: 2.8, aggro: 10, range: 9, atkCd: 2.2, xp: 60, model: 'mage', opt: { robe: '#6a2a5a' }, scale: 1, ranged: true,
    drops: [{ id: 'hide_t1', chance: 0.4 }, { id: 'tonic_hp', chance: 0.15 }], jewels: [10, 20],
    bark: ['Bora of Prominence sends his regards!', 'Charm magic? Never heard of it. Hand over the jewels.'],
  },
  galuna_cultist: {
    name: "Lyon's Cultist", level: 16, hp: 300, dmg: 18, speed: 3, aggro: 12, range: 10, atkCd: 2.0, xp: 220, model: 'mage', opt: { robe: '#2a4a7a' }, scale: 1, ranged: true,
    drops: [{ id: 'fibre_t3', chance: 0.4 }, { id: 'tea_mp', chance: 0.25 }, { id: 'hide_t3', chance: 0.3 }, { id: 'hide_t4', chance: 0.15 }, { id: 'lacrima_shard', chance: 0.08 }], jewels: [24, 40],
    bark: ['The Moon Drip must not be interrupted!', 'Reitei Lyon will surpass Ur!'],
  },
  tenrou_boar: {
    name: 'Tenrou Wild Boar', level: 14, hp: 340, dmg: 17, speed: 4, aggro: 10, range: 2.4, atkCd: 1.9, xp: 190, model: 'boar', scale: 1.35,
    charge: { cd: 6, speed: 14, dur: 0.7, dmg: 26 },
    drops: [{ id: 'hide_t3', chance: 0.6 }, { id: 'hide_t4', chance: 0.25 }, { id: 'hide_t2', chance: 0.5 }], jewels: [18, 32],
    bark: ['*the sacred island snorts at you*'],
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
  gm_natsu: { name: 'Natsu (party)', hp: 400, dmg: 16, speed: 5, range: 2.4, atkCd: 1.3, model: 'npc', role: 'tank', taunt: true, look: { preset: 'natsu', hair: 'spiky', hairColor: '#ff8aa6', outfit: 'brawler', outfitColor: '#2a2a2a', skin: '#f0c8a0', scarf: '#f4f4ec', build: { w: 1.05 } }, lines: ['I\'m all fired up! Leave the big ugly flute to me!'] },
  gm_wendy: { name: 'Wendy (party)', hp: 220, dmg: 8, speed: 5, range: 10, atkCd: 2.0, model: 'npc', role: 'healer', heal: 22, look: { preset: 'wendy', hair: 'twintails', hairColor: '#3a68d0', outfit: 'mage', outfitColor: '#f0f0ff', skin: '#fbe2d0', scale: 0.8 }, lines: ['I-I\'ll heal everyone! Sky Dragon\'s healing breath!'] },
  gm_erza: { name: 'Erza (party)', hp: 460, dmg: 20, speed: 5.4, range: 2.6, atkCd: 1.2, model: 'npc', role: 'tank', taunt: true, requip: true, look: { preset: 'erza', hair: 'long', hairColor: '#d0202a', outfit: 'adventurer', outfitColor: '#c8ccd8', skin: '#f6d8c0', eyeColor: '#4a2a1a', build: { w: 0.96 } }, weapon: 'sword1h', lines: ['Requip! Heart Kreuz Armor. Lullaby, your song ends here.'] },
  pt_natsu: { name: 'Natsu (party)', school: 'flame', hp: 520, dmg: 15, speed: 6.2, range: 2.4, atkCd: 1.3, model: 'npc', role: 'tank', taunt: true, party: true, look: { preset: 'natsu', hair: 'spiky', hairColor: '#ff8aa6', outfit: 'brawler', outfitColor: '#2a2a2a', skin: '#f0c8a0', scarf: '#f4f4ec', build: { w: 1.05 } }, lines: ['Let\'s go! I\'m all fired up!', 'Leave the big ones to me!'] },
  pt_gray: { name: 'Gray (party)', school: 'ice', hp: 440, dmg: 14, speed: 6.2, range: 9, atkCd: 1.6, model: 'npc', role: 'dps', party: true, look: { preset: 'gray', hair: 'spiky', hairColor: '#1e2230', outfit: 'brawler', outfitColor: '#2a2c3a', skin: '#f0d0b0', mark: { place: 'chest', color: '#3a6ae8' }, build: { w: 1.1 } }, lines: ['Fine. But I\'m not doing this for you.', 'Ice-Make... ready when you are.'] },
  pt_lucy: { name: 'Lucy (party)', school: 'celestial', hp: 320, dmg: 9, speed: 6.2, range: 10, atkCd: 2.0, model: 'npc', role: 'healer', heal: 20, party: true, look: { preset: 'lucy', hair: 'sideponytail', hairColor: '#ffe07a', outfit: 'adventurer', outfitColor: '#f4f4fa', skin: '#fbe0cc', build: { w: 0.92, arm: 0.9 } }, lines: ['A job together? Rent is due, so yes!', 'My spirits and I have your back.'] },
  pt_erza: { name: 'Erza (party)', school: 'requip', hp: 560, dmg: 18, speed: 6.4, range: 2.6, atkCd: 1.2, model: 'npc', role: 'tank', taunt: true, requip: true, party: true, weapon: 'sword1h', look: { preset: 'erza', hair: 'long', hairColor: '#d0202a', outfit: 'adventurer', outfitColor: '#c8ccd8', skin: '#f6d8c0', eyeColor: '#4a2a1a', build: { w: 0.96 } }, lines: ['Very well. Stay behind me.', 'Requip! We move out.'] },
};
// Spawn regions in the Fiore world (world units; Magnolia's guild hall is the origin, +z is south).
// at: fixed point; c + r: random inside a circle.
export const SPAWNS = [
  { mob: 'puffcap', count: 10, c: [150, -78], r: 62 },          // East Forest
  { mob: 'boar', count: 4, c: [105, -20], r: 26 },              // Kardia road
  { mob: 'boar', count: 4, c: [-30, -115], r: 40 },             // fields below Lake Scilliora
  { mob: 'bora_thug', count: 5, c: [-150, 110], r: 34 },        // Hargeon Port
  { mob: 'hakobe_vulcan', count: 6, c: [-206, -515], r: 40 },   // Mt. Hakobe snowfield
  { mob: 'hakobe_vulcan', count: 2, c: [-150, -440], r: 25 },   // Hakobe trail
  { mob: 'wisp', count: 6, c: [-480, -262], r: 34 },            // Oshibana Station (Eisenwald)
  { mob: 'lizardman', count: 5, c: [-385, -215], r: 32 },       // Oshibana rail line
  { mob: 'boar', count: 3, c: [-330, -60], r: 20 },             // Clover outskirts
  { mob: 'galuna_cultist', count: 6, c: [-640, 90], r: 50 },    // Galuna Island
  { mob: 'tenrou_boar', count: 5, c: [-360, 225], r: 50 },      // Tenrou Island
  { mob: 'grumblejaw', count: 1, at: [-363.2, -60.8] },          // Clover Canyon
];
export const BOSS_ARENA = { x: -363.2, z: -60.8, r: 22 }; // Clover Canyon (map px 470,382)
