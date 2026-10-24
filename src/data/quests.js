// Story quests (Fairy Tail fan pitch). Each stage has an objective; when its progress is met,
// talk to `turnIn` (or it advances automatically when turnIn is omitted).
// obj types: talk {npc} | kill {mob,n} | item {id,n,take} | craft {id,n} | job {n}
// questDrops: while the quest is on that stage, the mob may drop that item.
export const QUESTS = [
  {
    id: 'q_welcome', name: 'Welcome to Fairy Tail! (Tutorial)', qp: 1, start: 'mirajane',
    intro: [
      ['mirajane', 'Oh! You must be our new member! I\'m Mirajane. Welcome to Fairy Tail, the loudest guild in Fiore! ♪'],
      ['mirajane', 'That guild mark looks great on you. It means you\'re family now. Family that pays for its own broken tables.'],
      ['mirajane', 'Quick tour! Move with the joystick or WASD. Tap or click things to talk, gather or attack. Your ability bar is bottom-right.'],
      ['mirajane', 'First, say hello to Master Makarov. He\'s the small one. Please don\'t call him small.'],
    ],
    stages: [
      { desc: 'Say hello to Master Makarov.', obj: { type: 'talk', npc: 'makarov' },
        done: [['makarov', 'A new brat! Welcome! Here we have one rule: never stop walking forward. Also, pay for what you break. That is two rules.'],
          ['makarov', 'Natsu! Gray! Stop fighting, we have a guest! ...They never listen. Go back to Mira, she will give you your first job.']] },
      { desc: 'Pick a job from the request board (talk to Mirajane), finish it and hand it in.', obj: { type: 'job', n: 1 }, turnIn: 'mirajane',
        done: [['mirajane', 'Your first job, and the town is still standing! That\'s already better than Natsu\'s first job. ♪'],
          ['mirajane', 'Here are your jewels. Erza is looking for help, and Master Makarov has something serious brewing. Talk to them when you\'re ready!']] },
    ],
    reward: { jewels: 150, xp: 250, items: { tonic_hp: 3 } },
  },
  {
    id: 'q_cake', name: "Erza's Strawberry Cake", qp: 2, start: 'erza',
    intro: [
      ['erza', 'Recruit. I need you to remain calm. ...Someone has taken my strawberry cake.'],
      ['erza', 'There were big hairy footprints by the window. And fur. The Forest Vulcans in the East Forest. They will answer for this.'],
      ['natsu', 'Wasn\'t me! ...I mean, it wasn\'t me THIS time.'],
      ['erza', 'Defeat the Vulcans and recover my cake. Intact. If it is not intact, I will be... disappointed.'],
    ],
    stages: [
      { desc: 'Defeat 4 Forest Vulcans in the East Forest, east of Magnolia past Kardia Cathedral.', obj: { type: 'kill', mob: 'puffcap', n: 4 } },
      { desc: "Recover Erza's Strawberry Cake (a Forest Vulcan has it).", obj: { type: 'item', id: 'pudding', n: 1, take: true }, turnIn: 'erza',
        done: [['erza', 'My cake! It has... a small bite missing. And a tuft of Vulcan fur on the strawberry.'], ['erza', '...It is still perfect. Thank you. You have the heart of a Fairy Tail wizard. Take these. I insist.'], ['happy', 'Erza is smiling. Everyone hide, this never happens.']] },
    ],
    questDrops: { puffcap: { stage: 1, item: 'pudding', chance: 0.7 } },
    reward: { jewels: 120, xp: 300, items: { stew: 3 } },
  },
  {
    id: 'q_lullaby', name: 'The Lullaby Incident', qp: 3, start: 'makarov',
    intro: [
      ['makarov', 'Brat. A dark guild, Eisenwald, has stolen a flute named Lullaby. A demon from the books of Zeref. Its song kills anyone who hears it.'],
      ['makarov', 'They seized Oshibana Station and plan to play it in Clover Canyon, where the guild masters meet. Natsu, Wendy and Erza will go with you on the S-Class job.'],
      ['makarov', 'But first, see Gajeel at the forge. You will need proper gear, and he needs someone to stop him eating the iron stock.'],
    ],
    stages: [
      { desc: 'Mine 4 Copper Ore for Gajeel.', obj: { type: 'item', id: 'ore_t1', n: 4 } },
      { desc: 'Smelt 2 Copper Bars at the forge, then talk to Gajeel.', obj: { type: 'craft', id: 'bar_t1', n: 2 }, turnIn: 'gajeel',
        done: [['gajeel', 'Gihi. Not bad bars. A little crunchy. ...I only ate one.'], ['gajeel', 'Now take the magic train to Oshibana Station. Eisenwald is holding it. Salamander is already there, probably carsick.']] },
      { desc: 'Retake Oshibana Station: defeat 3 Eisenwald mages (magic train from Magnolia Station, or walk west past Crocus).', obj: { type: 'kill', mob: 'wisp', n: 3 },
        done: [['erza', 'The station is ours. Erigor took Lullaby down the line to Clover. We follow. Now.']] },
      { desc: 'Defeat Lullaby, Demon of Zeref, in Clover Canyon (east of Clover Town). Then report to Master Makarov.', obj: { type: 'kill', mob: 'grumblejaw', n: 1 }, turnIn: 'makarov',
        done: [['makarov', 'You destroyed Lullaby! The Magic Council is furious about the canyon. I have never been prouder.'], ['natsu', 'Did you see that?! I punched a giant flute! Best. Job. EVER.'], ['makarov', 'Take this blade. You are a true wizard of Fairy Tail.']] },
    ],
    reward: { jewels: 400, xp: 1200, items: { sword1h_t3: 1 } },
  },
  {
    id: 'q_phantom', name: 'Phantom Lord War', qp: 4, start: 'makarov', requires: 'q_lullaby',
    intro: [
      ['makarov', 'Brat... Phantom Lord fired their Jupiter cannon at our guild hall. Then they took Lucy, because her father pays well.'],
      ['lucy', 'This is my fault. I should just go home to my father and...'],
      ['natsu', 'Your home is HERE, Lucy! We are going to Oak Town and we are taking down Jose!'],
      ['makarov', 'Take the carriage to Oak Town (north-west of Magnolia). Clear the streets, then storm the fortress. Natsu, Erza and Wendy will fight with you.'],
    ],
    stages: [
      { desc: 'Defeat 5 Phantom Lord mages in the streets of Oak Town (carriage from any station).', obj: { type: 'kill', mob: 'phantom_mage', n: 5 },
        done: [['erza', 'The streets are clear. Jose is inside the keep. Stay close, and break his Shades when he hides behind them.']] },
      { desc: 'Defeat Master Jose Porla inside the Phantom Lord fortress, then report to Master Makarov.', obj: { type: 'kill', mob: 'jose', n: 1 }, turnIn: 'makarov',
        done: [['makarov', 'Jose is beaten, and the Magic Council is dissolving Phantom Lord. We will rebuild the hall. Bigger. With a pool.'], ['lucy', 'Thank you... all of you. I\'m staying. This is my guild.'], ['makarov', 'Then it is settled. And Erza has something she wants to tell you. She will not say what. Go and ask her.']] },
    ],
    reward: { jewels: 1200, xp: 4200, items: { lacrima_shard: 2 } },
  },
  {
    id: 'q_tower', name: 'The Tower of Heaven', qp: 5, start: 'erza', requires: 'q_phantom',
    intro: [
      ['erza', 'I... used to be a slave in a tower built for Zeref. My friend Jellal stayed behind. Now he has finished it.'],
      ['erza', 'The Tower of Heaven stands off Akane Beach. The Council will fire Etherion at it. Jellal wants them to.'],
      ['natsu', 'Then we beat him before they fire. Simple!'],
      ['erza', '...Thank you. Take the train to Akane Resort. Fight through his guards on the causeway.'],
    ],
    stages: [
      { desc: 'Defeat 5 Tower of Heaven guards on the Akane causeway (train to Akane Resort Station).', obj: { type: 'kill', mob: 'tower_guard', n: 5 },
        done: [['erza', 'The way to the top is open. Jellal will be fast — watch the ground for his Meteor lines. And when he glows gold, he has taken the Etherion.']] },
      { desc: 'Defeat Jellal at the top of the Tower of Heaven, then report to Erza.', obj: { type: 'kill', mob: 'jellal', n: 1 }, turnIn: 'erza',
        done: [['erza', 'It is over. The tower is falling into the sea, and I am... free of it.'], ['erza', 'You fought for me as family. Take my old blade. It has cut through worse than Jellal.']] },
    ],
    reward: { jewels: 1800, xp: 6000, items: { lacrima_shard: 3, sword1h_t4: 1 } },
  },
  // ---- Life-skill quests (each one walks a skill chain) ----
  {
    id: 'q_fish', name: 'Aye, Fish Feast!', qp: 1, start: 'happy',
    intro: [['happy', 'Psst. Hey. You. Do you like fish? I LOVE fish. Natsu ate all of mine.'], ['happy', 'There are fishing ponds just outside the south gate. Catch some, cook them into snacks at the Arcane Workshop kitchen, and feed me. For science. Aye!']],
    stages: [
      { desc: 'Catch 4 Magnolia Minnows at the ponds outside Magnolia\'s south gate (Fishing).', obj: { type: 'item', id: 'fish_t1', n: 4 } },
      { desc: 'Cook 2 Fish Snacks at the Guild Kitchen in the Arcane Workshop (Cooking).', obj: { type: 'craft', id: 'fish_snack', n: 2 } },
      { desc: 'Feed Happy 2 times (bag item → Feed Happy, or Skills → Exceed Bonding), then talk to him.', obj: { type: 'craft', id: 'feed_happy', n: 2 }, turnIn: 'happy',
        done: [['happy', 'Mmmmf! You\'re officially my second-best friend. Partner Exceeds help out, you know. I\'ll spot fish for you and fly you places cheaper!']] },
    ],
    reward: { jewels: 200, xp: 300, skillXp: { exceed: 400, fishing: 250, cooking: 250 }, items: { fish_t1: 3 } },
  },
  {
    id: 'q_script', name: "Levy's Solid Script", qp: 1, start: 'levy',
    intro: [['levy', 'Solid Script turns letters into magic. And books into teachers! Want to learn?'], ['levy', 'Make parchment from planks and ink from fibre and a lacrima cell, then write me a Fishing Tome. Every Tome teaches another skill.']],
    stages: [
      { desc: 'Write 3 Archive Parchment at the Script Desk (needs Birch Planks from the Workbench).', obj: { type: 'craft', id: 'parchment', n: 3 } },
      { desc: 'Make 3 Solid Script Ink (needs a Dim Lacrima Cell from the Lacrima Bench and Lacrima Solvent from Alchemy).', obj: { type: 'craft', id: 'ink', n: 3 } },
      { desc: 'Write Happy\'s Fishing Diary (a Tome) at Script level 8, then show Levy.', obj: { type: 'craft', id: 'tome_fishing', n: 1 }, turnIn: 'levy',
        done: [['levy', 'Perfect handwriting! See? Smithing, Alchemy, Requip... there is a Tome for everything. Script magic connects all your skills.']] },
    ],
    reward: { jewels: 300, xp: 500, skillXp: { script: 600, lacrima: 200 }, items: { ink: 3, parchment: 4 } },
  },
  {
    id: 'q_stars', name: 'A Contract with the Stars', qp: 2, start: 'lucy', requires: 'q_script',
    intro: [['lucy', 'Gate keys are not just bought, you know. A real celestial wizard can forge one, with stardust, ink and silver.'], ['lucy', 'Grind stardust at the Star Circle, then forge the Gate Key of Taurus. He will... appreciate you. A lot. Ugh.']],
    stages: [
      { desc: 'Grind 2 Stardust at the Star Circle (Foraging fibre + Alchemy solvent).', obj: { type: 'craft', id: 'stardust', n: 2 } },
      { desc: 'Forge the Gate Key: Taurus at Celestial Contracts 6, then show Lucy.', obj: { type: 'craft', id: 'key_ram', n: 1 }, turnIn: 'lucy',
        done: [['lucy', 'You made a gate key! The contract is yours. Every Celestial level makes your spirits hit harder, so keep going!']] },
    ],
    reward: { jewels: 500, xp: 900, skillXp: { celestial: 900 }, items: { stardust: 2 } },
  },
  {
    id: 'q_requip', name: "Titania's Armory", qp: 3, start: 'erza', requires: 'q_cake',
    intro: [['erza', 'A Requip mage must forge her own armory. Steel from the forge, runes from the circle, lacrima to bind them.'], ['erza', 'Carve a Rune-Etched Plate, then forge Heaven\'s Wheel Armor at the Requip Altar. I will inspect it personally.']],
    stages: [
      { desc: 'Etch a Rune-Etched Plate at the Rune Circle (Rune Enchanting 20).', obj: { type: 'craft', id: 'rune_plate', n: 1 } },
      { desc: 'Forge Heaven\'s Wheel Armor at the Requip Altar (Requip Forging 10), then show Erza.', obj: { type: 'craft', id: 'rq_heaven', n: 1 }, turnIn: 'erza',
        done: [['erza', 'Hm. The balance is good. The edges are clean. ...This is fine work. You may call it yours.']] },
    ],
    reward: { jewels: 1500, xp: 2500, skillXp: { requip: 1500, enchanting: 800 }, items: { lacrima_shard: 1 } },
  },
  {
    id: 'q_elfman', name: 'A Real Man\'s Training', qp: 2, start: 'elfman',
    intro: [['elfman', 'You want to get stronger? Then train like a MAN!'], ['elfman', 'Wrestle the Wild Boars on the Kardia road. Then climb Mt. Hakobe and beat the Vulcans in the snow. No coats! ...Okay, coats.']],
    stages: [
      { desc: 'Defeat 5 Wild Boars (Kardia road or below Lake Scilliora).', obj: { type: 'kill', mob: 'boar', n: 5 } },
      { desc: 'Defeat 3 Vulcans on Mt. Hakobe (carriage from the Hakobe Trailhead), then report to Elfman.', obj: { type: 'kill', mob: 'hakobe_vulcan', n: 3 }, turnIn: 'elfman',
        done: [['elfman', 'You came back with snow in your hair and fire in your eyes. That is MAN!'], ['mirajane', 'Elfman, they are soaking wet. Get them a towel. ♪']] },
    ],
    reward: { jewels: 400, xp: 1200, items: { tonic_hp: 4 } },
  },
  {
    id: 'q_cana', name: 'The Card in the Woodsea', qp: 2, start: 'cana',
    intro: [['cana', 'So, funny story. I was doing a reading on the road to Worth Woodsea, and the wind took my best card.'], ['cana', 'The Tower card. Some forest Vulcan grabbed it. Bring it back and some Heartbark too: it makes the best card stock.']],
    stages: [
      { desc: 'Defeat Woodsea Forest Vulcans in Worth Woodsea (north of Magnolia) until one drops Cana\'s Lost Card.', obj: { type: 'item', id: 'fortune_card', n: 1, take: true } },
      { desc: 'Bring 2 Woodsea Heartbark (Mossback Guardians) to Cana.', obj: { type: 'item', id: 'ancient_bark', n: 2, take: true }, turnIn: 'cana',
        done: [['cana', 'My card! And Heartbark! Okay, free reading: you are going to be VERY famous. Or very broke. The card has a bite mark on it.']] },
    ],
    questDrops: { woodsea_ape: { stage: 0, item: 'fortune_card', chance: 0.6 } },
    reward: { jewels: 600, xp: 1800, items: { tea_mp: 3 } },
  },
  {
    id: 'q_juvia', name: 'Rain Over Era', qp: 2, start: 'juvia',
    intro: [['juvia', 'Juvia has written a letter for Gray-sama, but Juvia cannot hand it to him herself. Juvia will melt.'], ['juvia', 'Please ask Gray-sama if he... no. Please ask Gray-sama what he thinks of the rain. And then, Juvia heard the Council wants a report on her old guild, Phantom Lord.']],
    stages: [
      { desc: 'Ask Gray what he thinks about the rain.', obj: { type: 'talk', npc: 'gray' },
        done: [['gray', 'The rain? It\'s fine. Juvia\'s rain was cold, but... it stopped. That\'s what counts. Why are you asking?']] },
      { desc: 'Take Juvia\'s report on Phantom Lord to Captain Lahar at the Magic Council in Era (train to Era Station).', obj: { type: 'talk', npc: 'lahar' },
        done: [['lahar', 'A statement from Juvia Lockser, formerly of Phantom Lord. The Council will note her cooperation.'], ['lahar', 'Tell her the sky over Era has been clear all week.']] },
      { desc: 'Return to Juvia with the news.', obj: { type: 'talk', npc: 'juvia' },
        done: [['juvia', 'Gray-sama said it STOPPED? And the Council was kind? ...Juvia\'s sky is clear. Thank you, friend!']] },
    ],
    reward: { jewels: 700, xp: 2000, items: { stew: 3 } },
  },
];
