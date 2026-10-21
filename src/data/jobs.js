// Fairy Tail request board. type: kill | gather | deliver | escort | boss
//  kill/boss: { mob, n }   gather: { item, n } (counts items gathered after accepting)
//  deliver: { item, n } (handed in at turn-in)   escort: { escort: 'cat', to: POI id }
// rank: E..S (S-Class). You may take jobs up to one rank above your guild rank.
// daily: true -> can be repeated once per real-world day; others repeat with a 0 cooldown.
export const GUILD_RANKS = [
  { r: 'E', gp: 0 }, { r: 'D', gp: 60 }, { r: 'C', gp: 180 }, { r: 'B', gp: 400 }, { r: 'A', gp: 800 }, { r: 'S', gp: 1500 },
];
export const RANK_ORDER = 'EDCBAS';
export const JOBS = [
  { id: 'j_puff', rank: 'E', type: 'kill', mob: 'puffcap', n: 5, title: 'Forest Vulcan Trouble', client: 'Magnolia Farmers',
    desc: 'Forest Vulcans keep stealing our turnips and shouting \"WOMAN!\" at the scarecrow. Reward: 60 Jewels.', reward: { jewels: 60, gp: 15, xp: 80 } },
  { id: 'j_birch', rank: 'E', type: 'gather', item: 'wood_t1', n: 5, title: 'Firewood for the Guild', client: 'Mirajane',
    desc: 'Natsu ate all the firewood. Again. Please bring birch before he starts on the furniture.', reward: { jewels: 50, gp: 12, xp: 60 }, daily: true },
  { id: 'j_copper', rank: 'E', type: 'gather', item: 'ore_t1', n: 5, title: 'Snacks for Gajeel', client: 'Levy',
    desc: 'Gajeel keeps eating the forge stock. Mine copper so he leaves the guild\'s door hinges alone.', reward: { jewels: 50, gp: 12, xp: 60 }, daily: true },
  { id: 'j_cotton', rank: 'E', type: 'deliver', item: 'fibre_t1', n: 4, title: 'Fluffy Business', client: 'Wendy',
    desc: 'The inn pillows have gone flat. Natsu and Gray had a pillow fight. With magic. Please bring cotton!', reward: { jewels: 45, gp: 10, xp: 50, items: { tonic_hp: 2 } } },
  { id: 'j_boar', rank: 'D', type: 'kill', mob: 'boar', n: 4, title: 'Wild Boars on the Kardia Road', client: 'Magnolia Town Watch',
    desc: 'Wild boars charged the night watch. The watch was asleep. Please make an example of them.', reward: { jewels: 120, gp: 30, xp: 200, items: { hide_t2: 2 } } },
  { id: 'j_cat', rank: 'D', type: 'escort', escort: 'cat', to: 'shrine', title: 'Walk Plue', client: 'Lucy',
    desc: 'Plue needs his walk to Kardia Cathedral. He shivers, he walks slowly, he is perfect. Protect him with your life. Rent depends on it.', reward: { jewels: 150, gp: 35, xp: 220, items: { mayor_hat: 1 } } },
  { id: 'j_iron', rank: 'D', type: 'deliver', item: 'ore_t2', n: 4, title: 'New Guild Doors', client: 'Master Makarov',
    desc: 'The guild hall needs new doors. Again. Someone walked through the old ones while on fire. (Natsu.)', reward: { jewels: 140, gp: 30, xp: 180 } },
  { id: 'j_wisp', rank: 'C', type: 'kill', mob: 'wisp', n: 4, title: 'Eisenwald Stragglers', client: 'Magic Council (reluctantly)',
    desc: 'Eisenwald dark-guild mages are hiding along the Oshibana rail line. The Council would ask someone else, but Fairy Tail was closest.', reward: { jewels: 220, gp: 55, xp: 380, items: { tea_mp: 3 } } },
  { id: 'j_sword', rank: 'C', type: 'deliver', item: 'sword1h_t1', n: 1, title: 'A Spare Blade for Erza', client: 'Erza',
    desc: 'I have 200 swords. I would like 201. Forge me one. It does not need to be good. (It needs to be good.)', reward: { jewels: 200, gp: 45, xp: 300 } },
  { id: 'j_oak', rank: 'C', type: 'gather', item: 'wood_t2', n: 4, title: 'Fireproof Rafters', client: 'Master Makarov',
    desc: 'The rafters are scorched. Bring oak. Fireproof oak, if that exists. It does not. Bring oak anyway.', reward: { jewels: 180, gp: 40, xp: 260 }, daily: true },
  { id: 'j_moon', rank: 'B', type: 'gather', item: 'wood_t3', n: 3, title: 'Moonwillow for the Archive', client: 'Levy',
    desc: 'Moonwillow makes the best Solid Script pens. It hums when you cut it. That is normal. Probably.', reward: { jewels: 360, gp: 80, xp: 600 } },
  { id: 'j_star', rank: 'A', type: 'gather', item: 'ore_t3', n: 3, title: 'Starsilver for Lucy\'s Keys', client: 'Lucy',
    desc: 'Starsilver polishes Gate keys beautifully. Aquarius said her key looks "cheap". I need this.', reward: { jewels: 520, gp: 120, xp: 900 } },
  // ---- Jobs from across Fiore (v3 world) ----
  { id: 'j_lake', rank: 'E', type: 'gather', item: 'fibre_t2', n: 4, title: 'Reeds from Lake Scilliora', client: 'Lucy', zone: 'scilliora',
    desc: 'I am weaving a key pouch and the flax by Lake Scilliora is the softest in Fiore. Do not tell Natsu. He will try to swim in it.', reward: { jewels: 90, gp: 18, xp: 140 } },
  { id: 'j_bora', rank: 'D', type: 'kill', mob: 'bora_thug', n: 4, title: 'Smugglers at Hargeon Port', client: 'Hargeon Harbour Master', zone: 'hargeon',
    desc: 'A fake "Salamander" called Bora of Prominence is charming girls onto his ship. His crew are on the docks. Please arrest them. Loudly.', reward: { jewels: 170, gp: 35, xp: 260, items: { tonic_hp: 2 } } },
  { id: 'j_macao', rank: 'C', type: 'kill', mob: 'hakobe_vulcan', n: 5, title: 'Find Macao on Mt. Hakobe', client: 'Romeo', zone: 'hakobe',
    desc: 'My dad went to Mt. Hakobe to hunt Vulcans and he hasn\'t come back. Everyone says he\'s fine. Please... just go and check. Take a coat.', reward: { jewels: 260, gp: 60, xp: 420, items: { stew: 2 } } },
  { id: 'j_rail', rank: 'C', type: 'kill', mob: 'lizardman', n: 4, title: 'Clear the Oshibana Line', client: 'Fiore Railways', zone: 'oshibana',
    desc: 'Lizardmen keep sunbathing on the Oshibana Line. The 3:15 to Clover has been late for a week. Ticket inspectors are refusing to go out there.', reward: { jewels: 240, gp: 55, xp: 400 } },
  { id: 'j_crocus', rank: 'C', type: 'gather', item: 'ore_t2', n: 4, title: 'Iron for the Flower Capital', client: 'Crocus City Works', zone: 'crocus',
    desc: 'The arena in Crocus needs iron for new stands before the Grand Magic Games. Mine it in the hills around the capital.', reward: { jewels: 230, gp: 50, xp: 380 } },
  { id: 'j_clover', rank: 'B', type: 'gather', item: 'fibre_t2', n: 5, title: 'Banners for the Masters\' Meeting', client: 'Clover Town Hall', zone: 'clover',
    desc: 'The guild masters meet in Clover and the banners are moth-eaten. Bring flax from the meadows around town. Master Bob says "pink, please".', reward: { jewels: 300, gp: 70, xp: 520 } },
  { id: 'j_tenrou', rank: 'A', type: 'gather', item: 'wood_t3', n: 3, title: 'Survey of Tenrou Island', client: 'Master Makarov', zone: 'tenrou',
    desc: 'Tenrou Island is Fairy Tail\'s holy ground. Take the ferry from Hargeon, check the great tree is healthy and bring back Moonwillow. And behave. The First is watching.', reward: { jewels: 560, gp: 130, xp: 950 } },
  { id: 'j_galuna', rank: 'S', type: 'kill', mob: 'galuna_cultist', n: 5, title: 'S-Class Teaser: The Cursed Island', client: 'Moka, Galuna Village Chief', zone: 'galuna',
    desc: 'PLEASE DESTROY THE MOON. ...Fine, start with the masked cultists chanting at the temple every night. (The full Galuna Island arc is coming in the next build. Take the ferry from Hargeon.)', reward: { jewels: 1100, gp: 250, xp: 1800, items: { tea_mp: 3 } } },
  { id: 'j_lullaby', rank: 'S', type: 'boss', mob: 'grumblejaw', n: 1, title: 'S-Class: Silence Lullaby', client: 'Master Makarov',
    desc: 'Eisenwald has awoken Lullaby, a demon of Zeref, in Clover Canyon. Natsu, Wendy and Erza will join you as a party. Do NOT let it finish its song.', reward: { jewels: 1500, gp: 300, xp: 2500, items: { stew: 3 } } },
];
