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
  woodsea_ape: {
    name: 'Woodsea Forest Vulcan', level: 13, hp: 260, dmg: 17, speed: 3.4, aggro: 11, range: 2.2, atkCd: 1.7, xp: 170, model: 'vulcan', opt: { fur: '#4a6a3a', face: '#b89070' }, scale: 1.1,
    drops: [{ id: 'spore', chance: 0.8, min: 1, max: 3 }, { id: 'ancient_bark', chance: 0.25 }, { id: 'tonic_hp', chance: 0.15 }], jewels: [14, 28],
    bark: ['*hoots from the canopy*', 'This forest is OURS, tiny wizard!'],
  },
  woodsea_golem: {
    name: 'Mossback Guardian', level: 15, hp: 520, dmg: 22, speed: 1.9, aggro: 9, range: 2.8, atkCd: 2.4, xp: 260, model: 'golem', scale: 0.75,
    drops: [{ id: 'ancient_bark', chance: 0.7, min: 1, max: 2 }, { id: 'hide_t3', chance: 0.3 }], jewels: [20, 40],
    bark: ['*the ground rumbles*', '...WHO... WAKES... THE WOODSEA...'],
  },
  lizardman: {
    name: 'Lizardman', level: 12, hp: 220, dmg: 16, speed: 3.4, aggro: 11, range: 2.6, atkCd: 1.7, xp: 150, model: 'lizard', scale: 1,
    drops: [{ id: 'hide_t3', chance: 0.5 }, { id: 'tonic_hp', chance: 0.2 }], jewels: [14, 26],
    bark: ['Hssss! The rail line is ours!', '*tail thwack*'],
  },
  grumblejaw: {
    name: 'Lullaby, Demon of Zeref', level: 18, hp: 12000, dmg: 24, speed: 2.4, aggro: 16, range: 4.6, atkCd: 2.4, xp: 1500, model: 'lullaby', scale: 1, boss: true, leash: 26, radius: 2.6,
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
    arena: 'canyon', short: 'Lullaby', defeat: '🏆 Lullaby shatters! The Song of Death is cancelled due to fairies.',
    party: { jobs: ['j_lullaby'], quest: ['q_lullaby', 3], ids: ['gm_natsu', 'gm_wendy', 'gm_erza'], line: '⚔️ Natsu, Wendy and Erza join your party! Erza requips into Heart Kreuz!' },
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
  jose: {
    name: 'Master Jose Porla, Phantom Lord', short: 'Jose', level: 26, hp: 19000, dmg: 20, speed: 3.2, aggro: 18, range: 11, atkCd: 2.2, xp: 3200, model: 'wizard', ranged: true, boss: true, leash: 26, radius: 1.4, scale: 1.7,
    opt: { look: { hair: 'long', hairColor: '#1a1420', outfit: 'mage', outfitColor: '#3a2a5a', skin: '#d8c0a8', eyeColor: '#8a2a8a' }, aura: '#7a3aff', mustache: true, body: 'jose' },
    arena: 'phantom', defeat: '🏆 Master Jose falls! Phantom Lord\'s war on Fairy Tail is over.', projColor: '#8a4aff',
    // Phase 1: Dead Wave lines and Shade bolts. Phase 2 (65%): the Shades shield him until destroyed. Phase 3 (30%): full Wizard Saint power.
    telegraphs: [
      { id: 'wave', name: 'Dead Wave', shape: 'rect', length: 22, width: 5, windup: 1.6, dmg: 60, cd: 7, at: 'self', phase: 1 },
      { id: 'shade', name: 'Shade Bolts', shape: 'circle', radius: 3, windup: 1.3, dmg: 42, cd: 8, at: 'targets', count: 3, phase: 1 },
      { id: 'cage', name: 'Shade Cage', shape: 'ring', inner: 5, radius: 16, windup: 2.6, dmg: 70, cd: 15, at: 'self', phase: 2 },
      { id: 'summon', name: 'Shade: Phantom Legion', shape: 'circle', radius: 2.2, windup: 1.8, dmg: 0, cd: 20, at: 'summon', count: 2, mob: 'jose_shade', phase: 2 },
      { id: 'quake', name: 'Wizard Saint\'s Wrath', shape: 'circle', radius: 9, windup: 2.4, dmg: 85, cd: 13, at: 'self', phase: 3 },
    ],
    phases: [
      { at: 0.65, n: 2, cdMul: 0.85, trans: 2.4, shield: { mob: 'jose_shade', count: 4 }, line: 'Jose: "Shades, rise!" A wall of Shades shields Jose. Destroy them (phase 2).' },
      { at: 0.3, n: 3, cdMul: 0.6, trans: 2.4, line: 'Jose\'s magic power explodes! A Wizard Saint at full strength (final phase).' },
    ],
    drops: [{ id: 'lacrima_shard', chance: 1, min: 2, max: 3 }, { id: 'ore_t4', chance: 1, min: 3, max: 5 }, { id: 'stew', chance: 1, min: 2, max: 2 }], jewels: [600, 900],
    party: { jobs: ['j_s_phantom'], quest: ['q_phantom', 1], ids: ['gm_natsu', 'gm_erza', 'gm_wendy'], line: '⚔️ Natsu, Erza and Wendy storm Phantom Lord\'s guild with you!' },
    bark: ['Fairy Tail... I will crush you like insects.', 'Do you know what a Wizard Saint is, child?', 'Phantom Lord is the strongest guild in Fiore!'],
  },
  phantom_mage: {
    name: 'Phantom Lord Mage', level: 22, hp: 420, dmg: 20, speed: 3.2, aggro: 12, range: 10, atkCd: 2.0, xp: 320, model: 'mage', opt: { robe: '#3a2a5a' }, scale: 1, ranged: true, projColor: '#8a4aff',
    drops: [{ id: 'fibre_t4', chance: 0.3 }, { id: 'hide_t4', chance: 0.3 }, { id: 'tea_mp', chance: 0.25 }, { id: 'lacrima_shard', chance: 0.06 }], jewels: [30, 50],
    bark: ['Fairy Tail? In OUR town?', 'Master Jose will reward me for your head!'],
  },
  tower_guard: {
    name: 'Tower of Heaven Guard', level: 28, hp: 560, dmg: 24, speed: 3.4, aggro: 12, range: 2.6, atkCd: 1.6, xp: 420, model: 'lizard', scale: 1.1,
    drops: [{ id: 'ore_t4', chance: 0.4 }, { id: 'hide_t4', chance: 0.3 }, { id: 'lacrima_shard', chance: 0.08 }], jewels: [36, 60],
    bark: ['For Lord Jellal and the R-System!', 'No one climbs the tower!'],
  },
  jose_shade: {
    name: 'Shade', level: 20, hp: 260, dmg: 16, speed: 4, aggro: 40, range: 9, atkCd: 2.0, xp: 60, model: 'wisp', scale: 1.6, ranged: true, temp: true, projColor: '#8a4aff',
    drops: [], jewels: [4, 8], bark: ['*a hollow, ghostly moan*'],
  },
  jellal: {
    name: 'Jellal, Tower of Heaven', short: 'Jellal', level: 32, hp: 27000, dmg: 50, speed: 3.6, aggro: 18, range: 11, atkCd: 2.0, xp: 4800, model: 'wizard', ranged: true, boss: true, leash: 26, radius: 1.4, scale: 1.55,
    opt: { look: { hair: 'spiky', hairColor: '#2a58c8', outfit: 'mage', outfitColor: '#1e2030', skin: '#e8d0b8', eyeColor: '#2a2a3a' }, aura: '#ffd86a', tattoo: true, body: 'jellal' },
    arena: 'heaven', defeat: '🏆 Jellal is beaten! The Etherion lacrima cracks and the Tower of Heaven begins to fall.', projColor: '#ffe28a',
    // Phase 1: Heavenly Body magic. Phase 2 (60%): meteor dashes and Altairis. Phase 3 (25%): fused with Etherion, casts Sema.
    telegraphs: [
      { id: 'meteor', name: 'Meteor', shape: 'rect', length: 20, width: 4, windup: 1.1, dmg: 75, cd: 6, at: 'self', dash: true, phase: 1 },
      { id: 'chariot', name: 'Grand Chariot', shape: 'circle', radius: 3.2, windup: 1.5, dmg: 65, cd: 9, at: 'targets', count: 4, phase: 1 },
      { id: 'altairis', name: 'Altairis', shape: 'circle', radius: 7, windup: 2.6, dmg: 105, cd: 14, at: 'victim', phase: 2 },
      { id: 'sema', name: 'Sema', shape: 'ring', inner: 4, radius: 19, windup: 3.2, dmg: 140, cd: 17, at: 'self', phase: 3 },
    ],
    phases: [
      { at: 0.6, n: 2, cdMul: 0.8, trans: 2.4, line: 'Jellal: "Feel the power of the heavens!" He moves at the speed of a Meteor (phase 2).' },
      { at: 0.25, n: 3, cdMul: 0.6, trans: 3, heal: 0.08, line: 'Jellal fuses with the Etherion lacrima and shines with stolen power (final phase)!' },
    ],
    drops: [{ id: 'lacrima_shard', chance: 1, min: 3, max: 4 }, { id: 'ore_t4', chance: 1, min: 4, max: 6 }, { id: 'tea_mp', chance: 1, min: 3, max: 3 }], jewels: [900, 1300],
    party: { jobs: ['j_s_jellal'], quest: ['q_tower', 1], ids: ['gm_erza', 'gm_natsu', 'gm_wendy'], line: '⚔️ Erza, Natsu and Wendy climb the Tower of Heaven with you!' },
    bark: ['Erza... you came all this way to die?', 'Zeref will be reborn in this tower.', 'This is the Tower of Heaven. I am its god.'],
  },
  // ---------------- Story arcs (data/story.js) ----------------
  macao_vulcan: {
    name: 'Possessed Vulcan (Macao)', short: 'Possessed Vulcan', level: 9, hp: 3600, dmg: 14, speed: 3.4, aggro: 18, range: 2.6, atkCd: 1.8, xp: 900, model: 'vulcan', boss: true, leash: 24, radius: 1.6, scale: 1.55,
    opt: { fur: '#f6f6fa', face: '#e8b0b0', bossAura: ['#9adcff', '#c8a0ff', '#ff8a6a'] }, arena: 'hakobe', defeat: '🏆 The Vulcan collapses, and Macao tumbles out of the light!', projColor: '#bfe8ff',
    // Phase 2 (60%): calls the pack. Phase 3 (30%): the stolen Purple Flare magic bleeds through.
    telegraphs: [
      { id: 'slam', name: 'Avalanche Slam', shape: 'rect', length: 12, width: 4, windup: 1.4, dmg: 26, cd: 7, at: 'self', phase: 1 },
      { id: 'snow', name: 'Snowball Barrage', shape: 'circle', radius: 3, windup: 1.4, dmg: 18, cd: 9, at: 'targets', count: 3, phase: 1 },
      { id: 'pack', name: 'Mountain Howl', shape: 'circle', radius: 2.2, windup: 1.8, dmg: 0, cd: 22, at: 'summon', count: 2, mob: 'hakobe_pup', phase: 2 },
      { id: 'flare', name: 'Purple Flare (stolen)', shape: 'ring', inner: 4, radius: 13, windup: 2.4, dmg: 34, cd: 13, at: 'self', phase: 3 },
    ],
    phases: [
      { at: 0.6, n: 2, cdMul: 0.85, trans: 2, line: 'The Vulcan beats its chest and howls for its pack (phase 2)!' },
      { at: 0.3, n: 3, cdMul: 0.65, trans: 2.4, line: 'Purple fire leaks from the Vulcan. Macao\'s magic is fighting back inside it (final phase)!' },
    ],
    drops: [{ id: 'hide_t2', chance: 1, min: 3, max: 4 }, { id: 'spore', chance: 1, min: 3, max: 5 }, { id: 'tonic_hp', chance: 1, min: 2, max: 2 }], jewels: [120, 200],
    party: { jobs: [], quest: ['q_macao', 1], ids: ['gm_natsu'], line: '⚔️ Natsu charges in beside you: "Give Macao BACK!"' },
    bark: ['WOMAN?! ...WIZARD! SMASH!', '*a hollow voice inside: "Ro... meo..."*', 'This mountain is MINE!'],
  },
  hakobe_pup: { name: 'Young Vulcan', level: 6, hp: 160, dmg: 8, speed: 3.8, aggro: 30, range: 2, atkCd: 1.6, xp: 30, model: 'vulcan', opt: { fur: '#eef0f6', face: '#e0b0b0' }, scale: 0.75, temp: true, drops: [], jewels: [2, 6], bark: ['*squeaky howl*'] },
  everlue_guard: {
    name: 'Everlue Mansion Guard', level: 10, hp: 220, dmg: 12, speed: 3, aggro: 11, range: 9, atkCd: 2.1, xp: 140, model: 'mage', opt: { robe: '#7a2a5a' }, scale: 1.05, ranged: true, projColor: '#ff9ad0',
    drops: [{ id: 'fibre_t2', chance: 0.4 }, { id: 'tea_mp', chance: 0.2 }, { id: 'hide_t2', chance: 0.3 }], jewels: [14, 26],
    bark: ['Intruder! The Duke is not receiving guests!', 'Ugly maids only past this point. ...That came out wrong.'],
  },
  everlue: {
    name: 'Duke Everlue', short: 'Everlue', level: 13, hp: 5400, dmg: 16, speed: 3, aggro: 18, range: 9, atkCd: 2.2, xp: 1300, model: 'wizard', ranged: true, boss: true, leash: 24, radius: 1.3, scale: 1.25,
    opt: { look: { hair: 'short', hairColor: '#2a2018', outfit: 'mage', outfitColor: '#c89a3a', skin: '#e8c8a8', eyeColor: '#2a2a2a', build: { w: 1.25 } }, body: 'everlue', mustache: false }, arena: 'everlue', projColor: '#e0b040',
    defeat: '🏆 Duke Everlue is dug out of his own courtyard. The book "Daybreak" is yours.',
    // Phase 1: Diver dashes through the ground. Phase 2 (60%): summons his maids. Phase 3 (30%): the courtyard caves in.
    telegraphs: [
      { id: 'dive', name: 'Diver: Burrowing Charge', shape: 'rect', length: 18, width: 3.5, windup: 1.2, dmg: 30, cd: 6, at: 'self', dash: true, phase: 1 },
      { id: 'erupt', name: 'Diver: Earth Eruption', shape: 'circle', radius: 3, windup: 1.4, dmg: 24, cd: 8, at: 'targets', count: 3, phase: 1 },
      { id: 'maids', name: '"Maids! Deal with them!"', shape: 'circle', radius: 2.2, windup: 1.8, dmg: 0, cd: 20, at: 'summon', count: 2, mob: 'everlue_guard', phase: 2 },
      { id: 'cave', name: 'Courtyard Cave-in', shape: 'ring', inner: 4, radius: 15, windup: 2.6, dmg: 40, cd: 14, at: 'self', phase: 3 },
    ],
    phases: [
      { at: 0.6, n: 2, cdMul: 0.85, trans: 2, line: 'Everlue: "Maids! MAIDS!" The ground churns as he dives deeper (phase 2).' },
      { at: 0.3, n: 3, cdMul: 0.6, trans: 2.4, line: 'The Duke tunnels in a frenzy. The whole courtyard starts to sink (final phase)!' },
    ],
    drops: [{ id: 'fibre_t3', chance: 1, min: 2, max: 3 }, { id: 'tea_mp', chance: 1, min: 2, max: 2 }, { id: 'lacrima_shard', chance: 0.5 }], jewels: [250, 400],
    party: { jobs: [], quest: ['q_daybreak', 1], ids: ['gm_natsu'], line: '⚔️ Natsu bursts through the wall: "Lucy said it\'s FINE to break this place!"' },
    bark: ['A commoner in MY mansion? Wipe your feet!', 'Diver! I swim through stone like a fish!', 'That book is MINE. Everything here is MINE.'],
  },
  lyon: {
    name: 'Lyon Vastia, Ice-Make Wizard', short: 'Lyon', level: 19, hp: 11000, dmg: 20, speed: 3.4, aggro: 18, range: 10, atkCd: 2.0, xp: 2400, model: 'wizard', ranged: true, boss: true, leash: 24, radius: 1.3, scale: 1.45,
    opt: { look: { hair: 'spiky', hairColor: '#e8eef8', outfit: 'mage', outfitColor: '#e8eef6', skin: '#f0d8c4', eyeColor: '#2a3a5a' }, body: 'lyon' }, arena: 'moon', projColor: '#bfe8ff',
    defeat: '🏆 Lyon\'s ice shatters. Far behind him, Deliora\'s shell cracks... and the demon crumbles to dust.',
    // Phase 1: dynamic Ice-Make animals. Phase 2 (60%): ice beasts fight for him. Phase 3 (25%): Deliora's roar.
    telegraphs: [
      { id: 'eagle', name: 'Ice-Make: Eagle', shape: 'circle', radius: 2.8, windup: 1.2, dmg: 34, cd: 7, at: 'targets', count: 4, phase: 1 },
      { id: 'ape', name: 'Ice-Make: Ape', shape: 'rect', length: 14, width: 4, windup: 1.4, dmg: 44, cd: 8, at: 'self', phase: 1 },
      { id: 'beasts', name: 'Ice-Make: Snow Tiger', shape: 'circle', radius: 2.4, windup: 1.8, dmg: 0, cd: 20, at: 'summon', count: 2, mob: 'ice_beast', phase: 2 },
      { id: 'roar', name: 'Deliora\'s Roar', shape: 'ring', inner: 4.5, radius: 17, windup: 3, dmg: 70, cd: 15, at: 'self', phase: 3 },
    ],
    phases: [
      { at: 0.6, n: 2, cdMul: 0.85, trans: 2.2, line: 'Lyon: "My ice is alive. Ur\'s was only still." Ice beasts take shape (phase 2).' },
      { at: 0.25, n: 3, cdMul: 0.6, trans: 3, line: 'The Moon Drip peaks. Deliora roars inside its shell, shaking the whole island (final phase)!' },
    ],
    drops: [{ id: 'lacrima_shard', chance: 1, min: 1, max: 2 }, { id: 'fibre_t3', chance: 1, min: 3, max: 4 }, { id: 'tea_mp', chance: 1, min: 2, max: 2 }], jewels: [450, 700],
    party: { jobs: [], quest: ['q_galuna', 2], ids: ['gm_natsu', 'gm_erza'], line: '⚔️ Natsu and Erza arrive. Gray steps forward: "Lyon is mine. Cover me."' },
    bark: ['Gray. You still fight with both hands? How static.', 'Ur would want me to surpass her!', 'Deliora will be MY proof.'],
  },
  ice_beast: { name: 'Ice-Make Tiger', level: 16, hp: 300, dmg: 15, speed: 4.4, aggro: 40, range: 2.2, atkCd: 1.6, xp: 50, model: 'boar', scale: 1.1, temp: true, opt: { fur: '#c8e6f8' },
    charge: { cd: 6, speed: 14, dur: 0.6, dmg: 22 }, drops: [], jewels: [3, 8], bark: ['*a cold, crystalline snarl*'] },
  spirit_echo: {
    name: 'Celestial Echo', level: 24, hp: 520, dmg: 20, speed: 3.6, aggro: 14, range: 9, atkCd: 2.0, xp: 360, model: 'wisp', opt: { color: '#ffd86a' }, scale: 1.4, ranged: true, projColor: '#ffe8a0', eliteChance: 0,
    drops: [{ id: 'stardust', chance: 0.5 }, { id: 'tea_mp', chance: 0.25 }], jewels: [20, 40],
    bark: ['*a voice like distant bells: "Leo... it is time."*'],
  },
  thunder_lacrima: {
    name: 'Thunder Palace Lacrima', level: 30, hp: 900, dmg: 26, speed: 0.6, aggro: 14, range: 12, atkCd: 2.6, xp: 520, model: 'wisp', opt: { color: '#ffe24a' }, scale: 1.7, ranged: true, projColor: '#fff4a0', eliteChance: 0,
    drops: [{ id: 'lacrima_shard', chance: 0.2 }, { id: 'ore_t4', chance: 0.4 }], jewels: [40, 70],
    bark: ['*crackle*', '*the air smells of a storm*'],
  },
  laxus: {
    name: 'Laxus Dreyar, Lightning Dragon Slayer', short: 'Laxus', level: 36, hp: 34000, dmg: 56, speed: 3.8, aggro: 18, range: 10, atkCd: 1.9, xp: 6200, model: 'wizard', ranged: true, boss: true, leash: 26, radius: 1.4, scale: 1.65,
    opt: { look: { hair: 'spiky', hairColor: '#f0d050', outfit: 'brawler', outfitColor: '#2a2a30', skin: '#e8c8a8', eyeColor: '#3a3a3a', build: { w: 1.2, arm: 1.1 } }, body: 'laxus' }, arena: 'kardia', projColor: '#fff4a0',
    defeat: '🏆 Laxus drops to one knee. The storm over Magnolia breaks, and the Harvest Festival goes on.',
    // Phase 1: lightning roar and bolts. Phase 2 (60%): Thunder Palace lacrima join in. Phase 3 (25%): Dragon Slayer mode + Fairy Law.
    telegraphs: [
      { id: 'roar', name: 'Lightning Dragon\'s Roar', shape: 'rect', length: 24, width: 5, windup: 1.4, dmg: 90, cd: 7, at: 'self', phase: 1 },
      { id: 'bolts', name: 'Raging Bolt', shape: 'circle', radius: 3, windup: 1.1, dmg: 70, cd: 8, at: 'targets', count: 4, phase: 1 },
      { id: 'flash', name: 'Lightning Body', shape: 'rect', length: 18, width: 3.5, windup: 0.9, dmg: 80, cd: 9, at: 'self', dash: true, phase: 2 },
      { id: 'palace', name: 'Thunder Palace', shape: 'circle', radius: 2.4, windup: 1.8, dmg: 0, cd: 22, at: 'summon', count: 2, mob: 'thunder_lacrima_s', phase: 2 },
      { id: 'law', name: 'Fairy Law', shape: 'ring', inner: 5, radius: 20, windup: 3.4, dmg: 150, cd: 18, at: 'self', phase: 3 },
    ],
    phases: [
      { at: 0.6, n: 2, cdMul: 0.8, trans: 2.4, line: 'Laxus: "You want to see a real storm?" He moves like lightning itself (phase 2).' },
      { at: 0.25, n: 3, cdMul: 0.6, trans: 3, line: 'Scales of light spread across his skin: Dragon Slayer mode. He raises his hands for Fairy Law (final phase)!' },
    ],
    drops: [{ id: 'lacrima_shard', chance: 1, min: 3, max: 4 }, { id: 'ore_t4', chance: 1, min: 4, max: 6 }, { id: 'tea_mp', chance: 1, min: 3, max: 3 }], jewels: [1100, 1600],
    party: { jobs: [], quest: ['q_bof', 1], ids: ['gm_natsu', 'gm_erza', 'gm_wendy'], line: '⚔️ Natsu, Erza and Wendy stand with you against Laxus!' },
    bark: ['The old man is too soft for this guild.', 'Fairy Tail belongs to the strong!', 'You are nothing but noise, brat.'],
  },
  thunder_lacrima_s: { name: 'Thunder Palace Lacrima (summoned)', level: 30, hp: 420, dmg: 22, speed: 0.4, aggro: 40, range: 12, atkCd: 2.4, xp: 60, model: 'wisp', opt: { color: '#ffe24a' }, scale: 1.4, ranged: true, temp: true, projColor: '#fff4a0', drops: [], jewels: [4, 8], bark: ['*crackle*'] },
  oracion_mage: {
    name: 'Oración Seis Scout', level: 34, hp: 760, dmg: 28, speed: 3.4, aggro: 12, range: 10, atkCd: 1.9, xp: 560, model: 'mage', opt: { robe: '#1e3a2a' }, scale: 1.05, ranged: true, projColor: '#5aff8a',
    drops: [{ id: 'fibre_t4', chance: 0.35 }, { id: 'hide_t4', chance: 0.3 }, { id: 'tea_mp', chance: 0.25 }, { id: 'lacrima_shard', chance: 0.08 }], jewels: [40, 70],
    bark: ['Nirvana will turn light into darkness!', 'Master Brain sees everything.'],
  },
  brain: {
    name: 'Brain, Master of Oración Seis', short: 'Brain', level: 40, hp: 42000, dmg: 60, speed: 3.4, aggro: 18, range: 11, atkCd: 2.0, xp: 7800, model: 'wizard', ranged: true, boss: true, leash: 26, radius: 1.4, scale: 1.6,
    opt: { look: { hair: 'long', hairColor: '#e8e8e0', outfit: 'mage', outfitColor: '#e8e4d8', skin: '#a88a70', eyeColor: '#2a3a2a' }, body: 'brain' }, arena: 'nirvana', projColor: '#5aff8a',
    defeat: '🏆 Zero\'s voice goes quiet. The spires of Nirvana sink back into Worth Woodsea.',
    // Phase 1: Dark Rondo and Dark Capriccio. Phase 2 (60%): calls his scouts. Phase 3 (25%): the seals break and Zero takes over.
    telegraphs: [
      { id: 'rondo', name: 'Dark Rondo', shape: 'circle', radius: 3.2, windup: 1.2, dmg: 75, cd: 7, at: 'targets', count: 4, phase: 1 },
      { id: 'capriccio', name: 'Dark Capriccio', shape: 'rect', length: 24, width: 4, windup: 1.3, dmg: 95, cd: 8, at: 'self', phase: 1 },
      { id: 'scouts', name: 'Oración Seis, Assemble', shape: 'circle', radius: 2.4, windup: 1.8, dmg: 0, cd: 22, at: 'summon', count: 2, mob: 'oracion_mage_s', phase: 2 },
      { id: 'genesis', name: 'Zero: Genesis Zero', shape: 'ring', inner: 5, radius: 20, windup: 3.4, dmg: 160, cd: 17, at: 'self', phase: 3 },
      { id: 'void', name: 'Zero: Dark Gravity', shape: 'circle', radius: 7, windup: 2.4, dmg: 110, cd: 12, at: 'victim', phase: 3 },
    ],
    phases: [
      { at: 0.6, n: 2, cdMul: 0.8, trans: 2.4, line: 'Brain: "Oración Seis! To me!" The dark guild answers its master (phase 2).' },
      { at: 0.25, n: 3, cdMul: 0.6, trans: 3, heal: 0.06, line: 'The last seal on Brain\'s face breaks. A colder will looks out of his eyes: Zero (final phase)!' },
    ],
    drops: [{ id: 'lacrima_shard', chance: 1, min: 4, max: 5 }, { id: 'ore_t4', chance: 1, min: 5, max: 7 }, { id: 'tea_mp', chance: 1, min: 3, max: 3 }], jewels: [1400, 2000],
    party: { jobs: [], quest: ['q_oracion', 1], ids: ['gm_natsu', 'gm_erza', 'gm_wendy'], line: '⚔️ The Light Alliance arrives: Natsu, Erza and Wendy fight at your side!' },
    bark: ['Light guilds. How very bright. How very breakable.', 'Nirvana will be the end of your kind of justice.', 'I have six faces. You have seen only one.'],
  },
  oracion_mage_s: { name: 'Oración Seis Scout (summoned)', level: 34, hp: 400, dmg: 22, speed: 3.6, aggro: 40, range: 10, atkCd: 2.2, xp: 60, model: 'mage', opt: { robe: '#1e3a2a' }, scale: 1, ranged: true, temp: true, projColor: '#5aff8a', drops: [], jewels: [4, 8], bark: ['For Master Brain!'] },
  // ===================== Batch 2: Edolas, Tenrou, X791, Key of the Starry Sky, Grand Magic Games =====================
  royal_soldier: {
    name: 'Royal Army Soldier (Edolas)', level: 42, hp: 1500, dmg: 34, speed: 3.2, aggro: 12, range: 9, atkCd: 2, xp: 700, model: 'mage', opt: { robe: '#c8a040' }, scale: 1.05, ranged: true, projColor: '#ff8a5a',
    drops: [{ id: 'lacrima_shard', chance: 0.3 }, { id: 'ore_t5', chance: 0.3 }, { id: 'tea_mp', chance: 0.2 }], jewels: [60, 90],
    bark: ['Earthland wizards! Seize their magic for the king!', 'Our weapons run on stolen magic. Yours will do nicely.'],
  },
  royal_soldier_s: { name: 'Royal Army Lancer (summoned)', level: 42, hp: 900, dmg: 26, speed: 3.6, aggro: 40, range: 2.4, atkCd: 1.6, xp: 90, model: 'mage', opt: { robe: '#a8802a' }, temp: true, drops: [], jewels: [6, 10], bark: ['For King Faust!'] },
  faust: {
    name: 'Dorma Anim (King Faust)', short: 'Dorma Anim', level: 47, hp: 52000, dmg: 66, speed: 2.8, aggro: 20, range: 12, atkCd: 2.2, xp: 9000, model: 'golem', ranged: true, boss: true, leash: 26, radius: 2.2, scale: 1.5,
    opt: { stone: '#3a3a4a', rune: '#ff5a3a', bossAura: ['#ff7a3a', '#ff3a3a', '#ffd06a'] }, arena: 'edolas', projColor: '#ff8a4a',
    defeat: '🏆 Dorma Anim\'s armour splits open and King Faust tumbles out. Edolas\'s skies stop falling.',
    // Phase 1: missile barrage and cannon. Phase 2 (60%): calls the Royal Army. Phase 3 (25%): Dragon Chaser.
    telegraphs: [
      { id: 'missiles', name: 'Missile Barrage', shape: 'circle', radius: 3.2, windup: 1.3, dmg: 80, cd: 8, at: 'targets', count: 5, phase: 1 },
      { id: 'cannon', name: 'Magic Cannon', shape: 'rect', length: 26, width: 5, windup: 1.6, dmg: 100, cd: 9, at: 'self', phase: 1 },
      { id: 'army', name: 'Royal Army', shape: 'circle', radius: 2.4, windup: 1.6, dmg: 0, cd: 20, at: 'summon', count: 2, mob: 'royal_soldier_s', phase: 2 },
      { id: 'stomp', name: 'Armoured Stomp', shape: 'circle', radius: 7, windup: 1.2, dmg: 90, cd: 10, at: 'self', phase: 2 },
      { id: 'chaser', name: 'Dragon Chaser', shape: 'ring', inner: 6, radius: 21, windup: 3.2, dmg: 160, cd: 17, at: 'self', phase: 3 },
    ],
    phases: [
      { at: 0.6, n: 2, cdMul: 0.8, trans: 2.4, shield: 0.12, line: 'Faust: "Royal Army, to me! Bring me their magic!" (phase 2)' },
      { at: 0.25, n: 3, cdMul: 0.6, trans: 3, line: 'The armour glows black: Dorma Anim Dragon Chaser mode! It locks onto everything with magic (final phase).' },
    ],
    drops: [{ id: 'lacrima_shard', chance: 1, min: 4, max: 5 }, { id: 'ore_t5', chance: 1, min: 4, max: 6 }], jewels: [1400, 2000],
    party: { jobs: [], quest: ['q_edolas', 2], ids: ['gm_natsu', 'gm_wendy', 'gm_erza'], line: '⚔️ Natsu, Wendy and Erza leap onto the war machine with you!' },
    bark: ['Magic is a resource, and I will have all of it.', 'Edolas will be eternal!', 'Crush the Earthlanders!'],
  },
  grimoire_soldier: {
    name: 'Grimoire Heart Mage', level: 50, hp: 2100, dmg: 40, speed: 3.3, aggro: 13, range: 9, atkCd: 2, xp: 950, model: 'mage', opt: { robe: '#3a1a1a' }, scale: 1.05, ranged: true, projColor: '#ff5a5a',
    drops: [{ id: 'lacrima_shard', chance: 0.3 }, { id: 'ore_t5', chance: 0.35 }, { id: 'tea_mp', chance: 0.2 }], jewels: [80, 120],
    bark: ['Master Hades wants Zeref. You are in the way.', 'The Seven Kin of Purgatory send their regards.'],
  },
  grimoire_soldier_s: { name: 'Grimoire Heart Grunt (summoned)', level: 50, hp: 1100, dmg: 30, speed: 3.8, aggro: 40, range: 2.4, atkCd: 1.6, xp: 110, model: 'mage', opt: { robe: '#5a1a1a' }, temp: true, drops: [], jewels: [8, 12], bark: ['For the Great Magic World!'] },
  hades: {
    name: 'Hades, Master of Grimoire Heart', short: 'Hades', level: 55, hp: 70000, dmg: 74, speed: 3.4, aggro: 20, range: 11, atkCd: 2, xp: 13000, model: 'wizard', ranged: true, boss: true, leash: 26, radius: 1.5, scale: 1.7,
    opt: { look: { hair: 'beard', hairColor: '#f2f2f2', outfit: 'mage', outfitColor: '#2a1a1a', skin: '#e0c0a0', eyeColor: '#c02a2a', build: { w: 1.15 } }, body: 'hades' }, arena: 'tenrou', projColor: '#ff5a5a',
    defeat: '🏆 Hades falls on the holy ground of Tenrou. Grimoire Heart\'s airship burns on the horizon.',
    // Phase 1: magic chains and Amaterasu. Phase 2 (60%): summons and Bullet sorcery. Phase 3 (25%): the Devil's Eye opens.
    telegraphs: [
      { id: 'chain', name: 'Magic Chain', shape: 'rect', length: 22, width: 3, windup: 1.0, dmg: 80, cd: 7, at: 'self', dash: true, phase: 1 },
      { id: 'amaterasu', name: 'Amaterasu Formula', shape: 'circle', radius: 3.4, windup: 1.5, dmg: 95, cd: 9, at: 'targets', count: 4, phase: 1 },
      { id: 'kin', name: 'Call of Purgatory', shape: 'circle', radius: 2.4, windup: 1.6, dmg: 0, cd: 20, at: 'summon', count: 2, mob: 'grimoire_soldier_s', phase: 2 },
      { id: 'bullets', name: 'Magic Bullets', shape: 'circle', radius: 2.6, windup: 0.9, dmg: 70, cd: 6, at: 'victim', count: 3, phase: 2 },
      { id: 'abyss', name: 'Devil\'s Eye: Abyss', shape: 'ring', inner: 5, radius: 22, windup: 3.4, dmg: 170, cd: 16, at: 'self', phase: 3 },
    ],
    phases: [
      { at: 0.6, n: 2, cdMul: 0.8, trans: 2.4, line: 'Hades: "Makarov\'s children. Let me show you the abyss of magic." (phase 2)' },
      { at: 0.25, n: 3, cdMul: 0.55, trans: 3.2, heal: 0.05, line: 'He tears off his eyepatch. The Devil\'s Eye opens and the air turns black (final phase)!' },
    ],
    drops: [{ id: 'lacrima_shard', chance: 1, min: 5, max: 6 }, { id: 'ore_t5', chance: 1, min: 6, max: 8 }, { id: 'tea_mp', chance: 1, min: 3, max: 3 }], jewels: [2000, 2800],
    party: { jobs: [], quest: ['q_tenrou', 2], ids: ['gm_natsu', 'gm_erza', 'gm_wendy'], line: '⚔️ The Tenrou team stands together against Hades!' },
    bark: ['Magic is the abyss. Will you look into it?', 'Makarov raised soft children.', 'The Great Magic World is near.'],
  },
  ogre_thug: {
    name: 'Twilight Ogre Debt Collector', level: 55, hp: 2400, dmg: 42, speed: 3.4, aggro: 12, range: 2.4, atkCd: 1.6, xp: 1000, model: 'mage', opt: { robe: '#5a3a1a' }, scale: 1.15,
    drops: [{ id: 'ore_t5', chance: 0.35 }, { id: 'hide_t5', chance: 0.3 }, { id: 'tonic_hp', chance: 0.2 }], jewels: [90, 130],
    bark: ['Fairy Tail owes us rent. Seven years of it.', 'Pay up, fairies!'],
  },
  teebo: {
    name: 'Teebo, Twilight Ogre Boss', short: 'Teebo', level: 57, hp: 42000, dmg: 70, speed: 3.6, aggro: 18, range: 3, atkCd: 1.7, xp: 9000, model: 'wizard', boss: true, leash: 24, radius: 1.6, scale: 1.9,
    opt: { look: { hair: 'short', hairColor: '#2a2a2a', outfit: 'brawler', outfitColor: '#5a3a1a', skin: '#c89070', eyeColor: '#2a2a2a', build: { w: 1.5, arm: 1.3 } }, body: 'teebo' }, arena: 'ogre',
    defeat: '🏆 Teebo crashes through his own fence. Fairy Tail\'s debt is settled, Fairy Tail style.',
    telegraphs: [
      { id: 'slam', name: 'Ogre Slam', shape: 'circle', radius: 5.5, windup: 1.2, dmg: 90, cd: 7, at: 'self', phase: 1 },
      { id: 'charge', name: 'Debt Collection', shape: 'rect', length: 20, width: 4, windup: 1.1, dmg: 85, cd: 9, at: 'self', dash: true, phase: 1 },
      { id: 'goons', name: 'Call the Boys', shape: 'circle', radius: 2.4, windup: 1.4, dmg: 0, cd: 18, at: 'summon', count: 2, mob: 'ogre_thug_s', phase: 2 },
      { id: 'quake', name: 'Ground Breaker', shape: 'ring', inner: 4, radius: 18, windup: 2.6, dmg: 120, cd: 14, at: 'self', phase: 3 },
    ],
    phases: [
      { at: 0.55, n: 2, cdMul: 0.8, trans: 2, line: 'Teebo: "Boys! Get out here!" (phase 2)' },
      { at: 0.25, n: 3, cdMul: 0.6, trans: 2.4, line: 'Teebo stops grinning and starts swinging for real (final phase)!' },
    ],
    drops: [{ id: 'ore_t5', chance: 1, min: 4, max: 6 }, { id: 'hide_t5', chance: 1, min: 3, max: 5 }], jewels: [3000, 4000],
    party: { jobs: [], quest: ['q_x791', 2], ids: ['gm_natsu', 'gm_erza'], line: '⚔️ Natsu and Erza crack their knuckles. Back from Tenrou, and in a mood.' },
    bark: ['Your guild is a joke now!', 'Seven years and you came back broke!', 'I collect. I always collect.'],
  },
  ogre_thug_s: { name: 'Twilight Ogre Goon (summoned)', level: 55, hp: 1200, dmg: 32, speed: 3.8, aggro: 40, range: 2.4, atkCd: 1.6, xp: 100, model: 'mage', opt: { robe: '#6a4a2a' }, temp: true, drops: [], jewels: [8, 12], bark: ['Boss says pay!'] },
  clock_sentinel: { name: 'Infinity Clock Sentinel', level: 57, hp: 2000, dmg: 40, speed: 0.8, aggro: 12, range: 10, atkCd: 2.2, xp: 950, model: 'wisp', opt: { color: '#e0c070' }, scale: 1.2, ranged: true, projColor: '#ffe8a0',
    drops: [{ id: 'lacrima_shard', chance: 0.4 }, { id: 'ore_t5', chance: 0.3 }], jewels: [80, 120], bark: ['*tick*', '*tock*'] },
  clock_sentinel_s: { name: 'Clock Gear (summoned)', level: 57, hp: 900, dmg: 28, speed: 0.6, aggro: 40, range: 10, atkCd: 2.4, xp: 80, model: 'wisp', opt: { color: '#c8a050' }, ranged: true, temp: true, projColor: '#ffe8a0', drops: [], jewels: [6, 10], bark: ['*clank*'] },
  byro: {
    name: 'Byro Cracy, Reborn Oración Seis', short: 'Byro', level: 60, hp: 60000, dmg: 72, speed: 3.4, aggro: 20, range: 11, atkCd: 2, xp: 11000, model: 'wizard', ranged: true, boss: true, leash: 26, radius: 1.4, scale: 1.6,
    opt: { look: { hair: 'long', hairColor: '#d8d8c8', outfit: 'mage', outfitColor: '#3a4a3a', skin: '#e0c8b0', eyeColor: '#5a8a5a' }, body: 'byro' }, arena: 'clock', projColor: '#9affd8',
    defeat: '🏆 Byro\'s formula unravels. The Infinity Clock grinds to a halt, and time in Fiore starts moving again.',
    telegraphs: [
      { id: 'analysis', name: 'Magic Analysis', shape: 'circle', radius: 3, windup: 1.2, dmg: 80, cd: 8, at: 'targets', count: 4, phase: 1 },
      { id: 'seal', name: 'Formula Seal', shape: 'rect', length: 22, width: 4, windup: 1.4, dmg: 90, cd: 9, at: 'self', phase: 1 },
      { id: 'gears', name: 'Clockwork', shape: 'circle', radius: 2.4, windup: 1.6, dmg: 0, cd: 20, at: 'summon', count: 2, mob: 'clock_sentinel_s', phase: 2 },
      { id: 'stop', name: 'Time Stop', shape: 'circle', radius: 2.8, windup: 0.9, dmg: 70, cd: 6, at: 'victim', count: 3, phase: 2 },
      { id: 'reverse', name: 'Infinity Reversal', shape: 'ring', inner: 5, radius: 21, windup: 3.2, dmg: 160, cd: 16, at: 'self', phase: 3 },
    ],
    phases: [
      { at: 0.6, n: 2, cdMul: 0.8, trans: 2.4, shield: 0.1, line: 'Byro: "I have analysed your magic. It is beneath me." (phase 2)' },
      { at: 0.25, n: 3, cdMul: 0.55, trans: 3, line: 'The clock hands behind him spin backwards: Infinity Reversal (final phase)!' },
    ],
    drops: [{ id: 'lacrima_shard', chance: 1, min: 5, max: 6 }, { id: 'ore_t5', chance: 1, min: 5, max: 7 }], jewels: [2200, 3000],
    party: { jobs: [], quest: ['q_keys', 2], ids: ['gm_natsu', 'gm_wendy'], line: '⚔️ Natsu and Wendy arrive at the clock tower with you!' },
    bark: ['Every spell has a formula.', 'Your magic has already been read.', 'Time belongs to the Reborn Oración Seis.'],
  },
  sabertooth_mage: { name: 'Sabertooth Mage', level: 60, hp: 2600, dmg: 44, speed: 3.4, aggro: 13, range: 9, atkCd: 1.9, xp: 1100, model: 'mage', opt: { robe: '#e8e8f0' }, scale: 1.05, ranged: true, projColor: '#ffffff',
    drops: [{ id: 'lacrima_shard', chance: 0.35 }, { id: 'ore_t6', chance: 0.25 }, { id: 'tea_mp', chance: 0.2 }], jewels: [100, 150],
    bark: ['Sabertooth is the strongest guild in Fiore.', 'Weakness is not allowed in our guild.'] },
  sabertooth_mage_s: { name: 'Sabertooth Reserve (summoned)', level: 60, hp: 1300, dmg: 34, speed: 3.8, aggro: 40, range: 9, atkCd: 2, xp: 120, model: 'mage', opt: { robe: '#d8d8e0' }, ranged: true, temp: true, projColor: '#ffffff', drops: [], jewels: [8, 12], bark: ['For Sabertooth!'] },
  sting: {
    name: 'Sting Eucliffe, White Dragon Slayer', short: 'Sting', level: 66, hp: 76000, dmg: 78, speed: 4, aggro: 20, range: 10, atkCd: 1.8, xp: 14000, model: 'wizard', ranged: true, boss: true, leash: 22, radius: 1.4, scale: 1.6,
    opt: { look: { hair: 'spiky', hairColor: '#f0e0a0', outfit: 'brawler', outfitColor: '#3a3a4a', skin: '#f0d0b0', eyeColor: '#3a6ad0' }, body: 'sting' }, arena: 'domus', projColor: '#ffffff',
    defeat: '🏆 Sting stays down. The crowd at Domus Flau is on its feet chanting "Fairy Tail!"',
    telegraphs: [
      { id: 'roar', name: 'White Dragon\'s Roar', shape: 'rect', length: 22, width: 5, windup: 1.3, dmg: 95, cd: 7, at: 'self', phase: 1 },
      { id: 'claw', name: 'Holy Claw', shape: 'circle', radius: 3, windup: 1.0, dmg: 80, cd: 8, at: 'targets', count: 3, phase: 1 },
      { id: 'reserve', name: 'Sabertooth Reserves', shape: 'circle', radius: 2.4, windup: 1.6, dmg: 0, cd: 20, at: 'summon', count: 2, mob: 'sabertooth_mage_s', phase: 2 },
      { id: 'flash', name: 'Holy Ray', shape: 'rect', length: 18, width: 3.5, windup: 0.8, dmg: 85, cd: 8, at: 'self', dash: true, phase: 2 },
      { id: 'nova', name: 'Holy Nova', shape: 'ring', inner: 3, radius: 9, windup: 3, dmg: 170, cd: 15, at: 'self', phase: 3 },
    ],
    phases: [
      { at: 0.6, n: 2, cdMul: 0.8, trans: 2.2, line: 'Sting: "Is that all Fairy Tail has?" White light pours off him (phase 2).' },
      { at: 0.25, n: 3, cdMul: 0.55, trans: 3, heal: 0.05, line: 'White Drive! Dragon Force markings cover his skin (final phase)!' },
    ],
    drops: [{ id: 'lacrima_shard', chance: 1, min: 6, max: 7 }, { id: 'ore_t6', chance: 1, min: 4, max: 6 }, { id: 'tea_mp', chance: 1, min: 3, max: 3 }], jewels: [3000, 4000],
    party: { jobs: [], quest: ['q_gmg', 2], ids: ['gm_natsu', 'gm_erza', 'gm_wendy'], line: '⚔️ Team Fairy Tail takes the arena floor beside you!' },
    bark: ['I wanted to fight Natsu. You will do.', 'Sabertooth does not lose.', 'The crowd came for a show!'],
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
  { mob: 'woodsea_ape', count: 7, c: [76.8, -330], r: 60 },        // Worth Woodsea
  { mob: 'woodsea_golem', count: 4, c: [90, -360], r: 45 },       // Worth Woodsea, deep
  { mob: 'grumblejaw', count: 1, at: [-363.2, -60.8] },          // Clover Canyon
  { mob: 'phantom_mage', count: 6, c: [-118, -236], r: 26 },     // Oak Town streets
  { mob: 'tower_guard', count: 5, c: [372, -184], r: 22 },       // Akane Beach / causeway
  { mob: 'jose', count: 1, at: [-128, -272] },                   // Phantom Lord HQ, Oak Town (map 617,250)
  { mob: 'jellal', count: 1, at: [424, -150.4] },                // Tower of Heaven, off Akane Beach (map 962,326)
  // story arcs (data/story.js); arc-locked bosses stay hidden until their chapter opens
  { mob: 'macao_vulcan', count: 1, at: [-160, -518] },           // Mt. Hakobe ice cave
  { mob: 'everlue_guard', count: 5, c: [-440, -395], r: 16 },    // Everlue mansion, Shirotsume
  { mob: 'everlue', count: 1, at: [-440, -430] },
  { mob: 'lyon', count: 1, at: [-690, 92] },                     // Galuna western ruins
  { mob: 'spirit_echo', count: 3, c: [60, 24], r: 6, arc: 'a_loke' }, // Karen's grave
  { mob: 'thunder_lacrima', count: 6, ring: [0, 0, 56], arc: 'a_bof' }, // Thunder Palace, circling Magnolia
  { mob: 'laxus', count: 1, at: [78, -54] },                     // behind Kardia Cathedral
  { mob: 'oracion_mage', count: 6, c: [40, -365], r: 26, arc: 'a_oracion' }, // deep Worth Woodsea
  { mob: 'brain', count: 1, at: [22, -392] },                    // Nirvana ruins
  // batch 2
  { mob: 'royal_soldier', count: 6, c: [-900, 262], r: 18, arc: 'a_edolas' },   // Edolas: Royal City sky-islands
  { mob: 'faust', count: 1, at: [-900, 236] },
  { mob: 'grimoire_soldier', count: 6, c: [-335, 250], r: 26, arc: 'a_tenrou' }, // Tenrou Island
  { mob: 'hades', count: 1, at: [-288, 262] },
  { mob: 'ogre_thug', count: 5, c: [10, -80], r: 14, arc: 'a_x791' },             // Twilight Ogre's yard, north of Magnolia
  { mob: 'teebo', count: 1, at: [28, -96] },
  { mob: 'clock_sentinel', count: 5, c: [-158, -14], r: 12, arc: 'a_keys' },       // Infinity Clock ruins, west of Magnolia
  { mob: 'byro', count: 1, at: [-137, -27] },
  { mob: 'sabertooth_mage', count: 5, c: [-300, -132], r: 14, arc: 'a_gmg' },     // Crocus, outside Domus Flau
  { mob: 'sting', count: 1, at: [-313.6, -116.8] },
];
export const BOSS_ARENA = { x: -363.2, z: -60.8, r: 22 }; // Clover Canyon (map px 470,382)
// Every story boss fights inside its own arena. gate = the side the entrance faces (world x,z of the approach).
export const BOSS_ARENAS = {
  canyon: { ...BOSS_ARENA, name: 'Clover Canyon', pillar: '#7a7068', gem: '#ff8a3a', floor: '#8a7a6a', h: 3 },
  phantom: { x: -128, z: -272, r: 22, name: 'Phantom Lord Guild, Oak Town', pillar: '#3a3448', gem: '#9a5aff', floor: '#5a5068', h: 3, gate: [-128, -230] },
  heaven: { x: 424, z: -150.4, r: 22, name: 'Tower of Heaven', pillar: '#4a4a58', gem: '#ffe08a', floor: '#6a6a78', h: 2.5, gate: [380, -168], causeway: true },
  // story arcs: h omitted = sits on the terrain (computed at build). set = set-piece builder in world/arcsets.js
  hakobe: { x: -160, z: -518, r: 18, name: 'Ice Cave, Mt. Hakobe', pillar: '#cfe0ee', gem: '#9adcff', floor: '#e8eef4', gate: [-196, -516], set: 'icecave' },
  everlue: { x: -440, z: -430, r: 17, name: 'Everlue Mansion Courtyard', pillar: '#c8b080', gem: '#e0b040', floor: '#a89070', gate: [-440, -395], set: 'mansion' },
  moon: { x: -690, z: 92, r: 18, name: 'Galuna Western Ruins', pillar: '#a8a090', gem: '#b8a0ff', floor: '#8a8478', gate: [-651, 96], set: 'ruins' },
  kardia: { x: 78, z: -54, r: 18, name: 'Kardia Cathedral Grounds', pillar: '#d8d0c0', gem: '#ffe24a', floor: '#b8b0a0', gate: [74, -24], set: 'storm' },
  nirvana: { x: 22, z: -392, r: 20, name: 'Nirvana Ruins, Worth Woodsea', pillar: '#4a5a48', gem: '#5aff8a', floor: '#5a6a58', gate: [60, -360], set: 'nirvana' },
  edolas: { x: -900, z: 236, r: 18, name: 'Royal City Sky-Island, Edolas', pillar: '#6a3a2a', gem: '#ff7a3a', floor: '#8a6a5a', gate: [-900, 262], set: 'edolas', noFlat: true, h: 60.6 },
  tenrou: { x: -288, z: 262, r: 18, name: 'Tenrou Island, Holy Ground', pillar: '#7a6a4a', gem: '#ff5a5a', floor: '#8a8a6a', gate: [-310, 254], set: 'tenrou' },
  ogre: { x: 28, z: -96, r: 16, name: 'Twilight Ogre Yard', pillar: '#6a4a2a', gem: '#ffb05a', floor: '#8a7a5a', gate: [12, -74], set: 'ogre' },
  clock: { x: -137, z: -27, r: 18, name: 'Infinity Clock Ruins', pillar: '#8a8070', gem: '#9affd8', floor: '#9a9080', gate: [-122, -8], set: 'clock' },
  domus: { x: -313.6, z: -116.8, r: 9, name: 'Domus Flau Arena Floor', pillar: '#8a7a6a', gem: '#ffffff', floor: '#c8b898', gate: [-313.6, -106], noFlat: true },
};
export const arenaOf = (tpl) => BOSS_ARENAS[tpl.arena || 'canyon'];
