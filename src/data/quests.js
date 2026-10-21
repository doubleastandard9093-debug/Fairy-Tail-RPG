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
];
