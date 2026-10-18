// Guild request board. type: kill | gather | deliver | escort | boss
//  kill/boss: { mob, n }   gather: { item, n } (counts items gathered after accepting)
//  deliver: { item, n } (handed in at turn-in)   escort: { escort: 'cat', to: POI id }
// rank: E..S. You may take jobs up to one rank above your guild rank.
// daily: true -> can be repeated once per real-world day; others repeat with a 0 cooldown.
export const GUILD_RANKS = [
  { r: 'E', gp: 0 }, { r: 'D', gp: 60 }, { r: 'C', gp: 180 }, { r: 'B', gp: 400 }, { r: 'A', gp: 800 }, { r: 'S', gp: 1500 },
];
export const RANK_ORDER = 'EDCBAS';
export const JOBS = [
  { id: 'j_puff', rank: 'E', type: 'kill', mob: 'puffcap', n: 5, title: 'Puffcap Pest Control', client: 'Farmer Odo',
    desc: 'They keep sneezing on my turnips. The turnips are now ALSO sneezing. Please help.', reward: { jewels: 60, gp: 15, xp: 80 } },
  { id: 'j_birch', rank: 'E', type: 'gather', item: 'wood_t1', n: 5, title: 'Birch Bundle', client: 'Lanternhaven Lamp Office',
    desc: 'We need birch for lantern poles. Lanternhaven without lanterns is just Haven, and that is a different town.', reward: { jewels: 50, gp: 12, xp: 60 }, daily: true },
  { id: 'j_copper', rank: 'E', type: 'gather', item: 'ore_t1', n: 5, title: 'Copper Run', client: 'Greta Sootwhistle',
    desc: 'Mine me some copper. Not the bad copper. The good copper. You will know.', reward: { jewels: 50, gp: 12, xp: 60 }, daily: true },
  { id: 'j_cotton', rank: 'E', type: 'deliver', item: 'fibre_t1', n: 4, title: 'Fluffy Business', client: 'Marzipan Doughty',
    desc: 'The inn pillows have gone flat. Bring cotton. Do not ask what flattened them.', reward: { jewels: 45, gp: 10, xp: 50, items: { tonic_hp: 2 } } },
  { id: 'j_boar', rank: 'D', type: 'kill', mob: 'boar', n: 4, title: 'Boar Trouble', client: 'Lanternhaven Watch',
    desc: 'Bristleboars charged the night watch. The watch was asleep. Please make an example of them.', reward: { jewels: 120, gp: 30, xp: 200, items: { hide_t2: 2 } } },
  { id: 'j_cat', rank: 'D', type: 'escort', escort: 'cat', to: 'shrine', title: 'Walk Sir Reginald', client: 'Mayor Puddingham',
    desc: 'Sir Reginald Fluffbottom must visit the Whispering Shrine for his weekly meditation. He walks at his own pace. Protect him.', reward: { jewels: 150, gp: 35, xp: 220, items: { mayor_hat: 1 } } },
  { id: 'j_iron', rank: 'D', type: 'deliver', item: 'ore_t2', n: 4, title: 'Iron Requisition', client: 'Guild Treasury',
    desc: 'The guild hall needs new doors. Again. Someone kept walking through the old ones while on fire.', reward: { jewels: 140, gp: 30, xp: 180 } },
  { id: 'j_wisp', rank: 'C', type: 'kill', mob: 'wisp', n: 4, title: 'Wisp Lantern Lighting', client: 'Lanternhaven Lamp Office',
    desc: 'Gloom Wisps are stealing lantern light. Defeat them and the light returns. Science!', reward: { jewels: 220, gp: 55, xp: 380, items: { tea_mp: 3 } } },
  { id: 'j_sword', rank: 'C', type: 'deliver', item: 'sword1h_t1', n: 1, title: 'A Blade for the Watch', client: 'Captain Brisket',
    desc: 'Forge me a sword. Any sword. I lost mine in a pie-eating contest. Long story.', reward: { jewels: 200, gp: 45, xp: 300 } },
  { id: 'j_oak', rank: 'C', type: 'gather', item: 'wood_t2', n: 4, title: 'Oak for the Rafters', client: 'Guild Treasury',
    desc: 'Our rafters are scorched. Bring oak. Fireproof oak, if that exists. It does not. Bring oak anyway.', reward: { jewels: 180, gp: 40, xp: 260 }, daily: true },
  { id: 'j_moon', rank: 'B', type: 'gather', item: 'wood_t3', n: 3, title: 'Moonwillow Whispers', client: 'Academy of Glyphs',
    desc: 'We need Moonwillow for wands. It hums when you cut it. That is normal. Probably.', reward: { jewels: 360, gp: 80, xp: 600 } },
  { id: 'j_star', rank: 'A', type: 'gather', item: 'ore_t3', n: 3, title: 'Starsilver Survey', client: 'Royal Mint of Lanternhaven',
    desc: 'Starsilver! Shiny! We will make commemorative coins of the Mayor\'s cat.', reward: { jewels: 520, gp: 120, xp: 900 } },
  { id: 'j_tyrant', rank: 'S', type: 'boss', mob: 'grumblejaw', n: 1, title: 'Topple the Rock Tyrant', client: 'Everyone, Honestly',
    desc: 'Grumblejaw has awoken in Tyrant\'s Hollow and is VERY grumpy. Guildmates Brakka and Pip will join you as a party.', reward: { jewels: 1500, gp: 300, xp: 2500, items: { stew: 3 } } },
];
