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
  { id: 'j_puff', rank: 'E', type: 'kill', mob: 'puffcap', n: 5, title: 'Puffcap Pest Control', client: 'Magnolia Farmers',
    desc: 'They keep sneezing on our turnips. The turnips are now ALSO sneezing. Reward: 60 Jewels.', reward: { jewels: 60, gp: 15, xp: 80 } },
  { id: 'j_birch', rank: 'E', type: 'gather', item: 'wood_t1', n: 5, title: 'Firewood for the Guild', client: 'Mirajane',
    desc: 'Natsu ate all the firewood. Again. Please bring birch before he starts on the furniture.', reward: { jewels: 50, gp: 12, xp: 60 }, daily: true },
  { id: 'j_copper', rank: 'E', type: 'gather', item: 'ore_t1', n: 5, title: 'Snacks for Gajeel', client: 'Levy',
    desc: 'Gajeel keeps eating the forge stock. Mine copper so he leaves the guild\'s door hinges alone.', reward: { jewels: 50, gp: 12, xp: 60 }, daily: true },
  { id: 'j_cotton', rank: 'E', type: 'deliver', item: 'fibre_t1', n: 4, title: 'Fluffy Business', client: 'Wendy',
    desc: 'The inn pillows have gone flat. Natsu and Gray had a pillow fight. With magic. Please bring cotton!', reward: { jewels: 45, gp: 10, xp: 50, items: { tonic_hp: 2 } } },
  { id: 'j_boar', rank: 'D', type: 'kill', mob: 'boar', n: 4, title: 'Boars on the Kardia Road', client: 'Magnolia Town Watch',
    desc: 'Wild boars charged the night watch. The watch was asleep. Please make an example of them.', reward: { jewels: 120, gp: 30, xp: 200, items: { hide_t2: 2 } } },
  { id: 'j_cat', rank: 'D', type: 'escort', escort: 'cat', to: 'shrine', title: 'Walk Plue', client: 'Lucy',
    desc: 'Plue needs his walk to Kardia Cathedral. He shivers, he walks slowly, he is perfect. Protect him with your life. Rent depends on it.', reward: { jewels: 150, gp: 35, xp: 220, items: { mayor_hat: 1 } } },
  { id: 'j_iron', rank: 'D', type: 'deliver', item: 'ore_t2', n: 4, title: 'New Guild Doors', client: 'Master Makarov',
    desc: 'The guild hall needs new doors. Again. Someone walked through the old ones while on fire. (Natsu.)', reward: { jewels: 140, gp: 30, xp: 180 } },
  { id: 'j_wisp', rank: 'C', type: 'kill', mob: 'wisp', n: 4, title: 'Dark Guild Wisps', client: 'Magic Council (reluctantly)',
    desc: 'A dark guild is leaking cursed wisps into the forest. The Council would ask someone else, but Fairy Tail was closest.', reward: { jewels: 220, gp: 55, xp: 380, items: { tea_mp: 3 } } },
  { id: 'j_sword', rank: 'C', type: 'deliver', item: 'sword1h_t1', n: 1, title: 'A Spare Blade for Erza', client: 'Erza',
    desc: 'I have 200 swords. I would like 201. Forge me one. It does not need to be good. (It needs to be good.)', reward: { jewels: 200, gp: 45, xp: 300 } },
  { id: 'j_oak', rank: 'C', type: 'gather', item: 'wood_t2', n: 4, title: 'Fireproof Rafters', client: 'Master Makarov',
    desc: 'The rafters are scorched. Bring oak. Fireproof oak, if that exists. It does not. Bring oak anyway.', reward: { jewels: 180, gp: 40, xp: 260 }, daily: true },
  { id: 'j_moon', rank: 'B', type: 'gather', item: 'wood_t3', n: 3, title: 'Moonwillow for the Archive', client: 'Levy',
    desc: 'Moonwillow makes the best Solid Script pens. It hums when you cut it. That is normal. Probably.', reward: { jewels: 360, gp: 80, xp: 600 } },
  { id: 'j_star', rank: 'A', type: 'gather', item: 'ore_t3', n: 3, title: 'Starsilver for Lucy\'s Keys', client: 'Lucy',
    desc: 'Starsilver polishes Gate keys beautifully. Aquarius said her key looks "cheap". I need this.', reward: { jewels: 520, gp: 120, xp: 900 } },
  { id: 'j_lullaby', rank: 'S', type: 'boss', mob: 'grumblejaw', n: 1, title: 'S-Class: Silence Lullaby', client: 'Master Makarov',
    desc: 'Eisenwald has awoken Lullaby, a demon of Zeref, in Clover Canyon. Natsu and Wendy will join you as a party. Do NOT let it finish its song.', reward: { jewels: 1500, gp: 300, xp: 2500, items: { stew: 3 } } },
];
