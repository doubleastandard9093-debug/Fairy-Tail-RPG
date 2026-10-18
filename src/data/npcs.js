// Town NPCs. role decides what tapping them opens. `talk` lines are shown when they
// have no quest business with you (picked at random). Positions match world/town.js.
export const NPCS = {
  borrowick: { name: 'Guildmaster Borrowick Thundermug', role: 'quest', pos: [5, -29], look: { hair: 'beard', hairColor: '#e8e8e8', outfit: 'brawler', outfitColor: '#7a2a1a', skin: '#e0b090', scale: 0.85 },
    talk: ['Welcome to Emberwake! We are the most fireproof guild in Lanternhaven. Mostly.', 'The property damage bill this month is... no. I will not read it aloud.', 'A true guild wizard never runs from a fight! Unless it is a tax audit.'] },
  pell: { name: 'Pell Quillfeather (Requests)', role: 'board', pos: [-6, -26.5], look: { hair: 'long', hairColor: '#f0c0e0', outfit: 'mage', outfitColor: '#4a6ab0', skin: '#f6d8c0' },
    talk: ['The request board has jobs from E rank to S rank. Please do not take S rank jobs as a joke again.', 'Finished a job? Bring it to me and I will stamp it. I love stamping.'] },
  coinsworth: { name: 'Penwhistle Coinsworth (Bank)', role: 'bank', pos: [-15.6, -2], look: { hair: 'short', hairColor: '#404040', outfit: 'mage', outfitColor: '#2a4a3a', skin: '#e8c8a8' },
    talk: ['Your jewels are safe with us. Our vault is guarded by a very judgmental owl.', 'Interest rates? We prefer the term "vibes".'] },
  zazzle: { name: 'Zazzle the Marvelous (Market)', role: 'shop', pos: [15.6, -2], look: { hair: 'spiky', hairColor: '#9a50ff', outfit: 'adventurer', outfitColor: '#d0a020', skin: '#c89070' },
    talk: ['Prices on the market board change daily! Like my moods. And my hats.', 'Everything is genuine! Except the things that are not.'] },
  greta: { name: 'Greta Sootwhistle (Forge)', role: 'forge', pos: [-15.5, 22], look: { hair: 'ponytail', hairColor: '#ff8030', outfit: 'brawler', outfitColor: '#5a4030', skin: '#d8a070' },
    talk: ['Forge refines ore into bars. Workbench handles wood, cloth and leather. Do not lick the anvil.', 'I can smell a Flame Slayer from here. Keep your snacks away from my forge.'] },
  marzipan: { name: 'Marzipan Doughty (Inn)', role: 'inn', pos: [16.2, 20], look: { hair: 'bob', hairColor: '#ffe0a0', outfit: 'adventurer', outfitColor: '#c04a5a', skin: '#f4d4b8' },
    talk: ['A bed, a bath and a stew. Ten jewels. The stew is... also ten jewels.', 'If you hear singing at night, that is just the Ice-Make wizard in room 3. He is not wearing a shirt.'] },
  puddingham: { name: 'Mayor Puddingham', role: 'talk', pos: [5, 7], look: { hair: 'short', hairColor: '#a07040', outfit: 'mage', outfitColor: '#6a2a8a', skin: '#f0c8a0', scale: 1.05 },
    talk: ['Lanternhaven! Home of lanterns. And haven. Mostly lanterns.', 'Have you seen Sir Reginald Fluffbottom? He is my cat and also my chief advisor.'] },
};
// Points in the world referenced by jobs (escorts) and the minimap.
export const POIS = {
  gate: { name: 'Town Gate', pos: [0, 44] },
  shrine: { name: 'Whispering Shrine', pos: [36, 108] },
  arena: { name: "Tyrant's Hollow", pos: [0, 182] },
};
