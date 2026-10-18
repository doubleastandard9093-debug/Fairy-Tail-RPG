// Story quests. Each stage has an objective; when its progress is met, talk to `turnIn`
// (or it advances automatically when turnIn is omitted).
// obj types: talk {npc} | kill {mob,n} | item {id,n,take} | craft {id,n} | job {n}
// questDrops: while the quest is on that stage, the mob may drop that item.
export const QUESTS = [
  {
    id: 'q_welcome', name: 'Welcome to Emberwake (Mostly Fireproof)', qp: 1, start: 'borrowick',
    intro: [
      ['borrowick', 'A NEW RECRUIT! Excellent! Our last one joined the Royal Choir. He said it was "less explodey".'],
      ['borrowick', 'Here at Emberwake we have three rules. One: protect your friends. Two: pay for what you break. Three: see rule two.'],
      ['borrowick', 'Go see Pell at the request board. She will give you your first job.'],
    ],
    stages: [
      { desc: 'Talk to Pell at the request board.', obj: { type: 'talk', npc: 'pell' },
        done: [['pell', 'Oh! A fresh face! Let me stamp your guild card. *stamp* *stamp* *stamp*... sorry, I got excited.'], ['pell', 'Pick any E-rank job from the board, finish it, then report back to me and then the Guildmaster.']] },
      { desc: 'Complete any request from the board.', obj: { type: 'job', n: 1 }, turnIn: 'borrowick',
        done: [['borrowick', 'You finished a job AND nothing is on fire? Recruit, I am getting emotional.'], ['borrowick', 'Take these jewels. Do not spend them all on stew. ...Okay, spend some on stew.']] },
    ],
    reward: { jewels: 150, xp: 250, items: { tonic_hp: 3 } },
  },
  {
    id: 'q_pudding', name: 'The Pudding Incident', qp: 2, start: 'marzipan',
    intro: [
      ['marzipan', 'Disaster! Catastrophe! Somebody stole my prize-winning pudding from the window sill!'],
      ['marzipan', 'There were tiny mushroom footprints. And a trail of spores. And a ransom note that just says "PUFF".'],
      ['marzipan', 'Teach those Puffcaps a lesson and bring back my pudding. Please. The judges arrive tomorrow.'],
    ],
    stages: [
      { desc: 'Defeat 4 Puffcaps in the field.', obj: { type: 'kill', mob: 'puffcap', n: 4 } },
      { desc: 'Recover the Suspicious Pudding (a Puffcap has it).', obj: { type: 'item', id: 'pudding', n: 1, take: true }, turnIn: 'marzipan',
        done: [['marzipan', 'My pudding! It has... a bite taken out. And it is slightly fuzzy. And it is giving me a dirty look.'], ['marzipan', 'Still winning first prize. Here, have some stew. On the house. The house insists.']] },
    ],
    questDrops: { puffcap: { stage: 1, item: 'pudding', chance: 0.5 } },
    reward: { jewels: 120, xp: 300, items: { stew: 3 } },
  },
  {
    id: 'q_tyrant', name: "Grumblejaw's Very Bad Day", qp: 3, start: 'greta',
    intro: [
      ['greta', 'You hear that rumbling? That is not my stomach. Well, it is ALSO my stomach. But mostly it is Grumblejaw.'],
      ['greta', 'A rock tyrant that wakes up every few years and complains about everything. Loudly. With boulders.'],
      ['greta', 'Before you face it, prove you can work a forge. Bring me copper and smelt some bars.'],
    ],
    stages: [
      { desc: 'Mine 4 Copper Ore.', obj: { type: 'item', id: 'ore_t1', n: 4 } },
      { desc: 'Smelt 2 Copper Bars at the forge.', obj: { type: 'craft', id: 'bar_t1', n: 2 }, turnIn: 'greta',
        done: [['greta', 'Lovely bars! Only slightly lumpy. Like my uncle.'], ['greta', 'Now go to Tyrant\'s Hollow at the far end of the field and teach Grumblejaw some manners. Take the S-rank job so Brakka and Pip back you up.']] },
      { desc: 'Defeat Grumblejaw the Rock Tyrant.', obj: { type: 'kill', mob: 'grumblejaw', n: 1 }, turnIn: 'greta',
        done: [['greta', 'You actually did it! The whole town heard it fall over. Mayor Puddingham thought it was thunder and hid in a barrel.'], ['greta', 'Take this blade. I forged it from a starsilver nugget I found in my soup.']] },
    ],
    reward: { jewels: 400, xp: 1200, items: { sword1h_t3: 1 } },
  },
];
