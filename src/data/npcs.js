// Magnolia NPCs (Fairy Tail fan pitch). role decides what tapping them opens. `talk` lines are
// shown when they have no quest business with you (picked at random). Positions match world/world.js.
// model: 'cat' builds a small cat (Happy) instead of a humanoid.
export const NPCS = {
  mirajane: { name: 'Mirajane (Bar & Requests)', role: 'board', pos: [6.5, -28.6], face: [6.5, -20], look: { preset: 'mirajane', hair: 'long', hairColor: '#f4f0f6', outfit: 'mage', outfitColor: '#9a1e40', skin: '#f8dcc8', eyeColor: '#3a5ab0' },
    talk: ['Welcome back! Can I get you a drink? Or a job? Or both? The guild runs on both.', 'Natsu and Gray are fighting again. Do not worry, I already put the bill on their tabs. ♪', 'Finished a request? Bring it to me and I will stamp it. Stamping is my favourite part!', 'If Erza asks who ate the last strawberry cake, you did not see anything. Okay? ♪'] },
  makarov: { name: 'Master Makarov', role: 'quest', pos: [2.7, -27.2], y: 1.56, face: [2.7, -20], look: { preset: 'makarov', hair: 'beard', hairColor: '#f2f2f2', outfit: 'mage', outfitColor: '#f4f0e4', skin: '#e8c0a0', scale: 0.55, build: { head: 1.18 } },
    talk: ['The Magic Council sent another complaint letter. I am using it as a napkin.', 'Brats! Do not let anyone tell you what your magic can or cannot do!', 'A guild is a family. A loud, flammable, slightly underdressed family.', 'I am not short. I am concentrated.'] },
  natsu: { name: 'Natsu', role: 'talk', pos: [-4, -19.5], y: 1.62, face: [0, -15], look: { preset: 'natsu', hair: 'spiky', hairColor: '#ff8aa6', outfit: 'brawler', outfitColor: '#2a2a2a', skin: '#f0c8a0', eyeColor: '#3a2a1a', scarf: '#f4f4ec', build: { w: 1.05 } },
    talk: ['I\'m all fired up! Wanna fight? No? Wanna fight LATER?', 'Fire tastes great. Ice tastes like Gray. Ugh.', 'Trains are the worst. Don\'t even say the word. Ugh, now I feel sick.', 'Happy! Get the fish ready, we\'re taking the next job!'] },
  happy: { name: 'Happy', role: 'talk', model: 'cat', fur: '#5ab4f0', happy: true, pos: [-1.6, -22.4], y: 1.3, face: [0, -16],
    talk: ['Aye sir!', 'Do you have a fish? A big fish? A medium fish? I\'ll take any fish.', 'Lucy is weeeird. She talks to her keys. ...Wait, she\'s behind me, isn\'t she.', 'You liiiike the request board. I can tell.'] },
  lucy: { name: 'Lucy', role: 'talk', pos: [1.8, -23.2], face: [-1, -17], look: { preset: 'lucy', hair: 'sideponytail', hairColor: '#ffe07a', outfit: 'adventurer', outfitColor: '#f4f4fa', skin: '#fbe0cc', eyeColor: '#5a3a1a', build: { w: 0.92, arm: 0.9 } },
    talk: ['Rent is due in three days and Natsu burned the last reward. AGAIN.', 'Celestial spirits are friends, not tools! ...Taurus, stop staring.', 'I\'m writing a novel about the guild. Nobody will believe it\'s non-fiction.', 'Plue needs his walk, if you have time. He\'s very good. He just shivers a lot.'] },
  gray: { name: 'Gray', role: 'talk', pos: [-6.8, -23.6], face: [-3, -19], look: { preset: 'gray', hair: 'spiky', hairColor: '#1e2230', outfit: 'brawler', outfitColor: '#2a2c3a', skin: '#f0d0b0', eyeColor: '#1e2230', mark: { place: 'chest', color: '#3a6ae8' }, build: { w: 1.1 } },
    talk: ['Hey, flame-brain! Oh. You\'re not Natsu. Never mind.', 'Gray, your clothes. ...Wait, where did my shirt go?!', 'Ice-Make is all about imagination. Picture it, then make it. Simple.', 'Juvia keeps leaving lunch on my seat. It\'s... actually really good.'] },
  erza: { name: 'Erza', role: 'talk', pos: [6, -23.2], face: [2, -17], look: { preset: 'erza', hair: 'long', hairColor: '#d0202a', outfit: 'adventurer', outfitColor: '#c8ccd8', skin: '#f6d8c0', eyeColor: '#4a2a1a', build: { w: 0.96 } },
    talk: ['Are you two fighting? ...No? Good. Carry on being friends.', 'Discipline, a sharp blade and strawberry cake. That is all a warrior needs.', 'Requip is about choosing the right armor for the moment. And the right cake.', 'If you see anyone near my cake, report it immediately.'] },
  plue: { name: 'Plue', role: 'talk', model: 'plue', pos: [3.4, -22.2], face: [0, -16],
    talk: ['Puun puun! (He shivers. He is always shivering. Nobody knows why.)', 'Puuun! (He offers you half a lollipop.)', 'Pun? (Plue points at Natsu, then at the fire, then shivers harder.)'] },
  levy: { name: 'Levy (Archive & Storage)', role: 'bank', pos: [-15.6, -2], face: [0, -2], look: { preset: 'levy', hair: 'bob', hairColor: '#5ab0f0', outfit: 'mage', outfitColor: '#f0a030', skin: '#f8dcc8', eyeColor: '#7a4a1a', scale: 0.86, build: { w: 0.9, arm: 0.88 } },
    talk: ['I filed your items by genre. Your sword is a romance, apparently.', 'Solid Script lets you write words that become real. Please do not write "BOOM" indoors.', 'Gajeel says reading is boring. He has read every one of my book recommendations. Twice.'] },
  shopkeep: { name: 'Magic Shop Owner (Market)', role: 'shop', pos: [15.6, -2], face: [0, -2], look: { hair: 'short', hairColor: '#7a5030', outfit: 'adventurer', outfitColor: '#d0a020', skin: '#c89070' },
    talk: ['Lacrima, keys, gear! Everything a wizard needs. Fairy Tail members get the "please stop breaking my windows" discount.', 'Prices on the market board change daily. Like the weather. Or Natsu\'s mood.'] },
  gajeel: { name: 'Gajeel (Forge)', role: 'forge', pos: [-15.5, 22], face: [0, 22], look: { preset: 'gajeel', hair: 'long', hairColor: '#141418', outfit: 'brawler', outfitColor: '#3a3440', skin: '#d8b090', eyeColor: '#b01a1a', scale: 1.08, build: { w: 1.15, arm: 1.12 } },
    talk: ['Gihi. Need something forged? Hand it over. If it\'s iron, I might eat it first.', 'Shoo-bee-doo-bah. ...You didn\'t hear that.', 'Forge refines ore into bars. Workbench handles wood, cloth and leather. Don\'t touch my snacks.'] },
  wendy: { name: 'Wendy (Inn & Healing)', role: 'inn', pos: [16.2, 20], face: [0, 20], look: { preset: 'wendy', hair: 'twintails', hairColor: '#3a68d0', outfit: 'mage', outfitColor: '#f0f0ff', skin: '#fbe2d0', eyeColor: '#5a3a2a', scale: 0.8, build: { head: 1.06 } },
    talk: ['I can heal you with Sky Dragon magic! Please hold still. And try not to get hurt so much?', 'Carla says I worry too much. I think everyone else worries too little!', 'Rest here any time. The beds are soft and Natsu is banned from the kitchen.'] },
};
// Points in the world referenced by jobs (escorts) and the minimap.
export const POIS = {
  gate: { name: 'Magnolia South Gate', pos: [0, 44] },
  shrine: { name: 'Kardia Cathedral Steps', pos: [36, 108] },
  arena: { name: 'Clover Canyon', pos: [0, 182] },
};
