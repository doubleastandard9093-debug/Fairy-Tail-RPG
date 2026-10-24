// Story / arc system (data-driven). The game follows the anime season by season; every arc is a
// chapter with a main quest chain, zones, bosses, a level band and cutscene-style scenes.
//
// Authoring a new arc (including post-anime arcs such as a 100 Years Quest-style continuation):
//   1. add quests to data/quests_story.js (or any file pushed into QUESTS) with `arc: '<arc id>'`,
//   2. add an entry below (or call registerArc() from a separate data file) with status 'live',
//   3. optionally gate travel with `gates` (place ids that unlock when the arc starts).
// Nothing else is needed: the Story journal, chapter banners, scenes and travel gates read this table.
//
// status: live (playable) | planned (shown in the journal as "coming soon")
// quests: main chain in order (the last one completes the arc). side: optional arc quests.
// gates: place ids whose train / ferry travel unlocks when the arc becomes available.
// scene.open / scene.close: cutscene lines [speaker npc id or name, text] shown on unlock / completion.
// All dialogue is original paraphrase written for this fan-made pitch prototype.
export const ARCS = [
  { id: 'a_hargeon', n: 1, season: 'Season 1', name: 'Fairy Tail', levels: [1, 6], zones: ['magnolia', 'hargeon'], quests: ['q_welcome', 'q_bora'], side: ['q_cake', 'q_fish'], bosses: [], status: 'live',
    blurb: 'A new wizard arrives in Magnolia, joins the loudest guild in Fiore and runs into a fake Salamander in Hargeon.',
    scene: { open: [['Narrator', 'The Kingdom of Fiore. A land where magic is bought and sold like bread, and wizards band together in guilds.'], ['Narrator', 'In the town of Magnolia stands one guild louder than all the rest. Its name is Fairy Tail.']],
      close: [['Narrator', 'The fake Salamander is in Rune Knight custody, and you have a guild mark that will never wash off.']] } },
  { id: 'a_macao', n: 2, season: 'Season 1', name: 'Macao', levels: [5, 10], zones: ['hakobetrail', 'hakobe'], quests: ['q_macao'], side: ['q_elfman'], bosses: ['macao_vulcan'], status: 'live', gates: [],
    blurb: 'Romeo\'s father went to Mt. Hakobe to hunt a Vulcan and never came back.',
    scene: { open: [['romeo', '...My dad said he would be back in three days. It has been a week.']], close: [['macao', 'I got careless. The Vulcan took my body. ...Thanks for bringing me home to my son.']] } },
  { id: 'a_daybreak', n: 3, season: 'Season 1', name: 'Daybreak', levels: [8, 13], zones: ['shirotsume'], quests: ['q_daybreak'], side: [], bosses: ['everlue'], status: 'live',
    blurb: 'A 200,000-jewel request to destroy a single book in Duke Everlue\'s mansion. Nothing about it adds up.',
    scene: { open: [['lucy', 'Two hundred thousand jewels to burn ONE book? That is either the easiest job ever or a trap.']], close: [['lucy', 'The book was a letter all along. Some stories are worth more than the reward.']] } },
  { id: 'a_lullaby', n: 4, season: 'Season 1', name: 'Lullaby', levels: [10, 16], zones: ['oshibana', 'clover', 'canyon'], quests: ['q_lullaby'], side: [], bosses: ['grumblejaw'], status: 'live', gates: [],
    blurb: 'Eisenwald steals a cursed flute from the books of Zeref and aims it at the guild masters in Clover.',
    scene: { open: [['erza', 'Eisenwald has a flute that kills with a song. I need my strongest guildmates. ...And you.']], close: [['makarov', 'The Council will send me another letter about that canyon. Frame it.']] } },
  { id: 'a_galuna', n: 5, season: 'Season 1', name: 'Galuna Island', levels: [14, 20], zones: ['galuna'], quests: ['q_galuna'], side: [], bosses: ['lyon'], status: 'live', gates: ['galuna'],
    blurb: 'An unofficial S-Class job: a cursed island, a moon that turns purple, and a demon frozen in ice.',
    scene: { open: [['natsu', 'An S-Class job just sitting on the board? Nobody will notice if we borrow it. Probably.']], close: [['gray', 'Ur\'s ice held for ten years. It was always going to end with her protecting us. ...Let\'s go home.']] } },
  { id: 'a_phantom', n: 6, season: 'Season 1', name: 'Phantom Lord', levels: [20, 28], zones: ['oak'], quests: ['q_phantom'], side: ['q_juvia'], bosses: ['jose'], status: 'live', gates: ['oak'],
    blurb: 'The rival guild Phantom Lord declares war, wrecks the guild hall and takes Lucy.',
    scene: { open: [['Narrator', 'Iron poles through the guild hall. Phantom Lord\'s mark painted on the walls. This means war.']], close: [['lucy', 'My father can keep his money. This guild is my home.']] } },
  { id: 'a_loke', n: 7, season: 'Season 1', name: 'Loke', levels: [22, 28], zones: ['magnolia', 'kardia'], quests: ['q_loke'], side: ['q_stars'], bosses: [], status: 'live',
    blurb: 'Loke, the guild\'s womanizer, is fading away. Lucy learns the truth about him.',
    scene: { open: [['loke', 'Hey. If I vanish one of these days, tell Lucy it was not her fault. ...Forget I said anything.']], close: [['loke', 'Leo the Lion, at your service. Whenever you need me, just call.']] } },
  { id: 'a_tower', n: 8, season: 'Season 1', name: 'Tower of Heaven', levels: [26, 34], zones: ['akane'], quests: ['q_tower'], side: [], bosses: ['jellal'], status: 'live', gates: ['akane'],
    blurb: 'A beach holiday ends with Erza taken back to the tower where she was once a slave.',
    scene: { open: [['erza', 'I have run from that tower my whole life. Not anymore.']], close: [['Narrator', 'The Tower of Heaven sinks into the sea, and Erza finally walks away from it.']] } },
  { id: 'a_bof', n: 9, season: 'Season 2', name: 'Battle of Fairy Tail', levels: [30, 38], zones: ['magnolia', 'kardia'], quests: ['q_bof'], side: [], bosses: ['laxus'], status: 'live',
    blurb: 'Magnolia\'s Harvest Festival. Laxus turns the town into a battleground to seize the guild.',
    scene: { open: [['laxus', 'The old man is soft. This guild needs a real master. Let\'s play a game.']], close: [['makarov', 'Laxus is expelled. ...He is still my grandson. Watch the sky for him, brats.']] } },
  { id: 'a_oracion', n: 10, season: 'Season 2', name: 'Oración Seis', levels: [34, 42], zones: ['woodsea'], quests: ['q_oracion'], side: ['q_cana'], bosses: ['brain'], status: 'live', gates: [],
    blurb: 'Four light guilds join forces in Worth Woodsea against the dark guild Oración Seis and the superweapon Nirvana.',
    scene: { open: [['jura', 'Fairy Tail, Blue Pegasus, Lamia Scale and Cait Shelter, standing together. Let us keep this alliance honest.']], close: [['jura', 'Nirvana is still. The forest breathes again. You fought well, friend.']] } },
  { id: 'a_edolas', n: 11, season: 'Season 2', name: 'Edolas', levels: [40, 48], zones: [], quests: [], side: [], bosses: [], status: 'planned', blurb: 'Magnolia is swallowed by an Anima into a parallel world where magic is running out.' },
  { id: 'a_tenrou', n: 12, season: 'Season 3', name: 'Tenrou Island', levels: [46, 55], zones: ['tenrou'], quests: [], side: [], bosses: [], status: 'planned', gates: [], blurb: 'The S-Class trial on holy ground is interrupted by Grimoire Heart and the Black Dragon.' },
  { id: 'a_x791', n: 13, season: 'Season 4', name: 'X791', levels: [55, 58], zones: [], quests: [], side: [], bosses: [], status: 'planned', blurb: 'Seven years have passed. The guild is poor, and the Tenrou team is back.' },
  { id: 'a_keys', n: 14, season: 'Season 4', name: 'Key of the Starry Sky', levels: [56, 60], zones: [], quests: [], side: [], bosses: [], status: 'planned', blurb: 'A clock scattered across Fiore, and a secret about Lucy\'s mother.' },
  { id: 'a_gmg', n: 15, season: 'Season 5', name: 'Grand Magic Games', levels: [58, 66], zones: ['crocus', 'domusflau'], quests: [], side: [], bosses: [], status: 'planned', blurb: 'Fairy Tail fights to become Fiore\'s number one guild again in Crocus.' },
  { id: 'a_eclipse', n: 16, season: 'Season 5', name: 'Eclipse / Dragon King Festival', levels: [64, 70], zones: ['crocus'], quests: [], side: [], bosses: [], status: 'planned', blurb: 'The Eclipse Gate opens and seven dragons descend on the capital.' },
  { id: 'a_sun', n: 17, season: 'Season 6', name: 'Sun Village', levels: [66, 70], zones: [], quests: [], side: [], bosses: [], status: 'planned', blurb: 'A village of giants frozen in eternal ice.' },
  { id: 'a_tartaros', n: 18, season: 'Season 6', name: 'Tartaros', levels: [68, 78], zones: [], quests: [], side: [], bosses: [], status: 'planned', blurb: 'The Demon guild targets the Magic Council and the magic of the whole continent.' },
  { id: 'a_avatar', n: 19, season: 'Season 7', name: 'Avatar', levels: [76, 80], zones: [], quests: [], side: [], bosses: [], status: 'planned', blurb: 'After the guild disbanded, Gray goes undercover in a cult.' },
  { id: 'a_alvarez', n: 20, season: 'Season 7', name: 'Alvarez Empire', levels: [80, 99], zones: [], quests: [], side: [], bosses: [], status: 'planned', blurb: 'The final war against Emperor Spriggan and his Twelve.' },
  // ---- Post-anime continuation (authored as data; status stays 'planned' until written) ----
  { id: 'p_hundred', n: 21, season: 'Beyond', name: 'The Hundred-Year Road', levels: [90, 120], zones: [], quests: [], side: [], bosses: [], status: 'planned', post: true,
    blurb: 'An original continuation after the war: a job nobody has finished in a century. Written as new fan story, with help.' },
];
export const ARC_BY_ID = Object.fromEntries(ARCS.map((a) => [a.id, a]));
/** Lets a separate data file add an arc (e.g. post-anime chapters) without editing this table. */
export function registerArc(a) { if (ARC_BY_ID[a.id]) Object.assign(ARC_BY_ID[a.id], a); else { ARCS.push(a); ARC_BY_ID[a.id] = a; } ARCS.sort((x, y) => x.n - y.n); }
/** Place id -> arc id that unlocks its fast travel. */
export function gateFor(placeId) { const a = ARCS.find((x) => (x.gates || []).includes(placeId)); return a || null; }
