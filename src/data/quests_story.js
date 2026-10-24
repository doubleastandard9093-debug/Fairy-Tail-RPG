// Main-story arc quests added by the story system (see data/story.js). Same format as data/quests.js,
// plus obj type `reach` {x, z, r, place}: walk to a spot. `arc` ties the quest to its chapter.
// Original paraphrased dialogue for a fan-made pitch prototype; no script text is reproduced.
export const STORY_QUESTS = [
  {
    id: 'q_bora', arc: 'a_hargeon', name: 'The Fake Salamander', qp: 1, start: 'natsu', requires: 'q_welcome',
    intro: [
      ['natsu', 'Hey! Some guy in Hargeon is going around calling himself Salamander. THAT\'S MY NAME.'],
      ['happy', 'He uses charm magic to trick girls onto his ship. Then he sells them. Aye, he\'s the worst.'],
      ['natsu', 'Hargeon is down the road south-west of Magnolia, or one train stop. Beat up his smugglers and let\'s find him!'],
    ],
    stages: [
      { desc: 'Defeat 5 of Bora\'s smugglers at Hargeon Port.', obj: { type: 'kill', mob: 'bora_thug', n: 5 },
        done: [['natsu', 'That\'s the last of his crew! The "Salamander" jumped off the pier and swam for it. Coward.']] },
      { desc: 'Walk to the end of the Hargeon pier where Bora\'s ship was moored.', obj: { type: 'reach', place: 'hargeon', dx: -10, dz: 22, r: 14 },
        done: [['happy', 'His ship sank. Somebody punched it. ...It was Natsu.'], ['natsu', 'The Rune Knights are fishing him out. Back to Natsu at the guild for your share!']] },
      { desc: 'Report to Natsu in the Fairy Tail guild hall.', obj: { type: 'talk', npc: 'natsu' },
        done: [['natsu', 'Real Salamander: one. Fake Salamander: zero. That\'s how it works around here!']] },
    ],
    reward: { jewels: 250, xp: 500, items: { tonic_hp: 3 } },
  },
  {
    id: 'q_macao', arc: 'a_macao', name: 'Where Is Macao?', qp: 2, start: 'romeo', requires: 'q_bora',
    intro: [
      ['romeo', 'Kids at school say my dad is a coward who drinks all day. He is not! He went to Mt. Hakobe on a Vulcan job.'],
      ['romeo', 'That was a week ago. The master says he can look after himself. ...Please. Will you go?'],
      ['natsu', 'Say no more. Grab a coat, Hakobe is freezing. Carriage from the Hakobe Trailhead.'],
    ],
    stages: [
      { desc: 'Climb Mt. Hakobe and defeat 3 Vulcans that are guarding the cave.', obj: { type: 'kill', mob: 'hakobe_vulcan', n: 3 },
        done: [['natsu', 'Their tracks lead into that cave. Something big is in there. It smells like... Macao?']] },
      { desc: 'Defeat the Possessed Vulcan in the ice cave on Mt. Hakobe (its glowing ring marks the arena).', obj: { type: 'kill', mob: 'macao_vulcan', n: 1 },
        done: [['Narrator', 'The Vulcan collapses in a burst of light. Where it stood, a wounded wizard lies in the snow.'], ['macao', 'Ugh... I beat nineteen of them. The twentieth used Take Over on me. Embarrassing.']] },
      { desc: 'Talk to Macao in the ice cave.', obj: { type: 'talk', npc: 'macao' },
        done: [['macao', 'Romeo is waiting, isn\'t he. Go tell him I\'m alive. I\'ll be right behind you. Slowly.']] },
      { desc: 'Bring the news to Romeo in the guild hall.', obj: { type: 'talk', npc: 'romeo' },
        done: [['romeo', 'He\'s coming home? ...I knew it! When I join the guild, I want a mark just like yours!']] },
    ],
    reward: { jewels: 500, xp: 1200, items: { hide_t2: 3, tonic_hp: 2 } },
  },
  {
    id: 'q_daybreak', arc: 'a_daybreak', name: 'Daybreak', qp: 2, start: 'lucy', requires: 'q_macao',
    intro: [
      ['lucy', 'Look at this request! Destroy one book, "Daybreak", in Duke Everlue\'s mansion. Two hundred thousand jewels!'],
      ['lucy', 'The catch: he is hiring a blonde maid. ...I already bought the outfit. Do not laugh.'],
      ['lucy', 'His mansion is near Shirotsume, north of Oshibana. Get past his maids and his hired guns, and find that book.'],
    ],
    stages: [
      { desc: 'Defeat 4 of Everlue\'s mansion guards near Shirotsume.', obj: { type: 'kill', mob: 'everlue_guard', n: 4 },
        done: [['lucy', 'The library is through the cellar! Wait. Did the floor just... ripple?']] },
      { desc: 'Defeat Duke Everlue in the courtyard of his mansion. He swims through the earth with Diver magic.', obj: { type: 'kill', mob: 'everlue', n: 1 },
        done: [['lucy', 'The author hid a spell in the book. The letters rearrange into a letter for his son. The real "Daybreak".']] },
      { desc: 'Return to Lucy in the guild hall.', obj: { type: 'talk', npc: 'lucy' },
        done: [['lucy', 'The son refused the reward and asked us to keep the story instead. ...Rent is due. Worth it.']] },
    ],
    reward: { jewels: 900, xp: 1900, items: { tea_mp: 3, stew: 2 } },
  },
  {
    id: 'q_galuna', arc: 'a_galuna', name: 'The Curse of Galuna', qp: 3, start: 'gray', requires: 'q_lullaby',
    intro: [
      ['gray', 'Natsu took an S-Class request off the second floor. Galuna Island. The master is going to kill us.'],
      ['gray', 'The islanders say the moon turns their bodies into demons. And someone named Lyon is there. ...My old training partner.'],
      ['gray', 'Take the ferry from Hargeon. I\'ll explain on the boat. Badly.'],
    ],
    stages: [
      { desc: 'Sail to Galuna Island and speak with Village Chief Moka near the Moon Drip temple.', obj: { type: 'talk', npc: 'moka' },
        done: [['moka', 'Wizards! Every night the purple moon changes us. Destroy the moon! ...You cannot? Then stop whoever is doing this.'], ['gray', 'The Moon Drip. They are melting Ur\'s ice to free Deliora. Lyon is behind it.']] },
      { desc: 'Defeat 5 of Lyon\'s cultists on Galuna Island.', obj: { type: 'kill', mob: 'galuna_cultist', n: 5 },
        done: [['gray', 'Lyon is at the ruins west of the temple. Stay out of the way of his ice animals. This one is personal.']] },
      { desc: 'Defeat Lyon Vastia at the western ruins of Galuna.', obj: { type: 'kill', mob: 'lyon', n: 1 },
        done: [['Narrator', 'The ice shell cracks. Deliora\'s roar shakes the island... and then the demon crumbles to dust. Ur\'s ice had been killing it for ten years.'], ['gray', 'She won. She always did.']] },
      { desc: 'Tell Chief Moka the truth about the curse.', obj: { type: 'talk', npc: 'moka' },
        done: [['moka', 'The moon\'s light only made us forget? We were demons all along, and the purple light made us think we were human? ...Then we are home. Thank you.']] },
    ],
    reward: { jewels: 1400, xp: 3300, items: { lacrima_shard: 1, tea_mp: 3 } },
  },
  {
    id: 'q_loke', arc: 'a_loke', name: 'The Fading Lion', qp: 2, start: 'loke', requires: 'q_phantom',
    intro: [
      ['loke', 'Hey. You. You\'re friends with Lucy, right? I can\'t be around her keys. I\'m... allergic.'],
      ['loke', 'I\'m not. That\'s a lie. Meet me at the old grave on the hill past Kardia Cathedral. I\'ll tell you there.'],
    ],
    stages: [
      { desc: 'Go to Karen\'s grave on the hill south of Kardia Cathedral.', obj: { type: 'reach', x: 58, z: 18, r: 7 },
        done: [['loke', 'Three years ago my owner, Karen, died while I was banished. I am a Celestial Spirit. Leo. I broke the rules.'], ['loke', 'Spirits cannot live here forever. I am almost gone. The echoes of the Spirit World are coming to collect me.']] },
      { desc: 'Defeat 3 Celestial Echoes that gather at the grave.', obj: { type: 'kill', mob: 'spirit_echo', n: 3 },
        done: [['Narrator', 'Lucy arrives running. She forces open Leo\'s gate with her own magic, and the sky splits into starlight.'], ['Narrator', 'A giant with a moustache made of stars looks down. The Celestial Spirit King changes the rule, for a friend.']] },
      { desc: 'Talk to Lucy back at the guild hall.', obj: { type: 'talk', npc: 'lucy' },
        done: [['lucy', 'He gave me his key! I have a Lion now. He keeps asking me out. I keep closing his gate.'], ['loke', 'For you too: call on me, and the lion comes.']] },
    ],
    questDrops: {},
    reward: { jewels: 1200, xp: 3200, skillXp: { celestial: 1500 }, items: { stardust: 3 } },
  },
  {
    id: 'q_bof', arc: 'a_bof', name: 'Battle of Fairy Tail', qp: 4, start: 'makarov', requires: 'q_tower',
    intro: [
      ['makarov', 'Brat. The Harvest Festival is today, and my grandson Laxus has turned it into a war.'],
      ['makarov', 'He sealed the town with Thunder Palace: lacrima hanging over Magnolia, ready to strike everyone at once.'],
      ['makarov', 'Destroy the lacrima, then find him at Kardia Cathedral. He will not listen to me. Maybe he will listen to you.'],
    ],
    stages: [
      { desc: 'Destroy 5 Thunder Palace lacrima floating around Magnolia.', obj: { type: 'kill', mob: 'thunder_lacrima', n: 5 },
        done: [['natsu', 'Each one shocked me! It was great! Laxus is up at the cathedral. Let\'s get him!']] },
      { desc: 'Defeat Laxus Dreyar on the grounds behind Kardia Cathedral.', obj: { type: 'kill', mob: 'laxus', n: 1 },
        done: [['Narrator', 'Laxus raises his hands for Fairy Law, the master\'s judging light. It washes over the town... and no one falls.'], ['Narrator', 'Fairy Law only harms those the caster truly sees as an enemy. Deep down, Laxus never did.']] },
      { desc: 'Report to Master Makarov.', obj: { type: 'talk', npc: 'makarov' },
        done: [['makarov', 'I have expelled him. It is the hardest thing I have done as master.'], ['makarov', 'At the parade he will be watching from the crowd. We will raise our hands for him. Take this. You earned it.']] },
    ],
    reward: { jewels: 2400, xp: 7600, items: { lacrima_shard: 3, ore_t4: 4 } },
  },
  {
    id: 'q_oracion', arc: 'a_oracion', name: 'Light Guild Alliance', qp: 4, start: 'jura', requires: 'q_bof',
    intro: [
      ['jura', 'Fairy Tail\'s champion. I am Jura of Lamia Scale. Four guilds have allied against the dark guild Oración Seis.'],
      ['jura', 'Their master, Brain, is searching Worth Woodsea for Nirvana, a weapon that turns light hearts to darkness.'],
      ['jura', 'Clear his scouts from the deep wood, then strike at the ruins in the west. I will guard the lodge.'],
    ],
    stages: [
      { desc: 'Defeat 5 Oración Seis scouts in deep Worth Woodsea.', obj: { type: 'kill', mob: 'oracion_mage', n: 5 },
        done: [['jura', 'The ground is shaking. Nirvana is rising from the ruins. Brain will be at its heart. Go!']] },
      { desc: 'Defeat Brain at the Nirvana ruins in western Worth Woodsea. Beware: when he loses his seals, Zero awakens.', obj: { type: 'kill', mob: 'brain', n: 1 },
        done: [['Narrator', 'The last of Brain\'s face-seals breaks, and the cold voice of Zero falls silent. Nirvana\'s spires sink back into the earth.']] },
      { desc: 'Report to Jura at the Ranger Lodge.', obj: { type: 'talk', npc: 'jura' },
        done: [['jura', 'The alliance held. Light guilds that never trusted each other fought as one. Remember this day.']] },
    ],
    reward: { jewels: 3200, xp: 10200, items: { lacrima_shard: 4, tea_mp: 4 } },
  },
];
